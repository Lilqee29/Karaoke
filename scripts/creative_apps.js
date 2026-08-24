// ================================================================
//  CREATIVE APPS — GLITCH · WAVE · NOISE · MAZE
//  Four interconnected creative apps for GameBoy OS
// ================================================================

// ── Shared Utilities ─────────────────────────────────────────────
let _creativeAudioCtx = null;
function getCreativeAudioCtx() {
  if (!_creativeAudioCtx) _creativeAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (_creativeAudioCtx.state === 'suspended') _creativeAudioCtx.resume();
  return _creativeAudioCtx;
}
function killAllCreativeAudio() {
  if (_creativeAudioCtx) { try { _creativeAudioCtx.close(); } catch(e){} _creativeAudioCtx = null; }
  if (_waveMicStream) { _waveMicStream.getTracks().forEach(t => t.stop()); _waveMicStream = null; }
  if (_noiseScriptNode) { try { _noiseScriptNode.disconnect(); } catch(e){} _noiseScriptNode = null; }
  if (_noiseGainNode) { try { _noiseGainNode.disconnect(); } catch(e){} _noiseGainNode = null; }
  if (_noiseInterval) { clearInterval(_noiseInterval); _noiseInterval = null; }
  _noisePlaying = false;
  _waveAutoOsc = null;
}
function _hash(n) { n = (n >> 13) ^ n; n = (n * (n * n * 60493 + 19990303) + 1376312589) & 0x7fffffff; return (n % 1000) / 1000; }

// ================================================================
//  GLITCH — Generative Particle Art Canvas
// ================================================================
let _glitchCanvas, _glitchCtx, _glitchAnim, _glitchParticles = [];
let _glitchMode = 'flow', _glitchTime = 0, _glitchMouse = {x:0,y:0,active:false};
const GLITCH_MODES = ['flow','rain','galaxy','fire','magnetic'];

function initGlitch() {
  const container = document.getElementById('glitchContent');
  if (!container) return;
  _glitchCanvas = document.getElementById('glitchCanvas');
  if (!_glitchCanvas) return;
  _glitchCtx = _glitchCanvas.getContext('2d');
  _glitchParticles = [];
  _glitchTime = 0;

  const resize = () => {
    const r = _glitchCanvas.parentElement.getBoundingClientRect();
    _glitchCanvas.width = Math.floor(r.width);
    _glitchCanvas.height = Math.floor(r.height);
  };
  resize();
  window.addEventListener('resize', resize);

  // Touch/mouse events
  const getPos = (e) => {
    const r = _glitchCanvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX - r.left, y: t.clientY - r.top };
  };
  _glitchCanvas.addEventListener('mousedown', e => { _glitchMouse = { ...getPos(e), active: true }; });
  _glitchCanvas.addEventListener('mousemove', e => { if (_glitchMouse.active) _glitchMouse = { ...getPos(e), active: true }; });
  _glitchCanvas.addEventListener('mouseup', () => { _glitchMouse.active = false; });
  _glitchCanvas.addEventListener('touchstart', e => { e.preventDefault(); _glitchMouse = { ...getPos(e), active: true }; }, {passive:false});
  _glitchCanvas.addEventListener('touchmove', e => { e.preventDefault(); _glitchMouse = { ...getPos(e), active: true }; }, {passive:false});
  _glitchCanvas.addEventListener('touchend', () => { _glitchMouse.active = false; });

  renderGlitchUI(container);
  _glitchLoop();
}

function renderGlitchUI(container) {
  container.innerHTML = `
    <div style="display:flex;flex-direction:column;height:100%;box-sizing:border-box;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 6px;">
        <span style="font-size:9px;font-weight:bold;color:var(--gb-text);">✦ GLITCH</span>
        <span style="font-size:5px;opacity:0.6;">${_glitchParticles.length} PARTICLES</span>
      </div>
      <div style="display:flex;gap:2px;padding:0 6px 4px;flex-wrap:wrap;">
        ${GLITCH_MODES.map(m => `<button onclick="setGlitchMode('${m}')" style="font-size:5px;padding:2px 5px;${_glitchMode===m?'background:var(--gb-text);color:var(--gb-bg);':''}">${m.toUpperCase()}</button>`).join('')}
        <button onclick="clearGlitchParticles()" style="font-size:5px;padding:2px 5px;margin-left:auto;">CLR</button>
      </div>
      <div style="flex:1;position:relative;margin:0 6px 6px;border:2px solid var(--gb-text);border-radius:4px;overflow:hidden;background:#000;">
        <canvas id="glitchCanvas" style="width:100%;height:100%;display:block;"></canvas>
      </div>
      <div style="padding:0 6px 6px;font-size:4px;text-align:center;opacity:0.5;">TOUCH TO CREATE · WATCH THE ART FLOW</div>
    </div>
  `;
}

