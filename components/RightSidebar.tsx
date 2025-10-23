'use client'

import { useState, useEffect } from 'react'
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
    FolderOpen,
    Loader2,
    Webcam,
    Layout,
    Sparkles,
    Zap
} from 'lucide-react'
import ClipManager from './ClipManager'
import TemplatesPanel from './TemplatesPanel'
import EnhancementPanel from './EnhancementPanel'
import EnhancementPreview from './EnhancementPreview'
import EnhancementProgress from './EnhancementProgress'
import EnhancementErrorDisplay from './EnhancementErrorDisplay'
import { ColorGradingPreset } from '@/lib/templates/colorGradingPresets'
import { AspectRatioTemplate } from '@/lib/templates/aspectRatioTemplates'
import { BrandKit } from '@/lib/templates/brandKit'
import { TransitionPreset } from '@/lib/templates/transitionPresets'
import type { EnhancementConfig, EnhancementSettings, EnhancementMetrics } from '@/lib/videoEnhancement'
import { getDefaultPreset } from '@/lib/videoEnhancement'

interface PexelsPhoto {
    id: number
    src: {
        original: string
        large2x: string
        large: string
        medium: string
        small: string
        portrait: string
        landscape: string
        tiny: string
    }
    photographer: string
    photographer_url: string
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

interface Annotation {
    id: string
    type: 'text' | 'arrow' | 'rectangle' | 'circle' | 'line' | 'highlight' | 'freehand'
    x: number
    y: number
    width?: number
    height?: number
    content?: string
    fontSize?: number
    fontWeight?: string
    color: string
    backgroundColor?: string
    strokeWidth?: number
    startTime: number
    endTime: number
    points?: { x: number, y: number }[]
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
        wallpaperUrl?: string
        blurAmount: number
        padding: number
        borderRadius: number
        shadowIntensity: number
        backgroundColor: string
        gradientColors: string[]
    }
    onBackgroundChange: (settings: any) => void
    clips: Clip[]
    onAddClip: (clip: Clip) => void
    onUpdateClip: (clipId: string, updates: Partial<Clip>) => void
    onRemoveClip: (clipId: string) => void
    webcamOverlayPosition: { x: number, y: number }
    setWebcamOverlayPosition: (position: { x: number, y: number }) => void
    webcamOverlaySize: { width: number, height: number }
    setWebcamOverlaySize: (size: { width: number, height: number }) => void
    webcamSettings: {
        visible: boolean
        shape: 'rectangle' | 'square' | 'circle'
        shadowIntensity: number
        borderWidth: number
        borderColor: string
    }
    onWebcamSettingsChange: (settings: any) => void
    annotations?: Annotation[]
    onAddAnnotation?: (annotation: Annotation) => void
    onUpdateAnnotation?: (id: string, updates: Partial<Annotation>) => void
    onRemoveAnnotation?: (id: string) => void
    selectedAnnotationTool?: Annotation['type'] | null
    onAnnotationToolChange?: (tool: Annotation['type'] | null) => void
    annotationColor?: string
    onAnnotationColorChange?: (color: string) => void
    annotationStrokeWidth?: number
    onAnnotationStrokeWidthChange?: (width: number) => void
    annotationFontSize?: number
    onAnnotationFontSizeChange?: (size: number) => void
    onApplyColorGrading?: (preset: ColorGradingPreset) => void
    onApplyAspectRatio?: (template: AspectRatioTemplate) => void
    onApplyBrandKit?: (brandKit: BrandKit) => void
    onApplyTransition?: (transition: TransitionPreset) => void
    currentColorPreset?: string
    currentAspectRatio?: string
    currentBrandKit?: string
    enhancementConfig?: EnhancementConfig
    onEnhancementConfigChange?: (config: EnhancementConfig) => void
    enhancementSettings?: EnhancementSettings
    onEnhancementSettingsChange?: (settings: EnhancementSettings) => void
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
    onUpdateClip,
    onRemoveClip,
    webcamOverlayPosition,
    setWebcamOverlayPosition,
    webcamOverlaySize,
    setWebcamOverlaySize,
    webcamSettings,
    onWebcamSettingsChange,
    annotations = [],
    onAddAnnotation = () => { },
    onUpdateAnnotation = () => { },
    onRemoveAnnotation = () => { },
    selectedAnnotationTool = null,
    onAnnotationToolChange = () => { },
    annotationColor = '#ff0000',
    onAnnotationColorChange = () => { },
    annotationStrokeWidth = 3,
    onAnnotationStrokeWidthChange = () => { },
    annotationFontSize = 24,
    onAnnotationFontSizeChange = () => { },
    onApplyColorGrading = () => { },
    onApplyAspectRatio = () => { },
    onApplyBrandKit = () => { },
    onApplyTransition = () => { },
    currentColorPreset,
    currentAspectRatio,
    currentBrandKit,
    enhancementConfig,
    onEnhancementConfigChange,
    enhancementSettings,
    onEnhancementSettingsChange
}: RightSidebarProps) {
    const [activeTab, setActiveTab] = useState('background')
    const [showAddOverlay, setShowAddOverlay] = useState(false)
    const [selectedBackgroundTab, setSelectedBackgroundTab] = useState<'wallpaper' | 'gradient' | 'color' | 'image'>(backgroundSettings.type)
    const [pexelsPhotos, setPexelsPhotos] = useState<PexelsPhoto[]>([])
    const [isLoadingPhotos, setIsLoadingPhotos] = useState(false)
    const [photosError, setPhotosError] = useState<string | null>(null)
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

    // Enhancement processing state (config and settings are now props)
    const [isEnhancementProcessing, setIsEnhancementProcessing] = useState(false)
    const [enhancementProgress, setEnhancementProgress] = useState(0)
    const [enhancementError, setEnhancementError] = useState<string | null>(null)
    const [originalPreviewImage, setOriginalPreviewImage] = useState<ImageData | null>(null)
    const [enhancedPreviewImage, setEnhancedPreviewImage] = useState<ImageData | null>(null)
    const [enhancementMetrics, setEnhancementMetrics] = useState<EnhancementMetrics | null>(null)
    const [enhancementErrorObj, setEnhancementErrorObj] = useState<any>(null)
    const [isRecovering, setIsRecovering] = useState(false)



    // Fetch Pexels photos when wallpaper tab is selected
    useEffect(() => {
        if (selectedBackgroundTab === 'wallpaper' && pexelsPhotos.length === 0) {
            fetchPexelsPhotos()
        }
    }, [selectedBackgroundTab])

    const fetchPexelsPhotos = async () => {
        setIsLoadingPhotos(true)
        setPhotosError(null)

        try {
            const response = await fetch('/api/pexels?query=landscape&per_page=30')

            if (!response.ok) {
                throw new Error('Failed to fetch photos')
            }

            const data = await response.json()
            setPexelsPhotos(data.photos || [])
        } catch (error) {
            console.error('Error fetching Pexels photos:', error)
            setPhotosError('Failed to load wallpapers')
        } finally {
            setIsLoadingPhotos(false)
        }
    }

    // Gradient presets
    const gradientPresets = [
        { name: 'Sunset', colors: ['#ff6b6b', '#feca57'], angle: 45 },
        { name: 'Ocean', colors: ['#4ecdc4', '#556270'], angle: 135 },
        { name: 'Purple Haze', colors: ['#667eea', '#764ba2'], angle: 45 },
        { name: 'Peachy', colors: ['#ed4264', '#ffedbc'], angle: 90 },
        { name: 'Mint', colors: ['#00b09b', '#96c93d'], angle: 45 },
        { name: 'Fire', colors: ['#f12711', '#f5af19'], angle: 45 },
        { name: 'Cool Blues', colors: ['#2193b0', '#6dd5ed'], angle: 135 },
        { name: 'Pink Dream', colors: ['#ec38bc', '#7303c0'], angle: 45 },
        { name: 'Emerald', colors: ['#348f50', '#56b4d3'], angle: 90 },
        { name: 'Bloody Mary', colors: ['#ff512f', '#dd2476'], angle: 45 },
        { name: 'Aubergine', colors: ['#aa076b', '#61045f'], angle: 135 },
        { name: 'Aqua Marine', colors: ['#1a2980', '#26d0ce'], angle: 45 },
        { name: 'Neon Life', colors: ['#b3ffab', '#12fff7'], angle: 90 },
        { name: 'Man of Steel', colors: ['#780206', '#061161'], angle: 45 },
        { name: 'Amethyst', colors: ['#9d50bb', '#6e48aa'], angle: 135 },
        { name: 'Cheer Up', colors: ['#ff0844', '#ffb199'], angle: 45 },
        { name: 'Shore', colors: ['#70e1f5', '#ffd194'], angle: 90 },
        { name: 'Velvet Sun', colors: ['#e1eec3', '#f05053'], angle: 45 },
        { name: 'Sublime Light', colors: ['#fc5c7d', '#6a82fb'], angle: 135 },
        { name: 'Megatron', colors: ['#c6ffdd', '#fbd786', '#f7797d'], angle: 45 },
        { name: 'Cool Sky', colors: ['#2980b9', '#6dd5fa', '#ffffff'], angle: 90 },
        { name: 'Dark Ocean', colors: ['#373b44', '#4286f4'], angle: 45 },
        { name: 'Evening Sunshine', colors: ['#b92b27', '#1565c0'], angle: 135 },
        { name: 'JShine', colors: ['#12c2e9', '#c471ed', '#f64f59'], angle: 45 }
    ]

    const tabs = [
        { id: 'templates', icon: Sparkles, label: 'Templates' },
        { id: 'enhancements', icon: Zap, label: 'Enhancements' },
        { id: 'media', icon: FolderOpen, label: 'Media' },
        { id: 'background', icon: Square, label: 'Background' },
        { id: 'layout', icon: Layout, label: 'Layout' },
        { id: 'cursor', icon: MousePointer, label: 'Cursor' },
        { id: 'video', icon: Video, label: 'Video' },
        { id: 'webcam', icon: Webcam, label: 'Webcam' },
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

    // Enhancement handlers
    const handleEnhancementConfigChange = (config: EnhancementConfig) => {
        onEnhancementConfigChange?.(config)
    }

    const handleEnhancementSettingsChange = (settings: EnhancementSettings) => {
        onEnhancementSettingsChange?.(settings)
    }

    const handleEnhancementPreview = async () => {
        try {
            setIsEnhancementProcessing(true)
            setEnhancementError(null)

            // TODO: Implement actual preview generation
            // This would typically involve:
            // 1. Getting current video frame
            // 2. Running enhancement pipeline
            // 3. Setting preview images

            // For now, simulate processing
            await new Promise(resolve => setTimeout(resolve, 2000))

            // Simulate preview generation
            setOriginalPreviewImage(null) // Would be actual original frame
            setEnhancedPreviewImage(null) // Would be actual enhanced frame
            setEnhancementMetrics({
                brightnessAdjustment: 15,
                contrastAdjustment: 8,
                colorTemperatureShift: -200,
                noiseReductionDb: 12.5,
                volumeAdjustmentDb: 3.2,
                shakeReduction: 75
            })
        } catch (error) {
            handleEnhancementError(error)
        } finally {
            setIsEnhancementProcessing(false)
        }
    }

    const handleEnhancementReset = () => {
        const defaultPreset = getDefaultPreset()
        onEnhancementConfigChange?.(defaultPreset.config)
        onEnhancementSettingsChange?.(defaultPreset.settings)
        setOriginalPreviewImage(null)
        setEnhancedPreviewImage(null)
        setEnhancementMetrics(null)
        setEnhancementError(null)
        setEnhancementErrorObj(null)
        setIsRecovering(false)
    }

    // Error handling methods
    const handleEnhancementError = (error: any) => {
        setEnhancementErrorObj(error)
        setEnhancementError(error?.userMessage || error?.message || 'An error occurred')
        setIsEnhancementProcessing(false)
    }

    const handleErrorRetry = () => {
        if (enhancementErrorObj) {
            setIsRecovering(true)
            setEnhancementErrorObj(null)
            setEnhancementError(null)
            // Retry the enhancement
            handleEnhancementPreview()
        }
    }

    const handleErrorSkip = () => {
        setEnhancementErrorObj(null)
        setEnhancementError(null)
        setIsRecovering(false)
        // Continue without enhancement
    }

    const handleErrorReduceQuality = () => {
        if (enhancementSettings) {
            const reducedSettings = {
                ...enhancementSettings,
                brightness: Math.round(enhancementSettings.brightness * 0.8),
                contrast: Math.round(enhancementSettings.contrast * 0.8),
                saturation: Math.round(enhancementSettings.saturation * 0.8),
                temperature: Math.round(enhancementSettings.temperature * 0.8),
                noiseReduction: Math.round(enhancementSettings.noiseReduction * 0.8),
                volumeBoost: Math.round(enhancementSettings.volumeBoost * 0.8),
                voiceClarity: Math.round(enhancementSettings.voiceClarity * 0.8),
                echoReduction: Math.round(enhancementSettings.echoReduction * 0.8),
                stabilizationStrength: Math.round(enhancementSettings.stabilizationStrength * 0.8)
            }
            onEnhancementSettingsChange?.(reducedSettings)
            setEnhancementErrorObj(null)
            setEnhancementError(null)
            setIsRecovering(false)
        }
    }

    const handleErrorDismiss = () => {
        setEnhancementErrorObj(null)
        setEnhancementError(null)
        setIsRecovering(false)
    }

    const renderBackgroundTab = () => (
        <div className="space-y-2">
            {/* Background Type Tabs */}
            <div className="flex gap-1 bg-gray-700 p-1 rounded-lg">
                {['wallpaper', 'gradient', 'color', 'image'].map((type) => (
                    <button
                        key={type}
                        onClick={() => setSelectedBackgroundTab(type as any)}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${selectedBackgroundTab === type
                            ? 'bg-purple-600 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-gray-600'
                            }`}
                    >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                ))}
            </div>

            {/* Wallpaper Section */}
            {selectedBackgroundTab === 'wallpaper' && (
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Square className="h-4 w-4" />
                        <h3 className="font-medium text-sm">Wallpaper</h3>
                    </div>

                    {/* Loading State */}
                    {isLoadingPhotos && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
                        </div>
                    )}

                    {/* Error State */}
                    {photosError && (
                        <div className="text-center py-4">
                            <p className="text-xs text-red-400 mb-2">{photosError}</p>
                            <Button
                                onClick={fetchPexelsPhotos}
                                size="sm"
                                variant="outline"
                                className="text-xs"
                            >
                                Retry
                            </Button>
                        </div>
                    )}

                    {/* Wallpaper Grid */}
                    {!isLoadingPhotos && !photosError && (
                        <>
                            <div className="grid grid-cols-3 gap-1 max-h-96 overflow-y-auto">
                                {pexelsPhotos.map((photo) => (
                                    <div
                                        key={photo.id}
                                        onClick={() => onBackgroundChange({
                                            ...backgroundSettings,
                                            type: 'wallpaper',
                                            wallpaperIndex: photo.id,
                                            wallpaperUrl: photo.src.large
                                        })}
                                        className={`aspect-square rounded cursor-pointer border transition-all duration-200 group overflow-hidden ${backgroundSettings.type === 'wallpaper' && backgroundSettings.wallpaperIndex === photo.id
                                            ? 'border-purple-500 scale-105 shadow-lg ring-2 ring-purple-500'
                                            : 'border-transparent hover:border-purple-300 hover:scale-105 hover:shadow-md'
                                            }`}
                                    >
                                        <img
                                            src={photo.src.tiny}
                                            alt={`Photo by ${photo.photographer}`}
                                            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                                            loading="lazy"
                                        />
                                    </div>
                                ))}
                            </div>

                            <p className="text-xs text-gray-500 mt-2">
                                Photos provided by <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-400">Pexels</a>
                            </p>
                        </>
                    )}
                </div>
            )}

            {/* Gradient Section */}
            {selectedBackgroundTab === 'gradient' && (
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Square className="h-4 w-4" />
                        <h3 className="font-medium text-sm">Gradient Presets</h3>
                    </div>

                    {/* Gradient Presets Grid */}
                    <div className="grid grid-cols-3 gap-1 mb-3 max-h-64 overflow-y-auto">
                        {gradientPresets.map((preset, index) => (
                            <div
                                key={index}
                                onClick={() => onBackgroundChange({
                                    ...backgroundSettings,
                                    type: 'gradient',
                                    gradientColors: preset.colors
                                })}
                                className={`aspect-square rounded cursor-pointer border transition-all duration-200 group ${backgroundSettings.type === 'gradient' &&
                                    backgroundSettings.gradientColors[0] === preset.colors[0] &&
                                    backgroundSettings.gradientColors[1] === preset.colors[1]
                                    ? 'border-purple-500 scale-105 shadow-lg ring-2 ring-purple-500'
                                    : 'border-transparent hover:border-purple-300 hover:scale-105 hover:shadow-md'
                                    }`}
                                style={{
                                    background: `linear-gradient(${preset.angle}deg, ${preset.colors[0]}, ${preset.colors[1]})`
                                }}
                                title={preset.name}
                            />
                        ))}
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                        <Square className="h-4 w-4" />
                        <h3 className="font-medium text-sm">Custom Gradient</h3>
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
                                        type: 'gradient',
                                        gradientColors: [e.target.value, backgroundSettings.gradientColors[1] || '#4ecdc4']
                                    })}
                                    className="w-6 h-6 rounded border border-gray-600 cursor-pointer transition-all duration-200 hover:scale-110 hover:shadow-md"
                                />
                                <input
                                    type="text"
                                    value={backgroundSettings.gradientColors[0] || '#ff6b6b'}
                                    onChange={(e) => onBackgroundChange({
                                        ...backgroundSettings,
                                        type: 'gradient',
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
                                        type: 'gradient',
                                        gradientColors: [backgroundSettings.gradientColors[0] || '#ff6b6b', e.target.value]
                                    })}
                                    className="w-6 h-6 rounded border border-gray-600 cursor-pointer transition-all duration-200 hover:scale-110 hover:shadow-md"
                                />
                                <input
                                    type="text"
                                    value={backgroundSettings.gradientColors[1] || '#4ecdc4'}
                                    onChange={(e) => onBackgroundChange({
                                        ...backgroundSettings,
                                        type: 'gradient',
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
            {selectedBackgroundTab === 'color' && (
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Square className="h-4 w-4" />
                        <h3 className="font-medium text-sm">Color Presets</h3>
                    </div>

                    {/* Color Presets Grid */}
                    <div className="grid grid-cols-7 gap-[0.5] mb-3">
                        {[
                            { name: 'Black', color: '#000000' },
                            { name: 'White', color: '#ffffff' },
                            { name: 'Gray', color: '#6b7280' },
                            { name: 'Slate', color: '#334155' },
                            { name: 'Red', color: '#ef4444' },
                            { name: 'Orange', color: '#f97316' },
                            { name: 'Amber', color: '#f59e0b' },
                            { name: 'Yellow', color: '#eab308' },
                            { name: 'Lime', color: '#84cc16' },
                            { name: 'Green', color: '#22c55e' },
                            { name: 'Emerald', color: '#10b981' },
                            { name: 'Teal', color: '#14b8a6' },
                            { name: 'Cyan', color: '#06b6d4' },
                            { name: 'Sky', color: '#0ea5e9' },
                            { name: 'Blue', color: '#3b82f6' },
                            { name: 'Indigo', color: '#6366f1' },
                            { name: 'Violet', color: '#8b5cf6' },
                            { name: 'Purple', color: '#a855f7' },
                            { name: 'Fuchsia', color: '#d946ef' },
                            { name: 'Pink', color: '#ec4899' },
                            { name: 'Crimson', color: '#f25167' },
                            { name: 'Rose', color: '#f43f5e' },
                            { name: 'Dark Red', color: '#991b1b' },
                            { name: 'Dark Blue', color: '#1e3a8a' },
                            { name: 'Dark Green', color: '#14532d' },
                            { name: 'Navy', color: '#1e293b' },
                            { name: 'Charcoal', color: '#1f2937' },
                            { name: 'Brown', color: '#78350f' },
                            { name: 'Beige', color: '#d4a574' },
                            { name: 'Cream', color: '#fef3c7' },
                            { name: 'Mint', color: '#d1fae5' }
                        ].map((preset, index) => (
                            <div
                                key={index}
                                onClick={() => onBackgroundChange({
                                    ...backgroundSettings,
                                    type: 'color',
                                    backgroundColor: preset.color
                                })}
                                className={`aspect-square rounded cursor-pointer border-[2px] transition-all duration-200 group ${backgroundSettings.type === 'color' && backgroundSettings.backgroundColor === preset.color
                                    ? 'border-purple-500 scale-110 shadow-lg ring-[1px] ring-purple-500'
                                    : 'border-gray-600 hover:border-purple-300 hover:scale-110 hover:shadow-md'
                                    }`}
                                style={{ backgroundColor: preset.color }}
                                title={preset.name}
                            >
                                {/* Checkmark for white/light colors */}
                                {backgroundSettings.type === 'color' && backgroundSettings.backgroundColor === preset.color && (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <div className={`text-xs ${preset.color === '#ffffff' || preset.color === '#fef3c7' || preset.color === '#d1fae5' || preset.color === '#d4a574' ? 'text-gray-800' : 'text-white'}`}>
                                            ✓
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                        <Square className="h-4 w-4" />
                        <h3 className="font-medium text-sm">Custom Color</h3>
                    </div>

                    <div>
                        <Label className="text-xs text-gray-400">Background Color</Label>
                        <div className="flex gap-1 mt-1">
                            <input
                                type="color"
                                value={backgroundSettings.backgroundColor}
                                onChange={(e) => onBackgroundChange({ ...backgroundSettings, type: 'color', backgroundColor: e.target.value })}
                                className="w-6 h-6 rounded border border-gray-600 cursor-pointer transition-all duration-200 hover:scale-110 hover:shadow-md"
                            />
                            <input
                                type="text"
                                value={backgroundSettings.backgroundColor}
                                onChange={(e) => onBackgroundChange({ ...backgroundSettings, type: 'color', backgroundColor: e.target.value })}
                                className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Image Section */}
            {selectedBackgroundTab === 'image' && (
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
                    shadowIntensity: 0,
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

    const renderVideoTab = () => (
        <div className="space-y-4">
            {/* Shape Settings */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Square className="h-4 w-4" />
                    <h3 className="font-medium text-sm">Shape</h3>
                </div>

                <div className="space-y-3">
                    {/* Padding */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <input
                                type="checkbox"
                                id="video-padding"
                                className="rounded"
                                checked={backgroundSettings.padding > 0}
                                onChange={(e) => onBackgroundChange({
                                    ...backgroundSettings,
                                    padding: e.target.checked ? 20 : 0
                                })}
                            />
                            <Label htmlFor="video-padding" className="text-sm">Enable Padding</Label>
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
                    </div>

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

                    {/* Shadow */}
                    <div>
                        <Label className="text-xs text-gray-400">Shadow Intensity</Label>
                        <div className="space-y-1 mt-1">
                            <Slider
                                value={[backgroundSettings.shadowIntensity || 0]}
                                onValueChange={(value) => onBackgroundChange({ ...backgroundSettings, shadowIntensity: value[0] })}
                                max={100}
                                step={1}
                                className="w-full"
                            />
                            <div className="text-xs text-gray-400 text-center">
                                {backgroundSettings.shadowIntensity || 0}%
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Button
                variant="outline"
                size="sm"
                className="w-full transition-all duration-200 hover:bg-gray-700 hover:scale-105 hover:shadow-md"
                onClick={() => {
                    onBackgroundChange({
                        ...backgroundSettings,
                        padding: 3,
                        borderRadius: 12,
                        shadowIntensity: 0
                    })
                }}
            >
                Reset Video Settings
            </Button>
        </div>
    )

    const renderWebcamTab = () => {
        const positionPresets = [
            { name: 'Top Left', x: 2, y: 2 },
            { name: 'Top Right', x: 70, y: 2 },
            { name: 'Bottom Left', x: 2, y: 70 },
            { name: 'Bottom Right', x: 70, y: 70 }
        ]

        return (
            <div className="space-y-4">
                {/* Visibility Toggle */}
                <div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Webcam className="h-4 w-4" />
                            <h3 className="font-medium text-sm">Visibility</h3>
                        </div>
                        <Button
                            size="sm"
                            variant={webcamSettings.visible ? 'default' : 'outline'}
                            onClick={() => onWebcamSettingsChange({ ...webcamSettings, visible: !webcamSettings.visible })}
                            className="text-xs h-7"
                        >
                            {webcamSettings.visible ? 'Visible' : 'Hidden'}
                        </Button>
                    </div>
                </div>

                {/* Shape Selection */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Square className="h-4 w-4" />
                        <h3 className="font-medium text-sm">Shape</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                        {['rectangle', 'square', 'circle'].map((shape) => (
                            <button
                                key={shape}
                                onClick={() => onWebcamSettingsChange({ ...webcamSettings, shape: shape as any })}
                                className={`px-2 py-2 text-xs rounded-md transition-all duration-200 ${webcamSettings.shape === shape
                                    ? 'bg-purple-600 text-white scale-105'
                                    : 'bg-gray-700 text-gray-400 hover:text-white hover:bg-gray-600'
                                    }`}
                            >
                                {shape.charAt(0).toUpperCase() + shape.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Position Presets */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <MousePointer className="h-4 w-4" />
                        <h3 className="font-medium text-sm">Position Presets</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                        {positionPresets.map((preset) => (
                            <button
                                key={preset.name}
                                onClick={() => setWebcamOverlayPosition({ x: preset.x, y: preset.y })}
                                className="px-2 py-2 text-xs rounded-md bg-gray-700 text-gray-400 hover:text-white hover:bg-gray-600 transition-all duration-200 hover:scale-105"
                            >
                                {preset.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Custom Position */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <MousePointer className="h-4 w-4" />
                        <h3 className="font-medium text-sm">Custom Position</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label className="text-xs text-gray-400">X Position (%)</Label>
                            <div className="space-y-1 mt-1">
                                <Slider
                                    value={[webcamOverlayPosition.x]}
                                    onValueChange={(value) => setWebcamOverlayPosition({ ...webcamOverlayPosition, x: value[0] })}
                                    max={100}
                                    step={1}
                                    className="w-full"
                                />
                                <div className="text-xs text-gray-400 text-center">
                                    {webcamOverlayPosition.x}%
                                </div>
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs text-gray-400">Y Position (%)</Label>
                            <div className="space-y-1 mt-1">
                                <Slider
                                    value={[webcamOverlayPosition.y]}
                                    onValueChange={(value) => setWebcamOverlayPosition({ ...webcamOverlayPosition, y: value[0] })}
                                    max={100}
                                    step={1}
                                    className="w-full"
                                />
                                <div className="text-xs text-gray-400 text-center">
                                    {webcamOverlayPosition.y}%
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Size */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Webcam className="h-4 w-4" />
                        <h3 className="font-medium text-sm">Size</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <Label className="text-xs text-gray-400">Width</Label>
                            <div className="space-y-1 mt-1">
                                <Slider
                                    value={[webcamOverlaySize.width]}
                                    onValueChange={(value) => setWebcamOverlaySize({ ...webcamOverlaySize, width: value[0] })}
                                    max={1000}
                                    step={1}
                                    className="w-full"
                                />
                                <div className="text-xs text-gray-400 text-center">
                                    {webcamOverlaySize.width}px
                                </div>
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs text-gray-400">Height</Label>
                            <div className="space-y-1 mt-1">
                                <Slider
                                    value={[webcamOverlaySize.height]}
                                    onValueChange={(value) => setWebcamOverlaySize({ ...webcamOverlaySize, height: value[0] })}
                                    max={1000}
                                    step={1}
                                    className="w-full"
                                />
                                <div className="text-xs text-gray-400 text-center">
                                    {webcamOverlaySize.height}px
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Border */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Square className="h-4 w-4" />
                        <h3 className="font-medium text-sm">Border</h3>
                    </div>
                    <div className="space-y-2">
                        <div>
                            <Label className="text-xs text-gray-400">Border Width</Label>
                            <div className="space-y-1 mt-1">
                                <Slider
                                    value={[webcamSettings.borderWidth]}
                                    onValueChange={(value) => onWebcamSettingsChange({ ...webcamSettings, borderWidth: value[0] })}
                                    max={20}
                                    step={1}
                                    className="w-full"
                                />
                                <div className="text-xs text-gray-400 text-center">
                                    {webcamSettings.borderWidth}px
                                </div>
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs text-gray-400">Border Color</Label>
                            <div className="flex gap-1 mt-1">
                                <input
                                    type="color"
                                    value={webcamSettings.borderColor}
                                    onChange={(e) => onWebcamSettingsChange({ ...webcamSettings, borderColor: e.target.value })}
                                    className="w-6 h-6 rounded border border-gray-600 cursor-pointer transition-all duration-200 hover:scale-110 hover:shadow-md"
                                />
                                <input
                                    type="text"
                                    value={webcamSettings.borderColor}
                                    onChange={(e) => onWebcamSettingsChange({ ...webcamSettings, borderColor: e.target.value })}
                                    className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Shadow */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Square className="h-4 w-4" />
                        <h3 className="font-medium text-sm">Shadow</h3>
                    </div>
                    <div>
                        <Label className="text-xs text-gray-400">Shadow Intensity</Label>
                        <div className="space-y-1 mt-1">
                            <Slider
                                value={[webcamSettings.shadowIntensity]}
                                onValueChange={(value) => onWebcamSettingsChange({ ...webcamSettings, shadowIntensity: value[0] })}
                                max={100}
                                step={1}
                                className="w-full"
                            />
                            <div className="text-xs text-gray-400 text-center">
                                {webcamSettings.shadowIntensity}%
                            </div>
                        </div>
                    </div>
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    className="w-full transition-all duration-200 hover:bg-gray-700 hover:scale-105 hover:shadow-md"
                    onClick={() => {
                        setWebcamOverlayPosition({ x: 2, y: 2 })
                        setWebcamOverlaySize({ width: 200, height: 150 })
                        onWebcamSettingsChange({
                            visible: true,
                            shape: 'rectangle',
                            shadowIntensity: 0,
                            borderWidth: 2,
                            borderColor: '#3b82f6'
                        })
                    }}
                >
                    Reset Webcam Settings
                </Button>
            </div>
        )
    }

    const renderDrawTab = () => {
        const annotationTypes = [
            { id: 'text', icon: Type, label: 'Text', description: 'Add text labels' },
            { id: 'arrow', icon: MousePointer, label: 'Arrow', description: 'Point to elements' },
            { id: 'rectangle', icon: Square, label: 'Rectangle', description: 'Highlight areas' },
            { id: 'circle', icon: Square, label: 'Circle', description: 'Circle highlights' },
            { id: 'line', icon: Square, label: 'Line', description: 'Draw lines' },
            { id: 'highlight', icon: Square, label: 'Highlight', description: 'Highlight regions' }
        ]

        const colorPresets = [
            { name: 'Red', color: '#ff0000' },
            { name: 'Orange', color: '#ff8800' },
            { name: 'Yellow', color: '#ffff00' },
            { name: 'Green', color: '#00ff00' },
            { name: 'Blue', color: '#0088ff' },
            { name: 'Purple', color: '#8800ff' },
            { name: 'Pink', color: '#ff00ff' },
            { name: 'White', color: '#ffffff' },
            { name: 'Black', color: '#000000' }
        ]

        return (
            <div className="space-y-4">
                {/* Annotation Type Selection */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Type className="h-4 w-4" />
                        <h3 className="font-medium text-sm">Annotation Type</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {annotationTypes.map((type) => {
                            const Icon = type.icon
                            return (
                                <button
                                    key={type.id}
                                    onClick={() => onAnnotationToolChange(type.id as any)}
                                    className={`flex items-center gap-2 p-2 rounded-lg transition-all duration-200 ${selectedAnnotationTool === type.id
                                        ? 'bg-purple-600 text-white scale-105 shadow-lg'
                                        : 'bg-gray-700 text-gray-400 hover:text-white hover:bg-gray-600 hover:scale-105'
                                        }`}
                                    title={type.description}
                                >
                                    <Icon className="h-4 w-4" />
                                    <span className="text-xs font-medium">{type.label}</span>
                                </button>
                            )
                        })}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                        {selectedAnnotationTool ? `Click on the video to draw ${selectedAnnotationTool}` : 'Select a tool to start annotating'}
                    </p>
                </div>

                {/* Color Selection */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Palette className="h-4 w-4" />
                        <h3 className="font-medium text-sm">Color</h3>
                    </div>
                    <div className="grid grid-cols-9 gap-1 mb-2">
                        {colorPresets.map((preset) => (
                            <button
                                key={preset.color}
                                onClick={() => onAnnotationColorChange(preset.color)}
                                className={`aspect-square rounded-md border-2 transition-all duration-200 hover:scale-110 ${annotationColor === preset.color
                                    ? 'border-purple-500 scale-110 shadow-lg ring-2 ring-purple-500'
                                    : 'border-gray-600 hover:border-purple-300'
                                    }`}
                                style={{ backgroundColor: preset.color }}
                                title={preset.name}
                            />
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="color"
                            value={annotationColor}
                            onChange={(e) => onAnnotationColorChange(e.target.value)}
                            className="w-10 h-10 rounded border border-gray-600 cursor-pointer"
                        />
                        <Input
                            type="text"
                            value={annotationColor}
                            onChange={(e) => onAnnotationColorChange(e.target.value)}
                            className="flex-1 bg-gray-700 border-gray-600 text-xs"
                            placeholder="#ff0000"
                        />
                    </div>
                </div>

                {/* Stroke Width (for shapes) */}
                {selectedAnnotationTool !== 'text' && selectedAnnotationTool && (
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Square className="h-4 w-4" />
                            <h3 className="font-medium text-sm">Stroke Width</h3>
                        </div>
                        <div className="space-y-1">
                            <Slider
                                value={[annotationStrokeWidth]}
                                onValueChange={(value) => onAnnotationStrokeWidthChange(value[0])}
                                min={1}
                                max={20}
                                step={1}
                                className="w-full"
                            />
                            <div className="text-xs text-gray-400 text-center">
                                {annotationStrokeWidth}px
                            </div>
                        </div>
                    </div>
                )}

                {/* Font Size (for text) */}
                {selectedAnnotationTool === 'text' && (
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Type className="h-4 w-4" />
                            <h3 className="font-medium text-sm">Font Size</h3>
                        </div>
                        <div className="space-y-1">
                            <Slider
                                value={[annotationFontSize]}
                                onValueChange={(value) => onAnnotationFontSizeChange(value[0])}
                                min={12}
                                max={72}
                                step={2}
                                className="w-full"
                            />
                            <div className="text-xs text-gray-400 text-center">
                                {annotationFontSize}px
                            </div>
                        </div>
                    </div>
                )}



                {/* Annotations List */}
                {annotations.length > 0 && (
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Type className="h-4 w-4" />
                            <h3 className="font-medium text-sm">Active Annotations ({annotations.length})</h3>
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {annotations.map((annotation) => (
                                <div
                                    key={annotation.id}
                                    className="bg-gray-700 rounded-lg p-2 space-y-2"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-4 h-4 rounded border border-gray-600"
                                                style={{ backgroundColor: annotation.color }}
                                            />
                                            <span className="text-xs font-medium capitalize">
                                                {annotation.type}
                                            </span>
                                        </div>
                                        <Button
                                            onClick={() => onRemoveAnnotation(annotation.id)}
                                            size="sm"
                                            variant="destructive"
                                            className="h-6 w-6 p-0 text-xs"
                                        >
                                            ×
                                        </Button>
                                    </div>
                                    {annotation.content && (
                                        <div className="text-xs text-gray-400 truncate">
                                            "{annotation.content}"
                                        </div>
                                    )}
                                    <div className="text-xs text-gray-500">
                                        {formatTime(annotation.startTime)} - {formatTime(annotation.endTime)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Info Box */}
                <div className="bg-gray-700/50 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                        <Type className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-gray-300">
                            <p className="font-medium mb-1">Drawing Tips</p>
                            <ul className="text-gray-400 space-y-1">
                                <li>• Use arrows to point to specific elements</li>
                                <li>• Rectangles are great for highlighting areas</li>
                                <li>• Text annotations can explain features</li>
                                <li>• Adjust timing to show annotations when needed</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const renderLayoutTab = () => {
        const layouts = [
            {
                name: 'Screen Left - Webcam Right',
                description: 'Screen recording 75%, webcam 23% side by side',
                preview: '⬜📹',
                webcamPosition: { x: 76, y: 5 },
                webcamSize: { width: 230, height: 550 },
                webcamShape: 'rectangle' as const,
                screenPosition: 'left' as const
            },
            {
                name: 'Screen Right - Webcam Left',
                description: 'Webcam 23%, screen recording 75% side by side',
                preview: '📹⬜',
                webcamPosition: { x: 1, y: 5 },
                webcamSize: { width: 230, height: 550 },
                webcamShape: 'rectangle' as const,
                screenPosition: 'right' as const
            },
            {
                name: 'Screen with Corner Webcam',
                description: 'Full screen with small rounded webcam',
                preview: '⬜🔘',
                webcamPosition: { x: 5, y: 65 },
                webcamSize: { width: 180, height: 180 },
                webcamShape: 'circle' as const,
                screenPosition: 'full' as const
            },
            {
                name: 'Webcam Left - Screen Right',
                description: 'Full height webcam, screen on right',
                preview: '📹⬜',
                webcamPosition: { x: 2, y: 5 },
                webcamSize: { width: 280, height: 550 },
                webcamShape: 'rectangle' as const,
                screenPosition: 'right' as const
            },
            {
                name: 'Picture in Picture - Bottom Right',
                description: 'Webcam in bottom right corner',
                preview: 'PiP BR',
                webcamPosition: { x: 68, y: 72 },
                webcamSize: { width: 280, height: 210 },
                webcamShape: 'rectangle' as const,
                screenPosition: 'full' as const
            },
            {
                name: 'Picture in Picture - Bottom Left',
                description: 'Webcam in bottom left corner',
                preview: 'PiP BL',
                webcamPosition: { x: 2, y: 72 },
                webcamSize: { width: 280, height: 210 },
                webcamShape: 'rectangle' as const,
                screenPosition: 'full' as const
            },
            {
                name: 'Picture in Picture - Top Right',
                description: 'Webcam in top right corner',
                preview: 'PiP TR',
                webcamPosition: { x: 68, y: 2 },
                webcamSize: { width: 280, height: 210 },
                webcamShape: 'rectangle' as const,
                screenPosition: 'full' as const
            },
            {
                name: 'Picture in Picture - Top Left',
                description: 'Webcam in top left corner',
                preview: 'PiP TL',
                webcamPosition: { x: 2, y: 2 },
                webcamSize: { width: 280, height: 210 },
                webcamShape: 'rectangle' as const,
                screenPosition: 'full' as const
            },
            {
                name: 'Circle Bottom Right',
                description: 'Circular webcam in bottom right',
                preview: '⭕ BR',
                webcamPosition: { x: 75, y: 75 },
                webcamSize: { width: 200, height: 200 },
                webcamShape: 'circle' as const,
                screenPosition: 'full' as const
            },
            {
                name: 'Circle Bottom Left',
                description: 'Circular webcam in bottom left',
                preview: '⭕ BL',
                webcamPosition: { x: 2, y: 75 },
                webcamSize: { width: 200, height: 200 },
                webcamShape: 'circle' as const,
                screenPosition: 'full' as const
            },
            {
                name: 'Rounded Square - Bottom Right',
                description: 'Rounded square webcam in bottom right',
                preview: '▢ BR',
                webcamPosition: { x: 72, y: 70 },
                webcamSize: { width: 220, height: 220 },
                webcamShape: 'square' as const,
                screenPosition: 'full' as const
            },
            {
                name: 'Circle - Bottom Right',
                description: 'Circle webcam in bottom right',
                preview: '⭕ BR',
                webcamPosition: { x: 75, y: 72 },
                webcamSize: { width: 200, height: 200 },
                webcamShape: 'circle' as const,
                screenPosition: 'full' as const
            },
            {
                name: 'Circle - Top Left',
                description: 'Circle webcam in top left',
                preview: '⭕ TL',
                webcamPosition: { x: 3, y: 3 },
                webcamSize: { width: 200, height: 200 },
                webcamShape: 'circle' as const,
                screenPosition: 'full' as const
            },
            {
                name: 'Rounded Square - Top Left',
                description: 'Rounded square webcam in top left',
                preview: '▢ TL',
                webcamPosition: { x: 3, y: 3 },
                webcamSize: { width: 220, height: 220 },
                webcamShape: 'square' as const,
                screenPosition: 'full' as const
            },
            {
                name: 'Circle - Bottom Left',
                description: 'Circle webcam in bottom left',
                preview: '⭕ BL',
                webcamPosition: { x: 3, y: 72 },
                webcamSize: { width: 200, height: 200 },
                webcamShape: 'circle' as const,
                screenPosition: 'full' as const
            },
            {
                name: 'Rounded Square - Top Right',
                description: 'Rounded square webcam in top right',
                preview: '▢ TR',
                webcamPosition: { x: 72, y: 3 },
                webcamSize: { width: 220, height: 220 },
                webcamShape: 'square' as const,
                screenPosition: 'full' as const
            },
            {
                name: 'Circle - Top Right',
                description: 'Circle webcam in top right',
                preview: '⭕ TR',
                webcamPosition: { x: 75, y: 3 },
                webcamSize: { width: 200, height: 200 },
                webcamShape: 'circle' as const,
                screenPosition: 'full' as const
            },
            {
                name: 'Side by Side Equal',
                description: 'Screen and webcam side by side',
                preview: '⬜⬜',
                webcamPosition: { x: 52, y: 10 },
                webcamSize: { width: 400, height: 450 },
                webcamShape: 'rectangle' as const,
                screenPosition: 'left' as const
            },
            {
                name: 'Webcam Only',
                description: 'Full screen webcam',
                preview: '⬛',
                webcamPosition: { x: 5, y: 5 },
                webcamSize: { width: 800, height: 600 },
                webcamShape: 'rectangle' as const,
                screenPosition: 'none' as const
            }
        ]

        const applyLayout = (layout: typeof layouts[0]) => {
            setWebcamOverlayPosition(layout.webcamPosition)
            setWebcamOverlaySize(layout.webcamSize)
            onWebcamSettingsChange({
                ...webcamSettings,
                shape: layout.webcamShape,
                visible: true
            })
        }

        return (
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <Layout className="h-4 w-4" />
                    <h3 className="font-medium text-sm">Layout Presets</h3>
                </div>
                <p className="text-xs text-gray-400">
                    Choose a predefined layout for your webcam and screen recording
                </p>

                <div className="grid grid-cols-2 gap-2">
                    {layouts.map((layout, index) => (
                        <button
                            key={index}
                            onClick={() => applyLayout(layout)}
                            className="group relative bg-gray-700 hover:bg-gray-600 rounded-lg p-3 transition-all duration-200 hover:scale-105 hover:shadow-lg text-left"
                        >
                            {/* Visual Preview Box */}
                            <div className="aspect-video bg-gray-900 rounded mb-2 relative overflow-hidden border border-gray-600">
                                {/* Screen/Content area */}
                                <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-800"></div>

                                {/* Webcam representation */}
                                <div
                                    className="absolute bg-purple-500/30 border-2 border-purple-400/50 group-hover:border-purple-400 transition-colors"
                                    style={{
                                        left: `${layout.webcamPosition.x}%`,
                                        top: `${layout.webcamPosition.y}%`,
                                        width: `${Math.min(layout.webcamSize.width / 10, 40)}%`,
                                        height: `${Math.min(layout.webcamSize.height / 10, 60)}%`,
                                        borderRadius: layout.webcamShape === 'circle' ? '50%' :
                                            layout.webcamShape === 'square' ? '8%' : '4%'
                                    }}
                                >
                                    {/* Person icon in webcam */}
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Webcam className="w-1/3 h-1/3 text-purple-300 opacity-60" />
                                    </div>
                                </div>
                            </div>

                            {/* Layout Name */}
                            <div className="text-xs font-medium text-white text-center">
                                {layout.name}
                            </div>

                            {/* Hover Indicator */}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="bg-gray-700/50 rounded-lg p-3 mt-4">
                    <div className="flex items-start gap-2">
                        <Layout className="h-4 w-4 text-purple-400 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-gray-300">
                            <p className="font-medium mb-1">Pro Tip</p>
                            <p className="text-gray-400">
                                After selecting a layout, you can fine-tune the position and size in the Webcam tab, or drag the webcam directly on the preview.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const renderEnhancementsTab = () => (
        <div className="space-y-4">
            {/* Error Display */}
            {enhancementErrorObj && (
                <EnhancementErrorDisplay
                    error={enhancementErrorObj}
                    isRecovering={isRecovering}
                    onRetry={handleErrorRetry}
                    onSkip={handleErrorSkip}
                    onReduceQuality={handleErrorReduceQuality}
                    onDismiss={handleErrorDismiss}
                />
            )}

            {/* Enhancement Panel */}
            <EnhancementPanel
                config={enhancementConfig || getDefaultPreset().config}
                settings={enhancementSettings || getDefaultPreset().settings}
                onConfigChange={handleEnhancementConfigChange}
                onSettingsChange={handleEnhancementSettingsChange}
                onPreview={handleEnhancementPreview}
                onReset={handleEnhancementReset}
                isProcessing={isEnhancementProcessing}
            />

            {/* Enhancement Preview */}
            {(originalPreviewImage || enhancedPreviewImage || enhancementMetrics) && (
                <EnhancementPreview
                    originalImage={originalPreviewImage}
                    enhancedImage={enhancedPreviewImage}
                    metrics={enhancementMetrics || undefined}
                    isGenerating={isEnhancementProcessing}
                    error={enhancementError}
                    onRegenerate={handleEnhancementPreview}
                />
            )}

            {/* Enhancement Progress */}
            {isEnhancementProcessing && (
                <EnhancementProgress
                    isVisible={isEnhancementProcessing}
                    progress={enhancementProgress}
                    currentStep="Processing enhancements..."
                    estimatedTimeRemaining={30}
                    framesProcessed={0}
                    totalFrames={100}
                    currentFPS={0}
                    onCancel={() => setIsEnhancementProcessing(false)}
                    error={enhancementError}
                />
            )}
        </div>
    )

    const renderTabContent = () => {
        switch (activeTab) {
            case 'templates':
                return (
                    <TemplatesPanel
                        onApplyColorGrading={onApplyColorGrading}
                        onApplyAspectRatio={onApplyAspectRatio}
                        onApplyBrandKit={onApplyBrandKit}
                        onApplyTransition={onApplyTransition}
                        currentColorPreset={currentColorPreset}
                        currentAspectRatio={currentAspectRatio}
                        currentBrandKit={currentBrandKit}
                    />
                )
            case 'enhancements':
                return renderEnhancementsTab()
            case 'media':
                return (
                    <ClipManager
                        clips={clips}
                        onAddClip={onAddClip}
                        onUpdateClip={onUpdateClip}
                        onRemoveClip={onRemoveClip}
                    />
                )
            case 'background':
                return renderBackgroundTab()
            case 'layout':
                return renderLayoutTab()
            case 'cursor':
                return <div className="text-sm text-gray-400">Cursor settings coming soon...</div>
            case 'video':
                return renderVideoTab()
            case 'webcam':
                return renderWebcamTab()
            case 'chat':
                return renderOverlayTab()
            case 'audio':
                return <div className="text-sm text-gray-400">Audio settings coming soon...</div>
            case 'link':
                return <div className="text-sm text-gray-400">Link settings coming soon...</div>
            case 'magic':
                return <div className="text-sm text-gray-400">Magic settings coming soon...</div>
            case 'draw':
                return renderDrawTab()
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
