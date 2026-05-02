import { GOLDEN_RATIO, SPIRAL_B } from './constants.js';
import { appState, animState } from './state.js';
import { easeInOutCubic, easeOutCubic, formatRatio } from './utils.js';

export function drawExactLogarithmicSpiral(
    ctx,
    rectWidth,
    rectHeight,
    startTheta,
    endTheta,
    offsetX = 0,
    offsetY = 0,
    initialRot = 0
) {
    ctx.push();
    ctx.noFill();

    // 1. 対数螺旋の中心（極）の座標を長方形のサイズから計算
    // 黄金長方形の左上を原点とした場合の極の相対位置
    const poleX = ((GOLDEN_RATIO + 1) * rectHeight) / (2 * (GOLDEN_RATIO + 2));
    const poleY = (GOLDEN_RATIO * rectHeight) / (2 * (GOLDEN_RATIO + 2));

    // 描画系の中心(長方形の中心)から極までのオフセットベクトル
    const vecToPoleX = poleX - rectWidth / 2;
    const vecToPoleY = poleY - rectHeight / 2;

    // 2. スケール係数 a の算出
    // 螺旋が長方形の角（左下）を通過するように a を逆算
    // dir=0 (初期状態)の場合、一番外側の曲線は theta = pi (180度)付近で左の辺に接する
    // 厳密には、内接するのではなく「正方形の対角線の角を通る」ように設定
    // ここでは、極から左下角までの距離を用いて a を決定する
    // 角の座標(中心座標系): x = -rectWidth/2, y = rectHeight/2
    const dx = -rectWidth / 2 - vecToPoleX;
    const dy = rectHeight / 2 - vecToPoleY;
    const distToCorner = Math.sqrt(dx * dx + dy * dy);

    // 左下角を通る時の theta を特定
    // 極から見た左下角の角度を atan2 で取得
    let angleToCorner = Math.atan2(dy, dx);
    // 螺旋は theta が増加すると外側に広がる方向で定義する
    // ここでの調整は数学的な厳密性と描画方向のマッチングを行う

    // 簡易的かつ視覚的に正方形の分割と一致する a と オフセット角 theta_offset を設定
    // 螺旋が角 (x=-W/2, y=H/2) を通る時の theta を 0 と仮定して a を決める
    // a = distToCorner

    // よりエレガントな方法: 黄金長方形の性質を利用
    // 極から一番外側の長方形の長辺(上辺)までの垂直距離を r0 とし、
    // 螺旋が長方形の辺に直交するような角度設定ではなく、
    // 「正方形に内接する四分円」を「対数螺旋」で近似するため、
    // theta が pi/2 進むごとにスケールが phi 倍になる性質を利用し、
    // 特定の角度で長方形の各辺に接するように a と位相 theta_0 を調整する

    // 極座標系での極の位置(Canvas中心座標系)
    const cx = vecToPoleX + offsetX;
    const cy = vecToPoleY + offsetY;

    // 螺旋が上辺に接するための条件などから a を解析的に求めることができるが、
    // Canvas上で黄金長方形の分割線に沿って描画するため、
    // 幾何学的に決定された頂点 (例えば左上の点 -rectWidth/2, -rectHeight/2)
    // などを基準点とする

    // この実装では、極から外側の境界までの距離に基づいて a を決定
    // 螺旋の方程式: r(t) = a * e^(b*t)
    // パラメータ t は角度

    // 位相調整: 螺旋の向きを合わせる
    // dir=0の時、螺旋は左から右下へ巻いていく
    // 時計回りに巻くように t を負の方向に進めるか、sin/cos の符号を反転させる

    // a の決定: 極から下辺までの距離
    const distToBottom = rectHeight / 2 - vecToPoleY;
    // 螺旋が下辺に接するときの t を t_bottom とすると、
    // r(t_bottom) * sin(t_bottom) = distToBottom
    // これは解析的に解くのが難しいため、境界を通る基準点を利用

    // 極から (rectWidth/2, -rectHeight/2) [右上角] を通る条件
    const refDx = rectWidth / 2 - poleX;
    const refDy = -rectHeight / 2 - poleY; // 左上原点系
    const refDist = Math.hypot(refDx, refDy);
    const refAngle = Math.atan2(refDy, refDx);

    // 位相とスケールの調整 (試行錯誤的に視覚的合致を最適化)
    const a = distToCorner * 0.94; // 調整係数
    const thetaOffset = initialRot + 0.35; // 位相の微調整

    ctx.beginShape();
    // 細かいステップで頂点を打つ
    const step = 0.05;
    for (let t = startTheta; t <= endTheta; t += step) {
        // 対数螺旋の半径
        let r = a * Math.exp(SPIRAL_B * t);

        // 座標計算 (時計回りに巻くため角度の符号等調整)
        // x = r * cos(t + thetaOffset)
        // y = r * sin(t + thetaOffset)
        let px = cx + r * Math.cos(t + thetaOffset);
        let py = cy + r * Math.sin(t + thetaOffset);

        ctx.vertex(px, py);
    }
    ctx.endShape();

    ctx.pop();
}

