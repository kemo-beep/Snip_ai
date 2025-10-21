'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from './ui/button'
import { Slider } from './ui/slider'
import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    ZoomIn,
    ZoomOut,
    Grid3X3,
    Scissors,
    Copy,
    Trash2,
    Lock,
    Volume2,
    VolumeX,
    Eye,
    EyeOff,
    Move,
    RotateCcw,
    RotateCw
} from 'lucide-react'

interface Clip {
    id: string
    type: 'video' | 'audio' | 'effect'
    name: string
    startTime: number
    endTime: number
    trackId: string
    color: string
    thumbnail?: string
    waveform?: number[]
    muted?: boolean
    locked?: boolean
    effects?: Effect[]
}

interface Effect {
    id: string
    type: 'fadeIn' | 'fadeOut' | 'opacity' | 'volume'
    startTime: number
    endTime: number
    value: number
}

interface Track {
    id: string
    name: string
    type: 'video' | 'audio'
    muted: boolean
    solo: boolean
    locked: boolean
    height: number
    clips: Clip[]
}

interface Marker {
    id: string
    time: number
    label: string
    color: string
}

interface Clip {
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
}

interface AdvancedTimelineProps {
    isPlaying: boolean
    currentTime: number
    duration: number
    onPlayPause: () => void
    onSeek: (time: number) => void
    onRewind: () => void
    onFastForward: () => void
    isVideoReady: boolean
    aspectRatio: string
    onCrop: () => void
    onAspectRatioChange: (ratio: string) => void
    clips: Clip[]
    onUpdateClip: (clipId: string, updates: Partial<Clip>) => void
}

