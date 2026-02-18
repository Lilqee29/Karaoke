// ========================================================
//  BEAT BOY v4.0 — Real Samples + Tone.js Synths
//  Drum samples: tonejs.github.io/audio/drum-samples/
//  Piano lead:   tonejs.github.io/audio/salamander/
// ========================================================

const BB_SAMPLE_BASE = 'https://tonejs.github.io/audio/drum-samples/';
const BB_PIANO_BASE  = 'https://tonejs.github.io/audio/salamander/';

// All drum kits available from the Tone.js CDN
const BB_KITS = {
  'CR-78':  'CR78',
  'LINN':   'LINN',
  'R-8':    'R8',
  'STARK':  'Stark',
};

// 8 tracks: 5 sampled drums + 3 synth melodic
const INSTRUMENTS = [
  { name: 'KICK',   color: '#ff3333', emoji: '🥁', type: 'sample', file: 'kick'  },
  { name: 'SNARE',  color: '#ffb700', emoji: '🪘', type: 'sample', file: 'snare' },
  { name: 'HI-HAT', color: '#00ccff', emoji: '🎩', type: 'sample', file: 'hihat' },
  { name: 'TOM 1',  color: '#ff8800', emoji: '🟠', type: 'sample', file: 'tom1'  },
  { name: 'TOM 2',  color: '#ffdd00', emoji: '🟡', type: 'sample', file: 'tom2'  },
  { name: 'BASS',   color: '#00ff88', emoji: '🎸', type: 'synth'                 },
  { name: 'LEAD',   color: '#aa88ff', emoji: '🎹', type: 'piano'                 },
  { name: 'CHORD',  color: '#ff66cc', emoji: '🎵', type: 'chord'                 },
];

// ── State ─────────────────────────────────────────────────
let remixGrid      = [];
let remixInterval  = null;
let remixStep      = 0;
let isRemixPlaying = false;
let remixBPM       = 120;
let remixMasterVol = 0.8;
let trackVols      = INSTRUMENTS.map(() => 80);
let currentKit     = 'CR78';
let vizAnimFrame   = null;
let audioReady     = false;

// Tone.js nodes
let bbMasterVol   = null;
let bbTrackGains  = [];
let bbDrumPlayers = null;
let bbBassSynth   = null;
let bbPiano       = null;
let bbChordSynth  = null;
let bbAnalyser    = null;

// Melodic sequences
const BASS_NOTES  = ['C2','C2','G2','A2','F2','E2','D2','C2'];
const LEAD_NOTES  = ['C4','E4','G4','B4','A4','F4','D4','E4'];
const CHORD_NOTES = [
  ['C3','E3','G3'], ['A2','C3','E3'], ['F2','A2','C3'], ['G2','B2','D3'],
  ['C3','E3','G3'], ['D2','F2','A2'], ['E2','G2','B2'], ['C3','G3','E3'],
];

