/**
 * StoryJournal - 將玩家抉擇編織成可閱讀的鎮史；不是逐筆工作日誌。
 */
class StoryJournal {
  constructor() {
    this.entries = [];
    this.currentDay = 0;
    this.maxEntries = 160;
    this.bindEvents();
  }

  bindEvents() {
    if (!window.lunarEventBus) return;
    window.lunarEventBus.on('DAY_ADVANCED', d => {
      this.currentDay = d.daysPassed;
      this.record('daybreak', '寒霧退到山腳，鎮民重新分配當日能守住的火光與人手。', 1);
    });
    window.lunarEventBus.on('TASK_ASSIGNED', d => {
      const text = d.workshopDispatch
        ? `${d.workshop?.name || d.task.workshopName}的爐火在缺糧的夜裡忽然復燃。${d.npc.name}被急召回來，接過「${d.task.title}」的工具後便匆匆離鎮；眾人把希望交給這一回合的等待。`
        : `${d.npc.name}在廣場火盆熄滅前接過「${d.task.title}」的委任，帶著補給走出城門；接下來的一段日子，城裡少了一雙手，卻多了一份被寄託的希望。`;
      this.record('assignment', text, d.workshopDispatch ? 4 : 3);
    });
    window.lunarEventBus.on('RESOURCE_COLLECTED', d => this.record('return', `${d.npc.name}終於踏著雪泥歸來。${d.task.title}換回了${this.formatResources(d.reward)}，圍在門口等待的人群這才鬆開緊握的手。`, 3));
    window.lunarEventBus.on('CHURCH_SUPPLY_DELIVERED', d => this.record('church', `${d.npc.name}把${this.formatResources(d.reward)}交進中央教堂。修道院沒有把它們當作尋常庫存，而是留給下一個需要被救回來的人。`, 4));
    window.lunarEventBus.on('SKY_ANOMALY_REPORTED', d => this.record('anomaly', `${d.reporter.name}幾乎是撞開城門跑了進來：天幕的節奏失常，時間像被無形之手推快。那句話讓每一座窗前的燈都亮得更久。`, 5));
    window.lunarEventBus.on('PALISADE_BUILT', d => this.record('defense', `${d.npc.name}在森林邊界釘下最後一根木樁。那道柵欄不算高，卻讓居民第一次相信，狼影逼近時他們仍能替彼此多爭取一段路。`, 5));
    window.lunarEventBus.on('PALISADE_BROKEN', d => this.record('breach', `${d.msg} 斷木混著雪泥散在路上，守衛只得一邊後撤、一邊把孩子與傷者引向教堂。`, 6));
    window.lunarEventBus.on('CRISIS_DEFENDED', d => this.record('defended', `${d.msg} 當最後一聲狼嚎退進林裡，守夜的人沒有歡呼，只是默默替彼此添滿了火。`, 5));
    window.lunarEventBus.on('WOLF_HUNTED_OFFSCREEN', d => this.record('hunt', `${d.hunter.name}仍在鎮外的雪林守候，箭矢與狼嚎在遠處短暫交錯。當消息傳回時，少了一隻逼近城門的野狼，也少了一分籠罩小鎮的恐懼。`, 5));
    window.lunarEventBus.on('TOWER_ARCHER_SHOT', d => this.record('archery', `${d.msg} 鐘塔下的人們屏住呼吸，直到狼影退進樹與雪的交界。`, 6));
    window.lunarEventBus.on('TOWER_ARCHER_MISSED', d => this.record('archery', `${d.msg} 弓弦仍在夜裡震動，村口的守衛把燈火舉得更高。`, 4));
    window.lunarEventBus.on('WANDERING_WOLF_SPOTTED', d => this.record('warning', `${d.msg} 平日的安靜忽然有了裂縫，家家戶戶連忙關上了朝向森林的窗。`, 5));
    window.lunarEventBus.on('WEREWOLF_EXECUTED', d => this.record('loss', `${d.msg} 沒有人為此歡呼；守望者只能把那份沉重留在古書裡，提醒後來的人，月下的防線從來不是沒有代價。`, 8));
    window.lunarEventBus.on('CRISIS_BREACHED', d => this.record('crisis', `${d.msg} 那一夜沒有人敢關窗，因為每一扇亮著的窗，都可能是下一個求救的方向。`, 6));
    window.lunarEventBus.on('VILLAGERS_BITTEN', d => this.record('injury', `${d.victims.join('、')}倒在狼牙之下。教堂的門直到清晨都沒有闔上，禱詞與煎藥聲輪流穿過長廊。`, 7));
    window.lunarEventBus.on('PATIENT_CURED', d => this.record('healing', `${d.healer?.name || '修道院'}守在病榻旁直到天色泛白，終於讓${d.npc.name}的呼吸平穩下來。那一夜，小鎮沒有失去任何一個名字。`, 7));
    window.lunarEventBus.on('WEREWOLF_RAMPAGE', d => this.record('rampage', `${d.msg} 石牆被撞得震響，仍留在鎮上的人只得把恐懼壓進喉嚨，彼此扶著撐過夜半。`, 8));
  }

