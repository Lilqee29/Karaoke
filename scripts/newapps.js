// ========== UTILS & SHARED STATE ==========
const pad = (n) => n.toString().padStart(2, '0');

const JAMENDO_CLIENT_ID = '56d30c55';
const RADIO_API_URL = 'https://de1.api.radio-browser.info/json/stations/search';

// ========== MUSIC PLAYER (iTunes + YouTube Embed) ==========
let musicQueue = [];
let currentMusicIdx = 0;
let isMusicPlaying = false;
let isShuffle = false;
let isRepeat = false;
let vinylRotation = 0;
let vinylInterval = null;
let ytPlayer = null;
let ytReady = false;
let ytProgressInterval = null;
let currentAudio = null;

// ── Recently Played ──────────────────────────────────────────
let recentlyPlayed = JSON.parse(localStorage.getItem('gbRecentlyPlayed') || '[]');
const MAX_RECENT = 15;

function addToRecentlyPlayed(track) {
  // Remove duplicate if exists
  recentlyPlayed = recentlyPlayed.filter(t => t.trackId !== track.trackId);
  recentlyPlayed.unshift({ trackId: track.trackId, name: track.name, artist_name: track.artist_name, thumbnail: track.thumbnail, audio: track.audio });
  if (recentlyPlayed.length > MAX_RECENT) recentlyPlayed = recentlyPlayed.slice(0, MAX_RECENT);
  localStorage.setItem('gbRecentlyPlayed', JSON.stringify(recentlyPlayed));
  renderRecentlyPlayed();
}

function renderRecentlyPlayed() {
  const el = document.getElementById('recentlyPlayedList');
  if (!el) return;
  if (recentlyPlayed.length === 0) {
    el.innerHTML = '<div style="color:#306230;font-size:8px;padding:8px;">NO RECENT TRACKS</div>';
    return;
  }
  el.innerHTML = recentlyPlayed.map((t, i) => `
    <div class="music-queue-item" onclick="playMusicByTrackId('${t.trackId}')" style="display:flex;align-items:center;gap:8px;padding:4px 6px;cursor:pointer;border-bottom:1px solid #1a1a2e;font-size:7px;">
      <img src="${t.thumbnail || ''}" style="width:24px;height:24px;border-radius:3px;object-fit:cover;" onerror="this.style.display='none'">
      <div style="flex:1;overflow:hidden;">
        <div style="color:#9bbc0f;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${(t.name||'').toUpperCase()}</div>
        <div style="color:#306230;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${(t.artist_name||'').toUpperCase()}</div>
      </div>
    </div>
  `).join('');
}

function playMusicByTrackId(trackId) {
  const idx = musicQueue.findIndex(t => t.trackId === trackId);
  if (idx >= 0) playMusic(idx);
}

// ── Persist queue to localStorage ─────────────────────────────
function saveMusicQueue() {
  try {
    const toSave = musicQueue.map(t => ({ trackId: t.trackId, name: t.name, artist_name: t.artist_name, thumbnail: t.thumbnail, audio: t.audio }));
    localStorage.setItem('gbMusicQueue', JSON.stringify(toSave));
    localStorage.setItem('gbMusicIdx', currentMusicIdx.toString());
  } catch(e) {}
}

function loadMusicQueue() {
  try {
    const saved = JSON.parse(localStorage.getItem('gbMusicQueue') || '[]');
    const savedIdx = parseInt(localStorage.getItem('gbMusicIdx') || '0', 10);
    if (saved.length > 0) {
      musicQueue = saved;
      currentMusicIdx = savedIdx || 0;
      renderQueue();
      // Update title display
      const track = musicQueue[currentMusicIdx];
      if (track) {
        const titleEl = document.getElementById('musicTitle');
        const artistEl = document.getElementById('musicArtist');
        if (titleEl) titleEl.textContent = track.name?.toUpperCase() || '';
        if (artistEl) artistEl.textContent = track.artist_name?.toUpperCase() || '';
      }
    }
  } catch(e) {}
}

// Auto-load saved queue on script init
setTimeout(loadMusicQueue, 100);

// ── YouTube IFrame API Loader (for full songs) ────────────
function loadYouTubeAPI() {
  if (window.YT && window.YT.Player) return;
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
}
loadYouTubeAPI();

window.onYouTubeIframeAPIReady = function() {
  const div = document.createElement('div');
  div.id = 'ytPlayerDiv';
  div.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;opacity:0;';
  document.body.appendChild(div);
  ytPlayer = new YT.Player('ytPlayerDiv', {
    height: '1', width: '1',
    playerVars: { autoplay: 0, controls: 0 },
    events: {
      onReady: () => { ytReady = true; },
      onStateChange: (e) => {
        if (e.data === 0) { // ENDED
          if (isRepeat && ytPlayer.seekTo) { ytPlayer.seekTo(0); ytPlayer.playVideo(); }
          else nextMusic();
        }
      }
    }
  });
};

// ── Search via iTunes API (CORS-enabled, reliable) ─────────
async function searchMusic() {
  const query = document.getElementById('musicSearch')?.value;
  if (!query) return;
  const mt = document.getElementById('musicTitle');
  if (mt) mt.textContent = 'SEARCHING MUSIC...';
  const ma = document.getElementById('musicArtist');
  if (ma) ma.textContent = '...';
  const pb = document.getElementById('musicPlayBtn');
  if (pb) pb.textContent = '⏳';

  try {
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=20`, {
      signal: AbortSignal.timeout(8000)
    });
    const data = await res.json();

    if (data.results && data.results.length > 0) {
      musicQueue = data.results.map(t => ({
        videoId: null, // iTunes tracks use audio preview
        trackId: t.trackId || t.collectionId || `${t.trackName}-${t.artistName}`.replace(/\s+/g,'-'),
        name: t.trackName || t.collectionName,
        artist_name: t.artistName,
        audio: t.previewUrl, // 30s AAC preview
        thumbnail: (t.artworkUrl100 || '').replace('100x100', '300x300'),
        duration: t.trackTimeMillis ? Math.floor(t.trackTimeMillis / 1000) : 0,
        genre: t.primaryGenreName || '',
        appleUrl: t.trackViewUrl || '',
      }));
      currentMusicIdx = 0;
      saveMusicQueue();
      renderQueue();
      playMusic(0);
    } else {
      if (mt) mt.textContent = 'NO RESULTS';
      if (pb) pb.textContent = '▶';
    }
  } catch (e) {
    console.warn('iTunes search failed:', e);
    if (mt) mt.textContent = 'SEARCH FAILED';
    if (pb) pb.textContent = '▶';
  }
}

// ── Play track (iTunes audio or YouTube) ───────────────────
function playMusic(idx) {
  // Stop previous
  if (currentAudio) { currentAudio.pause(); currentAudio = null; }
  if (ytPlayer && ytReady && ytPlayer.stopVideo) ytPlayer.stopVideo();

  currentMusicIdx = idx;
  const track = musicQueue[idx];
  if (!track) return;
  saveMusicQueue();

  const titleEl = document.getElementById('musicTitle');
  const artistEl = document.getElementById('musicArtist');
  const playBtn = document.getElementById('musicPlayBtn');

  if (titleEl) titleEl.textContent = track.name?.toUpperCase() || 'UNKNOWN';
  if (artistEl) artistEl.textContent = track.artist_name?.toUpperCase() || '';

  // Update vinyl thumbnail
  const vinylCenter = document.querySelector('#vinylDisk > div:first-child');
  if (vinylCenter && track.thumbnail) {
    vinylCenter.innerHTML = `<img src="${track.thumbnail}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;" onerror="this.parentElement.textContent='🎵'">`;
  }

  if (track.audio) {
    // iTunes preview — play directly
    currentAudio = new Audio(track.audio);
    currentAudio.onended = () => {
      if (isRepeat) { currentAudio.currentTime = 0; currentAudio.play(); }
      else nextMusic();
    };
    currentAudio.onerror = () => {
      // Track failed to load — auto-advance to next
      console.warn('Track failed:', track.name);
      if (musicQueue.length > 1) nextMusic();
    };
    currentAudio.play().catch(() => {
      // Playback blocked — auto-advance
      if (musicQueue.length > 1) nextMusic();
    });
    isMusicPlaying = true;
    if (playBtn) playBtn.textContent = '⏸';
    startVinyl();
    startProgress();
    const needle = document.getElementById('vinylNeedle');
    if (needle) needle.style.transform = 'rotate(0deg)';

    // Add to recently played
    addToRecentlyPlayed(track);
  }

  renderQueue();

  // Media Session API (lock screen controls)
  if ('mediaSession' in navigator && track.thumbnail) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.name,
      artist: track.artist_name,
      album: 'GameBoy Music',
      artwork: [{ src: track.thumbnail, sizes: '300x300', type: 'image/jpeg' }]
    });
    navigator.mediaSession.setActionHandler('play', () => toggleMusicPlay());
    navigator.mediaSession.setActionHandler('pause', () => toggleMusicPlay());
    navigator.mediaSession.setActionHandler('nexttrack', () => nextMusic());
    navigator.mediaSession.setActionHandler('previoustrack', () => prevMusic());
  }
}

function toggleMusicPlay() {
  if (currentAudio) {
    if (isMusicPlaying) {
      currentAudio.pause(); stopVinyl(); stopProgress();
      const pb = document.getElementById('musicPlayBtn'); if (pb) pb.textContent = '▶';
      const needle = document.getElementById('vinylNeedle'); if (needle) needle.style.transform = 'rotate(30deg)';
    } else {
      currentAudio.play(); startVinyl(); startProgress();
      const pb = document.getElementById('musicPlayBtn'); if (pb) pb.textContent = '⏸';
      const needle = document.getElementById('vinylNeedle'); if (needle) needle.style.transform = 'rotate(0deg)';
    }
    isMusicPlaying = !isMusicPlaying;
  } else if (musicQueue.length > 0) {
    playMusic(0);
  }
}

function nextMusic() {
  if (musicQueue.length === 0) return;
  const next = isShuffle
    ? Math.floor(Math.random() * musicQueue.length)
    : (currentMusicIdx + 1) % musicQueue.length;
  playMusic(next);
}

function prevMusic() {
  if (musicQueue.length === 0) return;
  playMusic((currentMusicIdx - 1 + musicQueue.length) % musicQueue.length);
}

function toggleMusicShuffle() {
  isShuffle = !isShuffle;
  const btn = document.getElementById('shuffleBtn');
  if (btn) btn.style.opacity = isShuffle ? '1' : '0.5';
}

function toggleMusicRepeat() {
  isRepeat = !isRepeat;
  const btn = document.getElementById('repeatBtn');
  if (btn) btn.style.opacity = isRepeat ? '1' : '0.5';
}

function toggleMusicQueue() {
  const q = document.getElementById('musicQueue');
  if (q) q.style.display = q.style.display === 'none' ? 'block' : 'none';
}

function renderQueue() {
  const list = document.getElementById('queueList');
  if (!list) return;
  list.innerHTML = '';
  musicQueue.forEach((t, i) => {
    const dur = t.duration ? `${Math.floor(t.duration / 60)}:${String(t.duration % 60).padStart(2, '0')}` : '';
    const item = document.createElement('div');
    item.style.cssText = `display:flex;align-items:center;gap:6px;padding:4px;border-bottom:1px solid rgba(15,56,15,0.2);cursor:pointer;${i === currentMusicIdx ? 'background:#306230;color:#9bbc0f;' : ''}`;
    item.innerHTML = `
      <img src="${t.thumbnail || ''}" style="width:28px;height:28px;border-radius:3px;object-fit:cover;flex-shrink:0;" onerror="this.style.display='none'">
      <div style="flex:1;min-width:0;overflow:hidden;">
        <div style="font-size:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${t.name}</div>
        <div style="font-size:4px;opacity:0.6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${t.artist_name} ${dur} ${t.genre ? '· ' + t.genre : ''}</div>
      </div>`;
    item.onclick = () => { playMusic(i); toggleMusicQueue(); };
    list.appendChild(item);
  });
}

// ── Progress ───────────────────────────────────────────────
function startProgress() {
  stopProgress();
  ytProgressInterval = setInterval(() => {
    if (!currentAudio) return;
    const cur = currentAudio.currentTime || 0;
    const dur = currentAudio.duration || 1;
    const pct = (cur / dur) * 100;
    const bar = document.getElementById('musicProgress');
    if (bar) bar.style.width = `${pct}%`;
    const timeEl = document.getElementById('musicTime');
    if (timeEl) timeEl.textContent = `${fmtTime(cur)} / ${fmtTime(dur)}`;
  }, 500);
}

function stopProgress() {
  if (ytProgressInterval) clearInterval(ytProgressInterval);
  ytProgressInterval = null;
}

function fmtTime(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}

// ── Vinyl ──────────────────────────────────────────────────
function startVinyl() {
  if (vinylInterval) clearInterval(vinylInterval);
  vinylInterval = setInterval(() => {
    vinylRotation = (vinylRotation + 2) % 360;
    const vc = document.getElementById('vinylContainer');
    if (vc) vc.style.transform = `rotate(${vinylRotation}deg)`;
  }, 20);
}

function stopVinyl() { clearInterval(vinylInterval); vinylInterval = null; }

window.loadMusicFile = function() { document.getElementById('musicFileInput')?.click(); };

// ========== SPIRIT RADAR Pro ==========
let spiritPingInterval = null;
function initSpirit() {
    const status = document.getElementById('radarStatus');
    if(status) status.textContent = "SCANNING FIELDS...";
    if (spiritPingInterval) clearInterval(spiritPingInterval);
    spiritPingInterval = setInterval(() => { if (Math.random() > 0.85) triggerGhostSignal(); }, 3000);
}
function triggerGhostSignal() {
    const dot = document.getElementById('spiritDot'); const pulse = document.getElementById('spiritPulse'); const status = document.getElementById('radarStatus');
    const x = 40 + Math.random() * 140; const y = 40 + Math.random() * 140;
    dot.style.left = x + 'px'; dot.style.top = y + 'px'; dot.style.display = 'block';
    if(status) status.textContent = "!! ENTITY !!"; status.style.color = "#f00";
    playBeep(800, 0.1);
    pulse.style.animation = 'none'; setTimeout(() => { pulse.style.animation = 'radar-pulse 1s ease-out'; }, 10);
    setTimeout(() => { dot.style.display = 'none'; if(status) status.textContent = "SEARCHING..."; status.style.color = "#0f0"; }, 2000);
}
let _beepCtx = null;
function playBeep(freq, dur) { if(!_beepCtx) _beepCtx = new (window.AudioContext || window.webkitAudioContext)(); const o = _beepCtx.createOscillator(); const g = _beepCtx.createGain(); o.frequency.value = freq; g.gain.value = 0.1; o.connect(g); g.connect(_beepCtx.destination); o.start(); o.stop(_beepCtx.currentTime + dur); }

// ========== WORLD RADIO (Live Streams) ==========
let radioPlayer = new Audio();
let isRadioPlaying = false;
function initRadio() { isRadioPlaying = false; document.getElementById('radioStationList').innerHTML = 'SEARCH FOR STATIONS...'; }
async function searchRadio() {
    const query = document.getElementById('radioSearch').value; const list = document.getElementById('radioStationList');
    list.innerHTML = 'SEARCHING...';
    try {
        const res = await fetch(`${RADIO_API_URL}?name=${encodeURIComponent(query)}&limit=15`);
        const data = await res.json();
        list.innerHTML = '';
        data.forEach(station => {
            const item = document.createElement('div');
            item.style.cssText = `padding: 5px; border-bottom: 1px solid var(--gb-text); cursor: pointer;`;
            item.innerHTML = `<strong>${station.name.substring(0,25)}</strong><br>${station.country}`;
            item.onclick = () => { 
                radioPlayer.src = station.url_resolved; 
                radioPlayer.play(); 
                isRadioPlaying = true; 
                const rpb = document.getElementById('radioPlayBtn'); if(rpb) if(rpb) rpb.textContent = "STOP"; 
                const rft = document.getElementById('radioFreqText'); if(rft) if(rft) rft.textContent = station.name.substring(0,8); 
                startRadioVisual(); 

                // Background Audio Support for Radio
                if ('mediaSession' in navigator) {
                    navigator.mediaSession.metadata = new MediaMetadata({
                        title: station.name.toUpperCase(),
                        artist: 'GameBoy OS Radio',
                        album: 'Retro Airwaves',
                        artwork: [{ src: 'icon-192.png', sizes: '192x192', type: 'image/png' }]
                    });
                    navigator.mediaSession.setActionHandler('play', () => { radioPlayer.play(); isRadioPlaying = true; });
                    navigator.mediaSession.setActionHandler('pause', () => { radioPlayer.pause(); isRadioPlaying = false; });
                }
            };
            list.appendChild(item);
        });
    } catch (e) { list.innerHTML = 'ERROR'; }
}
function toggleRadio() { if (isRadioPlaying) { radioPlayer.pause(); isRadioPlaying = false; const rpb = document.getElementById('radioPlayBtn'); if(rpb) if(rpb) rpb.textContent = "START"; } else if (radioPlayer.src) { radioPlayer.play(); isRadioPlaying = true; const rpb = document.getElementById('radioPlayBtn'); if(rpb) if(rpb) rpb.textContent = "STOP"; } }
function startRadioVisual() {
    const c = document.getElementById('radioCanvas'); if(!c) return; const ctx = c.getContext('2d');
    const draw = () => { if (!isRadioPlaying) return; const data = ctx.createImageData(c.width, c.height); for (let i = 0; i < data.data.length; i += 4) { const v = Math.random() * 255; data.data[i] = data.data[i+1] = data.data[i+2] = v; data.data[i+3] = 255; } ctx.putImageData(data, 0, 0); requestAnimationFrame(draw); };
    draw();
}

// ========== 10 NEW APPS INIT ==========
// ========== WEATHER (ENHANCED: CITY + 5-DAY + HOURLY CHART) ==========
const weatherCodes = {
    0: { icon: '☀️', desc: 'CLEAR SKY' }, 1: { icon: '🌤️', desc: 'MAINLY CLEAR' },
    2: { icon: '⛅', desc: 'PARTLY CLOUDY' }, 3: { icon: '☁️', desc: 'OVERCAST' },
    45: { icon: '🌫️', desc: 'FOGGY' }, 48: { icon: '🌫️', desc: 'RIME FOG' },
    51: { icon: '🌧️', desc: 'LIGHT DRIZZLE' }, 53: { icon: '🌧️', desc: 'DRIZZLE' },
    55: { icon: '🌧️', desc: 'DENSE DRIZZLE' }, 56: { icon: '🌧️', desc: 'FREEZING DRIZZLE' },
    57: { icon: '🌧️', desc: 'FREEZING DRIZZLE' }, 61: { icon: '🌧️', desc: 'SLIGHT RAIN' },
    63: { icon: '🌧️', desc: 'MODERATE RAIN' }, 65: { icon: '🌧️', desc: 'HEAVY RAIN' },
    66: { icon: '🌧️', desc: 'FREEZING RAIN' }, 67: { icon: '🌧️', desc: 'FREEZING RAIN' },
    71: { icon: '❄️', desc: 'SLIGHT SNOW' }, 73: { icon: '❄️', desc: 'MODERATE SNOW' },
    75: { icon: '❄️', desc: 'HEAVY SNOW' }, 77: { icon: '❄️', desc: 'GRAUPEL' },
    80: { icon: '🌦️', desc: 'LIGHT SHOWERS' }, 81: { icon: '🌦️', desc: 'MODERATE SHOWERS' },
    82: { icon: '🌦️', desc: 'VIOLENT SHOWERS' }, 85: { icon: '❄️', desc: 'SNOW SHOWERS' },
    86: { icon: '❄️', desc: 'HEAVY SNOW SHOWERS' },
    95: { icon: '⛈️', desc: 'THUNDERSTORM' }, 96: { icon: '⛈️', desc: 'THUNDERSTORM + HAIL' },
    99: { icon: '⛈️', desc: 'THUNDERSTORM + HAIL' }
};
const DAY_NAMES = ['SUN','MON','TUE','WED','THU','FRI','SAT'];

window.initWeather = async function() {
    const cityName = document.getElementById('weatherCityName');
    if(cityName) if(cityName) cityName.textContent = 'LOCATING...';
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            await fetchWeatherData(lat, lon);
        }, () => {
            const cn = document.getElementById('weatherCityName');
            if(cn) if(cn) cn.textContent = 'GPS UNAVAILABLE';
        });
    }
};

window.getWeather = async function() {
    const input = document.getElementById('weatherInput');
    if(!input) { await initWeather(); return; }
    const parts = input.value.split(',').map(Number);
    const lat = parts[0] || 48.8566;
    const lon = parts[1] || 2.3522;
    await fetchWeatherData(lat, lon);
};

async function fetchWeatherData(lat, lon) {
    const cityNameEl = document.getElementById('weatherCityName');
    const iconEl = document.getElementById('weatherIcon');
    const tempEl = document.getElementById('weatherTemp');
    const condEl = document.getElementById('weatherCondition');
    const forecastEl = document.getElementById('weatherForecast');

    try {
        const [weatherRes, geoRes] = await Promise.all([
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`),
            fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
        ]);
        const weatherData = await weatherRes.json();
        const geoData = await geoRes.json();

        const city = geoData.address?.city || geoData.address?.town || geoData.address?.village || geoData.address?.county || geoData.address?.state || 'UNKNOWN';
        const country = geoData.address?.country_code?.toUpperCase() || '';
        if(cityNameEl) if(cityNameEl) cityNameEl.textContent = `${city}${country ? ', ' + country : ''}`;

        const current = weatherData.current_weather;
        const codeInfo = weatherCodes[current.weathercode] || { icon: '🌡️', desc: 'UNKNOWN' };
        if(iconEl) if(iconEl) iconEl.textContent = codeInfo.icon;
        if(tempEl) if(tempEl) tempEl.textContent = `${current.temperature.toFixed(1)}°C`;
        if(condEl) if(condEl) condEl.textContent = codeInfo.desc;

        if(forecastEl && weatherData.daily) {
            forecastEl.innerHTML = '';
            const d = weatherData.daily;
            for(let i = 0; i < Math.min(5, d.time.length); i++) {
                const date = new Date(d.time[i] + 'T00:00:00');
                const dayName = i === 0 ? 'TODAY' : DAY_NAMES[date.getDay()];
                const dayCode = weatherCodes[d.weathercode[i]] || { icon: '🌡️' };
                const card = document.createElement('div');
                card.style.cssText = 'text-align:center; min-width:42px; padding:3px; border-radius:4px; background:rgba(0,0,0,0.05); flex-shrink:0;';
                card.innerHTML = `<div style="font-size:6px;font-weight:bold;">${dayName}</div><div style="font-size:14px;">${dayCode.icon}</div><div style="font-size:6px;">${d.temperature_2m_max[i].toFixed(0)}° / ${d.temperature_2m_min[i].toFixed(0)}°</div>`;
                forecastEl.appendChild(card);
            }
        }

        if(weatherData.hourly) {
            drawWeatherChart(weatherData.hourly.temperature_2m);
        }
    } catch(e) {
        if(cityNameEl) if(cityNameEl) cityNameEl.textContent = 'API ERROR';
    }
}