function _glitchLoop() {
  if (!_glitchCtx || !_glitchCanvas) return;
  const w = _glitchCanvas.width, h = _glitchCanvas.height;
  _glitchTime += 0.016;

  // Fade background
  if (_glitchMode === 'fire') {
    _glitchCtx.fillStyle = 'rgba(0,0,0,0.08)';
  } else {
    _glitchCtx.fillStyle = 'rgba(0,0,0,0.05)';
  }
  _glitchCtx.fillRect(0, 0, w, h);

  // Spawn from mouse
  if (_glitchMouse.active) {
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 2;
      _glitchParticles.push({
        x: _glitchMouse.x, y: _glitchMouse.y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 1, decay: 0.003 + Math.random() * 0.008,
        size: 1 + Math.random() * 3,
        hue: (_glitchTime * 50 + Math.random() * 60) % 360
      });
    }
  }

  // Auto-spawn ambient particles
  if (_glitchParticles.length < 200 && Math.random() < 0.3) {
    const x = Math.random() * w, y = Math.random() * h;
    _glitchParticles.push({
      x, y, vx: 0, vy: 0, life: 1, decay: 0.002 + Math.random() * 0.005,
      size: 0.5 + Math.random() * 2, hue: (Math.random() * 360)
    });
  }

  // Update & draw
  const cx = w / 2, cy = h / 2;
  for (let i = _glitchParticles.length - 1; i >= 0; i--) {
    const p = _glitchParticles[i];

    switch (_glitchMode) {
      case 'flow': {
        const angle = (Math.sin(p.x * 0.01 + _glitchTime) + Math.cos(p.y * 0.01 + _glitchTime * 0.7)) * Math.PI;
        p.vx += Math.cos(angle) * 0.15;
        p.vy += Math.sin(angle) * 0.15;
        p.vx *= 0.98; p.vy *= 0.98;
        break;
      }
      case 'rain':
        p.vy += 0.12;
        p.vx *= 0.99;
        if (p.y > h) { p.y = 0; p.x = Math.random() * w; }
        break;
      case 'galaxy': {
        const dx = cx - p.x, dy = cy - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy) + 1;
        const ang = Math.atan2(dy, dx);
        p.vx += Math.cos(ang + Math.PI / 2) * (80 / dist);
        p.vy += Math.sin(ang + Math.PI / 2) * (80 / dist);
        p.vx += dx / dist * 0.3;
        p.vy += dy / dist * 0.3;
        p.vx *= 0.97; p.vy *= 0.97;
        break;
      }
      case 'fire':
        p.vy -= 0.08;
        p.vx += (Math.random() - 0.5) * 0.5;
        p.vx *= 0.96;
        p.hue = 20 + p.life * 40;
        break;
      case 'magnetic': {
        const dx2 = cx - p.x, dy2 = cy - p.y;
        const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) + 1;
        const force = (dist2 < 100 ? -2 : 1.5) * (50 / dist2);
        p.vx += dx2 / dist2 * force;
        p.vy += dy2 / dist2 * force;
        p.vx *= 0.97; p.vy *= 0.97;
        break;
      }
    }

    p.x += p.vx; p.y += p.vy;
    p.life -= p.decay;

    if (p.life <= 0 || p.x < -20 || p.x > w + 20 || p.y < -20 || p.y > h + 20) {
      _glitchParticles.splice(i, 1);
      continue;
    }

    const alpha = p.life * 0.8;
    _glitchCtx.fillStyle = `hsla(${p.hue},80%,60%,${alpha})`;
    _glitchCtx.beginPath();
    _glitchCtx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    _glitchCtx.fill();
  }

  _glitchAnim = requestAnimationFrame(_glitchLoop);
}

function setGlitchMode(m) { _glitchMode = m; renderGlitchUI(document.getElementById('glitchContent')); }
function clearGlitchParticles() { _glitchParticles = []; }

// ================================================================
//  WAVE — Audio Visualizer + Mic Reactive
// ================================================================
let _visualCanvas, _waveCtx, _waveAnim, _waveAnalyser, _waveData;
let _waveMicStream = null, _waveStyle = 'bars', _waveActive = false;
let _waveAutoOsc = null;

