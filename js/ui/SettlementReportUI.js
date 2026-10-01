/**
 * SettlementReportUI - 《小鎮守夜者天文手冊》結算學習單彈窗
 * 呈現月相變化軌跡、雙曆認知、防禦成效與課堂評量成績，支援一鍵列印/保存
 */
class SettlementReportUI {
  constructor(storyJournal = null) {
    this.modalEl = document.getElementById('settlement-modal');
    this.storyJournal = storyJournal;
    this.exportPayload = null;
    this.initListeners();
  }

  initListeners() {
    if (!window.lunarEventBus) return;

    window.lunarEventBus.on('GAME_OVER_CONDITION_MET', ({ reason, stats }) => {
      this.open(reason, stats);
    });

    if (this.modalEl) {
      this.modalEl.addEventListener('click', (e) => {
        if (e.target.closest('.export-story-text-btn')) {
          this.exportChronicleText();
          return;
        }
        if (e.target.closest('.export-storybook-btn')) {
          this.exportStorybook();
          return;
        }
        if (e.target.classList.contains('close-settle-btn')) {
          this.close();
        }
      });
    }
  }

  open(reason, stats) {
    if (!this.modalEl) return;

    if (window.soundEngine) window.soundEngine.playPageTurn();

    const bodyEl = this.modalEl.querySelector('.modal-content-body');
    if (!bodyEl) return;

    // 計算評分與等級
    const score = this.calculateGrade(stats);
    const entries = this.storyJournal?.getBookEntries(24) || [];
    const midpoint = Math.ceil(entries.length / 2);
    const leftEntries = entries.slice(0, midpoint);
    const rightEntries = entries.slice(midpoint);
    const level = window.LUNAR_CONFIG?.EDUCATION_LEVEL || 'elementary';
    const levelName = level === 'junior' ? '國中' : '國小';
    const standards = this.getLearningStandards(level);
    const radarValues = this.getRadarValues(stats, score);
    const narrativeEnding = this.getNarrativeEnding(stats);
    const chronicleClosing = this.getChronicleClosing(score, stats);
    this.exportPayload = { entries, narrativeEnding, chronicleClosing, levelName };

    bodyEl.innerHTML = `
      <div class="settlement-scroll">
        <section class="chronicle-book-view">
          <div class="chronicle-page chronicle-left">
            <h2>《月痕小鎮守望古卷》</h2>
            <p class="chronicle-lead">這座小鎮如何撐過了守望的日子</p>
            <p class="chronicle-sublead">${narrativeEnding}</p>
            <p class="chronicle-scroll-hint">向下滑動閱讀本頁</p>
            <div class="chronicle-prose">${(leftEntries.length ? leftEntries : ['守望者在寒潮初起時接手月痕小鎮。鐘塔、教堂與森林邊界都在等待第一道命令。']).map(item => `<p>${item}</p>`).join('')}</div>
          </div>
          <div class="chronicle-page chronicle-right">
            <h3>防線與人們的續篇</h3>
            <p class="chronicle-scroll-hint">向下滑動閱讀本頁</p>
            <div class="chronicle-prose">${(rightEntries.length ? rightEntries : ['這一頁等待下一位守望者續寫。']).map(item => `<p>${item}</p>`).join('')}</div>
            <p class="chronicle-ending">${chronicleClosing}</p>
          </div>
        </section>

        <section class="settlement-sheet-paper">
          <div class="sheet-header">
            <div class="sheet-title-badge">📜 ${levelName}跨領域學習評量</div>
            <h2>自然科學 × 社會科學星芒圖</h2>
            <p class="sheet-sub">結算原因：<strong class="highlight-reason">${reason}</strong></p>
          </div>

        <div class="sheet-section score-banner">
          <div class="score-card">
            <span class="score-num">${score.points}</span>
            <span class="score-label">守夜評價總分</span>
          </div>
          <div class="grade-card grade-${score.rank}">
            <span class="grade-letter">${score.rank}</span>
            <span class="grade-title">${score.title}</span>
          </div>
        </div>

        <div class="sheet-section">
          <h3>一、 天文月相與雙曆紀錄</h3>
          <div class="sheet-grid-3">
            <div class="stat-box">
              <span class="stat-v">${stats.daysPassed} 天</span>
              <span class="stat-k">守望天數</span>
            </div>
            <div class="stat-box">
              <span class="stat-v">${stats.lunarDate}</span>
              <span class="stat-k">最終農曆日期</span>
            </div>
            <div class="stat-box">
              <span class="stat-v">${stats.collectedCount} / 8</span>
              <span class="stat-k">收集月相圖鑑</span>
            </div>
          </div>
        </div>

          <div class="learning-analysis-grid">
            <div class="radar-panel">
              <canvas id="learning-radar" width="420" height="360" aria-label="學習成效星芒圖"></canvas>
            </div>
            <div class="standards-panel">
              <h3>${levelName}學習指標對照</h3>
              <ul>${standards.map((item, index) => `<li class="${radarValues[index] >= 65 ? 'is-achieved' : ''}"><span>${radarValues[index] >= 65 ? '★' : '☆'}</span>${item}</li>`).join('')}</ul>
            </div>
          </div>

        <div class="sheet-section teacher-comment-box">
          <h4>導師評語與天文反思：</h4>
          <p class="teacher-feedback-text">${score.feedback}</p>
        </div>

          <div class="sheet-actions-row no-print">
            <button class="paper-btn export-story-text-btn" type="button">📜 匯出鎮史文字</button>
            <button class="paper-btn export-storybook-btn" type="button">🖍 匯出繪本創作版</button>
            <button class="paper-btn print-btn" onclick="window.print()">🖨 列印 / 另存為 PDF 學習單</button>
            <button class="paper-btn close-settle-btn">重新開始守望</button>
          </div>
        </div>
      </div>
    `;

    this.modalEl.style.display = 'flex';
    requestAnimationFrame(() => this.drawRadar(radarValues));
  }

