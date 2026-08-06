# Run App on Mobile Device

The goal is to build the latest version of the "Ulcer Diagnosis" app and run it on the connected mobile device. The project uses Capacitor to bridge the React/Vite web application with the Android platform.

## User Review Required

> [!IMPORTANT]
> A mobile device (`aa0753b3`) is currently connected and detected. Please ensure the device is unlocked and "Install via USB" is allowed in Developer Options.

> [!NOTE]
> You mentioned Java version mismatches earlier. I will attempt to build using the system Java (v26). If it fails, I may need to adjust the JAVA_HOME or you might need to click the "Run" button in Android Studio as suggested in your screenshot.

## Proposed Changes

No source code changes are required. The process involves executing build and deployment commands.

### Build and Deploy Workflow

1.  **Build Web Assets:** Generate the production build of the React application in the `client/` directory.
2.  **Sync Capacitor:** Synchronize the built assets into the `client/android/` project.
3.  **Build APK:** Compile the Android project and generate a debug APK.
4.  **Install & Launch:** Install the APK onto the device and launch the `com.ouds.app` package.

## Verification Plan

### Manual Verification
- Verify that the app launches successfully on the connected mobile device.
- Check that the UI reflects the latest changes in the web source code.
