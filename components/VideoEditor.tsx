'use client'

import { useState, useEffect, useMemo } from 'react'
import MultiTrackTimeline from './MultiTrackTimeline'
import RightSidebar from './RightSidebar'
import ExportDialog, { ExportOptions } from './ExportDialog'
import VideoContainer from './VideoContainer'
import VideoEditorToolbar from './VideoEditorToolbar'
import { exportVideo as processVideoExport, downloadBlob } from '@/lib/videoExporter'
import { EnhancementConfig, EnhancementSettings, getDefaultPreset } from '@/lib/videoEnhancement'
import { useVideoEditorStore } from '@/hooks/useVideoEditorStore'
import { Clip } from '@/hooks/useClips'
import { createTemplateHandlers } from '@/lib/videoEditor/templateHandlers'
import { getBackgroundStyle, getShadowStyle, getDefaultBackgroundSettings, BackgroundSettings } from '@/lib/videoEditor/backgroundUtils'
import { VIDEO_EDITOR_CONSTANTS, VIDEO_EDITOR_STYLES } from '@/lib/videoEditor/constants'

interface VideoEditorProps {
    videoUrl: string
    webcamUrl?: string
    onSave: (editedVideoBlob: Blob) => void
    onCancel: () => void
}

interface TrimRange {
    start: number
    end: number
}

interface Overlay {
    id: string
    type: 'text' | 'image'
    content: string
    x: number
    y: number
    width: number
    height: number
    startTime: number
    endTime: number
}

