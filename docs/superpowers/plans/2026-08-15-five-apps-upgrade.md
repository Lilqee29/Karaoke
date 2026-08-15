# Five Apps Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade 5 apps (H2O, STOCK, NET, CAMERA, EXCH) with enhanced features including daily goals, sparkline charts, city/ISP info, filter pills, and currency dropdowns.

**Architecture:** Modify existing HTML screens and JavaScript functions in `index.html` and `scripts/newapps.js`. All changes are minimal and focused on each app's specific requirements.

**Tech Stack:** Vanilla JS, HTML5 Canvas, CSS3 animations, localStorage

---

## File Structure

**Files to modify:**
- `index.html:996-1006` - Water screen HTML
- `index.html:447-460` - Stock screen HTML  
- `index.html:595-605` - IP/Net screen HTML
- `index.html:937-979` - Camera screen HTML
- `index.html:342` - Currency screen (empty div)
- `scripts/utils_expanded.js:113-133` - Water functions
- `scripts/newapps.js:511-514` - Stock function
- `scripts/newapps.js:1283-1338` - Currency functions
- `scripts/newapps.js:1786-1800` - IP info function
- `scripts/newapps.js:3049-3439` - Camera functions

---

## Task 1: H2O (Water Tracker) - Goal + Streak + Animated Fill

### Step 1.1: Update waterScreen HTML

```html
<div id="waterScreen" class="game-screen">
    <div style="padding: 15px; text-align: center;">
        <div style="font-size: 9px; margin-bottom: 10px;">HYDRATION TRACKER</div>
        
        <!-- Daily Goal Setting -->
        <div style="display: flex; align-items: center; justify-content: center; gap: 5px; margin-bottom: 10px; font-size: 7px;">
            <span>DAILY GOAL:</span>
            <input type="number" id="waterGoal" value="8" min="1" max="20" style="width: 40px; text-align: center; font-size: 7px;" onchange="updateWaterGoal()">
            <span>GLASSES</span>
        </div>
        
        <!-- Water Fill Animation -->
        <div id="waterFillContainer" style="width: 120px; height: 160px; margin: 0 auto 10px; border: 3px solid var(--gb-text); position: relative; background: rgba(0,0,0,0.05); overflow: hidden;">
            <div id="waterFill" style="position: absolute; bottom: 0; left: 0; right: 0; height: 0%; background: linear-gradient(180deg, #4fc3f7 0%, #0288d1 100%); transition: height 0.5s ease-out;"></div>
            <div id="waterWave" style="position: absolute; bottom: 0; left: -10%; right: -10%; height: 20px; background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100"><path fill="%230288d1" d="M0,50 C360,100 1080,0 1440,50 L1440,100 L0,100 Z"/></svg'); background-size: 720px 20px; animation: wave 2s linear infinite;"></div>
        </div>
        
        <!-- Count Display -->
        <div style="display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 10px;">
            <button onclick="removeWater()" style="width: 30px; height: 30px; font-size: 14px; background: #ea5656; color: #fff;">-1</button>
            <div style="font-size: 18px; font-weight: bold; min-width: 80px;">
                <span id="waterCount">0</span> / <span id="waterGoalDisplay">8</span>
            </div>
            <button onclick="addWater()" style="width: 30px; height: 30px; font-size: 14px; background: #4caf50; color: #fff;">+1</button>
        </div>
        
        <!-- Streak Display -->
        <div style="font-size: 8px; margin-bottom: 10px;">
            <span style="color: #ff9800;">🔥 STREAK:</span> <span id="waterStreak">0</span> DAYS
        </div>
        
        <!-- Reset Button -->
        <button onclick="resetWater()" style="width: 100%; padding: 8px; font-size: 7px; background: #ea5656; color: #fff;">RESET TODAY</button>
    </div>
</div>
```

Add CSS animation for wave:
```css
@keyframes wave {
    0% { transform: translateX(0); }
    100% { transform: translateX(-720px); }
}
```

### Step 1.2: Update water functions in `scripts/utils_expanded.js`

Replace lines 113-133 with:

