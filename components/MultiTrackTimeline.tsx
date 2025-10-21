"use client"

import type React from "react"
import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import {
    Timeline,
    type TimelineEffect,
    type TimelineRow,
    type TimelineAction,
    type TimelineState,
} from "@xzdarcy/react-timeline-editor"
import { Button } from "./ui/button"
import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Volume2,
    VolumeX,
    Eye,
    EyeOff,
    Lock,
    Unlock,
    Trash2,
    ChevronUp,
    ChevronDown,
    Layers,
    Search,
    Scissors,
    Bookmark,
    ZoomIn,
    ZoomOut,
    Maximize2,
} from "lucide-react"

interface Clip {
    id: string
    type: "video" | "audio" | "effect" | "text" | "image"
    name: string
    startTime: number
    endTime: number
    trackId: string
    color: string
    thumbnail?: string
    waveform?: number[]
    muted?: boolean
    locked?: boolean
    selected?: boolean
}

interface Track {
    id: string
    name: string
    type: "video" | "audio" | "effect" | "text"
    muted: boolean
    solo: boolean
    locked: boolean
    visible: boolean
    height: number
    color: string
}

interface Marker {
    id: string
    time: number
    label: string
    color: string
}

interface MultiTrackTimelineProps {
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
    onDeleteClip: (clipId: string) => void
    onDuplicateClip: (clipId: string) => void
}

