// ========== UTILITIES EXPANDED (10 New Apps) ==========

// 1. BMI CALCULATOR
window.initBmi = function() {
    document.getElementById('bmiResult').textContent = "---";
};
window.calcBmi = function() {
    const h = parseFloat(document.getElementById('bmiHeight').value) / 100;
    const w = parseFloat(document.getElementById('bmiWeight').value);
    if(h > 0 && w > 0) {
        const bmi = (w / (h * h)).toFixed(1);
        document.getElementById('bmiResult').textContent = bmi;
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
    document.getElementById('passDisplay').textContent = "P@SSWORD";
};
window.genPass = function() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let pass = "";
    for(let i=0; i<12; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
    document.getElementById('passDisplay').textContent = pass;
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
        document.getElementById('pomoBtn').textContent = "START";
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
        document.getElementById('pomoBtn').textContent = "PAUSE";
    }
    sounds.click();
};
function updatePomoDisplay() {
    const m = Math.floor(pomoTime / 60);
    const s = pomoTime % 60;
    document.getElementById('pomoDisplay').textContent = `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
}

// 5. TIP CALCULATOR
window.initTip = function() {
    document.getElementById('tipResult').textContent = "$0.00";
};
window.calcTip = function() {
    const bill = parseFloat(document.getElementById('tipBill').value);
    const pct = parseFloat(document.getElementById('tipPct').value);
    if(bill > 0) {
        const total = bill * (1 + pct/100);
        document.getElementById('tipResult').textContent = "$" + total.toFixed(2);
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
    document.getElementById('waterCount').textContent = waterCount + " GLASSES";
}

// 8. BMR CALCULATOR (Mifflin-St Jeor)
window.initBmr = function() {
    document.getElementById('bmrResult').textContent = "---";
};
window.calcBmr = function() {
    const w = parseFloat(document.getElementById('bmrW').value);
    const h = parseFloat(document.getElementById('bmrH').value);
    const a = parseFloat(document.getElementById('bmrA').value);
    const g = document.getElementById('bmrG').value;
    if(w && h && a) {
        let bmr = (10 * w) + (6.25 * h) - (5 * a);
        bmr = (g === 'm') ? bmr + 5 : bmr - 161;
        document.getElementById('bmrResult').textContent = Math.round(bmr) + " KCAL";
        sounds.coin();
    }
};

// 9. COMPOUND INTEREST
window.initInt = function() {
    document.getElementById('intResult').textContent = "$0.00";
};
window.calcInt = function() {
    const p = parseFloat(document.getElementById('intP').value);
    const r = parseFloat(document.getElementById('intR').value) / 100;
    const t = parseFloat(document.getElementById('intT').value);
    if(p && t) {
        const a = p * Math.pow(1 + r, t);
        document.getElementById('intResult').textContent = "$" + a.toFixed(2);
        sounds.coin();
    }
};

// 10. METRONOME
let metroInt = null;
let metroBpm = 120;
window.initMetro = function() {
    document.getElementById('metroBpmDisplay').textContent = metroBpm + " BPM";
};
window.toggleMetro = function() {
    if(metroInt) {
        clearInterval(metroInt);
        metroInt = null;
        document.getElementById('metroBtn').textContent = "START";
    } else {
        metroInt = setInterval(() => {
            playSound(800, 'square', 0.05); // Tick
        }, 60000 / metroBpm);
        document.getElementById('metroBtn').textContent = "STOP";
    }
    sounds.click();
};
window.adjMetro = function(delta) {
    metroBpm = Math.min(240, Math.max(40, metroBpm + delta));
    document.getElementById('metroBpmDisplay').textContent = metroBpm + " BPM";
    if(metroInt) {
        clearInterval(metroInt);
        metroInt = setInterval(() => playSound(800, 'square', 0.05), 60000 / metroBpm);
    }
    sounds.click();
};
