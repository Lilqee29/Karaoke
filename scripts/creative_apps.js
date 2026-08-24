// ================================================================
//  CREATIVE APPS — GLITCH · VISUAL · NOISE · MAZE
//  Four creative apps for GameBoy OS
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
  if (_noiseSource) { try { _noiseSource.stop(); } catch(e){} try { _noiseSource.disconnect(); } catch(e){} _noiseSource = null; }
  if (_noiseGainNode) { try { _noiseGainNode.disconnect(); } catch(e){} _noiseGainNode = null; }
  _noisePlaying = false;
  _waveAutoNodes = null;
  _waveStarted = false;
}

// ================================================================
//  GLITCH — Generative Particle Art Canvas
// ================================================================
let _glitchCanvas, _glitchCtx, _glitchAnim, _glitchParticles = [];
let _glitchMode = 'flow', _glitchTime = 0, _glitchMouse = {x:0,y:0,active:false};
const GLITCH_MODES = ['flow','rain','galaxy','fire','magnetic'];

function initGlitch() {
  const container = document.getElementById('glitchContent');
  if (!container) return;
  // Render FIRST so canvas element exists in DOM
  renderGlitchUI(container);
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
  _glitchCtx.fillStyle = _glitchMode === 'fire' ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.05)';
  _glitchCtx.fillRect(0, 0, w, h);

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

  if (_glitchParticles.length < 200 && Math.random() < 0.3) {
    _glitchParticles.push({
      x: Math.random() * w, y: Math.random() * h, vx: 0, vy: 0,
      life: 1, decay: 0.002 + Math.random() * 0.005,
      size: 0.5 + Math.random() * 2, hue: Math.random() * 360
    });
  }

  const cx = w / 2, cy = h / 2;
  for (let i = _glitchParticles.length - 1; i >= 0; i--) {
    const p = _glitchParticles[i];
    switch (_glitchMode) {
      case 'flow': {
        const angle = (Math.sin(p.x * 0.01 + _glitchTime) + Math.cos(p.y * 0.01 + _glitchTime * 0.7)) * Math.PI;
        p.vx += Math.cos(angle) * 0.15; p.vy += Math.sin(angle) * 0.15;
        p.vx *= 0.98; p.vy *= 0.98; break;
      }
      case 'rain':
        p.vy += 0.12; p.vx *= 0.99;
        if (p.y > h) { p.y = 0; p.x = Math.random() * w; } break;
      case 'galaxy': {
        const dx = cx - p.x, dy = cy - p.y, dist = Math.sqrt(dx * dx + dy * dy) + 1;
        const ang = Math.atan2(dy, dx);
        p.vx += Math.cos(ang + Math.PI / 2) * (80 / dist);
        p.vy += Math.sin(ang + Math.PI / 2) * (80 / dist);
        p.vx += dx / dist * 0.3; p.vy += dy / dist * 0.3;
        p.vx *= 0.97; p.vy *= 0.97; break;
      }
      case 'fire':
        p.vy -= 0.08; p.vx += (Math.random() - 0.5) * 0.5; p.vx *= 0.96;
        p.hue = 20 + p.life * 40; break;
      case 'magnetic': {
        const dx2 = cx - p.x, dy2 = cy - p.y, dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) + 1;
        const force = (dist2 < 100 ? -2 : 1.5) * (50 / dist2);
        p.vx += dx2 / dist2 * force; p.vy += dy2 / dist2 * force;
        p.vx *= 0.97; p.vy *= 0.97; break;
      }
    }
    p.x += p.vx; p.y += p.vy; p.life -= p.decay;
    if (p.life <= 0 || p.x < -20 || p.x > w + 20 || p.y < -20 || p.y > h + 20) {
      _glitchParticles.splice(i, 1); continue;
    }
    _glitchCtx.fillStyle = `hsla(${p.hue},80%,60%,${p.life * 0.8})`;
    _glitchCtx.beginPath();
    _glitchCtx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    _glitchCtx.fill();
  }
  _glitchAnim = requestAnimationFrame(_glitchLoop);
}

function setGlitchMode(m) {
  _glitchMode = m;
  renderGlitchUI(document.getElementById('glitchContent'));
  // Re-acquire canvas after innerHTML rewrite
  _glitchCanvas = document.getElementById('glitchCanvas');
  if (_glitchCanvas) _glitchCtx = _glitchCanvas.getContext('2d');
}
function clearGlitchParticles() {
  _glitchParticles = [];
  renderGlitchUI(document.getElementById('glitchContent'));
  _glitchCanvas = document.getElementById('glitchCanvas');
  if (_glitchCanvas) _glitchCtx = _glitchCanvas.getContext('2d');
}

// ================================================================
//  VISUAL — Audio Visualizer + Lofi White Noise + Mic Reactive
// ================================================================
let _visualCanvas, _waveCtx, _waveAnim, _waveAnalyser, _waveData;
let _waveMicStream = null, _waveStyle = 'bars';
let _waveAutoNodes = null; // { source, gain, filters, ctx }
let _waveVolume = 0.15;
let _wavePreset = 'lofi'; // lofi | rain | ocean | vinyl | static
let _waveStarted = false;

function initVisual() {
  const container = document.getElementById('visualContent');
  if (!container) return;
  // Render FIRST so canvas exists
  renderWaveUI(container);
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

  // Don't auto-start — show a play button (iOS needs user gesture on play, not just on app open)
  _waveStarted = false;
  _waveStartLoop();
}

function renderWaveUI(container) {
  const presets = ['lofi','rain','ocean','vinyl','static'];
  container.innerHTML = `
    <div style="display:flex;flex-direction:column;height:100%;box-sizing:border-box;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 6px;">
        <span style="font-size:9px;font-weight:bold;color:var(--gb-text);">≋ VISUAL</span>
        <span style="font-size:5px;opacity:0.6;">${_waveMicStream ? 'MIC ON' : _waveStarted ? _wavePreset.toUpperCase() : 'PAUSED'}</span>
      </div>
      <div style="display:flex;gap:2px;padding:0 6px 4px;flex-wrap:wrap;">
        ${['bars','circular','scope'].map(s => `<button onclick="setWaveStyle('${s}')" style="font-size:5px;padding:2px 5px;${_waveStyle===s?'background:var(--gb-text);color:var(--gb-bg);':''}">${s.toUpperCase()}</button>`).join('')}
        <button onclick="waveToggleMic()" style="font-size:5px;padding:2px 5px;" id="waveMicBtn">${_waveMicStream ? '🎤 OFF' : '🎤 ON'}</button>
      </div>
      <div style="padding:0 6px 4px;display:flex;gap:2px;flex-wrap:wrap;">
        ${presets.map(p => `<button onclick="setWavePreset('${p}')" style="font-size:4px;padding:2px 4px;${_wavePreset===p&&!_waveMicStream?'background:var(--gb-text);color:var(--gb-bg);':''}">${p.toUpperCase()}</button>`).join('')}
      </div>
      <div style="flex:1;position:relative;margin:0 6px 6px;border:2px solid var(--gb-text);border-radius:4px;overflow:hidden;background:#000;">
        <canvas id="visualCanvas" style="width:100%;height:100%;display:block;"></canvas>
        ${!_waveStarted && !_waveMicStream ? '<button onclick="wavePlay()" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:10px;padding:8px 16px;background:var(--gb-text);color:var(--gb-bg);border:none;border-radius:4px;cursor:pointer;">▶ PLAY</button>' : ''}
      </div>
      <div style="padding:0 6px 6px;font-size:4px;text-align:center;opacity:0.5;">TAP PLAY TO START · ${_waveStarted ? 'SOUND ON' : 'LOFI WHITE NOISE'}</div>
    </div>
  `;
}

function setWavePreset(name) {
  if (_waveMicStream) return;
  _waveApplyPreset(name);
  renderWaveUI(document.getElementById('visualContent'));
  _visualCanvas = document.getElementById('visualCanvas');
  if (_visualCanvas) _waveCtx = _visualCanvas.getContext('2d');
}

