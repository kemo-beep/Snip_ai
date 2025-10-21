'use client'

import { useState } from 'react'
import VideoRecorder from '@/components/VideoRecorder'
import VideoPlayer from '@/components/VideoPlayer'
import VideoEditor from '@/components/VideoEditor'
import SetupInstructions from '@/components/SetupInstructions'
import { uploadVideo, createShareableLink, isSupabaseConfigured } from '@/lib/supabase'
import { transcribeVideo } from '@/lib/transcription'
import { toast } from 'sonner'

export default function Home() {
  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null)
  const [videoUrl, setVideoUrl] = useState<string>('')
  const [shareableLink, setShareableLink] = useState<string>('')
  const [transcript, setTranscript] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [editedVideo, setEditedVideo] = useState<Blob | null>(null)

  // Check if both Supabase and Gemini are configured
  const isGeminiConfigured = process.env.NEXT_PUBLIC_GEMINI_API_KEY
  const isFullyConfigured = isSupabaseConfigured && isGeminiConfigured

  const handleVideoRecorded = (videoBlob: Blob) => {
    setRecordedVideo(videoBlob)
    const url = URL.createObjectURL(videoBlob)
    setVideoUrl(url)
    // Show editor immediately after recording
    setShowEditor(true)
  }

  const handleStartRecording = () => {
    // Clear any existing clips when starting new recording
    setRecordedVideo(null)
    setVideoUrl('')
    setShareableLink('')
    setTranscript('')
    setEditedVideo(null)
    setShowEditor(false)
  }

  const handleUpload = async (videoBlob: Blob) => {
    setIsUploading(true)
    try {
      // Generate unique filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const fileName = `recording-${timestamp}.webm`

      // Upload to Supabase
      const uploadData = await uploadVideo(videoBlob, fileName)

      // Create shareable link
      const link = await createShareableLink(uploadData.path)
      setShareableLink(link)

      toast.success('Video uploaded successfully!')

      // Start transcription
      setIsTranscribing(true)
      try {
        const transcription = await transcribeVideo(videoBlob)
        setTranscript(transcription)
        toast.success('Transcription completed!')
      } catch (error) {
        console.error('Transcription failed:', error)
        toast.error('Transcription failed, but video was uploaded successfully')
      } finally {
        setIsTranscribing(false)
      }

      // Automatically open the video editor after upload
      setShowEditor(true)
      toast.info('Opening video editor...')

    } catch (error) {
      console.error('Upload failed:', error)
      toast.error('Failed to upload video')
    } finally {
      setIsUploading(false)
    }
  }

  const handleEditVideo = () => {
    setShowEditor(true)
  }

  const handleSaveEditedVideo = (editedBlob: Blob) => {
    setEditedVideo(editedBlob)
    setShowEditor(false)
    toast.success('Video edited successfully!')
  }

  const handleCancelEdit = () => {
    setShowEditor(false)
  }

  const resetRecording = () => {
    setRecordedVideo(null)
    setVideoUrl('')
    setShareableLink('')
    setTranscript('')
    setShowEditor(false)
    setEditedVideo(null)
  }

  // Show setup instructions if not fully configured
  if (!isFullyConfigured) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Snipai
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Record your screen and webcam, then share with AI-powered transcription
            </p>
          </div>
          <SetupInstructions />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        {!showEditor && (
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Snipai
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Record your screen and webcam, then share with AI-powered transcription
            </p>
          </div>
        )}

        <div className="space-y-8">
          {!recordedVideo ? (
            <VideoRecorder
              onVideoRecorded={handleVideoRecorded}
              onUpload={handleUpload}
              onStartRecording={handleStartRecording}
              isUploading={isUploading || isTranscribing}
            />
          ) : showEditor ? (
            <VideoEditor
              videoUrl={editedVideo ? URL.createObjectURL(editedVideo) : videoUrl}
              onSave={handleSaveEditedVideo}
              onCancel={handleCancelEdit}
            />
          ) : (
            <div className="space-y-6">
              <VideoPlayer
                videoUrl={editedVideo ? URL.createObjectURL(editedVideo) : videoUrl}
                shareableLink={shareableLink}
                transcript={transcript}
                title="Your Recording"
                onRecordAgain={handleStartRecording}
                onEditVideo={handleEditVideo}
              />

              <div className="flex justify-center gap-4">
                <button
                  onClick={resetRecording}
                  className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Record Another Video
                </button>
              </div>
            </div>
          )}
        </div>

        {isTranscribing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-gray-700 dark:text-gray-300">
                  Transcribing video...
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
