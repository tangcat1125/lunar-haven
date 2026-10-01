/**
 * DialogueBoxUI - 羊皮紙 TALKING 對話區與厚紙牌大立繪控制器
 * 規格要求：
 * 1. 點擊角色時左側滑入厚紙牌大立繪（受傷感染時帶有爪痕撕裂與紫污）
 * 2. 下方展開灰色羊皮紙對話區，呈現選項 A、B
 * 3. 委任選取後，角色主動回答「好的，我知道了」並轉身執行
 */
class DialogueBoxUI {
  constructor(taskSystem, infectionTracker) {
    this.taskSystem = taskSystem;
    this.infectionTracker = infectionTracker;
    this.currentNPC = null;
    this.departureTimer = null;

    this.wrapperEl = document.getElementById('dialogue-layer');
    this.standeeCardEl = document.getElementById('dialogue-standee-card');
    this.talkingBoxEl = document.getElementById('dialogue-parchment-box');

    this.initListeners();
  }

  initListeners() {
    if (!window.lunarEventBus) return;

    window.lunarEventBus.on('CHARACTER_CLICKED', ({ npc }) => {
      this.openDialogue(npc);
    });

    // 點擊空白處關閉
    if (this.wrapperEl) {
      this.wrapperEl.addEventListener('click', (e) => {
        if (e.target === this.wrapperEl) {
          this.closeDialogue();
        }
      });
    }
  }

  openDialogue(npc) {
    // 檢查守望點數是否已用盡
    if (!this.taskSystem.economy.hasActionPoints()) {
      if (npc.unlockInteraction) npc.unlockInteraction();
      if (window.soundEngine) window.soundEngine.playTone(220, 'sawtooth', 0.25, 0.2);
      if (window.lunarEventBus) {
        window.lunarEventBus.emit('ACTION_POINTS_EXHAUSTED', {
          msg: '今日守望點數已耗盡！無法進行對談。請等待小鎮迎來破曉！'
        });
      }
      return;
    }

    this.currentNPC = npc;
    if (!this.wrapperEl) return;

    if (window.soundEngine) {
      window.soundEngine.playCardSlide();
    }

    // 1. 設定厚紙牌大立繪
    this.renderStandeeCard(npc);

    // 2. 設定羊皮紙對話內容與選項
    this.renderTalkingBox(npc);

    this.wrapperEl.style.display = 'block';
    setTimeout(() => {
      this.wrapperEl.classList.add('is-active');
    }, 10);
    this.scheduleDeparturePrompt(npc);
  }

  renderStandeeCard(npc) {
    if (!this.standeeCardEl) return;

    // 清除既有感染外觀
    this.standeeCardEl.classList.remove('infected-card');

    let scratchHtml = '';
    if (npc.isInfected) {
      this.standeeCardEl.classList.add('infected-card');
      scratchHtml = `
        <div class="claw-scratch-overlay">
          <div class="claw-mark claw-1"></div>
          <div class="claw-mark claw-2"></div>
          <div class="claw-mark claw-3"></div>
          <div class="purple-poison-stain"></div>
        </div>
      `;
    }

    const portraitPath = npc.isWerewolf
      ? npc.getWerewolfPath()
      : (npc.isInfected && npc.data.category === 'animal' && npc.getInfectedImagePath
        ? npc.getInfectedImagePath()
        : (npc.getAvatarPath ? npc.getAvatarPath() : `assets/images/characters/avatars/${npc.id}.webp`));
    this.standeeCardEl.innerHTML = `
      <div class="thick-card-border">
        ${scratchHtml}
        <div class="standee-portrait" style="background-color: ${npc.color}">
          <img class="dialogue-avatar-img ${npc.isWerewolf ? 'dialogue-werewolf-img' : ''}" src="${portraitPath}" alt="${npc.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
          <div class="portrait-avatar" style="display:none;">${npc.getRoleIcon()}</div>
        </div>
        <div class="standee-meta">
          <h3 class="standee-name">${npc.name}</h3>
          <p class="standee-profession">${npc.profession} <span>(${npc.station.name})</span></p>
        </div>
      </div>
    `;
  }

