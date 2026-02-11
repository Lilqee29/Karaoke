// ========== UTILS & SHARED STATE ==========
const pad = (n) => n.toString().padStart(2, '0');

const JAMENDO_CLIENT_ID = '56d30c55';
const RADIO_API_URL = 'https://de1.api.radio-browser.info/json/stations/search';

// ========== MUSIC PLAYER (Vinyl Style) ==========
let musicQueue = [];
let currentMusicIdx = 0;
let isMusicPlaying = false;
let isShuffle = false;
let isRepeat = false;
let vinylRotation = 0;
let vinylInterval = null;

function initMusic() {
    const audio = document.getElementById('musicAudio');
    if(audio) audio.onended = () => { if (isRepeat) audio.play(); else nextMusic(); };
    startVinyl(); // Initialize the visual state
    stopVinyl(); // But don't rotate yet
    
    // Add file input listener if not exists
    const fileInput = document.getElementById('musicFileInput');
    if(fileInput) {
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if(file) {
                const url = URL.createObjectURL(file);
                const track = {
                    name: file.name.replace(/\.[^/.]+$/, ""),
                    artist_name: "Local File",
                    audio: url
                };
                musicQueue.unshift(track);
                playMusic(0);
                renderQueue();
            }
        };
    }
}
window.loadMusicFile = function() {
    document.getElementById('musicFileInput').click();
};


async function searchMusic() {
    const query = document.getElementById('musicSearch').value;
    if (!query) return;
    document.getElementById('musicTitle').textContent = "SEARCHING...";
    try {
        const res = await fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=jsonflat&limit=10&search=${encodeURIComponent(query)}`);
        const data = await res.json();
        musicQueue = data.results;
        currentMusicIdx = 0;
        renderQueue();
        if (musicQueue.length > 0) playMusic(0);
        else document.getElementById('musicTitle').textContent = "NO RESULTS";
    } catch (e) { document.getElementById('musicTitle').textContent = "API ERROR"; }
}

function playMusic(idx) {
    currentMusicIdx = idx;
    const track = musicQueue[idx];
    if (!track) return;
    const audio = document.getElementById('musicAudio');
    audio.src = track.audio;
    audio.play();
    isMusicPlaying = true;
    document.getElementById('musicTitle').textContent = track.name.toUpperCase();
    document.getElementById('musicArtist').textContent = track.artist_name.toUpperCase();
    document.getElementById('musicPlayBtn').textContent = "⏸";
    startVinyl();
    document.getElementById('vinylNeedle').style.transform = "rotate(0deg)";
}

function toggleMusicPlay() {
    const audio = document.getElementById('musicAudio');
    if (!audio.src && musicQueue.length > 0) { playMusic(0); return; }
    if (!audio.src) return;
    if (isMusicPlaying) {
        audio.pause(); stopVinyl();
        document.getElementById('musicPlayBtn').textContent = "▶";
        document.getElementById('vinylNeedle').style.transform = "rotate(30deg)";
    } else {
        audio.play(); startVinyl();
        document.getElementById('musicPlayBtn').textContent = "⏸";
        document.getElementById('vinylNeedle').style.transform = "rotate(0deg)";
    }
    isMusicPlaying = !isMusicPlaying;
}

function nextMusic() { if (musicQueue.length === 0) return; playMusic((currentMusicIdx + 1) % musicQueue.length); }
function prevMusic() { if (musicQueue.length === 0) return; playMusic((currentMusicIdx - 1 + musicQueue.length) % musicQueue.length); }
function toggleMusicShuffle() { isShuffle = !isShuffle; document.getElementById('shuffleBtn').style.opacity = isShuffle ? '1' : '0.5'; }
function toggleMusicRepeat() { isRepeat = !isRepeat; document.getElementById('repeatBtn').style.opacity = isRepeat ? '1' : '0.5'; }
function toggleMusicQueue() { const q = document.getElementById('musicQueue'); q.style.display = q.style.display === 'none' ? 'block' : 'none'; }
function renderQueue() {
    const list = document.getElementById('queueList'); list.innerHTML = '';
    musicQueue.forEach((t, i) => {
        const item = document.createElement('div');
        item.style.cssText = `padding: 4px; border-bottom: 1px solid rgba(15,56,15,0.2); cursor: pointer; ${i === currentMusicIdx ? 'background: #306230; color: #9bbc0f;' : ''}`;
        item.textContent = `${i+1}. ${t.name.substring(0,25)}...`;
        item.onclick = () => { playMusic(i); toggleMusicQueue(); };
        list.appendChild(item);
    });
}
function startVinyl() { if (vinylInterval) clearInterval(vinylInterval); vinylInterval = setInterval(() => { vinylRotation = (vinylRotation + 2) % 360; document.getElementById('vinylContainer').style.transform = `rotate(${vinylRotation}deg)`; }, 20); }
function stopVinyl() { clearInterval(vinylInterval); vinylInterval = null; }

// ========== SPIRIT RADAR Pro ==========
let spiritPingInterval = null;
function initSpirit() {
    const status = document.getElementById('radarStatus');
    status.textContent = "SCANNING FIELDS...";
    if (spiritPingInterval) clearInterval(spiritPingInterval);
    spiritPingInterval = setInterval(() => { if (Math.random() > 0.85) triggerGhostSignal(); }, 3000);
}
function triggerGhostSignal() {
    const dot = document.getElementById('spiritDot'); const pulse = document.getElementById('spiritPulse'); const status = document.getElementById('radarStatus');
    const x = 40 + Math.random() * 140; const y = 40 + Math.random() * 140;
    dot.style.left = x + 'px'; dot.style.top = y + 'px'; dot.style.display = 'block';
    status.textContent = "!! ENTITY !!"; status.style.color = "#f00";
    playBeep(800, 0.1);
    pulse.style.animation = 'none'; setTimeout(() => { pulse.style.animation = 'radar-pulse 1s ease-out'; }, 10);
    setTimeout(() => { dot.style.display = 'none'; status.textContent = "SEARCHING..."; status.style.color = "#0f0"; }, 2000);
}
function playBeep(freq, dur) { const ctx = new AudioContext(); const o = ctx.createOscillator(); const g = ctx.createGain(); o.frequency.value = freq; g.gain.value = 0.1; o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + dur); }

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
                document.getElementById('radioPlayBtn').textContent = "STOP"; 
                document.getElementById('radioFreqText').textContent = station.name.substring(0,8); 
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
function toggleRadio() { if (isRadioPlaying) { radioPlayer.pause(); isRadioPlaying = false; document.getElementById('radioPlayBtn').textContent = "START"; } else if (radioPlayer.src) { radioPlayer.play(); isRadioPlaying = true; document.getElementById('radioPlayBtn').textContent = "STOP"; } }
function startRadioVisual() {
    const c = document.getElementById('radioCanvas'); if(!c) return; const ctx = c.getContext('2d');
    const draw = () => { if (!isRadioPlaying) return; const data = ctx.createImageData(c.width, c.height); for (let i = 0; i < data.data.length; i += 4) { const v = Math.random() * 255; data.data[i] = data.data[i+1] = data.data[i+2] = v; data.data[i+3] = 255; } ctx.putImageData(data, 0, 0); requestAnimationFrame(draw); };
    draw();
}

// ========== 10 NEW APPS INIT ==========
window.initTranslate = function() { 
    const el = document.getElementById('transOutput');
    if (el) el.textContent = "READY..."; 
};

// ========== NEWS APP ==========
let newsItems = [];
let newsIndex = 0;
let newsView = 'list';

window.initNews = async function() {
    newsView = 'list';
    newsIndex = 0;
    const list = document.getElementById('newsList');
    if(!list) return;
    list.innerHTML = 'LOADING HEADLINES...';
    try {
        const res = await fetch('https://api.spaceflightnewsapi.net/v4/articles/?limit=10');
        const data = await res.json();
        newsItems = data.results;
        renderNewsList();
    } catch(e) { 
        list.innerHTML = 'OFFLINE MODE<br>CHECK CONNECTION'; 
    }
};

function renderNewsList() {
    const list = document.getElementById('newsList');
    if(!list) return;
    list.innerHTML = '';
    newsItems.forEach((item, i) => {
        const div = document.createElement('div');
        div.style.cssText = `padding: 8px; border-bottom: 1px solid #0f380f; margin-bottom: 2px; background: ${i === newsIndex ? '#0f380f' : 'transparent'}; color: ${i === newsIndex ? '#9bbc0f' : '#0f380f'}; cursor: pointer; font-size: 10px;`;
        div.innerHTML = `<strong>${item.title.substring(0, 50)}...</strong>`;
        div.onclick = () => openNewsDetail(i);
        list.appendChild(div);
    });
    if(list.children[newsIndex]) list.children[newsIndex].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

window.handleNewsInput = function(key) {
    if(newsView === 'list') {
        if(key === 'ArrowUp') {
            newsIndex = (newsIndex - 1 + newsItems.length) % newsItems.length;
            renderNewsList();
            sounds.click();
        } else if(key === 'ArrowDown') {
            newsIndex = (newsIndex + 1) % newsItems.length;
            renderNewsList();
            sounds.click();
        } else if(key === 'Enter' || key === 'a' || key === 'z') {
            openNewsDetail(newsIndex);
            sounds.launch();
        }
    } else {
        if(key === 'b' || key === 'Backspace' || key === 'Escape') {
            newsView = 'list';
            document.getElementById('newsList').style.display = 'block';
            const det = document.getElementById('newsDetail');
            if(det) det.style.display = 'none';
            sounds.back();
        }
    }
};