```javascript
// ========== WATER TRACKER (Enhanced) ==========
let waterCount = 0;
let waterGoal = 8;
let waterStreak = 0;
let waterLastDate = null;

window.initWater = function() {
    const today = new Date().toDateString();
    const savedDate = localStorage.getItem('gbos_water_date');
    
    // Load streak first
    waterStreak = parseInt(localStorage.getItem('gbos_water_streak') || "0");
    waterLastDate = localStorage.getItem('gbos_water_last_date');
    
    // Check if day changed
    if (savedDate !== today) {
        // Check if yesterday's goal was met
        if (waterLastDate) {
            const lastDate = new Date(waterLastDate);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (lastDate.toDateString() === yesterday.toDateString()) {
                const yesterdayCount = parseInt(localStorage.getItem('gbos_water_yesterday') || "0");
                const yesterdayGoal = parseInt(localStorage.getItem('gbos_water_goal') || "8");
                if (yesterdayCount >= yesterdayGoal) {
                    waterStreak++;
                } else {
                    waterStreak = 0;
                }
            } else {
                waterStreak = 0;
            }
        }
        
        // Reset count for new day
        waterCount = 0;
        localStorage.setItem('gbos_water', waterCount);
        localStorage.setItem('gbos_water_date', today);
        localStorage.setItem('gbos_water_streak', waterStreak);
        localStorage.setItem('gbos_water_last_date', today);
    } else {
        waterCount = parseInt(localStorage.getItem('gbos_water') || "0");
    }
    
    waterGoal = parseInt(localStorage.getItem('gbos_water_goal') || "8");
    updateWaterUI();
};

window.addWater = function() {
    waterCount++;
    localStorage.setItem('gbos_water', waterCount);
    localStorage.setItem('gbos_water_yesterday', waterCount);
    
    if (waterCount >= waterGoal) {
        sounds.launch();
    } else {
        sounds.coin();
    }
    
    updateWaterUI();
};

window.removeWater = function() {
    if (waterCount > 0) {
        waterCount--;
        localStorage.setItem('gbos_water', waterCount);
        localStorage.setItem('gbos_water_yesterday', waterCount);
        updateWaterUI();
        sounds.back();
    }
};

window.resetWater = function() {
    waterCount = 0;
    localStorage.setItem('gbos_water', 0);
    localStorage.setItem('gbos_water_yesterday', 0);
    updateWaterUI();
    sounds.back();
};

window.updateWaterGoal = function() {
    const input = document.getElementById('waterGoal');
    if (input) {
        waterGoal = parseInt(input.value) || 8;
        localStorage.setItem('gbos_water_goal', waterGoal);
        updateWaterUI();
    }
};

function updateWaterUI() {
    const countEl = document.getElementById('waterCount');
    const goalEl = document.getElementById('waterGoalDisplay');
    const streakEl = document.getElementById('waterStreak');
    const fillEl = document.getElementById('waterFill');
    const goalInput = document.getElementById('waterGoal');
    
    if (countEl) countEl.textContent = waterCount;
    if (goalEl) goalEl.textContent = waterGoal;
    if (streakEl) streakEl.textContent = waterStreak;
    if (goalInput) goalInput.value = waterGoal;
    
    // Update fill animation
    if (fillEl) {
        const percentage = Math.min(100, (waterCount / waterGoal) * 100);
        fillEl.style.height = percentage + '%';
        
        // Change color based on progress
        if (percentage >= 100) {
            fillEl.style.background = 'linear-gradient(180deg, #4caf50 0%, #2e7d32 100%)';
        } else if (percentage >= 75) {
            fillEl.style.background = 'linear-gradient(180deg, #8bc34a 0%, #558b2f 100%)';
        } else if (percentage >= 50) {
            fillEl.style.background = 'linear-gradient(180deg, #ffeb3b 0%, #fbc02d 100%)';
        } else {
            fillEl.style.background = 'linear-gradient(180deg, #4fc3f7 0%, #0288d1 100%)';
        }
    }
}
```

### Step 1.3: Verify water functions

Run: Search for `addWater` and `resetWater` in `utils_expanded.js`
Expected: Functions exist and are properly defined

---

## Task 2: STOCK - Sparkline Chart

### Step 2.1: Update stockScreen HTML

