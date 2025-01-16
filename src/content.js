// Content script for Mahjong AI Assistant
class MahjongAIAssistant {
    constructor() {
        this.isCapturing = false;
        this.isPanelExpanded = false;
        this.analysis = null;
        
        this.initializeUI();
        this.attachEventListeners();
    }

    initializeUI() {
        // Create main container
        const container = document.createElement('div');
        container.className = 'mahjong-ai fixed inset-0 pointer-events-none';
        
        // Create top bar
        const topBar = document.createElement('div');
        topBar.className = 'absolute top-0 left-0 right-0 bg-white bg-opacity-80 p-2 flex justify-between items-center pointer-events-auto';
        
        const title = document.createElement('h2');
        title.className = 'text-xl font-bold';
        title.textContent = 'Mahjong AI Assistant';
        
        this.captureButton = document.createElement('button');
        this.captureButton.className = 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center transition-all';
        this.captureButton.innerHTML = `
            <span class="mr-2">📷</span>
            <span>Capture</span>
        `;
        
        topBar.appendChild(title);
        topBar.appendChild(this.captureButton);
        
        // Create bottom panel
        const bottomPanel = document.createElement('div');
        bottomPanel.className = 'absolute bottom-0 left-0 right-0 bg-white bg-opacity-80 transition-all duration-300 ease-in-out pointer-events-auto h-12';
        this.bottomPanel = bottomPanel;
        
        this.toggleButton = document.createElement('button');
        this.toggleButton.className = 'absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full p-2 bg-blue-500 text-white rounded-t-lg';
        this.toggleButton.textContent = '▲';
        
        this.analysisContainer = document.createElement('div');
        this.analysisContainer.className = 'p-2 h-full overflow-auto hidden';
        
        bottomPanel.appendChild(this.toggleButton);
        bottomPanel.appendChild(this.analysisContainer);
        
        // Append everything to container
        container.appendChild(topBar);
        container.appendChild(bottomPanel);
        
        // Add to document
        document.body.appendChild(container);
    }

    attachEventListeners() {
        this.captureButton.addEventListener('click', () => this.captureWebGLCanvas());
        this.toggleButton.addEventListener('click', () => this.togglePanel());
    }

    async captureWebGLCanvas() {
        if (this.isCapturing) return;
        
        this.isCapturing = true;
        this.updateCaptureButton(true);
        
        try {
            const canvas = document.querySelector('canvas');
            if (!canvas) {
                this.showNotification('キャンバスが見つかりません', 'error');
                return;
            }

            // WebGLコンテキストの取得
            const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
            if (gl) {
                // フレームの描画を待つ
                await new Promise(resolve => {
                    requestAnimationFrame(() => {
                        requestAnimationFrame(resolve);
                    });
                });

                // WebGLの状態を保存
                gl.finish();
                
                // 一時的なキャンバスにコピー
                const width = canvas.width;
                const height = canvas.height;
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = width;
                tempCanvas.height = height;
                const tempCtx = tempCanvas.getContext('2d');
                
                tempCtx.drawImage(canvas, 0, 0, width, height);
                const dataUrl = tempCanvas.toDataURL('image/png');

                this.sendCaptureToBackground(dataUrl);
            } else {
                // 通常のキャンバスの場合
                const dataUrl = canvas.toDataURL('image/png');
                this.sendCaptureToBackground(dataUrl);
            }
        } catch (error) {
            console.error('Capture error:', error);
            this.showNotification('キャプチャエラー: ' + error.message, 'error');
            this.isCapturing = false;
            this.updateCaptureButton(false);
        }
    }

    sendCaptureToBackground(dataUrl) {
        chrome.runtime.sendMessage(
            {
                action: 'processCanvasImage',
                imageData: dataUrl
            },
            (response) => {
                this.isCapturing = false;
                this.updateCaptureButton(false);

                if (chrome.runtime.lastError) {
                    this.showNotification('エラー: ' + chrome.runtime.lastError.message, 'error');
                    return;
                }

                if (response && response.success) {
                    this.showNotification('キャプチャ成功！分析を開始します', 'success');
                    this.analyzeHand();
                } else {
                    this.showNotification('キャプチャに失敗しました', 'error');
                }
            }
        );
    }

