/**
 * Monochromatic Grey / Charcoal Perlin Noise Canvas Engine
 * Pure grayscale palette, organic noise fluid dynamics, high performance
 */

class GreyPerlinEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d', { alpha: false });
    this.width = 0;
    this.height = 0;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Mouse & Scroll Tracking with smooth LERP
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.scrollOffset = 0;
    this.targetScrollOffset = 0;

    // Animation Control
    this.time = 0;
    this.speed = 0.0003;
    this.isLowPower = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.animationFrameId = null;

    // Particles & Grid Setup
    this.particles = [];
    this.particleCount = 180;

    // Pure Monochromatic Grayscale Palette (Dark Graphite, Slate Grey, Soft Silver)
    this.colors = [
      'rgba(255, 255, 255, 0.04)',
      'rgba(200, 200, 200, 0.06)',
      'rgba(140, 140, 140, 0.08)',
      'rgba(90, 90, 90, 0.05)'
    ];

    this.init();
  }

  init() {
    this.resize();
    this.createParticles();
    this.bindEvents();
    this.start();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);

    this.mouse.x = this.mouse.targetX = this.width / 2;
    this.mouse.y = this.mouse.targetY = this.height / 2;
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize(), { passive: true });

    window.addEventListener('mousemove', (e) => {
      this.mouse.targetX = e.clientX;
      this.mouse.targetY = e.clientY;
    }, { passive: true });

    window.addEventListener('scroll', () => {
      this.targetScrollOffset = window.scrollY * 0.12;
    }, { passive: true });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stop();
      } else {
        this.start();
      }
    });
  }

  createParticles() {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: 0,
        vy: 0,
        radius: Math.random() * 2 + 1,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        baseSpeed: Math.random() * 0.3 + 0.15
      });
    }
  }

  /**
   * Smooth Perlin 2D Noise algorithm
   */
  noise2D(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const g1 = Math.sin(X * 12.9898 + Y * 78.233) * 43758.5453;
    const g2 = Math.cos(X * 27.1215 + Y * 45.5432) * 23421.1241;
    return Math.sin(g1 + x) * Math.cos(g2 + y);
  }

  update() {
    // Smooth LERP
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.04;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.04;
    this.scrollOffset += (this.targetScrollOffset - this.scrollOffset) * 0.04;

    this.time += this.speed;

    const mouseFactorX = (this.mouse.x / this.width - 0.5) * 1.5;
    const mouseFactorY = (this.mouse.y / this.height - 0.5) * 1.5;

    for (let p of this.particles) {
      const angle = this.noise2D(
        p.x * 0.0015 + this.time + mouseFactorX * 0.08,
        p.y * 0.0015 + (this.scrollOffset * 0.0008) + mouseFactorY * 0.08
      ) * Math.PI * 4;

      p.vx += Math.cos(angle) * 0.03;
      p.vy += Math.sin(angle) * 0.03;

      p.vx *= 0.97;
      p.vy *= 0.97;

      p.x += p.vx * p.baseSpeed;
      p.y += p.vy * p.baseSpeed;

      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) p.y = this.height;
      if (p.y > this.height) p.y = 0;
    }
  }

  render() {
    // Pure Deep Grey / Charcoal Base Background Fade (#121417)
    this.ctx.fillStyle = 'rgba(18, 20, 23, 0.35)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Render Monochromatic Fluid Noise Mesh
    for (let i = 0; i < this.particles.length; i++) {
      const p1 = this.particles[i];

      this.ctx.beginPath();
      this.ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = p1.color;
      this.ctx.fill();

      // Delicate subtle grey connecting lines
      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < 6400) { // ~80px link limit
          const alpha = (1 - distSq / 6400) * 0.05;
          this.ctx.beginPath();
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.strokeStyle = `rgba(220, 220, 220, ${alpha})`;
          this.ctx.lineWidth = 0.6;
          this.ctx.stroke();
        }
      }
    }
  }

  loop() {
    this.update();
    this.render();
    this.animationFrameId = requestAnimationFrame(() => this.loop());
  }

  start() {
    if (!this.animationFrameId && !this.isLowPower) {
      this.loop();
    } else if (this.isLowPower) {
      this.render();
    }
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new GreyPerlinEngine('noise-canvas');
});
