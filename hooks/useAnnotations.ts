import { useState, useCallback } from 'react'
import { Annotation } from '@/components/VideoAnnotation'
import { Clip } from './useClips'

export const useAnnotations = () => {
    const [annotations, setAnnotations] = useState<Annotation[]>([])
    const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null)
    const [selectedAnnotationTool, setSelectedAnnotationTool] = useState<Annotation['type'] | null>(null)
    const [annotationColor, setAnnotationColor] = useState('#ff0000')
    const [annotationStrokeWidth, setAnnotationStrokeWidth] = useState(3)
    const [annotationFontSize, setAnnotationFontSize] = useState(24)

    const addAnnotation = useCallback((annotation: Annotation, onAddClip: (clip: Clip) => void) => {
        setAnnotations(prev => [...prev, annotation])

        // Also add to clips for timeline display
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
        onAddClip(annotationClip)

        // Clear tool selection after adding
        setSelectedAnnotationTool(null)
    }, [])

    const updateAnnotation = useCallback((id: string, updates: Partial<Annotation>, onUpdateClip: (clipId: string, updates: Partial<Clip>) => void) => {
        setAnnotations(prev => prev.map(ann =>
            ann.id === id ? { ...ann, ...updates } : ann
        ))

        // Update corresponding clip
        onUpdateClip(id, {
            startTime: updates.startTime,
            endTime: updates.endTime,
            color: updates.color
        })
    }, [])

    const removeAnnotation = useCallback((id: string, onDeleteClip: (clipId: string) => void) => {
        setAnnotations(prev => prev.filter(ann => ann.id !== id))
        onDeleteClip(id)
        if (selectedAnnotation === id) {
            setSelectedAnnotation(null)
        }
    }, [selectedAnnotation])

    const handleAnnotationMouseDown = useCallback((
        e: React.MouseEvent<HTMLDivElement>,
        annotationId: string,
        onUpdateAnnotation: (id: string, updates: Partial<Annotation>) => void
    ) => {
        e.preventDefault()
        e.stopPropagation()
        setSelectedAnnotation(annotationId)

        const annotation = annotations.find(a => a.id === annotationId)
        if (!annotation) return

        const startX = e.clientX
        const startY = e.clientY
        const startLeft = annotation.x
        const startTop = annotation.y

        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = ((e.clientX - startX) / window.innerWidth) * 100
            const deltaY = ((e.clientY - startY) / window.innerHeight) * 100

            onUpdateAnnotation(annotationId, {
                x: Math.max(0, Math.min(100, startLeft + deltaX)),
                y: Math.max(0, Math.min(100, startTop + deltaY))
            })
        }

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
    }, [annotations])

    const handleAnnotationResize = useCallback((
        e: React.MouseEvent<HTMLDivElement>,
        annotationId: string,
        onUpdateAnnotation: (id: string, updates: Partial<Annotation>) => void
    ) => {
        e.preventDefault()
        e.stopPropagation()

        const annotation = annotations.find(a => a.id === annotationId)
        if (!annotation || !annotation.width || !annotation.height) return

        const startX = e.clientX
        const startY = e.clientY
        const startWidth = annotation.width
        const startHeight = annotation.height

        const handleMouseMove = (e: MouseEvent) => {
            const deltaX = e.clientX - startX
            const deltaY = e.clientY - startY

            onUpdateAnnotation(annotationId, {
                width: Math.max(50, startWidth + deltaX),
                height: Math.max(30, startHeight + deltaY)
            })
        }

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
    }, [annotations])

    return {
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
        handleAnnotationResize
    }
}
