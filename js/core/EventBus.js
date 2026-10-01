/**
 * EventBus - 全局發布/訂閱事件總線
 * 用於天文、角色、UI、音效與遊戲邏輯間的解耦通信
 */
class EventBus {
  constructor() {
    this.listeners = new Map();
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    const callbacks = this.listeners.get(event).filter(cb => cb !== callback);
    this.listeners.set(event, callbacks);
  }

  emit(event, data) {
    if (!this.listeners.has(event)) return;
    const callbacks = this.listeners.get(event);
    for (const cb of callbacks) {
      try {
        cb(data);
      } catch (err) {
        console.error(`[EventBus] Error in handler for event "${event}":`, err);
      }
    }
  }

  clear() {
    this.listeners.clear();
  }
}

// 導出全域單例
window.lunarEventBus = new EventBus();
