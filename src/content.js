class MahjongAIAssistant {
  constructor() {
      this.isCapturing = false;
      this.analysis = null;
      this.currentView = 'minimal'; // minimal, expanded
      
      this.initializeUI();
      this.attachEventListeners();
  }

  initializeUI() {
      // メインコンテナ
      const container = document.createElement('div');
      container.className = 'mahjong-ai fixed right-4 top-4 pointer-events-auto';
      
      // フローティングパネル
      this.mainPanel = document.createElement('div');
      this.mainPanel.className = 'bg-slate-800 bg-opacity-95 rounded-2xl shadow-lg transition-all duration-300 w-72';
      
      // ヘッダー部分
      const header = document.createElement('div');
      header.className = 'p-4 border-b border-slate-700';
      
      const headerContent = document.createElement('div');
      headerContent.className = 'flex items-center justify-between';
      
      const titleArea = document.createElement('div');
      titleArea.className = 'flex items-center space-x-2';
      
      const title = document.createElement('h2');
      title.className = 'text-lg font-bold text-white';
      title.textContent = '雀AI';
      
      const betaBadge = document.createElement('div');
      betaBadge.className = 'px-2 py-0.5 bg-green-500 text-white text-xs rounded-full';
      betaBadge.textContent = 'Beta';
      
      titleArea.appendChild(title);
      titleArea.appendChild(betaBadge);
      
      this.captureButton = document.createElement('button');
      this.captureButton.className = 'px-3 py-1.5 bg-blue-500 text-white rounded-lg flex items-center space-x-2 hover:bg-blue-600 transition-all text-sm';
      this.captureButton.innerHTML = `
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
          </svg>
          <span>キャプチャ</span>
      `;
      
      headerContent.appendChild(titleArea);
      headerContent.appendChild(this.captureButton);
      header.appendChild(headerContent);
      
      // ミニマル表示用コンテナ
      this.minimalContainer = document.createElement('div');
      this.minimalContainer.className = 'p-4';
      this.minimalContainer.innerHTML = `
          <div class="text-center text-slate-300 text-sm">
              キャプチャボタンを押して手牌を分析
          </div>
      `;
      
      // 詳細分析用コンテナ
      this.analysisContainer = document.createElement('div');
      this.analysisContainer.className = 'hidden';
      
      this.mainPanel.appendChild(header);
      this.mainPanel.appendChild(this.minimalContainer);
      this.mainPanel.appendChild(this.analysisContainer);
      
      container.appendChild(this.mainPanel);
      document.body.appendChild(container);
      
      // ドラッグ機能の追加
      this.setupDraggable(this.mainPanel);
  }

  setupDraggable(element) {
      let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
      const header = element.querySelector('div');
      
      header.onmousedown = dragMouseDown;
      
      function dragMouseDown(e) {
          e.preventDefault();
          pos3 = e.clientX;
          pos4 = e.clientY;
          document.onmouseup = closeDragElement;
          document.onmousemove = elementDrag;
      }
      
      function elementDrag(e) {
          e.preventDefault();
          pos1 = pos3 - e.clientX;
          pos2 = pos4 - e.clientY;
          pos3 = e.clientX;
          pos4 = e.clientY;
          
          const parent = element.parentElement;
          parent.style.top = (parent.offsetTop - pos2) + "px";
          parent.style.right = (parseInt(parent.style.right || 0) + pos1) + "px";
      }
      
      function closeDragElement() {
          document.onmouseup = null;
          document.onmousemove = null;
      }
  }

  attachEventListeners() {
      this.captureButton.addEventListener('click', () => this.captureWebGLCanvas());
  }

  updateAnalysisDisplay() {
      if (!this.analysis) return;

      const createProgressBar = (value, color = 'bg-blue-500') => `
          <div class="flex items-center space-x-2">
              <div class="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div class="${color} h-full rounded-full transition-all duration-300" style="width: ${value}%"></div>
              </div>
              <span class="text-sm font-medium text-slate-300">${value}%</span>
          </div>
      `;

      const createTileTag = (tile, type = 'default') => {
          const colors = {
              default: 'bg-slate-700 text-slate-200',
              danger: 'bg-red-900/50 text-red-200',
              safe: 'bg-green-900/50 text-green-200',
              waiting: 'bg-purple-900/50 text-purple-200'
          };
          return `
              <span class="px-2 py-1 ${colors[type]} rounded text-xs font-medium">
                  ${tile}
              </span>
          `;
      };

      this.analysisContainer.className = 'p-4 space-y-4';
      this.minimalContainer.className = 'hidden';
      
      const analysisHTML = `
          <div class="space-y-4">
              <!-- メイン情報 -->
              <div class="bg-slate-700/50 rounded-lg p-3">
                  <div class="flex items-center justify-between mb-2">
                      <span class="text-orange-400 font-medium">推奨打牌</span>
                      <span class="text-2xl font-bold text-orange-400">${this.analysis.aiSuggestion.discardTile}</span>
                  </div>
                  <div class="space-y-2">
                      <div>
                          <span class="text-slate-400 text-sm">和了確率</span>
                          ${createProgressBar(this.analysis.aiSuggestion.winningProbability, 'bg-green-500')}
                      </div>
                  </div>
              </div>

              <!-- シャンテン数と効率 -->
              <div class="flex items-stretch gap-2">
                  <div class="flex-1 bg-slate-700/50 rounded-lg p-3">
                      <span class="text-slate-400 text-sm block mb-1">シャンテン数</span>
                      <span class="text-xl font-bold text-white">${this.analysis.handAnalysis.shanten}</span>
                  </div>
                  <div class="flex-1 bg-slate-700/50 rounded-lg p-3">
                      <span class="text-slate-400 text-sm block mb-1">効率</span>
                      ${createProgressBar(this.analysis.handAnalysis.efficiency, 'bg-blue-500')}
                  </div>
              </div>

              <!-- 待ち牌 -->
              <div class="bg-slate-700/50 rounded-lg p-3">
                  <span class="text-slate-400 text-sm block mb-2">待ち牌</span>
                  <div class="flex flex-wrap gap-1">
                      ${this.analysis.waitingTiles.map(tile => createTileTag(tile, 'waiting')).join('')}
                  </div>
              </div>

              <!-- 危険度分析 -->
              <div class="bg-slate-700/50 rounded-lg p-3">
                  <div class="flex items-center justify-between mb-2">
                      <span class="text-slate-400 text-sm">危険度</span>
                      <span class="px-2 py-1 bg-red-900/50 text-red-200 rounded text-xs font-medium">
                          ${this.analysis.dangerAnalysis.dangerLevel}
                      </span>
                  </div>
                  <div class="space-y-2">
                      <div>
                          <span class="text-slate-400 text-xs block mb-1">危険な牌</span>
                          <div class="flex flex-wrap gap-1">
                              ${this.analysis.dangerAnalysis.dangerousTiles.map(tile => 
                                  createTileTag(tile, 'danger')).join('')}
                          </div>
                      </div>
                      <div>
                          <span class="text-slate-400 text-xs block mb-1">安全な牌</span>
                          <div class="flex flex-wrap gap-1">
                              ${this.analysis.dangerAnalysis.safeTiles.map(tile => 
                                  createTileTag(tile, 'safe')).join('')}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      `;

      this.analysisContainer.innerHTML = analysisHTML;
      this.currentView = 'expanded';
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

          const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
          if (gl) {
              await new Promise(resolve => {
                  requestAnimationFrame(() => {
                      requestAnimationFrame(resolve);
                  });
              });

              gl.finish();
              
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

  updateCaptureButton(isCapturing) {
      this.captureButton.disabled = isCapturing;
      this.captureButton.classList.toggle('opacity-50', isCapturing);
      this.captureButton.classList.toggle('cursor-not-allowed', isCapturing);
      this.captureButton.querySelector('span').textContent = 
          isCapturing ? 'キャプチャ中...' : 'キャプチャ';
  }

  showNotification(message, type = 'info') {
      const notification = document.createElement('div');
      notification.className = `
          fixed top-4 left-1/2 transform -translate-x-1/2 
          px-4 py-2 rounded-lg shadow-lg
          ${type === 'error' ? 'bg-red-500' : 
            type === 'success' ? 'bg-green-500' : 
            'bg-blue-500'} 
          text-white text-sm
          transition-opacity duration-300
          flex items-center space-x-2
      `;

      const icon = document.createElement('span');
      icon.innerHTML = type === 'error' 
          ? `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
             </svg>`
          : type === 'success'
          ? `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 6L9 17l-5-5"/>
             </svg>`
          : `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="8"/>
             </svg>`;

      const text = document.createElement('span');
      text.textContent = message;

      notification.appendChild(icon);
      notification.appendChild(text);
      document.body.appendChild(notification);

      setTimeout(() => {
          notification.style.opacity = '0';
          setTimeout(() => notification.remove(), 300);
      }, 3000);
  }
}

// Initialize when the content script is injected
new MahjongAIAssistant();