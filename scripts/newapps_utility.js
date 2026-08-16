// ========== CURRENCY CONVERTER ==========
const CURRENCIES = [
    { code: 'USD', flag: '🇺🇸', name: 'US Dollar' },
    { code: 'EUR', flag: '🇪🇬', name: 'Euro' },
    { code: 'GBP', flag: '🇬🇧', name: 'British Pound' },
    { code: 'JPY', flag: '🇯🇵', name: 'Japanese Yen' },
    { code: 'CNY', flag: '🇨🇳', name: 'Chinese Yuan' },
    { code: 'INR', flag: '🇮🇳', name: 'Indian Rupee' },
    { code: 'BRL', flag: '🇧🇷', name: 'Brazilian Real' },
    { code: 'CAD', flag: '🇨🇦', name: 'Canadian Dollar' },
    { code: 'AUD', flag: '🇦🇺', name: 'Australian Dollar' },
    { code: 'CHF', flag: '🇨🇭', name: 'Swiss Franc' }
];

window.initCurrency = function() {
    const amountEl = document.getElementById('currencyAmount');
    if(amountEl) amountEl.value = '1';
    if(typeof updateCurrency === 'function') updateCurrency();
};

// Currency converter functions are in newapps.js (updateCurrency, swapCurrencies, updateCurrencyDisplay)

// ========== IP SCANNER ==========
window.initIp = function() {
    getIpInfo();
};

window.getIpInfo = function() {
    fetch('https://ipapi.co/json/')
        .then(res => res.json())
        .then(data => {
            _el = document.getElementById('ipAddr'); if(_el) if(_el) _el.textContent = data.ip || 'unknown';
            _el = document.getElementById('ipCity'); if(_el) if(_el) _el.textContent = data.city || 'unknown';
            _el = document.getElementById('ipIsp'); if(_el) if(_el) _el.textContent = data.isp || 'unknown';
            _el = document.getElementById('ipCountry'); if(_el) if(_el) _el.textContent = data.country_name || 'unknown';
            _el = document.getElementById('ipTz'); if(_el) if(_el) _el.textContent = data.timezone || 'unknown';
        });
};

// Speed test is defined in newapps.js (correct async fetch version)

// ========== WATER TRACKER ==========
let waterData = { count: 0, goal: 8, lastDate: '' };

window.initWater = function() {
    const saved = localStorage.getItem('waterTracker');
    if (saved) {
        try { waterData = JSON.parse(saved); } catch(e) { waterData = { count: 0, goal: 8, lastDate: '' }; }
    }
    // Auto-reset if date changed
    const today = new Date().toISOString().split('T')[0];
    if (waterData.lastDate !== today) {
        // Check if yesterday goal was met to maintain streak
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        if (waterData.lastDate === yesterdayStr && waterData.count >= waterData.goal) {
            waterData.streak = (waterData.streak || 0) + 1;
        } else {
            waterData.streak = 0;
        }
        waterData.count = 0;
        waterData.lastDate = today;
    }
    renderWater();
    saveWater();
};

window.addWater = function() {
    if (waterData.count < waterData.goal) {
        waterData.count++;
        renderWater();
        saveWater();
        checkStreak();
    }
};

window.minusWater = function() {
    if (waterData.count > 0) {
        waterData.count--;
        renderWater();
        saveWater();
    }
};

window.setGoal = function(goal) {
    waterData.goal = goal;
    renderWater();
    saveWater();
};

window.resetWater = function() {
    waterData = { count: 0, goal: 8, lastDate: '', streak: 0 };
    renderWater();
    saveWater();
};

function renderWater() {
    const pct = (waterData.count / waterData.goal) * 100;
    const fillEl = document.getElementById('waterFill');
    const countEl = document.getElementById('waterCurrent');
    const streakEl = document.getElementById('waterStreak');
    
    if (fillEl) {
        fillEl.style.height = `${pct}%`;
        fillEl.style.backgroundColor = pct >= 100 ? '#0f380f' : '#0f380f';
    }
    if (countEl) if(countEl) countEl.textContent = waterData.count;
    
    if (streakEl) if(streakEl) streakEl.textContent = waterData.streak || 0;
}

function saveWater() {
    localStorage.setItem('waterTracker', JSON.stringify(waterData));
}

function checkStreak() {
    if (waterData.count >= waterData.goal) {
        const today = new Date().toISOString().split('T')[0];
        if (waterData.lastDate === today) {
            // Same day, don't increment streak twice
            return;
        }
    }
    // Calculate streak - simple approach: increment if goal met
    waterData.streak = (waterData.streak || 0) + 1;
    renderWater();
    saveWater();
}

