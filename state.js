export const appState = {
    animationSpeed: 1.0,
    baseSize: 400,

    paletteIndex: -1,
    backgroundColor: '#FAFAFA',
    rectangleColor: 'rgba(255,255,255,0)',
    lineColor: '#111111',
    textColor: '#111111',

    strokeWidth: 2,
    textSize: 32,
    fontFamily: 'Cinzel',
    showSpiral: true,
    spiralZoom: true,
    reverseZoom: false,

    debugMode: false,
};


export const animState = {
    currentAnimationTime: 0,
    activeAnimationState: 1,
    currentStateProgress: 0.0,
};

export const historyState = {
    stack: [],
    index: -1,
    isUpdating: false,
};

export const recordingState = {
    recorder: null,
    chunks: [],
    isActive: false,
    startTimestamp: 0,
};

export const uiState = {
    tweakpaneInstance: null,
    isVisible: true,
    paletteDisplayContainer: null,
};
