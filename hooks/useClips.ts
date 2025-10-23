import { useState, useCallback } from 'react'

export interface Clip {
    id: string
    type: 'video' | 'audio' | 'effect' | 'text' | 'image'
    name: string
    startTime: number
    endTime: number
    trackId: string
    thumbnail?: string
    waveform?: number[]
    color: string
    muted?: boolean
    locked?: boolean
    selected?: boolean
}

export const useClips = () => {
    const [clips, setClips] = useState<Clip[]>([])

    const addClip = useCallback((clip: Clip) => {
        setClips(prev => [...prev, clip])
    }, [])

    const updateClip = useCallback((clipId: string, updates: Partial<Clip>) => {
        setClips(prev => prev.map(clip =>
            clip.id === clipId ? { ...clip, ...updates } : clip
        ))
    }, [])

    const deleteClip = useCallback((clipId: string) => {
        setClips(prev => prev.filter(clip => clip.id !== clipId))
    }, [])

    const duplicateClip = useCallback((clipId: string) => {
        const clip = clips.find(c => c.id === clipId)
        if (clip) {
            const duration = clip.endTime - clip.startTime
            const newClip: Clip = {
                ...clip,
                id: `${clip.id}-copy-${Date.now()}`,
                name: `${clip.name} (Copy)`,
                startTime: clip.endTime,
                endTime: clip.endTime + duration
            }
            addClip(newClip)
        }
    }, [clips, addClip])

    const addRecordedVideoClip = useCallback((duration: number, videoUrl: string) => {
        if (!videoUrl || !duration || duration <= 0 || !isFinite(duration)) {
            return
        }

        setClips(prev => {
            const existingIndex = prev.findIndex(clip => clip.name === 'Recorded Video')

            if (existingIndex !== -1) {
                const updated = [...prev]
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    endTime: duration,
                }
                return updated
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
            return [...prev, recordedVideoClip]
        })
    }, [])

    const addWebcamClip = useCallback((duration: number, webcamUrl: string) => {
        if (!webcamUrl || !duration || duration <= 0 || !isFinite(duration)) {
            return
        }

        setClips(prev => {
            const existingIndex = prev.findIndex(clip => clip.name === 'Webcam')
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
            return [...prev, webcamClip]
        })
    }, [])

    return {
        clips,
        addClip,
        updateClip,
        deleteClip,
        duplicateClip,
        addRecordedVideoClip,
        addWebcamClip
    }
}