async function waveToggleMic() {
  if (_waveMicStream) {
    _waveMicStream.getTracks().forEach(t => t.stop());
    _waveMicStream = null; _waveAnalyser = null;
    _waveStarted = false;
    renderWaveUI(document.getElementById('visualContent'));
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    _waveMicStream = stream;
    _waveStopAuto(); // stop white noise when mic is on
    const ctx = getCreativeAudioCtx();
    if (ctx.state === 'suspended') await ctx.resume();
    const src = ctx.createMediaStreamSource(stream);
    _waveAnalyser = ctx.createAnalyser();
    _waveAnalyser.fftSize = 256;
    src.connect(_waveAnalyser);
    _waveData = new Uint8Array(_waveAnalyser.frequencyBinCount);
    _waveStarted = true;
    _waveStartLoop();
    renderWaveUI(document.getElementById('visualContent'));
  } catch(e) { /* mic denied */ }
}

async function wavePlay() {
  if (_waveStarted) { waveStop(); return; }
  try {
    const ctx = getCreativeAudioCtx();
    // CRITICAL: await resume() on iOS — AudioContext starts suspended
    if (ctx.state === 'suspended') await ctx.resume();
    _waveStarted = true;
    _waveAutoStartNoise(ctx);
    _waveStartLoop();
    renderWaveUI(document.getElementById('visualContent'));
  } catch(e) {
    console.warn('VISUAL play failed:', e);
  }
}

function waveStop() {
  _waveStopAuto();
  _waveStarted = false;
  renderWaveUI(document.getElementById('visualContent'));
}

function _waveAutoStartNoise(ctx) {
  if (_waveAutoNodes) return;

  // Create white noise buffer — pattern from Hubs-Foundation/hubs
  const bufferSize = 2 * ctx.sampleRate;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer;
  source.loop = true;

  // Lofi filter chain
  const lowpass = ctx.createBiquadFilter();
  lowpass.type = 'lowpass';
  lowpass.frequency.value = 800;
  lowpass.Q.value = 0.7;

  const highpass = ctx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 100;

  const gain = ctx.createGain();
  gain.gain.value = _waveVolume;

  // Analyser for visualizer
  _waveAnalyser = ctx.createAnalyser();
  _waveAnalyser.fftSize = 256;
  _waveData = new Uint8Array(_waveAnalyser.frequencyBinCount);

  // Chain: source → lowpass → highpass → gain → analyser → destination
  source.connect(lowpass);
  lowpass.connect(highpass);
  highpass.connect(gain);
  gain.connect(_waveAnalyser);
  _waveAnalyser.connect(ctx.destination);

  source.start();
  _waveAutoNodes = { source, gain, lowpass, highpass, ctx };
  _waveApplyPreset(_wavePreset);
}

function _waveStopAuto() {
  if (_waveAutoNodes) {
    try { _waveAutoNodes.source.stop(); } catch(e){}
    try { _waveAutoNodes.source.disconnect(); } catch(e){}
    try { _waveAutoNodes.gain.disconnect(); } catch(e){}
    try { _waveAutoNodes.lowpass.disconnect(); } catch(e){}
    try { _waveAutoNodes.highpass.disconnect(); } catch(e){}
    _waveAutoNodes = null;
  }
  _waveStarted = false;
}

function _waveApplyPreset(name) {
  _wavePreset = name;
  if (!_waveAutoNodes) return;
  const { lowpass, highpass, gain } = _waveAutoNodes;
  switch (name) {
    case 'lofi':
      lowpass.frequency.value = 800; highpass.frequency.value = 100; gain.gain.value = _waveVolume; break;
    case 'rain':
      lowpass.frequency.value = 2000; highpass.frequency.value = 200; gain.gain.value = _waveVolume * 0.8; break;
    case 'ocean':
      lowpass.frequency.value = 400; highpass.frequency.value = 60; gain.gain.value = _waveVolume * 1.2; break;
    case 'vinyl':
      lowpass.frequency.value = 3000; highpass.frequency.value = 400; gain.gain.value = _waveVolume * 0.6; break;
    case 'static':
      lowpass.frequency.value = 8000; highpass.frequency.value = 2000; gain.gain.value = _waveVolume * 0.4; break;
  }
}