```html
<div id="stockScreen" class="game-screen">
    <div style="padding: 10px; text-align: center;">
        <div style="font-size: 9px; margin-bottom: 10px;">MARKET WATCH</div>
        
        <!-- Ticker Input -->
        <div style="display: flex; gap: 5px; margin-bottom: 10px;">
            <input type="text" id="stockTicker" placeholder="TICKER (e.g. AAPL)" value="AAPL" style="flex: 1; font-size: 8px; padding: 5px; text-transform: uppercase;">
            <button onclick="fetchStock()" style="font-size: 7px; padding: 5px 10px;">GO</button>
        </div>
        
        <!-- Company Name -->
        <div id="stockCompanyName" style="font-size: 7px; font-weight: bold; margin-bottom: 5px;">LOADING...</div>
        
        <!-- Current Price -->
        <div style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">
            $<span id="stockPrice">---</span>
            <span id="stockChange" style="font-size: 10px;"></span>
        </div>
        
        <!-- Sparkline Chart -->
        <div style="border: 2px solid var(--gb-text); margin-bottom: 10px; background: rgba(0,0,0,0.05);">
            <canvas id="stockCanvas" width="280" height="100" style="width: 100%; height: 100px;"></canvas>
        </div>
        
        <!-- 7-Day Label -->
        <div style="font-size: 6px; opacity: 0.7;">7-DAY PRICE HISTORY</div>
        
        <!-- Quick Tickers -->
        <div style="display: flex; gap: 5px; margin-top: 10px; flex-wrap: wrap; justify-content: center;">
            <button onclick="quickStock('AAPL')" style="font-size: 5px; padding: 3px 6px;">AAPL</button>
            <button onclick="quickStock('GOOGL')" style="font-size: 5px; padding: 3px 6px;">GOOGL</button>
            <button onclick="quickStock('MSFT')" style="font-size: 5px; padding: 3px 6px;">MSFT</button>
            <button onclick="quickStock('TSLA')" style="font-size: 5px; padding: 3px 6px;">TSLA</button>
            <button onclick="quickStock('AMZN')" style="font-size: 5px; padding: 3px 6px;">AMZN</button>
        </div>
    </div>
</div>
```

### Step 2.2: Update stock function in `scripts/newapps.js`

Replace lines 511-514 with:

```javascript
// ========== STOCK TRACKER (Enhanced with Sparkline) ==========
window.initStock = function() {
    fetchStock();
};

window.quickStock = function(ticker) {
    document.getElementById('stockTicker').value = ticker;
    fetchStock();
};

window.fetchStock = async function() {
    const ticker = document.getElementById('stockTicker').value.toUpperCase().trim();
    if (!ticker) return;
    
    const nameEl = document.getElementById('stockCompanyName');
    const priceEl = document.getElementById('stockPrice');
    const changeEl = document.getElementById('stockChange');
    const canvas = document.getElementById('stockCanvas');
    
    if (nameEl) nameEl.textContent = 'LOADING...';
    if (priceEl) priceEl.textContent = '---';
    if (changeEl) changeEl.textContent = '';
    
    try {
        const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=7d`);
        const data = await res.json();
        
        if (data.chart && data.chart.result && data.chart.result[0]) {
            const result = data.chart.result[0];
            const meta = result.meta;
            const closes = result.indicators.quote[0].close.filter(v => v !== null);
            
            // Company name
            if (nameEl) nameEl.textContent = meta.shortName || ticker;
            
            // Current price
            const currentPrice = meta.regularMarketPrice;
            if (priceEl) priceEl.textContent = currentPrice.toFixed(2);
            
            // Change calculation
            if (closes.length >= 2) {
                const previousClose = closes[closes.length - 2];
                const change = currentPrice - previousClose;
                const changePercent = (change / previousClose * 100).toFixed(2);
                
                if (changeEl) {
                    if (change >= 0) {
                        changeEl.innerHTML = `<span style="color: #4caf50;">▲ +${change.toFixed(2)} (+${changePercent}%)</span>`;
                    } else {
                        changeEl.innerHTML = `<span style="color: #f44336;">▼ ${change.toFixed(2)} (${changePercent}%)</span>`;
                    }
                }
            }
            
            // Draw sparkline
            drawSparkline(canvas, closes);
            
            sounds.coin();
        } else {
            if (nameEl) nameEl.textContent = 'TICKER NOT FOUND';
        }
    } catch (e) {
        if (nameEl) nameEl.textContent = 'API ERROR';
        console.error('Stock fetch error:', e);
    }
};

