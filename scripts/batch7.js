// ========== BATCH 7 APPS ==========
// Stopwatch, Pomodoro, Units, Tips, Speed Reader, BMI, Counter

// 1. STOPWATCH (CHRONO)
let swInterval = null;
let swTime = 0;
let swLaps = [];

window.initStopwatch = function() {
    const screen = document.getElementById('stopwatchScreen');
    if(!screen) return;
    
    screen.innerHTML = `
        <div style="padding: 20px; text-align: center; font-family: 'VT323', monospace;">
            <div style="font-size: 40px; margin-bottom: 20px;" id="swDisplay">00:00.00</div>
            <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                <button onclick="swToggle()" id="swBtn" style="flex: 1; padding: 10px;">START</button>
                <button onclick="swLap()" style="flex: 1; padding: 10px;">LAP</button>
                <button onclick="swReset()" style="flex: 1; padding: 10px;">RESET</button>
            </div>
            <div id="swLaps" style="height: 150px; overflow-y: auto; text-align: left; font-size: 10px; border-top: 2px solid #333; padding-top: 10px;"></div>
        </div>
    `;
    swUpdate();
};

window.swToggle = function() {
    const btn = document.getElementById('swBtn');
    if(swInterval) {
        clearInterval(swInterval);
        swInterval = null;
        btn.textContent = "START";
    } else {
        const start = Date.now() - swTime;
        swInterval = setInterval(() => {
            swTime = Date.now() - start;
            swUpdate();
        }, 10);
        btn.textContent = "STOP";
    }
    sounds.click();
};

window.swReset = function() {
    if(swInterval) clearInterval(swInterval);
    swInterval = null;
    swTime = 0;
    swLaps = [];
    swUpdate();
    document.getElementById('swLaps').innerHTML = '';
    document.getElementById('swBtn').textContent = "START";
    sounds.back();
};

window.swLap = function() {
    if(!swInterval) return;
    swLaps.unshift(swTime);
    const div = document.createElement('div');
    div.textContent = `#${swLaps.length} - ${formatTime(swTime)}`;
    div.style.borderBottom = "1px solid #ccc";
    document.getElementById('swLaps').prepend(div);
    sounds.coin();
};

function swUpdate() {
    const d = document.getElementById('swDisplay');
    if(d) d.textContent = formatTime(swTime);
}

function formatTime(ms) {
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const cs = Math.floor((ms % 1000) / 10);
    return `${pad(m)}:${pad(s)}.${pad(cs)}`;
}
function pad(n) { return n.toString().padStart(2, '0'); }


// 2. POMODORO (POMO)
let pomoTime = 25 * 60;
let pomoInt = null;
let isBreak = false;

window.initPomo = function() {
    const screen = document.getElementById('pomoScreen');
    if(!screen) return;
    
    screen.innerHTML = `
        <div style="padding: 20px; text-align: center; height: 100%; display: flex; flex-direction: column; justify-content: center; background: #d32f2f; color: #fff;">
            <div style="font-size: 14px; margin-bottom: 20px;">${isBreak ? '☕ BREAK TIME' : '🍅 FOCUS TIME'}</div>
            <div id="pomoDisplay" style="font-size: 60px; font-weight: bold; margin-bottom: 30px;">25:00</div>
            <button onclick="togglePomo()" id="pomoBtn" style="background: #fff; color: #d32f2f; border: none; padding: 15px; font-size: 20px; border-radius: 50px;">START</button>
            <div style="margin-top: 20px; font-size: 8px; opacity: 0.8;">WORK 25m • BREAK 5m</div>
        </div>
    `;
    updatePomoDisplay();
};

window.togglePomo = function() {
    const btn = document.getElementById('pomoBtn');
    if(pomoInt) {
        clearInterval(pomoInt);
        pomoInt = null;
        btn.textContent = "RESUME";
    } else {
        pomoInt = setInterval(() => {
            pomoTime--;
            if(pomoTime <= 0) {
                clearInterval(pomoInt);
                pomoInt = null;
                isBreak = !isBreak;
                pomoTime = isBreak ? 5 * 60 : 25 * 60;
                sounds.coin();
                alert(isBreak ? "TIME FOR A BREAK!" : "BACK TO WORK!");
                initPomo(); // Refresh UI
            } else {
                updatePomoDisplay();
            }
        }, 1000);
        btn.textContent = "PAUSE";
    }
    sounds.click();
};

function updatePomoDisplay() {
    const d = document.getElementById('pomoDisplay');
    if(!d) return;
    const m = Math.floor(pomoTime / 60);
    const s = pomoTime % 60;
    d.textContent = `${pad(m)}:${pad(s)}`;
}


