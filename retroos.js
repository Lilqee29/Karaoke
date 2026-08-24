// ========== WINDOW MANAGEMENT ==========
let zIndexCounter = 100;
const windows = document.querySelectorAll('.window');

// Desktop icons
document.querySelectorAll('.desktop-icon').forEach(icon => {
    icon.addEventListener('dblclick', () => {
        const appName = icon.dataset.app;
        const window = document.getElementById(`${appName}-window`);
        window.classList.add('active');
        window.style.zIndex = ++zIndexCounter;
        
        // Initialize app-specific logic
        if (appName === 'snake' && !window.dataset.initialized) {
            initSnake();
            window.dataset.initialized = 'true';
        } else if (appName === 'minesweeper' && !window.dataset.initialized) {
            initMines();
            window.dataset.initialized = 'true';
        } else if (appName === 'paint' && !window.dataset.initialized) {
            initPaint();
            window.dataset.initialized = 'true';
        }
    });
});

// Window controls
windows.forEach(win => {
    const closeBtn = win.querySelector('.close-btn');
    const minimizeBtn = win.querySelector('.minimize-btn');
    const maximizeBtn = win.querySelector('.maximize-btn');
    const titleBar = win.querySelector('.title-bar');
    
    // Close
    closeBtn?.addEventListener('click', () => {
        win.classList.remove('active');
    });
    
    // Minimize
    minimizeBtn?.addEventListener('click', () => {
        win.classList.remove('active');
    });
    
    // Maximize
    maximizeBtn?.addEventListener('click', () => {
        win.classList.toggle('maximized');
    });
    
    // Drag
    let isDragging = false;
    let currentX, currentY, initialX, initialY;
    
    titleBar.addEventListener('mousedown', (e) => {
        if (win.classList.contains('maximized')) return;
        isDragging = true;
        win.style.zIndex = ++zIndexCounter;
        initialX = e.clientX - (parseInt(win.style.left) || 0);
        initialY = e.clientY - (parseInt(win.style.top) || 0);
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        win.style.left = currentX + 'px';
        win.style.top = currentY + 'px';
    });
    
    document.addEventListener('mouseup', () => {
        isDragging = false;
    });
});

// Clock
function updateClock() {
    const now = new Date();
    const hours = now.getHours() % 12 || 12;
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    document.getElementById('clock').textContent = `${hours}:${minutes} ${ampm}`;
}
updateClock();
setInterval(updateClock, 1000);