function _waveStartLoop() {
  if (_waveAnim) cancelAnimationFrame(_waveAnim);
  const draw = () => {
    if (!_waveCtx || !_visualCanvas) return;
    if (_waveAnalyser) {
      _waveAnalyser.getByteFrequencyData(_waveData);
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
  const d = _waveData, len = d.length;
  const t = Date.now() * 0.001;
  if (_waveStyle === 'bars') {
    const bw = w / len;
    for (let i = 0; i < len; i++) {
      const v = d[i] / 255, bh = v * h * 0.85;
      _waveCtx.fillStyle = `hsl(${(i / len * 120 + t * 20) % 360},80%,${40 + v * 30}%)`;
      _waveCtx.fillRect(i * bw, h - bh, bw - 1, bh);
    }
  } else if (_waveStyle === 'circular') {
    const cx = w / 2, cy = h / 2, r = Math.min(w, h) * 0.3;
    for (let i = 0; i < len; i++) {
      const v = d[i] / 255, ang = (i / len) * Math.PI * 2, len2 = r + v * r * 0.8;
      _waveCtx.strokeStyle = `hsl(${i / len * 360},80%,${50 + v * 20}%)`;
      _waveCtx.lineWidth = 2;
      _waveCtx.beginPath();
      _waveCtx.moveTo(cx + Math.cos(ang) * r * 0.3, cy + Math.sin(ang) * r * 0.3);
      _waveCtx.lineTo(cx + Math.cos(ang) * len2, cy + Math.sin(ang) * len2);
      _waveCtx.stroke();
    }
  } else {
    _waveCtx.strokeStyle = '#0f0'; _waveCtx.lineWidth = 1.5;
    _waveCtx.beginPath();
    for (let i = 0; i < len; i++) {
      const y = (d[i] / 255) * h;
      if (i === 0) _waveCtx.moveTo(0, y); else _waveCtx.lineTo(i / len * w, y);
    }
    _waveCtx.stroke();
  }
}

function setWaveStyle(s) {
  _waveStyle = s;
  renderWaveUI(document.getElementById('visualContent'));
  _visualCanvas = document.getElementById('visualCanvas');
  if (_visualCanvas) _waveCtx = _visualCanvas.getContext('2d');
}

// ================================================================
//  NOISE — Ambient Sound Generator (friendly presets, no jargon)
//  Uses createBufferSource loop pattern from GitHub repos.
// ================================================================
let _noiseCanvas, _noiseCtx2d;
let _noiseType = 'lofi';
let _noisePlaying = false;
let _noiseSource = null;
let _noiseGainNode = null;
let _noiseVolume = 0.3;
const NOISE_PRESETS = [
  { name: 'LOFI',      icon: '🎵', type: 'lofi' },
  { name: 'RAIN',      icon: '☔', type: 'rain' },
  { name: 'OCEAN',     icon: '🌊', type: 'ocean' },
  { name: 'FOREST',    icon: '🌲', type: 'forest' },
  { name: 'FIRE',      icon: '🔥', type: 'fire' },
  { name: 'WIND',      icon: '💨', type: 'wind' },
  { name: 'WHITE',     icon: '☁',  type: 'white' },
  { name: 'PINK',      icon: '🩷', type: 'pink' }
];

function initNoise() {
  const container = document.getElementById('noiseContent');
  if (!container) return;
  renderNoiseUI(container);
  _noiseCanvas = document.getElementById('noiseVis');
  if (_noiseCanvas) _noiseCtx2d = _noiseCanvas.getContext('2d');
}

function _noiseGenBuffer(type, sampleRate) {
  const len = sampleRate * 2;
  const buf = new Float32Array(len);
  let last = 0, last2 = 0;
  for (let i = 0; i < len; i++) {
    const r = Math.random() * 2 - 1;
    switch (type) {
      case 'lofi': {
        last = last * 0.998 + r * 0.002;
        const crackle = Math.random() > 0.997 ? r * 0.12 : 0;
        buf[i] = (last + crackle) * 2.5;
        break;
      }
      case 'rain': {
        const drop = Math.random() > 0.985 ? r * 2.5 : r * 0.08;
        buf[i] = drop;
        break;
      }
      case 'ocean':
        last = (last + r * 0.015) / 1.015;
        buf[i] = last * 4;
        break;
      case 'forest':
        last = last * 0.97 + r * 0.06;
        buf[i] = last * 2.5;
        break;
      case 'fire': {
        last = last * 0.995 + r * 0.005;
        const pop = Math.random() > 0.998 ? r * 0.8 : 0;
        const crackle = Math.random() > 0.99 ? r * 0.3 : 0;
        buf[i] = (last * 2 + pop + crackle) * 1.5;
        break;
      }
      case 'wind': {
        const mod = Math.sin(i * 0.00008) * 0.5 + 0.5;
        last = last * 0.997 + r * 0.003;
        buf[i] = last * mod * 5;
        break;
      }
      case 'white':
        buf[i] = r;
        break;
      case 'pink': {
        // Voss-McCartney pink noise
        last2 = last2 * 0.99 + r * 0.01;
        buf[i] = (r + last2) * 1.5;
        break;
      }
      default:
        buf[i] = r;
    }
  }
  return buf;
}

function renderNoiseUI(container) {
  container.innerHTML = `
    <div style="display:flex;flex-direction:column;height:100%;box-sizing:border-box;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 6px;">
        <span style="font-size:9px;font-weight:bold;color:var(--gb-text);">♯ NOISE</span>
        <span style="font-size:5px;opacity:0.6;">${_noisePlaying ? '▶ LIVE' : '■ IDLE'}</span>
      </div>
      <div style="padding:0 6px 4px;">
        <div style="display:flex;gap:2px;flex-wrap:wrap;">
          ${NOISE_PRESETS.map(p => `<button onclick="setNoiseGenType('${p.type}')" style="font-size:5px;padding:3px 5px;${_noiseType===p.type?'background:var(--gb-text);color:var(--gb-bg);':''}">${p.icon} ${p.name}</button>`).join('')}
        </div>
      </div>
      <div style="flex:0 0 40px;margin:0 6px 4px;border:2px solid var(--gb-text);border-radius:4px;overflow:hidden;background:#000;">
        <canvas id="noiseVis" width="280" height="40" style="width:100%;height:100%;"></canvas>
      </div>
      <div style="padding:0 6px 4px;display:flex;gap:3px;align-items:center;">
        <span style="font-size:5px;">VOL</span>
        <input type="range" min="0" max="100" value="${_noiseVolume * 100}" oninput="setNoiseGenVolume(this.value)" style="flex:1;height:12px;">
      </div>
      <div style="display:flex;gap:3px;padding:0 6px 4px;">
        <button onclick="toggleNoiseGen()" style="flex:1;font-size:6px;padding:6px;${_noisePlaying?'background:#a00;color:#fff;':''}" id="noiseGenPlayBtn">${_noisePlaying ? '■ STOP' : '▶ PLAY'}</button>
      </div>
      <div style="padding:0 6px 4px;flex:1;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:28px;">${NOISE_PRESETS.find(p => p.type === _noiseType)?.icon || '🎵'}</span>
      </div>
      <div style="padding:0 6px 6px;font-size:4px;text-align:center;opacity:0.5;">AMBIENT SOUNDS FOR FOCUS</div>
    </div>
  `;
}

function toggleNoiseGen() {
  if (_noisePlaying) { _noiseGenStop(); return; }
  try {
    const ctx = getCreativeAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const data = _noiseGenBuffer(_noiseType, ctx.sampleRate);
    const buffer = ctx.createBuffer(1, data.length, ctx.sampleRate);
    buffer.getChannelData(0).set(data);
    _noiseSource = ctx.createBufferSource();
    _noiseSource.buffer = buffer;
    _noiseSource.loop = true;
    _noiseGainNode = ctx.createGain();
    _noiseGainNode.gain.value = _noiseVolume;
    _noiseSource.connect(_noiseGainNode).connect(ctx.destination);
    _noiseSource.start();
    _noisePlaying = true;
    renderNoiseUI(document.getElementById('noiseContent'));
    _noiseGenVisLoop();
  } catch(e) { console.warn('NOISE gen failed:', e); }
}

function _noiseGenStop() {
  if (_noiseSource) { try { _noiseSource.stop(); } catch(e){} try { _noiseSource.disconnect(); } catch(e){} _noiseSource = null; }
  if (_noiseGainNode) { try { _noiseGainNode.disconnect(); } catch(e){} _noiseGainNode = null; }
  _noisePlaying = false;
  renderNoiseUI(document.getElementById('noiseContent'));
}

function setNoiseGenType(type) {
  const wasPlaying = _noisePlaying;
  if (wasPlaying) _noiseGenStop();
  _noiseType = type;
  renderNoiseUI(document.getElementById('noiseContent'));
  _noiseCanvas = document.getElementById('noiseVis');
  if (_noiseCanvas) _noiseCtx2d = _noiseCanvas.getContext('2d');
  if (wasPlaying) toggleNoiseGen();
}

function setNoiseGenVolume(v) { _noiseVolume = Number(v) / 100; if (_noiseGainNode) _noiseGainNode.gain.value = _noiseVolume; }

function _noiseGenVisLoop() {
  if (!_noisePlaying || !_noiseCtx2d || !_noiseCanvas) return;
  const w = _noiseCanvas.width, h = _noiseCanvas.height;
  const img = _noiseCtx2d.createImageData(w, h);
  const d = _noiseGenBuffer(_noiseType, 8000);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v = Math.abs(d[(x + y * 137) % d.length]) * 255;
      const idx = (y * w + x) * 4;
      img.data[idx] = v; img.data[idx + 1] = v; img.data[idx + 2] = v; img.data[idx + 3] = 255;
    }
  }
  _noiseCtx2d.putImageData(img, 0, 0);
  requestAnimationFrame(_noiseGenVisLoop);
}

// ================================================================
//  MAZE — Procedural Dungeon Crawler (D-pad / Arrow Keys)
// ================================================================
let _mazeGrid = [], _mazeW = 0, _mazeH = 0;
let _mazePlayer = {x:1,y:1};
let _mazeEnemies = [], _mazeFog = [];
let _mazeLevel = 1, _mazeHP = 5, _mazeMaxHP = 5;
let _mazeKeys = 0, _mazeScore = 0, _mazeRunning = false;
let _mazeKeyHandler = null;
const MAZE_CELL = { WALL: 0, FLOOR: 1, DOOR: 2, KEY: 3, POTION: 4, EXIT: 5, ENEMY: 6, COIN: 7 };
const MAZE_SYMBOLS = { 0:'██', 1:'  ', 2:'▒▒', 3:'⚷', 4:'♥', 5:'▶', 6:'☠', 7:'●' };
const MAZE_COLORS = { 0:'#555', 1:'#111', 2:'#886633', 3:'#ff0', 4:'#f44', 5:'#0f0', 6:'#f00', 7:'#ff0' };

function initMaze() {
  const container = document.getElementById('mazeContent');
  if (!container) return;
  _mazeGenerate();
  _mazeRunning = true;
  renderMazeUI(container);
  // Wire physical D-pad via arrow key events
  _mazeKeyHandler = (e) => {
    if (currentScreen !== 'maze') return;
    if (e.key === 'ArrowUp')    { mazeMove(0, -1); e.preventDefault(); }
    if (e.key === 'ArrowDown')  { mazeMove(0,  1); e.preventDefault(); }
    if (e.key === 'ArrowLeft')  { mazeMove(-1, 0); e.preventDefault(); }
    if (e.key === 'ArrowRight') { mazeMove( 1, 0); e.preventDefault(); }
  };
  document.addEventListener('keydown', _mazeKeyHandler);
}

function _mazeCleanup() {
  if (_mazeKeyHandler) {
    document.removeEventListener('keydown', _mazeKeyHandler);
    _mazeKeyHandler = null;
  }
}

