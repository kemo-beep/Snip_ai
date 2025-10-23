'use client'

import { forwardRef, memo, useMemo } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface VideoPlayerProps {
    videoUrl: string
    isVideoReady: boolean
    forceReady: boolean
    aspectRatio: string
    borderRadius: number
    onForceReady: () => void
    onLoadStart?: () => void
    onLoadedMetadata?: () => void
    onCanPlay?: () => void
    onError?: (e: React.SyntheticEvent<HTMLVideoElement, Event>) => void
    onMouseEnter?: () => void
    onMouseLeave?: () => void
}

const VideoPlayer = memo(forwardRef<HTMLVideoElement, VideoPlayerProps>(({
    videoUrl,
    isVideoReady,
    forceReady,
    aspectRatio,
    borderRadius,
    onForceReady,
    onLoadStart,
    onLoadedMetadata,
    onCanPlay,
    onError,
    onMouseEnter,
    onMouseLeave
}, ref) => {
    // Memoize the aspect ratio calculation to prevent re-renders
    const aspectRatioValue = useMemo(() => {
        switch (aspectRatio) {
            case '16:9': return '16/9'
            case '4:3': return '4/3'
            case '1:1': return '1/1'
            case '21:9': return '21/9'
            case '9:16': return '9/16'
            default: return '16/9'
        }
    }, [aspectRatio])

    // Memoize the container style to prevent re-renders
    const containerStyle = useMemo(() => ({
        aspectRatio: aspectRatioValue,
        borderRadius: `${borderRadius}px`
    }), [aspectRatioValue, borderRadius])

    return (
        <div
            className="w-full h-full object-cover overflow-hidden"
            style={containerStyle}
        >
            <video
                ref={ref}
                src={videoUrl}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                onLoadStart={onLoadStart}
                onLoadedMetadata={onLoadedMetadata}
                onCanPlay={onCanPlay}
                onError={onError}
                className="w-full h-full object-cover"
            />

            {/* Loading State */}
            {!isVideoReady && !forceReady && (
                <div
                    className="absolute inset-0 bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl flex items-center justify-center z-30"
                    style={{ borderRadius: `${borderRadius}px` }}
                >
                    <div className="text-white text-center">
                        <div className="relative mb-6">
                            <div className="h-20 w-20 mx-auto">
                                <Loader2 className="h-20 w-20 animate-spin text-purple-400" />
                                <div className="absolute inset-0 h-20 w-20 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin"></div>
                            </div>
                            <div className="absolute inset-0 h-20 w-20 mx-auto border-4 border-blue-400/20 border-t-blue-400 rounded-full animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
                        </div>
                        <p className="text-lg font-semibold mb-2 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                            Loading video...
                        </p>
                        <p className="text-sm text-gray-400 mb-6">Preparing your content for editing</p>
                        <div className="flex gap-3 justify-center">
                            <Button
                                onClick={onForceReady}
                                className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-purple-500/50 transition-all duration-200"
                                size="sm"
                            >
                                Skip Loading
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}))

VideoPlayer.displayName = 'VideoPlayer'

export default VideoPlayer