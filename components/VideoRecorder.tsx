'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Video, Square, Play, Pause, Upload, Mic, Camera, Monitor, Settings, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

interface VideoRecorderProps {
    onVideoRecorded: (videoBlob: Blob, webcamBlob?: Blob) => void
    onUpload: (videoBlob: Blob) => Promise<void>
    onStartRecording?: () => void
    isUploading?: boolean
}

interface MediaDeviceInfo {
    deviceId: string
    label: string
    kind: string
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
    const [showDeviceSetup, setShowDeviceSetup] = useState(false)
    const [availableDevices, setAvailableDevices] = useState<{
        microphones: MediaDeviceInfo[]
        cameras: MediaDeviceInfo[]
    }>({
        microphones: [],
        cameras: []
    })
    const [selectedDevices, setSelectedDevices] = useState({
        microphone: '',
        camera: '',
        includeMicrophone: true,
        includeWebcam: true
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

    // Enumerate devices on mount
    useEffect(() => {
        enumerateDevices()
    }, [])

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

    const enumerateDevices = async () => {
        try {
            // Request permissions first to get device labels
            const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
            tempStream.getTracks().forEach(track => track.stop())

            const devices = await navigator.mediaDevices.enumerateDevices()
            
            const microphones = devices
                .filter(device => device.kind === 'audioinput')
                .map(device => ({
                    deviceId: device.deviceId,
                    label: device.label || `Microphone ${device.deviceId.slice(0, 5)}`,
                    kind: device.kind
                }))

            const cameras = devices
                .filter(device => device.kind === 'videoinput')
                .map(device => ({
                    deviceId: device.deviceId,
                    label: device.label || `Camera ${device.deviceId.slice(0, 5)}`,
                    kind: device.kind
                }))

            setAvailableDevices({ microphones, cameras })

            // Set default devices (prefer internal/built-in)
            const defaultMic = microphones.find(m => 
                m.label.toLowerCase().includes('internal') || 
                m.label.toLowerCase().includes('built-in') ||
                m.label.toLowerCase().includes('default')
            ) || microphones[0]

            const defaultCam = cameras.find(c => 
                c.label.toLowerCase().includes('facetime') ||
                c.label.toLowerCase().includes('integrated') ||
                c.label.toLowerCase().includes('built-in')
            ) || cameras[0]

            setSelectedDevices(prev => ({
                ...prev,
                microphone: defaultMic?.deviceId || '',
                camera: defaultCam?.deviceId || ''
            }))

            console.log('Available microphones:', microphones)
            console.log('Available cameras:', cameras)
            console.log('Default microphone:', defaultMic?.label)
            console.log('Default camera:', defaultCam?.label)
        } catch (error) {
            console.error('Error enumerating devices:', error)
            toast.error('Failed to access media devices')
        }
    }

    const openDeviceSetup = () => {
        setShowDeviceSetup(true)
        enumerateDevices()
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
            console.log('Starting screen recording with separate webcam and microphone...')
            console.log('Selected devices:', selectedDevices)

            // Request screen stream (without system audio for now, we'll add microphone separately)
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: { width: { ideal: 1920 }, height: { ideal: 1080 } },
                audio: false // We'll add microphone audio separately
            })
            console.log('Screen stream obtained:', screenStream)

            // Add microphone audio if enabled
            if (selectedDevices.includeMicrophone && selectedDevices.microphone) {
                try {
                    const audioStream = await navigator.mediaDevices.getUserMedia({
                        audio: {
                            deviceId: selectedDevices.microphone ? { exact: selectedDevices.microphone } : undefined,
                            echoCancellation: true,
                            noiseSuppression: true,
                            autoGainControl: true
                        }
                    })
                    console.log('Microphone stream obtained:', audioStream)
                    
                    // Combine screen video with microphone audio
                    const audioTrack = audioStream.getAudioTracks()[0]
                    screenStream.addTrack(audioTrack)
                    console.log('Added microphone audio to screen stream')
                } catch (audioError) {
                    console.warn('Microphone not available:', audioError)
                    toast.warning('Could not access microphone, recording without audio')
                }
            }

            streamRef.current = screenStream

            // Request webcam stream separately if enabled
            let webcamStream: MediaStream | null = null
            if (selectedDevices.includeWebcam && selectedDevices.camera) {
                try {
                    webcamStream = await navigator.mediaDevices.getUserMedia({
                        video: {
                            deviceId: selectedDevices.camera ? { exact: selectedDevices.camera } : undefined,
                            width: { ideal: 640 },
                            height: { ideal: 480 }
                        },
                        audio: false
                    })
                    console.log('Webcam stream obtained:', webcamStream)
                    webcamStreamRef.current = webcamStream
                } catch (webcamError) {
                    console.warn('Webcam not available:', webcamError)
                    toast.warning('Could not access webcam, recording screen only')
                }
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

            // Close device setup
            setShowDeviceSetup(false)

            toast.success('Recording started!')

        } catch (error) {
            console.error('Error starting recording:', error)
            toast.error('Failed to start recording. Please check permissions.')
        }
    }, [onVideoRecorded, onStartRecording, selectedDevices])

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
        <Card className="w-full max-w-5xl mx-auto shadow-2xl border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Video className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                                Screen Recorder
                            </h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400 font-normal mt-0.5">
                                Record your screen with webcam and audio
                            </p>
                        </div>
                    </CardTitle>
                    {isRecording && (
                        <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-full border border-red-200 dark:border-red-800">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
                            <span className="text-sm font-semibold text-red-600 dark:text-red-400">
                                Recording
                            </span>
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-8">
                {!recordedVideo ? (
                    <div className="space-y-8">
                        {/* Recording Timer */}
                        {isRecording && (
                            <div className="flex flex-col items-center justify-center py-8 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/10 dark:to-orange-900/10 rounded-2xl border border-red-200 dark:border-red-800/50">
                                <div className="text-6xl font-bold font-mono bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-2 tracking-tight">
                                    {formatTime(recordingTime)}
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                                    {isPaused ? 'Recording Paused' : 'Recording in Progress'}
                                </p>
                            </div>
                        )}

                        {/* Device Quick Settings - Before Recording */}
                        {!isRecording && (
                            <div className="flex flex-col gap-3 max-w-md mx-auto w-full">
                                {/* Webcam Quick Setting */}
                                <button
                                    onClick={openDeviceSetup}
                                    className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-green-500 dark:hover:border-green-500 transition-all duration-200 group"
                                >
                                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                        <Camera className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="font-semibold text-gray-900 dark:text-white text-sm">
                                            {selectedDevices.includeWebcam ? 'Webcam Enabled' : 'Webcam Disabled'}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {selectedDevices.includeWebcam && selectedDevices.camera
                                                ? availableDevices.cameras.find(c => c.deviceId === selectedDevices.camera)?.label || 'Select camera'
                                                : 'Click to configure'}
                                        </div>
                                    </div>
                                    <ChevronDown className="h-5 w-5 text-gray-400 group-hover:text-green-500 transition-colors -rotate-90" />
                                </button>

                                {/* Microphone Quick Setting */}
                                <button
                                    onClick={openDeviceSetup}
                                    className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-purple-500 dark:hover:border-purple-500 transition-all duration-200 group"
                                >
                                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                                        <Mic className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <div className="font-semibold text-gray-900 dark:text-white text-sm">
                                            {selectedDevices.includeMicrophone ? 'Microphone Enabled' : 'Microphone Disabled'}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {selectedDevices.includeMicrophone && selectedDevices.microphone
                                                ? availableDevices.microphones.find(m => m.deviceId === selectedDevices.microphone)?.label || 'Select microphone'
                                                : 'Click to configure'}
                                        </div>
                                    </div>
                                    <ChevronDown className="h-5 w-5 text-gray-400 group-hover:text-purple-500 transition-colors -rotate-90" />
                                </button>
                            </div>
                        )}

                        {/* Control Buttons */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex justify-center gap-3 w-full max-w-md">
                                {!isRecording ? (
                                    <>
                                        <Button
                                            onClick={startRecording}
                                            size="lg"
                                            className="flex-1 gap-3 h-14 bg-gradient-to-r from-red-600 via-red-600 to-red-700 hover:from-red-700 hover:via-red-700 hover:to-red-800 text-white shadow-xl hover:shadow-2xl hover:shadow-red-500/30 transition-all duration-300 hover:scale-105 font-semibold text-base"
                                        >
                                            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                                                <Play className="h-4 w-4 ml-0.5" />
                                            </div>
                                            Start Recording
                                        </Button>
                                        <Button
                                            onClick={openDeviceSetup}
                                            variant="outline"
                                            size="lg"
                                            className="gap-2 h-14 border-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
                                            title="Recording Settings"
                                        >
                                            <Settings className="h-5 w-5" />
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            onClick={togglePause}
                                            variant="outline"
                                            size="lg"
                                            className="flex-1 gap-2 h-14 border-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 font-medium"
                                        >
                                            {isPaused ? (
                                                <>
                                                    <Play className="h-5 w-5" />
                                                    Resume
                                                </>
                                            ) : (
                                                <>
                                                    <Pause className="h-5 w-5" />
                                                    Pause
                                                </>
                                            )}
                                        </Button>
                                        <Button 
                                            onClick={stopRecording} 
                                            variant="destructive" 
                                            size="lg" 
                                            className="flex-1 gap-2 h-14 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl transition-all duration-200 font-medium"
                                        >
                                            <Square className="h-5 w-5 fill-current" />
                                            Stop Recording
                                        </Button>
                                    </>
                                )}
                            </div>
                            
                            {/* Helper Text */}
                            {!isRecording && (
                                <div className="text-center space-y-3 max-w-md">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Configure your devices above, then click <span className="font-semibold text-red-600 dark:text-red-400">Start Recording</span>
                                    </p>
                                    <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                                        <Settings className="h-3.5 w-3.5" />
                                        <span>Use the gear icon for advanced settings</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Video Preview */}
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-700 bg-black">
                            <video
                                ref={videoRef}
                                src={recordedVideo}
                                controls
                                className="w-full"
                                style={{ maxHeight: '500px' }}
                            />
                            <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full border border-white/20 font-medium">
                                Preview
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-center gap-3">
                            <Button
                                onClick={handleUpload}
                                disabled={isUploading}
                                size="lg"
                                className="gap-2 h-12 px-8 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-medium disabled:opacity-50"
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
                                className="gap-2 h-12 px-6 border-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200 font-medium"
                            >
                                <Video className="h-4 w-4" />
                                Record Again
                            </Button>
                        </div>
                    </div>
                )}

                {/* Device Setup Modal */}
                {showDeviceSetup && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
                        <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border-0 animate-in zoom-in-95 duration-200">
                            <CardHeader className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                                            <Settings className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold">Recording Setup</h3>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 font-normal mt-0.5">
                                                Configure your recording devices
                                            </p>
                                        </div>
                                    </CardTitle>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowDeviceSetup(false)}
                                        className="h-8 w-8 p-0 hover:bg-white/50 dark:hover:bg-gray-800/50"
                                    >
                                        ×
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6 p-6">
                                {/* Screen Recording Info */}
                                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-5 shadow-sm">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                                            <Monitor className="h-6 w-6 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-blue-900 dark:text-blue-100 mb-1.5 text-base">
                                                Screen Recording
                                            </h4>
                                            <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
                                                You'll be prompted to select which screen or window to record when you start.
                                            </p>
                                        </div>
                                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>

                                {/* Microphone Selection */}
                                <div className="space-y-4 p-5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center gap-3 font-semibold text-base">
                                            <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-md">
                                                <Mic className="h-4 w-4 text-white" />
                                            </div>
                                            Microphone
                                        </label>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedDevices.includeMicrophone}
                                                onChange={(e) => setSelectedDevices(prev => ({
                                                    ...prev,
                                                    includeMicrophone: e.target.checked
                                                }))}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                                        </label>
                                    </div>
                                    {selectedDevices.includeMicrophone && (
                                        <div className="relative">
                                            <Mic className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <select
                                                value={selectedDevices.microphone}
                                                onChange={(e) => setSelectedDevices(prev => ({
                                                    ...prev,
                                                    microphone: e.target.value
                                                }))}
                                                className="w-full pl-11 pr-10 py-3.5 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-xl appearance-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium text-sm shadow-sm"
                                            >
                                                {availableDevices.microphones.length === 0 ? (
                                                    <option>No microphones found</option>
                                                ) : (
                                                    availableDevices.microphones.map(device => (
                                                        <option key={device.deviceId} value={device.deviceId}>
                                                            {device.label}
                                                        </option>
                                                    ))
                                                )}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                        </div>
                                    )}
                                    {selectedDevices.includeMicrophone && availableDevices.microphones.length === 0 && (
                                        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                                                No microphones detected. Please connect a microphone or check permissions.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Webcam Selection */}
                                <div className="space-y-4 p-5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center gap-3 font-semibold text-base">
                                            <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md">
                                                <Camera className="h-4 w-4 text-white" />
                                            </div>
                                            Webcam
                                        </label>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedDevices.includeWebcam}
                                                onChange={(e) => setSelectedDevices(prev => ({
                                                    ...prev,
                                                    includeWebcam: e.target.checked
                                                }))}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                                        </label>
                                    </div>
                                    {selectedDevices.includeWebcam && (
                                        <div className="relative">
                                            <Camera className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <select
                                                value={selectedDevices.camera}
                                                onChange={(e) => setSelectedDevices(prev => ({
                                                    ...prev,
                                                    camera: e.target.value
                                                }))}
                                                className="w-full pl-11 pr-10 py-3.5 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 rounded-xl appearance-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all font-medium text-sm shadow-sm"
                                            >
                                                {availableDevices.cameras.length === 0 ? (
                                                    <option>No cameras found</option>
                                                ) : (
                                                    availableDevices.cameras.map(device => (
                                                        <option key={device.deviceId} value={device.deviceId}>
                                                            {device.label}
                                                        </option>
                                                    ))
                                                )}
                                            </select>
                                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                        </div>
                                    )}
                                    {selectedDevices.includeWebcam && availableDevices.cameras.length === 0 && (
                                        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                                            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">
                                                No cameras detected. Please connect a webcam or check permissions.
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Recording Summary */}
                                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl p-5 border-2 border-gray-200 dark:border-gray-700 shadow-sm">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <h4 className="font-bold text-gray-900 dark:text-white">
                                            Ready to Record
                                        </h4>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 p-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                                            <Monitor className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Screen recording</span>
                                        </div>
                                        {selectedDevices.includeMicrophone && selectedDevices.microphone && (
                                            <div className="flex items-center gap-3 p-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                                                <Mic className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                                                    {availableDevices.microphones.find(m => m.deviceId === selectedDevices.microphone)?.label}
                                                </span>
                                            </div>
                                        )}
                                        {selectedDevices.includeWebcam && selectedDevices.camera && (
                                            <div className="flex items-center gap-3 p-2.5 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                                                <Camera className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                                                    {availableDevices.cameras.find(c => c.deviceId === selectedDevices.camera)?.label}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3 pt-2">
                                    <Button
                                        onClick={() => setShowDeviceSetup(false)}
                                        variant="outline"
                                        size="lg"
                                        className="flex-1 h-12 border-2 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={startRecording}
                                        size="lg"
                                        className="flex-1 h-12 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white gap-2 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={
                                            (selectedDevices.includeMicrophone && !selectedDevices.microphone) ||
                                            (selectedDevices.includeWebcam && !selectedDevices.camera)
                                        }
                                    >
                                        <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                                            <Play className="h-3 w-3 ml-0.5" />
                                        </div>
                                        Start Recording
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
