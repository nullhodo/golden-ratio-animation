import { appState, animState, recordingState } from './state.js';
import { DURATION_TOTAL, DURATION_STATE1, DURATION_STATE2, DURATION_STATE3 } from './constants.js';
import { buildUserInterface, toggleUserInterface } from './ui.js';
import { saveCurrentStateToHistory } from './history.js';
import { drawScene } from './draw.js';
import { startVideoRecording, stopVideoRecording, updateRecordingIndicator } from './export.js';

window.preload = function() {}

window.setup = function() {
    createCanvas(windowWidth, windowHeight);
    frameRate(60);

    buildUserInterface();
    saveCurrentStateToHistory();
    document
        .getElementById('ui-toggle-button')
        .addEventListener('click', toggleUserInterface);
}

window.draw = function() {
    const frameDeltaTime = recordingState.isActive ? 1000 / 60 : deltaTime;
    updateAnimationLogic(frameDeltaTime);
    drawScene(window, width, height, false);

    if (recordingState.isActive) {
        updateRecordingIndicator();
    }
}

window.windowResized = function() {
    resizeCanvas(windowWidth, windowHeight);
}

window.keyPressed = function() {
    if (key === 'r' || key === 'R') {
        startVideoRecording();
    } else if (key === 's' || key === 'S') {
        stopVideoRecording();
    }
}

function updateAnimationLogic(timeDelta) {
    if (appState.reverseZoom) {
        animState.currentAnimationTime -= timeDelta * appState.animationSpeed;
        if (animState.currentAnimationTime < 0) {
            animState.currentAnimationTime =
                (animState.currentAnimationTime % DURATION_TOTAL) + DURATION_TOTAL;
            animState.currentAnimationTime %= DURATION_TOTAL;
        }
    } else {
        animState.currentAnimationTime += timeDelta * appState.animationSpeed;
        animState.currentAnimationTime %= DURATION_TOTAL;
    }

    if (animState.currentAnimationTime < DURATION_STATE1) {
        animState.activeAnimationState = 1;
        animState.currentStateProgress = animState.currentAnimationTime / DURATION_STATE1;
    } else if (animState.currentAnimationTime < DURATION_STATE1 + DURATION_STATE2) {
        animState.activeAnimationState = 2;
        animState.currentStateProgress =
            (animState.currentAnimationTime - DURATION_STATE1) / DURATION_STATE2;
    } else {
        animState.activeAnimationState = 3;
        animState.currentStateProgress =
            (animState.currentAnimationTime - DURATION_STATE1 - DURATION_STATE2) /
            DURATION_STATE3;
    }
}

/**
 * 正確な対数螺旋を描画する関数
 * 極方程式 r = a * e^(b*theta) に基づく
 * * @param {p5.Graphics} ctx 描画コンテキスト
 * @param {number} rectWidth 基準となる長方形の幅
 * @param {number} rectHeight 基準となる長方形の高さ
 * @param {number} startTheta 螺旋の描画を開始する角度 (ラジアン)
 * @param {number} endTheta 螺旋の描画を終了する角度 (ラジアン)
 * @param {number} offsetX 描画系全体のXオフセット (Stateの移動用)
 * @param {number} offsetY 描画系全体のYオフセット
 * @param {number} initialRot 初期状態(dir=0)に対する螺旋全体の回転補正
 */