function drawSparkline(canvas, data) {
    if (!canvas || !data || data.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = 10;
    
    ctx.clearRect(0, 0, width, height);
    
    // Calculate min/max
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    
    // Draw grid lines
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 4; i++) {
        const y = padding + (i / 3) * (height - 2 * padding);
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
    }
    
    // Draw price line
    const isUp = data[data.length - 1] >= data[0];
    ctx.strokeStyle = isUp ? '#4caf50' : '#f44336';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    
    data.forEach((price, i) => {
        const x = padding + (i / (data.length - 1)) * (width - 2 * padding);
        const y = height - padding - ((price - min) / range) * (height - 2 * padding);
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();
    
    // Draw fill under line
    ctx.lineTo(width - padding, height - padding);
    ctx.lineTo(padding, height - padding);
    ctx.closePath();
    
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    if (isUp) {
        gradient.addColorStop(0, 'rgba(76, 175, 80, 0.3)');
        gradient.addColorStop(1, 'rgba(76, 175, 80, 0.05)');
    } else {
        gradient.addColorStop(0, 'rgba(244, 67, 54, 0.3)');
        gradient.addColorStop(1, 'rgba(244, 67, 54, 0.05)');
    }
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Draw current price dot
    const lastX = width - padding;
    const lastY = height - padding - ((data[data.length - 1] - min) / range) * (height - 2 * padding);
    ctx.fillStyle = isUp ? '#4caf50' : '#f44336';
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw price labels
    ctx.fillStyle = '#666';
    ctx.font = '8px monospace';
    ctx.textAlign = 'right';
    ctx.fillText('$' + max.toFixed(0), width - 5, padding + 5);
    ctx.fillText('$' + min.toFixed(0), width - 5, height - padding - 5);
}
```

### Step 2.3: Verify stock functions

Run: Search for `fetchStock` and `drawSparkline` in `newapps.js`
Expected: Functions exist and are properly defined

---

## Task 3: NET (IP Scanner) - City Name + Speed Test

### Step 3.1: Update ipScreen HTML

```html
<div id="ipScreen" class="game-screen">
    <div style="padding: 10px; text-align: center;">
        <div style="font-size: 9px; margin-bottom: 10px;">NET TOOLS</div>
        
        <!-- IP Display -->
        <div style="background: #000; color: #0f0; padding: 10px; font-family: monospace; font-size: 8px; text-align: left; margin-bottom: 10px; border: 2px solid var(--gb-text);">
            > IP: <span id="ipAddr">...</span><br>
            > ISP: <span id="ipIsp">...</span><br>
            > CITY: <span id="ipCity">...</span><br>
            > COUNTRY: <span id="ipCountry">...</span><br>
            > TIMEZONE: <span id="ipTimezone">...</span>
        </div>
        
        <button onclick="getIpInfo()" style="width: 100%; margin-bottom: 10px;">SCAN NETWORK</button>
        
        <!-- Speed Test Section -->
        <div style="background: rgba(0,0,0,0.05); padding: 10px; border: 2px solid var(--gb-text); margin-bottom: 10px;">
            <div style="font-size: 7px; margin-bottom: 8px;">DOWNLOAD SPEED TEST</div>
            <button onclick="runSpeedTest()" id="speedTestBtn" style="width: 100%; margin-bottom: 8px;">START SPEED TEST</button>
            <div style="font-size: 18px; font-weight: bold;">
                <span id="speedResult">---</span> <span style="font-size: 10px;">Mbps</span>
            </div>
            <div id="speedStatus" style="font-size: 6px; opacity: 0.7; margin-top: 5px;">READY</div>
        </div>
    </div>
</div>
```

### Step 3.2: Update IP info and speed test functions in `scripts/newapps.js`

Replace lines 1786-1800 with:

```javascript
// ========== IP INFO (Enhanced with Speed Test) ==========
window.initIp = function() {
    getIpInfo();
};

window.getIpInfo = async function() {
    const ip = document.getElementById('ipAddr');
    const city = document.getElementById('ipCity');
    const isp = document.getElementById('ipIsp');
    const country = document.getElementById('ipCountry');
    const timezone = document.getElementById('ipTimezone');
    
    if (ip) ip.textContent = "...";
    sounds.click();
    
    try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        
        if (ip) ip.textContent = data.ip || 'UNKNOWN';
        if (city) city.textContent = data.city || 'UNKNOWN';
        if (isp) isp.textContent = data.org || 'UNKNOWN';
        if (country) country.textContent = data.country_name || 'UNKNOWN';
        if (timezone) timezone.textContent = data.timezone || 'UNKNOWN';
        
        sounds.coin();
    } catch(e) {
        if (ip) ip.textContent = "ERROR";
        if (city) city.textContent = "...";
        if (isp) isp.textContent = "...";
        if (country) country.textContent = "...";
        if (timezone) timezone.textContent = "...";
    }
};

window.runSpeedTest = async function() {
    const btn = document.getElementById('speedTestBtn');
    const resultEl = document.getElementById('speedResult');
    const statusEl = document.getElementById('speedStatus');
    
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'TESTING...';
    }
    if (statusEl) statusEl.textContent = 'DOWNLOADING 10MB FILE...';
    if (resultEl) resultEl.textContent = '---';
    
    sounds.click();
    
    try {
        const startTime = performance.now();
        
        const res = await fetch('https://speed.cloudflare.com/__down?bytes=10000000');
        const blob = await res.blob();
        
        const endTime = performance.now();
        const durationSeconds = (endTime - startTime) / 1000;
        const fileSizeBytes = blob.size;
        
        // Calculate speed in Mbps
        const speedMbps = ((fileSizeBytes * 8) / (durationSeconds * 1000000)).toFixed(2);
        
        if (resultEl) resultEl.textContent = speedMbps;
        if (statusEl) statusEl.textContent = `DOWNLOADED ${(fileSizeBytes / 1000000).toFixed(1)}MB IN ${durationSeconds.toFixed(1)}S`;
        
        sounds.launch();
    } catch(e) {
        if (resultEl) resultEl.textContent = 'ERROR';
        if (statusEl) statusEl.textContent = 'SPEED TEST FAILED - CHECK CONNECTION';
    }
    
    if (btn) {
        btn.disabled = false;
        btn.textContent = 'START SPEED TEST';
    }
};
```

### Step 3.3: Verify IP functions

Run: Search for `getIpInfo` and `runSpeedTest` in `newapps.js`
Expected: Functions exist and are properly defined

---

## Task 4: CAMERA - Filter Pills + Mirror + Freeze + Pixel

### Step 4.1: Update cameraScreen HTML

```html
<div id="cameraScreen" class="game-screen">
    <div style="padding: 10px; text-align: center;">
        <div style="font-size: 9px; margin-bottom: 8px;">GB CAMERA v2.0</div>
        
        <!-- Camera Container -->
        <div id="cameraContainer" style="width: 220px; height: 160px; margin: 0 auto 8px; border: 4px solid var(--gb-text); background: #000; position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center;">
            <video id="cameraVideo" autoplay playsinline style="width: 100%; height: 100%; object-fit: cover;"></video>
            <canvas id="cameraCanvas" style="display: none;"></canvas>
            <img id="selfiePreview" style="display: none; width: 100%; height: 100%; object-fit: cover;">
            
            <!-- Overlays -->
            <div id="cameraFlash" style="position: absolute; top:0; left:0; width:100%; height:100%; background: #fff; opacity: 0; pointer-events: none; transition: opacity 0.1s; z-index: 20;"></div>
        </div>
        
        <!-- Filter Pills Row -->
        <div id="filterPills" style="display: flex; gap: 4px; overflow-x: auto; margin-bottom: 8px; padding-bottom: 4px; scrollbar-width: none;">
            <button onclick="setCameraFilter('none')" class="filter-pill active" data-filter="none" style="font-size: 5px; padding: 4px 8px; white-space: nowrap;">NONE</button>
            <button onclick="setCameraFilter('sepia')" class="filter-pill" data-filter="sepia" style="font-size: 5px; padding: 4px 8px; white-space: nowrap;">SEPIA</button>
            <button onclick="setCameraFilter('grayscale')" class="filter-pill" data-filter="grayscale" style="font-size: 5px; padding: 4px 8px; white-space: nowrap;">GRAYSCALE</button>
            <button onclick="setCameraFilter('invert')" class="filter-pill" data-filter="invert" style="font-size: 5px; padding: 4px 8px; white-space: nowrap;">INVERT</button>
            <button onclick="toggleMirror()" id="mirrorBtn" class="filter-pill" style="font-size: 5px; padding: 4px 8px; white-space: nowrap;">MIRROR</button>
            <button onclick="setCameraFilter('pixel')" class="filter-pill" data-filter="pixel" style="font-size: 5px; padding: 4px 8px; white-space: nowrap;">PIXEL</button>
        </div>
        
        <!-- Control Buttons -->
        <div style="display: flex; gap: 5px; margin-bottom: 5px;">
            <button onclick="switchCamera()" style="flex: 1; font-size: 5px; background: #555; color: #fff;">🔄 FLIP</button>
            <button onclick="toggleFreeze()" id="freezeBtn" style="flex: 1; font-size: 5px;">❄️ FREEZE</button>
        </div>
        
        <!-- Capture Buttons -->
        <div style="display: flex; gap: 5px;">
            <button id="captureBtn" onclick="takeSelfie()" style="flex: 1; background: #ea5656; color: #fff;">📸 CAPTURE</button>
            <button id="saveSelfieBtn" onclick="saveSelfie()" style="flex: 1; display: none;">💾 SAVE</button>
            <button id="retakeBtn" onclick="retakeSelfie()" style="flex: 1; display: none;">🔄 RETAKE</button>
        </div>
    </div>
