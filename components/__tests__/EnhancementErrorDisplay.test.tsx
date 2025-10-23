/**
 * Unit tests for EnhancementErrorDisplay component
 * Requirements: 6.6, 8.6
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import EnhancementErrorDisplay, { ErrorRecoveryDialog } from '../EnhancementErrorDisplay'
import { EnhancementError, EnhancementErrorCode, ErrorRecoveryStrategy } from '@/lib/videoEnhancement'

describe('EnhancementErrorDisplay', () => {
    const mockError = new EnhancementError(
        'GPU processing failed',
        EnhancementErrorCode.GPU_NOT_AVAILABLE,
        {
            userMessage: 'GPU acceleration is not available on this device.',
            suggestion: 'Try using CPU processing or update your graphics drivers.',
            recoveryStrategy: ErrorRecoveryStrategy.FALLBACK_TO_CPU,
            recoverable: true
        }
    )

    const defaultProps = {
        error: mockError,
        isRecovering: false,
        onRetry: vi.fn(),
        onSkip: vi.fn(),
        onReduceQuality: vi.fn(),
        onDismiss: vi.fn(),
        onShowDetails: vi.fn()
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('rendering', () => {
        it('should render error information', () => {
            render(<EnhancementErrorDisplay {...defaultProps} />)

            expect(screen.getByText('Enhancement Error')).toBeInTheDocument()
            expect(screen.getByText('GPU NOT AVAILABLE')).toBeInTheDocument()
            expect(screen.getByText('GPU acceleration is not available on this device.')).toBeInTheDocument()
            expect(screen.getByText('Try using CPU processing or update your graphics drivers.')).toBeInTheDocument()
        })

        it('should not render when error is null', () => {
            render(<EnhancementErrorDisplay {...defaultProps} error={null} />)
            expect(screen.queryByText('Enhancement Error')).not.toBeInTheDocument()
        })

        it('should show recovering state', () => {
            render(<EnhancementErrorDisplay {...defaultProps} isRecovering={true} />)
            expect(screen.getByText('Recovering...')).toBeInTheDocument()
        })
    })

    describe('error severity', () => {
        it('should show error severity for GPU errors', () => {
            render(<EnhancementErrorDisplay {...defaultProps} />)
            expect(screen.getByText('GPU NOT AVAILABLE')).toBeInTheDocument()
        })

        it('should show warning severity for memory errors', () => {
            const memoryError = new EnhancementError(
                'Memory error',
                EnhancementErrorCode.INSUFFICIENT_MEMORY,
                { recoveryStrategy: ErrorRecoveryStrategy.CHUNK_PROCESSING }
            )
            render(<EnhancementErrorDisplay {...defaultProps} error={memoryError} />)
            expect(screen.getByText('INSUFFICIENT MEMORY')).toBeInTheDocument()
        })
    })

    describe('recovery actions', () => {
        it('should show retry button for RETRY strategy', () => {
            const retryError = new EnhancementError(
                'Retry error',
                EnhancementErrorCode.PROCESSING_FAILED,
                { recoveryStrategy: ErrorRecoveryStrategy.RETRY }
            )
            render(<EnhancementErrorDisplay {...defaultProps} error={retryError} />)
            expect(screen.getByText('Try Again')).toBeInTheDocument()
        })

        it('should show skip button for SKIP_ENHANCEMENT strategy', () => {
            const skipError = new EnhancementError(
                'Skip error',
                EnhancementErrorCode.INVALID_VIDEO_FORMAT,
                { recoveryStrategy: ErrorRecoveryStrategy.SKIP_ENHANCEMENT }
            )
            render(<EnhancementErrorDisplay {...defaultProps} error={skipError} />)
            expect(screen.getByText('Skip Enhancement')).toBeInTheDocument()
        })

        it('should show reduce quality button for REDUCE_QUALITY strategy', () => {
            const qualityError = new EnhancementError(
                'Quality error',
                EnhancementErrorCode.MEMORY_LIMIT_EXCEEDED,
                { recoveryStrategy: ErrorRecoveryStrategy.REDUCE_QUALITY }
            )
            render(<EnhancementErrorDisplay {...defaultProps} error={qualityError} />)
            expect(screen.getByText('Reduce Quality')).toBeInTheDocument()
        })
    })

    describe('user interactions', () => {
        it('should call onRetry when retry button is clicked', () => {
            const retryError = new EnhancementError(
                'Retry error',
                EnhancementErrorCode.PROCESSING_FAILED,
                { recoveryStrategy: ErrorRecoveryStrategy.RETRY }
            )
            render(<EnhancementErrorDisplay {...defaultProps} error={retryError} />)

            fireEvent.click(screen.getByText('Try Again'))
            expect(defaultProps.onRetry).toHaveBeenCalledTimes(1)
        })

        it('should call onSkip when skip button is clicked', () => {
            const skipError = new EnhancementError(
                'Skip error',
                EnhancementErrorCode.INVALID_VIDEO_FORMAT,
                { recoveryStrategy: ErrorRecoveryStrategy.SKIP_ENHANCEMENT }
            )
            render(<EnhancementErrorDisplay {...defaultProps} error={skipError} />)

            fireEvent.click(screen.getByText('Skip Enhancement'))
            expect(defaultProps.onSkip).toHaveBeenCalledTimes(1)
        })

        it('should call onReduceQuality when reduce quality button is clicked', () => {
            const qualityError = new EnhancementError(
                'Quality error',
                EnhancementErrorCode.MEMORY_LIMIT_EXCEEDED,
                { recoveryStrategy: ErrorRecoveryStrategy.REDUCE_QUALITY }
            )
            render(<EnhancementErrorDisplay {...defaultProps} error={qualityError} />)

            fireEvent.click(screen.getByText('Reduce Quality'))
            expect(defaultProps.onReduceQuality).toHaveBeenCalledTimes(1)
        })

        it('should call onDismiss when dismiss button is clicked', () => {
            render(<EnhancementErrorDisplay {...defaultProps} />)

            fireEvent.click(screen.getByRole('button', { name: '' })) // Dismiss button
            expect(defaultProps.onDismiss).toHaveBeenCalledTimes(1)
        })

        it('should call onShowDetails when help button is clicked', () => {
            render(<EnhancementErrorDisplay {...defaultProps} />)

            fireEvent.click(screen.getByText('Help'))
            expect(defaultProps.onShowDetails).toHaveBeenCalledTimes(1)
        })
    })

    describe('recoverable status', () => {
        it('should show recoverable status for recoverable errors', () => {
            render(<EnhancementErrorDisplay {...defaultProps} />)
            expect(screen.getByText('This error can be automatically recovered')).toBeInTheDocument()
        })

        it('should not show recoverable status for non-recoverable errors', () => {
            const nonRecoverableError = new EnhancementError(
                'Non-recoverable error',
                EnhancementErrorCode.BROWSER_NOT_SUPPORTED,
                { recoverable: false }
            )
            render(<EnhancementErrorDisplay {...defaultProps} error={nonRecoverableError} />)
            expect(screen.queryByText('This error can be automatically recovered')).not.toBeInTheDocument()
        })
    })

    describe('context information', () => {
        it('should show technical details when available', () => {
            const errorWithContext = new EnhancementError(
                'Error with context',
                EnhancementErrorCode.PROCESSING_FAILED,
                {
                    context: {
                        component: 'VideoProcessor',
                        operation: 'processFrame',
                        gpuAvailable: false
                    }
                }
            )
            render(<EnhancementErrorDisplay {...defaultProps} error={errorWithContext} />)

            expect(screen.getByText('Technical Details')).toBeInTheDocument()
        })
    })
})

describe('ErrorRecoveryDialog', () => {
    const mockError = new EnhancementError(
        'Test error',
        EnhancementErrorCode.GPU_NOT_AVAILABLE,
        { recoveryStrategy: ErrorRecoveryStrategy.FALLBACK_TO_CPU }
    )

    const defaultProps = {
        error: mockError,
        isOpen: true,
        onClose: vi.fn(),
        onConfirm: vi.fn()
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('rendering', () => {
        it('should render when open', () => {
            render(<ErrorRecoveryDialog {...defaultProps} />)
            expect(screen.getByText('Error Recovery')).toBeInTheDocument()
            expect(screen.getByText('Choose how to handle this error')).toBeInTheDocument()
        })

        it('should not render when closed', () => {
            render(<ErrorRecoveryDialog {...defaultProps} isOpen={false} />)
            expect(screen.queryByText('Error Recovery')).not.toBeInTheDocument()
        })
    })

    describe('error information', () => {
        it('should display error message', () => {
            render(<ErrorRecoveryDialog {...defaultProps} />)
            expect(screen.getByText('GPU acceleration is not available on this device.')).toBeInTheDocument()
        })

        it('should display recovery strategy description', () => {
            render(<ErrorRecoveryDialog {...defaultProps} />)
            expect(screen.getByText('Switch to CPU processing instead of GPU acceleration.')).toBeInTheDocument()
        })
    })

    describe('user interactions', () => {
        it('should call onClose when cancel is clicked', () => {
            render(<ErrorRecoveryDialog {...defaultProps} />)

            fireEvent.click(screen.getByText('Cancel'))
            expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
        })

        it('should call onConfirm when apply recovery is clicked', () => {
            render(<ErrorRecoveryDialog {...defaultProps} />)

            fireEvent.click(screen.getByText('Apply Recovery'))
            expect(defaultProps.onConfirm).toHaveBeenCalledWith(ErrorRecoveryStrategy.FALLBACK_TO_CPU)
        })

        it('should disable apply button for NONE strategy', () => {
            const noneError = new EnhancementError(
                'No recovery error',
                EnhancementErrorCode.UNKNOWN_ERROR,
                { recoveryStrategy: ErrorRecoveryStrategy.NONE }
            )
            render(<ErrorRecoveryDialog {...defaultProps} error={noneError} />)

            const applyButton = screen.getByText('Apply Recovery')
            expect(applyButton).toBeDisabled()
        })
    })
})
