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

// ========== QURAN READER ==========
const QURAN_API_URL = 'https://api.alquran.cloud/v1/ayah';
let quranCurrentAyah = 1;

// Surah data: [startAyah, ayahCount, englishName]
const QURAN_SURAHS = [
  [1,7,'Al-Fatihah'],[8,206,'Al-Baqarah'],[216,120,'Ali-Imran'],[255,110,'An-Nisa'],
  [372,126,'Al-Ma\'idah'],[453,148,'Al-An\'am'],[526,206,'Al-A\'raf'],[621,87,'Al-Anfal'],
  [653,129,'At-Tawbah'],[750,109,'Yunus'],[816,123,'Hud'],[869,111,'Yusuf'],
  [912,43,'Ar-Ra\'d'],[932,52,'Ibrahim'],[955,99,'Al-Hijr'],[980,128,'An-Nahl'],
  [1041,111,'Al-Isra'],[1091,110,'Al-Kahf'],[1118,98,'Maryam'],[1151,135,'Taha'],
  [1198,112,'Al-Anbiya'],[1235,111,'Al-Hajj'],[1266,64,'Al-Mu\'minun'],[1291,37,'An-Nur'],
  [1319,18,'Al-Furqan'],[1328,120,'Ash-Shu\'ara'],[1373,88,'An-Naml'],[1406,88,'Al-Qasas'],
  [1457,69,'Al-Ankabut'],[1488,60,'Ar-Rum'],[1509,34,'Luqman'],[1523,30,'As-Sajdah'],
  [1530,73,'Al-Ahbab'],[1542,54,'Al-Ahzab'],[1563,45,'Saba'],[1577,55,'Fatir'],
  [1594,45,'Ya-Sin'],[1607,53,'As-Saffat'],[1621,88,'Sad'],[1651,69,'Az-Zumar'],
  [1674,23,'Ghafir'],[1683,14,'Fussilat'],[1693,53,'Ash-Shura'],[1701,89,'Az-Zukhruf'],
  [1723,59,'Ad-Dukhan'],[1732,40,'Al-Jathiyah'],[1742,53,'Al-Ahqaf'],[1750,45,'Muhammad'],
  [1763,38,'Al-Fath'],[1771,29,'Al-Hujurat'],[1784,18,'Qaf'],[1791,45,'Adh-Dhariyat'],
  [1799,60,'At-Tur'],[1809,49,'An-Najm'],[1819,62,'Al-Qamar'],[1829,55,'Ar-Rahman'],
  [1840,78,'Al-Waqi\'ah'],[1857,96,'Al-Hadid'],[1878,43,'Al-Mujadila'],[1890,24,'Al-Hashr'],
  [1899,13,'Al-Mumtahanah'],[1904,14,'As-Saff'],[1910,11,'Al-Jumu\'ah'],[1913,11,'Al-Munafiqun'],
  [1915,18,'At-Taghabun'],[1922,12,'At-Talaq'],[1926,22,'At-Tahrim'],[1931,28,'Al-Mulk'],
  [1939,28,'Al-Qalam'],[1947,18,'Al-Haqqah'],[1954,28,'Al-Ma\'arij'],[1962,21,'Nuh'],
  [1966,11,'Al-Jinn'],[1970,11,'Al-Muzzammil'],[1974,8,'Al-Muddaththir'],
  [1976,19,'Al-Qiyamah'],[1980,5,'Al-Insan'],[1982,40,'Al-Mursalat'],[1986,8,'An-Naba'],
  [1989,8,'An-Nazi\'at'],[1992,6,'Abasa'],[1995,59,'At-Takwir'],[1997,40,'Al-Infitar'],
  [1999,8,'Al-Mutaffifin'],[2001,17,'Al-Inshiqaq'],[2003,5,'Al-Buruj'],[2005,8,'At-Tariq'],
  [2006,11,'Al-A\'la'],[2008,19,'Al-Ghashiyah'],[2010,33,'Al-Fajr'],[2014,11,'Al-Balad'],
  [2016,8,'Ash-Shams'],[2017,11,'Al-Layl'],[2018,5,'Ad-Duha'],[2019,8,'Ash-Sharh'],
  [2020,3,'At-Tin'],[2021,9,'Al-Alaq'],[2022,12,'Al-Qadr'],[2023,19,'Al-Bayyinah'],
  [2026,5,'Az-Zalzalah'],[2027,8,'Al-Adiyat'],[2028,11,'Al-Qari\'ah'],[2029,8,'At-Takathur'],
  [2031,3,'Al-Asr'],[2032,9,'Al-Humazah'],[2034,5,'Al-Fil'],[2035,7,'Quraysh'],
  [2036,6,'Al-Ma\'un'],[2037,3,'Al-Kawthar'],[2038,6,'Al-Kafirun'],[2040,3,'An-Nasr'],
  [2041,5,'Al-Masad'],[2042,6,'Al-Ikhlas'],[2043,2,'Al-Falaq'],[2044,6,'An-Nas'],
];

