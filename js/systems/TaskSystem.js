/**
 * TaskSystem - 任務指派與驗收中樞
 * 處理「選取任務 ➜ 資源扣減 ➜ 角色離場執行 ➜ 跨回合後歸隊結算」
 */
class TaskSystem {
  constructor(economy) {
    this.economy = economy;
    if (window.lunarEventBus) {
      window.lunarEventBus.on('TASK_COMPLETED', ({ npc, task, reward }) => {
        this.complete(npc, task, reward);
      });
    }
  }

  assign(npc, task, workDays = 1) {
    if (!npc || !task) return { success: false, reason: '無效目標' };

    const days = Math.max(1, Math.min(4, Math.round(Number(workDays) || 1)));
    const scaleValues = (values = {}) => Object.fromEntries(
      Object.entries(values).map(([key, value]) => [key, value * days])
    );
    const assignment = {
      ...task,
      baseTaskId: task.id,
      workDays: days,
      cost: scaleValues(task.cost),
      reward: scaleValues(task.reward)
    };

    // 檢查資源是否足夠
    if (!this.economy.canAfford(assignment.cost)) {
      const missing = Object.fromEntries(Object.entries(assignment.cost || {})
        .filter(([resource, amount]) => (this.economy.resources[resource] || 0) < amount)
        .map(([resource, amount]) => [resource, amount - (this.economy.resources[resource] || 0)]));
      window.lunarEventBus?.emit('RESOURCE_SHORTAGE', { npc, task: assignment, missing });
      return { success: false, reason: '物資不足' };
    }

    // 扣除成本
    this.economy.consume(assignment.cost);

    // 指派角色作業
    npc.assignTask(assignment);

    if (window.lunarEventBus) {
      window.lunarEventBus.emit('TASK_ASSIGNED', {
        npc,
        task: assignment,
        speech: npc.speech
      });
    }

    return { success: true, task: assignment };
  }

  // 資源告急時，工坊可把對應專才叫回來處理一次無前置成本的緊急補給。
  dispatchWorkshopTask(npc, task, workshop) {
    if (!npc || !task || !workshop) return { success: false, reason: '無效工坊調度' };
    if (!this.economy.hasActionPoints()) return { success: false, reason: '今日守望點數已耗盡' };
    if (npc.currentTask || npc.state === 'EXITING_FOR_TASK' || npc.state === 'OFFSCREEN_WORKING') {
      return { success: false, reason: `${npc.name}正在執行其他工作` };
    }

    const assignment = {
      ...task,
      baseTaskId: task.id,
      workDays: 1,
      cost: {},
      reward: { ...(task.reward || {}) },
      workshopDispatch: true,
      workshopName: workshop.name,
      workX: workshop.x
    };
    npc.summonForWorkshop(workshop.x);
    npc.assignTask(assignment);
    const remainingActionPoints = this.economy.consumeActionPoint();
    window.lunarEventBus?.emit('TASK_ASSIGNED', { npc, task: assignment, speech: npc.speech, workshopDispatch: true, workshop });
    window.lunarEventBus?.emit('WORKSHOP_DISPATCHED', { npc, task: assignment, workshop, remainingActionPoints });
    return { success: true, task: assignment, remainingActionPoints };
  }

  complete(npc, task, reward) {
    // 結算收益
    this.economy.add(reward);

    // 取水與藥草採集完成後，物資視為直接送入教堂庫房。
    if (task.id === 'task_fetch_water' || task.id === 'task_gather_aconite') {
      window.lunarEventBus?.emit('CHURCH_SUPPLY_DELIVERED', {
        npc,
        task,
        reward,
        destination: '中央教堂庫房'
      });
    }

    if (task.id === 'task_craft_fence') {
      window.lunarEventBus?.emit('PALISADE_BUILT', { npc, task });
    }

    if (window.lunarEventBus) {
      window.lunarEventBus.emit('RESOURCE_COLLECTED', {
        npc,
        task,
        reward
      });
    }
  }
}

window.TaskSystem = TaskSystem;