function drawWeatherChart(temps) {
    const canvas = document.getElementById('weatherChart');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const now = new Date();
    const currentHour = now.getHours();
    const hours = [];
    for(let i = 0; i < 24; i++) {
        hours.push({ temp: temps[(currentHour + i) % temps.length], label: i % 3 === 0 ? `${(currentHour + i) % 24}h` : '' });
    }

    const minT = Math.min(...hours.map(x => x.temp));
    const maxT = Math.max(...hours.map(x => x.temp));
    const range = maxT - minT || 1;
    const pad = 14;

    ctx.strokeStyle = '#0f380f';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    hours.forEach((hr, i) => {
        const x = (i / (hours.length - 1)) * w;
        const y = pad + (1 - (hr.temp - minT) / range) * (h - pad * 2);
        if(i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.fillStyle = '#0f380f';
    ctx.font = '7px monospace';
    ctx.textAlign = 'center';
    hours.forEach((hr, i) => {
        if(hr.label) {
            const x = (i / (hours.length - 1)) * w;
            ctx.fillText(hr.label, x, h - 2);
            const y = pad + (1 - (hr.temp - minT) / range) * (h - pad * 2);
            ctx.fillText(`${hr.temp.toFixed(0)}°`, x, y - 4);
        }
    });
}

window.initFlashlight = function() {
    const screen = document.getElementById('flashlightScreen');
    if(!screen) return;
    // Handled by the HTML button already, but good for launcher compatibility
};

// News App Logic moved and consolidated below.

window.setNewsCategory = function(cat) {
    sounds.click();
    document.querySelectorAll('.news-cat-btn').forEach(b => { b.style.background = ''; b.style.color = ''; });
    const btns = document.querySelectorAll('.news-cat-btn');
    const catMap = { space: 0, world: 1, technology: 2, science: 3 };
    if(btns[catMap[cat]]) { btns[catMap[cat]].style.background = 'var(--gb-text)'; btns[catMap[cat]].style.color = 'var(--gb-bg)'; }
    window.initNews(cat);
};

// ========== NEWS (Algolia API) ==========
window.initNews = async function(category = 'space') {
    const list = document.getElementById('newsList');
    const screen = document.getElementById('newsScreen');
    if(!list || !screen) return;

    const catQueries = { space: 'space', world: 'world news', technology: 'technology', science: 'science' };
    const query = catQueries[category] || 'technology';

    list.innerHTML = `<div style="text-align:center; padding: 40px; font-family: monospace; font-size: 8px;">UPLINKING [${category.toUpperCase()}]...</div>`;
    list.style.display = 'flex';
    const detail = document.getElementById('newsDetail');
    if(detail) detail.style.display = 'none';
    const catBar = document.getElementById('newsCategoryBar');
    if(catBar) catBar.style.display = 'flex';

    try {
        const res = await fetch(`https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=15`);
        const data = await res.json();
        const stories = (data.hits || []).map(h => ({
            title: h.title || 'Untitled',
            url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
            source: h.author || 'HN',
            date: h.created_at,
            points: h.points || 0
        }));

        window.newsItems = stories;
        renderNewsList(stories);

        const ticker = document.getElementById('newsText');
        if (ticker && stories.length > 0) {
            if(ticker) ticker.textContent = 'LATEST: ' + stories.slice(0, 5).map(s => s.title.toUpperCase()).join(' ••• ');
        }
    } catch(e) {
        list.innerHTML = '<div style="text-align:center; padding: 40px; color: #8b0000; font-size: 8px;">UPLINK FAILED</div>';
    }
};

window.renderNewsList = function(stories) {
    const list = document.getElementById('newsList');
    list.innerHTML = '';
    
    stories.forEach((s, i) => {
        const item = document.createElement('div');
        item.style.cssText = "padding: 6px; border-bottom: 1px solid rgba(15,56,15,0.3); cursor: pointer; transition: background 0.2s; position: relative; border-left: 3px solid var(--gb-text);";
        item.onmouseover = () => item.style.background = 'rgba(15,56,15,0.1)';
        item.onmouseout = () => item.style.background = 'transparent';
        item.onclick = () => window.openNewsDetail(i);
        
        const date = s.date ? new Date(s.date).toLocaleDateString() : '';
        const sourceName = s.source || 'UNKNOWN';
        const points = s.points ? `⬆ ${s.points}` : '';
        
        item.innerHTML = `
            <div style="font-weight: bold; font-size: 7px; line-height: 1.2;">${s.title.toUpperCase()}</div>
            <div style="font-size: 5px; opacity: 0.7; margin-top: 3px;">
                📡 ${sourceName.toUpperCase()} | 📅 ${date} ${points}
            </div>
        `;
        list.appendChild(item);
    });
};

window.openNewsDetail = function(index) {
    const item = window.newsItems[index];
    if(!item) return;
    
    const list = document.getElementById('newsList');
    list.style.display = 'none';
    const catBar = document.getElementById('newsCategoryBar');
    if(catBar) catBar.style.display = 'none';
    
    let detail = document.getElementById('newsDetail');
    if(!detail) {
        detail = document.createElement('div');
        detail.id = 'newsDetail';
        detail.style.cssText = "position:absolute; top:35px; left:0; width:100%; height:calc(100% - 35px); background:var(--gb-bg); color:var(--gb-text); padding:10px; overflow-y:auto; z-index:100; border-top: 1px solid var(--gb-text);";
        document.getElementById('newsScreen').appendChild(detail);
    }
    
    detail.style.display = 'block';
    const date = item.date ? new Date(item.date).toLocaleString() : '';
    const sourceName = item.source || 'UNKNOWN';
    
    detail.innerHTML = `
        <div style="font-size: 8px; font-weight: bold; border-bottom: 2px solid var(--gb-text); padding-bottom: 6px; margin-bottom: 6px; line-height: 1.3;">
            ${item.title.toUpperCase()}
        </div>
        <div style="font-size: 6px; margin-bottom: 10px; opacity: 0.8;">
            SOURCE: ${sourceName.toUpperCase()}<br>
            DATE: ${date.toUpperCase()}
            ${item.points ? `<br>SCORE: ${item.points} POINTS` : ''}
        </div>
        <div style="display: flex; gap: 5px;">
            <button onclick="closeNewsDetail()" style="flex: 1; padding: 8px; font-size: 6px;">BACK</button>
            <a href="${item.url}" target="_blank" style="flex: 1; padding: 8px; background: var(--gb-text); color: var(--gb-bg); font-size: 6px; text-decoration: none; text-align: center;">FULL STORY</a>
        </div>
    `;
    sounds.click();
};

window.closeNewsDetail = function() {
    const detail = document.getElementById('newsDetail');
    if(detail) detail.style.display = 'none';
    const list = document.getElementById('newsList');
    if(list) list.style.display = 'flex';
    const catBar = document.getElementById('newsCategoryBar');
    if(catBar) catBar.style.display = 'flex';
    sounds.back();
};

// ========== TRANSLATE (ENHANCED: SWAP + DROPDOWNS + HISTORY) ==========
window.initTranslate = function() {
    renderTransHistory();
};

window.swapLanguages = function() {
    const fromEl = document.getElementById('transFrom');
    const toEl = document.getElementById('transTo');
    const temp = fromEl.value;
    fromEl.value = toEl.value;
    toEl.value = temp;
    sounds.click();
};

window.translateText = async function() {
    const text = document.getElementById('transInput').value;
    const from = document.getElementById('transFrom').value;
    const to = document.getElementById('transTo').value;
    const output = document.getElementById('transOutput');
    
    if (!text) return;
    
    if(output) output.textContent = "TRANSLATING...";
    sounds.click();
    
    try {
        const encoded = encodeURIComponent(text);
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encoded}&langpair=${from}|${to}`);
        const data = await res.json();
        
        if (data.responseData && data.responseData.translatedText) {
            const translated = data.responseData.translatedText.toUpperCase();
            if(output) output.textContent = translated;
            addTransHistory(text, translated, from, to);
            sounds.coin();
        } else {
            if(output) output.textContent = "[TRANSLATION FAILED]";
        }
    } catch(e) {
        if(output) output.textContent = `[${to.toUpperCase()}] OFFLINE`;
    }
}

function addTransHistory(original, translated, from, to) {
    let history = [];
    try { history = JSON.parse(localStorage.getItem('transHistory') || '[]'); } catch(e) { history = []; }
    history.unshift({ original, translated, from, to, time: Date.now() });
    if(history.length > 5) history = history.slice(0, 5);
    localStorage.setItem('transHistory', JSON.stringify(history));
    renderTransHistory();
}

function renderTransHistory() {
    const el = document.getElementById('transHistory');
    if(!el) return;
    let history = [];
    try { history = JSON.parse(localStorage.getItem('transHistory') || '[]'); } catch(e) { history = []; }
    
    if(history.length === 0) {
        el.innerHTML = '<div style="text-align: center; opacity: 0.5; margin-top: 10px;">NO TRANSLATIONS YET</div>';
        return;
    }
    
    el.innerHTML = '';
    history.forEach(h => {
        const item = document.createElement('div');
        item.style.cssText = 'padding: 4px; border-bottom: 1px solid rgba(0,0,0,0.1); cursor: pointer;';
        item.innerHTML = `<div style="font-size:5px; opacity:0.5;">${h.from.toUpperCase()} → ${h.to.toUpperCase()}</div><div style="font-size:6px;">${h.original.substring(0,30).toUpperCase()}</div><div style="font-size:6px; opacity:0.7;">→ ${h.translated.substring(0,30)}</div>`;
        item.onclick = () => {
            document.getElementById('transInput').value = h.original;
            document.getElementById('transFrom').value = h.from;
            document.getElementById('transTo').value = h.to;
        };
        el.appendChild(item);
    });
}
function initStock() {
    const c = document.getElementById('stockCanvas'); if(!c) return; const ctx = c.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#0f380f';
    ctx.font = '8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ENTER TICKER ABOVE', c.width/2, c.height/2);
}

window.fetchStock = async function(ticker = 'AAPL') {
    const currEl = document.getElementById('stockCurrent');
    const companyEl = document.getElementById('stockCompany');
    const canvas = document.getElementById('stockCanvas');
    if(!currEl || !companyEl || !canvas) return;
    
    if(currEl) currEl.textContent = "LOADING...";
    if(companyEl) companyEl.textContent = "";
    currEl.style.display = 'block';
    companyEl.style.display = 'block';
    
    try {
        const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=7d`);
        const data = await res.json();
        const chart = data.chart?.result?.[0] || {};
        const quotes = chart?.indicators?.quote?.[0] || [];
        const closes = chart?.indicators?.close?.[0] || [];
        
        if(quotes.length > 0) {
            const lastClose = quotes[quotes.length - 1].close;
            const lastIdx = quotes.length - 1;
            
            if(currEl) currEl.textContent = lastClose !== undefined && lastClose !== null ? `$${lastClose.toFixed(2)}` : "N/A";
            
            // Get company name from summary detail if available
            const meta = chart?.result?.[0]?.meta || {};
            if(companyEl) companyEl.textContent = meta?.shortName || meta?.longName || ticker;
            
            drawSparkline(ctx, closes, c.width, c.height);
        } else {
            if(currEl) currEl.textContent = "NO DATA";
        }
    } catch(e) {
        if(currEl) currEl.textContent = "ERROR";
        if(companyEl) companyEl.textContent = "";
    }
};

function drawSparkline(ctx, closes, width, height) {
    if(!closes || closes.length === 0) {
        ctx.fillStyle = '#0f0';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('NO DATA', width/2, height/2);
        return;
    }
    
    const padding = 10;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    // Find min/max for scaling
    const minClose = Math.min(...closes);
    const maxClose = Math.max(...closes);
    const range = maxClose - minClose || 1;
    
    ctx.strokeStyle = '#0f380f';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    
    closes.forEach((price, i) => {
        const x = (i / (closes.length - 1)) * chartWidth + padding;
        const y = padding + chartHeight - ((price - minClose) / range) * chartHeight;
        
        if(i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    
    ctx.stroke();
    
    // Draw axis markers
    ctx.fillStyle = '#0f380f';
    ctx.font = '6px monospace';
    ctx.textAlign = 'center';
    
    // Draw labels at intervals
    const step = Math.max(1, Math.floor(closes.length / 5));
    closes.forEach((price, i) => {
        if(i % step === 0) {
            const x = (i / (closes.length - 1)) * chartWidth + padding;
            const y = padding + chartHeight - ((price - minClose) / range) * chartHeight;
            ctx.fillText(price.toFixed(2), x, y + 12);
        }
    });
}

window.fetchStockPrice = async function() {
    const ticker = document.getElementById('stockTicker').value.trim() || 'AAPL';
    const priceEl = document.getElementById('currentPrice');
    const companyEl = document.getElementById('companyName');
    const canvas = document.getElementById('stockCanvas');
    const ctx = canvas.getContext('2d');
    
    if(priceEl) priceEl.textContent = 'LOADING...';
    if(companyEl) companyEl.textContent = 'COMPANY NAME';
    companyEl.style.display = 'block';
    
    try {
        const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=7d`);
        const data = await res.json();
        const chart = data.chart.result[0];
        const closes = chart.meta.close || [];
        const timestamps = chart.timestamp || [];
        
        if (closes.length === 0) {
            if(priceEl) priceEl.textContent = 'NO DATA';
            return;
        }
        
        // Get current price (last close)
        const currentPrice = closes[closes.length - 1];
        if(priceEl) priceEl.textContent = `$${currentPrice.toFixed(2)}`;
        
        // Get company name from summary detail
        const name = chart.meta.summary ? chart.meta.summary : ticker;
        if(companyEl) companyEl.textContent = name;
        
        // Draw sparkline
        drawSparkline(ctx, closes, canvas.width, canvas.height);
        
    } catch(e) {
        if(priceEl) priceEl.textContent = 'ERROR';
        console.error(e);
    }
};

function drawSparkline(ctx, closes, width, height) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    
    if (closes.length < 2) return;
    
    const minT = Math.min(...closes);
    const maxT = Math.max(...closes);
    const range = maxT - minT || 1;
    
    ctx.strokeStyle = '#0f380f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    const stepX = width / (closes.length - 1);
    
    for (let i = 0; i < closes.length; i++) {
        const x = i * stepX;
        const y = height - ((closes[i] - minT) / range) * height;
        
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    
    ctx.stroke();
    
    // Draw dots at data points
    ctx.fillStyle = '#0f380f';
    ctx.font = '6px monospace';
    closes.forEach((price, i) => {
        const x = i * stepX;
        const y = height - ((price - minT) / range) * height;
        ctx.fillText(`${price.toFixed(2)}`, x - 20, y + 4);
    });
}
async function initCrypto() { refreshCrypto(); }
async function refreshCrypto() {
    const btc = document.getElementById('btcPrice'); if(btc) btc.textContent = "...";
    try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd'); const data = await res.json();
        if(btc) btc.textContent = `$${data.bitcoin.usd}`; _el = document.getElementById('ethPrice'); if(_el) _el.textContent = `$${data.ethereum.usd}`;
    } catch(e) { if(btc) btc.textContent = "OFFLINE"; }
}
// ========== BREATHING APP ==========
let breatheInterval = null;
let breatheRunning = false;
let breatheMode = '478';
let breatheSessionStart = 0;
let breatheSessionTimer = null;
const breatheModes = {
    '478': { name: '4-7-8', phases: [
        { label: 'BREATHE IN', duration: 4, scale: 1.4 },
        { label: 'HOLD', duration: 7, scale: 1.4 },
        { label: 'BREATHE OUT', duration: 8, scale: 0.6 }
    ]},
    'box': { name: 'BOX', phases: [
        { label: 'BREATHE IN', duration: 4, scale: 1.4 },
        { label: 'HOLD', duration: 4, scale: 1.4 },
        { label: 'BREATHE OUT', duration: 4, scale: 0.6 },
        { label: 'HOLD', duration: 4, scale: 0.6 }
    ]},
    'wim': { name: 'WIM HOF', phases: [
        { label: 'INHALE FAST', duration: 2, scale: 1.2, repeat: 15 },
        { label: 'HOLD', duration: 15, scale: 1.4 },
        { label: 'RECOVER', duration: 15, scale: 0.8 }
    ]}
};

window.setBreatheMode = function(mode) {
    breatheMode = mode;
    document.querySelectorAll('[id^="bm"]').forEach(b => { b.style.background = ''; b.style.color = ''; });
    const activeBtn = document.getElementById('bm' + mode.charAt(0).toUpperCase() + mode.slice(1));
    if(activeBtn) { activeBtn.style.background = 'var(--gb-text)'; activeBtn.style.color = 'var(--gb-bg)'; }
    if(breatheRunning) { stopBreathe(); startBreathe(); }
};

window.toggleBreathe = function() {
    if(breatheRunning) stopBreathe(); else startBreathe();
};

function startBreathe() {
    breatheRunning = true;
    breatheSessionStart = Date.now();
    _el = document.getElementById('breatheBtn'); if(_el) _el.textContent = 'STOP';
    _el = document.getElementById('breathePhase'); if(_el) _el.textContent = 'STARTING...';
    breatheSessionTimer = setInterval(updateBreatheSession, 1000);
    runBreatheCycle();
}

function stopBreathe() {
    breatheRunning = false;
    if(breatheInterval) { clearTimeout(breatheInterval); breatheInterval = null; }
    if(breatheSessionTimer) { clearInterval(breatheSessionTimer); breatheSessionTimer = null; }
    const circle = document.getElementById('breatheCircle');
    const text = document.getElementById('breatheText');
    if(circle) circle.style.transform = 'scale(1)';
    if(text) if(text) text.textContent = 'READY';
    _el = document.getElementById('breatheBtn'); if(_el) _el.textContent = 'START';
    _el = document.getElementById('breathePhase'); if(_el) _el.textContent = '';
    // Save session
    const elapsed = Math.floor((Date.now() - breatheSessionStart) / 1000);
    if(elapsed > 5) {
        const prev = parseInt(localStorage.getItem('breatheTotal') || '0');
        localStorage.setItem('breatheTotal', prev + elapsed);
    }
}

function runBreatheCycle() {
    if(!breatheRunning) return;
    const mode = breatheModes[breatheMode];
    let phaseIdx = 0;
    function runPhase() {
        if(!breatheRunning) return;
        if(phaseIdx >= mode.phases.length) { phaseIdx = 0; }
        const phase = mode.phases[phaseIdx];
        const circle = document.getElementById('breatheCircle');
        const text = document.getElementById('breatheText');
        const phaseEl = document.getElementById('breathePhase');
        if(text) if(text) text.textContent = phase.label;
        if(phaseEl) if(phaseEl) phaseEl.textContent = `${phase.label} — ${phase.duration}s`;
        if(circle) circle.style.transform = `scale(${phase.scale})`;
        // Countdown
        let remaining = phase.duration;
        const countdown = setInterval(() => {
            if(!breatheRunning) { clearInterval(countdown); return; }
            remaining--;
            if(remaining > 0 && phaseEl) if(phaseEl) phaseEl.textContent = `${phase.label} — ${remaining}s`;
        }, 1000);
        breatheInterval = setTimeout(() => {
            clearInterval(countdown);
            phaseIdx++;
            runPhase();
        }, phase.duration * 1000);
    }
    runPhase();
}

function updateBreatheSession() {
    const el = document.getElementById('breatheTimer');
    if(!el || !breatheSessionStart) return;
    const elapsed = Math.floor((Date.now() - breatheSessionStart) / 1000);
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    if(el) el.textContent = `SESSION: ${m}:${s.toString().padStart(2, '0')}`;
}

window.initBreathe = function() {
    if(breatheRunning) stopBreathe();
    const total = parseInt(localStorage.getItem('breatheTotal') || '0');
    const timerEl = document.getElementById('breatheTimer');
    if(timerEl && total > 0) {
        const tm = Math.floor(total / 60);
        const ts = total % 60;
        if(timerEl) timerEl.textContent = `TOTAL: ${tm}m ${ts}s | SESSION: 0:00`;
    }
};
// ========== MAPS ENHANCED ==========
let mapX = 0, mapY = 0;
let mapMarkers = [];

// Old SVG map removed — Leaflet-based initMap is at line 1641

function mapMove(dir) { 
    const map = document.getElementById('mapContent'); 
    if (dir === 'up') mapY += 50; 
    if (dir === 'down') mapY -= 50; 
    if (dir === 'left') mapX += 50; 
    if (dir === 'right') mapX -= 50; 
    // Clamp or allow infinite? Let's limit slightly
    mapX = Math.min(0, Math.max(-300, mapX));
    mapY = Math.min(0, Math.max(-300, mapY));
    
    map.style.transform = `translate(${mapX}px, ${mapY}px)`; 
}

function addMapMarker(x, y) {
    const icon = prompt("MARKER ICON (e.g. 📍, ⛺, 🚩):") || "📍";
    mapMarkers.push({ x, y, icon });
    renderMapMarkers();
    sounds.coin();
}

function renderMapMarkers() {
    const map = document.getElementById('mapContent');
    // Clear old markers (keeping static assets if any, assume dynamic only)
    // Actually, simply appending is safer if we don't track static ones.
    // Let's remove ONLY elements with class 'user-marker'
    const old = map.querySelectorAll('.user-marker');
    old.forEach(el => el.remove());
    
    mapMarkers.forEach(m => {
        const el = document.createElement('div');
        el.className = 'user-marker';
        if(el) el.textContent = m.icon;
        el.style.position = 'absolute';
        el.style.left = (m.x - 5) + 'px';
        el.style.top = (m.y - 10) + 'px'; // Center base
        el.style.fontSize = '10px';
        el.style.pointerEvents = 'none'; // Click through
        map.appendChild(el);
    });
}
let contacts = [{ name: 'PROF. OAK', phone: '555-001' }];
function initContacts() { renderContacts(); }
function renderContacts() { const list = document.getElementById('contactList'); list.innerHTML = ''; contacts.forEach(c => { const item = document.createElement('div'); item.style.cssText = `padding: 5px; border: 1px solid #333; margin-bottom: 2px;`; item.innerHTML = `<strong>${c.name}</strong><br>${c.phone}`; list.appendChild(item); }); }
function addContact() { const name = prompt("NAME:"); if(name) { contacts.push({ name: name.toUpperCase(), phone: '555-OS' }); renderContacts(); } }
function initBarcode() { 
    const placeholder = document.getElementById('qrPlaceholder');
    if (placeholder) placeholder.innerHTML = ''; 
}

function generateQR() {
    const input = document.getElementById('qrInput').value.trim();
    const placeholder = document.getElementById('qrPlaceholder');
    
    if (!input) {
        if(placeholder) placeholder.textContent = 'ENTER TEXT FIRST!';
        return;
    }
    
    if (input.length > 500) {
        if(placeholder) placeholder.textContent = 'TEXT TOO LONG!';
        return;
    }
    
    // Safely create image using DOM
    placeholder.innerHTML = '';
    const img = document.createElement('img');
    const encodedData = encodeURIComponent(input);
    img.src = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodedData}`;
    img.style.width = '100%';
    img.alt = 'QR Code';
    img.onerror = () => {
        if(placeholder) placeholder.textContent = 'QR GENERATION FAILED!';
    };
    placeholder.appendChild(img);
    sounds.click();
}
let alarmTimeStr = "07:00";
function initAlerts() { _el = document.getElementById('alarmTime'); if(_el) _el.textContent = alarmTimeStr; }
function adjAlarm(amt) { let [h, m] = alarmTimeStr.split(':').map(Number); h = (h + amt + 24) % 24; alarmTimeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`; _el = document.getElementById('alarmTime'); if(_el) _el.textContent = alarmTimeStr; }
function adjAlarmMin(amt) { let [h, m] = alarmTimeStr.split(':').map(Number); m = (m + amt + 60) % 60; alarmTimeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`; _el = document.getElementById('alarmTime'); if(_el) _el.textContent = alarmTimeStr; }
function toggleAlarm() { const btn = document.getElementById('alarmBtn'); if(btn) { btn.textContent = btn.textContent === 'SET ALARM' ? 'ALARM ACTIVE' : 'SET ALARM'; btn.style.background = btn.textContent === 'ALARM ACTIVE' ? '#f00' : '#33aa33'; } }
function initCredits() { sounds.launch(); }

// ========== PREVIOUS LOGIC ==========
let nvStream = null, nvInterval = null, nvFilter = 'night';
async function initNightVision() {
    const video = document.getElementById('nvVideo'), timeDisplay = document.getElementById('nvTime'); if (nvStream) stopNightVision();
    try {
        nvStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }); video.srcObject = nvStream;
        let startTime = Date.now(); nvInterval = setInterval(() => { const elapsed = Math.floor((Date.now() - startTime) / 1000); timeDisplay.textContent = `${Math.floor(elapsed/3600).toString().padStart(2, '0')}:${Math.floor((elapsed%3600)/60).toString().padStart(2, '0')}:${(elapsed%60).toString().padStart(2, '0')}`; }, 1000);
    } catch (e) { alert("CAMERA ERROR"); goBack(); }
}
function stopNightVision() { if (nvStream) nvStream.getTracks().forEach(t => t.stop()); if (nvInterval) clearInterval(nvInterval); }
function updateNVFilter(val) {
    const video = document.getElementById('nvVideo'), overlay = document.getElementById('nvEffectOverlay'), status = document.getElementById('nvStatus'); if(!video || !overlay || !status) return;
    video.style.filter = ''; overlay.style.background = ''; switch(val) {
        case 'night': video.style.filter = 'sepia(1) hue-rotate(100deg)'; overlay.style.background = 'rgba(0,255,0,0.2)'; break;
        case 'thermal': video.style.filter = 'invert(1) hue-rotate(180deg)'; overlay.style.background = 'rgba(255,0,0,0.1)'; break;
    }
}
function captureNVImage() { const canvas = document.getElementById('nvCaptureCanvas'); const link = document.createElement('a'); link.download = `GBOS_${Date.now()}.png`; link.href = canvas.toDataURL(); link.click(); }

// ========== VAULT APP ==========
let vaultInput = "";
window.initVault = function() {
    vaultInput = "";
    const disp = document.getElementById('vaultPinDisplay');
    if(disp) if(disp) disp.textContent = "____";
    const lock = document.getElementById('vaultLock');
    if(lock) lock.style.display='flex';
    const content = document.getElementById('vaultContent');
    if(content) content.style.display='none';
};

window.handleVaultInput = function(dir) {
    const code = { 'up': 'U', 'down': 'D', 'left': 'L', 'right': 'R' }[dir];
    if(!code || vaultInput.length >= 4) return;
    
    vaultInput += code;
    
    const len = vaultInput.length;
    _el = document.getElementById('vaultPinDisplay'); if(_el) _el.textContent = "*".repeat(len) + "_".repeat(Math.max(0, 4-len));
    
    sounds.click();
    
    if(len === 4) {
        if(vaultInput === "UUDD") {
            sounds.coin();
            document.getElementById('vaultLock').style.display='none';
            document.getElementById('vaultContent').style.display='block';
        } else {
            _el = document.getElementById('vaultPinDisplay'); if(_el) _el.textContent = "WRONG";
            setTimeout(window.initVault, 1000);
        }
    }
};

// ========== KARAOKE APP ==========
const karaoke = {
    init: () => {
        const screen = document.getElementById('karaokeScreen');
        if(!screen) return;
        screen.innerHTML = `
            <div style="padding: 10px; height: 100%; display: flex; flex-direction: column;">
                <div style="display: flex; gap: 5px; margin-bottom: 10px;">
                    <input type="text" id="kInput" placeholder="Song/Artist..." style="flex: 1; font-size: 8px;">
                    <button onclick="karaoke.search()" style="font-size: 8px;">🔍</button>
                    <button onclick="karaoke.back()" id="kBackBtn" style="font-size: 8px; display: none;">🔙</button>
                </div>
                <div id="kResults" style="flex: 1; overflow-y: auto; font-size: 8px;">
                    <div style="text-align: center; opacity: 0.7; margin-top: 20px;">SEARCH TO SING!</div>
                </div>
                <!-- Controls for Auto-Scroll -->
                <div id="kControls" style="display: none; justify-content: center; gap: 10px; margin-bottom: 5px; padding: 5px; background: rgba(0,0,0,0.1);">
                    <button onclick="karaoke.togglePlay()" id="kPlayBtn">▶ START</button> 
                    <button onclick="karaoke.scroll(-1)">⬆</button>
                    <button onclick="karaoke.scroll(1)">⬇</button>
                </div>
                <div id="kLyrics" style="display: none; flex: 1; overflow-y: auto; font-size: 9px; line-height: 1.6; text-align: center; white-space: pre-wrap; padding: 5px; background: rgba(0,0,0,0.05);"></div>
            </div>
        `;
    },
    search: async () => {
        const query = document.getElementById('kInput').value;
        const resDiv = document.getElementById('kResults');
        if(!query) return;
        resDiv.innerHTML = 'LOADING...';
        try {
            const res = await fetch(`https://api.lyrics.ovh/suggest/${encodeURIComponent(query)}`);
            const data = await res.json();
            resDiv.innerHTML = '';
            data.data.forEach(song => {
                const div = document.createElement('div');
                div.style.cssText = 'padding: 5px; border-bottom: 1px solid #333; cursor: pointer; display: flex; align-items: center; gap: 5px;';
                div.innerHTML = `<img src="${song.album.cover_small}" style="width: 20px; height: 20px;"> <div><b>${song.title}</b><br><span style="font-size: 6px;">${song.artist.name}</span></div>`;
                div.onclick = () => karaoke.loadLyrics(song.artist.name, song.title);
                resDiv.appendChild(div);
            });
        } catch(e) { resDiv.innerHTML = 'ERROR SEARCHING'; }
    },
    loadLyrics: async (artist, title) => {
        const resDiv = document.getElementById('kResults');
        const lyricDiv = document.getElementById('kLyrics');
        const ctrls = document.getElementById('kControls');
        const back = document.getElementById('kBackBtn');
        
        resDiv.style.display = 'none';
        lyricDiv.style.display = 'block';
        lyricDiv.innerHTML = 'FETCHING LYRICS...';
        back.style.display = 'block';
        
        try {
            // Try LRCLIB first
            let lyrics = '';
            try {
                const res = await fetch(`https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`);
                const data = await res.json();
                lyrics = data.syncedLyrics || data.plainLyrics;
            } catch(e) {}
            
            if(!lyrics) {
                // Fallback to OVH
                const res = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`);
                const data = await res.json();
                lyrics = data.lyrics;
            }
            
            if(lyrics) {
                // Formatting
                lyricDiv.innerHTML = '';
                const lines = lyrics.split('\n');
                lines.forEach((line, i) => {
                    // Remove timestamp for display if plain
                    const txt = line.replace(/^\[.*?\]/, '').trim();
                    if(txt) {
                        const d = document.createElement('div');
                        d.className = 'karaoke-line'; // Add CSS class if needed
                        d.textContent = txt;
                        d.style.padding = "2px";
                        d.style.cursor = "pointer";
                        d.onclick = () => {
                            document.querySelectorAll('.karaoke-line').forEach(l => l.style.background = 'transparent');
                            d.style.background = 'rgba(255, 255, 0, 0.3)';
                            d.scrollIntoView({behavior: "smooth", block: "center"});
                        };
                        lyricDiv.appendChild(d);
                    }
                });
                ctrls.style.display = 'flex';
            } else {
                if(lyricDiv) lyricDiv.textContent = 'NO LYRICS FOUND :(';
                // Still allow manual search or back
            }
        } catch(e) { if(lyricDiv) lyricDiv.textContent = 'ERROR LOADING LYRICS'; }
    },
    back: () => {
        document.getElementById('kResults').style.display = 'block';
        document.getElementById('kLyrics').style.display = 'none';
        document.getElementById('kControls').style.display = 'none';
        document.getElementById('kBackBtn').style.display = 'none';
        _el = document.getElementById('kLyrics'); if(_el) _el.textContent = '';
        karaoke.stopAutoScroll();
    },
    // Simple auto-scroller
    scrollTimer: null,
    togglePlay: () => {
        const btn = document.getElementById('kPlayBtn');
        if(karaoke.scrollTimer) {
            karaoke.stopAutoScroll();
            if(btn) btn.textContent = "▶ START";
        } else {
            const div = document.getElementById('kLyrics');
            karaoke.scrollTimer = setInterval(() => {
                div.scrollTop += 1;
            }, 50);
            if(btn) btn.textContent = "⏸ PAUSE";
        }
    },
    stopAutoScroll: () => {
        if(karaoke.scrollTimer) clearInterval(karaoke.scrollTimer);
        karaoke.scrollTimer = null;
    },
    scroll: (dir) => { document.getElementById('kLyrics').scrollTop += dir * 40; }
};
window.karaoke = karaoke;

// ========== MINER APP ==========
window.mineGem = function() {
    addGems(1 + idleUpgradeLevel);
    updateIdleDisplay();
    if(window.sounds && sounds.coin) sounds.coin();
    const btn = document.querySelector('#minerScreen button, #idleScreen button[onclick=\"mineGem()\"]');
    if(btn) {
        btn.style.transform = 'scale(0.9)';
        setTimeout(() => { btn.style.transform = 'scale(1)'; }, 100);
    }
    
    // Random bonus
    if(Math.random() > 0.95) {
        alert("CRITICAL HIT! +10 GEMS!");
        addGems(10);
    }
};

// ========== PERIODIC TABLE ==========
let chemistryData = null;

const categoryColors = {
    'diatomic nonmetal': '#e85d75',
    'noble gas': '#5dade2',
    'alkali metal': '#e74c3c',
    'alkaline earth metal': '#f39c12',
    'metalloid': '#2ecc71',
    'polyatomic nonmetal': '#e67e22',
    'transition metal': '#95a5a6',
    'post-transition metal': '#7f8c8d',
    'lanthanide': '#9b59b6',
    'actinide': '#8e44ad',
    'unknown': '#bdc3c7'
};

window.initElem = async function() {
    if(chemistryData) { buildPeriodicTable(); return; }
    try {
        const res = await fetch('chemistry.json');
        chemistryData = await res.json();
        buildPeriodicTable();
    } catch(e) {
        document.getElementById('elemGrid').innerHTML = '<div style="text-align:center; padding:20px; font-size:8px;">LOADING DATA...</div>';
    }
};

function buildPeriodicTable() {
    const grid = document.getElementById('elemGrid');
    if(!grid || !chemistryData) return;
    grid.innerHTML = '';
    
    const cells = {};
    Object.values(chemistryData).forEach(el => {
        const key = `${el.xpos}-${el.ypos}`;
        cells[key] = el;
    });
    
    for(let row = 1; row <= 7; row++) {
        for(let col = 1; col <= 18; col++) {
            const key = `${col}-${row}`;
            const el = cells[key];
            if(el) {
                const color = categoryColors[el.category] || '#bdc3c7';
                const box = document.createElement('div');
                box.style.cssText = `background:${color}; color:#fff; padding:1px; text-align:center; cursor:pointer; border-radius:2px; min-height:18px; display:flex; flex-direction:column; justify-content:center; line-height:1.1;`;
                box.innerHTML = `<div style="font-size:4px;">${el.number}</div><div style="font-size:6px; font-weight:bold;">${el.symbol}</div>`;
                box.onclick = () => showElemDetail(el);
                grid.appendChild(box);
            } else {
                grid.appendChild(document.createElement('div'));
            }
        }
    }
    
    const lanthanides = Object.values(chemistryData).filter(el => el.number >= 57 && el.number <= 71);
    lanthanides.forEach((el) => {
        const color = categoryColors[el.category] || '#9b59b6';
        const box = document.createElement('div');
        box.style.cssText = `background:${color}; color:#fff; padding:1px; text-align:center; cursor:pointer; border-radius:2px; min-height:18px; display:flex; flex-direction:column; justify-content:center; line-height:1.1;`;
        box.innerHTML = `<div style="font-size:4px;">${el.number}</div><div style="font-size:6px; font-weight:bold;">${el.symbol}</div>`;
        box.onclick = () => showElemDetail(el);
        grid.appendChild(box);
    });
}

window.showElemDetail = function(el) {
    const detail = document.getElementById('elemDetail');
    if(!detail) return;
    
    const color = categoryColors[el.category] || '#bdc3c7';
    
    // Fill the individual HTML elements
    const header = document.getElementById('elemDetailHeader');
    const number = document.getElementById('elemNumber');
    const mass = document.getElementById('elemMass');
    const symbol = document.getElementById('elemSymbol');
    const config = document.getElementById('elemConfig');
    const category = document.getElementById('elemCategory');
    
    if(header) header.innerHTML = `<div style="text-align:center;"><div style="display:inline-block; background:${color}; color:#fff; padding:8px 16px; border-radius:4px; font-size:30px; font-weight:bold; margin-bottom:6px;">${el.symbol}</div><div style="font-size:12px; font-weight:bold;">${el.name}</div></div>`;
    if(number) number.textContent = el.number;
    if(mass) mass.textContent = el.atomic_mass;
    if(symbol) symbol.textContent = el.symbol;
    if(config) config.textContent = el.electron_configuration || 'N/A';
    if(category) category.textContent = el.category ? el.category.toUpperCase() : 'N/A';
    
    detail.style.display = 'block';
};

window.closeElemDetail = function() {
    const detail = document.getElementById('elemDetail');
    if(detail) detail.style.display = 'none';
};

// ========== COIN FLIP ==========
window.tossCoin = function() {
    const display = document.getElementById('coinDisplay');
    const result = document.getElementById('coinResult');
    display.style.animation = 'spin 0.5s infinite linear';
    if(result) result.textContent = "FLIPPING...";
    sounds.launch();
    
    setTimeout(() => {
        display.style.animation = 'none';
        const isHeads = Math.random() > 0.5;
        if(display) display.textContent = isHeads ? '🪙' : '🦅';
        if(result) result.textContent = isHeads ? 'HEADS' : 'TAILS';
        sounds.coin();
    }, 1000);
};

// ========== DICE ROLLER ==========
window.rollDice = function() {
    const display = document.getElementById('diceDisplay');
    const result = document.getElementById('diceResult');
    display.style.animation = 'shake 0.3s infinite';
    if(result) result.textContent = "ROLLING...";
    sounds.launch();
    
    setTimeout(() => {
        display.style.animation = 'none';
        const roll = Math.floor(Math.random() * 6) + 1;
        const faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        if(display) display.textContent = faces[roll - 1];
        if(roll === 6) {
            if(result) result.textContent = "CRITICAL! +3 GEMS";
            addGems(3);
            sounds.coin();
        } else {
            if(result) result.textContent = `ROLLED A ${roll}`;
        }
    }, 800);
};

// ========== FORTUNE COOKIE ==========
window.crackCookie = function() {
    const text = document.getElementById('fortuneText');
    const fortunes = [
        "A game played is a game won.",
        "Update your software, update your life.",
        "Beware of glitches in the matrix.",
        "High scores await those who persist.",
        "Your battery is full of potential.",
        "A wild bug will appear soon.",
        "Save often, live freely."
    ];
    sounds.click();
    if(text) text.textContent = fortunes[Math.floor(Math.random() * fortunes.length)];
    addGems(1);
};

// ========== MORSE CONVERTER ==========
const morseCode = { 'A':'.-', 'B':'-...', 'C':'-.-.', 'D':'-..', 'E':'.', 'F':'..-.', 'G':'--.', 'H':'....', 'I':'..', 'J':'.---', 'K':'-.-', 'L':'.-..', 'M':'--', 'N':'-.', 'O':'---', 'P':'.--.', 'Q':'--.-', 'R':'.-.', 'S':'...', 'T':'-', 'U':'..-', 'V':'...-', 'W':'.--', 'X':'-..-', 'Y':'-.--', 'Z':'--..', '1':'.----', '2':'..---', '3':'...--', '4':'....-', '5':'.....', '6':'-....', '7':'--...', '8':'---..', '9':'----.', '0':'-----', ' ':' ' };
const reverseMorse = {};
Object.entries(morseCode).forEach(([k, v]) => { if(v !== ' ') reverseMorse[v] = k; });

let morseMode = 'encode';

window.setMorseMode = function(mode) {
    morseMode = mode;
    const encBtn = document.getElementById('morseEncodeBtn');
    const decBtn = document.getElementById('morseDecodeBtn');
    if(encBtn) { encBtn.style.background = mode === 'encode' ? 'var(--gb-text)' : ''; encBtn.style.color = mode === 'encode' ? 'var(--gb-bg)' : ''; }
    if(decBtn) { decBtn.style.background = mode === 'decode' ? 'var(--gb-text)' : ''; decBtn.style.color = mode === 'decode' ? 'var(--gb-bg)' : ''; }
    const input = document.getElementById('morseInput');
    if(input) {
        input.placeholder = mode === 'encode' ? 'ENTER TEXT...' : 'ENTER MORSE (use . and -)...';
        input.value = '';
    }
    const output = document.getElementById('morseOutput');
    if(output) if(output) output.textContent = '';
};

window.updateMorse = function() {
    const input = document.getElementById('morseInput').value;
    const output = document.getElementById('morseOutput');
    if(!output) return;
    
    if(morseMode === 'encode') {
        let result = '';
        for(let char of input.toUpperCase()) {
            result += (morseCode[char] || char) + ' ';
        }
        if(output) output.textContent = result.trim();
    } else {
        let result = '';
        const words = input.split('  ');
        words.forEach((word, wi) => {
            const letters = word.split(' ');
            letters.forEach(letter => {
                if(letter && reverseMorse[letter]) {
                    result += reverseMorse[letter];
                } else if(letter) {
                    result += '?';
                }
            });
            if(wi < words.length - 1) result += ' ';
        });
        if(output) output.textContent = result;
    }
};

window.playMorse = function() {
    const text = document.getElementById('morseOutput').textContent;
    if(!text) return;
    const ctx = window.audioCtx;
    if(ctx.state === 'suspended') ctx.resume();
    
    let time = ctx.currentTime + 0.1;
    const dot = 0.1;
    const dash = 0.3;
    const elementGap = 0.1;
    const letterGap = 0.3;
    const wordGap = 0.7;
    
    for(let char of text) {
        if(char === '.') {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.frequency.value = 600;
            o.type = 'sine';
            o.connect(g); g.connect(ctx.destination);
            g.gain.setValueAtTime(0.1, time);
            g.gain.exponentialRampToValueAtTime(0.001, time + dot);
            o.start(time); o.stop(time + dot);
            time += dot + elementGap;
        } else if(char === '-') {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.frequency.value = 600;
            o.type = 'sine';
            o.connect(g); g.connect(ctx.destination);
            g.gain.setValueAtTime(0.1, time);
            g.gain.exponentialRampToValueAtTime(0.001, time + dash);
            o.start(time); o.stop(time + dash);
            time += dash + elementGap;
        } else if(char === ' ') {
            time += wordGap;
        } else {
            time += letterGap;
        }
    }
};

window.initMorse = function() {
    const input = document.getElementById('morseInput');
    const output = document.getElementById('morseOutput');
    if(input) input.value = '';
    if(output) if(output) output.textContent = '';
};
// Beat Boy implementation moved to beat-boy.js

window.guessNumber = function() {
    const input = document.getElementById('guessInput');
    const fb = document.getElementById('guessFeedback');
    if(!input || !fb) return;
    
    if(!window.targetNum) window.targetNum = Math.floor(Math.random() * 100) + 1;
    if(!window.guesses) window.guesses = 0;
    
    // Validate input
    const inputValue = input.value.trim();
    if (!inputValue) {
        fb.innerHTML = "<span style='color:red'>ENTER A NUMBER!</span>";
        return;
    }
    
    const val = parseInt(inputValue);
    if(isNaN(val)) { 
        fb.innerHTML = "<span style='color:red'>MUST BE A NUMBER!</span>"; 
        return; 
    }
    
    if(val < 1 || val > 100) {
        fb.innerHTML = "<span style='color:red'>RANGE: 1-100!</span>";
        return;
    }
    
    window.guesses++;
    
    if(val === window.targetNum) {
        fb.innerHTML = `<span style='color:#0f0'>WIN! in ${window.guesses} guesses. +50 GEMS!</span>`;
        addGems(50);
        window.targetNum = Math.floor(Math.random() * 100) + 1;
        window.guesses = 0;
        sounds.launch();
    } else if(val < window.targetNum) {
        fb.innerHTML = `LOW <span style='font-size:12px'>↑</span> (${window.guesses})`;
        sounds.click();
    } else {
        fb.innerHTML = `HIGH <span style='font-size:12px'>↓</span> (${window.guesses})`;
        sounds.click();
    }
    input.value = '';
    input.focus();
};

window.initGuess = function() {
    window.targetNum = Math.floor(Math.random() * 100) + 1;
    window.guesses = 0;
    const fb = document.getElementById('guessFeedback');
    if(fb) if(fb) fb.textContent = "READY! (1-100)";
};

// Initial calls that might be missing
// initMorse is now defined above with the morse module

// ========== GUESS NUMBER GAME ==========
window.changeGuess = function(delta) {
    const input = document.getElementById('guessInput');
    if(!input) return;
    let val = parseInt(input.value) || 50;
    val += delta;
    if(val < 1) val = 1; if(val > 100) val = 100;
    input.value = val;
};
window.handleGuessInput = function(key) {
    if(key === 'ArrowUp') window.changeGuess(1);
    else if(key === 'ArrowDown') window.changeGuess(-1);
    else if(key === 'ArrowRight') window.changeGuess(10);
    else if(key === 'ArrowLeft') window.changeGuess(-10);
    else if(key === 'Enter' || key === 'a' || key === 'z') window.guessNumber();
};

window.initGuess = function() {
    const screen = document.getElementById('guessScreen');
    if(screen) {
        screen.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div id="guessFeedback" style="color: #9bbc0f; margin-bottom: 10px;">GUESS 1-100</div>
                <div style="display:flex; justify-content:center; align-items:center;">
                    <button onclick="changeGuess(-1)">-</button>
                    <input type="number" id="guessInput" style="width: 50px; text-align: center; margin: 0 5px;" value="50">
                    <button onclick="changeGuess(1)">+</button>
                </div>
                <button onclick="guessNumber()" style="margin-top: 10px;">GUESS</button>
                <div style="font-size: 8px; margin-top: 5px;">(Use D-Pad & A)</div>
            </div>
        `;
        window.targetNum = Math.floor(Math.random() * 100) + 1;
    }
};

// ========== IDLE MINER ==========

let idleUpgradeLevel = parseInt(localStorage.getItem('gbIdleLevel')) || 0;

window.buyIdleUpgrade = function() {
    const cost = 50 + idleUpgradeLevel * 25;
    if(!window.state || state.gems < cost) {
        alert('NEED ' + cost + ' GEMS FOR NEXT UPGRADE!');
        if(window.sounds && sounds.back) sounds.back();
        return;
    }
    state.gems -= cost;
    idleUpgradeLevel += 1;
    localStorage.setItem('gbIdleLevel', idleUpgradeLevel);
    saveState();
    updateIdleDisplay();
    if(window.sounds && sounds.coin) sounds.coin();
};

function updateIdleDisplay() {
    const gemsEl = document.getElementById('idleGems');
    const rateEl = document.getElementById('idleRate');
    const btn = document.getElementById('idleUpgradeBtn');
    const nextCost = 50 + idleUpgradeLevel * 25;
    if(gemsEl && window.state) gemsEl.textContent = 'GEMS: ' + state.gems;
    if(rateEl) rateEl.textContent = 'LEVEL: ' + idleUpgradeLevel + ' | BONUS: +' + idleUpgradeLevel + '/MINE';
    if(btn) btn.textContent = 'UPGRADE (' + nextCost + ' GEMS)';
}

window.initIdle = function() {
    const screen = document.getElementById('idleScreen');
    if(screen) {
        screen.innerHTML = `
            <div style="text-align: center; padding: 10px; font-size: 8px;">
                TAP TO MINE GEMS!<br><br>
                <button onclick="mineGem()" style="padding: 10px; font-size: 10px; margin-bottom: 10px;">⛏️ MINE</button>
                <br>
                <div id="idleGems" style="font-size: 10px; margin: 8px 0;">GEMS: 0</div>
                <div id="idleRate" style="font-size: 6px; margin-bottom: 10px;">LEVEL: 0 | BONUS: +0/MINE</div>
                <button onclick="buyIdleUpgrade()" id="idleUpgradeBtn" style="width: 100%; padding: 8px;">UPGRADE (50 GEMS)</button>
            </div>
        `;
        updateIdleDisplay();
    }
};

// ========== COMPASS ==========
window.initCompass = function() {
    const screen = document.getElementById('compassScreen');
    if(screen) screen.innerHTML = `<div style="font-size: 40px; text-align: center; margin-top: 40px;">🧭 N</div>`;
};

// ========== ZODIAC ==========
window.initZodiac = function() {
    const screen = document.getElementById('zodiacScreen');
    if(screen) {
        const today = new Date();
        const month = today.getMonth() + 1;
        const day = today.getDate();
        
        let sign = '';
        if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) sign = '♈ ARIES';
        else if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) sign = '♉ TAURUS';
        else if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) sign = '♊ GEMINI';
        else if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) sign = '♋ CANCER';
        else if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) sign = '♌ LEO';
        else if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) sign = '♍ VIRGO';
        else if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) sign = '♎ LIBRA';
        else if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) sign = '♏ SCORPIO';
        else if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) sign = '♐ SAGITTARIUS';
        else if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) sign = '♑ CAPRICORN';
        else if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) sign = '♒ AQUARIUS';
        else sign = '♓ PISCES';
        
        screen.innerHTML = `<div style="text-align: center; margin-top: 30px; font-size: 10px;">${sign}<br><br><span style="font-size: 8px;">TODAY: ${today.toLocaleDateString().toUpperCase()}</span></div>`;
    }
};

// ========== STOPWATCH ==========
// Moved to batch7.js — merged with Timer into tabbed screen

// ========== STREAK ==========
window.initStreak = function() {
    const screen = document.getElementById('streakScreen');
    if(screen) {
        const streak = localStorage.getItem('gbStreak') || 1;
        screen.innerHTML = `<div style="text-align: center; margin-top: 40px; font-size: 12px; color: #ff6347;">🔥 ${streak} DAY STREAK!</div>`;
    }
};

// ========== VOICE ==========
window.initVoice = function() {
    const screen = document.getElementById('voiceScreen');
    if(screen) screen.innerHTML = `<div style="text-align: center; margin-top: 40px; font-size: 8px;">🎤 RECORDING...<br>(Simulation)</div>`;
};

// ========== EGG ==========
window.initEgg = function() {
    const screen = document.getElementById('eggScreen');
    if(screen) screen.innerHTML = `<div style="text-align: center; margin-top: 40px; font-size: 40px; cursor: pointer;" onclick="crackEgg(this)">🥚</div><div style="text-align: center; font-size: 8px; margin-top: 5px;">TAP TO HATCH</div>`;
};
window.crackEgg = function(el) {
    el.innerHTML = '🐣';
    addGems(5);
    sounds.launch();
    setTimeout(() => alert("It hatched! +5 Gems"), 200);
};

// ========== WORLD ==========
// ========== WORLD (REAL GLOBAL SATELLITE) ==========
let worldMap = null;
window.initWorld = function() {
    const screen = document.getElementById('worldScreen');
    if(!screen) return;

    screen.innerHTML = `
        <div style="position: relative; width: 100%; height: 100%; background: #000;">
            <div id="worldMapLeaflet" style="width: 100%; height: 100%;"></div>
            <div style="position: absolute; top: 10px; left: 0; right: 0; text-align: center; pointer-events: none; z-index: 1000;">
                <span style="background: rgba(0,0,0,0.7); color: #0f0; padding: 5px 10px; font-family: 'VT323', monospace; border: 1px solid #0f0;">SATELLITE VIEW</span>
            </div>
            <div id="worldGpsDetails" style="position: absolute; bottom: 10px; left: 10px; right: 10px; background: rgba(0,0,0,0.8); color: #0f0; padding: 8px; font-size: 8px; font-family: monospace; z-index: 1000; border: 1px solid #0f0;">
                LOCATION: <span id="wLat">---</span>, <span id="wLng">---</span><br>
                DIST TO BASE: <span id="wHomeDist">---</span>
            </div>
        </div>
    `;

    if(!window.L) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
        
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => setupWorldMap();
        document.head.appendChild(script);
    } else {
        setupWorldMap();
    }
};

function setupWorldMap() {
    if(worldMap) worldMap.remove();
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            
            _el = document.getElementById('wLat'); if(_el) _el.textContent = lat.toFixed(4);
            _el = document.getElementById('wLng'); if(_el) _el.textContent = lng.toFixed(4);
            
            worldMap = L.map('worldMapLeaflet').setView([lat, lng], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OSM'
            }).addTo(worldMap);
            
            L.marker([lat, lng]).addTo(worldMap).bindPopup('YOU ARE HERE').openPopup();
            
            const home = JSON.parse(localStorage.getItem('gbHome'));
            if(home) {
                const dist = calculateDistance(lat, lng, home.lat, home.lng);
                _el = document.getElementById('wHomeDist'); if(_el) _el.textContent = dist.toFixed(2) + ' KM';
                L.marker([home.lat, home.lng], {
                    icon: L.divIcon({className: 'home-icon', html: '🏠', iconSize: [20, 20]})
                }).addTo(worldMap).bindPopup('HOUSE');
                L.polyline([[lat, lng], [home.lat, home.lng]], {color: 'red', dashArray: '5, 5'}).addTo(worldMap);
            }
        });
    }
}

// ========== MAPS (Interactive) ==========
// ========== MAPS (GPS & DISTANCE) ==========
// ========== MAPS (REAL GPS NAVIGATION) ==========
let navMap = null;
window.initMap = function() {
    const screen = document.getElementById('mapScreen');
    if(!screen) return;
    
    const home = JSON.parse(localStorage.getItem('gbHome')) || null;

    screen.innerHTML = `
        <div style="padding: 10px; height: 100%; display: flex; flex-direction: column; background: #9bbc0f; color: #0f380f; font-family: 'VT323', monospace;">
            <div style="font-size: 14px; text-align: center; border-bottom: 2px solid #0f380f; padding-bottom: 4px; margin-bottom: 8px;">NAV-COMP v3.0</div>
            
            <div id="mapLeafletContainer" style="flex: 1; border: 2px solid #0f380f; background: #000; position: relative;">
                <div id="navMapLeaflet" style="width: 100%; height: 100%;"></div>
                <div id="mapOverlay" style="position: absolute; top: 5px; right: 5px; background: rgba(0,0,0,0.7); color: #0f0; padding: 4px; font-size: 6px; z-index: 1000; border: 1px solid #0f0;">
                    DIST: <span id="mapHomeDist">---</span>
                </div>
            </div>

            <div style="display: flex; gap: 5px; margin-top: 10px;">
                <button onclick="setHomeLocation()" style="flex: 1; padding: 10px; border: 2px solid #0f380f; background: #0f380f; color: #9bbc0f; font-family: 'VT323', monospace;">SET HOUSE</button>
                <button onclick="updateMapGps()" style="flex: 1; padding: 10px; border: 2px solid #0f380f; background: transparent; color: #0f380f; font-family: 'VT323', monospace;">REFRESH</button>
            </div>
        </div>
    `;
    
    if(!window.L) {
        const link = document.createElement('link');
        link.rel = 'stylesheet'; link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => setupNavMap();
        document.head.appendChild(script);
    } else {
        setupNavMap();
    }
};

function setupNavMap() {
    if(navMap) navMap.remove();
    
    function createMap(lat, lng, zoom) {
        navMap = L.map('navMapLeaflet').setView([lat, lng], zoom);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(navMap);
        L.marker([lat, lng]).addTo(navMap).bindPopup('YOU').openPopup();
        
        const home = JSON.parse(localStorage.getItem('gbHome'));
        if(home) {
            const dist = calculateDistance(lat, lng, home.lat, home.lng);
            _el = document.getElementById('mapHomeDist'); if(_el) _el.textContent = dist.toFixed(2) + ' KM';
            L.marker([home.lat, home.lng], {
                icon: L.divIcon({className: 'home-icon', html: '🏠', iconSize: [20, 20]})
            }).addTo(navMap).bindPopup('HOUSE');
            L.polyline([[lat, lng], [home.lat, home.lng]], {color: 'blue', weight: 2}).addTo(navMap);
            const bounds = L.latLngBounds([[lat, lng], [home.lat, home.lng]]);
            navMap.fitBounds(bounds, {padding: [30, 30]});
        }
    }
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => createMap(pos.coords.latitude, pos.coords.longitude, 15),
            () => createMap(40.7128, -74.0060, 2), // Fallback: NYC, world view
            { timeout: 5000 }
        );
    } else {
        createMap(40.7128, -74.0060, 2);
    }
}

window.updateMapGps = function() {
    setupNavMap();
    sounds.click();
};

window.setHomeLocation = function() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            const home = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            localStorage.setItem('gbHome', JSON.stringify(home));
            sounds.launch();
            alert("BASE LOCATION SET!");
            initMap();
        });
    }
};

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}


// ========== CURRENCY CONVERTER ==========
window.initCurrency = async function() {
    const screenEl = document.getElementById('currencyScreen');
    if(!screenEl) return;
    
    screenEl.innerHTML = `
        <div style="padding: 10px; display: flex; flex-direction: column; height: 100%;">
            <div style="font-size: 8px; margin-bottom: 6px; text-align: center;">CURRENCY EXCH</div>
            <div style="display: flex; gap: 4px; margin-bottom: 6px;">
                <select id="fromCurrency" style="flex: 1; font-size: 7px; padding: 4px;">
                    <option value="USD">🇺🇸 USD</option>
                    <option value="EUR">🇪🇺 EUR</option>
                    <option value="GBP">🇬🇧 GBP</option>
                    <option value="JPY">🇯🇵 JPY</option>
                    <option value="CNY">🇨🇳 CNY</option>
                    <option value="INR">🇮🇳 INR</option>
                    <option value="BRL">🇧🇷 BRL</option>
                    <option value="CAD">🇨🇦 CAD</option>
                    <option value="AUD">🇦🇺 AUD</option>
                    <option value="CHF">🇨🇭 CHF</option>
                </select>
                <select id="toCurrency" style="flex: 1; font-size: 7px; padding: 4px;">
                    <option value="USD">🇺🇸 USD</option>
                    <option value="EUR">🇪🇺 EUR</option>
                    <option value="GBP">🇬🇧 GBP</option>
                    <option value="JPY">🇯🇵 JPY</option>
                    <option value="CNY">🇨🇳 CNY</option>
                    <option value="INR">🇮🇳 INR</option>
                    <option value="BRL">🇧🇷 BRL</option>
                    <option value="CAD">🇨🇦 CAD</option>
                    <option value="AUD">🇦🇺 AUD</option>
                    <option value="CHF">🇨🇭 CHF</option>
                </select>
            </div>
            <div style="font-size: 6px; margin-bottom: 4px; opacity: 0.7;">AMOUNT:</div>
            <input type="number" id="currencyAmount" value="1" style="width: 100%; padding: 8px; margin-bottom: 6px; font-size: 16px; box-sizing: border-box;">
            <div style="font-size: 6px; margin-bottom: 4px; opacity: 0.7;">RESULT:</div>
            <div id="currencyResult" style="background: rgba(0,0,0,0.1); padding: 6px; min-height: 50px; font-size: 7px; word-break: break-all; border: 1px solid var(--gb-text); border-radius: 4px; margin-bottom: 6px; font-family: monospace;">1.00 USD = ---</div>
            <button onclick="swapCurrencies()" style="width: 100%; margin-bottom: 6px; padding: 8px;">SWAP CURRENCIES</button>
        </div>
    `;
    await loadCurrencyRates();
};

let fromRate = 1;
let toRate = 1;
let rates = {};
window.loadCurrencyRates = async function() {
    try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await res.json();
        if(data.rates) {
            rates = data.rates;
            populateCurrencyFlags(data.rates);
            fromRate = data.rates.USD || 1;
            toRate = data.rates.USD || 1;
            updateCurrencyDisplay();
        }
    } catch(e) {
        console.error("Currency API Error", e);
    }
};
// Define updateCurrencyDisplay — called after rates load
window.updateCurrencyDisplay = function() {
    const amountEl = document.getElementById('currencyAmount');
    const fromEl = document.getElementById('fromCurrency');
    const toEl = document.getElementById('toCurrency');
    const resultEl = document.getElementById('currencyResult');
    if(!amountEl || !fromEl || !toEl || !resultEl) return;
    const amount = parseFloat(amountEl.value) || 1;
    const fromCode = fromEl.value;
    const toCode = toEl.value;
    if(!rates[fromCode] || !rates[toCode]) {
        if(resultEl) resultEl.textContent = 'Loading rates...';
        return;
    }
    const result = amount * (rates[toCode] / rates[fromCode]);
    if(resultEl) resultEl.textContent = amount + ' ' + fromCode + ' = ' + result.toFixed(2) + ' ' + toCode;
};

function populateCurrencyFlags(rates) {
    const fromSel = document.getElementById('fromCurrency');
    const toSel = document.getElementById('toCurrency');
    if(!fromSel || !toSel) return;
    
    const currencies = {USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧', JPY: '🇯🇵', CNY: '🇨🇳', INR: '🇮🇳', BRL: '🇧🇷', CAD: '🇨🇦', AUD: '🇦🇺', CHF: '🇨🇭'};
    
    for(const [code, flag] of Object.entries(currencies)) {
        if(fromSel.querySelector(`option[value="${code}"]`)) {
            fromSel.querySelector(`option[value="${code}"]`).textContent = `${flag} ${code}`;
        }
        if(toSel.querySelector(`option[value="${code}"]`)) {
            toSel.querySelector(`option[value="${code}"]`).textContent = `${flag} ${code}`;
        }
    }
}

window.updateCurrency = async function() {
    const amountEl = document.getElementById('currencyAmount');
    const fromEl = document.getElementById('fromCurrency');
    const toEl = document.getElementById('toCurrency');
    const resultEl = document.getElementById('currencyResult');
    if(!amountEl || !fromEl || !toEl || !resultEl) return;
    const amount = parseFloat(amountEl.value) || 1;
    const fromCode = fromEl.value;
    const toCode = toEl.value;
    
    if(!rates[fromCode] || !rates[toCode]) {
        if(resultEl) resultEl.textContent = "Loading rates...";
        return;
    }
    
    const result = amount * (rates[toCode] / rates[fromCode]);
    if(resultEl) resultEl.textContent = `${amount} ${fromCode} = ${result.toFixed(2)} ${toCode}`;
};

window.swapCurrencies = function() {
    const fromSel = document.getElementById('fromCurrency');
    const toSel = document.getElementById('toCurrency');
    if(!fromSel || !toSel) return;
    
    const temp = fromSel.value;
    fromSel.value = toSel.value;
    toSel.value = temp;
    
    updateCurrency();
};

// ========== FLASHLIGHT ==========
let isTorchOn = false;
window.toggleFlashlight = async function() {
    isTorchOn = !isTorchOn;
    sounds.click();
    
    // Visual feedback for non-camera devices
    const screen = document.querySelector('.game-screen.active');
    if(screen) {
        screen.style.boxShadow = isTorchOn ? '0 0 50px #fff inset' : 'none';
        screen.style.backgroundColor = isTorchOn ? '#fff' : '';
    }

    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevice = devices.find(device => device.kind === 'videoinput');
        if (videoDevice) {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: videoDevice.deviceId, facingMode: 'environment' }
            });
            const track = stream.getVideoTracks()[0];
            const capabilities = track.getCapabilities();
            if (capabilities.torch) {
                await track.applyConstraints({ advanced: [{ torch: isTorchOn }] });
            }
        }
    } catch (e) {
        console.warn("Flashlight not available", e);
    }
};

function initPaint() {
    const canvas = document.getElementById('paintCanvas');
    if(!canvas) return;
    paintCtx = canvas.getContext('2d');
    paintCtx.lineCap = 'round';
    paintCtx.fillStyle = '#fff';
    paintCtx.fillRect(0,0,canvas.width,canvas.height);
    
    canvas.onmousedown = startPainting;
    canvas.onmouseup = stopPainting;
    canvas.onmousemove = drawPaint;
    
    // Touch support
    canvas.ontouchstart = (e) => { e.preventDefault(); startPainting(e.touches[0]); };
    canvas.ontouchend = (e) => { e.preventDefault(); stopPainting(); };
    canvas.ontouchmove = (e) => { e.preventDefault(); drawPaint(e.touches[0]); };
}
window.initPaint = initPaint;

function startPainting(e) {
    isPainting = true;
    drawPaint(e);
}

function stopPainting() {
    isPainting = false;
    if(paintCtx) paintCtx.beginPath();
}

function drawPaint(e) {
    if(!isPainting || !paintCtx) return;
    const canvas = document.getElementById('paintCanvas');
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    paintCtx.lineWidth = document.getElementById('brushSize').value;
    paintCtx.strokeStyle = document.getElementById('paintColor').value;
    
    paintCtx.lineTo(x, y);
    paintCtx.stroke();
    paintCtx.beginPath();
    paintCtx.moveTo(x, y);
}

window.paintFunc = function(action) {
    if(action === 'clear') {
        initPaint(); // Reset canvas
    }
};

// ========== STUBS FOR OTHER APPS ==========
// To prevent crashes when launching incomplete apps
window.nextFlashcard = () => { _el = document.getElementById('flashCard'); if(_el) _el.textContent = "Concept: CLOSURE"; };
window.startClock = () => { 
    if(window.clockInterval) clearInterval(window.clockInterval);
    window.clockInterval = setInterval(() => {
        const d = new Date();
        _el = document.getElementById('bigClock'); if(_el) _el.textContent = d.toLocaleTimeString();
        _el = document.getElementById('bigDate'); if(_el) _el.textContent = d.toDateString();
    }, 1000);
};
window.updateWeather = () => { _el = document.getElementById('weatherText'); if(_el) _el.textContent = "SIMULATED SUN"; };
// Riddles
let riddles = [
    { q: "WHAT HAS KEYS BUT NO LOCKS?", a: "A PIANO" },
    { q: "WHAT HAS A HEART BUT NO ORGANS?", a: "AN ARTICHOKE" },
    { q: "WHAT HAS HANDS BUT CAN'T CLAP?", a: "A CLOCK" },
    { q: "WHAT GETS WET WHILE DRYING?", a: "A TOWEL" },
    { q: "I HAVE CITIES BUT NO HOUSES?", a: "A MAP" }
];
let currentRiddleIdx = 0;

window.initRiddle = () => {
    currentRiddleIdx = Math.floor(Math.random() * riddles.length);
    const q = document.getElementById('riddleQuestion');
    const a = document.getElementById('riddleAnswer');
    if(q && a) {
        if(q) q.textContent = riddles[currentRiddleIdx].q;
        if(a) a.textContent = riddles[currentRiddleIdx].a;
        a.style.display = 'none';
        document.getElementById('riddleBtn').style.display = 'block';
        document.getElementById('nextRiddleBtn').style.display = 'none';
    }
};

window.nextRiddle = () => {
    window.initRiddle();
    sounds.click();
};

window.revealRiddle = () => {
    const a = document.getElementById('riddleAnswer');
    if(a) a.style.display = 'block';
    document.getElementById('riddleBtn').style.display = 'none';
    const nb = document.getElementById('nextRiddleBtn');
    if(nb) nb.style.display = 'block';
    sounds.coin();
};

// Pet stubs
window.updatePetUI = () => { /* basic updates happen in HTML */ };
window.feedPet = () => { 
    state.pet.hunger = Math.min(100, state.pet.hunger + 20); 
    saveState(); 
    document.getElementById('petEmoji').innerHTML = '😋';
    setTimeout(() => document.getElementById('petEmoji').innerHTML = '👾', 1000);
    sounds.coin();
};
window.playPet = () => {
    state.pet.happy = Math.min(100, state.pet.happy + 15);
    state.pet.energy = Math.max(0, state.pet.energy - 10);
    saveState();
    document.getElementById('petEmoji').innerHTML = '🎾';
    setTimeout(() => document.getElementById('petEmoji').innerHTML = '👾', 1000);
    sounds.launch();
};

// ========== TIMER ==========
// Merged into batch7.js — see merged timer+stopwatch screen

// ========== CALENDAR ==========
window.initCalendar = () => {
    const today = new Date();
    _el = document.getElementById('calToday'); if(_el) _el.textContent = today.toDateString();
    const grid = document.getElementById('calGrid');
    if(grid) {
        grid.innerHTML = '';
        for(let i=1; i<=31; i++) {
            const d = document.createElement('div');
            d.textContent = i;
            if(i === today.getDate()) d.style.background = '#0f380f'; d.style.color = '#9bbc0f';
            grid.appendChild(d);
        }
    }
};


// ========== MINER APP ==========
window.initMiner = function() {
    const screen = document.getElementById('minerScreen');
    if(screen) {
        screen.innerHTML = `
            <div style="text-align: center; padding-top: 30px;">
                <div style="font-size: 40px; margin-bottom: 20px;">💎</div>
                <button onclick="mineGem()" style="padding: 10px 20px;">MINE GEM</button>
            </div>
        `;
    }
};

// ========== COIN FLIP ==========
window.initCoin = function() {
    const screen = document.getElementById('coinScreen');
    if(screen) {
        screen.innerHTML = `
            <div style="text-align: center; padding-top: 30px;">
                <div id="coinDisplay" style="font-size: 40px; margin-bottom: 20px;">🪙</div>
                <div id="coinResult" style="height: 20px; font-weight: bold;"></div>
                <button onclick="tossCoin()" style="margin-top: 10px;">FLIP</button>
            </div>
        `;
    }
};

// ========== DICE ROLLER ==========
window.initDice = function() {
    const screen = document.getElementById('diceScreen');
    if(screen) {
        screen.innerHTML = `
            <div style="text-align: center; padding-top: 30px;">
                <div id="diceDisplay" style="font-size: 40px; margin-bottom: 20px;">🎲</div>
                <div id="diceResult" style="height: 20px; font-weight: bold;"></div>
                <button onclick="rollDice()" style="margin-top: 10px;">ROLL</button>
            </div>
        `;
    }
};

// ========== FORTUNE COOKIE ==========
window.initFortune = function() {
    const screen = document.getElementById('fortuneScreen');
    if(screen) {
        screen.innerHTML = `
            <div style="text-align: center; padding-top: 20px;">
                <div style="font-size: 40px; margin-bottom: 10px; cursor: pointer;" onclick="crackCookie()">🥠</div>
                <div style="font-size: 10px; margin-bottom: 10px;">TAP COOKIE</div>
                <div id="fortuneText" style="padding: 10px; border: 1px dotted #0f380f; min-height: 40px; font-size: 8px;"></div>
            </div>
        `;
    }
};

// ========== 8-BALL ==========
window.initBall = function() {
    const screen = document.getElementById('ballScreen');
    if(screen) {
        screen.innerHTML = `
            <div style="text-align: center; padding-top: 20px;">
                <div style="font-size: 50px; cursor: pointer;" onclick="shakeBall()">🎱</div>
                <div id="ballAnswer" style="margin-top: 20px; font-weight: bold; min-height: 20px; color: #000; background: #9bbc0f; padding: 5px;">TAP TO SHAKE</div>
            </div>
        `;
    }
};
window.shakeBall = function() {
    const ans = document.getElementById('ballAnswer');
    const responses = ["YES", "NO", "MAYBE", "TRY AGAIN", "DOUBTFUL", "CERTAINLY"];
    if(ans) ans.textContent = "...";
    sounds.launch();
    setTimeout(() => {
        if(ans) ans.textContent = responses[Math.floor(Math.random() * responses.length)];
        sounds.coin();
    }, 1000);
};

// ========== CALCULATOR ==========
window.initCalc = function() {
    const screen = document.getElementById('calcScreen');
    if(screen) {
        screen.innerHTML = `
            <div style="padding: 10px;">
                <input id="calcDisplay" readonly style="width: 100%; text-align: right; margin-bottom: 5px; background: #8bac0f;">
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 2px;">
                    <button onclick="calcFunc('7')">7</button><button onclick="calcFunc('8')">8</button><button onclick="calcFunc('9')">9</button><button onclick="calcFunc('/')">/</button>
                    <button onclick="calcFunc('4')">4</button><button onclick="calcFunc('5')">5</button><button onclick="calcFunc('6')">6</button><button onclick="calcFunc('*')">*</button>
                    <button onclick="calcFunc('1')">1</button><button onclick="calcFunc('2')">2</button><button onclick="calcFunc('3')">3</button><button onclick="calcFunc('-')">-</button>
                    <button onclick="calcFunc('0')">0</button><button onclick="calcFunc('.')">.</button><button onclick="calcFunc('=')">=</button><button onclick="calcFunc('+')">+</button>
                    <button onclick="calcFunc('C')" style="grid-column: span 2;">C</button><button onclick="calcFunc('BSP')" style="grid-column: span 2;">DEL</button>
                </div>
            </div>
        `;
    }
};

let calcExpr = '';
let calcSciMode = false;
window.calcFunc = function(val) {
    const disp = document.getElementById('calcDisplay');
    if(!disp) return;
    if(val === 'SCI') {
        calcSciMode = !calcSciMode;
        const row = document.getElementById('calcSciRow');
        if(row) row.style.display = calcSciMode ? 'grid' : 'none';
        return;
    }
    if(val === 'C') { calcExpr = ''; disp.value = '0'; }
    else if(val === 'BSP') { calcExpr = calcExpr.slice(0, -1); disp.value = calcExpr || '0'; }
    else if(val === '=') { 
        try {
            let expr = calcExpr.replace(/\^/g, '**');
            disp.value = eval(expr) || '0'; calcExpr = disp.value;
        } 
        catch { disp.value = 'ERR'; calcExpr = ''; }
    }
    else if(val === 'sin') {
        try { const v = eval(calcExpr || '0'); calcExpr = String(Math.sin(v * Math.PI / 180)); disp.value = calcExpr; } catch { disp.value = 'ERR'; }
    }
    else if(val === 'cos') {
        try { const v = eval(calcExpr || '0'); calcExpr = String(Math.cos(v * Math.PI / 180)); disp.value = calcExpr; } catch { disp.value = 'ERR'; }
    }
    else if(val === 'tan') {
        try { const v = eval(calcExpr || '0'); calcExpr = String(Math.tan(v * Math.PI / 180)); disp.value = calcExpr; } catch { disp.value = 'ERR'; }
    }
    else if(val === 'sqrt') {
        try { const v = eval(calcExpr || '0'); calcExpr = String(Math.sqrt(v)); disp.value = calcExpr; } catch { disp.value = 'ERR'; }
    }
    else if(val === 'pi') {
        calcExpr += String(Math.PI); disp.value = calcExpr;
    }
    else if(val === 'log') {
        try { const v = eval(calcExpr || '0'); calcExpr = String(Math.log10(v)); disp.value = calcExpr; } catch { disp.value = 'ERR'; }
    }
    else if(val === 'ln') {
        try { const v = eval(calcExpr || '0'); calcExpr = String(Math.log(v)); disp.value = calcExpr; } catch { disp.value = 'ERR'; }
    }
    else {
        if(calcExpr.length < 15) {
            calcExpr += val;
            disp.value = calcExpr;
        }
    }
};

// ========== NEW AWESOME APPS ==========
window.initJoke = function() {};
window.getJoke = async function() {
    const txt = document.getElementById('jokeText');
    if(txt) {
        txt.innerHTML = "LOADING...";
        sounds.click();
        try {
            const res = await fetch('https://v2.jokeapi.dev/joke/Any?type=single&safe-mode');
            const data = await res.json();
            txt.innerHTML = (data.joke || data.setup + ' ' + data.delivery).toUpperCase();
            sounds.coin();
        } catch(e) { txt.innerHTML = "OFFLINE"; }
    }
};

window.initFact = function() {};
window.getFact = async function() {
    const txt = document.getElementById('factText');
    if(txt) {
        txt.innerHTML = "LOADING...";
        sounds.click();
        try {
            const res = await fetch('https://uselessfacts.jsph.pl/random.json?language=en');
            const data = await res.json();
            txt.innerHTML = data.text.toUpperCase();
            sounds.coin();
        } catch(e) { txt.innerHTML = "OFFLINE"; }
    }
};

window.initDog = function() {};
window.getDog = async function() {
    const img = document.getElementById('dogImg');
    const ph = document.getElementById('dogPlaceholder');
    if(img) {
        ph.style.display = 'block'; img.style.display = 'none';
        sounds.click();
        try {
            const res = await fetch('https://dog.ceo/api/breeds/image/random');
            const data = await res.json();
            if(data.status === 'success') {
                img.src = data.message;
                img.onload = () => { ph.style.display = 'none'; img.style.display = 'block'; sounds.coin(); };
            }
        } catch(e) {}
    }
};

// ========== BOOK READER (OPENLIBRARY) ==========
window.initBook = function() {};

window.searchBook = async function() {
    const q = document.getElementById('bookSearch').value;
    const list = document.getElementById('bookList');
    if(!q || !list) return;
    list.innerHTML = '<div style="padding:10px;text-align:center;">SEARCHING LIBRARY...</div>';
    if(window.sounds) sounds.click();

    try {
        const res = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=20`);
        const data = await res.json();
        list.innerHTML = '';

        if(!data.docs || data.docs.length === 0) {
            list.innerHTML = '<div style="padding:10px;text-align:center;">NO BOOKS FOUND</div>';
            return;
        }

        data.docs.forEach(book => {
            const d = document.createElement('div');
            d.style.cssText = "padding: 6px; border-bottom: 1px dashed rgba(15,56,15,0.3); display: flex; gap: 6px; align-items: center; cursor: pointer;";
            const coverId = book.cover_i;
            const coverUrl = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-S.jpg` : '';
            const author = book.author_name ? book.author_name[0] : 'Unknown';
            const year = book.first_publish_year || '????';

            d.innerHTML = `
                ${coverUrl ? `<img src="${coverUrl}" style="width:30px;height:42px;object-fit:cover;border:1px solid var(--gb-text);flex-shrink:0;">` : '<div style="width:30px;height:42px;background:rgba(15,56,15,0.15);border:1px solid var(--gb-text);flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:10px;">📖</div>'}
                <div style="flex:1;min-width:0;">
                    <div style="font-size: 7px; font-weight: bold; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;">${book.title.toUpperCase()}</div>
                    <div style="font-size: 5px; opacity: 0.7;">${author} (${year})</div>
                </div>
            `;
            d.onclick = () => showBookDetail(book);
            list.appendChild(d);
        });
        if(window.sounds) sounds.launch();
    } catch(e) {
        list.innerHTML = '<div style="padding:10px;text-align:center;">LIBRARY CLOSED (ERROR)</div>';
    }
};

window.showBookDetail = function(book) {
    const detail = document.getElementById('bookDetail');
    const cover = document.getElementById('bookCover');
    const title = document.getElementById('bookTitle');
    const author = document.getElementById('bookAuthor');
    const year = document.getElementById('bookYear');
    const desc = document.getElementById('bookDesc');
    const link = document.getElementById('bookLink');
    if(!detail) return;

    const coverId = book.cover_i;
    if(coverId) {
        cover.src = `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
        cover.style.display = 'block';
    } else {
        cover.style.display = 'none';
    }
    if(title) title.textContent = book.title ? book.title.toUpperCase() : 'UNKNOWN';
    if(author) author.textContent = book.author_name ? 'BY ' + book.author_name.join(', ') : 'BY Unknown';
    if(year) year.textContent = book.first_publish_year ? 'PUBLISHED ' + book.first_publish_year : '';
    if(desc) desc.textContent = book.first_sentence ? (Array.isArray(book.first_sentence) ? book.first_sentence[0] : book.first_sentence) : 'No description available.';
    const key = book.key || '';
    link.href = key ? `https://openlibrary.org${key}` : '#';
    link.style.display = key ? 'inline-block' : 'none';
    detail.style.display = 'block';
    if(window.sounds) sounds.coin();
};

window.closeBookDetail = function() {
    const detail = document.getElementById('bookDetail');
    if(detail) detail.style.display = 'none';
};

document.getElementById('bookSearch')?.addEventListener('keydown', (e) => {
    if(e.key === 'Enter') searchBook();
});
window.initIp = function() {};

window.getIpInfo = async function() {
    const ipAddr = document.getElementById('ipAddr');
    const ipCity = document.getElementById('ipCity');
    const ipCountry = document.getElementById('ipCountry');
    const ipTz = document.getElementById('ipTz');
    const ipIsp = document.getElementById('ipIsp');
    const ipInfo = document.getElementById('ipInfo');
    const ipSpeed = document.getElementById('ipSpeed');
    const speedResult = document.getElementById('speedResult');
    if(!ipAddr) return;
    
    if(ipAddr) ipAddr.textContent = "...";
    if(ipCity) ipCity.textContent = "...";
    if(ipCountry) ipCountry.textContent = "...";
    if(ipTz) ipTz.textContent = "...";
    if(ipIsp) ipIsp.textContent = "...";
    if(ipInfo) ipInfo.style.display = 'none';
    if(ipSpeed) ipSpeed.style.display = 'none';
    if(speedResult) speedResult.style.display = 'none';
    sounds.click();
    
    try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if(ipAddr) ipAddr.textContent = data.ip;
        if(ipCity) ipCity.textContent = data.city;
        if(ipCountry) ipCountry.textContent = data.country_name;
        if(ipTz) ipTz.textContent = data.timezone;
        if(ipIsp) ipIsp.textContent = data.org;
        if(ipInfo) ipInfo.style.display = 'block';
        sounds.coin();
    } catch(e) {
        if(ipAddr) ipAddr.textContent = "ERROR";
    }
};

window.runSpeedTest = async function() {
    const ipInfo = document.getElementById('ipInfo');
    const speedResult = document.getElementById('speedResult');
    const speedMbps = document.getElementById('speedMbps');
    if(!speedMbps) return;
    
    if(speedMbps) speedMbps.textContent = "TESTING...";
    if(ipInfo) ipInfo.style.display = 'none';
    if(speedResult) speedResult.style.display = 'block';
    
    const start = Date.now();
    try {
        const res = await fetch('https://speed.cloudflare.com/__down?bytes=10000000');
        const end = Date.now();
        const timeMs = end - start;
        // bytes * 8 / (time * 1000000) = Mbps
        const mbps = Math.round((10000000 * 8) / (timeMs * 1000000) * 10) / 10;
        if(speedMbps) speedMbps.textContent = `${mbps} Mbps`;
    } catch(e) {
        if(speedMbps) speedMbps.textContent = "FAILED";
    }
};

// ========== POKEDEX ==========
const typeColors = {
    normal:'#A8A878', fire:'#F08030', water:'#6890F0', electric:'#F8D030',
    grass:'#78C850', ice:'#98D8D8', fighting:'#C03028', poison:'#A040A0',
    ground:'#E0C068', flying:'#A890F0', psychic:'#F85888', bug:'#A8B820',
    rock:'#B8A038', ghost:'#705898', dragon:'#7038F8', dark:'#705848',
    steel:'#B8B8D0', fairy:'#EE99AC'
};

window.initPokedex = function() {
    loadPokeTypeFilter();
};

async function loadPokeTypeFilter() {
    const sel = document.getElementById('pokeTypeFilter');
    if(!sel || sel.options.length > 1) return;
    try {
        const res = await fetch('https://pokeapi.co/api/v2/type');
        const data = await res.json();
        data.results.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.name;
            opt.textContent = t.name.toUpperCase();
            sel.appendChild(opt);
        });
    } catch(e) {}
}

window.searchPokemon = async function() {
    const q = document.getElementById('pokeSearch').value.toLowerCase().trim();
    if(!q) return;

    _el = document.getElementById('pokeName'); if(_el) _el.textContent = "SEARCHING...";
    document.getElementById('pokeTypeChips').innerHTML = '';
    document.getElementById('pokeStats').innerHTML = '';
    document.getElementById('pokeEvolution').innerHTML = '';
    _el = document.getElementById('pokeId'); if(_el) _el.textContent = '';
    document.getElementById('pokeImg').style.display = 'none';
    document.getElementById('pokePlaceholder').style.display = 'block';

    sounds.click();

    try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${q}`);
        if(!res.ok) throw new Error("Not found");
        const data = await res.json();

        _el = document.getElementById('pokeName'); if(_el) _el.textContent = data.name.toUpperCase();
        _el = document.getElementById('pokeId'); if(_el) _el.textContent = '#' + String(data.id).padStart(3, '0');

        // Type chips
        const chipsEl = document.getElementById('pokeTypeChips');
        chipsEl.innerHTML = '';
        data.types.forEach(t => {
            const chip = document.createElement('span');
            const typeName = t.type.name;
            chip.textContent = typeName.toUpperCase();
            chip.style.cssText = 'background:' + (typeColors[typeName]||'#888') + ';color:#fff;padding:1px 5px;border-radius:3px;font-size:5px;font-weight:bold;';
            chipsEl.appendChild(chip);
        });

        // Stats
        const statsEl = document.getElementById('pokeStats');
        statsEl.innerHTML = '';
        data.stats.forEach(s => {
            const statName = s.stat.name.replace('-',' ').toUpperCase();
            const val = s.base_stat;
            const pct = Math.min(val / 255 * 100, 100);
            const barColor = val >= 100 ? '#0f0' : val >= 60 ? '#ff0' : '#f00';
            statsEl.innerHTML += '<div style="padding:2px;display:flex;align-items:center;gap:3px;"><span style="width:50px;text-align:right;">' + statName + '</span><div style="flex:1;height:4px;background:#333;border-radius:2px;"><div style="width:' + pct + '%;height:100%;background:' + barColor + ';"></div></div><span>' + val + '</span></div>';
        });

        // Artwork sprite
        const img = document.getElementById('pokeImg');
        const artUrl = data.sprites.other && data.sprites.other['official-artwork'] && data.sprites.other['official-artwork'].front_default;
        img.src = artUrl || data.sprites.front_default || data.sprites.front_shiny;
        img.onload = function() {
             document.getElementById('pokePlaceholder').style.display = 'none';
             img.style.display = 'block';
             sounds.launch();
        };

        // Setup Battle
        const battleBtn = document.getElementById('pokeBattleBtn');
        if(battleBtn) {
            battleBtn.style.display = 'block';
            battleBtn.onclick = function() { startPokeBattle(data); };
        }

        // Fetch evolution chain
        fetchEvolutionChain(data.species.url);
    } catch(e) {
        _el = document.getElementById('pokeName'); if(_el) _el.textContent = "MISSINGNO";
        document.getElementById('pokeTypeChips').innerHTML = '<span style="background:#888;color:#fff;padding:1px 5px;border-radius:3px;font-size:5px;">GLITCH</span>';
    }
};

async function fetchEvolutionChain(speciesUrl) {
    const evoEl = document.getElementById('pokeEvolution');
    if(!evoEl) return;
    try {
        const specRes = await fetch(speciesUrl);
        const specData = await specRes.json();
        const chainUrl = specData.evolution_chain && specData.evolution_chain.url;
        if(!chainUrl) { evoEl.innerHTML = '<div style="opacity:0.5;">NO EVOLUTION DATA</div>'; return; }

        const chainRes = await fetch(chainUrl);
        const chainData = await chainRes.json();

        const chain = [];
        function traverse(node) {
            chain.push(node.species.name);
            if(node.evolves_to && node.evolves_to.length > 0) {
                node.evolves_to.forEach(function(e) { traverse(e); });
            }
        }
        traverse(chainData.chain);

        evoEl.innerHTML = '<div style="font-weight:bold;margin-bottom:2px;">EVOLUTION:</div>' +
            chain.map(function(n) {
                return '<span style="background:var(--gb-text);color:var(--gb-bg);padding:1px 4px;border-radius:2px;margin-right:2px;">' + n.toUpperCase() + '</span>';
            }).join('<span style="margin:0 1px;">→</span>');
    } catch(e) {
        evoEl.innerHTML = '<div style="opacity:0.5;">EVO UNAVAILABLE</div>';
    }
}

let playerMon = null;
let enemyMon = null;

window.startPokeBattle = async function(p1) {
    playerMon = p1;
    const battleScreen = document.getElementById('pokeBattleScreen');
    if(battleScreen) {
        battleScreen.style.display = 'flex';
        document.getElementById('pokedexMain').style.display = 'none';

        const id = Math.floor(Math.random() * 1010) + 1;
        try {
            const res = await fetch('https://pokeapi.co/api/v2/pokemon/' + id);
            enemyMon = await res.json();

            _el = document.getElementById('battleEnemyName'); if(_el) _el.textContent = enemyMon.name.toUpperCase();
            document.getElementById('battleEnemyImg').src = enemyMon.sprites.front_default;
            _el = document.getElementById('battlePlayerName'); if(_el) _el.textContent = playerMon.name.toUpperCase();
            document.getElementById('battlePlayerImg').src = playerMon.sprites.back_default || playerMon.sprites.front_default;

            _el = document.getElementById('battleLog'); if(_el) _el.textContent = 'A wild ' + enemyMon.name.toUpperCase() + ' appeared!';
        } catch(e) {
            cancelBattle();
        }
    }
};

window.pokeAttack = function() {
    const log = document.getElementById('battleLog');
    const pDmg = Math.floor(Math.random() * 20) + 10;
    const eDmg = Math.floor(Math.random() * 20) + 10;

    log.innerHTML = playerMon.name.toUpperCase() + ' used TACKLE!<br>Dealt ' + pDmg + ' damage!';
    sounds.launch();

    setTimeout(function() {
        log.innerHTML += '<br>' + enemyMon.name.toUpperCase() + ' used SCRATCH!<br>Took ' + eDmg + ' damage!';
        sounds.click();
    }, 1000);
};

window.cancelBattle = function() {
    document.getElementById('pokeBattleScreen').style.display = 'none';
    document.getElementById('pokedexMain').style.display = 'block';
};

// ========== TRIVIA ==========
let triviaCorrectAnswer = "";
let triviaLives = 3;
let triviaStreak = 0;
let triviaTotalScore = 0;
let triviaAnswered = false;

window.initTrivia = function() {
    updateTriviaUI();
};

function updateTriviaUI() {
    const livesEl = document.getElementById('triviaLives');
    const streakEl = document.getElementById('triviaStreak');
    const scoreEl = document.getElementById('triviaScore');
    if(livesEl) if(livesEl) livesEl.textContent = '\u2764\uFE0F'.repeat(triviaLives) + '\u2661'.repeat(3 - triviaLives);
    if(streakEl) if(streakEl) streakEl.textContent = '\uD83D\uDD25 ' + triviaStreak;
    if(scoreEl) if(scoreEl) scoreEl.textContent = '\uD83D\uDC8E ' + triviaTotalScore;
}

window.resetTrivia = function() {
    triviaLives = 3;
    triviaStreak = 0;
    triviaTotalScore = 0;
    triviaAnswered = false;
    _el = document.getElementById('triviaQuestion'); if(_el) _el.textContent = 'SELECT OPTIONS & PRESS START';
    document.getElementById('triviaOptions').innerHTML = '';
    _el = document.getElementById('triviaResult'); if(_el) _el.textContent = '';
    _el = document.getElementById('triviaCategory'); if(_el) _el.textContent = 'CATEGORY';
    updateTriviaUI();
};

window.getTrivia = async function() {
    if(triviaLives <= 0) { resetTrivia(); return; }

    const qEl = document.getElementById('triviaQuestion');
    const optEl = document.getElementById('triviaOptions');
    const catEl = document.getElementById('triviaCategory');
    const resEl = document.getElementById('triviaResult');

    if(qEl) qEl.textContent = "LOADING...";
    optEl.innerHTML = '';
    if(resEl) resEl.textContent = '';
    triviaAnswered = false;
    sounds.click();

    const catSel = document.getElementById('triviaCatSelect');
    const diffSel = document.getElementById('triviaDiffSelect');
    const cat = catSel ? catSel.value : '';
    const diff = diffSel ? diffSel.value : '';

    let url = 'https://opentdb.com/api.php?amount=1&type=multiple';
    if(cat) url += '&category=' + cat;
    if(diff) url += '&difficulty=' + diff;

    try {
        const res = await fetch(url);
        const data = await res.json();
        if(data.response_code !== 0 || !data.results || data.results.length === 0) {
            if(qEl) qEl.textContent = "NO QUESTIONS AVAILABLE";
            return;
        }
        const q = data.results[0];

        if(catEl) catEl.textContent = q.category.toUpperCase() + ' (' + q.difficulty.toUpperCase() + ')';
        const decode = function(str) { var txt = document.createElement('textarea'); txt.innerHTML = str; return txt.value; };
        if(qEl) qEl.textContent = decode(q.question);
        triviaCorrectAnswer = q.correct_answer;

        const answers = [q.correct_answer].concat(q.incorrect_answers);
        answers.sort(function() { return Math.random() - 0.5; });

        answers.forEach(function(ans) {
            const btn = document.createElement('button');
            if(btn) btn.textContent = decode(ans);
            btn.style.cssText = 'padding:5px;font-size:6px;text-align:left;width:100%;margin-bottom:2px;';
            btn.onclick = function() { checkTrivia(ans); };
            optEl.appendChild(btn);
        });
        sounds.coin();
    } catch(e) { if(qEl) qEl.textContent = "ERROR FETCHING QUESTION"; }
};

window.checkTrivia = function(ans) {
    if(triviaAnswered) return;
    triviaAnswered = true;

    const resEl = document.getElementById('triviaResult');
    const decode = function(str) { var txt = document.createElement('textarea'); txt.innerHTML = str; return txt.value; };
    const correctDecoded = decode(triviaCorrectAnswer);

    if(ans === triviaCorrectAnswer) {
        triviaStreak++;
        const bonus = triviaStreak >= 3 ? 5 : 0;
        const pts = 5 + bonus;
        triviaTotalScore += pts;
        if(resEl) resEl.textContent = 'CORRECT! +' + pts + ' GEMS' + (bonus ? ' (STREAK BONUS!)' : '');
        resEl.style.color = '#006400';
        sounds.launch();
        addGems(pts);
    } else {
        triviaStreak = 0;
        triviaLives--;
        if(resEl) resEl.textContent = 'WRONG! (-1 LIFE)';
        resEl.style.color = '#8b0000';
        sounds.click();
        if(triviaLives <= 0) {
            if(resEl) resEl.textContent = 'GAME OVER! FINAL SCORE: ' + triviaTotalScore;
        }
    }
    updateTriviaUI();

    var btns = document.querySelectorAll('#triviaOptions button');
    for(var i = 0; i < btns.length; i++) {
        btns[i].disabled = true;
        if(btns[i].textContent === correctDecoded) {
            btns[i].style.background = '#006400';
            btns[i].style.color = '#fff';
            btns[i].style.border = '2px solid #00aa00';
        }
    }
};

// ========== ADVICE ==========
window.initAdvice = function() {};
window.getAdvice = async function() {
    const txt = document.getElementById('adviceText');
    if(txt) txt.textContent = "...";
    sounds.click();
    try {
        const res = await fetch('https://api.adviceslip.com/advice');
        const data = await res.json();
        if(txt) txt.textContent = data.slip.advice.toUpperCase();
        sounds.coin();
    } catch(e) { if(txt) txt.textContent = "SILENCE IS GOLDEN (OFFLINE)"; }
};

// ========== SPACE ==========
window.initSpace = function() {};
window.getSpaceData = async function() {
    const txt = document.getElementById('spaceInfo');
    if(txt) {
         if(txt) txt.textContent = "ESTABLISHING UPLINK...";
         sounds.click();
         try {
             // SpaceX V5 Next Launch
             const res = await fetch('https://api.spacexdata.com/v5/launches/next');
             const data = await res.json();
             
             const date = new Date(data.date_utc).toLocaleDateString() + ' ' + new Date(data.date_utc).toLocaleTimeString();
             const name = data.name.toUpperCase();
             const details = data.details ? data.details.toUpperCase() : "CLASSIFIED";
             const flight = data.flight_number;
             
             txt.innerHTML = `FLIGHT #${flight}<br>MISSION: ${name}<br>LAUNCH: ${date}<br><br>INTEL:<br>${details.substring(0, 150)}${details.length>150?'...':''}`;
             sounds.coin();
         } catch(e) { if(txt) txt.textContent = "LINK FAILURE (OFFLINE)"; }
    }
};

