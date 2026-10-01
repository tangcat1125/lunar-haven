const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'js', 'systems', 'CrisisCycleSystem.js'), 'utf8');
const listeners = new Map();
const eventBus = {
  on(type, handler) {
    const handlers = listeners.get(type) || [];
    handlers.push(handler);
    listeners.set(type, handlers);
  },
  emit(type, data) {
    (listeners.get(type) || []).forEach(handler => handler(data));
  }
};

let transforms = 0;
const infectedNpc = { id: 'martha', name: '農婦 瑪莎', isInfected: true, isWerewolf: false };
const infectionTracker = {
  characterManager: {
    getInfectedNPCs: () => infectedNpc.isInfected && !infectedNpc.isWerewolf ? [infectedNpc] : [],
    getAllNPCs: () => [infectedNpc],
    getWerewolfNPCs: () => infectedNpc.isWerewolf ? [infectedNpc] : []
  },
  triggerFullMoonTransform() {
    transforms += 1;
    infectedNpc.isInfected = false;
    infectedNpc.isWerewolf = true;
    eventBus.emit('WEREWOLVES_SPAWNED', { count: 1, names: [infectedNpc.name] });
  },
  processWerewolfRampageDay() {},
  eliminateWerewolfByArcher() { return []; }
};

const context = {
  console,
  window: {
    lunarEventBus: eventBus,
    LUNAR_CONFIG: { INITIAL_DATE: '2026-10-01' },
    lunarCalendar: {
      solarToLunar: () => ({ year: 2026, month: 8, day: 14, isLeap: false })
    },
    moonPhaseCalculator: {
      calculatePhaseByLunar: () => ({ id: 'full_moon' }),
      isFullMoonCrisisPeriod: day => day >= 14 && day <= 16
    },
    soundEngine: { playPageTurn() {} }
  }
};

vm.createContext(context);
vm.runInContext(source, context);

const economy = { resources: { silver_swords: 0, defense: 100 }, addDailyTurnPoints: () => 3, modifyDefense() {} };
const clockTower = { ringBell() {}, extinguishBeacon() {} };
const wolfRaidSystem = { raidResolved: true, startRaid() {}, canSilvaUseTowerDefense: () => false };
const crisis = new context.window.CrisisCycleSystem(economy, infectionTracker, clockTower, wolfRaidSystem);

crisis.advanceOneDay();
if (transforms !== 1 || !infectedNpc.isWerewolf) throw new Error('滿月期首次進入時必須將感染者狼化');
crisis.advanceOneDay();
if (transforms !== 1) throw new Error('同一個農曆月的滿月期不得重複觸發狼化');

console.log('✓ 滿月期會狼化感染者，且同月只觸發一次');
