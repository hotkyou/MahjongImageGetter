let lastCapturedImage = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "processCanvasImage") {
        try {
            lastCapturedImage = request.imageData;
            sendResponse({ success: true });
        } catch (error) {
            console.error("Error processing canvas image:", error);
            sendResponse({ success: false, error: error.message });
        }
        return true;
    }

    if (request.action === "analyzeHand") {
        if (!lastCapturedImage) {
            sendResponse({ success: false, error: "No image captured" });
            return true;
        }

        // 分析用APIにPOSTリクエストを送信
        fetch("http://0.0.0.0:8000/analyze", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                image: lastCapturedImage
            })
        })
        .then(response => response.json())
        .then(data => {
            sendResponse({ success: true, data: data });
        })
        .catch(error => {
            console.error("Analysis error:", error);
            sendResponse({ success: false, error: error.message });
        });

        return true;
    }
});