// --- 旧来の四分円ベースの螺旋関数 (クリッピング用やフォールバック用として維持) ---
export function drawGoldenSpiral(
    ctx,
    cx,
    cy,
    rectWidth,
    rectHeight,
    iterations,
    startStep = 0
) {
    let x = cx - rectWidth / 2;
    let y = cy - rectHeight / 2;
    let w = rectWidth;
    let h = rectHeight;
    let dir = startStep % 4;

    ctx.push();
    ctx.noFill();

    for (let i = 0; i < iterations; i++) {
        let sqSize;
        let arcCx, arcCy, startAngle, endAngle;

        if (dir === 0) {
            sqSize = h;
            arcCx = x + h;
            arcCy = y + h;
            startAngle = PI;
            endAngle = 1.5 * PI;
            ctx.arc(arcCx, arcCy, sqSize * 2, sqSize * 2, startAngle, endAngle);
            x = x + h;
            w = w - h;
        } else if (dir === 1) {
            sqSize = w;
            arcCx = x;
            arcCy = y + w;
            startAngle = 1.5 * PI;
            endAngle = 0;
            ctx.arc(arcCx, arcCy, sqSize * 2, sqSize * 2, startAngle, endAngle);
            y = y + w;
            h = h - w;
        } else if (dir === 2) {
            sqSize = h;
            arcCx = x + w - h;
            arcCy = y;
            startAngle = 0;
            endAngle = 0.5 * PI;
            ctx.arc(arcCx, arcCy, sqSize * 2, sqSize * 2, startAngle, endAngle);
            w = w - h;
        } else if (dir === 3) {
            sqSize = w;
            arcCx = x + w;
            arcCy = y + h - w;
            startAngle = 0.5 * PI;
            endAngle = PI;
            ctx.arc(arcCx, arcCy, sqSize * 2, sqSize * 2, startAngle, endAngle);
            h = h - w;
        }

        dir = (dir + 1) % 4;
    }
    ctx.pop();
}

// 正確な対数螺旋を描画する汎用ラッパー
// 長方形の分割アニメーションに追従させるため、四分円のロジックとの互換性を持たせる
export function drawActiveSpiral(
    ctx,
    cx,
    cy,
    rectWidth,
    rectHeight,
    isFull,
    fadePhase = 1.0,
    isRightRect = false
) {
    if (isFull) {
        drawGoldenSpiral(ctx, cx, cy, rectWidth, rectHeight, 12, 0);
    } else if (isRightRect) {
        drawGoldenSpiral(ctx, cx, cy, rectWidth, rectHeight, 11, 1);
    } else {
        // Fade out single arc
        ctx.push();
        const strokeColor = ctx.color(appState.lineColor);
        strokeColor.setAlpha(255 * fadePhase);
        ctx.stroke(strokeColor);
        drawGoldenSpiral(ctx, cx, cy, rectWidth, rectHeight, 1, 0);
        ctx.pop();
    }
}