  renderTalkingBox(npc) {
    if (!this.talkingBoxEl) return;

    let infectedWarning = '';
    let healOptionHtml = '';
    const healerIds = ['father_lawrence', 'brother_august', 'sister_claire'];
    const healerCanTreat = healerIds.includes(npc.id);
    const infectedPatients = this.infectionTracker.characterManager.getInfectedNPCs();
    const treatmentPatient = healerCanTreat
      ? (infectedPatients.find(patient => patient.id === npc.id) || infectedPatients[0])
      : null;

    if (npc.isInfected) {
      const isAnimal = npc.data.category === 'animal';
      infectedWarning = `
        <div class="dialogue-warning-box">
          ⚠️ ${isAnimal ? '該動物已遭受狼毒感染！眼中泛起血光，需盡快餵服解藥，否則滿月時將異變為狂暴魔獸！' : '該居民已被野狼咬傷，狼毒正在潛伏擴散！需在滿月（農曆十五）前施予附子草解藥！'}
        </div>
      `;

    }

    if (treatmentPatient) {
      healOptionHtml = `
        <button class="dialogue-choice-btn btn-cure-action" id="btn-cure-patient">
          <span class="choice-tag">[ 禱告治療：${treatmentPatient.name} ]</span>
          <span class="choice-title">消耗 1 藥水、1 藥品、1 紗布</span>
        </button>
      `;
    }

    // 依據月相週期四大階段（PEACEFUL 平靜期、ALERT 戒備期、FULL_MOON 滿月危機、DARK_MOON 朔月至暗）取得動態對白
    let phaseKey = 'PEACEFUL';
    const day = window.lunarHaven?.crisisSystem?.lunarInfo?.day || 19;
    if (day === 1 || day === 30 || day === 29) {
      phaseKey = 'DARK_MOON';
    } else if (day >= 14 && day <= 16) {
      phaseKey = 'FULL_MOON';
    } else if (day >= 9 && day <= 13) {
      phaseKey = 'ALERT';
    }

    if (npc.isInfected) {
      phaseKey = 'INFECTED';
    }

    let greetingText = npc.speech || '「大人，今晚是守護小鎮的關鍵時刻，請下達您的指示！」';
    let currentOptions = npc.options || [];

    // 若為路人居民或城鎮動物，從 TOWNSFOLK_DIALOGUES 載入劇情動態對白與專屬委任
    if (window.TOWNSFOLK_DIALOGUES && window.TOWNSFOLK_DIALOGUES[npc.id]) {
      const dialogueSet = window.TOWNSFOLK_DIALOGUES[npc.id];
      if (dialogueSet[phaseKey]) {
        greetingText = dialogueSet[phaseKey].greeting || greetingText;
        if (dialogueSet[phaseKey].options && dialogueSet[phaseKey].options.length > 0) {
          currentOptions = dialogueSet[phaseKey].options;
          npc.options = currentOptions; // 同步目前可選選項
        }
      }
    }

    const optionsHtml = currentOptions.map((opt, idx) => {
      const tag = `選項 ${String.fromCharCode(65 + idx)}`;
      const costStr = this.formatCost(opt.cost);
      return `
        <button class="dialogue-choice-btn" data-opt-id="${opt.id}">
          <span class="choice-tag">[ ${tag}: ${opt.title} ]</span>
          <span class="choice-desc">${opt.desc}</span>
          <span class="choice-meta task-scaled-summary">${costStr}｜收穫 ${this.formatReward(opt.reward)}｜離場 1 天</span>
          <label class="task-days-control" title="任務期間越長，投入與收穫會等比例增加">
            <span>工作期 <strong class="task-days-value">1 天</strong></span>
            <input class="task-days-range" type="range" min="1" max="4" step="1" value="1" aria-label="${opt.title}工作天數">
          </label>
        </button>
      `;
    }).join('');

    const apCurrent = this.taskSystem.economy.resources.actionPoints;
    const apMax = this.taskSystem.economy.maxStorageActionPoints || 12;

    this.talkingBoxEl.innerHTML = `
      <div class="parchment-inner">
        <div class="dialogue-top-meta">
          <span class="npc-greeting">${greetingText}</span>
          <span class="dialogue-ap-badge">⏳ 守望精力: <strong>${apCurrent} / ${apMax}</strong></span>
        </div>
        ${infectedWarning}
        <div class="dialogue-choices-row">
          ${healOptionHtml}
          ${optionsHtml}
        </div>
        <div class="feedback-speech-bubble" id="npc-speech-feedback" style="display:none;"></div>
      </div>
    `;

    // 綁定選項點擊事件
    this.talkingBoxEl.querySelectorAll('.dialogue-choice-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        if (e.target.classList.contains('task-days-range')) return;
        this.clearDeparturePrompt();
        const optId = btn.getAttribute('data-opt-id');
        if (optId) {
          const task = npc.options.find(o => o.id === optId);
          const days = Number(btn.querySelector('.task-days-range')?.value || 1);
          this.executeTaskSelection(npc, task, days);
        }
      });

