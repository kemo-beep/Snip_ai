'use client'

import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Scissors,
    Crop,
    RotateCcw,
    ZoomIn,
    ZoomOut
} from 'lucide-react'

interface BottomTimelineProps {
    isPlaying: boolean
    currentTime: number
    duration: number
    trimRange: { start: number; end: number }
    onPlayPause: () => void
    onSeek: (time: number) => void
    onTrimStartChange: (value: number[]) => void
    onTrimEndChange: (value: number[]) => void
    onRewind: () => void
    onFastForward: () => void
    onCrop: () => void
    onAspectRatioChange: (ratio: string) => void
    isVideoReady: boolean
    aspectRatio: string
}

export default function BottomTimeline({
    isPlaying,
    currentTime,
    duration,
    trimRange,
    onPlayPause,
    onSeek,
    onTrimStartChange,
    onTrimEndChange,
    onRewind,
    onFastForward,
    onCrop,
    onAspectRatioChange,
    isVideoReady,
    aspectRatio
}: BottomTimelineProps) {
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const generateTimeMarkers = () => {
        const markers = []
        const interval = Math.max(1, Math.floor(duration / 6))
        for (let i = 0; i <= duration; i += interval) {
            markers.push(i)
        }
        return markers
    }

    const timeMarkers = generateTimeMarkers()

    return (
        <div className="bg-gray-800/95 backdrop-blur-sm border-t border-gray-700 px-3 py-2 shadow-lg">
            <div className="flex items-center justify-between">
                {/* Left Controls */}
                <div className="flex items-center gap-2">
                    <div className="relative">
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
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3 transition-all duration-200 hover:bg-blue-600 hover:border-blue-500 hover:text-white hover:scale-105"
                        onClick={onCrop}
                    >
                        <Crop className="h-3 w-3 mr-1" />
                        <span className="text-xs">Crop</span>
                    </Button>
                </div>

                {/* Center Playback Controls */}
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

                {/* Right Controls */}
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Scissors className="h-4 w-4" />
                    </Button>

                    {/* Timeline Slider */}
                    <div className="flex items-center gap-3">
                        <div className="w-48">
                            <Slider
                                value={[isFinite(currentTime) ? currentTime : 0]}
                                onValueChange={(value) => onSeek(value[0])}
                                max={isFinite(duration) && duration > 0 ? duration : 1}
                                step={0.1}
                                className="w-full"
                                disabled={!isVideoReady}
                            />
                        </div>

                        {/* Time Display */}
                        <div className="text-xs text-gray-300 font-mono min-w-[80px] text-center">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </div>
                    </div>

                    {/* Zoom Controls */}
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <ZoomOut className="h-3 w-3" />
                        </Button>
                        <span className="text-xs text-gray-300">Q 2x</span>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <ZoomIn className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                            Auto
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Timeline */}
            <div className="mt-2">
                {/* Time Markers */}
                <div className="flex justify-between text-xs text-gray-400 mb-2">
                    {timeMarkers.map((time, index) => (
                        <span key={index}>{time}s</span>
                    ))}
                </div>

                {/* Timeline Track */}
                <div className="relative h-8 bg-gray-700/80 rounded-lg overflow-hidden shadow-inner border border-gray-600">
                    {/* Trim Range Indicator */}
                    <div
                        className="absolute top-0 h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-lg shadow-lg"
                        style={{
                            left: `${(trimRange.start / duration) * 100}%`,
                            width: `${((trimRange.end - trimRange.start) / duration) * 100}%`
                        }}
                    >
                        <div className="flex items-center justify-between h-full px-2">
                            <span className="text-xs text-white font-medium">Clip</span>
                            <div className="text-xs text-white">
                                <div>{formatTime(trimRange.end - trimRange.start)}</div>
                                <div>1x</div>
                            </div>
                        </div>
                    </div>

                    {/* Playhead */}
                    <div
                        className="absolute top-0 w-0.5 h-full bg-blue-500 z-10"
                        style={{ left: `${(currentTime / duration) * 100}%` }}
                    />

                    {/* Trim Handles */}
                    <div
                        className="absolute top-0 w-3 h-3 bg-yellow-500 rounded-full border-2 border-white transform -translate-x-1.5 -translate-y-1 cursor-ew-resize"
                        style={{ left: `${(trimRange.start / duration) * 100}%` }}
                    />
                    <div
                        className="absolute top-0 w-3 h-3 bg-yellow-500 rounded-full border-2 border-white transform -translate-x-1.5 -translate-y-1 cursor-ew-resize"
                        style={{ left: `${(trimRange.end / duration) * 100}%` }}
                    />

                    {/* Audio Waveform Placeholder */}
                    <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-600">
                        <div className="h-full bg-blue-400 opacity-50" style={{ width: '100%' }}>
                            {/* Waveform pattern would go here */}
                        </div>
                    </div>
                </div>

                {/* Trim Controls */}
                <div className="mt-2 flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">Start:</span>
                        <Slider
                            value={[isFinite(trimRange.start) ? trimRange.start : 0]}
                            onValueChange={onTrimStartChange}
                            max={isFinite(duration) && duration > 0 ? duration : 1}
                            step={0.1}
                            className="w-24"
                            disabled={!isVideoReady}
                        />
                        <span className="text-xs text-gray-400 w-12">
                            {formatTime(trimRange.start)}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">End:</span>
                        <Slider
                            value={[isFinite(trimRange.end) ? trimRange.end : 0]}
                            onValueChange={onTrimEndChange}
                            max={isFinite(duration) && duration > 0 ? duration : 1}
                            step={0.1}
                            className="w-24"
                            disabled={!isVideoReady}
                        />
                        <span className="text-xs text-gray-400 w-12">
                            {formatTime(trimRange.end)}
                        </span>
                    </div>

                    <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Reset
                    </Button>
                </div>
            </div>
        </div>
    )
}
