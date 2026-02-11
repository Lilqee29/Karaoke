// ========== POWER TOOLS BATCH 6 ==========

// 1. QR GENERATOR
window.initQr = function() {};
window.generateQR = function() {
    const text = document.getElementById('qrText').value;
    const out = document.getElementById('qrOutput');
    if(!text) return;
    out.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(text)}" style="border: 4px solid var(--gb-text);">`;
    if(typeof sounds !== 'undefined') sounds.coin();
};

// 2. ASCII ART GALLERY
const arts = [
    `(o_o)\n (v)\n/| |\\`,
    `/\\_/\\\n( o.o )\n > ^ <`,
    ` __      _\n o'')}____//\n \`_/      )\n (_(_/-(_/`,
    `   |\\__/,|   (\`\\\n _.|o o  |_   ) )\n-(((---(((--------`,
    `      /\\\n     /  \\\n    /____\\\n   (      )\n   |______|`
];
let artIdx = 0;
window.initAscii = function() {
    document.getElementById('asciiArt').textContent = arts[0];
};
window.nextAscii = function() {
    artIdx = (artIdx + 1) % arts.length;
    document.getElementById('asciiArt').textContent = arts[artIdx];
    if(typeof sounds !== 'undefined') sounds.select();
};
window.copyAscii = function() {
    const text = document.getElementById('asciiArt').textContent;
    navigator.clipboard.writeText(text).then(() => {
        alert("COPIED TO CLIPBOARD!");
        if(typeof sounds !== 'undefined') sounds.coin();
    });
};

// 3. NOISE GENERATOR
let noiseCtx = null;
let noiseNode = null;
window.initNoise = function() {};
window.toggleNoise = function(type) {
    if(noiseNode) {
        noiseNode.stop();
        noiseNode.disconnect();
        noiseNode = null;
        if(typeof sounds !== 'undefined') sounds.back();
        return;
    }
    if(!noiseCtx) noiseCtx = new (window.AudioContext || window.webkitAudioContext)();
    const bufferSize = 2 * noiseCtx.sampleRate;
    const buffer = noiseCtx.createBuffer(1, bufferSize, noiseCtx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if(type === 'white') output[i] = white;
        else if(type === 'pink') {
            // Simplified pink noise
            output[i] = (Math.random() * 2 - 1) * 0.1; 
        } else { // brown
            const lastOut = (i > 0) ? output[i-1] : 0;
            output[i] = (lastOut + (0.02 * white)) / 1.02;
            output[i] *= 3.5;
        }
    }
    noiseNode = noiseCtx.createBufferSource();
    noiseNode.buffer = buffer;
    noiseNode.loop = true;
    noiseNode.connect(noiseCtx.destination);
    noiseNode.start();
    if(typeof sounds !== 'undefined') sounds.launch();
};

// 4. LEVEL
window.initLevel = function() {
    const bubble = document.getElementById('bubble');
    const txt = document.getElementById('levelText');
    if (window.DeviceOrientationEvent) {
        window.ondeviceorientation = (e) => {
            if(document.getElementById('levelScreen').classList.contains('active')) {
                const x = Math.max(-45, Math.min(45, e.gamma || 0)); 
                const y = Math.max(-45, Math.min(45, e.beta || 0));
                bubble.style.left = (50 + (x/45)*50) + '%';
                bubble.style.top = (50 + (y/45)*50) + '%';
                txt.textContent = `X: ${Math.round(x)} | Y: ${Math.round(y)}`;
            }
        };
    } else {
        txt.textContent = "NO SENSOR";
    }
};

// 5. HEX CONVERTER
window.initHex = function() {};
window.convertHex = function(from) {
    const dec = document.getElementById('decInput');
    const hex = document.getElementById('hexInput');
    const bin = document.getElementById('binInput');
    let val = 0;
    if(from === 'dec') val = parseInt(dec.value, 10);
    else if(from === 'hex') val = parseInt(hex.value, 16);
    else if(from === 'bin') val = parseInt(bin.value, 2);
    
    if(!isNaN(val)) {
        if(from !== 'dec') dec.value = val;
        if(from !== 'hex') hex.value = val.toString(16).toUpperCase();
        if(from !== 'bin') bin.value = val.toString(2);
    }
};