      const range = btn.querySelector('.task-days-range');
      range?.addEventListener('input', (event) => {
        const task = npc.options.find(o => o.id === btn.getAttribute('data-opt-id'));
        const days = Number(event.target.value);
        btn.querySelector('.task-days-value').textContent = `${days} 天`;
        btn.querySelector('.task-scaled-summary').textContent = `${this.formatCost(task.cost, days)}｜收穫 ${this.formatReward(task.reward, days)}｜離場 ${days} 天`;
      });
    });

    // 施予解藥按鈕
    const cureBtn = document.getElementById('btn-cure-patient');
    if (cureBtn) {
      cureBtn.addEventListener('click', () => {
        if (!this.taskSystem.economy.hasActionPoints()) {
          alert('今日守望點數已耗盡！無法進行救治指派。');
          return;
        }

        const success = this.infectionTracker.curePatient(treatmentPatient, npc);
        if (success) {
          const rem = this.taskSystem.economy.consumeActionPoint();
          let speech = `「禱詞、藥水與紗布都已備妥。${treatmentPatient.name}的狼毒暫時退去了！」`;
          if (rem === 0) {
            speech += '<br><strong style="color:#ffb300;display:inline-block;margin-top:6px;">🌙 今日守望點數已全部耗盡！全鎮進入守夜，直接前進至下一天……</strong>';
            this.showFeedbackAndClose(npc, speech, true);
          } else {
            speech += `<br><small style="color:#c5e1a5;">（今日剩餘守望精力: ${rem} 點）</small>`;
            this.showFeedbackAndClose(npc, speech, false);
          }
        } else {
          alert('治療物資不足！需要 1 瓶藥水、1 份藥品與 1 份紗布。請指派神父、修士與修女準備物資。');
        }
      });
    }
  }

  // 對話不是永久停在畫面上；未下令的角色會禮貌告退，讓小鎮保持流動感。
  scheduleDeparturePrompt(npc) {
    this.clearDeparturePrompt();
    this.departureTimer = window.setTimeout(() => {
      if (this.currentNPC === npc) this.respondAndLeave(npc);
    }, 12000);
  }

  clearDeparturePrompt() {
    if (this.departureTimer) window.clearTimeout(this.departureTimer);
    this.departureTimer = null;
  }

  respondAndLeave(npc, reason = '') {
    this.clearDeparturePrompt();
    const opening = reason ? `${reason} ` : '';
    this.showFeedbackAndClose(npc, `「${opening}如果沒什麼任務，我要先離開了！」`, false);
  }

  formatCost(cost, multiplier = 1) {
    if (!cost || Object.keys(cost).length === 0) return '無需物資';
    const names = { food: '糧', wood: '木', iron: '鐵', silver: '銀', aconite: '草', water: '水', resin: '脂', healing_potion: '藥水', medicine: '藥品', bandage: '紗布' };
    return '消耗: ' + Object.entries(cost).map(([k, v]) => `${v * multiplier}${names[k] || k}`).join(' ');
  }

  formatReward(reward, multiplier = 1) {
    if (!reward || Object.keys(reward).length === 0) return '任務成果';
    const names = { food: '糧', wood: '木', iron: '鐵', silver: '銀', aconite: '藥草', water: '清水', resin: '松脂', healing_potion: '藥水', medicine: '藥品', bandage: '紗布', holy_water: '聖水', defense: '防禦', morale: '士氣' };
    return Object.entries(reward).map(([k, v]) => `${v * multiplier}${names[k] || k}`).join(' ');
  }

  executeTaskSelection(npc, task, workDays = 1) {
    if (!this.taskSystem.economy.hasActionPoints()) {
      alert('今日守望點數已耗盡！無法再指派新任務。');
      return;
    }

    const res = this.taskSystem.assign(npc, task, workDays);
    if (!res.success) {
      if (res.reason === '物資不足') {
        this.respondAndLeave(npc, '眼下物資還不夠，先去找工坊調度補給吧。');
      } else {
        alert(`無法委任任務：${res.reason}`);
      }
      return;
    }

    // 扣除 1 點每日守望點數
    const rem = this.taskSystem.economy.consumeActionPoint();
    const assignedTask = res.task || task;
    const destText = assignedTask.workName ? `<span style="color:#81d4fa;font-size:13px;display:block;margin-top:4px;">🏃 離場執行：${assignedTask.workName}（${assignedTask.workDays || 1} 天後歸隊）</span>` : '';
    let speechHtml = `「${npc.speech}」${destText}`;

    if (rem === 0) {
      speechHtml += '<strong style="color:#ffb300;display:inline-block;margin-top:6px;">🌙 今日守望點數已全部耗盡！全鎮進入守夜，直接前進至下一天……</strong>';
      this.showFeedbackAndClose(npc, speechHtml, true);
    } else {
      speechHtml += `<small style="color:#c5e1a5;display:inline-block;margin-top:2px;">（今日剩餘守望精力: ${rem} 點）</small>`;
      this.showFeedbackAndClose(npc, speechHtml, false);
    }
  }

  showFeedbackAndClose(npc, speechText, shouldAdvanceDay = false) {
    this.clearDeparturePrompt();
    const feedbackEl = document.getElementById('npc-speech-feedback');
    if (feedbackEl) {
      feedbackEl.innerHTML = speechText;
      feedbackEl.style.display = 'block';
    }

    if (window.soundEngine) {
      window.soundEngine.playTone(550, 'sine', 0.12, 0.15);
    }

    setTimeout(() => {
      this.closeDialogue();
      if (shouldAdvanceDay) {
        if (window.lunarHaven && window.lunarHaven.crisisSystem) {
          window.lunarHaven.crisisSystem.advanceOneDay();
        }
      }
    }, shouldAdvanceDay ? 1800 : 1200);
  }

  closeDialogue() {
    if (!this.wrapperEl) return;
    this.clearDeparturePrompt();
    if (this.currentNPC && this.currentNPC.unlockInteraction) {
      this.currentNPC.unlockInteraction();
    }
    this.wrapperEl.classList.remove('is-active');
    setTimeout(() => {
      this.wrapperEl.style.display = 'none';
      this.currentNPC = null;
    }, 300);
  }
}

window.DialogueBoxUI = DialogueBoxUI;
