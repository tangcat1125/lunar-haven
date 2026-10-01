/**
 * NPC - 核心角色實體類別
 * 具備自主漫步、接獲委任快步奔赴特定工坊/鎮外/哨站、工坊作業中與完成返航行為
 */
class NPC {
  constructor(data, worldContainer) {
    this.data = data;
    this.id = data.id;
    this.name = data.name;
    this.englishName = data.englishName;
    this.profession = data.profession;
    this.station = data.station;
    this.options = data.options;
    this.speech = data.speech;
    this.color = data.color || '#8d6e63';

    // 座標與移動系統
    this.homeX = data.homeX || data.station.x;
    this.x = this.homeX;
    this.targetX = this.homeX;
    this.worldWidth = window.LUNAR_CONFIG?.WORLD_WIDTH || 2800;
    this.worldEdgeInset = 150;
    // 角色使用多條低位步行軌道；遇到其他角色時可換軌，避免紙偶彼此卡住。
    this.homeWalkLane = Number.isInteger(data.walkLane) ? data.walkLane : 0;
    this.walkLane = this.homeWalkLane;
    this.depthJitter = Math.random() * 3;
    this.depthOffset = this.walkLane * 10 + this.depthJitter;
    this.targetDepthOffset = this.depthOffset;
    // 活動帶保持在街道底部，並以軌道差形成前後層次。
    this.baseY = 540 + this.depthOffset;
    this.facingDir = 1; // 1: 面向右, -1: 面向左
    this.walkSpeed = data.walkSpeed || 300; // 奔赴任務速度 (px/s)
    // 閒暇巡走是世界座標上的真正水平位移，不用旋轉幅度假裝移動。
    // 自主巡走以教學觀察節奏前進；任務奔赴另由 walkSpeed 決定。
    this.idleSpeed = 15;  // 閒暇散步速度 (px/s)
    this.patrolRange = data.patrolRange || (data.category === 'animal' ? 360 : 500);

    // 閒暇踱步計時器（縮短初次等待，立即展開小鎮漫步巡遊）
    // 進入遊戲後很快開始巡邏，避免所有角色在初始畫面看起來像靜態貼圖。
    this.idleTimer = 0.05 + Math.random() * 0.15;
    this.idleTargetX = this.homeX;
    this.isIdleWalking = false;
    this.avoidanceUntil = 0;
    // 點擊後鎖定短暫互動，避免晃動期間重複開啟對談。
    this.isClickLocked = false;

    // 狀態機: IDLE, WALKING_TO_WORK, WORKING, READY, RETURNING, INFECTED, WEREWOLF
    this.state = 'IDLE';
    this.isInfected = false;
    this.isWerewolf = false;

    this.currentTask = null;
    this.currentWorkName = '';
    this.taskTimer = 0;
    this.taskTotal = 0;
    this.taskTurnsRemaining = 0;
    this.exitSide = null;
    this.returnTargetX = this.homeX;
    this.isPresent = true;

    this.container = worldContainer;
    this.el = null;
    this.render();
  }

  getImagePath() {
    const assetId = this.data.assetId || this.id;
    if (this.data.category === 'animal') {
      return `assets/images/characters/animals/standees/${assetId}.png`;
    }
    if (this.data.category === 'townsfolk') {
      return `assets/images/characters/townsfolk/standees/${this.id}.png`;
    }
    return `assets/images/characters/standees/${this.id}.png`;
  }

  getAvatarPath() {
    const assetId = this.data.assetId || this.id;
    if (this.data.category === 'animal') {
      return `assets/images/characters/animals/avatars/${assetId}.png`;
    }
    if (this.data.category === 'townsfolk') {
      return `assets/images/characters/townsfolk/avatars/${this.id}.png`;
    }
    return `assets/images/characters/avatars/${this.id}.png`;
  }

  getWerewolfPath() {
    if (this.data.category === 'animal' && this.id.startsWith('barnaby')) {
      return 'assets/images/characters/animals/standees/barnaby-werewolf.png';
    }
    return 'assets/images/characters/standees/villager-werewolf.png';
  }

