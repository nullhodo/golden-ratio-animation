import { appState, uiState, historyState } from './state.js';
import { palettes } from './constants.js';
import { saveCurrentStateToHistory, triggerUndo, triggerRedo } from './history.js';
import { exportHighResolutionImage, startVideoRecording, stopVideoRecording, loadSettingsFromJSONC } from './export.js';

export function buildUserInterface() {
    const containerElement = document.getElementById('tp-container');
    uiState.tweakpaneInstance = new Tweakpane.Pane({
        title: 'p5.js Tools',
        container: containerElement,
    });

    const addTooltipToBlade = (bladeElement, tooltipText) => {
        setTimeout(() => {
            if (
                bladeElement &&
                bladeElement.controller_ &&
                bladeElement.controller_.view &&
                bladeElement.controller_.view.element
            ) {
                bladeElement.controller_.view.element.setAttribute(
                    'title',
                    tooltipText
                );
            }
        }, 100);
    };

    const folderMain = uiState.tweakpaneInstance.addFolder({ title: 'Main Settings' });

    const bindingSpeed = folderMain.addInput(appState, 'animationSpeed', {
        min: 0.1,
        max: 3.0,
        step: 0.1,
        label: 'Speed',
    });
    addTooltipToBlade(bindingSpeed, 'アニメーションの再生速度を変更します');

    const bindingSize = folderMain.addInput(appState, 'baseSize', {
        min: 100,
        max: 1000,
        step: 10,
        label: 'Base Size',
    });
    addTooltipToBlade(bindingSize, '黄金長方形の基準となる高さを変更します');

    const bindingDebug = folderMain.addInput(appState, 'debugMode', {
        label: 'Debug Mode',
    });
    addTooltipToBlade(bindingDebug, 'デバッグ情報の表示をON/OFFします');

    const folderColors = uiState.tweakpaneInstance.addFolder({
        title: 'Colors & Palette',
    });

    const paletteOptions = { 'Initial (B&W)': -1 };
    palettes.forEach((pal, index) => {
        paletteOptions[pal.title] = index;
    });
    const bindingPalette = folderColors.addInput(appState, 'paletteIndex', {
        options: paletteOptions,
        label: 'Palette',
    });
    addTooltipToBlade(bindingPalette, 'カラーパレットを手動で選択します');

    bindingPalette.on('change', () => {
        updatePaletteDisplay();
        applySelectedPaletteColors();
    });

    const paletteDisplayBlade = folderColors.addSeparator();
    uiState.paletteDisplayContainer = document.createElement('div');
    uiState.paletteDisplayContainer.style.display = 'flex';
    uiState.paletteDisplayContainer.style.justifyContent = 'space-between';
    uiState.paletteDisplayContainer.style.padding = '8px 16px';
    uiState.paletteDisplayContainer.style.backgroundColor = 'rgba(0,0,0,0.2)';
    uiState.paletteDisplayContainer.style.borderRadius = '4px';
    uiState.paletteDisplayContainer.style.marginTop = '4px';
    uiState.paletteDisplayContainer.title = '現在のパレットに含まれる色';

    setTimeout(() => {
        if (paletteDisplayBlade.controller_.view.element) {
            paletteDisplayBlade.controller_.view.element.appendChild(
                uiState.paletteDisplayContainer
            );
            updatePaletteDisplay();
        }
    }, 100);

    const btnRandomPalette = folderColors.addButton({
        title: 'Randomize Palette Color',
    });
    addTooltipToBlade(
        btnRandomPalette,
        '選択中のパレットからランダムに色を再配置します'
    );
    btnRandomPalette.on('click', applyRandomColorsFromCurrentPalette);

    folderColors.addSeparator();

    const bindingBgColor = folderColors.addInput(appState, 'backgroundColor', {
        label: 'Background',
    });
    addTooltipToBlade(bindingBgColor, '背景色を変更します');
    const bindingRectColor = folderColors.addInput(appState, 'rectangleColor', {
        label: 'Rectangle',
    });
    addTooltipToBlade(bindingRectColor, '長方形の色を変更します');
    const bindingLineColor = folderColors.addInput(appState, 'lineColor', {
        label: 'Line / Stroke',
    });
    addTooltipToBlade(bindingLineColor, '線の色を変更します');
    const bindingTextColor = folderColors.addInput(appState, 'textColor', {
        label: 'Text',
    });
    addTooltipToBlade(bindingTextColor, 'テキストの色を変更します');

    const folderStyle = uiState.tweakpaneInstance.addFolder({ title: 'Style' });

    const bindingSpiral = folderStyle.addInput(appState, 'showSpiral', {
        label: 'Show Spiral',
    });
    addTooltipToBlade(bindingSpiral, '黄金螺旋の表示をON/OFFします');

    const bindingSpiralZoom = folderStyle.addInput(appState, 'spiralZoom', {
        label: 'Spiral Zoom',
    });
    addTooltipToBlade(
        bindingSpiralZoom,
        '対数螺旋の中心を軸にして回転・拡大し、自然なズームを描画します'
    );

    const bindingReverseZoom = folderStyle.addInput(appState, 'reverseZoom', {
        label: 'Reverse Zoom',
    });
    addTooltipToBlade(
        bindingReverseZoom,
        'アニメーションを逆再生し、内側へ吸い込まれるようにします'
    );

    const bindingFont = folderStyle.addInput(appState, 'fontFamily', {
        options: {
            Cinzel: 'Cinzel',
            'Cormorant Garamond': 'Cormorant Garamond',
            'Playfair Display': 'Playfair Display',
            'Libre Baskerville': 'Libre Baskerville',
            'EB Garamond': 'EB Garamond',
        },
        label: 'Font',
    });
    addTooltipToBlade(bindingFont, 'テキストのフォントを変更します');
    bindingFont.on('change', () => {
        document.body.style.fontFamily = `'${appState.fontFamily}', serif`;
    });

    const bindingStroke = folderStyle.addInput(appState, 'strokeWidth', {
        min: 1,
        max: 20,
        step: 1,
        label: 'Stroke Width',
    });
    addTooltipToBlade(bindingStroke, '線の太さを変更します');
    const bindingTextSize = folderStyle.addInput(appState, 'textSize', {
        min: 10,
        max: 100,
        step: 1,
        label: 'Text Size',
    });
    addTooltipToBlade(bindingTextSize, 'テキストのサイズを変更します');

    const folderExport = uiState.tweakpaneInstance.addFolder({
        title: 'Export & File',
    });

    const btnExportImage = folderExport.addButton({
        title: 'Export High-Res Image',
    });
    addTooltipToBlade(
        btnExportImage,
        'レイアウトを維持したまま高解像度で画像を書き出します'
    );
    btnExportImage.on('click', exportHighResolutionImage);

    const btnStartRecord = folderExport.addButton({
        title: 'Start Recording (R)',
    });
    addTooltipToBlade(
        btnStartRecord,
        '60fps高ビットレートで動画の録画を開始します'
    );
    btnStartRecord.on('click', startVideoRecording);

    const btnStopRecord = folderExport.addButton({
        title: 'Stop Recording (S)',
    });
    addTooltipToBlade(btnStopRecord, '動画の録画を停止し、保存します');
    btnStopRecord.on('click', stopVideoRecording);

    const btnLoadJson = folderExport.addButton({ title: 'Load JSON Settings' });
    addTooltipToBlade(
        btnLoadJson,
        '前回書き出したjsoncファイルを読み込み、スケッチを再現します'
    );
    btnLoadJson.on('click', loadSettingsFromJSONC);

    const folderUtils = uiState.tweakpaneInstance.addFolder({ title: 'Utilities' });

    const btnRandomAll = folderUtils.addButton({
        title: 'Randomize All Parameters',
    });
    addTooltipToBlade(btnRandomAll, 'すべてのパラメータをランダムに設定します');
    btnRandomAll.on('click', randomizeAllParameters);

    const containerUndoRedo = folderUtils.addFolder({
        title: 'History',
        expanded: true,
    });
    const btnUndo = containerUndoRedo.addButton({ title: 'Undo' });
    addTooltipToBlade(btnUndo, '1つ前の状態に戻します');
    btnUndo.on('click', triggerUndo);

    const btnRedo = containerUndoRedo.addButton({ title: 'Redo' });
    addTooltipToBlade(btnRedo, '1つ進めた状態にします');
    btnRedo.on('click', triggerRedo);

    uiState.tweakpaneInstance.on('change', (event) => {
        if (!historyState.isUpdating && !event.last) {
            clearTimeout(window.historyDebounceTimer);
            window.historyDebounceTimer = setTimeout(() => {
                saveCurrentStateToHistory();
            }, 500);
        }
    });

    updatePaletteDisplay();
}