    analyzeHand() {
        this.showNotification('分析中...', 'info');
        chrome.runtime.sendMessage(
            { action: 'analyzeHand' },
            (response) => {
                if (response && response.success) {
                    this.analysis = response.data;
                    this.updateAnalysisDisplay();
                    this.showNotification('分析が完了しました', 'success');
                } else {
                    this.showNotification('分析に失敗しました', 'error');
                }
            }
        );
    }

    updateAnalysisDisplay() {
        if (!this.analysis) return;

        const analysisHTML = `
            <div class="space-y-4 p-4">
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-white bg-opacity-90 rounded-lg p-4 shadow">
                        <h3 class="font-bold text-lg text-gray-800 mb-2">手牌分析</h3>
                        <div class="space-y-2">
                            <p class="text-gray-700">認識された牌: ${this.analysis.handAnalysis.recognizedTiles.join(', ')}</p>
                            <p class="text-gray-700">シャンテン数: ${this.analysis.handAnalysis.shanten}</p>
                            <p class="text-gray-700">効率: ${this.analysis.handAnalysis.efficiency}%</p>
                            <p class="text-gray-700">可能な役: ${this.analysis.handAnalysis.yaku.join(', ')}</p>
                        </div>
                    </div>

                    <div class="bg-white bg-opacity-90 rounded-lg p-4 shadow">
                        <h3 class="font-bold text-lg text-gray-800 mb-2">AI提案</h3>
                        <div class="space-y-2">
                            <p class="text-gray-700">切る牌: <span class="font-bold">${this.analysis.aiSuggestion.discardTile}</span></p>
                            <p class="text-gray-700">${this.analysis.system.message}</p>
                            <p class="text-gray-700">和了確率: ${this.analysis.aiSuggestion.winningProbability}%</p>
                        </div>
                    </div>

                    <div class="bg-white bg-opacity-90 rounded-lg p-4 shadow">
                        <h3 class="font-bold text-lg text-gray-800 mb-2">待ち牌</h3>
                        <div class="space-y-2">
                            <p class="text-gray-700">${this.analysis.waitingTiles.join(', ')}</p>
                        </div>
                    </div>

                    <div class="bg-white bg-opacity-90 rounded-lg p-4 shadow">
                        <h3 class="font-bold text-lg text-gray-800 mb-2">危険度分析</h3>
                        <div class="space-y-2">
                            <p class="text-gray-700">危険度: ${this.analysis.dangerAnalysis.dangerLevel}</p>
                            <p class="text-gray-700">危険な牌: ${this.analysis.dangerAnalysis.dangerousTiles.join(', ')}</p>
                            <p class="text-gray-700">安全な牌: ${this.analysis.dangerAnalysis.safeTiles.join(', ')}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.analysisContainer.innerHTML = analysisHTML;
    }

    togglePanel() {
        this.isPanelExpanded = !this.isPanelExpanded;
        this.bottomPanel.style.height = this.isPanelExpanded ? '12rem' : '3rem';
        this.toggleButton.textContent = this.isPanelExpanded ? '▼' : '▲';
        this.analysisContainer.classList.toggle('hidden', !this.isPanelExpanded);
    }

    updateCaptureButton(isCapturing) {
        this.captureButton.disabled = isCapturing;
        this.captureButton.classList.toggle('opacity-50', isCapturing);
        this.captureButton.classList.toggle('cursor-not-allowed', isCapturing);
        this.captureButton.querySelector('span:last-child').textContent = 
            isCapturing ? 'Capturing...' : 'Capture';
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 24px',
            backgroundColor:
                type === 'error' ? '#F44336' :
                type === 'success' ? '#4CAF50' :
                '#2196F3',
            color: 'white',
            borderRadius: '4px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            zIndex: '10000',
            fontFamily: 'Arial, sans-serif',
            fontSize: '14px'
        });

        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s ease-out';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Initialize when the content script is injected
new MahjongAIAssistant();