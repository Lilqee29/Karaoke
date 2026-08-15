// ========== POWER TOOLS BATCH 6 ==========

// 1. QR GENERATOR + SCANNER (MERGED)
let _qrScanStream = null;
let _qrScanRAF = null;

window.switchQrTab = function(tab) {
    document.getElementById('qrGenTab').style.display = tab === 'generate' ? 'flex' : 'none';
    document.getElementById('qrScanTab').style.display = tab === 'scan' ? 'flex' : 'none';
    document.getElementById('qrGenTabBtn').style.background = tab === 'generate' ? 'var(--gb-text)' : 'transparent';
    document.getElementById('qrGenTabBtn').style.color = tab === 'generate' ? 'var(--gb-bg)' : 'var(--gb-text)';
    document.getElementById('qrScanTabBtn').style.background = tab === 'scan' ? 'var(--gb-text)' : 'transparent';
    document.getElementById('qrScanTabBtn').style.color = tab === 'scan' ? 'var(--gb-bg)' : 'var(--gb-text)';
    if (tab === 'generate') qrStopScan();
    sounds.click();
};

window.initQr = function() { qrStopScan(); };
window.generateQR = function() {
    const text = document.getElementById('qrInput').value;
    const out = document.getElementById('qrOutput');
    if(!text) return;
    out.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(text)}" style="border: 4px solid var(--gb-text);">`;
    if(typeof sounds !== 'undefined') sounds.coin();
};

window.qrStartScan = async function() {
    const video = document.getElementById('qrScanVideo');
    const canvas = document.getElementById('qrScanCanvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const resultEl = document.getElementById('qrScanResult');
    const scanBtn = document.getElementById('qrScanBtn');

    try {
        _qrScanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        video.srcObject = _qrScanStream;
        scanBtn.textContent = 'STOP SCAN';
        resultEl.textContent = 'SCANNING...';

        video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            _qrScanFrame(video, canvas, ctx, resultEl);
        };
    } catch(e) {
        resultEl.textContent = 'CAMERA ACCESS DENIED';
    }
};

function _qrScanFrame(video, canvas, ctx, resultEl) {
    if (!video.srcObject) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (typeof jsQR !== 'undefined') {
        const code = jsQR(imgData.data, imgData.width, imgData.height);
        if (code && code.data) {
            resultEl.textContent = code.data;
            document.getElementById('qrOpenBtn').style.display = 'block';
            document.getElementById('qrCopyBtn').style.display = 'block';
            document.getElementById('qrScanBtn').textContent = 'SCAN AGAIN';
            qrStopScan();
            sounds.coin();
            return;
        }
    }
    _qrScanRAF = requestAnimationFrame(() => _qrScanFrame(video, canvas, ctx, resultEl));
}

function qrStopScan() {
    if (_qrScanRAF) { cancelAnimationFrame(_qrScanRAF); _qrScanRAF = null; }
    if (_qrScanStream) {
        _qrScanStream.getTracks().forEach(t => t.stop());
        _qrScanStream = null;
    }
    const scanBtn = document.getElementById('qrScanBtn');
    if (scanBtn) scanBtn.textContent = 'START SCAN';
}

window.qrOpenLink = function() {
    const txt = document.getElementById('qrScanResult').textContent;
    if (txt && (txt.startsWith('http://') || txt.startsWith('https://'))) {
        window.open(txt, '_blank');
    }
};

window.qrCopyResult = function() {
    const txt = document.getElementById('qrScanResult').textContent;
    if (txt) navigator.clipboard.writeText(txt).then(() => alert('COPIED!'));
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

// 6. ELEMENTS - Moved to newapps.js (Periodic Table Grid)

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
