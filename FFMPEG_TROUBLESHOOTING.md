# FFmpeg.wasm Troubleshooting Guide

## Issue: MP4 files not playing in QuickTime

If you're getting MP4 files that won't play in QuickTime, it means the FFmpeg conversion isn't working.

## Quick Diagnosis

### Step 1: Check Headers
Visit: `http://localhost:3000/test-headers`

You should see:
- ✅ SharedArrayBuffer: Available
- ✅ Secure Context: Yes
- ✅ Cross-Origin Isolated: Yes
- ✅ FFmpeg.wasm should work

If any are ❌, the headers aren't set correctly.

### Step 2: Check Console Logs

When exporting, you should see:
```
MP4 format requested, checking FFmpeg support...
FFmpeg supported: true
[FFmpeg] ✅ Environment check passed
Converting WebM to MP4...
[FFmpeg] Loaded successfully
[FFmpeg] Starting WebM to MP4 conversion
[FFmpeg] Progress: 50.00%
✅ MP4 conversion complete!
Blob type: video/mp4
```

If you see:
```
FFmpeg supported: false
⚠️ FFmpeg not supported, exporting as WebM
```

Then the headers aren't working.

## Solutions

### Solution 1: Restart Dev Server

The headers are set in `next.config.ts` and `middleware.ts`. You MUST restart the dev server for them to take effect.

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

### Solution 2: Clear Browser Cache

Sometimes browsers cache the old headers.

1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

Or:
- Chrome: Cmd+Shift+Delete → Clear cache
- Firefox: Cmd+Shift+Delete → Clear cache
- Safari: Cmd+Option+E

### Solution 3: Check Middleware

Verify `middleware.ts` exists in the root directory:

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const response = NextResponse.next()
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
    response.headers.set('Cross-Origin-Embedder-Policy', 'require-corp')
    return response
}

