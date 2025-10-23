/**
 * Professional Transition Presets
 * Pre-built transitions for video editing
 */

export interface TransitionPreset {
  id: string
  name: string
  description: string
  duration: number // in seconds
  type: 'fade' | 'slide' | 'zoom' | 'blur' | 'wipe' | 'dissolve'
  icon: string
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
  parameters?: Record<string, any>
}

export const transitionPresets: TransitionPreset[] = [
  // Fade Transitions
  {
    id: 'fade-black',
    name: 'Fade to Black',
    description: 'Classic fade to black transition',
    duration: 0.5,
    type: 'fade',
    icon: '⚫',
    easing: 'ease-in-out',
    parameters: {
      color: '#000000'
    }
  },
  {
    id: 'fade-white',
    name: 'Fade to White',
    description: 'Bright fade to white transition',
    duration: 0.5,
    type: 'fade',
    icon: '⚪',
    easing: 'ease-in-out',
    parameters: {
      color: '#ffffff'
    }
  },
  {
    id: 'crossfade',
    name: 'Crossfade',
    description: 'Smooth blend between clips',
    duration: 1.0,
    type: 'dissolve',
    icon: '🔄',
    easing: 'ease-in-out'
  },

  // Slide Transitions
  {
    id: 'slide-left',
    name: 'Slide Left',
    description: 'Slide from right to left',
    duration: 0.8,
    type: 'slide',
    icon: '⬅️',
    easing: 'ease-in-out',
    parameters: {
      direction: 'left'
    }
  },
  {
    id: 'slide-right',
    name: 'Slide Right',
    description: 'Slide from left to right',
    duration: 0.8,
    type: 'slide',
    icon: '➡️',
    easing: 'ease-in-out',
    parameters: {
      direction: 'right'
    }
  },
  {
    id: 'slide-up',
    name: 'Slide Up',
    description: 'Slide from bottom to top',
    duration: 0.8,
    type: 'slide',
    icon: '⬆️',
    easing: 'ease-in-out',
    parameters: {
      direction: 'up'
    }
  },
  {
    id: 'slide-down',
    name: 'Slide Down',
    description: 'Slide from top to bottom',
    duration: 0.8,
    type: 'slide',
    icon: '⬇️',
    easing: 'ease-in-out',
    parameters: {
      direction: 'down'
    }
  },

  // Zoom Transitions
  {
    id: 'zoom-in',
    name: 'Zoom In',
    description: 'Zoom into the next clip',
    duration: 0.6,
    type: 'zoom',
    icon: '🔍',
    easing: 'ease-in',
    parameters: {
      scale: 1.5
    }
  },
  {
    id: 'zoom-out',
    name: 'Zoom Out',
    description: 'Zoom out to reveal next clip',
    duration: 0.6,
    type: 'zoom',
    icon: '🔎',
    easing: 'ease-out',
    parameters: {
      scale: 0.5
    }
  },

  // Blur Transitions
  {
    id: 'blur-transition',
    name: 'Blur Transition',
    description: 'Blur out and blur in',
    duration: 0.8,
    type: 'blur',
    icon: '💫',
    easing: 'ease-in-out',
    parameters: {
      maxBlur: 20
    }
  },

  // Wipe Transitions
  {
    id: 'wipe-left',
    name: 'Wipe Left',
    description: 'Wipe from right to left',
    duration: 0.7,
    type: 'wipe',
    icon: '◀️',
    easing: 'linear',
    parameters: {
      direction: 'left'
    }
  },
  {
    id: 'wipe-right',
    name: 'Wipe Right',
    description: 'Wipe from left to right',
    duration: 0.7,
    type: 'wipe',
    icon: '▶️',
    easing: 'linear',
    parameters: {
      direction: 'right'
    }
  },
  {
    id: 'wipe-circle',
    name: 'Circle Wipe',
    description: 'Circular wipe transition',
    duration: 0.8,
    type: 'wipe',
    icon: '⭕',
    easing: 'ease-in-out',
    parameters: {
      shape: 'circle'
    }
  }
]

export const getTransitionsByType = (type: TransitionPreset['type']): TransitionPreset[] => {
  return transitionPresets.filter(t => t.type === type)
}

export const getTransitionById = (id: string): TransitionPreset | undefined => {
  return transitionPresets.find(t => t.id === id)
}

/**
 * Apply transition effect between two frames
 */
export const applyTransition = (
  ctx: CanvasRenderingContext2D,
  fromFrame: ImageData,
  toFrame: ImageData,
  transition: TransitionPreset,
  progress: number // 0 to 1
): void => {
  const width = fromFrame.width
  const height = fromFrame.height

  switch (transition.type) {
    case 'fade':
    case 'dissolve':
      applyFadeTransition(ctx, fromFrame, toFrame, progress)
      break
    case 'slide':
      applySlideTransition(ctx, fromFrame, toFrame, progress, transition.parameters?.direction || 'left')
      break
    case 'zoom':
      applyZoomTransition(ctx, fromFrame, toFrame, progress, transition.parameters?.scale || 1.5)
      break
    case 'blur':
      applyBlurTransition(ctx, fromFrame, toFrame, progress, transition.parameters?.maxBlur || 20)
      break
    case 'wipe':
      applyWipeTransition(ctx, fromFrame, toFrame, progress, transition.parameters?.direction || 'left')
      break
  }
}