// 6. ELEMENTS (Enhanced with Full JSON)
let elements = [];
let elemIdx = 0;
let showDetails = false;

window.initElem = async function() { 
    showDetails = false;
    const canvas = document.getElementById('atomCanvas');
    if(canvas) canvas.style.display = 'none';
    const symbol = document.getElementById('elemSymbol');
    if(symbol) symbol.style.display = 'inline-block';

    document.getElementById('elemSearch').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            window.searchElem(e.target.value);
            e.target.blur();
        }
    });

    // Load data if empty
    if(elements.length === 0) {
        document.getElementById('elemName').textContent = "LOADING DATA...";
        try {
            const res = await fetch('chemistry.json');
            const data = await res.json();
            // Convert object to array for navigation
            elements = Object.keys(data).map(key => {
                const e = data[key];
                return {
                    name: key,
                    s: e.symbol,
                    n: e.number,
                    mass: e.atomic_mass,
                    shells: e.shells, // Keep as array for drawing
                    config: e.electron_configuration,
                    summary: e.summary,
                    discovered: e.discovered_by,
                    phase: e.phase,
                    density: e.density,
                    melt: e.melt,
                    boil: e.boil,
                    category: e.category
                };
            }).sort((a,b) => a.n - b.n);
            
            updateElem();
        } catch(e) {
            document.getElementById('elemName').textContent = "DATA ERROR";
            console.error(e);
        }
    } else {
        updateElem();
    }
};

window.nextElem = function(dir) {
    if(elements.length === 0) return;
    elemIdx = (elemIdx + dir + elements.length) % elements.length;
    updateElem();
    if(typeof sounds !== 'undefined') sounds.click();
};

window.searchElem = function(q) {
    if(!q || elements.length === 0) return;
    const idx = elements.findIndex(e => e.name.toLowerCase() === q.toLowerCase() || e.s.toLowerCase() === q.toLowerCase());
    if(idx !== -1) {
        elemIdx = idx;
        updateElem();
        if(typeof sounds !== 'undefined') sounds.select();
    } else {
        alert("ELEMENT NOT FOUND");
    }
};

window.toggleElemDetails = function() {
    showDetails = !showDetails;
    const info = document.getElementById('elemInfo');
    const iso = document.getElementById('elemIso');
    const symbol = document.getElementById('elemSymbol');
    const canvas = document.getElementById('atomCanvas');
    
    if(showDetails) {
        info.style.display = 'none';
        iso.style.display = 'block';
        symbol.style.display = 'none';
        canvas.style.display = 'block';
        
        const e = elements[elemIdx];
        iso.innerHTML = `
            <div style="font-weight:bold; margin-bottom:5px; border-bottom:1px solid #555;">DETAILED INFO</div>
            <div>${e.category || '-'}</div>
            <div>Phase: ${e.phase || '-'}</div>
            <div>Melt: ${e.melt || '?'} K | Boil: ${e.boil || '?'} K</div>
            <div style="font-size: 7px; margin-top: 2px;">Config: ${e.config || '-'}</div>
            <div style="margin-top:5px; font-style:italic; max-height: 40px; overflow-y: auto;">${e.summary ? e.summary.substring(0, 100) + '...' : ''}</div>
        `;
        drawAtom(e);
    } else {
        info.style.display = 'block';
        iso.style.display = 'none';
        symbol.style.display = 'inline-block';
        canvas.style.display = 'none';
    }
    if(typeof sounds !== 'undefined') sounds.click();
};

function updateElem() {
    if(elements.length === 0) return;
    const e = elements[elemIdx];
    document.getElementById('elemSymbol').textContent = e.s;
    document.getElementById('elemName').textContent = e.name;
    document.getElementById('elemNum').textContent = `Atomic #: ${e.n}`;
    document.getElementById('elemMass').textContent = `Mass: ${e.mass}`;
    document.getElementById('elemShell').textContent = `Shells: ${e.shells ? e.shells.join(', ') : '?'}`;
    
    if(showDetails) toggleElemDetails(); 
}

