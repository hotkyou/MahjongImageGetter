class MahjongAIAssistant {
    constructor() {
        this.isCapturing = false;
        this.analysis = null;
        this.currentView = "minimal";
        this.initializeUI();
        this.attachEventListeners();
    }

    initializeUI() {
        const container = document.createElement("div");
        container.className =
            "mahjong-ai fixed right-4 top-4 pointer-events-auto";

        this.mainPanel = document.createElement("div");
        this.mainPanel.className =
            "bg-slate-800 bg-opacity-95 rounded-2xl shadow-lg transition-all duration-300 w-72";

        const header = document.createElement("div");
        header.className = "p-4 border-b border-slate-700";

        const headerContent = document.createElement("div");
        headerContent.className = "flex items-center justify-between";

        const titleArea = document.createElement("div");
        titleArea.className = "flex items-center space-x-2";

        const title = document.createElement("h2");
        title.className = "text-lg font-bold text-white";
        title.textContent = "雀AI";

        const betaBadge = document.createElement("div");
        betaBadge.className =
            "px-2 py-0.5 bg-green-500 text-white text-xs rounded-full";
        betaBadge.textContent = "Beta";

        titleArea.appendChild(title);
        titleArea.appendChild(betaBadge);

        this.captureButton = document.createElement("button");
        this.captureButton.className =
            "px-3 py-1.5 bg-blue-500 text-white rounded-lg flex items-center space-x-2 hover:bg-blue-600 transition-all text-sm";
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

        this.minimalContainer = document.createElement("div");
        this.minimalContainer.className = "p-4";
        this.minimalContainer.innerHTML = `
          <div class="text-center text-slate-300 text-sm">
              キャプチャボタンを押して手牌を分析
          </div>
      `;

        this.analysisContainer = document.createElement("div");
        this.analysisContainer.className = "hidden";

        this.mainPanel.appendChild(header);
        this.mainPanel.appendChild(this.minimalContainer);
        this.mainPanel.appendChild(this.analysisContainer);

        container.appendChild(this.mainPanel);
        document.body.appendChild(container);

        this.setupDraggable(this.mainPanel);
    }

    setupDraggable(element) {
        let pos1 = 0,
            pos2 = 0,
            pos3 = 0,
            pos4 = 0;
        const header = element.querySelector("div");

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
            parent.style.top = parent.offsetTop - pos2 + "px";
            parent.style.right =
                parseInt(parent.style.right || 0) + pos1 + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    attachEventListeners() {
        this.captureButton.addEventListener("click", () =>
            this.captureWebGLCanvas()
        );
    }

    updateAnalysisDisplay() {
        if (!this.analysis) return;

        const createProgressBar = (value, color = "bg-blue-500") => `
          <div class="flex items-center space-x-2">
              <div class="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div class="${color} h-full rounded-full transition-all duration-300" style="width: ${value}%"></div>
              </div>
              <span class="text-sm font-medium text-slate-300">${value}%</span>
          </div>
      `;

        const createTileTag = (tile, type = "default") => {
            const colors = {
                default: "bg-slate-700 text-slate-200",
                danger: "bg-red-900/50 text-red-200",
                safe: "bg-green-900/50 text-green-200",
                waiting: "bg-purple-900/50 text-purple-200"
            };
            return `
              <span class="px-2 py-1 ${colors[type]} rounded text-xs font-medium">
                  ${tile}
              </span>
          `;
        };

        this.analysisContainer.className = "p-4 space-y-4";
        this.minimalContainer.className = "hidden";

        const analysisHTML = `
          <div class="space-y-4">
              <!-- メイン情報 -->
              <div class="bg-slate-700/50 rounded-lg p-3">
                  <div class="flex items-center justify-between mb-2">
                      <span class="text-orange-400 font-medium">推奨打牌</span>
                      <span class="text-2xl font-bold text-orange-400">${
                          this.analysis.aiSuggestion.discardTile
                      }</span>
                  </div>
                  <div class="space-y-2">
                      <div>
                          <span class="text-slate-400 text-sm">和了確率</span>
                          ${createProgressBar(
                              this.analysis.aiSuggestion.winningProbability,
                              "bg-green-500"
                          )}
                      </div>
                  </div>
              </div>
  
              <!-- シャンテン数と効率 -->
              <div class="flex items-stretch gap-2">
                  <div class="flex-1 bg-slate-700/50 rounded-lg p-3">
                      <span class="text-slate-400 text-sm block mb-1">シャンテン数</span>
                      <span class="text-xl font-bold text-white">${
                          this.analysis.handAnalysis.shanten
                      }</span>
                  </div>
                  <div class="flex-1 bg-slate-700/50 rounded-lg p-3">
                      <span class="text-slate-400 text-sm block mb-1">効率</span>
                      ${createProgressBar(
                          this.analysis.handAnalysis.efficiency,
                          "bg-blue-500"
                      )}
                  </div>
              </div>
  
              <!-- 待ち牌 -->
              <div class="bg-slate-700/50 rounded-lg p-3">
                  <span class="text-slate-400 text-sm block mb-2">待ち牌</span>
                  <div class="flex flex-wrap gap-1">
                      ${this.analysis.waitingTiles
                          .map(tile => createTileTag(tile, "waiting"))
                          .join("")}
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
                              ${this.analysis.aiSuggestion.riskyProbability}
                          </div>
                      </div>
                      <div>
                          <span class="text-slate-400 text-xs block mb-1">安全な牌</span>
                          <div class="flex flex-wrap gap-1">
                              ${this.analysis.dangerAnalysis.safeTiles
                                  .map(tile => createTileTag(tile, "safe"))
                                  .join("")}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      `;

        this.analysisContainer.innerHTML = analysisHTML;
        this.currentView = "expanded";
    }

    async captureWebGLCanvas() {
        if (this.isCapturing) return;
        this.isCapturing = true;
        this.updateCaptureButton(true);

        try {
            const canvas = document.querySelector("canvas");
            if (!canvas) {
                this.showNotification("キャンバスが見つかりません", "error");
                return;
            }

            const gl =
                canvas.getContext("webgl") || canvas.getContext("webgl2");
            let dataUrl;

            if (gl) {
                await new Promise(resolve =>
                    requestAnimationFrame(() => requestAnimationFrame(resolve))
                );
                gl.finish();
                const tempCanvas = document.createElement("canvas");
                tempCanvas.width = canvas.width;
                tempCanvas.height = canvas.height;
                tempCanvas
                    .getContext("2d")
                    .drawImage(canvas, 0, 0, canvas.width, canvas.height);
                dataUrl = tempCanvas.toDataURL("image/png");
            } else {
                dataUrl = canvas.toDataURL("image/png");
            }

            this.sendCaptureToBackground(dataUrl);
            await this.sendGameDataToBackend();
        } catch (error) {
            console.error("Capture error:", error);
            this.showNotification(
                "キャプチャエラー: " + error.message,
                "error"
            );
        } finally {
            this.isCapturing = false;
            this.updateCaptureButton(false);
        }
    }

    async sendGameDataToBackend() {
        const gameData = this.getGameData();
        if (!gameData) {
            this.showNotification("ゲームデータの取得に失敗しました", "error");
            return;
        }

        try {
            const response = await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage(
                    { action: "sendGameData", gameData: gameData },
                    response => {
                        if (response && response.success) {
                            this.showNotification(
                                "ゲームデータを送信しました",
                                "success"
                            );
                        } else {
                            this.showNotification(
                                "ゲームデータの送信に失敗しました",
                                "error"
                            );
                        }
                    }
                );
            });

            if (response && response.success) {
                this.showNotification("ゲームデータを送信しました", "success");
            } else {
                throw new Error("送信失敗");
            }
        } catch (error) {
            console.error("ゲームデータ送信エラー:", error);
            this.showNotification("ゲームデータの送信に失敗しました", "error");
        }
    }

    sendCaptureToBackground(dataUrl) {
        chrome.runtime.sendMessage(
            {
                action: "processCanvasImage",
                imageData: dataUrl
            },
            response => {
                if (chrome.runtime.lastError) {
                    console.error("Error:", chrome.runtime.lastError);
                    this.showNotification(
                        "エラー: " + chrome.runtime.lastError.message,
                        "error"
                    );
                    return;
                }
                if (response && response.success) {
                    this.showNotification(
                        "キャプチャ成功！分析を開始します",
                        "success"
                    );
                    this.analyzeHand();
                } else {
                    this.showNotification("キャプチャに失敗しました", "error");
                }
            }
        );
    }

    analyzeHand() {
        this.showNotification("分析中...", "info");
        chrome.runtime.sendMessage({ action: "analyzeHand" }, response => {
            if (response && response.success) {
                this.analysis = response.data;
                this.updateAnalysisDisplay();
                this.showNotification("分析が完了しました", "success");
            } else {
                this.showNotification("分析に失敗しました", "error");
            }
        });
    }

    updateCaptureButton(isCapturing) {
        this.captureButton.disabled = isCapturing;
        this.captureButton.classList.toggle("opacity-50", isCapturing);
        this.captureButton.classList.toggle("cursor-not-allowed", isCapturing);
        this.captureButton.querySelector("span").textContent = isCapturing
            ? "キャプチャ中..."
            : "キャプチャ";
    }

    showNotification(message, type = "info") {
        const notification = document.createElement("div");
        notification.className = `
        fixed top-4 left-1/2 transform -translate-x-1/2 
        px-4 py-2 rounded-lg shadow-lg
        ${
            type === "error"
                ? "bg-red-500"
                : type === "success"
                ? "bg-green-500"
                : "bg-blue-500"
        } 
        text-white text-sm
        transition-opacity duration-300
        flex items-center space-x-2
      `;

        const icon = document.createElement("span");
        icon.innerHTML =
            type === "error"
                ? `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
           </svg>`
                : type === "success"
                ? `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 6L9 17l-5-5"/>
           </svg>`
                : `<svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="8"/>
           </svg>`;

        const text = document.createElement("span");
        text.textContent = message;

        notification.appendChild(icon);
        notification.appendChild(text);
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = "0";
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    getGameData() {
        console.log("Attempting to retrieve game data...");
        if (typeof view == 'undefined' || typeof view.DesktopMgr == 'undefined' ||
            typeof view.DesktopMgr.Inst == 'undefined' || view.DesktopMgr.Inst == null) {
                console.log("無理");
            return;
        }

        // Check if 'view.DesktopMgr.Inst' is undefined
        if (!view.DesktopMgr.Inst.dora) {
            console.warn("Desktop Manager instance is not available.");
            this.showNotification(
                "デスクトップマネージャが利用できません。しばらく待って再試行してください。",
                "error"
            );
            return null;
        } else {
            console.log(view.DesktopMgr.Inst.dora);
        }
        retryGetGameData();
        console.log("Sending game data to backend...");

        // Safely access game data
        try {
            const gameData = {
                hand: view.DesktopMgr.Inst.players[0].hand.map(t => t.val),
                discards: view.DesktopMgr.Inst.players.map(p =>
                    p.container_qipai.pais.map(t => t.val)
                ),
                dora: view.DesktopMgr.Inst.dora,
                tilesLeft: view.DesktopMgr.Inst.left_tile_count
            };

            console.log("Game Data Retrieved:", gameData);
            return gameData;
        } catch (error) {
            console.error("Error retrieving game data:", error);
            this.showNotification(
                "ゲームデータの取得中にエラーが発生しました。",
                "error"
            );
            return null;
        }
    }

    // Retry mechanism for ensuring view is available
    retryGetGameData(maxRetries = 5, delay = 1000) {
        let attempts = 0;

        const tryGetGameData = () => {
            const gameData = this.getGameData();
            if (gameData || attempts >= maxRetries) {
                if (gameData) {
                    console.log(
                        "Game data successfully retrieved after retrying."
                    );
                    this.sendGameDataToBackend();
                } else {
                    console.error(
                        "Failed to retrieve game data after retries."
                    );
                    this.showNotification(
                        "ゲームデータを取得できませんでした。",
                        "error"
                    );
                }
            } else {
                attempts++;
                console.log(
                    `Retrying to fetch game data (${attempts}/${maxRetries})...`
                );
                setTimeout(tryGetGameData, delay);
            }
        };

        tryGetGameData();
    }
}

// Initialize when the content script is injected
new MahjongAIAssistant();
