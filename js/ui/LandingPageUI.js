/**
 * LandingPageUI - 入口導引頁面控制器
 * 呈現厚紙卡立體插畫、動態月相天球、流動式故事字幕，以及開局教學階段／結束條件設定。
 */
class LandingPageUI {
  constructor(containerEl, onEnterTown) {
    this.container = containerEl;
    this.onEnterTown = onEnterTown;
    this.sphereCanvas = null;
    this.sphereCtx = null;
    this.sphereAngle = 0;
    this.animId = null;

    this.render();
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="landing-paper-wrapper">
        <!-- 遠景：阿爾卑斯雪山立體厚紙層 -->
        <div class="landing-mountain-layer"></div>

        <!-- 中央動態天球、正式鐘塔與遠處若隱若現的狼影 -->
        <div class="landing-celestial-center">
          <canvas id="landing-moon-sphere" width="180" height="180"></canvas>
          <img class="landing-wolf-shadow" src="assets/images/wolves/wolf-scout.webp" alt="" aria-hidden="true" decoding="async" />
          <img class="landing-clock-tower-art" src="assets/images/landmarks/clock-tower.webp" alt="月痕小鎮鐘塔" decoding="async" />
        </div>

        <!-- 遊戲主標題 -->
        <div class="landing-title-card">
          <h1 class="landing-title">月痕小鎮</h1>
          <p class="landing-subtitle">LUNAR HAVEN</p>
          <div class="landing-badge">自然科學跨領域・天文週期與雙曆放置守望遊戲</div>
        </div>

        <!-- 流動式故事字幕 -->
        <div class="landing-story-marquee">
          <div class="marquee-content">
            「自古以來，月輪主宰著這座邊陲小鎮的命運……」
            「當朔夜無光（農曆初一），伸手不見五指的至暗降臨，飢餓的群狼將自黑森林襲來；」
            「當銀月當空（農曆十五），月華照徹石階，被狼牙撕咬過的傷者，終將難逃狂暴的詛咒。」
            「看清天上的月相，對照腳下的曆法——敲響警鐘、指派鎮民、抵禦黑夜。」
            「守夜者，你能引導小鎮迎來平安的破曉嗎？」
          </div>
        </div>

        <div class="landing-setup-panel">
          <label>
            <span>學習階段</span>
            <select id="landing-education-level">
              <option value="elementary">國小（自然與社會基礎）</option>
              <option value="junior">國中（地球科學與歷史探究）</option>
            </select>
          </label>
          <label>
            <span>遊戲結束方式</span>
            <select id="landing-ending-mode"></select>
          </label>
          <label>
            <span>詳細條件</span>
            <select id="landing-ending-detail"></select>
          </label>
        </div>

        <!-- 核心啟動按鈕 -->
        <div class="landing-action-row">
          <button id="btn-enter-town" class="paper-btn parchment-btn pulse-glow">
            <span class="btn-text">踏入小鎮 / 開始守望</span>
            <span class="btn-sub">ENTER LUNAR HAVEN</span>
          </button>
        </div>

      </div>
    `;

    // 初始化天球月相動畫
    this.sphereCanvas = document.getElementById('landing-moon-sphere');
    if (this.sphereCanvas) {
      this.sphereCtx = this.sphereCanvas.getContext('2d');
      this.startSphereAnimation();
    }

    this.bindSetupSelectors();

    // 綁定事件
    const btnEnter = document.getElementById('btn-enter-town');
    if (btnEnter) {
      btnEnter.addEventListener('click', () => {
        if (window.soundEngine) {
          window.soundEngine.init();
          window.soundEngine.playChurchBell(260, 3.0, 0.4);
        }
        this.hide();
        if (this.onEnterTown) this.onEnterTown(this.getSelectedSetup());
      });
    }
  }

  bindSetupSelectors() {
    const presets = window.LUNAR_TEACHER_PRESETS || [];
    const modeSelect = document.getElementById('landing-ending-mode');
    const detailSelect = document.getElementById('landing-ending-detail');
    if (!modeSelect || !detailSelect) return;
    modeSelect.innerHTML = presets.map(p => `<option value="${p.mode}">${p.title.replace(/^\d+\.\s*/, '')}</option>`).join('');
    const updateDetails = () => {
      const preset = presets.find(p => p.mode === modeSelect.value) || presets[0];
      detailSelect.innerHTML = (preset?.subOptions || []).map((sub, index) => `<option value="${index}">${sub.label}</option>`).join('');
      detailSelect.value = String(preset?.defaultSubIndex || 0);
    };
    modeSelect.addEventListener('change', updateDetails);
    updateDetails();
  }

  getSelectedSetup() {
    const presets = window.LUNAR_TEACHER_PRESETS || [];
    const educationLevel = document.getElementById('landing-education-level')?.value || 'elementary';
    const mode = document.getElementById('landing-ending-mode')?.value || presets[0]?.mode;
    const preset = presets.find(p => p.mode === mode) || presets[0];
    const subIndex = Number(document.getElementById('landing-ending-detail')?.value || preset?.defaultSubIndex || 0);
    return {
      educationLevel,
      endingRule: {
        mode: preset.mode,
        title: preset.title,
        description: preset.description,
        subIndex,
        subOption: preset.subOptions?.[subIndex] || null
      }
    };
  }

  startSphereAnimation() {
    const render = () => {
      if (!this.sphereCtx) return;
      const ctx = this.sphereCtx;
      const w = this.sphereCanvas.width;
      const h = this.sphereCanvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const r = 72;

      ctx.clearRect(0, 0, w, h);

      // 外光暈
      const glow = ctx.createRadialGradient(cx, cy, r * 0.7, cx, cy, r * 1.3);
      glow.addColorStop(0, 'rgba(230, 240, 255, 0.35)');
      glow.addColorStop(1, 'rgba(230, 240, 255, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.3, 0, Math.PI * 2);
      ctx.fill();

      // 月球本體
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = '#1c2230';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#e0d8c3';
      ctx.stroke();

      // 動態明暗流轉
      this.sphereAngle += 0.015;
      const cosA = Math.cos(this.sphereAngle);
      const isWaxing = Math.sin(this.sphereAngle) >= 0;

      ctx.beginPath();
      ctx.fillStyle = '#f3f0e6';
      if (isWaxing) {
        ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2, false);
        ctx.ellipse(cx, cy, Math.abs(cosA) * r, r, 0, Math.PI / 2, -Math.PI / 2, cosA > 0);
      } else {
        ctx.arc(cx, cy, r, Math.PI / 2, -Math.PI / 2, false);
        ctx.ellipse(cx, cy, Math.abs(cosA) * r, r, 0, -Math.PI / 2, Math.PI / 2, cosA > 0);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      this.animId = requestAnimationFrame(render);
    };
    render();
  }

  show() {
    if (this.container) this.container.style.display = 'block';
  }

  hide() {
    if (this.container) this.container.style.display = 'none';
    if (this.animId) cancelAnimationFrame(this.animId);
  }
}

window.LandingPageUI = LandingPageUI;