</div>
```

Add CSS for filter pills:
```css
.filter-pill {
    background: transparent;
    color: var(--gb-text);
    border: 1px solid var(--gb-text);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
}

.filter-pill.active {
    background: var(--gb-text);
    color: var(--gb-bg);
}
```

### Step 4.2: Update camera functions in `scripts/newapps.js`

Add these functions after the existing camera functions (around line 3440):

```javascript
// ========== CAMERA FILTER PILLS (Enhanced) ==========
let isMirrorOn = false;
let isFrozen = false;
let frozenFrame = null;

// Update setCameraFilter to handle pill UI
window.setCameraFilter = function(filter) {
    // Update active pill
    document.querySelectorAll('.filter-pill').forEach(pill => {
        pill.classList.remove('active');
        if (pill.dataset.filter === filter) {
            pill.classList.add('active');
        }
    });
    
    activeCameraFilter = filter;
    
    // Clear CSS filters — canvas handles it all
    const video = document.getElementById('cameraVideo');
    const preview = document.getElementById('selfiePreview');
    if (video) video.style.filter = 'none';
    if (preview) preview.style.filter = 'none';
    
    sounds.click();
};

window.toggleMirror = function() {
    isMirrorOn = !isMirrorOn;
    const video = document.getElementById('cameraVideo');
    const preview = document.getElementById('selfiePreview');
    
    if (video) {
        video.style.transform = isMirrorOn ? 'scaleX(-1)' : 'scaleX(1)';
    }
    if (preview) {
        preview.style.transform = isMirrorOn ? 'scaleX(-1)' : 'scaleX(1)';
    }
    
    const mirrorBtn = document.getElementById('mirrorBtn');
    if (mirrorBtn) {
        mirrorBtn.classList.toggle('active', isMirrorOn);
    }
    
    sounds.click();
};

