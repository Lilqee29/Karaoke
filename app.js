// ========== MAIN APP LOADER (v3.0 - STREAMLINED) ==========

const apps = [
    // ── CORE GAMES (Keep - High Engagement) ──────────────────────────────
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
    
    // ── PRODUCTIVITY (Enhanced) ───────────────────────────────────────────
    { id: 'todo', name: 'TO-DO', icon: '📝' },
    { id: 'notes', name: 'NOTES', icon: '📒' },
    { id: 'calc', name: 'CALC', icon: '🔢' },
    { id: 'timer', name: 'TIMER', icon: '⏲️' },
    { id: 'stopwatch', name: 'CHRONO', icon: '⏱️' },
    { id: 'counter', name: 'COUNT', icon: '🔢' },
    { id: 'pomo', name: 'POMO', icon: '🍅' },
    { id: 'habit', name: 'HABIT', icon: '✅' },        // NEW
    { id: 'speed', name: 'SPEED', icon: '⏩' },       // NEW
    { id: 'journal', name: 'JOURNAL', icon: '📔' },   // NEW
    { id: 'workout', name: 'WORKOUT', icon: '💪' },   // NEW
    { id: 'study', name: 'STUDY', icon: '🎓' },       // NEW
    { id: 'budget', name: 'BUDGET', icon: '💰' },     // NEW
    
    // ── CREATIVE ──────────────────────────────────────────────────────────
    { id: 'paint', name: 'PAINT', icon: '🎨' },
    { id: 'pixel', name: 'PIXEL', icon: '🖌️' },
    { id: 'remix', name: 'BEATS', icon: '🎹' },
    { id: 'groove', name: 'GROOVE', icon: '🥁' },
    { id: 'music', name: 'MUSIC', icon: '🎵' },
    { id: 'radio', name: 'RADIO', icon: '📻' },
    
    // ── INFORMATION & LEARNING ────────────────────────────────────────────
    { id: 'news', name: 'NEWS', icon: '📰' },
    { id: 'weather', name: 'WEATH', icon: '☀️' },
    { id: 'dict', name: 'WORD', icon: '📖' },
    { id: 'translate', name: 'TRANS', icon: '🌐' },
    { id: 'wiki', name: 'WIKI', icon: '🌐' },
    { id: 'book', name: 'BOOKS', icon: '📚' },
    { id: 'trivia', name: 'TRIVIA', icon: '❓' },
    { id: 'pokedex', name: 'DEX', icon: '🔴' },
    { id: 'space', name: 'SPACE', icon: '🚀' },
    { id: 'nasa', name: 'COSMOS', icon: '🌌' },
    { id: 'elem', name: 'CHEM', icon: '⚛️' },
    
    // ── FUN & ENTERTAINMENT ───────────────────────────────────────────────
    { id: 'joke', name: 'JOKES', icon: '😂' },
    { id: 'fact', name: 'FACTS', icon: '💡' },
    { id: 'meme', name: 'MEME', icon: '😹' },
    { id: 'catfact', name: 'CATS', icon: '🐱' },
    { id: 'quote', name: 'QUOTE', icon: '❝' },
    { id: 'advice', name: 'SAGE', icon: '🧙' },
    { id: 'fortune', name: 'FORTUNE', icon: '🥠' },
    { id: 'riddle', name: 'RIDDLE', icon: '❓' },
    { id: 'zodiac', name: 'ZODIAC', icon: '♈' },
    { id: 'cocktail', name: 'DRINK', icon: '🍸' },
    
    // ── MINI GAMES ────────────────────────────────────────────────────────
    { id: 'guess', name: 'GUESS', icon: '🔢' },
    { id: 'reaction', name: 'FAST', icon: '⚡' },
    { id: 'coin', name: 'FLIP', icon: '🪙' },
    { id: 'dice', name: 'DICE', icon: '🎲' },
    { id: 'ball', name: '8-BALL', icon: '🎱' },
    { id: 'miner', name: 'MINER', icon: '💎' },
    { id: 'pet', name: 'PET', icon: '🐱' },
    { id: 'flash', name: 'CARDS', icon: '🎴' },
    
    // ── UTILITY TOOLS ─────────────────────────────────────────────────────
    { id: 'clock', name: 'TIME', icon: '🕒' },
    { id: 'calendar', name: 'CAL', icon: '📅' },
    { id: 'compass', name: 'COMPASS', icon: '🧭' },
    { id: 'contacts', name: 'PHONE', icon: '📔' },
    { id: 'qr', name: 'QR', icon: '📱' },
    { id: 'scan', name: 'SCAN', icon: '🔍' },
    { id: 'alerts', name: 'ALARM', icon: '⏰' },
    { id: 'bmi', name: 'BMI', icon: '⚖️' },
    { id: 'bmr', name: 'BMR', icon: '🔥' },
    { id: 'unit', name: 'UNITS', icon: '📏' },
    { id: 'tip', name: 'TIP', icon: '💸' },
    { id: 'bin', name: 'BIN', icon: '01' },
    { id: 'pass', name: 'PASS', icon: '🔑' },
    { id: 'regex', name: 'REGEX', icon: '🔠' },
    { id: 'ascii', name: 'ART', icon: '🖼️' },
    
    // ── WELLNESS ──────────────────────────────────────────────────────────
    { id: 'breathe', name: 'CALM', icon: '🌬️' },

    { id: 'water', name: 'H2O', icon: '💧' },
    
    // ── ADVANCED/TECH ─────────────────────────────────────────────────────
    { id: 'stock', name: 'STOCK', icon: '📈' },
    { id: 'ip', name: 'NET', icon: '🌐' },
    { id: 'camera', name: 'CAM', icon: '📷' },
    { id: 'currency', name: 'EXCH', icon: '💱' },
    { id: 'flashlight', name: 'BEAM', icon: '🔦' },
    { id: 'level', name: 'LEVEL', icon: '📏' },
    { id: 'sos', name: 'S.O.S', icon: '🆘' },
    { id: 'term', name: 'ZSH', icon: '💻' },
    { id: 'morse', name: 'MORSE', icon: '📡' },
    { id: 'sfx', name: 'SFX', icon: '🔊' },
    { id: 'metro', name: 'BEAT', icon: '⏱️' },
    { id: 'emulator', name: 'RETRO', icon: '💾' },
    
    // ── SPECIAL/UNIQUE ────────────────────────────────────────────────────
    { id: 'vault', name: 'VAULT', icon: '🔐' },
    { id: 'world', name: 'WORLD', icon: '🌍' },
    { id: 'map', name: 'MAPS', icon: '🗺️' },
    { id: 'quests', name: 'QUESTS', icon: '⚔️' },
    { id: 'bored', name: 'IDEAS', icon: '💡' },
    { id: 'idle', name: 'IDLE', icon: '⛏️' },
    { id: 'chat', name: 'BITCHAT', icon: '📡' },
    
    // ── P2P MULTIPLAYER GAMES ─────────────────────────────────────────────
    { id: 'chess', name: 'TACTIC', icon: '♟️' },
    { id: 'brawl', name: 'BRAWL', icon: '🥋' },
    { id: 'racer', name: 'RACER', icon: '🏁' },
    { id: 'duel', name: 'DUEL', icon: '🚀' },
    { id: 'sync', name: 'PULSE', icon: '⚡' },
    { id: 'void', name: 'VOID', icon: '👽' },
    { id: 'troll', name: 'TROLL', icon: '👺' },
    
    // ── ADVENTURE (Enhanced) ──────────────────────────────────────────────
    { id: 'adventure', name: 'QUEST', icon: '🗺️' },
    
    // ── SYSTEM ────────────────────────────────────────────────────────────
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
        if (typeof breakoutRAF !== 'undefined' && breakoutRAF) { cancelAnimationFrame(breakoutRAF); breakoutRAF = null; }
        if (typeof tetrisRAF !== 'undefined' && tetrisRAF) { cancelAnimationFrame(tetrisRAF); tetrisRAF = null; }
        if (typeof tetrisDropInt !== 'undefined') clearInterval(tetrisDropInt);
        
        if (typeof stopNightVision === 'function') stopNightVision();
        if (typeof remixInterval !== 'undefined') clearInterval(remixInterval);
        if (typeof spiritPingInterval !== 'undefined') clearInterval(spiritPingInterval);
        if (typeof breatheInterval !== 'undefined') clearInterval(breatheInterval);
        if (typeof vinylInterval !== 'undefined') { clearInterval(vinylInterval); vinylRotation = 0; }
        if (typeof radioPlayer !== 'undefined' && radioPlayer.pause) { radioPlayer.pause(); isRadioPlaying = false; }
        if (document.getElementById('musicAudio')) { const ma = document.getElementById('musicAudio'); ma.pause(); ma.src = ""; }
        if (typeof timerInt !== 'undefined') clearInterval(timerInt);
        if (typeof stopInt !== 'undefined') clearInterval(stopInt);
        if (typeof stopCamera === 'function') stopCamera();
        
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

// Physical Buttons (sustained press support)
const abBtns = document.querySelectorAll('.ab-btn');
if(abBtns.length >= 2) {
    const btnB = abBtns[0]; // Left (B)
    const btnA = abBtns[1]; // Right (A)

    const handleA = (down) => {
        if (down && currentScreen === 'home') launchApp(displayedApps[selectedIndex].id);
        else document.dispatchEvent(new KeyboardEvent(down?'keydown':'keyup', { key: 'z' }));
    };
    const handleB = (down) => {
        if (!down) {
            document.dispatchEvent(new KeyboardEvent('keyup', { key: 'x' }));
            return;
        }
        
        // Define apps that use B for gameplay instead of Back
        const gameModeApps = ['adventure', 'troll', 'racer', 'duel', 'brawl', 'void'];
        
        if (gameModeApps.includes(currentScreen)) {
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' }));
        } else {
            goBack();
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
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
        setTimeout(() => document.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' })), 100);
        
        // Special: In Adventure Game, cycle visual modes (if implemented in script)
        if (currentScreen === 'adventure' && typeof RetroQuest !== 'undefined' && RetroQuest.cycleMode) {
            RetroQuest.cycleMode();
        }
    };
}

// Universal Controller (D-Pad)sustained press
function bindHold(selector, key) {
    const el = document.querySelector(selector);
    if(!el) return;
    const press = (d) => {
        document.dispatchEvent(new KeyboardEvent(d?'keydown':'keyup', { key: key }));
        if(d) el.classList.add('pressed'); else el.classList.remove('pressed');
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