export default function MultiTrackTimeline({
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
    onUpdateClip,
    onDeleteClip,
    onDuplicateClip,
}: MultiTrackTimelineProps) {
    const [zoom, setZoom] = useState(1)
    const [isSnapping, setIsSnapping] = useState(true)
    const [showGrid, setShowGrid] = useState(true)
    const [selectedClips, setSelectedClips] = useState<string[]>([])
    const [selectedTracks, setSelectedTracks] = useState<string[]>([])
    const [isDragging, setIsDragging] = useState(false)
    const [hoveredClip, setHoveredClip] = useState<string | null>(null)
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; clipId?: string; trackId?: string } | null>(
        null,
    )
    const [isTimelineExpanded, setIsTimelineExpanded] = useState(false)
    const [markers, setMarkers] = useState<Marker[]>([])
    const [clipboard, setClipboard] = useState<Clip[]>([])
    const [dragSelection, setDragSelection] = useState<{
        start: { x: number; y: number }
        end: { x: number; y: number }
    } | null>(null)
    const [tool, setTool] = useState<"select" | "razor" | "slip" | "slide">("select")
    const [isPanning, setIsPanning] = useState(false)
    const [panStart, setPanStart] = useState({ x: 0, y: 0 })
    const [scrollOffset, setScrollOffset] = useState(0)

    const timelineRef = useRef<HTMLDivElement>(null)
    const timelineContainerRef = useRef<HTMLDivElement>(null)
    const [playheadPosition, setPlayheadPosition] = useState(0)

    const timelineState = useRef<TimelineState | null>(null)

    const [tracks, setTracks] = useState<Track[]>([
        {
            id: "video-1",
            name: "Video Track 1",
            type: "video",
            muted: false,
            solo: false,
            locked: false,
            visible: true,
            height: 60,
            color: "#eab308",
        },
        {
            id: "effect-1",
            name: "Effect Track 1",
            type: "effect",
            muted: false,
            solo: false,
            locked: false,
            visible: true,
            height: 50,
            color: "#a855f7",
        },
        {
            id: "text-1",
            name: "Text Track 1",
            type: "text",
            muted: false,
            solo: false,
            locked: false,
            visible: true,
            height: 40,
            color: "#14b8a6",
        },
    ])

    // Removed editorData state - using timelineData directly

    useEffect(() => {
        if (duration > 0) {
            setPlayheadPosition((currentTime / duration) * 100)
        }
    }, [currentTime, duration])

    // Sync timeline cursor with video current time
    useEffect(() => {
        if (timelineState.current && isVideoReady) {
            timelineState.current.setTime(currentTime)
            timelineState.current.reRender()
        }
    }, [currentTime, isVideoReady])

    const effectsMap: Record<string, TimelineEffect> = useMemo(() => {
        const effectsMap: Record<string, TimelineEffect> = {}
        clips.forEach((clip) => {
            const track = tracks.find((t) => t.id === clip.trackId)
            if (track) {
                effectsMap[`effect-${clip.id}`] = {
                    id: `effect-${clip.id}`,
                    name: clip.name,
                }
            }
        })
        return effectsMap
    }, [clips, tracks])

    // Removed editorData useEffect - using timelineData directly

    const addMarker = useCallback(() => {
        const newMarker: Marker = {
            id: `marker-${Date.now()}`,
            time: currentTime,
            label: `Marker ${markers.length + 1}`,
            color: "#3b82f6",
        }
        setMarkers((prev) => [...prev, newMarker].sort((a, b) => a.time - b.time))
    }, [currentTime, markers.length])

    const splitClipAtPlayhead = useCallback(() => {
        const clipsAtPlayhead = clips.filter(
            (clip) => clip.startTime <= currentTime && clip.endTime >= currentTime && !clip.locked,
        )

        if (clipsAtPlayhead.length === 0) return

        clipsAtPlayhead.forEach((clip) => {
            // Create two new clips from the split
            const leftClip = {
                ...clip,
                id: `${clip.id}-left-${Date.now()}`,
                endTime: currentTime,
            }
            const rightClip = {
                ...clip,
                id: `${clip.id}-right-${Date.now()}`,
                startTime: currentTime,
            }

            // Delete original and add split clips
            onDeleteClip(clip.id)
            // Note: In a real implementation, you'd need onAddClip function
            console.log("[v0] Split clip:", { leftClip, rightClip })
        })
    }, [clips, currentTime, onDeleteClip])

    const copySelectedClips = useCallback(() => {
        const clipsToCopy = clips.filter((clip) => selectedClips.includes(clip.id))
        setClipboard(clipsToCopy)
        console.log("[v0] Copied clips to clipboard:", clipsToCopy)
    }, [clips, selectedClips])

    const pasteClips = useCallback(() => {
        if (clipboard.length === 0) return

        clipboard.forEach((clip) => {
            const newClip = {
                ...clip,
                id: `${clip.id}-paste-${Date.now()}`,
                startTime: currentTime,
                endTime: currentTime + (clip.endTime - clip.startTime),
            }
            console.log("[v0] Pasted clip:", newClip)
            // Note: In a real implementation, you'd need onAddClip function
        })
    }, [clipboard, currentTime])

    const rippleDelete = useCallback(() => {
        if (selectedClips.length === 0) return

        const clipsToDelete = clips.filter((clip) => selectedClips.includes(clip.id))
        const earliestStart = Math.min(...clipsToDelete.map((c) => c.startTime))
        const latestEnd = Math.max(...clipsToDelete.map((c) => c.endTime))
        const gap = latestEnd - earliestStart

        // Delete selected clips
        selectedClips.forEach((clipId) => onDeleteClip(clipId))

        // Shift all clips after the gap
        clips.forEach((clip) => {
            if (clip.startTime > latestEnd && !selectedClips.includes(clip.id)) {
                onUpdateClip(clip.id, {
                    startTime: clip.startTime - gap,
                    endTime: clip.endTime - gap,
                })
            }
        })

        setSelectedClips([])
    }, [clips, selectedClips, onDeleteClip, onUpdateClip])

    const navigateFrame = useCallback(
        (direction: "forward" | "backward") => {
            const frameRate = 30 // 30fps
            const frameDuration = 1 / frameRate
            const newTime =
                direction === "forward"
                    ? Math.min(duration, currentTime + frameDuration)
                    : Math.max(0, currentTime - frameDuration)
            onSeek(newTime)
        },
        [currentTime, duration, onSeek],
    )

    const jumpToMarker = useCallback(
        (direction: "next" | "previous") => {
            if (markers.length === 0) return

            const sortedMarkers = [...markers].sort((a, b) => a.time - b.time)

            if (direction === "next") {
                const nextMarker = sortedMarkers.find((m) => m.time > currentTime)
                if (nextMarker) onSeek(nextMarker.time)
            } else {
                const previousMarker = [...sortedMarkers].reverse().find((m) => m.time < currentTime)
                if (previousMarker) onSeek(previousMarker.time)
            }
        },
        [markers, currentTime, onSeek],
    )

    const fitToWindow = useCallback(() => {
        setZoom(1)
        setScrollOffset(0)
    }, [])

    const handleTimelineChange = useCallback(
        (data: TimelineRow[]) => {
            console.log("[v0] Timeline data changed:", data)
            data.forEach((row) => {
                row.actions.forEach((action) => {
                    const clip = clips.find((c) => c.id === action.id)
                    if (clip && (clip.startTime !== action.start || clip.endTime !== action.end)) {
                        onUpdateClip(action.id, {
                            startTime: action.start,
                            endTime: action.end,
                            trackId: row.id,
                        })
                    }
                })
            })
            // Data is handled by timelineData now
        },
        [clips, onUpdateClip],
    )

    const handleCursorDrag = useCallback(
        (time: number) => {
            onSeek(time)
        },
        [onSeek],
    )

    const handleClickTimeArea = useCallback(
        (time: number, e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
            onSeek(time)
            return true // Allow the timeline to set the time
        },
        [onSeek],
    )

    const handleCursorDragStart = useCallback(
        (time: number) => {
            setIsDragging(true)
        },
        [],
    )

    const handleCursorDragEnd = useCallback(
        (time: number) => {
            setIsDragging(false)
            onSeek(time)
        },
        [onSeek],
    )

    const handleActionClick = useCallback(
        (e: React.MouseEvent, param: { action: TimelineAction; row: TimelineRow; time: number }) => {
            e.stopPropagation()
            const { action } = param

            if (e.ctrlKey || e.metaKey) {
                setSelectedClips((prev) =>
                    prev.includes(action.id) ? prev.filter((id) => id !== action.id) : [...prev, action.id],
                )
            } else {
                setSelectedClips([action.id])
            }
        },
        [],
    )

    const handleActionMoving = useCallback(
        (params: { action: TimelineAction; row: TimelineRow; start: number; end: number }) => {
            if (isSnapping) {
                const snapInterval = 1 / 30 // 30fps snap
                params.start = Math.round(params.start / snapInterval) * snapInterval
                params.end = Math.round(params.end / snapInterval) * snapInterval
            }
            return true
        },
        [isSnapping],
    )

    const handleActionResizing = useCallback(
        (params: { action: TimelineAction; row: TimelineRow; start: number; end: number; dir: "right" | "left" }) => {
            if (isSnapping) {
                const snapInterval = 1 / 30 // 30fps snap
                params.start = Math.round(params.start / snapInterval) * snapInterval
                params.end = Math.round(params.end / snapInterval) * snapInterval
            }
            return true
        },
        [isSnapping],
    )

    // Create timeline data with multiple tracks
    const timelineData: TimelineRow[] = useMemo(() => {
        console.log("Creating timeline data with tracks:", tracks, "clips:", clips)
        console.log("Video duration:", duration)

        const rows: TimelineRow[] = tracks.map((track) => {
            const trackClips = clips.filter((clip) => clip.trackId === track.id)

            return {
                id: track.id,
                actions: trackClips.map((clip) => {
                    const action = {
                        id: clip.id,
                        start: clip.startTime,
                        end: clip.endTime,
                        effectId: `${track.type}-${clip.id}`,
                        flexible: true, // Allow resizing by default
                        movable: !track.locked && !clip.locked, // Allow moving unless track or clip is locked
                        removable: !track.locked, // Allow removal unless track is locked
                        selected: selectedClips.includes(clip.id),
                        // Add constraints for better UX
                        minStart: 0, // Prevent moving before timeline start
                        maxEnd: duration, // Prevent extending beyond video duration
                    }
                    console.log(`Clip ${clip.name}: start=${action.start}, end=${action.end}, duration=${action.end - action.start}`)
                    return action
                }),
            }
        })

        console.log("Timeline data created:", rows)
        return rows
    }, [tracks, clips, selectedClips, duration])

    // Handle timeline changes
    const handleTimelineChangeFinal = useCallback(
        (editorData: TimelineRow[]) => {
            console.log("Timeline changed:", editorData)
            editorData.forEach((row) => {
                row.actions.forEach((action) => {
                    const clipId = action.id
                    const clip = clips.find((c) => c.id === clipId)
                    if (clip) {
                        onUpdateClip(clipId, {
                            startTime: action.start,
                            endTime: action.end,
                        })
                    }
                })
            })
        },
        [clips, onUpdateClip],
    )

    // Handle action context menu
    const handleActionContextMenu = useCallback(
        (e: React.MouseEvent, param: { action: TimelineAction; row: TimelineRow; time: number }) => {
            e.preventDefault()
            const { action } = param

            if (!selectedClips.includes(action.id)) {
                setSelectedClips([action.id])
            }

            setContextMenu({
                x: e.clientX,
                y: e.clientY,
                clipId: action.id,
            })
        },
        [selectedClips],
    )

    // Handle action move
    const handleActionMovingFinal = useCallback(
        (params: { action: TimelineAction; row: TimelineRow; start: number; end: number }) => {
            const { action, start, end } = params

            // Check if action is movable
            if (!action.movable) {
                console.log("Action is not movable:", action.id)
                return false
            }

            // Apply constraints
            const minStart = action.minStart || 0
            const maxEnd = action.maxEnd || duration
            const clipDuration = end - start

            // Ensure we don't go below minimum start time
            if (start < minStart) {
                params.start = minStart
                params.end = minStart + clipDuration
            }

            // Ensure we don't go beyond maximum end time
            if (end > maxEnd) {
                params.end = maxEnd
                params.start = maxEnd - clipDuration
            }

            // Apply snapping if enabled
            if (isSnapping) {
                const snapInterval = 1 / 30 // 30fps snap
                params.start = Math.round(params.start / snapInterval) * snapInterval
                params.end = Math.round(params.end / snapInterval) * snapInterval
            }

            console.log("Moving action:", action.id, "from", start, "to", params.start, "end:", params.end)
            return true
        },
        [isSnapping, duration],
    )

    // Handle action resize
    const handleActionResizingFinal = useCallback(
        (params: { action: TimelineAction; row: TimelineRow; start: number; end: number; dir: "right" | "left" }) => {
            const { action, start, end, dir } = params

            // Check if action is flexible
            if (!action.flexible) {
                console.log("Action is not flexible:", action.id)
                return false
            }

            // Apply constraints
            const minStart = action.minStart || 0
            const maxEnd = action.maxEnd || duration
            const minDuration = 0.1 // Minimum 0.1 seconds

            // Ensure we don't go below minimum start time
            if (start < minStart) {
                params.start = minStart
            }

            // Ensure we don't go beyond maximum end time
            if (end > maxEnd) {
                params.end = maxEnd
            }

            // Ensure minimum duration
            if (end - start < minDuration) {
                if (dir === "right") {
                    params.end = start + minDuration
                } else {
                    params.start = end - minDuration
                }
            }

            // Apply snapping if enabled
            if (isSnapping) {
                const snapInterval = 1 / 30 // 30fps snap
                params.start = Math.round(params.start / snapInterval) * snapInterval
                params.end = Math.round(params.end / snapInterval) * snapInterval
            }

            console.log("Resizing action:", action.id, "dir:", dir, "start:", params.start, "end:", params.end)
            return true
        },
        [isSnapping, duration],
    )

    const addTrack = useCallback(
        (type: "video" | "audio" | "text" | "effect") => {
            const trackNumber = tracks.filter((t) => t.type === type).length + 1
            const newTrack: Track = {
                id: `${type}-${trackNumber}`,
                name: `${type.charAt(0).toUpperCase() + type.slice(1)} Track ${trackNumber}`,
                type,
                muted: false,
                solo: false,
                locked: false,
                visible: true,
                height: type === "video" ? 80 : type === "audio" ? 60 : type === "text" ? 50 : 70,
                color: type === "video" ? "#3b82f6" : type === "audio" ? "#10b981" : type === "text" ? "#f59e0b" : "#8b5cf6",
            }
            setTracks((prev) => [...prev, newTrack])
        },
        [tracks],
    )

    const deleteTrack = useCallback(
        (trackId: string) => {
            setTracks((prev) => prev.filter((t) => t.id !== trackId))
            // Move clips from deleted track to first available track
            const clipsToMove = clips.filter((c) => c.trackId === trackId)
            clipsToMove.forEach((clip) => {
                const firstTrack = tracks.find((t) => t.type === clip.type && t.id !== trackId)
                if (firstTrack) {
                    onUpdateClip(clip.id, { trackId: firstTrack.id })
                }
            })
        },
        [tracks, clips, onUpdateClip],
    )

    const moveTrack = useCallback((trackId: string, direction: "up" | "down") => {
        setTracks((prev) => {
            const newTracks = [...prev]
            const index = newTracks.findIndex((t) => t.id === trackId)
            if (index === -1) return prev

            const newIndex = direction === "up" ? index - 1 : index + 1
            if (newIndex < 0 || newIndex >= newTracks.length) return prev

            // Swap tracks
            const temp = newTracks[index]
            newTracks[index] = newTracks[newIndex]
            newTracks[newIndex] = temp
            return newTracks
        })
    }, [])

    const toggleTrackMute = useCallback((trackId: string) => {
        setTracks((prev) => prev.map((track) => (track.id === trackId ? { ...track, muted: !track.muted } : track)))
    }, [])

    const toggleTrackSolo = useCallback((trackId: string) => {
        setTracks((prev) =>
            prev.map(
                (track) => (track.id === trackId ? { ...track, solo: !track.solo } : { ...track, solo: false }), // Only one track can be solo at a time
            ),
        )
    }, [])

    const toggleTrackLock = useCallback((trackId: string) => {
        setTracks((prev) => prev.map((track) => (track.id === trackId ? { ...track, locked: !track.locked } : track)))
    }, [])

    const toggleTrackVisible = useCallback((trackId: string) => {
        setTracks((prev) => prev.map((track) => (track.id === trackId ? { ...track, visible: !track.visible } : track)))
    }, [])

    const getActionRender = useCallback(
        (action: TimelineAction, row: TimelineRow) => {
            const clip = clips.find((c) => c.id === action.id)
            const track = tracks.find((t) => t.id === row.id)
            if (!clip || !track) return null

            const isSelected = selectedClips.includes(action.id)
            const isHovered = hoveredClip === action.id
            const clipDuration = clip.endTime - clip.startTime

            return (
                <div
                    className={`h-full flex items-center px-2 relative overflow-hidden rounded-md transition-all duration-150 group ${isSelected
                        ? "ring-2 ring-blue-400 shadow-lg shadow-blue-500/50 scale-[1.02] z-10"
                        : isHovered
                            ? "ring-2 ring-blue-300/60 shadow-md scale-[1.01] z-5"
                            : "hover:shadow-md hover:scale-[1.005]"
                        } ${isDragging && isSelected ? "scale-105 shadow-xl shadow-blue-500/60" : ""}`}
                    style={{
                        backgroundColor: track.color,
                        backgroundImage: `linear-gradient(to bottom, ${track.color}, ${track.color}dd)`,
                        minWidth: "30px",
                        opacity: track.muted || clip.muted ? 0.4 : 1,
                        border: `1px solid ${isSelected ? "#60a5fa" : "rgba(255,255,255,0.1)"}`,
                    }}
                    onMouseEnter={() => setHoveredClip(clip.id)}
                    onMouseLeave={() => setHoveredClip(null)}
                >
                    {/* Thumbnail for video clips */}
                    {clip.thumbnail && clip.type === "video" && (
                        <div className="w-8 h-6 mr-2 rounded-sm overflow-hidden flex-shrink-0 border border-white/20 shadow-sm">
                            <img src={clip.thumbnail || "/placeholder.svg"} alt={clip.name} className="w-full h-full object-cover" />
                        </div>
                    )}

                    {/* Waveform for audio clips */}
                    {clip.waveform && clip.type === "audio" && (
                        <div className="flex items-center gap-0.5 mr-2 flex-shrink-0 h-full py-2">
                            {clip.waveform.slice(0, 12).map((amplitude, index) => (
                                <div
                                    key={index}
                                    className="bg-white/90 rounded-full transition-all duration-200"
                                    style={{
                                        width: "2px",
                                        height: `${Math.max(4, amplitude * 100)}%`,
                                        boxShadow: "0 0 2px rgba(255,255,255,0.5)",
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    {/* Icon for text clips */}
                    {clip.type === "text" && (
                        <div className="w-5 h-5 mr-2 flex-shrink-0 flex items-center justify-center bg-white/20 rounded backdrop-blur-sm">
                            <span className="text-xs font-bold text-white">T</span>
                        </div>
                    )}

                    {/* Icon for effect clips */}
                    {clip.type === "effect" && (
                        <div className="w-5 h-5 mr-2 flex-shrink-0 flex items-center justify-center bg-white/20 rounded backdrop-blur-sm">
                            <Layers className="h-3 w-3 text-white" />
                        </div>
                    )}

                    {/* Clip Name */}
                    <span className="text-xs text-white font-medium truncate flex-1 drop-shadow-sm">{clip.name}</span>

                    {/* Duration Badge */}
                    <div className="absolute top-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm font-mono">
                        {formatTime(clipDuration)}
                    </div>

                    {/* Status Indicators */}
                    <div className="absolute top-1 left-1 flex gap-1">
                        {clip.muted && (
                            <div className="w-4 h-4 bg-red-500/90 rounded-sm flex items-center justify-center shadow-sm backdrop-blur-sm">
                                <VolumeX className="h-2.5 w-2.5 text-white" />
                            </div>
                        )}
                        {clip.locked && (
                            <div className="w-4 h-4 bg-yellow-500/90 rounded-sm flex items-center justify-center shadow-sm backdrop-blur-sm">
                                <Lock className="h-2.5 w-2.5 text-white" />
                            </div>
                        )}
                        {!track.locked && !clip.locked && (
                            <div className="w-4 h-4 bg-green-500/90 rounded-sm flex items-center justify-center shadow-sm backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                                </svg>
                            </div>
                        )}
                    </div>

                    {/* Fade handles with gradient */}
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-0 w-2 bg-gradient-to-l from-black/20 to-transparent pointer-events-none" />

                    {/* Resize handles - visible on hover and only if flexible */}
                    {/* Note: The timeline library handles resize internally, these are just visual indicators */}
                    {track.locked === false && clip.locked === false && (
                        <>
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            <div className="absolute right-0 top-0 bottom-0 w-1 bg-blue-400 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        </>
                    )}

                    {/* Selection indicator */}
                    {isSelected && (
                        <div className="absolute inset-0 border-2 border-blue-400 rounded-md pointer-events-none animate-pulse" />
                    )}
                </div>
            )
        },
        [clips, tracks, selectedClips, hoveredClip, isDragging],
    )

    const getRowRender = useCallback(
        (row: TimelineRow) => {
            const track = tracks.find((t) => t.id === row.id)
            if (!track) return null

            const isSelected = selectedTracks.includes(track.id)
            const trackClips = clips.filter((c) => c.trackId === track.id)

            return (
                <div
                    className={`h-full flex items-center px-2 border-r border-gray-600/50 transition-all duration-200 ${isSelected ? "bg-blue-900/30 border-blue-500" : "bg-gray-800/50 hover:bg-gray-700/50"
                        }`}
                >
                    <div className="flex items-center gap-2 w-full">
                        {/* Track Color Indicator */}
                        <div
                            className="w-1 h-full rounded-full shadow-sm"
                            style={{
                                backgroundColor: track.color,
                                boxShadow: `0 0 8px ${track.color}40`,
                            }}
                        />

                        {/* Track Controls */}
                        <div className="flex items-center gap-0.5">
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`h-7 w-7 p-0 transition-all duration-200 ${track.muted
                                    ? "text-red-400 bg-red-500/10 hover:bg-red-500/20"
                                    : "text-gray-300 hover:text-white hover:bg-gray-600"
                                    }`}
                                onClick={() => toggleTrackMute(track.id)}
                                title={track.muted ? "Unmute track" : "Mute track"}
                            >
                                {track.muted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`h-7 w-7 p-0 transition-all duration-200 ${track.solo
                                    ? "text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20"
                                    : "text-gray-300 hover:text-white hover:bg-gray-600"
                                    }`}
                                onClick={() => toggleTrackSolo(track.id)}
                                title={track.solo ? "Unsolo track" : "Solo track"}
                            >
                                {track.solo ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`h-7 w-7 p-0 transition-all duration-200 ${track.locked
                                    ? "text-yellow-400 bg-yellow-500/10 hover:bg-yellow-500/20"
                                    : "text-gray-300 hover:text-white hover:bg-gray-600"
                                    }`}
                                onClick={() => toggleTrackLock(track.id)}
                                title={track.locked ? "Unlock track" : "Lock track"}
                            >
                                {track.locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                            </Button>
                        </div>

                        {/* Track Name and Info */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div
                                className="w-3 h-3 rounded-sm shadow-sm"
                                style={{
                                    backgroundColor: track.color,
                                    boxShadow: `0 0 4px ${track.color}60`,
                                }}
                            />
                            <div className="flex flex-col flex-1 min-w-0">
                                <span className="text-xs text-gray-200 truncate font-medium">{track.name}</span>
                                <span className="text-[10px] text-gray-500">
                                    {trackClips.length} {trackClips.length === 1 ? "clip" : "clips"} • {track.height}px
                                    {track.locked && " • 🔒 Locked"}
                                </span>
                            </div>
                        </div>

                        {/* Track Actions */}
                        <div className="flex items-center gap-0.5">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-200 hover:bg-gray-600 transition-all duration-200"
                                onClick={() => moveTrack(track.id, "up")}
                                title="Move track up"
                            >
                                <ChevronUp className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-200 hover:bg-gray-600 transition-all duration-200"
                                onClick={() => moveTrack(track.id, "down")}
                                title="Move track down"
                            >
                                <ChevronDown className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
                                onClick={() => deleteTrack(track.id)}
                                title="Delete track"
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                </div>
            )
        },
        [tracks, clips, selectedTracks, toggleTrackMute, toggleTrackSolo, toggleTrackLock, moveTrack, deleteTrack],
    )

    // Format time helper with frames
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        // Removed frames for cleaner display
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }

    const handleWheel = useCallback(
        (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault()
                const delta = e.deltaY > 0 ? -0.1 : 0.1
                const newZoom = Math.max(0.1, Math.min(10, zoom + delta))
                setZoom(newZoom)
            }
        },
        [zoom],
    )

    const handleTimelineClick = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (!timelineRef.current) return

            const rect = timelineRef.current.getBoundingClientRect()
            const x = e.clientX - rect.left
            const percentage = x / rect.width
            const newTime = percentage * duration
            onSeek(Math.max(0, Math.min(duration, newTime)))
        },
        [duration, onSeek],
    )

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

            switch (e.key) {
                case " ":
                    e.preventDefault()
                    onPlayPause()
                    break
                case "Delete":
                case "Backspace":
                    if (selectedClips.length > 0) {
                        e.preventDefault()
                        if (e.shiftKey) {
                            rippleDelete()
                        } else {
                            selectedClips.forEach((clipId) => onDeleteClip(clipId))
                            setSelectedClips([])
                        }
                    }
                    break
                case "Escape":
                    setSelectedClips([])
                    setSelectedTracks([])
                    setContextMenu(null)
                    setTool("select")
                    break
                case "s":
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault()
                        // Save project
                    } else {
                        e.preventDefault()
                        splitClipAtPlayhead()
                    }
                    break
                case "c":
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault()
                        copySelectedClips()
                    }
                    break
                case "v":
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault()
                        pasteClips()
                    }
                    break
                case "d":
                    if ((e.ctrlKey || e.metaKey) && selectedClips.length > 0) {
                        e.preventDefault()
                        selectedClips.forEach((clipId) => onDuplicateClip(clipId))
                    }
                    break
                case "a":
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault()
                        setSelectedClips(clips.map((c) => c.id))
                    }
                    break
                case "m":
                    e.preventDefault()
                    addMarker()
                    break
                case "ArrowLeft":
                    e.preventDefault()
                    if (e.shiftKey) {
                        jumpToMarker("previous")
                    } else {
                        navigateFrame("backward")
                    }
                    break
                case "ArrowRight":
                    e.preventDefault()
                    if (e.shiftKey) {
                        jumpToMarker("next")
                    } else {
                        navigateFrame("forward")
                    }
                    break
                case "Home":
                    e.preventDefault()
                    onSeek(0)
                    break
                case "End":
                    e.preventDefault()
                    onSeek(duration)
                    break
                case "f":
                    e.preventDefault()
                    fitToWindow()
                    break
                case "+":
                case "=":
                    e.preventDefault()
                    setZoom((prev) => Math.min(10, prev + 0.2))
                    break
                case "-":
                    e.preventDefault()
                    setZoom((prev) => Math.max(0.1, prev - 0.2))
                    break
            }
        }

        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [
        selectedClips,
        clips,
        onDeleteClip,
        onDuplicateClip,
        onPlayPause,
        rippleDelete,
        splitClipAtPlayhead,
        copySelectedClips,
        pasteClips,
        addMarker,
        navigateFrame,
        jumpToMarker,
        onSeek,
        duration,
        fitToWindow,
    ])

    useEffect(() => {
        const timeline = timelineRef.current
        if (!timeline) return

        timeline.addEventListener("wheel", handleWheel, { passive: false })
        return () => timeline.removeEventListener("wheel", handleWheel)
    }, [handleWheel])

    // Close context menu when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
            setContextMenu(null)
        }
        document.addEventListener("click", handleClickOutside)
        return () => document.removeEventListener("click", handleClickOutside)
    }, [])

    useEffect(() => {
        const handleMouseUp = () => {
            setIsDragging(false)
        }
        document.addEventListener("mouseup", handleMouseUp)
        return () => document.removeEventListener("mouseup", handleMouseUp)
    }, [])

    useEffect(() => {
        if (!timelineContainerRef.current || !isPlaying) return

        const container = timelineContainerRef.current
        const playheadPixelPosition = (currentTime / duration) * (container.scrollWidth - 200) + 200

        // Get visible area
        const containerLeft = container.scrollLeft
        const containerRight = containerLeft + container.clientWidth
        const margin = 100 // Keep playhead 100px from edges

        // Auto-scroll if playhead is near edges or outside visible area
        if (playheadPixelPosition > containerRight - margin) {
            container.scrollTo({
                left: playheadPixelPosition - container.clientWidth + margin,
                behavior: "smooth",
            })
        } else if (playheadPixelPosition < containerLeft + margin + 200) {
            container.scrollTo({
                left: Math.max(0, playheadPixelPosition - margin - 200),
                behavior: "smooth",
            })
        }
    }, [currentTime, duration, isPlaying])

    console.log("[v0] Rendering MultiTrackTimeline with data:", { timelineData, clips, tracks, markers, zoom })

    return (
        <div className="bg-[#0a0a0f] border-t border-gray-800 h-full flex flex-col">
            {/* Timeline Controls - Compact */}
            <div className="px-6 py-2 border-b border-gray-800/50 bg-[#0f0f14]/50">
                <div className="flex items-center justify-between">
                    {/* Left - Time Display */}
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-white font-mono">
                            {formatTime(currentTime)} <span className="text-gray-600">/</span> {formatTime(duration)}
                        </div>

                        <div className="flex items-center gap-1 border-l border-gray-700 pl-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`h-7 w-7 p-0 ${tool === "select" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}
                                onClick={() => setTool("select")}
                                title="Select Tool (V)"
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                                    />
                                </svg>
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`h-7 w-7 p-0 ${tool === "razor" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}
                                onClick={() => setTool("razor")}
                                title="Razor Tool (C)"
                            >
                                <Scissors className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Center - Playback Controls */}
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-white transition-all duration-200 disabled:opacity-30"
                            onClick={onRewind}
                            disabled={!isVideoReady}
                            title="Rewind (J)"
                        >
                            <SkipBack className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0 text-white hover:bg-gray-800 transition-all duration-200 rounded-full disabled:opacity-30"
                            onClick={onPlayPause}
                            disabled={!isVideoReady}
                            title="Play/Pause (Space)"
                        >
                            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-white transition-all duration-200 disabled:opacity-30"
                            onClick={onFastForward}
                            disabled={!isVideoReady}
                            title="Fast Forward (L)"
                        >
                            <SkipForward className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Right - Tools and Progress */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 border-r border-gray-700 pr-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-gray-400 hover:text-white"
                                onClick={() => setZoom((prev) => Math.max(0.1, prev - 0.2))}
                                title="Zoom Out (-)"
                            >
                                <ZoomOut className="h-4 w-4" />
                            </Button>
                            <span className="text-xs text-gray-500 font-mono w-12 text-center">{Math.round(zoom * 100)}%</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-gray-400 hover:text-white"
                                onClick={() => setZoom((prev) => Math.min(10, prev + 0.2))}
                                title="Zoom In (+)"
                            >
                                <ZoomIn className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-gray-400 hover:text-white"
                                onClick={fitToWindow}
                                title="Fit to Window (F)"
                            >
                                <Maximize2 className="h-4 w-4" />
                            </Button>
                        </div>

                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-gray-400 hover:text-white"
                            onClick={addMarker}
                            title="Add Marker (M)"
                        >
                            <Bookmark className="h-4 w-4" />
                        </Button>

                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-white" title="Search">
                            <Search className="h-4 w-4" />
                        </Button>
                        <div className="w-32 h-1 bg-gray-800 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-purple-600 rounded-full transition-all duration-200"
                                style={{ width: `${playheadPosition}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div
                ref={timelineRef}
                className="relative bg-[#0a0a0f] px-6 py-2 border-b border-gray-800/30 cursor-pointer"
                onClick={handleTimelineClick}
            >
                <div className="flex items-center justify-between text-xs text-gray-500 font-mono">
                    {Array.from({ length: 11 }).map((_, i) => {
                        const time = (duration / 10) * i
                        return (
                            <div key={i} className="flex flex-col items-center">
                                <span>{formatTime(time)}</span>
                                <div className="w-px h-2 bg-gray-700 mt-1" />
                            </div>
                        )
                    })}
                </div>

                {markers.map((marker) => {
                    const position = (marker.time / duration) * 100
                    return (
                        <div
                            key={marker.id}
                            className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-40 cursor-pointer group"
                            style={{ left: `${position}%` }}
                            title={marker.label}
                        >
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 rounded-full shadow-lg" />
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {marker.label}
                            </div>
                        </div>
                    )
                })}
            </div>

            <div ref={timelineContainerRef} className="flex-1 relative overflow-hidden">
                <Timeline
                    ref={timelineState}
                    editorData={timelineData}
                    effects={effectsMap}
                    onChange={handleTimelineChangeFinal}
                    onCursorDrag={handleCursorDrag}
                    onCursorDragStart={handleCursorDragStart}
                    onCursorDragEnd={handleCursorDragEnd}
                    onClickTimeArea={handleClickTimeArea}
                    onClickAction={handleActionClick}
                    onActionMoving={handleActionMovingFinal}
                    onActionResizing={handleActionResizingFinal}
                    getActionRender={getActionRender}
                    scale={zoom}
                    startLeft={200}
                    autoScroll={true}
                    dragLine={true}
                    hideCursor={false}
                    gridSnap={isSnapping}
                    style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: "#0a0a0f",
                    }}
                    rowHeight={tracks.reduce((max, track) => Math.max(max, track.height), 60)}
                />

                {/* Markers overlay */}
                {markers.map((marker) => {
                    const position = (marker.time / duration) * 100
                    return (
                        <div
                            key={marker.id}
                            className="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-40 pointer-events-none"
                            style={{ left: `calc(200px + ${position}%)` }}
                        >
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 rounded-full" />
                        </div>
                    )
                })}
            </div>

            <div className="px-6 py-1 border-t border-gray-800/50 bg-[#0f0f14]/50">
                <div className="text-[10px] text-gray-600 flex items-center gap-4">
                    <span>Space: Play/Pause</span>
                    <span>S: Split</span>
                    <span>M: Marker</span>
                    <span>←→: Frame</span>
                    <span>Del: Delete</span>
                    <span>+/-: Zoom</span>
                </div>
            </div>
        </div>
    )
}