// ========== ORACLE ==========
window.initOracle = function() {};
window.askOracle = async function() {
    const ans = document.getElementById('oracleAnswer');
    const gif = document.getElementById('oracleGif');
    
    if(ans) if(ans) ans.textContent = "CONSULTING...";
    if(gif) gif.style.display = 'none';
    sounds.click();
    
    setTimeout(async () => {
        try {
            const res = await fetch('https://yesno.wtf/api');
            const data = await res.json();
            
            if(ans) {
                if(ans) ans.textContent = data.answer.toUpperCase();
                ans.style.color = data.answer === 'yes' ? '#006400' : '#8b0000';
            }
            if(gif) {
                gif.src = data.image;
                gif.onload = () => { gif.style.display = 'block'; sounds.launch(); };
            }
        } catch(e) { 
            if(ans) if(ans) ans.textContent = "THE VOID STARES BACK"; 
        }
    }, 800);
};

// ========== ROBO MAKER ==========
window.initRobo = function() {};
window.makeRobo = function() {
    const input = document.getElementById('roboInput');
    const img = document.getElementById('roboImg');
    const ph = document.getElementById('roboPlaceholder');
    
    if(!input || !img) return;
    
    const txt = input.value || Math.random().toString(36).substring(7);
    sounds.click();
    
    if(ph) ph.style.display = 'block';
    img.style.display = 'none';
    
    // Robohash is simple URL gen
    img.src = `https://robohash.org/${encodeURIComponent(txt)}?set=set1`;
    
    img.onload = () => {
        if(ph) ph.style.display = 'none';
        img.style.display = 'block';
        sounds.coin();
    };
};

