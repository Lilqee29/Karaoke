// ========== MAIN APP LOADER (v3.0 - STREAMLINED) ==========

const apps = [
    // ── CORE GAMES ────────────────────────────────────────────────────────
    { id: 'karaoke', name: 'KARAOKE', icon: '🎤' },
    { id: 'snake', name: 'SNAKE', icon: '🐍' },
    { id: 'flappy', name: 'FLAPPY', icon: '🐦' },
    { id: 'breakout', name: 'BREAKOUT', icon: '🧱' },
    { id: 'tetris', name: 'TETRIS', icon: '🧱' },
    { id: 'memory', name: 'MEMORY', icon: '🃏' },
    { id: 'ttt', name: 'TTT', icon: '❌' },
    { id: 'rps', name: 'R-P-S', icon: '✂️' },
    { id: 'mines', name: 'MINES', icon: '💣' },
    { id: '2048', name: '2048', icon: '🔢' },

    // ── PRODUCTIVITY ──────────────────────────────────────────────────────
    { id: 'todo', name: 'TO-DO', icon: '📝' },
    { id: 'notes', name: 'NOTES', icon: '📒' },
    { id: 'calc', name: 'CALC', icon: '🔢' },
    { id: 'timer', name: 'TIMER', icon: '⏲️' },
    { id: 'pomo', name: 'POMO', icon: '🍅' },
    { id: 'habit', name: 'HABIT', icon: '✅' },
    { id: 'workout', name: 'WORKOUT', icon: '💪' },
    { id: 'study', name: 'STUDY', icon: '🎓' },
    { id: 'budget', name: 'BUDGET', icon: '💰' },

    // ── CREATIVE ──────────────────────────────────────────────────────────
    { id: 'paint', name: 'PAINT', icon: '🎨' },
    { id: 'pixel', name: 'PIXEL', icon: '🖌️' },
    { id: 'remix', name: 'BEATS', icon: '🎹' },
    { id: 'groove', name: 'GROOVE', icon: '🥁' },
    { id: 'music', name: 'MUSIC', icon: '🎵' },
    { id: 'radio', name: 'WAVE', icon: '📻' },
    { id: 'glitch', name: 'GLITCH', icon: '✦' },
    { id: 'visual', name: 'VISUAL', icon: '≋' },
    { id: 'noise', name: 'NOISE', icon: '♯' },
    { id: 'maze', name: 'MAZE', icon: '⚔' },
    { id: 'gravity', name: 'GRAVITY', icon: '🪐' },
    { id: 'orbit', name: 'ORBIT', icon: '🌍' },
    { id: 'sand', name: 'SAND', icon: '🏖' },
    { id: 'fluid', name: 'FLUID', icon: '🌊' },
    { id: 'platform', name: 'QUEST', icon: '⚔' },

    // ── INFORMATION & LEARNING ────────────────────────────────────────────
    { id: 'news', name: 'NEWS', icon: '📰' },
    { id: 'weather', name: 'WEATH', icon: '☀️' },
    { id: 'dict', name: 'WORD', icon: '📖' },
    { id: 'quran', name: 'QURAN', icon: '☪️' },
    { id: 'translate', name: 'TRANS', icon: '🌐' },
    { id: 'wiki', name: 'WIKI', icon: '🌐' },
    { id: 'book', name: 'BOOKS', icon: '📚' },
    { id: 'trivia', name: 'TRIVIA', icon: '❓' },
    { id: 'pokedex', name: 'DEX', icon: '🔴' },
    { id: 'nasa', name: 'COSMOS', icon: '🌌' },
    { id: 'elem', name: 'CHEM', icon: '⚛️' },

    // ── FUN & ENTERTAINMENT ───────────────────────────────────────────────
    { id: 'vibes', name: 'VIBES', icon: '✨' },
    { id: 'cocktail', name: 'DRINK', icon: '🍸' },

    // ── MINI GAMES ────────────────────────────────────────────────────────
    { id: 'guess', name: 'GUESS', icon: '🔢' },
    { id: 'reaction', name: 'FAST', icon: '⚡' },
    { id: 'coin', name: 'FLIP', icon: '🪙' },
    { id: 'dice', name: 'DICE', icon: '🎲' },

    // ── UTILITY TOOLS ─────────────────────────────────────────────────────
    { id: 'daily', name: 'DAILY', icon: '📅' },
    { id: 'health', name: 'HEALTH', icon: '⚖️' },
    { id: 'navigator', name: 'NAV', icon: '🗺️' },
    { id: 'qr', name: 'QR', icon: '📱' },
    { id: 'alerts', name: 'ALARM', icon: '⏰' },
    { id: 'pass', name: 'PASS', icon: '🔑' },
    { id: 'regex', name: 'REGEX', icon: '🔠' },
    { id: 'ascii', name: 'ART', icon: '🖼️' },

    // ── WELLNESS ──────────────────────────────────────────────────────────
    { id: 'breathe', name: 'CALM', icon: '🌬️' },
    { id: 'water', name: 'H2O', icon: '💧' },

    // ── ADVANCED / TECH ───────────────────────────────────────────────────
    { id: 'stock', name: 'STOCK', icon: '📈' },
    { id: 'ip', name: 'NET', icon: '🌐' },
    { id: 'camera', name: 'CAM', icon: '📷' },
    { id: 'currency', name: 'EXCH', icon: '💱' },
    { id: 'sos', name: 'S.O.S', icon: '🆘' },
    { id: 'term', name: 'TERM', icon: '💻' },
    { id: 'morse', name: 'MORSE', icon: '📡' },

    // ── SPECIAL / UNIQUE ──────────────────────────────────────────────────
    { id: 'map', name: 'MAPS', icon: '🗺️' },
    { id: 'bored', name: 'BORED', icon: '💡' },
    { id: 'idle', name: 'IDLE', icon: '⛏️' },
    { id: 'chat', name: 'BITCHAT', icon: '📡' },

    // ── P2P MULTIPLAYER GAMES ─────────────────────────────────────────────
    { id: 'chess', name: 'TACTIC', icon: '♟️' },
    { id: 'duel', name: 'DUEL', icon: '🚀' },
    { id: 'void', name: 'MYSTERY', icon: '🔍' },
    { id: 'troll', name: 'TROLL', icon: '👺' },
    { id: 'kart', name: 'KART RACING', icon: '🏎️' },

    // ── PUZZLE ────────────────────────────────────────────────────────────
    { id: 'adventure', name: 'PHYSICS', icon: '🧩' },

    // ── SYSTEM ────────────────────────────────────────────────────────────
    { id: 'help', name: 'HELP', icon: '❓' },
    { id: 'credits', name: 'INFO', icon: 'ℹ️' },
    { id: 'settings', name: 'SETUP', icon: '⚙️' }
];

