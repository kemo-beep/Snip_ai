import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { Clip } from '@/hooks/useClips'
import { Annotation } from '@/components/VideoAnnotation'
import { BackgroundSettings, getDefaultBackgroundSettings } from '@/lib/videoEditor/backgroundUtils'
import { EnhancementConfig, EnhancementSettings, getDefaultPreset } from '@/lib/videoEnhancement'

interface VideoPlayerState {
    isPlaying: boolean
    currentTime: number
    duration: number
    isVideoReady: boolean
    forceReady: boolean
}

interface WebcamOverlayState {
    webcamVideoUrl: string | null
    webcamOverlayPosition: { x: number; y: number }
    webcamOverlaySize: { width: number; height: number }
    webcamSettings: {
        visible: boolean
        shape: 'rectangle' | 'square' | 'circle'
        shadowIntensity: number
        borderWidth: number
        borderColor: string
    }
}

interface AnnotationsState {
    annotations: Annotation[]
    selectedAnnotation: string | null
    selectedAnnotationTool: Annotation['type'] | null
    annotationColor: string
    annotationStrokeWidth: number
    annotationFontSize: number
}

interface VideoEditorState {
    // Video player state
    videoPlayer: VideoPlayerState

    // Clips state
    clips: Clip[]

    // Webcam overlay state
    webcamOverlay: WebcamOverlayState

    // Annotations state
    annotations: AnnotationsState

    // UI state
    isProcessing: boolean
    isDarkMode: boolean
    aspectRatio: string
    backgroundSettings: BackgroundSettings
    showExportDialog: boolean

    // Template state
    currentColorPreset: string | undefined
    currentAspectRatio: string | undefined
    currentBrandKit: string | undefined
    colorGradingFilters: any

    // Enhancement state
    enhancementConfig: EnhancementConfig
    enhancementSettings: EnhancementSettings

    // Actions
    setVideoPlayer: (state: Partial<VideoPlayerState>) => void
    setClips: (clips: Clip[]) => void
    addClip: (clip: Clip) => void
    updateClip: (clipId: string, updates: Partial<Clip>) => void
    deleteClip: (clipId: string) => void
    duplicateClip: (clipId: string) => void
    addRecordedVideoClip: (duration: number, videoUrl: string) => void
    addWebcamClip: (duration: number, webcamUrl: string) => void

    setWebcamOverlay: (state: Partial<WebcamOverlayState>) => void
    setWebcamVideoUrl: (url: string | null) => void
    setWebcamOverlayPosition: (position: { x: number; y: number }) => void
    setWebcamOverlaySize: (size: { width: number; height: number }) => void
    setWebcamSettings: (settings: Partial<WebcamOverlayState['webcamSettings']>) => void

    setAnnotations: (state: Partial<AnnotationsState>) => void
    addAnnotation: (annotation: Annotation) => void
    updateAnnotation: (id: string, updates: Partial<Annotation>) => void
    removeAnnotation: (id: string) => void
    setSelectedAnnotation: (id: string | null) => void
    setSelectedAnnotationTool: (tool: Annotation['type'] | null) => void
    setAnnotationColor: (color: string) => void
    setAnnotationStrokeWidth: (width: number) => void
    setAnnotationFontSize: (size: number) => void

    setProcessing: (processing: boolean) => void
    setDarkMode: (darkMode: boolean) => void
    setAspectRatio: (ratio: string) => void
    setBackgroundSettings: (settings: BackgroundSettings) => void
    setShowExportDialog: (show: boolean) => void

    setCurrentColorPreset: (preset: string | undefined) => void
    setCurrentAspectRatio: (ratio: string | undefined) => void
    setCurrentBrandKit: (kit: string | undefined) => void
    setColorGradingFilters: (filters: any) => void

    setEnhancementConfig: (config: EnhancementConfig) => void
    setEnhancementSettings: (settings: EnhancementSettings) => void

    // Reset
    reset: () => void
}

const defaultPreset = getDefaultPreset()

