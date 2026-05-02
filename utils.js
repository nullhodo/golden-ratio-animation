import { appState } from './state.js';

export function getFormattedDate() {
    const currentDate = new Date();
    const yearStr = currentDate.getFullYear();
    const monthStr = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(currentDate.getDate()).padStart(2, '0');
    const hourStr = String(currentDate.getHours()).padStart(2, '0');
    const minuteStr = String(currentDate.getMinutes()).padStart(2, '0');
    const secondStr = String(currentDate.getSeconds()).padStart(2, '0');
    return `${yearStr}_${monthStr}${dayStr}_${hourStr}${minuteStr}${secondStr}`;
}

export function easeInOutCubic(progressValue) {
    return progressValue < 0.5
        ? 4 * progressValue * progressValue * progressValue
        : 1 - Math.pow(-2 * progressValue + 2, 3) / 2;
}

export function easeOutCubic(progressValue) {
    return 1 - Math.pow(1 - progressValue, 3);
}

export function formatRatio(val) {
    return val.toFixed(3);
}

export function generateJSONCString() {
    const lines = [
        `{`,
        `  "animationSpeed": ${appState.animationSpeed}, // アニメーションの再生速度`,
        `  "baseSize": ${appState.baseSize}, // 黄金長方形の基準となる高さ`,
        `  "paletteIndex": ${appState.paletteIndex}, // 選択中のカラーパレットのインデックス`,
        `  "backgroundColor": "${appState.backgroundColor}", // 背景色`,
        `  "rectangleColor": "${appState.rectangleColor}", // 長方形の塗りつぶし色`,
        `  "lineColor": "${appState.lineColor}", // 長方形の枠線の色`,
        `  "textColor": "${appState.textColor}", // 表示されるテキストの色`,
        `  "strokeWidth": ${appState.strokeWidth}, // 枠線の太さ`,
        `  "textSize": ${appState.textSize}, // テキストのフォントサイズ`,
        `  "fontFamily": "${appState.fontFamily}", // フォント名`,
        `  "showSpiral": ${appState.showSpiral}, // 黄金螺旋の表示フラグ`,
        `  "spiralZoom": ${appState.spiralZoom}, // 螺旋中心によるズーム`,
        `  "reverseZoom": ${appState.reverseZoom}, // 逆再生(縮小)アニメーション`,
        `  "debugMode": ${appState.debugMode} // デバッグ情報の表示フラグ`,
        `}`,
    ];
    return lines.join('\n');
}

export function downloadJSONCFile(fileName) {
    const jsoncContent = generateJSONCString();
    const blobObject = new Blob([jsoncContent], { type: 'application/json' });
    const objectUrl = URL.createObjectURL(blobObject);

    const downloadLink = document.createElement('a');
    downloadLink.href = objectUrl;
    downloadLink.download = fileName;
    downloadLink.click();

    URL.revokeObjectURL(objectUrl);
}

