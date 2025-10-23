'use client'

import { useState, useMemo, useCallback } from 'react'
import VideoPlayer from './VideoPlayer'
import WebcamOverlay from './WebcamOverlay'
import VideoAnnotation from './VideoAnnotation'
import { Annotation } from './VideoAnnotation'
import { WebcamOverlayPosition, WebcamOverlaySize, WebcamSettings } from '@/hooks/useWebcamOverlay'

interface VideoContainerProps {
    videoUrl: string
    webcamVideoUrl: string | null
    webcamOverlayPosition: WebcamOverlayPosition
    webcamOverlaySize: WebcamOverlaySize
    webcamSettings: WebcamSettings
    isVideoReady: boolean
    forceReady: boolean
    currentTime: number
    aspectRatio: string
    backgroundSettings: {
        padding: number
        borderRadius: number
    }
    annotations: Annotation[]
    selectedAnnotation: string | null
    selectedAnnotationTool: Annotation['type'] | null
    annotationColor: string
    annotationStrokeWidth: number
    annotationFontSize: number
    onForceReady: () => void
    onWebcamMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void
    onWebcamResizeMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void
    onAddAnnotation: (annotation: Annotation) => void
    onUpdateAnnotation: (id: string, updates: Partial<Annotation>) => void
    onRemoveAnnotation: (id: string) => void
    onAnnotationMouseDown: (e: React.MouseEvent<HTMLDivElement>, annotationId: string) => void
    onAnnotationResize: (e: React.MouseEvent<HTMLDivElement>, annotationId: string) => void
    videoRef: React.RefObject<HTMLVideoElement | null>
    webcamVideoRef: React.RefObject<HTMLVideoElement | null>
}

