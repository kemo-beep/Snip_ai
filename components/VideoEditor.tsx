'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Loader2,
    RotateCcw,
    Crop,
    Settings,
    Zap,
    Undo2,
    Redo2,
    Sun,
    Moon,
    Grid3X3,
    Clock,
    Scissors
} from 'lucide-react'
import BottomTimeline from './BottomTimeline'
import AdvancedTimeline from './AdvancedTimeline'
import RightSidebar from './RightSidebar'
// import { trimVideo, addTextOverlay, convertToMP4, separateVideoStreams, overlayVideo } from '@/lib/videoProcessor'

interface VideoEditorProps {
    videoUrl: string
    onSave: (editedVideoBlob: Blob) => void
    onCancel: () => void
}

interface TrimRange {
    start: number
    end: number
}

interface Overlay {
    id: string
    type: 'text' | 'image'
    content: string
    x: number
    y: number
    width: number
    height: number
    startTime: number
    endTime: number
}

export default function VideoEditor({ videoUrl, onSave, onCancel }: VideoEditorProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [trimRange, setTrimRange] = useState<TrimRange>({ start: 0, end: 0 })
    const [overlays, setOverlays] = useState<Overlay[]>([])
    const [isProcessing, setIsProcessing] = useState(false)
    const [isVideoReady, setIsVideoReady] = useState(false)
    const [videoLoadTimeout, setVideoLoadTimeout] = useState<NodeJS.Timeout | null>(null)
    const [forceReady, setForceReady] = useState(false)
    const [isDarkMode, setIsDarkMode] = useState(true)
    const [aspectRatio, setAspectRatio] = useState('16:9')
    const [isDragging, setIsDragging] = useState(false)
    const [hoveredOverlay, setHoveredOverlay] = useState<string | null>(null)
    const [useAdvancedTimeline, setUseAdvancedTimeline] = useState(true)
    const [clips, setClips] = useState<Array<{
        id: string
        type: 'video' | 'audio' | 'effect'
        name: string
        duration: number
        startTime: number
        endTime: number
        trackId: string
        thumbnail?: string
        waveform?: number[]
        color: string
        muted?: boolean
        locked?: boolean
    }>>([])
    const [backgroundSettings, setBackgroundSettings] = useState({
        type: 'wallpaper' as 'wallpaper' | 'gradient' | 'color' | 'image',
        wallpaperIndex: 0,
        blurAmount: 0,
        padding: 3,
        borderRadius: 12,
        backgroundColor: '#000000',
        gradientColors: ['#ff6b6b', '#4ecdc4']
    })

    const handleAddClip = (clip: any) => {
        setClips(prev => [...prev, clip])
    }

    const handleRemoveClip = (clipId: string) => {
        setClips(prev => prev.filter(clip => clip.id !== clipId))
    }

    const handleUpdateClip = (clipId: string, updates: any) => {
        setClips(prev => prev.map(clip =>
            clip.id === clipId ? { ...clip, ...updates } : clip
        ))
    }

    const clearClips = () => {
        setClips([])
    }


    // Simple approach: Force video ready after a very short delay
    const [webcamVideoUrl, setWebcamVideoUrl] = useState<string | null>(null)
    const [webcamOverlayPosition, setWebcamOverlayPosition] = useState({ x: 20, y: 20 })
    const [webcamOverlaySize, setWebcamOverlaySize] = useState({ width: 200, height: 150 })

    useEffect(() => {
        const processVideo = async () => {
            try {
                const response = await fetch(videoUrl)
                const blob = await response.blob()
                // const { screen, webcam } = await separateVideoStreams(blob)
                console.log('Video stream separation disabled for now')
                // For now, just use the original video
                console.log('Using original video URL:', videoUrl)
            } catch (error) {
                console.error('Error separating video streams:', error)
            }
        }

        processVideo()
    }, [videoUrl])


    useEffect(() => {
        const video = videoRef.current
        if (video) {
            // Try to load the video immediately
            console.log('Video element found, attempting to load:', videoUrl)
            video.load()

            const addRecordedVideoClip = (duration: number) => {
                if (videoUrl) {
                    console.log('Adding recorded video as clip to timeline')
                    setClips(prev => {
                        // Check if recorded video already exists
                        const existingRecordedVideo = prev.find(clip => clip.name === 'Recorded Video')
                        if (existingRecordedVideo) {
                            console.log('Recorded video already exists in timeline')
                            return prev // Don't add duplicate
                        }

                        const recordedVideoClip = {
                            id: `recorded-video-${Date.now()}`,
                            type: 'video' as const,
                            name: 'Recorded Video',
                            duration: duration,
                            startTime: 0,
                            endTime: duration,
                            trackId: 'video-1',
                            thumbnail: videoUrl, // Use video URL as thumbnail for now
                            color: '#3b82f6', // Blue color for recorded video
                            muted: false,
                            locked: false
                        }
                        console.log('Adding new recorded video clip:', recordedVideoClip)
                        return [...prev, recordedVideoClip]
                    })
                }
            }

            const handleLoadedMetadata = () => {
                console.log('Video metadata loaded, duration:', video.duration)
                if (isFinite(video.duration) && video.duration > 0) {
                    setDuration(video.duration)
                    setTrimRange({ start: 0, end: video.duration })
                    setIsVideoReady(true)
                    addRecordedVideoClip(video.duration)
                } else {
                    console.warn('Video duration is invalid:', video.duration)
                }
            }

            const handleTimeUpdate = () => {
                setCurrentTime(video.currentTime)
            }

            const handleCanPlay = () => {
                console.log('Video can play, setting ready state')
                if (isFinite(video.duration) && video.duration > 0) {
                    setDuration(video.duration)
                    setTrimRange({ start: 0, end: video.duration })
                    setIsVideoReady(true)
                    addRecordedVideoClip(video.duration)
                } else {
                    // Fallback: Add clip with default duration
                    console.log('Using fallback duration for recorded video clip')
                    addRecordedVideoClip(10) // Default 10 seconds
                }
            }

            const handleLoadStart = () => {
                console.log('Video load started')
                setIsVideoReady(false)

                // Set a timeout to force video ready after 2 seconds
                const timeout = setTimeout(() => {
                    console.log('Video load timeout - forcing ready state')
                    setForceReady(true)
                    setIsVideoReady(true)
                    if (video.readyState >= 1 && isFinite(video.duration) && video.duration > 0) {
                        setDuration(video.duration)
                        setTrimRange({ start: 0, end: video.duration })
                        addRecordedVideoClip(video.duration)
                    } else {
                        // Even if video isn't fully loaded, show the editor with default values
                        console.log('Forcing video ready despite incomplete load')
                        setDuration(60) // Default duration
                        setTrimRange({ start: 0, end: 60 })
                        addRecordedVideoClip(60) // Add clip with default duration
                    }
                }, 2000)

                setVideoLoadTimeout(timeout)
            }

            const handleError = (e: Event) => {
                console.error('Video failed to load:', e)
                setIsVideoReady(false)
            }

            const handleLoadedData = () => {
                console.log('Video data loaded')
                if (isFinite(video.duration) && video.duration > 0) {
                    setDuration(video.duration)
                    setTrimRange({ start: 0, end: video.duration })
                    setIsVideoReady(true)
                }
            }

            // Check if video is already loaded
            if (video.readyState >= 1) {
                console.log('Video already loaded, setting ready state')
                handleLoadedMetadata()
            } else {
                // Immediate fallback: try to load the video after a very short delay
                const immediateTimer = setTimeout(() => {
                    console.log('Immediate fallback: checking video state')
                    if (video.readyState >= 1 && isFinite(video.duration) && video.duration > 0) {
                        console.log('Immediate fallback: Video loaded')
                        setDuration(video.duration)
                        setTrimRange({ start: 0, end: video.duration })
                        setIsVideoReady(true)
                    } else {
                        console.log('Immediate fallback: Video not ready, forcing ready state')
                        setForceReady(true)
                        setIsVideoReady(true)
                        setDuration(60)
                        setTrimRange({ start: 0, end: 60 })
                    }
                }, 500)

                // Longer fallback: try to load the video after a longer delay
                const fallbackTimer = setTimeout(() => {
                    if (video.readyState >= 1 && isFinite(video.duration) && video.duration > 0) {
                        console.log('Longer fallback: Video loaded after delay')
                        setDuration(video.duration)
                        setTrimRange({ start: 0, end: video.duration })
                        setIsVideoReady(true)
                    } else {
                        console.log('Longer fallback: Video not ready, forcing ready state')
                        setForceReady(true)
                        setIsVideoReady(true)
                        setDuration(60)
                        setTrimRange({ start: 0, end: 60 })
                    }
                }, 1500)
            }

            video.addEventListener('loadstart', handleLoadStart)
            video.addEventListener('loadedmetadata', handleLoadedMetadata)
            video.addEventListener('loadeddata', handleLoadedData)
            video.addEventListener('timeupdate', handleTimeUpdate)
            video.addEventListener('canplay', handleCanPlay)
            video.addEventListener('error', handleError)

            return () => {
                if (videoLoadTimeout) {
                    clearTimeout(videoLoadTimeout)
                }
                video.removeEventListener('loadstart', handleLoadStart)
                video.removeEventListener('loadedmetadata', handleLoadedMetadata)
                video.removeEventListener('loadeddata', handleLoadedData)
                video.removeEventListener('timeupdate', handleTimeUpdate)
                video.removeEventListener('canplay', handleCanPlay)
                video.removeEventListener('error', handleError)
            }
        }
    }, [videoUrl])


    const togglePlayPause = () => {
        const video = videoRef.current
        if (video) {
            if (video.paused) {
                video.play()
                setIsPlaying(true)
            } else {
                video.pause()
                setIsPlaying(false)
            }
        }
    }

    const seekTo = (time: number) => {
        const video = videoRef.current
        if (video && isFinite(time) && time >= 0 && time <= duration && isVideoReady) {
            video.currentTime = time
            setCurrentTime(time)
        }
    }

    const handleTrimStartChange = (value: number[]) => {
        const newStart = value[0]
        if (isFinite(newStart) && newStart >= 0 && newStart <= duration) {
            setTrimRange(prev => ({ ...prev, start: newStart }))
            if (newStart > currentTime) {
                seekTo(newStart)
            }
        }
    }

    const handleTrimEndChange = (value: number[]) => {
        const newEnd = value[0]
        if (isFinite(newEnd) && newEnd >= 0 && newEnd <= duration) {
            setTrimRange(prev => ({ ...prev, end: newEnd }))
            if (newEnd < currentTime) {
                seekTo(newEnd)
            }
        }
    }

    const addOverlay = (overlay: Overlay) => {
        setOverlays(prev => [...prev, overlay])
    }

    const removeOverlay = (id: string) => {
        setOverlays(prev => prev.filter(overlay => overlay.id !== id))
    }

    const exportVideo = async () => {
        setIsProcessing(true)
        try {
            // First, get the original video blobs
            const screenResponse = await fetch(videoUrl)
            const screenBlob = await screenResponse.blob()

            const webcamResponse = await fetch(webcamVideoUrl!)
            const webcamBlob = await webcamResponse.blob()

            // FFmpeg processing disabled for now
            console.log('Video processing disabled - using original video')
            let processedBlob = screenBlob

            // Apply trimming if needed (simplified)
            if (trimRange.start > 0 || trimRange.end < duration) {
                console.log('Trim processing disabled - using original video')
            }

            // Apply text overlays (simplified)
            for (const overlay of overlays) {
                if (overlay.type === 'text' && overlay.content) {
                    console.log('Text overlay processing disabled - using original video')
                }
            }

            onSave(processedBlob)
        } catch (error) {
            console.error('Video processing error:', error)
            alert('Failed to process video. Please try again.')
        } finally {
            setIsProcessing(false)
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const handleRewind = () => {
        seekTo(Math.max(0, currentTime - 5))
    }

    const handleFastForward = () => {
        seekTo(Math.min(duration, currentTime + 5))
    }

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault()
        const startX = e.clientX
        const startY = e.clientY
        const startLeft = webcamOverlayPosition.x
        const startTop = webcamOverlayPosition.y

        const handleMouseMove = (e: MouseEvent) => {
            const newX = startLeft + e.clientX - startX
            const newY = startTop + e.clientY - startY
            setWebcamOverlayPosition({ x: newX, y: newY })
        }

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
    }

    const handleResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        const startX = e.clientX
        const startY = e.clientY
        const startWidth = webcamOverlaySize.width
        const startHeight = webcamOverlaySize.height

        const handleMouseMove = (e: MouseEvent) => {
            const newWidth = startWidth + e.clientX - startX
            const newHeight = startHeight + e.clientY - startY
            setWebcamOverlaySize({ width: newWidth, height: newHeight })
        }

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
    }

    const handleCrop = () => {
        // Placeholder for crop functionality
        console.log('Crop functionality coming soon')
    }

    const getBackgroundStyle = () => {
        const { type, wallpaperIndex, blurAmount, padding, backgroundColor, gradientColors } = backgroundSettings

        let backgroundStyle = {}

        switch (type) {
            case 'wallpaper':
                backgroundStyle = {
                    background: `linear-gradient(45deg, 
                        hsl(${wallpaperIndex * 24}, 70%, 60%), 
                        hsl(${wallpaperIndex * 24 + 120}, 70%, 60%), 
                        hsl(${wallpaperIndex * 24 + 240}, 70%, 60%)
                    )`
                }
                break
            case 'gradient':
                backgroundStyle = {
                    background: `linear-gradient(45deg, ${gradientColors[0]}, ${gradientColors[1]})`
                }
                break
            case 'color':
                backgroundStyle = {
                    backgroundColor: backgroundColor
                }
                break
            case 'image':
                // For now, just use a placeholder
                backgroundStyle = {
                    background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)'
                }
                break
        }

        return {
            ...backgroundStyle,
            filter: blurAmount > 0 ? `blur(${blurAmount * 0.1}px)` : 'none'
        }
    }

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

            switch (e.key) {
                case ' ':
                    e.preventDefault()
                    togglePlayPause()
                    break
                case 'ArrowLeft':
                    e.preventDefault()
                    handleRewind()
                    break
                case 'ArrowRight':
                    e.preventDefault()
                    handleFastForward()
                    break
                case 'Escape':
                    onCancel()
                    break
                case 'e':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault()
                        exportVideo()
                    }
                    break
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [togglePlayPause, handleRewind, handleFastForward, onCancel, exportVideo])

    return (
        <div className="fixed inset-0 bg-gray-900 flex flex-col z-50 overflow-hidden">
            {/* Top Toolbar - Compact Screen Studio Style */}
            <div className="bg-gray-800/95 backdrop-blur-sm border-b border-gray-700 px-3 py-2 shadow-lg">
                <div className="flex items-center justify-between">
                    {/* Left Section */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onCancel}
                            className="text-gray-400 hover:text-white h-7 px-2 transition-all duration-200 hover:bg-gray-700 hover:scale-105"
                            title="Back to main view (Esc)"
                        >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            <span className="text-xs">Back</span>
                        </Button>
                        <div className="h-4 w-px bg-gray-600" />
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white h-7 px-2">
                            <Settings className="h-3 w-3" />
                        </Button>
                    </div>

                    {/* Center - Project Name */}
                    <div className="flex items-center gap-1">
                        <span className="text-white font-medium text-sm">Video Recording</span>
                        <span className="text-gray-400 text-sm">.screenstudio</span>
                    </div>

                    {/* Right Section */}
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white h-7 w-7 p-0">
                            <Undo2 className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white h-7 w-7 p-0">
                            <Redo2 className="h-3 w-3" />
                        </Button>
                        <div className="h-4 w-px bg-gray-600" />
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white h-7 w-7 p-0">
                            {isDarkMode ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white h-7 px-2">
                            <Zap className="h-3 w-3 mr-1" />
                            <span className="text-xs">Presets</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white h-7 w-7 p-0">
                            <Grid3X3 className="h-3 w-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-white h-7 w-7 p-0"
                            onClick={() => setUseAdvancedTimeline(!useAdvancedTimeline)}
                            title={useAdvancedTimeline ? "Switch to simple timeline" : "Switch to advanced timeline"}
                        >
                            <Clock className="h-3 w-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-white h-7 px-2"
                            onClick={() => {
                                console.log('Debug: Force video ready')
                                setForceReady(true)
                                setIsVideoReady(true)
                                setDuration(60)
                                setTrimRange({ start: 0, end: 60 })
                            }}
                            title="Force video ready (debug)"
                        >
                            <span className="text-xs">Force Ready</span>
                        </Button>
                        <div className="h-4 w-px bg-gray-600" />
                        <Button
                            onClick={exportVideo}
                            disabled={isProcessing}
                            className="bg-purple-600 hover:bg-purple-700 text-white h-7 px-3 transition-all duration-200 hover:scale-105 hover:shadow-lg disabled:opacity-50"
                            title="Export video (Ctrl+E)"
                        >
                            {isProcessing ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                                <Zap className="h-3 w-3 mr-1" />
                            )}
                            <span className="text-xs">Export</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex min-h-0">
                {/* Video Preview - Left Side */}
                <div className="flex-1 bg-gray-900 flex items-center justify-center min-h-0 p-4">
                    <div
                        className={`relative bg-black overflow-hidden shadow-2xl border border-gray-700 transition-all duration-300 ${isDragging ? 'scale-105 shadow-3xl' : 'hover:shadow-3xl'
                            }`}
                        style={{
                            ...getBackgroundStyle(),
                            aspectRatio: aspectRatio === '16:9' ? '16/9' :
                                aspectRatio === '4:3' ? '4/3' :
                                    aspectRatio === '1:1' ? '1/1' :
                                        aspectRatio === '21:9' ? '21/9' :
                                            aspectRatio === '9:16' ? '9/16' : '16/9',
                            maxWidth: '100%',
                            maxHeight: '100%',
                            width: 'fit-content',
                            height: 'fit-content',
                            minWidth: '300px',
                            minHeight: '200px',
                            borderRadius: `${backgroundSettings.borderRadius}px`
                        }}
                    >
                        <div
                            className="w-full h-full relative"
                            style={{
                                padding: backgroundSettings.padding > 0 ? `${backgroundSettings.padding}%` : '0'
                            }}
                        >
                            <video
                                ref={videoRef}
                                src={videoUrl}
                                className="w-full h-full object-cover transition-all duration-200 hover:brightness-110"
                                style={{
                                    aspectRatio: aspectRatio === '16:9' ? '16/9' :
                                        aspectRatio === '4:3' ? '4/3' :
                                            aspectRatio === '1:1' ? '1/1' :
                                                aspectRatio === '21:9' ? '21/9' :
                                                    aspectRatio === '9:16' ? '9/16' : '16/9',
                                    borderRadius: `${backgroundSettings.borderRadius}px`
                                }}
                                onMouseEnter={() => setIsDragging(true)}
                                onMouseLeave={() => setIsDragging(false)}
                                onLoadStart={() => console.log('Video load started')}
                                onLoadedMetadata={() => {
                                    console.log('Video metadata loaded')
                                    if (videoRef.current && isFinite(videoRef.current.duration) && videoRef.current.duration > 0) {
                                        setDuration(videoRef.current.duration)
                                        setTrimRange({ start: 0, end: videoRef.current.duration })
                                        setIsVideoReady(true)
                                    }
                                }}
                                onCanPlay={() => {
                                    console.log('Video can play')
                                    setIsVideoReady(true)
                                }}
                                onError={(e) => {
                                    console.error('Video error:', e)
                                    // Force ready even on error
                                    setForceReady(true)
                                    setIsVideoReady(true)
                                }}
                            />
                        </div>
                        {!isVideoReady && !forceReady && (
                            <div
                                className="absolute inset-0 bg-gray-900 bg-opacity-80 backdrop-blur-sm flex items-center justify-center"
                                style={{ borderRadius: `${backgroundSettings.borderRadius}px` }}
                            >
                                <div className="text-white text-center">
                                    <div className="relative">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-purple-400" />
                                        <div className="absolute inset-0 h-8 w-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                    <p className="text-sm font-medium">Loading video...</p>
                                    <p className="text-xs text-gray-400 mt-1">Preparing your content</p>
                                    <Button
                                        onClick={() => {
                                            console.log('Force ready clicked')
                                            setForceReady(true)
                                            setIsVideoReady(true)
                                            setDuration(60) // Default duration
                                            setTrimRange({ start: 0, end: 60 })
                                        }}
                                        className="mt-4 bg-purple-600 hover:bg-purple-700 text-white"
                                        size="sm"
                                    >
                                        Skip Loading
                                    </Button>
                                </div>
                            </div>
                        )}

                        {webcamVideoUrl && (
                            <div
                                className="absolute border-2 border-blue-400 bg-black rounded-lg overflow-hidden"
                                style={{
                                    left: `${webcamOverlayPosition.x}px`,
                                    top: `${webcamOverlayPosition.y}px`,
                                    width: `${webcamOverlaySize.width}px`,
                                    height: `${webcamOverlaySize.height}px`,
                                    cursor: 'move'
                                }}
                                onMouseDown={handleMouseDown}
                            >
                                <video
                                    src={webcamVideoUrl}
                                    className="w-full h-full object-cover"
                                    autoPlay
                                    muted
                                    loop
                                />
                                <div className="absolute bottom-0 right-0 w-4 h-4 bg-blue-400 cursor-se-resize" onMouseDown={handleResizeMouseDown}></div>
                            </div>
                        )}

                        {/* Overlays */}
                        {overlays.map(overlay => (
                            <div
                                key={overlay.id}
                                className={`absolute border-2 border-blue-400 bg-blue-400/20 rounded-lg p-2 transition-all duration-200 group cursor-move ${currentTime >= overlay.startTime && currentTime <= overlay.endTime ? 'opacity-100' : 'opacity-50'
                                    } ${hoveredOverlay === overlay.id ? 'scale-105 shadow-lg border-blue-300' : 'hover:scale-102'}`}
                                style={{
                                    left: `${overlay.x}px`,
                                    top: `${overlay.y}px`,
                                    width: `${overlay.width}px`,
                                    height: `${overlay.height}px`
                                }}
                                onMouseEnter={() => setHoveredOverlay(overlay.id)}
                                onMouseLeave={() => setHoveredOverlay(null)}
                            >
                                {overlay.type === 'text' ? (
                                    <span className="text-white font-medium text-sm">{overlay.content}</span>
                                ) : (
                                    <img src={overlay.content} alt="Overlay" className="w-full h-full object-cover rounded" />
                                )}
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
                                    onClick={() => removeOverlay(overlay.id)}
                                >
                                    ×
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="w-64 bg-gray-800 border-l border-gray-700 flex min-h-0">
                    <RightSidebar
                        overlays={overlays}
                        onAddOverlay={addOverlay}
                        onRemoveOverlay={removeOverlay}
                        currentTime={currentTime}
                        duration={duration}
                        formatTime={formatTime}
                        backgroundSettings={backgroundSettings}
                        onBackgroundChange={setBackgroundSettings}
                        clips={clips}
                        onAddClip={handleAddClip}
                        onRemoveClip={handleRemoveClip}
                        onUpdateClip={handleUpdateClip}
                        webcamOverlayPosition={webcamOverlayPosition}
                        setWebcamOverlayPosition={setWebcamOverlayPosition}
                        webcamOverlaySize={webcamOverlaySize}
                        setWebcamOverlaySize={setWebcamOverlaySize}
                    />
                </div>
            </div>

            {/* Bottom Timeline */}
            <div className="flex-shrink-0">
                {useAdvancedTimeline ? (
                    <AdvancedTimeline
                        isPlaying={isPlaying}
                        currentTime={currentTime}
                        duration={duration}
                        onPlayPause={togglePlayPause}
                        onSeek={seekTo}
                        onRewind={handleRewind}
                        onFastForward={handleFastForward}
                        isVideoReady={isVideoReady}
                        aspectRatio={aspectRatio}
                        onCrop={handleCrop}
                        onAspectRatioChange={setAspectRatio}
                        clips={clips}
                        onUpdateClip={handleUpdateClip}
                    />
                ) : (
                    <BottomTimeline
                        isPlaying={isPlaying}
                        currentTime={currentTime}
                        duration={duration}
                        trimRange={trimRange}
                        onPlayPause={togglePlayPause}
                        onSeek={seekTo}
                        onTrimStartChange={handleTrimStartChange}
                        onTrimEndChange={handleTrimEndChange}
                        onRewind={handleRewind}
                        onFastForward={handleFastForward}
                        onCrop={handleCrop}
                        onAspectRatioChange={setAspectRatio}
                        isVideoReady={isVideoReady}
                        aspectRatio={aspectRatio}
                    />
                )}
            </div>

            {/* Hidden canvas for video processing */}
            <canvas ref={canvasRef} className="hidden" />
        </div>
    )
}