// ========== KARAOKE APP (IMPROVED WITH LRCLIB) ==========
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const results = document.getElementById('results');
const lyricsDisplay = document.getElementById('lyricsDisplay');
const lyricsContent = document.getElementById('lyricsContent');
const backBtn = document.getElementById('backBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const playPauseBtn = document.getElementById('playPauseBtn');

let currentLineIndex = 0;
let lyricsArray = [];
let isPlaying = false;
let intervalId = null;

async function fetchLyrics(searchTerm) {
    try {
        searchBtn.textContent = 'LOADING...';
        searchBtn.disabled = true;
        const response = await fetch(`https://api.lyrics.ovh/suggest/${searchTerm}`);
        const data = await response.json();
        displayResults(data.data);
    } catch (error) {
        console.error(error);
        alert('Search failed');
    } finally {
        searchBtn.textContent = 'SEARCH';
        searchBtn.disabled = false;
    }
}

searchBtn.addEventListener('click', () => {
    const term = searchInput.value.trim();
    if (term) fetchLyrics(term);
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchBtn.click();
});

async function fetchFullLyrics(artist, title) {
    try {
        // Try LRCLIB first (faster, synced lyrics!)
        const response = await fetch(`https://lrclib.net/api/get?artist_name=${encodeURIComponent(artist)}&track_name=${encodeURIComponent(title)}`);
        const data = await response.json();
        
        if (data.syncedLyrics || data.plainLyrics) {
            results.style.display = 'none';
            lyricsDisplay.classList.add('active');
            displayLyrics(data.syncedLyrics || data.plainLyrics);
        } else {
            throw new Error('No lyrics found');
        }
    } catch (error) {
        // Fallback to lyrics.ovh
        try {
            const response = await fetch(`https://api.lyrics.ovh/v1/${artist}/${title}`);
            const data = await response.json();
            if (data.lyrics) {
                results.style.display = 'none';
                lyricsDisplay.classList.add('active');
                displayLyrics(data.lyrics);
            } else {
                alert('Lyrics not found');
            }
        } catch (err) {
            alert('Error fetching lyrics');
        }
    }
}

function displayLyrics(lyrics) {
    lyricsArray = lyrics.split(/\r?\n/).filter(line => {
        // Remove LRC timestamps if present
        return line.trim() !== '' && !line.match(/^\[\d+:\d+\.\d+\]$/);
    }).map(line => {
        // Strip LRC timestamp but keep the text
        return line.replace(/^\[\d+:\d+\.\d+\]\s*/, '');
    });
    
    currentLineIndex = 0;
    isPlaying = false;
    playPauseBtn.textContent = '▶';
    
    lyricsContent.innerHTML = '';
    lyricsArray.forEach((line, index) => {
        const lineDiv = document.createElement('div');
        lineDiv.className = 'lyric-line';
        lineDiv.dataset.index = index;
        lineDiv.textContent = line;
        lyricsContent.appendChild(lineDiv);
    });
    
    highlightLine(0);
}

function highlightLine(index) {
    document.querySelectorAll('.lyric-line').forEach(line => line.classList.remove('current'));
    const currentLine = document.querySelector(`[data-index="${index}"]`);
    if (currentLine) {
        currentLine.classList.add('current');
        currentLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function displayResults(songs) {
    results.innerHTML = '';
    results.style.display = 'grid';
    
    songs.forEach(song => {
        const songCard = `
            <div class="song-item" data-artist="${song.artist.name}" data-title="${song.title}">
                <img src="${song.album.cover_medium}" alt="${song.title}" class="album-cover">
                <div class="song-title">${song.title}</div>
                <div class="song-artist">${song.artist.name}</div>
            </div>
        `;
        results.innerHTML += songCard;
    });
    
    document.querySelectorAll('.song-item').forEach(s => {
        s.addEventListener('click', () => {
            fetchFullLyrics(s.dataset.artist, s.dataset.title);
        });
    });
}

backBtn.addEventListener('click', () => {
    lyricsDisplay.classList.remove('active');
    results.style.display = 'grid';
    if (intervalId) clearInterval(intervalId);
});

prevBtn.addEventListener('click', () => {
    if (currentLineIndex > 0) {
        currentLineIndex--;
        highlightLine(currentLineIndex);
    }
});

nextBtn.addEventListener('click', () => {
    if (currentLineIndex < lyricsArray.length - 1) {
        currentLineIndex++;
        highlightLine(currentLineIndex);
    }
});

playPauseBtn.addEventListener('click', () => {
    if (isPlaying) {
        clearInterval(intervalId);
        isPlaying = false;
        playPauseBtn.textContent = '▶';
    } else {
        isPlaying = true;
        playPauseBtn.textContent = '⏸';
        intervalId = setInterval(() => {
            if (currentLineIndex < lyricsArray.length - 1) {
                currentLineIndex++;
                highlightLine(currentLineIndex);
            } else {
                clearInterval(intervalId);
                isPlaying = false;
                playPauseBtn.textContent = '▶';
            }
        }, 3000);
    }
});

// Arrow key controls
document.addEventListener('keydown', (e) => {
    if (!lyricsDisplay.classList.contains('active')) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nextBtn.click();
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') prevBtn.click();
    else if (e.key === ' ') {
        e.preventDefault();
        playPauseBtn.click();
    }
});

// ========== SNAKE GAME ==========
function initSnake() {
    const canvas = document.getElementById('snakeCanvas');
    const ctx = canvas.getContext('2d');
    const box = 20;
    let snake = [{ x: 10 * box, y: 10 * box }];
    let food = { x: Math.floor(Math.random() * 19 + 1) * box, y: Math.floor(Math.random() * 19 + 1) * box };
    let score = 0;
    let highScore = localStorage.getItem('snakeHigh') || 0;
    let d;
    let game;
    
    document.getElementById('highScore').textContent = highScore;
    
    document.addEventListener('keydown', direction);
    
    function direction(event) {
        if (event.key === ' ' && !game) {
            game = setInterval(draw, 100);
        } else if (event.key === 'ArrowLeft' && d != 'RIGHT') d = 'LEFT';
        else if (event.key === 'ArrowUp' && d != 'DOWN') d = 'UP';
        else if (event.key === 'ArrowRight' && d != 'LEFT') d = 'RIGHT';
        else if (event.key === 'ArrowDown' && d != 'UP') d = 'DOWN';
    }
    
    function draw() {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        for (let i = 0; i < snake.length; i++) {
            ctx.fillStyle = i === 0 ? 'lime' : 'green';
            ctx.fillRect(snake[i].x, snake[i].y, box, box);
            ctx.strokeStyle = 'darkgreen';
            ctx.strokeRect(snake[i].x, snake[i].y, box, box);
        }
        
        ctx.fillStyle = 'red';
        ctx.fillRect(food.x, food.y, box, box);
        
        let snakeX = snake[0].x;
        let snakeY = snake[0].y;
        
        if (d === 'LEFT') snakeX -= box;
        if (d === 'UP') snakeY -= box;
        if (d === 'RIGHT') snakeX += box;
        if (d === 'DOWN') snakeY += box;
        
        if (snakeX === food.x && snakeY === food.y) {
            score++;
            document.getElementById('score').textContent = score;
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('snakeHigh', highScore);
                document.getElementById('highScore').textContent = highScore;
            }
            food = { x: Math.floor(Math.random() * 19 + 1) * box, y: Math.floor(Math.random() * 19 + 1) * box };
        } else {
            snake.pop();
        }
        
        let newHead = { x: snakeX, y: snakeY };
        
        if (snakeX < 0 || snakeY < 0 || snakeX >= canvas.width || snakeY >= canvas.height || collision(newHead, snake)) {
            clearInterval(game);
            game = null;
            d = null;
            snake = [{ x: 10 * box, y: 10 * box }];
            score = 0;
            document.getElementById('score').textContent = score;
        }
        
        snake.unshift(newHead);
    }
    
    function collision(head, array) {
        for (let i = 0; i < array.length; i++) {
            if (head.x === array[i].x && head.y === array[i].y) return true;
        }
        return false;
    }
}

// ========== CALCULATOR ==========
let calcValue = '0';

function appendCalc(val) {
    if (calcValue === '0') calcValue = val;
    else calcValue += val;
    document.getElementById('calcDisplay').value = calcValue;
}

function clearCalc() {
    calcValue = '0';
    document.getElementById('calcDisplay').value = calcValue;
}

function backspaceCalc() {
    calcValue = calcValue.slice(0, -1) || '0';
    document.getElementById('calcDisplay').value = calcValue;
}

function calculateCalc() {
    try {
        calcValue = eval(calcValue).toString();
        document.getElementById('calcDisplay').value = calcValue;
    } catch {
        calcValue = 'Error';
        document.getElementById('calcDisplay').value = calcValue;
        setTimeout(() => { calcValue = '0'; document.getElementById('calcDisplay').value = '0'; }, 1000);
    }
}

// ========== PAINT ==========
// ── Paint State ────────────────────────────────────────────
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

const TERTIARY_PRESETS = ['#00ff00','#00ccff','#ff00ff','#ffff00','#ff8800','#88ff00','#00ffaa','#ff0088'];

function paintSetMode(mode) {
    _paintMode = mode;
    document.querySelectorAll('.paint-mode-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.mode === mode);
        b.style.background = b.dataset.mode === mode ? 'var(--gb-text)' : 'transparent';
        b.style.color = b.dataset.mode === mode ? 'var(--gb-bg)' : 'var(--gb-text)';
        b.style.borderColor = b.dataset.mode === mode ? 'var(--gb-text)' : '#444';
    });
    // Show/hide shape buttons
    document.querySelectorAll('.paint-shape-btn').forEach(b => {
        b.style.display = mode === 'shape' ? '' : 'none';
    });
}

function paintSetShape(shape) {
    _paintShape = shape;
    document.querySelectorAll('.paint-shape-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.shape === shape);
        b.style.background = b.dataset.shape === shape ? '#333' : 'transparent';
        b.style.color = b.dataset.shape === shape ? '#fff' : '#aaa';
    });
}

