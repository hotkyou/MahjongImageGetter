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

        fetch("http://127.0.0.1:8000/analyze", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                image: lastCapturedImage
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log("分析成功:", data);
            sendResponse({ success: true, data: data });
        })
        .catch(error => {
            console.error("分析エラー:", error);
            sendResponse({ success: false, error: error.toString() });
        });

        return true;
    }
});