function _mazeGenerate() {
  _mazeW = 21; _mazeH = 15;
  _mazeGrid = Array.from({length:_mazeH}, () => Array(_mazeW).fill(0));
  _mazeEnemies = []; _mazeFog = Array.from({length:_mazeH}, () => Array(_mazeW).fill(false));

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
      for (let x = rx; x < rx + rw; x++) _mazeGrid[y][x] = MAZE_CELL.FLOOR;
  }

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

  if (rooms.length > 0) {
    _mazePlayer = { x: Math.floor(rooms[0].x + rooms[0].w/2), y: Math.floor(rooms[0].y + rooms[0].h/2) };
  }
  if (rooms.length > 1) {
    const last = rooms[rooms.length - 1];
    _mazeGrid[Math.floor(last.y + last.h/2)][Math.floor(last.x + last.w/2)] = MAZE_CELL.EXIT;
  }
  for (let i = 1; i < rooms.length - 1; i++) {
    const r = rooms[i];
    const cx2 = Math.floor(r.x + r.w/2), cy2 = Math.floor(r.y + r.h/2);
    if (Math.random() < 0.4) _mazeGrid[cy2][cx2] = MAZE_CELL.KEY;
    else if (Math.random() < 0.3) _mazeGrid[cy2][cx2] = MAZE_CELL.POTION;
    else if (Math.random() < 0.5) _mazeGrid[cy2][cx2] = MAZE_CELL.COIN;
    if (Math.random() < 0.3 + _mazeLevel * 0.05) {
      const ex = r.x + 1 + Math.floor(Math.random() * (r.w - 2));
      const ey = r.y + 1 + Math.floor(Math.random() * (r.h - 2));
      if (_mazeGrid[ey][ex] === MAZE_CELL.FLOOR) {
        _mazeEnemies.push({x:ex, y:ey, hp: 1 + Math.floor(_mazeLevel/2)});
      }
    }
  }
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
        const enemy = _mazeEnemies.find(e => e.x === x && e.y === y);
        if (enemy) { ch = MAZE_SYMBOLS[6]; clr = MAZE_COLORS[6]; }
        else { ch = MAZE_SYMBOLS[cell] || '  '; clr = MAZE_COLORS[cell] || '#111'; }
      }
      gridHTML += `<span style="display:inline-block;width:${cellW}px;height:${cellW}px;line-height:${cellW}px;text-align:center;font-size:${Math.max(cellW-4,5)}px;color:${clr};background:${visible?'rgba(0,0,0,0.3)':'#050'};font-family:monospace;">${ch}</span>`;
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
      <div style="padding:0 6px 4px;font-size:4px;text-align:center;opacity:0.4;">USE D-PAD OR ARROW KEYS TO MOVE</div>
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

  _mazePlayer.x = nx; _mazePlayer.y = ny;
  _mazeReveal(nx, ny, 3);

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

  const enemyIdx = _mazeEnemies.findIndex(e => e.x === nx && e.y === ny);
  if (enemyIdx >= 0) {
    _mazeEnemies.splice(enemyIdx, 1);
    _mazeHP--; _mazeScore += 25;
    if (window.sounds) sounds.hit();
    if (_mazeHP <= 0) { _mazeRunning = false; _mazeGameOver(); }
  }

  _mazeEnemies.forEach(e => {
    const dirs = [[0,-1],[0,1],[-1,0],[1,0]];
    const d = dirs[Math.floor(Math.random() * 4)];
    const enx = e.x + d[0], eny = e.y + d[1];
    if (enx >= 0 && enx < _mazeW && eny >= 0 && eny < _mazeH && _mazeGrid[eny][enx] !== MAZE_CELL.WALL) {
      e.x = enx; e.y = eny;
    }
    if (e.x === _mazePlayer.x && e.y === _mazePlayer.y) {
      _mazeHP--;
      if (window.sounds) sounds.hit();
      if (_mazeHP <= 0) { _mazeRunning = false; _mazeGameOver(); }
    }
  });

  renderMazeUI(document.getElementById('mazeContent'));
}

function _mazeGameOver() {
  _mazeCleanup();
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
  _mazeCleanup();
  _mazeLevel = 1; _mazeHP = 5; _mazeKeys = 0; _mazeScore = 0; _mazeRunning = true;
  _mazeGenerate();
  renderMazeUI(document.getElementById('mazeContent'));
  // Re-bind D-pad
  _mazeKeyHandler = (e) => {
    if (currentScreen !== 'maze') return;
    if (e.key === 'ArrowUp')    { mazeMove(0, -1); e.preventDefault(); }
    if (e.key === 'ArrowDown')  { mazeMove(0,  1); e.preventDefault(); }
    if (e.key === 'ArrowLeft')  { mazeMove(-1, 0); e.preventDefault(); }
    if (e.key === 'ArrowRight') { mazeMove( 1, 0); e.preventDefault(); }
  };
  document.addEventListener('keydown', _mazeKeyHandler);
}

// ================================================================
//  GRAVITY — Physics Sandbox (tap to drop, real physics)
// ================================================================
let _gravCanvas, _gravCtx, _gravAnim;
let _gravBalls = [], _gravGhosts = [];
let _gravMode = 'drop'; // drop | fountain | attract
let _gravRunning = false;
let _gravTime = 0, _gravFrameCount = 0, _gravFPS = 0;
const GRAVITY = 0.15, BOUNCE = 0.75, FRICTION = 0.999;
const BALL_COLORS = ['#ff6b6b','#4ecdc4','#45b7d1','#f9ca24','#a29bfe','#fd79a8','#00cec9','#fab1a0'];

function initGravity() {
  const container = document.getElementById('gravityContent');
  if (!container) return;
  renderGravUI(container);
  _gravCanvas = document.getElementById('gravCanvas');
  if (!_gravCanvas) return;
  _gravCtx = _gravCanvas.getContext('2d');
  _gravBalls = [];
  _gravRunning = true;
  _gravTime = 0;

  const resize = () => {
    const r = _gravCanvas.parentElement.getBoundingClientRect();
    _gravCanvas.width = Math.floor(r.width);
    _gravCanvas.height = Math.floor(r.height);
  };
  resize();
  window.addEventListener('resize', resize);

  const getPos = (e) => {
    const r = _gravCanvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX - r.left, y: t.clientY - r.top };
  };

  const spawn = (x, y) => {
    if (_gravBalls.length > 300) return;
    const count = _gravMode === 'fountain' ? 3 : 1;
    for (let i = 0; i < count; i++) {
      const speed = _gravMode === 'fountain' ? 3 + Math.random() * 2 : 0;
      const angle = _gravMode === 'fountain' ? -Math.PI / 2 + (Math.random() - 0.5) * 0.6 : Math.random() * Math.PI * 2;
      _gravBalls.push({
        x: x + (Math.random() - 0.5) * 6,
        y: _gravMode === 'fountain' ? _gravCanvas.height - 5 : y,
        vx: Math.cos(angle) * speed + (Math.random() - 0.5),
        vy: Math.sin(angle) * speed,
        r: 3 + Math.random() * 5,
        color: BALL_COLORS[Math.floor(Math.random() * BALL_COLORS.length)],
        life: 1
      });
    }
  };

  let isDown = false;
  _gravCanvas.addEventListener('mousedown', e => { isDown = true; const p = getPos(e); spawn(p.x, p.y); });
  _gravCanvas.addEventListener('mousemove', e => { if (isDown) { const p = getPos(e); spawn(p.x, p.y); } });
  _gravCanvas.addEventListener('mouseup', () => { isDown = false; });
  _gravCanvas.addEventListener('touchstart', e => { e.preventDefault(); isDown = true; const p = getPos(e); spawn(p.x, p.y); }, {passive:false});
  _gravCanvas.addEventListener('touchmove', e => { e.preventDefault(); if (isDown) { const p = getPos(e); spawn(p.x, p.y); } }, {passive:false});
  _gravCanvas.addEventListener('touchend', () => { isDown = false; });

  _gravLoop();
}

function _gravCleanup() {
  _gravRunning = false;
  if (_gravAnim) { cancelAnimationFrame(_gravAnim); _gravAnim = null; }
}

