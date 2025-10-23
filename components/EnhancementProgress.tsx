'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
    Loader2,
    X,
    CheckCircle,
    AlertCircle,
    Clock,
    Zap,
    Camera,
    Volume2,
    Palette,
    Shield,
    RotateCcw
} from 'lucide-react'

interface ProcessingStep {
    id: string
    name: string
    status: 'pending' | 'processing' | 'completed' | 'error'
    progress: number
    estimatedTime?: number
    icon?: React.ComponentType<{ className?: string }>
}

interface EnhancementProgressProps {
    isVisible: boolean
    progress: number // 0-100
    currentStep?: string
    steps?: ProcessingStep[]
    estimatedTimeRemaining?: number // seconds
    framesProcessed?: number
    totalFrames?: number
    currentFPS?: number
    onCancel?: () => void
    onRetry?: () => void
    error?: string | null
    className?: string
}

export default function EnhancementProgress({
    isVisible,
    progress,
    currentStep,
    steps = [],
    estimatedTimeRemaining,
    framesProcessed = 0,
    totalFrames = 0,
    currentFPS = 0,
    onCancel,
    onRetry,
    error = null,
    className = ''
}: EnhancementProgressProps) {
    const [timeElapsed, setTimeElapsed] = useState(0)
    const [startTime, setStartTime] = useState<number | null>(null)

    // Track elapsed time
    useEffect(() => {
        if (isVisible && progress > 0 && startTime === null) {
            setStartTime(Date.now())
        }

        if (isVisible && startTime) {
            const interval = setInterval(() => {
                setTimeElapsed(Math.floor((Date.now() - startTime) / 1000))
            }, 1000)

            return () => clearInterval(interval)
        }
    }, [isVisible, progress, startTime])

    // Reset when progress starts
    useEffect(() => {
        if (progress === 0) {
            setTimeElapsed(0)
            setStartTime(null)
        }
    }, [progress])

    // Format time
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    // Get step status
    const getStepStatus = (step: ProcessingStep) => {
        if (step.status === 'error') return 'error'
        if (step.status === 'completed') return 'completed'
        if (step.status === 'processing') return 'processing'
        return 'pending'
    }

    // Get step icon
    const getStepIcon = (step: ProcessingStep) => {
        const iconClass = "h-4 w-4"

        switch (step.status) {
            case 'completed':
                return <CheckCircle className={`${iconClass} text-green-500`} />
            case 'error':
                return <AlertCircle className={`${iconClass} text-red-500`} />
            case 'processing':
                return <Loader2 className={`${iconClass} text-blue-500 animate-spin`} />
            default:
                return step.icon ? <step.icon className={`${iconClass} text-gray-400`} /> : null
        }
    }

    // Default processing steps if none provided
    const defaultSteps: ProcessingStep[] = [
        {
            id: 'analysis',
            name: 'Analyzing Video',
            status: progress < 20 ? 'processing' : 'completed',
            progress: Math.min(100, (progress / 20) * 100),
            icon: Camera
        },
        {
            id: 'color',
            name: 'Color Enhancement',
            status: progress < 20 ? 'pending' : progress < 60 ? 'processing' : 'completed',
            progress: progress < 20 ? 0 : Math.min(100, ((progress - 20) / 40) * 100),
            icon: Palette
        },
        {
            id: 'audio',
            name: 'Audio Processing',
            status: progress < 40 ? 'pending' : progress < 80 ? 'processing' : 'completed',
            progress: progress < 40 ? 0 : Math.min(100, ((progress - 40) / 40) * 100),
            icon: Volume2
        },
        {
            id: 'stabilization',
            name: 'Stabilization',
            status: progress < 60 ? 'pending' : progress < 90 ? 'processing' : 'completed',
            progress: progress < 60 ? 0 : Math.min(100, ((progress - 60) / 30) * 100),
            icon: Shield
        },
        {
            id: 'finalization',
            name: 'Finalizing',
            status: progress < 90 ? 'pending' : 'processing',
            progress: progress < 90 ? 0 : Math.min(100, ((progress - 90) / 10) * 100),
            icon: Zap
        }
    ]

    const processingSteps = steps.length > 0 ? steps : defaultSteps

    if (!isVisible) return null

    return (
        <Card className={`${className} ${error ? 'border-red-200 dark:border-red-800' : ''}`}>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                        <CardTitle className="text-sm">
                            {error ? 'Enhancement Failed' : 'Enhancing Video'}
                        </CardTitle>
                    </div>
                    {onCancel && !error && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onCancel}
                            className="text-xs"
                        >
                            <X className="h-3 w-3 mr-1" />
                            Cancel
                        </Button>
                    )}
                </div>
                <CardDescription className="text-xs">
                    {error ? 'An error occurred during processing' : 'Please wait while we enhance your video...'}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Error State */}
                {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                        <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm font-medium text-red-700 dark:text-red-300">
                                    Processing Error
                                </p>
                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                    {error}
                                </p>
                            </div>
                        </div>
                        {onRetry && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onRetry}
                                className="mt-3 text-xs"
                            >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Try Again
                            </Button>
                        )}
                    </div>
                )}

                {/* Progress Bar */}
                {!error && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                            <span>Progress</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>
                )}

                {/* Current Step */}
                {currentStep && !error && (
                    <div className="flex items-center gap-2 text-sm">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                        <span className="text-muted-foreground">Current step:</span>
                        <span className="font-medium">{currentStep}</span>
                    </div>
                )}

                {/* Processing Steps */}
                {!error && (
                    <div className="space-y-2">
                        <h4 className="text-xs font-medium text-muted-foreground">Processing Steps</h4>
                        <div className="space-y-1">
                            {processingSteps.map((step, index) => (
                                <div key={step.id} className="flex items-center gap-2 text-xs">
                                    {getStepIcon(step)}
                                    <span className="flex-1">{step.name}</span>
                                    <div className="flex items-center gap-2">
                                        {step.status === 'processing' && (
                                            <div className="w-16 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-500 transition-all duration-300"
                                                    style={{ width: `${step.progress}%` }}
                                                />
                                            </div>
                                        )}
                                        <Badge
                                            variant={getStepStatus(step) === 'completed' ? 'default' :
                                                getStepStatus(step) === 'error' ? 'destructive' : 'secondary'}
                                            className="text-xs"
                                        >
                                            {step.status === 'completed' ? 'Done' :
                                                step.status === 'error' ? 'Error' :
                                                    step.status === 'processing' ? 'Working' : 'Pending'}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <Separator />

                {/* Processing Stats */}
                {!error && (
                    <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Time Elapsed:</span>
                                <span className="font-medium">{formatTime(timeElapsed)}</span>
                            </div>
                            {estimatedTimeRemaining && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Time Remaining:</span>
                                    <span className="font-medium">{formatTime(estimatedTimeRemaining)}</span>
                                </div>
                            )}
                        </div>
                        <div className="space-y-1">
                            {totalFrames > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Frames:</span>
                                    <span className="font-medium">
                                        {framesProcessed.toLocaleString()} / {totalFrames.toLocaleString()}
                                    </span>
                                </div>
                            )}
                            {currentFPS > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Speed:</span>
                                    <span className="font-medium">{currentFPS.toFixed(1)} FPS</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Performance Indicator */}
                {!error && currentFPS > 0 && (
                    <div className="flex items-center gap-2 text-xs">
                        <div className={`w-2 h-2 rounded-full ${currentFPS > 30 ? 'bg-green-500' :
                                currentFPS > 15 ? 'bg-yellow-500' : 'bg-red-500'
                            }`} />
                        <span className="text-muted-foreground">
                            Processing at {currentFPS.toFixed(1)} FPS
                            {currentFPS > 30 ? ' (Fast)' :
                                currentFPS > 15 ? ' (Normal)' : ' (Slow)'}
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