let currentScreen = 'home';
let selectedIndex = 0;
let displayedApps = apps; // Track currently visible apps

// Initialize
window.addEventListener('load', () => {
    // Force full brightness if not set
    if (!state.brightness) state.brightness = 1.0;
    applyTranslations();
    setTheme(state.theme);
    setBrightness(state.brightness);
    if(!state.crtEnabled) {
        const sl = document.querySelector('.scanline');
        if(sl) sl.style.display = 'none';
    }
    initHomeScreen();
    saveState();
    if(typeof karaoke !== 'undefined') karaoke.init();
    window.initWater();
    
    // Boot Sequence
    setTimeout(() => {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        playSound(400, 'square', 0.1);
        setTimeout(() => playSound(800, 'square', 0.3), 100);
        
        // Start system clock immediately for status bar and app
        if(typeof initClock === 'function') initClock();

        setTimeout(() => {
            const boot = document.getElementById('bootScreen');
            if(boot) {
                boot.style.opacity = '0';
                boot.style.transition = 'opacity 0.5s';
                setTimeout(() => boot.remove(), 500);
            }
        }, 2200);
    }, 500);
});

// GLOBAL AUDIO UNLOCK FOR MOBILE
document.addEventListener('touchstart', function() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}, { once: true });
// apply
//gone
function applyTranslations() {
    const t = translations[state.lang] || translations.en;
    const titleEl = document.getElementById('screenTitle');
    if(titleEl) titleEl.innerHTML = (currentScreen === 'home') ? t.title.replace(' ', '<br>') : currentScreen.toUpperCase();
    
    document.querySelectorAll('[data-lang]').forEach(el => {
        const key = el.dataset.lang;
        if(t[key]) el.textContent = t[key];
    });
}

function getAppTranslation(app, t) {
    const keys = {
        'todo': 'todo', 'music': 'music', 'pet': 'pet', 'riddle': 'riddle',
        'weather': 'weather', 'settings': 'settings'
    };
    const key = keys[app.id];
    return (key && t[key]) ? t[key] : app.name;
}

function initHomeScreen() {
    renderApps(apps);
}