function renderGravUI(container) {
  const modes = [
    { id: 'drop', label: 'DROP', icon: '💧' },
    { id: 'fountain', label: 'FOUNTAIN', icon: '⛲' },
    { id: 'attract', label: 'ATTRACT', icon: '🧲' }
  ];
  container.innerHTML = `
    <div style="display:flex;flex-direction:column;height:100%;box-sizing:border-box;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 6px;">
        <span style="font-size:9px;font-weight:bold;color:var(--gb-text);">🪐 GRAVITY</span>
        <span style="font-size:5px;opacity:0.6;">${_gravBalls.length} BALLS</span>
      </div>
      <div style="display:flex;gap:2px;padding:0 6px 4px;flex-wrap:wrap;">
        ${modes.map(m => `<button onclick="setGravMode('${m.id}')" style="font-size:5px;padding:2px 5px;${_gravMode===m.id?'background:var(--gb-text);color:var(--gb-bg);':''}">${m.icon} ${m.label}</button>`).join('')}
        <button onclick="clearGravBalls()" style="font-size:5px;padding:2px 5px;margin-left:auto;">CLR</button>
      </div>
      <div style="flex:1;position:relative;margin:0 6px 6px;border:2px solid var(--gb-text);border-radius:4px;overflow:hidden;background:#0a0a1a;">
        <canvas id="gravCanvas" style="width:100%;height:100%;display:block;"></canvas>
      </div>
      <div style="padding:0 6px 6px;font-size:4px;text-align:center;opacity:0.5;">TAP TO DROP · ${_gravMode === 'fountain' ? 'FOUNTAIN MODE' : _gravMode === 'attract' ? 'TAP TO ATTRACT' : 'DRAG TO FILL'}</div>
    </div>
  `;
}

function setGravMode(m) {
  _gravMode = m;
  renderGravUI(document.getElementById('gravityContent'));
  // Re-acquire canvas after innerHTML rewrite
  _gravCanvas = document.getElementById('gravCanvas');
  if (_gravCanvas) _gravCtx = _gravCanvas.getContext('2d');
}
function clearGravBalls() {
  _gravBalls = [];
  renderGravUI(document.getElementById('gravityContent'));
  _gravCanvas = document.getElementById('gravCanvas');
  if (_gravCanvas) _gravCtx = _gravCanvas.getContext('2d');
}

function _gravLoop() {
  if (!_gravRunning || !_gravCtx || !_gravCanvas) return;
  const w = _gravCanvas.width, h = _gravCanvas.height;
  _gravTime += 1 / 60;
  _gravFrameCount++;

  // BG
  _gravCtx.fillStyle = 'rgba(10,10,26,0.3)';
  _gravCtx.fillRect(0, 0, w, h);

  // Update physics
  for (let i = _gravBalls.length - 1; i >= 0; i--) {
    const b = _gravBalls[i];

    // Gravity
    b.vy += GRAVITY;

    // Attract mode: pull toward center-ish
    if (_gravMode === 'attract') {
      const cx = w / 2, cy = h / 3;
      const dx = cx - b.x, dy = cy - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy) + 1;
      b.vx += dx / dist * 0.3;
      b.vy += dy / dist * 0.3;
    }

    // Friction
    b.vx *= FRICTION;
    b.vy *= FRICTION;

    // Move
    b.x += b.vx;
    b.y += b.vy;

    // Bounce walls
    if (b.x - b.r < 0) { b.x = b.r; b.vx *= -BOUNCE; }
    if (b.x + b.r > w) { b.x = w - b.r; b.vx *= -BOUNCE; }
    if (b.y + b.r < 0) { b.y = b.r; b.vy *= -BOUNCE; }
    if (b.y + b.r > h) { b.y = h - b.r; b.vy *= -BOUNCE; }

    // Ball-to-ball collision
    for (let j = i + 1; j < _gravBalls.length; j++) {
      const o = _gravBalls[j];
      const dx2 = o.x - b.x, dy2 = o.y - b.y;
      const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
      const minDist = b.r + o.r;
      if (dist2 < minDist && dist2 > 0) {
        const nx = dx2 / dist2, ny = dy2 / dist2;
        const overlap = minDist - dist2;
        b.x -= nx * overlap * 0.5;
        b.y -= ny * overlap * 0.5;
        o.x += nx * overlap * 0.5;
        o.y += ny * overlap * 0.5;
        const dvx = b.vx - o.vx, dvy = b.vy - o.vy;
        const dot = dvx * nx + dvy * ny;
        b.vx -= dot * nx * BOUNCE;
        b.vy -= dot * ny * BOUNCE;
        o.vx += dot * nx * BOUNCE;
        o.vy += dot * ny * BOUNCE;
      }
    }
  }

  // Draw balls with glow
  for (const b of _gravBalls) {
    const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
    const glow = Math.min(speed * 2, 15);

    // Glow
    _gravCtx.shadowColor = b.color;
    _gravCtx.shadowBlur = glow;

    // Ball
    _gravCtx.fillStyle = b.color;
    _gravCtx.beginPath();
    _gravCtx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    _gravCtx.fill();

    // Highlight
    _gravCtx.fillStyle = 'rgba(255,255,255,0.3)';
    _gravCtx.beginPath();
    _gravCtx.arc(b.x - b.r * 0.3, b.y - b.r * 0.3, b.r * 0.3, 0, Math.PI * 2);
    _gravCtx.fill();
  }
  _gravCtx.shadowBlur = 0;

  // FPS counter
  if (_gravFrameCount % 30 === 0) _gravFPS = Math.round(1000 / (performance.now() / _gravFrameCount));

  _gravAnim = requestAnimationFrame(_gravLoop);
}

// ================================================================
//  ORBIT — Gravitational N-Body Simulator
//  Tap to place bodies, watch them orbit, collide, merge.
// ================================================================
let _orbCanvas, _orbCtx, _orbAnim;
let _orbBodies = [], _orbTrails = [];
let _orbRunning = false, _orbPaused = false;
let _orbMode = 'tap'; // tap | preset | chaos
let _orbDragStart = null, _orbDragging = false;
let _orbTime = 0;
const ORB_G = 0.5; // gravitational constant
const ORB_TRAIL_LEN = 40;
const ORB_BODY_COLORS = [
  '#ff6b6b','#feca57','#48dbfb','#ff9ff3','#54a0ff',
  '#5f27cd','#01a3a4','#f368e0','#ff9f43','#10ac84'
];

function initOrbit() {
  const container = document.getElementById('orbitContent');
  if (!container) return;
  renderOrbUI(container);
  _orbCanvas = document.getElementById('orbCanvas');
  if (!_orbCanvas) return;
  _orbCtx = _orbCanvas.getContext('2d');
  _orbBodies = []; _orbTrails = [];
  _orbRunning = true; _orbPaused = false;

  const resize = () => {
    const r = _orbCanvas.parentElement.getBoundingClientRect();
    _orbCanvas.width = Math.floor(r.width);
    _orbCanvas.height = Math.floor(r.height);
  };
  resize();
  window.addEventListener('resize', resize);

  const getPos = (e) => {
    const r = _orbCanvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX - r.left, y: t.clientY - r.top };
  };

  // Tap = place body with no velocity, drag = launch with velocity
  _orbCanvas.addEventListener('mousedown', e => {
    _orbDragStart = getPos(e);
    _orbDragging = true;
  });
  _orbCanvas.addEventListener('mousemove', e => {
    if (!_orbDragging || !_orbDragStart) return;
    // Draw aim line
    const p = getPos(e);
    _orbCtx.strokeStyle = 'rgba(255,255,255,0.3)';
    _orbCtx.setLineDash([4, 4]);
    _orbCtx.beginPath();
    _orbCtx.moveTo(_orbDragStart.x, _orbDragStart.y);
    _orbCtx.lineTo(p.x, p.y);
    _orbCtx.stroke();
    _orbCtx.setLineDash([]);
  });
  _orbCanvas.addEventListener('mouseup', e => {
    if (!_orbDragStart) return;
    const p = getPos(e);
    const dx = p.x - _orbDragStart.x, dy = p.y - _orbDragStart.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    _orbSpawn(_orbDragStart.x, _orbDragStart.y, dist > 5 ? -dx * 0.05 : 0, dist > 5 ? -dy * 0.05 : 0);
    _orbDragStart = null; _orbDragging = false;
  });
  _orbCanvas.addEventListener('touchstart', e => { e.preventDefault(); _orbDragStart = getPos(e); _orbDragging = true; }, {passive:false});
  _orbCanvas.addEventListener('touchmove', e => { e.preventDefault(); }, {passive:false});
  _orbCanvas.addEventListener('touchend', e => {
    if (!_orbDragStart) return;
    // Use last known drag start as position, no velocity (tap)
    _orbSpawn(_orbDragStart.x, _orbDragStart.y, 0, 0);
    _orbDragStart = null; _orbDragging = false;
  });

  _orbLoop();
}