export function drawScene(
    graphicsContext,
    targetWidth,
    targetHeight,
    isHighResExport
) {
    graphicsContext.background(appState.backgroundColor);
    graphicsContext.push();
    graphicsContext.translate(targetWidth / 2, targetHeight / 2);

    const scaleFactor = Math.min(targetWidth / 1920, targetHeight / 1080) * 1.5;
    graphicsContext.scale(scaleFactor);

    const baseRectangleHeight = appState.baseSize;
    const baseRectangleWidth = baseRectangleHeight * GOLDEN_RATIO;

    graphicsContext.strokeWeight(appState.strokeWidth);
    graphicsContext.textSize(appState.textSize);
    graphicsContext.textFont(appState.fontFamily);
    graphicsContext.textAlign(graphicsContext.CENTER, graphicsContext.CENTER);
    graphicsContext.rectMode(graphicsContext.CENTER);

    if (animState.activeAnimationState === 1) {
        drawState1(graphicsContext, baseRectangleWidth, baseRectangleHeight);
    } else if (animState.activeAnimationState === 2) {
        drawState2(
            graphicsContext,
            baseRectangleWidth,
            baseRectangleHeight,
            animState.currentStateProgress
        );
    } else if (animState.activeAnimationState === 3) {
        drawState3(
            graphicsContext,
            baseRectangleWidth,
            baseRectangleHeight,
            animState.currentStateProgress
        );
    }

    graphicsContext.pop();

    if (appState.debugMode && !isHighResExport) {
        drawDebugInformation(graphicsContext, targetWidth, targetHeight);
    }
}

export function drawLabelText(ctx, txt, x, y, color, rotation) {
    ctx.push();
    ctx.translate(x, y);
    ctx.rotate(-rotation);
    ctx.fill(color);
    ctx.noStroke();
    ctx.text(txt, 0, 0);
    ctx.pop();
}

export function drawState1(graphicsContext, rectWidth, rectHeight) {
    graphicsContext.push();

    graphicsContext.fill(appState.rectangleColor);
    graphicsContext.stroke(appState.lineColor);
    graphicsContext.strokeWeight(appState.strokeWidth);
    graphicsContext.rect(0, 0, rectWidth, rectHeight);

    if (appState.showSpiral) {
        graphicsContext.stroke(appState.lineColor);
        drawActiveSpiral(graphicsContext, 0, 0, rectWidth, rectHeight, true);
    }

    const marginY = appState.textSize * 0.8;
    const marginX = appState.textSize * 1.6;
    const textColor = graphicsContext.color(appState.textColor);

    drawLabelText(
        graphicsContext,
        '1.618',
        0,
        -rectHeight / 2 - marginY,
        textColor,
        0
    );
    drawLabelText(
        graphicsContext,
        '1.000',
        -rectWidth / 2 - marginX,
        0,
        textColor,
        0
    );

    graphicsContext.pop();
}

