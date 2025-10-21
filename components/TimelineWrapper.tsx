'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { Timeline, TimelineEffect, TimelineRow } from '@xzdarcy/react-timeline-editor'
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
    Eye,
    EyeOff,
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
}

interface TimelineWrapperProps {
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

export default function TimelineWrapper({
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
}: TimelineWrapperProps) {
    const [zoom, setZoom] = useState(1)
    const [isSnapping, setIsSnapping] = useState(true)
    const [showGrid, setShowGrid] = useState(true)

    // Calculate the earliest start time of all clips
    const earliestStartTime = useMemo(() => {
        if (clips.length === 0) return 0
        return Math.min(...clips.map(clip => clip.startTime))
    }, [clips])

    // Convert clips to TimelineRow format, adjusting start times to be relative to the earliest clip
    const timelineData: TimelineRow[] = useMemo(() => {
        const videoClips = clips.filter(clip => clip.type === 'video')
        const audioClips = clips.filter(clip => clip.type === 'audio')

        const rows: TimelineRow[] = []

        // Always create video track, even if empty
        rows.push({
            id: 'video-1',
            actions: videoClips.map(clip => ({
                id: clip.id,
                start: clip.startTime - earliestStartTime, // Adjust to start from 0
                end: clip.endTime - earliestStartTime,     // Adjust to start from 0
                effectId: `video-${clip.id}`,
                flexible: false,
                movable: true,
                removable: true
            }))
        })

        // Always create audio track, even if empty
        rows.push({
            id: 'audio-1',
            actions: audioClips.map(clip => ({
                id: clip.id,
                start: clip.startTime - earliestStartTime, // Adjust to start from 0
                end: clip.endTime - earliestStartTime,     // Adjust to start from 0
                effectId: `audio-${clip.id}`,
                flexible: false,
                movable: true,
                removable: true
            }))
        })

        return rows
    }, [clips, earliestStartTime])

    // Create effects mapping
    const effects: Record<string, TimelineEffect> = useMemo(() => {
        const effectsMap: Record<string, TimelineEffect> = {}

        clips.forEach(clip => {
            const effectId = `${clip.type}-${clip.id}`
            effectsMap[effectId] = {
                id: effectId,
                name: clip.name,
                source: clip.thumbnail || undefined,
                color: clip.color
            }
        })

        return effectsMap
    }, [clips])

    // Handle timeline data changes
    const handleTimelineChange = useCallback((editorData: TimelineRow[]) => {
        editorData.forEach(row => {
            row.actions.forEach(action => {
                const clipId = action.id
                const clip = clips.find(c => c.id === clipId)
                if (clip) {
                    // Convert back to absolute time by adding the earliest start time
                    onUpdateClip(clipId, {
                        startTime: action.start + earliestStartTime,
                        endTime: action.end + earliestStartTime
                    })
                }
            })
        })
    }, [clips, onUpdateClip, earliestStartTime])

    // Handle playhead change
    const handlePlayheadChange = useCallback((time: number) => {
        // Convert timeline time back to absolute time
        onSeek(time + earliestStartTime)
    }, [onSeek, earliestStartTime])

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        const frames = Math.floor((seconds % 1) * 30) // Assuming 30fps
        return `${mins}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`
    }

    const handleZoom = (delta: number) => {
        const newZoom = Math.max(0.1, Math.min(10, zoom + delta * 0.1))
        setZoom(newZoom)
    }

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
                    </div>
                </div>
            </div>

            {/* Timeline Area */}
            <div className="relative" style={{ height: '300px' }}>
                <Timeline
                    editorData={timelineData}
                    effects={effects}
                    onChange={handleTimelineChange}
                    onPlayheadChange={handlePlayheadChange}
                    currentTime={currentTime - earliestStartTime}
                    duration={duration - earliestStartTime}
                    autoScroll={true}
                    scale={zoom}
                    scaleSplitCount={10}
                    getActionRender={(action, row) => {
                        const clip = clips.find(c => c.id === action.id)
                        if (!clip) return null

                        return (
                            <div
                                className="h-full flex items-center px-2 relative overflow-hidden rounded"
                                style={{
                                    backgroundColor: clip.color,
                                    minWidth: '20px'
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
                    }}
                    getRowRender={(row) => {
                        const isVideo = row.id === 'video-1'
                        const isAudio = row.id === 'audio-1'

                        return (
                            <div className="h-full flex items-center px-3 bg-gray-700 border-r border-gray-600">
                                <div className="flex items-center gap-2 w-full">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        title="Mute track"
                                    >
                                        <Volume2 className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        title="Solo track"
                                    >
                                        <EyeOff className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        title="Lock track"
                                    >
                                        <Lock className="h-3 w-3" />
                                    </Button>
                                    <span className="text-xs text-gray-300 truncate">
                                        {isVideo ? 'Video Track 1' : isAudio ? 'Audio Track 1' : row.id}
                                    </span>
                                </div>
                            </div>
                        )
                    }}
                    dragLineOffset={0}
                    editorProps={{
                        scale: zoom,
                        scaleSplitCount: 10,
                        scaleWidth: 60,
                        scaleHeight: 30,
                        startLeft: 20,
                        scaleMarkHeight: 20,
                        scaleNumberHeight: 20,
                        scaleMarkStyle: {
                            backgroundColor: '#4a5568',
                            color: '#e2e8f0'
                        },
                        scaleNumberStyle: {
                            color: '#e2e8f0',
                            fontSize: 12
                        },
                        scaleGap: 1
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
