// ========================================================
//  BEAT BOY v5.0 — Full Production Suite
//  Drum samples: tonejs.github.io/audio/drum-samples/
//  Piano lead:   tonejs.github.io/audio/salamander/
//  Features: 10 kits, save/load, swing, effects, MIDI/keys
// ========================================================

const BB_SAMPLE_BASE = 'https://tonejs.github.io/audio/drum-samples/';
const BB_PIANO_BASE  = 'https://tonejs.github.io/audio/salamander/';

// ── Drum Kits (10 from Tone.js CDN) ──────────────────────
const BB_KITS = {
  'CR-78':    'CR78',
  'LINN':     'LINN',
  'R-8':      'R8',
  'STARK':    'Stark',
  'TECHNO':   'Techno',
  'KPR-77':   'KPR77',
  'KIT3':     'Kit3',
  'KIT8':     'Kit8',
  'ACOUSTIC': 'acoustic-kit',
  '4OP-FM':   '4OP-FM',
};

// 8 tracks: 5 sampled drums + 3 synth melodic
const INSTRUMENTS = [
  { name: 'KICK',   color: '#ff3333', emoji: '🥁', type: 'sample', file: 'kick',  key: 'Q' },
  { name: 'SNARE',  color: '#ffb700', emoji: '🪘', type: 'sample', file: 'snare', key: 'W' },
  { name: 'HI-HAT', color: '#00ccff', emoji: '🎩', type: 'sample', file: 'hihat', key: 'E' },
  { name: 'TOM 1',  color: '#ff8800', emoji: '🟠', type: 'sample', file: 'tom1',  key: 'R' },
  { name: 'TOM 2',  color: '#ffdd00', emoji: '🟡', type: 'sample', file: 'tom2',  key: 'T' },
  { name: 'BASS',   color: '#00ff88', emoji: '🎸', type: 'synth',  key: 'A' },
  { name: 'LEAD',   color: '#aa88ff', emoji: '🎹', type: 'piano',  key: 'S' },
  { name: 'CHORD',  color: '#ff66cc', emoji: '🎵', type: 'chord',  key: 'D' },
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
let trackSamples   = INSTRUMENTS.map(() => null); // custom sample per track (overrides kit)

// Dynamic sample rows (added from browser)
let dynamicRows    = [];  // [{name, color, type, url/synth, grid:[], vol:80, player: null}]
const DYNAMIC_COLORS = ['#ff4488','#44ff88','#4488ff','#ffff44','#ff88ff','#88ffff','#ff8844','#88ff44'];

// Swing (0–100%) — delays odd 16th notes
let remixSwing     = 0;
// Note division: '16n' (default), '8n', '32n'
let remixDivision  = '16n';

// ── Sample Library (free, CDN-hosted + Web Audio synthesized) ──
const BB_SAMPLE_LIB = {
  '🔊 DRUMS': {
    '808 Kick':     { url: 'https://tonejs.github.io/audio/drum-samples/CR78/kick.mp3',    type: 'sample' },
    '808 Snare':    { url: 'https://tonejs.github.io/audio/drum-samples/CR78/snare.mp3',   type: 'sample' },
    '808 HiHat':    { url: 'https://tonejs.github.io/audio/drum-samples/CR78/hihat.mp3',   type: 'sample' },
    'Linn Kick':    { url: 'https://tonejs.github.io/audio/drum-samples/LINN/kick.mp3',    type: 'sample' },
    'Linn Snare':   { url: 'https://tonejs.github.io/audio/drum-samples/LINN/snare.mp3',   type: 'sample' },
    'Linn HiHat':   { url: 'https://tonejs.github.io/audio/drum-samples/LINN/hihat.mp3',   type: 'sample' },
    'Techno Kick':  { url: 'https://tonejs.github.io/audio/drum-samples/Techno/kick.mp3',  type: 'sample' },
    'Techno Snare': { url: 'https://tonejs.github.io/audio/drum-samples/Techno/snare.mp3', type: 'sample' },
    'Acoustic Kick':{ url: 'https://tonejs.github.io/audio/drum-samples/acoustic-kit/kick.mp3',  type: 'sample' },
    'Acoustic Snare':{url: 'https://tonejs.github.io/audio/drum-samples/acoustic-kit/snare.mp3', type: 'sample' },
    'FM Kick':      { url: 'https://tonejs.github.io/audio/drum-samples/4OP-FM/kick.mp3',  type: 'sample' },
    'FM Snare':     { url: 'https://tonejs.github.io/audio/drum-samples/4OP-FM/snare.mp3', type: 'sample' },
    'FM HiHat':     { url: 'https://tonejs.github.io/audio/drum-samples/4OP-FM/hihat.mp3', type: 'sample' },
    'KPR Kick':     { url: 'https://tonejs.github.io/audio/drum-samples/KPR77/kick.mp3',   type: 'sample' },
    'KPR Snare':    { url: 'https://tonejs.github.io/audio/drum-samples/KPR77/snare.mp3',  type: 'sample' },
  },
  '🎵 PERCUSSION': {
    'Cowbell':      { url: 'https://tonejs.github.io/audio/drum-samples/CR78/cowbell.mp3',  type: 'sample' },
    'Rimshot':      { url: 'https://tonejs.github.io/audio/drum-samples/CR78/rimshot.mp3',  type: 'sample' },
    'Clap':         { url: 'https://tonejs.github.io/audio/drum-samples/LINN/clap.mp3',     type: 'sample' },
    'Tambourine':   { url: 'https://tonejs.github.io/audio/drum-samples/LINN/tambourine.mp3', type: 'sample' },
    'Conga':        { url: 'https://tonejs.github.io/audio/drum-samples/LINN/conga.mp3',    type: 'sample' },
    'Maracas':      { url: 'https://tonejs.github.io/audio/drum-samples/LINN/maracas.mp3',  type: 'sample' },
    'Guiro':        { url: 'https://tonejs.github.io/audio/drum-samples/LINN/guiro.mp3',    type: 'sample' },
    'Agogo':        { url: 'https://tonejs.github.io/audio/drum-samples/LINN/agogo.mp3',    type: 'sample' },
    'Cuica':        { url: 'https://tonejs.github.io/audio/drum-samples/LINN/cuica.mp3',    type: 'sample' },
    'Cabasa':       { url: 'https://tonejs.github.io/audio/drum-samples/LINN/cabasa.mp3',   type: 'sample' },
  },
  '🎤 VOICES': {
    'Hey':          { synth: 'hey',      type: 'synth' },
    'Yeah':         { synth: 'yeah',     type: 'synth' },
    'Oh':           { synth: 'oh',       type: 'synth' },
    'Uh':           { synth: 'uh',       type: 'synth' },
    'Yo':           { synth: 'yo',       type: 'synth' },
    'Woah':         { synth: 'woah',     type: 'synth' },
    'Ha':           { synth: 'ha',       type: 'synth' },
    'Chant':        { synth: 'chant',    type: 'synth' },
  },
  '✨ FX': {
    'Riser Up':     { synth: 'riser',    type: 'synth' },
    'Zap Down':     { synth: 'zap',      type: 'synth' },
    'Laser':        { synth: 'laser',    type: 'synth' },
    'Impact':       { synth: 'impact',   type: 'synth' },
    'Sweep':        { synth: 'sweep',    type: 'synth' },
    'Noise Burst':  { synth: 'noise',    type: 'synth' },
    'Crash':        { synth: 'crash',    type: 'synth' },
    'Reverse':      { synth: 'reverse',  type: 'synth' },
  },
  '🎹 SYNTHS': {
    '808 Bass':     { synth: 'bass808',  type: 'synth' },
    'Synth Stab':   { synth: 'stab',     type: 'synth' },
    'Pad Hit':      { synth: 'pad',      type: 'synth' },
    'Pluck':        { synth: 'pluck',    type: 'synth' },
    'Bell':         { synth: 'bell',     type: 'synth' },
    'Organ':        { synth: 'organ',    type: 'synth' },
    'Brass':        { synth: 'brass',    type: 'synth' },
    'Strings':      { synth: 'strings',  type: 'synth' },
  },
};

// Tone.js nodes
let bbMasterVol   = null;
let bbTrackGains  = [];
let bbDrumPlayers = null;
let bbBassSynth   = null;
let bbPiano       = null;
let bbChordSynth  = null;
let bbAnalyser    = null;

// Effects rack nodes
let bbDelay       = null;
let bbDelayGain   = null;
let bbFilter      = null;
let bbReverb      = null;
let bbReverbGain  = null;
let bbCompressor  = null;

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
  'REGGAE': [
    [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
    [0,0,0,1, 0,0,0,0, 0,0,0,1, 0,0,0,0],
    [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
    [0,0,0,0, 0,0,0,0, 0,1,0,0, 0,0,0,0],
    [1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,1,0],
    [0,0,1,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
    [1,0,0,0, 0,0,1,0, 0,0,0,0, 1,0,0,0],
    [0,0,0,0, 0,1,0,0, 0,0,0,0, 0,0,0,0],
  ],
  'FUNK': [
    [1,0,0,0, 0,0,0,0, 1,0,1,0, 0,0,0,0],
    [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
    [0,0,1,0, 0,1,1,0, 0,0,1,0, 0,1,1,0],
    [0,0,0,0, 0,0,0,0, 0,1,0,0, 0,0,0,0],
    [0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,0,1],
    [1,0,0,1, 0,0,0,0, 1,0,0,0, 0,1,0,0],
    [0,0,1,0, 0,0,0,0, 0,0,1,0, 0,0,0,1],
    [1,0,0,0, 0,0,1,0, 0,0,0,0, 0,1,0,0],
  ],
  'HIP HOP': [
    [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0],
    [0,0,0,0, 1,0,0,0, 0,0,0,1, 0,0,0,0],
    [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
    [0,0,0,0, 0,0,0,0, 0,0,1,0, 0,0,0,0],
    [0,1,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1],
    [1,0,0,0, 0,0,1,0, 0,0,0,0, 1,0,0,0],
    [0,0,0,1, 0,0,0,0, 0,1,0,0, 0,0,1,0],
    [1,0,0,0, 0,0,0,0, 0,1,0,0, 0,0,0,0],
  ],
};

// ── Audio Init ────────────────────────────────────────────

async function bbInitAudio() {
  if (audioReady) return;

  if (!window.Tone) {
    bbSetStatus('⏳ Loading Tone.js...');
    // Wait briefly for Tone.js
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 100));
      if (window.Tone) break;
    }
    if (!window.Tone) {
      bbSetStatus('⚠ Tone.js failed to load — reload page');
      return;
    }
  }

  try {
    await Tone.start();
  } catch(e) {
    bbSetStatus('⚠ Audio blocked by browser — tap anywhere first');
    return;
  }
  console.log('Tone.js started, context:', Tone.context.state);

  // ── Effects chain (parallel dry/wet) ────────────────────
  // Master → Compressor → Analyser → Destination
  bbCompressor = new Tone.Compressor({ threshold: -20, ratio: 4, attack: 0.003, release: 0.25 });
  bbAnalyser   = new Tone.Analyser('waveform', 128);
  bbMasterVol  = new Tone.Volume(Tone.gainToDb(remixMasterVol));
  bbMasterVol.chain(bbCompressor, bbAnalyser, Tone.Destination);

  // Delay effect: input → delay → delayGain → compressor
  bbDelay     = new Tone.FeedbackDelay({ delayTime: '8n', feedback: 0.3, wet: 1 });
  bbDelayGain = new Tone.Gain(0);
  bbDelay.connect(bbDelayGain);
  bbDelayGain.connect(bbCompressor);

  // Reverb effect: input → reverb → reverbGain → compressor
  bbReverb     = new Tone.Reverb({ decay: 2.5, wet: 1 });
  bbReverbGain = new Tone.Gain(0);
  bbReverb.connect(bbReverbGain);
  bbReverbGain.connect(bbCompressor);

  // Low-pass filter (master): input → filter → compressor
  bbFilter = new Tone.Filter({ frequency: 20000, type: 'lowpass', rolloff: -12 });
  bbFilter.connect(bbCompressor);

  // Per-track gain nodes → master (dry) + send to effects
  bbTrackGains = INSTRUMENTS.map(() => {
    const g = new Tone.Volume(0);
    g.connect(bbMasterVol);        // dry path
    g.connect(bbDelay);            // → delay send
    g.connect(bbReverb);           // → reverb send
    g.connect(bbFilter);           // → filter send
    return g;
  });

  // Bass synth
  bbBassSynth = new Tone.Synth({
    oscillator: { type: 'square' },
    envelope:   { attack: 0.005, decay: 0.3, sustain: 0.2, release: 0.1 },
    volume: -4,
  }).connect(new Tone.Filter(500, 'lowpass').connect(bbTrackGains[5]));

  // Chord poly synth
  bbChordSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope:   { attack: 0.02, decay: 0.5, sustain: 0.1, release: 0.6 },
    volume: -12,
  }).connect(new Tone.Reverb({ decay: 2, wet: 0.35 }).connect(bbTrackGains[7]));

  // Salamander piano sampler
  bbPiano = new Tone.Sampler({
    urls: {
      C4: 'C4.mp3', 'D#4': 'Ds4.mp3', 'F#4': 'Fs4.mp3', A4: 'A4.mp3',
      C5: 'C5.mp3', 'D#5': 'Ds5.mp3', 'F#5': 'Fs5.mp3', A5: 'A5.mp3',
    },
    release: 1.2,
    baseUrl: BB_PIANO_BASE,
  }).connect(new Tone.Reverb({ decay: 1.5, wet: 0.2 }).connect(bbTrackGains[6]));

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

  await Promise.race([Tone.loaded(), new Promise(r => setTimeout(r, 5000))]);

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

// Synthesized sounds (voices, FX, synths)
function bbPlaySynthSound(name) {
  if (!audioReady) return;
  const now = Tone.now();
  const ctx = Tone.context;

  switch(name) {
    // ── VOICES (formant synthesis) ──
    case 'hey': {
      const o1 = ctx.createOscillator(); const g = ctx.createGain();
      o1.type = 'sawtooth'; o1.frequency.setValueAtTime(180, now);
      o1.frequency.linearRampToValueAtTime(220, now + 0.08);
      o1.frequency.linearRampToValueAtTime(160, now + 0.15);
      g.gain.setValueAtTime(0.3, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      o1.connect(g); g.connect(bbTrackGains[0]);
      o1.start(now); o1.stop(now + 0.2);
      break;
    }
    case 'yeah': {
      const o1 = ctx.createOscillator(); const g = ctx.createGain();
      o1.type = 'sawtooth'; o1.frequency.setValueAtTime(200, now);
      o1.frequency.linearRampToValueAtTime(280, now + 0.1);
      o1.frequency.linearRampToValueAtTime(200, now + 0.25);
      g.gain.setValueAtTime(0.25, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      o1.connect(g); g.connect(bbTrackGains[0]);
      o1.start(now); o1.stop(now + 0.3);
      break;
    }
    case 'oh': {
      const o1 = ctx.createOscillator(); const g = ctx.createGain();
      o1.type = 'sine'; o1.frequency.setValueAtTime(250, now);
      o1.frequency.linearRampToValueAtTime(180, now + 0.2);
      g.gain.setValueAtTime(0.3, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      o1.connect(g); g.connect(bbTrackGains[0]);
      o1.start(now); o1.stop(now + 0.25);
      break;
    }
    case 'uh': {
      const o1 = ctx.createOscillator(); const g = ctx.createGain();
      o1.type = 'square'; o1.frequency.setValueAtTime(150, now);
      o1.frequency.linearRampToValueAtTime(120, now + 0.08);
      g.gain.setValueAtTime(0.2, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      o1.connect(g); g.connect(bbTrackGains[0]);
      o1.start(now); o1.stop(now + 0.1);
      break;
    }
    case 'yo': {
      const o1 = ctx.createOscillator(); const g = ctx.createGain();
      o1.type = 'sawtooth'; o1.frequency.setValueAtTime(160, now);
      o1.frequency.linearRampToValueAtTime(300, now + 0.06);
      o1.frequency.linearRampToValueAtTime(180, now + 0.15);
      g.gain.setValueAtTime(0.25, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      o1.connect(g); g.connect(bbTrackGains[0]);
      o1.start(now); o1.stop(now + 0.2);
      break;
    }
    case 'woah': {
      const o1 = ctx.createOscillator(); const o2 = ctx.createOscillator();
      const g = ctx.createGain();
      o1.type = 'sawtooth'; o1.frequency.setValueAtTime(200, now);
      o1.frequency.linearRampToValueAtTime(250, now + 0.15);
      o1.frequency.linearRampToValueAtTime(150, now + 0.35);
      o2.type = 'sine'; o2.frequency.setValueAtTime(202, now);
      g.gain.setValueAtTime(0.2, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      o1.connect(g); o2.connect(g); g.connect(bbTrackGains[0]);
      o1.start(now); o2.start(now); o1.stop(now + 0.4); o2.stop(now + 0.4);
      break;
    }
    case 'ha': {
      const o1 = ctx.createOscillator(); const g = ctx.createGain();
      o1.type = 'sawtooth'; o1.frequency.setValueAtTime(250, now);
      o1.frequency.linearRampToValueAtTime(180, now + 0.1);
      g.gain.setValueAtTime(0.3, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      o1.connect(g); g.connect(bbTrackGains[0]);
      o1.start(now); o1.stop(now + 0.12);
      break;
    }
    case 'chant': {
      for (let i = 0; i < 3; i++) {
        const o1 = ctx.createOscillator(); const g = ctx.createGain();
        o1.type = 'sawtooth'; o1.frequency.setValueAtTime(180 + i * 10, now + i * 0.06);
        g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.15, now + i * 0.06);
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        o1.connect(g); g.connect(bbTrackGains[0]);
        o1.start(now + i * 0.06); o1.stop(now + 0.3);
      }
      break;
    }

    // ── FX ──
    case 'riser': {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(100, now);
      o.frequency.exponentialRampToValueAtTime(2000, now + 0.5);
      g.gain.setValueAtTime(0.2, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      o.connect(g); g.connect(bbTrackGains[0]);
      o.start(now); o.stop(now + 0.5);
      break;
    }
    case 'zap': {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'square'; o.frequency.setValueAtTime(1500, now);
      o.frequency.exponentialRampToValueAtTime(50, now + 0.15);
      g.gain.setValueAtTime(0.3, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      o.connect(g); g.connect(bbTrackGains[0]);
      o.start(now); o.stop(now + 0.15);
      break;
    }
    case 'laser': {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(3000, now);
      o.frequency.exponentialRampToValueAtTime(100, now + 0.1);
      g.gain.setValueAtTime(0.3, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      o.connect(g); g.connect(bbTrackGains[0]);
      o.start(now); o.stop(now + 0.12);
      break;
    }
    case 'impact': {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(100, now);
      o.frequency.exponentialRampToValueAtTime(30, now + 0.3);
      g.gain.setValueAtTime(0.5, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      o.connect(g); g.connect(bbTrackGains[0]);
      o.start(now); o.stop(now + 0.4);
      break;
    }
    case 'sweep': {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(200, now);
      f.type = 'lowpass'; f.frequency.setValueAtTime(100, now);
      f.frequency.exponentialRampToValueAtTime(8000, now + 0.3);
      f.frequency.exponentialRampToValueAtTime(100, now + 0.6);
      g.gain.setValueAtTime(0.2, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      o.connect(f); f.connect(g); g.connect(bbTrackGains[0]);
      o.start(now); o.stop(now + 0.6);
      break;
    }
    case 'noise': {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);
      const src = ctx.createBufferSource(); const g = ctx.createGain();
      src.buffer = buf;
      g.gain.setValueAtTime(0.3, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      src.connect(g); g.connect(bbTrackGains[0]);
      src.start(now);
      break;
    }
    case 'crash': {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.15));
      const src = ctx.createBufferSource(); const g = ctx.createGain();
      const f = ctx.createBiquadFilter();
      src.buffer = buf; f.type = 'highpass'; f.frequency.value = 3000;
      g.gain.setValueAtTime(0.3, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      src.connect(f); f.connect(g); g.connect(bbTrackGains[0]);
      src.start(now);
      break;
    }
    case 'reverse': {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(i / data.length, 2);
      const src = ctx.createBufferSource(); const g = ctx.createGain();
      src.buffer = buf;
      g.gain.setValueAtTime(0.01, now); g.gain.linearRampToValueAtTime(0.3, now + 0.25);
      g.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      src.connect(g); g.connect(bbTrackGains[0]);
      src.start(now);
      break;
    }

    // ── SYNTHS ──
    case 'bass808': {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(150, now);
      o.frequency.exponentialRampToValueAtTime(40, now + 0.15);
      g.gain.setValueAtTime(0.4, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      o.connect(g); g.connect(bbTrackGains[0]);
      o.start(now); o.stop(now + 0.3);
      break;
    }
    case 'stab': {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'square'; o.frequency.setValueAtTime(440, now);
      g.gain.setValueAtTime(0.2, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      o.connect(g); g.connect(bbTrackGains[0]);
      o.start(now); o.stop(now + 0.08);
      break;
    }
    case 'pad': {
      const o = ctx.createOscillator(); const o2 = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = 330;
      o2.type = 'sine'; o2.frequency.value = 415;
      g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.15, now + 0.1);
      g.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      o.connect(g); o2.connect(g); g.connect(bbTrackGains[0]);
      o.start(now); o2.start(now); o.stop(now + 0.5); o2.stop(now + 0.5);
      break;
    }
    case 'pluck': {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = 440;
      g.gain.setValueAtTime(0.3, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      o.connect(g); g.connect(bbTrackGains[0]);
      o.start(now); o.stop(now + 0.15);
      break;
    }
    case 'bell': {
      const o = ctx.createOscillator(); const o2 = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = 880;
      o2.type = 'sine'; o2.frequency.value = 1320;
      g.gain.setValueAtTime(0.2, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      o.connect(g); o2.connect(g); g.connect(bbTrackGains[0]);
      o.start(now); o2.start(now); o.stop(now + 0.6); o2.stop(now + 0.6);
      break;
    }
    case 'organ': {
      [262, 330, 392, 523].forEach((freq, i) => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = freq;
        g.gain.setValueAtTime(0.08, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        o.connect(g); g.connect(bbTrackGains[0]);
        o.start(now); o.stop(now + 0.3);
      });
      break;
    }
    case 'brass': {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(350, now);
      o.frequency.linearRampToValueAtTime(330, now + 0.05);
      g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.25, now + 0.03);
      g.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      o.connect(g); g.connect(bbTrackGains[0]);
      o.start(now); o.stop(now + 0.2);
      break;
    }
    case 'strings': {
      [262, 330, 392].forEach(freq => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = 'sawtooth'; o.frequency.value = freq;
        g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.06, now + 0.15);
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        o.connect(g); g.connect(bbTrackGains[0]);
        o.start(now); o.stop(now + 0.5);
      });
      break;
    }
  }
}

// ── Sample Browser UI ─────────────────────────────────────
window.toggleSampleBrowser = function() {
  const browser = document.getElementById('bbSampleBrowser');
  if (!browser) return;
  if (browser.style.display === 'none') {
    renderSampleBrowser();
    browser.style.display = 'block';
  } else {
    browser.style.display = 'none';
  }
};

// Add a sample as a NEW row in the sequencer grid
window.bbAddSample = async function(name, data) {
  // Init audio if needed
  if (!audioReady) {
    bbSetStatus('⟳ Loading audio…');
    try { await bbInitAudio(); } catch(e) {
      bbSetStatus('✗ Audio failed — tap play first');
      return;
    }
  }

  const color = DYNAMIC_COLORS[dynamicRows.length % DYNAMIC_COLORS.length];
  const rowData = new Array(16).fill(false);
  const row = { name, color, data, grid: rowData, vol: 80, player: null };
  dynamicRows.push(row);

  // Load sample player if it's a URL sample
  if (data.type === 'sample' && data.url) {
    try {
      const player = new Tone.Player(data.url).connect(bbMasterVol);
      player.volume.value = 0;
      row.player = player;
    } catch(e) {
      console.warn('Dynamic sample load:', e);
    }
  }

  // Add row to grid DOM
  const gridEl = document.getElementById('remixGrid');
  if (!gridEl) return;
  const r = INSTRUMENTS.length + dynamicRows.length - 1;
  const trackDiv = document.createElement('div');
  trackDiv.className = 'beat-boy-track dynamic-track';
  trackDiv.id = `dynamic-track-${dynamicRows.length - 1}`;
  trackDiv.innerHTML = `
    <div class="beat-boy-track-header">
      <span style="color:${color}">📦 ${name}</span>
      <div class="track-vol-row">
        <button onclick="bbRemoveDynamic(${dynamicRows.length - 1})" style="font-size:4px; padding:1px 3px; background:#300; color:#f44; border:1px solid #f44; border-radius:2px; cursor:pointer;">✕</button>
        <input type="range" class="track-vol-slider" min="0" max="100" value="80"
          oninput="bbSetDynamicVol(${dynamicRows.length - 1}, this.value)">
        <span id="dyn-vol-${dynamicRows.length - 1}" class="track-vol-label">80</span>
      </div>
    </div>
    <div class="beat-boy-steps" id="dynamic-steps-${dynamicRows.length - 1}"></div>
  `;

  const stepsEl = trackDiv.querySelector('.beat-boy-steps');
  for (let c = 0; c < 16; c++) {
    const step = document.createElement('div');
    step.className = 'beat-boy-step';
    if (c > 0 && c % 4 === 0) step.classList.add('beat-group-start');
    step.dataset.r = r;
    step.dataset.c = c;
    step.onclick = async function() {
      if (!audioReady) { bbSetStatus('⟳ Loading audio…'); try { await bbInitAudio(); } catch(e) {} }
      rowData[c] = !rowData[c];
      this.classList.toggle('active');
      if (rowData[c] && audioReady) bbTriggerDynamic(dynamicRows.length - 1, c);
    };
    stepsEl.appendChild(step);
  }

  gridEl.appendChild(trackDiv);
  bbSetStatus(`✓ Added: ${name}`);

  // Scroll to new row
  trackDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

window.bbRemoveDynamic = function(idx) {
  const row = dynamicRows[idx];
  if (row?.player) { try { row.player.dispose(); } catch(e) {} }
  dynamicRows.splice(idx, 1);
  const el = document.getElementById(`dynamic-track-${idx}`);
  if (el) el.remove();
};

window.bbSetDynamicVol = function(idx, val) {
  if (dynamicRows[idx]) dynamicRows[idx].vol = parseInt(val);
  const label = document.getElementById(`dyn-vol-${idx}`);
  if (label) label.textContent = val;
};

function bbTriggerDynamic(idx, step) {
  const row = dynamicRows[idx];
  if (!row) return;
  const vol = row.vol / 100;
  if (vol === 0) return;

  const now = Tone.now();
  if (row.data.type === 'sample' && row.player) {
    try {
      row.player.volume.value = Tone.gainToDb(vol);
      if (row.player.loaded) { row.player.stop(now); row.player.start(now); }
    } catch(e) {}
  } else if (row.data.type === 'synth') {
    bbPlaySynthSound(row.data.synth);
  }
}

function renderSampleBrowser() {
  const browser = document.getElementById('bbSampleBrowser');
  if (!browser) return;
  let html = '';
  for (const [category, samples] of Object.entries(BB_SAMPLE_LIB)) {
    html += `<div style="margin-bottom:6px;">`;
    html += `<div style="font-size:5px; color:#0ff; font-weight:bold; margin-bottom:3px; border-bottom:1px solid #222; padding-bottom:2px;">${category}</div>`;
    html += `<div style="display:flex; flex-wrap:wrap; gap:3px;">`;
    for (const [name, data] of Object.entries(samples)) {
      const bgColor = '#111';
      html += `<button onclick="bbPreviewSample('${name}', ${JSON.stringify(data).replace(/"/g, '&quot;')}); event.stopPropagation();" 
        ondblclick="bbAddSample('${name}', ${JSON.stringify(data).replace(/"/g, '&quot;')})"
        style="font-size:4.5px; padding:2px 4px; background:${bgColor}; color:#ccc; border:1px solid #333; border-radius:2px; cursor:pointer;"
        title="Click = preview, Double-click = add to grid">${name} +</button>`;
    }
    html += `</div></div>`;
  }
  html += `<div style="font-size:4px; color:#666; margin-top:4px;">Click to preview • Double-click to add as new row in grid</div>`;
  browser.innerHTML = html;
}

// Preview a sample (for the browser)
window.bbPreviewSample = function(name, data) {
  if (!audioReady) return;
  if (data.type === 'sample' && data.url) {
    try {
      const player = new Tone.Player(data.url).toDestination();
      player.volume.value = -6;
      player.start();
      setTimeout(() => { try { player.dispose(); } catch(e) {} }, 5000);
    } catch(e) { console.warn('Preview error:', e); }
  } else if (data.type === 'synth' && data.synth) {
    bbPlaySynthSound(data.synth);
  }
};

function bbTrigger(r, step) {
  const vol = (trackVols[r] ?? 80) / 100;
  if (vol === 0 || !bbTrackGains[r]) return;
  bbTrackGains[r].volume.value = Tone.gainToDb(vol);

  const now = Tone.now();

  if (r <= 4) {
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

  // Build grid FIRST so user sees it immediately (don't block on audio)
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
          <span class="bb-key-hint">[${inst.key}]</span>
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
        if (!audioReady) { bbSetStatus('⟳ Loading audio…'); try { await bbInitAudio(); } catch(e) {} }
        rowData[c] = !rowData[c];
        this.classList.toggle('active');
        if (rowData[c] && audioReady) bbTrigger(r, c);
        if (typeof sounds !== 'undefined') sounds.click?.();
      };
      stepsEl.appendChild(step);
    }

    gridEl.appendChild(trackDiv);
    remixGrid.push(rowData);
  });

  bbInitViz();
  bbBindKeyboard();

  // Init audio in background (don't block grid render)
  if (!audioReady) {
    bbSetStatus('⟳ Loading audio…');
    bbInitAudio().then(() => bbSetStatus('')).catch(() => bbSetStatus('⚠ Audio will load on first tap'));
  }
};

// ── Transport Controls ────────────────────────────────────

window.toggleRemixPlay = async function() {
  if (!audioReady) {
    bbSetStatus('⟳ Loading audio…');
    try { await bbInitAudio(); } catch(e) { console.error('Beat Boy audio init failed:', e); }
  }
  if (!audioReady) {
    bbSetStatus('⚠ Audio failed — tap again or reload');
    return;
  }
  const btn = document.getElementById('remixPlayBtn');

  if (isRemixPlaying) {
    clearInterval(remixInterval);
    cancelAnimationFrame(vizAnimFrame);
    if (btn) { btn.textContent = '▶ PLAY'; btn.style.background = '#0f0'; btn.style.color = '#000'; }
    document.querySelectorAll('.beat-boy-step').forEach(s => s.classList.remove('highlight'));
  } else {
    remixStep = 0;
    // Use simple setInterval like v4 — reliable, no Tone.js timing dependency
    const ms = (60000 / remixBPM) / 4;
    remixInterval = setInterval(bbPlayStep, ms);
    if (btn) { btn.textContent = '⏹ STOP'; btn.style.background = '#f00'; btn.style.color = '#fff'; }
    bbDrawViz();
  }
  isRemixPlaying = !isRemixPlaying;
};

function bbScheduleStep() {
  // Fallback: called by old code paths, now just uses setInterval
  if (!isRemixPlaying) return;
  bbPlayStep();
}

window.changeBPM = function(delta) {
  remixBPM = Math.min(240, Math.max(40, remixBPM + delta));
  const el = document.getElementById('remixBpmDisplay');
  if (el) el.textContent = `${remixBPM} BPM`;
  if (isRemixPlaying) {
    clearInterval(remixInterval);
    const ms = (60000 / remixBPM) / 4;
    remixInterval = setInterval(bbPlayStep, ms);
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

  // Trigger fixed tracks
  for (let r = 0; r < INSTRUMENTS.length; r++) {
    if (remixGrid[r]?.[remixStep]) bbTrigger(r, remixStep);
  }

  // Trigger dynamic sample rows
  for (let i = 0; i < dynamicRows.length; i++) {
    if (dynamicRows[i].grid[remixStep]) bbTriggerDynamic(i, remixStep);
  }

  remixStep = (remixStep + 1) % 16;
}

// ── Swing ─────────────────────────────────────────────────

window.setSwing = function(val) {
  remixSwing = Math.max(0, Math.min(100, parseInt(val)));
  const el = document.getElementById('swingLabel');
  if (el) el.textContent = `${remixSwing}%`;
  if (typeof sounds !== 'undefined') sounds.click?.();
};

// ── Note Division ─────────────────────────────────────────

window.setDivision = function(div) {
  remixDivision = div;
  document.querySelectorAll('.bb-div-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.div === div);
  });
  if (isRemixPlaying) {
    clearInterval(remixInterval);
    const ms = (60000 / remixBPM) / 4;
    remixInterval = setInterval(bbPlayStep, ms);
  }
  if (typeof sounds !== 'undefined') sounds.click?.();
};

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
  document.querySelectorAll('.bb-preset-btn').forEach(b => b.classList.remove('active'));
  if (typeof sounds !== 'undefined') sounds.back?.();
};

// ── Pattern Save / Load ───────────────────────────────────

const BB_STORAGE_KEY = 'beatboy_patterns';

function bbGetSavedPatterns() {
  try {
    return JSON.parse(localStorage.getItem(BB_STORAGE_KEY)) || {};
  } catch(e) { return {}; }
}

window.bbSavePattern = function() {
  const name = prompt('Name this pattern:');
  if (!name || !name.trim()) return;
  const key = name.trim().toUpperCase();
  const patterns = bbGetSavedPatterns();
  patterns[key] = {
    grid: remixGrid.map(r => r.map(v => v ? 1 : 0)),
    bpm: remixBPM,
    kit: currentKit,
    swing: remixSwing,
    division: remixDivision,
    trackVols: [...trackVols],
    savedAt: Date.now(),
  };
  localStorage.setItem(BB_STORAGE_KEY, JSON.stringify(patterns));
  bbRefreshSavedList();
  if (typeof sounds !== 'undefined') sounds.coin?.();
};

window.bbLoadPattern = function(key) {
  const patterns = bbGetSavedPatterns();
  const p = patterns[key];
  if (!p) return;

  // Restore grid
  document.querySelectorAll('.beat-boy-step').forEach(s => s.classList.remove('active'));
  (p.grid || []).forEach((row, r) => {
    if (!remixGrid[r]) return;
    row.forEach((val, c) => {
      remixGrid[r][c] = !!val;
      if (val) {
        document.querySelector(`.beat-boy-step[data-r="${r}"][data-c="${c}"]`)?.classList.add('active');
      }
    });
  });

  // Restore settings
  if (p.bpm) { remixBPM = p.bpm; document.getElementById('remixBpmDisplay').textContent = `${remixBPM} BPM`; }
  if (p.kit) { window.switchKit(p.kit); }
  if (p.swing !== undefined) {
    remixSwing = p.swing;
    const sl = document.getElementById('swingLabel');
    if (sl) sl.textContent = `${remixSwing}%`;
    const slider = document.getElementById('swingSlider');
    if (slider) slider.value = remixSwing;
  }
  if (p.division) { window.setDivision(p.division); }
  if (p.trackVols) {
    p.trackVols.forEach((v, i) => {
      trackVols[i] = v;
      const el = document.getElementById(`track-vol-${i}`);
      if (el) el.textContent = v;
    });
  }

  if (typeof sounds !== 'undefined') sounds.click?.();
};

window.bbDeletePattern = function(key) {
  if (!confirm(`Delete "${key}"?`)) return;
  const patterns = bbGetSavedPatterns();
  delete patterns[key];
  localStorage.setItem(BB_STORAGE_KEY, JSON.stringify(patterns));
  bbRefreshSavedList();
  if (typeof sounds !== 'undefined') sounds.back?.();
};

function bbRefreshSavedList() {
  const list = document.getElementById('bbSavedList');
  if (!list) return;
  const patterns = bbGetSavedPatterns();
  const keys = Object.keys(patterns).sort();
  list.innerHTML = keys.length === 0
    ? '<div style="color:#555;font-size:5px;">No saved patterns</div>'
    : keys.map(k => {
        const p = patterns[k];
        const date = p.savedAt ? new Date(p.savedAt).toLocaleDateString() : '';
        return `<div class="bb-saved-item">
          <span class="bb-saved-name" onclick="bbLoadPattern('${k}')">${k}</span>
          <span class="bb-saved-meta">${p.bpm || 120}BPM ${date}</span>
          <span class="bb-saved-del" onclick="bbDeletePattern('${k}')">✕</span>
        </div>`;
      }).join('');
}

// ── Effects Controls ──────────────────────────────────────

window.bbSetDelay = function(val) {
  const wet = parseInt(val) / 100;
  if (bbDelayGain) bbDelayGain.gain.value = wet;
  const el = document.getElementById('delayLabel');
  if (el) el.textContent = `${val}%`;
};

window.bbSetDelayTime = function(time) {
  if (bbDelay) bbDelay.delayTime.value = time;
  document.querySelectorAll('.bb-delay-time-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.time === time);
  });
  if (typeof sounds !== 'undefined') sounds.click?.();
};

window.bbSetFilter = function(freq) {
  if (bbFilter) bbFilter.frequency.value = parseInt(freq);
  const el = document.getElementById('filterLabel');
  if (el) el.textContent = freq >= 1000 ? `${(freq/1000).toFixed(1)}k` : `${freq}Hz`;
};

window.bbSetFilterType = function(type) {
  if (bbFilter) bbFilter.type = type;
  document.querySelectorAll('.bb-filter-type-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.ftype === type);
  });
  if (typeof sounds !== 'undefined') sounds.click?.();
};

window.bbSetReverb = function(val) {
  const wet = parseInt(val) / 100;
  if (bbReverbGain) bbReverbGain.gain.value = wet;
  const el = document.getElementById('reverbLabel');
  if (el) el.textContent = `${val}%`;
};

// ── Keyboard / MIDI Input ─────────────────────────────────

let bbKeyBound = false;

function bbBindKeyboard() {
  if (bbKeyBound) return;
  bbKeyBound = true;

  // Physical keyboard → trigger pads
  const keyMap = {};
  INSTRUMENTS.forEach((inst, i) => { keyMap[inst.key.toLowerCase()] = i; });

  window._bbKeyHandler = async function(e) {
    // Ignore if typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    const key = e.key.toLowerCase();
    if (keyMap[key] !== undefined) {
      const r = keyMap[key];
      if (!audioReady) { bbSetStatus('⟳ Loading…'); await bbInitAudio(); }

      // Light up the pad visually
      const step = remixStep;
      const pad = document.querySelector(`.beat-boy-step[data-r="${r}"][data-c="${step}"]`);
      if (pad) {
        pad.classList.add('active');
        remixGrid[r][step] = true;
      }
      bbTrigger(r, step);
    }

    // Spacebar = play/stop
    if (e.code === 'Space' && !e.repeat) {
      e.preventDefault();
      window.toggleRemixPlay();
    }
  };

  document.addEventListener('keydown', window._bbKeyHandler);

  // Web MIDI API
  if (navigator.requestMIDI) {
    navigator.requestMIDI().then(bbSetupMIDI).catch(() => {});
  } else if (navigator.midi) {
    navigator.midi.requestMIDIAccess().then(bbSetupMIDI).catch(() => {});
  }
}

function bbSetupMIDI(midiAccess) {
  midiAccess.inputs.forEach(input => {
    input.onmidimessage = function(msg) {
      if (!audioReady) return;
      const [status, note, velocity] = msg.data;
      // Note On (0x90–0x9F) with velocity > 0
      if ((status & 0xF0) === 0x90 && velocity > 0) {
        const track = note % INSTRUMENTS.length;
        bbTrigger(track, remixStep);
      }
    };
  });
}

function bbUnbindKeyboard() {
  if (window._bbKeyHandler) {
    document.removeEventListener('keydown', window._bbKeyHandler);
    window._bbKeyHandler = null;
  }
  bbKeyBound = false;
}

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

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 0, W, H);

    const bw = W / data.length;
    data.forEach((v, i) => {
      const amp = Math.abs(v);
      const h   = amp * H * 0.9;
      const hue = 110 + (i / data.length) * 160;
      ctx.fillStyle = `hsl(${hue},100%,${35 + amp * 45}%)`;
      ctx.fillRect(i * bw, H / 2 - h / 2, bw - 1, h);
    });
  };

  draw();
}

// ── Cleanup ───────────────────────────────────────────────

window.stopRemix = function() {
  if (remixInterval) { clearInterval(remixInterval); remixInterval = null; }
  if (vizAnimFrame) { cancelAnimationFrame(vizAnimFrame); vizAnimFrame = null; }
  isRemixPlaying = false;
  bbUnbindKeyboard();
  const btn = document.getElementById('remixPlayBtn');
  if (btn) { btn.textContent = '▶ PLAY'; btn.style.background = '#0f0'; btn.style.color = '#000'; }
  document.querySelectorAll('.beat-boy-step').forEach(s => s.classList.remove('highlight'));
  // Hide pad mode
  const pad = document.getElementById('bbPadOverlay');
  if (pad) pad.style.display = 'none';
  bbPadActive = false;
};

// ── On-Screen Drum Pads (Mobile) ──────────────────────────

let bbPadActive = false;

window.bbTogglePad = async function() {
  if (!audioReady) { bbSetStatus('⟳ Loading…'); await bbInitAudio(); }

  bbPadActive = !bbPadActive;
  const pad = document.getElementById('bbPadOverlay');
  const grid = document.getElementById('remixGrid');
  const viz = document.getElementById('beatVizCanvas');

  if (bbPadActive) {
    // Hide grid, show pads
    if (grid) grid.style.display = 'none';
    if (viz) viz.style.display = 'none';
    if (pad) pad.style.display = 'flex';
    bbBuildPads();
  } else {
    if (grid) grid.style.display = '';
    if (viz) viz.style.display = '';
    if (pad) pad.style.display = 'none';
  }

  const toggleBtn = document.getElementById('bbPadToggleBtn');
  if (toggleBtn) {
    toggleBtn.textContent = bbPadActive ? '🎹 GRID' : '🥁 PADS';
    toggleBtn.style.background = bbPadActive ? '#ff0' : '#0a0a0a';
    toggleBtn.style.color = bbPadActive ? '#000' : '#0f0';
  }
};

function bbBuildPads() {
  const container = document.getElementById('bbPadOverlay');
  if (!container) return;
  container.innerHTML = '';

  INSTRUMENTS.forEach((inst, r) => {
    const pad = document.createElement('div');
    pad.className = 'bb-drum-pad';
    pad.style.setProperty('--pad-color', inst.color);
    pad.innerHTML = `
      <span class="bb-pad-emoji">${inst.emoji}</span>
      <span class="bb-pad-name">${inst.name}</span>
      <span class="bb-pad-key">${inst.key}</span>
    `;

    // Touch/click handlers
    const triggerPad = async (e) => {
      e.preventDefault();
      if (!audioReady) { bbSetStatus('⟳ Loading…'); await bbInitAudio(); }

      // Trigger the sound
      bbTrigger(r, remixStep);

      // Visual flash
      pad.classList.add('bb-pad-flash');
      setTimeout(() => pad.classList.remove('bb-pad-flash'), 150);

      // If playing, also record into the current step
      if (isRemixPlaying && remixGrid[r]) {
        remixGrid[r][remixStep] = true;
        const gridPad = document.querySelector(`.beat-boy-step[data-r="${r}"][data-c="${remixStep}"]`);
        if (gridPad) gridPad.classList.add('active');
      }
    };

    // Support both touch and mouse
    pad.addEventListener('touchstart', triggerPad, { passive: false });
    pad.addEventListener('mousedown', triggerPad);

    container.appendChild(pad);
  });
}

// Auto-init saved list on load
setTimeout(() => { if (typeof bbRefreshSavedList === 'function') bbRefreshSavedList(); }, 500);
