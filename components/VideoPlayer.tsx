'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Copy, Check, Share2, Download, Video, Edit3 } from 'lucide-react'
import { toast } from 'sonner'

interface VideoPlayerProps {
    videoUrl: string
    shareableLink?: string
    transcript?: string
    title?: string
    onRecordAgain?: () => void
    onEditVideo?: () => void
}

export default function VideoPlayer({
    videoUrl,
    shareableLink,
    transcript,
    title = "Recorded Video",
    onRecordAgain,
    onEditVideo
}: VideoPlayerProps) {
    const [isCopied, setIsCopied] = useState(false)
    const [showTranscript, setShowTranscript] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)

    const copyToClipboard = async () => {
        if (shareableLink) {
            try {
                await navigator.clipboard.writeText(shareableLink)
                setIsCopied(true)
                toast.success('Link copied to clipboard!')
                setTimeout(() => setIsCopied(false), 2000)
            } catch (error) {
                toast.error('Failed to copy link')
            }
        }
    }

    const downloadVideo = () => {
        const link = document.createElement('a')
        link.href = videoUrl
        link.download = `${title}.webm`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const shareVideo = async () => {
        if (navigator.share && shareableLink) {
            try {
                await navigator.share({
                    title: title,
                    text: 'Check out this video I recorded',
                    url: shareableLink,
                })
            } catch (error) {
                // Fallback to clipboard
                copyToClipboard()
            }
        } else {
            copyToClipboard()
        }
    }

    return (
        <Card className="w-full max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>{title}</span>
                    <div className="flex gap-2">
                        {shareableLink && (
                            <Button
                                onClick={copyToClipboard}
                                variant="outline"
                                size="sm"
                                className="gap-2"
                            >
                                {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                {isCopied ? 'Copied!' : 'Copy Link'}
                            </Button>
                        )}
                        <Button
                            onClick={shareVideo}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                        >
                            <Share2 className="h-4 w-4" />
                            Share
                        </Button>
                        <Button
                            onClick={downloadVideo}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                        >
                            <Download className="h-4 w-4" />
                            Download
                        </Button>
                        {onEditVideo && (
                            <Button
                                onClick={onEditVideo}
                                variant="default"
                                size="sm"
                                className="gap-2 bg-blue-600 hover:bg-blue-700"
                            >
                                <Edit3 className="h-4 w-4" />
                                Edit Video
                            </Button>
                        )}
                        {onRecordAgain && (
                            <Button
                                onClick={onRecordAgain}
                                variant="outline"
                                size="sm"
                                className="gap-2"
                            >
                                <Video className="h-4 w-4" />
                                Record Again
                            </Button>
                        )}
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <video
                    ref={videoRef}
                    src={videoUrl}
                    controls
                    className="w-full rounded-lg"
                    style={{ maxHeight: '500px' }}
                />

                {shareableLink && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            Shareable Link:
                        </p>
                        <p className="text-sm font-mono break-all text-blue-600 dark:text-blue-400">
                            {shareableLink}
                        </p>
                    </div>
                )}

                {transcript && (
                    <div className="space-y-2">
                        <Button
                            onClick={() => setShowTranscript(!showTranscript)}
                            variant="outline"
                            size="sm"
                            className="w-full"
                        >
                            {showTranscript ? 'Hide' : 'Show'} Transcript
                        </Button>

                        {showTranscript && (
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <h4 className="font-semibold mb-2">Video Transcript:</h4>
                                <p className="text-sm whitespace-pre-wrap">{transcript}</p>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
