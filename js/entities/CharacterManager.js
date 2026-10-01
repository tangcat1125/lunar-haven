/**
 * CharacterManager - 角色管理中樞
 * 管理 10 位核心執行 NPC 與背景閒晃小紙偶的生成、點擊分發與生命週期更新
 */
class CharacterManager {
  constructor(worldContainer) {
    this.container = worldContainer;
    this.npcs = new Map();
    this.pedestrians = [];
    this.maxVisibleResidents = 6;
    this.crowdCheckElapsed = 0;
  }

  init() {
    // 初始站位分散到整條世界橫軸，避免所有角色擠在中央城鎮。
    const spawnX = {
      barnaby: 260,
      bruno: 160,
      peter: 560,
      thomas: 720,
      brother_august: 900,
      toby: 1080,
      father_lawrence: 1260,
      hans: 1450,
      martha: 1680,
      raymond: 1940,
      ellie: 2180,
      luna: 2360,
      sister_claire: 2480,
      silva: 2660
    };

    // 1. 實例化 10 位核心主角色
    if (window.LUNAR_CHARACTERS) {
      window.LUNAR_CHARACTERS.forEach(data => {
        const npc = new NPC({
          ...data,
          homeX: spawnX[data.id] ?? data.homeX,
          walkLane: this.npcs.size % 5
        }, this.container);
        this.npcs.set(data.id, npc);
      });
    }

    // 2. 實例化小鎮路人居民與城鎮動物（忠犬巴納比、靈貓露娜、羊童托比、裁縫瑪莎等）
    if (window.TOWNSFOLK_CHARACTERS) {
      window.TOWNSFOLK_CHARACTERS.forEach(data => {
        const npc = new NPC({
          ...data,
          homeX: spawnX[data.id] ?? data.homeX,
          walkLane: this.npcs.size % 5
        }, this.container);
        this.npcs.set(data.id, npc);
      });

      // 犬隻是唯一允許同回合重複出現的角色類型；建立第二隻共用美術的巡邏犬，上限固定為兩隻。
      const dogData = window.TOWNSFOLK_CHARACTERS.find(data => data.id === 'barnaby');
      if (dogData) {
        const patrolDog = new NPC({
          ...dogData,
          id: 'barnaby_patrol_2',
          assetId: 'barnaby',
          name: '守衛巡邏犬',
          englishName: 'Town Patrol Dog',
          duplicateOf: 'barnaby',
          homeX: 2520,
          walkLane: 4
        }, this.container);
        this.npcs.set(patrolDog.id, patrolDog);
      }
    }

    this.initializeRotatingPopulation();
    if (window.lunarEventBus) {
      window.lunarEventBus.on('DAY_ADVANCED', () => {
        this.resolveOffscreenTasks();
        this.rotatePopulation();
      });
    }
  }

  tick(dt) {
    // 核心角色心跳
    for (const npc of this.npcs.values()) {
      if (npc.isPresent) npc.tick(dt);
    }

    // 碰撞檢查不需要每一個畫面幀都跑；降低至每秒約七次可減少排序與樣式重算。
    this.crowdCheckElapsed += dt;
    if (this.crowdCheckElapsed >= 0.14) {
      this.crowdCheckElapsed = 0;
      this.resolveCrowdTurnarounds();
      this.separateNearbyNPCs();
    }

    // 背景路人輕微踱步
    this.pedestrians.forEach(p => {
      p.x += p.speed;
      if (p.x < p.minX || p.x > p.maxX) p.speed *= -1;
      p.el.style.left = `${p.x}px`;
    });
  }

  initializeRotatingPopulation() {
    const allNPCs = this.getAllNPCs();
    const townResidents = allNPCs.filter(npc => !npc.isForestRotator());
    const initialTown = this.shuffle(townResidents).slice(0, this.maxVisibleResidents - 1);
    const forestRotators = allNPCs.filter(npc => npc.isForestRotator());
    const initialForest = forestRotators[Math.floor(Math.random() * forestRotators.length)];

    allNPCs.forEach(npc => {
      npc.isIdleWalking = false;
      npc.setPresent(false);
    });
    initialTown.forEach(npc => npc.setPresent(true));
    if (initialForest) initialForest.enterScene('right');
  }