// 3. UNIT CONVERTER
window.initUnit = function() {
    const screen = document.getElementById('unitScreen');
    if(!screen) return;
    screen.innerHTML = `
        <div style="padding: 20px; text-align: center; background: #9bbc0f; color: #0f380f; height: 100%; font-family: 'VT323', monospace;">
            <div style="font-size: 14px; border-bottom: 2px solid #0f380f; margin-bottom: 20px;">UNIT CONVERTER</div>
            <input type="number" id="unitVal" placeholder="VALUE" style="width: 100%; margin-bottom: 15px; font-size: 20px; padding: 5px;">
            <div style="display: flex; gap: 5px; margin-bottom: 20px;">
                <select id="unitType" onchange="unitUpdateType()" style="flex: 1;">
                    <option value="len">LENGTH</option>
                    <option value="wgt">WEIGHT</option>
                    <option value="tmp">TEMP</option>
                </select>
            </div>
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 20px;">
                <span id="unitL1">M</span> ➜ <span id="unitL2">FT</span>
            </div>
            <button onclick="convertUnit()" style="width: 100%; padding: 15px; font-size: 18px;">CONVERT</button>
            <div id="unitRes" style="font-size: 30px; font-weight: bold; margin-top: 20px;">0.00</div>
        </div>
    `;
};

window.unitUpdateType = function() {
    const t = document.getElementById('unitType').value;
    const l1 = document.getElementById('unitL1');
    const l2 = document.getElementById('unitL2');
    if(t === 'len') { l1.textContent = 'M'; l2.textContent = 'FT'; }
    if(t === 'wgt') { l1.textContent = 'KG'; l2.textContent = 'LBS'; }
    if(t === 'tmp') { l1.textContent = '°C'; l2.textContent = '°F'; }
};

window.convertUnit = function() {
    const val = parseFloat(document.getElementById('unitVal').value);
    if(isNaN(val)) return;
    const t = document.getElementById('unitType').value;
    let res = 0;
    
    if(t === 'len') res = val * 3.28084; // m to ft
    if(t === 'wgt') res = val * 2.20462; // kg to lbs
    if(t === 'tmp') res = (val * 9/5) + 32; // C to F
    
    document.getElementById('unitRes').textContent = res.toFixed(2);
    sounds.launch();
};


// 4. TIP CALCULATOR
window.initTip = function() {
    const screen = document.getElementById('tipScreen');
    if(!screen) return;
    screen.innerHTML = `
        <div style="padding: 20px; text-align: center; background: #9bbc0f; color: #0f380f; height: 100%; font-family: 'VT323', monospace;">
            <div style="font-size: 14px; border-bottom: 2px solid #0f380f; margin-bottom: 20px;">TIP CALCULATOR</div>
            <input type="number" id="tipBill" placeholder="BILL TOTAL ($)" style="width: 100%; margin-bottom: 15px; font-size: 20px; padding: 5px;">
            <div style="display: flex; gap: 5px; margin-bottom: 20px;">
                <button onclick="calcTip(15)" style="flex: 1; padding: 10px;">15%</button>
                <button onclick="calcTip(18)" style="flex: 1; padding: 10px;">18%</button>
                <button onclick="calcTip(20)" style="flex: 1; padding: 10px;">20%</button>
            </div>
            <div style="background: rgba(0,0,0,0.1); padding: 15px; border-radius: 8px; text-align: left;">
                <div style="font-size: 12px;">TIP: <span id="tipAmt" style="float: right;">$0.00</span></div>
                <div style="font-size: 18px; font-weight: bold; margin-top: 10px;">TOTAL: <span id="tipTotal" style="float: right;">$0.00</span></div>
            </div>
        </div>
    `;
};

window.calcTip = function(pct) {
    const bill = parseFloat(document.getElementById('tipBill').value) || 0;
    const tip = bill * (pct / 100);
    const total = bill + tip;
    document.getElementById('tipAmt').textContent = '$' + tip.toFixed(2);
    document.getElementById('tipTotal').textContent = '$' + total.toFixed(2);
    sounds.click();
};


// 5. SPEED READER
let speedInterval = null;
let speedWords = [];
let speedIdx = 0;

