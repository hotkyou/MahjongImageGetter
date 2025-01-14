function initializeUI() {
    let canvas = document.querySelector("canvas");
    if (!canvas) return null;

    // Create and style overlay container
    let overlay = document.createElement("div");
    overlay.id = "mahjongAIOverlay";
    Object.assign(overlay.style, {
        position: "absolute",
        top: canvas.offsetTop + "px",
        left: canvas.offsetLeft + "px",
        width: canvas.offsetWidth + "px",
        height: canvas.offsetHeight + "px",
        pointerEvents: "none",
        zIndex: "1000",
        display: "flex",
        justifyContent: "flex-start",
        alignItems: "flex-start",
        padding: "20px"
    });
    document.body.appendChild(overlay);

    // Create control panel with improved styling
    let controlPanel = document.createElement("div");
    controlPanel.id = "mahjongAIControlPanel";
    Object.assign(controlPanel.style, {
        position: "absolute",
        top: canvas.offsetTop + 20 + "px",
        left: canvas.offsetLeft + 20 + "px",
        zIndex: "1001",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        borderRadius: "8px",
        padding: "10px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        display: "flex",
        gap: "10px"
    });

    const buttonStyle = `
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
        font-weight: bold;
    `;

    controlPanel.innerHTML = `
        <button id="captureBtn" style="${buttonStyle} background-color: #4CAF50; color: white;">画面をキャプチャ</button>
        <button id="analyzeBtn" style="${buttonStyle} background-color: #2196F3; color: white;" disabled>手牌を分析</button>
    `;
    
    document.body.appendChild(controlPanel);

    // Add event listeners
    document.getElementById("captureBtn").addEventListener("click", captureCanvas);
    document.getElementById("analyzeBtn").addEventListener("click", analyzeHand);

    return { overlay, controlPanel };
}

async function captureCanvas() {
    try {
        const canvas = document.querySelector("canvas");
        if (!canvas) {
            showNotification("キャンバスが見つかりません", "error");
            return;
        }

        // WebGLの場合の特別な処理
        if (canvas.getContext("webgl") || canvas.getContext("webgl2")) {
            // preserveDrawingBuffer: trueが設定されていない場合の対応
            await new Promise(resolve => requestAnimationFrame(resolve));
        }

        // canvasの内容をデータURLとして取得
        const dataUrl = canvas.toDataURL("image/png");

        // background.jsに送信
        chrome.runtime.sendMessage({
            action: "processCanvasImage",
            imageData: dataUrl
        }, function(response) {
            if (chrome.runtime.lastError) {
                showNotification("エラー: " + chrome.runtime.lastError.message, "error");
                return;
            }

            if (response && response.success) {
                document.getElementById("analyzeBtn").disabled = false;
                showNotification("キャプチャ成功！分析を開始できます", "success");
            } else {
                showNotification("キャプチャに失敗しました", "error");
            }
        });
    } catch (error) {
        console.error("Capture error:", error);
        showNotification("キャプチャ中にエラーが発生しました: " + error.message, "error");
    }
}

function analyzeHand() {
    showNotification("分析中...", "info");
    chrome.runtime.sendMessage({ action: "analyzeHand" }, function(response) {
        if (response && response.success) {
            updateAnalysisDisplay(response.data);
        } else {
            showNotification("分析に失敗しました", "error");
        }
    });
}

function updateAnalysisDisplay(data) {
    const overlay = document.getElementById("mahjongAIOverlay");
    if (!overlay) return;

    const analysisHTML = `
        <div style="
            background: rgba(0, 0, 0, 0.85);
            color: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            font-family: Arial, sans-serif;
            max-width: 400px;
            backdrop-filter: blur(5px);
        ">
            <h3 style="
                margin: 0 0 15px 0;
                color: #4CAF50;
                font-size: 18px;
                border-bottom: 2px solid #4CAF50;
                padding-bottom: 8px;
            ">分析結果</h3>
            
            <div style="margin-bottom: 15px;">
                <div style="
                    background: rgba(255, 255, 255, 0.1);
                    padding: 10px;
                    border-radius: 6px;
                    margin-bottom: 10px;
                ">
                    <div style="color: #4CAF50; font-weight: bold; margin-bottom: 5px;">手牌</div>
                    <div style="font-size: 16px;">${data.handAnalysis.recognizedTiles.join(", ")}</div>
                </div>
                
                <div style="
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 10px;
                    margin-bottom: 15px;
                ">
                    <div style="
                        background: rgba(255, 255, 255, 0.1);
                        padding: 10px;
                        border-radius: 6px;
                    ">
                        <div style="color: #2196F3; font-weight: bold;">シャンテン数</div>
                        <div style="font-size: 20px; text-align: center;">${data.handAnalysis.shanten}</div>
                    </div>
                    <div style="
                        background: rgba(255, 255, 255, 0.1);
                        padding: 10px;
                        border-radius: 6px;
                    ">
                        <div style="color: #FF9800; font-weight: bold;">推奨打牌</div>
                        <div style="font-size: 20px; text-align: center;">${data.aiSuggestion.discardTile}</div>
                    </div>
                </div>
            </div>

            <div style="
                background: rgba(255, 255, 255, 0.1);
                padding: 10px;
                border-radius: 6px;
                margin-bottom: 15px;
            ">
                <div style="color: #E91E63; font-weight: bold; margin-bottom: 5px;">待ち牌</div>
                <div>${data.waitingTiles.join(", ")}</div>
            </div>
        </div>
    `;

    overlay.innerHTML = analysisHTML;
}

function showNotification(message, type = "info") {
    const colors = {
        success: "#4CAF50",
        error: "#F44336",
        info: "#2196F3"
    };

    const notification = document.createElement("div");
    Object.assign(notification.style, {
        position: "fixed",
        top: "20px",
        right: "20px",
        padding: "12px 24px",
        backgroundColor: colors[type],
        color: "white",
        borderRadius: "4px",
        boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
        zIndex: "10000",
        animation: "fadeIn 0.3s ease-in-out",
        fontFamily: "Arial, sans-serif",
        fontSize: "14px"
    });

    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = "fadeOut 0.3s ease-in-out";
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement("style");
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-20px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; transform: translateY(0); }
        to { opacity: 0; transform: translateY(-20px); }
    }

    #captureBtn:hover, #analyzeBtn:hover {
        filter: brightness(1.1);
        transform: translateY(-1px);
    }

    #captureBtn:active, #analyzeBtn:active {
        transform: translateY(0px);
    }

    #analyzeBtn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;
document.head.appendChild(style);

initializeUI();