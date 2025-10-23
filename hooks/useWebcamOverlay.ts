import { useState, useRef, useCallback } from 'react'

export interface WebcamOverlayPosition {
    x: number
    y: number
}

export interface WebcamOverlaySize {
    width: number
    height: number
}

export interface WebcamSettings {
    visible: boolean
    shape: 'rectangle' | 'square' | 'circle'
    shadowIntensity: number
    borderWidth: number
    borderColor: string
}

export const useWebcamOverlay = (webcamUrl?: string) => {
    const webcamVideoRef = useRef<HTMLVideoElement>(null)
    const [webcamVideoUrl, setWebcamVideoUrl] = useState<string | null>(webcamUrl || null)
    const [webcamOverlayPosition, setWebcamOverlayPosition] = useState<WebcamOverlayPosition>({ x: 2, y: 2 })
    const [webcamOverlaySize, setWebcamOverlaySize] = useState<WebcamOverlaySize>({ width: 100, height: 100 })
    const [webcamSettings, setWebcamSettings] = useState<WebcamSettings>({
        visible: true,
        shape: 'rectangle',
        shadowIntensity: 0,
        borderWidth: 2,
        borderColor: '#3b82f6'
    })

    const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault()
        const startX = e.clientX
        const startY = e.clientY
        const startLeft = webcamOverlayPosition.x
        const startTop = webcamOverlayPosition.y

        const handleMouseMove = (e: MouseEvent) => {
            const newX = startLeft + e.clientX - startX
            const newY = startTop + e.clientY - startY
            setWebcamOverlayPosition({ x: newX, y: newY })
        }

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
    }, [webcamOverlayPosition])

    const handleResizeMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        const startX = e.clientX
        const startY = e.clientY
        const startWidth = webcamOverlaySize.width
        const startHeight = webcamOverlaySize.height

        const handleMouseMove = (e: MouseEvent) => {
            const newWidth = startWidth + e.clientX - startX
            const newHeight = startHeight + e.clientY - startY
            setWebcamOverlaySize({ width: newWidth, height: newHeight })
        }

        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleMouseUp)
        }

        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
    }, [webcamOverlaySize])

    return {
        webcamVideoRef,
        webcamVideoUrl,
        setWebcamVideoUrl,
        webcamOverlayPosition,
        setWebcamOverlayPosition,
        webcamOverlaySize,
        setWebcamOverlaySize,
        webcamSettings,
        setWebcamSettings,
        handleMouseDown,
        handleResizeMouseDown
    }
}