function _orbCleanup() {
  _orbRunning = false;
  if (_orbAnim) { cancelAnimationFrame(_orbAnim); _orbAnim = null; }
}

function _orbSpawn(x, y, vx, vy) {
  if (_orbBodies.length > 60) return;
  const mass = 2 + Math.random() * 8;
  const radius = Math.sqrt(mass) * 1.5;
  const color = ORB_BODY_COLORS[Math.floor(Math.random() * ORB_BODY_COLORS.length)];
  _orbBodies.push({ x, y, vx, vy, mass, radius, color, trail: [] });
}

function _orbSpawnPreset() {
  _orbBodies = [];
  const cx = (_orbCanvas ? _orbCanvas.width : 200) / 2;
  const cy = (_orbCanvas ? _orbCanvas.height : 200) / 2;

  // Central star
  _orbBodies.push({ x: cx, y: cy, vx: 0, vy: 0, mass: 50, radius: 12, color: '#feca57', trail: [] });

  // Planets with orbital velocity
  const orbits = [
    { dist: 40, mass: 4,  color: '#48dbfb' },
    { dist: 65, mass: 6,  color: '#ff9ff3' },
    { dist: 95, mass: 3,  color: '#54a0ff' },
    { dist: 125, mass: 8, color: '#ff6b6b' }
  ];
  for (const o of orbits) {
    const speed = Math.sqrt(ORB_G * 50 / o.dist);
    const angle = Math.random() * Math.PI * 2;
    _orbBodies.push({
      x: cx + Math.cos(angle) * o.dist,
      y: cy + Math.sin(angle) * o.dist,
      vx: -Math.sin(angle) * speed,
      vy: Math.cos(angle) * speed,
      mass: o.mass,
      radius: Math.sqrt(o.mass) * 1.5,
      color: o.color,
      trail: []
    });
  }
}

function _orbSpawnChaos() {
  _orbBodies = [];
  const w = _orbCanvas ? _orbCanvas.width : 200;
  const h = _orbCanvas ? _orbCanvas.height : 200;
  for (let i = 0; i < 15; i++) {
    const mass = 2 + Math.random() * 10;
    _orbBodies.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      mass,
      radius: Math.sqrt(mass) * 1.5,
      color: ORB_BODY_COLORS[i % ORB_BODY_COLORS.length],
      trail: []
    });
  }
}

function renderOrbUI(container) {
  container.innerHTML = `
    <div style="display:flex;flex-direction:column;height:100%;box-sizing:border-box;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 6px;">
        <span style="font-size:9px;font-weight:bold;color:var(--gb-text);">🌍 ORBIT</span>
        <span style="font-size:5px;opacity:0.6;">${_orbBodies.length} BODIES</span>
      </div>
      <div style="display:flex;gap:2px;padding:0 6px 4px;flex-wrap:wrap;">
        <button onclick="orbSetMode('tap')" style="font-size:5px;padding:2px 5px;${_orbMode==='tap'?'background:var(--gb-text);color:var(--gb-bg);':''}">☝ TAP</button>
        <button onclick="orbSetMode('preset')" style="font-size:5px;padding:2px 5px;${_orbMode==='preset'?'background:var(--gb-text);color:var(--gb-bg);':''}">☀ SOLAR</button>
        <button onclick="orbSetMode('chaos')" style="font-size:5px;padding:2px 5px;${_orbMode==='chaos'?'background:var(--gb-text);color:var(--gb-bg);':''}">💥 CHAOS</button>
        <button onclick="orbClear()" style="font-size:5px;padding:2px 5px;margin-left:auto;">CLR</button>
        <button onclick="orbTogglePause()" style="font-size:5px;padding:2px 5px;">${_orbPaused ? '▶' : '⏸'}</button>
      </div>
      <div style="flex:1;position:relative;margin:0 6px 6px;border:2px solid var(--gb-text);border-radius:4px;overflow:hidden;background:#05051a;">
        <canvas id="orbCanvas" style="width:100%;height:100%;display:block;"></canvas>
      </div>
      <div style="padding:0 6px 6px;font-size:4px;text-align:center;opacity:0.5;">TAP TO PLACE · DRAG TO LAUNCH · WATCH ORBITS</div>
    </div>
  `;
}

function orbSetMode(m) {
  _orbMode = m;
  if (m === 'preset') _orbSpawnPreset();
  else if (m === 'chaos') _orbSpawnChaos();
  renderOrbUI(document.getElementById('orbitContent'));
  _orbCanvas = document.getElementById('orbCanvas');
  if (_orbCanvas) _orbCtx = _orbCanvas.getContext('2d');
}
function orbClear() {
  _orbBodies = [];
  renderOrbUI(document.getElementById('orbitContent'));
  _orbCanvas = document.getElementById('orbCanvas');
  if (_orbCanvas) _orbCtx = _orbCanvas.getContext('2d');
}
function orbTogglePause() { _orbPaused = !_orbPaused; renderOrbUI(document.getElementById('orbitContent')); }

