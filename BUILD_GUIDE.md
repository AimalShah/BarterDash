# BarterDash Mobile App - Build Guide

This guide provides step-by-step instructions to set up the development environment and build the BarterDash mobile app for iOS and Android production using EAS (Expo Application Services).

---

## Prerequisites

Before starting, ensure you have:
- A MacBook with macOS 12.0 or later
- An Apple Developer account (for iOS builds)
- A Google Play Developer account (for Android builds)
- An Expo account (expo.dev)
- A terminal application

---

## Part 1: Install Node.js on MacBook

### Option A: Using Homebrew (Recommended)

1. **Install Homebrew** (if not already installed):
   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Install Node.js via Homebrew**:
   ```bash
   brew install node
   ```

3. **Verify installation**:
   ```bash
   node --version
   npm --version
   ```

### Option B: Using nvm (Node Version Manager)

1. **Install nvm**:
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
   ```

2. **Add to your shell profile** (add to `~/.zshrc` or `~/.bashrc`):
   ```bash
   export NVM_DIR="$HOME/.nvm"
   [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
   ```

3. **Restart terminal**, then install Node.js:
   ```bash
   nvm install 20
   nvm use 20
   ```

4. **Verify installation**:
   ```bash
   node --version
   npm --version
   ```

### Option C: Using Official Installer

1. Download the macOS installer from [nodejs.org](https://nodejs.org/)
2. Run the installer and follow the prompts
3. Verify installation in Terminal

**Recommended Node.js version: 18.x or 20.x LTS**

---

## Part 2: Download the Code

1. **Open Terminal** and navigate to your desired projects directory:
   ```bash
   cd ~/Projects
   ```

2. **Clone the repository**:
   ```bash
   git clone https://github.com/your-repo/BarterDash.git
   ```
   *(Replace with the actual repository URL)*

3. **Navigate into the project**:
   ```bash
   cd BarterDash
   ```

4. **Navigate to the mobile app directory**:
   ```bash
   cd apps/mobile
   ```

---

## Part 3: Install Dependencies

1. **Install npm dependencies**:
   ```bash
   npm install
   ```

2. **Verify installation completed successfully**:
   ```bash
   ls node_modules
   ```

---

## Part 4: Login to Expo/EAS

### Step 1: Create an Expo Account

1. Go to [expo.dev](https://expo.dev)
2. Click **Sign Up** and create an account using your email
3. Verify your email address

### Step 2: Login via Terminal

1. **Login to Expo**:
   ```bash
   cd apps/mobile
   npx expo login
   ```

2. **Enter your credentials**:
   - Enter your email
   - Enter your password

3. **Verify login**:
   ```bash
   npx expo whoami
   ```

   You should see your username displayed.

### Step 3: Configure EAS CLI (Optional but Recommended)

1. **Install EAS CLI globally**:
   ```bash
   npm install -g eas-cli
   ```

2. **Verify EAS CLI installation**:
   ```bash
   eas --version
   ```

---

## Part 5: Configure Apple Developer Account (iOS Only)

### Step 1: Create Apple Developer Account

1. Go to [developer.apple.com](https://developer.apple.com)
2. Enroll in the Apple Developer Program ($99/year)
3. Complete the enrollment process

### Step 2: Configure App in Apple Developer Portal

1. Log in to [developer.apple.com](https://developer.apple.com/account)
2. Go to **Certificates, Identifiers & Profiles**
3. Create an **App ID**:
   - Bundle ID: `com.barterdash.mobile`
   - App Services: Enable Push Notifications, Sign in with Apple
4. Create a **Provisioning Profile** for distribution

### Step 3: Connect Apple Account to Expo

1. **Run the following command**:
   ```bash
   npx expo apple:add
   ```

2. **Enter your Apple Developer credentials** when prompted

3. **Verify connection**:
   ```bash
   npx expo credentials:list
   ```

---

## Part 6: Configure Google Play Console (Android Only)

### Step 1: Create Google Play Developer Account

1. Go to [play.google.com/console](https://play.google.com/console)
2. Create a developer account ($25 one-time fee)
3. Complete the verification process

### Step 2: Create Google Service Account

1. Go to **Settings > Developer Account > API Access**
2. Create a new service account
3. Download the JSON key file
4. Grant the service account "Releaser" access to your app

### Step 3: Configure Android Credentials in Expo

1. **Run**:
   ```bash
   npx expo android:upload
   ```

2. Follow the prompts to upload your credentials

---

## Part 7: Build for iOS (Production)

### Option A: Using EAS Build (Recommended)

#### Step 1: Configure Build Profile

The project already has `eas.json` configured. The production build profile is set to auto-increment version.

#### Step 2: Run iOS Production Build

```bash
cd apps/mobile
eas build --platform ios --profile production
```

#### Step 3: Monitor Build Progress

- The build will start and show a URL to track progress
- Example: `https://expo.dev/accounts/[username]/builds/[build-id]`

#### Step 4: Download the Build

1. Once the build completes, you'll receive a link to download the `.ipa` file
2. Download the IPA file

#### Step 5: Submit to App Store

**Option 1: Using EAS Submit (Recommended)**

```bash
eas submit --platform ios
```

- This will upload your build to Apple TestFlight
- Follow the prompts to complete submission

**Option 2: Manual Upload via Transporter**

1. Download [Transporter](https://apps.apple.com/app/transporter/id1450874783) from the Mac App Store
2. Sign in with your Apple Developer account
3. Add your `.ipa` file
4. Click **Deliver** to upload to App Store Connect

#### Step 6: TestFlight Review

1. Go to [appstoreconnect.apple.com](https://appstoreconnect.apple.com)
2. Select your app
3. Go to **TestFlight** tab
4. Once approved, you can invite external testers
5. After internal testing, submit for App Store review

---

## Part 8: Build for Android (Production)

### Option A: Using EAS Build (Recommended)

#### Step 1: Configure Build Profile

The project already has `eas.json` configured with production profile.

#### Step 2: Run Android Production Build

```bash
cd apps/mobile
eas build --platform android --profile production
```

#### Step 3: Monitor Build Progress

- The build will show a URL to track progress
- Example: `https://expo.dev/accounts/[username]/builds/[build-id]`

#### Step 4: Download the Build

Once complete, you'll receive an `.apk` or `.aab` (Android App Bundle) file:
- **APK**: For direct installation on devices
- **AAB**: For Google Play Store submission (recommended)

#### Step 5: Submit to Google Play

**Option 1: Using EAS Submit (Recommended)**

```bash
eas submit --platform android
```

**Option 2: Manual Upload via Google Play Console**

1. Go to [play.google.com/console](https://play.google.com/console)
2. Select your app
3. Go to **Release > Production**
4. Create a new release
5. Upload your `.aab` file
6. Add release notes
7. Click **Review release**

#### Step 6: Google Play Review

- Google Play typically takes 1-7 days to review
- You'll receive an email when the app is published

---

## Part 9: Alternative - Development Build (For Testing)

### iOS Development Build

```bash
eas build --platform ios --profile development
```

### Android Development Build

```bash
eas build --platform android --profile development
```

This creates a build with `developmentClient: true` for testing with Expo Go or development builds.

---

## Part 10: Troubleshooting

### Common Issues

#### 1. "No Apple Team ID found"

Run:
```bash
npx expo apple:add
```

#### 2. "No Android credentials found"

Run:
```bash
npx expo android:upload
```

#### 3. Build fails due to dependency issues

```bash
rm -rf node_modules
rm package-lock.json
npm install
```

#### 4. CocoaPods issues on iOS

```bash
cd ios
pod deintegrate
pod install
cd ..
```

#### 5. Android Keystore issues

If you lose your Android keystore, you cannot update existing builds. Create a new upload key:
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore upload keystore.jks -alias upload-key -keyalg RSA -keysize 2048 -validity 10000
```

### Useful Commands

| Command | Description |
|---------|-------------|
| `npx expo login` | Login to Expo |
| `eas build --platform ios` | Build for iOS |
| `eas build --platform android` | Build for Android |
| `eas submit --platform ios` | Submit to App Store |
| `eas submit --platform android` | Submit to Google Play |
| `npx expo doctor` | Check for issues |
| `npx expo update` | Update Expo SDK |

---

## Environment Variables

Create a `.env` file in `apps/mobile/` with:

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key

# Google
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id

# Stream
EXPO_PUBLIC_STREAM_API_KEY=your_stream_api_key
```

---

## Additional Resources

- [Expo Documentation](https://docs.expo.dev)
- [EAS Build Documentation](https://docs.expo.dev/eas-build)
- [EAS Submit Documentation](https://docs.expo.dev/eas-submit)
- [Apple Developer Portal](https://developer.apple.com)
- [Google Play Console](https://play.google.com/console)

---

## Quick Reference Commands

```bash
# Navigate to mobile directory
cd BarterDash/apps/mobile

# Install dependencies
npm install

# Login to Expo
npx expo login

# Build for iOS production
eas build --platform ios --profile production

# Build for Android production
eas build --platform android --profile production

# Submit to App Stores
eas submit --platform ios
eas submit --platform android

# Check build status
eas build:list
```

---

*Last updated: March 2026*