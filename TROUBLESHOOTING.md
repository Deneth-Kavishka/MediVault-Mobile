# Fix: "Something Went Wrong" Error in Expo

## Changes Made:

### 1. Added Error Handler ([errorHandler.ts](errorHandler.ts))
- Global error handler to catch and log errors
- Unhandled promise rejection handler
- LogBox warnings suppression

### 2. Updated Entry Point ([index.js](index.js))
- Imported error handler first
- Added global polyfill

### 3. Updated Root Layout ([app/_layout.tsx](app/_layout.tsx))
- Added error boundary with state
- Better error handling and logging

## Steps to Fix:

### Step 1: Clear All Caches
```powershell
# Stop any running Expo processes first (Ctrl+C in terminal)

# Clear Expo cache
npx expo start --clear

# If that doesn't work, do a full clean:
Remove-Item -Recurse -Force .expo
Remove-Item -Recurse -Force node_modules\.cache
npx expo start --clear
```

### Step 2: Check Device Logs

When you see "Something went wrong", shake your device and tap "Copy error" or check the Metro bundler terminal for detailed error messages.

Common issues:

1. **Network Issues**: Make sure your phone and computer are on the same WiFi network
2. **Firewall**: Disable firewall temporarily or allow Expo through it
3. **Module Issues**: Some native modules might not be installed

### Step 3: Verify Installation

Run these commands to ensure everything is properly installed:

```powershell
# Reinstall dependencies
npm install

# Clear watchman cache (if on Mac/Linux)
# watchman watch-del-all

# Reset Metro bundler
npx expo start --clear
```

### Step 4: Check for Specific Errors

Look in the terminal where you ran `npx expo start` for specific error messages. Common ones:

- **"Unable to resolve module"**: Missing dependency or import issue
- **"SyntaxError"**: Code syntax problem
- **"Cannot read property of undefined"**: Runtime error in code

### Step 5: Test in Development Mode

```powershell
# Start with development mode
npx expo start --dev-client

# Or start with tunnel if network issues
npx expo start --tunnel
```

## Additional Debugging:

### Check Metro Bundler Output
The terminal running `npx expo start` will show:
- Build errors
- Import/module resolution issues
- Runtime errors from the app

### Check Device Logs
- **Android**: `adb logcat | grep -i ReactNativeJS`
- **iOS**: Open Console.app and filter by your device

### Verify App.json
Make sure all assets referenced in app.json exist:
- `./assets/images/icon.png`
- `./assets/images/splash-icon.png`
- `./assets/images/android-icon-*.png`

## If Still Not Working:

1. **Try on a different device or simulator**
2. **Check if a specific screen is causing the issue** by commenting out routes
3. **Simplify _layout.tsx** temporarily to isolate the problem
4. **Check for circular dependencies** in imports
5. **Verify all required permissions** are granted on the device

## Quick Test:

Replace app/_layout.tsx temporarily with this minimal version to test:

```tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
    </Stack>
  );
}
```

If this works, gradually add back the providers one by one to find the issue.

## Get Detailed Error:

On your device, when you see "Something went wrong":
1. Shake the device
2. Tap "Copy error"  
3. Paste the error message to see what's actually failing

The error message will tell you exactly what's wrong (missing module, syntax error, etc.)
