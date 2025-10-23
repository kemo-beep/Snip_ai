export const VIDEO_EDITOR_CONSTANTS = {
    // Video loading timeouts
    LOAD_TIMEOUT: 3000,
    IMMEDIATE_FALLBACK_DELAY: 500,
    LONGER_FALLBACK_DELAY: 1500,

    // Default values
    DEFAULT_ASPECT_RATIO: '16:9',
    DEFAULT_DURATION: 60,
    DEFAULT_BORDER_RADIUS: 12,
    DEFAULT_PADDING: 3,

    // Webcam overlay defaults
    DEFAULT_WEBCAM_POSITION: { x: 2, y: 2 },
    DEFAULT_WEBCAM_SIZE: { width: 100, height: 100 },
    DEFAULT_WEBCAM_BORDER_COLOR: '#3b82f6',
    DEFAULT_WEBCAM_BORDER_WIDTH: 2,

    // Annotation defaults
    DEFAULT_ANNOTATION_COLOR: '#ff0000',
    DEFAULT_ANNOTATION_STROKE_WIDTH: 3,
    DEFAULT_ANNOTATION_FONT_SIZE: 24,

    // Timeline defaults
    TIMELINE_HEIGHT: 220,

    // Keyboard shortcuts
    KEYBOARD_SHORTCUTS: {
        SPACE: ' ',
        ARROW_LEFT: 'ArrowLeft',
        ARROW_RIGHT: 'ArrowRight',
        ESCAPE: 'Escape',
        EXPORT: 'e'
    },

    // Seek amounts
    REWIND_AMOUNT: 5,
    FAST_FORWARD_AMOUNT: 5,

    // Video container constraints
    MIN_VIDEO_WIDTH: 400,
    MIN_VIDEO_HEIGHT: 250,
    MAX_VIDEO_WIDTH_PERCENT: 95,
    MAX_VIDEO_HEIGHT_PERCENT: 95
} as const

export const VIDEO_EDITOR_STYLES = {
    // Container styles
    MAIN_CONTAINER: "fixed inset-0 bg-gray-900 flex flex-col z-50 overflow-hidden",
    TOOLBAR: "bg-gray-800/95 backdrop-blur-sm border-b border-gray-700 px-3 py-2 shadow-lg",
    VIDEO_PREVIEW: "flex-1 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 flex items-center justify-center min-h-0 p-6 relative overflow-hidden",
    SIDEBAR: "w-64 bg-gray-800 border-l border-gray-700 flex min-h-0",
    TIMELINE: "flex-shrink-0",

    // Video container styles
    VIDEO_CONTAINER: "relative overflow-hidden border-2 transition-all duration-500 ease-out z-10",
    VIDEO_CONTAINER_DRAGGING: "scale-[1.02] border-purple-500/50 shadow-2xl shadow-purple-500/20",
    VIDEO_CONTAINER_NORMAL: "border-gray-700/50 shadow-xl hover:border-gray-600/50",

    // Ambient background
    AMBIENT_BACKGROUND: "absolute inset-0 opacity-30",
    AMBIENT_CIRCLE_1: "absolute top-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse",
    AMBIENT_CIRCLE_2: "absolute bottom-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse",

    // Loading state
    LOADING_OVERLAY: "absolute inset-0 bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl flex items-center justify-center z-30",
    LOADING_SPINNER: "h-20 w-20 mx-auto",
    LOADING_SPINNER_1: "h-20 w-20 animate-spin text-purple-400",
    LOADING_SPINNER_2: "absolute inset-0 h-20 w-20 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin",
    LOADING_SPINNER_3: "absolute inset-0 h-20 w-20 mx-auto border-4 border-blue-400/20 border-t-blue-400 rounded-full animate-spin",

    // Button styles
    BUTTON_GHOST: "text-gray-400 hover:text-white h-7 px-2 transition-all duration-200 hover:bg-gray-700 hover:scale-105",
    BUTTON_EXPORT: "bg-purple-600 hover:bg-purple-700 text-white h-7 px-3 transition-all duration-200 hover:scale-105 hover:shadow-lg disabled:opacity-50",
    BUTTON_ICON: "text-gray-400 hover:text-white h-7 w-7 p-0",

    // Info overlay
    INFO_OVERLAY: "bg-black/60 backdrop-blur-md text-white text-xs px-2.5 py-1.5 rounded-lg border border-white/10 shadow-lg"
} as const
