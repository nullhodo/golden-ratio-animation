import { appState, historyState, uiState } from './state.js';
import { updatePaletteDisplay } from './ui.js';

export function saveCurrentStateToHistory() {
    if (historyState.isUpdating) return;

    const currentStateString = JSON.stringify(appState);

    historyState.stack = historyState.stack.slice(
        0,
        historyState.index + 1
    );
    historyState.stack.push(currentStateString);
    historyState.index++;
}

export function triggerUndo() {
    if (historyState.index > 0) {
        historyState.index--;
        applyStateFromString(historyState.stack[historyState.index]);
    }
}

export function triggerRedo() {
    if (historyState.index < historyState.stack.length - 1) {
        historyState.index++;
        applyStateFromString(historyState.stack[historyState.index]);
    }
}

export function applyStateFromString(stateString) {
    try {
        const parsedState = JSON.parse(stateString);
        historyState.isUpdating = true;
        Object.assign(appState, parsedState);
        updatePaletteDisplay();
        uiState.tweakpaneInstance.refresh();
        historyState.isUpdating = false;
    } catch (error) {
        console.error('Failed to apply state:', error);
    }
}

