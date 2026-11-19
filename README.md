# Mini Background Location & Push Notification App

This repository is a small full-stack demonstration of location reporting and Firebase Cloud Messaging (FCM) notifications:

- A React Native CLI **0.86.0** mobile application.
- A Node.js and Express backend.
- Foreground device-location updates sent to the backend.
- FCM token registration and push-notification delivery through Firebase Admin SDK.

> **Current implementation boundary:** despite the project name, location tracking is implemented only while the React Native app is active in the foreground. It is not a native background-location service.

## Contents

- [Technology stack](#technology-stack)
- [Project structure](#project-structure)
- [Architecture](#architecture)
- [Installation and setup](#installation-and-setup)
- [API documentation](#api-documentation)
- [Background location behavior](#background-location-behavior)
- [Testing](#testing)
- [Limitations and future improvements](#limitations-and-future-improvements)

## Technology stack

### Mobile application (`mobile/`)

| Technology | Purpose |
| --- | --- |
| React Native 0.86.0 and React 19.2.3 | Cross-platform mobile UI |
| TypeScript 5.8.3 | Application source typing |
| `react-native-geolocation-service` | Requests foreground location permission and obtains GPS coordinates |
| `@react-native-firebase/app` and `@react-native-firebase/messaging` | Firebase initialization, FCM permissions, tokens, and message handlers |
| `react-native-notify-kit` | Android notification channel creation and local rendering of FCM messages |
| `react-native-safe-area-context` | Safe-area layout support |
| Jest and React Test Renderer | Test tooling configured in the mobile project |
| Android Gradle Plugin / Google Services plugin | Android build and Firebase Google Services integration |

The mobile package requires Node.js `>= 22.11.0` according to [`mobile/package.json`](mobile/package.json).

### Backend (`backend/`)

| Technology | Purpose |
| --- | --- |
| Node.js | Backend runtime |
| Express 5.3.0 | HTTP API and routing |
| `cors` | Enables cross-origin requests |
| `dotenv` | Loads backend environment variables |
| `firebase-admin` 14.5.1 | Sends FCM multicast notifications |
| `nodemon` | Development server restart tool |

## Project structure

```text
MiniLocationNotificationApp/
├── backend/
│   ├── .env.example                         # Backend port and Firebase credential examples
│   ├── package.json                         # Backend scripts and dependencies
│   ├── server.js                            # HTTP server entry point
│   └── src/
│       ├── app.js                           # Express middleware and route mounting
│       ├── config/firebase.js               # Firebase Admin credential loading/initialization
│       ├── controllers/
│       │   ├── locationController.js        # Validates and logs location payloads
│       │   └── notificationController.js    # Registers tokens and sends notifications
│       ├── routes/
│       │   ├── health.routes.js             # GET /api/health
│       │   ├── status.routes.js             # GET / and GET /status
│       │   ├── locationRoutes.js            # POST /api/location
│       │   └── notificationRoutes.js        # Notification API routes
│       └── services/notificationService.js  # In-memory tokens and Firebase multicast sending
├── mobile/
│   ├── App.tsx                              # App shell; starts FCM registration on launch
│   ├── index.js                             # Registers background FCM message handler
│   ├── package.json                         # React Native scripts and dependencies
│   ├── android/
│   │   └── app/
│   │       ├── build.gradle                 # Android build and Google Services plugin setup
│   │       └── src/main/AndroidManifest.xml # Internet, location, and notification permissions
│   ├── ios/
│   │   ├── Podfile                          # iOS CocoaPods setup
│   │   └── mobile/Info.plist                # iOS foreground-location usage description
│   ├── __tests__/App.test.tsx               # Basic React render test
│   └── src/
│       ├── constants/api.ts                 # Backend base URL and endpoint paths
│       ├── hooks/useLocationTracking.ts     # Foreground polling and location sync logic
│       ├── screens/HomeScreen.tsx           # Start/stop tracking interface
│       ├── services/locationService.ts      # POSTs coordinates to the backend
│       ├── services/notificationService.ts  # FCM registration and foreground notification display
│       └── types/                           # Location and notification TypeScript types
└── README.md
```

## Architecture

1. The user starts tracking from the mobile UI.
2. `useLocationTracking` requests foreground location permission, reads the current GPS position, and repeats this work approximately every four seconds while tracking remains enabled.
3. `locationService` sends `latitude`, `longitude`, and an ISO timestamp to `POST /api/location`.
4. The backend validates the payload, writes the update to the server console, and returns the received values. It does not save location history.
5. At app startup, the mobile app requests notification permission, obtains an FCM token, and sends it to `POST /api/notifications/register`. Token refreshes are re-registered.
6. `POST /api/notifications/send` sends a multicast FCM notification to all currently registered in-memory tokens through Firebase Admin SDK. Foreground and data-only background messages are rendered locally by the mobile app.

```mermaid
flowchart LR
  A[React Native mobile app] -->|Foreground GPS coordinates + ISO timestamp| B[Express API]
  B -->|Validates and logs| C[Server console]
  A -->|FCM token registration| B
  D[API client / administrator] -->|title, body, optional data| B
  B -->|Firebase Admin SDK multicast| E[Firebase Cloud Messaging]
  E -->|FCM message| A
  A -->|Foreground or data-only message| F[Local notification]
```

## Installation and setup

### Prerequisites

- Node.js 22.11.0 or later for the mobile project.
- npm.
- A React Native Android development environment (Android SDK, emulator or physical device) appropriate for React Native 0.86.
- A Firebase project if push delivery is required.

### 1. Install backend dependencies

```powershell
cd backend
npm install
```

### 2. Configure backend environment variables

Copy the example file and edit the new `.env` file:

```powershell
Copy-Item .env.example .env
```

`backend/.env` supports a `PORT` (default `5000`) and one of the following Firebase Admin credential methods:

1. **Separate variables:** `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`.
2. **Service-account file path:** `FIREBASE_SERVICE_ACCOUNT_PATH`, relative to the `backend/` working directory.
3. **Raw service-account JSON:** `FIREBASE_SERVICE_ACCOUNT_KEY`.

Example using separate variables:

```dotenv
PORT=5000
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-firebase-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Keep real service-account credentials out of source control. The provided `.gitignore` ignores `.env`; if you use a JSON key file, keep it outside the repository or add its exact local path to `.gitignore` before creating it.

Without valid Firebase Admin credentials, the backend still starts, but notification sending returns HTTP `503`.

### 3. Configure the mobile Firebase app

The Android Gradle configuration applies the Google Services plugin, and the app uses React Native Firebase Messaging. However, this repository does **not** include either Firebase client configuration file:

- `mobile/android/app/google-services.json`
- `mobile/ios/GoogleService-Info.plist`

Register the Android app in your Firebase project using the application ID `com.mobile`, then download the Android configuration file and place it at:

```text
mobile/android/app/google-services.json
```

For an iOS build, register the iOS app in Firebase and add the iOS configuration file to the Xcode project as required by React Native Firebase. Do not commit files containing credentials unless your repository policy explicitly permits it.

### 4. Set the mobile backend URL

Update `API_BASE_URL` in [`mobile/src/constants/api.ts`](mobile/src/constants/api.ts). It is currently set to:

```ts
export const API_BASE_URL = 'http://192.168.31.70:5000';
```

Use an address reachable from the app:

- Android emulator: `http://10.0.2.2:5000`
- iOS Simulator: `http://localhost:5000`
- Physical device: your computer's LAN address, for example `http://192.168.1.10:5000`

### 5. Install mobile dependencies

From the project root:

```powershell
cd mobile
npm install
```

For iOS, the repository includes a `Gemfile` and `Podfile`. On macOS, install pods after installing JavaScript dependencies:

```sh
cd mobile
bundle install
bundle exec pod install --project-directory=ios
```

### 6. Run the backend

In one terminal:

```powershell
cd backend
npm run dev
```

Use `npm start` to run without `nodemon`.

The health endpoint is available at `http://localhost:5000/api/health` when using the default port.

### 7. Run the Android app

Start Metro in one terminal:

```powershell
cd mobile
npm start
```

Then, in another terminal, build and install the Android app:

```powershell
cd mobile
npm run android
```

Grant the requested location and notification permissions on the device. Start location tracking using the app UI.

## API documentation

All API payloads use JSON. The backend enables CORS and JSON-body parsing.

### `GET /api/health`

Checks whether the Express server is running.

| Item | Value |
| --- | --- |
| Method | `GET` |
| Request body | None |
| Success | `200 OK` |

Example response:

```json
{
  "success": true,
  "message": "Backend is running",
  "timestamp": "2026-11-19T06:15:00.000Z"
}
```

This endpoint has no controller-defined validation errors.

### `POST /api/location`

Receives one device location update. The backend validates the coordinate ranges and timestamp, logs the update to the server console, and returns the submitted values. It does not persist them.

| Item | Value |
| --- | --- |
| Method | `POST` |
| Content type | `application/json` |
| Success | `201 Created` |

Request body:

```json
{
  "latitude": 12.971599,
  "longitude": 77.594566,
  "timestamp": "2026-11-19T06:15:00.000Z"
}
```

Example success response:

```json
{
  "success": true,
  "message": "Location recorded successfully",
  "data": {
    "latitude": 12.971599,
    "longitude": 77.594566,
    "timestamp": "2026-11-19T06:15:00.000Z"
  }
}
```

Common validation errors (`400 Bad Request`):

- `Latitude is required.`
- `Latitude must be a valid number between -90 and 90.`
- `Longitude is required.`
- `Longitude must be a valid number between -180 and 180.`
- `Timestamp is required.`
- `Timestamp must be a valid date/time format (e.g. ISO 8601 string).`

### `POST /api/notifications/register`

Registers an FCM device token in the backend's in-memory token set. Duplicate tokens remain registered once and return a successful `200` response.

| Item | Value |
| --- | --- |
| Method | `POST` |
| Content type | `application/json` |
| Success | `201 Created` for a new token; `200 OK` for an existing token |

Request body:

```json
{
  "token": "fcm-registration-token"
}
```

The backend also accepts `fcmToken` instead of `token`.

Example response for a new token:

```json
{
  "success": true,
  "message": "Device token registered successfully.",
  "data": {
    "token": "fcm-registration-token",
    "isNew": true,
    "totalRegisteredDevices": 1
  }
}
```

Common validation errors (`400 Bad Request`):

- `Device token is required in the request body (token).`
- `Device token must be a valid non-empty string.`

### `POST /api/notifications/send`

Sends one FCM notification to every token currently registered in memory. Any custom `data` values are converted to strings before Firebase receives them. Invalid or unregistered FCM tokens reported by Firebase are removed from the in-memory set.

| Item | Value |
| --- | --- |
| Method | `POST` |
| Content type | `application/json` |
| Success | `200 OK` when at least one delivery succeeds |

Request body:

```json
{
  "title": "Location update",
  "body": "Your device is connected.",
  "data": {
    "screen": "home",
    "priority": "high"
  }
}
```

Example success response:

```json
{
  "success": true,
  "message": "Notification sent successfully to 1 of 1 device(s).",
  "data": {
    "successCount": 1,
    "failureCount": 0,
    "totalDevices": 1,
    "prunedStaleTokens": 0,
    "activeRemainingDevices": 1
  }
}
```

Common validation and operational errors:

| Status | When it occurs | Response message |
| --- | --- | --- |
| `400` | Title is absent, not a string, or blank | `Notification title is required and must be a non-empty string.` |
| `400` | Body is absent, not a string, or blank | `Notification body is required and must be a non-empty string.` |
| `400` | `data` is not a non-null object or is an array | `Data payload, if provided, must be a key-value object.` |
| `400` | No device token is registered | `No registered devices found. Register at least one device token before sending notifications.` |
| `503` | Firebase Admin credentials are unavailable | `Firebase Admin is not configured. Service account credentials are missing in the server environment.` |
| `500` | Firebase reports no successful delivery or an internal error occurs | Includes `success: false`, `message`, and sometimes an `errors` array |

## Background location behavior

The implemented tracker uses `setInterval` and `Geolocation.getCurrentPosition` in JavaScript. It requests Android `ACCESS_FINE_LOCATION` or iOS **When In Use** permission. There is no Android background-location permission, foreground-service declaration, iOS `UIBackgroundModes` location configuration, or native background task implementation in this repository.

| App state | Implemented behavior |
| --- | --- |
| App in foreground | Supported after the user starts tracking. The app gets a fresh position and attempts a backend sync approximately every four seconds. |
| App in background | Not supported for location tracking. JavaScript timers and location work are not configured as a background service. |
| Screen locked | Not supported for ongoing location tracking by this implementation. |
| Removed from Recents | Not supported for location tracking; there is no service or task restart mechanism. |
| Force-quit | Not supported for location tracking; the app process is stopped. |

FCM handling is separate from location tracking. `mobile/index.js` registers a background message handler for FCM data messages and creates a local notification channel for them. This does not start or continue location collection.

## Testing

The mobile project includes a Jest test at `mobile/__tests__/App.test.tsx` that renders `App` with a mocked geolocation module. The repository does not contain backend test files or recorded test results, so this README does not claim that any test suite has been run or passed.

Available mobile scripts:

```powershell
cd mobile
npm test
npm run lint
```

## Limitations and future improvements

- Location updates are foreground-only; background, locked-screen, Recents-removal, and force-quit tracking are not implemented.
- The backend only logs location updates; it has no database or location history.
- FCM device tokens are held in an in-memory `Set`, so they are lost whenever the backend restarts and are not shared across multiple server instances.
- The API exposes location registration and notification-sending endpoints without authentication or authorization.
- The backend has no request rate limiting, audit logging, or structured persistent logs.
- `API_BASE_URL` is a source-code constant and currently contains a specific LAN IP address, rather than an environment-specific configuration mechanism.
- Firebase client configuration files are absent from the repository and must be supplied for a real Firebase-connected mobile build.
- The UI's **Test Notification** and battery controls are simulated status updates; they do not send a backend notification or read device battery state.
- There are no backend tests and no evidence of end-to-end device, Firebase, or background-behavior testing in the project.

