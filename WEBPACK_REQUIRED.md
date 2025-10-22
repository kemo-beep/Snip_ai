# Webpack Required for FFmpeg

## Issue

FFmpeg.wasm has dynamic imports that don't work with Turbopack (Next.js's new bundler). The error "Cannot find module as expression is too dynamic" is a Turbopack limitation.

## Solution

I've disabled Turbopack in `next.config.ts` so it will use Webpack instead, which handles FFmpeg.wasm correctly.

## Steps to Fix:

### 1. Stop the dev server
```bash
# Press Ctrl+C
```

### 2. Clear Next.js cache
```bash
rm -rf .next
```

### 3. Restart with Webpack (not Turbopack)
```bash
npm run dev
```

This will now use Webpack instead of Turbopack, which properly handles FFmpeg's dynamic imports.

### 4. Verify it's working

Check the console when exporting:
```
[FFmpeg] Loaded successfully
[FFmpeg] Starting WebM to MP4 conversion
✅ MP4 conversion complete!
Blob type: video/mp4
```

## Why This Works

- **Turbopack**: New, fast, but doesn't support all dynamic imports yet
- **Webpack**: Older, slower, but fully supports FFmpeg.wasm

The trade-off is worth it for MP4 export functionality.

## Alternative: Use WebM

If you prefer to keep Turbopack for faster dev builds, you can:
1. Export as WebM (no conversion needed)
2. Convert to MP4 later using external tools

## Performance Impact

- **Dev server startup**: Slightly slower with Webpack
- **Hot reload**: Slightly slower with Webpack
- **Production build**: No difference (always uses Webpack)
- **MP4 export**: Now works! ✅

## Reverting to Turbopack

If you want to go back to Turbopack (and lose MP4 export):

1. Edit `next.config.ts`
2. Remove the `experimental: { turbo: undefined }` line
3. Restart server

But then MP4 export won't work, only WebM.