export function drawState2(
    graphicsContext,
    rectWidth,
    rectHeight,
    progressValue
) {
    const squareSize = rectHeight;
    const rightRectangleWidth = rectWidth - squareSize;

    let lineProgress = constrain(map(progressValue, 0.0, 0.4, 0.0, 1.0), 0, 1);
    let fadeOutProgress = constrain(
        map(progressValue, 0.5, 1.0, 0.0, 1.0),
        0,
        1
    );

    lineProgress = easeOutCubic(lineProgress);
    const fadeOutAlpha = 1.0 - easeInOutCubic(fadeOutProgress);

    const rightRectX = rectWidth / 2 - rightRectangleWidth / 2;
    const squarePositionX = -rectWidth / 2 + squareSize / 2;
    const hHalf = rectHeight / 2;
    const divX = rightRectX - rightRectangleWidth / 2;

    graphicsContext.push();
    graphicsContext.strokeWeight(appState.strokeWidth);

    if (progressValue < 0.5) {
        graphicsContext.fill(appState.rectangleColor);
        graphicsContext.stroke(appState.lineColor);
        graphicsContext.rect(0, 0, rectWidth, rectHeight);

        if (appState.showSpiral) {
            graphicsContext.stroke(appState.lineColor);
            drawActiveSpiral(
                graphicsContext,
                0,
                0,
                rectWidth,
                rectHeight,
                true
            );
        }

        const lineEnd = -hHalf + rectHeight * lineProgress;
        graphicsContext.line(divX, -hHalf, divX, lineEnd);
    } else {
        const sHalf = squareSize / 2;

        graphicsContext.fill(appState.rectangleColor);
        graphicsContext.noStroke();
        graphicsContext.rect(rightRectX, 0, rightRectangleWidth, rectHeight);

        graphicsContext.stroke(appState.lineColor);
        graphicsContext.noFill();
        graphicsContext.rect(rightRectX, 0, rightRectangleWidth, rectHeight);

        if (appState.showSpiral) {
            graphicsContext.stroke(appState.lineColor);
            drawActiveSpiral(
                graphicsContext,
                rightRectX,
                0,
                rightRectangleWidth,
                rectHeight,
                false,
                1.0,
                true
            );
        }

        if (fadeOutAlpha > 0.001) {
            const sqFill = graphicsContext.color(appState.rectangleColor);
            sqFill.setAlpha(255 * fadeOutAlpha);
            const sqStroke = graphicsContext.color(appState.lineColor);
            sqStroke.setAlpha(255 * fadeOutAlpha);

            graphicsContext.fill(sqFill);
            graphicsContext.noStroke();
            graphicsContext.rect(squarePositionX, 0, squareSize, squareSize);

            graphicsContext.stroke(sqStroke);
            graphicsContext.noFill();
            graphicsContext.beginShape();
            graphicsContext.vertex(squarePositionX + sHalf, -sHalf);
            graphicsContext.vertex(squarePositionX - sHalf, -sHalf);
            graphicsContext.vertex(squarePositionX - sHalf, sHalf);
            graphicsContext.vertex(squarePositionX + sHalf, sHalf);
            graphicsContext.endShape();

            if (appState.showSpiral) {
                drawActiveSpiral(
                    graphicsContext,
                    squarePositionX,
                    0,
                    squareSize,
                    squareSize,
                    false,
                    fadeOutAlpha,
                    false
                );
            }
        }
    }
    graphicsContext.pop();

    const marginY = appState.textSize * 0.8;
    const marginX = appState.textSize * 1.6;
    const baseTextColor = graphicsContext.color(appState.textColor);

    if (progressValue < 0.5) {
        const tw1 = graphicsContext.textWidth('1');
        const tw2 = graphicsContext.textWidth('.618');
        const totalW = tw1 + tw2;
        const startX1 = -totalW / 2 + tw1 / 2;
        const startX2 = totalW / 2 - tw2 / 2;

        const currX1 = graphicsContext.lerp(startX1, squarePositionX, lineProgress);
        const currX2 = graphicsContext.lerp(startX2, rightRectX, lineProgress);

        const oldAlpha = 1.0 - lineProgress;
        if (oldAlpha > 0.001) {
            const oldColor = graphicsContext.color(appState.textColor);
            oldColor.setAlpha(255 * oldAlpha);
            drawLabelText(
                graphicsContext,
                '1',
                currX1,
                -hHalf - marginY,
                oldColor,
                0
            );
            drawLabelText(
                graphicsContext,
                '.618',
                currX2,
                -hHalf - marginY,
                oldColor,
                0
            );
        }

        drawLabelText(
            graphicsContext,
            '1.000',
            squarePositionX - squareSize / 2 - marginX,
            0,
            baseTextColor,
            0
        );

        if (lineProgress > 0.001) {
            const newColor = graphicsContext.color(appState.textColor);
            newColor.setAlpha(255 * lineProgress);

            drawLabelText(
                graphicsContext,
                '1.000',
                currX1,
                -hHalf - marginY,
                newColor,
                0
            );

            drawLabelText(
                graphicsContext,
                '0.618',
                currX2,
                -hHalf - marginY,
                newColor,
                0
            );

            drawLabelText(
                graphicsContext,
                '1.000',
                rightRectX + rightRectangleWidth / 2 + marginX,
                0,
                newColor,
                0
            );
        }
    } else {
        if (fadeOutAlpha > 0.001) {
            const leftColor = graphicsContext.color(appState.textColor);
            leftColor.setAlpha(255 * fadeOutAlpha);
            drawLabelText(
                graphicsContext,
                '1.000',
                squarePositionX,
                -squareSize / 2 - marginY,
                leftColor,
                0
            );
            drawLabelText(
                graphicsContext,
                '1.000',
                squarePositionX - squareSize / 2 - marginX,
                0,
                leftColor,
                0
            );
        }

        drawLabelText(
            graphicsContext,
            '0.618',
            rightRectX,
            -hHalf - marginY,
            baseTextColor,
            0
        );
        drawLabelText(
            graphicsContext,
            '1.000',
            rightRectX + rightRectangleWidth / 2 + marginX,
            0,
            baseTextColor,
            0
        );
    }
}