function initVisual() {
  const container = document.getElementById('visualContent');
  if (!container) return;
  _visualCanvas = document.getElementById('visualCanvas');
  if (!_visualCanvas) return;
  _waveCtx = _visualCanvas.getContext('2d');

  const resize = () => {
    const r = _visualCanvas.parentElement.getBoundingClientRect();
    _visualCanvas.width = Math.floor(r.width);
    _visualCanvas.height = Math.floor(r.height);
  };
  resize();
  window.addEventListener('resize', resize);

  renderWaveUI(container);
  _waveStartAuto();
}

function renderWaveUI(container) {
  container.innerHTML = `
    <div style="display:flex;flex-direction:column;height:100%;box-sizing:border-box;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 6px;">
        <span style="font-size:9px;font-weight:bold;color:var(--gb-text);">≋ VISUAL</span>
        <span style="font-size:5px;opacity:0.6;">${_waveMicStream ? 'MIC ON' : 'AUTO'}</span>
      </div>
      <div style="display:flex;gap:2px;padding:0 6px 4px;flex-wrap:wrap;">
        ${['bars','circular','scope'].map(s => `<button onclick="setWaveStyle('${s}')" style="font-size:5px;padding:2px 5px;${_waveStyle===s?'background:var(--gb-text);color:var(--gb-bg);':''}">${s.toUpperCase()}</button>`).join('')}
        <button onclick="waveToggleMic()" style="font-size:5px;padding:2px 5px;margin-left:auto;" id="waveMicBtn">${_waveMicStream ? '🎤 OFF' : '🎤 ON'}</button>
      </div>
      <div style="flex:1;position:relative;margin:0 6px 6px;border:2px solid var(--gb-text);border-radius:4px;overflow:hidden;background:#000;">
        <canvas id="visualCanvas" style="width:100%;height:100%;display:block;"></canvas>
      </div>
      <div style="padding:0 6px 6px;font-size:4px;text-align:center;opacity:0.5;">ENABLE MIC FOR REACTIVE VISUALS</div>
    </div>
  `;
}

async function waveToggleMic() {
  if (_waveMicStream) {
    _waveMicStream.getTracks().forEach(t => t.stop());
    _waveMicStream = null;
    _waveAnalyser = null;
    _waveStartAuto();
    renderWaveUI(document.getElementById('visualContent'));
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    _waveMicStream = stream;
    const ctx = getCreativeAudioCtx();
    const src = ctx.createMediaStreamSource(stream);
    _waveAnalyser = ctx.createAnalyser();
    _waveAnalyser.fftSize = 256;
    src.connect(_waveAnalyser);
    _waveData = new Uint8Array(_waveAnalyser.frequencyBinCount);
    _waveStopAuto();
    _waveStartLoop();
    renderWaveUI(document.getElementById('visualContent'));
  } catch(e) { /* mic denied */ }
}

function _waveStartAuto() {
  if (_waveAutoOsc) return;
  const ctx = getCreativeAudioCtx();
  _waveAnalyser = ctx.createAnalyser();
  _waveAnalyser.fftSize = 256;
  _waveData = new Uint8Array(_waveAnalyser.frequencyBinCount);

  // Generate ambient tones — very quiet so it's not annoying
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  osc1.type = 'sine'; osc1.frequency.value = 110;
  osc2.type = 'triangle'; osc2.frequency.value = 165;
  gain.gain.value = 0.03;
  osc1.connect(gain); osc2.connect(gain);
  gain.connect(_waveAnalyser);
  // Don't connect to destination — silent visualization only
  // User can enable mic for audio-reactive mode
  osc1.start(); osc2.start();

  // Slowly modulate frequencies for interesting visuals
  _waveAutoOsc = { osc1, osc2, gain, interval: setInterval(() => {
    try {
      if (!osc1 || !osc1.context) return;
      osc1.frequency.value = 80 + Math.sin(Date.now() * 0.0003) * 60;
      osc2.frequency.value = 120 + Math.cos(Date.now() * 0.0005) * 80;
    } catch(e) {}
  }, 100)};

  _waveStartLoop();
}

function _waveStopAuto() {
  if (_waveAutoOsc) {
    try { _waveAutoOsc.osc1.stop(); } catch(e){}
    try { _waveAutoOsc.osc2.stop(); } catch(e){}
    try { _waveAutoOsc.gain.disconnect(); } catch(e){}
    clearInterval(_waveAutoOsc.interval);
    _waveAutoOsc = null;
  }
}