// ========== WEATHER ==========
window.initWeather = window.initWeather || function() {};
window.getWeather = window.getWeather || async function() {};

// ========== DICT (ENHANCED: PHONETICS + POS + EXAMPLES + WORD OF DAY) ==========
const wordOfDayList = [
    'ephemeral','loquacious','serendipity','mellifluous','petrichor',
    'vellichor','sonder','psithurism','apricity','clinomania',
    'eudaimonia','hiraeth','saudade','fugacious','redamancy',
    'philophobia','astrophile','vellichor','syzygy','calliope'
];

window.initDict = function() {};
window.getDefinition = async function() {
    const word = document.getElementById('dictInput').value.toLowerCase().trim();
    const display = document.getElementById('dictDisplay');
    if(!word) return;
    
    display.innerHTML = '<div style="text-align:center; opacity:0.5;">LOOKING UP...</div>';
    sounds.click();
    
    try {
        const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        const data = await res.json();
        if(!Array.isArray(data)) throw new Error();
        
        const entry = data[0];
        const phonetic = entry.phonetic || entry.phonetics?.find(p => p.text)?.text || '';
        
        let html = `<div style="font-weight:bold; font-size:10px; margin-bottom:2px;">${entry.word.toUpperCase()}</div>`;
        if(phonetic) html += `<div style="font-size:7px; opacity:0.7; margin-bottom:6px; font-style:italic;">${phonetic}</div>`;
        
        entry.meanings.forEach(meaning => {
            html += `<div style="font-weight:bold; font-size:7px; color:#555; margin-top:6px; border-bottom:1px solid rgba(0,0,0,0.1); padding-bottom:2px;">${meaning.partOfSpeech.toUpperCase()}</div>`;
            meaning.definitions.slice(0, 3).forEach((def, i) => {
                html += `<div style="margin-bottom:4px;"><span style="font-weight:bold;">${i+1}.</span> ${def.definition}`;
                if(def.example) html += `<div style="font-size:6px; opacity:0.6; margin-left:10px; margin-top:2px; font-style:italic;">"${def.example}"</div>`;
                html += '</div>';
            });
        });
        
        display.innerHTML = html;
        sounds.coin();
    } catch(e) { 
        display.innerHTML = `<div style="text-align:center; opacity:0.5; margin-top:20px;">WORD "${word.toUpperCase()}" NOT FOUND</div>`; 
    }
};

