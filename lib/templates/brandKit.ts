/**
 * Brand Kit Integration
 * Manage brand assets like logos, colors, fonts, and watermarks
 */

export interface BrandColor {
  id: string
  name: string
  hex: string
  usage: 'primary' | 'secondary' | 'accent' | 'background' | 'text'
}

export interface BrandFont {
  id: string
  name: string
  family: string
  weights: number[]
  usage: 'heading' | 'body' | 'caption'
}

export interface BrandLogo {
  id: string
  name: string
  url: string
  type: 'full' | 'icon' | 'wordmark'
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
  size: 'small' | 'medium' | 'large'
  opacity: number
}

export interface BrandWatermark {
  id: string
  name: string
  url: string
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  size: number // percentage of video width
  opacity: number // 0 to 1
  padding: number // pixels from edge
}

export interface BrandKit {
  id: string
  name: string
  description: string
  colors: BrandColor[]
  fonts: BrandFont[]
  logos: BrandLogo[]
  watermarks: BrandWatermark[]
  defaultSettings: {
    logoPosition: BrandLogo['position']
    logoSize: BrandLogo['size']
    watermarkOpacity: number
    primaryColor: string
    secondaryColor: string
  }
}

// Default brand kit templates
export const defaultBrandKits: BrandKit[] = [
  {
    id: 'tech-startup',
    name: 'Tech Startup',
    description: 'Modern, clean brand kit for tech companies',
    colors: [
      { id: 'primary', name: 'Electric Blue', hex: '#3b82f6', usage: 'primary' },
      { id: 'secondary', name: 'Deep Purple', hex: '#8b5cf6', usage: 'secondary' },
      { id: 'accent', name: 'Cyan', hex: '#06b6d4', usage: 'accent' },
      { id: 'bg', name: 'Dark Gray', hex: '#1f2937', usage: 'background' },
      { id: 'text', name: 'White', hex: '#ffffff', usage: 'text' }
    ],
    fonts: [
      { id: 'heading', name: 'Inter Bold', family: 'Inter', weights: [700, 800], usage: 'heading' },
      { id: 'body', name: 'Inter Regular', family: 'Inter', weights: [400, 500], usage: 'body' }
    ],
    logos: [],
    watermarks: [],
    defaultSettings: {
      logoPosition: 'bottom-right',
      logoSize: 'small',
      watermarkOpacity: 0.7,
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6'
    }
  },
  {
    id: 'creative-agency',
    name: 'Creative Agency',
    description: 'Bold, vibrant brand kit for creative agencies',
    colors: [
      { id: 'primary', name: 'Hot Pink', hex: '#ec4899', usage: 'primary' },
      { id: 'secondary', name: 'Orange', hex: '#f97316', usage: 'secondary' },
      { id: 'accent', name: 'Yellow', hex: '#eab308', usage: 'accent' },
      { id: 'bg', name: 'Black', hex: '#000000', usage: 'background' },
      { id: 'text', name: 'White', hex: '#ffffff', usage: 'text' }
    ],
    fonts: [
      { id: 'heading', name: 'Montserrat Bold', family: 'Montserrat', weights: [700, 900], usage: 'heading' },
      { id: 'body', name: 'Open Sans', family: 'Open Sans', weights: [400, 600], usage: 'body' }
    ],
    logos: [],
    watermarks: [],
    defaultSettings: {
      logoPosition: 'top-left',
      logoSize: 'medium',
      watermarkOpacity: 0.8,
      primaryColor: '#ec4899',
      secondaryColor: '#f97316'
    }
  },
  {
    id: 'corporate',
    name: 'Corporate Professional',
    description: 'Professional brand kit for corporate videos',
    colors: [
      { id: 'primary', name: 'Navy Blue', hex: '#1e3a8a', usage: 'primary' },
      { id: 'secondary', name: 'Steel Gray', hex: '#64748b', usage: 'secondary' },
      { id: 'accent', name: 'Gold', hex: '#d97706', usage: 'accent' },
      { id: 'bg', name: 'Light Gray', hex: '#f1f5f9', usage: 'background' },
      { id: 'text', name: 'Dark Gray', hex: '#1e293b', usage: 'text' }
    ],
    fonts: [
      { id: 'heading', name: 'Roboto Bold', family: 'Roboto', weights: [700], usage: 'heading' },
      { id: 'body', name: 'Roboto Regular', family: 'Roboto', weights: [400, 500], usage: 'body' }
    ],
    logos: [],
    watermarks: [],
    defaultSettings: {
      logoPosition: 'bottom-right',
      logoSize: 'small',
      watermarkOpacity: 0.6,
      primaryColor: '#1e3a8a',
      secondaryColor: '#64748b'
    }
  }
]

