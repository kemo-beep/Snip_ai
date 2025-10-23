import { useRef, useCallback, useEffect } from 'react'
import { useVideoEditorStore } from '@/stores/videoEditorStore'

// Custom hook that provides the same interface as the original hooks
// but uses Zustand store to prevent re-renders
export const useVideoEditorStore = () => {
    const videoRef = useRef<HTMLVideoElement>(null)
    const webcamVideoRef = useRef<HTMLVideoElement>(null)
    const currentTimeRef = useRef(0)
    const lastUpdateTimeRef = useRef(0)

    // Get state and actions from Zustand store
    const {
        videoPlayer,
        clips,
        webcamOverlay,
        annotations,
        isProcessing,
        isDarkMode,
        aspectRatio,
        backgroundSettings,
        showExportDialog,
        currentColorPreset,
        currentAspectRatio,
        currentBrandKit,
        colorGradingFilters,
        enhancementConfig,
        enhancementSettings,
        setVideoPlayer,
        setClips,
        addClip,
        updateClip,
        deleteClip,
        duplicateClip,
        addRecordedVideoClip,
        addWebcamClip,
        setWebcamOverlay,
        setWebcamVideoUrl,
        setWebcamOverlayPosition,
        setWebcamOverlaySize,
        setWebcamSettings,
        setAnnotations,
        addAnnotation,
        updateAnnotation,
        removeAnnotation,
        setSelectedAnnotation,
        setSelectedAnnotationTool,
        setAnnotationColor,
        setAnnotationStrokeWidth,
        setAnnotationFontSize,
        setProcessing,
        setDarkMode,
        setAspectRatio,
        setBackgroundSettings,
        setShowExportDialog,
        setCurrentColorPreset,
        setCurrentAspectRatio,
        setCurrentBrandKit,
        setColorGradingFilters,
        setEnhancementConfig,
        setEnhancementSettings
    } = useVideoEditorStore()

    // Video player actions
    const togglePlayPause = useCallback(() => {
        const video = videoRef.current
        const webcamVideo = webcamVideoRef.current

        if (video) {
            if (video.paused) {
                video.play()
                if (webcamVideo) webcamVideo.play()
                setVideoPlayer({ isPlaying: true })
            } else {
                video.pause()
                if (webcamVideo) webcamVideo.pause()
                setVideoPlayer({ isPlaying: false, currentTime: video.currentTime })
            }
        }
    }, [setVideoPlayer])

    const seekTo = useCallback((time: number) => {
        const video = videoRef.current
        const webcamVideo = webcamVideoRef.current

        if (video && isFinite(time) && time >= 0 && time <= videoPlayer.duration && videoPlayer.isVideoReady) {
            video.currentTime = time
            if (webcamVideo) webcamVideo.currentTime = time
            currentTimeRef.current = time
            setVideoPlayer({ currentTime: time })
        }
    }, [videoPlayer.duration, videoPlayer.isVideoReady, setVideoPlayer])

    const rewind = useCallback(() => {
        seekTo(Math.max(0, videoPlayer.currentTime - 5))
    }, [videoPlayer.currentTime, seekTo])

    const fastForward = useCallback(() => {
        seekTo(Math.min(videoPlayer.duration, videoPlayer.currentTime + 5))
    }, [videoPlayer.currentTime, videoPlayer.duration, seekTo])

    const forceVideoReady = useCallback(() => {
        setVideoPlayer({ forceReady: true, isVideoReady: true, duration: 60 })
    }, [setVideoPlayer])

    // Video event handlers
    const handleLoadedMetadata = useCallback(() => {
        const video = videoRef.current
        if (video && isFinite(video.duration) && video.duration > 0) {
            setVideoPlayer({ duration: video.duration, isVideoReady: true })
        }
    }, [setVideoPlayer])

    const handleTimeUpdate = useCallback(() => {
        const video = videoRef.current
        if (video) {
            const newTime = video.currentTime
            currentTimeRef.current = newTime

            // Only update state when paused to prevent re-renders during playback
            if (!videoPlayer.isPlaying) {
                setVideoPlayer({ currentTime: newTime })
            }
        }
    }, [videoPlayer.isPlaying, setVideoPlayer])

    const handleCanPlay = useCallback(() => {
        const video = videoRef.current
        if (video && isFinite(video.duration) && video.duration > 0) {
            setVideoPlayer({ duration: video.duration, isVideoReady: true })
        }
    }, [setVideoPlayer])

    const handleLoadStart = useCallback(() => {
        setVideoPlayer({ isVideoReady: false })
    }, [setVideoPlayer])

    const handleError = useCallback(() => {
        setVideoPlayer({ isVideoReady: false })
    }, [setVideoPlayer])

    // Webcam overlay actions
    const handleWebcamMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()

        const startX = e.clientX
        const startY = e.clientY
        const startLeft = webcamOverlay.webcamOverlayPosition.x
        const startTop = webcamOverlay.webcamOverlayPosition.y

        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = ((e.clientX - startX) / window.innerWidth) * 100
            const deltaY = ((e.clientY - startY) / window.innerHeight) * 100

            setWebcamOverlayPosition({
                x: Math.max(0, Math.min(100, startLeft + deltaX)),
                y: Math.max(0, Math.min(100, startTop + deltaY))
            })
        }

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
    }, [webcamOverlay.webcamOverlayPosition, setWebcamOverlayPosition])

    const handleWebcamResizeMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()

        const startX = e.clientX
        const startY = e.clientY
        const startWidth = webcamOverlay.webcamOverlaySize.width
        const startHeight = webcamOverlay.webcamOverlaySize.height

        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - startX
            const deltaY = e.clientY - startY

            setWebcamOverlaySize({
                width: Math.max(50, startWidth + deltaX),
                height: Math.max(50, startHeight + deltaY)
            })
        }

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
    }, [webcamOverlay.webcamOverlaySize, setWebcamOverlaySize])

    // Annotation actions
    const handleAnnotationMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>, annotationId: string) => {
        e.preventDefault()
        e.stopPropagation()
        setSelectedAnnotation(annotationId)

        const annotation = annotations.annotations.find(a => a.id === annotationId)
        if (!annotation) return

        const startX = e.clientX
        const startY = e.clientY
        const startLeft = annotation.x
        const startTop = annotation.y

        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = ((e.clientX - startX) / window.innerWidth) * 100
            const deltaY = ((e.clientY - startY) / window.innerHeight) * 100

            updateAnnotation(annotationId, {
                x: Math.max(0, Math.min(100, startLeft + deltaX)),
                y: Math.max(0, Math.min(100, startTop + deltaY))
            })
        }

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
    }, [annotations.annotations, setSelectedAnnotation, updateAnnotation])

    const handleAnnotationResize = useCallback((e: React.MouseEvent<HTMLDivElement>, annotationId: string) => {
        e.preventDefault()
        e.stopPropagation()

        const annotation = annotations.annotations.find(a => a.id === annotationId)
        if (!annotation || !annotation.width || !annotation.height) return

        const startX = e.clientX
        const startY = e.clientY
        const startWidth = annotation.width
        const startHeight = annotation.height

        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - startX
            const deltaY = e.clientY - startY

            updateAnnotation(annotationId, {
                width: Math.max(50, startWidth + deltaX),
                height: Math.max(30, startHeight + deltaY)
            })
        }

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
    }, [annotations.annotations, updateAnnotation])

    // Setup video event listeners
    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        video.load()

        // Check if video is already loaded
        if (video.readyState >= 1) {
            handleLoadedMetadata()
        }

        video.addEventListener('loadstart', handleLoadStart)
        video.addEventListener('loadedmetadata', handleLoadedMetadata)
        video.addEventListener('timeupdate', handleTimeUpdate)
        video.addEventListener('canplay', handleCanPlay)
        video.addEventListener('error', handleError)

        return () => {
            video.removeEventListener('loadstart', handleLoadStart)
            video.removeEventListener('loadedmetadata', handleLoadedMetadata)
            video.removeEventListener('timeupdate', handleTimeUpdate)
            video.removeEventListener('canplay', handleCanPlay)
            video.removeEventListener('error', handleError)
        }
    }, [handleLoadStart, handleLoadedMetadata, handleTimeUpdate, handleCanPlay, handleError])

    return {
        // Refs
        videoRef,
        webcamVideoRef,

        // Video player state
        isPlaying: videoPlayer.isPlaying,
        currentTime: videoPlayer.currentTime,
        duration: videoPlayer.duration,
        isVideoReady: videoPlayer.isVideoReady,
        forceReady: videoPlayer.forceReady,

        // Video player actions
        togglePlayPause,
        seekTo,
        rewind,
        fastForward,
        forceVideoReady,

        // Clips
        clips,
        addClip,
        updateClip,
        deleteClip,
        duplicateClip,
        addRecordedVideoClip,
        addWebcamClip,

        // Webcam overlay
        webcamVideoUrl: webcamOverlay.webcamVideoUrl,
        webcamOverlayPosition: webcamOverlay.webcamOverlayPosition,
        webcamOverlaySize: webcamOverlay.webcamOverlaySize,
        webcamSettings: webcamOverlay.webcamSettings,
        setWebcamVideoUrl,
        setWebcamOverlayPosition,
        setWebcamOverlaySize,
        setWebcamSettings,
        handleWebcamMouseDown,
        handleWebcamResizeMouseDown,

        // Annotations
        annotations: annotations.annotations,
        selectedAnnotation: annotations.selectedAnnotation,
        selectedAnnotationTool: annotations.selectedAnnotationTool,
        annotationColor: annotations.annotationColor,
        annotationStrokeWidth: annotations.annotationStrokeWidth,
        annotationFontSize: annotations.annotationFontSize,
        setSelectedAnnotation,
        setSelectedAnnotationTool,
        setAnnotationColor,
        setAnnotationStrokeWidth,
        setAnnotationFontSize,
        addAnnotation,
        updateAnnotation,
        removeAnnotation,
        handleAnnotationMouseDown,
        handleAnnotationResize,

        // UI state
        isProcessing,
        isDarkMode,
        aspectRatio,
        backgroundSettings,
        showExportDialog,
        setProcessing,
        setDarkMode,
        setAspectRatio,
        setBackgroundSettings,
        setShowExportDialog,

        // Template state
        currentColorPreset,
        currentAspectRatio,
        currentBrandKit,
        colorGradingFilters,
        setCurrentColorPreset,
        setCurrentAspectRatio,
        setCurrentBrandKit,
        setColorGradingFilters,

        // Enhancement state
        enhancementConfig,
        enhancementSettings,
        setEnhancementConfig,
        setEnhancementSettings
    }
}