window.getWordOfDay = function() {
    const word = wordOfDayList[Math.floor(Math.random() * wordOfDayList.length)];
    document.getElementById('dictInput').value = word;
    getDefinition();
};

// ========== QUOTE ==========
window.initQuote = function() {};
window.getQuote = async function() {
    const txt = document.getElementById('quoteText');
    const auth = document.getElementById('quoteAuthor');
    if(txt) txt.textContent = "...";
    sounds.click();
    try {
        const res = await fetch('https://api.quotable.io/random?maxLength=50');
        const data = await res.json();
        if(txt) txt.textContent = `"${data.content.toUpperCase()}"`;
        if(auth) auth.textContent = `- ${data.author.toUpperCase()}`;
        sounds.coin();
    } catch(e) { if(txt) txt.textContent = "OFFLINE WISDOM"; }
};

// ========== FOX ==========
window.initFox = function() {};
window.getFox = async function() {
    const img = document.getElementById('foxImg');
    const ph = document.getElementById('foxPlaceholder');
    if(ph) ph.style.display = 'block';
    if(img) img.style.display = 'none';
    sounds.click();
    
    try {
        const res = await fetch('https://randomfox.ca/floof/');
        const data = await res.json();
        if(img) {
            img.src = data.image;
            img.onload = () => { if(ph) ph.style.display = 'none'; img.style.display = 'block'; sounds.coin(); };
        }
    } catch(e) {}
};

// ========== IDENTITY ==========
window.initIdentity = function() {};
window.getIdentity = async function() {
    const name = document.getElementById('identInput').value;
    const display = document.getElementById('identDisplay');
    if(!name) return;
    
    if(display) display.textContent = "ANALYZING BIOMETRICS...";
    sounds.click();
    
    try {
        const [ageRes, genRes, natRes] = await Promise.all([
            fetch(`https://api.agify.io?name=${name}`),
            fetch(`https://api.genderize.io?name=${name}`),
            fetch(`https://api.nationalize.io?name=${name}`)
        ]);
        
        const age = await ageRes.json();
        const gen = await genRes.json();
        const nat = await natRes.json();
        
        display.innerHTML = `AGE: ${age.age || '?'}<br>GENDER: ${gen.gender ? gen.gender.toUpperCase() : '?'}<br>NAT: ${nat.country[0] ? nat.country[0].country_id : '?'}`;
        sounds.launch();
    } catch(e) { if(display) display.textContent = "IDENTITY UNKNOWN"; }
};

