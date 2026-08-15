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

window.initBudget = function() {
    renderBudget();
};

function renderBudget() {
    const screen = document.getElementById('budgetScreen');
    if (!screen) return;
    
    const totalSpent = budget.expenses.reduce((sum, e) => sum + e.amount, 0);
    const remaining = budget.monthlyBudget - totalSpent;
    const percentUsed = Math.round((totalSpent / budget.monthlyBudget) * 100);
    
    let html = `
        <div style="padding: 10px;">
            <div style="text-align: center; margin-bottom: 15px;">
                <div style="font-size: 6px; opacity: 0.7;">MONTHLY BUDGET</div>
                <div style="font-size: 12px; font-weight: bold; margin: 5px 0;">$${budget.monthlyBudget}</div>
                <div style="font-size: 8px; color: ${remaining >= 0 ? '#0f0' : '#f00'};">
                    ${remaining >= 0 ? 'REMAINING' : 'OVER'}: $${Math.abs(remaining)}
                </div>
                <div style="
                    width: 100%;
                    height: 10px;
                    background: rgba(15, 56, 15, 0.2);
                    border: 1px solid var(--gb-text);
                    border-radius: 5px;
                    margin-top: 8px;
                    overflow: hidden;
                ">
                    <div style="
                        width: ${Math.min(percentUsed, 100)}%;
                        height: 100%;
                        background: ${percentUsed > 100 ? '#f00' : percentUsed > 75 ? '#ff0' : '#0f0'};
                        transition: width 0.3s;
                    "></div>
                </div>
            </div>
            
            <button onclick="addExpense()" style="width: 100%; margin-bottom: 10px;">+ ADD EXPENSE</button>
            <button onclick="setBudget()" style="width: 100%; margin-bottom: 10px; font-size: 6px;">⚙️ SET BUDGET</button>
            
            <div style="max-height: 150px; overflow-y: auto; border-top: 1px solid var(--gb-text); padding-top: 10px;">
    `;
    
    budget.expenses.slice().reverse().forEach((exp, i) => {
        const actualIndex = budget.expenses.length - 1 - i;
        html += `
            <div style="
                padding: 5px;
                border-bottom: 1px solid rgba(15, 56, 15, 0.2);
                display: flex;
                justify-content: space-between;
                font-size: 7px;
            ">
                <span>${sanitizeHTML(exp.name)}</span>
                <span style="font-weight: bold;">-$${exp.amount}</span>
            </div>
        `;
    });
    
    html += `</div></div>`;
    screen.innerHTML = html;
}

window.addExpense = function() {
    const name = prompt('EXPENSE NAME:');
    if (!name) return;
    const amount = parseFloat(prompt('AMOUNT:'));
    if (isNaN(amount) || amount <= 0) return;
    
    budget.expenses.push({
        name: name.trim().substring(0, 30),
        amount: Math.round(amount * 100) / 100,
        date: new Date().toISOString()
    });
    localStorage.setItem('gbBudget', JSON.stringify(budget));
    sounds.click();
    renderBudget();
};

window.setBudget = function() {
    const amount = parseFloat(prompt('MONTHLY BUDGET:'));
    if (isNaN(amount) || amount <= 0) return;
    
    budget.monthlyBudget = Math.round(amount * 100) / 100;
    localStorage.setItem('gbBudget', JSON.stringify(budget));
    sounds.coin();
    renderBudget();
};

