'use client'

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { Timeline, TimelineEffect, TimelineRow, TimelineAction } from '@xzdarcy/react-timeline-editor'
import { Button } from './ui/button'
import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    ZoomIn,
    ZoomOut,
    Grid3X3,
    Scissors,
    Volume2,
    VolumeX,
    Lock
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
    selected?: boolean
}

interface ProperTimelineProps {
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

export default function ProperTimeline({
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
    onDuplicateClip
}: ProperTimelineProps) {
    const [zoom, setZoom] = useState(1)
    const [isSnapping, setIsSnapping] = useState(true)
    const [showGrid, setShowGrid] = useState(true)
    const [selectedClips, setSelectedClips] = useState<string[]>([])

    // Create timeline data with proper structure
    const timelineData: TimelineRow[] = useMemo(() => {
        console.log('Creating timeline data with clips:', clips)

        const videoClips = clips.filter(clip => clip.type === 'video')
        const audioClips = clips.filter(clip => clip.type === 'audio')

        // Create proper timeline rows
        const rows: TimelineRow[] = [
            {
                id: 'video-track',
                actions: videoClips.map(clip => ({
                    id: clip.id,
                    start: clip.startTime,
                    end: clip.endTime,
                    effectId: `video-${clip.id}`,
                    flexible: true,
                    movable: true,
                    removable: true
                }))
            },
            {
                id: 'audio-track',
                actions: audioClips.map(clip => ({
                    id: clip.id,
                    start: clip.startTime,
                    end: clip.endTime,
                    effectId: `audio-${clip.id}`,
                    flexible: true,
                    movable: true,
                    removable: true
                }))
            }
        ]

        console.log('Timeline data created:', rows)
        return rows
    }, [clips])

    // Create effects
    const effects: Record<string, TimelineEffect> = useMemo(() => {
        const effectsMap: Record<string, TimelineEffect> = {}

        clips.forEach(clip => {
            const effectId = `${clip.type}-${clip.id}`
            effectsMap[effectId] = {
                id: effectId,
                name: clip.name
            }
        })

        return effectsMap
    }, [clips])

    // Handle timeline changes
    const handleTimelineChange = useCallback((editorData: TimelineRow[]) => {
        console.log('Timeline changed:', editorData)
        editorData.forEach(row => {
            row.actions.forEach(action => {
                const clipId = action.id
                const clip = clips.find(c => c.id === clipId)
                if (clip) {
                    onUpdateClip(clipId, {
                        startTime: action.start,
                        endTime: action.end
                    })
                }
            })
        })
    }, [clips, onUpdateClip])

    // Handle cursor drag
    const handleCursorDrag = useCallback((time: number) => {
        onSeek(time)
    }, [onSeek])

    // Handle action click
    const handleActionClick = useCallback((e: React.MouseEvent, param: { action: TimelineAction; row: TimelineRow; time: number }) => {
        e.stopPropagation()
        const { action } = param

        if (e.ctrlKey || e.metaKey) {
            setSelectedClips(prev =>
                prev.includes(action.id)
                    ? prev.filter(id => id !== action.id)
                    : [...prev, action.id]
            )
        } else {
            setSelectedClips([action.id])
        }
    }, [])

    // Custom action render
    const getActionRender = useCallback((action: TimelineAction, row: TimelineRow) => {
        const clip = clips.find(c => c.id === action.id)
        if (!clip) return null

        const isSelected = selectedClips.includes(action.id)

        return (
            <div
                className={`h-full flex items-center px-2 relative overflow-hidden rounded ${isSelected ? 'ring-2 ring-blue-400 shadow-lg' : 'hover:shadow-sm'
                    }`}
                style={{
                    backgroundColor: clip.color,
                    minWidth: '20px',
                    opacity: clip.muted ? 0.5 : 1
                }}
            >
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
        )
    }, [clips, selectedClips])

    // Format time helper
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        const frames = Math.floor((seconds % 1) * 30)
        return `${mins}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`
    }

    // Handle zoom
    const handleZoom = useCallback((delta: number) => {
        const newZoom = Math.max(0.1, Math.min(10, zoom + delta * 0.1))
        setZoom(newZoom)
    }, [zoom])

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

            switch (e.key) {
                case 'Delete':
                case 'Backspace':
                    if (selectedClips.length > 0) {
                        selectedClips.forEach(clipId => onDeleteClip(clipId))
                        setSelectedClips([])
                    }
                    break
                case 'Escape':
                    setSelectedClips([])
                    break
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [selectedClips, onDeleteClip])

    console.log('Rendering ProperTimeline with data:', { timelineData, effects, clips })

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
                                <div className="w-full h-2 bg-gray-600 rounded-lg flex items-center">
                                    <div
                                        className="h-full bg-purple-500 rounded-lg transition-all duration-200"
                                        style={{ width: `${(zoom / 10) * 100}%` }}
                                    />
                                </div>
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
                        <div className="text-xs text-gray-400">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </div>
                        {selectedClips.length > 0 && (
                            <div className="text-xs text-blue-400">
                                {selectedClips.length} selected
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Timeline Area */}
            <div className="relative" style={{ height: '300px' }}>
                <Timeline
                    editorData={timelineData}
                    effects={effects}
                    onChange={handleTimelineChange}
                    onCursorDrag={handleCursorDrag}
                    onClickAction={handleActionClick}
                    scale={zoom}
                    scaleSplitCount={10}
                    scaleWidth={80}
                    startLeft={20}
                    rowHeight={60}
                    gridSnap={isSnapping}
                    autoScroll={true}
                    getActionRender={getActionRender}
                    style={{
                        backgroundColor: '#1f2937',
                        color: '#e5e7eb'
                    }}
                />
            </div>

            {/* Status Bar */}
            <div className="px-4 py-2 bg-gray-900 border-t border-gray-700 text-xs text-gray-400">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span>Zoom: {Math.round(zoom * 100)}%</span>
                        <span>Duration: {formatTime(duration)}</span>
                        <span>Clips: {clips.length}</span>
                        <span>Video: {clips.filter(c => c.type === 'video').length}</span>
                        <span>Audio: {clips.filter(c => c.type === 'audio').length}</span>
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