// ========== TTT ==========
let tttBoard = ['', '', '', '', '', '', '', '', ''];
let tttTurn = 'X';
let tttActive = true;
window.initTtt = function() { resetTTT(); };
window.resetTTT = function() {
    tttBoard = ['', '', '', '', '', '', '', '', ''];
    tttTurn = 'X';
    tttActive = true;
    _el = document.getElementById('tttStatus'); if(_el) _el.textContent = "PLAYER (X) TURN";
    renderTTT();
};
window.renderTTT = function() {
    const board = document.getElementById('tttBoard');
    board.innerHTML = '';
    tttBoard.forEach((cell, i) => {
        const btn = document.createElement('button');
        if(btn) btn.textContent = cell;
        btn.style.cssText = "width: 40px; height: 40px; font-size: 20px; padding: 0;";
        btn.onclick = () => playTTT(i);
        board.appendChild(btn);
    });
};
window.playTTT = function(i) {
    if(!tttActive || tttBoard[i]) return;
    
    tttBoard[i] = tttTurn;
    sounds.click();
    // Check win
    if(checkWin(tttBoard, tttTurn)) {
        _el = document.getElementById('tttStatus'); if(_el) _el.textContent = `${tttTurn} WINS!`;
        addGems(5);
        sounds.launch();
        tttActive = false;
    } else if(!tttBoard.includes('')) {
        _el = document.getElementById('tttStatus'); if(_el) _el.textContent = "DRAW!";
        tttActive = false;
    } else {
        // CPU
        tttTurn = 'O';
        _el = document.getElementById('tttStatus'); if(_el) _el.textContent = "CPU (O) TURN";
        setTimeout(cpuTTT, 500);
        renderTTT();
        return;
    }
    renderTTT();
};
function checkWin(b, p) {
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    return wins.some(w => b[w[0]] === p && b[w[1]] === p && b[w[2]] === p);
}
function cpuTTT() {
    if(!tttActive) return;
    const empty = tttBoard.map((v,i) => v==='' ? i : null).filter(v => v!==null);
    if(empty.length > 0) {
        const move = empty[Math.floor(Math.random() * empty.length)];
        tttBoard[move] = 'O';
        if(checkWin(tttBoard, 'O')) {
             _el = document.getElementById('tttStatus'); if(_el) _el.textContent = "CPU WINS!";
             tttActive = false;
        } else if(!tttBoard.includes('')) {
             _el = document.getElementById('tttStatus'); if(_el) _el.textContent = "DRAW!";
             tttActive = false;
        } else {
            tttTurn = 'X';
            _el = document.getElementById('tttStatus'); if(_el) _el.textContent = "PLAYER (X) TURN";
        }
        renderTTT();
        sounds.click(); // CPU sound
    }
}

// ========== RPS ==========
window.initRps = function() {};
window.playRPS = function(move) {
    const cpuMoves = ['rock', 'paper', 'scissors'];
    const cpu = cpuMoves[Math.floor(Math.random() * 3)];
    const resEl = document.getElementById('rpsResult');
    const scoreEl = document.getElementById('rpsScore');
    
    const icons = { rock: '🪨', paper: '📄', scissors: '✂️' };
    
    if(resEl) resEl.textContent = `${icons[move]} vs ${icons[cpu]}`;
    sounds.click();
    
    let result = ''; // Win, Lose, Draw
    if(move === cpu) result = 'D';
    else if((move==='rock'&&cpu==='scissors') || (move==='paper'&&cpu==='rock') || (move==='scissors'&&cpu==='paper')) result = 'W';
    else result = 'L';
    
    if(result === 'W') {
        state.rpsWins = (state.rpsWins || 0) + 1;
        sounds.coin();
        addGems(1);
    } else if(result === 'L') {
        state.rpsLosses = (state.rpsLosses || 0) + 1;
    }
    
    if(scoreEl) if(scoreEl) scoreEl.textContent = `W: ${state.rpsWins || 0} | L: ${state.rpsLosses || 0}`;
};

// ========== COIN ==========
window.initCoin = function() {};
window.flipCoin = function() {
    const icon = document.getElementById('coinIcon');
    const res = document.getElementById('coinResult');
    
    icon.style.transform = "rotateY(720deg)";
    if(res) res.textContent = "...";
    sounds.launch(); // WHOOSH
    
    setTimeout(() => {
        const heads = Math.random() > 0.5;
        icon.style.transform = "rotateY(0deg)";
        if(icon) icon.textContent = heads ? '🪙' : '⚪';
        if(res) res.textContent = heads ? 'HEADS' : 'TAILS';
        sounds.coin();
    }, 500);
};

// ========== REACTION ==========
let reactionStart = 0;
let reactionTimer = null;
window.initReaction = function() {
    document.getElementById('reactionBox').style.background = '#333';
    _el = document.getElementById('reactionBox'); if(_el) _el.textContent = "TAP START";
};
window.startReaction = function() {
    const box = document.getElementById('reactionBox');
    box.style.background = '#8b0000'; // Red
    if(box) box.textContent = "WAIT FOR GREEN...";
    reactionStart = 0;
    clearTimeout(reactionTimer);
    
    const delay = 1000 + Math.random() * 3000;
    reactionTimer = setTimeout(() => {
        box.style.background = '#006400'; // Green
        if(box) box.textContent = "TAP NOW!";
        reactionStart = Date.now();
        sounds.coin(); // Signal
    }, delay);
};
window.reactionClick = function() {
    const box = document.getElementById('reactionBox');
    if(reactionStart === 0 && box && box.textContent === "WAIT FOR GREEN...") {
        clearTimeout(reactionTimer);
        box.style.background = '#333';
        if(box) box.textContent = "TOO EARLY!";
        if(typeof sounds !== 'undefined' && sounds.error) sounds.error(); else sounds.click();
        return;
    }
    if(reactionStart > 0) {
        const time = Date.now() - reactionStart;
        box.style.background = '#333';
        if(box) box.textContent = `${time} ms`;
        state.bestReaction = Math.min(state.bestReaction || 9999, time);
        _el = document.getElementById('reactionTime'); if(_el) _el.textContent = `BEST: ${state.bestReaction} ms`;
        reactionStart = 0;
        addGems(Math.max(0, 10 - Math.floor(time/50))); // Bonus for speed
        sounds.launch();
    }
};
window.initClock = function() {
    updateClock();
    if(window.clockHold) clearInterval(window.clockHold);
    window.clockHold = setInterval(updateClock, 1000);
};
function updateClock() {
    const d = new Date();
    const hours = pad(d.getHours());
    const mins = pad(d.getMinutes());
    const secs = pad(d.getSeconds());
    const timeStr = `${hours}:${mins}:${secs}`;
    const dateStr = d.toDateString().toUpperCase();
    
    const el = document.getElementById('clockDisplay');
    if(el) {
        el.innerHTML = `
            <div style="font-size: 26px; font-weight: bold; letter-spacing: 2px;">${hours}:${mins}</div>
            <div style="font-size: 14px; opacity: 0.8; margin-bottom: 15px;">${secs}</div>
            <div style="font-size: 8px; border-top: 1px solid var(--gb-text); padding-top: 10px;">${dateStr}</div>
        `;
    }
    
    // Also update common global clock if present
    const big = document.getElementById('bigClock');
    if(big) if(big) big.textContent = timeStr;
    
    const sbt = document.getElementById('statusBarTime');
    if(sbt) if(sbt) sbt.textContent = `${hours}:${mins}`; 
}

// ========== COMPASS ==========
window.initCompass = function() {
    const degEl = document.getElementById('compassDeg');
    const info = document.getElementById('compassInfo');
    
    if (window.DeviceOrientationEvent) {
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            // iOS 13+ requires permission
            const btn = document.createElement('button');
            if(btn) btn.textContent = "ENABLE SENSORS";
            btn.style.cssText = "padding: 10px; margin-top: 20px;";
            btn.onclick = async () => {
                try {
                    const status = await DeviceOrientationEvent.requestPermission();
                    if (status === 'granted') {
                        window.addEventListener('deviceorientation', handleOrientation);
                        btn.remove();
                    }
                } catch(e) { alert("Permission Error"); }
            };
            if(info) info.innerHTML = '';
            if(info) info.appendChild(btn);
        } else {
            window.addEventListener('deviceorientation', handleOrientation);
        }
    } else {
        if(degEl) if(degEl) degEl.textContent = "NOT SUPPORTED";
    }
};

function handleOrientation(event) {
    let alpha = event.alpha; // Degree relative to North
    if(alpha === null) return;
    
    const needle = document.getElementById('compassNeedle');
    const degEl = document.getElementById('compassDeg');
    
    if(needle) needle.style.transform = `translateX(-50%) rotate(${-alpha}deg)`;
    
    if(degEl) {
        let dir = "NORTH";
        if(alpha > 45 && alpha <= 135) dir = "EAST";
        else if(alpha > 135 && alpha <= 225) dir = "SOUTH";
        else if(alpha > 225 && alpha <= 315) dir = "WEST";
        if(degEl) degEl.textContent = `${Math.round(alpha)}° ${dir}`;
    }
}

// ========== DAILY QUESTS ==========
let quests = [];
window.initQuests = function() {
    const list = document.getElementById('questList');
    if(!list) return;
    
    const today = new Date().toDateString();
    const lastReset = localStorage.getItem('gbQuestReset');
    
    if(lastReset !== today) {
        generateDailyQuests();
        localStorage.setItem('gbQuestReset', today);
    } else {
        quests = JSON.parse(localStorage.getItem('gbQuests')) || [];
        if(quests.length === 0) generateDailyQuests();
    }
    
    renderQuests();
};

function generateDailyQuests() {
    const pool = [
        { id: 'flappy', name: 'FLAPPY BIRD', target: 5, unit: 'score', reward: 20 },
        { id: 'snake', name: 'SNAKE MASTER', target: 10, unit: 'score', reward: 25 },
        { id: 'breakout', name: 'BRICK SMASH', target: 15, unit: 'score', reward: 30 },
        { id: 'habit', name: 'HABIT CHECK', target: 1, unit: 'toggle', reward: 15 },
        { id: 'journal', name: 'DEAF DIARY', target: 1, unit: 'entry', reward: 20 },
        { id: 'game', name: 'PLAY TIME', target: 3, unit: 'apps', reward: 10 }
    ];
    
    // Pick 3 random quests
    quests = pool.sort(() => 0.5 - Math.random()).slice(0, 3).map(q => ({
        ...q,
        current: 0,
        completed: false
    }));
    
    localStorage.setItem('gbQuests', JSON.stringify(quests));
}

window.renderQuests = function() {
    const list = document.getElementById('questList');
    if(!list) return;
    
    list.innerHTML = '';
    quests.forEach((q, i) => {
        const div = document.createElement('div');
        div.style.cssText = `
            padding: 10px;
            border: 2px solid ${q.completed ? '#306230' : 'var(--gb-text)'};
            background: ${q.completed ? 'rgba(48, 98, 48, 0.2)' : 'rgba(0,0,0,0.05)'};
            border-radius: 4px;
            margin-bottom: 8px;
            position: relative;
        `;
        
        const progress = Math.min(100, (q.current / q.target) * 100);
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                <div style="font-size: 8px; font-weight: bold;">${q.name} ${q.completed ? '✅' : ''}</div>
                <div style="font-size: 6px; color: #ffca28;">💎 ${q.reward}</div>
            </div>
            <div style="font-size: 6px; opacity: 0.7; margin-bottom: 5px;">DO ${q.target} ${q.unit.toUpperCase()}</div>
            <div style="width: 100%; height: 4px; background: rgba(0,0,0,0.2); border-radius: 2px; overflow: hidden;">
                <div style="width: ${progress}%; height: 100%; background: var(--gb-text);"></div>
            </div>
        `;
        list.appendChild(div);
    });
};

window.trackQuest = function(type, amount = 1) {
    if(!quests || quests.length === 0) {
        quests = JSON.parse(localStorage.getItem('gbQuests')) || [];
    }
    if(quests.length === 0) return;
    
    let changed = false;
    quests.forEach(q => {
        if((q.id === type || (type === 'any' && q.id === 'game')) && !q.completed) {
            q.current += amount;
            if(q.current >= q.target) {
                q.current = q.target;
                q.completed = true;
                addGems(q.reward);
                if(window.sounds && sounds.launch) sounds.launch();
                alert(`QUEST COMPLETE: ${q.name}! +${q.reward} Gems`);
            }
            changed = true;
        }
    });
    if(changed) {
        localStorage.setItem('gbQuests', JSON.stringify(quests));
        if(typeof currentScreen !== 'undefined' && currentScreen === 'quests') renderQuests();
    }
};

// ========== STOPWATCH + TIMER ==========
// Merged into batch7.js — see merged timer+stopwatch screen

// ========== COUNTER ==========
let countVal = 0;
window.initCounter = function() {
    updateCounterDisplay();
};
window.updateCounter = function(d) {
    countVal += d;
    updateCounterDisplay();
    sounds.click();
};
function updateCounterDisplay() {
    const el = document.getElementById('countDisplay');
    if(el) if(el) el.textContent = countVal;
}

// ========== PIXEL ART ==========
let pixelColor = '#000';
let pixelSize = 8;
let pixelUndoStack = [];
const PIXEL_MAX_UNDO = 10;

window.setPixelColor = function(c) {
    pixelColor = c;
    const el = document.getElementById('pixelCustomColor');
    if(el) el.value = c;
    if(window.sounds) sounds.click();
};

window.setPixelZoom = function(size) {
    pixelSize = size;
    pixelUndoStack = [];
    document.querySelectorAll('[id^="pz"]').forEach(b => {
        b.style.background = b.id === 'pz' + size ? 'var(--gb-text)' : 'transparent';
        b.style.color = b.id === 'pz' + size ? 'var(--gb-bg)' : 'var(--gb-text)';
    });
    initPixel();
};

window.pixelUndo = function() {
    if(pixelUndoStack.length === 0) return;
    const grid = document.getElementById('pixelGrid');
    if(!grid) return;
    const colors = pixelUndoStack.pop();
    const cells = grid.children;
    for(let i = 0; i < cells.length && i < colors.length; i++) {
        cells[i].style.background = colors[i];
    }
    if(window.sounds) sounds.click();
};

function savePixelState() {
    const grid = document.getElementById('pixelGrid');
    if(!grid) return;
    const colors = Array.from(grid.children).map(c => c.style.background || '#fff');
    pixelUndoStack.push(colors);
    if(pixelUndoStack.length > PIXEL_MAX_UNDO) pixelUndoStack.shift();
}

window.initPixel = function() {
    const grid = document.getElementById('pixelGrid');
    if(!grid) return;
    grid.innerHTML = '';
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = `repeat(${pixelSize}, 1fr)`;
    const cellSize = Math.floor(220 / pixelSize);
    grid.style.width = (cellSize * pixelSize) + 'px';
    grid.style.height = (cellSize * pixelSize) + 'px';
    pixelUndoStack = [];

    const totalCells = pixelSize * pixelSize;
    for(let i = 0; i < totalCells; i++) {
        const d = document.createElement('div');
        d.style.cssText = `background: #fff; cursor: pointer; aspect-ratio: 1; border: 0.5px solid #ccc;`;
        d.onclick = function() {
            savePixelState();
            this.style.background = pixelColor;
            if(window.sounds) sounds.click();
        };
        d.onmouseenter = function(e) {
            const coordEl = document.getElementById('pixelCoord');
            if(coordEl) {
                const col = i % pixelSize;
                const row = Math.floor(i / pixelSize);
                if(coordEl) coordEl.textContent = `X: ${col} Y: ${row}`;
            }
        };
        grid.appendChild(d);
    }
};

window.clearPixel = function() {
    const grid = document.getElementById('pixelGrid');
    if(grid) {
        savePixelState();
        Array.from(grid.children).forEach(c => c.style.background = '#fff');
    }
    if(window.sounds) sounds.back();
};
window.initCatfact = function() {};
window.getCatFact = async function() {
    const txt = document.getElementById('catfactText');
    if(txt) txt.textContent = "Fetching feline wisdom...";
    sounds.click();
    try {
        const res = await fetch('https://catfact.ninja/fact');
        const data = await res.json();
        if(txt) txt.textContent = data.fact.toUpperCase();
        sounds.coin();
    } catch(e) { if(txt) txt.textContent = "CATS ARE OFFLINE (ERROR)"; }
};

// ========== CHUCK NORRIS ==========
window.initChuck = function() {};
window.getChuckJoke = async function() {
    const txt = document.getElementById('chuckJoke');
    if(txt) txt.textContent = "Loading Chuck...";
    sounds.click();
    try {
        const res = await fetch('https://api.chucknorris.io/jokes/random');
        const data = await res.json();
        if(txt) txt.textContent = data.value.toUpperCase();
        sounds.coin();
    } catch(e) { if(txt) txt.textContent = "CHUCK IS TOO POWERFUL (OFFLINE)"; }
};

// ========== ANIME QUOTES ==========
window.initAnime = function() {};
window.getAnimeQuote = async function() {
    const quote = document.getElementById('animeQuote');
    const char = document.getElementById('animeChar');
    if(quote) quote.textContent = '"..."';
    sounds.click();
    try {
        const res = await fetch('https://animechan.xyz/api/random');
        const data = await res.json();
        if(quote) quote.textContent = `"${data.quote.toUpperCase()}"`;
        if(char) char.textContent = `- ${data.character.toUpperCase()} (${data.anime.toUpperCase()})`;
        sounds.coin();
    } catch(e) { 
        if(quote) quote.textContent = '"BELIEVE IN YOURSELF"';
        if(char) char.textContent = '- NARUTO';
    }
};

// ========== MEME GENERATOR ==========
window.initMeme = function() {};
window.getMeme = async function() {
    const img = document.getElementById('memeImg');
    const ph = document.getElementById('memePlaceholder');
    const title = document.getElementById('memeTitle');
    
    if(ph) ph.style.display = 'block';
    if(img) img.style.display = 'none';
    if(title) title.textContent = 'GENERATING...';
    sounds.click();
    
    try {
        const res = await fetch('https://meme-api.com/gimme');
        const data = await res.json();
        
        if(img && data.url) {
            img.src = data.url;
            img.onload = () => {
                if(ph) ph.style.display = 'none';
                img.style.display = 'block';
                sounds.coin();
            };
        }
        if(title) title.textContent = data.title ? data.title.toUpperCase().substring(0, 50) : 'MEME';
    } catch(e) { 
        if(title) title.textContent = 'MEME MACHINE BROKE';
    }
};

// ========== NASA APOD ==========
window.initNasa = function() {};
window.getNASA = async function() {
    const img = document.getElementById('nasaImg');
    const ph = document.getElementById('nasaPlaceholder');
    const titleEl = document.getElementById('nasaTitle');
    const descEl = document.getElementById('nasaDesc');
    
    if(ph) ph.style.display = 'block';
    if(img) img.style.display = 'none';
    if(titleEl) titleEl.textContent = 'LOADING COSMOS...';
    if(descEl) descEl.textContent = '';
    sounds.click();
    
    try {
        // Using demo key - should work but may hit rate limit
        const res = await fetch('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY');
        const data = await res.json();
        
        if(titleEl) titleEl.textContent = data.title ? data.title.toUpperCase() : 'NASA APOD';
        if(descEl) descEl.textContent = data.explanation ? data.explanation.toUpperCase().substring(0, 200) + '...' : '';
        
        if(img && data.url && data.media_type === 'image') {
            img.src = data.url;
            img.onload = () => {
                if(ph) ph.style.display = 'none';
                img.style.display = 'block';
                sounds.coin();
            };
        } else {
            if(ph) if(ph) ph.textContent = '📹';
            sounds.coin();
        }
    } catch(e) { 
        if(titleEl) titleEl.textContent = 'TRANSMISSION LOST';
        if(descEl) descEl.textContent = 'Unable to reach NASA servers';
    }
};

// ========== KANYE QUOTES ==========
window.initKanye = function() {};
window.getKanyeQuote = async function() {
    const txt = document.getElementById('kanyeQuote');
    if(txt) txt.textContent = '"..."';
    sounds.click();
    try {
        const res = await fetch('https://api.kanye.rest/');
        const data = await res.json();
        if(txt) txt.textContent = `"${data.quote.toUpperCase()}"`;
        sounds.coin();
    } catch(e) { if(txt) txt.textContent = '"I AM A GOD" - KANYE'; }
};

// ========== BORED API ==========
window.initBored = function() {};
window.getBoredActivity = async function() {
    const activity = document.getElementById('boredActivity');
    const type = document.getElementById('boredType');
    if(activity) activity.textContent = 'THINKING...';
    if(type) type.textContent = '';
    sounds.click();
    try {
        const res = await fetch(`https://www.boredapi.com/api/activity?_=${Date.now()}`);
        const data = await res.json();
        if(activity) activity.textContent = data.activity.toUpperCase();
        if(type) type.textContent = `TYPE: ${data.type.toUpperCase()} | PARTICIPANTS: ${data.participants}`;
        sounds.coin();
    } catch(e) { 
        if(activity) activity.textContent = 'TRY COUNTING TO INFINITY';
        if(type) type.textContent = 'TYPE: IMPOSSIBLE';
    }
};



// ========== ZEN QUOTES ==========
window.initZen = function() {};
window.getZen = async function() {
    const txt = document.getElementById('zenText');
    if(txt) txt.textContent = '"..."';
    sounds.click();
    try {
        const res = await fetch('https://api.github.com/zen');
        const data = await res.text();
        if(txt) txt.textContent = `"${data.toUpperCase()}"`;
        sounds.coin();
    } catch(e) { if(txt) txt.textContent = '"DESIGN FOR FAILURE"'; }
};

// ========== COCKTAIL DB ==========
window.initCocktail = function() {};
window.getRandomCocktail = async function() {
    const img = document.getElementById('cocktailImg');
    const ph = document.getElementById('cocktailPlaceholder');
    const nameEl = document.getElementById('cocktailName');
    const ingredientsEl = document.getElementById('cocktailIngredients');
    
    if(ph) ph.style.display = 'block';
    if(img) img.style.display = 'none';
    if(nameEl) nameEl.textContent = 'MIXING...';
    if(ingredientsEl) ingredientsEl.textContent = '';
    sounds.click();
    
    try {
        const res = await fetch('https://www.thecocktaildb.com/api/json/v1/1/random.php');
        const data = await res.json();
        const drink = data.drinks[0];
        
        if(nameEl) nameEl.textContent = drink.strDrink.toUpperCase();
        
        // Get ingredients
        const ingredients = [];
        for(let i = 1; i <= 15; i++) {
            const ingredient = drink[`strIngredient${i}`];
            const measure = drink[`strMeasure${i}`];
            if(ingredient) {
                ingredients.push(`${measure ? measure + ' ' : ''}${ingredient}`.toUpperCase());
            }
        }
        if(ingredientsEl) ingredientsEl.textContent = ingredients.join(', ');
        
        if(img && drink.strDrinkThumb) {
            img.src = drink.strDrinkThumb;
            img.onload = () => {
                if(ph) ph.style.display = 'none';
                img.style.display = 'block';
                sounds.coin();
            };
        }
    } catch(e) { 
        if(nameEl) nameEl.textContent = 'WATER';
        if(ingredientsEl) ingredientsEl.textContent = 'H2O';
    }
};

// ========== NOTES ==========
// ========== NOTES ==========
window.initNotes = function() {
    const np = document.getElementById('notepadText');
    if(np) {
        np.value = state.notes || '';
    }
};
window.saveNotes = function() {
    const np = document.getElementById('notepadText');
    if(np) {
        state.notes = np.value;
        saveState();
    }
};

// (Old Jamendo music player removed — replaced by YouTube/Invidious player at top of file)



// ========== CAMERA & VIDEO LOGIC (FILTER BAKE v2.0) ==========
let cameraStream = null;
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;
let currentFacingMode = 'user';
let canvasLoopReq = null;

window.initCamera = async function(mode = null) {
    if (mode) currentFacingMode = mode;
    const video = document.getElementById('cameraVideo');
    const preview = document.getElementById('selfiePreview');
    const captureBtn = document.getElementById('captureBtn');
    const recordBtn = document.getElementById('recordBtn');
    const saveBtn = document.getElementById('saveSelfieBtn');
    const retakeBtn = document.getElementById('retakeBtn');
    const modeDisplay = document.getElementById('camModeDisplay');

    if (modeDisplay) if(modeDisplay) modeDisplay.textContent = currentFacingMode === 'user' ? 'FRONT' : 'BACK';

    preview.style.display = 'none';
    video.style.display = 'block';
    captureBtn.style.display = 'block';
    if(recordBtn) { 
        recordBtn.style.display = 'block';
        if(recordBtn) recordBtn.textContent = 'REC';
        recordBtn.style.background = '#333';
    }
    saveBtn.style.display = 'none';
    retakeBtn.style.display = 'none';
    
    if (cameraStream) stopCamera();

    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ 
            video: { width: 320, height: 240, facingMode: currentFacingMode } 
        });
        video.srcObject = cameraStream;
        
        // Start drawing to hidden canvas for recording purposes
        startCameraLoop();
        sounds.launch();
    } catch (err) {
        alert("CAMERA ERROR: " + err.message);
        goBack();
    }
};