window.initSpeed = function() {
    const screen = document.getElementById('speedScreen');
    if(!screen) return;
    
    // Reset and apply robust flex styles
    screen.style.cssText = "display: flex; flex-direction: column; height: 100%; padding: 10px; box-sizing: border-box;";
    
    screen.innerHTML = `
        <div style="font-size: 14px; margin-bottom: 10px; border-bottom: 1px solid #333; text-align: center;">SPEED READER</div>
        
        <textarea id="speedInput" placeholder="PASTE TEXT HERE..." style="width: 100%; height: 60px; margin-bottom: 10px; font-size: 10px; padding: 5px; flex-shrink: 0;"></textarea>
        
        <div id="speedDisplay" style="flex: 1; background: #000; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: bold; margin-bottom: 10px; border: 2px solid #333; min-height: 100px;">
            READY
        </div>
        
        <div style="display: flex; gap: 10px; justify-content: center; align-items: center; min-height: 30px;">
            <label style="font-size: 10px;">WPM:</label>
            <input type="number" id="speedWpm" value="300" style="width: 50px; font-size: 12px; padding: 2px; text-align: center;">
            <button onclick="toggleSpeed()" id="speedBtn" style="padding: 5px 15px; font-size: 12px;">START</button>
        </div>
    `;
};

window.toggleSpeed = function() {
    const btn = document.getElementById('speedBtn');
    const disp = document.getElementById('speedDisplay');
    
    if(speedInterval) {
        clearInterval(speedInterval);
        speedInterval = null;
        btn.textContent = "START";
        return;
    }
    
    const text = document.getElementById('speedInput').value.trim();
    if(!text) return;
    
    speedWords = text.split(/\s+/);
    speedIdx = 0;
    const wpm = parseInt(document.getElementById('speedWpm').value) || 300;
    const delay = 60000 / wpm;
    
    btn.textContent = "STOP";
    sounds.click();
    
    speedInterval = setInterval(() => {
        if(speedIdx >= speedWords.length) {
            clearInterval(speedInterval);
            speedInterval = null;
            btn.textContent = "START";
            disp.textContent = "DONE";
        } else {
            disp.textContent = speedWords[speedIdx++];
        }
    }, delay);
};


// 6. BMI CALCULATOR
window.initBmi = function() {
    const screen = document.getElementById('bmiScreen');
    if(!screen) return;
    screen.innerHTML = `
        <div style="padding: 20px; text-align: center; background: #9bbc0f; color: #0f380f; height: 100%; font-family: 'VT323', monospace;">
            <div style="font-size: 14px; border-bottom: 2px solid #0f380f; margin-bottom: 20px;">BMI CALCULATOR</div>
            <input type="number" id="bmiW" placeholder="WEIGHT (KG)" style="width: 100%; margin-bottom: 10px; padding: 5px;">
            <input type="number" id="bmiH" placeholder="HEIGHT (CM)" style="width: 100%; margin-bottom: 15px; padding: 5px;">
            <button onclick="calcBmi()" style="width: 100%; padding: 10px; margin-bottom: 20px;">CALCULATE</button>
            <div id="bmiRes" style="font-size: 30px; font-weight: bold;">--.-</div>
            <div id="bmiCat" style="font-size: 12px; margin-top: 5px;">ENTER DETAILS</div>
        </div>
    `;
};

window.calcBmi = function() {
    const w = parseFloat(document.getElementById('bmiW').value);
    const h = parseFloat(document.getElementById('bmiH').value) / 100; // cm to m
    if(!w || !h) return;
    
    const bmi = w / (h * h);
    document.getElementById('bmiRes').textContent = bmi.toFixed(1);
    
    let cat = "";
    if(bmi < 18.5) cat = "UNDERWEIGHT";
    else if(bmi < 25) cat = "NORMAL";
    else if(bmi < 30) cat = "OVERWEIGHT";
    else cat = "OBESE";
    
    document.getElementById('bmiCat').textContent = cat;
    sounds.coin();
};


// 7. COUNTER
let counters = [0, 0, 0];
window.initCounter = function() {
    const screen = document.getElementById('counterScreen');
    if(!screen) return;
    
    screen.innerHTML = `
        <div style="padding: 10px; text-align: center;">
            <div style="font-size: 14px; margin-bottom: 20px;">MULTI-COUNTER</div>
            ${[0,1,2].map(i => `
                <div style="display: flex; align-items: center; margin-bottom: 15px; background: rgba(0,0,0,0.05); padding: 10px; border-radius: 8px;">
                    <div style="flex: 1; font-size: 24px; font-weight: bold;" id="cnt${i}">${counters[i]}</div>
                    <div style="display: flex; gap: 5px;">
                        <button onclick="modCounter(${i}, -1)" style="width: 30px; height: 30px;">-</button>
                        <button onclick="modCounter(${i}, 1)" style="width: 30px; height: 30px;">+</button>
                        <button onclick="modCounter(${i}, 0)" style="width: 30px; height: 30px; background: #f00; color: #fff;">C</button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
};

window.modCounter = function(idx, val) {
    if(val === 0) counters[idx] = 0;
    else counters[idx] += val;
    document.getElementById(`cnt${idx}`).textContent = counters[idx];
    if(val !== 0) sounds.click();
    else sounds.back();
};
