// ========== BATCH 7 APPS ==========
// Fixed: All variables scoped with IIFE to prevent "already declared" conflicts
// Merged Timer+Stopwatch, Pomodoro

(function() { // <-- IIFE START: all vars below are local, no global conflicts

// ==================== 1. STOPWATCH (CHRONO) ====================
let _swInterval = null;
let _swTime = 0;
let _swLaps = [];

window.swToggle = function() {
    const btn = document.getElementById('swBtn');
    if (_swInterval) {
        intervalManager.clear(_swInterval);
        _swInterval = null;
        if (btn) btn.textContent = 'START';
    } else {
        const start = Date.now() - _swTime;
        _swInterval = intervalManager.set(() => {
            _swTime = Date.now() - start;
            _swUpdate();
        }, 10);
        if (btn) btn.textContent = 'STOP';
    }
    sounds.click();
};

window.swReset = function() {
    if (_swInterval) { intervalManager.clear(_swInterval); _swInterval = null; }
    _swTime = 0;
    _swLaps = [];
    _swUpdate();
    const lapsEl = document.getElementById('swLaps');
    if (lapsEl) lapsEl.innerHTML = '';
    const btn = document.getElementById('swBtn');
    if (btn) btn.textContent = 'START';
    sounds.back();
};

window.swLap = function() {
    if (!_swInterval) return;
    _swLaps.unshift(_swTime);
    const lapsEl = document.getElementById('swLaps');
    if (!lapsEl) return;
    const div = document.createElement('div');
    div.textContent = `#${_swLaps.length} - ${_swFormatTime(_swTime)}`;
    div.style.borderBottom = '1px solid #ccc';
    sounds.coin();
};

function _swUpdate() {
    const d = document.getElementById('swDisplay');
    if (d) d.textContent = _swFormatTime(_swTime);
}

function _swFormatTime(ms) {
    const m  = Math.floor(ms / 60000);
    const s  = Math.floor((ms % 60000) / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    return `${_swPad(m)}:${_swPad(s)}.${_swPad(cs)}`;
}

function _swPad(n) { return n.toString().padStart(2, '0'); }
var _pad = _swPad;

// ==================== 1b. TAB SWITCHING ====================
let _currentTimerTab = 'timer';
let _tmTime = 0;
let _tmInterval = null;
let _tmTotalTime = 0;

window.switchTimerTab = function(tab) {
    _currentTimerTab = tab;
    document.getElementById('timerTimerTab').style.display = tab === 'timer' ? 'flex' : 'none';
    document.getElementById('timerStopwatchTab').style.display = tab === 'stopwatch' ? 'flex' : 'none';
    document.getElementById('timerTabBtn').style.background = tab === 'timer' ? 'var(--gb-text)' : 'transparent';
    document.getElementById('timerTabBtn').style.color = tab === 'timer' ? 'var(--gb-bg)' : 'var(--gb-text)';
    document.getElementById('stopwatchTabBtn').style.background = tab === 'stopwatch' ? 'var(--gb-text)' : 'transparent';
    document.getElementById('stopwatchTabBtn').style.color = tab === 'stopwatch' ? 'var(--gb-bg)' : 'var(--gb-text)';
    sounds.click();
};

window.setTimer = function(m) {
    if (_tmInterval) return;
    _tmTime += m * 60;
    _tmTotalTime = _tmTime;
    _tmUpdateDisplay();
    _tmUpdateRing();
    sounds.click();
};

window.startTimer = function() {
    if (_tmInterval) {
        clearInterval(_tmInterval);
        _tmInterval = null;
        document.getElementById('tmBtn').textContent = 'RESUME';
        return;
    }
    if (_tmTime <= 0) return;
    _tmTotalTime = _tmTime;
    document.getElementById('tmBtn').textContent = 'PAUSE';
    _tmInterval = setInterval(() => {
        _tmTime--;
        _tmUpdateDisplay();
        _tmUpdateRing();
        if (_tmTime <= 0) {
            clearInterval(_tmInterval);
            _tmInterval = null;
            document.getElementById('tmBtn').textContent = 'START';
            sounds.launch();
        }
    }, 1000);
    sounds.coin();
};

window.resetTimer = function() {
    clearInterval(_tmInterval);
    _tmInterval = null;
    _tmTime = 0;
    _tmTotalTime = 0;
    _tmUpdateDisplay();
    _tmUpdateRing();
    document.getElementById('tmBtn').textContent = 'START';
    sounds.back();
};

function _tmUpdateDisplay() {
    const el = document.getElementById('tmDisplay');
    if (!el) return;
    const m = Math.floor(_tmTime / 60);
    const s = _tmTime % 60;
    el.textContent = `${_swPad(m)}:${_swPad(s)}`;
}

function _tmUpdateRing() {
    const ring = document.getElementById('timerProgress');
    if (!ring) return;
    const circumference = 2 * Math.PI * 52;
    const pct = _tmTotalTime > 0 ? _tmTime / _tmTotalTime : 1;
    ring.setAttribute('stroke-dashoffset', circumference * (1 - pct));
}

window.initTimer = function() {
    _tmUpdateDisplay();
    _tmUpdateRing();
    _swUpdate();
};

// ==================== 2. POMODORO (POMO) ====================

let _pomoTime = 25 * 60;
let _pomoInt  = null;
let _isBreak  = false;

window.initPomo = function() {
    const screen = document.getElementById('pomoScreen');
    if (!screen) return;

    screen.innerHTML = `
        <div style="padding: 20px; text-align: center; height: 100%; display: flex;
             flex-direction: column; justify-content: center;
             background: #d32f2f; color: #fff;">
            <div style="font-size: 14px; margin-bottom: 20px;">
                ${_isBreak ? '☕ BREAK TIME' : '🍅 FOCUS TIME'}
            </div>
            <div id="pomoDisplay" style="font-size: 60px; font-weight: bold; margin-bottom: 30px;">
                ${_pad(Math.floor(_pomoTime / 60))}:${_pad(_pomoTime % 60)}
            </div>
            <button onclick="togglePomo()" id="pomoBtn"
                style="background: #fff; color: #d32f2f; border: none;
                       padding: 15px; font-size: 20px; border-radius: 50px; cursor: pointer;">
                ${_pomoInt ? 'PAUSE' : 'START'}
            </button>
            <div style="margin-top: 20px; font-size: 8px; opacity: 0.8;">
                WORK 25m • BREAK 5m
            </div>
        </div>
    `;
};

window.togglePomo = function() {
    const btn = document.getElementById('pomoBtn');
    if (_pomoInt) {
        intervalManager.clear(_pomoInt);
        _pomoInt = null;
        if (btn) btn.textContent = 'RESUME';
    } else {
        _pomoInt = intervalManager.set(() => {
            _pomoTime--;
            if (_pomoTime <= 0) {
                intervalManager.clear(_pomoInt);
                _pomoInt = null;
                _isBreak = !_isBreak;
                _pomoTime = _isBreak ? 5 * 60 : 25 * 60;
                sounds.coin();
                alert(_isBreak ? 'TIME FOR A BREAK!' : 'BACK TO WORK!');
                window.initPomo(); // Refresh UI
            } else {
                _updatePomoDisplay();
            }
        }, 1000);
        if (btn) btn.textContent = 'PAUSE';
    }
    sounds.click();
};

function _updatePomoDisplay() {
    const d = document.getElementById('pomoDisplay');
    if (!d) return;
    const m = Math.floor(_pomoTime / 60);
    const s = _pomoTime % 60;
    d.textContent = `${_pad(m)}:${_pad(s)}`;
}

})(); // <-- IIFE END