// ---- FILTER IMPLEMENTATIONS (pixel-level) ----
function applyFilterToCanvas(ctx, w, h, filterName) {
    const imageData = ctx.getImageData(0, 0, w, h);
    const d = imageData.data;

    switch (filterName) {
        case 'classic':
            for (let i = 0; i < d.length; i += 4) {
                const gray = d[i] * 0.299 + d[i+1] * 0.587 + d[i+2] * 0.114;
                const warm = gray * 1.1;
                d[i]   = Math.min(255, warm * 1.05);   // R slight warm
                d[i+1] = Math.min(255, warm * 0.95);   // G
                d[i+2] = Math.min(255, warm * 0.75);   // B sepia-ish
            }
            break;

        case 'contrast':
            for (let i = 0; i < d.length; i += 4) {
                const gray = d[i] * 0.299 + d[i+1] * 0.587 + d[i+2] * 0.114;
                // High contrast B&W — threshold around midpoint
                const v = gray > 128 ? Math.min(255, gray * 1.6) : Math.max(0, gray * 0.4);
                d[i] = d[i+1] = d[i+2] = v;
            }
            break;

        case 'reverse':
            for (let i = 0; i < d.length; i += 4) {
                const gray = d[i] * 0.299 + d[i+1] * 0.587 + d[i+2] * 0.114;
                const inv = 255 - gray;
                d[i] = d[i+1] = d[i+2] = inv;
            }
            break;

        case 'vhs':
            for (let i = 0; i < d.length; i += 4) {
                // Desaturated, slightly warm, low contrast
                const gray = d[i] * 0.299 + d[i+1] * 0.587 + d[i+2] * 0.114;
                d[i]   = Math.min(255, gray * 0.85 + d[i]   * 0.3 + 20);
                d[i+1] = Math.min(255, gray * 0.85 + d[i+1] * 0.2 + 10);
                d[i+2] = Math.min(255, gray * 0.85 + d[i+2] * 0.15);
            }
            // VHS scanline artifacts
            for (let y = 0; y < h; y += 3) {
                for (let x = 0; x < w; x++) {
                    const i = (y * w + x) * 4;
                    d[i] = Math.min(255, d[i] + 15);       // R channel bleed
                    d[i+2] = Math.max(0, d[i+2] - 10);    // B channel drop
                }
            }
            break;

        case 'bad90s':
            for (let i = 0; i < d.length; i += 4) {
                // Over-saturated, warm, high brightness
                d[i]   = Math.min(255, d[i]   * 1.4 + 20);
                d[i+1] = Math.min(255, d[i+1] * 1.1);
                d[i+2] = Math.min(255, d[i+2] * 0.8);
            }
            break;

        case 'glitch':
            // Color channel shift: R shifted left, B shifted right
            for (let y = 0; y < h; y++) {
                const shift = (y % 7 === 0) ? 6 : 2; // glitch rows
                for (let x = 0; x < w; x++) {
                    const i = (y * w + x) * 4;
                    const rSrc = (y * w + Math.min(w - 1, x + shift)) * 4;
                    const bSrc = (y * w + Math.max(0, x - shift)) * 4;
                    d[i]   = imageData.data[rSrc];      // R shifted right
                    d[i+2] = imageData.data[bSrc + 2];  // B shifted left
                }
            }
            break;

        case 'night':
            for (let i = 0; i < d.length; i += 4) {
                const gray = d[i] * 0.299 + d[i+1] * 0.587 + d[i+2] * 0.114;
                const boosted = Math.min(255, gray * 1.5);
                d[i]   = 0;
                d[i+1] = Math.min(255, boosted * 1.1); // Green channel boost
                d[i+2] = 0;
            }
            break;

        case 'matrix':
            for (let i = 0; i < d.length; i += 4) {
                const gray = d[i] * 0.299 + d[i+1] * 0.587 + d[i+2] * 0.114;
                const v = Math.min(255, gray * 1.4);
                d[i]   = 0;
                d[i+1] = v;     // Pure green
                d[i+2] = 0;
            }
            break;

        case 'crt':
            for (let i = 0; i < d.length; i += 4) {
                // Slight green tint, boosted
                d[i]   = Math.min(255, d[i]   * 0.9);
                d[i+1] = Math.min(255, d[i+1] * 1.1);
                d[i+2] = Math.min(255, d[i+2] * 0.85);
            }
            // CRT scanlines baked in
            for (let y = 0; y < h; y += 4) {
                for (let x = 0; x < w; x++) {
                    const i = (y * w + x) * 4;
                    d[i]     = Math.max(0, d[i]     - 60);
                    d[i + 1] = Math.max(0, d[i + 1] - 60);
                    d[i + 2] = Math.max(0, d[i + 2] - 60);
                }
            }
            break;

        case 'vintage':
            for (let i = 0; i < d.length; i += 4) {
                const gray = d[i] * 0.299 + d[i+1] * 0.587 + d[i+2] * 0.114;
                // Sepia
                d[i]   = Math.min(255, gray * 1.08 + 40);
                d[i+1] = Math.min(255, gray * 0.95 + 20);
                d[i+2] = Math.min(255, gray * 0.82);
                // Vignette
                const px = (i / 4) % w;
                const py = Math.floor((i / 4) / w);
                const dx = (px / w) - 0.5;
                const dy = (py / h) - 0.5;
                const vignette = Math.max(0, 1 - (dx*dx + dy*dy) * 3.5);
                d[i]   *= vignette;
                d[i+1] *= vignette;
                d[i+2] *= vignette;
            }
            break;

        case 'dots':
            // Pixelate (8x8 blocks)
            for (let y = 0; y < h; y += 8) {
                for (let x = 0; x < w; x += 8) {
                    const si = (y * w + x) * 4;
                    const gray = d[si] * 0.299 + d[si+1] * 0.587 + d[si+2] * 0.114;
                    const v = Math.min(255, gray * 1.2);
                    for (let dy = 0; dy < 8 && y+dy < h; dy++) {
                        for (let dx = 0; dx < 8 && x+dx < w; dx++) {
                            const pi = ((y+dy) * w + (x+dx)) * 4;
                            d[pi] = d[pi+1] = d[pi+2] = v;
                        }
                    }
                }
            }
            break;

        case 'ntsc':
            for (let i = 0; i < d.length; i += 4) {
                // NTSC-style: slight horizontal blur + chroma noise
                const noise = (Math.random() - 0.5) * 20;
                d[i]   = Math.min(255, Math.max(0, d[i]   + noise * 1.2));
                d[i+1] = Math.min(255, Math.max(0, d[i+1] + noise * 0.8));
                d[i+2] = Math.min(255, Math.max(0, d[i+2] + noise));
            }
            break;

        default: // grayscale fallback
            for (let i = 0; i < d.length; i += 4) {
                const gray = d[i] * 0.299 + d[i+1] * 0.587 + d[i+2] * 0.114;
                d[i] = d[i+1] = d[i+2] = gray;
            }
            break;
    }

    ctx.putImageData(imageData, 0, 0);
}

// ---- ACTIVE FILTER STATE ----
let activeCameraFilter = 'none'; // default
let activeMirror = false;
let freezeFrame = null;

function applySimpleFilterToVideo(video, filterName) {
    switch (filterName) {
        case 'sepia':
            video.style.filter = 'sepia(1)';
            break;
        case 'grayscale':
            video.style.filter = 'grayscale(1)';
            break;
        case 'invert':
            video.style.filter = 'invert(1)';
            break;
        case 'none':
            video.style.filter = 'none';
            break;
        case 'mirror':
            activeMirror = !activeMirror;
            video.style.transform = activeMirror ? 'scaleX(-1)' : 'scaleX(1)';
            break;
    }
}

function applyMirrorFilter(video) {
    video.style.transform = activeMirror ? 'scaleX(-1)' : 'scaleX(1)';
}

function startCameraLoop() {
    const video  = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    const smallCanvas = document.getElementById('cameraSmallCanvas');
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    // Pixelate: draw to small canvas then scale up
    const ctxSmall = smallCanvas.getContext('2d');

    function loop() {
        if (!cameraStream) return;
        if (video.paused || video.ended) {
            canvasLoopReq = requestAnimationFrame(loop);
            return;
        }

        const w = video.videoWidth;
        const h = video.videoHeight;

        if (!w || !h) {
            canvasLoopReq = requestAnimationFrame(loop);
            return;
        }

        if (canvas.width !== w)  canvas.width  = w;
        if (canvas.height !== h) canvas.height = h;

        // 1. Draw raw video frame to small canvas for pixelate
        ctxSmall.drawImage(video, 0, 0, 32, 24);
        // Scale up with pixelated filtering
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(smallCanvas, 0, 0, w, h);

        // 2. Apply CSS filter (sepia/grayscale/invert)
        applySimpleFilterToVideo(video, activeCameraFilter);

        // 3. Apply mirror if active
        applyMirrorFilter(video);

        canvasLoopReq = requestAnimationFrame(loop);
    }

    if (video.readyState >= 2) {
        loop();
    } else {
        video.addEventListener('loadeddata', loop, { once: true });
    }
}

window.switchCamera = function() {
    currentFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    initCamera(currentFacingMode);
    sounds.click();
};

window.stopCamera = function() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    if(canvasLoopReq) cancelAnimationFrame(canvasLoopReq);
    const overlays = document.querySelectorAll('.camera-overlay');
    overlays.forEach(o => o.style.display = 'none');
};

// ---- Filter pills ----
window.setCameraFilter = function (filter) {
    activeCameraFilter = filter;

    // Clear CSS filters from video
    const video = document.getElementById('cameraVideo');
    const preview = document.getElementById('selfiePreview');
    if (video)   video.style.filter   = 'none';
    if (preview) preview.style.filter = 'none';

    // Hide all overlays (matrix/crt/ntsc are now baked into canvas)
    document.querySelectorAll('.camera-overlay').forEach(o => o.style.display = 'none');

    // Apply the new simple filter
    applySimpleFilterToVideo(video, filter);

    sounds.click();
};

window.setMirror = function() {
    activeMirror = !activeMirror;
    const video = document.getElementById('cameraVideo');
    if (video) applyMirrorFilter(video);
    const pillMirror = document.querySelector('.filter-pill[onclick*="mirror"]');
    if (pillMirror) {
        pillMirror.classList.toggle('active', activeMirror);
    }
    sounds.click();
};

window.freezeFrame = function() {
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    if (!video || !canvas) return;

    // Pause video
    video.pause();

    // Draw current frame to canvas
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (canvas.width !== w) canvas.width = w;
    if (canvas.height !== h) canvas.height = h;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, w, h);
    
    // Show the frozen canvas, hide video
    video.style.display = 'none';
    canvas.style.display = 'block';
    
    // Update button states
    const captureBtn = document.getElementById('captureBtn');
    const recordBtn = document.getElementById('recordBtn');
    const saveSelfieBtn = document.getElementById('saveSelfieBtn');
    const retakeBtn = document.getElementById('retakeBtn');
    const videoStatus = document.getElementById('videoStatus');
    
    if (captureBtn) captureBtn.style.display = 'none';
    if (recordBtn) recordBtn.style.display = 'none';
    if (saveSelfieBtn) saveSelfieBtn.style.display = 'block';
    if (retakeBtn) retakeBtn.style.display = 'block';
    if (videoStatus) videoStatus.style.display = 'none';
    
    freezeFrame = canvas;
};

window.retakeSelfie = function() {
    document.getElementById('selfiePreview').style.display = 'none';
    document.getElementById('cameraVideo').style.display = 'block';
    document.getElementById('cameraCanvas').style.display = 'none';
    document.getElementById('captureBtn').style.display = 'block';
    if(document.getElementById('recordBtn')) document.getElementById('recordBtn').style.display = 'block';
    document.getElementById('saveSelfieBtn').style.display = 'none';
    document.getElementById('retakeBtn').style.display = 'none';
    sounds.back();
};

window.saveScreenshot = function() {
    const canvas = document.getElementById('cameraCanvas');
    const preview = document.getElementById('selfiePreview');
    if (!canvas || canvas.style.display === 'none') {
        alert("NO FRAME TO SAVE - capture or freeze first");
        return;
    }
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `gb-cam-${Date.now()}.png`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    sounds.coin();
};

function initMatrixRain() {
    const overlay = document.getElementById('matrixOverlay');
    if (!overlay || overlay.children.length > 0) return; 
    const columns = Math.floor(220 / 8);
    for (let i = 0; i < columns; i++) {
        const col = document.createElement('div');
        col.className = 'matrix-column';
        col.style.left = (i * 8) + 'px';
        col.style.animationDuration = (Math.random() * 2 + 1) + 's';
        col.style.animationDelay = (Math.random() * 2) + 's';
        col.innerHTML = generateMatrixText(20);
        overlay.appendChild(col);
    }
}

function generateMatrixText(len) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%\"'#&_(),.;:?!\\|{}<>[]";
    let str = "";
    for (let i = 0; i < len; i++) {
        str += chars.charAt(Math.floor(Math.random() * chars.length)) + "<br>";
    }
    return str;
}
// ---- NEW takeSelfie ----
// Reads directly from the already-filtered canvas — no re-apply needed.
window.takeSelfie = function () {
    const canvas  = document.getElementById('cameraCanvas');
    const video   = document.getElementById('cameraVideo');
    const preview = document.getElementById('selfiePreview');
    const flash   = document.getElementById('cameraFlash');

    if (!canvas.width || !canvas.height) {
        alert("CAMERA NOT READY YET");
        return;
    }

    // Flash
    if (flash) {
        flash.style.opacity = '1';
        setTimeout(() => (flash.style.opacity = '0'), 120);
    }

    sounds.coin();

    // Canvas already has filter baked — just grab it
    const dataUrl = canvas.toDataURL('image/png');
    preview.src = dataUrl;
    preview.style.filter = 'none'; // Never use CSS filter on preview

    video.style.display   = 'none';
    preview.style.display = 'block';

    document.getElementById('captureBtn').style.display    = 'none';
    const recordBtn = document.getElementById('recordBtn');
    if (recordBtn) recordBtn.style.display = 'none';
    document.getElementById('saveSelfieBtn').style.display = 'block';
    document.getElementById('retakeBtn').style.display     = 'block';
};

window.saveSelfie = function () {
    const preview = document.getElementById('selfiePreview');
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    sounds.launch();

    if (isIOS) {
        // Open image in new tab — iOS user long-presses to save
        const newTab = window.open(preview.src, '_blank');
        if (newTab) {
            alert("IMAGE OPENED!\n\nLong-press the image and tap 'Add to Photos' to save.");
        } else {
            // If pop-up blocked, show inline save instructions
            const msg = document.createElement('div');
            msg.style.cssText = `
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.9); z-index: 9999;
                display: flex; flex-direction: column; align-items: center;
                justify-content: center; color: #9bbc0f; font-family: monospace;
                padding: 20px; text-align: center; box-sizing: border-box;
            `;
            msg.innerHTML = `
                <img src="${preview.src}" style="max-width:90%; max-height:60vh; border: 3px solid #9bbc0f; margin-bottom: 15px;">
                <div style="font-size: 12px; margin-bottom: 10px;">LONG-PRESS IMAGE → "ADD TO PHOTOS"</div>
                <button onclick="this.parentNode.remove()" style="margin-top: 10px; padding: 8px 20px;">CLOSE</button>
            `;
            document.body.appendChild(msg);
        }
    } else {
        const link = document.createElement('a');
        link.download = `gb-cam-${Date.now()}.png`;
        link.href = preview.src;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        alert("SAVED!");
    }
};

window.retakeSelfie = function() {
    document.getElementById('selfiePreview').style.display = 'none';
    document.getElementById('cameraVideo').style.display = 'block';
    document.getElementById('captureBtn').style.display = 'block';
    if(document.getElementById('recordBtn')) document.getElementById('recordBtn').style.display = 'block';
    document.getElementById('saveSelfieBtn').style.display = 'none';
    document.getElementById('retakeBtn').style.display = 'none';
    sounds.back();
};

window.toggleVideoRecord = function() {
    if (isRecording) stopRecording();
    else startRecording();
};

// ---- NEW startRecording ----
// Uses canvas.captureStream() on desktop (works great, filters baked).
// Falls back to raw stream on iOS where captureStream is unavailable.
async function startRecording() {
    const canvas = document.getElementById('cameraCanvas');
    const btn    = document.getElementById('recordBtn');
    const status = document.getElementById('videoStatus');

    if (typeof MediaRecorder === 'undefined') {
        alert("VIDEO RECORDING NOT SUPPORTED ON THIS DEVICE.");
        return;
    }

    recordedChunks = [];

    let stream;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    if (!isIOS && canvas.captureStream) {
        // Desktop: capture from canvas → filters are FULLY BAKED into video
        stream = canvas.captureStream(30);
    } else {
        // iOS fallback: raw camera stream (no baked filters, iOS limitation)
        if (!cameraStream) { alert("NO CAMERA STREAM."); return; }
        stream = cameraStream;
    }

    // Best supported MIME type
    const mimeTypes = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4',
        ''
    ];
    let selectedMime = '';
    for (const mime of mimeTypes) {
        if (!mime || MediaRecorder.isTypeSupported(mime)) {
            selectedMime = mime;
            break;
        }
    }

    try {
        const options = selectedMime ? { mimeType: selectedMime } : {};
        mediaRecorder = new MediaRecorder(stream, options);

        mediaRecorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) recordedChunks.push(e.data);
        };
        mediaRecorder.onstop = saveVideo;
        mediaRecorder.start(500); // collect chunks every 500ms

        isRecording = true;
        if (status) status.style.display = 'block';
        if (btn)    { if(btn) btn.textContent = 'STOP'; btn.style.background = '#f00'; }
        sounds.launch();
    } catch (e) {
        alert("RECORDING FAILED: " + e.message);
        console.error(e);
    }
}

function stopRecording() {
    if (mediaRecorder) mediaRecorder.stop();
    isRecording = false;
    const status = document.getElementById('videoStatus');
    const btn = document.getElementById('recordBtn');
    if(status) status.style.display = 'none';
    if(btn) { if(btn) btn.textContent = 'REC'; btn.style.background = '#333'; }
    sounds.back();
}

