// ── HABIT TRACKER ──────────────────────────────────────────────────────────
(function() {
    let habits = [];
    
    function loadHabits() {
        try {
            const saved = localStorage.getItem('gbHabits');
            const data = saved ? JSON.parse(saved) : null;
            if (Array.isArray(data)) {
                habits = data;
            } else {
                habits = [
                    { name: 'EXERCISE', streak: 0, lastCheck: null, icon: '💪' },
                    { name: 'READ', streak: 0, lastCheck: null, icon: '📚' },
                    { name: 'MEDITATE', streak: 0, lastCheck: null, icon: '🧘' }
                ];
            }
        } catch(e) {
            console.warn('Failed to load habits, resetting:', e);
            habits = [];
        }
    }

    window.initHabit = function() {
        loadHabits();
        window.renderHabits();
    };

    window.renderHabits = function() {
        const list = document.getElementById('habitList');
        if (!list) return;
        
        list.innerHTML = '';
        const today = new Date().toDateString();
        
        if (!Array.isArray(habits) || habits.length === 0) {
            list.innerHTML = '<div style="text-align: center; font-size: 8px; opacity: 0.5; padding: 20px;">NO HABITS YET.<br>ADD ONE BELOW!</div>';
            return;
        }
        
        habits.forEach((habit, i) => {
            const item = document.createElement('div');
            item.style.cssText = `
                padding: 10px;
                border: 2px solid var(--gb-text);
                margin-bottom: 8px;
                border-radius: 4px;
                background: rgba(128, 128, 128, 0.1);
            `;
            
            const checkedToday = habit.lastCheck === today;
            const checkBtn = checkedToday ? '✅' : '⬜';
            
            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-size: 8px; font-weight: bold;">${habit.icon || '⭐'} ${habit.name}</div>
                        <div style="font-size: 6px; opacity: 0.7; margin-top: 2px;">🔥 ${habit.streak || 0} DAY STREAK</div>
                    </div>
                    <button onclick="toggleHabit(${i})" style="font-size: 20px; padding: 5px 10px; background: none; border: none; cursor: pointer;">${checkBtn}</button>
                </div>
            `;
            list.appendChild(item);
        });
    };

    window.toggleHabit = function(index) {
        const today = new Date().toDateString();
        const habit = habits[index];
        if (!habit) return;
        
        if (habit.lastCheck === today) {
            habit.lastCheck = null;
            if (habit.streak > 0) habit.streak--;
        } else {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const wasYesterday = habit.lastCheck === yesterday.toDateString();
            
            habit.streak = wasYesterday ? (habit.streak || 0) + 1 : 1;
            habit.lastCheck = today;
            
            if (window.sounds && window.sounds.coin) window.sounds.coin();
            if (window.addGems) window.addGems(5);
            if (window.trackQuest) trackQuest('habit', 1);
        }
        
        localStorage.setItem('gbHabits', JSON.stringify(habits));
        window.renderHabits();
    };

    window.addHabit = function() {
        const name = prompt('HABIT NAME:');
        if (name && name.trim()) {
            if (!Array.isArray(habits)) habits = [];
            habits.push({ 
                name: name.trim().toUpperCase().substring(0, 15), 
                streak: 0, 
                lastCheck: null, 
                icon: '⭐' 
            });
            localStorage.setItem('gbHabits', JSON.stringify(habits));
            window.renderHabits();
        }
    };
})();

// ── WORKOUT TRACKER ────────────────────────────────────────────────────────
const workouts = [
    { name: 'PUSH-UPS', reps: 10, sets: 3 },
    { name: 'SQUATS', reps: 15, sets: 3 },
    { name: 'PLANK', reps: 30, sets: 3 }, // seconds
    { name: 'JUMPING JACKS', reps: 20, sets: 3 }
];

let workoutLog = JSON.parse(localStorage.getItem('gbWorkoutLog')) || [];

window.initWorkout = function() {
    const screen = document.getElementById('workoutScreen');
    if (!screen) return;
    
    let html = `
        <div style="padding: 10px;">
            <div style="font-size: 8px; margin-bottom: 10px; text-align: center;">💪 QUICK WORKOUT</div>
            <div style="margin-bottom: 15px;">
    `;
    
    workouts.forEach((w, i) => {
        html += `
            <div style="
                padding: 8px;
                border: 2px solid var(--gb-text);
                margin-bottom: 8px;
                border-radius: 4px;
                background: rgba(15, 56, 15, 0.05);
            ">
                <div style="font-size: 8px; font-weight: bold;">${w.name}</div>
                <div style="font-size: 6px; margin-top: 3px;">${w.sets} sets × ${w.reps} ${w.name.includes('PLANK') ? 'sec' : 'reps'}</div>
                <button onclick="logWorkout(${i})" style="margin-top: 5px; font-size: 6px; padding: 4px 8px;">✓ DONE</button>
            </div>
        `;
    });
    
    html += `
            </div>
            <div style="font-size: 6px; text-align: center; opacity: 0.7;">
                TOTAL WORKOUTS: ${workoutLog.length}
            </div>
        </div>
    `;
    
    screen.innerHTML = html;
};

window.logWorkout = function(index) {
    const workout = workouts[index];
    workoutLog.push({
        workout: workout.name,
        date: new Date().toISOString()
    });
    localStorage.setItem('gbWorkoutLog', JSON.stringify(workoutLog));
    sounds.coin();
    addGems(10);
    alert(`${workout.name} LOGGED! +10 GEMS`);
};

// ── STUDY FLASHCARDS ───────────────────────────────────────────────────────
let flashcards = JSON.parse(localStorage.getItem('gbFlashcards')) || [
    { front: 'HTML', back: 'HyperText Markup Language' },
    { front: 'CSS', back: 'Cascading Style Sheets' },
    { front: 'JS', back: 'JavaScript' }
];

let currentCard = 0;
let showFront = true;

window.initStudy = function() {
    currentCard = 0;
    showFront = true;
    renderFlashcard();
};

function renderFlashcard() {
    const screen = document.getElementById('studyScreen');
    if (!screen || flashcards.length === 0) return;
    
    const card = flashcards[currentCard];
    const text = showFront ? card.front : card.back;
    
    screen.innerHTML = `
        <div style="padding: 10px; display: flex; flex-direction: column; height: 100%;">
            <div style="font-size: 6px; text-align: center; margin-bottom: 10px;">
                CARD ${currentCard + 1} / ${flashcards.length}
            </div>
            
            <div onclick="flipFlashcard()" style="
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(15, 56, 15, 0.1);
                border: 3px solid var(--gb-text);
                border-radius: 8px;
                padding: 20px;
                cursor: pointer;
                text-align: center;
                font-size: 10px;
                word-wrap: break-word;
                margin-bottom: 15px;
            ">
                ${sanitizeHTML(text)}
            </div>
            
            <div style="display: flex; gap: 5px; margin-bottom: 10px;">
                <button onclick="prevCard()" style="flex: 1;">← PREV</button>
                <button onclick="flipFlashcard()" style="flex: 1;">🔄 FLIP</button>
                <button onclick="nextCard()" style="flex: 1;">NEXT →</button>
            </div>
            
            <button onclick="addFlashcard()" style="font-size: 6px; padding: 6px;">+ ADD CARD</button>
        </div>
    `;
}

window.flipFlashcard = function() {
    showFront = !showFront;
    sounds.click();
    renderFlashcard();
};

window.nextCard = function() {
    currentCard = (currentCard + 1) % flashcards.length;
    showFront = true;
    sounds.click();
    renderFlashcard();
};

window.prevCard = function() {
    currentCard = (currentCard - 1 + flashcards.length) % flashcards.length;
    showFront = true;
    sounds.click();
    renderFlashcard();
};

window.addFlashcard = function() {
    const front = prompt('FRONT (Question):');
    if (!front) return;
    const back = prompt('BACK (Answer):');
    if (!back) return;
    
    flashcards.push({
        front: front.trim().substring(0, 100),
        back: back.trim().substring(0, 200)
    });
    localStorage.setItem('gbFlashcards', JSON.stringify(flashcards));
    sounds.coin();
    renderFlashcard();
};

// ── BUDGET TRACKER ─────────────────────────────────────────────────────────
let budget = JSON.parse(localStorage.getItem('gbBudget')) || {
    monthlyBudget: 1000,
    expenses: []
};
let budgetType = 'expense';
let budgetCat = '🍔';

window.initBudget = function() {
    renderBudget();
};

window.setBudgetType = function(t) {
    budgetType = t;
    document.getElementById('budgetExpBtn').style.background = t === 'expense' ? 'var(--gb-text)' : 'transparent';
    document.getElementById('budgetExpBtn').style.color = t === 'expense' ? 'var(--gb-bg)' : 'var(--gb-text)';
    document.getElementById('budgetIncBtn').style.background = t === 'income' ? 'var(--gb-text)' : 'transparent';
    document.getElementById('budgetIncBtn').style.color = t === 'income' ? 'var(--gb-bg)' : 'var(--gb-text)';
};

window.selectBudgetCat = function(c) {
    budgetCat = c;
    document.querySelectorAll('.budget-cat').forEach(el => {
        el.style.background = el.dataset.cat === c ? 'var(--gb-text)' : 'rgba(15,56,15,0.15)';
        el.style.color = el.dataset.cat === c ? 'var(--gb-bg)' : 'var(--gb-text)';
    });
};

function renderBudget() {
    const screen = document.getElementById('budgetScreen');
    if (!screen) return;

    const income = budget.expenses.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0);
    const expense = budget.expenses.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0);
    const balance = income - expense;

    const balEl = document.getElementById('budgetBalance');
    const incEl = document.getElementById('budgetIncome');
    const expEl = document.getElementById('budgetExpense');
    if (balEl) { balEl.textContent = '$' + balance.toFixed(2); balEl.style.color = balance >= 0 ? '#0f0' : '#f00'; }
    if (incEl) incEl.textContent = '$' + income.toFixed(2);
    if (expEl) expEl.textContent = '$' + expense.toFixed(2);

    const txList = document.getElementById('budgetTxList');
    if (txList) {
        txList.innerHTML = '';
        budget.expenses.slice().reverse().forEach((tx, i) => {
            const actualIndex = budget.expenses.length - 1 - i;
            const color = tx.type === 'income' ? '#0f0' : '#f00';
            const div = document.createElement('div');
            div.style.cssText = 'padding:4px; border-bottom:1px solid rgba(15,56,15,0.2); font-size:7px; display:flex; justify-content:space-between;';
            div.innerHTML = `<span>${tx.cat} ${sanitizeHTML(tx.name)}</span><span style="color:${color};font-weight:bold;">${tx.type === 'income' ? '+' : '-'}$${tx.amount.toFixed(2)}</span>`;
            txList.appendChild(div);
        });
    }

    drawBudgetChart();
}

function drawBudgetChart() {
    const canvas = document.getElementById('budgetChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const categories = {};
    budget.expenses.filter(e => e.type === 'expense').forEach(e => {
        categories[e.cat] = (categories[e.cat] || 0) + e.amount;
    });

    const cats = Object.keys(categories);
    if (cats.length === 0) {
        ctx.fillStyle = '#888';
        ctx.font = '9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('NO DATA', w / 2, h / 2 + 3);
        return;
    }

    const maxVal = Math.max(...Object.values(categories));
    const barW = Math.min(30, (w - 20) / cats.length - 4);
    const startX = (w - cats.length * (barW + 4)) / 2;

    cats.forEach((cat, i) => {
        const val = categories[cat];
        const barH = maxVal > 0 ? (val / maxVal) * (h - 28) : 0;
        const x = startX + i * (barW + 4);
        const y = h - 14 - barH;

        ctx.fillStyle = '#0f380f';
        ctx.fillRect(x, y, barW, barH);
        ctx.fillStyle = '#000';
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(cat, x + barW / 2, h - 3);
    });
}

window.addBudgetTx = function() {
    const nameEl = document.getElementById('budgetNameInput');
    const amtEl = document.getElementById('budgetAmtInput');
    if (!nameEl || !amtEl) return;
    const name = nameEl.value.trim();
    const amount = parseFloat(amtEl.value);
    if (!name || isNaN(amount) || amount <= 0) return;

    budget.expenses.push({
        name: name.substring(0, 30),
        amount: Math.round(amount * 100) / 100,
        type: budgetType,
        cat: budgetCat,
        date: new Date().toISOString()
    });
    localStorage.setItem('gbBudget', JSON.stringify(budget));
    nameEl.value = '';
    amtEl.value = '';
    if (window.sounds) sounds.click();
    renderBudget();
};

window.exportBudgetCSV = function() {
    let csv = 'Date,Type,Category,Name,Amount\n';
    budget.expenses.forEach(tx => {
        csv += `${tx.date},${tx.type},${tx.cat},"${tx.name}",${tx.amount}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'budget_export.csv';
    a.click();
    URL.revokeObjectURL(url);
    if (window.sounds) sounds.coin();
};

window.clearBudget = function() {
    if (confirm('CLEAR ALL TRANSACTIONS?')) {
        budget.expenses = [];
        localStorage.setItem('gbBudget', JSON.stringify(budget));
        if (window.sounds) sounds.back();
        renderBudget();
    }
};

// ========== MERGED APP HUBS (v3.0) ==========

// ── DAILY HUB (Time + Calendar + Zodiac) ───────────────────────────────────
window.initDaily = function() {
    const screen = document.getElementById('dailyScreen');
    if(!screen) return;
    const now = new Date();
    const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    const month = months[now.getMonth()];
    const date = now.getDate();
    const year = now.getFullYear();
    const hours = now.getHours().toString().padStart(2, '0');
    const mins = now.getMinutes().toString().padStart(2, '0');

    // Calculate Zodiac
    const day = now.getDate();
    const m = now.getMonth() + 1;
    let sign = "CAPRICORN ♑";
    if ((m == 1 && day >= 20) || (m == 2 && day <= 18)) sign = "AQUARIUS ♒";
    else if ((m == 2 && day >= 19) || (m == 3 && day <= 20)) sign = "PISCES ♓";
    else if ((m == 3 && day >= 21) || (m == 4 && day <= 19)) sign = "ARIES ♈";
    else if ((m == 4 && day >= 20) || (m == 5 && day <= 20)) sign = "TAURUS ♉";
    else if ((m == 5 && day >= 21) || (m == 6 && day <= 20)) sign = "GEMINI ♊";
    else if ((m == 6 && day >= 21) || (m == 7 && day <= 22)) sign = "CANCER ♋";
    else if ((m == 7 && day >= 23) || (m == 8 && day <= 22)) sign = "LEO ♌";
    else if ((m == 8 && day >= 23) || (m == 9 && day <= 22)) sign = "VIRGO ♍";
    else if ((m == 9 && day >= 23) || (m == 10 && day <= 22)) sign = "LIBRA ♎";
    else if ((m == 10 && day >= 23) || (m == 11 && day <= 21)) sign = "SCORPIO ♏";
    else if ((m == 11 && day >= 22) || (m == 12 && day <= 21)) sign = "SAGITTARIUS ♐";

    screen.innerHTML = `
        <div style="padding: 10px; display: flex; flex-direction: column; gap: 8px; height: 100%; box-sizing: border-box;">
            <!-- CLOCK CARD -->
            <div style="background: rgba(15,56,15,0.15); border: 2px solid var(--gb-text); padding: 10px; text-align: center; border-radius: 4px;">
                <div style="font-size: 24px; font-weight: bold; font-family: monospace;">${hours}:${mins}</div>
                <div style="font-size: 8px; margin-top: 4px; opacity: 0.8;">${month} ${date}, ${year}</div>
            </div>
            <!-- ZODIAC CARD -->
            <div style="background: rgba(15,56,15,0.1); border: 2px solid var(--gb-text); padding: 8px; text-align: center; border-radius: 4px;">
                <div style="font-size: 7px; opacity: 0.7;">TODAY'S ZODIAC</div>
                <div style="font-size: 10px; font-weight: bold; margin-top: 2px;">${sign}</div>
                <div style="font-size: 6px; margin-top: 4px; opacity: 0.8;">LUCKY NO: ${(date * 7) % 99 + 1}</div>
            </div>
        </div>
    `;

    loadUpcomingHolidays();
};

async function loadUpcomingHolidays() {
    const screen = document.getElementById('dailyScreen');
    if(!screen) return;
    const holidayPanel = document.createElement('div');
    holidayPanel.style.cssText = 'background:rgba(15,56,15,0.1);border:2px solid var(--gb-text);padding:8px;text-align:left;border-radius:4px;';
    holidayPanel.innerHTML = '<div style="font-size:7px;font-weight:bold;margin-bottom:5px;">UPCOMING WORLD HOLIDAYS</div><div style="font-size:6px;opacity:0.65;">LOADING CALENDAR...</div>';
    screen.firstElementChild.appendChild(holidayPanel);

    try {
        const response = await fetch('https://date.nager.at/api/v3/NextPublicHolidaysWorldwide');
        if(!response.ok) throw new Error('Holiday API unavailable');
        const holidays = await response.json();
        holidayPanel.innerHTML = '<div style="font-size:7px;font-weight:bold;margin-bottom:5px;">UPCOMING WORLD HOLIDAYS</div>' +
            holidays.slice(0, 4).map(holiday => `<div style="font-size:6px;margin:4px 0;border-top:1px dashed rgba(15,56,15,0.25);padding-top:3px;"><b>${holiday.name}</b><br>${holiday.date} · ${holiday.countryCode}</div>`).join('');
    } catch(error) {
        holidayPanel.innerHTML = '<div style="font-size:7px;font-weight:bold;margin-bottom:5px;">UPCOMING WORLD HOLIDAYS</div><div style="font-size:6px;opacity:0.65;">CALENDAR OFFLINE</div>';
    }
}

// ── VIBES HUB (Quotes, Jokes, Facts, Riddles with Copy) ───────────────────
let currentVibeType = 'quote';
window.initVibes = function(type = 'quote') {
    currentVibeType = type;
    window.fetchVibes(type);
};

window.fetchVibes = async function(type) {
    currentVibeType = type || currentVibeType;
    const display = document.getElementById('vibesText');
    const typeLabel = document.getElementById('vibesTypeLabel');
    if(!display) return;
    display.textContent = 'FETCHING VIBES... 🌀';
    if(typeLabel) typeLabel.textContent = currentVibeType.toUpperCase();

    try {
        let text = '';
        if(type === 'quote') {
            const res = await fetch('https://api.quotable.io/random');
            const data = await res.json();
            text = `"${data.content}"\n\n— ${data.author}`;
        } else if(type === 'joke') {
            const res = await fetch('https://official-joke-api.appspot.com/random_joke');
            const data = await res.json();
            text = `${data.setup}\n\n😂 ${data.punchline}`;
        } else if(type === 'fact' || type === 'cat') {
            const res = await fetch('https://catfact.ninja/fact');
            const data = await res.json();
            text = `💡 ${data.fact}`;
        } else {
            text = "Stay curious, work hard, and make cool projects!";
        }
        display.textContent = text;
    } catch(e) {
        display.textContent = "Offline quote: 'Keep building and never stop learning.' — GameBoy OS";
    }
};

window.copyVibes = function() {
    const display = document.getElementById('vibesText');
    if(!display || !display.textContent) return;
    navigator.clipboard.writeText(display.textContent);
    if(window.sounds && window.sounds.coin) window.sounds.coin();
    alert('COPIED TO CLIPBOARD! 📋');
};

// ── HEALTH CALC HUB (BMI + BMR + Tip + Unit Converter) ──────────────────────
window.calcBmiHub = function() {
    const w = parseFloat(document.getElementById('hcWeight')?.value);
    const h = parseFloat(document.getElementById('hcHeight')?.value) / 100;
    const res = document.getElementById('hcBmiResult');
    if(!w || !h || !res) return;
    const bmi = (w / (h * h)).toFixed(1);
    let category = "NORMAL";
    if(bmi < 18.5) category = "UNDERWEIGHT";
    else if(bmi >= 25 && bmi < 30) category = "OVERWEIGHT";
    else if(bmi >= 30) category = "OBESE";
    res.textContent = `BMI: ${bmi} (${category})`;
};

window.calcTipHub = function() {
    const bill = parseFloat(document.getElementById('hcBill')?.value);
    const pct = parseFloat(document.getElementById('hcTipPct')?.value) || 15;
    const res = document.getElementById('hcTipResult');
    if(!bill || !res) return;
    const tip = (bill * (pct / 100)).toFixed(2);
    const total = (bill + parseFloat(tip)).toFixed(2);
    res.textContent = `TIP: $${tip} | TOTAL: $${total}`;
};

// ── NAVIGATOR HUB (Maps + Distance + Compass) ──────────────────────────────
let navPins = [];
let navigatorMap = null;
let navigatorMarkers = [];
window.initNavigator = function() {
    navPins = [];
    const res = document.getElementById('navDistResult');
    if(res) res.textContent = "TAP TWO POINTS ON MAP TO MEASURE DISTANCE";

    const screen = document.getElementById('navigatorScreen');
    if(!screen) return;
    screen.innerHTML = `
        <div style="padding: 8px; display: flex; flex-direction: column; height: 100%; box-sizing: border-box; text-align: center;">
            <div style="font-size: 9px; font-weight: bold; margin-bottom: 6px;">🗺️ NAVIGATOR MAP</div>
            <div id="navigatorMap" style="flex: 1; min-height: 180px; background: #0f380f; border: 2px solid var(--gb-text); position: relative;"></div>
            <div id="navDistResult" style="font-size: 7px; font-weight: bold; margin-top: 6px; min-height: 16px;">TAP TWO POINTS ON MAP TO MEASURE DISTANCE</div>
            <button onclick="clearNavigatorPins()" style="width: 100%; margin-top: 5px; padding: 5px; font-size: 6px;">CLEAR PINS</button>
        </div>
    `;

    if(window.L) setupNavigatorMap();
    else {
        if(!document.querySelector('link[href*="leaflet.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
        }
        const script = document.querySelector('script[src*="leaflet.js"]') || document.createElement('script');
        if(!script.src) {
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            document.head.appendChild(script);
        }
        script.addEventListener('load', setupNavigatorMap, { once: true });
    }
};

window.onNavMapClick = function(e) {
    const res = document.getElementById('navDistResult');
    if(!e.latlng) return;
    navPins.push({ lat: e.latlng.lat, lng: e.latlng.lng });
    const marker = L.marker(e.latlng).addTo(navigatorMap).bindPopup(`PIN ${navPins.length}`).openPopup();
    navigatorMarkers.push(marker);

    if(navPins.length === 1 && res) {
        res.textContent = `PIN 1 SET (${e.latlng.lat.toFixed(3)}, ${e.latlng.lng.toFixed(3)}). TAP SECOND PIN!`;
    } else if(navPins.length >= 2 && res) {
        const p1 = navPins[navPins.length - 2];
        const p2 = navPins[navPins.length - 1];
        const dist = calculateDistance(p1.lat, p1.lng, p2.lat, p2.lng);
        res.textContent = `DISTANCE: ${dist.toFixed(2)} KM`;
        if(window.sounds && window.sounds.coin) window.sounds.coin();
    }
};

function setupNavigatorMap() {
    if(!window.L || !document.getElementById('navigatorMap')) return;
    if(navigatorMap) navigatorMap.remove();
    navigatorMarkers = [];

    const createMap = (lat, lng, zoom) => {
        navigatorMap = L.map('navigatorMap').setView([lat, lng], zoom);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OSM' }).addTo(navigatorMap);
        L.marker([lat, lng]).addTo(navigatorMap).bindPopup('YOU ARE HERE').openPopup();
        navigatorMap.on('click', window.onNavMapClick);
        setTimeout(() => navigatorMap.invalidateSize(), 100);
    };

    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => createMap(position.coords.latitude, position.coords.longitude, 13),
            () => createMap(40.7128, -74.0060, 12),
            { timeout: 5000 }
        );
    } else createMap(40.7128, -74.0060, 12);
}

window.clearNavigatorPins = function() {
    navPins = [];
    navigatorMarkers.forEach(marker => marker.remove());
    navigatorMarkers = [];
    const res = document.getElementById('navDistResult');
    if(res) res.textContent = 'TAP TWO POINTS ON MAP TO MEASURE DISTANCE';
};

// ── UPGRADED PASSWORD GENERATOR (v4.0) ─────────────────────────────────────
window.generatePassHub = function() {
    const len = parseInt(document.getElementById('passLength')?.value) || 16;
    const num = document.getElementById('passNums')?.checked;
    const sym = document.getElementById('passSyms')?.checked;
    const upper = document.getElementById('passUpper')?.checked;
    const seed = document.getElementById('passSeed')?.value.trim() || '';

    let chars = "abcdefghijklmnopqrstuvwxyz";
    if(upper) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if(num) chars += "0123456789";
    if(sym) chars += "!@#$%^&*()_+-=[]{}";

    function makePass(overrideLen) {
        let password = "";
        if(seed) {
            password = seed.substring(0, Math.floor(overrideLen / 2));
        }
        for(var i = password.length; i < overrideLen; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }

    const main = makePass(len);
    const out = document.getElementById('passOutput');
    if(out) out.value = main;

    // Strength meter
    var entropy = len * Math.log2(chars.length || 1);
    var pct = Math.min(entropy / 128 * 100, 100);
    var bar = document.getElementById('passStrengthBar');
    var label = document.getElementById('passStrengthLabel');
    if(bar) {
        bar.style.width = pct + '%';
        bar.style.background = entropy < 40 ? '#f00' : entropy < 80 ? '#ff8800' : '#0f0';
    }
    if(label) label.textContent = 'ENTROPY: ' + Math.round(entropy) + ' bits | ' + (entropy < 40 ? 'WEAK' : entropy < 80 ? 'MEDIUM' : 'STRONG');

    // 3 Variants
    var variants = document.getElementById('passVariants');
    if(variants) {
        var v1 = makePass(Math.max(len - 4, 8));
        var v2 = makePass(len + 4);
        var v3 = makePass(len);
        // Shuffle v3 chars
        v3 = v3.split('').sort(function() { return Math.random() - 0.5; }).join('');
        variants.innerHTML =
            '<div style="margin-bottom:2px;"><b>V1 (' + v1.length + '):</b> ' + v1 + '</div>' +
            '<div style="margin-bottom:2px;"><b>V2 (' + v2.length + '):</b> ' + v2 + '</div>' +
            '<div><b>V3 (shuffle):</b> ' + v3 + '</div>';
    }

    if(window.sounds && window.sounds.coin) window.sounds.coin();
};

window.copyPassHub = function() {
    const out = document.getElementById('passOutput');
    if(!out || !out.value) return;
    if(navigator.clipboard) {
        navigator.clipboard.writeText(out.value).then(function() {
            if(window.sounds && window.sounds.coin) window.sounds.coin();
        });
    } else {
        out.select();
        document.execCommand('copy');
    }
};

// ── WEATHER (Moved to newapps.js with full upgrade) ─────────────────────────

// ── PAINT APP UNDO & CLEAR LOGIC ──────────────────────────────────────────
// ── PAINT STATE ────────────────────────────────────────────────────────────────
let _paintMode = 'normal';
let _paintShape = 'circle';
let _paintPrimary = '#000000';
let _paintSecondary = '#ff0000';
let _paintTertiary = '#00ff00';
let _paintTertiaryIdx = 0;
let _paintHue = 0;
let _paintLastX = null;
let _paintLastY = null;
let _paintUndoStack = [];
let _paintMaxUndo = 20;
let _paintShapeStart = null;
let _paintShapePreview = null;
let paintErasing = false;
let paintIsPainting = false;
let paintHistory = [];

const TERTIARY_PRESETS = ['#00ff00','#00ccff','#ff00ff','#ffff00','#ff8800','#88ff00','#00ffaa','#ff0088'];

function _paintHexToRgb(hex) {
    const h = hex.replace('#','');
    return { r: parseInt(h.substring(0,2),16)||0, g: parseInt(h.substring(2,4),16)||0, b: parseInt(h.substring(4,6),16)||0 };
}
function _paintRgbToHex(r,g,b) {
    return '#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
}
function _paintLerpColor(c1,c2,t) {
    const a=_paintHexToRgb(c1),b=_paintHexToRgb(c2);
    return _paintRgbToHex(a.r+(b.r-a.r)*t, a.g+(b.g-a.g)*t, a.b+(b.b-a.b)*t);
}

window.paintSetMode = function(mode) {
    _paintMode = mode;
    document.querySelectorAll('.paint-mode-btn').forEach(b => {
        const active = b.dataset.mode === mode;
        b.classList.toggle('active', active);
        b.style.background = active ? 'var(--gb-text)' : 'transparent';
        b.style.color = active ? 'var(--gb-bg)' : 'var(--gb-text)';
        b.style.borderColor = active ? 'var(--gb-text)' : '#444';
    });
    document.querySelectorAll('.paint-shape-btn').forEach(b => {
        b.style.display = mode === 'shape' ? '' : 'none';
    });
};

window.paintSetShape = function(shape) {
    _paintShape = shape;
    document.querySelectorAll('.paint-shape-btn').forEach(b => {
        const active = b.dataset.shape === shape;
        b.classList.toggle('active', active);
        b.style.background = active ? '#333' : 'transparent';
        b.style.color = active ? '#fff' : '#aaa';
    });
};

window.paintSetBlendColor = function(slot, color) {
    if (slot === 'primary') _paintPrimary = color;
    else if (slot === 'secondary') _paintSecondary = color;
    _paintUpdateTertiary();
};

window.paintCycleTertiary = function() {
    _paintTertiaryIdx = (_paintTertiaryIdx + 1) % TERTIARY_PRESETS.length;
    _paintTertiary = TERTIARY_PRESETS[_paintTertiaryIdx];
    _paintUpdateTertiary();
};

function _paintUpdateTertiary() {
    const p = _paintHexToRgb(_paintPrimary);
    const s = _paintHexToRgb(_paintSecondary);
    const t = _paintHexToRgb(_paintTertiary);
    const blend = parseInt(document.getElementById('paintBlendAmount')?.value || 50) / 100;
    const mr = Math.round(p.r*(1-blend)+s.r*blend);
    const mg = Math.round(p.g*(1-blend)+s.g*blend);
    const mb = Math.round(p.b*(1-blend)+s.b*blend);
    const fr = Math.round(mr*0.5+t.r*0.5);
    const fg = Math.round(mg*0.5+t.g*0.5);
    const fb = Math.round(mb*0.5+t.b*0.5);
    const el = document.getElementById('paintTertiaryPreview');
    if (el) el.style.background = `rgb(${fr},${fg},${fb})`;
}

window.setPaintColor = function(c) {
    _paintPrimary = c;
    const pri = document.getElementById('paintPrimary');
    if (pri) pri.value = c;
    paintErasing = false;
    const btn = document.getElementById('paintEraserBtn');
    if (btn) { btn.style.background = ''; btn.style.color = ''; }
};

window.initPaint = function() {
    const canvas = document.getElementById('paintCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    _paintUndoStack = [];
    _paintLastX = null;
    _paintLastY = null;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    _paintSaveUndo(ctx, canvas);

    const sizeSlider = document.getElementById('brushSize');
    const sizeLabel = document.getElementById('brushSizeLabel');
    if (sizeSlider && sizeLabel) sizeSlider.oninput = () => { sizeLabel.textContent = sizeSlider.value; };

    // Hide shape buttons initially
    document.querySelectorAll('.paint-shape-btn').forEach(b => { b.style.display = 'none'; });

    function getPos(e) {
        const r = canvas.getBoundingClientRect();
        const t = e.touches ? e.touches[0] : e;
        return { x: (t.clientX - r.left) * (canvas.width / r.width), y: (t.clientY - r.top) * (canvas.height / r.height) };
    }

    function paintAt(x, y) {
        const size = parseInt(sizeSlider?.value || 3);
        ctx.save();
        if (_paintMode === 'normal' || _paintMode === 'eraser') {
            ctx.fillStyle = _paintMode === 'eraser' ? '#ffffff' : _paintPrimary;
            ctx.globalAlpha = 1;
            ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
        } else if (_paintMode === 'gradient') {
            const blend = parseInt(document.getElementById('paintBlendAmount')?.value || 50) / 100;
            const mid = _paintLerpColor(_paintPrimary, _paintSecondary, blend);
            const grad = ctx.createLinearGradient(x-size*3,y,x+size*3,y);
            grad.addColorStop(0, _paintPrimary);
            grad.addColorStop(0.5, mid);
            grad.addColorStop(1, _paintSecondary);
            ctx.fillStyle = grad;
            ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
        } else if (_paintMode === 'rainbow') {
            _paintHue = (_paintHue + 3) % 360;
            ctx.fillStyle = `hsl(${_paintHue},100%,55%)`;
            ctx.globalAlpha = 0.9;
            ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI * 2); ctx.fill();
        } else if (_paintMode === 'glow') {
            ctx.shadowColor = _paintPrimary; ctx.shadowBlur = size * 2;
            ctx.fillStyle = _paintPrimary; ctx.globalAlpha = 0.6;
            ctx.beginPath(); ctx.arc(x, y, size*0.7, 0, Math.PI*2); ctx.fill();
            ctx.shadowBlur = 0; ctx.globalAlpha = 0.9;
            ctx.fillStyle = _paintLerpColor(_paintPrimary,'#ffffff',0.5);
            ctx.beginPath(); ctx.arc(x, y, size*0.3, 0, Math.PI*2); ctx.fill();
        } else if (_paintMode === 'blur') {
            ctx.globalAlpha = 0.08; ctx.fillStyle = _paintPrimary;
            for (let i = 0; i < 5; i++) {
                const ox = (Math.random()-0.5)*size, oy = (Math.random()-0.5)*size;
                ctx.beginPath(); ctx.arc(x+ox, y+oy, size*0.8, 0, Math.PI*2); ctx.fill();
            }
        } else if (_paintMode === 'spray') {
            ctx.fillStyle = _paintPrimary;
            for (let i = 0; i < size*2; i++) {
                const a = Math.random()*Math.PI*2, r = Math.random()*size;
                ctx.globalAlpha = Math.random()*0.4+0.1;
                ctx.fillRect(x+Math.cos(a)*r, y+Math.sin(a)*r, 1, 1);
            }
        } else if (_paintMode === 'neon') {
            [_paintPrimary, _paintLerpColor(_paintPrimary,'#ffffff',0.4), '#ffffff'].forEach((c,i) => {
                const s2 = [size*1.5, size*0.8, size*0.3][i];
                ctx.shadowColor = c; ctx.shadowBlur = s2*2;
                ctx.fillStyle = c; ctx.globalAlpha = i===2?1:0.5;
                ctx.beginPath(); ctx.arc(x,y,s2,0,Math.PI*2); ctx.fill();
            });
        }
        ctx.restore();
    }

    function drawShape(x0,y0,x1,y1) {
        const size = parseInt(sizeSlider?.value || 3);
        const dx=x1-x0, dy=y1-y0, dist=Math.sqrt(dx*dx+dy*dy);
        const cx=(x0+x1)/2, cy=(y0+y1)/2;
        ctx.save();
        const grad = ctx.createLinearGradient(x0,y0,x1,y1);
        grad.addColorStop(0,_paintPrimary); grad.addColorStop(0.5,_paintSecondary); grad.addColorStop(1,_paintTertiary);
        ctx.fillStyle = grad; ctx.strokeStyle = _paintPrimary;
        ctx.lineWidth = Math.max(1, size/3); ctx.globalAlpha = 0.8;
        const s = _paintShape;
        if (s==='circle') { ctx.beginPath(); ctx.arc(cx,cy,dist/2,0,Math.PI*2); ctx.fill(); ctx.stroke(); }
        else if (s==='square') { ctx.fillRect(cx-dist/2,cy-dist/2,dist,dist); ctx.strokeRect(cx-dist/2,cy-dist/2,dist,dist); }
        else if (s==='triangle') { ctx.beginPath(); ctx.moveTo(cx,cy-dist/2); ctx.lineTo(cx-dist/2,cy+dist/2); ctx.lineTo(cx+dist/2,cy+dist/2); ctx.closePath(); ctx.fill(); ctx.stroke(); }
        else if (s==='star') { ctx.beginPath(); for(let i=0;i<10;i++){const r=i%2===0?dist/2:dist/5;const a=(Math.PI/5)*i-Math.PI/2;i===0?ctx.moveTo(cx+r*Math.cos(a),cy+r*Math.sin(a)):ctx.lineTo(cx+r*Math.cos(a),cy+r*Math.sin(a));} ctx.closePath(); ctx.fill(); ctx.stroke(); }
        else if (s==='line') { ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x1,y1); ctx.stroke(); ctx.shadowColor=_paintPrimary; ctx.shadowBlur=size; ctx.stroke(); }
        else if (s==='diamond') { ctx.beginPath(); ctx.moveTo(cx,cy-dist/2); ctx.lineTo(cx+dist/2,cy); ctx.lineTo(cx,cy+dist/2); ctx.lineTo(cx-dist/2,cy); ctx.closePath(); ctx.fill(); ctx.stroke(); }
        ctx.restore();
    }

    function linePaint(x0,y0,x1,y1) {
        const dist = Math.sqrt((x1-x0)**2+(y1-y0)**2);
        const steps = Math.max(1, Math.ceil(dist/2));
        for (let i=0;i<=steps;i++) { const t=i/steps; paintAt(x0+(x1-x0)*t, y0+(y1-y0)*t); }
    }

    function onDown(e) {
        e.preventDefault(); paintIsPainting = true;
        const p = getPos(e); _paintLastX=p.x; _paintLastY=p.y;
        if (_paintMode==='shape') { _paintShapeStart=p; _paintShapePreview=ctx.getImageData(0,0,canvas.width,canvas.height); }
        else paintAt(p.x, p.y);
    }
    function onMove(e) {
        if (!paintIsPainting) return; e.preventDefault();
        const p = getPos(e);
        if (_paintMode==='shape' && _paintShapeStart && _paintShapePreview) { ctx.putImageData(_paintShapePreview,0,0); drawShape(_paintShapeStart.x,_paintShapeStart.y,p.x,p.y); }
        else linePaint(_paintLastX,_paintLastY,p.x,p.y);
        _paintLastX=p.x; _paintLastY=p.y;
    }
    function onUp(e) {
        if (!paintIsPainting) return; paintIsPainting = false;
        if (_paintMode==='shape' && _paintShapeStart) {
            const p = e.changedTouches ? {x:e.changedTouches[0].clientX-canvas.getBoundingClientRect().left,y:e.changedTouches[0].clientY-canvas.getBoundingClientRect().top} : getPos(e);
            ctx.putImageData(_paintShapePreview,0,0); drawShape(_paintShapeStart.x,_paintShapeStart.y,p.x,p.y);
            _paintShapeStart=null; _paintShapePreview=null;
        }
        _paintSaveUndo(ctx,canvas); _paintLastX=null; _paintLastY=null;
    }

    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseup', onUp);
    canvas.addEventListener('mouseleave', onUp);
    canvas.addEventListener('touchstart', onDown, {passive:false});
    canvas.addEventListener('touchmove', onMove, {passive:false});
    canvas.addEventListener('touchend', onUp);
};

function _paintSaveUndo(ctx, canvas) {
    _paintUndoStack.push(canvas.toDataURL());
    if (_paintUndoStack.length > _paintMaxUndo) _paintUndoStack.shift();
}

window.paintFunc = function(action) {
    const canvas = document.getElementById('paintCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (action === 'undo') {
        if (_paintUndoStack.length > 1) {
            _paintUndoStack.pop();
            const img = new Image();
            img.onload = () => { ctx.clearRect(0,0,canvas.width,canvas.height); ctx.drawImage(img,0,0); };
            img.src = _paintUndoStack[_paintUndoStack.length-1];
        }
    } else if (action === 'clear') {
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,canvas.width,canvas.height);
        _paintSaveUndo(ctx, canvas);
    } else if (action === 'eraser') {
        if (_paintMode === 'eraser') {
            paintSetMode('normal');
        } else {
            paintSetMode('eraser');
        }
        const btn = document.getElementById('paintEraserBtn');
        if (btn) {
            btn.style.background = _paintMode === 'eraser' ? 'var(--gb-text)' : '';
            btn.style.color = _paintMode === 'eraser' ? 'var(--gb-bg)' : '';
        }
    } else if (action === 'save') {
        // iOS-friendly save: use Web Share API with file, fall back to download
        canvas.toBlob(async (blob) => {
            if (!blob) return;
            const file = new File([blob], `paint-${Date.now()}.png`, { type: 'image/png' });
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                try {
                    await navigator.share({ title: 'Painting', files: [file] });
                    return;
                } catch(e) {
                    if (e.name === 'AbortError') return;
                }
            }
            const link = document.createElement('a');
            link.download = file.name;
            link.href = URL.createObjectURL(blob);
            link.click();
            setTimeout(() => URL.revokeObjectURL(link.href), 1000);
        }, 'image/png');
    }
};

window.clearPaint = function() {
    const canvas = document.getElementById('paintCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,canvas.width,canvas.height);
    _paintUndoStack = [];
    _paintSaveUndo(ctx, canvas);
};

window.paintBrushUp = function() {
    const el = document.getElementById('brushSize');
    if (!el) return;
    const v = Math.min(30, parseInt(el.value) + 1);
    el.value = v;
    const lbl = document.getElementById('brushSizeLabel');
    if (lbl) lbl.textContent = v;
};

window.paintBrushDown = function() {
    const el = document.getElementById('brushSize');
    if (!el) return;
    const v = Math.max(1, parseInt(el.value) - 1);
    el.value = v;
    const lbl = document.getElementById('brushSizeLabel');
    if (lbl) lbl.textContent = v;
};

window.paintToggleScroll = function() {
    const btn = document.getElementById('paintScrollToggle');
    // Scroll the active game-screen (it has overflow-y:auto), not screen-content (overflow:hidden)
    const screen = document.querySelector('.game-screen.active') || document.querySelector('.screen-content');
    if (!screen || !btn) return;
    const scrolled = screen.scrollTop > 10;
    if (scrolled) {
        screen.scrollTo({ top: 0, behavior: 'smooth' });
        btn.textContent = '▼';
    } else {
        screen.scrollTo({ top: screen.scrollHeight, behavior: 'smooth' });
        btn.textContent = '▲';
    }
};

// ── SYSTEM DATA BACKUP & RESTORE ───────────────────────────────────────────
window.exportData = function() {
    try {
        const backup = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            backup[key] = localStorage.getItem(key);
        }
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `GameBoy_OS_Backup_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        if(window.sounds && window.sounds.coin) window.sounds.coin();
        alert('DATA BACKUP EXPORTED SUCCESSFULLY! 💾');
    } catch(e) {
        alert('EXPORT FAILED: ' + e.message);
    }
};

window.importData = function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = JSON.parse(evt.target.result);
                Object.keys(data).forEach(key => localStorage.setItem(key, data[key]));
                if(window.sounds && window.sounds.coin) window.sounds.coin();
                alert('DATA RESTORED! RELOADING SYSTEM...');
                location.reload();
            } catch(err) {
                alert('INVALID BACKUP FILE');
            }
        };
        reader.readAsText(file);
    };
    input.click();
};