  record(type, text, importance = 2) {
    if (!text) return;
    this.entries.push({ day: this.currentDay, type, importance, text: this.narrativize(text) });
    if (this.entries.length > this.maxEntries) this.entries.shift();
  }

  // 古卷不是系統日誌：把殘留的回合、數量與扣點語彙轉成故事口吻。
  narrativize(text) {
    return String(text)
      .replace(/^[^\p{L}\p{N}]+/u, '')
      .replace(/第\s*\d+\s*[日夜]/g, '又一個夜裡')
      .replace(/\d+\s*隻/g, '一群')
      .replace(/\d+\s*(?:天|回合)/g, '一段時日')
      .replace(/\d+\s*(?:點|%)/g, '一段距離')
      .replace(/\d+/g, '許多');
  }

  // 依日分章、用因果連接當日事件；重要危機優先保留，避免古書被例行曆法洗掉。
  getBookEntries(maxChapters = 24) {
    const groups = new Map();
    this.entries.forEach(entry => {
      const day = entry.day || 0;
      if (!groups.has(day)) groups.set(day, []);
      groups.get(day).push(entry);
    });

    const chapters = Array.from(groups.entries())
      .map(([day, events]) => ({ day: Number(day), events, meaningful: events.filter(event => event.type !== 'daybreak') }))
      // 例行破曉不構成故事章節；古書只記下被玩家決策或危機改變的日子。
      .filter(group => group.meaningful.length > 0)
      .map(group => this.composeChapter(group.day, group.meaningful));
    const selected = chapters
      .sort((a, b) => b.importance - a.importance || b.day - a.day)
      .slice(0, maxChapters)
      .sort((a, b) => a.day - b.day)
      .map(chapter => chapter.text);
    return selected.length ? selected : ['整個守望期裡，鎮民沒有等到能改寫命運的危機；但每一盞未熄的燈、每一次默默的巡夜，都讓月痕小鎮安然迎向下一個清晨。'];
  }

  composeChapter(day, events) {
    const meaningful = events.filter(event => event.type !== 'daybreak');
    const selected = (meaningful.length ? meaningful : events)
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 3);
    const opening = day <= 1
      ? '寒潮初起的夜裡，月痕小鎮第一次把命運交到守望者手中。'
      : '又一輪夜色落下時，城牆內外都還記得先前留下的痕跡。';
    const closure = selected.some(event => event.importance >= 6)
      ? '沒有人知道明天會帶走什麼，因此每一個決定都被鄭重記下。'
      : '於是，小鎮又多撐過了一個可以彼此照看的夜晚。';
    return {
      day,
      importance: Math.max(...selected.map(event => event.importance)),
      text: `${opening}${selected.map(event => event.text).join(' ')}${closure}`
    };
  }

  getEntries() {
    const entries = this.getBookEntries();
    return entries.length ? entries : ['守望者在寒潮初起時接手月痕小鎮。鐘塔、教堂與森林邊界都在等待第一道命令。'];
  }

  formatResources(resources = {}) {
    const phrases = {
      food: '足以暖胃的存糧', wood: '一批乾燥木料', iron: '沉甸甸的鐵礦', silver: '可用於防衛的銀粉',
      aconite: '新鮮藥草', water: '清澈的教堂用水', resin: '帶著松香的樹脂', healing_potion: '溫熱的療傷藥水',
      medicine: '修道院備妥的藥品', bandage: '乾淨的包紮紗布', holy_water: '祝禱後的聖水',
      defense: '更穩固的防線', morale: '重新振作的士氣', silver_swords: '可守住月夜的銀質短劍'
    };
    const parts = Object.entries(resources).filter(([, value]) => Number(value) > 0).map(([key]) => phrases[key] || '一份守望成果');
    return parts.length ? parts.join('、') : '一份守望成果';
  }
}

window.StoryJournal = StoryJournal;
