# Storybook for `apps/mobile`

This project uses on-device Storybook for React Native UI preview.

## What it does
- Runs Storybook in a separate dev mode.
- Bypasses app auth/navigation shell when Storybook mode is enabled.
- Loads initial stories for stitch design components from `stories/design`.

## Setup
1. Install dependencies in the mobile app workspace:

```bash
cd apps/mobile
npm install
```

2. Make sure Storybook mode is disabled by default in `.env`:

```env
EXPO_PUBLIC_STORYBOOK_ENABLED=false
```

## Commands
Run these inside `apps/mobile`.

- Normal app:

```bash
npm run start
```

- Storybook mode:

```bash
npm run storybook
```

- Storybook mode (open iOS):

```bash
npm run storybook:ios
```

- Storybook mode (open Android):

```bash
npm run storybook:android
```

## Story locations
- Current seeded stories: `stories/design/*.stories.tsx`
- Add new stories under:
  - `stories/design/` for stitch/design-system components
  - `stories/` subfolders for other feature areas as coverage grows

## How Storybook mode works
- The app checks `EXPO_PUBLIC_STORYBOOK_ENABLED` in `app/_layout.tsx`.
- When `true`, it renders `.storybook/index.ts` instead of the router/guards.
- Metro Storybook integration is enabled only when that env flag is `true`.

## Troubleshooting
- Storybook not updating or stale modules:

```bash
npm run storybook
```

  This command already starts Expo with `-c` (clears Metro cache).

- “No stories found”:
  - Confirm stories match `*.stories.tsx`.
  - Confirm they are under `stories/` and included in `.storybook/main.ts`.
  - Restart Storybook with cache clear.

- Regular app is showing Storybook unexpectedly:
  - Check `.env` and ensure `EXPO_PUBLIC_STORYBOOK_ENABLED=false`.
  - Use `npm run start` (not Storybook scripts).