function quranDayNumber() {
    const now = new Date();
    const yearStart = Date.UTC(now.getUTCFullYear(), 0, 0);
    const dayOfYear = Math.floor((Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - yearStart) / 86400000);
    return ((dayOfYear - 1) % 6236) + 1;
}

function escapeQuranText(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

window.initQuran = function() {
    quranCurrentAyah = quranDayNumber();
    // Populate surah dropdown
    const sel = document.getElementById('quranSurahSelect');
    if (sel && sel.options.length <= 1) {
        QURAN_SURAHS.forEach((s, i) => {
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = `${i + 1}. ${s[2]}`;
            sel.appendChild(opt);
        });
    }
    // Auto-select current surah
    _quranHighlightSurah();
    loadQuranAyah(quranCurrentAyah);
};

function _quranHighlightSurah() {
    // Find which surah the current ayah belongs to
    const sel = document.getElementById('quranSurahSelect');
    if (!sel) return;
    for (let i = QURAN_SURAHS.length - 1; i >= 0; i--) {
        if (quranCurrentAyah >= QURAN_SURAHS[i][0]) {
            sel.value = i;
            return;
        }
    }
}

window.quranGoToSurah = function(idx) {
    const i = parseInt(idx);
    if (isNaN(i) || i < 0 || i >= QURAN_SURAHS.length) return;
    quranCurrentAyah = QURAN_SURAHS[i][0];
    loadQuranAyah(quranCurrentAyah);
};

window.loadQuranAyah = async function(selection) {
    if (selection === 'next') quranCurrentAyah = quranCurrentAyah >= 6236 ? 1 : quranCurrentAyah + 1;
    if (selection === 'previous') quranCurrentAyah = quranCurrentAyah <= 1 ? 6236 : quranCurrentAyah - 1;
    if (selection === 'random') quranCurrentAyah = Math.floor(Math.random() * 6236) + 1;
    if (typeof selection === 'number') quranCurrentAyah = selection;

    _quranHighlightSurah();

    const arabic = document.getElementById('quranArabic');
    const translation = document.getElementById('quranTranslation');
    const reference = document.getElementById('quranReference');
    const count = document.getElementById('quranAyahCount');
    if (!arabic || !translation || !reference || !count) return;

    arabic.textContent = 'LOADING...';
    translation.textContent = 'LOADING TRANSLATION...';
    reference.textContent = 'FETCHING AYAH';

    try {
        const response = await fetch(`${QURAN_API_URL}/${quranCurrentAyah}/editions/quran-uthmani,en.sahih`);
        if (!response.ok) throw new Error('Quran API request failed');
        const payload = await response.json();
        if (!Array.isArray(payload.data) || payload.data.length < 2) throw new Error('Incomplete Quran response');

        const arabicData = payload.data.find(item => item.edition?.identifier === 'quran-uthmani');
        const translationData = payload.data.find(item => item.edition?.identifier === 'en.sahih');
        if (!arabicData || !translationData) throw new Error('Missing Quran editions');

        arabic.innerHTML = escapeQuranText(arabicData.text);
        translation.innerHTML = escapeQuranText(translationData.text);
        reference.textContent = `${arabicData.surah.englishName} · ${arabicData.surah.englishNameTranslation} · AYAH ${arabicData.numberInSurah}`;
        count.textContent = `AYAH ${quranCurrentAyah} / 6236`;
        if (window.sounds && window.sounds.coin) window.sounds.coin();
    } catch (error) {
        arabic.textContent = 'QURAN CONTENT UNAVAILABLE';
        translation.textContent = 'CHECK YOUR CONNECTION AND TRY AGAIN.';
        reference.textContent = 'API CONNECTION ERROR';
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