export const config = {
    matcher: '/:path*',
}
```

### Solution 4: Check Next.js Config

Verify `next.config.ts` has the headers:

```typescript
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ]
  },
};
```

### Solution 5: Use HTTPS

SharedArrayBuffer requires a secure context. If you're not on localhost, you need HTTPS.

For development:
```bash
# Use ngrok or similar
ngrok http 3000
```

Or use Vercel/Netlify which provide HTTPS automatically.

## Verification Steps

### 1. Check Headers in DevTools

1. Open DevTools (F12)
2. Go to Network tab
3. Reload page
4. Click on the main document request
5. Check Response Headers:
   - `cross-origin-opener-policy: same-origin` ✅
   - `cross-origin-embedder-policy: require-corp` ✅

### 2. Check SharedArrayBuffer

Open Console and type:
```javascript
typeof SharedArrayBuffer
```

Should return: `"function"` ✅

If it returns: `"undefined"` ❌ - Headers not working

### 3. Check Cross-Origin Isolated

Open Console and type:
```javascript
crossOriginIsolated
```

Should return: `true` ✅

If it returns: `false` ❌ - Headers not working

### 4. Test Export

1. Record a video
2. Click Export
3. Select MP4 format
4. Watch console logs
5. Should see FFmpeg conversion messages
6. File should be named `.mp4`
7. File should play in QuickTime

## Common Issues

### Issue: "SharedArrayBuffer is not defined"

**Cause**: Headers not set or dev server not restarted

**Fix**: 
1. Restart dev server
2. Clear browser cache
3. Check middleware.ts exists
4. Check next.config.ts has headers

### Issue: "FFmpeg not supported, exporting as WebM"

**Cause**: Same as above

**Fix**: Same as above

### Issue: File is named .mp4 but won't play

**Cause**: FFmpeg conversion failed silently, file is actually WebM

**Fix**: Check console for error messages

### Issue: Conversion takes forever

**Cause**: Large video or slow device

**Fix**: 
- Use lower resolution
- Use shorter video
- Use WebM format instead

### Issue: "Failed to fetch" when loading FFmpeg

**Cause**: No internet connection or CDN blocked

**Fix**:
- Check internet connection
- Check if unpkg.com is accessible
- Try different network

## Expected Console Output

### Successful MP4 Export:
```
Starting export with options: {format: "mp4", ...}
MP4 format requested, checking FFmpeg support...
[FFmpeg] ✅ Environment check passed
[FFmpeg] SharedArrayBuffer: function
[FFmpeg] Secure context: true
FFmpeg supported: true
Converting WebM to MP4...
WebM blob size: 52428800 bytes
[FFmpeg] Starting WebM to MP4 conversion
[FFmpeg] Input blob size: 52428800
[FFmpeg] Writing input file
[FFmpeg] Starting conversion
[FFmpeg] Progress: 25.00% (time: 15000ms)
[FFmpeg] Progress: 50.00% (time: 30000ms)
[FFmpeg] Progress: 75.00% (time: 45000ms)
[FFmpeg] Progress: 100.00% (time: 60000ms)
[FFmpeg] Reading output file
[FFmpeg] Output blob size: 47185920
[FFmpeg] Conversion complete
✅ MP4 conversion complete! Final blob size: 47185920 bytes
Blob type: video/mp4
Final export format: mp4
Export complete, blob size: 47185920
Export blob type: video/mp4
Downloading as: video-1080p-2025-10-22T14-30-45.mp4
```

### Failed MP4 Export (Fallback to WebM):
```
Starting export with options: {format: "mp4", ...}
MP4 format requested, checking FFmpeg support...
[FFmpeg] ❌ SharedArrayBuffer not available
[FFmpeg] This usually means the required HTTP headers are not set
FFmpeg supported: false
⚠️ FFmpeg not supported in this browser, exporting as WebM
SharedArrayBuffer available: false
Secure context: true
Final export format: webm
Export complete, blob size: 52428800
Export blob type: video/webm
⚠️ MP4 was requested but got WebM - conversion may have failed
Downloading as: video-1080p-2025-10-22T14-30-45.webm
```

## File Verification

### Check if file is really MP4:

**macOS:**
```bash
file video-1080p-2025-10-22T14-30-45.mp4
# Should show: ISO Media, MP4 v2
```

**Using ffprobe:**
```bash
ffprobe video-1080p-2025-10-22T14-30-45.mp4
# Should show:
# Video: h264
# Audio: aac
```

### Check if file is actually WebM:

```bash
file video-1080p-2025-10-22T14-30-45.mp4
# If it shows: WebM
# Then conversion failed and it's WebM with .mp4 extension
```

## Still Not Working?

### Last Resort Options:

1. **Use WebM format**
   - Select WebM in export dialog
   - No conversion needed
   - Works in modern browsers
   - Convert later with external tool

2. **External Conversion**
   - Export as WebM
   - Use HandBrake or FFmpeg CLI to convert
   - Command: `ffmpeg -i input.webm -c:v libx264 -c:a aac output.mp4`

3. **Check Browser**
   - Try different browser (Chrome recommended)
   - Update browser to latest version
   - Check browser console for errors

4. **Check System**
   - Ensure enough RAM (2GB+ free)
   - Close other tabs/apps
   - Try smaller video

## Getting Help

If still not working, provide:
1. Console logs (full output)
2. Browser and version
3. Operating system
4. Video duration and resolution
5. Output from `/test-headers` page
6. Output from `typeof SharedArrayBuffer` in console
7. Output from `crossOriginIsolated` in console

## Quick Checklist

- [ ] Dev server restarted after adding headers
- [ ] Browser cache cleared
- [ ] `/test-headers` shows all green
- [ ] `typeof SharedArrayBuffer` returns "function"
- [ ] `crossOriginIsolated` returns true
- [ ] Console shows FFmpeg loading messages
- [ ] Console shows conversion progress
- [ ] File type is video/mp4 (not video/webm)
- [ ] File plays in QuickTime

If all checked ✅, MP4 export should work!
