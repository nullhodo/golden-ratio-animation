import { appState, recordingState, uiState, historyState } from './state.js';
import { getFormattedDate, downloadJSONCFile } from './utils.js';
import { drawScene } from './draw.js';
import { saveCurrentStateToHistory } from './history.js';
import { updatePaletteDisplay } from './ui.js';

export function loadSettingsFromJSONC() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.jsonc,.json';
    fileInput.onchange = (eventObject) => {
        const selectedFile = eventObject.target.files[0];
        if (selectedFile) {
            const fileReader = new FileReader();
            fileReader.onload = (readEvent) => {
                try {
                    const rawString = readEvent.target.result;
                    const cleanJsonString = rawString.replace(/\/\/.*$/gm, '');
                    const loadedObject = JSON.parse(cleanJsonString);

                    historyState.isUpdating = true;
                    Object.assign(appState, loadedObject);
                    updatePaletteDisplay();
                    uiState.tweakpaneInstance.refresh();
                    historyState.isUpdating = false;

                    saveCurrentStateToHistory();
                } catch (parseError) {
                    console.error('JSON Parse Error:', parseError);
                    alert(
                        'ファイルの読み込みに失敗しましたフォーマットが正しいか確認してください'
                    );
                }
            };
            fileReader.readAsText(selectedFile);
        }
    };
    fileInput.click();
}

export function exportHighResolutionImage() {
    const aspectTargetRatio = width / height;
    let exportTargetWidth = 3840;
    let exportTargetHeight = Math.floor(exportTargetWidth / aspectTargetRatio);

    if (exportTargetHeight < 1980) {
        exportTargetHeight = 1980;
        exportTargetWidth = Math.floor(exportTargetHeight * aspectTargetRatio);
    }

    const highResGraphics = createGraphics(
        exportTargetWidth,
        exportTargetHeight
    );

    drawScene(highResGraphics, exportTargetWidth, exportTargetHeight, true);

    const timestampString = getFormattedDate();
    const baseFileName = `GoldenRatioSketch_${timestampString}_${exportTargetWidth}x${exportTargetHeight}`;

    save(highResGraphics, `${baseFileName}.jpg`);
    downloadJSONCFile(`${baseFileName}.jsonc`);

    highResGraphics.remove();
}

export function startVideoRecording() {
    if (recordingState.isActive) return;

    const containerElement = document.getElementById('tp-container');
    containerElement.style.display = 'none';
    document.getElementById('ui-toggle-button').style.display = 'none';

    recordingState.chunks = [];

    const canvasElement = document.querySelector('canvas');
    const videoStream = canvasElement.captureStream(60);

    const recorderOptions = {
        mimeType: 'video/webm; codecs=vp9',
        videoBitsPerSecond: 10000000,
    };

    try {
        recordingState.recorder = new MediaRecorder(videoStream, recorderOptions);
    } catch (error) {
        console.warn(
            'vp9 codec not supported, falling back to default.',
            error
        );
        recordingState.recorder = new MediaRecorder(videoStream);
    }

    recordingState.recorder.ondataavailable = (eventObject) => {
        if (eventObject.data && eventObject.data.size > 0) {
            recordingState.chunks.push(eventObject.data);
        }
    };

    recordingState.recorder.onstop = () => {
        const videoBlob = new Blob(recordingState.chunks, { type: 'video/webm' });
        const objectUrl = URL.createObjectURL(videoBlob);

        const timestampString = getFormattedDate();
        const baseFileName = `GoldenRatioSketch_${timestampString}_Video`;

        const downloadLink = document.createElement('a');
        downloadLink.href = objectUrl;
        downloadLink.download = `${baseFileName}.webm`;
        downloadLink.click();

        URL.revokeObjectURL(objectUrl);

        downloadJSONCFile(`${baseFileName}.jsonc`);

        if (uiState.isVisible) {
            containerElement.style.display = 'block';
        }
        document.getElementById('ui-toggle-button').style.display = 'block';
        document.getElementById('recording-indicator').style.display = 'none';
    };

    recordingState.recorder.start();
    recordingState.isActive = true;
    recordingState.startTimestamp = millis();

    document.getElementById('recording-indicator').style.display = 'flex';
}

export function stopVideoRecording() {
    if (!recordingState.isActive) return;
    recordingState.recorder.stop();
    recordingState.isActive = false;
}

export function updateRecordingIndicator() {
    const elapsedMilliseconds = millis() - recordingState.startTimestamp;
    const elapsedSeconds = Math.floor(elapsedMilliseconds / 1000);
    const displayMinutes = String(Math.floor(elapsedSeconds / 60)).padStart(
        2,
        '0'
    );
    const displaySeconds = String(elapsedSeconds % 60).padStart(2, '0');

    document.getElementById('recording-time').textContent =
        `REC ${displayMinutes}:${displaySeconds}`;
}
