# Troubleshooting Guide

## Common Issues and Solutions

### 1. EMFILE: Too Many Open Files Error

**Error**: `Error: EMFILE: too many open files, watch`

**Cause**: macOS has a default limit on the number of files a process can watch simultaneously. Metro bundler hits this limit with large node_modules directories.

**Solutions**:

#### Option A: Temporary Fix (Current Session Only)
```bash
ulimit -n 4096
npm start
```

#### Option B: Permanent Fix (Recommended)
Add to your `~/.zshrc` or `~/.bash_profile`:
```bash
ulimit -n 4096
```
Then restart your terminal or run:
```bash
source ~/.zshrc
```

#### Option C: Install Watchman (Best Solution)
Watchman is Facebook's file watching service that handles file watching more efficiently:
```bash
# Install via Homebrew
brew install watchman

# Then restart Metro bundler
npm start
```

#### Option D: Use the Fix Script
```bash
./fix-file-watch.sh
npm start
```

### 2. Package Version Warnings

**Warning**: 
```
react-native@0.73.0 - expected version: 0.73.6
react-native-get-random-values@1.11.0 - expected version: ~1.8.0
```

**Solution**: Run Expo's automatic fix:
```bash
npx expo install --fix
```

Or manually install correct versions:
```bash
npm install react-native@0.73.6 react-native-get-random-values@1.8.0
```

### 3. Node Version Warnings

**Warning**: Some Solana packages require Node >=20.18.0, but you have 20.17.0

**Solution**: Update Node.js (optional, warnings are usually fine):
```bash
# Using nvm
nvm install 20.18.0
nvm use 20.18.0

# Or using Homebrew
brew upgrade node
```

**Note**: Warnings are usually fine. The app should work with Node 20.17.0.

### 4. Metro Bundler Not Starting

**Symptoms**: Metro bundler crashes or doesn't start

**Solutions**:
1. Clear Metro cache:
   ```bash
   npx expo start --clear
   ```

2. Clear watchman (if installed):
   ```bash
   watchman watch-del-all
   ```

3. Delete node_modules and reinstall:
   ```bash
   rm -rf node_modules
   npm install
   ```

### 5. Deep Link Not Working

**Symptoms**: Portal redirects don't work after authentication

**Solutions**:
1. Verify URL scheme in `app.json`:
   ```json
   {
     "expo": {
       "scheme": "lazorkit-ticket"
     }
   }
   ```

2. For iOS Simulator, test deep link:
   ```bash
   xcrun simctl openurl booted lazorkit-ticket://test
   ```

3. For Android Emulator:
   ```bash
   adb shell am start -W -a android.intent.action.VIEW -d "lazorkit-ticket://test"
   ```

4. Rebuild native app after changing app.json:
   ```bash
   npx expo prebuild --clean
   ```

### 6. Portal Not Opening

**Symptoms**: LazorKit portal doesn't open when connecting wallet

**Solutions**:
1. Verify `expo-web-browser` is installed:
   ```bash
   npm list expo-web-browser
   ```

2. If missing, install:
   ```bash
   npx expo install expo-web-browser
   ```

3. Check portal URL is correct in `app/_layout.tsx`:
   ```typescript
   portalUrl: "https://portal.lazor.sh"
   ```

### 7. TypeScript Errors After Installing Packages

**Symptoms**: TypeScript errors about missing type definitions

**Solution**: These are normal until packages are fully installed. Run:
```bash
npm install
# Wait for installation to complete
# Errors should resolve after installation
```

### 8. iOS Simulator Issues

**Symptoms**: App doesn't open in iOS simulator

**Solutions**:
1. Install Xcode Command Line Tools:
   ```bash
   xcode-select --install
   ```

2. Check simulator is installed:
   ```bash
   xcrun simctl list devices
   ```

3. Reset simulator:
   ```bash
   xcrun simctl erase all
   ```

### 9. Android Emulator Issues

**Symptoms**: App doesn't open in Android emulator

**Solutions**:
1. Verify emulator is running:
   ```bash
   adb devices
   ```

2. Start emulator from Android Studio

3. Check Android SDK is installed:
   ```bash
   echo $ANDROID_HOME
   ```

### 10. Vulnerabilities Warning

**Warning**: `21 vulnerabilities (3 low, 15 high, 3 critical)`

**Note**: These are often from transitive dependencies and don't affect the app in development.

**Optional Fix** (may cause breaking changes):
```bash
npm audit fix
```

For more aggressive fixes (use with caution):
```bash
npm audit fix --force
```

## Recommended Setup for macOS

1. **Install Watchman** (best for file watching):
   ```bash
   brew install watchman
   ```

2. **Increase file descriptor limit permanently**:
   Add to `~/.zshrc`:
   ```bash
   ulimit -n 4096
   ```

3. **Install correct package versions**:
   ```bash
   npx expo install --fix
   ```

4. **Use development build** (recommended for native modules):
   ```bash
   npx expo run:ios
   # or
   npx expo run:android
   ```

## Getting Help

If issues persist:
1. Check Expo documentation: https://docs.expo.dev
2. Check LazorKit SDK documentation
3. Clear all caches and rebuild:
   ```bash
   rm -rf node_modules .expo
   npm install
   npx expo start --clear
   ```

