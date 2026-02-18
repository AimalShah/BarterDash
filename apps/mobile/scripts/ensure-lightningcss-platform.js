#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const appRoot = path.resolve(__dirname, '..');

function detectLinuxLibcSuffix() {
  // Match lightningcss' own runtime loader behavior.
  const report = process.report && typeof process.report.getReport === 'function'
    ? process.report.getReport()
    : null;
  const glibcVersion = report && report.header ? report.header.glibcVersionRuntime : null;

  if (!glibcVersion) {
    return 'musl';
  }

  if (process.arch === 'arm') {
    return 'gnueabihf';
  }

  return 'gnu';
}

function getPlatformTriple() {
  if (process.platform === 'linux') {
    return `${process.platform}-${process.arch}-${detectLinuxLibcSuffix()}`;
  }

  if (process.platform === 'win32') {
    return `${process.platform}-${process.arch}-msvc`;
  }

  return `${process.platform}-${process.arch}`;
}

function tryLoadLightningCss(lightningCssDir) {
  const entryFile = path.join(lightningCssDir, 'node', 'index.js');
  if (!fs.existsSync(entryFile)) {
    return {
      ok: false,
      error: new Error(`Missing lightningcss entry file: ${entryFile}`),
    };
  }

  try {
    const resolved = require.resolve(entryFile);
    delete require.cache[resolved];
  } catch {
    // Ignore cache misses.
  }

  try {
    require(entryFile);
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}

function isMissingPlatformModule(error, moduleName, triple) {
  if (!error) {
    return false;
  }

  if (error.code !== 'MODULE_NOT_FOUND') {
    return false;
  }

  const message = String(error.message);
  return (
    message.includes(moduleName) ||
    message.includes(`lightningcss.${triple}.node`) ||
    message.includes(`../lightningcss.${triple}.node`)
  );
}

function getModuleSearchDirs(lightningCssDir, moduleName) {
  const dirs = [
    path.join(lightningCssDir, 'node_modules', moduleName),
    path.join(path.dirname(lightningCssDir), moduleName),
  ];
  let currentDir = appRoot;

  for (let i = 0; i < 5; i += 1) {
    dirs.push(path.join(currentDir, 'node_modules', moduleName));
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }

  return Array.from(new Set(dirs));
}

function embedPlatformBinary(lightningCssDir, moduleName, triple) {
  const binaryName = `lightningcss.${triple}.node`;
  const embeddedBinaryPath = path.join(lightningCssDir, binaryName);

  if (fs.existsSync(embeddedBinaryPath)) {
    return { ok: true, sourcePath: null };
  }

  const candidateDirs = getModuleSearchDirs(lightningCssDir, moduleName);
  for (const candidateDir of candidateDirs) {
    const sourcePath = path.join(candidateDir, binaryName);
    if (!fs.existsSync(sourcePath)) {
      continue;
    }

    fs.copyFileSync(sourcePath, embeddedBinaryPath);
    if (fs.existsSync(embeddedBinaryPath)) {
      return { ok: true, sourcePath };
    }
  }

  return { ok: false, sourcePath: null };
}

function packAndEmbedBinary(lightningCssDir, moduleName, version, triple) {
  const binaryName = `lightningcss.${triple}.node`;
  const embeddedBinaryPath = path.join(lightningCssDir, binaryName);
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lightningcss-pack-'));
  let tarballPath = null;

  try {
    const packOutput = execFileSync('npm', ['pack', `${moduleName}@${version}`], {
      cwd: appRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
      env: process.env,
    });

    const tarballName = packOutput
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .find((line) => line.endsWith('.tgz'));

    if (!tarballName) {
      return { ok: false, sourcePath: null };
    }

    tarballPath = path.resolve(appRoot, tarballName);
    const extractDir = path.join(tempDir, 'extract');
    fs.mkdirSync(extractDir, { recursive: true });

    execFileSync('tar', ['-xzf', tarballPath, '-C', extractDir], {
      cwd: appRoot,
      stdio: ['ignore', 'ignore', 'pipe'],
      env: process.env,
    });

    const packedBinaryPath = path.join(extractDir, 'package', binaryName);
    if (!fs.existsSync(packedBinaryPath)) {
      return { ok: false, sourcePath: null };
    }

    fs.copyFileSync(packedBinaryPath, embeddedBinaryPath);
    if (fs.existsSync(embeddedBinaryPath)) {
      return { ok: true, sourcePath: packedBinaryPath };
    }

    return { ok: false, sourcePath: null };
  } finally {
    if (tarballPath && fs.existsSync(tarballPath)) {
      fs.rmSync(tarballPath, { force: true });
    }
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function ensurePlatformBinary(lightningCssDir) {
  const manifestPath = path.join(lightningCssDir, 'package.json');
  if (!fs.existsSync(manifestPath)) {
    return;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const triple = getPlatformTriple();
  const moduleName = `lightningcss-${triple}`;

  const loadBeforeInstall = tryLoadLightningCss(lightningCssDir);
  if (loadBeforeInstall.ok) {
    console.log(`[ensure-lightningcss] Binary present for ${path.relative(appRoot, lightningCssDir)} (${triple})`);
    return;
  }

  if (!isMissingPlatformModule(loadBeforeInstall.error, moduleName, triple)) {
    throw new Error(
      `[ensure-lightningcss] lightningcss failed before install in ${path.relative(appRoot, lightningCssDir)}: ${loadBeforeInstall.error.message}`
    );
  }

  const embeddedBeforeInstall = embedPlatformBinary(lightningCssDir, moduleName, triple);
  if (embeddedBeforeInstall.ok) {
    if (embeddedBeforeInstall.sourcePath) {
      console.log(
        `[ensure-lightningcss] Embedded ${moduleName} binary from ${path.relative(appRoot, embeddedBeforeInstall.sourcePath)}`
      );
    }

    const loadAfterEmbedding = tryLoadLightningCss(lightningCssDir);
    if (loadAfterEmbedding.ok) {
      console.log(`[ensure-lightningcss] Runtime load fixed by embedding ${moduleName}`);
      return;
    }
  }

  console.log(`[ensure-lightningcss] Missing ${moduleName} for lightningcss@${manifest.version}. Installing fallback package...`);
  execFileSync(
    'npm',
    [
      'install',
      '--no-save',
      '--package-lock=false',
      '--workspaces=false',
      '--legacy-peer-deps',
      '--include=optional',
      '--prefix',
      lightningCssDir,
      `${moduleName}@${manifest.version}`,
    ],
    {
      cwd: appRoot,
      stdio: 'inherit',
      env: process.env,
    }
  );

  const embeddedAfterInstall = embedPlatformBinary(lightningCssDir, moduleName, triple);
  if (embeddedAfterInstall.sourcePath) {
    console.log(
      `[ensure-lightningcss] Embedded ${moduleName} binary from ${path.relative(appRoot, embeddedAfterInstall.sourcePath)}`
    );
  }

  const loadAfterInstall = tryLoadLightningCss(lightningCssDir);
  if (loadAfterInstall.ok) {
    console.log(`[ensure-lightningcss] Resolved ${moduleName}@${manifest.version} and verified runtime load`);
    return;
  }

  console.log(`[ensure-lightningcss] Install completed but runtime still failing. Attempting direct tarball embed for ${moduleName}@${manifest.version}...`);
  const packedBinary = packAndEmbedBinary(lightningCssDir, moduleName, manifest.version, triple);
  if (packedBinary.sourcePath) {
    console.log(`[ensure-lightningcss] Embedded ${moduleName} binary from packed tarball`);
  }

  const loadAfterPack = tryLoadLightningCss(lightningCssDir);
  if (loadAfterPack.ok) {
    console.log(`[ensure-lightningcss] Runtime load fixed via packed tarball embed`);
    return;
  }

  throw new Error(
    `[ensure-lightningcss] Unable to load lightningcss after install and tarball embed for ${moduleName}@${manifest.version}: ${loadAfterPack.error.message}`
  );
}

const nestedLightningCssDir = path.join(
  appRoot,
  'node_modules',
  'react-native-css-interop',
  'node_modules',
  'lightningcss'
);
const topLevelLightningCssDir = path.join(appRoot, 'node_modules', 'lightningcss');

const lightningCssDirs = [];
if (fs.existsSync(path.join(nestedLightningCssDir, 'package.json'))) {
  // NativeWind currently resolves through this copy first.
  lightningCssDirs.push(nestedLightningCssDir);
} else if (fs.existsSync(path.join(topLevelLightningCssDir, 'package.json'))) {
  lightningCssDirs.push(topLevelLightningCssDir);
}

if (lightningCssDirs.length === 0) {
  console.log('[ensure-lightningcss] No lightningcss packages found. Skipping.');
  process.exit(0);
}

for (const dir of lightningCssDirs) {
  ensurePlatformBinary(dir);
}
