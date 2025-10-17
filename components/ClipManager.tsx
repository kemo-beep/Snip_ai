'use client'

import React, { useState, useRef, useCallback } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import {
    Plus,
    Upload,
    Video,
    Music,
    Image,
    Trash2,
    Copy,
    Scissors,
    Volume2,
    VolumeX,
    Lock,
    Unlock
} from 'lucide-react'

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

interface ClipManagerProps {
    onAddClip: (clip: Clip) => void
    onRemoveClip: (clipId: string) => void
    onUpdateClip: (clipId: string, updates: Partial<Clip>) => void
    clips: Clip[]
}

export default function ClipManager({
    onAddClip,
    onRemoveClip,
    onUpdateClip,
    clips
}: ClipManagerProps) {
    const [selectedClips, setSelectedClips] = useState<string[]>([])
    const [isDragging, setIsDragging] = useState(false)
    const [dragClip, setDragClip] = useState<Clip | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Generate waveform data for audio clips
    const generateWaveform = (duration: number) => {
        const samples = Math.floor(duration * 10) // 10 samples per second
        return Array.from({ length: samples }, () => Math.random() * 0.8 + 0.1)
    }

    // Handle file upload
    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files
        if (!files) return

        Array.from(files).forEach((file) => {
            const duration = file.type.startsWith('video/') ? 30 :
                file.type.startsWith('audio/') ? 60 : 5
            const clip: Clip = {
                id: `clip-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: file.type.startsWith('video/') ? 'video' :
                    file.type.startsWith('audio/') ? 'audio' : 'effect',
                name: file.name,
                duration: duration,
                startTime: 0,
                endTime: duration,
                trackId: file.type.startsWith('video/') ? 'video-1' : 'audio-1',
                thumbnail: file.type.startsWith('video/') ?
                    URL.createObjectURL(file) : undefined,
                waveform: file.type.startsWith('audio/') ?
                    generateWaveform(60) : undefined,
                color: file.type.startsWith('video/') ? '#3b82f6' :
                    file.type.startsWith('audio/') ? '#10b981' : '#f59e0b'
            }
            onAddClip(clip)
        })
    }

    // Handle drag start
    const handleDragStart = (e: React.DragEvent, clip: Clip) => {
        setIsDragging(true)
        setDragClip(clip)
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', clip.id)
    }

    // Handle drag end
    const handleDragEnd = () => {
        setIsDragging(false)
        setDragClip(null)
    }

    // Handle clip selection
    const handleClipSelect = (clipId: string, multiSelect: boolean = false) => {
        if (multiSelect) {
            setSelectedClips(prev =>
                prev.includes(clipId)
                    ? prev.filter(id => id !== clipId)
                    : [...prev, clipId]
            )
        } else {
            setSelectedClips([clipId])
        }
    }

    // Handle clip actions
    const handleClipAction = (action: string, clipId: string) => {
        switch (action) {
            case 'duplicate':
                const clip = clips.find(c => c.id === clipId)
                if (clip) {
                    onAddClip({ ...clip, id: `clip-${Date.now()}` })
                }
                break
            case 'delete':
                onRemoveClip(clipId)
                setSelectedClips(prev => prev.filter(id => id !== clipId))
                break
            case 'mute':
                onUpdateClip(clipId, { muted: !clips.find(c => c.id === clipId)?.muted })
                break
            case 'lock':
                onUpdateClip(clipId, { locked: !clips.find(c => c.id === clipId)?.locked })
                break
        }
    }

    // Handle batch actions
    const handleBatchAction = (action: string) => {
        selectedClips.forEach(clipId => {
            handleClipAction(action, clipId)
        })
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Media Library</h3>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            className="h-8 px-3"
                        >
                            <Upload className="h-4 w-4 mr-2" />
                            Import
                        </Button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="video/*,audio/*,image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                    </div>
                </div>

                {/* Batch Actions */}
                {selectedClips.length > 0 && (
                    <div className="flex items-center gap-2 p-2 bg-blue-900/20 rounded-lg">
                        <span className="text-sm text-blue-300">
                            {selectedClips.length} selected
                        </span>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleBatchAction('duplicate')}
                                title="Duplicate"
                            >
                                <Copy className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleBatchAction('mute')}
                                title="Toggle Mute"
                            >
                                <Volume2 className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleBatchAction('lock')}
                                title="Toggle Lock"
                            >
                                <Lock className="h-3 w-3" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                                onClick={() => handleBatchAction('delete')}
                                title="Delete"
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Clips List */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                    {clips.map((clip) => (
                        <div
                            key={clip.id}
                            className={`group relative p-3 rounded-lg border cursor-pointer transition-all duration-200 ${selectedClips.includes(clip.id)
                                ? 'border-blue-500 bg-blue-900/20'
                                : 'border-gray-600 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-700/50'
                                }`}
                            draggable
                            onDragStart={(e) => handleDragStart(e, clip)}
                            onDragEnd={handleDragEnd}
                            onClick={(e) => handleClipSelect(clip.id, e.ctrlKey || e.metaKey)}
                        >
                            {/* Clip Thumbnail */}
                            <div className="flex items-start gap-3">
                                <div className="relative">
                                    {clip.thumbnail ? (
                                        <img
                                            src={clip.thumbnail}
                                            alt={clip.name}
                                            className="w-12 h-8 object-cover rounded"
                                        />
                                    ) : (
                                        <div
                                            className="w-12 h-8 rounded flex items-center justify-center"
                                            style={{ backgroundColor: clip.color }}
                                        >
                                            {clip.type === 'video' && <Video className="h-4 w-4 text-white" />}
                                            {clip.type === 'audio' && <Music className="h-4 w-4 text-white" />}
                                            {clip.type === 'effect' && <Image className="h-4 w-4 text-white" />}
                                        </div>
                                    )}

                                    {/* Status Indicators */}
                                    <div className="absolute -top-1 -right-1 flex gap-1">
                                        {clip.muted && (
                                            <div className="w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                                                <VolumeX className="h-2 w-2 text-white" />
                                            </div>
                                        )}
                                        {clip.locked && (
                                            <div className="w-3 h-3 bg-yellow-500 rounded-full flex items-center justify-center">
                                                <Lock className="h-2 w-2 text-white" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Clip Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-medium text-white truncate">
                                            {clip.name}
                                        </h4>
                                        <span className="text-xs text-gray-400">
                                            {clip.duration.toFixed(1)}s
                                        </span>
                                    </div>

                                    {/* Waveform for audio clips */}
                                    {clip.waveform && (
                                        <div className="mt-1 flex items-center gap-1 h-2">
                                            {clip.waveform.slice(0, 20).map((amplitude, index) => (
                                                <div
                                                    key={index}
                                                    className="bg-gray-500 rounded-sm"
                                                    style={{
                                                        width: '2px',
                                                        height: `${amplitude * 100}%`
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleClipAction('duplicate', clip.id)
                                        }}
                                        title="Duplicate"
                                    >
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleClipAction('mute', clip.id)
                                        }}
                                        title="Toggle Mute"
                                    >
                                        {clip.muted ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleClipAction('lock', clip.id)
                                        }}
                                        title="Toggle Lock"
                                    >
                                        {clip.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleClipAction('delete', clip.id)
                                        }}
                                        title="Delete"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {clips.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                            <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="text-sm">No media files imported yet</p>
                            <p className="text-xs mt-1">Click "Import" to add video, audio, or image files</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
