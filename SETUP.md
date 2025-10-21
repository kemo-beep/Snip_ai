# Snipai - Setup Guide

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Google Gemini Configuration
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In your Supabase dashboard, go to Settings > API
3. Copy your Project URL and anon public key
4. Go to Storage and create a new bucket called `videos`
5. Set the bucket to public if you want shareable links

## Google Gemini Setup

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create an API key for Gemini
3. Add it to your `.env.local` file as `NEXT_PUBLIC_GEMINI_API_KEY`

## Running the Application

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Features

- ✅ Screen and webcam recording
- ✅ Video upload to cloud storage
- ✅ Shareable video links
- ✅ AI-powered transcription using Google Gemini
- ✅ Video playback with transcript display
- ✅ Download and share functionality

## Browser Permissions

The app requires the following browser permissions:
- Screen sharing (for screen recording)
- Camera access (for webcam recording)
- Microphone access (for audio recording)

Make sure to allow these permissions when prompted by your browser.