  resolveOffscreenTasks() {
    this.getAllNPCs().forEach(npc => npc.completeOffscreenTurn());
  }

  rotatePopulation() {
    const allNPCs = this.getAllNPCs();
    const eligibleToLeave = allNPCs.filter(npc => npc.isPresent && (npc.state === 'IDLE' || npc.state === 'INFECTED') && !npc.isClickLocked);
    const hiddenCandidates = allNPCs.filter(npc => !npc.isPresent && !npc.currentTask && npc.state !== 'OFFSCREEN_WORKING');

    if (eligibleToLeave.length > 4) {
      const leaving = eligibleToLeave[Math.floor(Math.random() * eligibleToLeave.length)];
      leaving.isIdleWalking = false;
      leaving.setPresent(false);
    }

    if (!hiddenCandidates.length) return;
    const incoming = hiddenCandidates[Math.floor(Math.random() * hiddenCandidates.length)];
    incoming.enterScene(incoming.isForestRotator() ? 'right' : null);
  }

  shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  // 自主漫步角色接近時，讓其中一人掉頭，避免所有人匯聚到同一段 X 軸後卡死。
  resolveCrowdTurnarounds() {
    const sorted = this.getAllNPCs().filter(npc => npc.isPresent).sort((a, b) => a.x - b.x);
    const occupiedDistance = 135;

    for (let i = 0; i < sorted.length - 1; i += 1) {
      const leftNpc = sorted[i];
      const rightNpc = sorted[i + 1];
      if (rightNpc.x - leftNpc.x > occupiedDistance) continue;

      const leftCanYield = leftNpc.canYieldToCrowd();
      const rightCanYield = rightNpc.canYieldToCrowd();
      if (!leftCanYield && !rightCanYield) continue;

      const leftDirection = leftNpc.isIdleWalking && leftNpc.idleTargetX >= leftNpc.x ? 1 : -1;
      const rightDirection = rightNpc.isIdleWalking && rightNpc.idleTargetX >= rightNpc.x ? 1 : -1;
      let yieldingNpc;

      if (!leftCanYield) {
        yieldingNpc = rightNpc;
      } else if (!rightCanYield) {
        yieldingNpc = leftNpc;
      } else if (leftDirection === 1 && rightDirection === 1) {
        // 同向向右時，後方角色掉頭。
        yieldingNpc = leftNpc;
      } else if (leftDirection === -1 && rightDirection === -1) {
        // 同向向左時，後方角色掉頭。
        yieldingNpc = rightNpc;
      } else {
        // 對向相遇時，固定以 ID 決定讓路方，避免每幀互相反覆掉頭。
        yieldingNpc = leftNpc.id.localeCompare(rightNpc.id) > 0 ? leftNpc : rightNpc;
      }

      const occupiedBy = yieldingNpc === leftNpc ? rightNpc.x : leftNpc.x;
      yieldingNpc.yieldToCrowd(occupiedBy);
    }
  }

  // 同一條 X 軸上接近的角色分派到不同 Y 軌道，避免立繪完全重疊。
  separateNearbyNPCs() {
    const sorted = this.getAllNPCs().filter(npc => npc.isPresent).sort((a, b) => a.x - b.x);
    const clusters = [];
    let cluster = [];

    sorted.forEach((npc) => {
      const previous = cluster[cluster.length - 1];
      if (!previous || npc.x - previous.x <= 145) {
        cluster.push(npc);
      } else {
        clusters.push(cluster);
        cluster = [npc];
      }
    });
    if (cluster.length) clusters.push(cluster);

    clusters.forEach((group) => {
      if (group.length === 1) {
        group[0].restoreWalkLane();
        return;
      }
      group.forEach((npc, index) => npc.setWalkLane(index % 5));
    });
  }

  getNPC(id) {
    return this.npcs.get(id);
  }

  getAllNPCs() {
    return Array.from(this.npcs.values()).filter(npc => !npc.isEliminated);
  }

  // 取得受傷但尚未異變的 NPC 列表
  getInfectedNPCs() {
    return this.getAllNPCs().filter(n => n.isInfected && !n.isWerewolf);
  }

  // 取得已變身狼人的 NPC 列表
  getWerewolfNPCs() {
    return this.getAllNPCs().filter(n => n.isWerewolf);
  }
}

window.CharacterManager = CharacterManager;