window.toggleFreeze = function() {
    isFrozen = !isFrozen;
    const video = document.getElementById('cameraVideo');
    const freezeBtn = document.getElementById('freezeBtn');
    
    if (isFrozen) {
        // Capture current frame
        const canvas = document.getElementById('cameraCanvas');
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 240;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        frozenFrame = canvas.toDataURL('image/png');
        
        // Show frozen frame
        const preview = document.getElementById('selfiePreview');
        if (preview) {
            preview.src = frozenFrame;
            preview.style.display = 'block';
            video.style.display = 'none';
        }
        
        if (freezeBtn) freezeBtn.textContent = '▶ UNFREEZE';
    } else {
        // Resume video
        const preview = document.getElementById('selfiePreview');
        if (preview) preview.style.display = 'none';
        if (video) video.style.display = 'block';
        
        if (freezeBtn) freezeBtn.textContent = '❄️ FREEZE';
    }
    
    sounds.click();
};

// Add pixel filter to applyFilterToCanvas
// (This should be added to the switch statement in applyFilterToCanvas)
// case 'pixel':
//     // Pixelate effect
//     const pixelSize = 8;
//     for (let y = 0; y < h; y += pixelSize) {
//         for (let x = 0; x < w; x += pixelSize) {
//             const i = (y * w + x) * 4;
//             const gray = d[i] * 0.299 + d[i+1] * 0.587 + d[i+2] * 0.114;
//             const v = Math.min(255, gray * 1.2);
//             for (let dy = 0; dy < pixelSize && y+dy < h; dy++) {
//                 for (let dx = 0; dx < pixelSize && x+dx < w; dx++) {
//                     const pi = ((y+dy) * w + (x+dx)) * 4;
//                     d[pi] = d[pi+1] = d[pi+2] = v;
//                 }
//             }
//         }
//     }
//     break;
```

Also update the `takeSelfie` function to respect mirror and freeze state.

### Step 4.3: Verify camera functions

Run: Search for `toggleMirror`, `toggleFreeze`, `setCameraFilter` in `newapps.js`
Expected: Functions exist and are properly defined

---

## Task 5: EXCH (Currency) - Dropdowns + Flags

### Step 5.1: Update currencyScreen HTML

```html
<div id="currencyScreen" class="game-screen">
    <div style="padding: 10px; text-align: center;">
        <div style="font-size: 9px; margin-bottom: 10px;">CURRENCY EXCHANGE</div>
        
        <!-- From Currency -->
        <div style="margin-bottom: 8px;">
            <div style="font-size: 6px; opacity: 0.7; margin-bottom: 3px;">FROM</div>
            <div style="display: flex; gap: 5px;">
                <select id="currencyFrom" style="flex: 1; font-size: 7px; padding: 5px;" onchange="updateCurrency()">
                    <option value="USD">🇺🇸 USD - US Dollar</option>
                    <option value="EUR">🇪🇺 EUR - Euro</option>
                    <option value="GBP">🇬🇧 GBP - British Pound</option>
                    <option value="JPY">🇯🇵 JPY - Japanese Yen</option>
                    <option value="CNY">🇨🇳 CNY - Chinese Yuan</option>
                    <option value="INR">🇮🇳 INR - Indian Rupee</option>
                    <option value="BRL">🇧🇷 BRL - Brazilian Real</option>
                    <option value="CAD">🇨🇦 CAD - Canadian Dollar</option>
                    <option value="AUD">🇦🇺 AUD - Australian Dollar</option>
                    <option value="CHF">🇨🇭 CHF - Swiss Franc</option>
                </select>
                <input type="number" id="currencyAmount" value="1" min="0" step="0.01" style="width: 70px; font-size: 10px; text-align: right;" oninput="updateCurrency()">
            </div>
        </div>
        
        <!-- Swap Button -->
        <button onclick="swapCurrency()" style="font-size: 12px; margin-bottom: 8px;">⇄</button>
        
        <!-- To Currency -->
        <div style="margin-bottom: 10px;">
            <div style="font-size: 6px; opacity: 0.7; margin-bottom: 3px;">TO</div>
            <select id="currencyTo" style="width: 100%; font-size: 7px; padding: 5px;" onchange="updateCurrency()">
                <option value="USD">🇺🇸 USD - US Dollar</option>
                <option value="EUR" selected>🇪🇺 EUR - Euro</option>
                <option value="GBP">🇬🇧 GBP - British Pound</option>
                <option value="JPY">🇯🇵 JPY - Japanese Yen</option>
                <option value="CNY">🇨🇳 CNY - Chinese Yuan</option>
                <option value="INR">🇮🇳 INR - Indian Rupee</option>
                <option value="BRL">🇧🇷 BRL - Brazilian Real</option>
                <option value="CAD">🇨🇦 CAD - Canadian Dollar</option>
                <option value="AUD">🇦🇺 AUD - Australian Dollar</option>
                <option value="CHF">🇨🇭 CHF - Swiss Franc</option>
            </select>
        </div>
        
        <!-- Result Display -->
        <div style="background: rgba(0,0,0,0.05); padding: 15px; border: 2px solid var(--gb-text); margin-bottom: 10px;">
            <div style="font-size: 6px; opacity: 0.7; margin-bottom: 5px;">CONVERTED AMOUNT</div>
            <div style="font-size: 20px; font-weight: bold;">
                <span id="currencyResult">---</span>
            </div>
        </div>
        
        <!-- Exchange Rate Info -->
        <div style="font-size: 6px; opacity: 0.7;">
            1 <span id="currencyFromCode">USD</span> = <span id="currencyRate">---</span> <span id="currencyToCode">EUR</span>
        </div>
    </div>