// ── Preset Patterns ───────────────────────────────────────
const PRESETS = {
  'TRAP': [
    [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
    [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
    [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,0],
    [0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,0,0],
    [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
    [1,0,0,0, 0,0,0,1, 0,0,0,0, 1,0,0,0],
    [0,0,1,0, 0,0,0,0, 0,0,1,0, 0,1,0,0],
    [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
  ],
  'HOUSE': [
    [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
    [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
    [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
    [0,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
    [0,0,0,0, 0,0,1,0, 0,0,0,0, 0,1,0,0],
    [1,0,0,1, 0,0,1,0, 1,0,0,0, 0,1,0,0],
    [0,1,0,0, 0,1,0,0, 0,1,0,0, 0,1,0,1],
    [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
  ],
  'BOOM BAP': [
    [1,0,0,0, 0,0,1,0, 0,1,0,0, 0,0,0,0],
    [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1],
    [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
    [0,0,1,0, 0,0,0,0, 0,1,0,0, 0,0,0,1],
    [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,1,0],
    [1,0,0,0, 1,0,0,0, 0,0,1,0, 0,0,0,0],
    [0,0,0,1, 0,1,0,0, 0,0,0,1, 0,0,1,0],
    [1,0,0,0, 0,0,0,0, 0,1,0,0, 0,0,0,0],
  ],
  'TECHNO': [
    [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
    [0,0,0,0, 1,0,0,1, 0,0,0,0, 1,0,1,0],
    [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1],
    [0,0,0,0, 0,1,0,0, 0,0,0,0, 0,1,0,1],
    [0,0,1,0, 0,0,0,0, 0,1,0,0, 0,0,0,0],
    [1,1,0,0, 0,0,1,0, 1,0,0,1, 0,0,1,0],
    [0,0,0,0, 1,0,0,1, 0,0,0,0, 1,0,0,0],
    [0,0,0,0, 0,0,0,0, 0,0,0,0, 1,0,0,0],
  ],
};

// ── Audio Init ────────────────────────────────────────────

async function bbInitAudio() {
  if (audioReady) return;
  await Tone.start();

  bbMasterVol = new Tone.Volume(Tone.gainToDb(remixMasterVol)).toDestination();
  bbAnalyser  = new Tone.Analyser('waveform', 128);
  bbMasterVol.connect(bbAnalyser);

  // Per-track gain nodes — one per instrument
  bbTrackGains = INSTRUMENTS.map(() => {
    const g = new Tone.Volume(0);
    g.connect(bbMasterVol);
    return g;
  });

  // Bass synth (square wave → low-pass filter)
  bbBassSynth = new Tone.Synth({
    oscillator: { type: 'square' },
    envelope:   { attack: 0.005, decay: 0.3, sustain: 0.2, release: 0.1 },
    volume: -4,
  }).connect(new Tone.Filter(500, 'lowpass').connect(bbTrackGains[5]));

  // Chord poly synth (warm triangle)
  bbChordSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope:   { attack: 0.02, decay: 0.5, sustain: 0.1, release: 0.6 },
    volume: -12,
  }).connect(new Tone.Reverb({ decay: 2, wet: 0.35 }).connect(bbTrackGains[7]));

  // Salamander piano sampler for lead
  bbPiano = new Tone.Sampler({
    urls: {
      C4: 'C4.mp3', 'D#4': 'Ds4.mp3', 'F#4': 'Fs4.mp3', A4: 'A4.mp3',
      C5: 'C5.mp3', 'D#5': 'Ds5.mp3', 'F#5': 'Fs5.mp3', A5: 'A5.mp3',
    },
    release: 1.2,
    baseUrl: BB_PIANO_BASE,
  }).connect(new Tone.Reverb({ decay: 1.5, wet: 0.2 }).connect(bbTrackGains[6]));

  // Load drum samples
  await bbLoadKit(currentKit);

  audioReady = true;
  bbSetStatus('');
}

async function bbLoadKit(kitFolder) {
  bbSetStatus(`⟳ Loading ${kitFolder}…`);

  if (bbDrumPlayers) {
    try { bbDrumPlayers.dispose(); } catch(e) {}
    bbDrumPlayers = null;
  }

  const base = `${BB_SAMPLE_BASE}${kitFolder}/`;

  bbDrumPlayers = new Tone.Players(
    {
      kick:  `${base}kick.mp3`,
      snare: `${base}snare.mp3`,
      hihat: `${base}hihat.mp3`,
      tom1:  `${base}tom1.mp3`,
      tom2:  `${base}tom2.mp3`,
    },
    {
      onerror: (e) => console.warn('Sample error:', e),
    }
  );

  // Wait for samples (max 5s)
  await Promise.race([Tone.loaded(), new Promise(r => setTimeout(r, 5000))]);

  // Wire each drum output to its track gain
  ['kick','snare','hihat','tom1','tom2'].forEach((name, i) => {
    try { bbDrumPlayers.player(name).connect(bbTrackGains[i]); } catch(e) {}
  });

  bbSetStatus('');
}

function bbSetStatus(msg) {
  const el = document.getElementById('bbLoadStatus');
  if (!el) return;
  el.textContent = msg;
  el.style.display = msg ? 'flex' : 'none';
}

// ── Sound Trigger ─────────────────────────────────────────

function bbTrigger(r, step) {
  const vol = (trackVols[r] ?? 80) / 100;
  if (vol === 0 || !bbTrackGains[r]) return;
  bbTrackGains[r].volume.value = Tone.gainToDb(vol);

  const now = Tone.now();

  if (r <= 4) {
    // Sampled drums
    const names = ['kick','snare','hihat','tom1','tom2'];
    const name  = names[r];
    if (!bbDrumPlayers) return;
    try {
      const p = bbDrumPlayers.player(name);
      if (p.loaded) { p.stop(now); p.start(now); }
    } catch(e) { console.warn('Drum trigger:', name, e); }

  } else if (r === 5 && bbBassSynth) {
    bbBassSynth.triggerAttackRelease(BASS_NOTES[step % 8], '8n', now);

  } else if (r === 6 && bbPiano?.loaded) {
    bbPiano.triggerAttackRelease(LEAD_NOTES[step % 8], '8n', now);

  } else if (r === 7 && bbChordSynth) {
    bbChordSynth.triggerAttackRelease(CHORD_NOTES[step % 8], '4n', now);
  }
}

// ── Grid Init ─────────────────────────────────────────────

window.initRemix = async function() {
  const gridEl = document.getElementById('remixGrid');
  if (!gridEl) return;

  bbSetStatus('⟳ Starting audio…');
  try { await bbInitAudio(); } catch(e) { console.error(e); }

  gridEl.innerHTML = '';
  remixGrid      = [];
  trackVols      = INSTRUMENTS.map(() => 80);
  isRemixPlaying = false;
  remixStep      = 0;
  if (remixInterval) clearInterval(remixInterval);

  const bpmEl = document.getElementById('remixBpmDisplay');
  if (bpmEl) bpmEl.textContent = `${remixBPM} BPM`;

  INSTRUMENTS.forEach((inst, r) => {
    const rowData  = new Array(16).fill(false);
    const trackDiv = document.createElement('div');
    trackDiv.className = 'beat-boy-track';

    trackDiv.innerHTML = `
      <div class="beat-boy-track-header">
        <span style="color:${inst.color}">${inst.emoji} ${inst.name}</span>
        <div class="track-vol-row">
          <input type="range" class="track-vol-slider" min="0" max="100" value="80"
            oninput="updateTrackVol(${r}, this.value)">
          <span id="track-vol-${r}" class="track-vol-label">80</span>
        </div>
      </div>
      <div class="beat-boy-steps" id="track-${r}"></div>
    `;

    const stepsEl = trackDiv.querySelector('.beat-boy-steps');
    for (let c = 0; c < 16; c++) {
      const step = document.createElement('div');
      step.className = 'beat-boy-step';
      if (c > 0 && c % 4 === 0) step.classList.add('beat-group-start');
      step.dataset.r = r;
      step.dataset.c = c;
      step.onclick = async function() {
        if (!audioReady) { bbSetStatus('⟳ Loading…'); await bbInitAudio(); }
        rowData[c] = !rowData[c];
        this.classList.toggle('active');
        if (rowData[c]) bbTrigger(r, c);
        if (typeof sounds !== 'undefined') sounds.click?.();
      };
      stepsEl.appendChild(step);
    }

    gridEl.appendChild(trackDiv);
    remixGrid.push(rowData);
  });

  bbInitViz();
};

// ── Transport Controls ────────────────────────────────────

window.toggleRemixPlay = async function() {
  if (!audioReady) { bbSetStatus('⟳ Loading…'); await bbInitAudio(); }
  const btn = document.getElementById('remixPlayBtn');

  if (isRemixPlaying) {
    clearInterval(remixInterval);
    cancelAnimationFrame(vizAnimFrame);
    if (btn) { btn.textContent = '▶ PLAY'; btn.style.background = '#0f0'; btn.style.color = '#000'; }
    document.querySelectorAll('.beat-boy-step').forEach(s => s.classList.remove('highlight'));
  } else {
    remixInterval = setInterval(bbPlayStep, (60000 / remixBPM) / 4);
    if (btn) { btn.textContent = '⏹ STOP'; btn.style.background = '#f00'; btn.style.color = '#fff'; }
    bbDrawViz();
  }
  isRemixPlaying = !isRemixPlaying;
};

window.changeBPM = function(delta) {
  remixBPM = Math.min(240, Math.max(40, remixBPM + delta));
  const el = document.getElementById('remixBpmDisplay');
  if (el) el.textContent = `${remixBPM} BPM`;
  if (isRemixPlaying) {
    clearInterval(remixInterval);
    remixInterval = setInterval(bbPlayStep, (60000 / remixBPM) / 4);
  }
  if (typeof sounds !== 'undefined') sounds.click?.();
};

window.updateRemixVol = function(val) {
  remixMasterVol = val / 100;
  if (bbMasterVol) bbMasterVol.volume.value = Tone.gainToDb(remixMasterVol);
  const el = document.getElementById('remixVolLabel');
  if (el) el.textContent = `${val}%`;
};

window.updateTrackVol = function(r, val) {
  trackVols[r] = parseInt(val);
  const el = document.getElementById(`track-vol-${r}`);
  if (el) el.textContent = val;
};

function bbPlayStep() {
  const ind = document.getElementById('remixStepIndicator');
  if (ind) ind.textContent = `STEP ${remixStep + 1}`;

  document.querySelectorAll('.beat-boy-step').forEach(s => {
    s.classList.toggle('highlight', parseInt(s.dataset.c) === remixStep);
  });

  for (let r = 0; r < INSTRUMENTS.length; r++) {
    if (remixGrid[r]?.[remixStep]) bbTrigger(r, remixStep);
  }

  remixStep = (remixStep + 1) % 16;
}

// ── Kit Switch ────────────────────────────────────────────

window.switchKit = async function(kitFolder) {
  if (!audioReady) await bbInitAudio();
  currentKit = kitFolder;
  await bbLoadKit(kitFolder);
  document.querySelectorAll('.bb-kit-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.kit === kitFolder);
  });
  if (typeof sounds !== 'undefined') sounds.click?.();
};

// ── Preset Load ───────────────────────────────────────────

window.loadPreset = function(name) {
  const pattern = PRESETS[name];
  if (!pattern) return;
  document.querySelectorAll('.beat-boy-step').forEach(s => s.classList.remove('active'));
  pattern.forEach((row, r) => {
    if (!remixGrid[r]) return;
    row.forEach((val, c) => {
      remixGrid[r][c] = !!val;
      if (val) {
        document.querySelector(`.beat-boy-step[data-r="${r}"][data-c="${c}"]`)?.classList.add('active');
      }
    });
  });
  document.querySelectorAll('.bb-preset-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.preset === name);
  });
  if (typeof sounds !== 'undefined') sounds.click?.();
};

// ── Clear ─────────────────────────────────────────────────

window.clearRemix = function() {
  document.querySelectorAll('.beat-boy-step').forEach(s => s.classList.remove('active'));
  remixGrid.forEach(row => row.fill(false));
  document.querySelectorAll('.bb-preset-btn, .bb-kit-btn').forEach(b => b.classList.remove('active'));
  if (typeof sounds !== 'undefined') sounds.back?.();
};

// ── Visualizer ────────────────────────────────────────────

function bbInitViz() {
  const canvas = document.getElementById('beatVizCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function bbDrawViz() {
  const canvas = document.getElementById('beatVizCanvas');
  if (!canvas || !bbAnalyser) return;
  const ctx = canvas.getContext('2d');
  const W   = canvas.width;
  const H   = canvas.height;

  const draw = () => {
    vizAnimFrame = requestAnimationFrame(draw);
    const data = bbAnalyser.getValue();

    // Trail effect
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 0, W, H);

    const bw = W / data.length;
    data.forEach((v, i) => {
      const amp = Math.abs(v);
      const h   = amp * H * 0.9;
      const hue = 110 + (i / data.length) * 160; // green → teal → blue
      ctx.fillStyle = `hsl(${hue},100%,${35 + amp * 45}%)`;
      ctx.fillRect(i * bw, H / 2 - h / 2, bw - 1, h);
    });
  };

  draw();
}