function _orbLoop() {
  if (!_orbRunning || !_orbCtx || !_orbCanvas) return;
  const w = _orbCanvas.width, h = _orbCanvas.height;
  _orbTime += 1 / 60;

  if (!_orbPaused) {
    // Physics: gravity between all pairs
    for (let i = 0; i < _orbBodies.length; i++) {
      for (let j = i + 1; j < _orbBodies.length; j++) {
        const a = _orbBodies[i], b = _orbBodies[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const distSq = dx * dx + dy * dy + 100; // softening
        const dist = Math.sqrt(distSq);
        const force = ORB_G * a.mass * b.mass / distSq;
        const fx = force * dx / dist, fy = force * dy / dist;
        a.vx += fx / a.mass;
        a.vy += fy / a.mass;
        b.vx -= fx / b.mass;
        b.vy -= fy / b.mass;

        // Collision: merge
        if (dist < a.radius + b.radius) {
          const totalMass = a.mass + b.mass;
          a.vx = (a.vx * a.mass + b.vx * b.mass) / totalMass;
          a.vy = (a.vy * a.mass + b.vy * b.mass) / totalMass;
          a.mass = totalMass;
          a.radius = Math.sqrt(totalMass) * 1.5;
          _orbBodies.splice(j, 1);
          j--;
        }
      }
    }

    // Move + trail
    for (const b of _orbBodies) {
      b.x += b.vx;
      b.y += b.vy;
      b.trail.push({ x: b.x, y: b.y });
      if (b.trail.length > ORB_TRAIL_LEN) b.trail.shift();

      // Wrap edges
      if (b.x < -50) b.x = w + 50;
      if (b.x > w + 50) b.x = -50;
      if (b.y < -50) b.y = h + 50;
      if (b.y > h + 50) b.y = -50;
    }
  }

  // Clear
  _orbCtx.fillStyle = 'rgba(5,5,26,0.2)';
  _orbCtx.fillRect(0, 0, w, h);

  // Draw trails
  for (const b of _orbBodies) {
    if (b.trail.length < 2) continue;
    for (let i = 1; i < b.trail.length; i++) {
      const alpha = i / b.trail.length;
      _orbCtx.strokeStyle = b.color.replace(')', `,${alpha * 0.5})`).replace('rgb', 'rgba');
      if (!b.color.startsWith('rgb')) _orbCtx.strokeStyle = b.color;
      _orbCtx.globalAlpha = alpha * 0.4;
      _orbCtx.lineWidth = 1;
      _orbCtx.beginPath();
      _orbCtx.moveTo(b.trail[i - 1].x, b.trail[i - 1].y);
      _orbCtx.lineTo(b.trail[i].x, b.trail[i].y);
      _orbCtx.stroke();
    }
    _orbCtx.globalAlpha = 1;
  }

  // Draw bodies with glow
  for (const b of _orbBodies) {
    const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
    _orbCtx.shadowColor = b.color;
    _orbCtx.shadowBlur = Math.min(speed * 3, 20);

    // Glow ring
    _orbCtx.strokeStyle = b.color;
    _orbCtx.globalAlpha = 0.15;
    _orbCtx.beginPath();
    _orbCtx.arc(b.x, b.y, b.radius + 3, 0, Math.PI * 2);
    _orbCtx.stroke();
    _orbCtx.globalAlpha = 1;

    // Body
    _orbCtx.fillStyle = b.color;
    _orbCtx.beginPath();
    _orbCtx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    _orbCtx.fill();

    // Highlight
    _orbCtx.fillStyle = 'rgba(255,255,255,0.25)';
    _orbCtx.beginPath();
    _orbCtx.arc(b.x - b.radius * 0.3, b.y - b.radius * 0.3, b.radius * 0.3, 0, Math.PI * 2);
    _orbCtx.fill();
  }
  _orbCtx.shadowBlur = 0;

  _orbAnim = requestAnimationFrame(_orbLoop);
}

// ================================================================
//  SAND — Falling Sand Cellular Automata
//  Paint elements, watch them fall, flow, burn, grow.
//  Totally different physics from ball sims — grid-based sim.
// ================================================================
let _sandCanvas, _sandCtx, _sandAnim;
let _sandGrid, _sandW, _sandH, _sandCellSize;
let _sandRunning = false;
let _sandElement = 'sand';
let _sandBrush = 3;
let _sandPointerDown = false;
let _sandLastPos = null;
let _sandFrame = 0;

const CELL = { EMPTY: 0, SAND: 1, WATER: 2, FIRE: 3, PLANT: 4, STONE: 5, SMOKE: 6, OIL: 7 };
const CELL_COLORS = {
  [CELL.EMPTY]: null,
  [CELL.SAND]: ['#e8c170','#d4a853','#c49b45','#deb968'],
  [CELL.WATER]: ['#4a90d9','#3b7ac4','#5ba0e6','#2e6ab3'],
  [CELL.FIRE]:  ['#ff4422','#ff6633','#ff8844','#ffaa22'],
  [CELL.PLANT]: ['#2d8a4e','#3a9e5c','#1f7a3d','#45b068'],
  [CELL.STONE]: ['#777','#888','#666','#999'],
  [CELL.SMOKE]: ['#555','#666','#777','#888'],
  [CELL.OIL]:   ['#8b4513','#7a3c10','#6b330d','#9c5016']
};

const SAND_ELEMENTS = [
  { id: 'sand',  label: 'SAND',  icon: '🏖' },
  { id: 'water', label: 'WATER', icon: '💧' },
  { id: 'fire',  label: 'FIRE',  icon: '🔥' },
  { id: 'plant', label: 'PLANT', icon: '🌿' },
  { id: 'stone', label: 'STONE', icon: '🪨' },
  { id: 'oil',   label: 'OIL',   icon: '🛢' },
  { id: 'smoke', label: 'SMOKE', icon: '💨' },
  { id: 'erase', label: 'ERASE', icon: '⬜' }
];

function _sandCellId(el) {
  return CELL[el.toUpperCase()] ?? CELL.EMPTY;
}

function initSand() {
  const container = document.getElementById('sandContent');
  if (!container) return;
  renderSandUI(container);
  _sandCanvas = document.getElementById('sandCanvas');
  if (!_sandCanvas) return;
  _sandCtx = _sandCanvas.getContext('2d');
  _sandRunning = true;
  _sandFrame = 0;

  const resize = () => {
    const r = _sandCanvas.parentElement.getBoundingClientRect();
    _sandCanvas.width = Math.floor(r.width);
    _sandCanvas.height = Math.floor(r.height);
    _sandCellSize = 4;
    _sandW = Math.floor(_sandCanvas.width / _sandCellSize);
    _sandH = Math.floor(_sandCanvas.height / _sandCellSize);
    _sandGrid = new Uint8Array(_sandW * _sandH);
    _sandColorIdx = new Uint8Array(_sandW * _sandH);
  };
  resize();
  window.addEventListener('resize', resize);

  const getPos = (e) => {
    const r = _sandCanvas.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return {
      gx: Math.floor((t.clientX - r.left) / _sandCellSize),
      gy: Math.floor((t.clientY - r.top) / _sandCellSize)
    };
  };

  const paint = (gx, gy) => {
    const id = _sandCellId(_sandElement);
    const rad = _sandBrush;
    for (let dy = -rad; dy <= rad; dy++) {
      for (let dx = -rad; dx <= rad; dx++) {
        if (dx * dx + dy * dy > rad * rad + 1) continue;
        const nx = gx + dx, ny = gy + dy;
        if (nx < 0 || nx >= _sandW || ny < 0 || ny >= _sandH) continue;
        const idx = ny * _sandW + nx;
        if (id === CELL.EMPTY) {
          _sandGrid[idx] = CELL.EMPTY;
        } else if (_sandGrid[idx] === CELL.EMPTY) {
          _sandGrid[idx] = id;
          _sandColorIdx[idx] = Math.floor(Math.random() * 4);
        }
      }
    }
  };

  const linePaint = (x0, y0, x1, y1) => {
    const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    while (true) {
      paint(x0, y0);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x0 += sx; }
      if (e2 < dx) { err += dx; y0 += sy; }
    }
  };

  _sandCanvas.addEventListener('mousedown', e => { _sandPointerDown = true; const p = getPos(e); paint(p.gx, p.gy); _sandLastPos = p; });
  _sandCanvas.addEventListener('mousemove', e => { if (!_sandPointerDown) return; const p = getPos(e); if (_sandLastPos) linePaint(_sandLastPos.gx, _sandLastPos.gy, p.gx, p.gy); _sandLastPos = p; });
  _sandCanvas.addEventListener('mouseup', () => { _sandPointerDown = false; _sandLastPos = null; });
  _sandCanvas.addEventListener('touchstart', e => { e.preventDefault(); _sandPointerDown = true; const p = getPos(e); paint(p.gx, p.gy); _sandLastPos = p; }, {passive:false});
  _sandCanvas.addEventListener('touchmove', e => { e.preventDefault(); if (!_sandPointerDown) return; const p = getPos(e); if (_sandLastPos) linePaint(_sandLastPos.gx, _sandLastPos.gy, p.gx, p.gy); _sandLastPos = p; }, {passive:false});
  _sandCanvas.addEventListener('touchend', () => { _sandPointerDown = false; _sandLastPos = null; });

  _sandLoop();
}

function _sandCleanup() {
  _sandRunning = false;
  if (_sandAnim) { cancelAnimationFrame(_sandAnim); _sandAnim = null; }
}

function renderSandUI(container) {
  container.innerHTML = `
    <div style="display:flex;flex-direction:column;height:100%;box-sizing:border-box;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 6px;">
        <span style="font-size:9px;font-weight:bold;color:var(--gb-text);">🏖 SAND</span>
        <span style="font-size:5px;opacity:0.6;">${_sandElement.toUpperCase()}</span>
      </div>
      <div style="display:flex;gap:2px;padding:0 6px 4px;flex-wrap:wrap;">
        ${SAND_ELEMENTS.map(e => `<button onclick="sandSetElement('${e.id}')" style="font-size:5px;padding:2px 5px;${_sandElement===e.id?'background:var(--gb-text);color:var(--gb-bg);':''}">${e.icon}</button>`).join('')}
      </div>
      <div style="padding:0 6px 4px;display:flex;gap:4px;align-items:center;">
        <span style="font-size:4px;">SIZE</span>
        <input type="range" min="1" max="8" value="${_sandBrush}" oninput="sandSetBrush(this.value)" style="flex:1;height:10px;">
        <span style="font-size:4px;">${_sandBrush}</span>
      </div>
      <div style="flex:1;position:relative;margin:0 6px 6px;border:2px solid var(--gb-text);border-radius:4px;overflow:hidden;background:#1a1a2e;">
        <canvas id="sandCanvas" style="width:100%;height:100%;display:block;"></canvas>
      </div>
      <div style="padding:0 6px 6px;font-size:4px;text-align:center;opacity:0.5;">PAINT TO CREATE · WATCH IT FLOW</div>
    </div>
  `;
}