function paintSetBlendColor(slot, color) {
    if (slot === 'primary') _paintPrimary = color;
    else if (slot === 'secondary') _paintSecondary = color;
    paintUpdateTertiary();
}

function paintCycleTertiary() {
    _paintTertiaryIdx = (_paintTertiaryIdx + 1) % TERTIARY_PRESETS.length;
    _paintTertiary = TERTIARY_PRESETS[_paintTertiaryIdx];
    paintUpdateTertiary();
}

function paintUpdateTertiary() {
    // Mix primary + secondary to get tertiary
    const p = hexToRgb(_paintPrimary);
    const s = hexToRgb(_paintSecondary);
    const t = hexToRgb(_paintTertiary);
    // Blend tertiary from the preset
    const blend = parseInt(document.getElementById('paintBlendAmount')?.value || 50) / 100;
    const mr = Math.round(p.r * (1-blend) + s.r * blend);
    const mg = Math.round(p.g * (1-blend) + s.g * blend);
    const mb = Math.round(p.b * (1-blend) + s.b * blend);
    // The tertiary preview shows a mix of the mix with the preset
    const fr = Math.round(mr * 0.5 + t.r * 0.5);
    const fg = Math.round(mg * 0.5 + t.g * 0.5);
    const fb = Math.round(mb * 0.5 + t.b * 0.5);
    const el = document.getElementById('paintTertiaryPreview');
    if (el) el.style.background = `rgb(${fr},${fg},${fb})`;
}

