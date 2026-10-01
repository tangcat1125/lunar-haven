/**
 * WorkshopDispatchUI - 資源不足時的工坊緊急調度介面。
 * 不新增角色副本，而是召回既有專才離場工作一回合。
 */
class WorkshopDispatchUI {
  constructor(taskSystem, characterManager) {
    this.taskSystem = taskSystem;
    this.characterManager = characterManager;
    this.layer = document.getElementById('workshop-dispatch-layer');
    this.title = document.getElementById('workshop-dispatch-title');
    this.description = document.getElementById('workshop-dispatch-description');
    this.optionsEl = document.getElementById('workshop-dispatch-options');
    this.status = document.getElementById('workshop-dispatch-status');
    this.workshops = this.createWorkshops();
    this.bindEvents();
  }

  createWorkshops() {
    return {
      bakery: {
        name: '麵包工坊', x: 470,
        description: '麥袋見底時，麵包師能連夜點爐，補回鎮上的存糧。',
        options: [{ npcId: 'peter', title: '召集彼得緊急烘焙', detail: '一回合後帶回 5 份糧食。', task: { id: 'workshop_bake_rations', title: '連夜烘焙配給麵包', workName: '麵包工坊石爐', duration: 7, reward: { food: 5 } } }]
      },
      blacksmith: {
        name: '打鐵工坊', x: 790,
        description: '缺少鐵料時，鐵匠能從回收料與爐渣中整備可用鍛材。',
        options: [{ npcId: 'thomas', title: '召集托馬斯整備鍛材', detail: '一回合後帶回 2 份鐵礦。', task: { id: 'workshop_reclaim_iron', title: '回收爐渣整備鍛材', workName: '打鐵工坊熔爐', duration: 7, reward: { iron: 2 } } }]
      },
      church: {
        name: '教堂藥房', x: 1120,
        description: '傷者增加時，修士可整理藥房、分裝救護補給。',
        options: [{ npcId: 'brother_august', title: '召集奧古斯特整理藥房', detail: '一回合後帶回藥水、藥品與紗布各 1。', task: { id: 'workshop_prepare_medicine', title: '整理教堂救護藥箱', workName: '教堂藥房', duration: 7, reward: { healing_potion: 1, medicine: 1, bandage: 1 } } }]
      },
      forest: {
        name: '森林採集站', x: 2420,
        description: '森林邊界可調度採集者，補回救命的清水、藥草與木料。',
        options: [{ npcId: 'ellie', title: '召集艾莉緊急採集', detail: '一回合後帶回藥草 2、清水 3、木材 2。', task: { id: 'workshop_forest_supplies', title: '森林緊急採集補給', workName: '森林採集站', duration: 8, reward: { aconite: 2, water: 3, wood: 2 } } }]
      }
    };
  }

  bindEvents() {
    document.querySelectorAll('[data-workshop]').forEach(element => {
      const open = () => this.open(element.dataset.workshop);
      element.addEventListener('click', open);
      element.addEventListener('keydown', event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); }
      });
    });
    document.getElementById('workshop-dispatch-close')?.addEventListener('click', () => this.close());
    this.layer?.addEventListener('click', event => { if (event.target === this.layer) this.close(); });
    window.lunarEventBus?.on('RESOURCE_SHORTAGE', ({ missing }) => this.highlightShortage(missing));
  }

  highlightShortage(missing = {}) {
    const labels = { food: '麵包工坊', iron: '打鐵工坊', medicine: '教堂藥房', bandage: '教堂藥房', healing_potion: '教堂藥房', aconite: '森林採集站', water: '森林採集站', wood: '森林採集站' };
    const destinations = [...new Set(Object.keys(missing).map(key => labels[key]).filter(Boolean))];
    document.querySelectorAll('[data-workshop]').forEach(element => element.classList.toggle('is-shortage-relevant', destinations.includes(this.workshops[element.dataset.workshop]?.name)));
  }

  open(key) {
    const workshop = this.workshops[key];
    if (!workshop || !this.layer) return;
    this.title.textContent = `⚒ ${workshop.name}：緊急調度`;
    this.description.textContent = workshop.description;
    this.status.textContent = `目前守望精力：${this.taskSystem.economy.resources.actionPoints} 點（每次調度消耗 1 點）`;
    this.optionsEl.replaceChildren();
    workshop.options.forEach(option => {
      const button = document.createElement('button');
      button.className = 'workshop-dispatch-option';
      button.type = 'button';
      button.innerHTML = `<strong>${option.title}</strong><span>${option.detail}</span>`;
      button.addEventListener('click', () => this.dispatch(workshop, option));
      this.optionsEl.appendChild(button);
    });
    this.layer.style.display = 'flex';
  }

  dispatch(workshop, option) {
    const npc = this.characterManager.getNPC(option.npcId);
    const result = this.taskSystem.dispatchWorkshopTask(npc, option.task, workshop);
    if (!result.success) {
      this.status.textContent = `無法調度：${result.reason}`;
      return;
    }
    this.close();
  }

  close() {
    if (this.layer) this.layer.style.display = 'none';
  }
}

window.WorkshopDispatchUI = WorkshopDispatchUI;
