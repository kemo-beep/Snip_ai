export interface BackgroundSettings {
    type: 'wallpaper' | 'gradient' | 'color' | 'image'
    wallpaperIndex: number
    wallpaperUrl: string
    blurAmount: number
    padding: number
    borderRadius: number
    shadowIntensity: number
    backgroundColor: string
    gradientColors: string[]
}

export const getBackgroundStyle = (backgroundSettings: BackgroundSettings): React.CSSProperties => {
    const { type, wallpaperIndex, wallpaperUrl, blurAmount, backgroundColor, gradientColors } = backgroundSettings

    let backgroundStyle: React.CSSProperties = {}

    switch (type) {
        case 'wallpaper':
            if (wallpaperUrl) {
                backgroundStyle = {
                    backgroundImage: `url(${wallpaperUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                }
            } else {
                // Fallback to gradient if no URL
                backgroundStyle = {
                    background: `linear-gradient(45deg, 
            hsl(${wallpaperIndex * 24}, 70%, 60%), 
            hsl(${wallpaperIndex * 24 + 120}, 70%, 60%), 
            hsl(${wallpaperIndex * 24 + 240}, 70%, 60%)
          )`
                }
            }
            break
        case 'gradient':
            backgroundStyle = {
                background: `linear-gradient(45deg, ${gradientColors[0]}, ${gradientColors[1]})`
            }
            break
        case 'color':
            backgroundStyle = {
                backgroundColor: backgroundColor
            }
            break
        case 'image':
            // For now, just use a placeholder
            backgroundStyle = {
                background: 'linear-gradient(45deg, #667eea 0%, #764ba2 100%)'
            }
            break
    }

    // Apply blur only to the background layer
    if (blurAmount > 0) {
        backgroundStyle.filter = `blur(${blurAmount * 0.1}px)`
    }

    return backgroundStyle
}

export const getShadowStyle = (backgroundSettings: BackgroundSettings): React.CSSProperties => {
    const { shadowIntensity } = backgroundSettings
    if (shadowIntensity === 0) return {}

    // Calculate shadow based on intensity (0-100)
    const blur = Math.round(shadowIntensity * 0.8) // 0-80px
    const spread = Math.round(shadowIntensity * 0.2) // 0-20px
    const opacity = Math.min(shadowIntensity / 100 * 0.5, 0.5) // 0-0.5

    return {
        boxShadow: `0 ${Math.round(shadowIntensity * 0.3)}px ${blur}px ${spread}px rgba(0, 0, 0, ${opacity})`
    }
}

export const getDefaultBackgroundSettings = (): BackgroundSettings => ({
    type: 'wallpaper',
    wallpaperIndex: 0,
    wallpaperUrl: '',
    blurAmount: 0,
    padding: 3,
    borderRadius: 12,
    shadowIntensity: 0,
    backgroundColor: '#000000',
    gradientColors: ['#ff6b6b', '#4ecdc4']
})
