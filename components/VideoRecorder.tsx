'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Video, Square, Play, Pause, Upload } from 'lucide-react'
import { toast } from 'sonner'

interface VideoRecorderProps {
    onVideoRecorded: (videoBlob: Blob, webcamBlob?: Blob) => void
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
    const [showPermissionScreen, setShowPermissionScreen] = useState(false)
    const [permissions, setPermissions] = useState({
        screen: false,
        webcam: false,
        microphone: false
    })

    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const webcamRecorderRef = useRef<MediaRecorder | null>(null)
    const videoRef = useRef<HTMLVideoElement>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const webcamStreamRef = useRef<MediaStream | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const webcamChunksRef = useRef<Blob[]>([])
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const animationIdRef = useRef<number | null>(null)

    // Cleanup effect
    useEffect(() => {
        return () => {
            // Cleanup on unmount
            if (timerRef.current) {
                clearInterval(timerRef.current)
            }
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current)
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop())
            }
            if (webcamStreamRef.current) {
                webcamStreamRef.current.getTracks().forEach(track => track.stop())
            }
        }
    }, [])

    // Permission request functions
    const requestScreenPermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
                audio: true
            })
            setPermissions(prev => ({ ...prev, screen: true, microphone: true }))
            // Stop the stream immediately after getting permission
            stream.getTracks().forEach(track => track.stop())
            return true
        } catch (error) {
            console.error('Screen permission denied:', error)
            return false
        }
    }

    const requestWebcamPermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: { ideal: 640 }, height: { ideal: 480 } },
                audio: false
            })
            setPermissions(prev => ({ ...prev, webcam: true }))
            // Stop the stream immediately after getting permission
            stream.getTracks().forEach(track => track.stop())
            return true
        } catch (error) {
            console.error('Webcam permission denied:', error)
            return false
        }
    }

    const requestAllPermissions = async () => {
        setShowPermissionScreen(true)

        const screenGranted = await requestScreenPermission()
        if (!screenGranted) {
            alert('Screen recording permission is required to continue.')
            setShowPermissionScreen(false)
            return false
        }

        const webcamGranted = await requestWebcamPermission()
        if (!webcamGranted) {
            alert('Webcam permission is required for picture-in-picture recording.')
            setShowPermissionScreen(false)
            return false
        }

        setShowPermissionScreen(false)
        return true
    }

    // Fallback function to record just screen without webcam
    const recordScreenOnly = async (screenStream: MediaStream, mimeType: string) => {
        console.log('Starting fallback screen-only recording...')

        try {
            const fallbackRecorder = new MediaRecorder(screenStream, { mimeType })
            const fallbackChunks: Blob[] = []

            fallbackRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    fallbackChunks.push(event.data)
                    console.log('Fallback data available:', event.data.size, 'bytes')
                }
            }

            fallbackRecorder.onstop = () => {
                const videoBlob = new Blob(fallbackChunks, { type: mimeType })
                console.log('Fallback video blob size:', videoBlob.size, 'bytes')

                if (videoBlob.size > 0) {
                    const videoUrl = URL.createObjectURL(videoBlob)
                    setRecordedVideo(videoUrl)
                    onVideoRecorded(videoBlob)
                    toast.info('Recorded screen only (webcam overlay failed)')
                } else {
                    console.error('Fallback recording also failed - no data recorded')
                    alert('Recording failed completely. Please try again.')
                }
            }

            fallbackRecorder.onerror = (event) => {
                console.error('Fallback recorder error:', event)
                alert('Fallback recording failed. Please try again.')
            }

            fallbackRecorder.start(100)
            console.log('Fallback recorder started')

            // Store the fallback recorder reference
            mediaRecorderRef.current = fallbackRecorder
            chunksRef.current = fallbackChunks

        } catch (error) {
            console.error('Error starting fallback recording:', error)
            alert('Failed to start fallback recording. Please try again.')
        }
    }

    const startRecording = useCallback(async () => {
        try {
            console.log('Starting screen recording with separate webcam...')

            // Request screen stream
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
                audio: true
            })
            console.log('Screen stream obtained:', screenStream)
            streamRef.current = screenStream

            // Request webcam stream separately
            let webcamStream: MediaStream | null = null
            try {
                webcamStream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 640 }, height: { ideal: 480 } },
                    audio: false
                })
                console.log('Webcam stream obtained:', webcamStream)
                webcamStreamRef.current = webcamStream
            } catch (webcamError) {
                console.warn('Webcam not available, recording screen only:', webcamError)
            }

            // Determine MIME type
            let mimeType = 'video/webm;codecs=vp9'
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'video/webm'
            }
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'video/mp4'
            }
            console.log('Using MIME type:', mimeType)

            // Create screen recorder
            const screenRecorder = new MediaRecorder(screenStream, { mimeType })
            mediaRecorderRef.current = screenRecorder
            chunksRef.current = []

            screenRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data)
                    console.log('Screen data chunk:', event.data.size, 'bytes')
                }
            }

            // Create webcam recorder if available
            let webcamRecorder: MediaRecorder | null = null
            if (webcamStream) {
                webcamRecorder = new MediaRecorder(webcamStream, { mimeType })
                webcamRecorderRef.current = webcamRecorder
                webcamChunksRef.current = []

                webcamRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        webcamChunksRef.current.push(event.data)
                        console.log('Webcam data chunk:', event.data.size, 'bytes')
                    }
                }

                webcamRecorder.onstop = () => {
                    console.log('Webcam recording stopped, chunks:', webcamChunksRef.current.length)
                }

                webcamRecorder.onerror = (event) => {
                    console.error('Webcam recorder error:', event)
                }
            }

            screenRecorder.onstop = () => {
                console.log('Screen recording stopped, chunks:', chunksRef.current.length)
                const screenBlob = new Blob(chunksRef.current, { type: mimeType })
                console.log('Screen blob size:', screenBlob.size, 'bytes')

                let webcamBlob: Blob | undefined = undefined
                if (webcamChunksRef.current.length > 0) {
                    webcamBlob = new Blob(webcamChunksRef.current, { type: mimeType })
                    console.log('Webcam blob size:', webcamBlob.size, 'bytes')
                }

                if (screenBlob.size > 0) {
                    const videoUrl = URL.createObjectURL(screenBlob)
                    setRecordedVideo(videoUrl)
                    onVideoRecorded(screenBlob, webcamBlob)
                    console.log('Recording completed successfully!')
                    toast.success('Recording completed successfully!')
                } else {
                    console.error('Recording failed - no data recorded')
                    alert('Recording failed. No data was recorded. Please try again.')
                }
            }

            screenRecorder.onerror = (event) => {
                console.error('Screen recorder error:', event)
                alert('Recording error occurred. Please try again.')
            }

            // Start both recorders
            screenRecorder.start(100)
            if (webcamRecorder) {
                webcamRecorder.start(100)
            }

            setIsRecording(true)
            setRecordingTime(0)

            // Notify parent component
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
    }, [onVideoRecorded, onStartRecording])

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
            
            // Stop webcam recorder if it exists
            if (webcamRecorderRef.current) {
                webcamRecorderRef.current.stop()
            }
            
            setIsRecording(false)
            setIsPaused(false)

            if (timerRef.current) {
                clearInterval(timerRef.current)
                timerRef.current = null
            }

            // Cancel any pending animation frames
            if (animationIdRef.current) {
                cancelAnimationFrame(animationIdRef.current)
                animationIdRef.current = null
            }

            // Stop all tracks
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop())
                streamRef.current = null
            }
            
            if (webcamStreamRef.current) {
                webcamStreamRef.current.getTracks().forEach(track => track.stop())
                webcamStreamRef.current = null
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
                    Screen Recorder
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {showPermissionScreen && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                        <div className="text-center space-y-4">
                            <div className="flex justify-center">
                                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                                    <Video className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                </div>
                            </div>
                            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                                Permission Required
                            </h3>
                            <p className="text-blue-700 dark:text-blue-300">
                                We need your permission to access your screen and webcam for recording.
                            </p>
                            <div className="space-y-2 text-sm text-blue-600 dark:text-blue-400">
                                <div className="flex items-center justify-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${permissions.screen ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                    <span>Screen Recording & Microphone</span>
                                </div>
                                <div className="flex items-center justify-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${permissions.webcam ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                    <span>Webcam Access</span>
                                </div>
                            </div>
                            <div className="text-xs text-blue-500 dark:text-blue-400">
                                Please allow access when prompted by your browser.
                            </div>
                        </div>
                    </div>
                )}
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
                                <>
                                    <Button
                                        onClick={requestAllPermissions}
                                        variant="outline"
                                        size="lg"
                                        className="gap-2"
                                    >
                                        <Video className="h-4 w-4" />
                                        Test Permissions
                                    </Button>
                                    <Button
                                        onClick={async () => {
                                            try {
                                                const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
                                                console.log('Test stream:', stream)
                                                const recorder = new MediaRecorder(stream)
                                                const chunks: Blob[] = []
                                                recorder.ondataavailable = (e) => {
                                                    console.log('Test data:', e.data.size)
                                                    if (e.data.size > 0) chunks.push(e.data)
                                                }
                                                recorder.onstop = () => {
                                                    const blob = new Blob(chunks, { type: 'video/webm' })
                                                    console.log('Test blob size:', blob.size)
                                                    if (blob.size > 0) {
                                                        toast.success(`Test recording successful: ${blob.size} bytes`)
                                                    } else {
                                                        toast.error('Test recording failed: 0 bytes')
                                                    }
                                                }
                                                recorder.start()
                                                setTimeout(() => {
                                                    recorder.stop()
                                                    stream.getTracks().forEach(t => t.stop())
                                                }, 2000)
                                            } catch (e) {
                                                console.error('Test failed:', e)
                                                toast.error('Test failed: ' + e)
                                            }
                                        }}
                                        variant="outline"
                                        size="sm"
                                        className="gap-2"
                                    >
                                        Test Recorder
                                    </Button>
                                    <Button onClick={startRecording} size="lg" className="gap-2">
                                        <Play className="h-4 w-4" />
                                        Start Recording
                                    </Button>
                                </>
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
                                : 'Click Start Recording to begin capturing your screen.'
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
