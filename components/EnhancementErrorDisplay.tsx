/**
 * EnhancementErrorDisplay - User-facing error display component
 * Shows error messages, suggestions, and recovery options
 * Requirements: 6.6, 8.6
 */

import React from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    AlertTriangle,
    RefreshCw,
    SkipForward,
    Settings,
    HelpCircle,
    X,
    CheckCircle
} from 'lucide-react'
import type { EnhancementError, ErrorRecoveryStrategy } from '@/lib/videoEnhancement'

interface EnhancementErrorDisplayProps {
    error: EnhancementError | null
    isRecovering?: boolean
    onRetry?: () => void
    onSkip?: () => void
    onReduceQuality?: () => void
    onDismiss?: () => void
    onShowDetails?: () => void
}

export default function EnhancementErrorDisplay({
    error,
    isRecovering = false,
    onRetry,
    onSkip,
    onReduceQuality,
    onDismiss,
    onShowDetails
}: EnhancementErrorDisplayProps) {
    if (!error) return null

    const getErrorIcon = (code: string) => {
        if (code.includes('GPU') || code.includes('WEBGL')) {
            return <Settings className="h-4 w-4" />
        }
        if (code.includes('MEMORY') || code.includes('TIMEOUT')) {
            return <RefreshCw className="h-4 w-4" />
        }
        if (code.includes('FORMAT') || code.includes('CODEC')) {
            return <SkipForward className="h-4 w-4" />
        }
        return <AlertTriangle className="h-4 w-4" />
    }

    const getErrorSeverity = (code: string): 'error' | 'warning' | 'info' => {
        if (code.includes('NOT_SUPPORTED') || code.includes('SECURITY')) {
            return 'error'
        }
        if (code.includes('MEMORY') || code.includes('TIMEOUT')) {
            return 'warning'
        }
        return 'info'
    }

    const getRecoveryActions = () => {
        const actions: JSX.Element[] = []

        if (error.recoveryStrategy === ErrorRecoveryStrategy.RETRY && onRetry) {
            actions.push(
                <Button
                    key="retry"
                    variant="default"
                    size="sm"
                    onClick={onRetry}
                    disabled={isRecovering}
                    className="mr-2"
                >
                    <RefreshCw className={`h-4 w-4 mr-1 ${isRecovering ? 'animate-spin' : ''}`} />
                    Try Again
                </Button>
            )
        }

        if (error.recoveryStrategy === ErrorRecoveryStrategy.SKIP_ENHANCEMENT && onSkip) {
            actions.push(
                <Button
                    key="skip"
                    variant="outline"
                    size="sm"
                    onClick={onSkip}
                    className="mr-2"
                >
                    <SkipForward className="h-4 w-4 mr-1" />
                    Skip Enhancement
                </Button>
            )
        }

        if (error.recoveryStrategy === ErrorRecoveryStrategy.REDUCE_QUALITY && onReduceQuality) {
            actions.push(
                <Button
                    key="reduce"
                    variant="outline"
                    size="sm"
                    onClick={onReduceQuality}
                    className="mr-2"
                >
                    <Settings className="h-4 w-4 mr-1" />
                    Reduce Quality
                </Button>
            )
        }

        if (onDismiss) {
            actions.push(
                <Button
                    key="dismiss"
                    variant="ghost"
                    size="sm"
                    onClick={onDismiss}
                >
                    <X className="h-4 w-4" />
                </Button>
            )
        }

        return actions
    }

    const severity = getErrorSeverity(error.code)
    const isRecoverable = error.recoverable

    return (
        <Card className="w-full border-l-4 border-l-red-500">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        {getErrorIcon(error.code)}
                        <CardTitle className="text-sm font-medium">
                            Enhancement Error
                        </CardTitle>
                        <Badge variant={severity === 'error' ? 'destructive' : severity === 'warning' ? 'secondary' : 'default'}>
                            {error.code.replace(/_/g, ' ')}
                        </Badge>
                    </div>
                    {isRecovering && (
                        <div className="flex items-center text-sm text-blue-600">
                            <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                            Recovering...
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Error Message */}
                <Alert variant={severity === 'error' ? 'destructive' : 'default'}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="text-sm font-medium">
                        {error.userMessage}
                    </AlertTitle>
                    <AlertDescription className="text-sm mt-1">
                        {error.suggestion}
                    </AlertDescription>
                </Alert>

                {/* Recovery Status */}
                {isRecoverable && (
                    <div className="flex items-center text-sm text-green-600">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        This error can be automatically recovered
                    </div>
                )}

                {/* Context Information */}
                {error.context && Object.keys(error.context).length > 0 && (
                    <div className="text-xs text-gray-500">
                        <details>
                            <summary className="cursor-pointer hover:text-gray-700">
                                Technical Details
                            </summary>
                            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                                {JSON.stringify(error.context, null, 2)}
                            </pre>
                        </details>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        {getRecoveryActions()}
                    </div>

                    {onShowDetails && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onShowDetails}
                        >
                            <HelpCircle className="h-4 w-4 mr-1" />
                            Help
                        </Button>
                    )}
                </div>

                {/* Recovery Strategy Info */}
                {error.recoveryStrategy !== ErrorRecoveryStrategy.NONE && (
                    <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                        <strong>Recovery Strategy:</strong> {error.recoveryStrategy.replace(/_/g, ' ').toLowerCase()}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

/**
 * Error recovery dialog component
 */
interface ErrorRecoveryDialogProps {
    error: EnhancementError
    isOpen: boolean
    onClose: () => void
    onConfirm: (strategy: ErrorRecoveryStrategy) => void
}

export function ErrorRecoveryDialog({
    error,
    isOpen,
    onClose,
    onConfirm
}: ErrorRecoveryDialogProps) {
    if (!isOpen) return null

    const getStrategyDescription = (strategy: ErrorRecoveryStrategy): string => {
        switch (strategy) {
            case ErrorRecoveryStrategy.RETRY:
                return 'Try the same operation again with the same settings.'
            case ErrorRecoveryStrategy.FALLBACK_TO_CPU:
                return 'Switch to CPU processing instead of GPU acceleration.'
            case ErrorRecoveryStrategy.REDUCE_QUALITY:
                return 'Reduce processing quality to use less memory and resources.'
            case ErrorRecoveryStrategy.CHUNK_PROCESSING:
                return 'Process the video in smaller chunks to reduce memory usage.'
            case ErrorRecoveryStrategy.SKIP_ENHANCEMENT:
                return 'Skip this enhancement and continue with the original video.'
            case ErrorRecoveryStrategy.USER_INTERVENTION:
                return 'Manual intervention required. Please check your settings.'
            default:
                return 'No automatic recovery available.'
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4">
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
                        Error Recovery
                    </CardTitle>
                    <CardDescription>
                        Choose how to handle this error
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <h4 className="font-medium text-sm">Error:</h4>
                        <p className="text-sm text-gray-600">{error.userMessage}</p>
                    </div>

                    <div className="space-y-2">
                        <h4 className="font-medium text-sm">Suggested Recovery:</h4>
                        <p className="text-sm text-gray-600">
                            {getStrategyDescription(error.recoveryStrategy)}
                        </p>
                    </div>

                    <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => onConfirm(error.recoveryStrategy)}
                            disabled={error.recoveryStrategy === ErrorRecoveryStrategy.NONE}
                        >
                            Apply Recovery
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
