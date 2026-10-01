/**
 * SoundEngine - Web Audio API 合成音效引擎
 * 支援哥德式教堂大鐘（朔月急促亂鐘、滿月悠長銀鐘、平時清鐘）、狼嚎與羊皮紙翻牌音效
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterGain = null;
    this.bgmVolume = 0.32;
    this.bgmEnabled = true;
    this.bgm = new Audio('assets/audio/music/watchmans-toll.mp3');
    this.bgm.loop = true;
    this.bgm.preload = 'auto';
    this.bgm.volume = this.bgmVolume;
    this.bgmStartPending = false;
    this.clipPaths = {
      pageTurn: 'assets/audio/voice/page-turn.mp3',
      wolfHowl: 'assets/audio/voice/wolf-howl.mp3',
      dogBark: 'assets/audio/voice/dog-bark.mp3',
      catMeow: 'assets/audio/voice/cat-meow.mp3',
      churchBell: 'assets/audio/voice/church-bell.mp3',
      arrowShot: 'assets/audio/voice/arrow-shot.mp3'
    };
  }

  playClip(name, volume = 0.7) {
    if (this.isMuted || !this.clipPaths[name]) return;
    try {
      const audio = new Audio(this.clipPaths[name]);
      audio.volume = Math.max(0, Math.min(1, volume));
      audio.play().catch(() => {});
    } catch (e) {
      console.warn('Audio clip error:', e);
    }
  }

  playPageTurn() { this.playClip('pageTurn', 0.72); }
  playDogBark() { this.playClip('dogBark', 0.82); }
  playArrowShot() { this.playClip('arrowShot', 0.78); }
  playRecordedBell() { this.playClip('churchBell', 0.82); }

  // 背景音樂預設開啟。若瀏覽器禁止無手勢自動播放，第一次點擊／觸控／按鍵時會立刻續播。
  startBackgroundMusic() {
    if (!this.bgmEnabled || !this.bgm) return Promise.resolve(false);
    return this.bgm.play()
      .then(() => {
        this.bgmStartPending = false;
        window.lunarEventBus?.emit('BGM_STATE_CHANGED', this.getBgmState());
        return true;
      })
      .catch(() => {
        if (!this.bgmStartPending) {
          this.bgmStartPending = true;
          const resume = () => {
            document.removeEventListener('pointerdown', resume, true);
            document.removeEventListener('keydown', resume, true);
            this.startBackgroundMusic();
          };
          document.addEventListener('pointerdown', resume, true);
          document.addEventListener('keydown', resume, true);
        }
        window.lunarEventBus?.emit('BGM_STATE_CHANGED', this.getBgmState());
        return false;
      });
  }

  setBgmVolume(value) {
    this.bgmVolume = Math.max(0, Math.min(1, Number(value)));
    if (this.bgm) this.bgm.volume = this.bgmVolume;
    window.lunarEventBus?.emit('BGM_STATE_CHANGED', this.getBgmState());
  }

  toggleBackgroundMusic() {
    this.bgmEnabled = !this.bgmEnabled;
    if (!this.bgmEnabled) this.bgm?.pause();
    else this.startBackgroundMusic();
    window.lunarEventBus?.emit('BGM_STATE_CHANGED', this.getBgmState());
    return this.bgmEnabled;
  }

  getBgmState() {
    return { enabled: this.bgmEnabled, volume: this.bgmVolume, playing: !this.bgm?.paused };
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.25, this.ctx.currentTime);
    }
  }

  // 1. 播放單音
  playTone(freq, type = 'sine', duration = 0.2, gainVal = 0.3) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Sound error:', e);
    }
  }

  // 2. 教堂鐘聲合成器（具備管風琴與金屬諧波共振）
  playChurchBell(fundamentalFreq = 220, decay = 2.5, metallic = 0.5) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const harmonics = [1, 2.01, 3.02, 4.15, 5.43];
    const gains = [0.5, 0.35, 0.2, 0.15, 0.08];

    harmonics.forEach((h, index) => {
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = index % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(fundamentalFreq * h, this.ctx.currentTime);

        const currentGain = gains[index] * (1 - metallic * 0.3);
        gain.gain.setValueAtTime(currentGain, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + decay * (1 / (h * 0.5 + 0.5)));

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + decay);
      } catch (e) {}
    });
  }

  // 朔月至暗期：急促連續亂鐘（短促低沉帶回音）
  playDarkMoonAlarm() {
    this.playChurchBell(165, 0.8, 0.8);
    setTimeout(() => this.playChurchBell(185, 0.7, 0.8), 280);
    setTimeout(() => this.playChurchBell(145, 1.2, 0.9), 560);
    setTimeout(() => this.playWolfHowl(), 800);
  }

  // 滿月銀月期：悠長沉重銀鐘（空靈延音）
  playFullMoonSilverBell() {
    this.playRecordedBell();
  }

  // 平時清晨/黃昏暮鐘
  playDailyBell() {
    this.playChurchBell(261.63, 3.0, 0.3); // C4 音階
  }

  // 3. 羊皮紙卡片滑入/點擊/翻面音效
  playCardSlide() {
    this.playTone(440, 'triangle', 0.15, 0.15);
  }

  playCardFlip() {
    this.playTone(320, 'sine', 0.1, 0.2);
    setTimeout(() => this.playTone(580, 'sine', 0.15, 0.18), 70);
  }

  playTaskComplete() {
    this.playTone(523.25, 'sine', 0.12, 0.2); // C5
    setTimeout(() => this.playTone(659.25, 'sine', 0.15, 0.2), 100); // E5
    setTimeout(() => this.playTone(783.99, 'sine', 0.25, 0.22), 200); // G5
  }

  playClick() {
    this.playTone(800, 'sine', 0.04, 0.1);
  }

  // 4. 幽遠狼嚎合成器 (FM Synthesizer)
  playWolfHowl() {
    this.playClip('wolfHowl', 0.82);
  }

  playSynthWolfHowl() {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sawtooth';
      // 頻率上揚再下滑曲線
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.8);
      osc.frequency.exponentialRampToValueAtTime(180, now + 2.2);

      // 低通濾波器模擬遠處回聲
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 2.5);
    } catch (e) {}
  }
}

window.soundEngine = new SoundEngine();
