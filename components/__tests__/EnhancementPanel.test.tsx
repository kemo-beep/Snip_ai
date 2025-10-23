/**
 * Unit tests for EnhancementPanel component
 * Requirements: 4.1, 4.2, 4.3, 4.6, 4.7
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import EnhancementPanel from '../EnhancementPanel'
import type { EnhancementConfig, EnhancementSettings } from '@/lib/videoEnhancement'

// Mock the videoEnhancement module
vi.mock('@/lib/videoEnhancement', () => ({
    DEFAULT_PRESETS: [
        {
            id: 'auto',
            name: 'Auto',
            description: 'Automatically applies all enhancements',
            category: 'auto',
            config: {
                autoColorCorrection: true,
                autoBrightnessAdjust: true,
                autoContrast: true,
                autoWhiteBalance: true,
                autoNoiseReduction: true,
                autoVolumeNormalization: true,
                autoVoiceEnhancement: true,
                autoEchoCancel: true,
                autoStabilization: true
            },
            settings: {
                brightness: 0,
                contrast: 0,
                saturation: 0,
                temperature: 0,
                noiseReduction: 70,
                volumeBoost: 0,
                voiceClarity: 60,
                echoReduction: 60,
                stabilizationStrength: 50
            }
        },
        {
            id: 'minimal',
            name: 'Minimal',
            description: 'Only essential enhancements',
            category: 'minimal',
            config: {
                autoColorCorrection: true,
                autoBrightnessAdjust: true,
                autoContrast: false,
                autoWhiteBalance: false,
                autoNoiseReduction: true,
                autoVolumeNormalization: true,
                autoVoiceEnhancement: false,
                autoEchoCancel: false,
                autoStabilization: false
            },
            settings: {
                brightness: 0,
                contrast: 0,
                saturation: 0,
                temperature: 0,
                noiseReduction: 50,
                volumeBoost: 0,
                voiceClarity: 0,
                echoReduction: 0,
                stabilizationStrength: 0
            }
        }
    ],
    getPresetById: vi.fn((id: string) => {
        const presets = [
            {
                id: 'auto',
                name: 'Auto',
                description: 'Automatically applies all enhancements',
                category: 'auto',
                config: {
                    autoColorCorrection: true,
                    autoBrightnessAdjust: true,
                    autoContrast: true,
                    autoWhiteBalance: true,
                    autoNoiseReduction: true,
                    autoVolumeNormalization: true,
                    autoVoiceEnhancement: true,
                    autoEchoCancel: true,
                    autoStabilization: true
                },
                settings: {
                    brightness: 0,
                    contrast: 0,
                    saturation: 0,
                    temperature: 0,
                    noiseReduction: 70,
                    volumeBoost: 0,
                    voiceClarity: 60,
                    echoReduction: 60,
                    stabilizationStrength: 50
                }
            }
        ]
        return presets.find(p => p.id === id)
    }),
    getPresetsByCategory: vi.fn(() => []),
    getDefaultPreset: vi.fn(() => ({
        id: 'auto',
        name: 'Auto',
        description: 'Automatically applies all enhancements',
        category: 'auto',
        config: {
            autoColorCorrection: true,
            autoBrightnessAdjust: true,
            autoContrast: true,
            autoWhiteBalance: true,
            autoNoiseReduction: true,
            autoVolumeNormalization: true,
            autoVoiceEnhancement: true,
            autoEchoCancel: true,
            autoStabilization: true
        },
        settings: {
            brightness: 0,
            contrast: 0,
            saturation: 0,
            temperature: 0,
            noiseReduction: 70,
            volumeBoost: 0,
            voiceClarity: 60,
            echoReduction: 60,
            stabilizationStrength: 50
        }
    })),
    validatePreset: vi.fn(() => true),
    createCustomPreset: vi.fn((id, name, description, config, settings) => ({
        id,
        name,
        description,
        config,
        settings,
        category: 'custom'
    })),
    getConfigStorage: vi.fn(() => ({
        getCustomPresets: vi.fn(() => []),
        addCustomPreset: vi.fn()
    }))
}))

describe('EnhancementPanel', () => {
    const defaultConfig: EnhancementConfig = {
        autoColorCorrection: true,
        autoBrightnessAdjust: true,
        autoContrast: false,
        autoWhiteBalance: false,
        autoNoiseReduction: true,
        autoVolumeNormalization: true,
        autoVoiceEnhancement: false,
        autoEchoCancel: false,
        autoStabilization: false
    }

    const defaultSettings: EnhancementSettings = {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        temperature: 0,
        noiseReduction: 50,
        volumeBoost: 0,
        voiceClarity: 0,
        echoReduction: 0,
        stabilizationStrength: 0
    }

    const defaultProps = {
        config: defaultConfig,
        settings: defaultSettings,
        onConfigChange: vi.fn(),
        onSettingsChange: vi.fn(),
        onPreview: vi.fn(),
        onReset: vi.fn(),
        isProcessing: false
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Rendering', () => {
        it('should render enhancement panel with all sections', () => {
            render(<EnhancementPanel {...defaultProps} />)

            expect(screen.getByText('Enhancements')).toBeInTheDocument()
            expect(screen.getByText('Preset')).toBeInTheDocument()
            expect(screen.getByText('Color & Lighting')).toBeInTheDocument()
            expect(screen.getByText('Audio Enhancement')).toBeInTheDocument()
            expect(screen.getByText('Video Quality')).toBeInTheDocument()
        })

        it('should render preset selector', () => {
            render(<EnhancementPanel {...defaultProps} />)

            expect(screen.getByRole('combobox')).toBeInTheDocument()
            expect(screen.getByText('Auto')).toBeInTheDocument()
        })

        it('should render enhancement toggles', () => {
            render(<EnhancementPanel {...defaultProps} />)

            expect(screen.getByText('Auto Color Correction')).toBeInTheDocument()
            expect(screen.getByText('Brightness')).toBeInTheDocument()
            expect(screen.getByText('Noise Reduction')).toBeInTheDocument()
            expect(screen.getByText('Stabilization')).toBeInTheDocument()
        })

        it('should render action buttons', () => {
            render(<EnhancementPanel {...defaultProps} />)

            expect(screen.getByText('Preview')).toBeInTheDocument()
            expect(screen.getByText('Reset')).toBeInTheDocument()
        })
    })

    describe('Preset Selection', () => {
        it('should call onConfigChange and onSettingsChange when preset changes', async () => {
            const { onConfigChange, onSettingsChange } = defaultProps
            render(<EnhancementPanel {...defaultProps} />)

            const presetSelector = screen.getByRole('combobox')
            fireEvent.click(presetSelector)

            // Wait for dropdown to appear and select minimal preset
            await waitFor(() => {
                expect(screen.getByText('Minimal')).toBeInTheDocument()
            })

            fireEvent.click(screen.getByText('Minimal'))

            expect(onConfigChange).toHaveBeenCalled()
            expect(onSettingsChange).toHaveBeenCalled()
        })
    })

    describe('Enhancement Toggles', () => {
        it('should call onConfigChange when toggle is clicked', () => {
            const { onConfigChange } = defaultProps
            render(<EnhancementPanel {...defaultProps} />)

            const brightnessToggle = screen.getByRole('switch', { name: /brightness/i })
            fireEvent.click(brightnessToggle)

            expect(onConfigChange).toHaveBeenCalledWith({
                ...defaultConfig,
                autoBrightnessAdjust: false
            })
        })

        it('should disable toggles when processing', () => {
            render(<EnhancementPanel {...defaultProps} isProcessing={true} />)

            const brightnessToggle = screen.getByRole('switch', { name: /brightness/i })
            expect(brightnessToggle).toBeDisabled()
        })
    })

    describe('Advanced Settings', () => {
        it('should show advanced settings when advanced mode is enabled', () => {
            render(<EnhancementPanel {...defaultProps} />)

            const advancedButton = screen.getByText('Advanced')
            fireEvent.click(advancedButton)

            expect(screen.getByText('Fine-tune settings')).toBeInTheDocument()
        })

        it('should hide advanced settings when simple mode is enabled', () => {
            render(<EnhancementPanel {...defaultProps} />)

            const advancedButton = screen.getByText('Advanced')
            fireEvent.click(advancedButton)

            const simpleButton = screen.getByText('Simple')
            fireEvent.click(simpleButton)

            expect(screen.queryByText('Fine-tune settings')).not.toBeInTheDocument()
        })
    })

    describe('Settings Sliders', () => {
        it('should call onSettingsChange when slider value changes', () => {
            const { onSettingsChange } = defaultProps
            render(<EnhancementPanel {...defaultProps} />)

            // Enable advanced settings first
            const advancedButton = screen.getByText('Advanced')
            fireEvent.click(advancedButton)

            // Find and interact with brightness slider
            const brightnessSlider = screen.getByRole('slider', { name: /brightness/i })
            fireEvent.change(brightnessSlider, { target: { value: '25' } })

            expect(onSettingsChange).toHaveBeenCalledWith({
                ...defaultSettings,
                brightness: 25
            })
        })
    })

    describe('Action Buttons', () => {
        it('should call onPreview when preview button is clicked', () => {
            const { onPreview } = defaultProps
            render(<EnhancementPanel {...defaultProps} />)

            const previewButton = screen.getByText('Preview')
            fireEvent.click(previewButton)

            expect(onPreview).toHaveBeenCalled()
        })

        it('should call onReset when reset button is clicked', () => {
            const { onReset } = defaultProps
            render(<EnhancementPanel {...defaultProps} />)

            const resetButton = screen.getAllByText('Reset')[0]
            fireEvent.click(resetButton)

            expect(onReset).toHaveBeenCalled()
        })

        it('should disable buttons when processing', () => {
            render(<EnhancementPanel {...defaultProps} isProcessing={true} />)

            const previewButton = screen.getByText('Preview')
            expect(previewButton).toBeDisabled()
        })
    })

    describe('Custom Presets', () => {
        it('should show save as preset button', () => {
            render(<EnhancementPanel {...defaultProps} />)

            expect(screen.getByText('Save as Preset')).toBeInTheDocument()
        })

        it('should handle save as preset when clicked', async () => {
            // Mock prompt
            const mockPrompt = vi.spyOn(window, 'prompt').mockReturnValue('My Custom Preset')

            render(<EnhancementPanel {...defaultProps} />)

            const saveButton = screen.getByText('Save as Preset')
            fireEvent.click(saveButton)

            expect(mockPrompt).toHaveBeenCalledWith('Enter preset name:')

            mockPrompt.mockRestore()
        })
    })

    describe('Processing State', () => {
        it('should show processing indicator when processing', () => {
            render(<EnhancementPanel {...defaultProps} isProcessing={true} />)

            expect(screen.getByText('Processing enhancements...')).toBeInTheDocument()
        })

        it('should not show processing indicator when not processing', () => {
            render(<EnhancementPanel {...defaultProps} isProcessing={false} />)

            expect(screen.queryByText('Processing enhancements...')).not.toBeInTheDocument()
        })
    })

    describe('Enhancement Categories', () => {
        it('should render all enhancement categories', () => {
            render(<EnhancementPanel {...defaultProps} />)

            expect(screen.getByText('Color & Lighting')).toBeInTheDocument()
            expect(screen.getByText('Audio Enhancement')).toBeInTheDocument()
            expect(screen.getByText('Video Quality')).toBeInTheDocument()
        })

        it('should show correct enhancements in each category', () => {
            render(<EnhancementPanel {...defaultProps} />)

            // Color & Lighting
            expect(screen.getByText('Auto Color Correction')).toBeInTheDocument()
            expect(screen.getByText('Brightness')).toBeInTheDocument()
            expect(screen.getByText('Contrast')).toBeInTheDocument()
            expect(screen.getByText('White Balance')).toBeInTheDocument()

            // Audio Enhancement
            expect(screen.getByText('Noise Reduction')).toBeInTheDocument()
            expect(screen.getByText('Volume Normalization')).toBeInTheDocument()
            expect(screen.getByText('Voice Enhancement')).toBeInTheDocument()
            expect(screen.getByText('Echo Cancellation')).toBeInTheDocument()

            // Video Quality
            expect(screen.getByText('Stabilization')).toBeInTheDocument()
        })
    })
})