function _waveStartLoop() {
  if (_waveAnim) cancelAnimationFrame(_waveAnim);
  const draw = () => {
    if (!_waveCtx || !_visualCanvas) return;
    if (_waveAnalyser) {
      if (_waveMicStream) _waveAnalyser.getByteFrequencyData(_waveData);
      else _waveAnalyser.getByteTimeDomainData(_waveData);
    }
    _waveDraw();
    _waveAnim = requestAnimationFrame(draw);
  };
  draw();
}

function _waveDraw() {
  const w = _visualCanvas.width, h = _visualCanvas.height;
  _waveCtx.fillStyle = 'rgba(0,0,0,0.15)';
  _waveCtx.fillRect(0, 0, w, h);

  if (!_waveData) return;
  const d = _waveData;
  const len = d.length;

  if (_waveStyle === 'bars') {
    const bw = w / len;
    for (let i = 0; i < len; i++) {
      const v = d[i] / 255;
      const bh = v * h * 0.85;
      const hue = (i / len * 120 + _waveAnim * 0.1) % 360;
      _waveCtx.fillStyle = `hsl(${hue},80%,${40 + v * 30}%)`;
      _waveCtx.fillRect(i * bw, h - bh, bw - 1, bh);
    }
  } else if (_waveStyle === 'circular') {
    const cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.3;
    for (let i = 0; i < len; i++) {
      const v = d[i] / 255;
      const ang = (i / len) * Math.PI * 2;
      const len2 = r + v * r * 0.8;
      _waveCtx.strokeStyle = `hsl(${i / len * 360},80%,${50 + v * 20}%)`;
      _waveCtx.lineWidth = 2;
      _waveCtx.beginPath();
      _waveCtx.moveTo(cx + Math.cos(ang) * r * 0.3, cy + Math.sin(ang) * r * 0.3);
      _waveCtx.lineTo(cx + Math.cos(ang) * len2, cy + Math.sin(ang) * len2);
      _waveCtx.stroke();
    }
  } else {
    // Scope
    _waveCtx.strokeStyle = '#0f0';
    _waveCtx.lineWidth = 1.5;
    _waveCtx.beginPath();
    for (let i = 0; i < len; i++) {
      const v = d[i] / 255;
      const y = v * h;
      if (i === 0) _waveCtx.moveTo(0, y);
      else _waveCtx.lineTo(i / len * w, y);
    }
    _waveCtx.stroke();
  }
}

function setWaveStyle(s) { _waveStyle = s; renderWaveUI(document.getElementById('visualContent')); }

// ================================================================
//  NOISE — Live Coding Bytebeat Synth
// ================================================================
let _noiseCanvas, _noiseCtx, _noiseAnim;
let _noiseFormula = 't*((t>>12|t>>8)&63&t>>4)';
let _noisePlaying = false;
let _noiseScriptNode = null;
let _noiseGainNode = null;
let _noiseInterval = null;
let _noiseT = 0;
let _noiseHistory = [];
const NOISE_PRESETS = [
  { name: 'DRIFT',   fn: 't*(t>>12|t>>8&t>>2)&64' },
  { name: 'RAVE',    fn: 't*t>>10&t&48' },
  { name: 'WARP',    fn: '(t>>6|t>>8|t)*(t>>6|t>>8)' },
  { name: 'HEX',     fn: 't*(t>>8&(t>>4|t>>32))' },
  { name: 'BEAM',    fn: '(t>>7|t>>11|t>>4|t>>1)&49' },
  { name: 'FLUX',    fn: 't*5&(t>>7)|t*3&(t>>10)' },
  { name: 'VOID',    fn: 't>>5&1?t>>4&1?t>>3&1?t>>2&1?200:0:0:0:0' },
  { name: 'CIPHER',  fn: '(t*9&t>>4|t*5&t>>7|t*3&t>>10)&128' }
];

function initNoise() {
  const container = document.getElementById('noiseContent');
  if (!container) return;
  _noiseCanvas = document.getElementById('noiseVis');
  if (_noiseCanvas) _noiseCtx = _noiseCanvas.getContext('2d');
  renderNoiseUI(container);
}

