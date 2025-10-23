/**
 * Unit tests for EnhancementProgress component
 * Requirements: 6.2, 6.5
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import EnhancementProgress from '../EnhancementProgress'

const mockSteps = [
    {
        id: 'analysis',
        name: 'Analyzing Video',
        status: 'completed' as const,
        progress: 100,
        icon: undefined
    },
    {
        id: 'color',
        name: 'Color Enhancement',
        status: 'processing' as const,
        progress: 50,
        icon: undefined
    },
    {
        id: 'audio',
        name: 'Audio Processing',
        status: 'pending' as const,
        progress: 0,
        icon: undefined
    }
]

describe('EnhancementProgress', () => {
    const defaultProps = {
        isVisible: true,
        progress: 50,
        currentStep: 'Processing enhancements...',
        steps: mockSteps,
        estimatedTimeRemaining: 30,
        framesProcessed: 25,
        totalFrames: 100,
        currentFPS: 15.5,
        onCancel: vi.fn(),
        onRetry: vi.fn(),
        error: null
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Rendering', () => {
        it('should not render when not visible', () => {
            render(<EnhancementProgress {...defaultProps} isVisible={false} />)

            expect(screen.queryByText('Enhancing Video')).not.toBeInTheDocument()
        })

        it('should render when visible', () => {
            render(<EnhancementProgress {...defaultProps} />)

            expect(screen.getByText('Enhancing Video')).toBeInTheDocument()
            expect(screen.getByText('Please wait while we enhance your video...')).toBeInTheDocument()
        })

        it('should render progress bar', () => {
            render(<EnhancementProgress {...defaultProps} />)

            expect(screen.getByText('Progress')).toBeInTheDocument()
            expect(screen.getByText('50%')).toBeInTheDocument()
        })

        it('should render current step', () => {
            render(<EnhancementProgress {...defaultProps} />)

            expect(screen.getByText('Current step:')).toBeInTheDocument()
            expect(screen.getByText('Processing enhancements...')).toBeInTheDocument()
        })
    })

    describe('Progress Bar', () => {
        it('should display correct progress percentage', () => {
            render(<EnhancementProgress {...defaultProps} progress={75} />)

            expect(screen.getByText('75%')).toBeInTheDocument()
        })

        it('should handle 0% progress', () => {
            render(<EnhancementProgress {...defaultProps} progress={0} />)

            expect(screen.getByText('0%')).toBeInTheDocument()
        })

        it('should handle 100% progress', () => {
            render(<EnhancementProgress {...defaultProps} progress={100} />)

            expect(screen.getByText('100%')).toBeInTheDocument()
        })
    })

    describe('Processing Steps', () => {
        it('should render all processing steps', () => {
            render(<EnhancementProgress {...defaultProps} />)

            expect(screen.getByText('Processing Steps')).toBeInTheDocument()
            expect(screen.getByText('Analyzing Video')).toBeInTheDocument()
            expect(screen.getByText('Color Enhancement')).toBeInTheDocument()
            expect(screen.getByText('Audio Processing')).toBeInTheDocument()
        })

        it('should show correct status for each step', () => {
            render(<EnhancementProgress {...defaultProps} />)

            expect(screen.getByText('Done')).toBeInTheDocument() // completed step
            expect(screen.getByText('Working')).toBeInTheDocument() // processing step
            expect(screen.getByText('Pending')).toBeInTheDocument() // pending step
        })

        it('should show progress bars for processing steps', () => {
            render(<EnhancementProgress {...defaultProps} />)

            // The processing step should have a progress bar
            const progressBars = screen.getAllByRole('progressbar')
            expect(progressBars.length).toBeGreaterThan(0)
        })
    })

    describe('Time Tracking', () => {
        it('should display elapsed time', () => {
            render(<EnhancementProgress {...defaultProps} />)

            expect(screen.getByText('Time Elapsed:')).toBeInTheDocument()
            expect(screen.getByText('0:00')).toBeInTheDocument()
        })

        it('should display estimated time remaining', () => {
            render(<EnhancementProgress {...defaultProps} />)

            expect(screen.getByText('Time Remaining:')).toBeInTheDocument()
            expect(screen.getByText('0:30')).toBeInTheDocument()
        })

        it('should format time correctly', () => {
            render(<EnhancementProgress {...defaultProps} estimatedTimeRemaining={125} />)

            expect(screen.getByText('2:05')).toBeInTheDocument()
        })
    })

    describe('Frame Processing Stats', () => {
        it('should display frame processing information', () => {
            render(<EnhancementProgress {...defaultProps} />)

            expect(screen.getByText('Frames:')).toBeInTheDocument()
            expect(screen.getByText('25 / 100')).toBeInTheDocument()
        })

        it('should display processing speed', () => {
            render(<EnhancementProgress {...defaultProps} />)

            expect(screen.getByText('Speed:')).toBeInTheDocument()
            expect(screen.getByText('15.5 FPS')).toBeInTheDocument()
        })

        it('should show performance indicator', () => {
            render(<EnhancementProgress {...defaultProps} />)

            expect(screen.getByText('Processing at 15.5 FPS (Normal)')).toBeInTheDocument()
        })

        it('should show fast performance indicator', () => {
            render(<EnhancementProgress {...defaultProps} currentFPS={35} />)

            expect(screen.getByText('Processing at 35.0 FPS (Fast)')).toBeInTheDocument()
        })

        it('should show slow performance indicator', () => {
            render(<EnhancementProgress {...defaultProps} currentFPS={10} />)

            expect(screen.getByText('Processing at 10.0 FPS (Slow)')).toBeInTheDocument()
        })
    })

    describe('Cancel Functionality', () => {
        it('should render cancel button', () => {
            render(<EnhancementProgress {...defaultProps} />)

            expect(screen.getByText('Cancel')).toBeInTheDocument()
        })

        it('should call onCancel when cancel button is clicked', () => {
            const { onCancel } = defaultProps
            render(<EnhancementProgress {...defaultProps} />)

            const cancelButton = screen.getByText('Cancel')
            fireEvent.click(cancelButton)

            expect(onCancel).toHaveBeenCalled()
        })

        it('should not show cancel button when error occurs', () => {
            render(<EnhancementProgress {...defaultProps} error="Processing failed" />)

            expect(screen.queryByText('Cancel')).not.toBeInTheDocument()
        })
    })

    describe('Error State', () => {
        it('should show error message when error occurs', () => {
            const errorMessage = 'Processing failed'
            render(<EnhancementProgress {...defaultProps} error={errorMessage} />)

            expect(screen.getByText('Enhancement Failed')).toBeInTheDocument()
            expect(screen.getByText('An error occurred during processing')).toBeInTheDocument()
            expect(screen.getByText('Processing Error')).toBeInTheDocument()
            expect(screen.getByText(errorMessage)).toBeInTheDocument()
        })

        it('should show retry button when error occurs', () => {
            render(<EnhancementProgress {...defaultProps} error="Processing failed" />)

            expect(screen.getByText('Try Again')).toBeInTheDocument()
        })

        it('should call onRetry when retry button is clicked', () => {
            const { onRetry } = defaultProps
            render(<EnhancementProgress {...defaultProps} error="Processing failed" />)

            const retryButton = screen.getByText('Try Again')
            fireEvent.click(retryButton)

            expect(onRetry).toHaveBeenCalled()
        })

        it('should not show retry button when no onRetry handler', () => {
            const { onRetry, ...propsWithoutRetry } = defaultProps
            render(<EnhancementProgress {...propsWithoutRetry} error="Processing failed" />)

            expect(screen.queryByText('Try Again')).not.toBeInTheDocument()
        })
    })

    describe('Default Steps', () => {
        it('should use default steps when none provided', () => {
            const { steps, ...propsWithoutSteps } = defaultProps
            render(<EnhancementProgress {...propsWithoutSteps} />)

            expect(screen.getByText('Analyzing Video')).toBeInTheDocument()
            expect(screen.getByText('Color Enhancement')).toBeInTheDocument()
            expect(screen.getByText('Audio Processing')).toBeInTheDocument()
            expect(screen.getByText('Stabilization')).toBeInTheDocument()
            expect(screen.getByText('Finalizing')).toBeInTheDocument()
        })
    })

    describe('Step Status Logic', () => {
        it('should show correct step status based on progress', () => {
            render(<EnhancementProgress {...defaultProps} progress={25} />)

            // At 25% progress, analysis should be completed, color should be processing
            expect(screen.getByText('Done')).toBeInTheDocument()
            expect(screen.getByText('Working')).toBeInTheDocument()
        })
    })

    describe('Accessibility', () => {
        it('should have proper ARIA labels', () => {
            render(<EnhancementProgress {...defaultProps} />)

            expect(screen.getByRole('progressbar')).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
        })

        it('should have proper heading structure', () => {
            render(<EnhancementProgress {...defaultProps} />)

            expect(screen.getByText('Enhancing Video')).toBeInTheDocument()
        })
    })

    describe('Edge Cases', () => {
        it('should handle missing optional props', () => {
            const minimalProps = {
                isVisible: true,
                progress: 50
            }

            render(<EnhancementProgress {...minimalProps} />)

            expect(screen.getByText('Enhancing Video')).toBeInTheDocument()
        })

        it('should handle zero frames processed', () => {
            render(<EnhancementProgress {...defaultProps} framesProcessed={0} />)

            expect(screen.getByText('0 / 100')).toBeInTheDocument()
        })

        it('should handle zero FPS', () => {
            render(<EnhancementProgress {...defaultProps} currentFPS={0} />)

            // FPS is only displayed when currentFPS > 0
            expect(screen.queryByText('0.0 FPS')).not.toBeInTheDocument()
        })
    })
})
