'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
    Settings,
    ChevronDown,
    ChevronRight,
    RotateCcw,
    Eye,
    Sparkles,
    Volume2,
    Camera,
    Zap,
    Palette,
    Mic,
    Shield,
    Wifi
} from 'lucide-react'
import type { EnhancementConfig, EnhancementSettings, EnhancementPreset } from '@/lib/videoEnhancement'
import {
    DEFAULT_PRESETS,
    getPresetById,
    getPresetsByCategory,
    getDefaultPreset,
    validatePreset,
    createCustomPreset,
    getConfigStorage
} from '@/lib/videoEnhancement'

interface EnhancementPanelProps {
    config: EnhancementConfig
    settings: EnhancementSettings
    onConfigChange: (config: EnhancementConfig) => void
    onSettingsChange: (settings: EnhancementSettings) => void
    onPreview: () => void
    onReset: () => void
    isProcessing?: boolean
    className?: string
}

export default function EnhancementPanel({
    config,
    settings,
    onConfigChange,
    onSettingsChange,
    onPreview,
    onReset,
    isProcessing = false,
    className = ''
}: EnhancementPanelProps) {
    const [selectedPresetId, setSelectedPresetId] = useState<string>('auto')
    const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
    const [customPresets, setCustomPresets] = useState<EnhancementPreset[]>([])
    const [isLoadingPresets, setIsLoadingPresets] = useState(false)

    // Load custom presets on mount
    useEffect(() => {
        const loadCustomPresets = async () => {
            setIsLoadingPresets(true)
            try {
                const storage = getConfigStorage()
                const presets = storage.getCustomPresets()
                setCustomPresets(presets)
            } catch (error) {
                console.error('Failed to load custom presets:', error)
            } finally {
                setIsLoadingPresets(false)
            }
        }

        loadCustomPresets()
    }, [])

    // Get all available presets (default + custom)
    const allPresets = [...DEFAULT_PRESETS, ...customPresets]

    // Handle preset selection
    const handlePresetChange = (presetId: string) => {
        setSelectedPresetId(presetId)
        const preset = getPresetById(presetId) || allPresets.find(p => p.id === presetId)

        if (preset) {
            onConfigChange(preset.config)
            onSettingsChange(preset.settings)
        }
    }

    // Handle individual config changes
    const handleConfigChange = (key: keyof EnhancementConfig, value: boolean) => {
        const newConfig = { ...config, [key]: value }
        onConfigChange(newConfig)
    }

    // Handle individual settings changes
    const handleSettingsChange = (key: keyof EnhancementSettings, value: number) => {
        const newSettings = { ...settings, [key]: value }
        onSettingsChange(newSettings)
    }

    // Reset to default preset
    const handleReset = () => {
        const defaultPreset = getDefaultPreset()
        setSelectedPresetId('auto')
        onConfigChange(defaultPreset.config)
        onSettingsChange(defaultPreset.settings)
        onReset()
    }

    // Save current settings as custom preset
    const handleSaveAsPreset = () => {
        const presetName = prompt('Enter preset name:')
        if (!presetName) return

        try {
            const customPreset = createCustomPreset(
                `custom-${Date.now()}`,
                presetName,
                'Custom preset',
                config,
                settings
            )

            const storage = getConfigStorage()
            storage.addCustomPreset(customPreset)
            setCustomPresets(prev => [...prev, customPreset])

            // Select the new preset
            setSelectedPresetId(customPreset.id)
        } catch (error) {
            console.error('Failed to save custom preset:', error)
            alert('Failed to save custom preset. Please check your settings.')
        }
    }

    // Enhancement categories for organization
    const enhancementCategories = [
        {
            id: 'color',
            title: 'Color & Lighting',
            icon: Palette,
            enhancements: [
                { key: 'autoColorCorrection', label: 'Auto Color Correction', description: 'Automatically adjust color balance' },
                { key: 'autoBrightnessAdjust', label: 'Brightness', description: 'Adjust brightness levels' },
                { key: 'autoContrast', label: 'Contrast', description: 'Enhance contrast' },
                { key: 'autoWhiteBalance', label: 'White Balance', description: 'Correct color temperature' }
            ]
        },
        {
            id: 'audio',
            title: 'Audio Enhancement',
            icon: Volume2,
            enhancements: [
                { key: 'autoNoiseReduction', label: 'Noise Reduction', description: 'Remove background noise' },
                { key: 'autoVolumeNormalization', label: 'Volume Normalization', description: 'Normalize audio levels' },
                { key: 'autoVoiceEnhancement', label: 'Voice Enhancement', description: 'Improve voice clarity' },
                { key: 'autoEchoCancel', label: 'Echo Cancellation', description: 'Remove echo and reverb' }
            ]
        },
        {
            id: 'video',
            title: 'Video Quality',
            icon: Camera,
            enhancements: [
                { key: 'autoStabilization', label: 'Stabilization', description: 'Reduce camera shake' }
            ]
        }
    ]

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-semibold">Enhancements</h3>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                    className="text-xs"
                >
                    <Settings className="h-3 w-3 mr-1" />
                    {showAdvancedSettings ? 'Simple' : 'Advanced'}
                </Button>
            </div>

            {/* Preset Selector */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Preset</CardTitle>
                    <CardDescription className="text-xs">
                        Choose a preset or customize settings
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Select value={selectedPresetId} onValueChange={handlePresetChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select preset" />
                        </SelectTrigger>
                        <SelectContent>
                            {/* Default presets */}
                            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                                Default Presets
                            </div>
                            {DEFAULT_PRESETS.map(preset => (
                                <SelectItem key={preset.id} value={preset.id}>
                                    <div className="flex items-center gap-2">
                                        <span>{preset.name}</span>
                                        <Badge variant="secondary" className="text-xs">
                                            {preset.category}
                                        </Badge>
                                    </div>
                                </SelectItem>
                            ))}

                            {/* Custom presets */}
                            {customPresets.length > 0 && (
                                <>
                                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                                        Custom Presets
                                    </div>
                                    {customPresets.map(preset => (
                                        <SelectItem key={preset.id} value={preset.id}>
                                            <div className="flex items-center gap-2">
                                                <span>{preset.name}</span>
                                                <Badge variant="outline" className="text-xs">
                                                    custom
                                                </Badge>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </>
                            )}
                        </SelectContent>
                    </Select>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSaveAsPreset}
                            className="flex-1 text-xs"
                        >
                            Save as Preset
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleReset}
                            className="flex-1 text-xs"
                        >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Reset
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Enhancement Categories */}
            {enhancementCategories.map(category => (
                <Card key={category.id}>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <category.icon className="h-4 w-4" />
                            {category.title}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {category.enhancements.map(enhancement => {
                            const isEnabled = config[enhancement.key as keyof EnhancementConfig]
                            const settingKey = enhancement.key.replace('auto', '').toLowerCase() as keyof EnhancementSettings

                            return (
                                <div key={enhancement.key} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <Label className="text-sm font-medium">
                                                {enhancement.label}
                                            </Label>
                                            <p className="text-xs text-muted-foreground">
                                                {enhancement.description}
                                            </p>
                                        </div>
                                        <Switch
                                            checked={isEnabled}
                                            onCheckedChange={(checked) =>
                                                handleConfigChange(enhancement.key as keyof EnhancementConfig, checked)
                                            }
                                            disabled={isProcessing}
                                        />
                                    </div>

                                    {/* Advanced settings for enabled enhancements */}
                                    {isEnabled && showAdvancedSettings && (
                                        <Collapsible>
                                            <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                                                <ChevronRight className="h-3 w-3" />
                                                Fine-tune settings
                                            </CollapsibleTrigger>
                                            <CollapsibleContent className="mt-2 space-y-2">
                                                {enhancement.key === 'autoBrightnessAdjust' && (
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">Brightness</Label>
                                                        <Slider
                                                            value={[settings.brightness]}
                                                            onValueChange={([value]) => handleSettingsChange('brightness', value)}
                                                            min={-100}
                                                            max={100}
                                                            step={1}
                                                            className="w-full"
                                                        />
                                                        <div className="flex justify-between text-xs text-muted-foreground">
                                                            <span>-100</span>
                                                            <span>{settings.brightness}</span>
                                                            <span>100</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {enhancement.key === 'autoContrast' && (
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">Contrast</Label>
                                                        <Slider
                                                            value={[settings.contrast]}
                                                            onValueChange={([value]) => handleSettingsChange('contrast', value)}
                                                            min={-100}
                                                            max={100}
                                                            step={1}
                                                            className="w-full"
                                                        />
                                                        <div className="flex justify-between text-xs text-muted-foreground">
                                                            <span>-100</span>
                                                            <span>{settings.contrast}</span>
                                                            <span>100</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {enhancement.key === 'autoWhiteBalance' && (
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">Color Temperature</Label>
                                                        <Slider
                                                            value={[settings.temperature]}
                                                            onValueChange={([value]) => handleSettingsChange('temperature', value)}
                                                            min={-100}
                                                            max={100}
                                                            step={1}
                                                            className="w-full"
                                                        />
                                                        <div className="flex justify-between text-xs text-muted-foreground">
                                                            <span>Cool</span>
                                                            <span>{settings.temperature}</span>
                                                            <span>Warm</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {enhancement.key === 'autoNoiseReduction' && (
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">Noise Reduction</Label>
                                                        <Slider
                                                            value={[settings.noiseReduction]}
                                                            onValueChange={([value]) => handleSettingsChange('noiseReduction', value)}
                                                            min={0}
                                                            max={100}
                                                            step={1}
                                                            className="w-full"
                                                        />
                                                        <div className="flex justify-between text-xs text-muted-foreground">
                                                            <span>0%</span>
                                                            <span>{settings.noiseReduction}%</span>
                                                            <span>100%</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {enhancement.key === 'autoVolumeNormalization' && (
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">Volume Boost</Label>
                                                        <Slider
                                                            value={[settings.volumeBoost]}
                                                            onValueChange={([value]) => handleSettingsChange('volumeBoost', value)}
                                                            min={0}
                                                            max={100}
                                                            step={1}
                                                            className="w-full"
                                                        />
                                                        <div className="flex justify-between text-xs text-muted-foreground">
                                                            <span>0%</span>
                                                            <span>{settings.volumeBoost}%</span>
                                                            <span>100%</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {enhancement.key === 'autoVoiceEnhancement' && (
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">Voice Clarity</Label>
                                                        <Slider
                                                            value={[settings.voiceClarity]}
                                                            onValueChange={([value]) => handleSettingsChange('voiceClarity', value)}
                                                            min={0}
                                                            max={100}
                                                            step={1}
                                                            className="w-full"
                                                        />
                                                        <div className="flex justify-between text-xs text-muted-foreground">
                                                            <span>0%</span>
                                                            <span>{settings.voiceClarity}%</span>
                                                            <span>100%</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {enhancement.key === 'autoEchoCancel' && (
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">Echo Reduction</Label>
                                                        <Slider
                                                            value={[settings.echoReduction]}
                                                            onValueChange={([value]) => handleSettingsChange('echoReduction', value)}
                                                            min={0}
                                                            max={100}
                                                            step={1}
                                                            className="w-full"
                                                        />
                                                        <div className="flex justify-between text-xs text-muted-foreground">
                                                            <span>0%</span>
                                                            <span>{settings.echoReduction}%</span>
                                                            <span>100%</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {enhancement.key === 'autoStabilization' && (
                                                    <div className="space-y-2">
                                                        <Label className="text-xs">Stabilization Strength</Label>
                                                        <Slider
                                                            value={[settings.stabilizationStrength]}
                                                            onValueChange={([value]) => handleSettingsChange('stabilizationStrength', value)}
                                                            min={0}
                                                            max={100}
                                                            step={1}
                                                            className="w-full"
                                                        />
                                                        <div className="flex justify-between text-xs text-muted-foreground">
                                                            <span>0%</span>
                                                            <span>{settings.stabilizationStrength}%</span>
                                                            <span>100%</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </CollapsibleContent>
                                        </Collapsible>
                                    )}
                                </div>
                            )
                        })}
                    </CardContent>
                </Card>
            ))}

            {/* Action Buttons */}
            <div className="flex gap-2">
                <Button
                    onClick={onPreview}
                    disabled={isProcessing}
                    className="flex-1"
                    size="sm"
                >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                </Button>
                <Button
                    variant="outline"
                    onClick={handleReset}
                    disabled={isProcessing}
                    size="sm"
                >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                </Button>
            </div>

            {/* Processing Indicator */}
            {isProcessing && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
                    <span className="text-sm text-blue-700 dark:text-blue-300">
                        Processing enhancements...
                    </span>
                </div>
            )}
        </div>
    )
}
