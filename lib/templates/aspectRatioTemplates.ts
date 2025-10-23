/**
 * Professional Aspect Ratio Templates
 * Pre-built templates for common video formats
 */

export interface AspectRatioTemplate {
  id: string
  name: string
  ratio: string
  width: number
  height: number
  description: string
  icon: string
  platforms: string[]
  category: 'social' | 'professional' | 'cinematic'
}

export const aspectRatioTemplates: AspectRatioTemplate[] = [
  // Social Media Templates
  {
    id: 'instagram-square',
    name: 'Instagram Square',
    ratio: '1:1',
    width: 1080,
    height: 1080,
    description: 'Perfect for Instagram feed posts',
    icon: '⬜',
    platforms: ['Instagram', 'Facebook'],
    category: 'social'
  },
  {
    id: 'instagram-story',
    name: 'Instagram Story',
    ratio: '9:16',
    width: 1080,
    height: 1920,
    description: 'Vertical format for Stories and Reels',
    icon: '📱',
    platforms: ['Instagram', 'TikTok', 'Snapchat'],
    category: 'social'
  },
  {
    id: 'youtube-standard',
    name: 'YouTube Standard',
    ratio: '16:9',
    width: 1920,
    height: 1080,
    description: 'Standard widescreen format',
    icon: '🎬',
    platforms: ['YouTube', 'Vimeo', 'LinkedIn'],
    category: 'professional'
  },
  {
    id: 'tiktok-vertical',
    name: 'TikTok Vertical',
    ratio: '9:16',
    width: 1080,
    height: 1920,
    description: 'Optimized for TikTok videos',
    icon: '🎵',
    platforms: ['TikTok', 'YouTube Shorts'],
    category: 'social'
  },
  {
    id: 'twitter-landscape',
    name: 'Twitter Landscape',
    ratio: '16:9',
    width: 1280,
    height: 720,
    description: 'Landscape format for Twitter/X',
    icon: '🐦',
    platforms: ['Twitter/X', 'LinkedIn'],
    category: 'social'
  },
  {
    id: 'linkedin-video',
    name: 'LinkedIn Video',
    ratio: '16:9',
    width: 1920,
    height: 1080,
    description: 'Professional video format',
    icon: '💼',
    platforms: ['LinkedIn', 'Corporate'],
    category: 'professional'
  },
  
  // Professional Templates
  {
    id: 'presentation-hd',
    name: 'Presentation HD',
    ratio: '16:9',
    width: 1920,
    height: 1080,
    description: 'High-definition presentation format',
    icon: '📊',
    platforms: ['PowerPoint', 'Keynote', 'Google Slides'],
    category: 'professional'
  },
  {
    id: 'presentation-4k',
    name: 'Presentation 4K',
    ratio: '16:9',
    width: 3840,
    height: 2160,
    description: 'Ultra HD presentation format',
    icon: '🖥️',
    platforms: ['Professional Displays'],
    category: 'professional'
  },
  {
    id: 'webinar-standard',
    name: 'Webinar Standard',
    ratio: '16:9',
    width: 1280,
    height: 720,
    description: 'Optimized for webinars and meetings',
    icon: '👥',
    platforms: ['Zoom', 'Teams', 'Meet'],
    category: 'professional'
  },
  
  // Cinematic Templates
  {
    id: 'cinematic-wide',
    name: 'Cinematic Wide',
    ratio: '21:9',
    width: 2560,
    height: 1080,
    description: 'Ultra-wide cinematic format',
    icon: '🎥',
    platforms: ['Cinema', 'Professional Video'],
    category: 'cinematic'
  },
  {
    id: 'cinema-scope',
    name: 'CinemaScope',
    ratio: '2.39:1',
    width: 2048,
    height: 858,
    description: 'Classic anamorphic widescreen',
    icon: '🎞️',
    platforms: ['Cinema', 'Film'],
    category: 'cinematic'
  },
  {
    id: 'imax',
    name: 'IMAX',
    ratio: '1.43:1',
    width: 1430,
    height: 1000,
    description: 'IMAX theater format',
    icon: '🎭',
    platforms: ['IMAX', 'Premium Cinema'],
    category: 'cinematic'
  }
]

export const getTemplateByRatio = (ratio: string): AspectRatioTemplate | undefined => {
  return aspectRatioTemplates.find(t => t.ratio === ratio)
}

export const getTemplatesByCategory = (category: AspectRatioTemplate['category']): AspectRatioTemplate[] => {
  return aspectRatioTemplates.filter(t => t.category === category)
}

export const getTemplatesByPlatform = (platform: string): AspectRatioTemplate[] => {
  return aspectRatioTemplates.filter(t => 
    t.platforms.some(p => p.toLowerCase().includes(platform.toLowerCase()))
  )
}