function drawAtom(e) {
    const canvas = document.getElementById('atomCanvas');
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const cx = w/2;
    const cy = h/2;
    
    ctx.clearRect(0, 0, w, h);
    
    // Nucleus
    ctx.beginPath();
    ctx.arc(cx, cy, 6, 0, Math.PI*2);
    ctx.fillStyle = '#333';
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '6px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(e.s, cx, cy);
    
    if(!e.shells) return;
    
    // Shells
    const maxRadius = w/2 - 5;
    const shellStep = maxRadius / (e.shells.length + 1);
    
    e.shells.forEach((count, i) => {
        const r = (i + 1) * shellStep + 5;
        
        // Ring
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI*2);
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        // Electrons
        for(let j=0; j<count; j++) {
            const angle = (j / count) * Math.PI * 2 - (Math.PI/2);
            const ex = cx + Math.cos(angle) * r;
            const ey = cy + Math.sin(angle) * r;
            
            ctx.beginPath();
            ctx.arc(ex, ey, 2, 0, Math.PI*2);
            ctx.fillStyle = '#555';
            ctx.fill();
        }
    });
}

function updateElem() {
    if(elements.length === 0) return;
    const e = elements[elemIdx];
    document.getElementById('elemSymbol').textContent = e.s;
    document.getElementById('elemName').textContent = e.name;
    document.getElementById('elemNum').textContent = `Atomic #: ${e.n}`;
    document.getElementById('elemMass').textContent = `Mass: ${e.mass}`;
    document.getElementById('elemShell').textContent = `Shells: ${e.shell}`;
    
    // Reset view to basic when switching elements
    if(showDetails) toggleElemDetails(); 
}

// 7. SFX
window.initSfx = function() {};
const sfxMap = {
    'horn': [400, 'sawtooth', 0.5], 'vine': [50, 'square', 0.8], 'bruh': [200, 'sine', 0.6],
    'cricket': [800, 'triangle', 0.1], 'drum': [100, 'square', 0.5], 'wow': [600, 'sine', 0.4]
};
window.playSfx = function(id) {
    const [freq, type, dur] = sfxMap[id];
    if(typeof playSound !== 'undefined') playSound(freq, type, dur);
};

// 8. REGEX
window.initRegex = function() {};
window.testRegex = function() {
    const patStr = document.getElementById('regexPattern').value;
    const txt = document.getElementById('regexText').value;
    const res = document.getElementById('regexResult');
    try {
        const match = patStr.match(new RegExp('^/(.*?)/([gimy]*)$'));
        if(match) {
            const re = new RegExp(match[1], match[2]);
            const matches = txt.match(re);
            res.textContent = matches ? `Matches: ${matches.length} (${matches.join(', ')})` : 'Matches: 0';
        } else {
            res.textContent = "Format: /pattern/flags";
        }
    } catch(e) { res.textContent = "Error"; }
};

// 9. LOREM IPSUM
const loremTxt = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud.";
window.initLorem = function() {};
window.genLorem = function(n) {
    let out = "";
    for(let i=0; i<n; i++) out += loremTxt + "\n\n";
    document.getElementById('loremOut').value = out;
};
window.copyIpsum = function() {
    const text = document.getElementById('loremOut').value;
    navigator.clipboard.writeText(text);
    alert("COPIED!");
};

// 10. TYPER
let typeWords = ["REACT", "CODE", "GAME", "BOY", "PIXEL", "AUDIO", "CANVAS", "STYLE", "SCRIPT", "HTML"];
let typerStart = 0;
let typerCnt = 0;
window.initTyper = function() {
    typerStart = Date.now();
    typerCnt = 0;
    nextWord();
    document.getElementById('typerInput').focus();
    document.getElementById('typerStats').textContent = "GO!";
};
function nextWord() {
    const word = typeWords[Math.floor(Math.random()*typeWords.length)];
    document.getElementById('typerWord').textContent = word;
    const inp = document.getElementById('typerInput');
    inp.value = '';
    inp.oninput = (e) => {
        if(e.target.value.toUpperCase() === word) {
            typerCnt++;
            document.getElementById('typerStats').textContent = `Score: ${typerCnt}`;
            if(typeof sounds !== 'undefined') sounds.coin();
            nextWord();
        }
    };
}
