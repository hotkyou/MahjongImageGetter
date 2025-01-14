document.addEventListener("DOMContentLoaded", function () {
    const captureBtn = document.getElementById("captureBtn");
    const analyzeBtn = document.getElementById("analyzeBtn");
    const resultArea = document.getElementById("resultArea");
    let capturedImage = null;

    captureBtn.addEventListener("click", function () {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (tabs[0]) {
                chrome.tabs.captureVisibleTab(tabs[0].windowId, { format: 'png' }, function (dataUrl) {
                    if (chrome.runtime.lastError) {
                        console.error("Error: ", chrome.runtime.lastError.message);
                        resultArea.innerHTML = "キャプチャ中にエラーが発生しました: " + chrome.runtime.lastError.message;
                    } else {
                        capturedImage = dataUrl;
                        analyzeBtn.disabled = false;
                        resultArea.innerHTML = "画像をキャプチャしました。分析を開始できます。";
                    }
                });
            } else {
                console.error("No active tab found");
                resultArea.innerHTML = "アクティブなタブが見つかりません。";
            }
        });
    });

    analyzeBtn.addEventListener("click", function () {
        if (capturedImage) {
            resultArea.innerHTML = "分析中...";
            fetch("http://0.0.0.0:8000/analyze", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ image: capturedImage })
            })
                .then(response => response.json())
                .then(data => {
                    displayAnalysisResult(data);
                })
                .catch(error => {
                    console.error("Error:", error);
                    resultArea.innerHTML = "分析中にエラーが発生しました。";
                });
        }
    });

    function displayAnalysisResult(data) {
        // 既存の結果表示コードは残しつつ、content scriptにもデータを送信
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: 'updateOverlay', data: data});
        });

        // 手牌の表示
        resultHTML +=
            "<p><strong>認識された手牌:</strong> " +
            data.handAnalysis.recognizedTiles.join(", ") +
            "</p>";
        resultHTML +=
            "<p><strong>シャンテン数:</strong> " +
            data.handAnalysis.shanten +
            "</p>";

        // 場の状況
        resultHTML +=
            "<p><strong>自風:</strong> " + data.gameState.playerWind + "</p>";
        resultHTML +=
            "<p><strong>場風:</strong> " + data.gameState.roundWind + "</p>";
        resultHTML +=
            "<p><strong>ドラ表示牌:</strong> " +
            data.gameState.visibleDora.join(", ") +
            "</p>";

        // AIの提案
        resultHTML += "<h4>AIの提案</h4>";
        resultHTML +=
            "<p><strong>切る牌:</strong> " +
            data.aiSuggestion.discardTile +
            "</p>";
        resultHTML +=
            "<p><strong>理由:</strong> " + data.aiSuggestion.reason + "</p>";

        // 待ち牌と役の候補
        resultHTML +=
            "<p><strong>待ち牌:</strong> " +
            data.waitingTiles.join(", ") +
            "</p>";
        resultHTML += "<h4>可能性のある役</h4>";
        resultHTML += "<ul>";
        data.potentialYaku.forEach(yaku => {
            resultHTML +=
                "<li>" +
                yaku.name +
                " (確率: " +
                (yaku.probability * 100).toFixed(1) +
                "%)</li>";
        });
        resultHTML += "</ul>";

        // 追加のアドバイス
        if (data.additionalAdvice) {
            resultHTML += "<h4>追加のアドバイス</h4>";
            resultHTML += "<p>" + data.additionalAdvice + "</p>";
        }

        resultArea.innerHTML = resultHTML;
    }
});