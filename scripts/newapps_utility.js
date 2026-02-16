// ========== LEVEL (SPIRIT LEVEL) ==========
window.initLevel = function() {
    const screen = document.getElementById('levelScreen');
    if(!screen) return;
    
    screen.innerHTML = `
        <div style="padding: 10px; height: 100%; background: #0f380f; color: #9bbc0f; font-family: 'VT323', monospace; text-align: center;">
            <div style="font-size: 14px; border-bottom: 2px solid #9bbc0f; margin-bottom: 20px;">PRECISION LEVEL</div>
            
            <div style="position: relative; width: 180px; height: 180px; border: 4px solid #9bbc0f; border-radius: 50%; margin: 0 auto; background: rgba(155, 188, 15, 0.1);">
                <div id="levelBubble" style="position: absolute; top: 50%; left: 50%; width: 30px; height: 30px; background: #9bbc0f; border-radius: 50%; transform: translate(-50%, -50%); transition: all 0.05s;"></div>
                <div style="position: absolute; top: 0; bottom: 0; left: 50%; width: 1px; background: rgba(155, 188, 15, 0.3);"></div>
                <div style="position: absolute; left: 0; right: 0; top: 50%; height: 1px; background: rgba(155, 188, 15, 0.3);"></div>
            </div>
            
            <div style="margin-top: 20px; font-size: 12px;">
                X: <span id="levelX">0.0</span>° | Y: <span id="levelY">0.0</span>°
            </div>
        </div>
    `;

    if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', handleLevel);
    } else {
        document.getElementById('levelX').textContent = "ERROR";
    }
};

function handleLevel(e) {
    if (currentScreen !== 'level') return;
    const x = e.beta;  // In degree in range [-180,180]
    const y = e.gamma; // In degree in range [-90,90]
    
    document.getElementById('levelX').textContent = x.toFixed(1);
    document.getElementById('levelY').textContent = y.toFixed(1);
    
    const bubble = document.getElementById('levelBubble');
    if(bubble) {
        // Map 45 degrees to 90px (radius)
        const bx = Math.max(-90, Math.min(90, y * 2));
        const by = Math.max(-90, Math.min(90, x * 2));
        bubble.style.transform = `translate(calc(-50% + ${bx}px), calc(-50% + ${by}px))`;
    }
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
            document.getElementById('sosCoords').textContent = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
        });
    }
};

window.sosAction = function(type) {
    sounds.launch();
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
            toggleFlashlight();
            i++;
        }, 300);
    }
};

// ========== UNIT CONVERTER ==========
window.initUnit = function() {
    const screen = document.getElementById('unitScreen');
    if(!screen) return;
    screen.innerHTML = `
        <div style="padding: 15px; text-align: center; background: #9bbc0f; color: #0f380f; height: 100%; font-family: 'VT323', monospace;">
            <div style="font-size: 14px; border-bottom: 2px solid #0f380f; margin-bottom: 15px;">UNIT CONVERTER</div>
            <input type="number" id="unitVal" placeholder="VALUE" style="width: 100%; margin-bottom: 5px;">
            <div style="display: flex; gap: 2px; margin-bottom: 10px;">
                <select id="unitFrom" style="flex: 1; font-size: 8px;">
                    <option value="km">KM</option><option value="mi">MI</option><option value="kg">KG</option><option value="lb">LB</option>
                </select>
                <div style="padding-top: 5px;">⮕</div>
                <select id="unitTo" style="flex: 1; font-size: 8px;">
                    <option value="mi">MI</option><option value="km">KM</option><option value="lb">LB</option><option value="kg">KG</option>
                </select>
            </div>
            <button onclick="convertUnit()" style="width: 100%; padding: 10px; margin-bottom: 10px;">CONVERT</button>
            <div id="unitRes" style="font-size: 20px; font-weight: bold;">0.00</div>
        </div>
    `;
};

window.convertUnit = function() {
    const val = parseFloat(document.getElementById('unitVal').value);
    const from = document.getElementById('unitFrom').value;
    const to = document.getElementById('unitTo').value;
    let res = 0;
    
    if(from === to) res = val;
    else if(from === 'km' && to === 'mi') res = val * 0.621371;
    else if(from === 'mi' && to === 'km') res = val / 0.621371;
    else if(from === 'kg' && to === 'lb') res = val * 2.20462;
    else if(from === 'lb' && to === 'kg') res = val / 2.20462;
    
    document.getElementById('unitRes').textContent = res.toFixed(2);
    sounds.launch();
};

// ========== TIP CALCULATOR ==========
window.initTip = function() {
    const screen = document.getElementById('tipScreen');
    if(!screen) return;
    screen.innerHTML = `
        <div style="padding: 15px; text-align: center; background: #9bbc0f; color: #0f380f; height: 100%; font-family: 'VT323', monospace;">
            <div style="font-size: 14px; border-bottom: 2px solid #0f380f; margin-bottom: 15px;">TIP CALCULATOR</div>
            <input type="number" id="tipBill" placeholder="BILL TOTAL ($)" style="width: 100%; margin-bottom: 8px;">
            <div style="display: flex; gap: 5px; margin-bottom: 10px;">
                <button onclick="calcTip(15)" style="flex: 1;">15%</button>
                <button onclick="calcTip(20)" style="flex: 1;">20%</button>
                <button onclick="calcTip(25)" style="flex: 1;">25%</button>
            </div>
            <div id="tipOutput" style="text-align: left; font-size: 10px; background: rgba(0,0,0,0.05); padding: 10px;">
                TIP: <span id="tipAmt">$0.00</span><br>
                TOTAL: <span id="tipTotal">$0.00</span>
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
    sounds.launch();
};