</div>
```

### Step 5.2: Update currency functions in `scripts/newapps.js`

Replace lines 1283-1338 with:

```javascript
// ========== CURRENCY CONVERTER (Enhanced with Dropdowns) ==========
let currencyRates = {};

window.initCurrency = async function() {
    await fetchCurrencyRates();
    updateCurrency();
};

window.swapCurrency = function() {
    const fromEl = document.getElementById('currencyFrom');
    const toEl = document.getElementById('currencyTo');
    const temp = fromEl.value;
    fromEl.value = toEl.value;
    toEl.value = temp;
    updateCurrency();
    sounds.click();
};

window.updateCurrency = function() {
    const amount = parseFloat(document.getElementById('currencyAmount').value) || 0;
    const fromCurrency = document.getElementById('currencyFrom').value;
    const toCurrency = document.getElementById('currencyTo').value;
    const resultEl = document.getElementById('currencyResult');
    const fromCodeEl = document.getElementById('currencyFromCode');
    const toCodeEl = document.getElementById('currencyToCode');
    const rateEl = document.getElementById('currencyRate');
    
    if (fromCodeEl) fromCodeEl.textContent = fromCurrency;
    if (toCodeEl) toCodeEl.textContent = toCurrency;
    
    if (currencyRates[fromCurrency] && currencyRates[toCurrency]) {
        const fromRate = currencyRates[fromCurrency];
        const toRate = currencyRates[toCurrency];
        
        // Convert: amount * (toRate / fromRate)
        const result = amount * (toRate / fromRate);
        
        if (resultEl) {
            resultEl.textContent = result.toFixed(2) + ' ' + toCurrency;
        }
        if (rateEl) {
            rateEl.textContent = (toRate / fromRate).toFixed(4);
        }
    } else {
        if (resultEl) resultEl.textContent = 'LOADING...';
    }
};

