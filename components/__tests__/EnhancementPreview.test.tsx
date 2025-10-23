/**
 * Unit tests for EnhancementPreview component
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 7.6
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import EnhancementPreview from '../EnhancementPreview'
import type { EnhancementMetrics } from '@/lib/videoEnhancement'

// Mock ImageData
const createMockImageData = (width: number, height: number): ImageData => {
    const data = new Uint8ClampedArray(width * height * 4)
    return new ImageData(data, width, height)
}

const mockMetrics: EnhancementMetrics = {
    brightnessAdjustment: 15,
    contrastAdjustment: 8,
    colorTemperatureShift: -200,
    noiseReductionDb: 12.5,
    volumeAdjustmentDb: 3.2,
    shakeReduction: 75
}

describe('EnhancementPreview', () => {
    const defaultProps = {
        originalImage: null,
        enhancedImage: null,
        metrics: undefined,
        isGenerating: false,
        error: null,
        onRegenerate: vi.fn()
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Rendering', () => {
        it('should render preview component', () => {
            render(<EnhancementPreview {...defaultProps} />)

            expect(screen.getByText('Preview')).toBeInTheDocument()
            expect(screen.getByText('Compare original and enhanced video frames')).toBeInTheDocument()
        })

        it('should show no preview available when no images', () => {
            render(<EnhancementPreview {...defaultProps} />)

            expect(screen.getByText('No preview available')).toBeInTheDocument()
            expect(screen.getByText('Generate a preview to see before/after comparison')).toBeInTheDocument()
        })

        it('should render comparison view when images are provided', () => {
            const originalImage = createMockImageData(100, 100)
            const enhancedImage = createMockImageData(100, 100)

            render(
                <EnhancementPreview
                    {...defaultProps}
                    originalImage={originalImage}
                    enhancedImage={enhancedImage}
                />
            )

            expect(screen.getByText('Original')).toBeInTheDocument()
            expect(screen.getByText('Enhanced')).toBeInTheDocument()
        })
    })

    describe('Comparison Controls', () => {
        it('should render comparison slider', () => {
            render(<EnhancementPreview {...defaultProps} />)

            expect(screen.getByText('Comparison')).toBeInTheDocument()
            expect(screen.getByText('Original')).toBeInTheDocument()
            expect(screen.getByText('Enhanced')).toBeInTheDocument()
        })

        it('should update comparison position when slider changes', () => {
            render(<EnhancementPreview {...defaultProps} />)

            const slider = screen.getByRole('slider')
            fireEvent.change(slider, { target: { value: '75' } })

            expect(slider).toHaveValue(75)
        })

        it('should render zoom controls', () => {
            render(<EnhancementPreview {...defaultProps} />)

            expect(screen.getByText('100%')).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /zoom out/i })).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /zoom in/i })).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument()
        })

        it('should update zoom when zoom controls are clicked', () => {
            render(<EnhancementPreview {...defaultProps} />)

            const zoomInButton = screen.getByRole('button', { name: /zoom in/i })
            fireEvent.click(zoomInButton)

            expect(screen.getByText('125%')).toBeInTheDocument()
        })

        it('should reset zoom when reset button is clicked', () => {
            render(<EnhancementPreview {...defaultProps} />)

            // First zoom in
            const zoomInButton = screen.getByRole('button', { name: /zoom in/i })
            fireEvent.click(zoomInButton)
            expect(screen.getByText('125%')).toBeInTheDocument()

            // Then reset
            const resetButton = screen.getByRole('button', { name: /reset/i })
            fireEvent.click(resetButton)
            expect(screen.getByText('100%')).toBeInTheDocument()
        })
    })

    describe('Metrics Display', () => {
        it('should show metrics when provided', () => {
            render(<EnhancementPreview {...defaultProps} metrics={mockMetrics} />)

            expect(screen.getByText('Enhancement Metrics')).toBeInTheDocument()
            expect(screen.getByText('Color Adjustments')).toBeInTheDocument()
            expect(screen.getByText('Audio Enhancements')).toBeInTheDocument()
            expect(screen.getByText('Video Quality')).toBeInTheDocument()
        })

        it('should hide metrics when show metrics is toggled off', () => {
            render(<EnhancementPreview {...defaultProps} metrics={mockMetrics} />)

            const hideButton = screen.getByText('Hide Metrics')
            fireEvent.click(hideButton)

            expect(screen.queryByText('Enhancement Metrics')).not.toBeInTheDocument()
        })

        it('should display correct metric values', () => {
            render(<EnhancementPreview {...defaultProps} metrics={mockMetrics} />)

            expect(screen.getByText('+15')).toBeInTheDocument() // brightnessAdjustment
            expect(screen.getByText('+8')).toBeInTheDocument() // contrastAdjustment
            expect(screen.getByText('-200°K')).toBeInTheDocument() // colorTemperatureShift
            expect(screen.getByText('-12.5dB')).toBeInTheDocument() // noiseReductionDb
            expect(screen.getByText('+3.2dB')).toBeInTheDocument() // volumeAdjustmentDb
            expect(screen.getByText('75.0%')).toBeInTheDocument() // shakeReduction
        })
    })

    describe('Loading State', () => {
        it('should show loading overlay when generating', () => {
            render(<EnhancementPreview {...defaultProps} isGenerating={true} />)

            expect(screen.getByText('Generating preview...')).toBeInTheDocument()
        })

        it('should not show loading overlay when not generating', () => {
            render(<EnhancementPreview {...defaultProps} isGenerating={false} />)

            expect(screen.queryByText('Generating preview...')).not.toBeInTheDocument()
        })
    })

    describe('Error State', () => {
        it('should show error message when error occurs', () => {
            const errorMessage = 'Preview generation failed'
            render(<EnhancementPreview {...defaultProps} error={errorMessage} />)

            expect(screen.getByText('Preview Error')).toBeInTheDocument()
            expect(screen.getByText(errorMessage)).toBeInTheDocument()
        })

        it('should not show error message when no error', () => {
            render(<EnhancementPreview {...defaultProps} error={null} />)

            expect(screen.queryByText('Preview Error')).not.toBeInTheDocument()
        })
    })

    describe('Regenerate Functionality', () => {
        it('should call onRegenerate when regenerate button is clicked', () => {
            const { onRegenerate } = defaultProps
            render(<EnhancementPreview {...defaultProps} />)

            const regenerateButton = screen.getByText('Regenerate')
            fireEvent.click(regenerateButton)

            expect(onRegenerate).toHaveBeenCalled()
        })

        it('should show generating state when regenerating', () => {
            render(<EnhancementPreview {...defaultProps} isGenerating={true} />)

            expect(screen.getByText('Generating...')).toBeInTheDocument()
        })
    })

    describe('Fullscreen Mode', () => {
        it('should toggle fullscreen mode', () => {
            render(<EnhancementPreview {...defaultProps} />)

            const fullscreenButton = screen.getByRole('button', { name: /maximize/i })
            fireEvent.click(fullscreenButton)

            expect(screen.getByRole('button', { name: /minimize/i })).toBeInTheDocument()
        })
    })

    describe('Canvas Rendering', () => {
        it('should render canvas elements when images are provided', () => {
            const originalImage = createMockImageData(100, 100)
            const enhancedImage = createMockImageData(100, 100)

            render(
                <EnhancementPreview
                    {...defaultProps}
                    originalImage={originalImage}
                    enhancedImage={enhancedImage}
                />
            )

            const canvases = screen.getAllByRole('img')
            expect(canvases).toHaveLength(2) // Original and enhanced canvases
        })
    })

    describe('Accessibility', () => {
        it('should have proper ARIA labels for controls', () => {
            render(<EnhancementPreview {...defaultProps} />)

            expect(screen.getByRole('slider')).toHaveAttribute('aria-label')
            expect(screen.getByRole('button', { name: /zoom in/i })).toBeInTheDocument()
            expect(screen.getByRole('button', { name: /zoom out/i })).toBeInTheDocument()
        })

        it('should have proper heading structure', () => {
            render(<EnhancementPreview {...defaultProps} />)

            expect(screen.getByRole('heading', { name: 'Preview' })).toBeInTheDocument()
        })
    })

    describe('Responsive Design', () => {
        it('should handle different screen sizes', () => {
            // Mock window.innerWidth
            Object.defineProperty(window, 'innerWidth', {
                writable: true,
                configurable: true,
                value: 800,
            })

            render(<EnhancementPreview {...defaultProps} />)

            expect(screen.getByText('Preview')).toBeInTheDocument()
        })
    })
})
