// ========================================================
//  FLUID — Real-Time Navier-Stokes Fluid Dynamics
//  Based on Jos Stam's "Stable Fluids" (SIGGRAPH 1999)
//  Reference: nornagon/stam-stable-fluids (MIT)
//             PavelDoGreat/WebGL-Fluid-Simulation (MIT)
//  Pure vanilla JS + Canvas 2D — zero dependencies
// ========================================================

(function() {
'use strict';

const N = 128;          // Grid resolution (128×128)
const SIZE = (N + 2) * (N + 2);
let dt = 0.1;           // Time step
let diff = 0.0001;      // Diffusion rate
let visc = 0.00001;     // Viscosity
let curlStrength = 8;   // Vorticity confinement

// ── Fluid State Arrays ──────────────────────────────────
let u = new Float32Array(SIZE);     // Velocity X
let v = new Float32Array(SIZE);     // Velocity Y
let u_prev = new Float32Array(SIZE);
let v_prev = new Float32Array(SIZE);
let dens = new Float32Array(SIZE);  // Density (dye)
let dens_prev = new Float32Array(SIZE);

// ── Curl field for vorticity confinement ─────────────────
let curl = new Float32Array(SIZE);

// ── Interaction State ────────────────────────────────────
let mouseX = 0, mouseY = 0;
let prevMouseX = 0, prevMouseY = 0;
let mouseDown = false;
let interactMode = 'draw'; // 'draw', 'heat', 'wind'

// ── Canvas ───────────────────────────────────────────────
let canvas = null;
let ctx = null;
let imageData = null;
let animFrame = null;
let canvasW = 0, canvasH = 0;

// ── IX: 2D → 1D index ──────────────────────────────────
function IX(x, y) { return x + (N + 2) * y; }

// ── Boundary Conditions ─────────────────────────────────
function setBnd(b, x) {
  for (let i = 1; i <= N; i++) {
    x[IX(0, i)]     = b === 1 ? -x[IX(1, i)] : x[IX(1, i)];
    x[IX(N + 1, i)] = b === 1 ? -x[IX(N, i)] : x[IX(N, i)];
    x[IX(i, 0)]     = b === 2 ? -x[IX(i, 1)] : x[IX(i, 1)];
    x[IX(i, N + 1)] = b === 2 ? -x[IX(i, N)] : x[IX(i, N)];
  }
  x[IX(0, 0)]         = 0.5 * (x[IX(1, 0)] + x[IX(0, 1)]);
  x[IX(0, N + 1)]     = 0.5 * (x[IX(1, N + 1)] + x[IX(0, N)]);
  x[IX(N + 1, 0)]     = 0.5 * (x[IX(N, 0)] + x[IX(N + 1, 1)]);
  x[IX(N + 1, N + 1)] = 0.5 * (x[IX(N, N + 1)] + x[IX(N + 1, N)]);
}

// ── Linear Solver (Gauss-Seidel relaxation) ─────────────
function linSolve(b, x, x0, a, c) {
  const cRecip = 1.0 / c;
  for (let k = 0; k < 4; k++) {
    for (let j = 1; j <= N; j++) {
      for (let i = 1; i <= N; i++) {
        x[IX(i, j)] = (x0[IX(i, j)] + a * (
          x[IX(i + 1, j)] + x[IX(i - 1, j)] +
          x[IX(i, j + 1)] + x[IX(i, j - 1)]
        )) * cRecip;
      }
    }
    setBnd(b, x);
  }
}

// ── Diffuse ─────────────────────────────────────────────
function diffuse(b, x, x0, diffRate, dtVal) {
  const a = dtVal * diffRate * N * N;
  linSolve(b, x, x0, a, 1 + 4 * a);
}

// ── Advect (Semi-Lagrangian) ─────────────────────────────
function advect(b, d, d0, uArr, vArr, dtVal) {
  const dt0x = dtVal * N;
  for (let j = 1; j <= N; j++) {
    for (let i = 1; i <= N; i++) {
      let x = i - dt0x * uArr[IX(i, j)];
      let y = j - dt0x * vArr[IX(i, j)];
      // Clamp to grid
      if (x < 0.5) x = 0.5;
      if (x > N + 0.5) x = N + 0.5;
      const i0 = Math.floor(x);
      const i1 = i0 + 1;
      if (y < 0.5) y = 0.5;
      if (y > N + 0.5) y = N + 0.5;
      const j0 = Math.floor(y);
      const j1 = j0 + 1;
      // Bilinear interpolation
      const s1 = x - i0;
      const s0 = 1 - s1;
      const t1 = y - j0;
      const t0 = 1 - t1;
      d[IX(i, j)] =
        s0 * (t0 * d0[IX(i0, j0)] + t1 * d0[IX(i0, j1)]) +
        s1 * (t0 * d0[IX(i1, j0)] + t1 * d0[IX(i1, j1)]);
    }
  }
  setBnd(b, d);
}

// ── Project (Pressure Projection — enforce incompressibility)
function project(uArr, vArr, p, div) {
  for (let j = 1; j <= N; j++) {
    for (let i = 1; i <= N; i++) {
      div[IX(i, j)] = -0.5 * (
        uArr[IX(i + 1, j)] - uArr[IX(i - 1, j)] +
        vArr[IX(i, j + 1)] - vArr[IX(i, j - 1)]
      ) / N;
      p[IX(i, j)] = 0;
    }
  }
  setBnd(0, div);
  setBnd(0, p);
  linSolve(0, p, div, 1, 4);

  for (let j = 1; j <= N; j++) {
    for (let i = 1; i <= N; i++) {
      uArr[IX(i, j)] -= 0.5 * N * (p[IX(i + 1, j)] - p[IX(i - 1, j)]);
      vArr[IX(i, j)] -= 0.5 * N * (p[IX(i, j + 1)] - p[IX(i, j - 1)]);
    }
  }
  setBnd(1, uArr);
  setBnd(2, vArr);
}

// ── Compute Curl for Vorticity Confinement ───────────────
function computeCurl(uArr, vArr, c) {
  for (let j = 1; j <= N; j++) {
    for (let i = 1; i <= N; i++) {
      const du_dy = (uArr[IX(i, j + 1)] - uArr[IX(i, j - 1)]) * 0.5;
      const dv_dx = (vArr[IX(i + 1, j)] - vArr[IX(i - 1, j)]) * 0.5;
      c[IX(i, j)] = dv_dx - du_dy;
    }
  }
  setBnd(0, c);
}

// ── Apply Vorticity Confinement ──────────────────────────
function vorticityConfinement(uArr, vArr, c, strength) {
  for (let j = 2; j < N; j++) {
    for (let i = 2; i < N; i++) {
      // Gradient of curl magnitude
      const dw_dx = (Math.abs(c[IX(i + 1, j)]) - Math.abs(c[IX(i - 1, j)])) * 0.5;
      const dw_dy = (Math.abs(c[IX(i, j + 1)]) - Math.abs(c[IX(i, j - 1)])) * 0.5;
      let len = Math.sqrt(dw_dx * dw_dx + dw_dy * dw_dy) + 1e-5;
      // Normalized gradient
      const nx = dw_dx / len;
      const ny = dw_dy / len;
      // Apply force perpendicular to gradient, scaled by curl
      uArr[IX(i, j)] += strength * (ny * c[IX(i, j)]);
      vArr[IX(i, j)] += strength * (-nx * c[IX(i, j)]);
    }
  }
}

// ── Step: One full simulation step ──────────────────────
function step() {
  // Velocity step
  // Add external forces
  for (let i = 0; i < SIZE; i++) {
    u[i] += dt * u_prev[i];
    v[i] += dt * v_prev[i];
  }

  // Vorticity confinement
  if (curlStrength > 0) {
    computeCurl(u, v, curl);
    vorticityConfinement(u, v, curl, curlStrength * 0.1);
  }

  // Diffuse velocity
  const tmpU = new Float32Array(u);
  const tmpV = new Float32Array(v);
  diffuse(1, u, tmpU, visc, dt);
  diffuse(2, v, tmpV, visc, dt);

  // Project to make incompressible
  const p = new Float32Array(SIZE);
  const div = new Float32Array(SIZE);
  project(u, v, p, div);

  // Advect velocity
  const tmpU2 = new Float32Array(u);
  const tmpV2 = new Float32Array(v);
  advect(1, u, tmpU2, tmpU2, tmpV2, dt);
  advect(2, v, tmpV2, tmpU2, tmpV2, dt);

  // Project again
  project(u, v, p, div);

  // Density step
  for (let i = 0; i < SIZE; i++) {
    dens[i] += dt * dens_prev[i];
  }

  // Diffuse density
  const tmpD = new Float32Array(dens);
  diffuse(0, dens, tmpD, diff, dt);

  // Advect density
  const tmpD2 = new Float32Array(dens);
  advect(0, dens, tmpD2, u, v, dt);

  // Fade density slightly (natural dissipation)
  for (let i = 0; i < SIZE; i++) {
    dens[i] *= 0.998;
  }

  // Clear external forces
  u_prev.fill(0);
  v_prev.fill(0);
  dens_prev.fill(0);
}

// ── Rendering ────────────────────────────────────────────
function render() {
  if (!ctx || !imageData) return;
  const data = imageData.data;
  const cellW = canvasW / N;
  const cellH = canvasH / N;

  // Clear to black
  data.fill(0);

  // Map density to GameBoy green palette
  for (let j = 1; j <= N; j++) {
    for (let i = 1; i <= N; i++) {
      const d = Math.min(dens[IX(i, j)], 1.0);
      if (d < 0.01) continue;

      // GameBoy green palette: black → dark green → green → bright green → white
      let r, g, b;
      if (d < 0.25) {
        const t = d / 0.25;
        r = 0; g = Math.floor(15 + t * 30); b = 0;
      } else if (d < 0.5) {
        const t = (d - 0.25) / 0.25;
        r = 0; g = Math.floor(45 + t * 50); b = 0;
      } else if (d < 0.75) {
        const t = (d - 0.5) / 0.25;
        r = Math.floor(t * 20); g = Math.floor(95 + t * 80); b = Math.floor(t * 10);
      } else {
        const t = (d - 0.75) / 0.25;
        r = Math.floor(20 + t * 100); g = Math.floor(175 + t * 80); b = Math.floor(10 + t * 50);
      }

      // Fill the cell pixels
      const px0 = Math.floor((i - 1) * cellW);
      const py0 = Math.floor((j - 1) * cellH);
      const px1 = Math.floor(i * cellW);
      const py1 = Math.floor(j * cellH);

      for (let py = py0; py < py1 && py < canvasH; py++) {
        for (let px = px0; px < px1 && px < canvasW; px++) {
          const idx = (py * canvasW + px) * 4;
          data[idx] = r;
          data[idx + 1] = g;
          data[idx + 2] = b;
          data[idx + 3] = 255;
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

// ── Animation Loop ───────────────────────────────────────
function loop() {
  step();
  render();
  animFrame = requestAnimationFrame(loop);
}

// ── Mouse/Touch → Grid Mapping ───────────────────────────
function canvasToGrid(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * N + 1;
  const y = ((clientY - rect.top) / rect.height) * N + 1;
  return { x: Math.max(1, Math.min(N, Math.round(x))), y: Math.max(1, Math.min(N, Math.round(y))) };
}

function handleInteract(cx, cy) {
  const { x, y } = canvasToGrid(cx, cy);

  // Compute velocity from mouse delta
  const dx = (cx - prevMouseX) * 5;
  const dy = (cy - prevMouseY) * 5;

  // Radius of influence
  const radius = 3;

  for (let dj = -radius; dj <= radius; dj++) {
    for (let di = -radius; di <= radius; di++) {
      const ni = x + di;
      const nj = y + dj;
      if (ni < 1 || ni > N || nj < 1 || nj > N) continue;
      const dist = Math.sqrt(di * di + dj * dj);
      if (dist > radius) continue;
      const falloff = 1.0 - dist / (radius + 1);

      const idx = IX(ni, nj);

      if (interactMode === 'draw') {
        // Inject dye
        dens_prev[idx] += 80 * falloff;
        // Push fluid
        u_prev[idx] += dx * falloff;
        v_prev[idx] += dy * falloff;
      } else if (interactMode === 'heat') {
        // Rising plume — upward force + dye
        dens_prev[idx] += 60 * falloff;
        v_prev[idx] -= 30 * falloff; // Rise upward
        u_prev[idx] += dx * falloff * 0.3;
      } else if (interactMode === 'wind') {
        // Horizontal wind burst
        dens_prev[idx] += 40 * falloff;
        u_prev[idx] += dx * 3 * falloff;
        v_prev[idx] += dy * 0.5 * falloff;
      }
    }
  }

  prevMouseX = cx;
  prevMouseY = cy;
}

// ── Event Handlers ───────────────────────────────────────
function onPointerDown(e) {
  e.preventDefault();
  mouseDown = true;
  const pos = e.touches ? e.touches[0] : e;
  prevMouseX = pos.clientX;
  prevMouseY = pos.clientY;
}

function onPointerMove(e) {
  e.preventDefault();
  if (!mouseDown) return;
  const pos = e.touches ? e.touches[0] : e;
  handleInteract(pos.clientX, pos.clientY);
}

function onPointerUp(e) {
  mouseDown = false;
}

// ── Init ─────────────────────────────────────────────────
window.initFluid = function() {
  canvas = document.getElementById('fluidCanvas');
  if (!canvas) return;

  // Size canvas to fill screen content
  const parent = canvas.parentElement;
  canvasW = parent.clientWidth || 256;
  canvasH = parent.clientHeight || 256;
  canvas.width = canvasW;
  canvas.height = canvasH;
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.imageRendering = 'pixelated';

  ctx = canvas.getContext('2d');
  imageData = ctx.createImageData(canvasW, canvasH);

  // Reset fluid
  u.fill(0); v.fill(0);
  u_prev.fill(0); v_prev.fill(0);
  dens.fill(0); dens_prev.fill(0);

  // Bind events
  canvas.addEventListener('mousedown', onPointerDown);
  canvas.addEventListener('mousemove', onPointerMove);
  canvas.addEventListener('mouseup', onPointerUp);
  canvas.addEventListener('mouseleave', onPointerUp);
  canvas.addEventListener('touchstart', onPointerDown, { passive: false });
  canvas.addEventListener('touchmove', onPointerMove, { passive: false });
  canvas.addEventListener('touchend', onPointerUp);

  // Start animation
  if (animFrame) cancelAnimationFrame(animFrame);
  loop();
};

// ── Cleanup ──────────────────────────────────────────────
window._fluidCleanup = function() {
  if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; }
  if (canvas) {
    canvas.removeEventListener('mousedown', onPointerDown);
    canvas.removeEventListener('mousemove', onPointerMove);
    canvas.removeEventListener('mouseup', onPointerUp);
    canvas.removeEventListener('mouseleave', onPointerUp);
    canvas.removeEventListener('touchstart', onPointerDown);
    canvas.removeEventListener('touchmove', onPointerMove);
    canvas.removeEventListener('touchend', onPointerUp);
  }
};

// ── UI Controls ──────────────────────────────────────────
window.fluidSetVisc = function(val) {
  visc = parseFloat(val) / 100000;
  const el = document.getElementById('fluidViscLabel');
  if (el) el.textContent = val;
};

window.fluidSetDiff = function(val) {
  diff = parseFloat(val) / 1000000;
  const el = document.getElementById('fluidDiffLabel');
  if (el) el.textContent = val;
};

window.fluidSetCurl = function(val) {
  curlStrength = parseInt(val);
  const el = document.getElementById('fluidCurlLabel');
  if (el) el.textContent = val;
};

window.fluidSetMode = function(mode) {
  interactMode = mode;
  document.querySelectorAll('.fluid-mode-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === mode);
  });
  if (typeof sounds !== 'undefined') sounds.click?.();
};

window.fluidClear = function() {
  u.fill(0); v.fill(0);
  u_prev.fill(0); v_prev.fill(0);
  dens.fill(0); dens_prev.fill(0);
  if (typeof sounds !== 'undefined') sounds.back?.();
};

})();