export const useVideoEditorStore = create<VideoEditorState>()(
    subscribeWithSelector((set, get) => ({
        // Initial state
        videoPlayer: {
            isPlaying: false,
            currentTime: 0,
            duration: 0,
            isVideoReady: false,
            forceReady: false
        },

        clips: [],

        webcamOverlay: {
            webcamVideoUrl: null,
            webcamOverlayPosition: { x: 2, y: 2 },
            webcamOverlaySize: { width: 100, height: 100 },
            webcamSettings: {
                visible: true,
                shape: 'rectangle',
                shadowIntensity: 0,
                borderWidth: 2,
                borderColor: '#3b82f6'
            }
        },

        annotations: {
            annotations: [],
            selectedAnnotation: null,
            selectedAnnotationTool: null,
            annotationColor: '#ff0000',
            annotationStrokeWidth: 3,
            annotationFontSize: 24
        },

        isProcessing: false,
        isDarkMode: true,
        aspectRatio: '16:9',
        backgroundSettings: getDefaultBackgroundSettings(),
        showExportDialog: false,

        currentColorPreset: undefined,
        currentAspectRatio: 'youtube-standard',
        currentBrandKit: undefined,
        colorGradingFilters: null,

        enhancementConfig: defaultPreset.config,
        enhancementSettings: defaultPreset.settings,

        // Actions
        setVideoPlayer: (state) => set((prev) => ({
            videoPlayer: { ...prev.videoPlayer, ...state }
        })),

        setClips: (clips) => set({ clips }),

        addClip: (clip) => set((prev) => ({
            clips: [...prev.clips, clip]
        })),

        updateClip: (clipId, updates) => set((prev) => ({
            clips: prev.clips.map(clip =>
                clip.id === clipId ? { ...clip, ...updates } : clip
            )
        })),

        deleteClip: (clipId) => set((prev) => ({
            clips: prev.clips.filter(clip => clip.id !== clipId)
        })),

        duplicateClip: (clipId) => set((prev) => {
            const clip = prev.clips.find(c => c.id === clipId)
            if (!clip) return prev

            const duration = clip.endTime - clip.startTime
            const newClip: Clip = {
                ...clip,
                id: `${clip.id}-copy-${Date.now()}`,
                name: `${clip.name} (Copy)`,
                startTime: clip.endTime,
                endTime: clip.endTime + duration
            }

            return {
                clips: [...prev.clips, newClip]
            }
        }),

        addRecordedVideoClip: (duration, videoUrl) => set((prev) => {
            if (!videoUrl || !duration || duration <= 0 || !isFinite(duration)) {
                return prev
            }

            const existingIndex = prev.clips.findIndex(clip => clip.name === 'Recorded Video')

            if (existingIndex !== -1) {
                const updated = [...prev.clips]
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    endTime: duration,
                }
                return { clips: updated }
            }

            const recordedVideoClip: Clip = {
                id: `recorded-video-${Date.now()}`,
                type: 'video',
                name: 'Recorded Video',
                startTime: 0,
                endTime: duration,
                trackId: 'video-1',
                thumbnail: videoUrl,
                color: '#3b82f6',
                muted: false,
                locked: false
            }

            return { clips: [...prev.clips, recordedVideoClip] }
        }),

        addWebcamClip: (duration, webcamUrl) => set((prev) => {
            if (!webcamUrl || !duration || duration <= 0 || !isFinite(duration)) {
                return prev
            }

            const existingIndex = prev.clips.findIndex(clip => clip.name === 'Webcam')
            if (existingIndex !== -1) {
                return prev
            }

            const webcamClip: Clip = {
                id: `webcam-${Date.now()}`,
                type: 'video',
                name: 'Webcam',
                startTime: 0,
                endTime: duration,
                trackId: 'effect-1',
                thumbnail: webcamUrl,
                color: '#a855f7',
                muted: false,
                locked: false
            }

            return { clips: [...prev.clips, webcamClip] }
        }),

        setWebcamOverlay: (state) => set((prev) => ({
            webcamOverlay: { ...prev.webcamOverlay, ...state }
        })),

        setWebcamVideoUrl: (url) => set((prev) => ({
            webcamOverlay: { ...prev.webcamOverlay, webcamVideoUrl: url }
        })),

        setWebcamOverlayPosition: (position) => set((prev) => ({
            webcamOverlay: { ...prev.webcamOverlay, webcamOverlayPosition: position }
        })),

        setWebcamOverlaySize: (size) => set((prev) => ({
            webcamOverlay: { ...prev.webcamOverlay, webcamOverlaySize: size }
        })),

        setWebcamSettings: (settings) => set((prev) => ({
            webcamOverlay: {
                ...prev.webcamOverlay,
                webcamSettings: { ...prev.webcamOverlay.webcamSettings, ...settings }
            }
        })),

        setAnnotations: (state) => set((prev) => ({
            annotations: { ...prev.annotations, ...state }
        })),

        addAnnotation: (annotation) => set((prev) => ({
            annotations: {
                ...prev.annotations,
                annotations: [...prev.annotations.annotations, annotation]
            }
        })),

        updateAnnotation: (id, updates) => set((prev) => ({
            annotations: {
                ...prev.annotations,
                annotations: prev.annotations.annotations.map(ann =>
                    ann.id === id ? { ...ann, ...updates } : ann
                )
            }
        })),

        removeAnnotation: (id) => set((prev) => ({
            annotations: {
                ...prev.annotations,
                annotations: prev.annotations.annotations.filter(ann => ann.id !== id),
                selectedAnnotation: prev.annotations.selectedAnnotation === id ? null : prev.annotations.selectedAnnotation
            }
        })),

        setSelectedAnnotation: (id) => set((prev) => ({
            annotations: { ...prev.annotations, selectedAnnotation: id }
        })),

        setSelectedAnnotationTool: (tool) => set((prev) => ({
            annotations: { ...prev.annotations, selectedAnnotationTool: tool }
        })),

        setAnnotationColor: (color) => set((prev) => ({
            annotations: { ...prev.annotations, annotationColor: color }
        })),

        setAnnotationStrokeWidth: (width) => set((prev) => ({
            annotations: { ...prev.annotations, annotationStrokeWidth: width }
        })),

        setAnnotationFontSize: (size) => set((prev) => ({
            annotations: { ...prev.annotations, annotationFontSize: size }
        })),

        setProcessing: (processing) => set({ isProcessing: processing }),
        setDarkMode: (darkMode) => set({ isDarkMode: darkMode }),
        setAspectRatio: (ratio) => set({ aspectRatio: ratio }),
        setBackgroundSettings: (settings) => set({ backgroundSettings: settings }),
        setShowExportDialog: (show) => set({ showExportDialog: show }),

        setCurrentColorPreset: (preset) => set({ currentColorPreset: preset }),
        setCurrentAspectRatio: (ratio) => set({ currentAspectRatio: ratio }),
        setCurrentBrandKit: (kit) => set({ currentBrandKit: kit }),
        setColorGradingFilters: (filters) => set({ colorGradingFilters: filters }),

        setEnhancementConfig: (config) => set({ enhancementConfig: config }),
        setEnhancementSettings: (settings) => set({ enhancementSettings: settings }),

        reset: () => set({
            videoPlayer: {
                isPlaying: false,
                currentTime: 0,
                duration: 0,
                isVideoReady: false,
                forceReady: false
            },
            clips: [],
            webcamOverlay: {
                webcamVideoUrl: null,
                webcamOverlayPosition: { x: 2, y: 2 },
                webcamOverlaySize: { width: 100, height: 100 },
                webcamSettings: {
                    visible: true,
                    shape: 'rectangle',
                    shadowIntensity: 0,
                    borderWidth: 2,
                    borderColor: '#3b82f6'
                }
            },
            annotations: {
                annotations: [],
                selectedAnnotation: null,
                selectedAnnotationTool: null,
                annotationColor: '#ff0000',
                annotationStrokeWidth: 3,
                annotationFontSize: 24
            },
            isProcessing: false,
            isDarkMode: true,
            aspectRatio: '16:9',
            backgroundSettings: getDefaultBackgroundSettings(),
            showExportDialog: false,
            currentColorPreset: undefined,
            currentAspectRatio: 'youtube-standard',
            currentBrandKit: undefined,
            colorGradingFilters: null,
            enhancementConfig: defaultPreset.config,
            enhancementSettings: defaultPreset.settings
        })
    }))
)