export function toggleUserInterface() {
    uiState.isVisible = !uiState.isVisible;
    const containerElement = document.getElementById('tp-container');
    containerElement.style.display = uiState.isVisible ? 'block' : 'none';
}

export function updatePaletteDisplay() {
    if (!uiState.paletteDisplayContainer) return;
    uiState.paletteDisplayContainer.innerHTML = '';

    let displayColors = [];
    if (appState.paletteIndex === -1) {
        displayColors = [
            { name: 'BG', hex: '#FAFAFA' },
            { name: 'Rect', hex: '#FFFFFF' },
            { name: 'Stroke', hex: '#111111' },
        ];
    } else {
        const currentPaletteObj = palettes[appState.paletteIndex];
        if (currentPaletteObj && currentPaletteObj.colors) {
            displayColors = currentPaletteObj.colors;
        }
    }

    displayColors.forEach((colorItem) => {
        const colorBox = document.createElement('div');
        colorBox.style.width = '24px';
        colorBox.style.height = '24px';
        colorBox.style.backgroundColor = colorItem.hex;
        colorBox.style.borderRadius = '4px';
        colorBox.style.border = '1px solid rgba(100,100,100,0.5)';
        colorBox.style.cursor = 'help';
        colorBox.title = `${colorItem.name} (${colorItem.hex})`;
        uiState.paletteDisplayContainer.appendChild(colorBox);
    });
}

