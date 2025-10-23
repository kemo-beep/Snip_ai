import { useState, useRef, useEffect, useCallback, useMemo } from 'react'

interface UseVideoPlayerProps {
    videoUrl: string
    webcamUrl?: string
    onVideoReady: (duration: number) => void
}

interface VideoPlayerState {
    isPlaying: boolean
    currentTime: number
    duration: number
    isVideoReady: boolean
    forceReady: boolean
}

export const useVideoPlayer = ({ videoUrl, webcamUrl, onVideoReady }: UseVideoPlayerProps) => {
    const videoRef = useRef<HTMLVideoElement>(null)
    const webcamVideoRef = useRef<HTMLVideoElement>(null)
    const currentTimeRef = useRef(0)
    const lastUpdateTimeRef = useRef(0)

    const [state, setState] = useState<VideoPlayerState>({
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        isVideoReady: false,
        forceReady: false
    })

    const [videoLoadTimeout, setVideoLoadTimeout] = useState<NodeJS.Timeout | null>(null)

    const updateState = useCallback((updates: Partial<VideoPlayerState>) => {
        setState(prev => ({ ...prev, ...updates }))
    }, [])

    const togglePlayPause = useCallback(() => {
        const video = videoRef.current
        const webcamVideo = webcamVideoRef.current

        if (video) {
            if (video.paused) {
                video.play()
                if (webcamVideo) webcamVideo.play()
                updateState({ isPlaying: true })
            } else {
                video.pause()
                if (webcamVideo) webcamVideo.pause()
                updateState({ isPlaying: false, currentTime: video.currentTime })
            }
        }
    }, [updateState])

    const seekTo = useCallback((time: number) => {
        const video = videoRef.current
        const webcamVideo = webcamVideoRef.current

        if (video && isFinite(time) && time >= 0 && time <= state.duration && state.isVideoReady) {
            video.currentTime = time
            if (webcamVideo) webcamVideo.currentTime = time
            currentTimeRef.current = time
            updateState({ currentTime: time })
        }
    }, [state.duration, state.isVideoReady, updateState])

    const rewind = useCallback(() => {
        seekTo(Math.max(0, state.currentTime - 5))
    }, [state.currentTime, seekTo])

    const fastForward = useCallback(() => {
        seekTo(Math.min(state.duration, state.currentTime + 5))
    }, [state.currentTime, state.duration, seekTo])

    const forceVideoReady = useCallback(() => {
        updateState({ forceReady: true, isVideoReady: true, duration: 60 })
    }, [updateState])

    // Video event handlers
    const handleLoadedMetadata = useCallback(() => {
        const video = videoRef.current
        if (video && isFinite(video.duration) && video.duration > 0) {
            updateState({ duration: video.duration, isVideoReady: true })
            onVideoReady(video.duration)
        }
    }, [updateState, onVideoReady])

    const handleTimeUpdate = useCallback(() => {
        const video = videoRef.current
        if (video) {
            const newTime = video.currentTime
            currentTimeRef.current = newTime

            // Completely disable time updates during playback to prevent re-renders
            // Only update when video is paused or when user seeks
            // This will eliminate all flickering during video playback
        }
    }, [])

    const handleCanPlay = useCallback(() => {
        const video = videoRef.current
        if (video && isFinite(video.duration) && video.duration > 0) {
            updateState({ duration: video.duration, isVideoReady: true })
            onVideoReady(video.duration)
        }
    }, [updateState, onVideoReady])

    const handleLoadStart = useCallback(() => {
        updateState({ isVideoReady: false })

        const timeout = setTimeout(() => {
            const video = videoRef.current
            if (video && video.readyState >= 1 && isFinite(video.duration) && video.duration > 0) {
                updateState({ duration: video.duration, isVideoReady: true })
                onVideoReady(video.duration)
            } else {
                updateState({ forceReady: true, isVideoReady: true, duration: 60 })
            }
        }, 3000)

        setVideoLoadTimeout(timeout)
    }, [updateState, onVideoReady])

    const handleError = useCallback(() => {
        updateState({ isVideoReady: false })
    }, [updateState])

    const handleLoadedData = useCallback(() => {
        const video = videoRef.current
        if (video && isFinite(video.duration) && video.duration > 0) {
            updateState({ duration: video.duration, isVideoReady: true })
            onVideoReady(video.duration)
        }
    }, [updateState, onVideoReady])

    const handleDurationChange = useCallback(() => {
        const video = videoRef.current
        if (video && isFinite(video.duration) && video.duration > 0) {
            updateState({ duration: video.duration, isVideoReady: true })
            onVideoReady(video.duration)
        }
    }, [updateState, onVideoReady])

    // Setup video event listeners
    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        video.load()

        // Check if video is already loaded
        if (video.readyState >= 1) {
            handleLoadedMetadata()
        } else {
            // Immediate fallback
            const immediateTimer = setTimeout(() => {
                if (video.readyState >= 1 && isFinite(video.duration) && video.duration > 0) {
                    updateState({ duration: video.duration, isVideoReady: true })
                    onVideoReady(video.duration)
                } else {
                    updateState({ isVideoReady: true })
                }
            }, 500)

            // Longer fallback
            const fallbackTimer = setTimeout(() => {
                if (video.readyState >= 1 && isFinite(video.duration) && video.duration > 0) {
                    updateState({ duration: video.duration, isVideoReady: true })
                    onVideoReady(video.duration)
                } else {
                    updateState({ isVideoReady: true })
                }
            }, 1500)

            return () => {
                clearTimeout(immediateTimer)
                clearTimeout(fallbackTimer)
            }
        }

        video.addEventListener('loadstart', handleLoadStart)
        video.addEventListener('loadedmetadata', handleLoadedMetadata)
        video.addEventListener('loadeddata', handleLoadedData)
        video.addEventListener('durationchange', handleDurationChange)
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
            video.removeEventListener('durationchange', handleDurationChange)
            video.removeEventListener('timeupdate', handleTimeUpdate)
            video.removeEventListener('canplay', handleCanPlay)
            video.removeEventListener('error', handleError)
        }
    }, [videoUrl, handleLoadStart, handleLoadedMetadata, handleLoadedData, handleDurationChange, handleTimeUpdate, handleCanPlay, handleError, videoLoadTimeout, updateState, onVideoReady])

    return {
        videoRef,
        webcamVideoRef,
        ...state,
        togglePlayPause,
        seekTo,
        rewind,
        fastForward,
        forceVideoReady
    }
}
