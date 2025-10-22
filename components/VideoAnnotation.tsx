'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Type, MousePointer, Square, Circle, Minus, Highlighter, Trash2 } from 'lucide-react'

export interface Annotation {
    id: string
    type: 'text' | 'arrow' | 'rectangle' | 'circle' | 'line' | 'highlight' | 'freehand'
    x: number
    y: number
    width?: number
    height?: number
    endX?: number
    endY?: number
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

interface VideoAnnotationProps {
    videoRef: React.RefObject<HTMLVideoElement>
    currentTime: number
    annotations: Annotation[]
    onAddAnnotation: (annotation: Annotation) => void
    onUpdateAnnotation: (id: string, updates: Partial<Annotation>) => void
    onRemoveAnnotation: (id: string) => void
    selectedTool: Annotation['type'] | null
    toolColor: string
    strokeWidth: number
    fontSize: number
    containerWidth: number
    containerHeight: number
}

export default function VideoAnnotation({
    videoRef,
    currentTime,
    annotations,
    onAddAnnotation,
    onUpdateAnnotation,
    onRemoveAnnotation,
    selectedTool,
    toolColor,
    strokeWidth,
    fontSize,
    containerWidth,
    containerHeight
}: VideoAnnotationProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [isDrawing, setIsDrawing] = useState(false)
    const [startPoint, setStartPoint] = useState<{ x: number, y: number } | null>(null)
    const [currentPoints, setCurrentPoints] = useState<{ x: number, y: number }[]>([])
    const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null)
    const [isDragging, setIsDragging] = useState(false)
    const [dragOffset, setDragOffset] = useState<{ x: number, y: number }>({ x: 0, y: 0 })
    const [textInput, setTextInput] = useState('')
    const [textPosition, setTextPosition] = useState<{ x: number, y: number } | null>(null)

    useEffect(() => {
        drawAnnotations()
    }, [annotations, currentTime, containerWidth, containerHeight])

