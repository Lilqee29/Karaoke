// ========== MAIN APP LOADER (v2.1) ==========

const apps = [
    { id: 'karaoke', name: 'KARAOKE', icon: '🎤' },
    { id: 'snake', name: 'SNAKE', icon: '🐍' },
    { id: 'flappy', name: 'FLAPPY', icon: '🐦' },
    { id: 'breakout', name: 'BREAKOUT', icon: '🧱' },
    { id: 'tetris', name: 'TETRIS', icon: '🧱' },
    { id: 'memory', name: 'MEMORY', icon: '🃏' },
    { id: 'todo', name: 'TO-DO', icon: '📝' },
    { id: 'notes', name: 'NOTES', icon: '📒' },
    { id: 'calc', name: 'CALC', icon: '🔢' },
    { id: 'paint', name: 'PAINT', icon: '🎨' },
    { id: 'pixel', name: 'PIXEL', icon: '🖌️' },
    { id: 'miner', name: 'MINER', icon: '💎' },
    { id: 'pet', name: 'PET', icon: '🐱' },
    { id: 'flash', name: 'CARDS', icon: '🎴' },
    { id: 'draw', name: 'DRAW', icon: '🖍️' },
    
    // Batch 1 (Info)
    { id: 'weather', name: 'WEATH', icon: '☀️' },
    { id: 'clock', name: 'TIME', icon: '🕒' },
    { id: 'news', name: 'NEWS', icon: '📰' },
    { id: 'stock', name: 'STOCK', icon: '📈' },
    { id: 'dict', name: 'WORD', icon: '📖' },
    { id: 'quote', name: 'QUOTE', icon: '❝' },
    { id: 'ip', name: 'NET', icon: '🌐' },
    { id: 'translate', name: 'TRANS', icon: '🌐' },
    
    // Batch 2 (Fun)
    { id: 'joke', name: 'JOKES', icon: '😂' },
    { id: 'fact', name: 'FACTS', icon: '💡' },
    { id: 'dog', name: 'DOGS', icon: '🐶' },
    { id: 'fox', name: 'FOX', icon: '🦊' },
    { id: 'book', name: 'BOOKS', icon: '📚' },
    { id: 'pokedex', name: 'DEX', icon: '🔴' },
    { id: 'trivia', name: 'TRIVIA', icon: '❓' },
    { id: 'advice', name: 'SAGE', icon: '🧙' },
    { id: 'zodiac', name: 'ZODIAC', icon: '♈' },
    { id: 'fortune', name: 'FORTUNE', icon: '🥠' },
    { id: 'riddle', name: 'RIDDLE', icon: '❓' },
    { id: 'guess', name: 'GUESS', icon: '🔢' },
    { id: 'reaction', name: 'FAST', icon: '⚡' },
    { id: 'music', name: 'MUSIC', icon: '🎵' },
    { id: 'radio', name: 'RADIO', icon: '📻' },
    
    // Batch 3 (Tools)
    { id: 'stopwatch', name: 'CHRONO', icon: '⏱️' },
    { id: 'timer', name: 'TIMER', icon: '⏲️' },
    { id: 'counter', name: 'COUNT', icon: '🔢' },
    { id: 'compass', name: 'COMPASS', icon: '🧭' },
    { id: 'contacts', name: 'PHONE', icon: '📔' },
    { id: 'calendar', name: 'CAL', icon: '📅' },
    { id: 'streak', name: 'STREAK', icon: '🔥' },
    { id: 'breathe', name: 'CALM', icon: '🌬️' },
    { id: 'map', name: 'MAPS', icon: '🗺️' },
    { id: 'barcode', name: 'SCAN', icon: '🔍' },
    { id: 'alerts', name: 'ALARM', icon: '⏰' },
    { id: 'world', name: 'WORLD', icon: '🌍' },
    { id: 'quests', name: 'QUESTS', icon: '⚔️' },
    
    // Batch 4 (Futuristic)
    { id: 'space', name: 'SPACE', icon: '🚀' },
    { id: 'oracle', name: 'FATE', icon: '🎱' },
    { id: 'robo', name: 'BOTS', icon: '🤖' },
    { id: 'identity', name: 'WHO?', icon: '🕵️' },
    { id: 'vault', name: 'VAULT', icon: '🔐' },
    { id: 'spirit', name: 'RADAR', icon: '👻' },
    { id: 'idle', name: 'MINER', icon: '⛏️' },
    { id: 'egg', name: 'HATCH', icon: '🥚' },
    { id: 'morse', name: 'MORSE', icon: '📡' },
    
    // Games
    { id: 'ttt', name: 'TTT', icon: '❌' },
    { id: 'rps', name: 'R-P-S', icon: '✂️' },
    { id: 'coin', name: 'FLIP', icon: '🪙' },
    { id: 'dice', name: 'DICE', icon: '🎲' },
    { id: 'ball', name: '8-BALL', icon: '🎱' },
    { id: 'remix', name: 'BEATS', icon: '🎹' },
    { id: 'mines', name: 'MINES', icon: '💣' },
    
    // Batch 5 (New APIs)
    { id: 'catfact', name: 'CATS', icon: '🐱' },
    { id: 'chuck', name: 'CHUCK', icon: '🤠' },
    { id: 'anime', name: 'ANIME', icon: '🎭' },
    { id: 'meme', name: 'MEME', icon: '😹' },
    { id: 'nasa', name: 'COSMOS', icon: '🌌' },
    { id: 'kanye', name: 'KANYE', icon: '🎤' },
    { id: 'bored', name: 'IDEAS', icon: '💡' },
    { id: 'zen', name: 'ZEN', icon: '🧘' },
    { id: 'cocktail', name: 'DRINK', icon: '🍸' },
    { id: 'camera', name: 'CAM', icon: '📷' },
    
    // Batch 6 (Utilities Expanded)
    { id: 'bmi', name: 'BMI', icon: '⚖️' },
    { id: 'unit', name: 'UNITS', icon: '📏' },
    { id: 'pass', name: 'PASS', icon: '🔑' },
    { id: 'pomo', name: 'POMO', icon: '🍅' },
    { id: 'tip', name: 'TIP', icon: '💸' },
    { id: 'bin', name: 'BIN', icon: '01' },
    { id: 'water', name: 'H2O', icon: '💧' },
    { id: 'groove', name: 'GROOVE', icon: '🥁' },
    { id: 'wiki', name: 'WIKI', icon: '🌐' },
    { id: 'emulator', name: 'RETRO', icon: '💾' },
    { id: 'bmr', name: 'BMR', icon: '🔥' },
    { id: 'int', name: 'INT', icon: '💰' },
    { id: 'metro', name: 'BEAT', icon: '⏱️' },
    { id: '2048', name: '2048', icon: '🔢' },
    { id: 'term', name: 'ZSH', icon: '💻' },
    // Batch 6 (Power Tools)
    { id: 'qr', name: 'QR', icon: '📱' },
    { id: 'ascii', name: 'ART', icon: '🖼️' },
    { id: 'noise', name: 'NOISE', icon: '📻' },
    { id: 'level', name: 'LEVEL', icon: '📐' },
    { id: 'hex', name: 'HEX', icon: '🔢' },
    { id: 'elem', name: 'CHEM', icon: '⚛️' },
    { id: 'sfx', name: 'SFX', icon: '🔊' },
    { id: 'regex', name: 'REGEX', icon: '🔠' },
    { id: 'lorem', name: 'IPSUM', icon: '📝' },
    { id: 'typer', name: 'TYPE', icon: '⌨️' },
    { id: 'chat', name: 'BITCHAT', icon: '📡' },
    
    // System
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
            item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            
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
        if (typeof clockInterval !== 'undefined') clearInterval(clockInterval);
        if (typeof snakeGame !== 'undefined' && snakeGame) snakeGame.stop();
        if (typeof flappyGame !== 'undefined') cancelAnimationFrame(flappyGame);
        if (typeof breakoutGame !== 'undefined') cancelAnimationFrame(breakoutGame);
        if (typeof tetrisGame !== 'undefined') cancelAnimationFrame(tetrisGame);
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

// Physical Buttons (assuming order B, A in DOM)
const abBtns = document.querySelectorAll('.ab-btn');
if(abBtns.length >= 2) {
    // B Button (Back)
    abBtns[0].onclick = goBack;
    // A Button (Select)
    abBtns[1].onclick = () => { 
        if(currentScreen==='home') launchApp(displayedApps[selectedIndex].id);
    };
}

// Universal Controller Handling
function triggerKey(key) {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: key }));
    setTimeout(() => document.dispatchEvent(new KeyboardEvent('keyup', { key: key })), 50);
}

const dpadUp = document.querySelector('.dpad-up');
const dpadDown = document.querySelector('.dpad-down');
const dpadLeft = document.querySelector('.dpad-left');
const dpadRight = document.querySelector('.dpad-right');

if(dpadUp) dpadUp.onclick = () => triggerKey('ArrowUp');
if(dpadDown) dpadDown.onclick = () => triggerKey('ArrowDown');
if(dpadLeft) dpadLeft.onclick = () => triggerKey('ArrowLeft');
if(dpadRight) dpadRight.onclick = () => triggerKey('ArrowRight');