function renderNoiseUI(container) {
  container.innerHTML = `
    <div style="display:flex;flex-direction:column;height:100%;box-sizing:border-box;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 6px;">
        <span style="font-size:9px;font-weight:bold;color:var(--gb-text);">♯ NOISE</span>
        <span style="font-size:5px;opacity:0.6;">${_noisePlaying ? 'LIVE' : 'IDLE'}</span>
      </div>
      <div style="padding:0 6px 4px;">
        <div style="display:flex;gap:2px;flex-wrap:wrap;">
          ${NOISE_PRESETS.map((p,i) => `<button onclick="setNoisePreset(${i})" style="font-size:4px;padding:2px 4px;${_noiseFormula===p.fn?'background:var(--gb-text);color:var(--gb-bg);':''}">${p.name}</button>`).join('')}
        </div>
      </div>
      <div style="flex:0 0 40px;margin:0 6px 4px;border:2px solid var(--gb-text);border-radius:4px;overflow:hidden;background:#000;">
        <canvas id="noiseVis" width="280" height="40" style="width:100%;height:100%;"></canvas>
      </div>
      <div style="padding:0 6px 4px;">
        <textarea id="noiseInput" style="width:100%;height:50px;background:rgba(0,0,0,0.3);color:var(--gb-text);border:1px solid var(--gb-text);border-radius:3px;padding:4px;font-family:monospace;font-size:7px;resize:none;box-sizing:border-box;">${_noiseFormula}</textarea>
      </div>
      <div style="display:flex;gap:3px;padding:0 6px 4px;">
        <button onclick="noisePlay()" style="flex:1;font-size:6px;padding:4px;${_noisePlaying?'background:#a00;color:#fff;':''}" id="bytebeatPlayBtn">${_noisePlaying ? '■ STOP' : '▶ PLAY'}</button>
        <button onclick="noiseApply()" style="flex:1;font-size:6px;padding:4px;">APPLY</button>
      </div>
      <div style="padding:0 6px 4px;flex:1;overflow-y:auto;" id="noiseHistory">
        ${_noiseHistory.length === 0 ? '<div style="text-align:center;font-size:5px;opacity:0.4;padding:8px;">SAVED FORMULAS APPEAR HERE</div>' :
          _noiseHistory.slice(-8).map((h,i) => `
            <div onclick="noiseLoadFormula('${h.fn.replace(/'/g,"\\'")}')" style="padding:3px;margin-bottom:2px;border:1px solid var(--gb-text);border-radius:3px;cursor:pointer;font-size:5px;">
              <span style="font-weight:bold;">${h.name}</span>
              <span style="opacity:0.5;margin-left:4px;">${h.fn.substring(0,25)}...</span>
            </div>
          `).join('')}
      </div>
    </div>
  `;
}

function noisePlay() {
  if (_noisePlaying) { noiseStop(); return; }
  try {
    const ctx = getCreativeAudioCtx();
    const bufSize = 4096;
    // createScriptProcessor deprecated but AudioWorklet requires separate file
    // Using createScriptProcessor with small buffer for compatibility
    _noiseScriptNode = ctx.createScriptProcessor(bufSize, 0, 1);
    _noiseT = 0;

    // Create gain for volume control
    const gain = ctx.createGain();
    gain.gain.value = 0.3;
    _noiseScriptNode.connect(gain);
    gain.connect(ctx.destination);

    _noiseScriptNode.onaudioprocess = (e) => {
      const out = e.outputBuffer.getChannelData(0);
      const fn = _getNoiseFn();
      for (let i = 0; i < out.length; i++) {
        try { out[i] = (fn(_noiseT) & 255) / 127.5 - 1; } catch(err) { out[i] = 0; }
        _noiseT++;
      }
    };

    _noisePlaying = true;
    _noiseGainNode = gain;
    renderNoiseUI(document.getElementById('noiseContent'));
    _noiseVisLoop();
  } catch(e) { /* audio failed */ }
}

function noiseStop() {
  if (_noiseScriptNode) { try { _noiseScriptNode.disconnect(); } catch(e){} _noiseScriptNode = null; }
  if (_noiseGainNode) { try { _noiseGainNode.disconnect(); } catch(e){} _noiseGainNode = null; }
  _noisePlaying = false;
  renderNoiseUI(document.getElementById('noiseContent'));
}

function _getNoiseFn() {
  try {
    return new Function('t', 'return (' + _noiseFormula + ') & 255;');
  } catch(e) {
    return () => 128;
  }
}

function noiseApply() {
  const inp = document.getElementById('noiseInput');
  if (inp) _noiseFormula = inp.value.trim() || '128';
  _noiseHistory.push({ name: 'F' + (_noiseHistory.length + 1), fn: _noiseFormula });
  renderNoiseUI(document.getElementById('noiseContent'));
}

function setNoisePreset(i) {
  _noiseFormula = NOISE_PRESETS[i].fn;
  renderNoiseUI(document.getElementById('noiseContent'));
}

