'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Video, Square, Play, Pause, Upload } from 'lucide-react'

interface VideoRecorderProps {
    onVideoRecorded: (videoBlob: Blob) => void
    onUpload: (videoBlob: Blob) => Promise<void>
    onStartRecording?: () => void
    isUploading?: boolean
}

export default function VideoRecorder({
    onVideoRecorded,
    onUpload,
    onStartRecording,
    isUploading = false
}: VideoRecorderProps) {
    const [isRecording, setIsRecording] = useState(false)
    const [isPaused, setIsPaused] = useState(false)
    const [recordedVideo, setRecordedVideo] = useState<string | null>(null)
    const [recordingTime, setRecordingTime] = useState(0)

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const timerRef = useRef<NodeJS.Timeout | null>(null)

    const startRecording = useCallback(async () => {
        try {
            console.log('Starting recording...')

            // Request screen access only (simplified to fix 0-byte issue)
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: true
            })

            console.log('Screen stream obtained:', screenStream)

            // Use screen stream directly (no canvas for now)
            streamRef.current = screenStream

            // Create MediaRecorder with screen stream
            const mediaRecorder = new MediaRecorder(screenStream, {
                mimeType: 'video/webm;codecs=vp9'
            })

            mediaRecorderRef.current = mediaRecorder
            chunksRef.current = []

            mediaRecorder.ondataavailable = (event) => {
                console.log('MediaRecorder data available:', event.data.size, 'bytes')
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data)
                }
            }

            mediaRecorder.onstop = () => {
                console.log('MediaRecorder stopped, total chunks:', chunksRef.current.length)
                const videoBlob = new Blob(chunksRef.current, { type: 'video/webm' })
                console.log('Created video blob:', videoBlob.size, 'bytes')

                if (videoBlob.size === 0) {
                    console.error('Video blob is 0 bytes!')
                    alert('Recording failed - no data captured. Please try again.')
                    return
                }

                const videoUrl = URL.createObjectURL(videoBlob)
                setRecordedVideo(videoUrl)
                onVideoRecorded(videoBlob)
            }

            mediaRecorder.onerror = (event) => {
                console.error('MediaRecorder error:', event)
                alert('Recording error occurred. Please try again.')
            }

            mediaRecorder.onstart = () => {
                console.log('MediaRecorder started successfully')
            }

            mediaRecorder.start(1000) // Collect data every second
            setIsRecording(true)
            setRecordingTime(0)

            // Notify parent component that recording started
            if (onStartRecording) {
                onStartRecording()
            }

            // Start timer
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1)
            }, 1000)

        } catch (error) {
            console.error('Error starting recording:', error)
            alert('Failed to start recording. Please check permissions.')
        }
    }, [onVideoRecorded, isRecording, isPaused, onStartRecording])

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            setIsPaused(false)

            if (timerRef.current) {
                clearInterval(timerRef.current)
                timerRef.current = null
            }

            // Stop all tracks
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop())
                streamRef.current = null
            }
        }
    }, [isRecording])

    const togglePause = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            if (isPaused) {
                mediaRecorderRef.current.resume()
                timerRef.current = setInterval(() => {
                    setRecordingTime(prev => prev + 1)
                }, 1000)
            } else {
                mediaRecorderRef.current.pause()
                if (timerRef.current) {
                    clearInterval(timerRef.current)
                    timerRef.current = null
                }
            }
            setIsPaused(!isPaused)
        }
    }, [isRecording, isPaused])

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const handleUpload = useCallback(async () => {
        if (recordedVideo) {
            const response = await fetch(recordedVideo)
            const blob = await response.blob()
            await onUpload(blob)
        }
    }, [recordedVideo, onUpload])

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Screen & Webcam Recorder
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {!recordedVideo ? (
                    <div className="space-y-4">
                        <div className="text-center">
                            {isRecording && (
                                <div className="text-2xl font-mono text-red-600 mb-4">
                                    {formatTime(recordingTime)}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-center gap-4">
                            {!isRecording ? (
                                <Button onClick={startRecording} size="lg" className="gap-2">
                                    <Play className="h-4 w-4" />
                                    Start Recording
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        onClick={togglePause}
                                        variant="outline"
                                        size="lg"
                                        className="gap-2"
                                    >
                                        {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                                        {isPaused ? 'Resume' : 'Pause'}
                                    </Button>
                                    <Button onClick={stopRecording} variant="destructive" size="lg" className="gap-2">
                                        <Square className="h-4 w-4" />
                                        Stop Recording
                                    </Button>
                                </>
                            )}
                        </div>

                        <div className="text-sm text-gray-600 text-center">
                            {isRecording
                                ? 'Recording in progress... Click Stop when done.'
                                : 'Click Start Recording to begin capturing your screen and webcam.'
                            }
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <video
                            ref={videoRef}
                            src={recordedVideo}
                            controls
                            className="w-full rounded-lg"
                            style={{ maxHeight: '400px' }}
                        />

                        <div className="flex justify-center gap-4">
                            <Button
                                onClick={handleUpload}
                                disabled={isUploading}
                                size="lg"
                                className="gap-2"
                            >
                                <Upload className="h-4 w-4" />
                                {isUploading ? 'Uploading...' : 'Upload & Share'}
                            </Button>
                            <Button
                                onClick={() => {
                                    setRecordedVideo(null)
                                    setRecordingTime(0)
                                }}
                                variant="outline"
                                size="lg"
                            >
                                Record Again
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