  escapeHtml(value = '') {
    return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }

  downloadFile(filename, content, type) {
    const blob = new Blob([content], { type: `${type};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  exportChronicleText() {
    const payload = this.exportPayload;
    if (!payload) return;
    const lines = [
      '《月痕小鎮守望古卷》',
      '',
      payload.narrativeEnding,
      '',
      ...payload.entries.flatMap((entry, index) => [`【鎮史篇章 ${this.toChineseNumber(index + 1)}】`, entry, '']),
      payload.chronicleClosing
    ];
    this.downloadFile('lunar-haven-chronicle.txt', lines.join('\n'), 'text/plain');
  }

  exportStorybook() {
    const payload = this.exportPayload;
    if (!payload) return;
    const chapters = payload.entries.length ? payload.entries : ['月光落在月痕小鎮的屋瓦上，守望者準備寫下新的篇章。'];
    const pages = chapters.map((entry, index) => `
      <section class="page">
        <p class="page-number">月痕小鎮繪本・${this.toChineseNumber(index + 1)}</p>
        <h2>${this.escapeHtml(this.getStoryPageTitle(index))}</h2>
        <p class="story-text">${this.escapeHtml(entry)}</p>
        <div class="drawing-box">在這裡畫下這一頁的月光、角色與發生的事</div>
        <div class="student-line">我想替故事補上一句：＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿</div>
      </section>`).join('');
    const html = `<!doctype html><html lang="zh-TW"><meta charset="utf-8"><title>月痕小鎮・我的繪本</title>
      <style>@page{size:A4;margin:14mm}body{font-family:"Microsoft JhengHei","Noto Serif TC",serif;color:#37281a;background:#f4e5c5;margin:0}.cover,.page{box-sizing:border-box;min-height:267mm;padding:18mm;border:7px double #8a633c;background:#fff8e8}.cover{display:flex;flex-direction:column;justify-content:center;text-align:center}.cover h1{font-size:32pt;margin:0 0 20pt}.cover p{font-size:16pt;line-height:1.8}.page{break-after:page}.page-number{color:#86541f;font-weight:700}.page h2{font-size:22pt}.story-text{font-size:16pt;line-height:1.8}.drawing-box{height:115mm;margin:12mm 0;border:3px dashed #a88358;border-radius:10px;color:#997650;display:flex;align-items:center;justify-content:center;text-align:center;font-size:15pt;padding:8mm;box-sizing:border-box}.student-line{font-size:14pt;line-height:2}@media print{body{background:#fff}.cover,.page{border-color:#7d6041}}</style>
      <body><section class="cover"><h1>《月痕小鎮・我的繪本》</h1><p>${this.escapeHtml(payload.narrativeEnding)}</p><p>讀完鎮史後，請用圖畫與自己的句子，替村落留下一頁新的月光。</p><p>姓名：＿＿＿＿＿＿＿＿＿＿＿＿　　班級：＿＿＿＿＿＿＿＿＿＿＿＿</p></section>${pages}<section class="page"><p class="page-number">結尾</p><h2>我替小鎮寫下的最後一頁</h2><p class="story-text">${this.escapeHtml(payload.chronicleClosing)}</p><div class="drawing-box">畫下你希望月痕小鎮迎來的下一個清晨</div><div class="student-line">我的結語：＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿</div></section></body></html>`;
    this.downloadFile('lunar-haven-my-storybook.html', html, 'text/html');
  }

  getStoryPageTitle(index) {
    const titles = ['月光初現', '村口的消息', '教堂的燈火', '森林邊界', '守望者的抉擇', '雪夜的回聲'];
    return titles[index % titles.length];
  }

  toChineseNumber(number) {
    const numerals = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
    if (number <= 10) return numerals[number];
    if (number < 20) return `十${numerals[number - 10]}`;
    return `${numerals[Math.floor(number / 10)]}十${number % 10 ? numerals[number % 10] : ''}`;
  }

  getLearningStandards(level) {
    if (level === 'junior') {
      return [
        '理解月相變化與日、地、月相對位置的週期關係',
        '運用公曆與農曆資料解釋生活中的時間系統',
        '分析生物、環境與人類防禦行為的交互作用',
        '依證據預測風險並調整資源與防衛策略',
        '理解聚落分工、公共安全與群體決策',
        '整理事件紀錄並反思決策造成的後果'
      ];
    }
    return [
      '觀察並描述月亮外形會隨日期規律改變',
      '閱讀公曆、農曆與月相圖示的對照資訊',
      '察覺動物行為與環境條件的關聯',
      '使用有限資源解決生活情境中的問題',
      '認識社區角色分工與互助的重要性',
      '用時間順序敘述事件並表達學習發現'
    ];
  }

  // 古卷結語只留人物、月光與村落的記憶；評量數據仍保留在後頁學習單。
  getNarrativeEnding(stats) {
    if (stats.totalTransformed > 0) return '滿月曾照見失控的身影，也照見仍願守在教堂門前的人。';
    if (stats.totalBitten > 0) return '狼影曾越過林線，村民仍把藥草、火光與彼此的名字留在村落裡。';
    if (stats.defenseSuccessCount > 0) return '鐘塔與村口的燈火守住了夜色，月亮替村落記下了這段平安。';
    return '月輪越過雪山時，小鎮在靜靜燃著的窗火之間，迎來了下一道晨光。';
  }

  getChronicleClosing(score, stats) {
    if (stats.totalTransformed > 0) return '古卷闔上時，留下的不只是失去，還有下一次更早點亮燈火的約定。';
    if (score.rank === 'S' || score.rank === 'A') return '古卷闔上時，鐘聲與弓弦都已安靜；村落記得守望者的名字。';
    return '古卷闔上時，月光落在屋瓦上；小鎮知道自己仍能學著守住彼此。';
  }

  getRadarValues(stats, score) {
    const cureRate = Math.round((stats.totalCured / Math.max(1, stats.totalBitten)) * 100);
    return [
      Math.min(100, stats.collectedCount * 12.5),
      Math.min(100, 35 + stats.daysPassed * 4),
      Math.min(100, 40 + cureRate * 0.6),
      Math.min(100, score.points),
      Math.min(100, stats.finalMorale || 0),
      Math.min(100, 35 + stats.defenseSuccessCount * 18)
    ];
  }

  drawRadar(values) {
    const canvas = document.getElementById('learning-radar');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const labels = ['月相觀察', '雙曆理解', '生態關聯', '決策推理', '社會協作', '紀錄反思'];
    const cx = canvas.width / 2;
    const cy = canvas.height / 2 + 8;
    const radius = 125;
    const points = (scale) => labels.map((_, i) => {
      const angle = -Math.PI / 2 + i * Math.PI * 2 / labels.length;
      return [cx + Math.cos(angle) * radius * scale, cy + Math.sin(angle) * radius * scale];
    });
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    [0.25, 0.5, 0.75, 1].forEach(scale => {
      const ring = points(scale);
      ctx.beginPath();
      ring.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
      ctx.closePath();
      ctx.strokeStyle = 'rgba(93,64,55,.32)';
      ctx.stroke();
    });
    points(1).forEach(([x, y]) => {
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.strokeStyle = 'rgba(93,64,55,.24)'; ctx.stroke();
    });
    const data = values.map((v, i) => {
      const angle = -Math.PI / 2 + i * Math.PI * 2 / values.length;
      return [cx + Math.cos(angle) * radius * v / 100, cy + Math.sin(angle) * radius * v / 100];
    });
    ctx.beginPath();
    data.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.closePath();
    ctx.fillStyle = 'rgba(25,73,105,.38)'; ctx.fill();
    ctx.strokeStyle = '#194969'; ctx.lineWidth = 3; ctx.stroke();
    labels.forEach((label, i) => {
      const angle = -Math.PI / 2 + i * Math.PI * 2 / labels.length;
      ctx.fillStyle = '#3e2723'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(label, cx + Math.cos(angle) * 158, cy + Math.sin(angle) * 148 + 5);
    });
  }

  calculateGrade(stats) {
    let pts = 60;
    pts += stats.collectedCount * 3; // 圖鑑加分
    pts += (stats.totalCured * 8);   // 救治加分
    pts -= (stats.totalTransformed * 12); // 狼化扣分
    pts += Math.floor(stats.finalDefense / 5);

    pts = Math.max(20, Math.min(100, pts));

    let rank = 'B';
    let title = '稱職的守更人';
    let feedback = '你已掌握月相與農曆的對照關係，但在朔月與滿月危機轉換期仍需加快資源調配！';

    if (pts >= 90) {
      rank = 'S';
      title = '傳奇天文守夜大師';
      feedback = '完美貫徹天文連續性思維！精準在朔月阻截群狼、滿月前肅清狼毒，小鎮在你的庇護下安然迎來破曉！';
    } else if (pts >= 75) {
      rank = 'A';
      title = '敏銳的星月觀測官';
      feedback = '出色地運用了雙曆對照機制，絕大多數傷患均獲及時淨化，展現了卓越的因果決策能力。';
    } else if (pts < 50) {
      rank = 'C';
      title = '倉皇的破曉倖存者';
      feedback = '小鎮遭遇了嚴重的狼人異變。請特別注意農曆初一（至暗）與十五（銀月）前後的連續關聯性，提早備戰！';
    }

    return { points: pts, rank, title, feedback };
  }

  close() {
    if (this.modalEl) this.modalEl.style.display = 'none';
    window.location.reload();
  }
}

window.SettlementReportUI = SettlementReportUI;
