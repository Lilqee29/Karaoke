// ========== RETRO QUEST - MINI ADVENTURE GAME ==========
// Integrated pixel RPG for GameBoy OS (300x320 screen)
// 10 Levels | Quest System | Story-Driven

const RetroQuest = {
    canvas: null,
    ctx: null,
    W: 300, H: 280,
    tileSize: 20,
    
    // Game State
    player: {
        x: 2, y: 2,  // Tile coordinates
        hp: 100, maxHp: 100,
        gold: 0,
        level: 1,
        xp: 0,
        inventory: [],
        quests: []
    },
    
    currentLevel: 0,
    gameState: 'playing', // playing | victory | dead
    
    // Story & Levels
    story: {
        intro: [
            "You wake in a forgotten temple.",
            "A mysterious voice echoes:",
            "\"Seek the 10 Sacred Crystals",
            "to restore light to the realm.\"",
            "Your quest begins..."
        ],
        levels: [
            {
                name: "Temple of Beginnings",
                tilemap: [
                    [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
                    [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                    [2,0,0,0,1,1,1,0,0,0,0,0,0,0,2],
                    [2,0,0,0,1,0,1,0,0,3,3,0,0,0,2],
                    [2,0,0,0,1,0,1,0,0,3,3,0,0,0,2],
                    [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                    [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                    [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                    [2,0,0,0,0,0,0,0,0,0,0,1,1,0,2],
                    [2,0,0,0,0,0,0,0,0,0,0,1,1,0,2],
                    [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                    [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                    [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                    [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]
                ],
                spawn: {x: 2, y: 11},
                crystal: {x: 6, y: 7},
                npc: {x: 4, y: 11, name: "Old Sage", dialog: ["Welcome, brave soul!", "Find the Crystal ahead.", "Press SPACE to continue."]},
                exit: {x: 13, y: 11},
                enemies: [],
                quest: "Find the Crystal of Light"
            },
            {
                name: "Forest of Whispers",
                tilemap: [
                    [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
                    [2,0,0,0,3,3,0,0,0,3,0,0,0,0,2],
                    [2,0,0,0,3,3,0,0,0,3,3,0,0,0,2],
                    [2,0,0,0,0,0,0,3,0,0,0,0,0,0,2],
                    [2,3,0,0,0,0,0,3,3,0,0,0,0,3,2],
                    [2,3,3,0,0,0,0,0,0,0,0,0,3,3,2],
                    [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                    [2,0,0,0,3,0,0,0,0,0,3,0,0,0,2],
                    [2,0,0,0,3,3,0,0,0,3,3,0,0,0,2],
                    [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                    [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                    [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                    [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                    [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]
                ],
                spawn: {x: 2, y: 11},
                crystal: {x: 5, y: 5},
                exit: {x: 13, y: 11},
                enemies: [{x: 7, y: 10, type: 'slime', hp: 30}],
                quest: "Defeat the slime and claim the crystal"
            },
            {
                name: "Mountain Pass",
                tilemap: [
                    [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
                    [2,0,0,1,1,1,1,1,1,1,1,0,0,0,2],
                    [2,0,0,1,0,0,0,0,0,0,1,0,0,0,2],
                    [2,0,1,1,0,0,0,0,0,0,1,1,0,0,2],
                    [2,0,1,0,0,0,0,0,0,0,0,1,0,0,2],
                    [2,0,1,0,0,0,0,0,0,0,0,1,0,0,2],
                    [2,0,1,0,0,0,0,0,0,0,0,1,0,0,2],
                    [2,0,1,1,0,0,0,0,0,0,1,1,0,0,2],
                    [2,0,0,1,0,0,0,0,0,0,1,0,0,0,2],
                    [2,0,0,1,1,0,0,0,0,1,1,0,0,0,2],
                    [2,0,0,0,1,1,0,0,1,1,0,0,0,0,2],
                    [2,0,0,0,0,1,1,1,1,0,0,0,0,0,2],
                    [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                    [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]
                ],
                spawn: {x: 2, y: 12},
                crystal: {x: 7, y: 3},
                exit: {x: 13, y: 1},
                enemies: [
                    {x: 5, y: 5, type: 'goblin', hp: 40},
                    {x: 8, y: 5, type: 'goblin', hp: 40}
                ],
                quest: "Cross the mountain and defeat the goblins"
            },
            // Continue with more levels...
        ]
    },
    
    keys: {},
    
    // Initialize
    init: function(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = this.W;
        this.canvas.height = this.H;
        this.ctx.imageSmoothingEnabled = false;
        
        this.bindInput();
        this.loadLevel(0);
        this.loop();
    },
    
    bindInput: function() {
        const handleInput = (e, isDown) => {
            const key = e.key;
            this.keys[key] = isDown;
            
            // Map mobile buttons to game actions
            if (key === 'z' || key === 'a' || key === ' ') {
                this.keys['Space'] = isDown;
            }
            if (key === 'x' || key === 'b') {
                this.keys['Shift'] = isDown; // Can use for sprint/attack later
            }
            
            if (key === 'z' && isDown) {
                // Attack when A button pressed
                RetroQuest.attack();
            }
            
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'z', 'x', 'a', 'b'].includes(key)) {
                if (isDown && e.preventDefault) e.preventDefault();
            }
        };

        document.addEventListener('keydown', (e) => handleInput(e, true));
        document.addEventListener('keyup', (e) => handleInput(e, false));
    },
    
    loadLevel: function(levelIndex) {
        const level = this.story.levels[levelIndex];
        if (!level) {
            this.gameState = 'victory';
            return;
        }
        
        this.currentLevel = levelIndex;
        this.tilemap = level.tilemap; // Direct assignment - no parsing needed
        this.player.x = level.spawn.x;
        this.player.y = level.spawn.y;
        this.crystalCollected = false;
        this.enemies = level.enemies ? level.enemies.map(e => ({...e, alive: true})) : [];
        this.npc = level.npc || null;
        this.crystal = level.crystal;
        this.exit = level.exit;
        
        if (typeof window.log === 'function') {
            window.log(`Loaded: ${level.name}`);
        }
    },
    
    update: function() {
        if (this.gameState !== 'playing') return;
        
        const oldX = this.player.x;
        const oldY = this.player.y;
        
        // Movement
        if (this.keys['ArrowUp'] && this.canMove(this.player.x, this.player.y - 1)) {
            this.player.y--;
        }
        if (this.keys['ArrowDown'] && this.canMove(this.player.x, this.player.y + 1)) {
            this.player.y++;
        }
        if (this.keys['ArrowLeft'] && this.canMove(this.player.x - 1, this.player.y)) {
            this.player.x--;
        }
        if (this.keys['ArrowRight'] && this.canMove(this.player.x + 1, this.player.y)) {
            this.player.x++;
        }
        
        // Crystal collection
        if (this.crystal && this.player.x === this.crystal.x && this.player.y === this.crystal.y && !this.crystalCollected) {
            this.crystalCollected = true;
            this.player.gold += 50;
            if (typeof sounds !== 'undefined') sounds.coin();
        }
        
        // Exit
        if (this.exit && this.player.x === this.exit.x && this.player.y === this.exit.y && this.crystalCollected) {
            this.loadLevel(this.currentLevel + 1);
            if (typeof sounds !== 'undefined') sounds.launch();
        }
        
        // Enemy collision
        this.enemies.forEach(enemy => {
            if (enemy.alive && enemy.x === this.player.x && enemy.y === this.player.y) {
                this.player.hp -= 10;
                if (this.player.hp <= 0) {
                    this.gameState = 'dead';
                }
            }
        });
        
        // Reset key states to prevent sliding
        if (oldX !== this.player.x || oldY !== this.player.y) {
            setTimeout(() => {
                this.keys['ArrowUp'] = false;
                this.keys['ArrowDown'] = false;
                this.keys['ArrowLeft'] = false;
                this.keys['ArrowRight'] = false;
            }, 100);
        }
    },
    
    canMove: function(x, y) {
        const tile = this.tilemap[y] && this.tilemap[y][x];
        return tile === 0; // 0 = walkable
    },
    
    render: function() {
        const ctx = this.ctx;
        const ts = this.tileSize;
        
        // Background
        ctx.fillStyle = '#2a5a2a';
        ctx.fillRect(0, 0, this.W, this.H);
        
        // Tilemap
        for (let y = 0; y < this.tilemap.length; y++) {
            for (let x = 0; x < this.tilemap[y].length; x++) {
                const tile = this.tilemap[y][x];
                this.drawTile(tile, x * ts, y * ts);
            }
        }
        
        // Crystal
        if (this.crystal && !this.crystalCollected) {
            ctx.fillStyle = '#ffd700';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#fff';
            ctx.beginPath();
            ctx.arc(this.crystal.x * ts + ts/2, this.crystal.y * ts + ts/2, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
        
        // Exit portal
        if (this.exit && this.crystalCollected) {
            ctx.fillStyle = '#0af';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#0af';
            ctx.fillRect(this.exit.x * ts + 5, this.exit.y * ts + 5, ts - 10, ts - 10);
            ctx.shadowBlur = 0;
        }
        
        // NPC
        if (this.npc) {
            ctx.fillStyle = '#fff';
            ctx.fillRect(this.npc.x * ts + 5, this.npc.y * ts + 5, ts - 10, ts - 10);
        }
        
        // Enemies
        this.enemies.forEach(enemy => {
            if (enemy.alive) {
                ctx.fillStyle = '#f44';
                ctx.fillRect(enemy.x * ts + 4, enemy.y * ts + 4, ts - 8, ts - 8);
            }
        });
        
        // Player
        ctx.fillStyle = '#3a7bd5';
        ctx.fillRect(this.player.x * ts + 4, this.player.y * ts + 4, ts - 8, ts - 8);
        
        // HUD
        this.renderHUD();
        
        // Game Over / Victory
        if (this.gameState === 'dead') {
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(0, 0, this.W, this.H);
            ctx.fillStyle = '#f44';
            ctx.font = '20px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER', this.W/2, this.H/2);
        } else if (this.gameState === 'victory') {
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.fillRect(0, 0, this.W, this.H);
            ctx.fillStyle = '#0f0';
            ctx.font = '20px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('VICTORY!', this.W/2, this.H/2);
            ctx.font = '10px monospace';
            ctx.fillText('ALL CRYSTALS COLLECTED', this.W/2, this.H/2 + 30);
        }
    },
    
    drawTile: function(type, x, y) {
        const ctx = this.ctx;
        const ts = this.tileSize;
        
        switch(type) {
            case 0: // Floor
                ctx.fillStyle = '#4a9e4a';
                ctx.fillRect(x, y, ts, ts);
                break;
            case 1: // Platform
                ctx.fillStyle = '#888';
                ctx.fillRect(x, y, ts, ts);
                ctx.fillStyle = '#999';
                ctx.fillRect(x, y, ts, 4);
                break;
            case 2: // Wall
                ctx.fillStyle = '#444';
                ctx.fillRect(x, y, ts, ts);
                break;
            case 3: // Tree
                ctx.fillStyle = '#2a7a2a';
                ctx.fillRect(x + 6, y + 4, 8, 12);
                break;
        }
    },
    
    renderHUD: function() {
        const ctx = this.ctx;
        
        // Semi-transparent background
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0, this.H - 40, this.W, 40);
        
        // HP Bar
        ctx.fillStyle = '#333';
        ctx.fillRect(10, this.H - 30, 100, 10);
        ctx.fillStyle = '#f44';
        ctx.fillRect(10, this.H - 30, this.player.hp, 10);
        
        // Text
        ctx.fillStyle = '#fff';
        ctx.font = '8px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`HP: ${this.player.hp}`, 10, this.H - 15);
        ctx.fillText(`GOLD: ${this.player.gold}`, 120, this.H - 15);
        ctx.fillText(`LVL ${this.currentLevel + 1}/${this.story.levels.length}`, 220, this.H - 15);
        
        // Crystal status
        if (this.crystalCollected) {
            ctx.fillStyle = '#ffd700';
            ctx.fillText('✓ CRYSTAL', 10, this.H - 5);
        } else {
            ctx.fillStyle = '#888';
            ctx.fillText('☐ CRYSTAL', 10, this.H - 5);
        }
    },
    
    loop: function() {
        requestAnimationFrame(() => this.loop());
        this.update();
        this.render();
    }
};

// Initialize when adventure screen opens
window.initAdventure = function() {
    RetroQuest.init('advCanvas');
    QuestUpgrade.init();
};
