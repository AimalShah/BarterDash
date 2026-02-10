# BarterDash Streaming Setup Guide (Stream Video)

This guide explains how to set up and run live streaming in the BarterDash mobile app using Stream Video (getstream.io).

## Important: Expo Go vs Development Build

Streaming does NOT work in Expo Go because it requires native modules (for WebRTC) that are not included in Expo Go.

To use streaming, create a development build.

## Prerequisites

1. Stream Video account with API Key, App ID, and Secret
2. Backend running (stream metadata, viewer counts, auctions)
3. Physical device recommended (camera access)

## Environment Setup

### 1. Create `.env` file in `barterdash-mobile/`

```bash
cp .env.example .env
```

### 2. Configure environment variables

```env
# API Configuration - Use your local IP for development
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3000/api/v1

# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Stream Video Configuration
EXPO_PUBLIC_STREAM_API_KEY=your-stream-api-key
```

Note: `EXPO_PUBLIC_STREAM_API_KEY` must be the public API key (short value). Do not use the Stream API secret in the mobile app.

### 3. Backend environment variables (server)

```env
STREAM_API_KEY=your-stream-api-key
STREAM_API_SECRET=your-stream-api-secret
STREAM_APP_ID=your-stream-app-id
```

## Creating a Development Build

### Android

```bash
npm install
npx expo run:android
```

### iOS (macOS only)

```bash
npm install
cd ios && pod install && cd ..
npx expo run:ios
```

## Running the App

```bash
npx expo start --dev-client
```

Then open the app on your device (the development build you created).

## How Streaming Works

### For Sellers (Broadcasting)

1. Create a stream via the "Create Stream" screen
2. Tap "Start Stream" to start broadcasting
3. The app will:
   - Request camera and microphone permissions
   - Initialize Stream Video client
   - Join a Stream Video `livestream` call
   - Go live via Stream lifecycle
   - Call `/stream/start` to mark the stream live in the backend

### For Viewers (Watching)

1. Browse live streams in the home feed
2. Tap a live stream to join
3. The app will:
   - Initialize Stream Video client
   - Join the Stream Video `livestream` call as a viewer
   - Call `/stream/:id/join` to increment viewer count

## Troubleshooting

### "Stream client not ready"

- Ensure `EXPO_PUBLIC_STREAM_API_KEY` is set
- Confirm the user is signed in and profile data is loaded

### Camera/Microphone not working

- Ensure permissions are granted
- Test on a physical device (emulators have limited camera support)

### Backend token errors

- Verify `STREAM_API_KEY`, `STREAM_API_SECRET`, and `STREAM_APP_ID`
- Check backend logs for `/stream/:id/host-token` or `/stream/:id/viewer-token` failures

## API Endpoints Used

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/stream/create` | POST | Create a new stream |
| `/stream/start` | POST | Start a scheduled stream |
| `/stream/end` | POST | End a live stream |
| `/stream` | GET | Get list of streams |
| `/stream/:id` | GET | Get stream details |
| `/stream/:id/join` | POST | Increment viewer count |
| `/stream/:id/leave` | POST | Decrement viewer count |
| `/stream/:id/host-token` | POST | Create Stream Video host token |
| `/stream/:id/viewer-token` | POST | Create Stream Video viewer token |

## Architecture

```
Mobile App                   Backend                   Stream Video
   |                            |                           |
   |-- Stream metadata -------->|                           |
   |<--------- Stream ----------|                           |
   |                            |                           |
   |-- Start/Join stream ------>|                           |
   |                            |                           |
   |-- Video call ----------------------------------------->|
   |<-- Live video -----------------------------------------|
```

## Need Help?

- Check Stream dashboard and SDK logs
- Check backend logs for stream start/join errors