export function drawState3(
    graphicsContext,
    rectWidth,
    rectHeight,
    progressValue
) {
    const rightRectangleWidth = rectWidth - rectHeight;
    const rightRectanglePositionX = rectWidth / 2 - rightRectangleWidth / 2;

    const t = easeInOutCubic(progressValue);

    let posX, posY, rot, currentW, currentH;

    if (appState.spiralZoom) {
        const cx = ((GOLDEN_RATIO + 1) * rectHeight) / (2 * (GOLDEN_RATIO + 2));
        const cy = (GOLDEN_RATIO * rectHeight) / (2 * (GOLDEN_RATIO + 2));

        const s = Math.pow(GOLDEN_RATIO, t);
        rot = (-t * Math.PI) / 2;

        const startVx = rightRectanglePositionX - cx;
        const startVy = 0 - cy;

        const rotVx = startVx * Math.cos(rot) - startVy * Math.sin(rot);
        const rotVy = startVx * Math.sin(rot) + startVy * Math.cos(rot);

        posX = cx + s * rotVx;
        posY = cy + s * rotVy;

        currentW = rightRectangleWidth * s;
        currentH = rectHeight * s;
    } else {
        posX = graphicsContext.lerp(rightRectanglePositionX, 0, t);
        posY = 0;
        rot = graphicsContext.lerp(0, -Math.PI / 2, t);

        currentW = graphicsContext.lerp(rightRectangleWidth, rectHeight, t);
        currentH = graphicsContext.lerp(rectHeight, rectWidth, t);
    }

    graphicsContext.push();
    graphicsContext.translate(posX, posY);
    graphicsContext.rotate(rot);

    graphicsContext.fill(appState.rectangleColor);
    graphicsContext.stroke(appState.lineColor);
    graphicsContext.strokeWeight(appState.strokeWidth);
    graphicsContext.rect(0, 0, currentW, currentH);

    if (appState.showSpiral) {
        graphicsContext.stroke(appState.lineColor);
        drawActiveSpiral(
            graphicsContext,
            0,
            0,
            currentW,
            currentH,
            false,
            1.0,
            true
        );
    }

    const valTop = graphicsContext.lerp(0.618, 1.0, t);
    const valRight = graphicsContext.lerp(1.0, 1.618, t);

    const marginY = appState.textSize * 0.8;
    const marginX = appState.textSize * 1.6;

    const currentMarginTop = graphicsContext.lerp(marginY, marginX, t);
    const currentMarginRight = graphicsContext.lerp(marginX, marginY, t);

    const textColor = graphicsContext.color(appState.textColor);

    drawLabelText(
        graphicsContext,
        formatRatio(valTop),
        0,
        -currentH / 2 - currentMarginTop,
        textColor,
        rot
    );
    drawLabelText(
        graphicsContext,
        formatRatio(valRight),
        currentW / 2 + currentMarginRight,
        0,
        textColor,
        rot
    );

    graphicsContext.pop();
}

export function drawDebugInformation(
    graphicsContext,
    targetWidth,
    targetHeight
) {
    graphicsContext.push();
    graphicsContext.fill(255);
    graphicsContext.noStroke();
    graphicsContext.textSize(16);
    graphicsContext.textFont('sans-serif');
    graphicsContext.textAlign(graphicsContext.LEFT, graphicsContext.TOP);

    let debugText = `[DEBUG MODE]\n`;
    debugText += `FPS: ${graphicsContext.frameRate().toFixed(1)}\n`;
    debugText += `State: ${animState.activeAnimationState}\n`;
    debugText += `Progress: ${animState.currentStateProgress.toFixed(3)}\n`;
    debugText += `Base Size: ${appState.baseSize}\n`;
    debugText += `Canvas: ${targetWidth}x${targetHeight}`;

    graphicsContext.text(debugText, 20, 20);
    graphicsContext.pop();
}