// ========== EMERGENCY SOS ==========
window.initSos = function() {
    const screen = document.getElementById('sosScreen');
    if(!screen) return;
    
    screen.innerHTML = `
        <div style="padding: 20px; text-align: center; height: 100%; display: flex; flex-direction: column; background: #f00; color: #fff; font-family: 'VT323', monospace;">
            <div style="font-size: 24px; margin-bottom: 20px; text-shadow: 2px 2px #000;">SIGNAL SOS</div>
            <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 15px;">
                <button onclick="sosAction('911')" style="padding: 20px; font-size: 20px; background: #fff; color: #f00; border: none; border-radius: 8px; font-weight: bold;">🚨 CALL EMERGENCY</button>
                <button onclick="sosAction('sms')" style="padding: 15px; font-size: 14px; background: #000; color: #fff; border: 2px solid #fff; border-radius: 8px;">📲 TEXT LOCATION</button>
                <button onclick="sosAction('light')" style="padding: 15px; font-size: 14px; background: #f00; color: #fff; border: 2px solid #fff; border-radius: 8px;">🔆 MORSE FLASH</button>
            </div>
            <div style="font-size: 8px; opacity: 0.8; margin-top: 20px;">CURRENT COORDINATES: <br> <span id="sosCoords">FETCHING GPS...</span></div>
        </div>
    `;
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(pos => {
            const el = document.getElementById('sosCoords');
            if(el) if(el) el.textContent = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
        });
    }
};

window.sosAction = function(type) {
    if(typeof sounds !== 'undefined') sounds.launch();
    if(type === '911') window.location.href = "tel:911";
    if(type === 'sms') {
        const coords = document.getElementById('sosCoords').textContent;
        window.location.href = `sms:?body=EMERGENCY! My location: http://maps.google.com/maps?q=${coords}`;
    }
    if(type === 'light') {
        const morse = [0,1,0,1,0,1, 1,1,1, 0,1,0,1,0,1]; // SOS
        let i = 0;
        const flash = setInterval(() => {
            if(i >= morse.length) { clearInterval(flash); return; }
            if(typeof toggleFlashlight === 'function') toggleFlashlight();
            i++;
        }, 300);
    }
};

// ========== TO-DO LIST (RESTORED) ==========
let todos = [];
try { todos = JSON.parse(localStorage.getItem('gbTodos') || '[]'); } catch(e) { todos = []; }

window.renderTodos = function() {
    const list = document.getElementById('todoList');
    if(!list) return;
    list.innerHTML = '';
    
    if(todos.length === 0) {
        list.innerHTML = '<div style="text-align:center; font-size:8px; opacity:0.5; margin-top:10px;">NO TASKS</div>';
        return;
    }
    
    todos.forEach((todo, i) => {
        const item = document.createElement('div');
        item.style.cssText = `display:flex; justify-content:space-between; padding:5px; border-bottom:1px solid rgba(0,0,0,0.1); font-size:10px; opacity:${todo.done?0.5:1}; text-decoration:${todo.done?'line-through':'none'};`;
        item.innerHTML = `
            <span onclick="toggleTodo(${i})" style="cursor:pointer; flex:1;">${todo.text}</span>
            <button onclick="deleteTodo(${i})" style="border:none; background:none; color:#f00; cursor:pointer;">✖</button>
        `;
        list.appendChild(item);
    });
};

window.addTodo = function() {
    const input = document.getElementById('todoInput');
    if(!input || !input.value.trim()) return;
    todos.push({ text: input.value.trim(), done: false });
    input.value = '';
    saveTodos();
    renderTodos();
    if(typeof sounds !== 'undefined') sounds.coin();
};

window.toggleTodo = function(i) {
    if(todos[i]) {
        todos[i].done = !todos[i].done;
        saveTodos();
        renderTodos();
        if(typeof sounds !== 'undefined') sounds.click();
    }
};

window.deleteTodo = function(i) {
    todos.splice(i, 1);
    saveTodos();
    renderTodos();
};

function saveTodos() { localStorage.setItem('gbTodos', JSON.stringify(todos)); }

// ========== QR GENERATOR (NEW) ==========
window.initQr = function() {
    const screen = document.getElementById('qrScreen');
    if(!screen) return;
};

window.generateQR = function() {
    const input = document.getElementById('qrInput').value;
    const output = document.getElementById('qrPlaceholder');
    if(!input || !output) return;
    
    output.innerHTML = '';
    
    if(typeof QRCode !== 'undefined') {
        new QRCode(output, { text: input, width: 128, height: 128 });
    } else {
        const img = document.createElement('img');
        img.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(input)}`;
        img.style.width = '100%';
        img.style.height = '100%';
        output.appendChild(img);
    }
    if(typeof sounds !== 'undefined') sounds.coin();
};
