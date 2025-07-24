class EventBus {
  constructor() {
    this.events = {};
  }
  on(event, listener) {
    (this.events[event] = this.events[event] || []).push(listener);
    return () => this.off(event, listener);
  }
  off(event, listener) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listener);
  }
  emit(event, ...args) {
    (this.events[event] || []).forEach(listener => listener(...args));
  }
}

export default new EventBus();