  getInfectedImagePath() {
    // 守犬被咬後立即改用帶血痕的狼犬立繪；居民則保留原貌直到滿月真正狼化。
    if (this.isInfected && this.data.category === 'animal' && this.id.startsWith('barnaby')) {
      return this.getWerewolfPath();
    }
    return this.getImagePath();
  }

  applyCharacterArt() {
    const normalImage = this.el?.querySelector('.standee-char-img');
    if (normalImage) normalImage.src = this.getInfectedImagePath();
  }

  render() {
    this.el = document.createElement('div');
    this.el.className = `paper-standee-npc ${this.id}`;
    this.el.id = `npc-${this.id}`;
    this.el.style.left = `${this.x}px`;
    this.el.style.top = `${this.baseY}px`;
    this.el.style.zIndex = `${10 + Math.round(this.depthOffset)}`;

    this.el.innerHTML = `
      <div class="standee-wrapper">
        <div class="standee-badge-bubble ready-check" style="display:none;">✓</div>
        <div class="standee-work-tag" style="display:none;"></div>
        <div class="standee-progress-bar" style="display:none;">
          <div class="standee-progress-fill"></div>
        </div>
        <div class="paper-card-body standee-has-image">
          <img class="standee-char-img" src="${this.getInfectedImagePath()}" alt="${this.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
          <div class="paper-cut-figure" style="background-color: ${this.color}; display: none;">
            <div class="figure-head">
              <div class="figure-eyes"></div>
            </div>
            <div class="figure-torso">
              <span class="figure-icon">${this.getRoleIcon()}</span>
            </div>
            <div class="figure-feet">
              <div class="foot foot-l"></div>
              <div class="foot foot-r"></div>
            </div>
          </div>
          <div class="werewolf-card-back">
            <img class="werewolf-standee-img" src="${this.getWerewolfPath()}" alt="Werewolf" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
            <div class="werewolf-figure" style="display: none;">🐺</div>
          </div>
        </div>
        <div class="standee-shadow"></div>
      </div>
    `;

    this.el.addEventListener('click', (e) => {
      e.stopPropagation();
      this.onClick();
    });

    if (this.container) {
      this.container.appendChild(this.el);
    }
  }

  getRoleIcon() {
    const icons = {
      father_lawrence: '✝',
      brother_august: '📜',
      sister_claire: '🩹',
      ellie: '🌿',
      thomas: '🔨',
      hans: '🔭',
      raymond: '🛡',
      bruno: '⛏',
      silva: '🏹',
      peter: '🍞'
    };
    return icons[this.id] || '👤';
  }

  onClick() {
    if (!this.isPresent || this.state === 'EXITING_FOR_TASK' || this.state === 'OFFSCREEN_WORKING') return;
    if (this.isClickLocked) return;

    if (this.state === 'READY') {
      // 點收任務成果
      this.claimTaskReward();
      return;
    }

    if (this.state === 'WEREWOLF') {
      // 狼人狀態由衛兵壓制
      window.lunarEventBus.emit('WEREWOLF_ATTACKED', { npc: this });
      return;
    }

    // 待機角色被點擊時，先在原地晃兩下，再把臉部特寫交給最上層對談 UI。
    this.isClickLocked = true;
    this.isIdleWalking = false;
    if (this.el) {
      this.el.classList.remove('is-walking');
      this.el.classList.add('is-clicked-shake');
    }
    if (window.soundEngine) window.soundEngine.playClick();

    window.setTimeout(() => {
      if (this.el) this.el.classList.remove('is-clicked-shake');
      window.lunarEventBus.emit('CHARACTER_CLICKED', { npc: this });
    }, 440);
  }

  unlockInteraction() {
    this.isClickLocked = false;
  }

