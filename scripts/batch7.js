// ========== BATCH 7 APPS ==========
// Fixed: All variables scoped with IIFE to prevent "already declared" conflicts
// Stopwatch, Pomodoro, Units, Tips, Speed Reader, BMI, Counter

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
    if (_swInterval) { clearInterval(_swInterval); _swInterval = null; }
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
        clearInterval(_swInterval);
        _swInterval = null;
        if (btn) btn.textContent = 'START';
    } else {
        const start = Date.now() - _swTime;
        _swInterval = setInterval(() => {
            _swTime = Date.now() - start;
            _swUpdate();
        }, 10);
        if (btn) btn.textContent = 'STOP';
    }
    sounds.click();
};

window.swReset = function() {
    if (_swInterval) { clearInterval(_swInterval); _swInterval = null; }
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
        clearInterval(_pomoInt);
        _pomoInt = null;
        if (btn) btn.textContent = 'RESUME';
    } else {
        _pomoInt = setInterval(() => {
            _pomoTime--;
            if (_pomoTime <= 0) {
                clearInterval(_pomoInt);
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


// ==================== 3. UNIT CONVERTER ====================

window.initUnit = function() {
    const screen = document.getElementById('unitScreen');
    if (!screen) return;

    screen.innerHTML = `
        <div style="padding: 20px; text-align: center; background: #9bbc0f;
             color: #0f380f; height: 100%; font-family: 'VT323', monospace;">
            <div style="font-size: 14px; border-bottom: 2px solid #0f380f; margin-bottom: 20px;">
                UNIT CONVERTER
            </div>
            <input type="number" id="unitVal" placeholder="VALUE"
                style="width: 100%; margin-bottom: 15px; font-size: 20px; padding: 5px;">
            <div style="display: flex; gap: 5px; margin-bottom: 20px;">
                <select id="unitType" onchange="unitUpdateType()" style="flex: 1;">
                    <option value="len">LENGTH</option>
                    <option value="wgt">WEIGHT</option>
                    <option value="tmp">TEMP</option>
                    <option value="spd">SPEED</option>
                    <option value="vol">VOLUME</option>
                </select>
            </div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;
                 font-size: 20px;">
                <span id="unitL1">M</span> ➜ <span id="unitL2">FT</span>
            </div>
            <button onclick="convertUnit()" style="width: 100%; padding: 15px; font-size: 18px;">
                CONVERT
            </button>
            <div id="unitRes" style="font-size: 30px; font-weight: bold; margin-top: 20px;">
                0.00
            </div>
        </div>
    `;
};

window.unitUpdateType = function() {
    const t  = document.getElementById('unitType')?.value;
    const l1 = document.getElementById('unitL1');
    const l2 = document.getElementById('unitL2');
    if (!l1 || !l2) return;
    const map = {
        len: ['M', 'FT'],
        wgt: ['KG', 'LBS'],
        tmp: ['°C', '°F'],
        spd: ['KM/H', 'MPH'],
        vol: ['L', 'GAL']
    };
    const labels = map[t] || ['?', '?'];
    l1.textContent = labels[0];
    l2.textContent = labels[1];
};

window.convertUnit = function() {
    const val = parseFloat(document.getElementById('unitVal')?.value);
    if (isNaN(val)) return;
    const t = document.getElementById('unitType')?.value;
    const conversions = {
        len: val * 3.28084,
        wgt: val * 2.20462,
        tmp: (val * 9 / 5) + 32,
        spd: val * 0.621371,
        vol: val * 0.264172
    };
    const res = conversions[t] ?? 0;
    const el = document.getElementById('unitRes');
    if (el) el.textContent = res.toFixed(2);
    sounds.launch();
};


// ==================== 4. TIP CALCULATOR ====================

window.initTip = function() {
    const screen = document.getElementById('tipScreen');
    if (!screen) return;

    screen.innerHTML = `
        <div style="padding: 20px; text-align: center; background: #9bbc0f;
             color: #0f380f; height: 100%; font-family: 'VT323', monospace;">
            <div style="font-size: 14px; border-bottom: 2px solid #0f380f; margin-bottom: 20px;">
                TIP CALCULATOR
            </div>
            <input type="number" id="tipBill" placeholder="BILL TOTAL ($)"
                style="width: 100%; margin-bottom: 10px; font-size: 20px; padding: 5px;">
            <input type="number" id="tipPeople" placeholder="SPLIT BETWEEN (optional)"
                style="width: 100%; margin-bottom: 15px; font-size: 14px; padding: 5px;">
            <div style="display: flex; gap: 5px; margin-bottom: 20px;">
                <button onclick="calcTip(15)" style="flex: 1; padding: 10px;">15%</button>
                <button onclick="calcTip(18)" style="flex: 1; padding: 10px;">18%</button>
                <button onclick="calcTip(20)" style="flex: 1; padding: 10px;">20%</button>
                <button onclick="calcTip(25)" style="flex: 1; padding: 10px;">25%</button>
            </div>
            <div style="background: rgba(0,0,0,0.1); padding: 15px; border-radius: 8px; text-align: left;">
                <div style="font-size: 12px;">
                    TIP: <span id="tipAmt" style="float: right;">$0.00</span>
                </div>
                <div style="font-size: 18px; font-weight: bold; margin-top: 10px;">
                    TOTAL: <span id="tipTotal" style="float: right;">$0.00</span>
                </div>
                <div id="tipSplit" style="font-size: 12px; margin-top: 10px;"></div>
            </div>
        </div>
    `;
};

window.calcTip = function(pct) {
    const bill    = parseFloat(document.getElementById('tipBill')?.value)   || 0;
    const people  = parseInt(document.getElementById('tipPeople')?.value)   || 1;
    const tip     = bill * (pct / 100);
    const total   = bill + tip;
    const perHead = total / people;

    const tipEl   = document.getElementById('tipAmt');
    const totEl   = document.getElementById('tipTotal');
    const splEl   = document.getElementById('tipSplit');

    if (tipEl) tipEl.textContent   = '$' + tip.toFixed(2);
    if (totEl) totEl.textContent   = '$' + total.toFixed(2);
    if (splEl) splEl.textContent   = people > 1
        ? `EACH PAYS: $${perHead.toFixed(2)}`
        : '';
    sounds.click();
};


// ==================== 5. SPEED READER ====================

let _speedInterval = null;
let _speedWords    = [];
let _speedIdx      = 0;

window.initSpeed = function() {
    const screen = document.getElementById('speedScreen');
    if (!screen) return;

    // Stop any existing reader
    if (_speedInterval) { clearInterval(_speedInterval); _speedInterval = null; }

    screen.style.cssText = 'display: flex; flex-direction: column; height: 100%; padding: 10px; box-sizing: border-box;';
    screen.innerHTML = `
        <div style="font-size: 14px; margin-bottom: 10px; border-bottom: 1px solid #333; text-align: center;">
            SPEED READER
        </div>
        <textarea id="speedInput" placeholder="PASTE TEXT HERE..."
            style="width: 100%; height: 60px; margin-bottom: 10px; font-size: 10px;
                   padding: 5px; flex-shrink: 0;"></textarea>
        <div id="speedDisplay"
            style="flex: 1; background: #000; color: #fff; display: flex; align-items: center;
                   justify-content: center; font-size: 24px; font-weight: bold;
                   margin-bottom: 10px; border: 2px solid #333; min-height: 100px;">
            READY
        </div>
        <div id="speedProgress" style="font-size: 10px; text-align: center; margin-bottom: 6px;"></div>
        <div style="display: flex; gap: 10px; justify-content: center; align-items: center;">
            <label style="font-size: 10px;">WPM:</label>
            <input type="number" id="speedWpm" value="300"
                style="width: 50px; font-size: 12px; padding: 2px; text-align: center;">
            <button onclick="toggleSpeed()" id="speedBtn" style="padding: 5px 15px; font-size: 12px;">
                START
            </button>
        </div>
    `;
};

window.toggleSpeed = function() {
    const btn  = document.getElementById('speedBtn');
    const disp = document.getElementById('speedDisplay');
    const prog = document.getElementById('speedProgress');

    if (_speedInterval) {
        clearInterval(_speedInterval);
        _speedInterval = null;
        if (btn) btn.textContent = 'START';
        return;
    }

    const text = document.getElementById('speedInput')?.value.trim();
    if (!text) return;

    _speedWords = text.split(/\s+/);
    _speedIdx   = 0;
    const wpm   = parseInt(document.getElementById('speedWpm')?.value) || 300;
    const delay = 60000 / wpm;

    if (btn) btn.textContent = 'STOP';
    sounds.click();

    _speedInterval = setInterval(() => {
        if (_speedIdx >= _speedWords.length) {
            clearInterval(_speedInterval);
            _speedInterval = null;
            if (btn)  btn.textContent  = 'START';
            if (disp) disp.textContent = 'DONE';
            if (prog) prog.textContent = '';
        } else {
            if (disp) disp.textContent = _speedWords[_speedIdx];
            if (prog) prog.textContent = `${_speedIdx + 1} / ${_speedWords.length}`;
            _speedIdx++;
        }
    }, delay);
};


// ==================== 6. BMI CALCULATOR ====================

window.initBmi = function() {
    const screen = document.getElementById('bmiScreen');
    if (!screen) return;

    screen.innerHTML = `
        <div style="padding: 20px; text-align: center; background: #9bbc0f;
             color: #0f380f; height: 100%; font-family: 'VT323', monospace;">
            <div style="font-size: 14px; border-bottom: 2px solid #0f380f; margin-bottom: 20px;">
                BMI CALCULATOR
            </div>
            <input type="number" id="bmiW" placeholder="WEIGHT (KG)"
                style="width: 100%; margin-bottom: 10px; padding: 5px; font-size: 16px;">
            <input type="number" id="bmiH" placeholder="HEIGHT (CM)"
                style="width: 100%; margin-bottom: 15px; padding: 5px; font-size: 16px;">
            <button onclick="calcBmi()" style="width: 100%; padding: 10px; margin-bottom: 20px; font-size: 16px;">
                CALCULATE
            </button>
            <div id="bmiRes"  style="font-size: 40px; font-weight: bold;">--.-</div>
            <div id="bmiCat"  style="font-size: 14px; margin-top: 5px;">ENTER DETAILS</div>
            <div id="bmiBar"  style="margin-top: 15px; height: 12px; border-radius: 6px;
                 background: linear-gradient(to right, #4fc3f7, #66bb6a, #ffca28, #ef5350);
                 position: relative;">
                <div id="bmiMarker"
                    style="position: absolute; top: -4px; width: 4px; height: 20px;
                           background: #000; display: none;"></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 8px; margin-top: 3px;">
                <span>16</span><span>18.5</span><span>25</span><span>30</span><span>40</span>
            </div>
        </div>
    `;
};

window.calcBmi = function() {
    const w = parseFloat(document.getElementById('bmiW')?.value);
    const h = parseFloat(document.getElementById('bmiH')?.value) / 100;
    if (!w || !h || h <= 0) return;

    const bmi = w / (h * h);
    const res = document.getElementById('bmiRes');
    const cat = document.getElementById('bmiCat');
    const bar = document.getElementById('bmiMarker');

    if (res) res.textContent = bmi.toFixed(1);

    let category = '', color = '';
    if (bmi < 18.5)      { category = 'UNDERWEIGHT'; color = '#4fc3f7'; }
    else if (bmi < 25)   { category = '✅ NORMAL';    color = '#66bb6a'; }
    else if (bmi < 30)   { category = 'OVERWEIGHT';   color = '#ffca28'; }
    else                 { category = 'OBESE';         color = '#ef5350'; }

    if (cat) { cat.textContent = category; cat.style.color = color; }

    // Position marker on gradient bar
    if (bar) {
        const clamped = Math.max(16, Math.min(40, bmi));
        const pct     = ((clamped - 16) / (40 - 16)) * 100;
        bar.style.left    = `calc(${pct}% - 2px)`;
        bar.style.display = 'block';
    }

    sounds.coin();
};


// ==================== 7. MULTI-COUNTER ====================

let _counters = [0, 0, 0];

window.initCounter = function() {
    const screen = document.getElementById('counterScreen');
    if (!screen) return;

    screen.innerHTML = `
        <div style="padding: 10px; text-align: center;">
            <div style="font-size: 14px; margin-bottom: 20px;">MULTI-COUNTER</div>
            ${[0, 1, 2].map(i => `
                <div style="display: flex; align-items: center; margin-bottom: 15px;
                     background: rgba(0,0,0,0.05); padding: 10px; border-radius: 8px;">
                    <div style="flex: 1; font-size: 28px; font-weight: bold;" id="cnt${i}">
                        ${_counters[i]}
                    </div>
                    <div style="display: flex; gap: 5px;">
                        <button onclick="modCounter(${i}, -1)" style="width: 35px; height: 35px; font-size: 20px;">−</button>
                        <button onclick="modCounter(${i},  1)" style="width: 35px; height: 35px; font-size: 20px;">+</button>
                        <button onclick="modCounter(${i},  0)"
                            style="width: 35px; height: 35px; background: #c00; color: #fff; font-size: 12px;">RST</button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
};

window.modCounter = function(idx, val) {
    if (val === 0) _counters[idx] = 0;
    else           _counters[idx] += val;
    const el = document.getElementById(`cnt${idx}`);
    if (el) el.textContent = _counters[idx];
    sounds[val !== 0 ? 'click' : 'back']();
};

})(); // <-- IIFE END