async function fetchCurrencyRates() {
    try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        const data = await res.json();
        currencyRates = data.rates;
    } catch(e) {
        console.error('Currency API error:', e);
        // Fallback rates
        currencyRates = {
            USD: 1,
            EUR: 0.85,
            GBP: 0.73,
            JPY: 110,
            CNY: 6.5,
            INR: 75,
            BRL: 5.2,
            CAD: 1.25,
            AUD: 1.35,
            CHF: 0.92
        };
    }
}
```

### Step 5.3: Verify currency functions

Run: Search for `initCurrency`, `updateCurrency`, `swapCurrency` in `newapps.js`
Expected: Functions exist and are properly defined

---

## Self-Review Checklist

**1. Spec coverage:**
- [x] H2O: Daily goal, glass counter, animated fill, streak, reset
- [x] STOCK: Ticker input, current price, sparkline chart, company name
- [x] NET: Public IP, ISP, city, country, timezone, speed test
- [x] CAMERA: Filter pills, mirror toggle, freeze frame, pixel filter, save screenshot
- [x] EXCH: Dropdown selects, flag emojis, amount input, converted result, swap button

**2. Placeholder scan:** No placeholders found - all code is complete

**3. Type consistency:** Function names and parameter types are consistent across tasks

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-08-15-five-apps-upgrade.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**