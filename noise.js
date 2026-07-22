/**
 * Professional Perlin Noise / Flow Field Canvas Engine
 * Optimized for Smooth 60fps Rendering & Subtle Interactive Motion
 */

class PerlinNoiseEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d', { alpha: false });
    this.width = 0;
    this.height = 0;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Mouse & Scroll Tracking with LERP smoothing
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.scrollOffset = 0;
    this.targetScrollOffset = 0;

    // Time & Animation Control
    this.time = 0;
    this.speed = 0.0004;
    this.isLowPower = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.animationFrameId = null;

    // Particles Configuration
    this.particles = [];
    this.particleCount = 140; // Balanced for high performance

    // Color Palette (Subtle Dark Obsidian & Fluid Mesh Accents)
    this.colors = [
      'rgba(56, 189, 248, 0.15)',  /* Cyan glow */
      'rgba(99, 102, 241, 0.18)',  /* Indigo glow */
      'rgba(168, 85, 247, 0.12)'   /* Violet glow */
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

    // Initial mouse center
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
      this.targetScrollOffset = window.scrollY * 0.15;
    }, { passive: true });

    // Pause animation when tab is inactive to preserve resources
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
        radius: Math.random() * 2.5 + 1.2,
        color: this.colors[Math.floor(Math.random() * this.colors.length)],
        life: Math.random() * 100 + 100,
        maxLife: 200,
        baseSpeed: Math.random() * 0.4 + 0.2
      });
    }
  }

  /**
   * Fast Simplex-like Perlin 2D Noise Approximation
   */
  noise2D(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const g1 = Math.sin(X * 12.9898 + Y * 78.233) * 43758.5453;
    const g2 = Math.cos(X * 27.1215 + Y * 45.5432) * 23421.1241;
    return Math.sin(g1 + x) * Math.cos(g2 + y);
  }

  update() {
    // Smooth LERP mouse & scroll interactions
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;
    this.scrollOffset += (this.targetScrollOffset - this.scrollOffset) * 0.05;

    this.time += this.speed;

    const mouseFactorX = (this.mouse.x / this.width - 0.5) * 2;
    const mouseFactorY = (this.mouse.y / this.height - 0.5) * 2;

    for (let p of this.particles) {
      // Calculate angle based on Perlin field, mouse position, and scroll
      const angle = this.noise2D(
        p.x * 0.002 + this.time + mouseFactorX * 0.1,
        p.y * 0.002 + (this.scrollOffset * 0.001) + mouseFactorY * 0.1
      ) * Math.PI * 4;

      p.vx += Math.cos(angle) * 0.04;
      p.vy += Math.sin(angle) * 0.04;

      // Apply subtle friction
      p.vx *= 0.96;
      p.vy *= 0.96;

      p.x += p.vx * p.baseSpeed;
      p.y += p.vy * p.baseSpeed;

      // Wrap around screen boundaries smoothly
      if (p.x < 0) p.x = this.width;
      if (p.x > this.width) p.x = 0;
      if (p.y < 0) p.y = this.height;
      if (p.y > this.height) p.y = 0;
    }
  }

  render() {
    // Dark background fade trail for smooth fluidity
    this.ctx.fillStyle = 'rgba(7, 9, 14, 0.28)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw mesh connection lines & fluid particles
    for (let i = 0; i < this.particles.length; i++) {
      const p1 = this.particles[i];

      // Draw Particle
      this.ctx.beginPath();
      this.ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = p1.color;
      this.ctx.fill();

      // Connect nearby particles with ultra-subtle lines
      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < 7200) { // Approx 85px max link distance
          const alpha = (1 - distSq / 7200) * 0.08;
          this.ctx.beginPath();
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
          this.ctx.lineWidth = 0.8;
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
      // Fallback single static render for users with reduced motion
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PerlinNoiseEngine('noise-canvas');
});
