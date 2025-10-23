'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Label } from '@/components/ui/label'
import {
    Eye,
    ZoomIn,
    ZoomOut,
    RotateCcw,
    Download,
    Maximize2,
    Minimize2,
    Loader2,
    AlertCircle,
    CheckCircle,
    Info
} from 'lucide-react'
import type { EnhancementMetrics } from '@/lib/videoEnhancement'

interface EnhancementPreviewProps {
    originalImage?: ImageData | null
    enhancedImage?: ImageData | null
    metrics?: EnhancementMetrics
    isGenerating?: boolean
    error?: string | null
    onRegenerate?: () => void
    className?: string
}

export default function EnhancementPreview({
    originalImage,
    enhancedImage,
    metrics,
    isGenerating = false,
    error = null,
    onRegenerate,
    className = ''
}: EnhancementPreviewProps) {
    const [comparisonPosition, setComparisonPosition] = useState(50) // 0-100, 50 = center
    const [zoom, setZoom] = useState(100) // percentage
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [showMetrics, setShowMetrics] = useState(true)

    const originalCanvasRef = useRef<HTMLCanvasElement>(null)
    const enhancedCanvasRef = useRef<HTMLCanvasElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Draw images to canvases when they change
    useEffect(() => {
        if (originalImage && originalCanvasRef.current) {
            const canvas = originalCanvasRef.current
            const ctx = canvas.getContext('2d')
            if (ctx) {
                canvas.width = originalImage.width
                canvas.height = originalImage.height
                ctx.putImageData(originalImage, 0, 0)
            }
        }
    }, [originalImage])

    useEffect(() => {
        if (enhancedImage && enhancedCanvasRef.current) {
            const canvas = enhancedCanvasRef.current
            const ctx = canvas.getContext('2d')
            if (ctx) {
                canvas.width = enhancedImage.width
                canvas.height = enhancedImage.height
                ctx.putImageData(enhancedImage, 0, 0)
            }
        }
    }, [enhancedImage])

    // Handle zoom changes
    const handleZoomChange = (value: number[]) => {
        setZoom(value[0])
    }

    // Handle comparison slider
    const handleComparisonChange = (value: number[]) => {
        setComparisonPosition(value[0])
    }

    // Reset zoom
    const resetZoom = () => {
        setZoom(100)
    }

    // Toggle fullscreen
    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen)
    }

    // Calculate canvas dimensions based on zoom
    const getCanvasStyle = () => {
        const scale = zoom / 100
        return {
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: `${100 / scale}%`,
            height: `${100 / scale}%`
        }
    }

    // Render comparison view
    const renderComparison = () => {
        if (!originalImage && !enhancedImage) {
            return (
                <div className="flex items-center justify-center h-64 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    <div className="text-center">
                        <Eye className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No preview available</p>
                        <p className="text-xs text-gray-400">Generate a preview to see before/after comparison</p>
                    </div>
                </div>
            )
        }

        return (
            <div className="relative overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                {/* Original Image */}
                <div
                    className="absolute inset-0"
                    style={{
                        clipPath: `inset(0 ${100 - comparisonPosition}% 0 0)`
                    }}
                >
                    <canvas
                        ref={originalCanvasRef}
                        className="block"
                        style={getCanvasStyle()}
                    />
                    <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="text-xs">
                            Original
                        </Badge>
                    </div>
                </div>

                {/* Enhanced Image */}
                <div
                    className="absolute inset-0"
                    style={{
                        clipPath: `inset(0 0 0 ${comparisonPosition}%)`
                    }}
                >
                    <canvas
                        ref={enhancedCanvasRef}
                        className="block"
                        style={getCanvasStyle()}
                    />
                    <div className="absolute top-2 right-2">
                        <Badge variant="default" className="text-xs">
                            Enhanced
                        </Badge>
                    </div>
                </div>

                {/* Comparison Slider */}
                <div className="absolute inset-y-0 left-0 w-1 bg-white shadow-lg cursor-ew-resize"
                    style={{ left: `${comparisonPosition}%` }}
                >
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg" />
                </div>

                {/* Loading Overlay */}
                {isGenerating && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-center text-white">
                            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                            <p className="text-sm">Generating preview...</p>
                        </div>
                    </div>
                )}

                {/* Error Overlay */}
                {error && (
                    <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                        <div className="text-center text-red-700 dark:text-red-300">
                            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-sm font-medium">Preview Error</p>
                            <p className="text-xs">{error}</p>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    // Render metrics
    const renderMetrics = () => {
        if (!metrics || !showMetrics) return null

        return (
            <Card className="mt-4">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Enhancement Metrics
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {/* Color Metrics */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-medium text-muted-foreground">Color Adjustments</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex justify-between">
                                <span>Brightness:</span>
                                <span className={metrics.brightnessAdjustment > 0 ? 'text-green-600' : 'text-red-600'}>
                                    {metrics.brightnessAdjustment > 0 ? '+' : ''}{metrics.brightnessAdjustment.toFixed(1)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Contrast:</span>
                                <span className={metrics.contrastAdjustment > 0 ? 'text-green-600' : 'text-red-600'}>
                                    {metrics.contrastAdjustment > 0 ? '+' : ''}{metrics.contrastAdjustment.toFixed(1)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Temperature:</span>
                                <span className={metrics.colorTemperatureShift > 0 ? 'text-orange-600' : 'text-blue-600'}>
                                    {metrics.colorTemperatureShift > 0 ? '+' : ''}{metrics.colorTemperatureShift.toFixed(1)}°K
                                </span>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Audio Metrics */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-medium text-muted-foreground">Audio Enhancements</h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex justify-between">
                                <span>Noise Reduction:</span>
                                <span className="text-green-600">
                                    -{metrics.noiseReductionDb.toFixed(1)}dB
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Volume Adjust:</span>
                                <span className={metrics.volumeAdjustmentDb > 0 ? 'text-green-600' : 'text-red-600'}>
                                    {metrics.volumeAdjustmentDb > 0 ? '+' : ''}{metrics.volumeAdjustmentDb.toFixed(1)}dB
                                </span>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Stabilization Metrics */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-medium text-muted-foreground">Video Quality</h4>
                        <div className="grid grid-cols-1 gap-2 text-xs">
                            <div className="flex justify-between">
                                <span>Shake Reduction:</span>
                                <span className="text-green-600">
                                    {metrics.shakeReduction.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const containerClasses = isFullscreen
        ? 'fixed inset-0 z-50 bg-background p-4'
        : 'relative'

    return (
        <div ref={containerRef} className={`${containerClasses} ${className}`}>
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                Preview
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Compare original and enhanced video frames
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowMetrics(!showMetrics)}
                                className="text-xs"
                            >
                                {showMetrics ? 'Hide' : 'Show'} Metrics
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={toggleFullscreen}
                                className="text-xs"
                            >
                                {isFullscreen ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Comparison View */}
                    {renderComparison()}

                    {/* Controls */}
                    <div className="space-y-3">
                        {/* Comparison Slider */}
                        <div className="space-y-2">
                            <Label className="text-xs">Comparison</Label>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">Original</span>
                                <Slider
                                    value={[comparisonPosition]}
                                    onValueChange={handleComparisonChange}
                                    min={0}
                                    max={100}
                                    step={1}
                                    className="flex-1"
                                />
                                <span className="text-xs text-muted-foreground">Enhanced</span>
                            </div>
                        </div>

                        {/* Zoom Controls */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setZoom(Math.max(25, zoom - 25))}
                                    disabled={zoom <= 25}
                                    className="text-xs"
                                >
                                    <ZoomOut className="h-3 w-3" />
                                </Button>
                                <span className="text-xs min-w-[3rem] text-center">{zoom}%</span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setZoom(Math.min(400, zoom + 25))}
                                    disabled={zoom >= 400}
                                    className="text-xs"
                                >
                                    <ZoomIn className="h-3 w-3" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={resetZoom}
                                    className="text-xs"
                                >
                                    <RotateCcw className="h-3 w-3" />
                                </Button>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onRegenerate}
                                disabled={isGenerating}
                                className="text-xs"
                            >
                                {isGenerating ? (
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                    <Eye className="h-3 w-3 mr-1" />
                                )}
                                {isGenerating ? 'Generating...' : 'Regenerate'}
                            </Button>
                        </div>
                    </div>

                    {/* Metrics */}
                    {renderMetrics()}
                </CardContent>
            </Card>
        </div>
    )
}