// ---- saveVideo (same iOS-safe version) ----
function saveVideo() {
    if (!recordedChunks.length) { alert("NO VIDEO DATA."); return; }

    const mimeType = recordedChunks[0].type || 'video/webm';
    const blob = new Blob(recordedChunks, { type: mimeType });
    const url  = URL.createObjectURL(blob);
    const ext  = mimeType.includes('mp4') ? 'mp4' : 'webm';
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

    if (isIOS) {
        const tab = window.open(url, '_blank');
        if (tab) alert("VIDEO OPENED!\nLong-press → Save to Camera Roll.");
        else     alert("Pop-up blocked. Allow pop-ups to save video.");
    } else {
        const a = document.createElement('a');
        a.href     = url;
        a.download = `gb-vid-${Date.now()}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        alert("VIDEO SAVED!");
    }
    setTimeout(() => URL.revokeObjectURL(url), 5000);
}


// ========== BITCHAT (Link Cable Chat) ==========
window.gbPeer = null;
window.gbConn = null; // Last active connection
window.gbConns = [];  // All active connections for Multi-Chat
let scanInterval = null;

window.initChat = function() {
    // Persistent local frequency
    if(!localStorage.getItem('gb_freq')) {
        localStorage.setItem('gb_freq', 'GB-' + (Math.floor(Math.random() * 900000) + 100000));
    }
    const myFreq = localStorage.getItem('gb_freq');
    
    const idEl = document.getElementById('chatMyId');
    if(idEl) if(idEl) idEl.textContent = `MY FREQ: ${myFreq}`;
    
    // Load saved room name
    const savedRoom = localStorage.getItem('gb_chatRoom') || '';
    const roomInput = document.getElementById('chatRoom');
    if(roomInput && savedRoom) roomInput.value = savedRoom;
    if(roomInput) {
        roomInput.oninput = () => {
            localStorage.setItem('gb_chatRoom', roomInput.value);
        };
    }
};

// Handle incoming game invites
window.onP2PGameData = window.onP2PGameData || function(payload) {
    if(payload && payload.type === 'game-invite') {
        launchApp(payload.game);
    }
};

// ── Launch P2P game from chat lobby ─────────────────────────────────────
window.launchP2PGame = function(gameId) {
    const connected = (window.gbConn && window.gbConn.open) || (window.gbConns && window.gbConns.some(c => c.open));
    if(!connected) {
        alert('CONNECT TO A PEER FIRST!\n\nUse BROADCAST or TUNE to link devices.');
        return;
    }
    const payload = { type: 'game-invite', game: gameId };
    if(window.gbConns && window.gbConns.length > 0) {
        window.gbConns.forEach(c => { if(c.open) c.send({ type: 'p2p-game', payload }); });
    } else if(window.gbConn && window.gbConn.open) {
        window.gbConn.send({ type: 'p2p-game', payload });
    }
    launchApp(gameId);
};

// ── Chat Host Function ──────────────────────────────────────────────────
window.chatHost = function() {
    const myFreq = localStorage.getItem('gb_freq');
    // Update status dot
    updateChatStatus('offline');
    
    // If peer already exists, don't re-init
    if(window.gbPeer) return;
    
    updateSignalBars(1);
    _el = document.getElementById('chatStatusLabel'); if(_el) _el.textContent = "SIGNALING...";

    // Start Peer with deterministic ID
    window.gbPeer = new Peer(myFreq, {
        config: {
            'iceServers': [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
            ]
        }
    }); 
    
    window.gbPeer.on('open', (id) => {
        _el = document.getElementById('chatStatusLabel'); if(_el) _el.textContent = "ONLINE";
        updateChatStatus('online');
        updateSignalBars(3);
        console.log("Link Tower Open:", id);
    });

    window.gbPeer.on('connection', (connection) => {
        addConnection(connection);
    });
    
    window.gbPeer.on('error', (err) => {
        updateSignalBars(0);
        updateChatStatus('error');
        _el = document.getElementById('chatStatusLabel'); if(_el) _el.textContent = "LINK ERR";
        console.error("PeerJS Error:", err);
    });
};

function updateChatStatus(state) {
    const dot = document.getElementById('chatStatusDot');
    if(!dot) return;
    const room = document.getElementById('chatRoom');
    const roomName = (room && room.value.trim()) || 'PUBLIC';
    switch(state) {
        case 'online':
            if(dot) dot.textContent = `● ONLINE — ${roomName.toUpperCase()}`;
            dot.style.color = '#0f0';
            break;
        case 'connected':
            if(dot) dot.textContent = `● CONNECTED — ${roomName.toUpperCase()}`;
            dot.style.color = '#0ff';
            break;
        case 'error':
            if(dot) dot.textContent = '● LINK ERROR';
            dot.style.color = '#f00';
            break;
        default:
            if(dot) dot.textContent = `● OFFLINE — ${roomName.toUpperCase()}`;
            dot.style.color = '#555';
    }
}

function updateSignalBars(count) {
    const bars = document.getElementById('chatSignal')?.children;
    if(!bars) return;
    for(let i=0; i<bars.length; i++) {
        bars[i].style.background = i < count ? '#0f0' : '#333';
    }
}

window.showManualJoin = function() {
    document.getElementById('chatLanding').style.display = 'none';
    document.getElementById('chatManualZone').style.display = 'block';
    if(window.sounds && window.sounds.click) window.sounds.click();
};

window.tunePresetFreq = function(freq) {
    const input = document.getElementById('chatTargetId');
    if(input) input.value = freq;
    window.chatManualConnect();
};

window.chatManualConnect = function() {
    const targetId = document.getElementById('chatTargetId').value.trim();
    if(!targetId) return alert("ENTER VALID FREQUENCY");
    connectToPeer(targetId);
};

window.chatHost = function() {
    const qrZone = document.getElementById('chatQrZone');
    const landing = document.getElementById('chatLanding');
    const qrEl = document.getElementById('chatQrCode');
    
    if(!qrZone || !landing || !qrEl) return;
    landing.style.display = 'none';
    qrZone.style.display = 'block';
    qrEl.innerHTML = '';
    
    const myFreq = localStorage.getItem('gb_freq') || 'GB-000000';

    // INSTANT QR! No need to wait for signaling tower
    new QRCode(qrEl, {
        text: myFreq,
        width: 128,
        height: 128,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    });
    sounds.launch();
};

window.sendQrShout = function() {
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if(!msg) return;
    
    const qrZone = document.getElementById('chatQrZone');
    const landing = document.getElementById('chatLanding');
    const chatMain = document.getElementById('chatMain');
    const qrEl = document.getElementById('chatQrCode');
    
    // Switch to QR view but showing message
    chatMain.style.display = 'none';
    qrZone.style.display = 'block';
    qrEl.innerHTML = '';
    
    const myNick = document.getElementById('chatNick').value || 'ME';
    const packet = `MSG:${myNick}:${msg}`;

    new QRCode(qrEl, {
        text: packet,
        width: 128,
        height: 128,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.L
    });
    
    appendChat('SYSTEM', 'SHOUTING OFFLINE MSG...');
    input.value = '';
    sounds.launch();
};

window.chatJoin = async function() {
    const scanZone = document.getElementById('chatScanZone');
    const manualZone = document.getElementById('chatManualZone');
    const landing = document.getElementById('chatLanding');
    
    if(scanZone) scanZone.style.display = 'block';
    if(manualZone) manualZone.style.display = 'none';
    if(landing) landing.style.display = 'none';
    
    const video = document.getElementById('chatScannerVideo');
    const canvas = document.getElementById('chatScannerCanvas');
    if(!canvas) {
        // Create hidden canvas for processing
        const c = document.createElement('canvas');
        c.id = 'chatScannerCanvas';
        c.style.display = 'none';
        document.body.appendChild(c);
    }
    const ctx = document.getElementById('chatScannerCanvas').getContext('2d');
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        video.srcObject = stream;
        
        scanInterval = setInterval(() => {
            if(video.readyState === video.HAVE_ENOUGH_DATA) {
                const c = document.getElementById('chatScannerCanvas');
                c.height = video.videoHeight;
                c.width = video.videoWidth;
                ctx.drawImage(video, 0, 0, c.width, c.height);
                const imageData = ctx.getImageData(0, 0, c.width, c.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height);
                
                if(code) {
                    clearInterval(scanInterval);
                    video.srcObject.getTracks().forEach(t => t.stop());
                    
                    if(code.data.startsWith('MSG:')) {
                        // Offline packet!
                        const parts = code.data.split(':');
                        const nick = parts[1] || 'STRANGER';
                        const text = parts.slice(2).join(':');
                        appendChat(nick, text + " [OFFLINE]");
                        cancelChatLink(); // Return to landing
                    } else {
                        // Normal frequency link
                        connectToPeer(code.data);
                    }
                }
            }
        }, 300);
        sounds.click();
    } catch(e) {
        alert("SCANNER FAILED: " + e.message);
        cancelChatLink();
    }
};

function connectToPeer(id) {
    if(!window.gbPeer) return;
    appendChat('SYSTEM', 'TUNING TO FREQUENCY...');
    const connection = window.gbPeer.connect(id);
    addConnection(connection);
}

function addConnection(connection) {
    window.gbConn = connection;
    if(!window.gbConns.find(c => c.peer === connection.peer)) {
        window.gbConns.push(connection);
        setupChatConnection(connection);
    }
}

function setupChatConnection(targetConn) {
    if(!targetConn) return;
    
    targetConn.on('open', () => {
        showChatStartAnim();
        updateSignalBars(4);
        updateChatStatus('connected');
        document.getElementById('chatConnect').style.display = 'none';
        document.getElementById('chatMain').style.display = 'flex';
        appendChat('SYSTEM', 'ENCRYPTED LINK ESTABLISHED.');
        sounds.coin();
        
        // Identity handshake
        const myNick = document.getElementById('chatNick').value || 'USER-' + Math.floor(Math.random()*999);
        targetConn.send({ type: 'identify', nick: myNick });
    });
    
    targetConn.on('data', (data) => {
        if(data.type === 'msg') {
            appendChat(data.nick || 'PEER', data.content);
            sounds.click();
        } else if(data.type === 'buzz') {
            handleChatBuzz();
        } else if(data.type === 'identify') {
            targetConn.peerNick = data.nick;
            appendChat('SYSTEM', `${data.nick.toUpperCase()} LINKED TO FREQUENCY.`);
        } else if(data.type === 'p2p-game') {
            if(window.onP2PGameData) window.onP2PGameData(data.payload);
        }
    });
    
    targetConn.on('close', () => {
        const nick = targetConn.peerNick || 'A PEER';
        window.gbConns = window.gbConns.filter(c => c.peer !== targetConn.peer);
        if(window.gbConns.length === 0) {
            updateSignalBars(3);
            updateChatStatus('online');
            _el = document.getElementById('chatStatusLabel'); if(_el) _el.textContent = "ONLINE";
            appendChat('SYSTEM', 'ALL PEERS DISCONNECTED.');
        } else {
            appendChat('SYSTEM', `${nick.toUpperCase()} HAS LEFT.`);
        }
    });
}

function showChatStartAnim() {
    const anim = document.getElementById('linkStartAnim');
    if(anim) {
        anim.style.display = 'flex';
        setTimeout(() => anim.style.display = 'none', 2000);
    }
}

window.addChatEmoji = function(emoji) {
    const input = document.getElementById('chatInput');
    input.value += emoji;
    input.focus();
    sounds.click();
};

window.sendChatMessage = function() {
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    const myNick = document.getElementById('chatNick').value || 'ME';
    const roomEl = document.getElementById('chatRoom');
    const roomName = (roomEl && roomEl.value.trim()) || '';
    if(!msg || window.gbConns.length === 0) return;
    
    const payload = { type: 'msg', content: msg, nick: myNick };
    if(roomName) payload.room = roomName;
    
    window.gbConns.forEach(c => {
        if(c.open) c.send(payload);
    });
    appendChat('ME', msg);
    input.value = '';
    sounds.click();
};

window.sendChatBuzz = function() {
    if(window.gbConns.length === 0) return;
    window.gbConns.forEach(c => {
        if(c.open) c.send({ type: 'buzz' });
    });
    appendChat('SYSTEM', '!!! BUZZ !!!');
    sounds.launch();
    if(navigator.vibrate) navigator.vibrate([100, 50, 100]);
};

function handleChatBuzz() {
    appendChat('SYSTEM', '!!! PEER IS BUZZING !!!');
    if(navigator.vibrate) navigator.vibrate([500, 100, 500, 100, 500]);
    const log = document.getElementById('chatLog');
    if(log) {
        log.style.background = 'rgba(255, 0, 0, 0.4)';
        setTimeout(() => log.style.background = 'rgba(0,25,0,0.8)', 500);
    }
}
function appendChat(who, text) {
    const log = document.getElementById('chatLog');
    if(!log) return;
    const now = new Date();
    const ts = pad(now.getHours()) + ':' + pad(now.getMinutes());
    const msg = document.createElement('div');
    msg.style.cssText = "padding: 6px 10px; border-radius: 6px; background: rgba(0,255,0,0.1); border-left: 3px solid #0f0; margin-bottom: 2px;";
    const color = who === 'ME' ? '#cfc' : (who === 'SYSTEM' ? '#ffa' : '#0f0');
    msg.innerHTML = `<span style="color:${color}; font-size: 8px; font-weight:bold;">${who}</span><span style="color:#555; font-size: 6px; margin-left: 4px;">${ts}</span><br><span style="font-size: 10px;">${text.toUpperCase()}</span>`;
    log.appendChild(msg);
    log.scrollTop = log.scrollHeight;
}

window.cancelChatLink = function() {
    window.gbConns.forEach(c => c.close());
    window.gbConns = [];
    window.gbConn = null;
    if(scanInterval) clearInterval(scanInterval);
    const video = document.getElementById('chatScannerVideo');
    if(video && video.srcObject) video.srcObject.getTracks().forEach(t => t.stop());
    
    const connect = document.getElementById('chatConnect');
    const landing = document.getElementById('chatLanding');
    const qrZone = document.getElementById('chatQrZone');
    const scanZone = document.getElementById('chatScanZone');
    const manualZone = document.getElementById('chatManualZone');
    const main = document.getElementById('chatMain');
    const log = document.getElementById('chatLog');
    
    if(connect) connect.style.display = 'flex';
    if(landing) landing.style.display = 'block';
    if(qrZone) qrZone.style.display = 'none';
    if(scanZone) scanZone.style.display = 'none';
    if(manualZone) manualZone.style.display = 'none';
    if(main) main.style.display = 'none';
    if(log) log.innerHTML = '<div style="opacity: 0.5;">> LINK READY.</div>';
    updateChatStatus('online');
    sounds.back();
};

// ========== GB PET LOGIC (Tamagotchi v2.0) ==========
let petStats = {
    hunger: 80,
    happy: 80,
    health: 100,
    poop: 0,
    isSleeping: false,
    lastUpdate: Date.now()
};

window.initPet = function() {
    loadPet();
    updatePetDisplay();
    
    // Auto decay stats every 30 seconds
    if(window.petInterval) clearInterval(window.petInterval);
    window.petInterval = setInterval(() => {
        petStats.hunger = Math.max(0, petStats.hunger - 2);
        petStats.happy = Math.max(0, petStats.happy - 1);
        if(petStats.hunger < 20) petStats.health = Math.max(0, petStats.health - 1);
        if(petStats.poop > 3) petStats.health = Math.max(0, petStats.health - 2);
        
        // Random poop
        if(Math.random() < 0.05 && !petStats.isSleeping) petStats.poop++;
        
        savePet();
        updatePetDisplay();
    }, 30000);
};

function updatePetDisplay() {
    const sprite = document.getElementById('petSprite');
    const status = document.getElementById('petStatusText');
    const hBar = document.getElementById('hungerBar');
    const hapBar = document.getElementById('happyBar');
    const healthBar = document.getElementById('healthBar');
    
    if(!sprite) return;

    // Bars
    hBar.style.width = petStats.hunger + '%';
    hapBar.style.width = petStats.happy + '%';
    healthBar.style.width = petStats.health + '%';
    
    // Color coding bars
    hBar.style.background = petStats.hunger < 30 ? '#f00' : '#0f0';
    hapBar.style.background = petStats.happy < 30 ? '#f00' : '#0f0';
    healthBar.style.background = petStats.health < 30 ? '#f00' : '#0f0';

    // Sprite logic
    let emoji = '🐥';
    let mood = 'HAPPY';

    if(petStats.health <= 0) { emoji = '💀'; mood = 'GHOST'; }
    else if(petStats.health < 30) { emoji = '🤒'; mood = 'SICK'; }
    else if(petStats.hunger < 30) { emoji = '🤤'; mood = 'HUNGRY'; }
    else if(petStats.happy < 30) { emoji = '😢'; mood = 'SAD'; }
    else if(petStats.isSleeping) { emoji = '😴'; mood = 'Zzz...'; }
    
    if(petStats.poop > 0 && petStats.health > 0) {
        sprite.style.filter = 'drop-shadow(10px 10px 0px brown)';
    } else {
        sprite.style.filter = 'none';
    }

    if(sprite) sprite.textContent = emoji;
    if(status) status.textContent = `(${mood})`;
}

window.interactPet = function(action) {
    if(petStats.health <= 0 && action !== 'clean') {
        alert("YOUR PET IS A GHOST. CLEAN THE GRAVE TO RESTART.");
        return;
    }

    const sprite = document.getElementById('petSprite');
    
    switch(action) {
        case 'feed':
            petStats.hunger = Math.min(100, petStats.hunger + 15);
            animatePet('jump');
            sounds.coin();
            break;
        case 'play':
            petStats.happy = Math.min(100, petStats.happy + 15);
            petStats.hunger = Math.max(0, petStats.hunger - 5);
            animatePet('spin');
            sounds.launch();
            break;
        case 'clean':
            if(petStats.health <= 0) {
                // Restart
                petStats = { hunger: 80, happy: 80, health: 100, poop: 0, isSleeping: false, lastUpdate: Date.now() };
            } else {
                petStats.poop = 0;
            }
            animatePet('shake');
            sounds.back();
            break;
    }
    
    savePet();
    updatePetDisplay();
};

function animatePet(type) {
    const s = document.getElementById('petSprite');
    if(!s) return;
    s.style.transition = '0.3s';
    
    if(type === 'jump') s.style.transform = 'translateY(-20px)';
    if(type === 'spin') s.style.transform = 'rotate(360deg)';
    if(type === 'shake') s.style.transform = 'translateX(10px)';
    
    setTimeout(() => {
        s.style.transform = 'none';
        if(type === 'spin') {
            setTimeout(() => s.style.transition = '0s', 300);
            s.style.transform = 'rotate(0deg)';
        }
    }, 300);
}

function savePet() { localStorage.setItem('gb_pet_stats', JSON.stringify(petStats)); }
function loadPet() {
    const saved = localStorage.getItem('gb_pet_stats');
    if(saved) petStats = JSON.parse(saved);
}

// ========== GB GROOVE (Drum Synth) ==========
window.playDrum = function(type) {
    const ctx = audioCtx;
    const time = ctx.currentTime;
    
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.5, time);
    master.connect(ctx.destination);

    switch(type) {
        case 'kick':
            const osc = ctx.createOscillator();
            const gainKick = ctx.createGain();
            osc.frequency.setValueAtTime(150, time);
            osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
            gainKick.gain.setValueAtTime(1, time);
            gainKick.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
            osc.connect(gainKick);
            gainKick.connect(master);
            osc.start(time);
            osc.stop(time + 0.5);
            break;
            
        case 'snare':
            const noise = ctx.createBufferSource();
            const buffer = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
            noise.buffer = buffer;
            const filter = ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(1000, time);
            const gainS = ctx.createGain();
            gainS.gain.setValueAtTime(1, time);
            gainS.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
            noise.connect(filter);
            filter.connect(gainS);
            gainS.connect(master);
            noise.start(time);
            break;
            
        case 'hat':
            const noiseH = ctx.createBufferSource();
            const bufferH = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
            const dataH = bufferH.getChannelData(0);
            for (let i = 0; i < dataH.length; i++) dataH[i] = Math.random() * 2 - 1;
            noiseH.buffer = bufferH;
            const filterH = ctx.createBiquadFilter();
            filterH.type = 'highpass';
            filterH.frequency.setValueAtTime(5000, time);
            const gainH = ctx.createGain();
            gainH.gain.setValueAtTime(0.3, time);
            gainH.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
            noiseH.connect(filterH);
            filterH.connect(gainH);
            gainH.connect(master);
            noiseH.start(time);
            break;

        case 'clap':
            const noiseC = ctx.createBufferSource();
            const bufferC = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
            const dataC = bufferC.getChannelData(0);
            for (let i = 0; i < dataC.length; i++) dataC[i] = Math.random() * 2 - 1;
            noiseC.buffer = bufferC;
            const filterC = ctx.createBiquadFilter();
            filterC.type = 'bandpass';
            filterC.frequency.setValueAtTime(1200, time);
            const gainC = ctx.createGain();
            gainC.gain.setValueAtTime(1, time);
            gainC.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
            noiseC.connect(filterC);
            filterC.connect(gainC);
            gainC.connect(master);
            noiseC.start(time);
            break;
    }
};


window.initGroove = function() {
    const pads = document.querySelectorAll('#grooveScreen .drum-pad');
    pads.forEach((pad) => {
        pad.style.cursor = 'pointer';
        pad.setAttribute('role', 'button');
        pad.setAttribute('tabindex', '0');
    });
};

// ========== GB WIKI (Encyclopedia) ==========
window.searchWiki = async function() {
    const search = document.getElementById('wikiSearch');
    const query = search ? search.value.trim() : '';
    if(!query) return;
    await fetchWikiArticle(query);
};

window.randomWiki = async function() {
    const status = document.getElementById('wikiStatus');
    const result = document.getElementById('wikiResult');
    if(status) {
        status.style.display = 'block';
        status.textContent = 'FETCHING RANDOM ARTICLE...';
    }
    if(result) result.style.display = 'none';
    if(window.sounds) sounds.launch();

    try {
        const res = await fetch('https://en.wikipedia.org/api/rest_v1/page/random/summary');
        if(!res.ok) throw new Error('CONNECTION ERROR');
        const data = await res.json();
        const search = document.getElementById('wikiSearch');
        if(search) search.value = data.title;
        displayWikiResult(data);
    } catch(err) {
        if(status) status.textContent = '!! ' + err.message.toUpperCase() + ' !!';
        if(window.sounds) sounds.back();
    }
};

async function fetchWikiArticle(query) {
    const status = document.getElementById('wikiStatus');
    const result = document.getElementById('wikiResult');
    if(status) {
        status.style.display = 'block';
        status.textContent = 'FETCHING KNOWLEDGE...';
    }
    if(result) result.style.display = 'none';
    if(window.sounds) sounds.launch();

    try {
        const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query.replace(/ /g, '_'))}`);
        if(!response.ok) {
            if(response.status === 404) throw new Error('TOPIC NOT FOUND');
            else throw new Error('CONNECTION ERROR');
        }
        const data = await response.json();
        displayWikiResult(data);
    } catch(err) {
        if(status) status.textContent = '!! ' + err.message.toUpperCase() + ' !!';
        if(window.sounds) sounds.back();
    }
}

function displayWikiResult(data) {
    const status = document.getElementById('wikiStatus');
    const result = document.getElementById('wikiResult');
    const thumbWrap = document.getElementById('wikiThumb');
    const thumbImg = document.getElementById('wikiThumbImg');

    if(status) status.style.display = 'none';
    if(result) {
        result.style.display = 'block';
        result.dataset.loaded = 'true';
    }

    _el = document.getElementById('wikiTitle'); if(_el) _el.textContent = data.title.toUpperCase();
    _el = document.getElementById('wikiSummary'); if(_el) _el.textContent = data.extract;

    if(data.thumbnail && data.thumbnail.source) {
        if(thumbImg) thumbImg.src = data.thumbnail.source;
        if(thumbWrap) thumbWrap.style.display = 'block';
    } else if(thumbWrap) {
        thumbWrap.style.display = 'none';
    }

    const sectionsEl = document.getElementById('wikiSections');
    if(sectionsEl) sectionsEl.innerHTML = '';

    if(data.sections) {
        data.sections.slice(0, 5).forEach(sec => {
            const div = document.createElement('div');
            div.style.cssText = 'margin-top: 6px; border: 1px solid rgba(15,56,15,0.3); border-radius: 3px;';
            div.innerHTML = `
                <div onclick="toggleWikiSection(this)" style="font-size: 8px; font-weight: bold; padding: 4px; cursor: pointer; background: rgba(15,56,15,0.08);">
                    ${sec.line.toUpperCase()} <span style="font-size: 6px; opacity: 0.6;">▼</span>
                </div>
                <div class="wiki-section-body" style="display: none; padding: 4px; font-size: 7px;">
                    ${sec.snippet || 'No content available.'}
                </div>
            `;
            if(sectionsEl) sectionsEl.appendChild(div);
        });
    }

    if(window.sounds) sounds.coin();
}

window.toggleWikiSection = function(headerEl) {
    const body = headerEl.nextElementSibling;
    if(!body) return;
    const arrow = headerEl.querySelector('span');
    if(body.style.display === 'none') {
        body.style.display = 'block';
        if(arrow) arrow.textContent = '▲';
    } else {
        body.style.display = 'none';
        if(arrow) arrow.textContent = '▼';
    }
};


window.initWiki = function() {
    const search = document.getElementById('wikiSearch');
    const status = document.getElementById('wikiStatus');
    const result = document.getElementById('wikiResult');
    const thumb = document.getElementById('wikiThumb');
    if(search) {
        search.onkeydown = (e) => { if(e.key === 'Enter') window.searchWiki(); };
        search.focus();
    }
    if(status && (!result || result.style.display !== 'block')) {
        status.style.display = 'block';
        status.textContent = 'ENTER A TOPIC OR TAP 🎲 FOR RANDOM';
    }
    if(result && !result.dataset.loaded) result.style.display = 'none';
    if(thumb && (!result || result.style.display !== 'block')) thumb.style.display = 'none';
};

window.initHealth = function() {
    const bmi = document.getElementById('hcBmiResult');
    const tip = document.getElementById('hcTipResult');
    if(bmi && !bmi.textContent) bmi.textContent = 'ENTER KG + CM TO CALCULATE BMI';
    if(tip && !tip.textContent) tip.textContent = 'ENTER BILL + TIP %';
};

window.initSettings = function() {
    const themeSelect = document.getElementById('themeSelect');
    if(themeSelect && window.state) themeSelect.value = state.theme || 'classic';
    const soundToggle = document.getElementById('soundToggle');
    if(soundToggle) soundToggle.textContent = window.soundEnabled === false ? 'OFF' : 'ON';
};
document.getElementById('wikiSearch')?.addEventListener('keydown', (e) => {
    if(e.key === 'Enter') searchWiki();
});

// ========== EMULATOR (ROM Loader) ==========
window.loadRomFile = function(input) {
    const file = input.files[0];
    const status = document.getElementById('emulatorStatus');
    const zone = document.getElementById('romDropZone');
    
    if(!file) return;
    
    // Simulate loading sequence
    status.innerHTML = "READING CARTRIDGE...";
    status.style.color = "var(--gb-text)";
    
    if(zone) zone.style.opacity = "0.3";
    
    sounds.launch();
    
    setTimeout(() => {
        const ext = file.name.split('.').pop().toLowerCase();
        if(ext === 'gb' || ext === 'gbc' || ext === 'nes') {
            status.innerHTML = `
                <div style="color: #0c0; font-weight: bold; margin-bottom: 5px;">CARTRIDGE ACCEPTED</div>
                <div>${file.name.toUpperCase()}</div>
                <div style="margin-top: 15px; font-size: 8px;">SYSTEM READY.</div>
                <div style="margin-top: 5px; opacity: 0.7; font-size: 6px;">(EMULATION CORE PENDING)</div>
            `;
            sounds.coin();
        } else {
            if(status) status.textContent = "INVALID FORMAT. USE .GB .GBC .NES";
            status.style.color = "#a00";
            sounds.back();
            if(zone) zone.style.opacity = "1";
        }
    }, 1500);
};

// ========== ADVENTURE & TROLL HELPERS ==========
window.trollJumpToLevel = function() {
    const lvlInput = document.getElementById('trollLevelSearch');
    const frame = document.getElementById('trollFrame');
    if(!lvlInput || !frame) return;
    
    const lvl = parseInt(lvlInput.value);
    if(isNaN(lvl) || lvl < 1 || lvl > 10000) return alert("ENTER LEVEL 1-10,000");
    
    // Inject into iframe
    if(frame.contentWindow && frame.contentWindow.loadTrollLevel) {
        frame.contentWindow.loadTrollLevel(lvl);
        sounds.launch();
    }
};

// ========== HELP SYSTEM ==========
window.initHelp = function() {
    const container = document.getElementById('helpContent');
    if(!container) return;
    container.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 8px; color: var(--gb-text);">🕹️ HARDWARE CONTROLS</div>
        <div style="line-height: 1.4; margin-bottom: 12px; opacity: 0.9;">
            <b>D-PAD / ARROWS:</b> Navigate grid, move in games.<br>
            <b>A BUTTON / ENTER / SPACE:</b> Launch app, select, action.<br>
            <b>B BUTTON / ESC:</b> Back to Home screen.<br>
            <b>SELECT / START:</b> System menu & shortcuts.
        </div>
        <div style="font-weight: bold; margin-bottom: 8px; color: var(--gb-text);">💡 CORE FEATURES</div>
        <div style="line-height: 1.4; opacity: 0.9;">
            🎤 <b>KARAOKE:</b> Live lyrics search & synchronized auto-scroller with pitch shift.<br>
            🎹 <b>BEATS:</b> 8-track Tone.js drum & synth step sequencer with presets.<br>
            ⚔️ <b>QUEST:</b> 10-level tile-based RPG adventure.<br>
            📡 <b>BITCHAT:</b> P2P link-cable chat & games over WebRTC.
        </div>
    `;
};

// ========== LENIS & GSAP SMOOTH ANIMATIONS ==========
window.addEventListener('DOMContentLoaded', () => {
    try {
        if(typeof Lenis !== 'undefined') {
            const lenis = new Lenis({ duration: 1.2, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
            function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
            requestAnimationFrame(raf);
        }
    } catch(e) {}
});

// ========== PERSISTENT FLOATING BITCHAT WIDGET ==========
let isQuickChatOpen = false;

window.toggleQuickChat = function() {
    const box = document.getElementById('bitchatQuickBox');
    if(!box) return;
    isQuickChatOpen = !isQuickChatOpen;

    if(isQuickChatOpen) {
        box.style.display = 'flex';
        if(typeof gsap !== 'undefined') {
            gsap.fromTo(box, { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.25, ease: 'back.out(1.7)' });
        }
    } else {
        if(typeof gsap !== 'undefined') {
            gsap.to(box, { scale: 0.7, opacity: 0, duration: 0.15, onComplete: () => { box.style.display = 'none'; } });
        } else {
            box.style.display = 'none';
        }
    }
};

window.sendQuickMsg = function() {
    const input = document.getElementById('bitchatQuickInput');
    const log = document.getElementById('bitchatQuickLog');
    if(!input || !log) return;
    const msg = input.value.trim();
    if(!msg) return;

    const myNick = document.getElementById('chatNick')?.value || 'ME';
    const entry = document.createElement('div');
    entry.style.cssText = 'margin-bottom: 4px; padding: 2px 4px; background: rgba(0,255,0,0.1); border-radius: 3px;';
    entry.innerHTML = `<b>${myNick}:</b> ${msg}`;
    log.appendChild(entry);
    log.scrollTop = log.scrollHeight;
    input.value = '';

    // Broadcast over P2P if connected
    if(window.gbConns && window.gbConns.length > 0) {
        window.gbConns.forEach(c => {
            if(c.open) c.send({ type: 'msg', content: msg, nick: myNick });
        });
    }
    if(window.sounds && window.sounds.click) window.sounds.click();
};

window.sendQuickEmoji = function(emoji) {
    const input = document.getElementById('bitchatQuickInput');
    if(input) {
        input.value += emoji;
        window.sendQuickMsg();
    }
};

// ========== FIGLET ASCII ART ==========
window.genAscii = function(text) {
    if(!text) return;
    if(typeof figlet === 'undefined') { const artDiv = document.getElementById('asciiArt'); if(artDiv) artDiv.textContent = 'Loading font... try again in a moment'; return; }
    const art = figlet.textSync(text, { font: 'Standard', horizontalLayout: 'default' });
    const artDiv = document.getElementById('asciiArt');
    if(artDiv) artDiv.textContent = art.replace(/\n/g, '<br>');
};

window.genRandomAscii = function() {
    const arts = [
        `(o_o)\n (v)\n/| |\\`,
        `/\\_/\\\n( o.o )\n > ^ <`,
        ` __      _\n o'')}____//\n \`_/      )\n (_(_/-(_/`,
        `   |\\__/,|   (\`\\\n _.|o o  |_   ) )\n-(((---(((--------`,
        `      /\\\n     /  \\\n    /____\\\n   (      )\n   |______|`
    ];
    const art = arts[Math.floor(Math.random() * arts.length)];
    const artDiv = document.getElementById('asciiArt');
    if(artDiv) artDiv.innerHTML = art.replace(/\n/g, '<br>');
};

// Initialize currency converter on page load
window.initCurrency().catch(() => {
    /* API may be offline, UI still works */
});