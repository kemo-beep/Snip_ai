'use client'

import { forwardRef, memo } from 'react'
import { WebcamOverlayPosition, WebcamOverlaySize, WebcamSettings } from '@/hooks/useWebcamOverlay'

interface WebcamOverlayProps {
    webcamVideoUrl: string | null
    webcamOverlayPosition: WebcamOverlayPosition
    webcamOverlaySize: WebcamOverlaySize
    webcamSettings: WebcamSettings
    onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void
    onResizeMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void
    videoRef: React.RefObject<HTMLVideoElement>
}

const WebcamOverlay = memo(forwardRef<HTMLVideoElement, WebcamOverlayProps>(({
    webcamVideoUrl,
    webcamOverlayPosition,
    webcamOverlaySize,
    webcamSettings,
    onMouseDown,
    onResizeMouseDown,
    videoRef
}, ref) => {
    if (!webcamVideoUrl || !webcamSettings.visible) {
        return null
    }

    return (
        <div
            className="absolute bg-black overflow-hidden transition-all duration-300 hover:scale-105 group"
            style={{
                left: `${webcamOverlayPosition.x}%`,
                top: `${webcamOverlayPosition.y}%`,
                width: webcamSettings.shape === 'square' ? `${Math.min(webcamOverlaySize.width, webcamOverlaySize.height)}px` : `${webcamOverlaySize.width}px`,
                height: webcamSettings.shape === 'square' ? `${Math.min(webcamOverlaySize.width, webcamOverlaySize.height)}px` : `${webcamOverlaySize.height}px`,
                cursor: 'move',
                zIndex: 15,
                borderRadius: webcamSettings.shape === 'circle' ? '50%' : '12px',
                border: `${webcamSettings.borderWidth}px solid ${webcamSettings.borderColor}`,
                boxShadow: webcamSettings.shadowIntensity > 0
                    ? `0 ${Math.round(webcamSettings.shadowIntensity * 0.3)}px ${Math.round(webcamSettings.shadowIntensity * 0.8)}px ${Math.round(webcamSettings.shadowIntensity * 0.2)}px rgba(0, 0, 0, ${Math.min(webcamSettings.shadowIntensity / 100 * 0.5, 0.5)})`
                    : '0 4px 12px rgba(0, 0, 0, 0.3)'
            }}
            onMouseDown={onMouseDown}
        >
            <video
                ref={ref}
                src={webcamVideoUrl}
                className="w-full h-full object-cover"
                muted
                onTimeUpdate={() => {
                    if (videoRef.current && ref && 'current' in ref && ref.current) {
                        const timeDiff = Math.abs(videoRef.current.currentTime - ref.current.currentTime)
                        if (timeDiff > 0.1) {
                            ref.current.currentTime = videoRef.current.currentTime
                        }
                    }
                }}
            />

            {/* Resize Handle */}
            <div
                className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize hover:scale-110 transition-all duration-200 opacity-0 group-hover:opacity-100"
                style={{
                    backgroundColor: webcamSettings.borderColor,
                    borderRadius: webcamSettings.shape === 'circle' ? '50%' : '0 0 12px 0'
                }}
                onMouseDown={onResizeMouseDown}
            >
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 border-r-2 border-b-2 border-white/80"></div>
                </div>
            </div>

            {/* Label */}
            <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-md border border-white/20 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <span className="font-medium">Webcam</span>
            </div>

            {/* Corner Indicators */}
            <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 opacity-0 group-hover:opacity-60 transition-opacity duration-200" style={{ borderColor: webcamSettings.borderColor }}></div>
            <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 opacity-0 group-hover:opacity-60 transition-opacity duration-200" style={{ borderColor: webcamSettings.borderColor }}></div>
            <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 opacity-0 group-hover:opacity-60 transition-opacity duration-200" style={{ borderColor: webcamSettings.borderColor }}></div>
        </div>
    )
}))

WebcamOverlay.displayName = 'WebcamOverlay'

export default WebcamOverlay
