// ================================================================
//  CREATIVE HUB — PULSE · SYNTH · FLOW
//  Three interconnected creative apps for GameBoy OS
// ================================================================

// ── Shared State ─────────────────────────────────────────────────
const creativeHub = {
  pulse: { articles: [], saved: [], category: 'all', loading: false },
  synth: { ctx: null, nodes: {}, pattern: [], bpm: 120, preset: 'CHILL', isPlaying: false },
  flow: { readings: [], sounds: [], moods: [], stats: {} },
  getArticles() { return this.pulse.saved; },
  getSounds() { return this.synth.pattern; },
  addReading(article) {
    this.flow.readings.unshift({ ...article, timestamp: Date.now() });
    if (this.flow.readings.length > 50) this.flow.readings.pop();
  },
  addSound(preset, pattern) {
    this.flow.sounds.unshift({ preset, pattern: [...pattern], timestamp: Date.now() });
    if (this.flow.sounds.length > 20) this.flow.sounds.pop();
  },
  trackMood(mood) {
    this.flow.moods.push({ mood, timestamp: Date.now() });
    if (this.flow.moods.length > 100) this.flow.moods.shift();
  }
};

// ── PULSE: Creative Culture Feed ────────────────────────────────
const PULSE_SOURCES = [
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', cat: 'tech' },
  { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', cat: 'tech' },
  { name: 'Hacker News', url: 'https://hnrss.org/frontpage?points=100', cat: 'tech' },
  { name: 'CreativeBloq', url: 'https://www.creativebloq.com/feed', cat: 'design' },
  { name: 'Pitchfork', url: 'https://pitchfork.com/rss/reviews/best/', cat: 'music' },
  { name: 'ResidentAdvisor', url: 'https://ra.co/rss/reviews', cat: 'music' },
  { name: 'SmashingMag', url: 'https://www.smashingmagazine.com/feed/', cat: 'design' },
  { name: 'GitHub Blog', url: 'https://github.blog/feed/', cat: 'tech' },
  { name: 'Spotify Newsroom', url: 'https://newsroom.spotify.com/feed/', cat: 'music' },
  { name: 'AIGA', url: 'https://www.aigadesign.org/rss.xml', cat: 'design' }
];

const CORS_PROXY = 'https://api.rss2json.com/v1/api.json?rss_url=';

function initPulse() {
  const container = document.getElementById('pulseContent');
  if (!container) return;
  renderPulseUI(container);
  if (creativeHub.pulse.articles.length === 0) loadPulseFeed();
}

function renderPulseUI(container) {
  container.innerHTML = `
    <div style="padding:6px; display:flex; flex-direction:column; height:100%; box-sizing:border-box;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
        <span style="font-size:9px; font-weight:bold; color:var(--gb-text);">⚡ PULSE</span>
        <span style="font-size:5px; opacity:0.6;">${creativeHub.pulse.saved.length} SAVED</span>
      </div>
      <div style="display:flex; gap:3px; margin-bottom:4px; flex-wrap:wrap;">
        ${['all','tech','music','design'].map(c => `
          <button onclick="filterPulse('${c}')" style="font-size:5px; padding:3px 6px; ${creativeHub.pulse.category === c ? 'background:var(--gb-text);color:var(--gb-bg);' : ''}">${c.toUpperCase()}</button>
        `).join('')}
        <button onclick="loadPulseFeed()" style="font-size:5px; padding:3px 6px; margin-left:auto;">↻ REFRESH</button>
      </div>
      <div id="pulseFeed" style="flex:1; overflow-y:auto; font-size:6px;">
        <div style="text-align:center; padding:20px; opacity:0.5;">LOADING FEED...</div>
      </div>
    </div>
  `;
}

async function loadPulseFeed() {
  creativeHub.pulse.loading = true;
  const feed = document.getElementById('pulseFeed');
  if (!feed) return;
  feed.innerHTML = '<div style="text-align:center; padding:15px; opacity:0.5;">SCANNING FREQUENCIES...</div>';

  const allArticles = [];
  const promises = PULSE_SOURCES.map(async (src) => {
    try {
      const res = await fetch(CORS_PROXY + encodeURIComponent(src.url));
      const data = await res.json();
      if (data.status === 'ok' && data.items) {
        data.items.slice(0, 5).forEach(item => {
          allArticles.push({
            title: item.title || 'UNTITLED',
            link: item.link,
            source: src.name,
            category: src.cat,
            date: item.pubDate ? new Date(item.pubDate) : new Date(),
            snippet: (item.description || '').replace(/<[^>]*>/g, '').slice(0, 120),
            saved: creativeHub.pulse.saved.some(s => s.link === item.link)
          });
        });
      }
    } catch (e) { /* skip failed sources */ }
  });

  await Promise.allSettled(promises);
  allArticles.sort((a, b) => b.date - a.date);
  creativeHub.pulse.articles = allArticles;
  creativeHub.pulse.loading = false;
  renderPulseArticles();
}

function renderPulseArticles() {
  const feed = document.getElementById('pulseFeed');
  if (!feed) return;

  let articles = creativeHub.pulse.articles;
  if (creativeHub.pulse.category !== 'all') {
    articles = articles.filter(a => a.category === creativeHub.pulse.category);
  }

  if (articles.length === 0) {
    feed.innerHTML = '<div style="text-align:center; padding:20px; opacity:0.5;">NO SIGNAL FOUND</div>';
    return;
  }

  feed.innerHTML = articles.slice(0, 30).map((a, i) => `
    <div onclick="openPulseArticle(${i})" style="padding:5px; margin-bottom:3px; border:1px solid var(--gb-text); border-radius:3px; cursor:pointer; ${a.saved ? 'background:rgba(15,56,15,0.15);' : ''}">
      <div style="display:flex; justify-content:space-between; align-items:start;">
        <span style="flex:1; font-weight:bold; line-height:1.3;">${a.title.toUpperCase()}</span>
        <span onclick="event.stopPropagation(); toggleSavePulse(${i})" style="cursor:pointer; margin-left:4px; font-size:7px;">${a.saved ? '★' : '☆'}</span>
      </div>
      <div style="display:flex; gap:4px; margin-top:2px; opacity:0.6;">
        <span>${a.source}</span>
        <span>·</span>
        <span>${a.category.toUpperCase()}</span>
      </div>
      <div style="opacity:0.7; margin-top:2px; line-height:1.3;">${a.snippet}...</div>
    </div>
  `).join('');
}

function filterPulse(cat) {
  creativeHub.pulse.category = cat;
  renderPulseArticles();
}

function toggleSavePulse(idx) {
  let articles = creativeHub.pulse.articles;
  if (creativeHub.pulse.category !== 'all') {
    articles = articles.filter(a => a.category === creativeHub.pulse.category);
  }
  const article = articles[idx];
  if (!article) return;

  const savedIdx = creativeHub.pulse.saved.findIndex(s => s.link === article.link);
  if (savedIdx >= 0) {
    creativeHub.pulse.saved.splice(savedIdx, 1);
    article.saved = false;
  } else {
    article.saved = true;
    creativeHub.pulse.saved.push(article);
    creativeHub.addReading(article);
    if (window.sounds) sounds.click();
  }
  renderPulseArticles();
  const savedEl = document.querySelector('#pulseContent span[style*="SAVED"]');
  if (savedEl) savedEl.textContent = creativeHub.pulse.saved.length + ' SAVED';
}

function openPulseArticle(idx) {
  let articles = creativeHub.pulse.articles;
  if (creativeHub.pulse.category !== 'all') {
    articles = articles.filter(a => a.category === creativeHub.pulse.category);
  }
  const article = articles[idx];
  if (!article) return;
  window.open(article.link, '_blank');
}

// ── SYNTH: Web Audio Synthesizer ────────────────────────────────
const SYNTH_WAVES = ['sine', 'square', 'sawtooth', 'triangle'];
const SYNTH_KEYS = ['C4','D4','E4','F4','G4','A4','B4','C5'];
const SYNTH_FREQS = { C4:261.63, D4:293.66, E4:329.63, F4:349.23, G4:392.00, A4:440.00, B4:493.88, C5:523.25 };

const SYNTH_PRESETS = {
  CHILL:     { wave:'sine',     attack:0.1, decay:0.3, sustain:0.6, release:0.5, filter:2000, delay:0.3, reverb:0.4 },
  AGGRESSIVE:{ wave:'sawtooth', attack:0.01,decay:0.1, sustain:0.8, release:0.1, filter:4000, delay:0.1, reverb:0.2 },
  DREAMY:    { wave:'triangle', attack:0.3, decay:0.5, sustain:0.4, release:1.0, filter:1500, delay:0.5, reverb:0.7 },
  BASS:      { wave:'square',   attack:0.01,decay:0.2, sustain:0.7, release:0.2, filter:800,  delay:0.1, reverb:0.1 },
  PULSE:     { wave:'square',   attack:0.05,decay:0.15,sustain:0.5, release:0.3, filter:3000, delay:0.4, reverb:0.3 },
  FM:        { wave:'sine',     attack:0.02,decay:0.4, sustain:0.3, release:0.8, filter:5000, delay:0.2, reverb:0.5 }
};

let synthCtx = null;
let synthMaster = null;
let synthFilter = null;
let synthDelay = null;
let synthCurrentWave = 'sine';
let synthActiveNotes = {};

function initSynth() {
  const container = document.getElementById('synthContent');
  if (!container) return;

  if (!synthCtx) {
    synthCtx = new (window.AudioContext || window.webkitAudioContext)();
    synthMaster = synthCtx.createGain();
    synthMaster.gain.value = 0.4;
    synthFilter = synthCtx.createBiquadFilter();
    synthFilter.type = 'lowpass';
    synthFilter.frequency.value = 2000;
    synthFilter.Q.value = 1;
    synthDelay = synthCtx.createDelay(1);
    synthDelay.delayTime.value = 0.3;
    const delayFeedback = synthCtx.createGain();
    delayFeedback.gain.value = 0.3;
    const delayGain = synthCtx.createGain();
    delayGain.gain.value = 0.3;

    synthFilter.connect(synthMaster);
    synthMaster.connect(synthCtx.destination);
    synthFilter.connect(synthDelay);
    synthDelay.connect(delayFeedback);
    delayFeedback.connect(synthDelay);
    synthDelay.connect(delayGain);
    delayGain.connect(synthMaster);
  }

  if (synthCtx.state === 'suspended') synthCtx.resume();
  creativeHub.synth.ctx = synthCtx;
  renderSynthUI(container);
}

function renderSynthUI(container) {
  const p = SYNTH_PRESETS[creativeHub.synth.preset];
  container.innerHTML = `
    <div style="padding:6px; display:flex; flex-direction:column; height:100%; box-sizing:border-box;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
        <span style="font-size:9px; font-weight:bold; color:var(--gb-text);">🎵 SYNTH</span>
        <span style="font-size:5px; opacity:0.6;">${creativeHub.synth.bpm} BPM</span>
      </div>

      <div style="display:flex; gap:3px; margin-bottom:4px; flex-wrap:wrap;">
        ${Object.keys(SYNTH_PRESETS).map(k => `
          <button onclick="setSynthPreset('${k}')" style="font-size:4px; padding:2px 4px; ${creativeHub.synth.preset === k ? 'background:var(--gb-text);color:var(--gb-bg);' : ''}">${k}</button>
        `).join('')}
      </div>

      <div style="display:flex; gap:3px; margin-bottom:4px; align-items:center;">
        <span style="font-size:5px;">WAVE:</span>
        ${SYNTH_WAVES.map(w => `
          <button onclick="setSynthWave('${w}')" style="font-size:4px; padding:2px 3px; ${synthCurrentWave === w ? 'background:var(--gb-text);color:var(--gb-bg);' : ''}">${w.slice(0,3).toUpperCase()}</button>
        `).join('')}
      </div>

      <div style="display:flex; gap:3px; margin-bottom:4px; align-items:center;">
        <span style="font-size:5px;">BPM:</span>
        <button onclick="changeSynthBPM(-10)" style="font-size:5px; padding:2px 4px;">-</button>
        <span style="font-size:5px; min-width:20px; text-align:center;">${creativeHub.synth.bpm}</span>
        <button onclick="changeSynthBPM(10)" style="font-size:5px; padding:2px 4px;">+</button>
      </div>

      <div style="display:flex; gap:3px; margin-bottom:4px; align-items:center;">
        <span style="font-size:5px; min-width:18px;">FLT</span>
        <input type="range" id="synthFilter" min="100" max="8000" value="${p.filter}" oninput="setSynthFilter(this.value)" style="flex:1; height:3px;">
        <span id="synthFilterLabel" style="font-size:4px; min-width:18px;">${p.filter}</span>
      </div>

      <div style="display:flex; gap:3px; margin-bottom:4px; align-items:center;">
        <span style="font-size:5px; min-width:18px;">DLY</span>
        <input type="range" id="synthDelay" min="0" max="100" value="${p.delay*100}" oninput="setSynthDelay(this.value)" style="flex:1; height:3px;">
        <span id="synthDelayLabel" style="font-size:4px; min-width:18px;">${Math.round(p.delay*100)}%</span>
      </div>

      <div id="synthKeyboard" style="display:flex; gap:2px; margin-bottom:4px; flex-wrap:wrap; justify-content:center;">
        ${SYNTH_KEYS.map(k => `
          <button onmousedown="synthNoteOn('${k}')" onmouseup="synthNoteOff('${k}')" onmouseleave="synthNoteOff('${k}')"
                  ontouchstart="event.preventDefault();synthNoteOn('${k}')" ontouchend="event.preventDefault();synthNoteOff('${k}')"
                  style="width:28px; height:36px; font-size:5px; background:var(--gb-bg); color:var(--gb-text); border:1px solid var(--gb-text); border-radius:3px; cursor:pointer; display:flex; align-items:flex-end; justify-content:center; padding-bottom:3px; touch-action:manipulation;">
            ${k}
          </button>
        `).join('')}
      </div>

      <div style="display:flex; gap:3px; margin-bottom:4px;">
        <button onclick="synthRecordPattern()" style="flex:1; font-size:5px; padding:3px; ${creativeHub.synth.isPlaying ? 'background:#f00;color:#fff;' : ''}" id="synthRecBtn">● REC</button>
        <button onclick="synthPlayPattern()" style="flex:1; font-size:5px; padding:3px;" id="synthPlayBtn">▶ PLAY</button>
        <button onclick="synthClearPattern()" style="flex:1; font-size:5px; padding:3px;">CLEAR</button>
      </div>

      <div id="synthPattern" style="display:flex; gap:1px; overflow-x:auto; padding:2px 0; flex-shrink:0;">
        ${renderSynthPattern()}
      </div>

      <div style="display:flex; gap:3px; margin-top:auto;">
        <button onclick="saveSynthPreset()" style="flex:1; font-size:5px; padding:3px;">💾 SAVE</button>
        <button onclick="shareSynthToFlow()" style="flex:1; font-size:5px; padding:3px;">→ FLOW</button>
      </div>
    </div>
  `;
}

function renderSynthPattern() {
  const p = creativeHub.synth.pattern;
  if (p.length === 0) return '<span style="font-size:5px; opacity:0.4;">NO PATTERN RECORDED</span>';
  return p.map((note, i) => `
    <div style="min-width:16px; height:16px; background:var(--gb-text); color:var(--gb-bg); font-size:4px; display:flex; align-items:center; justify-content:center; border-radius:2px;">
      ${note}
    </div>
  `).join('');
}

function setSynthPreset(name) {
  creativeHub.synth.preset = name;
  const p = SYNTH_PRESETS[name];
  synthCurrentWave = p.wave;
  if (synthFilter) synthFilter.frequency.value = p.filter;
  if (synthDelay) synthDelay.delayTime.value = p.delay;
  renderSynthUI(document.getElementById('synthContent'));
}

function setSynthWave(wave) {
  synthCurrentWave = wave;
  renderSynthUI(document.getElementById('synthContent'));
}

function changeSynthBPM(delta) {
  creativeHub.synth.bpm = Math.max(60, Math.min(240, creativeHub.synth.bpm + delta));
  const el = document.querySelector('#synthContent span[style*="BPM"]');
  if (el) el.textContent = creativeHub.synth.bpm + ' BPM';
}

function setSynthFilter(val) {
  if (synthFilter) synthFilter.frequency.value = parseFloat(val);
  const label = document.getElementById('synthFilterLabel');
  if (label) label.textContent = val;
}

function setSynthDelay(val) {
  if (synthDelay) synthDelay.delayTime.value = parseFloat(val) / 100;
  const label = document.getElementById('synthDelayLabel');
  if (label) label.textContent = Math.round(val) + '%';
}

function synthNoteOn(key) {
  if (!synthCtx || !SYNTH_FREQS[key]) return;
  if (synthActiveNotes[key]) return;

  const osc = synthCtx.createOscillator();
  const env = synthCtx.createGain();
  const p = SYNTH_PRESETS[creativeHub.synth.preset];

  osc.type = synthCurrentWave;
  osc.frequency.value = SYNTH_FREQS[key];

  env.gain.setValueAtTime(0, synthCtx.currentTime);
  env.gain.linearRampToValueAtTime(0.3, synthCtx.currentTime + p.attack);
  env.gain.linearRampToValueAtTime(p.sustain * 0.3, synthCtx.currentTime + p.attack + p.decay);

  osc.connect(env);
  env.connect(synthFilter);
  osc.start();

  synthActiveNotes[key] = { osc, env };

  if (creativeHub.synth.recording) {
    creativeHub.synth.pattern.push(key);
    const patternEl = document.getElementById('synthPattern');
    if (patternEl) patternEl.innerHTML = renderSynthPattern();
  }
}

function synthNoteOff(key) {
  const note = synthActiveNotes[key];
  if (!note) return;

  const p = SYNTH_PRESETS[creativeHub.synth.preset];
  const now = synthCtx.currentTime;
  note.env.gain.cancelScheduledValues(now);
  note.env.gain.setValueAtTime(note.env.gain.value, now);
  note.env.gain.linearRampToValueAtTime(0, now + p.release);
  note.osc.stop(now + p.release + 0.05);
  delete synthActiveNotes[key];
}

function synthRecordPattern() {
  creativeHub.synth.recording = !creativeHub.synth.recording;
  if (creativeHub.synth.recording) creativeHub.synth.pattern = [];
  const btn = document.getElementById('synthRecBtn');
  if (btn) btn.style.background = creativeHub.synth.recording ? '#f00' : '';
  if (btn) btn.style.color = creativeHub.synth.recording ? '#fff' : '';
}

let synthPlayTimeout = null;
function synthPlayPattern() {
  const pattern = creativeHub.synth.pattern;
  if (pattern.length === 0) return;

  creativeHub.synth.isPlaying = !creativeHub.synth.isPlaying;
  const btn = document.getElementById('synthPlayBtn');
  if (btn) btn.textContent = creativeHub.synth.isPlaying ? '■ STOP' : '▶ PLAY';

  if (!creativeHub.synth.isPlaying) {
    if (synthPlayTimeout) clearTimeout(synthPlayTimeout);
    return;
  }

  let i = 0;
  const step = () => {
    if (!creativeHub.synth.isPlaying || i >= pattern.length) {
      creativeHub.synth.isPlaying = false;
      if (btn) btn.textContent = '▶ PLAY';
      return;
    }
    synthNoteOn(pattern[i]);
    setTimeout(() => synthNoteOff(pattern[i]), 200);
    i++;
    synthPlayTimeout = setTimeout(step, 60000 / creativeHub.synth.bpm);
  };
  step();
}

function synthClearPattern() {
  creativeHub.synth.pattern = [];
  creativeHub.synth.recording = false;
  creativeHub.synth.isPlaying = false;
  const patternEl = document.getElementById('synthPattern');
  if (patternEl) patternEl.innerHTML = renderSynthPattern();
}

function saveSynthPreset() {
  creativeHub.addSound(creativeHub.synth.preset, creativeHub.synth.pattern);
  if (window.sounds) sounds.click();
  const btn = document.querySelector('#synthContent button[style*="SAVE"]');
  if (btn) { btn.textContent = '✓ SAVED'; setTimeout(() => btn.textContent = '💾 SAVE', 1500); }
}

function shareSynthToFlow() {
  creativeHub.addSound(creativeHub.synth.preset, creativeHub.synth.pattern);
  if (window.sounds) sounds.launch();
  launchApp('flow');
}

// ── FLOW: Creative Intelligence Dashboard ───────────────────────
function initFlow() {
  const container = document.getElementById('flowContent');
  if (!container) return;
  renderFlowUI(container);
}

function renderFlowUI(container) {
  const readings = creativeHub.flow.readings;
  const sounds = creativeHub.flow.sounds;
  const moods = creativeHub.flow.moods;

  const moodCounts = {};
  moods.forEach(m => { moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1; });
  const topMood = Object.entries(moodCounts).sort((a,b) => b[1] - a[1])[0];

  container.innerHTML = `
    <div style="padding:6px; display:flex; flex-direction:column; height:100%; box-sizing:border-box;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
        <span style="font-size:9px; font-weight:bold; color:var(--gb-text);">🌊 FLOW</span>
        <span style="font-size:5px; opacity:0.6;">CREATIVE STATE</span>
      </div>

      <div style="display:flex; gap:4px; margin-bottom:6px;">
        <div style="flex:1; background:rgba(0,0,0,0.08); border:1px solid var(--gb-text); border-radius:4px; padding:5px; text-align:center;">
          <div style="font-size:14px; font-weight:bold;">${readings.length}</div>
          <div style="font-size:4px; opacity:0.6;">ARTICLES</div>
        </div>
        <div style="flex:1; background:rgba(0,0,0,0.08); border:1px solid var(--gb-text); border-radius:4px; padding:5px; text-align:center;">
          <div style="font-size:14px; font-weight:bold;">${sounds.length}</div>
          <div style="font-size:4px; opacity:0.6;">SOUNDS</div>
        </div>
        <div style="flex:1; background:rgba(0,0,0,0.08); border:1px solid var(--gb-text); border-radius:4px; padding:5px; text-align:center;">
          <div style="font-size:14px; font-weight:bold;">${topMood ? topMood[0] : '—'}</div>
          <div style="font-size:4px; opacity:0.6;">TOP MOOD</div>
        </div>
      </div>

      <div style="display:flex; gap:4px; margin-bottom:6px;">
        <button onclick="flowTab('readings')" id="flowReadTab" style="flex:1; font-size:5px; padding:3px; background:var(--gb-text);color:var(--gb-bg);">📰 READING</button>
        <button onclick="flowTab('sounds')" id="flowSoundTab" style="flex:1; font-size:5px; padding:3px;">🎵 SOUNDS</button>
        <button onclick="flowTab('mood')" id="flowMoodTab" style="flex:1; font-size:5px; padding:3px;">💭 MOOD</button>
      </div>

      <div id="flowTabContent" style="flex:1; overflow-y:auto;">
        ${renderFlowReadings()}
      </div>
    </div>
  `;
}

function renderFlowReadings() {
  const r = creativeHub.flow.readings;
  if (r.length === 0) return '<div style="text-align:center; padding:15px; opacity:0.5;">NO READINGS YET<br><span style="font-size:4px;">SAVE ARTICLES FROM PULSE</span></div>';
  return r.slice(0, 15).map(a => `
    <div style="padding:4px; margin-bottom:3px; border:1px solid var(--gb-text); border-radius:3px;">
      <div style="font-weight:bold; line-height:1.2;">${a.title.toUpperCase()}</div>
      <div style="opacity:0.6; margin-top:1px;">${a.source} · ${a.category}</div>
    </div>
  `).join('');
}

function renderFlowSounds() {
  const s = creativeHub.flow.sounds;
  if (s.length === 0) return '<div style="text-align:center; padding:15px; opacity:0.5;">NO SOUNDS YET<br><span style="font-size:4px;">SAVE PATTERNS FROM SYNTH</span></div>';
  return s.slice(0, 10).map(item => `
    <div style="padding:4px; margin-bottom:3px; border:1px solid var(--gb-text); border-radius:3px;">
      <div style="display:flex; justify-content:space-between;">
        <span style="font-weight:bold;">${item.preset}</span>
        <span style="opacity:0.5; font-size:4px;">${item.pattern.length} NOTES</span>
      </div>
      <div style="display:flex; gap:1px; margin-top:2px; flex-wrap:wrap;">
        ${item.pattern.slice(0, 12).map(n => `<span style="font-size:4px; background:var(--gb-text); color:var(--gb-bg); padding:1px 2px; border-radius:1px;">${n}</span>`).join('')}
        ${item.pattern.length > 12 ? '<span style="font-size:4px; opacity:0.5;">+' + (item.pattern.length - 12) + '</span>' : ''}
      </div>
    </div>
  `).join('');
}

function renderFlowMood() {
  const moods = creativeHub.flow.moods;
  const moodOptions = ['🔥 HYPED','🌊 CHILL','💡 CREATIVE','⚡ ENERGIZED','🌙 DREAMY','🎸 RAW'];
  return `
    <div style="display:flex; flex-wrap:wrap; gap:4px; margin-bottom:8px;">
      ${moodOptions.map(m => `
        <button onclick="trackFlowMood('${m.split(' ')[1]}')" style="font-size:6px; padding:4px 6px;">${m}</button>
      `).join('')}
    </div>
    <div style="font-size:5px; opacity:0.5; margin-bottom:4px;">RECENT MOODS:</div>
    ${moods.length === 0 ? '<div style="text-align:center; opacity:0.3;">NO MOODS TRACKED</div>' :
      moods.slice(-10).reverse().map(m => `
        <div style="font-size:5px; padding:2px 0; border-bottom:1px solid rgba(0,0,0,0.1);">
          ${m.mood} · ${new Date(m.timestamp).toLocaleTimeString()}
        </div>
      `).join('')}
  `;
}

function flowTab(tab) {
  const content = document.getElementById('flowTabContent');
  if (!content) return;

  document.querySelectorAll('#flowContent button[id^="flow"]').forEach(b => {
    b.style.background = '';
    b.style.color = '';
  });

  if (tab === 'readings') {
    document.getElementById('flowReadTab').style.background = 'var(--gb-text)';
    document.getElementById('flowReadTab').style.color = 'var(--gb-bg)';
    content.innerHTML = renderFlowReadings();
  } else if (tab === 'sounds') {
    document.getElementById('flowSoundTab').style.background = 'var(--gb-text)';
    document.getElementById('flowSoundTab').style.color = 'var(--gb-bg)';
    content.innerHTML = renderFlowSounds();
  } else if (tab === 'mood') {
    document.getElementById('flowMoodTab').style.background = 'var(--gb-text)';
    document.getElementById('flowMoodTab').style.color = 'var(--gb-bg)';
    content.innerHTML = renderFlowMood();
  }
}

function trackFlowMood(mood) {
  creativeHub.trackMood(mood);
  if (window.sounds) sounds.click();
  flowTab('mood');
}

// ── Cross-App Navigation Helpers ────────────────────────────────
function pulseToSynth() { launchApp('synth'); }
function pulseToFlow() { launchApp('flow'); }
function synthToPulse() { launchApp('pulse'); }
function flowToPulse() { launchApp('pulse'); }
function flowToSynth() { launchApp('synth'); }
