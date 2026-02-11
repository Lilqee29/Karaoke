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
function initPaint() {
    const canvas = document.getElementById('paintCanvas');
    const ctx = canvas.getContext('2d');
    let painting = false;
    
    canvas.addEventListener('mousedown', () => painting = true);
    canvas.addEventListener('mouseup', () => painting = false);
    canvas.addEventListener('mouseleave', () => painting = false);
    
    canvas.addEventListener('mousemove', (e) => {
        if (!painting) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        ctx.fillStyle = document.getElementById('paintColor').value;
        ctx.beginPath();
        ctx.arc(x, y, document.getElementById('brushSize').value, 0, Math.PI * 2);
        ctx.fill();
    });
}

function clearPaint() {
    const canvas = document.getElementById('paintCanvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
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