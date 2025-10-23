'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Palette,
  Crop,
  Sparkles,
  Zap,
  Film
} from 'lucide-react'
import { colorGradingPresets, ColorGradingPreset } from '@/lib/templates/colorGradingPresets'
import { aspectRatioTemplates, AspectRatioTemplate } from '@/lib/templates/aspectRatioTemplates'
import { defaultBrandKits, BrandKit } from '@/lib/templates/brandKit'
import { transitionPresets, TransitionPreset } from '@/lib/templates/transitionPresets'

interface TemplatesPanelProps {
  onApplyColorGrading?: (preset: ColorGradingPreset) => void
  onApplyAspectRatio?: (template: AspectRatioTemplate) => void
  onApplyBrandKit?: (brandKit: BrandKit) => void
  onApplyTransition?: (transition: TransitionPreset) => void
  currentColorPreset?: string
  currentAspectRatio?: string
  currentBrandKit?: string
}

export default function TemplatesPanel({
  onApplyColorGrading,
  onApplyAspectRatio,
  onApplyBrandKit,
  onApplyTransition,
  currentColorPreset,
  currentAspectRatio,
  currentBrandKit
}: TemplatesPanelProps) {
  const [selectedTab, setSelectedTab] = useState('color-grading')
  const [colorCategory, setColorCategory] = useState<'all' | 'cinematic' | 'corporate' | 'social' | 'creative' | 'vintage'>('all')
  const [aspectCategory, setAspectCategory] = useState<'all' | 'social' | 'professional' | 'cinematic'>('all')

  const filteredColorPresets = colorCategory === 'all'
    ? colorGradingPresets
    : colorGradingPresets.filter(p => p.category === colorCategory)

  const filteredAspectTemplates = aspectCategory === 'all'
    ? aspectRatioTemplates
    : aspectRatioTemplates.filter(t => t.category === aspectCategory)

  return (
    <div className="space-y-4">
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-700">
          <TabsTrigger value="color-grading" className="text-xs">
            <Palette className="h-3 w-3 mr-1" />
            Color
          </TabsTrigger>
          <TabsTrigger value="aspect-ratio" className="text-xs">
            <Crop className="h-3 w-3 mr-1" />
            Aspect
          </TabsTrigger>
          <TabsTrigger value="brand-kit" className="text-xs">
            <Sparkles className="h-3 w-3 mr-1" />
            Brand
          </TabsTrigger>
          <TabsTrigger value="transitions" className="text-xs">
            <Film className="h-3 w-3 mr-1" />
            Transitions
          </TabsTrigger>
        </TabsList>

        {/* Color Grading Tab */}
        <TabsContent value="color-grading" className="space-y-3 mt-3">
          <div>
            <Label className="text-xs text-gray-400 mb-2 block">Category</Label>
            <div className="flex flex-wrap gap-1">
              {['all', 'cinematic', 'corporate', 'social', 'creative', 'vintage'].map((cat) => (
                <Button
                  key={cat}
                  size="sm"
                  variant={colorCategory === cat ? 'default' : 'outline'}
                  onClick={() => setColorCategory(cat as any)}
                  className="text-xs px-2 py-1 h-7"
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1">
            {filteredColorPresets.map((preset) => (
              <div
                key={preset.id}
                onClick={() => onApplyColorGrading?.(preset)}
                className={`relative cursor-pointer rounded-lg border-2 transition-all duration-200 overflow-hidden group ${
                  currentColorPreset === preset.id
                    ? 'border-purple-500 ring-2 ring-purple-500 scale-105'
                    : 'border-gray-600 hover:border-purple-400 hover:scale-105'
                }`}
              >
                {/* Preview gradient */}
                <div
                  className="h-20 w-full"
                  style={{
                    background: `linear-gradient(135deg, 
                      hsl(${preset.filters.hue}, ${50 + preset.filters.saturation / 2}%, ${50 + preset.filters.brightness / 2}%),
                      hsl(${preset.filters.hue + 60}, ${50 + preset.filters.saturation / 2}%, ${40 + preset.filters.brightness / 2}%)
                    )`
                  }}
                />
                
                <div className="p-2 bg-gray-800">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-sm">{preset.icon}</span>
                    <h4 className="text-xs font-semibold truncate">{preset.name}</h4>
                  </div>
                  <p className="text-[10px] text-gray-400 line-clamp-2">{preset.description}</p>
                </div>

                {currentColorPreset === preset.id && (
                  <div className="absolute top-1 right-1 bg-purple-500 rounded-full p-1">
                    <Zap className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Aspect Ratio Tab */}
        <TabsContent value="aspect-ratio" className="space-y-3 mt-3">
          <div>
            <Label className="text-xs text-gray-400 mb-2 block">Category</Label>
            <div className="flex flex-wrap gap-1">
              {['all', 'social', 'professional', 'cinematic'].map((cat) => (
                <Button
                  key={cat}
                  size="sm"
                  variant={aspectCategory === cat ? 'default' : 'outline'}
                  onClick={() => setAspectCategory(cat as any)}
                  className="text-xs px-2 py-1 h-7"
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1">
            {filteredAspectTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => onApplyAspectRatio?.(template)}
                className={`relative cursor-pointer rounded-lg border-2 transition-all duration-200 overflow-hidden group ${
                  currentAspectRatio === template.id
                    ? 'border-purple-500 ring-2 ring-purple-500 scale-105'
                    : 'border-gray-600 hover:border-purple-400 hover:scale-105'
                }`}
              >
                {/* Aspect ratio preview */}
                <div className="h-24 w-full bg-gray-700 flex items-center justify-center p-3">
                  <div
                    className="border-2 border-purple-400 bg-gray-600"
                    style={{
                      width: template.ratio === '1:1' ? '60px' : template.ratio === '9:16' ? '40px' : template.ratio === '21:9' ? '80px' : '70px',
                      height: template.ratio === '1:1' ? '60px' : template.ratio === '9:16' ? '70px' : template.ratio === '21:9' ? '35px' : '40px'
                    }}
                  />
                </div>
                
                <div className="p-2 bg-gray-800">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-sm">{template.icon}</span>
                    <h4 className="text-xs font-semibold truncate">{template.name}</h4>
                  </div>
                  <p className="text-[10px] text-purple-400 font-mono mb-1">{template.ratio}</p>
                  <p className="text-[10px] text-gray-400 line-clamp-1">{template.description}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {template.platforms.slice(0, 2).map((platform, idx) => (
                      <span key={idx} className="text-[9px] bg-gray-700 px-1 py-0.5 rounded">
                        {platform}
                      </span>
                    ))}
                  </div>
                </div>

                {currentAspectRatio === template.id && (
                  <div className="absolute top-1 right-1 bg-purple-500 rounded-full p-1">
                    <Zap className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Brand Kit Tab */}
        <TabsContent value="brand-kit" className="space-y-3 mt-3">
          <div className="space-y-2">
            {defaultBrandKits.map((brandKit) => (
              <div
                key={brandKit.id}
                onClick={() => onApplyBrandKit?.(brandKit)}
                className={`cursor-pointer rounded-lg border-2 transition-all duration-200 overflow-hidden ${
                  currentBrandKit === brandKit.id
                    ? 'border-purple-500 ring-2 ring-purple-500'
                    : 'border-gray-600 hover:border-purple-400'
                }`}
              >
                <div className="p-3 bg-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold">{brandKit.name}</h4>
                    {currentBrandKit === brandKit.id && (
                      <Zap className="h-4 w-4 text-purple-400" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mb-3">{brandKit.description}</p>
                  
                  {/* Color palette */}
                  <div className="flex gap-1 mb-2">
                    {brandKit.colors.map((color) => (
                      <div
                        key={color.id}
                        className="w-8 h-8 rounded border border-gray-600"
                        style={{ backgroundColor: color.hex }}
                        title={color.name}
                      />
                    ))}
                  </div>
                  
                  {/* Fonts */}
                  <div className="text-xs text-gray-500">
                    Fonts: {brandKit.fonts.map(f => f.name).join(', ')}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => {
              // TODO: Open custom brand kit creator
              alert('Custom brand kit creator coming soon!')
            }}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Create Custom Brand Kit
          </Button>
        </TabsContent>

        {/* Transitions Tab */}
        <TabsContent value="transitions" className="space-y-3 mt-3">
          <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1">
            {transitionPresets.map((transition) => (
              <div
                key={transition.id}
                onClick={() => onApplyTransition?.(transition)}
                className="cursor-pointer rounded-lg border-2 border-gray-600 hover:border-purple-400 transition-all duration-200 overflow-hidden group hover:scale-105"
              >
                <div className="h-16 w-full bg-gradient-to-r from-gray-700 via-purple-600 to-gray-700 flex items-center justify-center">
                  <span className="text-2xl">{transition.icon}</span>
                </div>
                
                <div className="p-2 bg-gray-800">
                  <h4 className="text-xs font-semibold mb-1">{transition.name}</h4>
                  <p className="text-[10px] text-gray-400 line-clamp-2">{transition.description}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[9px] text-purple-400">{transition.duration}s</span>
                    <span className="text-[9px] bg-gray-700 px-1 py-0.5 rounded">{transition.type}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