export default function VideoEditor({ videoUrl, webcamUrl, onSave, onCancel }: VideoEditorProps) {
    // Local state for UI-specific things
    const [trimRange, setTrimRange] = useState<TrimRange>({ start: 0, end: 0 })
    const [overlays, setOverlays] = useState<Overlay[]>([])
    const [hoveredOverlay, setHoveredOverlay] = useState<string | null>(null)

    // Zustand store - single source of truth
    const {
        // Refs
        videoRef,
        webcamVideoRef,

        // Video player state
        isPlaying,
        currentTime,
        duration,
        isVideoReady,
        forceReady,

        // Video player actions
        togglePlayPause,
        seekTo,
        rewind,
        fastForward,
        forceVideoReady,

        // Clips
        clips,
        addClip,
        updateClip,
        deleteClip,
        duplicateClip,
        addRecordedVideoClip,
        addWebcamClip,

        // Webcam overlay
        webcamVideoUrl,
        webcamOverlayPosition,
        webcamOverlaySize,
        webcamSettings,
        setWebcamVideoUrl,
        setWebcamOverlayPosition,
        setWebcamOverlaySize,
        setWebcamSettings,
        handleWebcamMouseDown,
        handleWebcamResizeMouseDown,

        // Annotations
        annotations,
        selectedAnnotation,
        selectedAnnotationTool,
        annotationColor,
        annotationStrokeWidth,
        annotationFontSize,
        setSelectedAnnotation,
        setSelectedAnnotationTool,
        setAnnotationColor,
        setAnnotationStrokeWidth,
        setAnnotationFontSize,
        addAnnotation,
        updateAnnotation,
        removeAnnotation,
        handleAnnotationMouseDown,
        handleAnnotationResize,

        // UI state
        isProcessing,
        isDarkMode,
        aspectRatio,
        backgroundSettings,
        showExportDialog,
        setProcessing,
        setDarkMode,
        setAspectRatio,
        setBackgroundSettings,
        setShowExportDialog,

        // Template state
        currentColorPreset,
        currentAspectRatio,
        currentBrandKit,
        colorGradingFilters,
        setCurrentColorPreset,
        setCurrentAspectRatio,
        setCurrentBrandKit,
        setColorGradingFilters,

        // Enhancement state
        enhancementConfig,
        enhancementSettings,
        setEnhancementConfig,
        setEnhancementSettings
    } = useVideoEditorStore()

    // Template handlers
    const templateHandlers = createTemplateHandlers(
        setCurrentColorPreset,
        setColorGradingFilters,
        setCurrentAspectRatio,
        setAspectRatio,
        setCurrentBrandKit,
        setBackgroundSettings
    )

    // Memoized style calculations to prevent re-renders
    const videoContainerStyle = useMemo(() => ({
        aspectRatio: aspectRatio === '16:9' ? '16/9' :
            aspectRatio === '4:3' ? '4/3' :
                aspectRatio === '1:1' ? '1/1' :
                    aspectRatio === '21:9' ? '21/9' :
                        aspectRatio === '9:16' ? '9/16' : '16/9',
        maxWidth: `${VIDEO_EDITOR_CONSTANTS.MAX_VIDEO_WIDTH_PERCENT}%`,
        maxHeight: `${VIDEO_EDITOR_CONSTANTS.MAX_VIDEO_HEIGHT_PERCENT}%`,
        width: 'fit-content',
        height: 'fit-content',
        minWidth: `${VIDEO_EDITOR_CONSTANTS.MIN_VIDEO_WIDTH}px`,
        minHeight: `${VIDEO_EDITOR_CONSTANTS.MIN_VIDEO_HEIGHT}px`,
        borderRadius: `${backgroundSettings.borderRadius}px`,
        ...getShadowStyle(backgroundSettings)
    }), [aspectRatio, backgroundSettings])

    const backgroundLayerStyle = useMemo(() => ({
        ...getBackgroundStyle(backgroundSettings),
        borderRadius: `${backgroundSettings.borderRadius}px`
    }), [backgroundSettings])

    // Enhancement configuration handlers
    const handleEnhancementConfigChange = (config: EnhancementConfig) => {
        setEnhancementConfig(config)
        try {
            localStorage.setItem('videoEditor_enhancementConfig', JSON.stringify(config))
        } catch (error) {
            console.warn('Failed to save enhancement config to localStorage:', error)
        }
    }

    const handleEnhancementSettingsChange = (settings: EnhancementSettings) => {
        setEnhancementSettings(settings)
        try {
            localStorage.setItem('videoEditor_enhancementSettings', JSON.stringify(settings))
        } catch (error) {
            console.warn('Failed to save enhancement settings to localStorage:', error)
        }
    }

    // Update webcam URL when prop changes
    useEffect(() => {
        if (webcamUrl) {
            setWebcamVideoUrl(webcamUrl)
        }
    }, [webcamUrl, setWebcamVideoUrl])

    // Load enhancement configuration from localStorage on mount
    useEffect(() => {
        try {
            const savedConfig = localStorage.getItem('videoEditor_enhancementConfig')
            if (savedConfig) {
                const config = JSON.parse(savedConfig)
                setEnhancementConfig(config)
            }

            const savedSettings = localStorage.getItem('videoEditor_enhancementSettings')
            if (savedSettings) {
                const settings = JSON.parse(savedSettings)
                setEnhancementSettings(settings)
            }
        } catch (error) {
            console.warn('Failed to load enhancement configuration from localStorage:', error)
        }
    }, [setEnhancementConfig, setEnhancementSettings])

    // Add clips when video is ready
    useEffect(() => {
        if (isVideoReady && duration > 0) {
            addRecordedVideoClip(duration, videoUrl)
            if (webcamUrl) {
                addWebcamClip(duration, webcamUrl)
            }
        }
    }, [isVideoReady, duration, videoUrl, webcamUrl, addRecordedVideoClip, addWebcamClip])

    // Update trim range when video is ready
    useEffect(() => {
        if (isVideoReady && duration > 0) {
            setTrimRange({ start: 0, end: duration })
        }
    }, [isVideoReady, duration])

    // Utility functions
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }

    const handleTrimStartChange = (value: number[]) => {
        const newStart = value[0]
        if (isFinite(newStart) && newStart >= 0 && newStart <= duration) {
            setTrimRange(prev => ({ ...prev, start: newStart }))
            if (newStart > currentTime) {
                seekTo(newStart)
            }
        }
    }

    const handleTrimEndChange = (value: number[]) => {
        const newEnd = value[0]
        if (isFinite(newEnd) && newEnd >= 0 && newEnd <= duration) {
            setTrimRange(prev => ({ ...prev, end: newEnd }))
            if (newEnd < currentTime) {
                seekTo(newEnd)
            }
        }
    }

    const addOverlay = (overlay: Overlay) => {
        setOverlays(prev => [...prev, overlay])
    }

    const removeOverlay = (id: string) => {
        setOverlays(prev => prev.filter(overlay => overlay.id !== id))
    }

    // Wrapper functions for annotation handlers
    const handleAddAnnotation = (annotation: any) => {
        addAnnotation(annotation)
        // Also add to clips for timeline
        const annotationClip: Clip = {
            id: annotation.id,
            type: 'effect',
            name: annotation.type === 'text' ? `Text: ${annotation.content?.substring(0, 20) || 'Text'}` : `${annotation.type.charAt(0).toUpperCase() + annotation.type.slice(1)}`,
            startTime: annotation.startTime,
            endTime: annotation.endTime,
            trackId: 'effect-2',
            color: annotation.color,
            muted: false,
            locked: false
        }
        addClip(annotationClip)
    }

    const handleUpdateAnnotation = (id: string, updates: any) => {
        updateAnnotation(id, updates)
        // Also update clips for timeline
        updateClip(id, {
            startTime: updates.startTime,
            endTime: updates.endTime,
            color: updates.color
        })
    }

    const handleRemoveAnnotation = (id: string) => {
        removeAnnotation(id)
        deleteClip(id)
    }

    const handleAnnotationMouseDownWrapper = (e: React.MouseEvent<HTMLDivElement>, annotationId: string) => {
        handleAnnotationMouseDown(e, annotationId)
    }

    const handleAnnotationResizeWrapper = (e: React.MouseEvent<HTMLDivElement>, annotationId: string) => {
        handleAnnotationResize(e, annotationId)
    }

    const handleExportClick = () => {
        setShowExportDialog(true)
    }

    const handleExport = async (options: ExportOptions, onProgressUpdate: (progress: number) => void) => {
        setProcessing(true)
        try {
            console.log('Starting export with options:', options)

            const exportedBlob = await processVideoExport({
                videoUrl,
                webcamUrl: webcamVideoUrl || undefined,
                options,
                videoDuration: duration,
                webcamSettings: {
                    visible: webcamSettings.visible && options.includeWebcam,
                    position: webcamOverlayPosition,
                    size: webcamOverlaySize,
                    shape: webcamSettings.shape,
                    borderWidth: webcamSettings.borderWidth,
                    borderColor: webcamSettings.borderColor
                },
                backgroundSettings: {
                    type: backgroundSettings.type,
                    padding: backgroundSettings.padding,
                    borderRadius: backgroundSettings.borderRadius,
                    backgroundColor: backgroundSettings.backgroundColor,
                    gradientColors: backgroundSettings.gradientColors,
                    wallpaperIndex: backgroundSettings.wallpaperIndex,
                    wallpaperUrl: backgroundSettings.wallpaperUrl,
                    blurAmount: backgroundSettings.blurAmount
                },
                enhancementConfig,
                enhancementSettings,
                onProgress: (progress) => {
                    console.log('Export progress:', Math.round(progress * 100) + '%')
                    onProgressUpdate(progress)
                }
            })

            console.log('Export complete, blob size:', exportedBlob.size)
            console.log('Export blob type:', exportedBlob.type)

            // Generate filename with timestamp and resolution
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)

            // Determine actual format from blob type
            let fileExtension = 'webm'
            if (exportedBlob.type.includes('mp4')) {
                fileExtension = 'mp4'
            } else if (options.format === 'mp4') {
                console.warn('⚠️ MP4 was requested but got WebM - conversion may have failed')
            }

            const filename = `video-${options.resolution}-${timestamp}.${fileExtension}`
            console.log('Downloading as:', filename)

            // Download the file
            downloadBlob(exportedBlob, filename)

            // Also call onSave for backward compatibility
            onSave(exportedBlob)

            setShowExportDialog(false)
        } catch (error) {
            console.error('Video export error:', error)
            alert('Failed to export video. Please try again.')
            throw error
        } finally {
            setProcessing(false)
        }
    }

    const handleCrop = () => {
        // Placeholder for crop functionality
        console.log('Crop functionality coming soon')
    }

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

            switch (e.key) {
                case VIDEO_EDITOR_CONSTANTS.KEYBOARD_SHORTCUTS.SPACE:
                    e.preventDefault()
                    togglePlayPause()
                    break
                case VIDEO_EDITOR_CONSTANTS.KEYBOARD_SHORTCUTS.ARROW_LEFT:
                    e.preventDefault()
                    rewind()
                    break
                case VIDEO_EDITOR_CONSTANTS.KEYBOARD_SHORTCUTS.ARROW_RIGHT:
                    e.preventDefault()
                    fastForward()
                    break
                case VIDEO_EDITOR_CONSTANTS.KEYBOARD_SHORTCUTS.ESCAPE:
                    onCancel()
                    break
                case VIDEO_EDITOR_CONSTANTS.KEYBOARD_SHORTCUTS.EXPORT:
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault()
                        handleExportClick()
                    }
                    break
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [togglePlayPause, rewind, fastForward, onCancel, handleExportClick])

    return (
        <div className={VIDEO_EDITOR_STYLES.MAIN_CONTAINER}>
            {/* Export Dialog */}
            <ExportDialog
                isOpen={showExportDialog}
                onClose={() => setShowExportDialog(false)}
                onExport={handleExport}
                duration={duration}
            />

            {/* Top Toolbar */}
            <VideoEditorToolbar
                currentTime={currentTime}
                duration={duration}
                aspectRatio={aspectRatio}
                isDarkMode={isDarkMode}
                isProcessing={isProcessing}
                onCancel={onCancel}
                onAspectRatioChange={setAspectRatio}
                onExportClick={handleExportClick}
                onForceReady={forceVideoReady}
                formatTime={formatTime}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex min-h-0">
                {/* Video Preview - Left Side */}
                <div className={VIDEO_EDITOR_STYLES.VIDEO_PREVIEW}>
                    {/* Ambient Background Effect */}
                    <div className={VIDEO_EDITOR_STYLES.AMBIENT_BACKGROUND}>
                        <div className={VIDEO_EDITOR_STYLES.AMBIENT_CIRCLE_1}></div>
                        <div className={VIDEO_EDITOR_STYLES.AMBIENT_CIRCLE_2} style={{ animationDelay: '1s' }}></div>
                    </div>

                    {/* Video Container with Enhanced Styling */}
                    <div
                        className={`${VIDEO_EDITOR_STYLES.VIDEO_CONTAINER} border-gray-700/50 shadow-xl hover:border-gray-600/50`}
                        style={videoContainerStyle}
                    >
                        {/* Background Layer with Blur */}
                        <div
                            className="absolute inset-0 transition-all duration-300"
                            style={backgroundLayerStyle}
                        />

                        {/* Content Layer (Video) */}
                        <VideoContainer
                            videoUrl={videoUrl}
                            webcamVideoUrl={webcamVideoUrl}
                            webcamOverlayPosition={webcamOverlayPosition}
                            webcamOverlaySize={webcamOverlaySize}
                            webcamSettings={webcamSettings}
                            isVideoReady={isVideoReady}
                            forceReady={forceReady}
                            currentTime={currentTime}
                            aspectRatio={aspectRatio}
                            backgroundSettings={backgroundSettings}
                            annotations={annotations}
                            selectedAnnotation={selectedAnnotation}
                            selectedAnnotationTool={selectedAnnotationTool}
                            annotationColor={annotationColor}
                            annotationStrokeWidth={annotationStrokeWidth}
                            annotationFontSize={annotationFontSize}
                            onForceReady={forceVideoReady}
                            onWebcamMouseDown={handleWebcamMouseDown}
                            onWebcamResizeMouseDown={handleWebcamResizeMouseDown}
                            onAddAnnotation={handleAddAnnotation}
                            onUpdateAnnotation={handleUpdateAnnotation}
                            onRemoveAnnotation={handleRemoveAnnotation}
                            onAnnotationMouseDown={handleAnnotationMouseDownWrapper}
                            onAnnotationResize={handleAnnotationResizeWrapper}
                            videoRef={videoRef}
                            webcamVideoRef={webcamVideoRef}
                        />
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className={VIDEO_EDITOR_STYLES.SIDEBAR}>
                    <RightSidebar
                        overlays={overlays}
                        onAddOverlay={addOverlay}
                        onRemoveOverlay={removeOverlay}
                        currentTime={currentTime}
                        duration={duration}
                        formatTime={formatTime}
                        backgroundSettings={backgroundSettings}
                        onBackgroundChange={setBackgroundSettings}
                        clips={clips}
                        onAddClip={addClip}
                        onUpdateClip={updateClip}
                        webcamOverlayPosition={webcamOverlayPosition}
                        setWebcamOverlayPosition={setWebcamOverlayPosition}
                        webcamOverlaySize={webcamOverlaySize}
                        setWebcamOverlaySize={setWebcamOverlaySize}
                        webcamSettings={webcamSettings}
                        onWebcamSettingsChange={setWebcamSettings}
                        annotations={annotations}
                        onAddAnnotation={handleAddAnnotation}
                        onUpdateAnnotation={handleUpdateAnnotation}
                        onRemoveAnnotation={handleRemoveAnnotation}
                        selectedAnnotationTool={selectedAnnotationTool}
                        onAnnotationToolChange={setSelectedAnnotationTool}
                        annotationColor={annotationColor}
                        onAnnotationColorChange={setAnnotationColor}
                        annotationStrokeWidth={annotationStrokeWidth}
                        onAnnotationStrokeWidthChange={setAnnotationStrokeWidth}
                        annotationFontSize={annotationFontSize}
                        onAnnotationFontSizeChange={setAnnotationFontSize}
                        onApplyColorGrading={templateHandlers.onApplyColorGrading}
                        onApplyAspectRatio={templateHandlers.onApplyAspectRatio}
                        onApplyBrandKit={templateHandlers.onApplyBrandKit}
                        onApplyTransition={templateHandlers.onApplyTransition}
                        currentColorPreset={currentColorPreset}
                        currentAspectRatio={currentAspectRatio}
                        currentBrandKit={currentBrandKit}
                        enhancementConfig={enhancementConfig}
                        onEnhancementConfigChange={handleEnhancementConfigChange}
                        enhancementSettings={enhancementSettings}
                        onEnhancementSettingsChange={handleEnhancementSettingsChange}
                        onRemoveClip={deleteClip}
                    />
                </div>
            </div>

            {/* Bottom Timeline */}
            <div className={VIDEO_EDITOR_STYLES.TIMELINE} style={{ height: `${VIDEO_EDITOR_CONSTANTS.TIMELINE_HEIGHT}px` }}>
                <MultiTrackTimeline
                    isPlaying={isPlaying}
                    currentTime={currentTime}
                    duration={duration}
                    onPlayPause={togglePlayPause}
                    onSeek={seekTo}
                    onRewind={rewind}
                    onFastForward={fastForward}
                    isVideoReady={isVideoReady}
                    aspectRatio={aspectRatio}
                    onCrop={handleCrop}
                    onAspectRatioChange={setAspectRatio}
                    clips={clips}
                    onUpdateClip={updateClip}
                    onDeleteClip={deleteClip}
                    onDuplicateClip={duplicateClip}
                    onAddClip={addClip}
                />
            </div>
        </div>
    )
}