function applyFadeTransition(
  ctx: CanvasRenderingContext2D,
  fromFrame: ImageData,
  toFrame: ImageData,
  progress: number
): void {
  const width = fromFrame.width
  const height = fromFrame.height
  const result = ctx.createImageData(width, height)

  for (let i = 0; i < fromFrame.data.length; i += 4) {
    result.data[i] = fromFrame.data[i] * (1 - progress) + toFrame.data[i] * progress
    result.data[i + 1] = fromFrame.data[i + 1] * (1 - progress) + toFrame.data[i + 1] * progress
    result.data[i + 2] = fromFrame.data[i + 2] * (1 - progress) + toFrame.data[i + 2] * progress
    result.data[i + 3] = 255
  }

  ctx.putImageData(result, 0, 0)
}

function applySlideTransition(
  ctx: CanvasRenderingContext2D,
  fromFrame: ImageData,
  toFrame: ImageData,
  progress: number,
  direction: string
): void {
  const width = fromFrame.width
  const height = fromFrame.height

  ctx.clearRect(0, 0, width, height)

  let fromX = 0, fromY = 0, toX = 0, toY = 0

  switch (direction) {
    case 'left':
      fromX = -width * progress
      toX = width * (1 - progress)
      break
    case 'right':
      fromX = width * progress
      toX = -width * (1 - progress)
      break
    case 'up':
      fromY = -height * progress
      toY = height * (1 - progress)
      break
    case 'down':
      fromY = height * progress
      toY = -height * (1 - progress)
      break
  }

  ctx.putImageData(fromFrame, fromX, fromY)
  ctx.putImageData(toFrame, toX, toY)
}

function applyZoomTransition(
  ctx: CanvasRenderingContext2D,
  fromFrame: ImageData,
  toFrame: ImageData,
  progress: number,
  scale: number
): void {
  const width = fromFrame.width
  const height = fromFrame.height

  ctx.clearRect(0, 0, width, height)

  // Zoom out from frame
  const fromScale = 1 + (scale - 1) * progress
  const fromWidth = width * fromScale
  const fromHeight = height * fromScale
  const fromX = (width - fromWidth) / 2
  const fromY = (height - fromHeight) / 2

  const tempCanvas = document.createElement('canvas')
  tempCanvas.width = width
  tempCanvas.height = height
  const tempCtx = tempCanvas.getContext('2d')!
  tempCtx.putImageData(fromFrame, 0, 0)

  ctx.globalAlpha = 1 - progress
  ctx.drawImage(tempCanvas, fromX, fromY, fromWidth, fromHeight)

  // Zoom in to frame
  const toScale = scale - (scale - 1) * progress
  const toWidth = width * toScale
  const toHeight = height * toScale
  const toX = (width - toWidth) / 2
  const toY = (height - toHeight) / 2

  tempCtx.clearRect(0, 0, width, height)
  tempCtx.putImageData(toFrame, 0, 0)

  ctx.globalAlpha = progress
  ctx.drawImage(tempCanvas, toX, toY, toWidth, toHeight)
  ctx.globalAlpha = 1
}

function applyBlurTransition(
  ctx: CanvasRenderingContext2D,
  fromFrame: ImageData,
  toFrame: ImageData,
  progress: number,
  maxBlur: number
): void {
  const width = fromFrame.width
  const height = fromFrame.height

  // Simple blur simulation using opacity blend
  const blurProgress = progress < 0.5 ? progress * 2 : (1 - progress) * 2
  const opacity = 1 - blurProgress * 0.5

  ctx.clearRect(0, 0, width, height)

  if (progress < 0.5) {
    ctx.globalAlpha = opacity
    ctx.putImageData(fromFrame, 0, 0)
  } else {
    ctx.globalAlpha = opacity
    ctx.putImageData(toFrame, 0, 0)
  }

  ctx.globalAlpha = 1
}

function applyWipeTransition(
  ctx: CanvasRenderingContext2D,
  fromFrame: ImageData,
  toFrame: ImageData,
  progress: number,
  direction: string
): void {
  const width = fromFrame.width
  const height = fromFrame.height

  ctx.putImageData(fromFrame, 0, 0)

  ctx.save()

  switch (direction) {
    case 'left':
      ctx.rect(0, 0, width * progress, height)
      break
    case 'right':
      ctx.rect(width * (1 - progress), 0, width * progress, height)
      break
    case 'up':
      ctx.rect(0, 0, width, height * progress)
      break
    case 'down':
      ctx.rect(0, height * (1 - progress), width, height * progress)
      break
  }

  ctx.clip()
  ctx.putImageData(toFrame, 0, 0)
  ctx.restore()
}
