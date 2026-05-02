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

    // p5.jsが生成するキャンバスを明示的に取得する（TweakpaneのCanvasと混同しないため）
    const canvasElement =
        document.querySelector('canvas.p5Canvas') ||
        document.querySelector('#defaultCanvas0');
    console.log('[REC] canvas found:', canvasElement);
    console.log('[REC] canvas size:', canvasElement.width, 'x', canvasElement.height);

    const videoStream = canvasElement.captureStream(60);
    console.log('[REC] stream tracks:', videoStream.getTracks());

    // サポートされているmimeTypeを探す
    const candidates = [
        'video/webm; codecs=vp9',
        'video/webm; codecs=vp8',
        'video/webm',
    ];
    let selectedMime = '';
    for (const mime of candidates) {
        if (MediaRecorder.isTypeSupported(mime)) {
            selectedMime = mime;
            break;
        }
    }
    console.log('[REC] selected mimeType:', selectedMime || '(browser default)');

    const recorderOptions = selectedMime
        ? { mimeType: selectedMime, videoBitsPerSecond: 10_000_000 }
        : { videoBitsPerSecond: 10_000_000 };

    try {
        recordingState.recorder = new MediaRecorder(videoStream, recorderOptions);
    } catch (error) {
        console.warn('[REC] MediaRecorder init failed, using bare defaults:', error);
        recordingState.recorder = new MediaRecorder(videoStream);
    }

    console.log('[REC] recorder state after init:', recordingState.recorder.state);
    console.log('[REC] recorder mimeType:', recordingState.recorder.mimeType);

    recordingState.recorder.ondataavailable = (eventObject) => {
        console.log('[REC] ondataavailable fired, data.size:', eventObject.data?.size);
        if (eventObject.data && eventObject.data.size > 0) {
            recordingState.chunks.push(eventObject.data);
            console.log('[REC] chunk pushed, total chunks:', recordingState.chunks.length);
        }
    };

    recordingState.recorder.onerror = (e) => {
        console.error('[REC] recorder error:', e);
    };

    recordingState.recorder.onstop = () => {
        console.log('[REC] recorder stopped, total chunks:', recordingState.chunks.length);
        const totalBytes = recordingState.chunks.reduce((sum, c) => sum + c.size, 0);
        console.log('[REC] total data bytes:', totalBytes);

        const blobMime = recordingState.recorder.mimeType || 'video/webm';
        const videoBlob = new Blob(recordingState.chunks, { type: blobMime });
        console.log('[REC] blob size:', videoBlob.size, 'type:', videoBlob.type);

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

    // 100ms ごとにデータを強制収集
    recordingState.recorder.start(100);
    console.log('[REC] recorder.start(100) called, state:', recordingState.recorder.state);

    recordingState.isActive = true;
    recordingState.startTimestamp = millis();

    document.getElementById('recording-indicator').style.display = 'flex';
}

export function stopVideoRecording() {
    if (!recordingState.isActive) return;
    console.log('[REC] stop called, chunks so far:', recordingState.chunks.length);
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