export function applySelectedPaletteColors() {
    if (appState.paletteIndex === -1) {
        appState.backgroundColor = '#FAFAFA';
        appState.rectangleColor = 'rgba(255,255,255,0)';
        appState.lineColor = '#111111';
        appState.textColor = '#111111';
    } else {
        const currentPaletteColors = palettes[appState.paletteIndex].colors;
        if (currentPaletteColors.length > 0)
            appState.backgroundColor =
                currentPaletteColors[0 % currentPaletteColors.length].hex;
        if (currentPaletteColors.length > 1)
            appState.rectangleColor =
                currentPaletteColors[1 % currentPaletteColors.length].hex;
        if (currentPaletteColors.length > 2)
            appState.lineColor =
                currentPaletteColors[2 % currentPaletteColors.length].hex;
        if (currentPaletteColors.length > 3)
            appState.textColor =
                currentPaletteColors[3 % currentPaletteColors.length].hex;
    }

    uiState.tweakpaneInstance.refresh();
    saveCurrentStateToHistory();
}

export function applyRandomColorsFromCurrentPalette() {
    const currentPaletteColors = palettes[appState.paletteIndex].colors;
    const totalColorsCount = currentPaletteColors.length;

    if (totalColorsCount === 0) return;

    const backgroundIndex = Math.floor(Math.random() * totalColorsCount);
    appState.backgroundColor = currentPaletteColors[backgroundIndex].hex;

    const availableColorsForObjects = currentPaletteColors.filter(
        (_, index) => index !== backgroundIndex
    );
    const sourceColors =
        availableColorsForObjects.length > 0
            ? availableColorsForObjects
            : currentPaletteColors;

    appState.rectangleColor =
        sourceColors[Math.floor(Math.random() * sourceColors.length)].hex;
    appState.lineColor =
        sourceColors[Math.floor(Math.random() * sourceColors.length)].hex;
    appState.textColor =
        sourceColors[Math.floor(Math.random() * sourceColors.length)].hex;

    uiState.tweakpaneInstance.refresh();
    saveCurrentStateToHistory();
}

export function randomizeAllParameters() {
    appState.animationSpeed = random(0.5, 2.0);
    appState.baseSize = random(200, 600);
    appState.strokeWidth = random(2, 10);
    appState.textSize = random(20, 60);

    appState.paletteIndex = Math.floor(Math.random() * palettes.length);
    updatePaletteDisplay();
    applyRandomColorsFromCurrentPalette();

    uiState.tweakpaneInstance.refresh();
    saveCurrentStateToHistory();
}

