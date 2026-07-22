/**
 * Dynamic 3D Organic Perlin Noise Generator
 * Evaluates Z-axis time domain in real-time with custom OLED & Light mode contrast calibration
 */

class DynamicStaticPerlinNoise {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.width = 0;
    this.height = 0;

    // Buffer canvas for pixel-grid noise computation
    this.offscreen = document.createElement('canvas');
    this.offCtx = this.offscreen.getContext('2d');

    // Scale resolution factor for smooth 60 FPS computation
    this.scale = 0.28; 

    // Time domain Z evolution speed
    this.zTime = 0;
    this.zSpeed = 0.014; 

    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.scroll = 0;
    this.targetScroll = 0;

    this.theme = document.documentElement.getAttribute('data-theme') || 'dark';
    this.animationFrameId = null;

    this.initPermutation();
    this.init();
  }

  initPermutation() {
    const p = [151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,
    8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,249,
    57,211,145,230,224,29,84,64,68,146,217,82,176,141,128,196,206,138,225,236,16,137,235,191,
    72,130,23,125,20,248,168,231,180,187,60,25,124,143,158,189,45,215,221,114,83,19,9,183,199,
    188,147,154,77,175,222,46,67,198,196,54,2,246,14,190,20,205,93,27,126,110,65,71,140,111,
    285,152,19,70,165,166,71,223,87,177,98,42,76,22,66,68,26,40,157,112,63,91,123,89,17,162,
    253,193,243,149,150,118,127,119,101,161,167,49,192,204,181,210,229,182,190,183,16,122,171,
    208,207,242,109,240,132,159,106,121,155,209,212,178,214,136,88,208,139,12,173,164,185,172,
    228,144,129,97,184,81,113,116,61,108,133,186,135,163,79,174,86,60,82,107,170,213,169,200,
    238,39,124,251,50,5,254,49,24,92,250,74,227,115,205,195,153,16,134,220,241,18,102,236,218,
    63,226,189,48,221,156,208,80,245,34,32,38,104,117,120,13,24,28,52,58,105,255,244,187,204,
    56,139,239,216,85,0,24,196,17,21,100];
    this.perm = new Uint8Array(512);
    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
    }
  }

  fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  lerp(t, a, b) { return a + t * (b - a); }

  grad3D(hash, x, y, z) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  perlin3D(x, y, z) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);

    const A  = this.perm[X] + Y, AA = this.perm[A] + Z, AB = this.perm[A + 1] + Z;
    const B  = this.perm[X + 1] + Y, BA = this.perm[B] + Z, BB = this.perm[B + 1] + Z;

    return this.lerp(w,
      this.lerp(v,
        this.lerp(u, this.grad3D(this.perm[AA], x, y, z), this.grad3D(this.perm[BA], x - 1, y, z)),
        this.lerp(u, this.grad3D(this.perm[AB], x, y - 1, z), this.grad3D(this.perm[BB], x - 1, y - 1, z))
      ),
      this.lerp(v,
        this.lerp(u, this.grad3D(this.perm[AA + 1], x, y, z - 1), this.grad3D(this.perm[BA + 1], x - 1, y, z - 1)),
        this.lerp(u, this.grad3D(this.perm[AB + 1], x, y - 1, z - 1), this.grad3D(this.perm[BB + 1], x - 1, y - 1, z - 1))
      )
    );
  }

  init() {
    this.resize();
    this.bindEvents();
    this.start();
  }

  setTheme(newTheme) {
    this.theme = newTheme;
    this.render();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.offscreen.width = Math.ceil(this.width * this.scale);
    this.offscreen.height = Math.ceil(this.height * this.scale);

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
      this.targetScroll = window.scrollY * 0.1;
    }, { passive: true });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.stop();
      else this.start();
    });
  }

  render() {
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;
    this.scroll += (this.targetScroll - this.scroll) * 0.05;

    this.zTime += this.zSpeed;

    const bufW = this.offscreen.width;
    const bufH = this.offscreen.height;
    const imgData = this.offCtx.createImageData(bufW, bufH);
    const data = imgData.data;

    const mouseXNorm = (this.mouse.x / this.width - 0.5) * 0.6;
    const mouseYNorm = (this.mouse.y / this.height - 0.5) * 0.6;

    const frequency = 0.038;

    const isLight = this.theme === 'light';

    // Calibrated Greyscale Ranges for OLED / High-Dynamic Range Displays
    // Dark mode: ~15 to ~75 (Deep Charcoal Noise)
    // Light mode: ~130 to ~235 (High-contrast slate/silver noise field so motion & texture are clearly visible)
    const baseVal = isLight ? 130 : 15;
    const rangeVal = isLight ? 105 : 60;

    let ptr = 0;
    for (let y = 0; y < bufH; y++) {
      for (let x = 0; x < bufW; x++) {
        const nx = x * frequency + mouseXNorm;
        const ny = y * frequency + mouseYNorm + (this.scroll * 0.002);
        const nz = this.zTime;

        let n = this.perlin3D(nx, ny, nz) * 0.65;
        n += this.perlin3D(nx * 2.0, ny * 2.0, nz * 1.5) * 0.35;

        const normalized = Math.min(Math.max((n + 1) * 0.5, 0), 1);
        const greyVal = Math.floor(normalized * rangeVal + baseVal);

        data[ptr]     = greyVal;
        data[ptr + 1] = greyVal;
        data[ptr + 2] = greyVal;
        data[ptr + 3] = 255;
        ptr += 4;
      }
    }

    this.offCtx.putImageData(imgData, 0, 0);

    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    this.ctx.drawImage(this.offscreen, 0, 0, this.width, this.height);
  }

  loop() {
    this.render();
    this.animationFrameId = requestAnimationFrame(() => this.loop());
  }

  start() {
    if (!this.animationFrameId) {
      this.loop();
    }
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}

window.perlinEngine = null;

document.addEventListener('DOMContentLoaded', () => {
  window.perlinEngine = new DynamicStaticPerlinNoise('noise-canvas');
});
