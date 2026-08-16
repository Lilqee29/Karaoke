// ========== UTILITIES EXPANDED (10 New Apps) ==========

// 1. BMI CALCULATOR
window.initBmi = function() {
    const _el = document.getElementById('bmiResult'); if(_el) if(_el) _el.textContent = "---";
};
window.calcBmi = function() {
    const h = parseFloat(document.getElementById('bmiHeight').value) / 100;
    const w = parseFloat(document.getElementById('bmiWeight').value);
    if(h > 0 && w > 0) {
        const bmi = (w / (h * h)).toFixed(1);
        const _el = document.getElementById('bmiResult'); if(_el) if(_el) _el.textContent = bmi;
        sounds.coin();
    }
};

// 2. UNIT CONVERTER
window.initUnit = function() {
    document.getElementById('unitOutput').value = "";
};
window.convertUnit = function() {
    const val = parseFloat(document.getElementById('unitInput').value);
    const mode = document.getElementById('unitMode').value;
    let res = 0;
    if(mode === 'ck') res = val + 273.15; // C to K
    if(mode === 'kc') res = val - 273.15; // K to C
    if(mode === 'mf') res = val * 3.28084; // M to Ft
    if(mode === 'fm') res = val / 3.28084; // Ft to M
    if(mode === 'kl') res = val * 2.20462; // Kg to Lb
    if(mode === 'lk') res = val / 2.20462; // Lb to Kg
    document.getElementById('unitOutput').value = res.toFixed(2);
    sounds.click();
};

// 3. PASSWORD GENERATOR
window.initPass = function() {
    const _el = document.getElementById('passDisplay'); if(_el) if(_el) _el.textContent = "P@SSWORD";
};
window.genPass = function() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let pass = "";
    for(let i=0; i<12; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    const _el = document.getElementById('passDisplay'); if(_el) if(_el) _el.textContent = pass;
    sounds.coin();
};

// 4. POMODORO TIMER
let pomoTime = 1500; // 25 min
let pomoInt = null;
window.initPomo = function() {
    pomoTime = 1500;
    updatePomoDisplay();
};
window.togglePomo = function() {
    if(pomoInt) {
        clearInterval(pomoInt);
        pomoInt = null;
        const _el = document.getElementById('pomoBtn'); if(_el) if(_el) _el.textContent = "START";
    } else {
        pomoInt = setInterval(() => {
            pomoTime--;
            updatePomoDisplay();
            if(pomoTime <= 0) {
                clearInterval(pomoInt);
                pomoInt = null;
                sounds.launch();
                alert("POMODORO FINISHED!");
            }
        }, 1000);
        const _el = document.getElementById('pomoBtn'); if(_el) if(_el) _el.textContent = "PAUSE";
    }
    sounds.click();
};
function updatePomoDisplay() {
    const m = Math.floor(pomoTime / 60);
    const s = pomoTime % 60;
    const _el = document.getElementById('pomoDisplay'); if(_el) if(_el) _el.textContent = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}

// 5. TIP CALCULATOR
window.initTip = function() {
    const _el = document.getElementById('tipResult'); if(_el) if(_el) _el.textContent = "$0.00";
};
window.calcTip = function() {
    const bill = parseFloat(document.getElementById('tipBill').value);
    const pct = parseFloat(document.getElementById('tipPct').value);
    if(bill > 0) {
        const total = bill * (1 + pct/100);
        const _el = document.getElementById('tipResult'); if(_el) if(_el) _el.textContent = "$" + total.toFixed(2);
        sounds.coin();
    }
};

// 6. BINARY CONVERTER
window.initBin = function() {
    document.getElementById('binOutput').value = "";
};
window.convertBin = function() {
    const input = document.getElementById('binInput').value;
    const mode = document.getElementById('binMode').value;
    let res = "";
    try {
        if(mode === 'tb') {
            res = input.split('').map(c => c.charCodeAt(0).toString(2).padStart(8,'0')).join(' ');
        } else {
            res = input.split(' ').map(b => String.fromCharCode(parseInt(b, 2))).join('');
        }
        document.getElementById('binOutput').value = res;
    } catch(e) { document.getElementById('binOutput').value = "ERROR"; }
    sounds.click();
};

// 7. WATER TRACKER
let waterCount = 0;
window.initWater = function() {
    waterCount = parseInt(localStorage.getItem('gbos_water') || "0");
    updateWaterUI();
};
window.addWater = function() {
    waterCount++;
    localStorage.setItem('gbos_water', waterCount);
    updateWaterUI();
    sounds.coin();
};
window.resetWater = function() {
    waterCount = 0;
    localStorage.setItem('gbos_water', 0);
    updateWaterUI();
    sounds.back();
};
function updateWaterUI() {
    const waterEl = document.getElementById('waterCount');
    if (waterEl) if(waterEl) waterEl.textContent = waterCount + " GLASSES";
}

// 8. BMR CALCULATOR (Mifflin-St Jeor)
window.initBmr = function() {
    const _el = document.getElementById('bmrResult'); if(_el) if(_el) _el.textContent = "---";
};
window.calcBmr = function() {
    const w = parseFloat(document.getElementById('bmrW').value);
    const h = parseFloat(document.getElementById('bmrH').value);
    const a = parseFloat(document.getElementById('bmrA').value);
    const g = document.getElementById('bmrG').value;
    if(w && h && a) {
        let bmr = (10 * w) + (6.25 * h) - (5 * a);
        bmr = (g === 'm') ? bmr + 5 : bmr - 161;
        const _el = document.getElementById('bmrResult'); if(_el) if(_el) _el.textContent = Math.round(bmr) + " KCAL";
        sounds.coin();
    }
};

// 9. COMPOUND INTEREST
window.initInt = function() {
    const _el = document.getElementById('intResult'); if(_el) if(_el) _el.textContent = "$0.00";
};
window.calcInt = function() {
    const p = parseFloat(document.getElementById('intP').value);
    const r = parseFloat(document.getElementById('intR').value) / 100;
    const t = parseFloat(document.getElementById('intT').value);
    if(p && t) {
        const a = p * Math.pow(1 + r, t);
        const _el = document.getElementById('intResult'); if(_el) if(_el) _el.textContent = "$" + a.toFixed(2);
        sounds.coin();
    }
};

// 10. METRONOME
let metroInt = null;
let metroBpm = 120;
window.initMetro = function() {
    const _el = document.getElementById('metroBpmDisplay'); if(_el) if(_el) _el.textContent = metroBpm + " BPM";
};
window.toggleMetro = function() {
    if(metroInt) {
        clearInterval(metroInt);
        metroInt = null;
        const _el = document.getElementById('metroBtn'); if(_el) if(_el) _el.textContent = "START";
    } else {
        metroInt = setInterval(() => {
            playSound(800, 'square', 0.05); // Tick
        }, 60000 / metroBpm);
        const _el = document.getElementById('metroBtn'); if(_el) if(_el) _el.textContent = "STOP";
    }
    sounds.click();
};
window.adjMetro = function(delta) {
    metroBpm = Math.min(240, Math.max(40, metroBpm + delta));
    const _el = document.getElementById('metroBpmDisplay'); if(_el) if(_el) _el.textContent = metroBpm + " BPM";
    if(metroInt) {
        clearInterval(metroInt);
        metroInt = setInterval(() => playSound(800, 'square', 0.05), 60000 / metroBpm);
    }
    sounds.click();
};
