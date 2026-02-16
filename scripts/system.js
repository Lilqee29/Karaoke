// ========== SYSTEM MODULE ==========
// 0. Debug & Utilities
const DEBUG = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
window.log = function(...args) {
    if (DEBUG) console.log(...args);
};

// Interval Manager - Prevents memory leaks
window.intervalManager = {
    intervals: new Set(),
    
    set(callback, delay) {
        const id = setInterval(callback, delay);
        this.intervals.add(id);
        return id;
    },
    
    clear(id) {
        clearInterval(id);
        this.intervals.delete(id);
    },
    
    clearAll() {
        this.intervals.forEach(id => clearInterval(id));
        this.intervals.clear();
    }
};

// Global Loading Overlay
window.showLoading = function(message = 'LOADING...') {
    let loader = document.getElementById('globalLoader');
    if (!loader) {
        loader = document.createElement('div');
        loader.id = 'globalLoader';
        loader.style.cssText = `
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: var(--gb-text); color: var(--gb-screen);
            padding: 15px 25px; border-radius: 4px; font-size: 7px;
            z-index: 1000; animation: pulseSelected 1s infinite;
            text-align: center;
        `;
        document.querySelector('.screen-content').appendChild(loader);
    }
    loader.textContent = message;
    loader.style.display = 'block';
};

window.hideLoading = function() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.style.display = 'none';
};

