/**
 * InfectionTracker - 狼毒感染與救治賽跑追蹤器
 * 管理「爪痕撕裂、紫斑潛伏、修女包紮、草藥解毒、滿月翻面」因果閉環
 */
class InfectionTracker {
  constructor(characterManager, economy) {
    this.characterManager = characterManager;
    this.economy = economy;

    this.stats = {
      totalBitten: 0,
      totalCured: 0,
      totalTransformed: 0
    };

    window.lunarEventBus?.on('DAY_ADVANCED', () => this.processWerewolfRampageDay());
  }

  // 野狼或狼人突破防線時，隨機咬傷仍留在鎮上的人類村民。
  biteRandomVillagers(count = 1, excludeIds = [], attacker = null) {
    const excluded = new Set(excludeIds);
    const candidates = this.characterManager.getAllNPCs().filter(n => (
      !excluded.has(n.id)
      && n.data?.category !== 'animal'
      && n.isPresent !== false
      && !n.isEliminated
      && !n.isInfected
      && !n.isWerewolf
    ));
    if (candidates.length === 0) return [];

    // 隨機選取
    const shuffled = candidates.sort(() => 0.5 - Math.random());
    const victims = shuffled.slice(0, Math.min(count, candidates.length));

    victims.forEach(v => {
      v.setInfected(true);
      this.stats.totalBitten++;
    });

    if (window.lunarEventBus) {
      window.lunarEventBus.emit('VILLAGERS_BITTEN', {
        victims: victims.map(v => v.name),
        victimNPCs: victims,
        attacker
      });
    }

    return victims;
  }

  registerBite(npc) {
    if (!npc) return;
    this.stats.totalBitten++;
    window.lunarEventBus?.emit('VILLAGERS_BITTEN', { victims: [npc.name], victimNPCs: [npc] });
  }

  // 施予狼毒解藥進行淨化
  curePatient(npc, healer = null) {
    if (!npc || !npc.isInfected) return false;

    // 禱告治療需要藥水、藥品與紗布三種物資共同完成。
    if (!this.economy.consume({ healing_potion: 1, medicine: 1, bandage: 1 })) {
      return false;
    }

    npc.setInfected(false);
    this.stats.totalCured++;

    if (window.soundEngine) {
      window.soundEngine.playTone(650, 'sine', 0.25, 0.2);
    }

    if (window.lunarEventBus) {
      window.lunarEventBus.emit('PATIENT_CURED', {
        npc: npc,
        healer: healer,
        stats: { ...this.stats }
      });
    }
    return true;
  }

  // 滿月爆發：所有未癒傷者翻面為狼人
  triggerFullMoonTransform() {
    const infectedList = this.characterManager.getInfectedNPCs();
    infectedList.forEach(npc => {
      npc.transformToWerewolf();
      npc.werewolfDaysRemaining = 3;
      this.stats.totalTransformed++;
    });

    if (infectedList.length > 0 && window.lunarEventBus) {
      window.lunarEventBus.emit('WEREWOLVES_SPAWNED', {
        count: infectedList.length,
        names: infectedList.map(n => n.name)
      });
    }
  }

  // 高塔箭手處理已完全狼化的居民：死亡／離鎮是不可逆人口損失，不得再次輪換出現。
  eliminateWerewolfByArcher(archerId = 'silva', limit = 1, playSound = true) {
    const archer = this.characterManager.getNPC(archerId);
    if (!archer) return [];
    const targets = this.characterManager.getWerewolfNPCs().slice(0, Math.max(0, limit));
    targets.forEach(target => {
      if (playSound && window.soundEngine) window.soundEngine.playArrowShot();
      target.removeFromTown('在鐘塔防衛中遭席爾瓦射殺');
      window.lunarEventBus?.emit('WEREWOLF_EXECUTED', {
        archer, target,
        msg: `${archer.name}在鐘塔防衛中射殺了已狼化的${target.name}；小鎮少了一個名字。`
      });
    });
    return targets;
  }

  processWerewolfRampageDay() {
    const activeWerewolves = this.characterManager.getWerewolfNPCs().filter(npc => (npc.werewolfDaysRemaining || 0) > 0);
    activeWerewolves.forEach(npc => {
      npc.werewolfDaysRemaining -= 1;
      // 狼化者不只是破壞建物；每個暴走夜都會咬傷一位還在鎮上的人。
      const victims = this.biteRandomVillagers(1, [npc.id], npc);
      const victimName = victims[0]?.name || '空蕩的街道';
      const landmarks = [...document.querySelectorAll('.landmark, #church-clock-tower')];
      const target = landmarks[Math.floor(Math.random() * landmarks.length)];
      target?.classList.add('is-damaged');
      this.economy.modifyDefense(-12);
      const biteText = victims.length ? `咬傷了${victimName}，` : '追逐著空蕩街道，';
      const msg = `${npc.name}在滿月狼化後的夜裡${biteText}並撞毀建物，村口的防線被迫後撤。`;
      window.lunarEventBus?.emit('WEREWOLF_RAMPAGE', { npc, victims, msg, daysRemaining: npc.werewolfDaysRemaining });
      if (npc.werewolfDaysRemaining <= 0) npc.el?.classList.add('rampage-ended');
    });
  }

  getStats() {
    return { ...this.stats };
  }
}

window.InfectionTracker = InfectionTracker;