function renderApps(list) {
    displayedApps = list;
    const grid = document.getElementById('appGrid');
    if(!grid) return;
    grid.innerHTML = '';
    const t = translations[state.lang] || translations.en;
    
    list.forEach((app, index) => {
        const item = document.createElement('div');
        item.className = 'app-icon' + (index === selectedIndex ? ' selected' : '');
        const displayName = getAppTranslation(app, t);
        item.innerHTML = `<div class="app-emoji">${app.icon}</div><div class="app-name">${displayName.toUpperCase()}</div>`;
        item.onclick = () => {
            selectedIndex = index;
            updateMenuSelection();
            launchApp(app.id);
        };
        grid.appendChild(item);
    });
    
    if (selectedIndex >= list.length) selectedIndex = 0;
    updateMenuSelection();
}

function filterApps() {
    const query = document.getElementById('homeSearch').value.toLowerCase();
    const t = translations[state.lang] || translations.en;
    const filtered = apps.filter(app => {
        const name = getAppTranslation(app, t).toLowerCase();
        return name.includes(query);
    });
    selectedIndex = 0;
    renderApps(filtered);
}

function updateMenuSelection() {
    const items = document.querySelectorAll('.app-icon');
    if(items.length === 0) return;
    
    // Ensure index is valid
    if(selectedIndex < 0) selectedIndex = 0;
    if(selectedIndex >= items.length) selectedIndex = items.length - 1;

    items.forEach((item, i) => {
        if (i === selectedIndex) {
            item.classList.add('selected');
            item.scrollIntoView({ behavior: 'auto', block: 'nearest' });
            
            // Update status bar icon
            const app = displayedApps[i];
            if(app) document.getElementById('appIcon').textContent = app.icon;
        } else {
            item.classList.remove('selected');
        }
    });
    sounds.click();
}