function noiseLoadFormula(fn) {
  _noiseFormula = fn;
  renderNoiseUI(document.getElementById('noiseContent'));
}

function _noiseVisLoop() {
  if (!_noisePlaying || !_noiseCtx || !_noiseCanvas) return;
  const w = _noiseCanvas.width, h = _noiseCanvas.height;
  const img = _noiseCtx.createImageData(w, h);
  const fn = _getNoiseFn();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v = (fn(_noiseT + x + y * w) & 255);
      const idx = (y * w + x) * 4;
      img.data[idx] = v;
      img.data[idx + 1] = v;
      img.data[idx + 2] = v;
      img.data[idx + 3] = 255;
    }
  }
  _noiseCtx.putImageData(img, 0, 0);
  requestAnimationFrame(_noiseVisLoop);
}

// ================================================================
//  MAZE — Procedural Dungeon Crawler
// ================================================================
let _mazeGrid = [], _mazeW = 0, _mazeH = 0;
let _mazePlayer = {x:1,y:1};
let _mazeItems = [], _mazeEnemies = [], _mazeFog = [];
let _mazeLevel = 1, _mazeHP = 5, _mazeMaxHP = 5;
let _mazeKeys = 0, _mazeScore = 0, _mazeRunning = false;
const MAZE_CELL = { WALL: 0, FLOOR: 1, DOOR: 2, KEY: 3, POTION: 4, EXIT: 5, ENEMY: 6, COIN: 7 };
const MAZE_SYMBOLS = { 0:'██', 1:'  ', 2:'▒▒', 3:'⚷', 4:'♥', 5:'▶', 6:'☠', 7:'●' };
const MAZE_COLORS = { 0:'#555', 1:'#111', 2:'#886633', 3:'#ff0', 4:'#f44', 5:'#0f0', 6:'#f00', 7:'#ff0' };

function initMaze() {
  const container = document.getElementById('mazeContent');
  if (!container) return;
  _mazeGenerate();
  _mazeRunning = true;
  renderMazeUI(container);
}

function _mazeGenerate() {
  _mazeW = 21; _mazeH = 15;
  _mazeGrid = Array.from({length:_mazeH}, () => Array(_mazeW).fill(0));
  _mazeItems = []; _mazeEnemies = []; _mazeFog = Array.from({length:_mazeH}, () => Array(_mazeW).fill(false));

  // Carve rooms
  const rooms = [];
  for (let i = 0; i < 6 + _mazeLevel; i++) {
    const rw = 3 + Math.floor(Math.random() * 3) * 2;
    const rh = 3 + Math.floor(Math.random() * 3) * 2;
    const rx = 1 + Math.floor(Math.random() * ((_mazeW - rw - 2) / 2)) * 2;
    const ry = 1 + Math.floor(Math.random() * ((_mazeH - rh - 2) / 2)) * 2;
    let overlap = false;
    for (const r of rooms) {
      if (rx < r.x + r.w + 2 && rx + rw + 2 > r.x && ry < r.y + r.h + 2 && ry + rh + 2 > r.y) { overlap = true; break; }
    }
    if (overlap) continue;
    rooms.push({x:rx,y:ry,w:rw,h:rh});
    for (let y = ry; y < ry + rh; y++)
      for (let x = rx; x < rx + rw; x++)
        _mazeGrid[y][x] = MAZE_CELL.FLOOR;
  }

  // Connect rooms with corridors
  for (let i = 1; i < rooms.length; i++) {
    const a = rooms[i-1], b = rooms[i];
    let cx = Math.floor((a.x + a.w/2 + b.x + b.w/2) / 2);
    let cy = Math.floor((a.y + a.h/2 + b.y + b.h/2) / 2);
    while (cx !== Math.floor(a.x + a.w/2)) {
      if (_mazeGrid[cy] && cx >= 0 && cx < _mazeW) _mazeGrid[cy][cx] = MAZE_CELL.FLOOR;
      cx += cx < Math.floor(a.x + a.w/2) ? 1 : -1;
    }
    while (cy !== Math.floor(a.y + a.h/2)) {
      if (_mazeGrid[cy] && cx >= 0 && cx < _mazeW) _mazeGrid[cy][cx] = MAZE_CELL.FLOOR;
      cy += cy < Math.floor(a.y + a.h/2) ? 1 : -1;
    }
    cx = Math.floor((a.x + a.w/2 + b.x + b.w/2) / 2);
    cy = Math.floor((a.y + a.h/2 + b.y + b.h/2) / 2);
    while (cy !== Math.floor(b.y + b.h/2)) {
      if (_mazeGrid[cy] && cx >= 0 && cx < _mazeW) _mazeGrid[cy][cx] = MAZE_CELL.FLOOR;
      cy += cy < Math.floor(b.y + b.h/2) ? 1 : -1;
    }
    while (cx !== Math.floor(b.x + b.w/2)) {
      if (_mazeGrid[cy] && cx >= 0 && cx < _mazeW) _mazeGrid[cy][cx] = MAZE_CELL.FLOOR;
      cx += cx < Math.floor(b.x + b.w/2) ? 1 : -1;
    }
  }

  // Place player
  if (rooms.length > 0) {
    _mazePlayer = { x: Math.floor(rooms[0].x + rooms[0].w/2), y: Math.floor(rooms[0].y + rooms[0].h/2) };
  }

  // Place exit in last room
  if (rooms.length > 1) {
    const last = rooms[rooms.length - 1];
    _mazeGrid[Math.floor(last.y + last.h/2)][Math.floor(last.x + last.w/2)] = MAZE_CELL.EXIT;
  }

  // Place items in rooms
  for (let i = 1; i < rooms.length - 1; i++) {
    const r = rooms[i];
    const cx2 = Math.floor(r.x + r.w/2), cy2 = Math.floor(r.y + r.h/2);
    if (Math.random() < 0.4) _mazeGrid[cy2][cx2] = MAZE_CELL.KEY;
    else if (Math.random() < 0.3) _mazeGrid[cy2][cx2] = MAZE_CELL.POTION;
    else if (Math.random() < 0.5) _mazeGrid[cy2][cx2] = MAZE_CELL.COIN;
    // Enemy
    if (Math.random() < 0.3 + _mazeLevel * 0.05) {
      const ex = r.x + 1 + Math.floor(Math.random() * (r.w - 2));
      const ey = r.y + 1 + Math.floor(Math.random() * (r.h - 2));
      if (_mazeGrid[ey][ex] === MAZE_CELL.FLOOR) {
        _mazeEnemies.push({x:ex, y:ey, hp: 1 + Math.floor(_mazeLevel/2), dir: Math.floor(Math.random()*4)});
      }
    }
  }

  // Reveal around player
  _mazeReveal(_mazePlayer.x, _mazePlayer.y, 3);
}