    const drawAnnotations = () => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height)

        // Draw all visible annotations
        annotations.forEach(annotation => {
            if (currentTime >= annotation.startTime && currentTime <= annotation.endTime) {
                drawAnnotation(ctx, annotation)
            }
        })
    }

    const drawAnnotation = (ctx: CanvasRenderingContext2D, annotation: Annotation) => {
        ctx.strokeStyle = annotation.color
        ctx.fillStyle = annotation.color
        ctx.lineWidth = annotation.strokeWidth || 3

        const isSelected = selectedAnnotation === annotation.id
        if (isSelected) {
            ctx.shadowColor = annotation.color
            ctx.shadowBlur = 10
        }

        switch (annotation.type) {
            case 'text':
                ctx.font = `${annotation.fontWeight || 'bold'} ${annotation.fontSize || 24}px Arial`
                ctx.fillStyle = annotation.color
                if (annotation.backgroundColor) {
                    const metrics = ctx.measureText(annotation.content || '')
                    ctx.fillStyle = annotation.backgroundColor
                    ctx.fillRect(
                        annotation.x - 5,
                        annotation.y - (annotation.fontSize || 24) - 5,
                        metrics.width + 10,
                        (annotation.fontSize || 24) + 10
                    )
                    ctx.fillStyle = annotation.color
                }
                ctx.fillText(annotation.content || '', annotation.x, annotation.y)
                break

            case 'arrow':
                if (annotation.endX !== undefined && annotation.endY !== undefined) {
                    drawArrow(ctx, annotation.x, annotation.y, annotation.endX, annotation.endY, annotation.strokeWidth || 3)
                }
                break

            case 'rectangle':
                if (annotation.width && annotation.height) {
                    ctx.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height)
                }
                break

            case 'circle':
                if (annotation.width && annotation.height) {
                    const radiusX = annotation.width / 2
                    const radiusY = annotation.height / 2
                    const centerX = annotation.x + radiusX
                    const centerY = annotation.y + radiusY
                    ctx.beginPath()
                    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI)
                    ctx.stroke()
                }
                break

            case 'line':
                if (annotation.endX !== undefined && annotation.endY !== undefined) {
                    ctx.beginPath()
                    ctx.moveTo(annotation.x, annotation.y)
                    ctx.lineTo(annotation.endX, annotation.endY)
                    ctx.stroke()
                }
                break

            case 'highlight':
                if (annotation.width && annotation.height) {
                    ctx.fillStyle = annotation.backgroundColor || `${annotation.color}40`
                    ctx.fillRect(annotation.x, annotation.y, annotation.width, annotation.height)
                    ctx.strokeStyle = annotation.color
                    ctx.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height)
                }
                break

            case 'freehand':
                if (annotation.points && annotation.points.length > 1) {
                    ctx.beginPath()
                    ctx.moveTo(annotation.points[0].x, annotation.points[0].y)
                    for (let i = 1; i < annotation.points.length; i++) {
                        ctx.lineTo(annotation.points[i].x, annotation.points[i].y)
                    }
                    ctx.stroke()
                }
                break
        }

        ctx.shadowBlur = 0
    }

    const drawArrow = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, width: number) => {
        const headLength = 15
        const angle = Math.atan2(y2 - y1, x2 - x1)

        // Draw line
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()

        // Draw arrowhead
        ctx.beginPath()
        ctx.moveTo(x2, y2)
        ctx.lineTo(
            x2 - headLength * Math.cos(angle - Math.PI / 6),
            y2 - headLength * Math.sin(angle - Math.PI / 6)
        )
        ctx.moveTo(x2, y2)
        ctx.lineTo(
            x2 - headLength * Math.cos(angle + Math.PI / 6),
            y2 - headLength * Math.sin(angle + Math.PI / 6)
        )
        ctx.stroke()
    }

    const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current
        if (!canvas) return { x: 0, y: 0 }

        const rect = canvas.getBoundingClientRect()
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        }
    }

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!selectedTool) return

        const point = getCanvasCoordinates(e)

        if (selectedTool === 'text') {
            setTextPosition(point)
            return
        }

        setIsDrawing(true)
        setStartPoint(point)

        if (selectedTool === 'freehand') {
            setCurrentPoints([point])
        }
    }

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !startPoint) return

        const point = getCanvasCoordinates(e)

        if (selectedTool === 'freehand') {
            setCurrentPoints(prev => [...prev, point])
            
            // Draw preview
            const canvas = canvasRef.current
            if (!canvas) return
            const ctx = canvas.getContext('2d')
            if (!ctx) return

            drawAnnotations()
            ctx.strokeStyle = toolColor
            ctx.lineWidth = strokeWidth
            ctx.beginPath()
            ctx.moveTo(currentPoints[0].x, currentPoints[0].y)
            currentPoints.forEach(p => ctx.lineTo(p.x, p.y))
            ctx.lineTo(point.x, point.y)
            ctx.stroke()
        } else {
            // Draw preview for other tools
            const canvas = canvasRef.current
            if (!canvas) return
            const ctx = canvas.getContext('2d')
            if (!ctx) return

            drawAnnotations()
            ctx.strokeStyle = toolColor
            ctx.lineWidth = strokeWidth

            switch (selectedTool) {
                case 'arrow':
                    drawArrow(ctx, startPoint.x, startPoint.y, point.x, point.y, strokeWidth)
                    break
                case 'rectangle':
                    ctx.strokeRect(startPoint.x, startPoint.y, point.x - startPoint.x, point.y - startPoint.y)
                    break
                case 'circle':
                    const radiusX = Math.abs(point.x - startPoint.x) / 2
                    const radiusY = Math.abs(point.y - startPoint.y) / 2
                    const centerX = startPoint.x + (point.x - startPoint.x) / 2
                    const centerY = startPoint.y + (point.y - startPoint.y) / 2
                    ctx.beginPath()
                    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI)
                    ctx.stroke()
                    break
                case 'line':
                    ctx.beginPath()
                    ctx.moveTo(startPoint.x, startPoint.y)
                    ctx.lineTo(point.x, point.y)
                    ctx.stroke()
                    break
                case 'highlight':
                    ctx.fillStyle = `${toolColor}40`
                    ctx.fillRect(startPoint.x, startPoint.y, point.x - startPoint.x, point.y - startPoint.y)
                    ctx.strokeRect(startPoint.x, startPoint.y, point.x - startPoint.x, point.y - startPoint.y)
                    break
            }
        }
    }

    const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !startPoint || !selectedTool) return

        const point = getCanvasCoordinates(e)

        const newAnnotation: Annotation = {
            id: Date.now().toString(),
            type: selectedTool,
            x: startPoint.x,
            y: startPoint.y,
            color: toolColor,
            strokeWidth: strokeWidth,
            startTime: currentTime,
            endTime: currentTime + 5
        }

        switch (selectedTool) {
            case 'arrow':
            case 'line':
                newAnnotation.endX = point.x
                newAnnotation.endY = point.y
                break
            case 'rectangle':
            case 'circle':
            case 'highlight':
                newAnnotation.width = point.x - startPoint.x
                newAnnotation.height = point.y - startPoint.y
                if (selectedTool === 'highlight') {
                    newAnnotation.backgroundColor = `${toolColor}40`
                }
                break
            case 'freehand':
                newAnnotation.points = [...currentPoints, point]
                break
        }

        onAddAnnotation(newAnnotation)

        setIsDrawing(false)
        setStartPoint(null)
        setCurrentPoints([])
    }

    const handleTextSubmit = () => {
        if (!textPosition || !textInput.trim()) return

        const newAnnotation: Annotation = {
            id: Date.now().toString(),
            type: 'text',
            x: textPosition.x,
            y: textPosition.y,
            content: textInput,
            fontSize: fontSize,
            fontWeight: 'bold',
            color: toolColor,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            startTime: currentTime,
            endTime: currentTime + 5
        }

        onAddAnnotation(newAnnotation)
        setTextInput('')
        setTextPosition(null)
    }

    return (
        <>
            <canvas
                ref={canvasRef}
                width={containerWidth}
                height={containerHeight}
                className="absolute inset-0 pointer-events-auto cursor-crosshair"
                style={{ zIndex: 10 }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
            />

            {/* Text Input Dialog */}
            {textPosition && (
                <div
                    className="absolute bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-xl z-50"
                    style={{
                        left: `${textPosition.x}px`,
                        top: `${textPosition.y}px`
                    }}
                >
                    <input
                        type="text"
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleTextSubmit()
                            if (e.key === 'Escape') setTextPosition(null)
                        }}
                        placeholder="Enter text..."
                        className="bg-gray-700 text-white px-2 py-1 rounded text-sm mb-2 w-48"
                        autoFocus
                    />
                    <div className="flex gap-1">
                        <Button size="sm" onClick={handleTextSubmit} className="text-xs h-6">
                            Add
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setTextPosition(null)} className="text-xs h-6">
                            Cancel
                        </Button>
                    </div>
                </div>
            )}
        </>
    )
}
