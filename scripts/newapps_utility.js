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
    
    if (x === null || y === null) return;

    document.getElementById('levelX').textContent = x.toFixed(1);
    document.getElementById('levelY').textContent = y.toFixed(1);
    
    const bubble = document.getElementById('levelBubble');
    if(bubble) {
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
            const el = document.getElementById('sosCoords');
            if(el) el.textContent = `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`;
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

// ========== COMPASS (NEW) ==========
window.initCompass = function() {
    const screen = document.getElementById('compassScreen');
    if(!screen) return;
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        screen.innerHTML += `<button onclick="requestCompassPerm()" style="position:absolute; bottom:10px; left:10px; z-index:100; font-size:8px;">CALIBRATE/PERM</button>`;
    }
    window.addEventListener('deviceorientation', handleCompass);
};

window.requestCompassPerm = function() {
    DeviceOrientationEvent.requestPermission()
        .then(response => {
            if (response === 'granted') {
                window.addEventListener('deviceorientation', handleCompass);
                alert("COMPASS CALIBRATED");
            }
        })
        .catch(console.error);
};

function handleCompass(e) {
    if (currentScreen !== 'compass') return;
    let heading = e.webkitCompassHeading || Math.abs(e.alpha - 360);
    if (!heading) return;

    const needle = document.getElementById('compassNeedle');
    const degText = document.getElementById('compassDeg');
    
    if(needle) needle.style.transform = `translateX(-50%) rotate(${heading}deg)`;
    if(degText) {
        let dir = '';
        if (heading >= 337.5 || heading < 22.5) dir = 'NORTH';
        else if (heading >= 22.5 && heading < 67.5) dir = 'NE';
        else if (heading >= 67.5 && heading < 112.5) dir = 'EAST';
        else if (heading >= 112.5 && heading < 157.5) dir = 'SE';
        else if (heading >= 157.5 && heading < 202.5) dir = 'SOUTH';
        else if (heading >= 202.5 && heading < 247.5) dir = 'SW';
        else if (heading >= 247.5 && heading < 292.5) dir = 'WEST';
        else if (heading >= 292.5 && heading < 337.5) dir = 'NW';
        degText.textContent = `${Math.round(heading)}° ${dir}`;
    }
}

// ========== SCANNER (NEW) ==========
let scanStream = null;
window.initScan = function() {
    if(scanStream) {
        scanStream.getTracks().forEach(track => track.stop());
        scanStream = null;
    }
    const res = document.getElementById('scanResult');
    if(res) res.textContent = "READY TO SCAN";
};

window.startScanning = async function() {
    const video = document.getElementById('scanVideo');
    const result = document.getElementById('scanResult');
    if(!video) return;
    
    try {
        scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        video.srcObject = scanStream;
        video.play();
        result.textContent = "SCANNING...";
        
        if ('BarcodeDetector' in window) {
            const detector = new BarcodeDetector();
            const scanInterval = setInterval(async () => {
                if(currentScreen !== 'scan') { clearInterval(scanInterval); return; }
                try {
                    const codes = await detector.detect(video);
                    if (codes.length > 0) {
                        result.textContent = `FOUND: ${codes[0].rawValue}`;
                        if(typeof sounds !== 'undefined') sounds.coin();
                    }
                } catch(e) {}
            }, 500);
        } else {
             result.textContent = "CAMERA ACTIVE (Detection API Missing)";
        }
    } catch(err) {
        result.textContent = "CAMERA ERROR: " + err.message;
    }
};

const originalGoBack = window.goBack;
window.goBack = function() {
    if(scanStream) {
        scanStream.getTracks().forEach(track => track.stop());
        scanStream = null;
    }
    if(originalGoBack) originalGoBack();
};

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

// Map 'barcode' app to scanner if app.js uses 'barcode' ID
window.initBarcode = window.initScan;