function launchApp(appId) {
    sounds.launch();

    // FIX: show the screen FIRST, then init — so the DOM is visible when
    // init functions query elements and attach click handlers
    document.querySelectorAll('.game-screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(appId + 'Screen');
    if(screen) screen.classList.add('active');

    currentScreen = appId;
    if(window.trackQuest) trackQuest('any', 1);
    
    const t = translations[state.lang] || translations.en;
    let title = appId.toUpperCase();
    if(appId === 'settings' && t.settings) title = t.settings;
    
    const titleEl = document.getElementById('screenTitle');
    if(titleEl) titleEl.textContent = title;
    
    // Dynamic Init
    if (appId === 'karaoke') {
        if(typeof karaoke !== 'undefined' && karaoke.init) karaoke.init(); 
    } else if (appId === 'todo') {
        if(typeof renderTodos === 'function') renderTodos();
    } else if (appId === 'notes') {
        const np = document.getElementById('notepadText');
        if(np) { np.value = state.notes || ''; np.oninput = saveNotes; }
    } else {
        // Generic initX pattern
        const fnName = 'init' + appId.charAt(0).toUpperCase() + appId.slice(1);
        if (typeof window[fnName] === 'function') {
            window[fnName]();
        } else {
            console.warn(`No init function found for ${appId} (${fnName})`);
        }
    }
}

function goBack() {
    if (currentScreen !== 'home') {
        sounds.back();
        
        // Clear all intervals using interval manager
        if (typeof intervalManager !== 'undefined') {
            intervalManager.clearAll();
        }
        
        // Legacy manual cleanup for safety
        if (typeof clockInterval !== 'undefined') clearInterval(clockInterval);
        
        // Fix: Use correct variable names from games.js
        if (typeof snakeGame !== 'undefined' && snakeGame) { clearInterval(snakeGame); snakeGame = null; }
        if (typeof flappyRAF !== 'undefined' && flappyRAF) { cancelAnimationFrame(flappyRAF); flappyRAF = null; }
        
        // Cleanup creative apps
        if (typeof _mazeCleanup === 'function') _mazeCleanup();
        if (typeof _gravCleanup === 'function') _gravCleanup();
        if (typeof _orbCleanup === 'function') _orbCleanup();
        if (typeof _sandCleanup === 'function') _sandCleanup();
        if (typeof _fluidCleanup === 'function') _fluidCleanup();
        if (typeof _platCleanup === 'function') _platCleanup();
        if (currentScreen === 'noise' && typeof noiseStop === 'function') noiseStop();
        if (currentScreen === 'visual' && typeof _waveStopAuto === 'function') _waveStopAuto();
        if (currentScreen === 'glitch' && typeof _glitchAnim !== 'undefined') { cancelAnimationFrame(_glitchAnim); _glitchAnim = null; }
        if (typeof breakoutRAF !== 'undefined' && breakoutRAF) { cancelAnimationFrame(breakoutRAF); breakoutRAF = null; }
        if (typeof tetrisRAF !== 'undefined' && tetrisRAF) { cancelAnimationFrame(tetrisRAF); tetrisRAF = null; }
        if (typeof tetrisDropInt !== 'undefined') clearInterval(tetrisDropInt);
        
        if (typeof stopNightVision === 'function') stopNightVision();
        if (typeof stopRemix === 'function') stopRemix();
        else if (typeof remixInterval !== 'undefined') clearTimeout(remixInterval);
        if (typeof spiritPingInterval !== 'undefined') clearInterval(spiritPingInterval);
        if (typeof breatheInterval !== 'undefined') clearInterval(breatheInterval);
        if (typeof vinylInterval !== 'undefined') { clearInterval(vinylInterval); vinylRotation = 0; }
        if (typeof radioPlayer !== 'undefined' && radioPlayer.pause) { radioPlayer.pause(); isRadioPlaying = false; }
        if (document.getElementById('musicAudio')) { const ma = document.getElementById('musicAudio'); ma.pause(); ma.src = ""; }
        if (typeof _tmInterval !== 'undefined' && _tmInterval) { clearInterval(_tmInterval); _tmInterval = null; }
        if (typeof _swInterval !== 'undefined' && _swInterval) { intervalManager.clear(_swInterval); _swInterval = null; }
        if (typeof stopCamera === 'function') stopCamera();
        if (typeof qrStopScan === 'function') qrStopScan();
        // Stop speed reader if running
        if (typeof _speedInterval !== 'undefined' && _speedInterval) { clearInterval(_speedInterval); _speedInterval = null; }
        
        document.querySelectorAll('.game-screen').forEach(s => s.classList.remove('active'));
        document.getElementById('homeScreen').classList.add('active');
        currentScreen = 'home';
        applyTranslations();
        document.getElementById('appIcon').textContent = '🏠';
    }
}

// Controls
// Controls
document.addEventListener('keydown', (e) => {
    if (currentScreen === 'home') {
        const cols = 3;
        if (e.key === 'ArrowUp') {
            if (selectedIndex >= cols) selectedIndex -= cols;
            updateMenuSelection();
        } else if (e.key === 'ArrowDown') {
            if (selectedIndex + cols < displayedApps.length) selectedIndex += cols;
            updateMenuSelection();
        } else if (e.key === 'ArrowLeft') {
            selectedIndex = (selectedIndex - 1 + displayedApps.length) % displayedApps.length;
            updateMenuSelection();
        } else if (e.key === 'ArrowRight') {
            selectedIndex = (selectedIndex + 1) % displayedApps.length;
            updateMenuSelection();
        } else if (e.key === 'Enter' || e.key === 'z' || e.key === 'a') {
            launchApp(displayedApps[selectedIndex].id);
        }
    } else if (currentScreen === 'vault') {
        if(e.key.startsWith('Arrow')) handleVaultInput(e.key.replace('Arrow', '').toLowerCase());
    } else if (currentScreen === 'news' && typeof handleNewsInput === 'function') {
        handleNewsInput(e.key);
    } else if (currentScreen === 'guess' && typeof handleGuessInput === 'function') {
        handleGuessInput(e.key);
    } else if (e.key === 'Backspace' || e.key === 'Escape') {
        const tag = e.target.tagName.toUpperCase();
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
            goBack();
        }
    }
});

window.saveNotes = function() {
    const np = document.getElementById('notepadText');
    if(np) {
        state.notes = np.value;
        saveState();
    }
};