// Debounce utility
window.debounce = function(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Safe HTML sanitizer (basic)
window.sanitizeHTML = function(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
};

// Global Error Handler
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
        background: rgba(139, 0, 0, 0.95); color: var(--gb-screen);
        padding: 20px; z-index: 9999; font-size: 7px; text-align: center;
        border: 2px solid var(--gb-text); border-radius: 4px; max-width: 80%;
    `;
    errorDiv.innerHTML = `
        <div style="font-size: 8px; margin-bottom: 10px;">⚠️ ERROR</div>
        <div style="font-size: 6px; margin-bottom: 15px;">${sanitizeHTML(e.error?.message || 'Unknown error')}</div>
        <button onclick="this.parentElement.remove()" style="margin-right: 10px;">CLOSE</button>
        <button onclick="location.reload()">RESTART</button>
    `;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 10000); // Auto-remove after 10s
});

// 1. Audio Context (Lazy initialized to fix browser warnings)
let _audioCtx = null;
Object.defineProperty(window, 'audioCtx', {
    get() {
        if (!_audioCtx) {
            try {
                _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            } catch(e) { console.error('AudioContext fail:', e); }
        }
        return _audioCtx;
    }
});

window.resumeAudio = function() {
    if (window.audioCtx && window.audioCtx.state === 'suspended') {
        window.audioCtx.resume();
    }
};
let soundEnabled = true;

// 2. Multi-Language Support
const translations = {
    en: {
        title: "GAMEBOY OS",
        batt: "BATT: 100%",
        settings: "SETTINGS",
        sound: "SOUND",
        lang: "LANGUAGE",
        theme: "THEME",
        bright: "BRIGHTNESS",
        todo: "TO-DO LIST",
        music: "RETRO PLAYER",
        weather: "WEATHER",
        pet: "PET",
        riddle: "RIDDLE",
        gems: "GEMS"
    },
    fr: {
        title: "KARAOKE BOY",
        batt: "BATT: 100%",
        settings: "RÉGLAGES",
        sound: "SON",
        lang: "LANGUE",
        theme: "THÈME",
        bright: "LUMINOSITÉ",
        todo: "LISTE TÂCHES",
        music: "LECTEUR RETRO",
        weather: "MÉTÉO",
        pet: "ANIMAL",
        riddle: "ÉNIGME",
        gems: "JOYAUX"
    }
};

// ULTRA THEME SYSTEM - Complete UI transformation
const themes = {
    classic: {
        name: 'CLASSIC',
        shell: '#8b8b8b',
        shellDark: '#6d6d6d',
        screen: '#9bbc0f',
        screenDark: '#8bac0f',
        text: '#0f380f',
        textLight: '#306230'
    },
    pink: {
        name: 'SAKURA',
        shell: '#ff69b4',
        shellDark: '#ff1493',
        screen: '#ffb6c1',
        screenDark: '#ff69b4',
        text: '#8b0045',
        textLight: '#c71585'
    },
    purple: {
        name: 'GRAPE',
        shell: '#9370db',
        shellDark: '#663399',
        screen: '#dda0dd',
        screenDark: '#ba55d3',
        text: '#4b0082',
        textLight: '#8b008b'
    },
    ocean: {
        name: 'OCEAN',
        shell: '#20b2aa',
        shellDark: '#008b8b',
        screen: '#87ceeb',
        screenDark: '#4682b4',
        text: '#00008b',
        textLight: '#191970'
    },
    sunset: {
        name: 'SUNSET',
        shell: '#ff6347',
        shellDark: '#dc143c',
        screen: '#ffa07a',
        screenDark: '#ff7f50',
        text: '#8b0000',
        textLight: '#cd5c5c'
    },
    forest: {
        name: 'FOREST',
        shell: '#228b22',
        shellDark: '#006400',
        screen: '#90ee90',
        screenDark: '#3cb371',
        text: '#013220',
        textLight: '#2e8b57'
    },
    cyber: {
        name: 'CYBER',
        shell: '#00ffff',
        shellDark: '#008b8b',
        screen: '#7fffd4',
        screenDark: '#40e0d0',
        text: '#000080',
        textLight: '#4169e1'
    },
    noir: {
        name: 'NOIR',
        shell: '#2f2f2f',
        shellDark: '#1a1a1a',
        screen: '#696969',
        screenDark: '#4a4a4a',
        text: '#000000',
        textLight: '#333333'
    }
};

// Persistence
let state = {
    gems:      parseInt(localStorage.getItem('gbGems')) || 0,
    pet:       JSON.parse(localStorage.getItem('gbPet')) || { hunger: 100, happy: 100, energy: 100, lastCheck: Date.now() },
    highScore: parseInt(localStorage.getItem('snakeHigh')) || 0,
    notes:     localStorage.getItem('gbNotes') || "",
    todos:     JSON.parse(localStorage.getItem('gbTodos')) || [],
    lang:      localStorage.getItem('gbLang') || 'en',
    vol:       parseInt(localStorage.getItem('gbVol')) || 50,
    theme:     localStorage.getItem('gbTheme') || 'classic',
    brightness: parseInt(localStorage.getItem('gbBright')) || 100,
    crtEnabled: localStorage.getItem('gbCRT') !== 'false',

    // ── Chess persistent state ──────────────────────────────────────────────
    chess: JSON.parse(localStorage.getItem('gbChess')) || {
        wins:       { white: 0, black: 0 },   // win record
        mode:       'ai',                       // last mode played
        difficulty: 'normal',                   // last difficulty
        board:      null,                       // null = no saved mid-game
        turn:       'white',                    // whose turn when saved
        captured:   { byPlayer: [], byAI: [] } // captured pieces when saved
    }
};

function saveState() {
    localStorage.setItem('gbGems',    state.gems);
    localStorage.setItem('gbPet',     JSON.stringify(state.pet));
    localStorage.setItem('snakeHigh', state.highScore);
    localStorage.setItem('gbNotes',   state.notes);
    localStorage.setItem('gbTodos',   JSON.stringify(state.todos));
    localStorage.setItem('gbLang',    state.lang);
    localStorage.setItem('gbVol',     state.vol);
    localStorage.setItem('gbTheme',   state.theme);
    localStorage.setItem('gbBright',  state.brightness);
    localStorage.setItem('gbCRT',     state.crtEnabled);

    // ── Chess ───────────────────────────────────────────────────────────────
    localStorage.setItem('gbChess',   JSON.stringify(state.chess));

    document.getElementById('gemCount').textContent = `💎 ${state.gems}`;
}

// ── Chess save/load helpers (called from chess module) ──────────────────────

// Call this every time a move is made in chess
window.saveChessGame = function(board, turn, captured, mode, difficulty, wins) {
    state.chess = {
        wins:       wins       || state.chess.wins,
        mode:       mode       || state.chess.mode,
        difficulty: difficulty || state.chess.difficulty,
        board:      board,
        turn:       turn,
        captured:   captured
    };
    saveState();
};

// Call this when a game ends — clears the board snapshot but keeps record
window.saveChessResult = function(wins, mode, difficulty) {
    state.chess.wins       = wins;
    state.chess.mode       = mode       || state.chess.mode;
    state.chess.difficulty = difficulty || state.chess.difficulty;
    state.chess.board      = null;   // no mid-game to resume
    state.chess.turn       = 'white';
    state.chess.captured   = { byPlayer: [], byAI: [] };
    saveState();
};

// Returns saved chess state so chess module can restore it
window.loadChessGame = function() {
    return state.chess;
};

// Wipe only chess data
window.resetChessData = function() {
    state.chess = {
        wins:       { white: 0, black: 0 },
        mode:       'ai',
        difficulty: 'normal',
        board:      null,
        turn:       'white',
        captured:   { byPlayer: [], byAI: [] }
    };
    saveState();
};

// ── Rest of system unchanged ────────────────────────────────────────────────

function playSound(freq, type, duration) {
    if (!soundEnabled) return;
    try {
        const osc  = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime((state.vol / 100) * 0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch(e) {}
}

const sounds = {
    click:  () => playSound(600, 'square', 0.05),
    select: () => playSound(800, 'square', 0.05),
    back:   () => playSound(400, 'square', 0.1),
    launch: () => { playSound(440, 'square', 0.1); setTimeout(() => playSound(880, 'square', 0.1), 100); },
    coin:   () => { playSound(1200, 'sine', 0.1); setTimeout(() => playSound(1000, 'sine', 0.15), 80); }
};

function setVolume(val)     { state.vol = val; saveState(); }

function setTheme(themeName) {
    state.theme = themeName;
    const theme = themes[themeName] || themes.classic;
    document.documentElement.style.setProperty('--gb-shell',       theme.shell);
    document.documentElement.style.setProperty('--gb-shell-dark',  theme.shellDark);
    document.documentElement.style.setProperty('--gb-screen',      theme.screen);
    document.documentElement.style.setProperty('--gb-screen-dark', theme.screenDark);
    document.documentElement.style.setProperty('--gb-text',        theme.text);
    document.documentElement.style.setProperty('--gb-text-light',  theme.textLight);
    saveState();
    sounds.launch();
}

function setBrightness(val) {
    state.brightness = val;
    document.querySelector('.screen').style.filter = `brightness(${val}%)`;
    saveState();
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    document.getElementById('soundToggle').textContent = soundEnabled ? 'ON' : 'OFF';
    sounds.click();
}

function toggleCRT() {
    state.crtEnabled = !state.crtEnabled;
    document.getElementById('crtToggle').textContent = state.crtEnabled ? 'ON' : 'OFF';
    document.querySelector('.scanline').style.display = state.crtEnabled ? 'block' : 'none';
    saveState();
    sounds.click();
}

function setLanguage(lang) { state.lang = lang; saveState(); location.reload(); }

function addGems(amount)   { state.gems += amount; saveState(); }

function resetData() {
    if (confirm("WIPE ALL DATA?")) { localStorage.clear(); location.reload(); }
}