window.clearBudget = function() {
    if (confirm('CLEAR ALL EXPENSES?')) {
        budget.expenses = [];
        localStorage.setItem('gbBudget', JSON.stringify(budget));
        sounds.back();
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
};

// ── VIBES HUB (Quotes, Jokes, Facts, Riddles with Copy) ───────────────────
window.initVibes = function(type = 'quote') {
    window.fetchVibes(type);
};

window.fetchVibes = async function(type) {
    const display = document.getElementById('vibesText');
    const typeLabel = document.getElementById('vibesTypeLabel');
    if(!display) return;
    display.textContent = 'FETCHING VIBES... 🌀';
    if(typeLabel) typeLabel.textContent = type.toUpperCase();

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
window.initNavigator = function() {
    navPins = [];
    const res = document.getElementById('navDistResult');
    if(res) res.textContent = "TAP TWO POINTS ON MAP TO MEASURE DISTANCE";
};

window.onNavMapClick = function(e) {
    const rect = e.target.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    navPins.push({ x, y });
    
    const res = document.getElementById('navDistResult');
    if(navPins.length === 1 && res) {
        res.textContent = `PIN 1 SET (${x}, ${y}). TAP SECOND PIN!`;
    } else if(navPins.length >= 2 && res) {
        const p1 = navPins[navPins.length - 2];
        const p2 = navPins[navPins.length - 1];
        const dist = Math.round(Math.hypot(p2.x - p1.x, p2.y - p1.y) * 12.5); // Approx km ratio
        res.textContent = `DISTANCE: ~${dist} KM`;
        if(window.sounds && window.sounds.coin) window.sounds.coin();
    }
};

// ── UPGRADED PASSWORD GENERATOR (v3.0) ─────────────────────────────────────
window.generatePassHub = function() {
    const len = parseInt(document.getElementById('passLength')?.value) || 16;
    const num = document.getElementById('passNums')?.checked;
    const sym = document.getElementById('passSyms')?.checked;
    const seed = document.getElementById('passSeed')?.value.trim() || '';

    let chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if(num) chars += "0123456789";
    if(sym) chars += "!@#$%^&*()_+-=[]{}";

    let password = "";
    if(seed) {
        // Deterministic or seeded prefix
        password = seed.substring(0, Math.floor(len / 2));
    }
    for(let i = password.length; i < len; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const out = document.getElementById('passOutput');
    if(out) out.value = password;
    if(window.sounds && window.sounds.coin) window.sounds.coin();
};

window.copyPassHub = function() {
    const out = document.getElementById('passOutput');
    if(!out || !out.value) return;
    navigator.clipboard.writeText(out.value);
    if(window.sounds && window.sounds.coin) window.sounds.coin();
    alert('PASSWORD COPIED! 🔐');
};

// ── UPGRADED WEATHER (City Name + 5-Day Forecast) ─────────────────────────
window.initWeather = function() {
    window.fetchWeatherHub('Paris');
};

window.fetchWeatherHub = async function(city = 'Paris') {
    const screen = document.getElementById('weatherScreen');
    if(!screen) return;
    screen.innerHTML = '<div style="text-align:center; padding: 20px; font-size: 8px;">CONNECTING TO WEATHER SATELLITE... ☀️</div>';

    try {
        // Geocode city name to lat/lon via Open-Meteo geocoding API
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
        const geoData = await geoRes.json();
        
        let lat = 48.8566, lon = 2.3522, cityName = "PARIS, FR";
        if(geoData.results && geoData.results.length > 0) {
            lat = geoData.results[0].latitude;
            lon = geoData.results[0].longitude;
            cityName = `${geoData.results[0].name.toUpperCase()}, ${geoData.results[0].country_code.toUpperCase()}`;
        }

        // Fetch forecast from Open-Meteo API
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min&timezone=auto`);
        const weatherData = await weatherRes.json();
        const current = weatherData.current_weather;

        screen.innerHTML = `
            <div style="padding: 10px; display: flex; flex-direction: column; gap: 8px; height: 100%; box-sizing: border-box;">
                <!-- SEARCH -->
                <div style="display: flex; gap: 4px;">
                    <input id="weatherCityInput" placeholder="CITY NAME..." value="${city}" style="flex: 1; font-size: 7px; padding: 4px;">
                    <button onclick="fetchWeatherHub(document.getElementById('weatherCityInput').value)" style="padding: 4px 8px; font-size: 7px;">SEARCH</button>
                </div>

                <!-- MAIN DISPLAY -->
                <div style="background: rgba(15,56,15,0.15); border: 2px solid var(--gb-text); padding: 10px; text-align: center; border-radius: 4px;">
                    <div style="font-size: 8px; font-weight: bold; opacity: 0.8;">${cityName}</div>
                    <div style="font-size: 28px; font-weight: bold; margin: 4px 0;">${Math.round(current.temperature)}°C</div>
                    <div style="font-size: 7px;">WIND: ${current.windspeed} KM/H</div>
                </div>

                <!-- FORECAST -->
                <div style="font-size: 7px; font-weight: bold; text-align: center; opacity: 0.8;">5-DAY FORECAST</div>
                <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 2px; text-align: center; font-size: 6px;">
                    ${weatherData.daily.temperature_2m_max.slice(0, 5).map((max, i) => `
                        <div style="background: rgba(15,56,15,0.08); border: 1px solid var(--gb-text); padding: 4px; border-radius: 2px;">
                            <div>DAY ${i+1}</div>
                            <div style="font-weight: bold; margin-top: 2px;">${Math.round(max)}°</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } catch(e) {
        screen.innerHTML = '<div style="text-align:center; padding: 20px; font-size: 8px;">WEATHER SATELLITE OFFLINE 🌧️</div>';
    }
};

// ── PAINT APP UNDO & CLEAR LOGIC ──────────────────────────────────────────
let paintHistory = [];
window.initPaint = function() {
    const canvas = document.getElementById('paintCanvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    paintHistory = [];
    
    // Save initial state
    paintHistory.push(ctx.getImageData(0, 0, canvas.width, canvas.height));

    let drawing = false;
    canvas.onmousedown = canvas.ontouchstart = () => { drawing = true; };
    canvas.onmouseup = canvas.ontouchend = () => {
        if(drawing) {
            drawing = false;
            if(paintHistory.length >= 10) paintHistory.shift();
            paintHistory.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        }
    };

    canvas.onmousemove = canvas.ontouchmove = (e) => {
        if(!drawing) return;
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const x = (clientX - rect.left) * (canvas.width / rect.width);
        const y = (clientY - rect.top) * (canvas.height / rect.height);
        
        ctx.fillStyle = document.getElementById('paintColor')?.value || '#000';
        const size = parseInt(document.getElementById('brushSize')?.value) || 3;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    };
};

window.paintFunc = function(action) {
    const canvas = document.getElementById('paintCanvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    
    if(action === 'clear') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        paintHistory = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
        if(window.sounds && window.sounds.click) window.sounds.click();
    } else if(action === 'undo') {
        if(paintHistory.length > 1) {
            paintHistory.pop(); // Remove current state
            const previous = paintHistory[paintHistory.length - 1];
            ctx.putImageData(previous, 0, 0);
            if(window.sounds && window.sounds.click) window.sounds.click();
        }
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