export default function AdvancedTimeline({
    isPlaying,
    currentTime,
    duration,
    onPlayPause,
    onSeek,
    onRewind,
    onFastForward,
    isVideoReady,
    aspectRatio,
    onCrop,
    onAspectRatioChange,
    clips,
    onUpdateClip
}: AdvancedTimelineProps) {
    const [zoom, setZoom] = useState(1)
    const [pan, setPan] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const [selectedClips, setSelectedClips] = useState<string[]>([])
    const [isSnapping, setIsSnapping] = useState(true)
    const [showGrid, setShowGrid] = useState(true)
    const [hoveredClip, setHoveredClip] = useState<string | null>(null)
    const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null)
    const [isMultiSelecting, setIsMultiSelecting] = useState(false)
    const [selectionBox, setSelectionBox] = useState<{ start: { x: number; y: number }; end: { x: number; y: number } } | null>(null)
    const [clipPreview, setClipPreview] = useState<{ clipId: string; time: number } | null>(null)

    // Enhanced scrolling and interaction state
    const [isScrolling, setIsScrolling] = useState(false)
    const [scrollVelocity, setScrollVelocity] = useState(0)
    const [lastScrollTime, setLastScrollTime] = useState(0)
    const [isPlayheadDragging, setIsPlayheadDragging] = useState(false)
    const [isTimelineDragging, setIsTimelineDragging] = useState(false)
    const [dragStart, setDragStart] = useState<{ x: number; time: number } | null>(null)
    const [isZooming, setIsZooming] = useState(false)
    const [zoomCenter, setZoomCenter] = useState(0)
    const [momentumScroll, setMomentumScroll] = useState(0)
    const [lastPanPosition, setLastPanPosition] = useState(0)
    const [panHistory, setPanHistory] = useState<number[]>([])

    // Create tracks from clips
    const tracks: Track[] = [
        {
            id: 'video-1',
            name: 'Video Track 1',
            type: 'video',
            muted: false,
            solo: false,
            locked: false,
            height: 80,
            clips: clips.filter(clip => clip.type === 'video')
        },
        {
            id: 'audio-1',
            name: 'Audio Track 1',
            type: 'audio',
            muted: false,
            solo: false,
            locked: false,
            height: 60,
            clips: clips.filter(clip => clip.type === 'audio')
        }
    ]

    // Debug logging
    useEffect(() => {
        console.log('AdvancedTimeline received clips:', clips)
        console.log('Video clips:', clips.filter(clip => clip.type === 'video'))
        console.log('Audio clips:', clips.filter(clip => clip.type === 'audio'))
    }, [clips])
    const [markers, setMarkers] = useState<Marker[]>([])
    const [isResizing, setIsResizing] = useState<string | null>(null)
    const [resizeStart, setResizeStart] = useState<{ time: number; clipId: string; edge: 'start' | 'end' } | null>(null)

    const timelineRef = useRef<HTMLDivElement>(null)
    const playheadRef = useRef<HTMLDivElement>(null)

    // Calculate timeline dimensions
    const timelineWidth = 1200
    const pixelsPerSecond = (timelineWidth * zoom) / Math.max(duration, 1)
    const visibleStart = pan / pixelsPerSecond
    const visibleEnd = visibleStart + (timelineWidth / pixelsPerSecond)

    // Generate time markers
    const generateTimeMarkers = () => {
        const markers = []
        const interval = zoom > 2 ? 1 : zoom > 1 ? 5 : 10 // Adjust interval based on zoom
        const start = Math.floor(visibleStart / interval) * interval

        for (let i = start; i <= visibleEnd; i += interval) {
            if (i >= 0 && i <= duration) {
                markers.push({
                    time: i,
                    position: (i - visibleStart) * pixelsPerSecond,
                    label: formatTime(i)
                })
            }
        }
        return markers
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        const frames = Math.floor((seconds % 1) * 30) // Assuming 30fps
        return `${mins}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`
    }

    // Enhanced zoom with smooth animation and center point
    const handleZoom = useCallback((delta: number, centerX?: number) => {
        const newZoom = Math.max(0.1, Math.min(10, zoom + delta * 0.1))
        const zoomFactor = newZoom / zoom

        // Calculate zoom center (mouse position or timeline center)
        const center = centerX !== undefined ? centerX : timelineWidth / 2
        const centerTime = (center / pixelsPerSecond) + visibleStart

        // Adjust pan to keep the zoom center in place
        const newPixelsPerSecond = (timelineWidth * newZoom) / Math.max(duration, 1)
        const newPan = Math.max(0, Math.min(
            (duration * newPixelsPerSecond) - timelineWidth,
            (centerTime * newPixelsPerSecond) - center
        ))

        setZoom(newZoom)
        setPan(newPan)
        setIsZooming(true)

        // Reset zooming state after animation
        setTimeout(() => setIsZooming(false), 200)
    }, [zoom, duration, pixelsPerSecond, timelineWidth, visibleStart])

    // Enhanced pan with momentum scrolling
    const handlePan = useCallback((delta: number, withMomentum = false) => {
        const newPan = Math.max(0, Math.min((duration * pixelsPerSecond) - timelineWidth, pan + delta))

        if (withMomentum) {
            // Track pan history for momentum calculation
            const now = Date.now()
            const timeDelta = now - lastScrollTime
            const velocity = timeDelta > 0 ? delta / timeDelta : 0

            setScrollVelocity(velocity)
            setLastScrollTime(now)
            setPanHistory(prev => [...prev.slice(-10), newPan])
        }

        setPan(newPan)
        setLastPanPosition(newPan)
    }, [pan, duration, pixelsPerSecond, timelineWidth, lastScrollTime])

    // Momentum scrolling effect
    useEffect(() => {
        if (Math.abs(scrollVelocity) > 0.1 && !isTimelineDragging) {
            const momentum = scrollVelocity * 0.95 // Decay factor
            const delta = momentum * 16 // 60fps

            if (Math.abs(delta) > 0.1) {
                handlePan(delta, true)
                setScrollVelocity(momentum)
            } else {
                setScrollVelocity(0)
            }
        }
    }, [scrollVelocity, isTimelineDragging, handlePan])

    // Enhanced playhead dragging with smooth movement and snapping
    const handlePlayheadMouseDown = (e: React.MouseEvent) => {
        if (!isVideoReady) return
        e.preventDefault()
        setIsPlayheadDragging(true)
        setIsDragging(true)

        const handleMouseMove = (e: MouseEvent) => {
            if (!timelineRef.current) return
            const rect = timelineRef.current.getBoundingClientRect()
            const x = e.clientX - rect.left
            let time = (x / pixelsPerSecond) + visibleStart

            // Apply snapping if enabled
            if (isSnapping) {
                const snapInterval = 1 / 30 // 30fps snap
                time = Math.round(time / snapInterval) * snapInterval
            }

            const clampedTime = Math.max(0, Math.min(duration, time))
            onSeek(clampedTime)
        }

        const handleMouseUp = () => {
            setIsPlayheadDragging(false)
            setIsDragging(false)
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
    }

    // Enhanced timeline dragging for panning
    const handleTimelineMouseDown = (e: React.MouseEvent) => {
        if (e.target !== e.currentTarget) return
        e.preventDefault()
        setIsTimelineDragging(true)
        setDragStart({ x: e.clientX, time: currentTime })

        const handleMouseMove = (e: MouseEvent) => {
            if (!dragStart) return
            const deltaX = e.clientX - dragStart.x
            const deltaTime = -deltaX / pixelsPerSecond
            const newPan = Math.max(0, Math.min(
                (duration * pixelsPerSecond) - timelineWidth,
                pan + deltaX
            ))
            setPan(newPan)
        }

        const handleMouseUp = () => {
            setIsTimelineDragging(false)
            setDragStart(null)
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
    }


    // Add marker
    const addMarker = () => {
        const newMarker: Marker = {
            id: `marker-${Date.now()}`,
            time: currentTime,
            label: `Marker ${markers.length + 1}`,
            color: '#ff6b6b'
        }
        setMarkers(prev => [...prev, newMarker])
    }

    // Toggle track mute
    const toggleTrackMute = (trackId: string) => {
        // TODO: Implement track mute functionality
        console.log('Toggle track mute:', trackId)
    }

    // Toggle track solo
    const toggleTrackSolo = (trackId: string) => {
        // TODO: Implement track solo functionality
        console.log('Toggle track solo:', trackId)
    }

    // Toggle track lock
    const toggleTrackLock = (trackId: string) => {
        // TODO: Implement track lock functionality
        console.log('Toggle track lock:', trackId)
    }

    // Enhanced clip selection with multi-select support
    const handleClipClick = (e: React.MouseEvent, clipId: string) => {
        e.stopPropagation()

        if (e.ctrlKey || e.metaKey) {
            // Multi-select with Ctrl/Cmd
            setSelectedClips(prev =>
                prev.includes(clipId)
                    ? prev.filter(id => id !== clipId)
                    : [...prev, clipId]
            )
        } else if (e.shiftKey && selectedClips.length > 0) {
            // Range select with Shift
            const allClips = tracks.flatMap(track => track.clips)
            const currentIndex = allClips.findIndex(clip => clip.id === clipId)
            const lastSelectedIndex = allClips.findIndex(clip => clip.id === selectedClips[selectedClips.length - 1])

            const start = Math.min(currentIndex, lastSelectedIndex)
            const end = Math.max(currentIndex, lastSelectedIndex)

            const rangeClips = allClips.slice(start, end + 1).map(clip => clip.id)
            setSelectedClips(rangeClips)
        } else {
            // Single select
            setSelectedClips([clipId])
        }
    }

    // Enhanced clip dragging with snap-to-grid and collision detection
    const handleClipMouseDown = (e: React.MouseEvent, clipId: string) => {
        e.preventDefault()
        e.stopPropagation()

        const clip = tracks.flatMap(track => track.clips).find(c => c.id === clipId)
        if (!clip) return

        const rect = e.currentTarget.getBoundingClientRect()
        const timelineRect = timelineRef.current?.getBoundingClientRect()
        if (!timelineRect) return

        const startX = e.clientX
        const startTime = clip.startTime
        const clipDuration = clip.endTime - clip.startTime

        // Calculate drag offset for smooth dragging
        const offsetX = e.clientX - rect.left
        setDragOffset({ x: offsetX, y: e.clientY - rect.top })

        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - startX
            const deltaTime = deltaX / pixelsPerSecond
            const newStartTime = Math.max(0, startTime + deltaTime)
            const newEndTime = newStartTime + clipDuration

            // Snap to grid if enabled
            let snappedStartTime = newStartTime
            let snappedEndTime = newEndTime

            if (isSnapping) {
                const snapInterval = 1 / 30 // 30fps snap
                snappedStartTime = Math.round(newStartTime / snapInterval) * snapInterval
                snappedEndTime = snappedStartTime + clipDuration
            }

            // Collision detection with other clips
            const otherClips = tracks.flatMap(track => track.clips).filter(c => c.id !== clipId)
            const hasCollision = otherClips.some(otherClip =>
                (snappedStartTime < otherClip.endTime && snappedEndTime > otherClip.startTime) &&
                otherClip.trackId === clip.trackId
            )

            if (!hasCollision) {
                onUpdateClip(clipId, {
                    startTime: snappedStartTime,
                    endTime: snappedEndTime
                })
            }

            // Update playhead preview
            setClipPreview({ clipId, time: snappedStartTime })
        }

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
            setDragOffset(null)
            setClipPreview(null)
            setIsDragging(false)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
        setIsDragging(true)
    }

    // Enhanced clip resizing with constraints and snapping
    const handleClipResize = (e: React.MouseEvent, clipId: string, edge: 'start' | 'end') => {
        e.preventDefault()
        e.stopPropagation()

        const clip = tracks.flatMap(track => track.clips).find(c => c.id === clipId)
        if (!clip) return

        const startX = e.clientX
        const startTime = edge === 'start' ? clip.startTime : clip.endTime

        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - startX
            const deltaTime = deltaX / pixelsPerSecond
            const newTime = Math.max(0, startTime + deltaTime)

            // Snap to grid if enabled
            let snappedTime = newTime
            if (isSnapping) {
                const snapInterval = 1 / 30 // 30fps snap
                snappedTime = Math.round(newTime / snapInterval) * snapInterval
            }

            // Apply constraints
            if (edge === 'start') {
                const minTime = 0
                const maxTime = clip.endTime - 0.1 // Minimum 0.1s duration
                snappedTime = Math.max(minTime, Math.min(maxTime, snappedTime))
                onUpdateClip(clipId, { startTime: snappedTime })
            } else {
                const minTime = clip.startTime + 0.1 // Minimum 0.1s duration
                const maxTime = duration
                snappedTime = Math.max(minTime, Math.min(maxTime, snappedTime))
                onUpdateClip(clipId, { endTime: snappedTime })
            }
        }

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
            setIsResizing(null)
            setResizeStart(null)
        }

        setIsResizing(clipId)
        setResizeStart({ time: startTime, clipId, edge })
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
    }

    // Context menu for clips
    const handleClipRightClick = (e: React.MouseEvent, clipId: string) => {
        e.preventDefault()
        e.stopPropagation()

        if (!selectedClips.includes(clipId)) {
            setSelectedClips([clipId])
        }

        // TODO: Show context menu
        console.log('Right-click on clip:', clipId)
    }

    // Enhanced keyboard shortcuts for timeline navigation and clip operations
    const handleKeyDown = (e: KeyboardEvent) => {
        // Timeline navigation shortcuts (work even without selected clips)
        switch (e.key) {
            case 'ArrowLeft':
                e.preventDefault()
                if (e.shiftKey) {
                    // Shift + Left: Move playhead by 1 second
                    onSeek(Math.max(0, currentTime - 1))
                } else if (e.ctrlKey || e.metaKey) {
                    // Ctrl/Cmd + Left: Move playhead by 10 seconds
                    onSeek(Math.max(0, currentTime - 10))
                } else {
                    // Left: Move playhead by 1 frame
                    onSeek(Math.max(0, currentTime - (1 / 30)))
                }
                break
            case 'ArrowRight':
                e.preventDefault()
                if (e.shiftKey) {
                    // Shift + Right: Move playhead by 1 second
                    onSeek(Math.min(duration, currentTime + 1))
                } else if (e.ctrlKey || e.metaKey) {
                    // Ctrl/Cmd + Right: Move playhead by 10 seconds
                    onSeek(Math.min(duration, currentTime + 10))
                } else {
                    // Right: Move playhead by 1 frame
                    onSeek(Math.min(duration, currentTime + (1 / 30)))
                }
                break
            case 'Home':
                e.preventDefault()
                onSeek(0)
                break
            case 'End':
                e.preventDefault()
                onSeek(duration)
                break
            case ' ':
                e.preventDefault()
                onPlayPause()
                break
            case '=':
            case '+':
                e.preventDefault()
                handleZoom(0.1)
                break
            case '-':
                e.preventDefault()
                handleZoom(-0.1)
                break
            case '0':
                e.preventDefault()
                setZoom(1)
                setPan(0)
                break
        }

        // Clip operations (only if clips are selected)
        if (selectedClips.length === 0) return

        switch (e.key) {
            case 'Delete':
            case 'Backspace':
                // Delete selected clips
                selectedClips.forEach(clipId => {
                    // TODO: Implement delete functionality
                    console.log('Delete clip:', clipId)
                })
                break
            case 'c':
                if (e.ctrlKey || e.metaKey) {
                    // Copy selected clips
                    console.log('Copy clips:', selectedClips)
                }
                break
            case 'v':
                if (e.ctrlKey || e.metaKey) {
                    // Paste clips
                    console.log('Paste clips')
                }
                break
            case 'a':
                if (e.ctrlKey || e.metaKey) {
                    // Select all clips
                    const allClipIds = tracks.flatMap(track => track.clips).map(clip => clip.id)
                    setSelectedClips(allClipIds)
                }
                break
            case 'Escape':
                // Deselect all clips
                setSelectedClips([])
                break
            case 'ArrowLeft':
                if (e.altKey) {
                    // Alt + Left: Move selected clips left by 1 frame
                    selectedClips.forEach(clipId => {
                        const clip = tracks.flatMap(track => track.clips).find(c => c.id === clipId)
                        if (clip) {
                            const newStartTime = Math.max(0, clip.startTime - (1 / 30))
                            const duration = clip.endTime - clip.startTime
                            onUpdateClip(clipId, {
                                startTime: newStartTime,
                                endTime: newStartTime + duration
                            })
                        }
                    })
                }
                break
            case 'ArrowRight':
                if (e.altKey) {
                    // Alt + Right: Move selected clips right by 1 frame
                    selectedClips.forEach(clipId => {
                        const clip = tracks.flatMap(track => track.clips).find(c => c.id === clipId)
                        if (clip) {
                            const clipDuration = clip.endTime - clip.startTime
                            const newStartTime = Math.min(duration - clipDuration, clip.startTime + (1 / 30))
                            onUpdateClip(clipId, {
                                startTime: newStartTime,
                                endTime: newStartTime + clipDuration
                            })
                        }
                    })
                }
                break
        }
    }

    // Enhanced wheel zoom and scroll
    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault()

        if (e.ctrlKey || e.metaKey) {
            // Zoom with Ctrl/Cmd + wheel
            const rect = e.currentTarget.getBoundingClientRect()
            const centerX = e.clientX - rect.left
            const delta = e.deltaY > 0 ? -0.1 : 0.1
            handleZoom(delta, centerX)
        } else {
            // Pan with wheel
            const delta = e.deltaY * 2
            handlePan(delta, true)
        }
    }

    // Timeline context menu
    const handleTimelineRightClick = (e: React.MouseEvent) => {
        e.preventDefault()
        // TODO: Show timeline context menu
        console.log('Right-click on timeline')
    }

    // Enhanced timeline click handling
    const handleTimelineClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            setSelectedClips([])
        }
    }

    // Auto-follow playhead (smooth scrolling to keep playhead in view)
    useEffect(() => {
        if (isPlaying && !isPlayheadDragging && !isTimelineDragging) {
            const playheadPosition = (currentTime - visibleStart) * pixelsPerSecond
            const timelineCenter = timelineWidth / 2

            // If playhead is near the edges, smoothly pan to keep it centered
            if (playheadPosition < timelineCenter * 0.3) {
                const targetPan = Math.max(0, (currentTime * pixelsPerSecond) - timelineCenter * 0.7)
                setPan(prev => prev + (targetPan - prev) * 0.1)
            } else if (playheadPosition > timelineCenter * 1.7) {
                const targetPan = Math.min(
                    (duration * pixelsPerSecond) - timelineWidth,
                    (currentTime * pixelsPerSecond) - timelineCenter * 1.3
                )
                setPan(prev => prev + (targetPan - prev) * 0.1)
            }
        }
    }, [currentTime, isPlaying, isPlayheadDragging, isTimelineDragging, visibleStart, pixelsPerSecond, timelineWidth, duration])

    // Add keyboard event listener
    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [selectedClips, tracks])

    const timeMarkers = generateTimeMarkers()
    const playheadPosition = (currentTime - visibleStart) * pixelsPerSecond

    return (
        <div className="bg-gray-800/95 backdrop-blur-sm border-t border-gray-700 shadow-lg">
            {/* Timeline Controls */}
            <div className="px-4 py-3 border-b border-gray-700">
                <div className="flex items-center justify-between">
                    {/* Left Controls */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 transition-all duration-200 hover:bg-gray-700 hover:scale-110 disabled:opacity-50"
                                onClick={onRewind}
                                disabled={!isVideoReady}
                            >
                                <SkipBack className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-10 w-10 p-0 transition-all duration-200 hover:bg-purple-600 hover:scale-110 rounded-full disabled:opacity-50"
                                onClick={onPlayPause}
                                disabled={!isVideoReady}
                            >
                                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 transition-all duration-200 hover:bg-gray-700 hover:scale-110 disabled:opacity-50"
                                onClick={onFastForward}
                                disabled={!isVideoReady}
                            >
                                <SkipForward className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="h-6 w-px bg-gray-600" />

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 transition-all duration-200 hover:bg-purple-600 hover:border-purple-500 hover:text-white hover:scale-105"
                                onClick={() => {
                                    const ratios = ['16:9', '4:3', '1:1', '21:9', '9:16']
                                    const currentIndex = ratios.indexOf(aspectRatio)
                                    const nextIndex = (currentIndex + 1) % ratios.length
                                    onAspectRatioChange(ratios[nextIndex])
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-3 border border-gray-400 rounded-sm"></div>
                                    <span className="text-xs">{aspectRatio}</span>
                                    <span className="text-xs text-gray-400">▼</span>
                                </div>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 px-3 transition-all duration-200 hover:bg-blue-600 hover:border-blue-500 hover:text-white hover:scale-105"
                                onClick={onCrop}
                            >
                                <Scissors className="h-3 w-3 mr-1" />
                                <span className="text-xs">Crop</span>
                            </Button>
                        </div>
                    </div>

                    {/* Center Controls */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 transition-all duration-200 hover:bg-gray-700"
                                onClick={() => handleZoom(-0.1)}
                            >
                                <ZoomOut className="h-4 w-4" />
                            </Button>
                            <div className="w-20">
                                <Slider
                                    value={[zoom]}
                                    onValueChange={(value) => setZoom(value[0])}
                                    min={0.1}
                                    max={10}
                                    step={0.1}
                                    className="w-full"
                                />
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 transition-all duration-200 hover:bg-gray-700"
                                onClick={() => handleZoom(0.1)}
                            >
                                <ZoomIn className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="h-6 w-px bg-gray-600" />

                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`h-8 w-8 p-0 transition-all duration-200 ${isSnapping ? 'bg-purple-600 text-white' : 'hover:bg-gray-700'}`}
                                onClick={() => setIsSnapping(!isSnapping)}
                                title="Snap to grid"
                            >
                                <Grid3X3 className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`h-8 w-8 p-0 transition-all duration-200 ${showGrid ? 'bg-purple-600 text-white' : 'hover:bg-gray-700'}`}
                                onClick={() => setShowGrid(!showGrid)}
                                title="Show grid"
                            >
                                <Grid3X3 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Right Controls */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 transition-all duration-200 hover:bg-gray-700"
                            onClick={addMarker}
                            title="Add marker"
                        >
                            <Grid3X3 className="h-4 w-4" />
                        </Button>
                        <div className="text-xs text-gray-400">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Timeline Area */}
            <div className="relative overflow-hidden" style={{ height: '200px' }}>
                <div
                    ref={timelineRef}
                    className={`relative h-full transition-all duration-200 ${isTimelineDragging ? 'cursor-grabbing' :
                        isPlayheadDragging ? 'cursor-grabbing' :
                            'cursor-grab'
                        } ${isZooming ? 'scale-105' : 'scale-100'}`}
                    style={{
                        width: `${timelineWidth}px`,
                        transform: `translateX(-${pan}px)`,
                        transition: isTimelineDragging || isPlayheadDragging ? 'none' : 'transform 0.1s ease-out'
                    }}
                    onClick={handleTimelineClick}
                    onContextMenu={handleTimelineRightClick}
                    onMouseDown={handleTimelineMouseDown}
                    onWheel={handleWheel}
                >
                    {/* Time Ruler */}
                    <div className="absolute top-0 left-0 right-0 h-8 bg-gray-700 border-b border-gray-600">
                        {/* Grid lines */}
                        {showGrid && timeMarkers.map((marker, index) => (
                            <div
                                key={`grid-${index}`}
                                className="absolute top-0 h-full w-px bg-gray-600/50"
                                style={{ left: `${marker.position}px` }}
                            />
                        ))}

                        {/* Time markers */}
                        {timeMarkers.map((marker, index) => (
                            <div
                                key={index}
                                className="absolute top-0 h-full flex flex-col justify-center group"
                                style={{ left: `${marker.position}px` }}
                            >
                                <div className="w-px h-4 bg-gray-400 group-hover:bg-gray-200 transition-colors duration-200" />
                                <div className="text-xs text-gray-300 group-hover:text-gray-100 mt-1 whitespace-nowrap transition-colors duration-200">
                                    {marker.label}
                                </div>
                            </div>
                        ))}

                        {/* Enhanced playhead with smooth movement and visual feedback */}
                        <div
                            className={`absolute top-0 h-full w-px z-30 transition-all duration-100 ${isPlayheadDragging ? 'bg-yellow-400 shadow-lg shadow-yellow-400/50' :
                                'bg-red-500 shadow-md shadow-red-500/30'
                                }`}
                            style={{
                                left: `${playheadPosition}px`,
                                transform: isPlayheadDragging ? 'scaleX(2)' : 'scaleX(1)',
                                boxShadow: isPlayheadDragging ?
                                    '0 0 10px rgba(251, 191, 36, 0.6), 0 0 20px rgba(251, 191, 36, 0.3)' :
                                    '0 0 5px rgba(239, 68, 68, 0.4)'
                            }}
                            onMouseDown={handlePlayheadMouseDown}
                        />

                        {/* Playhead handle for easier dragging */}
                        <div
                            className={`absolute top-0 w-3 h-8 -ml-1.5 cursor-grab active:cursor-grabbing transition-all duration-200 ${isPlayheadDragging ? 'bg-yellow-400' : 'bg-red-500 hover:bg-red-400'
                                } rounded-sm shadow-lg`}
                            style={{
                                left: `${playheadPosition}px`,
                                transform: isPlayheadDragging ? 'scale(1.2)' : 'scale(1)'
                            }}
                            onMouseDown={handlePlayheadMouseDown}
                        />
                    </div>

                    {/* Grid Lines */}
                    {showGrid && (
                        <div className="absolute top-8 left-0 right-0 bottom-0">
                            {timeMarkers.map((marker, index) => (
                                <div
                                    key={index}
                                    className="absolute top-0 bottom-0 w-px bg-gray-600/30 hover:bg-gray-500/50 transition-colors duration-200"
                                    style={{ left: `${marker.position}px` }}
                                />
                            ))}
                        </div>
                    )}

                    {/* Tracks */}
                    <div className="absolute top-8 left-0 right-0 bottom-0">
                        {tracks.map((track, trackIndex) => (
                            <div
                                key={track.id}
                                className="relative border-b border-gray-600"
                                style={{ height: `${track.height}px` }}
                            >
                                {/* Track Header */}
                                <div className="absolute left-0 top-0 w-48 h-full bg-gray-700 border-r border-gray-600 flex items-center px-3">
                                    <div className="flex items-center gap-2 w-full">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0"
                                            onClick={() => toggleTrackMute(track.id)}
                                        >
                                            {track.muted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0"
                                            onClick={() => toggleTrackSolo(track.id)}
                                        >
                                            {track.solo ? <Eye className="h-3 w-3 text-yellow-400" /> : <EyeOff className="h-3 w-3" />}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0"
                                            onClick={() => toggleTrackLock(track.id)}
                                        >
                                            <Lock className={`h-3 w-3 ${track.locked ? 'text-red-400' : ''}`} />
                                        </Button>
                                        <span className="text-xs text-gray-300 truncate">{track.name}</span>
                                    </div>
                                </div>

                                {/* Track Content */}
                                <div
                                    className="absolute left-48 right-0 top-0 h-full relative"
                                    onMouseDown={(e) => {
                                        // Handle timeline click to deselect clips
                                        if (e.target === e.currentTarget) {
                                            setSelectedClips([])
                                        }
                                    }}
                                >
                                    {/* Clips */}
                                    {track.clips.map((clip) => {
                                        const isSelected = selectedClips.includes(clip.id)
                                        const isHovered = hoveredClip === clip.id
                                        const isResizingClip = isResizing === clip.id
                                        const isPreview = clipPreview?.clipId === clip.id

                                        return (
                                            <div
                                                key={clip.id}
                                                className={`absolute top-1 bottom-1 rounded cursor-move transition-all duration-200 group select-none ${isSelected
                                                    ? 'ring-2 ring-blue-400 shadow-lg z-20'
                                                    : isHovered
                                                        ? 'ring-1 ring-blue-300 shadow-md z-10'
                                                        : 'hover:shadow-sm z-0'
                                                    } ${isResizingClip ? 'ring-2 ring-yellow-400' : ''} ${isPreview ? 'opacity-80' : ''
                                                    } ${isDragging && isSelected ? 'scale-105' : 'scale-100'}`}
                                                style={{
                                                    left: `${(clip.startTime - visibleStart) * pixelsPerSecond}px`,
                                                    width: `${(clip.endTime - clip.startTime) * pixelsPerSecond}px`,
                                                    backgroundColor: clip.color,
                                                    minWidth: '20px', // Ensure minimum width for visibility
                                                    transform: isDragging && isSelected ? 'scale(1.05) rotate(1deg)' : 'scale(1) rotate(0deg)',
                                                    boxShadow: isSelected
                                                        ? '0 8px 25px rgba(59, 130, 246, 0.4), 0 4px 12px rgba(59, 130, 246, 0.2)'
                                                        : isHovered
                                                            ? '0 4px 15px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.1)'
                                                            : '0 2px 8px rgba(0, 0, 0, 0.15)',
                                                    transition: isDragging ? 'none' : 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                                }}
                                                onMouseDown={(e) => handleClipMouseDown(e, clip.id)}
                                                onClick={(e) => handleClipClick(e, clip.id)}
                                                onContextMenu={(e) => handleClipRightClick(e, clip.id)}
                                                onMouseEnter={() => setHoveredClip(clip.id)}
                                                onMouseLeave={() => setHoveredClip(null)}
                                            >
                                                {/* Clip Content */}
                                                <div className="h-full flex items-center px-2 relative overflow-hidden">
                                                    {/* Thumbnail for video clips */}
                                                    {clip.thumbnail && clip.type === 'video' && (
                                                        <div className="w-6 h-4 mr-2 rounded-sm overflow-hidden flex-shrink-0">
                                                            <img
                                                                src={clip.thumbnail}
                                                                alt={clip.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                    )}

                                                    {/* Waveform for audio clips */}
                                                    {clip.waveform && clip.type === 'audio' && (
                                                        <div className="flex items-center gap-0.5 mr-2 flex-shrink-0">
                                                            {clip.waveform.slice(0, 8).map((amplitude, index) => (
                                                                <div
                                                                    key={index}
                                                                    className="bg-white/80 rounded-sm"
                                                                    style={{
                                                                        width: '1px',
                                                                        height: `${Math.max(2, amplitude * 20)}px`
                                                                    }}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Clip Name */}
                                                    <span className="text-xs text-white font-medium truncate flex-1">
                                                        {clip.name}
                                                    </span>

                                                    {/* Duration Badge */}
                                                    <div className="absolute top-0 right-0 bg-black/50 text-white text-xs px-1 rounded-bl text-[10px]">
                                                        {formatTime(clip.endTime - clip.startTime)}
                                                    </div>

                                                    {/* Status Indicators */}
                                                    <div className="absolute top-0 left-0 flex gap-0.5">
                                                        {clip.muted && (
                                                            <div className="w-2 h-2 bg-red-500 rounded-full flex items-center justify-center">
                                                                <VolumeX className="h-1 w-1 text-white" />
                                                            </div>
                                                        )}
                                                        {clip.locked && (
                                                            <div className="w-2 h-2 bg-yellow-500 rounded-full flex items-center justify-center">
                                                                <Lock className="h-1 w-1 text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Resize Handles */}
                                                <div
                                                    className={`absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize transition-all duration-200 ${isHovered || isSelected
                                                        ? 'opacity-100 bg-white/20 hover:bg-white/30'
                                                        : 'opacity-0'
                                                        } ${isResizingClip && resizeStart?.edge === 'start'
                                                            ? 'bg-yellow-400/50'
                                                            : ''
                                                        }`}
                                                    onMouseDown={(e) => handleClipResize(e, clip.id, 'start')}
                                                />
                                                <div
                                                    className={`absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize transition-all duration-200 ${isHovered || isSelected
                                                        ? 'opacity-100 bg-white/20 hover:bg-white/30'
                                                        : 'opacity-0'
                                                        } ${isResizingClip && resizeStart?.edge === 'end'
                                                            ? 'bg-yellow-400/50'
                                                            : ''
                                                        }`}
                                                    onMouseDown={(e) => handleClipResize(e, clip.id, 'end')}
                                                />

                                                {/* Fade In/Out Handles */}
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-r from-transparent to-white/20" />
                                                <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-l from-transparent to-white/20" />
                                            </div>
                                        )
                                    })}

                                    {/* Selection Box */}
                                    {selectionBox && (
                                        <div
                                            className="absolute border-2 border-blue-400 bg-blue-400/10 pointer-events-none z-30"
                                            style={{
                                                left: Math.min(selectionBox.start.x, selectionBox.end.x),
                                                top: Math.min(selectionBox.start.y, selectionBox.end.y),
                                                width: Math.abs(selectionBox.end.x - selectionBox.start.x),
                                                height: Math.abs(selectionBox.end.y - selectionBox.start.y)
                                            }}
                                        />
                                    )}

                                    {/* Clip Preview Overlay */}
                                    {clipPreview && (
                                        <div
                                            className="absolute top-0 bottom-0 border-2 border-dashed border-yellow-400 bg-yellow-400/20 pointer-events-none z-40"
                                            style={{
                                                left: `${(clipPreview.time - visibleStart) * pixelsPerSecond}px`,
                                                width: '2px'
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Playhead */}
                    <div
                        ref={playheadRef}
                        className="absolute top-0 bottom-0 w-0.5 bg-red-500 cursor-ew-resize z-10 transition-all duration-100"
                        style={{ left: `${playheadPosition}px` }}
                        onMouseDown={handlePlayheadMouseDown}
                    >
                        <div className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-lg hover:scale-110 transition-transform duration-200" />
                        {/* Playhead line extension */}
                        <div className="absolute top-0 bottom-0 w-px bg-red-500/50" />
                    </div>

                    {/* Markers */}
                    {markers.map((marker) => (
                        <div
                            key={marker.id}
                            className="absolute top-0 bottom-0 w-0.5 z-20"
                            style={{
                                left: `${(marker.time - visibleStart) * pixelsPerSecond}px`,
                                backgroundColor: marker.color
                            }}
                        >
                            <div
                                className="absolute -top-1 -left-1 w-2 h-2 rounded-full"
                                style={{ backgroundColor: marker.color }}
                            />
                            <div className="absolute top-0 left-2 text-xs text-white bg-gray-800 px-1 rounded">
                                {marker.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Status Bar */}
            <div className="px-4 py-2 bg-gray-900 border-t border-gray-700 text-xs text-gray-400">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span>Zoom: {Math.round(zoom * 100)}%</span>
                        <span>Duration: {formatTime(duration)}</span>
                        {selectedClips.length > 0 && (
                            <span className="text-blue-400">
                                {selectedClips.length} clip{selectedClips.length > 1 ? 's' : ''} selected
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-4">
                        <span>Snap: {isSnapping ? 'On' : 'Off'}</span>
                        <span>Grid: {showGrid ? 'On' : 'Off'}</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