  // 接獲委任：離開畫面執行一整回合，完成後才由邊界回歸。
  assignTask(task) {
    this.isClickLocked = false;
    this.currentTask = task;
    this.taskTotal = task.duration;
    this.taskTimer = task.duration;
    this.taskTurnsRemaining = Math.max(1, Number(task.workDays) || 1);
    this.exitSide = this.getTaskExitSide(task);
    this.targetX = task.holdPosition ? Number(task.workX) : this.getOutsideX(this.exitSide);
    this.returnTargetX = this.getReturnTargetX();
    this.currentWorkName = task.workName || task.title;

    // 前哨任務在場內步行到指定防線駐守；其餘任務才離場執行。
    this.state = task.holdPosition ? 'WALKING_TO_GUARD' : 'EXITING_FOR_TASK';
    this.facingDir = this.targetX >= this.x ? 1 : -1;
    this.updateFacing();
    this.updateVisualState();

    if (window.soundEngine) {
      window.soundEngine.playCardSlide();
    }
  }

  tick(dt) {
    // 瀏覽器背景節流或不同執行器可能傳入極小時間差；保留最低動畫步長，
    // 避免角色看似只在原地晃動、實際 left 位移小到不可見。
    dt = Math.min(0.1, Math.max(Number(dt) || 0, 1 / 60));
    this.depthOffset += (this.targetDepthOffset - this.depthOffset) * Math.min(1, dt * 8);
    this.baseY = 540 + this.depthOffset;
    this.updateVerticalPosition();

    // 1. 任務角色走出畫面
    if (this.state === 'EXITING_FOR_TASK') {
      const dist = this.targetX - this.x;
      const step = this.walkSpeed * dt;

      if (Math.abs(dist) <= step) {
        this.x = this.targetX;
        this.setPresent(false);
        this.state = 'OFFSCREEN_WORKING';
        this.updateVisualState();
        if (this.taskTurnsRemaining <= 0) this.completeOffscreenTurn();
      } else {
        this.facingDir = dist > 0 ? 1 : -1;
        this.x += this.facingDir * step;
      }
      this.updatePosition();
      return;
    }

    // 1b. 前哨守備走到森林柵欄前方並留在場內，讓玩家看見防線是否已啟動。
    if (this.state === 'WALKING_TO_GUARD') {
      const dist = this.targetX - this.x;
      const step = this.walkSpeed * dt;
      if (Math.abs(dist) <= step) {
        this.x = this.targetX;
        this.state = 'GUARDING';
        this.updateVisualState();
        window.lunarEventBus?.emit('GUARD_POST_REACHED', { npc: this, task: this.currentTask });
      } else {
        this.facingDir = dist > 0 ? 1 : -1;
        this.x += this.facingDir * step;
      }
      this.updatePosition();
      return;
    }

    if (this.state === 'GUARDING') return;

    // 2. 畫面外執行任務，等待下一個破曉。
    if (this.state === 'OFFSCREEN_WORKING') {
      return;
    }

    // 3. 完成一回合後，從畫面外回歸城鎮。
    if (this.state === 'RETURNING_FROM_TASK' || this.state === 'ENTERING_SCENE') {
      const dist = this.returnTargetX - this.x;
      const step = this.walkSpeed * dt;
      if (Math.abs(dist) <= step) {
        this.x = this.returnTargetX;
        if (this.state === 'RETURNING_FROM_TASK') this.finishOffscreenTask();
        else {
          this.state = this.isInfected ? 'INFECTED' : 'IDLE';
          this.updateVisualState();
        }
      } else {
        this.facingDir = dist > 0 ? 1 : -1;
        this.x += this.facingDir * step;
      }
      this.updatePosition();
      return;
    }

    // 4. 舊任務相容用返程狀態
    if (this.state === 'RETURNING') {
      const dist = this.homeX - this.x;
      const step = this.walkSpeed * dt;

      if (Math.abs(dist) <= step) {
        this.x = this.homeX;
        this.state = this.isInfected ? 'INFECTED' : 'IDLE';
        this.updateVisualState();
      } else {
        this.facingDir = dist > 0 ? 1 : -1;
        this.x += this.facingDir * step;
      }
      this.updatePosition();
      return;
    }

    // 5. 閒暇無事時：於常駐區域附近自然左右來回踱步漫遊 (IDLE / INFECTED)
    if (this.state === 'IDLE' || this.state === 'INFECTED') {
      // 只有靜止等待中的角色才倒數；已開始走路就必須走到目的地，
      // 不能每一幀重新觸發計時而在中間停住。
      if (!this.isIdleWalking) {
        this.idleTimer -= dt;
        if (this.idleTimer <= 0) {
          // 每次從整條世界橫軸選擇遠方終點，形成真正的長距離自然巡走。
          let nextTarget = this.x;
          let attempts = 0;
          const minWorldX = 80;
          const maxWorldX = Math.max(minWorldX, this.worldWidth - this.worldEdgeInset);
          while (Math.abs(nextTarget - this.x) < 600 && attempts < 12) {
            // 長距離巡走要真的抵達橫軸起點或終點，不再抽取中間短點。
            // 端點保留小幅隨機差，讓不同角色不會完全重疊。
            const walkToRight = Math.random() >= 0.5;
            // 終點區留出足夠的橫向寬度，搭配 Y 軌道避免多人擠在同一個端點。
            const edgeJitter = Math.random() * 360;
            nextTarget = walkToRight
              ? maxWorldX - edgeJitter
              : minWorldX + edgeJitter;
            attempts++;
          }
          this.idleTargetX = Math.max(minWorldX, Math.min(maxWorldX, nextTarget));
          this.isIdleWalking = true;
          this.facingDir = this.idleTargetX >= this.x ? 1 : -1;
          this.updateFacing();
          if (this.el) this.el.classList.add('is-walking');
        }
      }

      if (this.isIdleWalking) {
        const dist = this.idleTargetX - this.x;
        const step = this.idleSpeed * dt;
        if (Math.abs(dist) <= step) {
          this.x = this.idleTargetX;
          this.isIdleWalking = false;
          this.idleTimer = 0.1 + Math.random() * 0.25;
          if (this.el) this.el.classList.remove('is-walking');
        } else {
          this.facingDir = dist > 0 ? 1 : -1;
          this.x += this.facingDir * step;
          this.updateFacing();
        }
        this.updatePosition();
      }
    }
  }

