/**
 * WorldScroller - 橫向長卷平滑拖曳控制器
 * 支援 2.5~3 屏寬度單指滑動 / 滑鼠平滑拖拽巡視，具備慣性與邊界阻尼
 */
class WorldScroller {
  constructor(viewportEl, worldEl, options = {}) {
    this.viewport = viewportEl;
    this.world = worldEl;
    this.scrollX = options.initialScroll || 400; // 預設聚焦中央教堂區
    this.worldWidth = options.worldWidth || 2800;

    this.isDragging = false;
    this.startX = 0;
    this.startScrollX = 0;
    this.velocity = 0;
    this.lastTime = 0;
    this.lastX = 0;
    this.animFrameId = null;

    this.initEvents();
    this.applyTransform();
  }

  initEvents() {
    if (!this.viewport) return;

    // 滑鼠事件
    this.viewport.addEventListener('mousedown', (e) => this.onPointerDown(e.clientX));
    window.addEventListener('mousemove', (e) => this.onPointerMove(e.clientX));
    window.addEventListener('mouseup', () => this.onPointerUp());

    // 觸控事件
    this.viewport.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) this.onPointerDown(e.touches[0].clientX);
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1) this.onPointerMove(e.touches[0].clientX);
    }, { passive: true });

    window.addEventListener('touchend', () => this.onPointerUp());
  }

  onPointerDown(clientX) {
    this.isDragging = true;
    this.startX = clientX;
    this.startScrollX = this.scrollX;
    this.lastX = clientX;
    this.lastTime = performance.now();
    this.velocity = 0;
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
  }

  onPointerMove(clientX) {
    if (!this.isDragging) return;
    const dx = clientX - this.startX;
    this.scrollX = this.startScrollX - dx;

    // 計算滑動速度
    const now = performance.now();
    const dt = now - this.lastTime;
    if (dt > 10) {
      this.velocity = (this.lastX - clientX) / dt;
      this.lastTime = now;
      this.lastX = clientX;
    }

    this.clampScroll();
    this.applyTransform();
  }

  onPointerUp() {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.startInertia();
  }

  startInertia() {
    const friction = 0.92;
    const step = () => {
      if (Math.abs(this.velocity) < 0.05) return;
      this.scrollX += this.velocity * 16;
      this.velocity *= friction;
      this.clampScroll();
      this.applyTransform();
      this.animFrameId = requestAnimationFrame(step);
    };
    this.animFrameId = requestAnimationFrame(step);
  }

  clampScroll() {
    const maxScroll = Math.max(0, this.worldWidth - window.innerWidth);
    if (this.scrollX < 0) this.scrollX = 0;
    if (this.scrollX > maxScroll) this.scrollX = maxScroll;
  }

  applyTransform() {
    if (!this.world) return;
    this.world.style.transform = `translateX(-${this.scrollX}px)`;

    if (window.lunarEventBus) {
      window.lunarEventBus.emit('WORLD_SCROLLED', {
        scrollX: this.scrollX,
        maxScroll: Math.max(0, this.worldWidth - window.innerWidth)
      });
    }
  }

  scrollToTarget(targetX, duration = 600) {
    const startX = this.scrollX;
    const destX = Math.max(0, Math.min(this.worldWidth - window.innerWidth, targetX - window.innerWidth / 2));
    const startTime = performance.now();

    const animate = (time) => {
      const elapsed = time - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      this.scrollX = startX + (destX - startX) * ease;
      this.applyTransform();
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }
}

window.WorldScroller = WorldScroller;
