# BarterDash E2E Tests

This directory contains end-to-end tests for the BarterDash mobile app using [Detox](https://wix.github.io/Detox/).

## Test Structure

```
e2e/
├── init.js                 # Detox initialization
├── jest.config.js          # Jest configuration
├── auth.e2e.ts            # Authentication tests
├── home.e2e.ts            # Home & product browsing tests
├── bidding.e2e.ts         # Bidding & cart tests
├── seller.e2e.ts          # Seller registration & dashboard tests
├── profile.e2e.ts         # Profile & settings tests
├── navigation.e2e.ts      # Navigation & core flows tests
└── streaming.e2e.ts       # Live streaming tests
```

## Prerequisites

### Option 1: Run on Physical Android Device (Recommended for low-end PCs)

**Advantages:**
- No emulator needed (saves RAM/CPU)
- Faster test execution
- Tests run on real device
- Easier on your PC

**Setup:**

1. **Enable Developer Options on your phone:**
   - Go to Settings > About Phone
   - Tap "Build Number" 7 times
   - Go back to Settings > System > Developer Options
   - Enable "USB Debugging"

2. **Connect your phone via USB:**
   ```bash
   # Verify device is connected
   adb devices
   
   # You should see something like:
   # List of devices attached
   # ABC123XYZ     device
   ```

3. **Install the app on your device:**
   ```bash
   cd apps/mobile
   
   # Build the app
   npx detox build -c android.device.debug
   
   # Or manually install:
   cd android && ./gradlew assembleDebug
   adb install app/build/outputs/apk/debug/app-debug.apk
   ```

4. **Run tests:**
   ```bash
   npx detox test -c android.device.debug
   ```

### Option 2: Run on iOS Simulator (macOS only)

1. **iOS Setup:**
   ```bash
   # Install dependencies
   cd ios && pod install
   
   # Build for simulator
   npm run e2e:build:ios
   ```

2. **Run tests:**
   ```bash
   npm run e2e:test:ios
   ```

### Option 3: Run on Android Emulator

1. **Android Setup:**
   ```bash
   # Build for emulator
   npm run e2e:build:android
   ```

2. **Run tests:**
   ```bash
   npm run e2e:test:android
   ```

## Environment Variables

Create a `.env.e2e` file in the mobile directory:

```bash
cd apps/mobile

cat > .env.e2e << 'EOF'
E2E_TEST_EMAIL=test@example.com
E2E_TEST_PASSWORD=your-test-password
E2E_TEST_PRODUCT_ID=test-product-123
E2E_TEST_STREAM_ID=test-stream-123
E2E_TEST_SELLER_ID=test-seller-123
E2E_SELLER_STREAM_ID=seller-stream-123
E2E_VIEWER_STREAM_ID=viewer-stream-123
EOF
```

**Note:** You'll need to create a test account in your app first!

## Running Tests

### Quick Start (Physical Device)

```bash
cd apps/mobile

# 1. Connect your Android phone via USB
# 2. Enable USB debugging on your phone
# 3. Verify connection:
adb devices

# 4. Build and install
npx detox build -c android.device.debug

# 5. Run tests
npx detox test -c android.device.debug
```

### All Commands

```bash
# Build for physical device
npx detox build -c android.device.debug

# Run all tests on device
npx detox test -c android.device.debug

# Run specific test file
npx detox test -c android.device.debug e2e/auth.e2e.ts

# Run with verbose output
npx detox test -c android.device.debug --verbose

# Debug mode (keeps app open after test)
npx detox test -c android.device.debug --debug
```

### Using npm Scripts

Add to your `package.json`:

```json
{
  "scripts": {
    "e2e:build:device": "detox build -c android.device.debug",
    "e2e:test:device": "detox test -c android.device.debug",
    "e2e:build:ios": "detox build -c ios.sim.debug",
    "e2e:test:ios": "detox test -c ios.sim.debug",
    "e2e:build:android": "detox build -c android.emu.debug",
    "e2e:test:android": "detox test -c android.emu.debug"
  }
}
```

## Test Coverage

### Authentication (`auth.e2e.ts`)
- Login screen display
- Form validation
- Successful login
- Error handling
- Registration flow
- Forgot password

### Home & Products (`home.e2e.ts`)
- Home screen elements
- Tab switching
- Pull to refresh
- Category filtering
- Product navigation
- Search functionality
- Live streams

### Bidding (`bidding.e2e.ts`)
- My bids tab
- Active/won bids
- Place bids (quick & custom)
- Bid validation
- Cart management
- Checkout flow

### Seller (`seller.e2e.ts`)
- Seller dashboard access
- Application form
- Document upload
- Business info validation
- Create listings
- Go live functionality

### Profile (`profile.e2e.ts`)
- Profile screen
- Edit profile
- Settings
- Order history
- Saved items
- Logout

### Navigation (`navigation.e2e.ts`)
- Tab navigation
- Deep linking
- App state handling
- Error handling
- Accessibility
- Performance

### Streaming (`streaming.e2e.ts`)
- Seller go-live
- Toggle mic/camera
- Viewer join stream
- Chat functionality

## Writing New Tests

### Adding Test IDs

Make sure to add `testID` props to your components:

```tsx
// In your component
<Button 
  testID="sign-in-button"
  onPress={handleLogin}
>
  Sign In
</Button>

<TextInput
  testID="email-input"
  value={email}
  onChangeText={setEmail}
/>
```

### Test Structure

```typescript
import { by, device, element, expect } from 'detox';

describe('Feature Name', () => {
  beforeAll(async () => {
    // Setup before all tests
  });

  beforeEach(async () => {
    // Setup before each test
  });

  it('should do something', async () => {
    // Test steps
    await element(by.id('button-id')).tap();
    
    // Assertions
    await expect(element(by.id('result'))).toBeVisible();
  });

  afterAll(async () => {
    // Cleanup
  });
});
```

## Troubleshooting

### Device Not Found

```bash
# Check if device is connected
adb devices

# If no device appears:
# 1. Make sure USB debugging is enabled
# 2. Try different USB cable/port
# 3. Accept the "Allow USB debugging" prompt on your phone
# 4. Install ADB drivers (Windows)
```

### App Won't Install

```bash
# Uninstall existing app first
adb uninstall com.anomalyco.barterdash

# Then reinstall
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Tests Failing on Device

1. **Check screen is on** - Device screen must be unlocked
2. **Check app permissions** - Grant all requested permissions
3. **Check test account** - Make sure test credentials work manually
4. **Check network** - Device needs internet connection

### Slow Tests on Device

- Close other apps on your phone
- Enable "Don't keep activities" in Developer Options
- Use WiFi instead of mobile data
- Disable animations: `adb shell settings put global window_animation_scale 0`

### WiFi Debugging (No USB Cable)

```bash
# Connect via USB first, then:
adb tcpip 5555
adb connect YOUR_PHONE_IP:5555

# Now you can disconnect USB and run tests wirelessly
# Find your phone's IP in Settings > WiFi > Your Network
```

## Best Practices

1. **Use Test IDs**: Always use `testID` instead of text matching when possible
2. **Handle Async**: Use `await` for all Detox commands
3. **Error Handling**: Wrap optional elements in try-catch blocks
4. **Cleanup**: Always clean up state after tests
5. **Environment**: Use environment variables for test data
6. **Physical Device**: Prefer physical device over emulator for better performance

## Resources

- [Detox Documentation](https://wix.github.io/Detox/)
- [Detox API Reference](https://wix.github.io/Detox/docs/api/detox)
- [Jest Documentation](https://jestjs.io/)
- [ADB Commands](https://developer.android.com/studio/command-line/adb)

## Quick Reference

```bash
# Device commands
adb devices                          # List connected devices
adb install app.apk                 # Install APK
adb uninstall com.package.name      # Uninstall app
adb shell input keyevent 26         # Press power button
adb shell input text "hello"        # Type text
adb screenshot screenshot.png       # Take screenshot

# Detox commands
detox build -c <config>             # Build app
detox test -c <config>              # Run tests
detox test -c <config> --verbose    # Verbose mode
detox test -c <config> --debug      # Debug mode
```
