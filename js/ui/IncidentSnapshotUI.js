/**
 * IncidentSnapshotUI - 將咬傷事件呈現成可見的血痕事件快照。
 * 使用現有紙雕角色素材與非露骨的紅色痕跡，不以寫實傷口呈現。
 */
class IncidentSnapshotUI {
  constructor() {
    this.layer = document.getElementById('incident-snapshot-layer');
    this.dismissTimer = null;
    window.lunarEventBus?.on('VILLAGERS_BITTEN', data => this.show(data));
  }

  show({ victims = [], victimNPCs = [], attacker = null } = {}) {
    if (!this.layer) return;
    const victim = victimNPCs[0];
    const victimImage = victim?.getInfectedImagePath?.() || victim?.getImagePath?.() || 'assets/images/characters/standees/villager-werewolf.webp';
    const victimName = victim?.name || victims[0] || '鎮民';
    const attackerImage = attacker?.isWerewolf
      ? (attacker.getWerewolfPath?.() || 'assets/images/characters/standees/villager-werewolf.webp')
      : 'assets/images/wolves/wolf-raider.webp';
    const attackerName = attacker?.isWerewolf ? `${attacker.name}（狼化）` : '入侵野狼';
    this.layer.innerHTML = `
      <section class="incident-snapshot-card" role="alertdialog" aria-label="野狼咬傷事件快照">
        <button class="incident-snapshot-close" type="button" aria-label="關閉事件快照">×</button>
        <p class="incident-snapshot-label">⚠ 狼牙留下的夜間快照</p>
        <div class="incident-photo-frame">
          <span class="incident-blood-mark blood-a"></span><span class="incident-blood-mark blood-b"></span><span class="incident-blood-mark blood-c"></span>
          <img class="incident-wolf-image" src="${attackerImage}" alt="${attackerName}" />
          <img class="incident-victim-image" src="${victimImage}" alt="受咬的${victimName}" />
          <span class="incident-flash">✦</span>
        </div>
        <p class="incident-caption">${victimName}遭${attackerName}咬傷。教堂的燈必須立刻為他／牠點亮。</p>
      </section>`;
    this.layer.style.display = 'flex';
    this.layer.querySelector('.incident-snapshot-close')?.addEventListener('click', () => this.close());
    this.layer.addEventListener('click', event => { if (event.target === this.layer) this.close(); }, { once: true });
    if (this.dismissTimer) clearTimeout(this.dismissTimer);
    this.dismissTimer = setTimeout(() => this.close(), 5200);
  }

  close() {
    if (this.dismissTimer) clearTimeout(this.dismissTimer);
    this.dismissTimer = null;
    if (this.layer) this.layer.style.display = 'none';
  }
}

window.IncidentSnapshotUI = IncidentSnapshotUI;