function hexToRgb(hex) {
    const h = hex.replace('#','');
    return {
        r: parseInt(h.substring(0,2),16) || 0,
        g: parseInt(h.substring(2,4),16) || 0,
        b: parseInt(h.substring(4,6),16) || 0
    };
}

function rgbToHex(r,g,b) {
    return '#' + [r,g,b].map(v => Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
}

function lerpColor(c1, c2, t) {
    const a = hexToRgb(c1), b = hexToRgb(c2);
    return rgbToHex(
        a.r + (b.r - a.r) * t,
        a.g + (b.g - a.g) * t,
        a.b + (b.b - a.b) * t
    );
}

function initPaint() {
    const canvas = document.getElementById('paintCanvas');
    const ctx = canvas.getContext('2d');
    let painting = false;
    _paintUndoStack = [];
    _paintLastX = null;
    _paintLastY = null;

    // Fill white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Save initial state
    _paintSaveUndo(ctx, canvas);

    // Brush size label
    const sizeSlider = document.getElementById('brushSize');
    const sizeLabel = document.getElementById('brushSizeLabel');
    if (sizeSlider && sizeLabel) {
        sizeSlider.oninput = () => { sizeLabel.textContent = sizeSlider.value; };
    }

    // Hide shape buttons initially
    document.querySelectorAll('.paint-shape-btn').forEach(b => { b.style.display = 'none'; });

    function getPos(e) {
        const r = canvas.getBoundingClientRect();
        const t = e.touches ? e.touches[0] : e;
        return { x: t.clientX - r.left, y: t.clientY - r.top };
    }

    function paintAt(x, y) {
        const size = parseInt(sizeSlider.value);
        const mode = _paintMode;

        ctx.save();

        if (mode === 'normal') {
            ctx.fillStyle = _paintPrimary;
            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();

        } else if (mode === 'gradient') {
            // Linear gradient from primary → secondary based on position
            const grad = ctx.createLinearGradient(x - size, y, x + size, y);
            grad.addColorStop(0, _paintPrimary);
            grad.addColorStop(0.5, lerpColor(_paintPrimary, _paintSecondary, 0.5));
            grad.addColorStop(1, _paintSecondary);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();

        } else if (mode === 'rainbow') {
            _paintHue = (_paintHue + 3) % 360;
            ctx.fillStyle = `hsl(${_paintHue}, 100%, 55%)`;
            ctx.globalAlpha = 0.9;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();

        } else if (mode === 'glow') {
            ctx.shadowColor = _paintPrimary;
            ctx.shadowBlur = size * 2;
            ctx.fillStyle = _paintPrimary;
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.arc(x, y, size * 0.7, 0, Math.PI * 2);
            ctx.fill();
            // Inner bright core
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 0.9;
            ctx.fillStyle = lerpColor(_paintPrimary, '#ffffff', 0.5);
            ctx.beginPath();
            ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
            ctx.fill();

        } else if (mode === 'blur') {
            // Paint with semi-transparent overlapping circles for blur effect
            ctx.globalAlpha = 0.08;
            ctx.fillStyle = _paintPrimary;
            for (let i = 0; i < 5; i++) {
                const ox = (Math.random() - 0.5) * size;
                const oy = (Math.random() - 0.5) * size;
                ctx.beginPath();
                ctx.arc(x + ox, y + oy, size * 0.8, 0, Math.PI * 2);
                ctx.fill();
            }

        } else if (mode === 'spray') {
            // Spray paint / airbrush
            ctx.fillStyle = _paintPrimary;
            const density = size * 2;
            for (let i = 0; i < density; i++) {
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * size;
                const px = x + Math.cos(angle) * radius;
                const py = y + Math.sin(angle) * radius;
                ctx.globalAlpha = Math.random() * 0.4 + 0.1;
                ctx.fillRect(px, py, 1, 1);
            }

        } else if (mode === 'neon') {
            // Neon glow — bright center + multiple shadow layers
            const colors = [_paintPrimary, lerpColor(_paintPrimary, '#ffffff', 0.4), '#ffffff'];
            const sizes = [size * 1.5, size * 0.8, size * 0.3];
            colors.forEach((c, i) => {
                ctx.shadowColor = c;
                ctx.shadowBlur = sizes[i] * 2;
                ctx.fillStyle = c;
                ctx.globalAlpha = i === 2 ? 1 : 0.5;
                ctx.beginPath();
                ctx.arc(x, y, sizes[i], 0, Math.PI * 2);
                ctx.fill();
            });

        } else if (mode === 'shape') {
            // Shape mode — handled by drag (mousedown → mouseup)
            // This is a preview dot
            ctx.fillStyle = _paintPrimary;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    function drawShape(x0, y0, x1, y1) {
        const size = parseInt(sizeSlider.value);
        const dx = x1 - x0, dy = y1 - y0;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;

        ctx.save();
        ctx.fillStyle = _paintPrimary;
        ctx.strokeStyle = _paintPrimary;
        ctx.lineWidth = Math.max(1, size / 3);
        ctx.globalAlpha = 0.8;

        // Gradient fill
        const grad = ctx.createLinearGradient(x0, y0, x1, y1);
        grad.addColorStop(0, _paintPrimary);
        grad.addColorStop(0.5, _paintSecondary);
        grad.addColorStop(1, _paintTertiary);
        ctx.fillStyle = grad;
        ctx.strokeStyle = _paintPrimary;

        const shape = _paintShape;
        if (shape === 'circle') {
            ctx.beginPath();
            ctx.arc(cx, cy, dist / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        } else if (shape === 'square') {
            ctx.fillRect(cx - dist/2, cy - dist/2, dist, dist);
            ctx.strokeRect(cx - dist/2, cy - dist/2, dist, dist);
        } else if (shape === 'triangle') {
            ctx.beginPath();
            ctx.moveTo(cx, cy - dist/2);
            ctx.lineTo(cx - dist/2, cy + dist/2);
            ctx.lineTo(cx + dist/2, cy + dist/2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else if (shape === 'star') {
            ctx.beginPath();
            for (let i = 0; i < 10; i++) {
                const r = i % 2 === 0 ? dist/2 : dist/5;
                const a = (Math.PI / 5) * i - Math.PI / 2;
                const sx = cx + r * Math.cos(a);
                const sy = cy + r * Math.sin(a);
                i === 0 ? ctx.moveTo(sx, sy) : ctx.lineTo(sx, sy);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        } else if (shape === 'line') {
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.lineTo(x1, y1);
            ctx.stroke();
            // Glow
            ctx.shadowColor = _paintPrimary;
            ctx.shadowBlur = size;
            ctx.stroke();
        } else if (shape === 'diamond') {
            ctx.beginPath();
            ctx.moveTo(cx, cy - dist/2);
            ctx.lineTo(cx + dist/2, cy);
            ctx.lineTo(cx, cy + dist/2);
            ctx.lineTo(cx - dist/2, cy);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        ctx.restore();
    }

    // Interpolate between points for smooth lines
    function linePaint(x0, y0, x1, y1) {
        const dist = Math.sqrt((x1-x0)**2 + (y1-y0)**2);
        const steps = Math.max(1, Math.ceil(dist / 2));
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            paintAt(x0 + (x1-x0)*t, y0 + (y1-y0)*t);
        }
    }

    function onDown(e) {
        e.preventDefault();
        painting = true;
        const p = getPos(e);
        _paintLastX = p.x;
        _paintLastY = p.y;

        if (_paintMode === 'shape') {
            _paintShapeStart = p;
            // Save canvas for preview
            _paintShapePreview = ctx.getImageData(0, 0, canvas.width, canvas.height);
        } else {
            paintAt(p.x, p.y);
        }
    }

    function onMove(e) {
        if (!painting) return;
        e.preventDefault();
        const p = getPos(e);

        if (_paintMode === 'shape' && _paintShapeStart && _paintShapePreview) {
            // Preview shape by restoring canvas and drawing shape
            ctx.putImageData(_paintShapePreview, 0, 0);
            drawShape(_paintShapeStart.x, _paintShapeStart.y, p.x, p.y);
        } else {
            linePaint(_paintLastX, _paintLastY, p.x, p.y);
        }

        _paintLastX = p.x;
        _paintLastY = p.y;
    }

    function onUp(e) {
        if (!painting) return;
        painting = false;

        if (_paintMode === 'shape' && _paintShapeStart) {
            const p = e.changedTouches ? 
                { x: e.changedTouches[0].clientX - canvas.getBoundingClientRect().left,
                  y: e.changedTouches[0].clientY - canvas.getBoundingClientRect().top } :
                getPos(e);
            ctx.putImageData(_paintShapePreview, 0, 0);
            drawShape(_paintShapeStart.x, _paintShapeStart.y, p.x, p.y);
            _paintShapeStart = null;
            _paintShapePreview = null;
        }

        _paintSaveUndo(ctx, canvas);
        _paintLastX = null;
        _paintLastY = null;
    }

    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseup', onUp);
    canvas.addEventListener('mouseleave', onUp);
    canvas.addEventListener('touchstart', onDown, { passive: false });
    canvas.addEventListener('touchmove', onMove, { passive: false });
    canvas.addEventListener('touchend', onUp);
}

function _paintSaveUndo(ctx, canvas) {
    _paintUndoStack.push(canvas.toDataURL());
    if (_paintUndoStack.length > _paintMaxUndo) _paintUndoStack.shift();
}

function paintFunc(action) {
    const canvas = document.getElementById('paintCanvas');
    const ctx = canvas.getContext('2d');
    if (action === 'undo') {
        if (_paintUndoStack.length > 1) {
            _paintUndoStack.pop();
            const img = new Image();
            img.onload = () => { ctx.clearRect(0,0,canvas.width,canvas.height); ctx.drawImage(img,0,0); };
            img.src = _paintUndoStack[_paintUndoStack.length - 1];
        }
    } else if (action === 'clear') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        _paintSaveUndo(ctx, canvas);
    } else if (action === 'eraser') {
        const btn = document.getElementById('paintEraserBtn');
        if (_paintMode === 'eraser') {
            _paintMode = 'normal';
            btn.style.background = '';
            btn.style.color = '';
        } else {
            _paintMode = 'eraser';
            btn.style.background = 'var(--gb-text)';
            btn.style.color = 'var(--gb-bg)';
        }
        // Override paint to use eraser
        if (_paintMode === 'eraser') {
            // Monkey-patch: set primary to canvas bg
            _paintPrimary = '#ffffff';
            paintSetMode('normal');
            _paintMode = 'eraser'; // keep eraser state
        }
    } else if (action === 'save') {
        const link = document.createElement('a');
        link.download = `paint-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
    }
}

function setPaintColor(color) {
    _paintPrimary = color;
    document.getElementById('paintPrimary').value = color;
    const btn = document.getElementById('paintEraserBtn');
    if (_paintMode === 'eraser') {
        _paintMode = 'normal';
        if (btn) { btn.style.background = ''; btn.style.color = ''; }
    }
}

function clearPaint() {
    const canvas = document.getElementById('paintCanvas');
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// ========== MINESWEEPER ==========
function initMines() {
    const grid = document.getElementById('mineGrid');
    const rows = 8, cols = 8, minesCount = 10;
    let cells = [];
    let revealed = 0;
    
    grid.innerHTML = '';
    grid.style.gridTemplateColumns = `repeat(${cols}, 25px)`;
    
    // Generate mines
    let mines = new Set();
    while (mines.size < minesCount) {
        mines.add(Math.floor(Math.random() * rows * cols));
    }
    
    // Create cells
    for (let i = 0; i < rows * cols; i++) {
        const cell = document.createElement('div');
        cell.className = 'mine-cell';
        cell.dataset.index = i;
        cell.dataset.mine = mines.has(i);
        cell.addEventListener('click', () => revealCell(i));
        cell.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            cell.classList.toggle('flagged');
        });
        cells.push(cell);
        grid.appendChild(cell);
    }
    
    function revealCell(index) {
        const cell = cells[index];
        if (cell.classList.contains('revealed') || cell.classList.contains('flagged')) return;
        
        cell.classList.add('revealed');
        
        if (cell.dataset.mine === 'true') {
            cell.textContent = '💣';
            setTimeout(() => alert('BOOM! Game Over'), 100);
            return;
        }
        
        const neighbors = getNeighbors(index);
        const mineCount = neighbors.filter(n => cells[n].dataset.mine === 'true').length;
        
        if (mineCount > 0) {
            cell.textContent = mineCount;
            cell.style.color = ['blue', 'green', 'red', 'purple', 'maroon', 'turquoise', 'black', 'gray'][mineCount - 1];
        } else {
            neighbors.forEach(n => revealCell(n));
        }
        
        revealed++;
        if (revealed === rows * cols - minesCount) {
            setTimeout(() => alert('You Win!'), 100);
        }
    }
    
    function getNeighbors(index) {
        const row = Math.floor(index / cols);
        const col = index % cols;
        const neighbors = [];
        
        for (let r = -1; r <= 1; r++) {
            for (let c = -1; c <= 1; c++) {
                if (r === 0 && c === 0) continue;
                const newRow = row + r;
                const newCol = col + c;
                if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
                    neighbors.push(newRow * cols + newCol);
                }
            }
        }
        return neighbors;
    }
}