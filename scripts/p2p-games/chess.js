window._chessState = {
    wins: { white: 0, black: 0 },
    mode: 'ai',
    difficulty: 'normal'
};

window.initChess = function() {
    P2PGameEngine.launch('chess', 'CYBER-CHESS');
};

window.startChess = function() {
    // Check if we should resume or start fresh
    const saved = loadChessGame();
    if(saved && saved.board) {
        if(confirm("RESUME PREVIOUS MATCH?")) {
            resumeChessGame();
            return;
        }
    }
    
    document.getElementById('chessModeSelect').style.display = 'none';
    document.getElementById('chessGameOver').style.display   = 'none';
    document.getElementById('chessGameArea').style.display   = 'flex';
    
    window._chessState.mode = P2PGameEngine.isSolo ? 'ai' : 'p2p';
    window._chessState.difficulty = P2PGameEngine.difficulty;

    initChess(false);
};

window.resumeChessGame = function() {
    document.getElementById('chessModeSelect').style.display = 'none';
    document.getElementById('chessGameOver').style.display   = 'none';
    document.getElementById('chessGameArea').style.display   = 'flex';
    initChess(true);
};

window.restartChess = function() {
    document.getElementById('chessGameOver').style.display  = 'none';
    document.getElementById('chessGameArea').style.display  = 'flex';
    initChess(false);
};

window.backToChessMenu = function() {
    document.getElementById('chessGameOver').style.display   = 'none';
    document.getElementById('chessGameArea').style.display   = 'none';
    P2PGameEngine.launch('chess', 'CYBER-CHESS');
};

// ── Mode Select Renderer ─────────────────────────────────────────────────────
function renderChessModeSelect() {
    const w      = window._chessState.wins;
    const saved  = loadChessGame();
    const hasResume = saved.board !== null;

    const winsEl  = document.getElementById('chessWinsDisplay');
    const resumeEl = document.getElementById('chessResumeBtn');

    if (winsEl) winsEl.textContent = `YOU ${w.white} — ${w.black} AI`;

    if (resumeEl) {
        if (hasResume) {
            resumeEl.style.display = 'block';
            resumeEl.textContent   =
                `↩ RESUME [${saved.difficulty.toUpperCase()}] — ${saved.turn === 'white' ? 'YOUR TURN' : 'AI TURN'}`;
        } else {
            resumeEl.style.display = 'none';
        }
    }
}

// ── Wins Bar ─────────────────────────────────────────────────────────────────
function updateWinsBar() {
    const w   = window._chessState.wins;
    const bar = document.getElementById('chessWinsBar');
    if (bar) bar.textContent = `YOU ${w.white} — ${w.black} AI`;
}

