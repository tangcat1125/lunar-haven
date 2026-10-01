/**
 * SkyRenderer - 天幕動態渲染器
 * 依據月相真實明暗與朝向繪製高階天體月相球，並動態調控夜空環境光
 */
class SkyRenderer {
  constructor(canvasOrId) {
    this.canvas = typeof canvasOrId === 'string' ? document.getElementById(canvasOrId) : canvasOrId;
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
  }

  setCanvas(canvas) {
    this.canvas = canvas;
    this.ctx = canvas ? canvas.getContext('2d') : null;
  }

  getMoonAssetPath(day, extension = null) {
    const config = window.LUNAR_CONFIG || {};
    const dir = config.MOON_ASSET_DIR || 'assets/images/moon';
    const ext = extension || config.MOON_ASSET_EXTENSION || 'webp';
    return `${dir}/${day}.${ext}`;
  }

  /**
   * 繪製厚紙卡木版風格的真實月相球（從 assets/images/moon/ 載入去背實拍月相）
   * @param {Object} phaseInfo - 月相資訊 (index, direction, illumination)
   * @param {number} day - 農曆日數 (1~30)
   */
  renderMoon(phaseInfo, day = 15) {
    // 1. 同步更新夜空中的真實漂浮月相球
    const skyMoonImg = document.getElementById('sky-moon-img');
    if (skyMoonImg) {
      const canonicalPath = this.getMoonAssetPath(day);
      const legacyPath = this.getMoonAssetPath(day, 'png');
      skyMoonImg.onerror = () => {
        // 舊版 PNG 只作相容備援；正式渲染一律優先使用 D:\\game\\moon 的 WebP。
        if (skyMoonImg.src.endsWith(`/${day}.webp`)) skyMoonImg.src = legacyPath;
      };
      skyMoonImg.src = canonicalPath;
      skyMoonImg.alt = `${phaseInfo.name} (第 ${day} 天)`;
      skyMoonImg.style.filter = `drop-shadow(0 0 ${12 + phaseInfo.illumination * 24}px rgba(255, 240, 190, ${0.4 + phaseInfo.illumination * 0.5}))`;
    }

    if (!this.ctx || !this.canvas) return;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const r = Math.min(w, h) / 2 - 8;
    const cx = w / 2;
    const cy = h / 2;

    ctx.clearRect(0, 0, w, h);

    // 2. 月相背底光暈（隨月相明亮比例動態漸層）
    const glowRadius = r * (1 + phaseInfo.illumination * 0.45);
    const glowGrad = ctx.createRadialGradient(cx, cy, r * 0.6, cx, cy, glowRadius);
    glowGrad.addColorStop(0, `rgba(255, 248, 220, ${0.15 + phaseInfo.illumination * 0.4})`);
    glowGrad.addColorStop(1, 'rgba(255, 248, 220, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    // 3. 載入並繪製 D:\game\moon 去背月相圖
    const moonImg = new Image();
    moonImg.src = this.getMoonAssetPath(day);
    moonImg.onload = () => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, glowRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.drawImage(moonImg, cx - r, cy - r, r * 2, r * 2);
    };
    moonImg.onerror = () => {
      // 先嘗試舊版 PNG，最後才使用幾何月相，避免正常情況生成另一套月亮。
      if (moonImg.src.endsWith(`/${day}.webp`)) {
        moonImg.src = this.getMoonAssetPath(day, 'png');
        return;
      }
      this.renderFallbackMoon(ctx, cx, cy, r, phaseInfo, day);
    };
  }

  renderFallbackMoon(ctx, cx, cy, r, phaseInfo, day) {

    // 2. 厚紙卡底色圓球（陰暗面，深岩灰）
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#1c2230';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#e0d8c3'; // 象牙白卡紙修邊
    ctx.stroke();

    // 3. 繪製明亮面 (Illuminated surface)
    // 朔望週期 29.5 天映射為 phase angle: 0 (朔月) -> PI (望月) -> 2*PI (朔月)
    const normDay = ((day - 1) % 30) / 29.5;
    const phaseAngle = normDay * Math.PI * 2;

    if (day !== 1 && day !== 30) {
      ctx.beginPath();
      // 亮面主色：米白羊皮/銀月質感
      ctx.fillStyle = '#f3f0e6';

      // 依據北半球視角：初二至十四（盈）右側亮；十六至廿八（虧）左側亮
      const isWaxing = day <= 15;

      if (isWaxing) {
        // 右側明亮半圓
        ctx.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2, false);
        // 回到頂部，依明暗曲面繪製晨昏分界線 (Terminator)
        // 比例係數: cos(phaseAngle)
        const k = Math.cos(phaseAngle);
        ctx.ellipse(cx, cy, Math.abs(k) * r, r, 0, Math.PI / 2, -Math.PI / 2, k > 0);
      } else {
        // 左側明亮半圓
        ctx.arc(cx, cy, r, Math.PI / 2, -Math.PI / 2, false);
        const k = Math.cos(phaseAngle);
        ctx.ellipse(cx, cy, Math.abs(k) * r, r, 0, -Math.PI / 2, Math.PI / 2, k > 0);
      }

      ctx.closePath();
      ctx.fill();
    } else {
      // 朔月完全黑暗，僅留微弱銀邊
      ctx.strokeStyle = 'rgba(224, 216, 195, 0.3)';
      ctx.stroke();
    }

    // 4. 木刻月海紋理細節 (Crater Textures)
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r - 2, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = 'rgba(70, 75, 90, 0.12)';
    ctx.beginPath();
    ctx.arc(cx - r * 0.25, cy - r * 0.1, r * 0.28, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.35, cy + r * 0.2, r * 0.22, 0, Math.PI * 2);
    ctx.arc(cx - r * 0.15, cy + r * 0.4, r * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }

  // 取得環境夜空漸層色
  getNightSkyStyle(illumination) {
    const darkRatio = 1 - illumination;
    const rTop = Math.round(5 + 15 * illumination);
    const gTop = Math.round(8 + 25 * illumination);
    const bTop = Math.round(18 + 55 * illumination);

    const rBottom = Math.round(15 + 25 * illumination);
    const gBottom = Math.round(20 + 35 * illumination);
    const bBottom = Math.round(35 + 65 * illumination);

    return `linear-gradient(to bottom, rgb(${rTop}, ${gTop}, ${bTop}) 0%, rgb(${rBottom}, ${gBottom}, ${bBottom}) 70%, #202738 100%)`;
  }
}

window.SkyRenderer = SkyRenderer;
