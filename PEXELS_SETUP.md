# Pexels API Setup

To enable wallpaper backgrounds from Pexels in the video editor, you need to set up a Pexels API key.

## Steps:

1. **Get a Pexels API Key:**
   - Visit [https://www.pexels.com/api/](https://www.pexels.com/api/)
   - Sign up for a free account or log in
   - Navigate to your API section
   - Copy your API key

2. **Add the API Key to your environment:**
   - Open `.env.local` file in the root directory
   - Add your Pexels API key:
     ```
     NEXT_PUBLIC_PEXELS_API_KEY=your_api_key_here
     ```

3. **Restart your development server:**
   ```bash
   npm run dev
   ```

## Features:

- Browse 30 high-quality landscape photos from Pexels
- Click any photo to set it as your video background
- Photos are loaded on-demand when you open the wallpaper tab
- All photos are properly attributed to Pexels

## API Limits:

The free Pexels API allows:
- 200 requests per hour
- 20,000 requests per month

This is more than enough for typical usage.