  updatePosition() {
    if (this.el) {
      this.el.style.left = `${this.x}px`;
    }
  }

  updateVerticalPosition() {
    if (this.el) this.el.style.top = `${this.baseY}px`;
  }

  getOutsideX(side) {
    return side === 'right' ? this.worldWidth + 190 : -190;
  }

  isForestRotator() {
    return this.id === 'silva' || this.id === 'raymond';
  }

  getTaskExitSide(task) {
    if (this.isForestRotator()) return 'right';
    return Number(task.workX) >= this.worldWidth / 2 ? 'right' : 'left';
  }

  getReturnTargetX() {
    if (this.isForestRotator()) return 1760 + Math.random() * 420;
    return Math.max(180, Math.min(this.worldWidth - 280, this.homeX + (Math.random() - 0.5) * 280));
  }

  setPresent(present) {
    this.isPresent = present;
    if (this.el) this.el.style.display = present ? '' : 'none';
  }

  // 工坊緊急調度可喚回原本不在畫面中的專才；不是複製角色，而是讓同一個 NPC 從工坊現身。
  summonForWorkshop(workshopX) {
    if (this.isPresent) return;
    const safeX = Math.max(120, Math.min(this.worldWidth - 180, Number(workshopX) || this.homeX));
    this.x = safeX;
    this.targetX = safeX;
    this.returnTargetX = safeX;
    this.state = this.isInfected ? 'INFECTED' : 'IDLE';
    this.isIdleWalking = false;
    this.setPresent(true);
    this.updatePosition();
    this.updateVisualState();
  }

  enterScene(side = null) {
    const entrySide = side || (this.isForestRotator() ? 'right' : (Math.random() >= 0.5 ? 'right' : 'left'));
    this.exitSide = entrySide;
    this.x = this.getOutsideX(entrySide);
    this.returnTargetX = this.getReturnTargetX();
    this.setPresent(true);
    this.state = 'ENTERING_SCENE';
    this.isIdleWalking = false;
    this.updatePosition();
    this.updateVisualState();
  }