function _mazeReveal(px, py, r) {
  for (let dy = -r; dy <= r; dy++)
    for (let dx = -r; dx <= r; dx++) {
      const nx = px + dx, ny = py + dy;
      if (nx >= 0 && nx < _mazeW && ny >= 0 && ny < _mazeH) _mazeFog[ny][nx] = true;
    }
}

function renderMazeUI(container) {
  const cellW = Math.floor(Math.min(280 / _mazeW, 18));
  const cellH = cellW;
  let gridHTML = '';
  for (let y = 0; y < _mazeH; y++) {
    for (let x = 0; x < _mazeW; x++) {
      const isPlayer = x === _mazePlayer.x && y === _mazePlayer.y;
      const visible = _mazeFog[y][x];
      const cell = _mazeGrid[y][x];
      let ch, clr;
      if (isPlayer) { ch = '@'; clr = '#0ff'; }
      else if (!visible) { ch = '  '; clr = '#111'; }
      else {
        // Check enemy
        const enemy = _mazeEnemies.find(e => e.x === x && e.y === y);
        if (enemy) { ch = MAZE_SYMBOLS[6]; clr = MAZE_COLORS[6]; }
        else { ch = MAZE_SYMBOLS[cell] || '  '; clr = MAZE_COLORS[cell] || '#111'; }
      }
      gridHTML += `<span style="display:inline-block;width:${cellW}px;height:${cellH}px;line-height:${cellH}px;text-align:center;font-size:${Math.max(cellW-4,5)}px;color:${clr};background:${visible?'rgba(0,0,0,0.3)':'#050'};font-family:monospace;">${ch}</span>`;
    }
    gridHTML += '<br>';
  }

  container.innerHTML = `
    <div style="display:flex;flex-direction:column;height:100%;box-sizing:border-box;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 6px;">
        <span style="font-size:9px;font-weight:bold;color:var(--gb-text);">⚔ MAZE</span>
        <span style="font-size:5px;opacity:0.6;">LV${_mazeLevel} | ${'♥'.repeat(_mazeHP)}${'♡'.repeat(_mazeMaxHP-_mazeHP)} | ⚷${_mazeKeys} | ●${_mazeScore}</span>
      </div>
      <div style="flex:1;overflow:auto;padding:4px 6px;font-size:${Math.max(cellW-4,5)}px;line-height:1;letter-spacing:0;">
        ${gridHTML}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:2px;padding:0 6px 4px;">
        <div></div>
        <button onclick="mazeMove(0,-1)" style="font-size:8px;padding:4px;">▲</button>
        <div></div>
        <button onclick="mazeMove(-1,0)" style="font-size:8px;padding:4px;">◄</button>
        <button onclick="mazeMove(0,1)" style="font-size:8px;padding:4px;">▼</button>
        <button onclick="mazeMove(1,0)" style="font-size:8px;padding:4px;">►</button>
      </div>
    </div>
  `;
}

