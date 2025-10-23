'use client'

import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    RotateCcw,
    Settings,
    Zap,
    Undo2,
    Redo2,
    Sun,
    Moon,
    Grid3X3,
    Clock,
    Loader2
} from 'lucide-react'
import { aspectRatioTemplates } from '@/lib/templates/aspectRatioTemplates'

interface VideoEditorToolbarProps {
    currentTime: number
    duration: number
    aspectRatio: string
    isDarkMode: boolean
    isProcessing: boolean
    onCancel: () => void
    onAspectRatioChange: (ratio: string) => void
    onExportClick: () => void
    onForceReady: () => void
    formatTime: (seconds: number) => string
}

export default function VideoEditorToolbar({
    currentTime,
    duration,
    aspectRatio,
    isDarkMode,
    isProcessing,
    onCancel,
    onAspectRatioChange,
    onExportClick,
    onForceReady,
    formatTime
}: VideoEditorToolbarProps) {
    return (
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
                    {/* Video Info Overlay - Top Left */}
                    <div className="flex gap-2 z-20">
                        <div className="bg-black/60 backdrop-blur-md text-white text-xs px-2.5 py-1.5 rounded-lg border border-white/10 shadow-lg">
                            <Clock className="h-3 w-3 inline mr-1.5" />
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </div>
                        <Select value={aspectRatio} onValueChange={onAspectRatioChange}>
                            <SelectTrigger className="bg-black/60 backdrop-blur-md text-white text-xs px-2.5 py-1.5 rounded-lg border border-white/10 shadow-lg h-auto w-auto min-w-[80px]">
                                <SelectValue>
                                    <span className="flex items-center gap-1">
                                        {aspectRatioTemplates.find(t => t.ratio === aspectRatio)?.icon || '📐'}
                                        {aspectRatio}
                                    </span>
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="bg-gray-900 border-gray-700">
                                {aspectRatioTemplates.map((template) => (
                                    <SelectItem
                                        key={template.id}
                                        value={template.ratio}
                                        className="text-white hover:bg-gray-800 focus:bg-gray-800"
                                    >
                                        <span className="flex items-center gap-2">
                                            <span>{template.icon}</span>
                                            <span className="font-medium">{template.ratio}</span>
                                            <span className="text-gray-400 text-xs">{template.name}</span>
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
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
                        className="text-gray-400 hover:text-white h-7 px-2"
                        onClick={onForceReady}
                        title="Force video ready (debug)"
                    >
                        <span className="text-xs">Force Ready</span>
                    </Button>
                    <div className="h-4 w-px bg-gray-600" />
                    <Button
                        onClick={onExportClick}
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
    )
}