  completeOffscreenTurn() {
    if (this.state === 'EXITING_FOR_TASK') {
      // 若破曉早於角色離場，抵達邊界後立即折返。
      this.taskTurnsRemaining = 0;
      return;
    }
    if (this.state === 'GUARDING') {
      this.taskTurnsRemaining -= 1;
      if (this.taskTurnsRemaining > 0) {
        this.updateVisualState();
        return;
      }
      this.finishStationedTask();
      return;
    }
    if (this.state !== 'OFFSCREEN_WORKING') return;
    this.taskTurnsRemaining -= 1;
    if (this.taskTurnsRemaining > 0) return;

    this.x = this.getOutsideX(this.exitSide);
    this.setPresent(true);
    this.state = 'RETURNING_FROM_TASK';
    // 工作在畫面外已完成；效果於破曉立即生效，角色則繼續走回城鎮。
    if (this.currentTask?.id === 'task_light_beacon') {
      window.lunarHaven?.clockTower?.lightBeacon();
    }
    this.updatePosition();
    this.updateVisualState();
  }

  finishOffscreenTask() {
    const task = this.currentTask;
    this.currentTask = null;
    this.taskTurnsRemaining = 0;
    this.state = this.isInfected ? 'INFECTED' : 'IDLE';
    this.idleTimer = 0.5 + Math.random() * 0.8;
    this.isIdleWalking = false;
    this.updateVisualState();
    if (task && window.lunarEventBus) {
      window.lunarEventBus.emit('TASK_COMPLETED', { npc: this, task, reward: task.reward });
    }
    if (window.soundEngine) window.soundEngine.playTaskComplete();
  }

  finishStationedTask() {
    const task = this.currentTask;
    this.currentTask = null;
    this.taskTurnsRemaining = 0;
    this.state = this.isInfected ? 'INFECTED' : 'IDLE';
    this.idleTimer = 0.5 + Math.random() * 0.8;
    this.isIdleWalking = false;
    this.updateVisualState();
    if (task && window.lunarEventBus) window.lunarEventBus.emit('TASK_COMPLETED', { npc: this, task, reward: task.reward });
    if (window.soundEngine) window.soundEngine.playTaskComplete();
  }

  setWalkLane(lane) {
    this.walkLane = Math.max(0, lane);
    this.targetDepthOffset = this.walkLane * 10 + this.depthJitter;
  }

  restoreWalkLane() {
    this.setWalkLane(this.homeWalkLane);
  }

  // 自主漫步的角色在路段被佔據時讓路並掉頭；工作任務不會被此規則中斷。
  canYieldToCrowd() {
    return (this.state === 'IDLE' || this.state === 'INFECTED')
      && !this.currentTask
      && !this.isClickLocked
      && performance.now() >= this.avoidanceUntil;
  }

  yieldToCrowd(occupiedX) {
    if (!this.canYieldToCrowd()) return false;

    const minWorldX = 80;
    const maxWorldX = Math.max(minWorldX, this.worldWidth - this.worldEdgeInset);
    const wasMovingRight = this.isIdleWalking
      ? this.idleTargetX >= this.x
      : this.x < occupiedX;
    const edgeJitter = 90 + Math.random() * 270;
    this.idleTargetX = wasMovingRight
      ? minWorldX + edgeJitter
      : maxWorldX - edgeJitter;
    this.facingDir = this.idleTargetX >= this.x ? 1 : -1;
    this.isIdleWalking = true;
    this.idleTimer = 0;
    this.avoidanceUntil = performance.now() + 1400;
    this.updateFacing();
    if (this.el) this.el.classList.add('is-walking');
    return true;
  }

  updateFacing() {
    const cardBody = this.el?.querySelector('.paper-card-body');
    if (cardBody) {
      // 角色保持固定朝向，避免每次左右折返都整張立繪翻面造成暈眩。
      // facingDir 仍保留給目的地邏輯與未來的獨立朝向素材使用。
      cardBody.style.transform = 'none';
    }
  }