// Physical Buttons (sustained press + repeat support)
const abBtns = document.querySelectorAll('.ab-btn');
if(abBtns.length >= 2) {
    const btnB = abBtns[0]; // Left (B)
    const btnA = abBtns[1]; // Right (A)

    let aHoldTimer = null, aRepeatTimer = null;
    const handleA = (down) => {
        if (down) {
            if (currentScreen === 'home') { launchApp(displayedApps[selectedIndex].id); return; }
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', bubbles: true }));
            clearTimeout(aHoldTimer); clearInterval(aRepeatTimer);
            aHoldTimer = setTimeout(() => { aRepeatTimer = setInterval(() => {
                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', bubbles: true }));
            }, 100); }, 250);
        } else {
            clearTimeout(aHoldTimer); clearInterval(aRepeatTimer);
            aHoldTimer = null; aRepeatTimer = null;
            document.dispatchEvent(new KeyboardEvent('keyup', { key: 'z', bubbles: true }));
        }
    };
    let bHoldTimer = null, bRepeatTimer = null;
    const handleB = (down) => {
        const gameModeApps = ['adventure', 'troll', 'racer', 'duel', 'brawl', 'void', 'chess', 'sync', 'kart'];
        if (down) {
            if (!gameModeApps.includes(currentScreen)) { goBack(); return; }
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', bubbles: true }));
            clearTimeout(bHoldTimer); clearInterval(bRepeatTimer);
            bHoldTimer = setTimeout(() => { bRepeatTimer = setInterval(() => {
                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', bubbles: true }));
            }, 100); }, 250);
        } else {
            clearTimeout(bHoldTimer); clearInterval(bRepeatTimer);
            bHoldTimer = null; bRepeatTimer = null;
            document.dispatchEvent(new KeyboardEvent('keyup', { key: 'x', bubbles: true }));
        }
    };

    btnA.addEventListener('mousedown', () => handleA(true));
    btnA.addEventListener('mouseup',   () => handleA(false));
    btnA.addEventListener('touchstart', (e) => { 
        if (e.cancelable) e.preventDefault(); 
        handleA(true); 
    }, { passive: false });
    btnA.addEventListener('touchend',   (e) => { 
        if (e.cancelable) e.preventDefault(); 
        handleA(false); 
    }, { passive: false });

    btnB.addEventListener('mousedown', () => handleB(true));
    btnB.addEventListener('mouseup',   () => handleB(false));
    btnB.addEventListener('touchstart', (e) => { 
        if (e.cancelable) e.preventDefault(); 
        handleB(true); 
    }, { passive: false });
    btnB.addEventListener('touchend',   (e) => { 
        if (e.cancelable) e.preventDefault(); 
        handleB(false); 
    }, { passive: false });
}

// Bind SELECT / START
const selectBtn = document.querySelector('.select-btn');
const startBtn  = document.querySelector('.start-btn');

if (selectBtn) {
    selectBtn.onclick = () => {
        sounds.back();
        goBack();
    };
}

if (startBtn) {
    startBtn.onclick = () => {
        // Start usually acts as Enter or a special Menu
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        setTimeout(() => document.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true })), 100);
        
        // Special: In Adventure Game, cycle visual modes (if implemented in script)
        if (currentScreen === 'adventure' && typeof RetroQuest !== 'undefined' && RetroQuest.cycleMode) {
            RetroQuest.cycleMode();
        }
    };
}

// Universal Controller (D-Pad) — sustained press + repeat
function bindHold(selector, key) {
    const el = document.querySelector(selector);
    if(!el) return;
    let holdTimer = null;
    let repeatTimer = null;
    const fire = () => {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: key, bubbles: true }));
    };
    const press = (d) => {
        if(d) {
            fire();
            el.classList.add('pressed');
            // After initial delay, repeat every 80ms while held
            clearTimeout(holdTimer);
            clearInterval(repeatTimer);
            holdTimer = setTimeout(() => {
                repeatTimer = setInterval(fire, 80);
            }, 200);
        } else {
            el.classList.remove('pressed');
            clearTimeout(holdTimer);
            clearInterval(repeatTimer);
            holdTimer = null;
            repeatTimer = null;
            document.dispatchEvent(new KeyboardEvent('keyup', { key: key, bubbles: true }));
        }
    };
    el.addEventListener('mousedown', () => press(true));
    el.addEventListener('mouseup', () => press(false));
    el.addEventListener('mouseleave', () => press(false));
    el.addEventListener('touchstart', (e) => { 
        if (e.cancelable) e.preventDefault(); 
        press(true); 
    }, { passive: false });
    el.addEventListener('touchend', (e) => { 
        if (e.cancelable) e.preventDefault(); 
        press(false); 
    }, { passive: false });
}

bindHold('.dpad-up', 'ArrowUp');
bindHold('.dpad-down', 'ArrowDown');
bindHold('.dpad-left', 'ArrowLeft');
bindHold('.dpad-right', 'ArrowRight');

// ========== IFRAME INPUT FORWARDING (For Troll & Adventure) ==========
document.addEventListener('keydown', (e) => forwardInputToFrames(e, true));
document.addEventListener('keyup', (e) => forwardInputToFrames(e, false));

function forwardInputToFrames(e, down) {
    if (currentScreen === 'troll') {
        const frame = document.getElementById('trollFrame');
        if (frame && frame.contentWindow) {
            frame.contentWindow.postMessage({ type: 'input', key: e.key, down }, '*');
        }
    } else if (currentScreen === 'adventure') {
        const frame = document.getElementById('adventureFrame');
        if (frame && frame.contentWindow) {
            frame.contentWindow.postMessage({ type: 'input', key: e.key, down }, '*');
        }
    }
}