function openNewsDetail(index) {
    const item = newsItems[index];
    if(!item) return;
    newsView = 'detail';
    
    const list = document.getElementById('newsList');
    let detail = document.getElementById('newsDetail');
    if(!detail) {
        detail = document.createElement('div');
        detail.id = 'newsDetail';
        detail.style.cssText = "display:none; position:absolute; top:35px; left:0; width:100%; height:calc(100% - 35px); background:#9bbc0f; color:#0f380f; padding:10px; overflow-y:auto; font-family: 'Courier New', monospace; z-index:9999;";
        list.parentNode.appendChild(detail);
    }
    
    // Ensure detail is visible and clickable
    detail.onclick = () => { /* Prevent accidental close if needed */ };
    
    list.style.display = 'none';
    detail.style.display = 'block';
    detail.innerHTML = `
        <h2 style="font-size:12px; border-bottom:2px solid #0f380f; padding-bottom:5px; margin-bottom: 5px;">${item.title}</h2>
        <div style="font-size:8px; opacity:0.7; margin-bottom: 10px;">${new Date(item.published_at).toLocaleDateString()}</div>
        <p style="font-size:10px; line-height:1.4;">${item.summary}</p>
        <button onclick="newsView='list'; document.getElementById('newsList').style.display='block'; document.getElementById('newsDetail').style.display='none'; sounds.back();" style="width: 100%; margin-top: 15px;">BACK TO HEADLINES</button>
    `;
}
window.initTranslate = function() { document.getElementById('transOutput').textContent = "READY..."; };
async function translateText() {
    const text = document.getElementById('transInput').value;
    const lang = document.getElementById('transLang').value;
    const output = document.getElementById('transOutput');
    
    if (!text) return;
    
    output.textContent = "TRANSLATING...";
    sounds.click();
    
    try {
        const encoded = encodeURIComponent(text);
        const res = await fetch(`https://api.mymemory.translated.net/get?q=${encoded}&langpair=en|${lang}`);
        const data = await res.json();
        
        if (data.responseData && data.responseData.translatedText) {
            output.textContent = data.responseData.translatedText.toUpperCase();
            sounds.coin();
        } else {
            output.textContent = "[TRANSLATION FAILED]";
        }
    } catch(e) {
        output.textContent = `[${lang.toUpperCase()}] OFFLINE`;
    }
}
function initStock() {
    const c = document.getElementById('stockCanvas'); if(!c) return; const ctx = c.getContext('2d');
    ctx.strokeStyle = '#0f0'; ctx.beginPath(); ctx.moveTo(0, 100); for(let i=1; i<20; i++) ctx.lineTo(i * 15, Math.random() * 100); ctx.stroke();
}
async function initCrypto() { refreshCrypto(); }
async function refreshCrypto() {
    const btc = document.getElementById('btcPrice'); btc.textContent = "...";
    try {
        const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd'); const data = await res.json();
        btc.textContent = `$${data.bitcoin.usd}`; document.getElementById('ethPrice').textContent = `$${data.ethereum.usd}`;
    } catch(e) { btc.textContent = "OFFLINE"; }
}
let breatheInterval = null;
function initBreathe() {
    const circle = document.getElementById('breatheCircle'); if (breatheInterval) clearInterval(breatheInterval);
    let state = 0; breatheInterval = setInterval(() => { state = (state + 1) % 2; circle.style.transform = state === 0 ? 'scale(1.3)' : 'scale(0.7)'; document.getElementById('breatheText').textContent = state === 0 ? 'BREATHE OUT' : 'BREATHE IN'; }, 4000);
}
let mapX = 0, mapY = 0;
function initMap() { mapX = 0; mapY = 0; document.getElementById('mapContent').style.transform = `translate(0,0)`; }
function mapMove(dir) { const map = document.getElementById('mapContent'); if (dir === 'up') mapY += 25; if (dir === 'down') mapY -= 25; if (dir === 'left') mapX += 25; if (dir === 'right') mapX -= 25; map.style.transform = `translate(${mapX}px, ${mapY}px)`; }
let contacts = [{ name: 'PROF. OAK', phone: '555-001' }];
function initContacts() { renderContacts(); }
function renderContacts() { const list = document.getElementById('contactList'); list.innerHTML = ''; contacts.forEach(c => { const item = document.createElement('div'); item.style.cssText = `padding: 5px; border: 1px solid #333; margin-bottom: 2px;`; item.innerHTML = `<strong>${c.name}</strong><br>${c.phone}`; list.appendChild(item); }); }
function addContact() { const name = prompt("NAME:"); if(name) { contacts.push({ name: name.toUpperCase(), phone: '555-OS' }); renderContacts(); } }
function initBarcode() { document.getElementById('qrPlaceholder').innerHTML = ''; }
function generateQR() { const input = document.getElementById('qrInput').value; document.getElementById('qrPlaceholder').innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${input}" style="width:100%">`; }
let alarmTimeStr = "07:00";
function initAlerts() { document.getElementById('alarmTime').textContent = alarmTimeStr; }
function adjAlarm(amt) { let [h, m] = alarmTimeStr.split(':').map(Number); h = (h + amt + 24) % 24; alarmTimeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`; document.getElementById('alarmTime').textContent = alarmTimeStr; }
function adjAlarmMin(amt) { let [h, m] = alarmTimeStr.split(':').map(Number); m = (m + amt + 60) % 60; alarmTimeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`; document.getElementById('alarmTime').textContent = alarmTimeStr; }
function toggleAlarm() { const btn = document.getElementById('alarmBtn'); btn.textContent = btn.textContent === 'SET ALARM' ? 'ALARM ACTIVE' : 'SET ALARM'; btn.style.background = btn.textContent === 'ALARM ACTIVE' ? '#f00' : '#33aa33'; }
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
    if(disp) disp.textContent = "____";
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
    document.getElementById('vaultPinDisplay').textContent = "*".repeat(len) + "_".repeat(Math.max(0, 4-len));
    
    sounds.click();
    
    if(len === 4) {
        if(vaultInput === "UUDD") {
            sounds.coin();
            document.getElementById('vaultLock').style.display='none';
            document.getElementById('vaultContent').style.display='block';
        } else {
            document.getElementById('vaultPinDisplay').textContent = "WRONG";
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
                lyricDiv.textContent = 'NO LYRICS FOUND :(';
                // Still allow manual search or back
            }
        } catch(e) { lyricDiv.textContent = 'ERROR LOADING LYRICS'; }
    },
    back: () => {
        document.getElementById('kResults').style.display = 'block';
        document.getElementById('kLyrics').style.display = 'none';
        document.getElementById('kControls').style.display = 'none';
        document.getElementById('kBackBtn').style.display = 'none';
        document.getElementById('kLyrics').textContent = '';
        karaoke.stopAutoScroll();
    },
    // Simple auto-scroller
    scrollTimer: null,
    togglePlay: () => {
        const btn = document.getElementById('kPlayBtn');
        if(karaoke.scrollTimer) {
            karaoke.stopAutoScroll();
            btn.textContent = "▶ START";
        } else {
            const div = document.getElementById('kLyrics');
            karaoke.scrollTimer = setInterval(() => {
                div.scrollTop += 1;
            }, 50);
            btn.textContent = "⏸ PAUSE";
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
    addGems(1);
    sounds.coin();
    const btn = document.querySelector('#minerScreen button');
    btn.style.transform = 'scale(0.9)';
    setTimeout(() => btn.style.transform = 'scale(1)', 100);
    
    // Random bonus
    if(Math.random() > 0.95) {
        alert("CRITICAL HIT! +10 GEMS!");
        addGems(10);
    }
};

// ========== COIN FLIP ==========
window.tossCoin = function() {
    const display = document.getElementById('coinDisplay');
    const result = document.getElementById('coinResult');
    display.style.animation = 'spin 0.5s infinite linear';
    result.textContent = "FLIPPING...";
    sounds.launch();
    
    setTimeout(() => {
        display.style.animation = 'none';
        const isHeads = Math.random() > 0.5;
        display.textContent = isHeads ? '🪙' : '🦅';
        result.textContent = isHeads ? 'HEADS' : 'TAILS';
        sounds.coin();
    }, 1000);
};

// ========== DICE ROLLER ==========
window.rollDice = function() {
    const display = document.getElementById('diceDisplay');
    const result = document.getElementById('diceResult');
    display.style.animation = 'shake 0.3s infinite';
    result.textContent = "ROLLING...";
    sounds.launch();
    
    setTimeout(() => {
        display.style.animation = 'none';
        const roll = Math.floor(Math.random() * 6) + 1;
        const faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        display.textContent = faces[roll - 1];
        if(roll === 6) {
            result.textContent = "CRITICAL! +3 GEMS";
            addGems(3);
            sounds.coin();
        } else {
            result.textContent = `ROLLED A ${roll}`;
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
    text.textContent = fortunes[Math.floor(Math.random() * fortunes.length)];
    addGems(1);
};

// ========== MORSE CONVERTER ==========
const morseCode = { 'A':'.-', 'B':'-...', 'C':'-.-.', 'D':'-..', 'E':'.', 'F':'..-.', 'G':'--.', 'H':'....', 'I':'..', 'J':'.---', 'K':'-.-', 'L':'.-..', 'M':'--', 'N':'-.', 'O':'---', 'P':'.--.', 'Q':'--.-', 'R':'.-.', 'S':'...', 'T':'-', 'U':'..-', 'V':'...-', 'W':'.--', 'X':'-..-', 'Y':'-.--', 'Z':'--..', '1':'.----', '2':'..---', '3':'...--', '4':'....-', '5':'.....', '6':'-....', '7':'--...', '8':'---..', '9':'----.', '0':'-----', ' ':' ' };

window.updateMorse = function() {
    const input = document.getElementById('morseInput').value.toUpperCase();
    let output = "";
    for(let char of input) {
        output += (morseCode[char] || char) + " ";
    }
    document.getElementById('morseOutput').textContent = output;
};

window.playMorse = function() {
    const text = document.getElementById('morseOutput').textContent;
    const ctx = window.audioCtx;
    if(ctx.state === 'suspended') ctx.resume();
    
    let time = ctx.currentTime + 0.1;
    const dot = 0.08; // Duration of dot in seconds
    
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
            time += dot * 2; // dot (1) + gap (1)
        } else if(char === '-') {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.frequency.value = 600;
            o.type = 'sine';
            o.connect(g); g.connect(ctx.destination);
            g.gain.setValueAtTime(0.1, time);
            g.gain.exponentialRampToValueAtTime(0.001, time + (dot * 3));
            o.start(time); o.stop(time + (dot * 3));
            time += dot * 4; // dash (3) + gap (1)
        } else {
            time += dot * 3; // space between chars (3)
        }
    }
    // Auto resume logic if needed
};

// ========== BEAT BOY (Premium Sequencer v3.0) ==========
let remixGrid = [];
let remixInterval = null;
let remixStep = 0;
let isRemixPlaying = false;
let remixBPM = 120;
let remixMasterVol = 0.8;

const INSTRUMENTS = [
    { name: 'KICK', type: 'drum', gain: 1.0, color: '#f00' },
    { name: 'SNARE', type: 'noise', gain: 0.6, color: '#ffb700' },
    { name: 'HI-HAT', type: 'noise', gain: 0.4, color: '#00ccff' },
    { name: 'BASS', type: 'square', gain: 0.5, color: '#0f0' },
    { name: 'LEAD', type: 'sawtooth', gain: 0.4, color: '#ff00ff' }
];

window.initRemix = function() {
    const gridEl = document.getElementById('remixGrid');
    if(!gridEl) return;
    gridEl.innerHTML = '';
    remixGrid = [];
    isRemixPlaying = false;
    remixStep = 0;
    if(remixInterval) clearInterval(remixInterval);
    
    // Update Indicators
    const bpmDisplay = document.getElementById('remixBpmDisplay');
    if(bpmDisplay) bpmDisplay.textContent = `${remixBPM} BPM`;

    // Create Tracks
    INSTRUMENTS.forEach((inst, r) => {
        let rowData = new Array(16).fill(false);
        
        const trackDiv = document.createElement('div');
        trackDiv.className = 'beat-boy-track';
        
        trackDiv.innerHTML = `
            <div class="beat-boy-track-header">
                <span style="color: ${inst.color}">${inst.name}</span>
            </div>
            <div class="beat-boy-steps" id="track-${r}"></div>
        `;
        
        const stepsContainer = trackDiv.querySelector('.beat-boy-steps');
        for(let c=0; c<16; c++) {
            const step = document.createElement('div');
            step.className = 'beat-boy-step';
            step.dataset.r = r;
            step.dataset.c = c;
            step.onclick = function() {
                rowData[c] = !rowData[c];
                this.classList.toggle('active');
                if(rowData[c]) playRemixSound(r, c);
                sounds.click();
            };
            stepsContainer.appendChild(step);
        }
        
        gridEl.appendChild(trackDiv);
        remixGrid.push(rowData);
    });
};

window.toggleRemixPlay = function() {
    const btn = document.getElementById('remixPlayBtn');
    if(isRemixPlaying) {
        clearInterval(remixInterval);
        if(btn) btn.textContent = "▶ PLAY";
        // Clear highlights
        document.querySelectorAll('.beat-boy-step').forEach(s => s.classList.remove('highlight'));
    } else {
        remixInterval = setInterval(playStep, (60000 / remixBPM) / 4); // 16th notes
        if(btn) btn.textContent = "⏹ STOP";
    }
    isRemixPlaying = !isRemixPlaying;
};

window.changeBPM = function(delta) {
    remixBPM = Math.min(240, Math.max(40, remixBPM + delta));
    const bpmDisplay = document.getElementById('remixBpmDisplay');
    if(bpmDisplay) bpmDisplay.textContent = `${remixBPM} BPM`;
    if(isRemixPlaying) {
        clearInterval(remixInterval);
        remixInterval = setInterval(playStep, (60000 / remixBPM) / 4);
    }
    sounds.click();
};

window.updateRemixVol = function(val) {
    remixMasterVol = val / 100;
    document.getElementById('remixVolLabel').textContent = `${val}%`;
};

function playStep() {
    const stepIndicator = document.getElementById('remixStepIndicator');
    if(stepIndicator) stepIndicator.textContent = `STEP: ${remixStep + 1}`;

    // Update visuals
    document.querySelectorAll('.beat-boy-step').forEach(s => {
        if(parseInt(s.dataset.c) === remixStep) {
            s.classList.add('highlight');
        } else {
            s.classList.remove('highlight');
        }
    });
    
    for(let r=0; r<INSTRUMENTS.length; r++) {
        if(remixGrid[r][remixStep]) {
            playRemixSound(r, remixStep);
        }
    }
    remixStep = (remixStep + 1) % 16;
}

function playRemixSound(r, step) {
    const inst = INSTRUMENTS[r];
    const time = audioCtx.currentTime;
    const masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(remixMasterVol, time);
    masterGain.connect(audioCtx.destination);

    if(inst.type === 'drum') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
        gain.gain.setValueAtTime(inst.gain, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(time);
        osc.stop(time + 0.5);
    } else if (inst.name === 'HI-HAT') {
        const bufferSize = audioCtx.sampleRate * 0.05;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        const filter = audioCtx.createBiquadFilter();
        filter.type = "highpass";
        filter.frequency.setValueAtTime(7000, time);
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(inst.gain, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);
        source.start(time);
    } else if (inst.name === 'SNARE') {
        const osc = audioCtx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(250, time);
        const noise = audioCtx.createBufferSource();
        const bufferSize = audioCtx.sampleRate * 0.1;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        noise.buffer = buffer;
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(inst.gain, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
        osc.connect(gain);
        noise.connect(gain);
        gain.connect(masterGain);
        osc.start(time); noise.start(time);
        osc.stop(time + 0.1);
    } else {
        const osc = audioCtx.createOscillator();
        osc.type = inst.type;
        const freq = inst.name === 'BASS' ? 55 : (220 + (step % 4 * 110));
        osc.frequency.setValueAtTime(freq, time);
        const gain = audioCtx.createGain();
        gain.gain.setValueAtTime(inst.gain, time);
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(time);
        osc.stop(time + 0.2);
    }
}

window.clearRemix = function() {
    document.querySelectorAll('.beat-boy-step').forEach(s => s.classList.remove('active'));
    remixGrid.forEach(row => row.fill(false));
    sounds.back();
};

window.initPixel = function() {
    const grid = document.getElementById('pixelGrid');
    if(!grid) return;
    grid.innerHTML = '';
    // Increase size for better visibility
    grid.style.width = "220px";
    grid.style.height = "220px";
    
    for(let i=0; i<64; i++) {
        const d = document.createElement('div');
        d.style.cssText = "background: #fff; border: 1px solid #ccc; cursor: pointer;";
        d.onclick = function() {
            this.style.background = pixelColor;
            sounds.click();
        };
        grid.appendChild(d);
    }
};

window.clearPixel = function() {
    const grid = document.getElementById('pixelGrid');
    if(grid) Array.from(grid.children).forEach(c => c.style.background = '#fff');
    sounds.back();
};

window.guessNumber = function() {
    const input = document.getElementById('guessInput');
    const fb = document.getElementById('guessFeedback');
    if(!input || !fb) return;
    const val = parseInt(input.value);
    
    if(!window.targetNum) window.targetNum = Math.floor(Math.random() * 100) + 1;
    if(!window.guesses) window.guesses = 0;
    
    if(isNaN(val)) { 
        fb.innerHTML = "<span style='color:red'>ENTER A NUMBER!</span>"; 
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
    if(fb) fb.textContent = "READY! (1-100)";
};

// Initial calls that might be missing
window.initMorse = () => {
    const screen = document.getElementById('morseScreen');
    if(screen) screen.innerHTML = `
        <div style="text-align: center; padding: 10px;">
            <input id="morseInput" oninput="updateMorse()" placeholder="TEXT..." style="width: 80%; margin-bottom: 5px;">
            <div id="morseOutput" style="font-family: monospace; word-break: break-all; margin-bottom: 5px;"></div>
            <button onclick="playMorse()">PLAY</button>
        </div>
    `;
};

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
window.initIdle = function() {
    const screen = document.getElementById('idleScreen');
    if(screen) {
        screen.innerHTML = `
            <div style="text-align: center; padding: 10px; font-size: 8px;">
                TAP TO MINE GEMS!<br><br>
                <button onclick="mineGem()" style="padding: 10px; font-size: 10px; margin-bottom: 10px;">⛏️ MINE</button>
                <br>
                (Uses same Gem logic)
            </div>
        `;
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
let stopwatchInt = null;
let stopwatchTime = 0;
window.initStopwatch = function() {
    const screen = document.getElementById('stopwatchScreen');
    if(screen) {
        screen.innerHTML = `
            <div style="text-align: center; padding-top: 30px;">
                <div id="swDisplay" style="font-size: 16px;">00:00.00</div>
                <br>
                <div style="display: flex; gap: 5px; justify-content: center;">
                    <button onclick="toggleStopwatch()">START/STOP</button>
                    <button onclick="resetStopwatch()">RESET</button>
                </div>
            </div>
        `;
    }
};
window.toggleStopwatch = function() {
    if(stopwatchInt) {
        clearInterval(stopwatchInt);
        stopwatchInt = null;
    } else {
        const start = Date.now() - stopwatchTime;
        stopwatchInt = setInterval(() => {
            stopwatchTime = Date.now() - start;
            const ms = Math.floor((stopwatchTime % 1000) / 10);
            const s = Math.floor((stopwatchTime / 1000) % 60);
            const m = Math.floor((stopwatchTime / 60000) % 60);
            const d = document.getElementById('swDisplay');
            if(d) d.textContent = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}.${ms.toString().padStart(2,'0')}`;
        }, 10);
    }
};
window.resetStopwatch = function() {
    clearInterval(stopwatchInt);
    stopwatchInt = null;
    stopwatchTime = 0;
    const d = document.getElementById('swDisplay');
    if(d) d.textContent = "00:00.00";
};

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
window.initWorld = function() {
    const screen = document.getElementById('worldScreen');
    if(screen) {
        screen.innerHTML = '<canvas id="worldCanvas" width="160" height="144" style="width:100%; height:100%"></canvas>';
        const ctx = document.getElementById('worldCanvas').getContext('2d');
        // Draw simple map
        ctx.fillStyle = '#0f380f'; // Water
        ctx.fillRect(0,0,160,144);
        ctx.fillStyle = '#9bbc0f'; // Land
        ctx.beginPath();
        // Continent 1
        ctx.moveTo(30, 50); ctx.lineTo(60, 30); ctx.lineTo(80, 50); ctx.lineTo(70, 80); ctx.lineTo(40, 90); ctx.fill();
        // Continent 2
        ctx.beginPath();
        ctx.moveTo(100, 80); ctx.lineTo(130, 70); ctx.lineTo(140, 100); ctx.lineTo(110, 120); ctx.fill();
        
        ctx.fillStyle = '#0f380f';
        ctx.font = '10px monospace';
        ctx.fillText("WORLD MAP", 55, 15);
        ctx.font = '8px monospace';
        ctx.fillText("YOU ARE HERE", 45, 65);
    }
};

// ========== VAULT ==========
// Already defined in newapps.js earlier, but need to make sure logic works.
window.initVault = initVault; // Export existing



// ========== TODO APP ==========
function renderTodos() {
    const list = document.getElementById('todoList');
    if(!list) return;
    list.innerHTML = '';
    state.todos.forEach((todo, i) => {
        const div = document.createElement('div');
        div.style.cssText = 'padding: 5px; border-bottom: 1px solid #333; display: flex; justify-content: space-between;';
        div.innerHTML = `<span>${todo.text}</span> <button onclick="removeTodo(${i})" style="font-size: 5px;">X</button>`;
        list.appendChild(div);
    });
}
window.renderTodos = renderTodos;

window.addTodo = function() {
    const input = document.getElementById('todoInput');
    if(input && input.value.trim()) {
        state.todos.push({ text: input.value.trim(), done: false });
        input.value = '';
        saveState();
        renderTodos();
    }
};

window.removeTodo = function(index) {
    state.todos.splice(index, 1);
    saveState();
    renderTodos();
};

// ========== COUNTER APP ==========
window.initCounter = function() {
    if(state.counter === undefined) state.counter = 0;
    document.getElementById('countDisplay').textContent = state.counter;
};

window.updateCounter = function(delta) {
    if(delta === 0) {
        state.counter = 0;
        sounds.back();
    } else {
        state.counter += delta;
        sounds.click();
    }
    document.getElementById('countDisplay').textContent = state.counter;
    saveState();
};

// ========== PIXEL DRAW APP ==========
let drawColor = '#000000';
window.initDraw = function() {
    const grid = document.getElementById('drawGrid');
    if(!grid) return;
    grid.innerHTML = '';
    for(let i=0; i<256; i++) {
        const div = document.createElement('div');
        div.style.background = '#fff';
        div.onclick = function() { 
            this.style.background = drawColor; 
            sounds.click();
        };
        grid.appendChild(div);
    }
}
window.initDraw = initDraw;

window.clearDraw = function() {
    const pixels = document.querySelectorAll('#drawGrid div');
    pixels.forEach(p => p.style.background = '#fff');
};

window.setDrawColor = function(color) {
    drawColor = color;
    // Highlight selected color
    document.querySelectorAll('[id^="color"]').forEach(el => el.style.border = '1px solid #fff');
};

// ========== PAINT APP (Canvas) ==========
let isPainting = false;
let paintCtx = null;
let brushSize = 3;

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
window.nextFlashcard = () => { document.getElementById('flashCard').textContent = "Concept: CLOSURE"; };
window.startClock = () => { 
    if(window.clockInterval) clearInterval(window.clockInterval);
    window.clockInterval = setInterval(() => {
        const d = new Date();
        document.getElementById('bigClock').textContent = d.toLocaleTimeString();
        document.getElementById('bigDate').textContent = d.toDateString();
    }, 1000);
};
window.updateWeather = () => { document.getElementById('weatherText').textContent = "SIMULATED SUN"; };
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
        q.textContent = riddles[currentRiddleIdx].q;
        a.textContent = riddles[currentRiddleIdx].a;
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
let timerInt = null;
let timerTime = 0;
window.initTimer = function() {
    const screen = document.getElementById('timerScreen');
    if(screen) {
        screen.innerHTML = `
            <div style="text-align: center; padding-top: 20px;">
                <div id="timerDisplay" style="font-size: 24px;">00:00</div>
                <div style="margin: 10px;">
                    <button onclick="addTimer(1)">+1m</button>
                    <button onclick="addTimer(5)">+5m</button>
                    <button onclick="addTimer(-1)">-1m</button>
                </div>
                <button onclick="toggleTimer()">START/STOP</button>
                <button onclick="resetTimer()">RESET</button>
            </div>
        `;
    }
};

window.addTimer = function(min) {
    timerTime += min * 60;
    if(timerTime < 0) timerTime = 0;
    updateTimerDisplay();
};

window.toggleTimer = function() {
    if(timerInt) {
        clearInterval(timerInt);
        timerInt = null;
    } else {
        if(timerTime <= 0) return;
        timerInt = setInterval(() => {
            timerTime--;
            if(timerTime <= 0) {
                clearInterval(timerInt);
                timerInt = null;
                sounds.launch();
                alert("TIMER DONE!");
            }
            updateTimerDisplay();
        }, 1000);
    }
};

window.resetTimer = function() {
    clearInterval(timerInt);
    timerInt = null;
    timerTime = 0;
    updateTimerDisplay();
};

function updateTimerDisplay() {
    const d = document.getElementById('timerDisplay');
    if(d) {
        const m = Math.floor(timerTime / 60);
        const s = timerTime % 60;
        d.textContent = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
    }
}

// ========== CALENDAR ==========
window.initCalendar = () => {
    const today = new Date();
    document.getElementById('calToday').textContent = today.toDateString();
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
    ans.textContent = "...";
    sounds.launch();
    setTimeout(() => {
        ans.textContent = responses[Math.floor(Math.random() * responses.length)];
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
window.calcFunc = function(val) {
    const disp = document.getElementById('calcDisplay');
    if(!disp) return;
    if(val === 'C') { calcExpr = ''; disp.value = '0'; }
    else if(val === 'BSP') { calcExpr = calcExpr.slice(0, -1); disp.value = calcExpr || '0'; }
    else if(val === '=') { 
        try { disp.value = eval(calcExpr) || '0'; calcExpr = disp.value; } 
        catch { disp.value = 'ERR'; calcExpr = ''; }
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

window.initBook = function() {};
window.searchBook = async function() {
    const q = document.getElementById('bookSearch').value;
    const list = document.getElementById('bookList');
    if(q && list) {
        list.innerHTML = '<div style="padding:10px;text-align:center;">SEARCHING LIBRARY...</div>';
        sounds.click();
        try {
            const res = await fetch(`https://openlibrary.org/search.json?title=${encodeURIComponent(q)}&limit=15`);
            const data = await res.json();
            list.innerHTML = '';
            
            if(data.docs.length === 0) {
                list.innerHTML = '<div style="padding:10px;text-align:center;">NO BOOKS FOUND</div>';
                return;
            }

            data.docs.forEach(book => {
                const d = document.createElement('div');
                d.style.cssText = "padding: 8px; border-bottom: 1px dashed #444; margin-bottom: 2px; background: rgba(0,0,0,0.1);";
                const title = book.title.toUpperCase();
                const author = book.author_name ? book.author_name[0].toUpperCase() : 'UNKNOWN';
                const year = book.first_publish_year || '????';
                
                d.innerHTML = `
                    <div style="font-size: 8px; font-weight: bold; color: var(--gb-text); margin-bottom: 2px;">${title}</div>
                    <div style="font-size: 6px; color: #555;">BY ${author} (${year})</div>
                `;
                d.onclick = () => {
                    sounds.coin();
                    alert(`${title}\n\nOriginally published in ${year}.\nWritten by ${author}.`);
                };
                list.appendChild(d);
            });
            sounds.launch();
        } catch(e) { list.innerHTML = "LIBRARY CLOSED (ERROR)"; }
    }
};

window.initIp = function() {};
window.getIpInfo = async function() {
    const ip = document.getElementById('ipAddr');
    if(ip) {
        document.getElementById('ipAddr').textContent = "...";
        sounds.click();
        try {
            const res = await fetch('https://ipapi.co/json/');
            const data = await res.json();
            document.getElementById('ipAddr').textContent = data.ip;
            document.getElementById('ipCity').textContent = data.city;
            document.getElementById('ipIsp').textContent = data.org;
            sounds.coin();
        } catch(e) { document.getElementById('ipAddr').textContent = "ERROR"; }
    }
};

// ========== POKEDEX ==========
window.initPokedex = function() {};
window.searchPokemon = async function() {
    const q = document.getElementById('pokeSearch').value.toLowerCase().trim();
    if(!q) return;
    
    document.getElementById('pokeName').textContent = "SEARCHING...";
    document.getElementById('pokeType').textContent = "...";
    document.getElementById('pokeImg').style.display = 'none';
    document.getElementById('pokePlaceholder').style.display = 'block';
    
    sounds.click();
    
    try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${q}`);
        if(!res.ok) throw new Error("Not found");
        const data = await res.json();
        
        document.getElementById('pokeName').textContent = data.name.toUpperCase();
        const types = data.types.map(t => t.type.name.toUpperCase()).join('/');
        document.getElementById('pokeType').textContent = `TYPE: ${types}`;
        
        const img = document.getElementById('pokeImg');
        img.src = data.sprites.front_default || data.sprites.front_shiny;
        img.onload = () => {
             document.getElementById('pokePlaceholder').style.display = 'none';
             img.style.display = 'block';
             sounds.launch();
        };
        
        // Setup Battle
        const battleBtn = document.getElementById('pokeBattleBtn');
        if(battleBtn) {
            battleBtn.style.display = 'block';
            battleBtn.onclick = () => startPokeBattle(data);
        }
    } catch(e) {
        document.getElementById('pokeName').textContent = "MISSINGNO";
        document.getElementById('pokeType').textContent = "TYPE: GLITCH";
    }
};

let playerMon = null;
let enemyMon = null;

window.startPokeBattle = async function(p1) {
    playerMon = p1;
    const battleScreen = document.getElementById('pokeBattleScreen');
    if(battleScreen) {
        battleScreen.style.display = 'flex';
        document.getElementById('pokedexMain').style.display = 'none';
        
        // Fetch random enemy
        const id = Math.floor(Math.random() * 898) + 1;
        try {
            const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
            enemyMon = await res.json();
            
            document.getElementById('battleEnemyName').textContent = enemyMon.name.toUpperCase();
            document.getElementById('battleEnemyImg').src = enemyMon.sprites.front_default;
            document.getElementById('battlePlayerName').textContent = playerMon.name.toUpperCase();
            document.getElementById('battlePlayerImg').src = playerMon.sprites.back_default || playerMon.sprites.front_default;
            
            document.getElementById('battleLog').textContent = `A wild ${enemyMon.name.toUpperCase()} appeared!`;
        } catch(e) {
            cancelBattle();
        }
    }
};

window.pokeAttack = function() {
    const log = document.getElementById('battleLog');
    const pDmg = Math.floor(Math.random() * 20) + 10;
    const eDmg = Math.floor(Math.random() * 20) + 10;
    
    log.innerHTML = `${playerMon.name.toUpperCase()} used TACKLE!<br>Dealt ${pDmg} damage!`;
    sounds.launch();
    
    setTimeout(() => {
        log.innerHTML += `<br>${enemyMon.name.toUpperCase()} used SCRATCH!<br>Took ${eDmg} damage!`;
        sounds.click();
    }, 1000);
};

window.cancelBattle = function() {
    document.getElementById('pokeBattleScreen').style.display = 'none';
    document.getElementById('pokedexMain').style.display = 'block';
};

// ========== TRIVIA ==========
let triviaCorrectAnswer = "";
window.initTrivia = function() {};
window.getTrivia = async function() {
    const qEl = document.getElementById('triviaQuestion');
    const optEl = document.getElementById('triviaOptions');
    const catEl = document.getElementById('triviaCategory');
    const resEl = document.getElementById('triviaResult');
    
    qEl.textContent = "LOADING...";
    optEl.innerHTML = '';
    resEl.textContent = '';
    sounds.click();
    
    try {
        const res = await fetch('https://opentdb.com/api.php?amount=1&type=multiple');
        const data = await res.json();
        const q = data.results[0];
        
        catEl.textContent = q.category.toUpperCase();
        // Decode simple entities
        const decode = str => { const txt = document.createElement('textarea'); txt.innerHTML = str; return txt.value; };
        qEl.textContent = decode(q.question);
        triviaCorrectAnswer = q.correct_answer;
        
        const answers = [...q.incorrect_answers, q.correct_answer];
        answers.sort(() => Math.random() - 0.5);
        
        answers.forEach(ans => {
            const btn = document.createElement('button');
            btn.textContent = decode(ans);
            btn.style.cssText = "padding: 5px; font-size: 6px; text-align: left; width: 100%; margin-bottom: 2px;";
            btn.onclick = () => checkTrivia(ans);
            optEl.appendChild(btn);
        });
        sounds.coin();
    } catch(e) { qEl.textContent = "ERROR FETCHING QUESTION"; }
};

window.checkTrivia = function(ans) {
    const resEl = document.getElementById('triviaResult');
    if(ans === triviaCorrectAnswer) {
        resEl.textContent = "CORRECT! +5 GEMS";
        resEl.style.color = "#006400"; // Dark green
        sounds.launch();
        addGems(5);
    } else {
        resEl.textContent = "WRONG!";
        resEl.style.color = "#8b0000"; // Dark red
        sounds.click();
    }
    const btns = document.querySelectorAll('#triviaOptions button');
    btns.forEach(b => b.disabled = true);
};

// ========== ADVICE ==========
window.initAdvice = function() {};
window.getAdvice = async function() {
    const txt = document.getElementById('adviceText');
    txt.textContent = "...";
    sounds.click();
    try {
        const res = await fetch('https://api.adviceslip.com/advice');
        const data = await res.json();
        txt.textContent = data.slip.advice.toUpperCase();
        sounds.coin();
    } catch(e) { txt.textContent = "SILENCE IS GOLDEN (OFFLINE)"; }
};

// ========== SPACE ==========
window.initSpace = function() {};
window.getSpaceData = async function() {
    const txt = document.getElementById('spaceInfo');
    if(txt) {
         txt.textContent = "ESTABLISHING UPLINK...";
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
         } catch(e) { txt.textContent = "LINK FAILURE (OFFLINE)"; }
    }
};

// ========== ORACLE ==========
window.initOracle = function() {};
window.askOracle = async function() {
    const ans = document.getElementById('oracleAnswer');
    const gif = document.getElementById('oracleGif');
    
    if(ans) ans.textContent = "CONSULTING...";
    if(gif) gif.style.display = 'none';
    sounds.click();
    
    setTimeout(async () => {
        try {
            const res = await fetch('https://yesno.wtf/api');
            const data = await res.json();
            
            if(ans) {
                ans.textContent = data.answer.toUpperCase();
                ans.style.color = data.answer === 'yes' ? '#006400' : '#8b0000';
            }
            if(gif) {
                gif.src = data.image;
                gif.onload = () => { gif.style.display = 'block'; sounds.launch(); };
            }
        } catch(e) { 
            if(ans) ans.textContent = "THE VOID STARES BACK"; 
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
window.initWeather = function() {};
window.getWeather = async function() {
    const input = document.getElementById('weatherInput').value.split(',');
    const lat = input[0] || '48.8566';
    const lon = input[1] || '2.3522';
    const display = document.getElementById('weatherDisplay');
    
    display.textContent = "SCANNING SKIES...";
    sounds.click();
    
    try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const data = await res.json();
        
        display.textContent = `TEMP: ${data.current_weather.temperature}°C\nWIND: ${data.current_weather.windspeed} km/h\nCODE: ${data.current_weather.weathercode}`;
        sounds.coin();
    } catch(e) { display.textContent = "RADAR FAILURE"; }
};

// ========== DICT ==========
window.initDict = function() {};
window.getDefinition = async function() {
    const word = document.getElementById('dictInput').value.toLowerCase().trim();
    const display = document.getElementById('dictDisplay');
    if(!word) return;
    
    display.textContent = "LOOKING UP...";
    sounds.click();
    
    try {
        const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
        const data = await res.json();
        
        if(!Array.isArray(data)) throw new Error();
        
        const def = data[0].meanings[0].definitions[0].definition;
        display.innerHTML = `<strong>${word.toUpperCase()}</strong>:<br>${def.toUpperCase()}`;
        sounds.coin();
    } catch(e) { display.textContent = "UNKNOWN WORD"; }
};

// ========== QUOTE ==========
window.initQuote = function() {};
window.getQuote = async function() {
    const txt = document.getElementById('quoteText');
    const auth = document.getElementById('quoteAuthor');
    txt.textContent = "...";
    sounds.click();
    try {
        const res = await fetch('https://api.quotable.io/random?maxLength=50');
        const data = await res.json();
        txt.textContent = `"${data.content.toUpperCase()}"`;
        auth.textContent = `- ${data.author.toUpperCase()}`;
        sounds.coin();
    } catch(e) { txt.textContent = "OFFLINE WISDOM"; }
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
    
    display.textContent = "ANALYZING BIOMETRICS...";
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
    } catch(e) { display.textContent = "IDENTITY UNKNOWN"; }
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
    document.getElementById('tttStatus').textContent = "PLAYER (X) TURN";
    renderTTT();
};
window.renderTTT = function() {
    const board = document.getElementById('tttBoard');
    board.innerHTML = '';
    tttBoard.forEach((cell, i) => {
        const btn = document.createElement('button');
        btn.textContent = cell;
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
        document.getElementById('tttStatus').textContent = `${tttTurn} WINS!`;
        addGems(5);
        sounds.launch();
        tttActive = false;
    } else if(!tttBoard.includes('')) {
        document.getElementById('tttStatus').textContent = "DRAW!";
        tttActive = false;
    } else {
        // CPU
        tttTurn = 'O';
        document.getElementById('tttStatus').textContent = "CPU (O) TURN";
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
             document.getElementById('tttStatus').textContent = "CPU WINS!";
             tttActive = false;
        } else if(!tttBoard.includes('')) {
             document.getElementById('tttStatus').textContent = "DRAW!";
             tttActive = false;
        } else {
            tttTurn = 'X';
            document.getElementById('tttStatus').textContent = "PLAYER (X) TURN";
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
    
    resEl.textContent = `${icons[move]} vs ${icons[cpu]}`;
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
    
    if(scoreEl) scoreEl.textContent = `W: ${state.rpsWins || 0} | L: ${state.rpsLosses || 0}`;
};

// ========== COIN ==========
window.initCoin = function() {};
window.flipCoin = function() {
    const icon = document.getElementById('coinIcon');
    const res = document.getElementById('coinResult');
    
    icon.style.transform = "rotateY(720deg)";
    res.textContent = "...";
    sounds.launch(); // WHOOSH
    
    setTimeout(() => {
        const heads = Math.random() > 0.5;
        icon.style.transform = "rotateY(0deg)";
        icon.textContent = heads ? '🪙' : '⚪';
        res.textContent = heads ? 'HEADS' : 'TAILS';
        sounds.coin();
    }, 500);
};

// ========== REACTION ==========
let reactionStart = 0;
let reactionTimer = null;
window.initReaction = function() {
    document.getElementById('reactionBox').style.background = '#333';
    document.getElementById('reactionBox').textContent = "TAP START";
};
window.startReaction = function() {
    const box = document.getElementById('reactionBox');
    box.style.background = '#8b0000'; // Red
    box.textContent = "WAIT FOR GREEN...";
    reactionStart = 0;
    clearTimeout(reactionTimer);
    
    const delay = 1000 + Math.random() * 3000;
    reactionTimer = setTimeout(() => {
        box.style.background = '#006400'; // Green
        box.textContent = "TAP NOW!";
        reactionStart = Date.now();
        sounds.coin(); // Signal
    }, delay);
};
window.reactionClick = function() {
    const box = document.getElementById('reactionBox');
    if(reactionStart === 0 && box.textContent === "WAIT FOR GREEN...") {
        clearTimeout(reactionTimer);
        box.style.background = '#333';
        box.textContent = "TOO EARLY!";
        if(typeof sounds !== 'undefined' && sounds.error) sounds.error(); else sounds.click();
        return;
    }
    if(reactionStart > 0) {
        const time = Date.now() - reactionStart;
        box.style.background = '#333';
        box.textContent = `${time} ms`;
        state.bestReaction = Math.min(state.bestReaction || 9999, time);
        document.getElementById('reactionTime').textContent = `BEST: ${state.bestReaction} ms`;
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
    if(big) big.textContent = timeStr;
    
    const sbt = document.getElementById('statusBarTime');
    if(sbt) sbt.textContent = `${hours}:${mins}`; 
}

// ========== COMPASS ==========
window.initCompass = function() {
    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', handleOrientation);
    } else {
        const deg = document.getElementById('compassDeg');
        if(deg) deg.textContent = "NOT SUPPORTED";
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
        degEl.textContent = `${Math.round(alpha)}° ${dir}`;
    }
}

// ========== STOPWATCH ==========
let swTime = 0;
let swInterval = null;
let swRunning = false;
window.initStopwatch = function() {
    updateStopwatchDisplay();
};
window.toggleStopwatch = function() {
    const btn = document.getElementById('swBtn');
    if(swRunning) {
        clearInterval(swInterval);
        swRunning = false;
        btn.textContent = "START";
    } else {
        const start = Date.now() - swTime;
        swInterval = setInterval(() => {
            swTime = Date.now() - start;
            updateStopwatchDisplay();
        }, 30);
        swRunning = true;
        btn.textContent = "STOP";
    }
    sounds.click();
};
window.resetStopwatch = function() {
    clearInterval(swInterval);
    swRunning = false;
    swTime = 0;
    updateStopwatchDisplay();
    document.getElementById('swBtn').textContent = "START";
    sounds.back();
};
function updateStopwatchDisplay() {
    const el = document.getElementById('swDisplay');
    if(!el) return;
    const ms = Math.floor((swTime % 1000) / 10);
    const s = Math.floor((swTime / 1000) % 60);
    const m = Math.floor((swTime / 60000) % 60);
    el.textContent = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}.${ms.toString().padStart(2,'0')}`;
}

// ========== TIMER ==========
let tmTime = 0;
let tmInterval = null;
window.initTimer = function() {
    updateTimerDisplay();
};
window.setTimer = function(m) {
    if(tmInterval) return;
    tmTime += m * 60;
    updateTimerDisplay();
    sounds.click();
};
window.startTimer = function() {
    if(tmInterval) {
        clearInterval(tmInterval);
        tmInterval = null;
        document.getElementById('tmBtn').textContent = "RESUME";
        return;
    }
    if(tmTime <= 0) return;
    
    document.getElementById('tmBtn').textContent = "PAUSE";
    tmInterval = setInterval(() => {
        tmTime--;
        updateTimerDisplay();
        if(tmTime <= 0) {
            clearInterval(tmInterval);
            tmInterval = null;
            document.getElementById('tmBtn').textContent = "START";
            sounds.launch();
            alert("TIME UP!");
        }
    }, 1000);
    sounds.coin();
};
window.resetTimer = function() {
    clearInterval(tmInterval);
    tmInterval = null;
    tmTime = 0;
    updateTimerDisplay();
    document.getElementById('tmBtn').textContent = "START";
    sounds.back();
};
function updateTimerDisplay() {
    const el = document.getElementById('tmDisplay');
    if(!el) return;
    const m = Math.floor(tmTime / 60);
    const s = tmTime % 60;
    el.textContent = `${pad(m)}:${pad(s)}`;
}

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
    if(el) el.textContent = countVal;
}

// ========== PIXEL ART ==========
let pixelColor = '#000';

window.setPixelColor = function(c) {
    pixelColor = c;
    sounds.click();
};

// ========== CAT FACTS ==========
window.initCatfact = function() {};
window.getCatFact = async function() {
    const txt = document.getElementById('catfactText');
    txt.textContent = "Fetching feline wisdom...";
    sounds.click();
    try {
        const res = await fetch('https://catfact.ninja/fact');
        const data = await res.json();
        txt.textContent = data.fact.toUpperCase();
        sounds.coin();
    } catch(e) { txt.textContent = "CATS ARE OFFLINE (ERROR)"; }
};

// ========== CHUCK NORRIS ==========
window.initChuck = function() {};
window.getChuckJoke = async function() {
    const txt = document.getElementById('chuckJoke');
    txt.textContent = "Loading Chuck...";
    sounds.click();
    try {
        const res = await fetch('https://api.chucknorris.io/jokes/random');
        const data = await res.json();
        txt.textContent = data.value.toUpperCase();
        sounds.coin();
    } catch(e) { txt.textContent = "CHUCK IS TOO POWERFUL (OFFLINE)"; }
};

// ========== ANIME QUOTES ==========
window.initAnime = function() {};
window.getAnimeQuote = async function() {
    const quote = document.getElementById('animeQuote');
    const char = document.getElementById('animeChar');
    quote.textContent = '"..."';
    sounds.click();
    try {
        const res = await fetch('https://animechan.xyz/api/random');
        const data = await res.json();
        quote.textContent = `"${data.quote.toUpperCase()}"`;
        char.textContent = `- ${data.character.toUpperCase()} (${data.anime.toUpperCase()})`;
        sounds.coin();
    } catch(e) { 
        quote.textContent = '"BELIEVE IN YOURSELF"';
        char.textContent = '- NARUTO';
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
    title.textContent = 'GENERATING...';
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
        title.textContent = data.title ? data.title.toUpperCase().substring(0, 50) : 'MEME';
    } catch(e) { 
        title.textContent = 'MEME MACHINE BROKE';
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
    titleEl.textContent = 'LOADING COSMOS...';
    descEl.textContent = '';
    sounds.click();
    
    try {
        // Using demo key - should work but may hit rate limit
        const res = await fetch('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY');
        const data = await res.json();
        
        titleEl.textContent = data.title ? data.title.toUpperCase() : 'NASA APOD';
        descEl.textContent = data.explanation ? data.explanation.toUpperCase().substring(0, 200) + '...' : '';
        
        if(img && data.url && data.media_type === 'image') {
            img.src = data.url;
            img.onload = () => {
                if(ph) ph.style.display = 'none';
                img.style.display = 'block';
                sounds.coin();
            };
        } else {
            if(ph) ph.textContent = '📹';
            sounds.coin();
        }
    } catch(e) { 
        titleEl.textContent = 'TRANSMISSION LOST';
        descEl.textContent = 'Unable to reach NASA servers';
    }
};

// ========== KANYE QUOTES ==========
window.initKanye = function() {};
window.getKanyeQuote = async function() {
    const txt = document.getElementById('kanyeQuote');
    txt.textContent = '"..."';
    sounds.click();
    try {
        const res = await fetch('https://api.kanye.rest/');
        const data = await res.json();
        txt.textContent = `"${data.quote.toUpperCase()}"`;
        sounds.coin();
    } catch(e) { txt.textContent = '"I AM A GOD" - KANYE'; }
};

// ========== BORED API ==========
window.initBored = function() {};
window.getBoredActivity = async function() {
    const activity = document.getElementById('boredActivity');
    const type = document.getElementById('boredType');
    activity.textContent = 'THINKING...';
    type.textContent = '';
    sounds.click();
    try {
        const res = await fetch(`https://www.boredapi.com/api/activity?_=${Date.now()}`);
        const data = await res.json();
        activity.textContent = data.activity.toUpperCase();
        type.textContent = `TYPE: ${data.type.toUpperCase()} | PARTICIPANTS: ${data.participants}`;
        sounds.coin();
    } catch(e) { 
        activity.textContent = 'TRY COUNTING TO INFINITY';
        type.textContent = 'TYPE: IMPOSSIBLE';
    }
};



// ========== ZEN QUOTES ==========
window.initZen = function() {};
window.getZen = async function() {
    const txt = document.getElementById('zenText');
    txt.textContent = '"..."';
    sounds.click();
    try {
        const res = await fetch('https://api.github.com/zen');
        const data = await res.text();
        txt.textContent = `"${data.toUpperCase()}"`;
        sounds.coin();
    } catch(e) { txt.textContent = '"DESIGN FOR FAILURE"'; }
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
    nameEl.textContent = 'MIXING...';
    ingredientsEl.textContent = '';
    sounds.click();
    
    try {
        const res = await fetch('https://www.thecocktaildb.com/api/json/v1/1/random.php');
        const data = await res.json();
        const drink = data.drinks[0];
        
        nameEl.textContent = drink.strDrink.toUpperCase();
        
        // Get ingredients
        const ingredients = [];
        for(let i = 1; i <= 15; i++) {
            const ingredient = drink[`strIngredient${i}`];
            const measure = drink[`strMeasure${i}`];
            if(ingredient) {
                ingredients.push(`${measure ? measure + ' ' : ''}${ingredient}`.toUpperCase());
            }
        }
        ingredientsEl.textContent = ingredients.join(', ');
        
        if(img && drink.strDrinkThumb) {
            img.src = drink.strDrinkThumb;
            img.onload = () => {
                if(ph) ph.style.display = 'none';
                img.style.display = 'block';
                sounds.coin();
            };
        }
    } catch(e) { 
        nameEl.textContent = 'WATER';
        ingredientsEl.textContent = 'H2O';
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

// ========== MUSIC PLAYER (Jamendo API) ==========
let musicTracks = [];
let musicIdx = 0;

window.initMusic = function() {
    document.getElementById('musicStatus').textContent = 'CHOOSE A TRACK';
};

window.searchMusic = async function() {
    const q = document.getElementById('musicSearch').value;
    const status = document.getElementById('musicStatus');
    if(!q) return;
    
    status.textContent = 'CONNECTING...';
    sounds.click();
    
    try {
        const res = await fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=56d30c95&format=json&limit=10&search=${encodeURIComponent(q)}`);
        const data = await res.json();
        
        if(data.results && data.results.length > 0) {
            musicTracks = data.results;
            musicIdx = 0;
            playTrack();
        } else {
            status.textContent = 'NO VIBES FOUND';
        }
    } catch(e) {
        status.textContent = 'SATELLITE OFFLINE';
    }
}

function playTrack() {
    if(musicTracks.length === 0) return;
    const track = musicTracks[musicIdx];
    const player = document.getElementById('musicAudio');
    const status = document.getElementById('musicStatus');
    
    if(player && track.audio) {
        player.src = track.audio;
        player.play();
        status.textContent = `NOW PLAYING: ${track.name.toUpperCase()}`;
        
        // Background Audio Support
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: track.name.toUpperCase(),
                artist: track.artist_name.toUpperCase(),
                album: 'GameBoy OS - Music',
                artwork: [{ src: track.image, sizes: '300x300', type: 'image/jpeg' }]
            });
            navigator.mediaSession.setActionHandler('play', () => player.play());
            navigator.mediaSession.setActionHandler('pause', () => player.pause());
            navigator.mediaSession.setActionHandler('nexttrack', () => window.nextMusicTrack());
            navigator.mediaSession.setActionHandler('previoustrack', () => window.prevMusicTrack());
        }
        
        sounds.launch();
    }
}

window.nextMusicTrack = function() {
    if(musicTracks.length === 0) return;
    musicIdx = (musicIdx + 1) % musicTracks.length;
    playTrack();
};

window.prevMusicTrack = function() {
    if(musicTracks.length === 0) return;
    musicIdx = (musicIdx - 1 + musicTracks.length) % musicTracks.length;
    playTrack();
};

window.stopMusic = function() {
    const audio = document.getElementById('musicAudio');
    if(audio) audio.pause();
    document.getElementById('musicStatus').textContent = 'STOPPED';
};

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

    if (modeDisplay) modeDisplay.textContent = currentFacingMode === 'user' ? 'FRONT' : 'BACK';

    preview.style.display = 'none';
    video.style.display = 'block';
    captureBtn.style.display = 'block';
    if(recordBtn) { 
        recordBtn.style.display = 'block';
        recordBtn.textContent = 'REC';
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

function startCameraLoop() {
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    if(!video || !canvas) return;
    const ctx = canvas.getContext('2d');
    
    function loop() {
        if(video.paused || video.ended) return;
        
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 240;
        
        // Apply baked filters
        ctx.filter = video.style.filter || 'grayscale(100%)';
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Bake Overlays
        ctx.filter = 'none';
        if (document.getElementById('crtOverlay')?.style.display === 'block') {
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            for (let i = 0; i < canvas.height; i += 4) ctx.fillRect(0, i, canvas.width, 2);
        }
        
        canvasLoopReq = requestAnimationFrame(loop);
    }
    loop();
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

window.setCameraFilter = function(filter) {
    const video = document.getElementById('cameraVideo');
    const preview = document.getElementById('selfiePreview');
    const overlays = {
        crt: document.getElementById('crtOverlay'),
        matrix: document.getElementById('matrixOverlay'),
        ntsc: document.getElementById('ntscOverlay')
    };
    
    Object.values(overlays).forEach(o => { if(o) o.style.display = 'none'; });
    
    let filterString = '';
    switch(filter) {
        case 'classic': filterString = 'brightness(120%) contrast(120%) grayscale(100%) sepia(50%) hue-rotate(60deg)'; break;
        case 'contrast': filterString = 'brightness(110%) contrast(250%) grayscale(100%)'; break;
        case 'reverse': filterString = 'invert(100%) grayscale(100%)'; break;
        case 'dots': filterString = 'brightness(110%) contrast(150%) grayscale(100%) blur(0.5px)'; break;
        case 'vhs': filterString = 'brightness(130%) contrast(85%) sepia(20%) saturate(60%) blur(0.4px)'; break;
        case 'bad90s': filterString = 'brightness(140%) contrast(150%) saturate(200%) hue-rotate(-10deg)'; break;
        case 'glitch': filterString = 'invert(10%) hue-rotate(90deg) contrast(200%) brightness(120%)'; break;
        case 'matrix': 
            filterString = 'brightness(120%) contrast(150%) grayscale(100%) sepia(100%) hue-rotate(80deg) saturate(500%)';
            if(overlays.matrix) { overlays.matrix.style.display = 'block'; initMatrixRain(); }
            break;
        case 'night': filterString = 'brightness(150%) contrast(120%) sepia(100%) hue-rotate(100deg) saturate(200%)'; break;
        case 'crt': 
            filterString = 'brightness(110%) contrast(130%) grayscale(50%) saturate(150%)'; 
            if(overlays.crt) overlays.crt.style.display = 'block';
            break;
        default: filterString = 'grayscale(100%)';
    }
    
    if(video) video.style.filter = filterString;
    if(preview) preview.style.filter = filterString;
    sounds.click();
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
// ##take selfie
window.takeSelfie = function() {
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('cameraCanvas');
    const preview = document.getElementById('selfiePreview');
    const flash = document.getElementById('cameraFlash');
    
    // Use the loop-rendered canvas for the capture
    flash.style.opacity = '1';
    setTimeout(() => flash.style.opacity = '0', 100);
    
    sounds.coin();
    
    // Bake current filter to dataUrl
    const dataUrl = canvas.toDataURL('image/png');
    preview.src = dataUrl;
    
    video.style.display = 'none';
    preview.style.display = 'block';
    
    document.getElementById('captureBtn').style.display = 'none';
    if(document.getElementById('recordBtn')) document.getElementById('recordBtn').style.display = 'none';
    document.getElementById('saveSelfieBtn').style.display = 'block';
    document.getElementById('retakeBtn').style.display = 'block';
};

window.saveSelfie = function() {
    const preview = document.getElementById('selfiePreview');
    const link = document.createElement('a');
    link.download = `gb-cam-${Date.now()}.png`;
    link.href = preview.src;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    sounds.launch();
    alert("SAVED!");
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

async function startRecording() {
    const canvas = document.getElementById('cameraCanvas');
    const status = document.getElementById('videoStatus');
    const btn = document.getElementById('recordBtn');
    
    recordedChunks = [];
    
    // CAPTURE FROM CANVAS (This ensures filters and overlays stick!)
    const stream = canvas.captureStream(30); 
    
    let options = { mimeType: 'video/webm;codecs=vp8' };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/mp4' }; // iOS Fallback
    }

    try {
        mediaRecorder = new MediaRecorder(stream, options);
        mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.push(e.data); };
        mediaRecorder.onstop = saveVideo;
        mediaRecorder.start();
        
        isRecording = true;
        if(status) status.style.display = 'block';
        if(btn) { btn.textContent = 'STOP'; btn.style.background = '#f00'; }
        sounds.launch();
    } catch(e) {
        alert("VIDEO RECORDING NOT SUPPORTED");
    }
}

function stopRecording() {
    if (mediaRecorder) mediaRecorder.stop();
    isRecording = false;
    const status = document.getElementById('videoStatus');
    const btn = document.getElementById('recordBtn');
    if(status) status.style.display = 'none';
    if(btn) { btn.textContent = 'REC'; btn.style.background = '#333'; }
    sounds.back();
}

function saveVideo() {
    const blob = new Blob(recordedChunks, { type: recordedChunks[0].type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gb-vid-${Date.now()}.${blob.type.includes('mp4') ? 'mp4' : 'webm'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    alert("VIDEO SAVED!");
}


// ========== BITCHAT (Link Cable Chat) ==========
let peer = null;
let conn = null;
let scanInterval = null;

window.initChat = function() {
    if(peer) return;
    
    updateSignalBars(1); // One bar for starting
    const idEl = document.getElementById('chatMyId');
    if(idEl) idEl.textContent = "SIGNALING TOWER...";
    
    // Config with Global TURN servers for "Bridge" connectivity
    peer = new Peer({
        config: {
            'iceServers': [
                { url: 'stun:stun.l.google.com:19302' },
                { url: 'stun:stun1.l.google.com:19302' },
            ]
        }
    }); 
    
    peer.on('open', (id) => {
        if(idEl) idEl.textContent = `MY FREQ: ${id}`;
        document.getElementById('chatStatusLabel').textContent = "ONLINE";
        updateSignalBars(3); // Connected to server
        console.log("PeerJS Tower Open:", id);
    });

    peer.on('connection', (connection) => {
        conn = connection;
        setupChatConnection();
    });
    
    peer.on('error', (err) => {
        updateSignalBars(0);
        document.getElementById('chatStatusLabel').textContent = "ERROR";
        console.error("PeerJS Error:", err);
    });
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
    sounds.click();
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
    
    if(!peer || !peer.id) {
        alert("CONNECTING TO TOWER... PLEASE WAIT.");
        return;
    }

    new QRCode(qrEl, {
        text: peer.id,
        width: 128,
        height: 128,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    });
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
    const ctx = canvas.getContext('2d');
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        video.srcObject = stream;
        
        scanInterval = setInterval(() => {
            if(video.readyState === video.HAVE_ENOUGH_DATA) {
                canvas.height = video.videoHeight;
                canvas.width = video.videoWidth;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(imageData.data, imageData.width, imageData.height);
                
                if(code) {
                    clearInterval(scanInterval);
                    video.srcObject.getTracks().forEach(t => t.stop());
                    connectToPeer(code.data);
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
    if(!peer) return;
    appendChat('SYSTEM', 'TUNING TO FREQUENCY...');
    conn = peer.connect(id);
    setupChatConnection();
}

function setupChatConnection() {
    if(!conn) return;
    
    conn.on('open', () => {
        showChatStartAnim();
        updateSignalBars(4);
        document.getElementById('chatConnect').style.display = 'none';
        document.getElementById('chatMain').style.display = 'flex';
        document.getElementById('chatStatusLabel').textContent = "LINK STABLE";
        appendChat('SYSTEM', 'ENCRYPTED LINK ESTABLISHED.');
        sounds.coin();
    });
    
    conn.on('data', (data) => {
        if(data.type === 'msg') {
            appendChat('PEER', data.content);
            sounds.click();
        } else if(data.type === 'buzz') {
            handleChatBuzz();
        }
    });
    
    conn.on('close', () => {
        updateSignalBars(3);
        document.getElementById('chatStatusLabel').textContent = "ONLINE";
        alert("LINK DISCONNECTED.");
        cancelChatLink();
    });
}

function showChatStartAnim() {
    const anim = document.getElementById('linkStartAnim');
    if(anim) {
        anim.style.display = 'block';
        setTimeout(() => anim.style.display = 'none', 2000);
    }
}

window.sendChatMessage = function() {
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if(!msg || !conn) return;
    
    conn.send({ type: 'msg', content: msg });
    appendChat('ME', msg);
    input.value = '';
    sounds.click();
};

window.sendChatBuzz = function() {
    if(!conn) return;
    conn.send({ type: 'buzz' });
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
    const msg = document.createElement('div');
    msg.style.marginBottom = '5px';
    const color = who === 'ME' ? '#cfc' : (who === 'PEER' ? '#0f0' : '#ffa');
    msg.innerHTML = `<span style="color:${color}; font-weight:bold;">${who}:</span> ${text.toUpperCase()}`;
    log.appendChild(msg);
    log.scrollTop = log.scrollHeight;
}

window.cancelChatLink = function() {
    if(conn) conn.close();
    conn = null;
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

    sprite.textContent = emoji;
    status.textContent = `(${mood})`;
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

// ========== GB WIKI (Encyclopedia) ==========
window.searchWiki = async function() {
    const query = document.getElementById('wikiSearch').value;
    const status = document.getElementById('wikiStatus');
    const result = document.getElementById('wikiResult');
    const title = document.getElementById('wikiTitle');
    const summary = document.getElementById('wikiSummary');
    
    if(!query) return;
    
    status.style.display = 'block';
    status.textContent = 'FETCHING KNOWLEDGE...';
    result.style.display = 'none';
    sounds.launch();

    try {
        // Fetch article summary from Wikipedia API
        const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query.replace(/ /g, '_'))}`);
        
        if(!response.ok) {
            if(response.status === 404) throw new Error("TOPIC NOT FOUND");
            else throw new Error("CONNECTION ERROR");
        }

        const data = await response.json();
        
        status.style.display = 'none';
        result.style.display = 'block';
        title.textContent = data.title.toUpperCase();
        summary.textContent = data.extract;
        
        sounds.coin();
    } catch (err) {
        status.textContent = `!! ${err.message.toUpperCase()} !!`;
        sounds.back();
    }
};

// Add enter listener to wiki search input
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
            status.textContent = "INVALID FORMAT. USE .GB .GBC .NES";
            status.style.color = "#a00";
            sounds.back();
            if(zone) zone.style.opacity = "1";
        }
    }, 1500);
};