export default function VideoContainer({
    videoUrl,
    webcamVideoUrl,
    webcamOverlayPosition,
    webcamOverlaySize,
    webcamSettings,
    isVideoReady,
    forceReady,
    currentTime,
    aspectRatio,
    backgroundSettings,
    annotations,
    selectedAnnotation,
    selectedAnnotationTool,
    annotationColor,
    annotationStrokeWidth,
    annotationFontSize,
    onForceReady,
    onWebcamMouseDown,
    onWebcamResizeMouseDown,
    onAddAnnotation,
    onUpdateAnnotation,
    onRemoveAnnotation,
    onAnnotationMouseDown,
    onAnnotationResize,
    videoRef,
    webcamVideoRef
}: VideoContainerProps) {
    const [isDragging, setIsDragging] = useState(false)

    // Memoize visible annotations to prevent unnecessary re-renders
    const visibleAnnotations = useMemo(() => {
        return annotations.filter(annotation =>
            currentTime >= annotation.startTime && currentTime <= annotation.endTime
        )
    }, [annotations, currentTime])

    // Memoize video dimensions to prevent re-renders
    const videoDimensions = useMemo(() => {
        if (videoRef.current) {
            return {
                width: videoRef.current.videoWidth || 1920,
                height: videoRef.current.videoHeight || 1080
            }
        }
        return { width: 1920, height: 1080 }
    }, [videoRef.current?.videoWidth, videoRef.current?.videoHeight])

    // Memoize mouse event handlers to prevent re-renders
    const handleMouseEnter = useCallback(() => {
        setIsDragging(true)
    }, [])

    const handleMouseLeave = useCallback(() => {
        setIsDragging(false)
    }, [])

    // Memoize container style to prevent re-renders
    const containerStyle = useMemo(() => ({
        padding: backgroundSettings.padding > 0 ? `${backgroundSettings.padding}%` : '0'
    }), [backgroundSettings.padding])

    return (
        <div
            className="w-full h-full relative"
            style={containerStyle}
        >
            <VideoPlayer
                ref={videoRef}
                videoUrl={videoUrl}
                isVideoReady={isVideoReady}
                forceReady={forceReady}
                aspectRatio={aspectRatio}
                borderRadius={backgroundSettings.borderRadius}
                onForceReady={onForceReady}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            />

            <WebcamOverlay
                ref={webcamVideoRef}
                webcamVideoUrl={webcamVideoUrl}
                webcamOverlayPosition={webcamOverlayPosition}
                webcamOverlaySize={webcamOverlaySize}
                webcamSettings={webcamSettings}
                onMouseDown={onWebcamMouseDown}
                onResizeMouseDown={onWebcamResizeMouseDown}
                videoRef={videoRef}
            />

            {/* Video Annotation Layer */}
            {videoRef.current && (
                <VideoAnnotation
                    videoRef={videoRef}
                    currentTime={currentTime}
                    annotations={annotations}
                    onAddAnnotation={onAddAnnotation}
                    onUpdateAnnotation={onUpdateAnnotation}
                    onRemoveAnnotation={onRemoveAnnotation}
                    selectedTool={selectedAnnotationTool}
                    toolColor={annotationColor}
                    strokeWidth={annotationStrokeWidth}
                    fontSize={annotationFontSize}
                    containerWidth={videoDimensions.width}
                    containerHeight={videoDimensions.height}
                />
            )}

            {/* Annotations Rendering */}
            {visibleAnnotations.map(annotation => {
                const isSelected = selectedAnnotation === annotation.id

                // Text annotation
                if (annotation.type === 'text') {
                    return (
                        <div
                            key={annotation.id}
                            className={`absolute cursor-move transition-all duration-200 group ${isSelected ? 'ring-2 ring-purple-500 scale-105 z-30' : 'hover:scale-105 z-20'
                                }`}
                            style={{
                                left: `${annotation.x}%`,
                                top: `${annotation.y}%`,
                                width: annotation.width ? `${annotation.width}px` : 'auto',
                                minWidth: '100px'
                            }}
                            onMouseDown={(e) => onAnnotationMouseDown(e, annotation.id)}
                        >
                            <div
                                className="px-3 py-2 rounded-lg backdrop-blur-sm border-2 shadow-lg"
                                style={{
                                    color: annotation.color,
                                    fontSize: `${annotation.fontSize || 24}px`,
                                    fontWeight: annotation.fontWeight || 'bold',
                                    backgroundColor: annotation.backgroundColor || 'rgba(0, 0, 0, 0.5)',
                                    borderColor: isSelected ? annotation.color : 'transparent'
                                }}
                            >
                                {annotation.content}
                            </div>
                            {isSelected && (
                                <>
                                    <div
                                        className="absolute bottom-0 right-0 w-4 h-4 bg-purple-500 rounded-full cursor-se-resize"
                                        onMouseDown={(e) => onAnnotationResize(e, annotation.id)}
                                    />
                                    <button
                                        className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full text-xs bg-red-500 text-white hover:bg-red-600"
                                        onClick={() => onRemoveAnnotation(annotation.id)}
                                    >
                                        ×
                                    </button>
                                </>
                            )}
                        </div>
                    )
                }

                // Arrow annotation
                if (annotation.type === 'arrow') {
                    return (
                        <svg
                            key={annotation.id}
                            className={`absolute pointer-events-none ${isSelected ? 'z-30' : 'z-20'}`}
                            style={{
                                left: `${annotation.x}%`,
                                top: `${annotation.y}%`,
                                width: '100px',
                                height: '100px'
                            }}
                        >
                            <defs>
                                <marker
                                    id={`arrowhead-${annotation.id}`}
                                    markerWidth="10"
                                    markerHeight="10"
                                    refX="9"
                                    refY="3"
                                    orient="auto"
                                >
                                    <polygon
                                        points="0 0, 10 3, 0 6"
                                        fill={annotation.color}
                                    />
                                </marker>
                            </defs>
                            <line
                                x1="10"
                                y1="10"
                                x2="90"
                                y2="90"
                                stroke={annotation.color}
                                strokeWidth={annotation.strokeWidth || 3}
                                markerEnd={`url(#arrowhead-${annotation.id})`}
                            />
                        </svg>
                    )
                }

                // Rectangle annotation
                if (annotation.type === 'rectangle') {
                    return (
                        <div
                            key={annotation.id}
                            className={`absolute cursor-move transition-all duration-200 group ${isSelected ? 'ring-2 ring-purple-500 scale-105 z-30' : 'hover:scale-105 z-20'
                                }`}
                            style={{
                                left: `${annotation.x}%`,
                                top: `${annotation.y}%`,
                                width: `${annotation.width || 200}px`,
                                height: `${annotation.height || 100}px`,
                                border: `${annotation.strokeWidth || 3}px solid ${annotation.color}`,
                                borderRadius: '8px',
                                backgroundColor: 'transparent'
                            }}
                            onMouseDown={(e) => onAnnotationMouseDown(e, annotation.id)}
                        >
                            {isSelected && (
                                <>
                                    <div
                                        className="absolute bottom-0 right-0 w-4 h-4 bg-purple-500 rounded-full cursor-se-resize"
                                        onMouseDown={(e) => onAnnotationResize(e, annotation.id)}
                                    />
                                    <button
                                        className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full text-xs bg-red-500 text-white hover:bg-red-600"
                                        onClick={() => onRemoveAnnotation(annotation.id)}
                                    >
                                        ×
                                    </button>
                                </>
                            )}
                        </div>
                    )
                }

                // Circle annotation
                if (annotation.type === 'circle') {
                    const size = Math.min(annotation.width || 150, annotation.height || 150)
                    return (
                        <div
                            key={annotation.id}
                            className={`absolute cursor-move transition-all duration-200 group ${isSelected ? 'ring-2 ring-purple-500 scale-105 z-30' : 'hover:scale-105 z-20'
                                }`}
                            style={{
                                left: `${annotation.x}%`,
                                top: `${annotation.y}%`,
                                width: `${size}px`,
                                height: `${size}px`,
                                border: `${annotation.strokeWidth || 3}px solid ${annotation.color}`,
                                borderRadius: '50%',
                                backgroundColor: 'transparent'
                            }}
                            onMouseDown={(e) => onAnnotationMouseDown(e, annotation.id)}
                        >
                            {isSelected && (
                                <>
                                    <div
                                        className="absolute bottom-0 right-0 w-4 h-4 bg-purple-500 rounded-full cursor-se-resize"
                                        onMouseDown={(e) => onAnnotationResize(e, annotation.id)}
                                    />
                                    <button
                                        className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full text-xs bg-red-500 text-white hover:bg-red-600"
                                        onClick={() => onRemoveAnnotation(annotation.id)}
                                    >
                                        ×
                                    </button>
                                </>
                            )}
                        </div>
                    )
                }

                // Line annotation
                if (annotation.type === 'line') {
                    return (
                        <svg
                            key={annotation.id}
                            className={`absolute pointer-events-none ${isSelected ? 'z-30' : 'z-20'}`}
                            style={{
                                left: `${annotation.x}%`,
                                top: `${annotation.y}%`,
                                width: '150px',
                                height: '5px'
                            }}
                        >
                            <line
                                x1="0"
                                y1="2"
                                x2="150"
                                y2="2"
                                stroke={annotation.color}
                                strokeWidth={annotation.strokeWidth || 3}
                            />
                        </svg>
                    )
                }

                // Highlight annotation
                if (annotation.type === 'highlight') {
                    return (
                        <div
                            key={annotation.id}
                            className={`absolute cursor-move transition-all duration-200 group ${isSelected ? 'ring-2 ring-purple-500 scale-105 z-30' : 'hover:scale-105 z-20'
                                }`}
                            style={{
                                left: `${annotation.x}%`,
                                top: `${annotation.y}%`,
                                width: `${annotation.width || 200}px`,
                                height: `${annotation.height || 100}px`,
                                backgroundColor: annotation.backgroundColor || `${annotation.color}40`,
                                borderRadius: '8px',
                                border: `2px solid ${annotation.color}`
                            }}
                            onMouseDown={(e) => onAnnotationMouseDown(e, annotation.id)}
                        >
                            {isSelected && (
                                <>
                                    <div
                                        className="absolute bottom-0 right-0 w-4 h-4 bg-purple-500 rounded-full cursor-se-resize"
                                        onMouseDown={(e) => onAnnotationResize(e, annotation.id)}
                                    />
                                    <button
                                        className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full text-xs bg-red-500 text-white hover:bg-red-600"
                                        onClick={() => onRemoveAnnotation(annotation.id)}
                                    >
                                        ×
                                    </button>
                                </>
                            )}
                        </div>
                    )
                }

                return null
            })}
        </div>
    )
}
