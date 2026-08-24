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
let remixGrid      = [];      // 2D: null (off) or {vel: 1-127} per step
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

// Per-row division: each track runs its own clock
let rowDivisions     = INSTRUMENTS.map(() => '16n');
let rowStepCounters  = INSTRUMENTS.map(() => 0);
let rowSubCounters   = INSTRUMENTS.map(() => 0);
let dynRowDivisions  = [];
let dynRowStepCounters = [];
let dynRowSubCounters  = [];

// Master tick counter (finest resolution across all rows)
let masterTick = 0;

// ── Per-Track EQ + Compressor ─────────────────────────────
// Each track: input → lowshelf (bass) → peaking (mid) → highshelf (treble) → compressor → trackGain → master
let bbTrackEQ     = []; // [{low, mid, hi, comp}] Tone.js nodes
let _bbNativeEQ   = []; // [{low, mid, hi, comp}] native Web Audio nodes
// Default EQ values (0 = flat, range -12 to +12 dB)
let bbTrackEQSettings = INSTRUMENTS.map(() => ({ bass: 0, mid: 0, treble: 0, compress: 0 }));

// ── Sample Library — 100% Web Audio synthesized (no external URLs) ──
// Each entry is type:'synth' so bbPlaySynthSound handles it
const BB_SAMPLE_LIB = {
  '🔊 DRUMS': {
    '808 Kick':     { synth: 'lib_kick808',  type: 'synth' },
    'Linn Kick':    { synth: 'lib_kicklinn', type: 'synth' },
    'Techno Kick':  { synth: 'lib_kicktech', type: 'synth' },
    'Acoustic Kick':{ synth: 'lib_kickacous', type: 'synth' },
    'FM Kick':      { synth: 'lib_kickfm',   type: 'synth' },
    '808 Snare':    { synth: 'lib_snare808',  type: 'synth' },
    'Linn Snare':   { synth: 'lib_snarelinn', type: 'synth' },
    'Tight Snare':  { synth: 'lib_snaretight',type: 'synth' },
    'Fat Snare':    { synth: 'lib_snarefat',  type: 'synth' },
    '808 HiHat':    { synth: 'lib_hh808',    type: 'synth' },
    'Linn HiHat':   { synth: 'lib_hhlinn',   type: 'synth' },
    'Tight HiHat':  { synth: 'lib_hhtight',  type: 'synth' },
    'Open HiHat':   { synth: 'lib_hhopen',   type: 'synth' },
  },
  '🎵 PERCUSSION': {
    'Cowbell':      { synth: 'lib_cowbell',  type: 'synth' },
    'Rimshot':      { synth: 'lib_rimshot',  type: 'synth' },
    'Clap':         { synth: 'lib_clap',     type: 'synth' },
    'Tambourine':   { synth: 'lib_tamb',     type: 'synth' },
    'Conga':        { synth: 'lib_conga',    type: 'synth' },
    'Bongo':        { synth: 'lib_bongo',    type: 'synth' },
    'Shaker':       { synth: 'lib_shaker',   type: 'synth' },
    'Cymbal':       { synth: 'lib_cymbal',   type: 'synth' },
    'Woodblock':    { synth: 'lib_wood',     type: 'synth' },
    'Triangle':     { synth: 'lib_triangle',  type: 'synth' },
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
  '🎸 BASS': {
    'Sub Bass':     { synth: 'subbass',   type: 'synth' },
    'Saw Bass':     { synth: 'sawbass',   type: 'synth' },
    'Fretless':     { synth: 'fretless',  type: 'synth' },
    'Slap Bass':    { synth: 'slap',      type: 'synth' },
    'Wobble':       { synth: 'wobble',    type: 'synth' },
    'Reese':        { synth: 'reese',     type: 'synth' },
  },
  '🌊 PADS': {
    'Warm Pad':     { synth: 'warmpad',   type: 'synth' },
    'Choir':        { synth: 'choir',     type: 'synth' },
    'Ambient':      { synth: 'ambient',   type: 'synth' },
    'Evolving':     { synth: 'evolving',  type: 'synth' },
    'Shimmer':      { synth: 'shimmer',   type: 'synth' },
    'Dark Pad':     { synth: 'darkpad',   type: 'synth' },
  },
};

// Tone.js nodes
let bbMasterVol   = null;
let bbTrackGains  = [];
let bbDrumPlayers = null;
let bbBassSynth   = null;
let bbPiano       = null;
let bbPianoSynth  = null;
let bbChordSynth  = null;
let bbAnalyser    = null;

// Effects rack nodes
let bbDelay       = null;
let bbDelayGain   = null;
let bbFilter      = null;
let bbReverb      = null;
let bbReverbGain  = null;
let bbCompressor  = null;
let bbRecorder    = null;
let bbRecording   = false;
let bbRecordingBlob = null;
let bbMelodyStyle = 'default';
let bbScale = 'aminor';

// Melodic sequences
const BASS_NOTES  = ['C2','C2','G2','A2','F2','E2','D2','C2'];
const LEAD_NOTES  = ['C4','E4','G4','B4','A4','F4','D4','E4'];
const CHORD_NOTES = [
  ['C3','E3','G3'], ['A2','C3','E3'], ['F2','A2','C3'], ['G2','B2','D3'],
  ['C3','E3','G3'], ['D2','F2','A2'], ['E2','G2','B2'], ['C3','G3','E3'],
];
const AFROBEAT_NOTES = {
  aminor: { bass: ['A2','A2','E2','G2','A2','C3','G2','E2'], lead: ['E4','G4','A4','C5','B4','A4','G4','E4'], chords: [['A3','C4','E4'],['G3','B3','E4'],['F3','A3','C4'],['E3','G3','B3']] },
  cmajor: { bass: ['C2','C2','G2','A2','C2','E2','G2','A2'], lead: ['E4','G4','A4','C5','B4','G4','E4','D4'], chords: [['C3','E3','G3'],['G2','B2','D3'],['A2','C3','E3'],['F2','A2','C3']] },
  ddorian: { bass: ['D2','D2','A2','C3','D2','F2','C3','A2'], lead: ['F4','A4','C5','D5','C5','A4','G4','F4'], chords: [['D3','F3','A3'],['C3','E3','G3'],['G2','B2','D3'],['D3','F3','A3']] }
};

// ── Preset Patterns ───────────────────────────────────────
// Grid cells: null = off, {vel: 60|90|127} = velocity level
const V = (v) => ({vel: v}); // shorthand
const PRESETS = {
  'TRAP': [
    [V(127),null,null,null, V(127),null,null,null, V(127),null,null,null, V(127),null,null,null],
    [null,null,null,null, V(127),null,null,null, null,null,null,null, V(127),null,null,null],
    [V(90),V(60),V(90),V(60), V(90),V(60),V(90),V(60), V(90),V(60),V(90),V(60), V(90),V(60),V(90),null],
    [null,null,null,null, null,null,V(90),null, null,null,null,null, null,null,null,null],
    [null,null,null,null, null,null,null,null, V(90),null,null,null, null,null,null,null],
    [V(127),null,null,null, null,null,null,V(90), null,null,null,null, V(127),null,null,null],
    [null,null,V(90),null, null,null,null,null, null,null,V(90),null, null,V(60),null,null],
    [null,null,null,null, V(90),null,null,null, null,null,null,null, V(90),null,null,null],
  ],
  'HOUSE': [
    [V(127),null,null,null, V(127),null,null,null, V(127),null,null,null, V(127),null,null,null],
    [null,null,null,null, V(127),null,null,null, null,null,null,null, V(127),null,null,null],
    [null,null,V(90),null, null,null,V(90),null, null,null,V(90),null, null,null,V(90),null],
    [null,null,null,null, null,null,null,null, null,null,V(90),null, null,null,null,null],
    [null,null,null,null, null,null,V(60),null, null,null,null,null, null,V(60),null,null],
    [V(127),null,null,V(90), null,null,V(127),null, V(127),null,null,null, null,V(90),null,null],
    [null,V(90),null,null, null,V(90),null,null, null,V(90),null,null, null,V(90),null,V(60)],
    [V(127),null,null,null, null,null,null,null, V(127),null,null,null, null,null,null,null],
  ],
  'BOOM BAP': [
    [V(127),null,null,null, null,null,V(90),null, null,V(90),null,null, null,null,null,null],
    [null,null,null,null, V(127),null,null,null, null,null,null,null, V(127),null,null,V(90)],
    [V(90),null,V(60),null, V(90),null,V(60),null, V(90),null,V(60),null, V(90),null,V(60),null],
    [null,null,V(90),null, null,null,null,null, null,V(90),null,null, null,null,null,V(60)],
    [null,null,null,null, null,null,null,null, V(90),null,null,null, null,null,V(60),null],
    [V(127),null,null,null, V(127),null,null,null, null,null,V(90),null, null,null,null,null],
    [null,null,null,V(90), null,V(90),null,null, null,null,null,V(90), null,null,V(90),null],
    [V(127),null,null,null, null,null,null,null, null,V(90),null,null, null,null,null,null],
  ],
  'TECHNO': [
    [V(127),null,null,null, V(127),null,null,null, V(127),null,null,null, V(127),null,null,null],
    [null,null,null,null, V(127),null,null,V(90), null,null,null,null, V(127),null,V(90),null],
    [V(90),V(60),V(90),V(60), V(90),V(60),V(90),V(60), V(90),V(60),V(90),V(60), V(90),V(60),V(90),V(60)],
    [null,null,null,null, null,V(90),null,null, null,null,null,null, null,V(90),null,V(60)],
    [null,null,V(60),null, null,null,null,null, null,V(90),null,null, null,null,null,null],
    [V(127),V(90),null,null, null,null,V(90),null, V(127),null,null,V(90), null,null,V(90),null],
    [null,null,null,null, V(90),null,null,V(90), null,null,null,null, V(90),null,null,null],
    [null,null,null,null, null,null,null,null, null,null,null,null, V(90),null,null,null],
  ],
  'REGGAE': [
    [null,null,null,null, V(127),null,null,null, null,null,null,null, V(127),null,null,null],
    [null,null,null,V(90), null,null,null,null, null,null,null,V(90), null,null,null,null],
    [null,null,V(90),null, null,null,V(90),null, null,null,V(90),null, null,null,V(90),null],
    [null,null,null,null, null,null,null,null, null,V(90),null,null, null,null,null,null],
    [V(127),null,null,null, null,null,null,null, null,null,null,null, null,null,V(60),null],
    [null,null,V(90),null, null,null,null,null, null,null,V(90),null, null,null,null,null],
    [V(127),null,null,null, null,null,V(90),null, null,null,null,null, V(127),null,null,null],
    [null,null,null,null, null,V(90),null,null, null,null,null,null, null,null,null,null],
  ],
  'FUNK': [
    [V(127),null,null,null, null,null,null,null, V(127),null,V(90),null, null,null,null,null],
    [null,null,null,null, V(127),null,null,null, null,null,null,null, V(127),null,null,null],
    [null,null,V(90),null, null,V(60),V(90),null, null,null,V(90),null, null,V(60),V(90),null],
    [null,null,null,null, null,null,null,null, null,V(90),null,null, null,null,null,null],
    [null,null,null,null, null,null,V(60),null, null,null,null,null, null,null,null,V(90)],
    [V(127),null,null,V(90), null,null,null,null, V(127),null,null,null, null,V(90),null,null],
    [null,null,V(90),null, null,null,null,null, null,null,V(90),null, null,null,null,V(60)],
    [V(127),null,null,null, null,null,V(90),null, null,null,null,null, null,V(90),null,null],
  ],
  'HIP HOP': [
    [V(127),null,null,null, null,null,null,null, V(127),null,null,null, null,null,null,null],
    [null,null,null,null, V(127),null,null,null, null,null,null,V(90), null,null,null,null],
    [null,null,V(90),null, null,null,V(90),null, null,null,V(90),null, null,null,V(90),null],
    [null,null,null,null, null,null,null,null, null,null,V(90),null, null,null,null,null],
    [null,V(60),null,null, null,null,null,null, null,null,null,null, null,null,null,V(90)],
    [V(127),null,null,null, null,null,V(90),null, null,null,null,null, V(127),null,null,null],
    [null,null,null,V(90), null,null,null,null, null,V(90),null,null, null,null,V(90),null],
    [V(127),null,null,null, null,null,null,null, null,V(90),null,null, null,null,null,null],
  ],
  'AFROBEAT': [
    [V(127),null,null,V(90), null,null,V(90),null, V(127),null,null,V(90), null,null,V(90),null],
    [null,null,null,null, V(127),null,null,null, null,null,null,null, V(127),null,null,null],
    [V(90),V(60),null,V(90), V(90),V(60),null,V(90), V(90),V(60),null,V(90), V(90),V(60),null,V(90)],
    [null,null,V(90),null, null,null,null,V(60), null,null,V(90),null, null,null,null,V(60)],
    [null,null,null,null, null,V(90),null,null, null,null,null,null, null,V(90),null,null],
    [V(127),null,null,null, null,null,V(90),null, V(127),null,null,null, null,null,V(90),null],
    [null,null,V(90),null, null,V(90),null,null, null,null,V(90),null, null,V(90),null,null],
    [null,null,null,null, V(90),null,null,null, null,null,null,null, V(90),null,null,null],
  ],
};

// ── Audio Init ────────────────────────────────────────────

// ── BeatForge Fallback: Pure Web Audio drum synthesis ─────────
// Used when Tone.js CDN fails. Based on godfengliang/beatforge (MIT).
let _bbFallbackCtx = null;
let _bbFallbackAnalyser = null;
let _bbFallbackMasterGain = null;
let _bbNativeFilter = null;
let _bbNativeDelay = null;
let _bbNativeDelayGain = null;
let _bbNativeDelayFeedback = null;
let _bbNativeReverb = null;
let _bbNativeReverbGain = null;
let _bbNativeInput = null;

function bbInitFallbackAudio() {
  _bbFallbackCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (_bbFallbackCtx.state === 'suspended') _bbFallbackCtx.resume();
  _bbFallbackAnalyser = _bbFallbackCtx.createAnalyser();
  _bbFallbackAnalyser.fftSize = 2048;
  _bbFallbackAnalyser.connect(_bbFallbackCtx.destination);
  // Create native master gain for synth sounds (BeatForge-style)
  _bbFallbackMasterGain = _bbFallbackCtx.createGain();
  _bbFallbackMasterGain.gain.value = remixMasterVol;

  // Native effects chain: synth -> filter -> delay/reverb -> masterGain -> destination
  _bbNativeFilter = _bbFallbackCtx.createBiquadFilter();
  _bbNativeFilter.type = 'lowpass';
  _bbNativeFilter.frequency.value = 20000;

  _bbNativeDelay = _bbFallbackCtx.createDelay(2);
  _bbNativeDelay.delayTime.value = 60000/remixBPM/1000;
  _bbNativeDelayGain = _bbFallbackCtx.createGain();
  _bbNativeDelayGain.gain.value = 0;
  _bbNativeDelayFeedback = _bbFallbackCtx.createGain();
  _bbNativeDelayFeedback.gain.value = 0.3;
  _bbNativeDelay.connect(_bbNativeDelayFeedback);
  _bbNativeDelayFeedback.connect(_bbNativeDelay);
  _bbNativeDelay.connect(_bbNativeDelayGain);
  _bbNativeDelayGain.connect(_bbNativeFilter);

  const irLen = _bbFallbackCtx.sampleRate * 1.5;
  const irBuf = _bbFallbackCtx.createBuffer(2, irLen, _bbFallbackCtx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = irBuf.getChannelData(ch);
    for (let i = 0; i < irLen; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / irLen, 2.5);
  }
  _bbNativeReverb = _bbFallbackCtx.createConvolver();
  _bbNativeReverb.buffer = irBuf;
  _bbNativeReverbGain = _bbFallbackCtx.createGain();
  _bbNativeReverbGain.gain.value = 0;
  _bbNativeReverb.connect(_bbNativeReverbGain);
  _bbNativeReverbGain.connect(_bbNativeFilter);

  // Input routing: inputGain -> filter + delay + reverb
  _bbNativeInput = _bbFallbackCtx.createGain();
  _bbNativeInput.connect(_bbNativeFilter);
  _bbNativeInput.connect(_bbNativeDelay);
  _bbNativeInput.connect(_bbNativeReverb);

  _bbNativeFilter.connect(_bbFallbackMasterGain);
  _bbFallbackMasterGain.connect(_bbFallbackCtx.destination);

  audioReady = true;
  bbSetStatus('');
}

function _bbFallbackSynth(channel, time, vol) {
  const ctx = _bbFallbackCtx;
  if (!ctx) return;
  const v = vol * remixMasterVol;
  if (v <= 0) return;
  // Route through native EQ chain for this channel, or master gain as fallback
  const dest = (_bbNativeEQ[channel]?.low) || _bbFallbackAnalyser || ctx.destination;

  if (channel === 0) { // Kick
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(dest);
    o.frequency.setValueAtTime(150, time);
    o.frequency.exponentialRampToValueAtTime(30, time + 0.12);
    g.gain.setValueAtTime(v, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
    o.start(time); o.stop(time + 0.4);
    const o2 = ctx.createOscillator(), g2 = ctx.createGain();
    o2.connect(g2); g2.connect(dest); o2.frequency.value = 800;
    g2.gain.setValueAtTime(v * 0.3, time);
    g2.gain.exponentialRampToValueAtTime(0.001, time + 0.02);
    o2.start(time); o2.stop(time + 0.02);
  } else if (channel === 1) { // Snare
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const n = ctx.createBufferSource(); n.buffer = buf;
    const ng = ctx.createGain(); const f = ctx.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = 2000;
    n.connect(f); f.connect(ng); ng.connect(dest);
    ng.gain.setValueAtTime(v * 0.7, time);
    ng.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    n.start(time); n.stop(time + 0.15);
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(dest);
    o.frequency.setValueAtTime(180, time);
    o.frequency.exponentialRampToValueAtTime(60, time + 0.08);
    g.gain.setValueAtTime(v * 0.6, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
    o.start(time); o.stop(time + 0.08);
  } else if (channel === 2) { // Hi-Hat
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const n = ctx.createBufferSource(); n.buffer = buf;
    const g = ctx.createGain(); const f = ctx.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = 8000;
    n.connect(f); f.connect(g); g.connect(dest);
    g.gain.setValueAtTime(v * 0.35, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
    n.start(time); n.stop(time + 0.04);
  } else if (channel === 3) { // Tom
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(dest);
    o.frequency.setValueAtTime(200, time);
    o.frequency.exponentialRampToValueAtTime(80, time + 0.15);
    g.gain.setValueAtTime(v * 0.6, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
    o.start(time); o.stop(time + 0.2);
  } else if (channel === 4) { // Clap
    for (let b = 0; b < 3; b++) {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.01, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const n = ctx.createBufferSource(); n.buffer = buf;
      const g = ctx.createGain(); const f = ctx.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = 1200; f.Q.value = 2;
      n.connect(f); f.connect(g); g.connect(dest);
      const t = time + b * 0.01;
      g.gain.setValueAtTime(v * 0.6, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      n.start(t); n.stop(t + 0.08);
    }
  } else { // Generic synth hit
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'triangle'; o.connect(g); g.connect(dest);
    o.frequency.setValueAtTime(440 + channel * 100, time);
    o.frequency.exponentialRampToValueAtTime(100, time + 0.1);
    g.gain.setValueAtTime(v * 0.4, time);
    g.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    o.start(time); o.stop(time + 0.15);
  }
}

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
      // FALLBACK: Use pure Web Audio API (BeatForge-style synthesis)
      bbSetStatus('⟳ Using built-in synth engine...');
      bbInitFallbackAudio();
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
  bbRecorder   = new Tone.Recorder();
  bbAnalyser.connect(bbRecorder);

  // ── Native master gain for synth library sounds ─────────────
  // bbPlaySynthSound uses native Web Audio nodes (like BeatForge) which can't
  // connect to Tone.js wrapper nodes. This native gain bridges them to the speakers.
  const rawCtx = Tone.context.rawContext;
  _bbFallbackMasterGain = rawCtx.createGain();
  _bbFallbackMasterGain.gain.value = remixMasterVol;

  // Native effects chain: synth -> filter -> delay -> reverb -> masterGain -> destination
  _bbNativeFilter = rawCtx.createBiquadFilter();
  _bbNativeFilter.type = 'lowpass';
  _bbNativeFilter.frequency.value = 20000;

  _bbNativeDelay = rawCtx.createDelay(2);
  _bbNativeDelay.delayTime.value = rawCtx.currentTime; // will be set by bbSetDelayTime
  _bbNativeDelayGain = rawCtx.createGain();
  _bbNativeDelayGain.gain.value = 0; // off by default
  _bbNativeDelayFeedback = rawCtx.createGain();
  _bbNativeDelayFeedback.gain.value = 0.3;

  // Delay feedback loop: delay -> feedback -> delay
  _bbNativeDelay.connect(_bbNativeDelayFeedback);
  _bbNativeDelayFeedback.connect(_bbNativeDelay);
  _bbNativeDelay.connect(_bbNativeDelayGain);
  _bbNativeDelayGain.connect(_bbNativeFilter);

  // Reverb via convolver (simple impulse)
  _bbNativeReverbGain = rawCtx.createGain();
  _bbNativeReverbGain.gain.value = 0; // off by default
  // Create a simple reverb impulse
  const irLen = rawCtx.sampleRate * 1.5;
  const irBuf = rawCtx.createBuffer(2, irLen, rawCtx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = irBuf.getChannelData(ch);
    for (let i = 0; i < irLen; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / irLen, 2.5);
  }
  _bbNativeReverb = rawCtx.createConvolver();
  _bbNativeReverb.buffer = irBuf;
  _bbNativeReverb.connect(_bbNativeReverbGain);
  _bbNativeReverbGain.connect(_bbNativeFilter);

  // Chain: inputGain -> filter -> masterGain -> destination
  // Also: inputGain -> delay -> delayGain -> filter (feedback loop)
  // Also: inputGain -> reverb -> reverbGain -> filter
  _bbNativeInput = rawCtx.createGain();
  _bbNativeInput.connect(_bbNativeFilter);
  _bbNativeInput.connect(_bbNativeDelay);
  _bbNativeInput.connect(_bbNativeReverb);
  _bbNativeFilter.connect(_bbFallbackMasterGain);
  _bbFallbackMasterGain.connect(rawCtx.destination);

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

  // Per-track gain nodes → EQ chain → master (dry) + send to effects
  // EQ chain: lowshelf (bass) → peaking (mid) → highshelf (treble) → compressor
  bbTrackEQ = [];
  _bbNativeEQ = [];

  bbTrackGains = INSTRUMENTS.map((_, i) => {
    const g = new Tone.Volume(0);

    // Tone.js EQ chain
    const low  = new Tone.Filter(200, 'lowshelf').toDestination();
    low.gain.value = 0;
    const mid  = new Tone.Filter(1000, 'peaking');
    mid.gain.value = 0;
    mid.Q.value = 1;
    const hi   = new Tone.Filter(3500, 'highshelf').toDestination();
    hi.gain.value = 0;
    const comp = new Tone.Compressor(-20, 4);
    comp.threshold.value = -20;
    comp.ratio.value = 1; // 1:1 = no compression by default

    // Chain: g → low → mid → hi → comp → masterVol
    g.chain(low, mid, hi, comp, bbMasterVol);

    // Dry path also to FX sends
    g.connect(bbDelay);
    g.connect(bbReverb);
    g.connect(bbFilter);

    bbTrackEQ.push({ low, mid, hi, comp });

    // Native Web Audio EQ chain (for fallback mode)
    const nLow  = rawCtx.createBiquadFilter();
    nLow.type = 'lowshelf'; nLow.frequency.value = 200; nLow.gain.value = 0;
    const nMid  = rawCtx.createBiquadFilter();
    nMid.type = 'peaking'; nMid.frequency.value = 1000; nMid.Q.value = 1; nMid.gain.value = 0;
    const nHi   = rawCtx.createBiquadFilter();
    nHi.type = 'highshelf'; nHi.frequency.value = 3500; nHi.gain.value = 0;
    const nComp = rawCtx.createDynamicsCompressor();
    nComp.threshold.value = -20; nComp.ratio.value = 1;
    nLow.connect(nMid); nMid.connect(nHi); nHi.connect(nComp); nComp.connect(_bbFallbackMasterGain);

    _bbNativeEQ.push({ low: nLow, mid: nMid, hi: nHi, comp: nComp });

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

  // Salamander piano sampler — wrapped in try/catch for CDN failures
  // Sampler only loads specific notes, so we also create a synth fallback
  try {
    bbPiano = new Tone.Sampler({
      urls: {
        C4: 'C4.mp3', 'D#4': 'Ds4.mp3', 'F#4': 'Fs4.mp3', A4: 'A4.mp3',
        C5: 'C5.mp3', 'D#5': 'Ds5.mp3', 'F#5': 'Fs5.mp3', A5: 'A5.mp3',
      },
      release: 1.2,
      baseUrl: BB_PIANO_BASE,
      onload: () => {},
      onerror: () => { bbPiano = null; },
    }).connect(new Tone.Reverb({ decay: 1.5, wet: 0.2 }).connect(bbTrackGains[6]));
  } catch(e) { bbPiano = null; }

  // Piano synth fallback — used when sampler can't play a note
  bbPianoSynth = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.01, decay: 0.4, sustain: 0.1, release: 0.6 },
    volume: -8,
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

  try {
    bbDrumPlayers = new Tone.Players(
      {
        kick:  `${base}kick.mp3`,
        snare: `${base}snare.mp3`,
        hihat: `${base}hihat.mp3`,
        tom1:  `${base}tom1.mp3`,
        tom2:  `${base}tom2.mp3`,
      },
      {
        onerror: (e) => console.warn('Sample error (will use synth fallback):', e),
      }
    );

    await Promise.race([Tone.loaded(), new Promise(r => setTimeout(r, 5000))]);

    ['kick','snare','hihat','tom1','tom2'].forEach((name, i) => {
      try {
        const p = bbDrumPlayers.player(name);
        if (p && p.loaded) p.connect(bbTrackGains[i]);
      } catch(e) {}
    });
  } catch(e) {
    console.warn('Kit load failed, using synth fallback:', e);
    bbDrumPlayers = null;
  }

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
// Uses native Web Audio API (like BeatForge) — connects to rawContext.destination
// Tone.js wrapper nodes can't be used as AudioNode.connect() targets
function bbPlaySynthSound(name, targetGain) {
  if (!audioReady) return;
  // Use raw AudioContext — native Web Audio nodes can't connect to Tone.js wrapper nodes
  // This matches the BeatForge pattern: Oscillator -> Gain -> rawCtx.destination
  const ctx = (window.Tone && Tone.context && Tone.context.rawContext) || 
                 _bbFallbackCtx || 
                 new (window.AudioContext || window.webkitAudioContext)();
  const now = ctx.currentTime;
  const dest = _bbNativeInput || _bbNativeFilter || _bbFallbackMasterGain || ctx.destination;

  switch(name) {
    // ── VOICES (formant synthesis) ──
    case 'hey': {
      const o1 = ctx.createOscillator(); const g = ctx.createGain();
      o1.type = 'sawtooth'; o1.frequency.setValueAtTime(180, now);
      o1.frequency.linearRampToValueAtTime(220, now + 0.08);
      o1.frequency.linearRampToValueAtTime(160, now + 0.15);
      g.gain.setValueAtTime(0.3, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      o1.connect(g); g.connect(dest);
      o1.start(now); o1.stop(now + 0.2);
      break;
    }
    case 'yeah': {
      const o1 = ctx.createOscillator(); const g = ctx.createGain();
      o1.type = 'sawtooth'; o1.frequency.setValueAtTime(200, now);
      o1.frequency.linearRampToValueAtTime(280, now + 0.1);
      o1.frequency.linearRampToValueAtTime(200, now + 0.25);
      g.gain.setValueAtTime(0.25, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      o1.connect(g); g.connect(dest);
      o1.start(now); o1.stop(now + 0.3);
      break;
    }
    case 'oh': {
      const o1 = ctx.createOscillator(); const g = ctx.createGain();
      o1.type = 'sine'; o1.frequency.setValueAtTime(250, now);
      o1.frequency.linearRampToValueAtTime(180, now + 0.2);
      g.gain.setValueAtTime(0.3, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      o1.connect(g); g.connect(dest);
      o1.start(now); o1.stop(now + 0.25);
      break;
    }
    case 'uh': {
      const o1 = ctx.createOscillator(); const g = ctx.createGain();
      o1.type = 'square'; o1.frequency.setValueAtTime(150, now);
      o1.frequency.linearRampToValueAtTime(120, now + 0.08);
      g.gain.setValueAtTime(0.2, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      o1.connect(g); g.connect(dest);
      o1.start(now); o1.stop(now + 0.1);
      break;
    }
    case 'yo': {
      const o1 = ctx.createOscillator(); const g = ctx.createGain();
      o1.type = 'sawtooth'; o1.frequency.setValueAtTime(160, now);
      o1.frequency.linearRampToValueAtTime(300, now + 0.06);
      o1.frequency.linearRampToValueAtTime(180, now + 0.15);
      g.gain.setValueAtTime(0.25, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      o1.connect(g); g.connect(dest);
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
      o1.connect(g); o2.connect(g); g.connect(dest);
      o1.start(now); o2.start(now); o1.stop(now + 0.4); o2.stop(now + 0.4);
      break;
    }
    case 'ha': {
      const o1 = ctx.createOscillator(); const g = ctx.createGain();
      o1.type = 'sawtooth'; o1.frequency.setValueAtTime(250, now);
      o1.frequency.linearRampToValueAtTime(180, now + 0.1);
      g.gain.setValueAtTime(0.3, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      o1.connect(g); g.connect(dest);
      o1.start(now); o1.stop(now + 0.12);
      break;
    }
    case 'chant': {
      for (let i = 0; i < 3; i++) {
        const o1 = ctx.createOscillator(); const g = ctx.createGain();
        o1.type = 'sawtooth'; o1.frequency.setValueAtTime(180 + i * 10, now + i * 0.06);
        g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.15, now + i * 0.06);
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        o1.connect(g); g.connect(dest);
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
      o.connect(g); g.connect(dest);
      o.start(now); o.stop(now + 0.5);
      break;
    }
    case 'zap': {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'square'; o.frequency.setValueAtTime(1500, now);
      o.frequency.exponentialRampToValueAtTime(50, now + 0.15);
      g.gain.setValueAtTime(0.3, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      o.connect(g); g.connect(dest);
      o.start(now); o.stop(now + 0.15);
      break;
    }
    case 'laser': {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(3000, now);
      o.frequency.exponentialRampToValueAtTime(100, now + 0.1);
      g.gain.setValueAtTime(0.3, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      o.connect(g); g.connect(dest);
      o.start(now); o.stop(now + 0.12);
      break;
    }
    case 'impact': {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(100, now);
      o.frequency.exponentialRampToValueAtTime(30, now + 0.3);
      g.gain.setValueAtTime(0.5, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      o.connect(g); g.connect(dest);
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
      o.connect(f); f.connect(g); g.connect(dest);
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
      src.connect(g); g.connect(dest);
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
      src.connect(f); f.connect(g); g.connect(dest);
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
      src.connect(g); g.connect(dest);
      src.start(now);
      break;
    }

    // ── SYNTHS ──
    case 'bass808': {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(150, now);
      o.frequency.exponentialRampToValueAtTime(40, now + 0.15);
      g.gain.setValueAtTime(0.4, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      o.connect(g); g.connect(dest);
      o.start(now); o.stop(now + 0.3);
      break;
    }
    case 'stab': {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'square'; o.frequency.setValueAtTime(440, now);
      g.gain.setValueAtTime(0.2, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      o.connect(g); g.connect(dest);
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
      o.connect(g); o2.connect(g); g.connect(dest);
      o.start(now); o2.start(now); o.stop(now + 0.5); o2.stop(now + 0.5);
      break;
    }
    case 'pluck': {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = 440;
      g.gain.setValueAtTime(0.3, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      o.connect(g); g.connect(dest);
      o.start(now); o.stop(now + 0.15);
      break;
    }
    case 'bell': {
      const o = ctx.createOscillator(); const o2 = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = 880;
      o2.type = 'sine'; o2.frequency.value = 1320;
      g.gain.setValueAtTime(0.2, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      o.connect(g); o2.connect(g); g.connect(dest);
      o.start(now); o2.start(now); o.stop(now + 0.6); o2.stop(now + 0.6);
      break;
    }
    case 'organ': {
      [262, 330, 392, 523].forEach((freq, i) => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = freq;
        g.gain.setValueAtTime(0.08, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        o.connect(g); g.connect(dest);
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
      o.connect(g); g.connect(dest);
      o.start(now); o.stop(now + 0.2);
      break;
    }
    case 'strings': {
      [262, 330, 392].forEach(freq => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = 'sawtooth'; o.frequency.value = freq;
        g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.06, now + 0.15);
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        o.connect(g); g.connect(dest);
        o.start(now); o.stop(now + 0.5);
      });
      break;
    }
    // ── BASS category ────────────────────────────
    case 'subbass': {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = 55;
      g.gain.setValueAtTime(0.35, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      o.connect(g); g.connect(dest);
      o.start(now); o.stop(now + 0.4);
      break;
    }
    case 'sawbass': {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 600;
      o.type = 'sawtooth'; o.frequency.value = 110;
      g.gain.setValueAtTime(0.25, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      o.connect(f); f.connect(g); g.connect(dest);
      o.start(now); o.stop(now + 0.3);
      break;
    }
    case 'fretless': {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'triangle'; o.frequency.setValueAtTime(146, now);
      o.frequency.linearRampToValueAtTime(130, now + 0.2);
      g.gain.setValueAtTime(0.25, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      o.connect(g); g.connect(dest);
      o.start(now); o.stop(now + 0.4);
      break;
    }
    case 'slap': {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'square'; o.frequency.setValueAtTime(300, now);
      o.frequency.exponentialRampToValueAtTime(80, now + 0.05);
      g.gain.setValueAtTime(0.3, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      o.connect(g); g.connect(dest);
      o.start(now); o.stop(now + 0.1);
      break;
    }
    case 'wobble': {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      const lfo = ctx.createOscillator(); const lg = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = 110;
      lfo.type = 'sine'; lfo.frequency.value = 6;
      lg.gain.value = 400;
      lfo.connect(lg); lg.connect(o.frequency);
      g.gain.setValueAtTime(0.2, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      o.connect(g); g.connect(dest);
      lfo.start(now); o.start(now); o.stop(now + 0.5); lfo.stop(now + 0.5);
      break;
    }
    case 'reese': {
      [110, 111.5].forEach(freq => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1200;
        o.type = 'sawtooth'; o.frequency.value = freq;
        g.gain.setValueAtTime(0.15, now); g.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        o.connect(f); f.connect(g); g.connect(dest);
        o.start(now); o.stop(now + 0.6);
      });
      break;
    }
    // ── PADS category ────────────────────────────
    case 'warmpad': {
      [262, 330, 392, 523].forEach(freq => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = freq;
        g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.06, now + 0.3);
        g.gain.exponentialRampToValueAtTime(0.01, now + 1.0);
        o.connect(g); g.connect(dest);
        o.start(now); o.stop(now + 1.0);
      });
      break;
    }
    case 'choir': {
      [196, 247, 294, 392].forEach(freq => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = freq;
        g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.04, now + 0.4);
        g.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
        o.connect(g); g.connect(dest);
        o.start(now); o.stop(now + 1.2);
      });
      break;
    }
    case 'ambient': {
      [130.8, 196, 261.6].forEach(freq => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = 'triangle'; o.frequency.value = freq;
        g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.05, now + 0.5);
        g.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
        o.connect(g); g.connect(dest);
        o.start(now); o.stop(now + 1.5);
      });
      break;
    }
    case 'evolving': {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.setValueAtTime(200, now);
      o.frequency.linearRampToValueAtTime(400, now + 1.0);
      g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.06, now + 0.3);
      g.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
      o.connect(g); g.connect(dest);
      o.start(now); o.stop(now + 1.2);
      break;
    }
    case 'shimmer': {
      [523, 659, 784].forEach(freq => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = freq;
        g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.04, now + 0.2);
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
        o.connect(g); g.connect(dest);
        o.start(now); o.stop(now + 0.8);
      });
      break;
    }
    case 'darkpad': {
      [110, 138.6, 164.8].forEach(freq => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = 'sawtooth'; o.frequency.value = freq;
        const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 400;
        g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.05, now + 0.4);
        g.gain.exponentialRampToValueAtTime(0.01, now + 1.0);
        o.connect(f); f.connect(g); g.connect(dest);
        o.start(now); o.stop(now + 1.0);
      });
      break;
    }
    // ── Library synthesized drums ──────────────────────────
    case 'lib_kick808': {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.frequency.setValueAtTime(150, now); o.frequency.exponentialRampToValueAtTime(30, now + 0.12);
      g.gain.setValueAtTime(0.9, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      o.connect(g); g.connect(dest); o.start(now); o.stop(now + 0.5);
      const o2 = ctx.createOscillator(); const g2 = ctx.createGain();
      o2.frequency.value = 800; g2.gain.setValueAtTime(0.3, now); g2.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
      o2.connect(g2); g2.connect(dest); o2.start(now); o2.stop(now + 0.02);
      break;
    }
    case 'lib_kicklinn': {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.frequency.setValueAtTime(200, now); o.frequency.exponentialRampToValueAtTime(40, now + 0.08);
      g.gain.setValueAtTime(0.85, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      o.connect(g); g.connect(dest); o.start(now); o.stop(now + 0.35);
      break;
    }
    case 'lib_kicktech': {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'square'; o.frequency.setValueAtTime(120, now); o.frequency.exponentialRampToValueAtTime(25, now + 0.15);
      g.gain.setValueAtTime(0.7, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      o.connect(g); g.connect(dest); o.start(now); o.stop(now + 0.3);
      break;
    }
    case 'lib_kickacous': {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.frequency.setValueAtTime(100, now); o.frequency.exponentialRampToValueAtTime(35, now + 0.1);
      g.gain.setValueAtTime(0.8, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      o.connect(g); g.connect(dest); o.start(now); o.stop(now + 0.4);
      // Beater click
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.01, ctx.sampleRate);
      const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random()*2-1)*0.5;
      const n = ctx.createBufferSource(); n.buffer = buf;
      const ng = ctx.createGain(); ng.gain.setValueAtTime(0.4, now); ng.gain.exponentialRampToValueAtTime(0.001, now + 0.01);
      n.connect(ng); ng.connect(dest); n.start(now); n.stop(now + 0.01);
      break;
    }
    case 'lib_kickfm': {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      const o2 = ctx.createOscillator(); const g2 = ctx.createGain();
      o.type = 'sine'; o.frequency.value = 60;
      o2.type = 'sine'; o2.frequency.value = 300;
      g2.gain.setValueAtTime(200, now); g2.gain.exponentialRampToValueAtTime(1, now + 0.1);
      o2.connect(g2); g2.connect(o.frequency);
      g.gain.setValueAtTime(0.8, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      o.connect(g); g.connect(dest); o.start(now); o2.start(now); o.stop(now + 0.4); o2.stop(now + 0.4);
      break;
    }
    case 'lib_snare808': {
      // Tone body
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = 180;
      g.gain.setValueAtTime(0.6, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      o.connect(g); g.connect(dest); o.start(now); o.stop(now + 0.1);
      // Noise
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
      const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random()*2-1;
      const n = ctx.createBufferSource(); n.buffer = buf;
      const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 2000;
      const ng = ctx.createGain(); ng.gain.setValueAtTime(0.5, now); ng.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      n.connect(f); f.connect(ng); ng.connect(dest); n.start(now); n.stop(now + 0.2);
      break;
    }
    case 'lib_snarelinn': {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'triangle'; o.frequency.setValueAtTime(200, now); o.frequency.exponentialRampToValueAtTime(100, now + 0.05);
      g.gain.setValueAtTime(0.5, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      o.connect(g); g.connect(dest); o.start(now); o.stop(now + 0.08);
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
      const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random()*2-1;
      const n = ctx.createBufferSource(); n.buffer = buf;
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 3000; f.Q.value = 1.5;
      const ng = ctx.createGain(); ng.gain.setValueAtTime(0.5, now); ng.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      n.connect(f); f.connect(ng); ng.connect(dest); n.start(now); n.stop(now + 0.12);
      break;
    }
    case 'lib_snaretight': {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
      const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random()*2-1;
      const n = ctx.createBufferSource(); n.buffer = buf;
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 4000; f.Q.value = 3;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.5, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      n.connect(f); f.connect(g); g.connect(dest); n.start(now); n.stop(now + 0.06);
      break;
    }
    case 'lib_snarefat': {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'triangle'; o.frequency.setValueAtTime(250, now); o.frequency.exponentialRampToValueAtTime(80, now + 0.08);
      g.gain.setValueAtTime(0.6, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      o.connect(g); g.connect(dest); o.start(now); o.stop(now + 0.15);
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
      const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random()*2-1;
      const n = ctx.createBufferSource(); n.buffer = buf;
      const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1500;
      const ng = ctx.createGain(); ng.gain.setValueAtTime(0.6, now); ng.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      n.connect(f); f.connect(ng); ng.connect(dest); n.start(now); n.stop(now + 0.18);
      break;
    }
    case 'lib_hh808': {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
      const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random()*2-1;
      const n = ctx.createBufferSource(); n.buffer = buf;
      const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 8000;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.3, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      n.connect(f); f.connect(g); g.connect(dest); n.start(now); n.stop(now + 0.05);
      break;
    }
    case 'lib_hhlinn': {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.06, ctx.sampleRate);
      const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random()*2-1;
      const n = ctx.createBufferSource(); n.buffer = buf;
      const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.35, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      n.connect(f); f.connect(g); g.connect(dest); n.start(now); n.stop(now + 0.06);
      break;
    }
    case 'lib_hhtight': {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.03, ctx.sampleRate);
      const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random()*2-1;
      const n = ctx.createBufferSource(); n.buffer = buf;
      const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 10000;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.25, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      n.connect(f); f.connect(g); g.connect(dest); n.start(now); n.stop(now + 0.03);
      break;
    }
    case 'lib_hhopen': {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
      const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random()*2-1;
      const n = ctx.createBufferSource(); n.buffer = buf;
      const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 6000;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.3, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      n.connect(f); f.connect(g); g.connect(dest); n.start(now); n.stop(now + 0.25);
      break;
    }
    case 'lib_cowbell': {
      [800, 540].forEach(freq => {
        const o = ctx.createOscillator(); const g = ctx.createGain();
        o.type = 'square'; o.frequency.value = freq;
        g.gain.setValueAtTime(0.25, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        o.connect(g); g.connect(dest); o.start(now); o.stop(now + 0.15);
      });
      break;
    }
    case 'lib_rimshot': {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.03, ctx.sampleRate);
      const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random()*2-1) * (1 - i/d.length);
      const n = ctx.createBufferSource(); n.buffer = buf;
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 3500; f.Q.value = 5;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.4, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      n.connect(f); f.connect(g); g.connect(dest); n.start(now); n.stop(now + 0.03);
      break;
    }
    case 'lib_clap': {
      for (let b = 0; b < 3; b++) {
        const buf = ctx.createBuffer(1, ctx.sampleRate * 0.01, ctx.sampleRate);
        const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random()*2-1;
        const n = ctx.createBufferSource(); n.buffer = buf;
        const g = ctx.createGain(); const f = ctx.createBiquadFilter();
        f.type = 'bandpass'; f.frequency.value = 1200; f.Q.value = 2;
        n.connect(f); f.connect(g); g.connect(dest);
        const t = now + b * 0.01;
        g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        n.start(t); n.stop(t + 0.08);
      }
      break;
    }
    case 'lib_tamb': {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.15, ctx.sampleRate);
      const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random()*2-1;
      const n = ctx.createBufferSource(); n.buffer = buf;
      const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 5000;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.3, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      n.connect(f); f.connect(g); g.connect(dest); n.start(now); n.stop(now + 0.15);
      break;
    }
    case 'lib_conga': {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.frequency.setValueAtTime(300, now); o.frequency.exponentialRampToValueAtTime(120, now + 0.08);
      g.gain.setValueAtTime(0.4, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      o.connect(g); g.connect(dest); o.start(now); o.stop(now + 0.12);
      break;
    }
    case 'lib_bongo': {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.frequency.setValueAtTime(400, now); o.frequency.exponentialRampToValueAtTime(200, now + 0.05);
      g.gain.setValueAtTime(0.35, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      o.connect(g); g.connect(dest); o.start(now); o.stop(now + 0.08);
      break;
    }
    case 'lib_shaker': {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
      const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random()*2-1) * (1 - i/d.length);
      const n = ctx.createBufferSource(); n.buffer = buf;
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 8000; f.Q.value = 2;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.2, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      n.connect(f); f.connect(g); g.connect(dest); n.start(now); n.stop(now + 0.04);
      break;
    }
    case 'lib_cymbal': {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
      const d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random()*2-1;
      const n = ctx.createBufferSource(); n.buffer = buf;
      const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 3000;
      const g = ctx.createGain(); g.gain.setValueAtTime(0.3, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      n.connect(f); f.connect(g); g.connect(dest); n.start(now); n.stop(now + 0.4);
      break;
    }
    case 'lib_wood': {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = 800;
      g.gain.setValueAtTime(0.35, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      o.connect(g); g.connect(dest); o.start(now); o.stop(now + 0.03);
      break;
    }
    case 'lib_triangle': {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = 2000;
      g.gain.setValueAtTime(0.25, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      o.connect(g); g.connect(dest); o.start(now); o.stop(now + 0.5);
      break;
    }
  }
}

// ── Tab System ─────────────────────────────────────────────
let _bbCurrentTab = 'beats';

window.bbSwitchTab = function(tab) {
  _bbCurrentTab = tab;
  const panels = ['beats', 'library', 'fx', 'save'];
  panels.forEach(p => {
    const el = document.getElementById('bbTab' + p.charAt(0).toUpperCase() + p.slice(1));
    if (el) el.style.display = p === tab ? '' : 'none';
  });
  document.querySelectorAll('.bb-tab-btn').forEach(b => {
    const active = b.dataset.bbtab === tab;
    b.style.background = active ? 'var(--gb-text)' : 'transparent';
    b.style.color = active ? 'var(--gb-bg)' : 'var(--gb-text)';
    b.style.borderColor = active ? 'var(--gb-text)' : '#333';
    b.classList.toggle('active', active);
  });
  if (tab === 'library') renderSampleBrowser();
};

// ── Sample Browser UI ─────────────────────────────────────
let _bbLibCategory = 'all';

window.toggleSampleBrowser = function() {
  bbSwitchTab('library');
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
  const rowData = new Array(16).fill(null); // velocity model: null or {vel: 1-127}
  const row = { name, color, data, grid: rowData, vol: 80, player: null };
  dynamicRows.push(row);
  // Initialize per-row division for this dynamic row
  const dynIdx = dynamicRows.length - 1;
  dynRowDivisions[dynIdx] = '16n';
  dynRowStepCounters[dynIdx] = 0;
  dynRowSubCounters[dynIdx] = 0;

  // Load sample player if it's a URL sample
  if (data.type === 'sample' && data.url) {
    try {
      const player = new Tone.Player({
        url: data.url,
        onload: () => { bbSetStatus(`✓ Loaded: ${name}`); },
        onerror: (e) => { console.warn('Player load error:', name, e); bbSetStatus(`⚠ Load failed: ${name}`); }
      });
      player.connect(bbMasterVol);
      player.volume.value = 0;
      row.player = player;
    } catch(e) {
      console.warn('Dynamic sample load:', e);
      bbSetStatus(`⚠ Failed: ${name}`);
    }
  }

  // Create per-row gain for volume control
  if (data.type === 'synth') {
    try {
      row.gain = new Tone.Volume(0).connect(bbMasterVol);
    } catch(e) {}
  }

  // Switch back to beats tab to show the new row
  bbSwitchTab('beats');

  // Add row to grid DOM
  const gridEl = document.getElementById('remixGrid');
  if (!gridEl) return;
  const r = INSTRUMENTS.length + dynamicRows.length - 1;
  const trackDiv = document.createElement('div');
  trackDiv.className = 'beat-boy-track dynamic-track';
  trackDiv.id = `dynamic-track-${dynIdx}`;

  // Per-row division buttons for dynamic tracks
  const divBtns = ['4','8','16','32'].map(d =>
    `<button class="bb-row-div-btn${d==='16'?' active':''}" data-div="${d}" onclick="setRowDivision(${r},'${d}n')" style="font-size:3px;padding:1px 2px;background:${d==='16'?'#0f0':'#0a0a0a'};color:${d==='16'?'#000':'#555'};border:1px solid ${d==='16'?'#0f0':'#333'};border-radius:2px;cursor:pointer;line-height:1;">${d}</button>`
  ).join('');

  trackDiv.innerHTML = `
    <div class="beat-boy-track-header">
      <span style="color:${color}">📦 ${name}</span>
      <div class="track-controls-row">
        <button onclick="bbRemoveDynamic(${dynIdx})" style="font-size:4px; padding:1px 3px; background:#300; color:#f44; border:1px solid #f44; border-radius:2px; cursor:pointer;">✕</button>
        <div class="bb-row-div-group">${divBtns}</div>
        <input type="range" class="track-vol-slider" min="0" max="100" value="80"
          oninput="bbSetDynamicVol(${dynIdx}, this.value)">
        <span id="dyn-vol-${dynIdx}" class="track-vol-label">80</span>
      </div>
    </div>
    <div class="beat-boy-steps" id="dynamic-steps-${dynIdx}"></div>
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
      // Cycle: null → soft(60) → med(90) → hard(127) → null
      const cur = rowData[c];
      let nextVel, nextClass;
      if (cur === null)           { nextVel = 60;  nextClass = 'vel-soft'; }
      else if (cur.vel <= 60)     { nextVel = 90;  nextClass = 'vel-med'; }
      else if (cur.vel <= 90)     { nextVel = 127; nextClass = 'vel-hard'; }
      else                        { nextVel = null; nextClass = null; }
      this.classList.remove('vel-soft','vel-med','vel-hard','active');
      if (nextVel !== null) {
        rowData[c] = {vel: nextVel};
        this.classList.add(nextClass);
        if (audioReady) bbTriggerDynamic(dynIdx, c, nextVel);
      } else {
        rowData[c] = null;
      }
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
  // Clean up division counters
  dynRowDivisions.splice(idx, 1);
  dynRowStepCounters.splice(idx, 1);
  dynRowSubCounters.splice(idx, 1);
  const el = document.getElementById(`dynamic-track-${idx}`);
  if (el) el.remove();
};

window.bbSetDynamicVol = function(idx, val) {
  if (dynamicRows[idx]) dynamicRows[idx].vol = parseInt(val);
  const label = document.getElementById(`dyn-vol-${idx}`);
  if (label) label.textContent = val;
};

function bbTriggerDynamic(idx, step, vel) {
  const row = dynamicRows[idx];
  if (!row) return;
  const vol = (row.vol / 100) * ((vel || 127) / 127);
  if (vol < 0.01) return;

  if (row.data.type === 'sample' && row.player) {
    if (!row.player.loaded) return; // skip if not loaded yet
    const now = Tone.now();
    try {
      row.player.volume.value = Tone.gainToDb(vol);
      row.player.stop(now);
      row.player.start(now);
    } catch(e) {}
  } else if (row.data.type === 'synth') {
    // Route through row's own gain for independent volume control
    if (row.gain) row.gain.volume.value = Tone.gainToDb(vol);
    bbPlaySynthSound(row.data.synth, row.gain || bbMasterVol);
  }
}

function renderSampleBrowser() {
  const browser = document.getElementById('bbSampleBrowser');
  if (!browser) return;

  const categories = Object.keys(BB_SAMPLE_LIB);
  const catButtons = [`<button onclick="bbLibFilter('all')" class="bb-lib-cat ${_bbLibCategory === 'all' ? 'active' : ''}" style="font-size:4px; padding:2px 5px; background:${_bbLibCategory === 'all' ? '#0ff' : '#0a0a0a'}; color:${_bbLibCategory === 'all' ? '#000' : '#aaa'}; border:1px solid ${_bbLibCategory === 'all' ? '#0ff' : '#333'}; border-radius:2px; cursor:pointer;">ALL</button>`];
  categories.forEach(cat => {
    const label = cat.replace(/^[^\w]*/, '').trim();
    const isActive = _bbLibCategory === cat;
    catButtons.push(`<button onclick="bbLibFilter('${cat.replace(/'/g, "\\'")}')" class="bb-lib-cat" style="font-size:4px; padding:2px 5px; background:${isActive ? '#0ff' : '#0a0a0a'}; color:${isActive ? '#000' : '#aaa'}; border:1px solid ${isActive ? '#0ff' : '#333'}; border-radius:2px; cursor:pointer;">${label}</button>`);
  });

  let html = `<div style="display:flex; gap:2px; flex-wrap:wrap; margin-bottom:5px;">${catButtons.join('')}</div>`;

  const catsToShow = _bbLibCategory === 'all' ? categories : [_bbLibCategory];

  for (const category of catsToShow) {
    const samples = BB_SAMPLE_LIB[category];
    if (!samples) continue;
    html += `<div style="margin-bottom:5px;">`;
    html += `<div style="font-size:4.5px; color:#0ff; font-weight:bold; margin-bottom:3px; border-bottom:1px solid #222; padding-bottom:2px;">${category}</div>`;
    html += `<div style="display:flex; flex-wrap:wrap; gap:2px;">`;
    for (const [name, data] of Object.entries(samples)) {
      const isSynth = data.type === 'synth';
      const tag = isSynth ? ' ♪' : ' ♪';
      html += `<button onclick="if (!this.dataset.touchHandled) bbPreviewSample('${name.replace(/'/g, "\\'")}', ${JSON.stringify(data).replace(/"/g, '&quot;')}); this.dataset.touchHandled=''; event.stopPropagation();"
        ontouchend="bbHandleSampleTouch(event, this, '${name.replace(/'/g, "\\'")}', ${JSON.stringify(data).replace(/"/g, '&quot;')})"
        ondblclick="bbAddSample('${name.replace(/'/g, "\\'")}', ${JSON.stringify(data).replace(/"/g, '&quot;')})"
        style="font-size:4.5px; padding:2px 4px; background:#111; color:#ccc; border:1px solid #333; border-radius:2px; cursor:pointer;"
        title="Tap = preview, double-tap = add row">${name}${tag}</button>`;
    }
    html += `</div></div>`;
  }

  browser.innerHTML = html;
}

window.bbLibFilter = function(cat) {
  _bbLibCategory = cat;
  renderSampleBrowser();
};

window.bbHandleSampleTouch = function(event, button, name, data) {
  event.preventDefault();
  event.stopPropagation();
  button.dataset.touchHandled = '1';
  const now = Date.now();
  const lastTap = Number(button.dataset.lastTap || 0);
  button.dataset.lastTap = now;

  if(now - lastTap < 400) {
    button.dataset.lastTap = '0';
    bbAddSample(name, data);
  } else {
    bbPreviewSample(name, data);
  }
};

// Preview a sample (for the browser)
window.bbPreviewSample = function(name, data) {
  if (!audioReady) return;
  if (data.type === 'sample' && data.url) {
    try {
      const player = new Tone.Player({
        url: data.url,
        onload: () => { try { player.start(); } catch(e) {} },
        onerror: (e) => { console.warn('Preview load failed:', name, e); }
      });
      player.volume.value = -6;
      player.toDestination();
      setTimeout(() => { try { player.dispose(); } catch(e) {} }, 5000);
    } catch(e) { console.warn('Preview error:', e); }
  } else if (data.type === 'synth' && data.synth) {
    bbPlaySynthSound(data.synth);
  }
};

function bbTrigger(r, step, vel) {
  const trackVol = (trackVols[r] ?? 80) / 100;
  if (trackVol === 0) return;
  // vel is 1-127 from grid, default 127
  const velocity = (vel || 127) / 127;
  const vol = trackVol * velocity;
  if (vol < 0.01) return;

  // Fallback mode: pure Web Audio synthesis
  if (!_bbFallbackCtx) {
    if (!bbTrackGains[r]) return;
    bbTrackGains[r].volume.value = Tone.gainToDb(vol);
  }

  const now = _bbFallbackCtx ? _bbFallbackCtx.currentTime : Tone.now();

  if (r <= 4) {
    // Try sample-based kit first, fall back to synth
    if (_bbFallbackCtx) {
      _bbFallbackSynth(r, now, vol);
      return;
    }
    const names = ['kick','snare','hihat','tom1','tom2'];
    const name  = names[r];
    if (bbDrumPlayers) {
      try {
        const p = bbDrumPlayers.player(name);
        if (p && p.loaded) {
          bbTrackGains[r].volume.value = Tone.gainToDb(vol);
          p.stop(now); p.start(now);
          return;
        }
      } catch(e) {}
    }
    // Fallback: use the library synth sounds for drum channels
    const fallbackNames = ['lib_kick808','lib_snare808','lib_hh808','lib_kicklinn','lib_snarelinn'];
    bbPlaySynthSound(fallbackNames[r], bbTrackGains[r]);

  } else if (r === 5 && bbBassSynth) {
    const melody = bbMelodyStyle === 'afrobeat' ? AFROBEAT_NOTES[bbScale] : null;
    bbBassSynth.volume.value = Tone.gainToDb(vol);
    bbBassSynth.triggerAttackRelease((melody?.bass || BASS_NOTES)[step % 8], '8n', now);

  } else if (r === 6) {
    const melody = bbMelodyStyle === 'afrobeat' ? AFROBEAT_NOTES[bbScale] : null;
    const note = (melody?.lead || LEAD_NOTES)[step % 8];
    // Try sampler first, fall back to synth if note not loaded
    if (bbPiano && bbPiano.loaded) {
      try { bbPiano.triggerAttackRelease(note, '8n', now); } catch(e) {
        // Note not in sampler mapping — use synth fallback
        if (bbPianoSynth) {
          bbPianoSynth.volume.value = Tone.gainToDb(vol);
          bbPianoSynth.triggerAttackRelease(note, '8n', now);
        }
      }
    } else if (bbPianoSynth) {
      bbPianoSynth.volume.value = Tone.gainToDb(vol);
      bbPianoSynth.triggerAttackRelease(note, '8n', now);
    }

  } else if (r === 7 && bbChordSynth) {
    const melody = bbMelodyStyle === 'afrobeat' ? AFROBEAT_NOTES[bbScale] : null;
    const chords = melody?.chords || CHORD_NOTES;
    bbChordSynth.volume.value = Tone.gainToDb(vol);
    bbChordSynth.triggerAttackRelease(chords[step % chords.length], '4n', now);
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
  rowDivisions   = INSTRUMENTS.map(() => '16n');
  rowStepCounters = INSTRUMENTS.map(() => 0);
  rowSubCounters  = INSTRUMENTS.map(() => 0);
  isRemixPlaying = false;
  remixStep      = 0;
  masterTick     = 0;
  if (remixInterval) clearTimeout(remixInterval);

  const bpmEl = document.getElementById('remixBpmDisplay');
  if (bpmEl) bpmEl.textContent = `${remixBPM} BPM`;

  INSTRUMENTS.forEach((inst, r) => {
    const rowData  = new Array(16).fill(null); // null = off, {vel: 1-127} = on
    const trackDiv = document.createElement('div');
    trackDiv.className = 'beat-boy-track';

    // Per-row division buttons: 4/8/16/32
    const divBtns = ['4','8','16','32'].map(d =>
      `<button class="bb-row-div-btn${d==='16'?' active':''}" data-div="${d}" onclick="setRowDivision(${r},'${d}n')" style="font-size:3px;padding:1px 2px;background:${d==='16'?'#0f0':'#0a0a0a'};color:${d==='16'?'#000':'#555'};border:1px solid ${d==='16'?'#0f0':'#333'};border-radius:2px;cursor:pointer;line-height:1;">${d}</button>`
    ).join('');

    trackDiv.innerHTML = `
      <div class="beat-boy-track-header">
        <span style="color:${inst.color}">${inst.emoji} ${inst.name}</span>
        <div class="track-controls-row">
          <span class="bb-key-hint">[${inst.key}]</span>
          <div class="bb-row-div-group">${divBtns}</div>
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
        // Cycle: null → soft(60) → med(90) → hard(127) → null
        const cur = rowData[c];
        let nextVel, nextClass;
        if (cur === null)           { nextVel = 60;  nextClass = 'vel-soft'; }
        else if (cur.vel <= 60)     { nextVel = 90;  nextClass = 'vel-med'; }
        else if (cur.vel <= 90)     { nextVel = 127; nextClass = 'vel-hard'; }
        else                        { nextVel = null; nextClass = null; }

        // Remove old classes
        this.classList.remove('vel-soft','vel-med','vel-hard','active');

        if (nextVel !== null) {
          rowData[c] = {vel: nextVel};
          this.classList.add(nextClass);
          if (audioReady) bbTrigger(r, c);
        } else {
          rowData[c] = null;
        }
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
    clearTimeout(remixInterval);
    cancelAnimationFrame(vizAnimFrame);
    if (btn) { btn.textContent = '▶ PLAY'; btn.style.background = '#0f0'; btn.style.color = '#000'; }
    document.querySelectorAll('.beat-boy-step').forEach(s => s.classList.remove('highlight'));
  } else {
    // Reset all counters
    remixStep = 0;
    masterTick = 0;
    rowStepCounters = INSTRUMENTS.map(() => 0);
    rowSubCounters  = INSTRUMENTS.map(() => 0);
    dynRowStepCounters = dynamicRows.map(() => 0);
    dynRowSubCounters  = dynamicRows.map(() => 0);
    // Use setTimeout chain with swing support
    _bbRestartInterval();
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
    _bbRestartInterval();
  }
  if (typeof sounds !== 'undefined') sounds.click?.();
};

window.updateRemixVol = function(val) {
  remixMasterVol = val / 100;
  if (bbMasterVol) bbMasterVol.volume.value = Tone.gainToDb(remixMasterVol);
  if (_bbFallbackMasterGain) _bbFallbackMasterGain.gain.value = remixMasterVol;
  const el = document.getElementById('remixVolLabel');
  if (el) el.textContent = `${val}%`;
};

window.updateTrackVol = function(r, val) {
  trackVols[r] = parseInt(val);
  const el = document.getElementById(`track-vol-${r}`);
  if (el) el.textContent = val;
};

// Per-row division skip factors
const DIV_SKIP = { '4n': 8, '8n': 4, '16n': 2, '32n': 1, '8n.': 3 };
// 4n = every 8 master ticks (32nd note master), 8n = every 4, 16n = every 2, 32n = every 1

// Helper: get the finest division across all active rows
function _bbGetFinestDivision() {
  let finest = '16n';
  const order = ['32n','16n','8n','4n'];
  for (let r = 0; r < INSTRUMENTS.length; r++) {
    const d = rowDivisions[r] || '16n';
    if (order.indexOf(d) < order.indexOf(finest)) finest = d;
  }
  return finest;
}

function bbPlayStep() {
  // This is called on every master tick (32nd note resolution)
  masterTick++;

  // Show the overall position (1-16 based on finest 16n row or master position)
  const displayStep = Math.floor(masterTick / 2) % 16; // 2 master ticks per 16th
  const ind = document.getElementById('remixStepIndicator');
  if (ind) ind.textContent = `STEP ${displayStep + 1}`;

  // Highlight the current step column across ALL rows (based on master position)
  document.querySelectorAll('.beat-boy-step').forEach(s => {
    s.classList.toggle('highlight', parseInt(s.dataset.c) === displayStep);
  });

  // Trigger fixed tracks — each row advances based on its own division
  for (let r = 0; r < INSTRUMENTS.length; r++) {
    rowSubCounters[r]++;
    const skip = DIV_SKIP[rowDivisions[r]] || 2;
    if (rowSubCounters[r] >= skip) {
      rowSubCounters[r] = 0;
      const step = rowStepCounters[r] % 16;
      const cell = remixGrid[r]?.[step];
      if (cell && cell.vel) {
        try { bbTrigger(r, step, cell.vel); } catch(e) { console.warn('bbTrigger error:', r, e); }
      }
      rowStepCounters[r]++;
    }
  }

  // Trigger dynamic sample rows
  for (let i = 0; i < dynamicRows.length; i++) {
    if (!dynRowSubCounters[i]) dynRowSubCounters[i] = 0;
    if (!dynRowStepCounters[i]) dynRowStepCounters[i] = 0;
    dynRowSubCounters[i]++;
    const skip = DIV_SKIP[dynRowDivisions[i]] || 2;
    if (dynRowSubCounters[i] >= skip) {
      dynRowSubCounters[i] = 0;
      const step = dynRowStepCounters[i] % 16;
      const cell = dynamicRows[i].grid[step];
      if (cell && cell.vel) {
        try { bbTriggerDynamic(i, step, cell.vel); } catch(e) { console.warn('bbTriggerDynamic error:', i, e); }
      }
      dynRowStepCounters[i]++;
    }
  }
}

// Restart interval with current BPM — always runs at 32nd note resolution
// Per-row division handled inside bbPlayStep() via skip counters
let _bbSwingEven = true;

function _bbRestartInterval() {
  clearTimeout(remixInterval);
  _bbSwingEven = true;
  // Master clock: always 32nd notes (1/4 of 8th note = 1/16 of beat / 2)
  const baseMs = (60000 / remixBPM) / 8; // 32nd note interval
  const swingAmt = remixSwing / 100 * baseMs * 0.4;
  function tick() {
    bbPlayStep();
    _bbSwingEven = !_bbSwingEven;
    // Swing: delay odd steps slightly (or even steps negatively)
    const swingDelay = _bbSwingEven ? swingAmt : -swingAmt;
    remixInterval = setTimeout(tick, Math.max(10, baseMs + swingDelay));
  }
  remixInterval = setTimeout(tick, baseMs);
}

// ── Swing ─────────────────────────────────────────────────

window.setSwing = function(val) {
  remixSwing = Math.max(0, Math.min(100, parseInt(val)));
  const el = document.getElementById('swingLabel');
  if (el) el.textContent = `${remixSwing}%`;
  if (isRemixPlaying) _bbRestartInterval();
  if (typeof sounds !== 'undefined') sounds.click?.();
};

// ── Note Division ─────────────────────────────────────────

// Convert division to a multiplier for the interval timing
function _bbDivMultiplier() {
  if (remixDivision === '8n') return 2;    // 8th = half speed
  if (remixDivision === '32n') return 0.5; // 32nd = double speed
  return 1; // 16n = normal
}

window.setDivision = function(div) {
  remixDivision = div;
  document.querySelectorAll('.bb-div-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.div === div);
  });
  if (isRemixPlaying) {
    _bbRestartInterval();
  }
  if (typeof sounds !== 'undefined') sounds.click?.();
};

// ── Per-Row Division ──────────────────────────────────────

window.setRowDivision = function(trackIdx, div) {
  rowDivisions[trackIdx] = div;
  // Reset that row's counter so it aligns to the new division
  rowStepCounters[trackIdx] = 0;
  rowSubCounters[trackIdx]  = 0;
  // Update button UI in this track's div group
  const trackEl = document.getElementById(`track-${trackIdx}`);
  if (trackEl) {
    const track = trackEl.closest('.beat-boy-track');
    if (track) {
      track.querySelectorAll('.bb-row-div-btn').forEach(b => {
        const isActive = b.dataset.div === div.replace('n','');
        b.classList.toggle('active', isActive);
        b.style.background = isActive ? '#0f0' : '#0a0a0a';
        b.style.color = isActive ? '#000' : '#555';
        b.style.borderColor = isActive ? '#0f0' : '#333';
      });
    }
  }
  if (typeof sounds !== 'undefined') sounds.click?.();
};

// ── Kit Switch ────────────────────────────────────────────

window.switchKit = async function(kitFolder) {
  if (!audioReady) await bbInitAudio();
  currentKit = kitFolder;
  await bbLoadKit(kitFolder);
  const sel = document.getElementById('bbKitSelect');
  if (sel) sel.value = kitFolder;
  if (typeof sounds !== 'undefined') sounds.click?.();
};

// ── Preset Load ───────────────────────────────────────────

window.loadPreset = function(name) {
  const pattern = PRESETS[name];
  if (!pattern) return;
  bbMelodyStyle = name === 'AFROBEAT' ? 'afrobeat' : 'default';
  if (name === 'AFROBEAT') remixBPM = 108;
  const bpmEl = document.getElementById('remixBpmDisplay');
  if (bpmEl) bpmEl.textContent = `${remixBPM} BPM`;
  document.querySelectorAll('.beat-boy-step').forEach(s => {
    s.classList.remove('active','vel-soft','vel-med','vel-hard');
  });
  pattern.forEach((row, r) => {
    if (!remixGrid[r]) return;
    row.forEach((val, c) => {
      remixGrid[r][c] = val; // null or {vel: 60|90|127}
      const el = document.querySelector(`.beat-boy-step[data-r="${r}"][data-c="${c}"]`);
      if (el) {
        if (val && val.vel) {
          el.classList.add('active');
          if (val.vel <= 60)  el.classList.add('vel-soft');
          else if (val.vel <= 90) el.classList.add('vel-med');
          else el.classList.add('vel-hard');
        }
      }
    });
  });
  document.querySelectorAll('.bb-preset-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.preset === name);
  });
  if (typeof sounds !== 'undefined') sounds.click?.();
};

window.setBbScale = function(scale) {
  if (AFROBEAT_NOTES[scale]) bbScale = scale;
  if (typeof sounds !== 'undefined') sounds.click?.();
};

window.bbGenerateVariation = function() {
  if (!remixGrid.length) return;
  const velLevels = [60, 90, 127];
  remixGrid.forEach((row, r) => {
    row.forEach((_, c) => {
      const prob = r === 0 ? 0.72 : r === 2 ? 0.5 : 0.32;
      const el = document.querySelector(`.beat-boy-step[data-r="${r}"][data-c="${c}"]`);
      if (el) el.classList.remove('active','vel-soft','vel-med','vel-hard');
      if (Math.random() < prob) {
        const vel = velLevels[Math.floor(Math.random() * velLevels.length)];
        row[c] = {vel};
        if (el) {
          el.classList.add('active');
          if (vel <= 60)  el.classList.add('vel-soft');
          else if (vel <= 90) el.classList.add('vel-med');
          else el.classList.add('vel-hard');
        }
      } else {
        row[c] = null;
      }
    });
  });
  document.querySelectorAll('.bb-preset-btn').forEach(button => button.classList.remove('active'));
  if (typeof sounds !== 'undefined') sounds.coin?.();
};

window.bbToggleRecording = async function() {
  if (!bbRecorder) {
    if (!audioReady) await bbInitAudio();
    if (!bbRecorder) return;
  }
  const button = document.getElementById('bbRecordBtn');
  const status = document.getElementById('bbRecordStatus');
  const exportButton = document.getElementById('bbExportBtn');
  if (bbRecording) {
    bbRecordingBlob = await bbRecorder.stop();
    bbRecording = false;
    if (button) button.textContent = '● REC';
    if (status) status.style.display = 'none';
    if (exportButton) exportButton.disabled = false;
  } else {
    await Tone.start();
    bbRecorder.start();
    bbRecording = true;
    if (button) button.textContent = '■ STOP';
    if (status) status.style.display = 'block';
    if (exportButton) exportButton.disabled = true;
  }
};

window.bbExportRecording = function() {
  if (!bbRecordingBlob) return;
  const link = document.createElement('a');
  link.href = URL.createObjectURL(bbRecordingBlob);
  link.download = `beat-boy-${Date.now()}.wav`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
};

// ── Clear ─────────────────────────────────────────────────

window.clearRemix = function() {
  document.querySelectorAll('.beat-boy-step').forEach(s => {
    s.classList.remove('active','vel-soft','vel-med','vel-hard');
  });
  remixGrid.forEach(row => row.fill(null));
  // Also clear imported library rows
  dynamicRows.forEach(row => row.grid.fill(null));
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
    grid: remixGrid.map(r => r.map(v => v ? v : null)),
    bpm: remixBPM,
    kit: currentKit,
    swing: remixSwing,
    division: remixDivision,
    trackVols: [...trackVols],
    rowDivisions: [...rowDivisions],
    eqSettings: bbTrackEQSettings.map(s => ({...s})),
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
  document.querySelectorAll('.beat-boy-step').forEach(s => {
    s.classList.remove('active','vel-soft','vel-med','vel-hard');
  });
  (p.grid || []).forEach((row, r) => {
    if (!remixGrid[r]) return;
    row.forEach((val, c) => {
      // Support both old format (0/1) and new format (null/{vel})
      if (val === null || val === 0 || val === undefined) {
        remixGrid[r][c] = null;
      } else if (typeof val === 'number') {
        remixGrid[r][c] = {vel: val};
      } else if (val.vel) {
        remixGrid[r][c] = val;
      }
      const cell = remixGrid[r][c];
      const el = document.querySelector(`.beat-boy-step[data-r="${r}"][data-c="${c}"]`);
      if (el && cell) {
        el.classList.add('active');
        if (cell.vel <= 60)  el.classList.add('vel-soft');
        else if (cell.vel <= 90) el.classList.add('vel-med');
        else el.classList.add('vel-hard');
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
  // Restore per-row divisions
  if (p.rowDivisions) {
    p.rowDivisions.forEach((d, i) => {
      if (d && rowDivisions[i] !== undefined) {
        rowDivisions[i] = d;
        // Update the button UI
        const trackDiv = document.querySelector(`.beat-boy-track`)?.children[i];
        if (trackDiv) {
          trackDiv.querySelectorAll('.bb-row-div-btn').forEach(b => {
            const isActive = b.dataset.div === d.replace('n','');
            b.classList.toggle('active', isActive);
            b.style.background = isActive ? '#0f0' : '#0a0a0a';
            b.style.color = isActive ? '#000' : '#555';
            b.style.borderColor = isActive ? '#0f0' : '#333';
          });
        }
      }
    });
  }

  // Restore EQ settings
  if (p.eqSettings) {
    p.eqSettings.forEach((s, i) => {
      if (bbTrackEQSettings[i]) {
        bbTrackEQSettings[i] = {...s};
        // Apply to audio nodes
        bbSetTrackEQ(i, 'bass', s.bass);
        bbSetTrackEQ(i, 'mid', s.mid);
        bbSetTrackEQ(i, 'treble', s.treble);
        bbSetTrackEQ(i, 'compress', s.compress);
      }
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
  if (_bbNativeDelayGain) _bbNativeDelayGain.gain.value = wet;
  const el = document.getElementById('delayLabel');
  if (el) el.textContent = `${val}%`;
};

window.bbSetDelayTime = function(time) {
  if (bbDelay) bbDelay.delayTime.value = time;
  // Also set native delay — convert Tone.js time to seconds
  if (_bbNativeDelay) {
    const bpm = remixBPM;
    const timeMap = { '4n': 60000/bpm/1000*2, '8n': 60000/bpm/1000, '8n.': 60000/bpm/1000*1.5, '16n': 60000/bpm/1000/2 };
    _bbNativeDelay.delayTime.value = timeMap[time] || 60000/bpm/1000;
  }
  document.querySelectorAll('.bb-delay-time-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.time === time);
  });
  if (typeof sounds !== 'undefined') sounds.click?.();
};

window.bbSetFilter = function(freq) {
  if (bbFilter) bbFilter.frequency.value = parseInt(freq);
  if (_bbNativeFilter) _bbNativeFilter.frequency.value = parseInt(freq);
  const el = document.getElementById('filterLabel');
  if (el) el.textContent = freq >= 1000 ? `${(freq/1000).toFixed(1)}k` : `${freq}Hz`;
};

window.bbSetFilterType = function(type) {
  if (bbFilter) bbFilter.type = type;
  if (_bbNativeFilter) _bbNativeFilter.type = type;
  document.querySelectorAll('.bb-filter-type-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.ftype === type);
  });
  if (typeof sounds !== 'undefined') sounds.click?.();
};

window.bbSetReverb = function(val) {
  const wet = parseInt(val) / 100;
  if (bbReverbGain) bbReverbGain.gain.value = wet;
  if (_bbNativeReverbGain) _bbNativeReverbGain.gain.value = wet;
  const el = document.getElementById('reverbLabel');
  if (el) el.textContent = `${val}%`;
};

// ── Per-Track EQ Controls ────────────────────────────────

function bbRenderTrackEQ() {
  const list = document.getElementById('bbTrackEQList');
  if (!list) return;
  list.innerHTML = INSTRUMENTS.map((inst, i) => {
    const s = bbTrackEQSettings[i];
    return `<div style="display:flex;align-items:center;gap:2px;font-size:4px;">
      <span style="color:${inst.color};min-width:18px;">${inst.emoji}</span>
      <input type="range" min="-12" max="12" value="${s.bass}" step="1"
        oninput="bbSetTrackEQ(${i},'bass',this.value)" style="width:28px;height:2px;">
      <input type="range" min="-12" max="12" value="${s.mid}" step="1"
        oninput="bbSetTrackEQ(${i},'mid',this.value)" style="width:28px;height:2px;">
      <input type="range" min="-12" max="12" value="${s.treble}" step="1"
        oninput="bbSetTrackEQ(${i},'treble',this.value)" style="width:28px;height:2px;">
      <input type="range" min="0" max="12" value="${s.compress}" step="1"
        oninput="bbSetTrackEQ(${i},'compress',this.value)" style="width:28px;height:2px;">
    </div>`;
  }).join('');
}

window.bbSetTrackEQ = function(trackIdx, param, val) {
  const v = parseInt(val);
  bbTrackEQSettings[trackIdx][param] = v;

  // Tone.js EQ chain
  const eq = bbTrackEQ[trackIdx];
  if (eq) {
    if (param === 'bass')    eq.low.gain.value = v;
    if (param === 'mid')     eq.mid.gain.value = v;
    if (param === 'treble')  eq.hi.gain.value = v;
    if (param === 'compress') {
      // ratio: 0dB = 1:1, 12dB = 20:1
      eq.comp.threshold.value = -20;
      eq.comp.ratio.value = 1 + (v / 12) * 19;
    }
  }

  // Native EQ chain
  const neq = _bbNativeEQ[trackIdx];
  if (neq) {
    if (param === 'bass')    neq.low.gain.value = v;
    if (param === 'mid')     neq.mid.gain.value = v;
    if (param === 'treble')  neq.hi.gain.value = v;
    if (param === 'compress') {
      neq.comp.threshold.value = -20;
      neq.comp.ratio.value = 1 + (v / 12) * 19;
    }
  }
};

// Call when FX tab opens
const _bbOrigSwitchTab = window.bbSwitchTab;
window.bbSwitchTab = function(tab) {
  _bbOrigSwitchTab(tab);
  if (tab === 'fx') bbRenderTrackEQ();
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
        pad.classList.remove('vel-soft','vel-med','vel-hard');
        pad.classList.add('active','vel-hard');
        remixGrid[r][step] = {vel: 127};
      }
      try { bbTrigger(r, step, 127); } catch(e) { console.warn('Key trigger error:', e); }
    }

    // Spacebar = play/stop
    if (e.code === 'Space' && !e.repeat) {
      e.preventDefault();
      window.toggleRemixPlay();
    }
  };

  document.addEventListener('keydown', window._bbKeyHandler);

  // Web MIDI API
  if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess().then(bbSetupMIDI).catch(() => {});
  }
}

function bbSetupMIDI(midiAccess) {
  midiAccess.inputs.forEach(input => {
    input.onmidimessage = function(msg) {
      if (!audioReady) return;
      const [status, note, vel] = msg.data;
      // Note On (0x90–0x9F) with velocity > 0
      if ((status & 0xF0) === 0x90 && vel > 0) {
        const track = note % INSTRUMENTS.length;
        bbTrigger(track, remixStep, vel);
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
  if (!canvas) return;
  const activeAnalyser = bbAnalyser || _bbFallbackAnalyser;
  if (!activeAnalyser) return;
  const ctx = canvas.getContext('2d');
  const W   = canvas.width;
  const H   = canvas.height;

  const draw = () => {
    vizAnimFrame = requestAnimationFrame(draw);

    let data;
    if (bbAnalyser) {
      // Tone.js analyser
      data = bbAnalyser.getValue();
    } else if (_bbFallbackAnalyser) {
      // Fallback: raw Web Audio analyser
      const raw = new Float32Array(_bbFallbackAnalyser.frequencyBinCount);
      _bbFallbackAnalyser.getFloatTimeDomainData(raw);
      data = raw;
    } else return;

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
  if (remixInterval) { clearTimeout(remixInterval); remixInterval = null; }
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
      try { bbTrigger(r, remixStep); } catch(e) { console.warn('Pad trigger error:', e); }

      // Visual flash
      pad.classList.add('bb-pad-flash');
      setTimeout(() => pad.classList.remove('bb-pad-flash'), 150);

      // If playing, also record into the current step
      if (isRemixPlaying && remixGrid[r]) {
        remixGrid[r][remixStep] = {vel: 127};
        const gridPad = document.querySelector(`.beat-boy-step[data-r="${r}"][data-c="${remixStep}"]`);
        if (gridPad) {
          gridPad.classList.remove('vel-soft','vel-med','vel-hard');
          gridPad.classList.add('active','vel-hard');
        }
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
