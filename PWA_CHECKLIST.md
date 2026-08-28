# PWA Installation Banner Checklist

## ✅ Fixed Issues
- [x] Added explicit `<link rel="manifest">` tag to HTML head
- [x] Added Apple Web App meta tags for iOS
- [x] Added `apple-touch-icon` reference for iOS home screen
- [x] Enhanced manifest.json with `scope`, `orientation`, `categories`, and `screenshots`
- [x] Created `apple-touch-icon.png` (192x192)
- [x] Improved ServiceWorker error logging

## 🔍 Critical Requirements (ALL must be met)

### For Android (Chrome PWA):
1. ✅ HTTPS or localhost:3000
2. ✅ Valid manifest.json with:
   - name
   - short_name
   - start_url
   - display: "standalone"
   - icons (192x192 and 512x512)
3. ✅ Service Worker registered and working
4. ✅ Manifest linked in HTML head
5. ✅ User engagement (typically ~30 seconds on site)

### For iOS (Safari PWA):
1. ✅ HTTPS only (not localhost)
2. ✅ apple-mobile-web-app-capable: yes
3. ✅ apple-touch-icon.png (180x180 minimum)
4. ✅ apple-mobile-web-app-title
5. ✅ Supported in iOS 15.1+
6. ⚠️ No automatic install prompt (users add manually: Share → Add to Home Screen)

## 🚀 Testing Instructions

### Browser DevTools
1. **Chrome/Edge (Android)**:
   - Open DevTools → Application → Manifest
   - Verify all fields are present
   - Check Service Worker tab → Status should be "activated and running"
   - Open Console → Look for SW registration messages

2. **iOS Safari**:
   - No DevTools equivalent
   - Check home screen icon after adding to home screen
   - Test offline functionality

### Lighthouse Audit
```bash
npm run build
npm run start
# Then run in DevTools: Lighthouse → PWA
```

### Local Testing
```bash
npm run dev
# Visit: http://localhost:3000
# Android: Install banner should appear after user interaction
# iOS: Users manually add via Share button
```

## 📱 Platform-Specific Behavior

### Android (Chrome 73+)
- **Auto Install Banner**: Shows after user spends ~30 seconds on site and has engaged with it
- **Mini Infobar**: Can be dismissed by user
- **Install Dialog**: User confirms installation

### iOS (Safari 15.1+)
- **No automatic prompt**: Users must manually add
- **Steps**: Safari → Share → Add to Home Screen
- **Icon**: Uses apple-touch-icon.png
- **Title**: Uses apple-mobile-web-app-title
- **Status bar**: Configured via apple-mobile-web-app-status-bar-style

## 🐛 Common Issues

### Install banner not showing?
1. ✅ Verify app is served over HTTPS (production)
2. ✅ Check browser console for SW registration errors
3. ✅ Ensure user spends ~30 seconds on site
4. ✅ Check DevTools → Application → Manifest for errors
5. ✅ Verify all icon files exist at correct paths

### Icons not showing?
- iOS: apple-touch-icon.png must be 192x192 or 180x180
- Android: Icons must match manifest references exactly
- Check file paths in manifest.json

### Service Worker not registering?
- Check browser console for errors
- Verify `/sw.js` is served with correct headers
- Ensure HTTPS (or localhost) connection

## 📋 Files Modified/Created
- `src/app/layout.js` - Added manifest link and iOS meta tags
- `public/manifest.json` - Enhanced with scope, categories, screenshots
- `public/icons/apple-touch-icon.png` - Created for iOS
- `src/components/ServiceWorker.js` - Improved error logging

## 🔗 Resources
- [MDN: Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Web.dev: Install Prompt Checklist](https://web.dev/install-prompt-checklist/)
- [Apple: Home Screen Web Apps](https://developer.apple.com/news/releases/apple-adds-web-app-capabilities-to-safari-on-ios-15-1/)
