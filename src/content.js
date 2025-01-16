import React from 'react';
import ReactDOM from 'react-dom';
import { Camera, BarChart2, ChevronUp, ChevronDown } from 'lucide-react';

const MahjongAIAssistant = () => {
  const [analysis, setAnalysis] = React.useState(null);
  const [isCapturing, setIsCapturing] = React.useState(false);
  const [isPanelExpanded, setIsPanelExpanded] = React.useState(false);

  const captureScreen = async () => {
    setIsCapturing(true);
    try {
      const canvas = document.querySelector("canvas");
      if (!canvas) {
        showNotification("キャンバスが見つかりません", "error");
        setIsCapturing(false);
        return;
      }

      let dataUrl;

      // WebGLの場合の特別な処理
      const gl = canvas.getContext("webgl") || canvas.getContext("webgl2");
      if (gl) {
        // 現在のフレームバッファの内容を新しいキャンバスにコピー
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext('2d');

        // 描画を待つ
        await new Promise(resolve => requestAnimationFrame(resolve));

        // WebGLキャンバスの内容を2Dキャンバスにコピー
        tempCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height);

        // 一時的な2DキャンバスからデータURLを取得
        dataUrl = tempCanvas.toDataURL("image/png");
      } else {
        // 通常の2Dキャンバスの場合
        dataUrl = canvas.toDataURL("image/png");
      }

      // background.jsに送信
      chrome.runtime.sendMessage({
        action: "processCanvasImage",
        imageData: dataUrl
      }, function(response) {
        setIsCapturing(false);
        if (chrome.runtime.lastError) {
          showNotification("エラー: " + chrome.runtime.lastError.message, "error");
          return;
        }

        if (response && response.success) {
          showNotification("キャプチャ成功！分析を開始します", "success");
          analyzeHand();
        } else {
          showNotification("キャプチャに失敗しました", "error");
        }
      });
    } catch (error) {
      console.error("Capture error:", error);
      showNotification("キャプチャ中にエラーが発生しました: " + error.message, "error");
      setIsCapturing(false);
    }
  };

  const analyzeHand = () => {
    showNotification("分析中...", "info");
    chrome.runtime.sendMessage({ action: "analyzeHand" }, function(response) {
      if (response && response.success) {
        setAnalysis(response.data);
        showNotification("分析が完了しました", "success");
      } else {
        showNotification("分析に失敗しました", "error");
      }
    });
  };

  React.useEffect(() => {
    // ゲーム画面のリサイズは行わない
    // 代わりに、ゲーム画面の周りにUIを配置
  }, [isPanelExpanded]);

  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* 上部バー */}
      <div className="absolute top-0 left-0 right-0 bg-white bg-opacity-80 p-2 flex justify-between items-center pointer-events-auto">
        <h2 className="text-xl font-bold">Mahjong AI Assistant</h2>
        <button
          className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center ${isCapturing ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={captureScreen}
          disabled={isCapturing}
        >
          <Camera className="mr-2" size={20} />
          {isCapturing ? 'Capturing...' : 'Capture'}
        </button>
      </div>

      {/* 下部パネル */}
      <div className={`absolute bottom-0 left-0 right-0 bg-white bg-opacity-80 transition-all duration-300 ease-in-out pointer-events-auto ${isPanelExpanded ? 'h-48' : 'h-12'}`}>
        <button
          className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full p-2 bg-blue-500 text-white rounded-t-lg"
          onClick={() => setIsPanelExpanded(!isPanelExpanded)}
        >
          {isPanelExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </button>
        
        <div className="p-2 h-full overflow-auto">
          {isPanelExpanded && analysis && (
            <div className="flex space-x-4">
              <div>
                <h3 className="font-bold text-lg">Hand Analysis</h3>
                <p>Tiles: {analysis.handAnalysis.recognizedTiles.join(', ')}</p>
                <p>Shanten: {analysis.handAnalysis.shanten}</p>
              </div>
              <div>
                <h3 className="font-bold text-lg">AI Suggestion</h3>
                <p>Discard: {analysis.aiSuggestion.discardTile}</p>
              </div>
              <div>
                <h3 className="font-bold text-lg">Waiting Tiles</h3>
                <p>{analysis.waitingTiles.join(', ')}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  Object.assign(notification.style, {
    position: "fixed",
    top: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    padding: "12px 24px",
    backgroundColor: type === "error" ? "#F44336" : type === "success" ? "#4CAF50" : "#2196F3",
    color: "white",
    borderRadius: "4px",
    boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
    zIndex: "10000",
    fontFamily: "Arial, sans-serif",
    fontSize: "14px"
  });

  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transition = "opacity 0.3s ease-out";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function initializeUI() {
  const root = document.createElement('div');
  root.id = 'mahjong-ai-root';
  document.body.appendChild(root);

  ReactDOM.render(
    <React.StrictMode>
      <MahjongAIAssistant />
    </React.StrictMode>,
    root
  );
}

// Initialize the UI when the content script is injected
initializeUI();