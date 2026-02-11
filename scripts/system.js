// ========== SYSTEM MODULE ==========
// 1. Audio Context
window.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
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
    gems: parseInt(localStorage.getItem('gbGems')) || 0,
    pet: JSON.parse(localStorage.getItem('gbPet')) || { hunger: 100, happy: 100, energy: 100, lastCheck: Date.now() },
    highScore: parseInt(localStorage.getItem('snakeHigh')) || 0,
    notes: localStorage.getItem('gbNotes') || "",
    todos: JSON.parse(localStorage.getItem('gbTodos')) || [],
    lang: localStorage.getItem('gbLang') || 'en',
    vol: parseInt(localStorage.getItem('gbVol')) || 50,
    theme: localStorage.getItem('gbTheme') || 'classic',
    brightness: parseInt(localStorage.getItem('gbBright')) || 100,
    crtEnabled: localStorage.getItem('gbCRT') !== 'false'
};

function saveState() {
    localStorage.setItem('gbGems', state.gems);
    localStorage.setItem('gbPet', JSON.stringify(state.pet));
    localStorage.setItem('snakeHigh', state.highScore);
    localStorage.setItem('gbNotes', state.notes);
    localStorage.setItem('gbTodos', JSON.stringify(state.todos));
    localStorage.setItem('gbLang', state.lang);
    localStorage.setItem('gbVol', state.vol);
    localStorage.setItem('gbTheme', state.theme);
    localStorage.setItem('gbBright', state.brightness);
    localStorage.setItem('gbCRT', state.crtEnabled);
    document.getElementById('gemCount').textContent = `💎 ${state.gems}`;
}

function playSound(freq, type, duration) {
    if (!soundEnabled) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime((state.vol/100) * 0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch(e) {}
}

const sounds = {
    click: () => playSound(600, 'square', 0.05),
    select: () => playSound(800, 'square', 0.05),
    back: () => playSound(400, 'square', 0.1),
    launch: () => {
        playSound(440, 'square', 0.1);
        setTimeout(() => playSound(880, 'square', 0.1), 100);
    },
    coin: () => {
        playSound(1200, 'sine', 0.1);
        setTimeout(() => playSound(1000, 'sine', 0.15), 80);
    }
};

function setVolume(val) {
    state.vol = val;
    saveState();
}

function setTheme(themeName) {
    state.theme = themeName;
    const theme = themes[themeName] || themes.classic;
    
    document.documentElement.style.setProperty('--gb-shell', theme.shell);
    document.documentElement.style.setProperty('--gb-shell-dark', theme.shellDark);
    document.documentElement.style.setProperty('--gb-screen', theme.screen);
    document.documentElement.style.setProperty('--gb-screen-dark', theme.screenDark);
    document.documentElement.style.setProperty('--gb-text', theme.text);
    document.documentElement.style.setProperty('--gb-text-light', theme.textLight);
    
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
    const crtElements = ['.screen::after', '.scanline'];
    document.getElementById('crtToggle').textContent = state.crtEnabled ? 'ON' : 'OFF';
    
    if (state.crtEnabled) {
        document.querySelector('.scanline').style.display = 'block';
    } else {
        document.querySelector('.scanline').style.display = 'none';
    }
    saveState();
    sounds.click();
}

function setLanguage(lang) {
    state.lang = lang;
    saveState();
    location.reload();
}

function addGems(amount) {
    state.gems += amount;
    saveState();
}

function resetData() {
    if(confirm("WIPE ALL DATA?")) {
        localStorage.clear();
        location.reload();
    }
}
