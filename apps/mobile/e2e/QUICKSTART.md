# 🚀 Quick Start: Run E2E Tests on Your Phone

This guide will help you run the E2E tests on your physical Android device (much easier on your PC than using an emulator!).

## Prerequisites

- Android phone with USB cable
- USB Debugging enabled
- ADB installed (comes with Android Studio)

## Step-by-Step

### 1. Enable Developer Mode on Your Phone

1. Go to **Settings** > **About Phone**
2. Find **Build Number** and tap it **7 times**
3. You'll see "You are now a developer!"
4. Go back to **Settings** > **System** > **Developer Options**
5. Turn on **USB Debugging**

### 2. Connect Your Phone

1. Plug your phone into your PC with USB cable
2. On your phone, tap **"Allow"** when prompted
3. Open terminal and verify:

```bash
adb devices
```

You should see something like:
```
List of devices attached
ABC123XYZ     device
```

### 3. Setup Test Account

Create a test account in the app (you'll need this for the tests):

1. Open the BarterDash app on your phone
2. Register with: `test@example.com` / `TestPassword123`
3. Complete any onboarding

### 4. Run the Tests

```bash
# Go to mobile directory
cd apps/mobile

# Install dependencies
npm install

# Build the app for your device
npm run e2e:build:device

# Run the tests!
npm run e2e:test:device
```

That's it! The tests will run on your phone automatically. 📱

## What to Expect

- Tests will install the app on your phone
- You'll see the app opening and closing automatically
- Tests check login, browsing, bidding, etc.
- Takes about 5-10 minutes to run all 64 tests

## Troubleshooting

### Phone not detected?
```bash
# Try different USB cable/port
# Install ADB drivers (Windows):
# https://developer.android.com/studio/run/oem-usb

# Check if phone is connected:
adb devices
```

### App won't install?
```bash
# Uninstall existing app first:
adb uninstall com.anomalyco.barterdash

# Then rebuild:
npm run e2e:build:device
```

### Tests failing?
1. Make sure phone screen stays ON
2. Don't touch the phone during tests
3. Grant all permissions when asked
4. Check that your test account works manually

### Too slow?
- Close other apps on your phone
- Use WiFi instead of mobile data
- Disable phone animations:
```bash
adb shell settings put global window_animation_scale 0
adb shell settings put global transition_animation_scale 0
adb shell settings put global animator_duration_scale 0
```

## WiFi Debugging (No Cable!)

After initial USB connection:

```bash
# Enable WiFi debugging
adb tcpip 5555

# Connect to your phone's IP
adb connect 192.168.1.5:5555

# Now disconnect USB and run tests wirelessly!
npm run e2e:test:device
```

Find your phone's IP in **Settings** > **WiFi** > Your Network

## Common Commands

```bash
# Just build (no tests)
npm run e2e:build:device

# Run specific test file
npx detox test -c android.device.debug e2e/auth.e2e.ts

# Run with verbose output
npx detox test -c android.device.debug --verbose

# Debug mode (app stays open)
npx detox test -c android.device.debug --debug

# Take screenshot
adb shell screencap -p /sdcard/screen.png
adb pull /sdcard/screen.png
```

## Test Files

The tests cover:

- ✅ **auth.e2e.ts** - Login, register, forgot password (7 tests)
- ✅ **home.e2e.ts** - Browse products, search, streams (10 tests)
- ✅ **bidding.e2e.ts** - Place bids, cart, checkout (12 tests)
- ✅ **seller.e2e.ts** - Become seller, create listings (15 tests)
- ✅ **profile.e2e.ts** - Profile, settings, orders (10 tests)
- ✅ **navigation.e2e.ts** - Navigation, deep links (10 tests)

**Total: 64 tests!**

## Need Help?

Check the full documentation: `apps/mobile/e2e/README.md`

Or run with debug mode to see what's happening:
```bash
npx detox test -c android.device.debug --debug --verbose
```