/**
 * Apply brand kit colors to video overlay
 */
export const applyBrandColors = (
  element: HTMLElement,
  brandKit: BrandKit,
  colorUsage: BrandColor['usage']
): void => {
  const color = brandKit.colors.find(c => c.usage === colorUsage)
  if (color) {
    element.style.color = color.hex
  }
}

/**
 * Apply brand watermark to canvas
 */
export const applyWatermark = async (
  ctx: CanvasRenderingContext2D,
  watermark: BrandWatermark,
  canvasWidth: number,
  canvasHeight: number
): Promise<void> => {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  
  return new Promise((resolve, reject) => {
    img.onload = () => {
      const watermarkWidth = (canvasWidth * watermark.size) / 100
      const watermarkHeight = (img.height / img.width) * watermarkWidth
      
      let x = watermark.padding
      let y = watermark.padding
      
      switch (watermark.position) {
        case 'top-right':
          x = canvasWidth - watermarkWidth - watermark.padding
          break
        case 'bottom-left':
          y = canvasHeight - watermarkHeight - watermark.padding
          break
        case 'bottom-right':
          x = canvasWidth - watermarkWidth - watermark.padding
          y = canvasHeight - watermarkHeight - watermark.padding
          break
      }
      
      ctx.save()
      ctx.globalAlpha = watermark.opacity
      ctx.drawImage(img, x, y, watermarkWidth, watermarkHeight)
      ctx.restore()
      
      resolve()
    }
    
    img.onerror = reject
    img.src = watermark.url
  })
}

/**
 * Generate thumbnail with brand styling
 */
export const generateBrandedThumbnail = (
  canvas: HTMLCanvasElement,
  brandKit: BrandKit,
  title: string
): string => {
  const ctx = canvas.getContext('2d')!
  const width = canvas.width
  const height = canvas.height
  
  // Apply brand background
  const bgColor = brandKit.colors.find(c => c.usage === 'background')
  if (bgColor) {
    ctx.fillStyle = bgColor.hex
    ctx.fillRect(0, 0, width, height)
  }
  
  // Add gradient overlay
  const primaryColor = brandKit.colors.find(c => c.usage === 'primary')
  const secondaryColor = brandKit.colors.find(c => c.usage === 'secondary')
  
  if (primaryColor && secondaryColor) {
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, primaryColor.hex + '80')
    gradient.addColorStop(1, secondaryColor.hex + '80')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  }
  
  // Add title text
  const textColor = brandKit.colors.find(c => c.usage === 'text')
  if (textColor) {
    ctx.fillStyle = textColor.hex
    ctx.font = 'bold 48px Inter, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    // Add text shadow for readability
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
    ctx.shadowBlur = 10
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2
    
    ctx.fillText(title, width / 2, height / 2)
  }
  
  return canvas.toDataURL('image/png')
}

export const getBrandKitById = (id: string): BrandKit | undefined => {
  return defaultBrandKits.find(kit => kit.id === id)
}

export const createCustomBrandKit = (
  name: string,
  colors: BrandColor[],
  fonts: BrandFont[]
): BrandKit => {
  return {
    id: `custom-${Date.now()}`,
    name,
    description: 'Custom brand kit',
    colors,
    fonts,
    logos: [],
    watermarks: [],
    defaultSettings: {
      logoPosition: 'bottom-right',
      logoSize: 'small',
      watermarkOpacity: 0.7,
      primaryColor: colors.find(c => c.usage === 'primary')?.hex || '#3b82f6',
      secondaryColor: colors.find(c => c.usage === 'secondary')?.hex || '#8b5cf6'
    }
  }
}
