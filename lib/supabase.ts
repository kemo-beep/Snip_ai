import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ftbylzpiyrtvhmuzrguc.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ0YnlsenBpeXJ0dmhtdXpyZ3VjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDY0MjgsImV4cCI6MjA3NjIyMjQyOH0.pqKfhouDlxQi0S2-sTfKdvu0mXi524AUyljqNypdzU4'

// Check if environment variables are properly set
const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Export configuration status for error handling
export { isSupabaseConfigured }

// Helper function to upload video file
export async function uploadVideo(blob: Blob, fileName: string) {
    if (!isSupabaseConfigured) {
        throw new Error('Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.')
    }

    // Convert Blob to File for Supabase
    const file = new File([blob], fileName, {
        type: blob.type || 'video/webm',
        lastModified: Date.now()
    })

    const { data, error } = await supabase.storage
        .from('videos')
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
        })

    if (error) {
        throw new Error(`Upload failed: ${error.message}`)
    }

    return data
}

// Helper function to get public URL
export async function getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(path)

    return data.publicUrl
}

// Helper function to create shareable link
export async function createShareableLink(videoPath: string) {
    const publicUrl = await getPublicUrl('videos', videoPath)
    return publicUrl
}
