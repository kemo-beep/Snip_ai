'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X, Download, Loader2, Check, AlertCircle } from 'lucide-react'

interface ExportDialogProps {
    isOpen: boolean
    onClose: () => void
    onExport: (options: ExportOptions, onProgress: (progress: number) => void) => Promise<void>
    duration: number
}

export interface ExportOptions {
    resolution: '4k' | '1080p' | '720p' | '480p' | 'original'
    format: 'mp4' | 'webm'
    quality: 'high' | 'medium' | 'low'
    fps: 30 | 60
    includeWebcam: boolean
}

const resolutionDetails = {
    '4k': { width: 3840, height: 2160, label: '4K Ultra HD', size: 'Very Large' },
    '1080p': { width: 1920, height: 1080, label: 'Full HD', size: 'Large' },
    '720p': { width: 1280, height: 720, label: 'HD', size: 'Medium' },
    '480p': { width: 854, height: 480, label: 'SD', size: 'Small' },
    'original': { width: 0, height: 0, label: 'Original', size: 'Varies' }
}

export default function ExportDialog({ isOpen, onClose, onExport, duration }: ExportDialogProps) {
    const [resolution, setResolution] = useState<ExportOptions['resolution']>('1080p')
    const [format, setFormat] = useState<ExportOptions['format']>('mp4')
    const [quality, setQuality] = useState<ExportOptions['quality']>('high')
    const [fps, setFps] = useState<ExportOptions['fps']>(30)
    const [includeWebcam, setIncludeWebcam] = useState(true)
    const [isExporting, setIsExporting] = useState(false)
    const [exportProgress, setExportProgress] = useState(0)
    const [exportStatus, setExportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle')
    const [exportStage, setExportStage] = useState<string>('Initializing...')

    if (!isOpen) return null

    const handleExport = async () => {
        setIsExporting(true)
        setExportStatus('processing')
        setExportProgress(0)
        setExportStage('Initializing...')

        try {
            await onExport(
                {
                    resolution,
                    format,
                    quality,
                    fps,
                    includeWebcam
                },
                (progress) => {
                    // Update progress from the exporter (0-1 range)
                    const percentage = Math.round(progress * 100)
                    setExportProgress(percentage)
                    
                    // Update stage message based on progress
                    if (percentage < 15) {
                        setExportStage('Loading video files...')
                    } else if (percentage < 30) {
                        setExportStage('Preparing export...')
                    } else if (percentage < 50) {
                        setExportStage('Rendering frames...')
                    } else if (percentage < 80) {
                        setExportStage('Processing video...')
                    } else if (percentage < 85) {
                        setExportStage('Encoding video...')
                    } else if (percentage < 98) {
                        setExportStage(format === 'mp4' ? 'Converting to MP4...' : 'Finalizing export...')
                    } else {
                        setExportStage('Finalizing export...')
                    }
                }
            )

            setExportProgress(100)
            setExportStage('Export complete!')
            setExportStatus('success')

            // Auto close after success
            setTimeout(() => {
                onClose()
                resetState()
            }, 2000)
        } catch (error) {
            console.error('Export failed:', error)
            setExportStatus('error')
            setExportStage('Export failed')
        } finally {
            setIsExporting(false)
        }
    }

    const resetState = () => {
        setExportProgress(0)
        setExportStatus('idle')
        setExportStage('Initializing...')
    }

    const estimatedSize = () => {
        const baseSize = duration * 2 // MB per second (rough estimate)
        const resolutionMultiplier = {
            '4k': 4,
            '1080p': 2,
            '720p': 1,
            '480p': 0.5,
            'original': 2
        }
        const qualityMultiplier = {
            'high': 1.5,
            'medium': 1,
            'low': 0.6
        }
        const size = baseSize * resolutionMultiplier[resolution] * qualityMultiplier[quality]
        return size > 1000 ? `${(size / 1000).toFixed(1)} GB` : `${Math.round(size)} MB`
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <>
            <style jsx>{`
                @keyframes gradient {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .animate-gradient {
                    animation: gradient 2s ease infinite;
                }
            `}</style>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
                <div className="bg-gray-800 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-2xl mx-4 overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-white">Export Video</h2>
                        <p className="text-sm text-purple-100 mt-0.5">
                            Duration: {formatTime(duration)} • Format: {format.toUpperCase()} • Est. size: {estimatedSize()}
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        disabled={isExporting}
                        className="text-white hover:bg-white/20 h-8 w-8 p-0 rounded-full"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* Resolution Selection */}
                    <div>
                        <label className="text-sm font-semibold text-gray-300 mb-3 block">
                            Resolution
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {Object.entries(resolutionDetails).map(([key, details]) => (
                                <button
                                    key={key}
                                    onClick={() => setResolution(key as ExportOptions['resolution'])}
                                    disabled={isExporting}
                                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                                        resolution === key
                                            ? 'border-purple-500 bg-purple-500/20 shadow-lg shadow-purple-500/20'
                                            : 'border-gray-700 bg-gray-900/50 hover:border-gray-600 hover:bg-gray-900'
                                    } ${isExporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                    <div className="flex items-start justify-between mb-1">
                                        <span className="font-semibold text-white">{details.label}</span>
                                        {resolution === key && (
                                            <Check className="h-4 w-4 text-purple-400" />
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        {key !== 'original' && `${details.width} × ${details.height}`}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        Size: {details.size}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Format & Quality */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-semibold text-gray-300 mb-3 block">
                                Format
                            </label>
                            <div className="space-y-2">
                                <button
                                    onClick={() => setFormat('mp4')}
                                    disabled={isExporting}
                                    className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                                        format === 'mp4'
                                            ? 'border-purple-500 bg-purple-500/20'
                                            : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
                                    } ${isExporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-white font-medium">MP4</span>
                                            <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/30 text-purple-300 rounded">
                                                RECOMMENDED
                                            </span>
                                        </div>
                                        {format === 'mp4' && (
                                            <Check className="h-4 w-4 text-purple-400" />
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        Universal compatibility • Works everywhere
                                    </div>
                                </button>
                                
                                <button
                                    onClick={() => setFormat('webm')}
                                    disabled={isExporting}
                                    className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                                        format === 'webm'
                                            ? 'border-purple-500 bg-purple-500/20'
                                            : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
                                    } ${isExporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-white font-medium">WebM</span>
                                        </div>
                                        {format === 'webm' && (
                                            <Check className="h-4 w-4 text-purple-400" />
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        Modern browsers • Faster export
                                    </div>
                                </button>
                            </div>
                            {format === 'mp4' && (
                                <div className="mt-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                    <p className="text-xs text-blue-300">
                                        ℹ️ MP4 conversion adds ~10-15 seconds to export time
                                    </p>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-gray-300 mb-3 block">
                                Quality
                            </label>
                            <div className="space-y-2">
                                {(['high', 'medium', 'low'] as const).map((qual) => (
                                    <button
                                        key={qual}
                                        onClick={() => setQuality(qual)}
                                        disabled={isExporting}
                                        className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                                            quality === qual
                                                ? 'border-purple-500 bg-purple-500/20'
                                                : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
                                        } ${isExporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-white font-medium capitalize">{qual}</span>
                                            {quality === qual && (
                                                <Check className="h-4 w-4 text-purple-400" />
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* FPS Selection */}
                    <div>
                        <label className="text-sm font-semibold text-gray-300 mb-3 block">
                            Frame Rate
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            {([30, 60] as const).map((fpsValue) => (
                                <button
                                    key={fpsValue}
                                    onClick={() => setFps(fpsValue)}
                                    disabled={isExporting}
                                    className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                                        fps === fpsValue
                                            ? 'border-purple-500 bg-purple-500/20'
                                            : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
                                    } ${isExporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-white font-semibold">{fpsValue} FPS</span>
                                        {fps === fpsValue && (
                                            <Check className="h-4 w-4 text-purple-400" />
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                        {fpsValue === 60 ? 'Smoother motion' : 'Standard'}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Options */}
                    <div>
                        <label className="text-sm font-semibold text-gray-300 mb-3 block">
                            Options
                        </label>
                        <button
                            onClick={() => setIncludeWebcam(!includeWebcam)}
                            disabled={isExporting}
                            className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                                includeWebcam
                                    ? 'border-purple-500 bg-purple-500/20'
                                    : 'border-gray-700 bg-gray-900/50 hover:border-gray-600'
                            } ${isExporting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-white font-medium">Include Webcam Overlay</span>
                                    <div className="text-xs text-gray-400 mt-1">
                                        Export with webcam video overlay
                                    </div>
                                </div>
                                <div className={`w-12 h-6 rounded-full transition-colors duration-200 ${
                                    includeWebcam ? 'bg-purple-500' : 'bg-gray-600'
                                }`}>
                                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 mt-0.5 ${
                                        includeWebcam ? 'translate-x-6 ml-0.5' : 'translate-x-0.5'
                                    }`} />
                                </div>
                            </div>
                        </button>
                    </div>

                    {/* Progress Bar */}
                    {isExporting && (
                        <div className="space-y-3 p-4 bg-gray-900/50 rounded-xl border border-gray-700">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    {exportStatus === 'processing' && (
                                        <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />
                                    )}
                                    {exportStatus === 'success' && (
                                        <Check className="h-4 w-4 text-green-400" />
                                    )}
                                    {exportStatus === 'error' && (
                                        <AlertCircle className="h-4 w-4 text-red-400" />
                                    )}
                                    <span className="text-gray-300 font-medium">
                                        {exportStage}
                                    </span>
                                </div>
                                <span className="text-purple-400 font-bold text-lg">{exportProgress}%</span>
                            </div>
                            <div className="h-3 bg-gray-700 rounded-full overflow-hidden shadow-inner">
                                <div
                                    className={`h-full transition-all duration-300 ease-out ${
                                        exportStatus === 'success' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                                        exportStatus === 'error' ? 'bg-gradient-to-r from-red-500 to-rose-500' :
                                        'bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 bg-[length:200%_100%] animate-gradient'
                                    }`}
                                    style={{ width: `${exportProgress}%` }}
                                />
                            </div>
                            {exportStatus === 'processing' && (
                                <div className="text-xs text-gray-400 text-center">
                                    Please wait, this may take a few moments...
                                </div>
                            )}
                        </div>
                    )}

                    {/* Status Messages */}
                    {exportStatus === 'success' && (
                        <div className="flex items-center gap-2 p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
                            <Check className="h-5 w-5 text-green-400" />
                            <span className="text-sm text-green-300">Video exported successfully!</span>
                        </div>
                    )}

                    {exportStatus === 'error' && (
                        <div className="flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-red-400" />
                            <span className="text-sm text-red-300">Export failed. Please try again.</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-gray-900/50 px-6 py-4 flex items-center justify-between border-t border-gray-700">
                    <div className="text-xs text-gray-400">
                        Tip: Higher quality = larger file size
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            disabled={isExporting}
                            className="text-gray-300 hover:text-white hover:bg-gray-700"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleExport}
                            disabled={isExporting || exportStatus === 'success'}
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg hover:shadow-purple-500/50 transition-all duration-200"
                        >
                            {isExporting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Exporting...
                                </>
                            ) : exportStatus === 'success' ? (
                                <>
                                    <Check className="h-4 w-4 mr-2" />
                                    Exported
                                </>
                            ) : (
                                <>
                                    <Download className="h-4 w-4 mr-2" />
                                    Export Video
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
        </>
    )
}
