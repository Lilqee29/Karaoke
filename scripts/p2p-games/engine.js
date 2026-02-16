// ========== P2P GAME ENGINE (Core v3.0 - Difficulty + Multi) ==========

window.P2PGameEngine = {
    activeGame: null,
    isSolo: false,
    difficulty: 'normal', // easy, normal, hard
    
    init: function() {
        window.onP2PGameData = (payload) => {
            if(this.activeGame && this.activeGame.onSync) {
                this.activeGame.onSync(payload);
            }
        };
    },
    
    setDifficulty: function(level) {
        this.difficulty = level;
        console.log("AI Difficulty set to:", level);
        if(this.activeGame && this.activeGame.onDifficultyChange) {
            this.activeGame.onDifficultyChange(level);
        }
    },
    
    send: function(payload) {
        if(this.isSolo) return;
        if(window.gbConns && window.gbConns.length > 0) {
            window.gbConns.forEach(conn => {
                if(conn.open) conn.send({ type: 'p2p-game', payload: payload });
            });
        } else if(window.gbConn && window.gbConn.open) {
            window.gbConn.send({ type: 'p2p-game', payload: payload });
        }
    },
    
    checkConnection: function() {
        // Find any open PeerJS connection
        const isConnected = (window.gbConn && window.gbConn.open) || (window.gbConns && window.gbConns.some(c => c.open));
        
        if(!isConnected) {
            const solo = confirm("NO TOWER LINK DETECTED.\n\nPLAY VS MACHINE (SOLO)?");
            if(solo) {
                this.isSolo = true;
                return true; 
            }
            goBack();
            return false;
        }
        this.isSolo = false;
        return true;
    },

    // ── UI HELPERS ────────────────────────────────────────────────────────
    launch: function(gameId, title) {
        this.currentGameId = gameId;
        const titleEl = document.getElementById('p2pGameTitle');
        if(titleEl) titleEl.textContent = title.toUpperCase();
        
        // Setup the specific game screen before switching
        document.querySelectorAll('.game-screen').forEach(s => s.classList.remove('active'));
        const screen = document.getElementById('p2pLobby');
        if(screen) screen.classList.add('active');
        currentScreen = 'p2pLobby';
    },

    start: function(mode, diff) {
        this.isSolo = (mode === 'ai');
        this.difficulty = diff || 'normal';
        
        // Hide lobby
        document.getElementById('p2pLobby').classList.remove('active');
        
        // Show game screen
        const appId = this.currentGameId;
        const screen = document.getElementById(appId + 'Screen');
        if(screen) screen.classList.add('active');
        currentScreen = appId;

        // Load specific game logic
        const fnName = 'start' + appId.charAt(0).toUpperCase() + appId.slice(1);
        if(typeof window[fnName] === 'function') {
            window[fnName]();
        } else {
            // Fallback to initX
            const initFn = 'init' + appId.charAt(0).toUpperCase() + appId.slice(1);
            if(typeof window[initFn] === 'function') window[initFn]();
        }
    }
};

window.P2PGameEngine.init();

// Global wrapper for lobby buttons
window.startP2P = (mode, diff) => P2PGameEngine.start(mode, diff);