function mazeMove(dx, dy) {
  if (!_mazeRunning) return;
  const nx = _mazePlayer.x + dx, ny = _mazePlayer.y + dy;
  if (nx < 0 || nx >= _mazeW || ny < 0 || ny >= _mazeH) return;

  const cell = _mazeGrid[ny][nx];
  if (cell === MAZE_CELL.WALL) return;

  if (cell === MAZE_CELL.DOOR && _mazeKeys <= 0) return;

  _mazePlayer.x = nx;
  _mazePlayer.y = ny;
  _mazeReveal(nx, ny, 3);

  // Collect
  if (cell === MAZE_CELL.KEY) { _mazeKeys++; _mazeGrid[ny][nx] = MAZE_CELL.FLOOR; if(window.sounds)sounds.click(); }
  if (cell === MAZE_CELL.POTION) { _mazeHP = Math.min(_mazeMaxHP, _mazeHP + 2); _mazeGrid[ny][nx] = MAZE_CELL.FLOOR; if(window.sounds)sounds.click(); }
  if (cell === MAZE_CELL.COIN) { _mazeScore += 10; _mazeGrid[ny][nx] = MAZE_CELL.FLOOR; if(window.sounds)sounds.click(); }
  if (cell === MAZE_CELL.EXIT) {
    _mazeLevel++;
    if (window.sounds) sounds.launch();
    _mazeGenerate();
    renderMazeUI(document.getElementById('mazeContent'));
    return;
  }
  if (cell === MAZE_CELL.DOOR) { _mazeKeys--; _mazeGrid[ny][nx] = MAZE_CELL.FLOOR; }

  // Enemy collision
  const enemyIdx = _mazeEnemies.findIndex(e => e.x === nx && e.y === ny);
  if (enemyIdx >= 0) {
    _mazeEnemies.splice(enemyIdx, 1);
    _mazeHP--;
    _mazeScore += 25;
    if (window.sounds) sounds.hit();
    if (_mazeHP <= 0) {
      _mazeRunning = false;
      _mazeGameOver();
    }
  }

  // Move enemies
  _mazeEnemies.forEach(e => {
    const dirs = [[0,-1],[0,1],[-1,0],[1,0]];
    const d = dirs[Math.floor(Math.random() * 4)];
    const enx = e.x + d[0], eny = e.y + d[1];
    if (enx >= 0 && enx < _mazeW && eny >= 0 && eny < _mazeH && _mazeGrid[eny][enx] !== MAZE_CELL.WALL) {
      e.x = enx; e.y = eny;
    }
    // Damage player
    if (e.x === _mazePlayer.x && e.y === _mazePlayer.y) {
      _mazeHP--;
      if (window.sounds) sounds.hit();
      if (_mazeHP <= 0) { _mazeRunning = false; _mazeGameOver(); }
    }
  });

  renderMazeUI(document.getElementById('mazeContent'));
}

function _mazeGameOver() {
  const container = document.getElementById('mazeContent');
  if (!container) return;
  container.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:20px;">
      <div style="font-size:14px;font-weight:bold;margin-bottom:10px;">GAME OVER</div>
      <div style="font-size:8px;margin-bottom:5px;">LEVEL: ${_mazeLevel}</div>
      <div style="font-size:8px;margin-bottom:15px;">SCORE: ${_mazeScore}</div>
      <button onclick="mazeRestart()" style="font-size:8px;padding:8px 16px;">RETRY</button>
      <button onclick="launchApp('home')" style="font-size:6px;padding:6px 12px;margin-top:8px;opacity:0.6;">HOME</button>
    </div>
  `;
}

function mazeRestart() {
  _mazeLevel = 1; _mazeHP = 5; _mazeKeys = 0; _mazeScore = 0; _mazeRunning = true;
  _mazeGenerate();
  renderMazeUI(document.getElementById('mazeContent'));
}