function sandSetElement(el) {
  _sandElement = el;
  // Just update button highlights and label — don't recreate the canvas
  const label = document.querySelector('#sandContent span[style*="font-size:5px"]');
  if (label) label.textContent = el.toUpperCase();
  document.querySelectorAll('#sandContent button').forEach(b => {
    const isActive = b.textContent.includes(SAND_ELEMENTS.find(e => e.id === el)?.icon || '');
    b.style.background = isActive ? 'var(--gb-text)' : '';
    b.style.color = isActive ? 'var(--gb-bg)' : '';
  });
}
function sandSetBrush(v) { _sandBrush = Number(v); }

function _sandLoop() {
  if (!_sandRunning || !_sandCtx || !_sandCanvas || !_sandGrid) return;
  _sandFrame++;

  // Update grid (bottom-up so falling works correctly)
  const totalCells = _sandW * _sandH;
  for (let y = _sandH - 1; y >= 0; y--) {
    // Alternate left-right scan each frame to prevent bias
    const leftToRight = (_sandFrame % 2 === 0);
    for (let xi = 0; xi < _sandW; xi++) {
      const x = leftToRight ? xi : _sandW - 1 - xi;
      const idx = y * _sandW + x;
      const cell = _sandGrid[idx];
      if (cell === CELL.EMPTY || cell === CELL.STONE) continue;

      const below = y + 1 < _sandH ? _sandGrid[(y + 1) * _sandW + x] : CELL.STONE;
      const belowL = (y + 1 < _sandH && x - 1 >= 0) ? _sandGrid[(y + 1) * _sandW + x - 1] : CELL.STONE;
      const belowR = (y + 1 < _sandH && x + 1 < _sandW) ? _sandGrid[(y + 1) * _sandW + x + 1] : CELL.STONE;
      const above = y - 1 >= 0 ? _sandGrid[(y - 1) * _sandW + x] : CELL.STONE;
      const left = x - 1 >= 0 ? _sandGrid[y * _sandW + x - 1] : CELL.STONE;
      const right = x + 1 < _sandW ? _sandGrid[y * _sandW + x + 1] : CELL.STONE;

      const isEmpty = (c) => c === CELL.EMPTY;
      const isLiquid = (c) => c === CELL.WATER || c === CELL.OIL;
      const swap = (a, b) => { _sandGrid[a] = _sandGrid[b]; _sandGrid[b] = CELL.EMPTY; _sandColorIdx[a] = _sandColorIdx[b]; };

      switch (cell) {
        case CELL.SAND:
          if (isEmpty(below)) { swap(idx, (y + 1) * _sandW + x); }
          else if (isEmpty(belowL) && Math.random() < 0.5) { swap(idx, (y + 1) * _sandW + x - 1); }
          else if (isEmpty(belowR)) { swap(idx, (y + 1) * _sandW + x + 1); }
          else if (isLiquid(below)) { swap(idx, (y + 1) * _sandW + x); }
          else if (isLiquid(belowL) && Math.random() < 0.5) { swap(idx, (y + 1) * _sandW + x - 1); }
          else if (isLiquid(belowR)) { swap(idx, (y + 1) * _sandW + x + 1); }
          break;

        case CELL.WATER:
        case CELL.OIL:
          if (isEmpty(below)) { swap(idx, (y + 1) * _sandW + x); }
          else if (isEmpty(belowL) && Math.random() < 0.5) { swap(idx, (y + 1) * _sandW + x - 1); }
          else if (isEmpty(belowR)) { swap(idx, (y + 1) * _sandW + x + 1); }
          else if (isEmpty(left) && Math.random() < 0.4) { swap(idx, y * _sandW + x - 1); }
          else if (isEmpty(right)) { swap(idx, y * _sandW + x + 1); }
          break;

        case CELL.FIRE:
          _sandColorIdx[idx] = Math.floor(Math.random() * 4);
          if (Math.random() < 0.03) { _sandGrid[idx] = CELL.SMOKE; _sandColorIdx[idx] = Math.floor(Math.random() * 4); break; }
          if (Math.random() < 0.01) { _sandGrid[idx] = CELL.EMPTY; break; }
          // Rise up with some horizontal drift
          if (Math.random() < 0.6 && isEmpty(above)) {
            swap(idx, (y - 1) * _sandW + x);
          } else if (Math.random() < 0.4) {
            const nx = x + (Math.random() < 0.5 ? -1 : 1);
            if (nx >= 0 && nx < _sandW && y - 1 >= 0 && isEmpty((y - 1) * _sandW + nx))
              swap(idx, (y - 1) * _sandW + nx);
            else if (isEmpty(above)) swap(idx, (y - 1) * _sandW + x);
          }
          // Burn adjacent cells
          [[y-1,x],[y+1,x],[y,x-1],[y,x+1]].forEach(([ny,nx]) => {
            if (ny >= 0 && ny < _sandH && nx >= 0 && nx < _sandW) {
              const ni = ny * _sandW + nx;
              if (_sandGrid[ni] === CELL.PLANT && Math.random() < 0.2) { _sandGrid[ni] = CELL.FIRE; _sandColorIdx[ni] = Math.floor(Math.random() * 4); }
              if (_sandGrid[ni] === CELL.OIL && Math.random() < 0.15) { _sandGrid[ni] = CELL.FIRE; _sandColorIdx[ni] = Math.floor(Math.random() * 4); }
              if (_sandGrid[ni] === CELL.WATER && Math.random() < 0.3) { _sandGrid[ni] = CELL.SMOKE; _sandColorIdx[ni] = Math.floor(Math.random() * 4); }
            }
          });
          break;

        case CELL.PLANT:
          if (Math.random() < 0.005 && isEmpty(above)) { _sandGrid[(y - 1) * _sandW + x] = CELL.PLANT; _sandColorIdx[(y - 1) * _sandW + x] = Math.floor(Math.random() * 4); }
          break;

        case CELL.SMOKE:
          if (Math.random() < 0.08) { _sandGrid[idx] = CELL.EMPTY; break; }
          if (Math.random() < 0.1) {
            const nx = x + (Math.random() < 0.5 ? -1 : 1);
            if (nx >= 0 && nx < _sandW && isEmpty((y - 1) * _sandW + nx))
              swap(idx, (y - 1) * _sandW + nx);
          } else if (isEmpty(above)) { swap(idx, (y - 1) * _sandW + x); }
          break;
      }
    }
  }

  // Draw — use pre-parsed color lookup for speed
  const W = _sandCanvas.width, H = _sandCanvas.height;
  const img = _sandCtx.createImageData(W, H);
  const d = img.data;
  const cs = _sandCellSize;

  // Pre-parse colors to RGB arrays
  const colorCache = {};
  for (const [cellId, hexArr] of Object.entries(CELL_COLORS)) {
    if (!hexArr) continue;
    colorCache[cellId] = hexArr.map(hex => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return [r, g, b];
    });
  }

  for (let gy = 0; gy < _sandH; gy++) {
    for (let gx = 0; gx < _sandW; gx++) {
      const cell = _sandGrid[gy * _sandW + gx];
      if (cell === CELL.EMPTY) continue;
      const rgb = colorCache[cell]?.[_sandColorIdx[gy * _sandW + gx] % 4];
      if (!rgb) continue;
      const [cr, cg, cb] = rgb;

      const x0 = gx * cs, y0 = gy * cs;
      const x1 = Math.min(x0 + cs, W), y1 = Math.min(y0 + cs, H);
      for (let py = y0; py < y1; py++) {
        const rowOff = py * W;
        for (let px = x0; px < x1; px++) {
          const pi = (rowOff + px) << 2;
          d[pi] = cr; d[pi + 1] = cg; d[pi + 2] = cb; d[pi + 3] = 255;
        }
      }
    }
  }

  _sandCtx.putImageData(img, 0, 0);
  _sandAnim = requestAnimationFrame(_sandLoop);
}
