import { ColorGradingPreset } from '@/lib/templates/colorGradingPresets'
import { AspectRatioTemplate } from '@/lib/templates/aspectRatioTemplates'
import { BrandKit } from '@/lib/templates/brandKit'
import { TransitionPreset } from '@/lib/templates/transitionPresets'

export interface TemplateHandlers {
    onApplyColorGrading: (preset: ColorGradingPreset) => void
    onApplyAspectRatio: (template: AspectRatioTemplate) => void
    onApplyBrandKit: (brandKit: BrandKit) => void
    onApplyTransition: (transition: TransitionPreset) => void
}

export const createTemplateHandlers = (
    setCurrentColorPreset: (preset: string) => void,
    setColorGradingFilters: (filters: any) => void,
    setCurrentAspectRatio: (template: string) => void,
    setAspectRatio: (ratio: string) => void,
    setCurrentBrandKit: (brandKit: string) => void,
    setBackgroundSettings: (settings: any) => void
): TemplateHandlers => ({
    onApplyColorGrading: (preset: ColorGradingPreset) => {
        console.log('Applying color grading preset:', preset.name)
        setCurrentColorPreset(preset.id)
        setColorGradingFilters(preset.filters)
    },

    onApplyAspectRatio: (template: AspectRatioTemplate) => {
        console.log('Applying aspect ratio template:', template.name, template.ratio)
        setCurrentAspectRatio(template.id)
        setAspectRatio(template.ratio)
    },

    onApplyBrandKit: (brandKit: BrandKit) => {
        console.log('Applying brand kit:', brandKit.name)
        setCurrentBrandKit(brandKit.id)
        // Apply brand colors to background
        const primaryColor = brandKit.colors.find(c => c.usage === 'primary')
        const secondaryColor = brandKit.colors.find(c => c.usage === 'secondary')
        if (primaryColor && secondaryColor) {
            setBackgroundSettings((prev: any) => ({
                ...prev,
                type: 'gradient',
                gradientColors: [primaryColor.hex, secondaryColor.hex]
            }))
        }
    },

    onApplyTransition: (transition: TransitionPreset) => {
        console.log('Applying transition:', transition.name)
        // Add transition to timeline between clips
        // This would be implemented with the timeline system
        alert(`Transition "${transition.name}" will be applied between clips. Full implementation coming soon!`)
    }
})
