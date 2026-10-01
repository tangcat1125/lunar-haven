/**
 * StateMachine - 遊戲全域狀態機
 * 管理場景生命週期：LANDING, PLAYING, CRISIS_DARK, CRISIS_FULL, SETTLEMENT
 */
class StateMachine {
  constructor(initialState = 'LANDING') {
    this.currentState = initialState;
    this.transitions = {
      LANDING: ['PLAYING'],
      PLAYING: ['CRISIS_DARK', 'CRISIS_FULL', 'SETTLEMENT', 'LANDING'],
      CRISIS_DARK: ['PLAYING', 'SETTLEMENT'],
      CRISIS_FULL: ['PLAYING', 'SETTLEMENT'],
      SETTLEMENT: ['LANDING', 'PLAYING']
    };
  }

  canTransitionTo(nextState) {
    return this.transitions[this.currentState]?.includes(nextState);
  }

  transition(nextState, payload = {}) {
    if (!this.canTransitionTo(nextState)) {
      console.warn(`[StateMachine] Invalid transition from ${this.currentState} to ${nextState}`);
      return false;
    }
    const prevState = this.currentState;
    this.currentState = nextState;

    if (window.lunarEventBus) {
      window.lunarEventBus.emit('STATE_CHANGED', {
        prev: prevState,
        current: nextState,
        payload
      });
    }
    return true;
  }

  getState() {
    return this.currentState;
  }
}

window.gameStateMachine = new StateMachine();