// ── Audio ────────────────────────────────────────────────────────────────────
const chessAudio = (() => {
    const ctx = window.audioCtx || new (window.AudioContext || window.webkitAudioContext)();

    function beep(freq, dur, type = 'square', vol = 0.12, decay = 0.08) {
        if (!soundEnabled) return;
        try {
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.connect(g); g.connect(ctx.destination);
            o.type = type;
            o.frequency.setValueAtTime(freq, ctx.currentTime);
            g.gain.setValueAtTime(vol, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
            o.start(); o.stop(ctx.currentTime + dur + decay);
        } catch(e) {}
    }

    return {
        select:  () => beep(600, 0.04, 'sine',     0.08),
        move:    () => beep(440, 0.06, 'square',   0.10),
        capture: () => { beep(200, 0.10, 'sawtooth', 0.16); setTimeout(() => beep(140, 0.08, 'square', 0.08), 60); },
        invalid: () => beep(160, 0.08, 'square',   0.10),
        win:     () => [523,659,784,1047].forEach((f,i) => setTimeout(() => beep(f, 0.18, 'sine', 0.18), i * 110)),
        lose:    () => [300,260,220,180].forEach((f,i)  => setTimeout(() => beep(f, 0.20, 'sawtooth', 0.14), i * 120))
    };
})();

// ── Main Init ────────────────────────────────────────────────────────────────
window.initChess = function(resume = false) {
    if (!P2PGameEngine.checkConnection()) return;

    const grid = document.getElementById('chessGrid');
    grid.style.gridTemplateColumns = 'repeat(8, 1fr)';
    grid.style.height              = 'auto';
    grid.style.aspectRatio         = '1/1';
    grid.innerHTML                 = '';

    const capByAI     = document.getElementById('chessCapturedByAI');
    const capByPlayer = document.getElementById('chessCapturedByPlayer');
    capByAI.innerHTML     = '';
    capByPlayer.innerHTML = '';

    // ── Board state ──────────────────────────────────────────────────────────
    const DEFAULT_BOARD = [
        ['r','k','b','q','m','b','k','r'],
        ['p','p','p','p','p','p','p','p'],
        ['.','.','.','.','.','.','.','.',],
        ['.','.','.','.','.','.','.','.',],
        ['.','.','.','.','.','.','.','.',],
        ['.','.','.','.','.','.','.','.',],
        ['P','P','P','P','P','P','P','P'],
        ['R','K','B','Q','M','B','K','R']
    ];

    const saved = loadChessGame();

    let board    = (resume && saved.board) ? JSON.parse(JSON.stringify(saved.board)) : JSON.parse(JSON.stringify(DEFAULT_BOARD));
    let turn     = (resume && saved.board) ? saved.turn     : 'white';
    let captured = (resume && saved.board) ? JSON.parse(JSON.stringify(saved.captured)) : { byPlayer: [], byAI: [] };

    const isAI = window._chessState.mode === 'ai';
    let selected = null;

    const pieceIcons = {
        'P':'♟','R':'♜','K':'♞','B':'♝','Q':'♛','M':'♚',
        'p':'♙','r':'♖','k':'♘','b':'♗','q':'♕','m':'♔'
    };
    const pieceValues = { p:1, k:3, b:3, r:5, q:9, m:100 };

    P2PGameEngine.activeGame = {
        onSync: (data) => {
            if (data.type === 'move') {
                board    = data.board;
                captured = data.captured || captured;
                turn     = 'white';
                renderBoard();
            }
        }
    };

    // ── Render Board ─────────────────────────────────────────────────────────
    function renderBoard() {
        grid.innerHTML = '';

        board.forEach((row, r) => {
            row.forEach((cell, c) => {
                const div = document.createElement('div');
                div.style.width          = '100%';
                div.style.aspectRatio    = '1/1';
                div.style.display        = 'flex';
                div.style.alignItems     = 'center';
                div.style.justifyContent = 'center';
                div.style.position       = 'relative';
                div.style.cursor         = 'pointer';
                div.style.transition     = 'filter 0.15s ease';
                div.style.userSelect     = 'none';

                // Square colors
                if ((r + c) % 2 === 0) {
                    div.style.background = 'linear-gradient(135deg, #1a0e05 0%, #241408 50%, #1a0e05 100%)';
                } else {
                    div.style.background = 'linear-gradient(135deg, #c9a84c 0%, #b8943c 40%, #c9a84c 100%)';
                }

                // Piece
                if (cell !== '.') {
                    div.textContent      = pieceIcons[cell] || cell;
                    div.style.fontSize   = '18px';
                    div.style.lineHeight = '1';

                    if (cell === cell.toUpperCase()) {
                        div.style.color            = '#f5edd8';
                        div.style.filter           = 'drop-shadow(0 1px 0px rgba(0,0,0,0.9)) drop-shadow(0 0 5px rgba(255,200,80,0.3))';
                        div.style.webkitTextStroke = '0.5px rgba(80,50,10,0.6)';
                    } else {
                        div.style.color            = '#1a0e05';
                        div.style.filter           = 'drop-shadow(0 1px 0px rgba(255,200,80,0.35)) drop-shadow(0 0 4px rgba(0,0,0,0.8))';
                        div.style.webkitTextStroke = '0.6px rgba(201,168,76,0.45)';
                    }
                }

                // Valid move hints — subtle gold dot on empty reachable squares
                if (selected && cell === '.' && isValidMove(selected.r, selected.c, r, c, true)) {
                    const dot = document.createElement('div');
                    dot.style.cssText = `
                        position:absolute; width:28%; height:28%;
                        border-radius:50%;
                        background:rgba(201,168,76,0.45);
                        pointer-events:none;
                    `;
                    div.appendChild(dot);
                }

                // Capturable enemy hint — gold ring
                if (selected && cell !== '.' && cell === cell.toLowerCase() && isValidMove(selected.r, selected.c, r, c, true)) {
                    div.style.outline      = '1.5px solid rgba(201,168,76,0.8)';
                    div.style.outlineOffset = '-1.5px';
                }

                // Selected square
                if (selected && selected.r === r && selected.c === c) {
                    div.style.background = 'radial-gradient(ellipse at center, #f0d080 0%, #d4a830 60%, #b8882a 100%)';
                    div.style.boxShadow  = 'inset 0 0 12px rgba(255,200,50,0.5), 0 0 16px rgba(255,200,50,0.4)';
                    div.style.zIndex     = '5';
                    div.style.animation  = 'pulseSelected 1.4s ease-in-out infinite';
                }

                // Keyboard cursor highlight
                if (chessCursor && chessCursor.r === r && chessCursor.c === c && !(selected && selected.r === r && selected.c === c)) {
                    div.style.outline      = '2px solid #0ff';
                    div.style.outlineOffset = '-2px';
                    div.style.zIndex       = '4';
                }

                div.onclick = () => handleCellClick(r, c);
                grid.appendChild(div);
            });
        });

        // Status
        const diff   = window._chessState.difficulty.toUpperCase();
        const turnTxt = turn === 'white' ? 'YOUR TURN' : (isAI ? 'AI THINKING...' : 'PEER TURN');
        const statusEl = document.getElementById('chessStatus');
        if (statusEl) statusEl.textContent = `[${diff}] ${turnTxt}`;

        renderCaptured();
        updateWinsBar();
    }

    // ── Captured Panel ───────────────────────────────────────────────────────
    function renderCaptured() {
        capByPlayer.innerHTML = '';
        capByAI.innerHTML     = '';

        captured.byPlayer.forEach(p => {
            const s = document.createElement('div');
            s.textContent    = pieceIcons[p] || p;
            s.style.fontSize = '7px';
            s.style.color    = '#1a0e05';
            s.style.filter   = 'drop-shadow(0 0 2px rgba(201,168,76,0.7))';
            s.style.lineHeight = '1.1';
            capByPlayer.appendChild(s);
        });

        captured.byAI.forEach(p => {
            const s = document.createElement('div');
            s.textContent    = pieceIcons[p] || p;
            s.style.fontSize = '7px';
            s.style.color    = '#f5edd8';
            s.style.filter   = 'drop-shadow(0 0 2px rgba(0,0,0,0.9))';
            s.style.lineHeight = '1.1';
            capByAI.appendChild(s);
        });
    }

    // ── Click Handler ────────────────────────────────────────────────────────
    function handleCellClick(r, c) {
        if (turn !== 'white') return;
        const cell = board[r][c];

        if (selected) {
            if (isValidMove(selected.r, selected.c, r, c, true)) {
                const victim = board[r][c];
                if (victim !== '.') {
                    captured.byPlayer.push(victim);
                    chessAudio.capture();
                } else {
                    chessAudio.move();
                }

                board[r][c]                       = board[selected.r][selected.c];
                board[selected.r][selected.c]     = '.';
                selected = null;
                turn     = 'black';
                renderBoard();

                // Pawn promotion
                if (board[r][c] === 'P' && r === 0) board[r][c] = 'Q';

                // Track move for history
                if (typeof ChessTimer !== 'undefined' && typeof chessNotation === 'function') {
                    const piece = board[r][c];
                    ChessTimer.addMove(chessNotation(piece, selected.r, selected.c, r, c, victim !== '.'));
                    ChessTimer.switchTurn('black');
                }

                saveChessGame(board, turn, captured, window._chessState.mode, window._chessState.difficulty, window._chessState.wins);

                if (!checkGameOver()) {
                    if (isAI) setTimeout(doAIMove, 750);
                    else P2PGameEngine.send({ type: 'move', board, captured });
                }
            } else {
                // Clicked own piece — reselect it
                if (cell !== '.' && cell === cell.toUpperCase()) {
                    selected = { r, c };
                    chessAudio.select();
                } else {
                    chessAudio.invalid();
                    selected = null;
                }
                renderBoard();
            }
        } else if (cell !== '.' && cell === cell.toUpperCase()) {
            selected = { r, c };
            chessAudio.select();
            renderBoard();
        }
    }

    // ── AI ───────────────────────────────────────────────────────────────────
    function doAIMove() {
        if (turn !== 'black') return;
        const moves = [];

        for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
            if (board[r][c] !== '.' && board[r][c] === board[r][c].toLowerCase()) {
                for (let tr = 0; tr < 8; tr++) for (let tc = 0; tc < 8; tc++) {
                    if (isValidMove(r, c, tr, tc, false)) {
                        moves.push({ sr:r, sc:c, tr, tc, score: rateMove(r, c, tr, tc) });
                    }
                }
            }
        }

        if (moves.length > 0) {
            let move;
            const diff = window._chessState.difficulty;

            if (diff === 'hard') {
                moves.sort((a, b) => b.score - a.score);
                move = moves[0];
            } else if (diff === 'normal') {
                moves.sort((a, b) => b.score - a.score);
                const pool = moves.slice(0, Math.min(5, moves.length));
                move = pool[Math.floor(Math.random() * pool.length)];
            } else {
                move = moves[Math.floor(Math.random() * moves.length)];
            }

            const victim = board[move.tr][move.tc];
            if (victim !== '.') {
                captured.byAI.push(victim);
                chessAudio.capture();
            } else {
                chessAudio.move();
            }

            board[move.tr][move.tc] = board[move.sr][move.sc];
            board[move.sr][move.sc] = '.';

            // AI pawn promotion
            if (board[move.tr][move.tc] === 'p' && move.tr === 7) board[move.tr][move.tc] = 'q';

            // Track AI move for history
            if (typeof ChessTimer !== 'undefined' && typeof chessNotation === 'function') {
                const piece = board[move.tr][move.tc];
                ChessTimer.addMove(chessNotation(piece, move.sr, move.sc, move.tr, move.tc, victim !== '.'));
            }
        }

        turn = 'white';
        renderBoard();

        // Switch timer to white's turn
        if (typeof ChessTimer !== 'undefined') ChessTimer.switchTurn('white');

        saveChessGame(board, turn, captured, window._chessState.mode, window._chessState.difficulty, window._chessState.wins);

        checkGameOver();
    }

    function rateMove(sr, sc, tr, tc) {
        const piece  = board[sr][sc].toLowerCase();
        const target = board[tr][tc];
        let score    = 0;

        if (target !== '.' && target === target.toUpperCase()) {
            score += (pieceValues[target.toLowerCase()] || 1) * 10;
        }
        if (piece === 'p') { score += (7 - tr) * 2; if (tr === 7) score += 50; }
        if (tr >= 2 && tr <= 5 && tc >= 2 && tc <= 5) score += 3;
        if (sr <= 1 && tr > 1) score += 2;

        return score;
    }

    // ── Move Validation ──────────────────────────────────────────────────────
    function isPathClear(sr, sc, tr, tc) {
        const dr = tr > sr ? 1 : (tr < sr ? -1 : 0);
        const dc = tc > sc ? 1 : (tc < sc ? -1 : 0);
        let r = sr + dr, c = sc + dc;
        while (r !== tr || c !== tc) {
            if (board[r][c] !== '.') return false;
            r += dr; c += dc;
        }
        return true;
    }

    function isValidMove(sr, sc, tr, tc, isWhite) {
        if (tr < 0 || tr > 7 || tc < 0 || tc > 7) return false;
        if (sr === tr && sc === tc)                 return false;

        const piece  = board[sr][sc].toUpperCase();
        const target = board[tr][tc];

        if (isWhite) { if (target !== '.' && target === target.toUpperCase()) return false; }
        else         { if (target !== '.' && target === target.toLowerCase()) return false; }

        const dr = Math.abs(tr - sr);
        const dc = Math.abs(tc - sc);

        if (piece === 'P') {
            if (isWhite) {
                if (dc === 0 && target === '.' && sr - tr === 1) return true;
                if (dc === 0 && target === '.' && sr === 6 && sr - tr === 2 && board[sr-1][sc] === '.') return true;
                if (dc === 1 && sr - tr === 1 && target !== '.' && target === target.toLowerCase()) return true;
            } else {
                if (dc === 0 && target === '.' && tr - sr === 1) return true;
                if (dc === 0 && target === '.' && sr === 1 && tr - sr === 2 && board[sr+1][sc] === '.') return true;
                if (dc === 1 && tr - sr === 1 && target !== '.' && target === target.toUpperCase()) return true;
            }
            return false;
        }
        if (piece === 'R') return (sr === tr || sc === tc)   ? isPathClear(sr, sc, tr, tc) : false;
        if (piece === 'B') return (dr === dc)                ? isPathClear(sr, sc, tr, tc) : false;
        if (piece === 'K') return (dr===2&&dc===1)||(dr===1&&dc===2);
        if (piece === 'Q') return (sr===tr||sc===tc||dr===dc)? isPathClear(sr, sc, tr, tc) : false;
        if (piece === 'M') return dr <= 1 && dc <= 1;
        return false;
    }

    // ── Game Over ────────────────────────────────────────────────────────────
    function checkGameOver() {
        const flat = board.flat();
        if (!flat.includes('M')) { endGame('black'); return true; }
        if (!flat.includes('m')) { endGame('white'); return true; }
        return false;
    }

    function endGame(winner) {
        window._chessState.wins[winner]++;
        const isPlayerWin = winner === 'white';

        isPlayerWin ? chessAudio.win() : chessAudio.lose();

        saveChessResult(
            window._chessState.wins,
            window._chessState.mode,
            window._chessState.difficulty
        );

        setTimeout(() => {
            document.getElementById('chessGameArea').style.display = 'none';

            const overlay = document.getElementById('chessGameOver');
            overlay.style.display = 'flex';

            const titleEl = document.getElementById('chessGameOverTitle');
            const subEl   = document.getElementById('chessGameOverSub');
            const winsEl  = document.getElementById('chessGameOverWins');

            titleEl.textContent = isPlayerWin ? '⚔ VICTORY' : '✕ DEFEAT';
            titleEl.style.color = isPlayerWin ? '#c9a84c'   : '#8b2020';

            subEl.textContent = isPlayerWin
                ? 'YOU CRUSHED THE MACHINE'
                : 'THE AI REIGNS SUPREME';

            const w = window._chessState.wins;
            winsEl.textContent = `RECORD — YOU ${w.white} : ${w.black} AI`;
        }, isPlayerWin ? 600 : 300);
    }

    // ── Keyboard Navigation (D-Pad + A/B) ───────────────────────────────────
    let chessCursor = { r: 6, c: 4 }; // Start on a white pawn

    const handleChessInput = (e) => {
        if (currentScreen !== 'chess') return;
        if (e.target.tagName === 'INPUT') return;
        if (turn !== 'white') return;

        if (e.key === 'ArrowUp')   { chessCursor.r = Math.max(0, chessCursor.r - 1); renderBoard(); chessAudio.select(); }
        if (e.key === 'ArrowDown') { chessCursor.r = Math.min(7, chessCursor.r + 1); renderBoard(); chessAudio.select(); }
        if (e.key === 'ArrowLeft') { chessCursor.c = Math.max(0, chessCursor.c - 1); renderBoard(); chessAudio.select(); }
        if (e.key === 'ArrowRight'){ chessCursor.c = Math.min(7, chessCursor.c + 1); renderBoard(); chessAudio.select(); }

        // A button = select/move piece
        if (e.key === 'z' || e.key === 'a' || e.key === 'Enter' || e.key === ' ') {
            handleCellClick(chessCursor.r, chessCursor.c);
        }
        // B button = cancel selection
        if (e.key === 'x' || e.key === 'b' || e.key === 'Escape') {
            if (selected) {
                selected = null;
                chessAudio.invalid();
                renderBoard();
            }
        }
    };
    window.addEventListener('keydown', handleChessInput);

    // ── Kick off ─────────────────────────────────────────────────────────────
    renderBoard();

    // If resuming and it's AI's turn, let AI move
    if (resume && turn === 'black' && isAI) {
        setTimeout(doAIMove, 1000);
    }
};

// ── Boot: show mode select with correct state ─────────────────────────────
renderChessModeSelect();

// ── startChessMode: called by HTML buttons ────────────────────────────────
// e.g. startChessMode('ai','easy') / startChessMode('p2p','normal')
window.startChessMode = function(mode, difficulty) {
    if (typeof P2PGameEngine === 'undefined') return;
    P2PGameEngine.isSolo     = (mode !== 'p2p');
    P2PGameEngine.difficulty = difficulty || 'normal';
    window._chessState.mode       = mode;
    window._chessState.difficulty = difficulty || 'normal';
    window.startChess();
};

// ── Move Notation Helper ─────────────────────────────────────────────────────
window.chessNotation = function(piece, sr, sc, tr, tc, captured) {
    const files = 'abcdefgh';
    const ranks = '87654321';
    const p = piece.toUpperCase();
    const pName = { P:'', R:'R', K:'N', B:'B', Q:'Q', M:'K' }[p] || p;
    const cap = captured ? 'x' : '';
    const from = p === 'P' && captured ? files[sc] : '';
    return `${pName}${from}${cap}${files[tc]}${ranks[tr]}`;
};