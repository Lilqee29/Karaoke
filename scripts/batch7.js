// ========== BATCH 7 APPS ==========
// Fixed: All variables scoped with IIFE to prevent "already declared" conflicts
// Stopwatch, Pomodoro

(function() { // <-- IIFE START: all vars below are local, no global conflicts

// ==================== 1. STOPWATCH (CHRONO) ====================
// Renamed: swInterval → _swInterval, swTime → _swTime, swLaps → _swLaps
// to avoid collision with any existing stopwatch vars in other files.

let _swInterval = null;
let _swTime = 0;
let _swLaps = [];

window.initStopwatch = function() {
    const screen = document.getElementById('stopwatchScreen');
    if (!screen) return;

    // Clear any running interval from previous launch
    if (_swInterval) { intervalManager.clear(_swInterval); _swInterval = null; }
    _swTime = 0;
    _swLaps = [];

    screen.innerHTML = `
        <div style="padding: 20px; text-align: center; font-family: 'VT323', monospace;">
            <div style="font-size: 40px; margin-bottom: 20px;" id="swDisplay">00:00.00</div>
            <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                <button onclick="swToggle()" id="swBtn" style="flex: 1; padding: 10px;">START</button>
                <button onclick="swLap()"    style="flex: 1; padding: 10px;">LAP</button>
                <button onclick="swReset()"  style="flex: 1; padding: 10px;">RESET</button>
            </div>
            <div id="swLaps" style="height: 150px; overflow-y: auto; text-align: left;
                 font-size: 10px; border-top: 2px solid #333; padding-top: 10px;"></div>
        </div>
    `;
    _swUpdate();
};

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
    div.textContent = `#${_swLaps.length} - ${_formatTime(_swTime)}`;
    div.style.borderBottom = '1px solid #ccc';
    lapsEl.prepend(div);
    sounds.coin();
};

function _swUpdate() {
    const d = document.getElementById('swDisplay');
    if (d) d.textContent = _formatTime(_swTime);
}

function _formatTime(ms) {
    const m  = Math.floor(ms / 60000);
    const s  = Math.floor((ms % 60000) / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    return `${_pad(m)}:${_pad(s)}.${_pad(cs)}`;
}

// Private pad — won't clash with global pad() in system.js
function _pad(n) { return n.toString().padStart(2, '0'); }


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
