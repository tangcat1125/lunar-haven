/**
 * Storage - 本地持久化模組
 * 儲存教師自訂模式、小鎮防禦記錄與學習單評量成果
 */
class Storage {
  constructor(prefix = 'lunar_haven_') {
    this.prefix = prefix;
  }

  get(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(this.prefix + key);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch (e) {
      console.warn('Storage read error:', e);
      return defaultValue;
    }
  }

  set(key, value) {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('Storage write error:', e);
      return false;
    }
  }

  remove(key) {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch (e) {}
  }
}

window.gameStorage = new Storage();