  claimTaskReward() {
    if (this.state !== 'READY' || !this.currentTask) return;
    const task = this.currentTask;
    window.lunarEventBus.emit('TASK_COMPLETED', {
      npc: this,
      task: task,
      reward: task.reward
    });

    this.currentTask = null;

    // 若距離常駐點較遠，轉身快步走回鎮中心
    if (Math.abs(this.x - this.homeX) > 20) {
      this.state = 'RETURNING';
      this.facingDir = this.homeX >= this.x ? 1 : -1;
      this.updateFacing();
    } else {
      this.state = this.isInfected ? 'INFECTED' : 'IDLE';
    }
    this.updateVisualState();
  }

  setInfected(infected = true) {
    this.isInfected = infected;
    if (infected) {
      this.el.classList.add('is-infected');
      if (this.state === 'IDLE') this.state = 'INFECTED';
    } else {
      this.el.classList.remove('is-infected');
      if (this.state === 'INFECTED') this.state = 'IDLE';
    }
    this.applyCharacterArt();
    this.updateVisualState();
  }

  transformToWerewolf() {
    this.isWerewolf = true;
    this.state = 'WEREWOLF';
    this.el.classList.add('is-werewolf-flip');
    if (window.soundEngine) {
      window.soundEngine.playCardFlip();
      window.soundEngine.playWolfHowl();
    }
  }

  suppressWerewolf() {
    this.isWerewolf = false;
    this.isInfected = false;
    this.state = 'IDLE';
    this.el.classList.remove('is-werewolf-flip');
    this.el.classList.remove('is-infected');
    this.applyCharacterArt();
    this.updateVisualState();
  }

  // 被高塔箭矢擊倒的狼人永久離開本局人口池，不能被輪換系統重新叫回。
  removeFromTown(reason = '此角色已離開小鎮') {
    this.currentTask = null;
    this.isInfected = false;
    this.isWerewolf = false;
    this.isEliminated = true;
    this.state = 'ELIMINATED';
    this.el?.classList.remove('is-infected', 'is-werewolf-flip');
    this.setPresent(false);
    window.lunarEventBus?.emit('NPC_REMOVED_FROM_TOWN', { npc: this, reason });
  }

  updateVisualState() {
    const readyCheck = this.el.querySelector('.ready-check');
    const progressBar = this.el.querySelector('.standee-progress-bar');
    const workTag = this.el.querySelector('.standee-work-tag');

    // 動畫狀態切換
    if (this.state === 'EXITING_FOR_TASK' || this.state === 'WALKING_TO_GUARD' || this.state === 'RETURNING_FROM_TASK' || this.state === 'ENTERING_SCENE' || this.state === 'RETURNING') {
      this.el.classList.add('is-running');
      this.el.classList.remove('is-working');
    } else if (this.state === 'WORKING' || this.state === 'GUARDING') {
      this.el.classList.remove('is-running');
      this.el.classList.add('is-working');
    } else {
      this.el.classList.remove('is-running');
      this.el.classList.remove('is-working');
    }

    // 任務成果不再以場內綠勾等待玩家領取；完成後會直接從畫面外回歸。
    if (readyCheck) readyCheck.style.display = 'none';
    if (progressBar) progressBar.style.display = 'none';

    // 顯示工作站地點標籤（如：前往鐵匠鋪、鎮外林道）
    if (workTag) {
      if (this.state === 'EXITING_FOR_TASK') {
        workTag.textContent = `離場執行：${this.currentWorkName}（${this.taskTurnsRemaining} 天）`;
        workTag.style.display = 'block';
      } else if (this.state === 'WALKING_TO_GUARD' || this.state === 'GUARDING') {
        workTag.textContent = this.state === 'GUARDING' ? `前哨駐守中（${this.taskTurnsRemaining} 天）` : `前往：${this.currentWorkName}`;
        workTag.style.display = 'block';
      } else if (this.state === 'RETURNING_FROM_TASK') {
        workTag.textContent = '任務完成・歸隊中';
        workTag.style.display = 'block';
      } else {
        workTag.style.display = 'none';
      }
    }
  }
}

window.NPC = NPC;
