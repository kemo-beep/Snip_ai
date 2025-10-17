'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Square,
    MousePointer,
    Video,
    MessageCircle,
    Volume2,
    Link,
    Wand2,
    Type,
    Image as ImageIcon,
    Palette,
    Crop,
    Settings,
    FolderOpen
} from 'lucide-react'
import ClipManager from './ClipManager'

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

interface RightSidebarProps {
    overlays: Array<{
        id: string
        type: 'text' | 'image'
        content: string
        x: number
        y: number
        width: number
        height: number
        startTime: number
        endTime: number
    }>
    onAddOverlay: (overlay: any) => void
    onRemoveOverlay: (id: string) => void
    currentTime: number
    duration: number
    formatTime: (seconds: number) => string
    backgroundSettings: {
        type: 'wallpaper' | 'gradient' | 'color' | 'image'
        wallpaperIndex: number
        blurAmount: number
        padding: number
        borderRadius: number
        backgroundColor: string
        gradientColors: string[]
    }
    onBackgroundChange: (settings: any) => void
    clips: Clip[]
    onAddClip: (clip: Clip) => void
    onRemoveClip: (clipId: string) => void
    onUpdateClip: (clipId: string, updates: Partial<Clip>) => void
}

export default function RightSidebar({
    overlays,
    onAddOverlay,
    onRemoveOverlay,
    currentTime,
    duration,
    formatTime,
    backgroundSettings,
    onBackgroundChange,
    clips,
    onAddClip,
    onRemoveClip,
    onUpdateClip
}: RightSidebarProps) {
    const [activeTab, setActiveTab] = useState('background')
    const [showAddOverlay, setShowAddOverlay] = useState(false)
    const [newOverlay, setNewOverlay] = useState({
        type: 'text' as 'text' | 'image',
        content: '',
        x: 50,
        y: 50,
        width: 200,
        height: 50,
        startTime: 0,
        endTime: 5
    })

    const tabs = [
        { id: 'media', icon: FolderOpen, label: 'Media' },
        { id: 'background', icon: Square, label: 'Background' },
        { id: 'cursor', icon: MousePointer, label: 'Cursor' },
        { id: 'camera', icon: Video, label: 'Camera' },
        { id: 'chat', icon: MessageCircle, label: 'Chat' },
        { id: 'audio', icon: Volume2, label: 'Audio' },
        { id: 'link', icon: Link, label: 'Link' },
        { id: 'magic', icon: Wand2, label: 'Magic' },
        { id: 'draw', icon: Type, label: 'Draw' }
    ]

    const handleAddOverlay = () => {
        if (newOverlay.content) {
            onAddOverlay({
                id: Date.now().toString(),
                ...newOverlay
            })
            setNewOverlay({
                type: 'text',
                content: '',
                x: 50,
                y: 50,
                width: 200,
                height: 50,
                startTime: 0,
                endTime: 5
            })
            setShowAddOverlay(false)
        }
    }

    const renderBackgroundTab = () => (
        <div className="space-y-2">
            {/* Background Type Tabs */}
            <div className="flex gap-1 bg-gray-700 p-1 rounded-lg">
                {['wallpaper', 'gradient', 'color', 'image'].map((type) => (
                    <button
                        key={type}
                        onClick={() => onBackgroundChange({ ...backgroundSettings, type: type as any })}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${backgroundSettings.type === type
                            ? 'bg-purple-600 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-gray-600'
                            }`}
                    >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                ))}
            </div>

            {/* Wallpaper Section */}
            {backgroundSettings.type === 'wallpaper' && (
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Square className="h-4 w-4" />
                        <h3 className="font-medium text-sm">Wallpaper</h3>
                    </div>

                    {/* Wallpaper Grid */}
                    <div className="grid grid-cols-4 gap-1">
                        {Array.from({ length: 15 }, (_, i) => (
                            <div
                                key={i}
                                onClick={() => onBackgroundChange({ ...backgroundSettings, wallpaperIndex: i })}
                                className={`aspect-square rounded cursor-pointer border transition-all duration-200 group ${backgroundSettings.wallpaperIndex === i
                                    ? 'border-purple-500 scale-105 shadow-lg'
                                    : 'border-transparent hover:border-purple-300 hover:scale-105 hover:shadow-md'
                                    }`}
                                style={{
                                    background: `linear-gradient(45deg, 
                        hsl(${i * 24}, 70%, 60%), 
                        hsl(${i * 24 + 120}, 70%, 60%), 
                        hsl(${i * 24 + 240}, 70%, 60%)
                      )`
                                }}
                            >
                                {/* <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200 rounded"></div> */}
                            </div>
                        ))}
                    </div>

                    <p className="text-xs text-gray-500 mt-2">
                        Background gradients were created by <a href="#" className="underline">raycast.com</a>
                    </p>
                </div>
            )}

            {/* Gradient Section */}
            {backgroundSettings.type === 'gradient' && (
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Square className="h-4 w-4" />
                        <h3 className="font-medium text-sm">Gradient</h3>
                    </div>

                    <div className="space-y-2">
                        <div>
                            <Label className="text-xs text-gray-400">Color 1</Label>
                            <div className="flex gap-1 mt-1">
                                <input
                                    type="color"
                                    value={backgroundSettings.gradientColors[0] || '#ff6b6b'}
                                    onChange={(e) => onBackgroundChange({
                                        ...backgroundSettings,
                                        gradientColors: [e.target.value, backgroundSettings.gradientColors[1] || '#4ecdc4']
                                    })}
                                    className="w-6 h-6 rounded border border-gray-600 cursor-pointer transition-all duration-200 hover:scale-110 hover:shadow-md"
                                />
                                <input
                                    type="text"
                                    value={backgroundSettings.gradientColors[0] || '#ff6b6b'}
                                    onChange={(e) => onBackgroundChange({
                                        ...backgroundSettings,
                                        gradientColors: [e.target.value, backgroundSettings.gradientColors[1] || '#4ecdc4']
                                    })}
                                    className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs"
                                />
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs text-gray-400">Color 2</Label>
                            <div className="flex gap-1 mt-1">
                                <input
                                    type="color"
                                    value={backgroundSettings.gradientColors[1] || '#4ecdc4'}
                                    onChange={(e) => onBackgroundChange({
                                        ...backgroundSettings,
                                        gradientColors: [backgroundSettings.gradientColors[0] || '#ff6b6b', e.target.value]
                                    })}
                                    className="w-6 h-6 rounded border border-gray-600 cursor-pointer transition-all duration-200 hover:scale-110 hover:shadow-md"
                                />
                                <input
                                    type="text"
                                    value={backgroundSettings.gradientColors[1] || '#4ecdc4'}
                                    onChange={(e) => onBackgroundChange({
                                        ...backgroundSettings,
                                        gradientColors: [backgroundSettings.gradientColors[0] || '#ff6b6b', e.target.value]
                                    })}
                                    className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Color Section */}
            {backgroundSettings.type === 'color' && (
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Square className="h-4 w-4" />
                        <h3 className="font-medium text-sm">Color</h3>
                    </div>

                    <div>
                        <Label className="text-xs text-gray-400">Background Color</Label>
                        <div className="flex gap-1 mt-1">
                            <input
                                type="color"
                                value={backgroundSettings.backgroundColor}
                                onChange={(e) => onBackgroundChange({ ...backgroundSettings, backgroundColor: e.target.value })}
                                className="w-6 h-6 rounded border border-gray-600 cursor-pointer transition-all duration-200 hover:scale-110 hover:shadow-md"
                            />
                            <input
                                type="text"
                                value={backgroundSettings.backgroundColor}
                                onChange={(e) => onBackgroundChange({ ...backgroundSettings, backgroundColor: e.target.value })}
                                className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Image Section */}
            {backgroundSettings.type === 'image' && (
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Square className="h-4 w-4" />
                        <h3 className="font-medium text-sm">Image</h3>
                    </div>

                    <div>
                        <Label className="text-xs text-gray-400">Image URL</Label>
                        <Input
                            placeholder="Enter image URL..."
                            className="mt-1 bg-gray-700 border-gray-600 text-xs"
                        />
                    </div>
                </div>
            )}

            {/* Background Blur */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Square className="h-4 w-4" />
                    <h3 className="font-medium text-sm">Background blur</h3>
                </div>
                <div className="space-y-1">
                    <Slider
                        value={[backgroundSettings.blurAmount]}
                        onValueChange={(value) => onBackgroundChange({ ...backgroundSettings, blurAmount: value[0] })}
                        max={100}
                        step={1}
                        className="w-full"
                    />
                    <div className="text-xs text-gray-400 text-center">
                        {backgroundSettings.blurAmount}%
                    </div>
                </div>
            </div>

            {/* Shape Settings */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Square className="h-4 w-4" />
                    <h3 className="font-medium text-sm">Shape</h3>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="padding"
                            className="rounded"
                            checked={backgroundSettings.padding > 0}
                            onChange={(e) => onBackgroundChange({
                                ...backgroundSettings,
                                padding: e.target.checked ? 20 : 0
                            })}
                        />
                        <Label htmlFor="padding" className="text-sm">Padding</Label>
                    </div>

                    {backgroundSettings.padding > 0 && (
                        <div>
                            <Label className="text-xs text-gray-400">Padding Amount</Label>
                            <div className="space-y-1 mt-1">
                                <Slider
                                    value={[backgroundSettings.padding]}
                                    onValueChange={(value) => onBackgroundChange({ ...backgroundSettings, padding: value[0] })}
                                    max={100}
                                    step={1}
                                    className="w-full"
                                />
                                <div className="text-xs text-gray-400 text-center">
                                    {backgroundSettings.padding}%
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Rounded Corners */}
                    <div>
                        <Label className="text-xs text-gray-400">Rounded Corners</Label>
                        <div className="space-y-1 mt-1">
                            <Slider
                                value={[backgroundSettings.borderRadius]}
                                onValueChange={(value) => onBackgroundChange({ ...backgroundSettings, borderRadius: value[0] })}
                                max={50}
                                step={1}
                                className="w-full"
                            />
                            <div className="text-xs text-gray-400 text-center">
                                {backgroundSettings.borderRadius}px
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Button
                variant="outline"
                size="sm"
                className="w-full transition-all duration-200 hover:bg-gray-700 hover:scale-105 hover:shadow-md"
                onClick={() => onBackgroundChange({
                    type: 'wallpaper',
                    wallpaperIndex: 0,
                    blurAmount: 0,
                    padding: 3,
                    borderRadius: 12,
                    backgroundColor: '#000000',
                    gradientColors: ['#ff6b6b', '#4ecdc4']
                })}
            >
                Reset
            </Button>
        </div>
    )

    const renderOverlayTab = () => (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">Overlays</h3>
                <Button
                    onClick={() => setShowAddOverlay(!showAddOverlay)}
                    size="sm"
                    variant="outline"
                    className="text-xs px-2 py-1 h-7"
                >
                    Add
                </Button>
            </div>

            {showAddOverlay && (
                <div className="bg-gray-700 rounded-lg p-3 space-y-3">
                    <div>
                        <Label className="text-xs">Type</Label>
                        <div className="flex gap-1 mt-1">
                            <Button
                                size="sm"
                                variant={newOverlay.type === 'text' ? 'default' : 'outline'}
                                onClick={() => setNewOverlay(prev => ({ ...prev, type: 'text' }))}
                                className="text-xs px-2 py-1 h-7"
                            >
                                <Type className="h-3 w-3 mr-1" />
                                Text
                            </Button>
                            <Button
                                size="sm"
                                variant={newOverlay.type === 'image' ? 'default' : 'outline'}
                                onClick={() => setNewOverlay(prev => ({ ...prev, type: 'image' }))}
                                className="text-xs px-2 py-1 h-7"
                            >
                                <ImageIcon className="h-3 w-3 mr-1" />
                                Image
                            </Button>
                        </div>
                    </div>

                    <div>
                        <Label className="text-xs">Content</Label>
                        <Input
                            value={newOverlay.content}
                            onChange={(e) => setNewOverlay(prev => ({ ...prev, content: e.target.value }))}
                            placeholder={newOverlay.type === 'text' ? 'Enter text...' : 'Image URL...'}
                            className="h-7 text-xs"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label className="text-xs">Start (s)</Label>
                            <Input
                                type="number"
                                value={newOverlay.startTime}
                                onChange={(e) => setNewOverlay(prev => ({ ...prev, startTime: Number(e.target.value) }))}
                                className="h-7 text-xs"
                            />
                        </div>
                        <div>
                            <Label className="text-xs">End (s)</Label>
                            <Input
                                type="number"
                                value={newOverlay.endTime}
                                onChange={(e) => setNewOverlay(prev => ({ ...prev, endTime: Number(e.target.value) }))}
                                className="h-7 text-xs"
                            />
                        </div>
                    </div>

                    <div className="flex gap-1">
                        <Button onClick={handleAddOverlay} size="sm" className="text-xs px-2 py-1 h-7">
                            Add
                        </Button>
                        <Button
                            onClick={() => setShowAddOverlay(false)}
                            size="sm"
                            variant="outline"
                            className="text-xs px-2 py-1 h-7"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            )}

            {overlays.length > 0 && (
                <div className="space-y-2">
                    {overlays.map(overlay => (
                        <div key={overlay.id} className="flex items-center justify-between p-2 bg-gray-700 rounded text-xs">
                            <span className="truncate">
                                {overlay.type}: {overlay.content} ({formatTime(overlay.startTime)} - {formatTime(overlay.endTime)})
                            </span>
                            <Button
                                onClick={() => onRemoveOverlay(overlay.id)}
                                size="sm"
                                variant="destructive"
                                className="h-5 w-5 p-0"
                            >
                                ×
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )

    const renderTabContent = () => {
        switch (activeTab) {
            case 'media':
                return (
                    <ClipManager
                        clips={clips}
                        onAddClip={onAddClip}
                        onRemoveClip={onRemoveClip}
                        onUpdateClip={onUpdateClip}
                    />
                )
            case 'background':
                return renderBackgroundTab()
            case 'cursor':
                return <div className="text-sm text-gray-400">Cursor settings coming soon...</div>
            case 'camera':
                return <div className="text-sm text-gray-400">Camera settings coming soon...</div>
            case 'chat':
                return renderOverlayTab()
            case 'audio':
                return <div className="text-sm text-gray-400">Audio settings coming soon...</div>
            case 'link':
                return <div className="text-sm text-gray-400">Link settings coming soon...</div>
            case 'magic':
                return <div className="text-sm text-gray-400">Magic settings coming soon...</div>
            case 'draw':
                return <div className="text-sm text-gray-400">Draw settings coming soon...</div>
            default:
                return renderBackgroundTab()
        }
    }

    return (
        <div className="flex flex-1">
            {/* Vertical Navigation */}
            <div className="w-10 bg-gray-900/95 backdrop-blur-sm border-r border-gray-700 flex flex-col py-2 shadow-lg">
                {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                        <Button
                            key={tab.id}
                            variant="ghost"
                            size="sm"
                            className={`h-8 w-8 p-0 mb-1 transition-all duration-200 ${activeTab === tab.id
                                ? 'bg-purple-600 text-white shadow-lg scale-105'
                                : 'text-gray-400 hover:text-white hover:bg-gray-700 hover:scale-105'
                                }`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <Icon className="h-3 w-3" />
                        </Button>
                    )
                })}
            </div>

            {/* Content Area */}
            <div className="flex-1 p-2 overflow-y-auto">
                <div className="flex items-center gap-2 mb-3">
                    <Square className="h-4 w-4" />
                    <h2 className="font-medium text-sm capitalize">{activeTab}</h2>
                </div>

                {renderTabContent()}
            </div>
        </div>
    )
}
