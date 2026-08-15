// ========== APP UPGRADES (v4.0) ==========
// 1. TERM - Fake hacker terminal with matrix boot
// 2. TROLL - Gem rewards, high score, level progression
// 3. QUEST - 10 levels, attack, save, NPC dialog
// 4. TACTIC - Timers, move history

// ════════════════════════════════════════════════════════════════════════════
// 1. TERMINAL - Hacker Terminal with Matrix Boot
// ════════════════════════════════════════════════════════════════════════════
const Terminal = {
    output: null,
    input: null,
    canvas: null,
    ctx: null,
    matrixRunning: false,
    matrixDrops: [],
    history: [],
    historyIndex: -1,
    initialized: false,
    bootComplete: false,

    fakeFS: {
        'readme.txt': 'Welcome to GameBoy OS 4.0\nThis is a simulated filesystem.\nNothing to see here... or is there?',
        'secret.log': 'ACCESS GRANTED\nProject: CYBERNETIC OVERLORD\nStatus: CLASSIFIED\nAgent: guest@gameboy-os',
        'system.cfg': 'OS_VERSION=4.0\nKERNEL=retro-kernel\nDISPLAY=GB-LCD\nSOUND=8BIT',
        'hack.sh': '#!/bin/bash\necho "Initiating hack..."\nsleep 2\necho "Bypassing firewall..."\nsleep 1\necho "ACCESS GRANTED"',
        'users.db': 'admin:****\nguest:****\nroot:****',
        'network.map': '192.168.1.0/24\n├── 192.168.1.1  [ROUTER]\n├── 192.168.1.10 [SERVER]\n├── 192.168.1.20 [WORKSTATION]\n└── 192.168.1.100 [GUEST]'
    },

    commands: {
        help: () => `AVAILABLE COMMANDS:
  help        Show this help
  ls          List files
  cat <file>  Read file contents
  whoami      Current user
  nmap        Network scan
  hack        Initiate hack sequence
  clear       Clear terminal
  date        Current date/time
  uname       System info
  pwd         Print working directory
  echo <msg>  Print message
  history     Command history
  neofetch    System info (fancy)`,

        ls: () => `drwxr-xr-x  guest guest  4096  .
drwxr-xr-x  root  root   4096  ..
-rw-r--r--  guest guest    42  readme.txt
-rw-r--r--  guest guest    87  secret.log
-rw-r--r--  guest guest    56  system.cfg
-rwxr-xr-x  guest guest   128  hack.sh
-rw-r--r--  guest guest    34  users.db
-rw-r--r--  guest guest    91  network.map`,

        cat: (args, term) => {
            const file = args[0];
            if (!file) return 'Usage: cat <filename>';
            if (Terminal.fakeFS[file]) return Terminal.fakeFS[file];
            return `cat: ${file}: No such file or directory`;
        },

        whoami: () => 'guest@gameboy-os',

        nmap: async (args, term) => {
            term.appendOutput('> nmap -sV 192.168.1.0/24\n');
            const hosts = [
                '192.168.1.1', '192.168.1.10', '192.168.1.20', '192.168.1.100'
            ];
            const services = ['HTTP (80)', 'SSH (22)', 'FTP (21)', 'DNS (53)'];
            const statuses = ['open', 'filtered', 'closed'];
            for (const host of hosts) {
                await term.delay(400);
                const svc = services[Math.floor(Math.random() * services.length)];
                const st = statuses[Math.floor(Math.random() * 2)];
                term.appendOutput(`  HOST: ${host}  PORT: ${svc}  STATUS: ${st.toUpperCase()}`);
            }
            await term.delay(300);
            term.appendOutput('\nNmap done: 256 IP addresses scanned');
            return null;
        },

        hack: async (args, term) => {
            const steps = [
                '[■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■] 100%',
                'PHASE 1: Scanning target...',
                '  → Found 3 open ports',
                '  → SSH (22), HTTP (80), MYSQL (3306)',
                '',
                'PHASE 2: Exploiting vulnerabilities...',
                '  → Buffer overflow in HTTP daemon',
                '  → Injecting shellcode...',
                '  → [████████████████████] Done',
                '',
                'PHASE 3: Escalating privileges...',
                '  → suid binary found: /usr/bin/passwd',
                '  → Root shell obtained!',
                '',
                'PHASE 4: Covering tracks...',
                '  → Clearing logs... done',
                '  → Installing backdoor... done',
                '',
                '╔══════════════════════════════════╗',
                '║  HACK COMPLETE — ACCESS GRANTED  ║',
                '╚══════════════════════════════════╝',
                '',
                '+50 GEMS (just kidding, this is fake)'
            ];
            for (const line of steps) {
                await term.delay(250 + Math.random() * 200);
                term.appendOutput(line);
            }
            return null;
        },

        clear: () => { Terminal.output.innerHTML = ''; return null; },

        date: () => new Date().toString(),

        uname: () => 'GameBoy OS 4.0.0 (retro-kernel) #1 SMP x86 GameBoy',

        pwd: () => '/home/guest',

        echo: (args) => args.join(' '),

        history: () => Terminal.history.map((cmd, i) => `  ${i + 1}  ${cmd}`).join('\n') || 'No commands yet',

        neofetch: () => {
            return `   ╔═══════════╗     guest@gameboy-os
   ║  ▓▓▓▓▓▓▓  ║     ─────────────
   ║  ▓ GB  ▓  ║     OS: GameBoy OS 4.0
   ║  ▓▓▓▓▓▓▓  ║     Kernel: retro-kernel
   ║  ▓ ▓▓▓ ▓  ║     Shell: gb-sh
   ║  ▓▓▓▓▓▓▓  ║     Resolution: 160x144
   ╚═══════════╝     Theme: Classic Green
                     Memory: 8KB / 8KB
                     Uptime: since last boot`;
        }
    },

    init: function() {
        if (this.initialized) return;
        this.initialized = true;
        this.output = document.getElementById('termOutput');
        this.input = document.getElementById('termInput');
        this.canvas = document.getElementById('matrixCanvas');

        if (!this.output || !this.input) return;

        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const cmd = this.input.value.trim();
                if (cmd) {
                    this.history.push(cmd);
                    this.historyIndex = this.history.length;
                    this.appendOutput(`> ${cmd}`);
                    this.executeCommand(cmd);
                }
                this.input.value = '';
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (this.historyIndex > 0) {
                    this.historyIndex--;
                    this.input.value = this.history[this.historyIndex];
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (this.historyIndex < this.history.length - 1) {
                    this.historyIndex++;
                    this.input.value = this.history[this.historyIndex];
                } else {
                    this.historyIndex = this.history.length;
                    this.input.value = '';
                }
            }
        });

        if (!this.bootComplete) {
            this.boot();
        } else {
            this.appendOutput('Welcome to GB-OS Terminal v4.0\nType \'help\' for commands.\n');
        }
    },

    boot: async function() {
        this.output.innerHTML = '';
        this.input.disabled = true;

        if (this.canvas) {
            this.canvas.width = this.canvas.offsetWidth || 300;
            this.canvas.height = this.canvas.offsetHeight || 300;
            this.ctx = this.canvas.getContext('2d');
            this.startMatrix();
        }

        const bootLines = [
            'BIOS v4.0 ... OK',
            'Memory check: 8KB ... OK',
            'Loading retro-kernel ...',
            'Mounting filesystem ...',
            'Starting services ...',
            'Welcome to GameBoy OS 4.0',
            '',
        ];

        for (const line of bootLines) {
            await this.delay(250);
            this.appendOutput(line);
        }

        await this.delay(800);
        this.stopMatrix();
        this.input.disabled = false;
        this.input.focus();
        this.appendOutput('Type \'help\' for commands.\n');
        this.bootComplete = true;
    },

    startMatrix: function() {
        if (!this.ctx) return;
        this.matrixRunning = true;
        const cols = Math.floor(this.canvas.width / 10);
        this.matrixDrops = Array(cols).fill(0);
        this.drawMatrix();
    },

    drawMatrix: function() {
        if (!this.matrixRunning || !this.ctx) return;
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#0f0';
        ctx.font = '10px monospace';

        for (let i = 0; i < this.matrixDrops.length; i++) {
            const char = String.fromCharCode(0x30A0 + Math.random() * 96);
            ctx.fillStyle = Math.random() > 0.98 ? '#fff' : '#0f0';
            ctx.fillText(char, i * 10, this.matrixDrops[i] * 10);

            if (this.matrixDrops[i] * 10 > h && Math.random() > 0.975) {
                this.matrixDrops[i] = 0;
            }
            this.matrixDrops[i]++;
        }

        requestAnimationFrame(() => this.drawMatrix());
    },

    stopMatrix: function() {
        this.matrixRunning = false;
        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    },

    appendOutput: function(text) {
        if (!this.output) return;
        const span = document.createElement('div');
        span.textContent = text;
        span.style.minHeight = '10px';
        this.output.appendChild(span);
        this.output.scrollTop = this.output.scrollHeight;
    },

    executeCommand: function(cmdLine) {
        const parts = cmdLine.split(/\s+/);
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);

        const handler = this.commands[cmd];
        if (handler) {
            const result = handler(args, this);
            if (result && typeof result === 'string') {
                this.appendOutput(result);
            }
            // async commands return null and handle output themselves
        } else {
            this.appendOutput(`bash: ${cmd}: command not found`);
        }
    },

    delay: (ms) => new Promise(r => setTimeout(r, ms))
};

// ════════════════════════════════════════════════════════════════════════════
// 2. TROLL - Gem Rewards & High Score
// ════════════════════════════════════════════════════════════════════════════
const TrollUpgrade = {
    gems: 0,
    highLevel: parseInt(localStorage.getItem('trollHighLevel')) || 1,
    totalGems: parseInt(localStorage.getItem('trollGems')) || 0,

    init: function() {
        // Load saved state
        this.gems = parseInt(localStorage.getItem('trollGems')) || 0;
        this.highLevel = parseInt(localStorage.getItem('trollHighLevel')) || 1;
        this.updateHUD();

        // Patch TrollEngine to award gems on level clear
        if (typeof TrollEngine !== 'undefined') {
            const origNext = TrollEngine.nextLevel.bind(TrollEngine);
            TrollEngine.nextLevel = function() {
                if (this.level >= 1000) {
                    this.won = true;
                    return;
                }

                // Award gems
                const baseGems = 5;
                const bonusGems = Math.max(0, 10 - this.deaths);
                const totalReward = baseGems + bonusGems;

                if (typeof TrollUpgrade !== 'undefined') {
                    TrollUpgrade.addGems(totalReward);
                    TrollUpgrade.updateHighLevel(this.level + 1);
                }

                // Win flash
                const frame = document.getElementById('gbFrame');
                if (frame) {
                    frame.classList.remove('win-flash');
                    void frame.offsetWidth;
                    frame.classList.add('win-flash');
                    frame.addEventListener('animationend', () => frame.classList.remove('win-flash'), {once:true});
                }

                this.level++;
                this.loadLevel(this.level);
            };
        }
    },

    addGems: function(amount) {
        this.gems += amount;
        this.totalGems += amount;
        localStorage.setItem('trollGems', this.totalGems);
        if (typeof addGems === 'function') addGems(amount);
        this.updateHUD();
    },

    updateHighLevel: function(level) {
        if (level > this.highLevel) {
            this.highLevel = level;
            localStorage.setItem('trollHighLevel', this.highLevel);
        }
        this.updateHUD();
    },

    updateHUD: function() {
        const gemsEl = document.getElementById('mainTrollGems');
        const hiEl = document.getElementById('mainTrollHi');
        if (gemsEl) gemsEl.textContent = `💎 ${this.totalGems}`;
        if (hiEl) hiEl.textContent = `HI: ${this.highLevel}`;
    }
};

// ════════════════════════════════════════════════════════════════════════════
// 3. QUEST - 10 Levels, Attack, Save, NPC Dialog
// ════════════════════════════════════════════════════════════════════════════
const QuestUpgrade = {
    saveKey: 'questSaveData',

    extendedLevels: [
        // Level 4
        {
            name: "Cursed Swamp",
            tilemap: [
                [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
                [2,0,0,0,1,1,0,0,0,3,0,0,0,0,2],
                [2,0,0,0,1,0,0,3,0,3,0,0,0,0,2],
                [2,0,0,0,0,0,3,3,0,0,0,0,1,0,2],
                [2,0,3,0,0,0,0,0,0,0,0,1,1,0,2],
                [2,0,3,3,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,3,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,3,3,3,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,3,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,3,3,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,3,3,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]
            ],
            spawn: {x: 2, y: 11},
            crystal: {x: 10, y: 5},
            npc: {x: 4, y: 11, name: "Witch", dialog: ["The swamp hides many dangers...", "Beware the toxic pools ahead."]},
            exit: {x: 13, y: 11},
            enemies: [{x: 7, y: 7, type: 'ghost', hp: 50}, {x: 10, y: 10, type: 'slime', hp: 35}],
            quest: "Survive the cursed swamp"
        },
        // Level 5
        {
            name: "Crystal Cavern",
            tilemap: [
                [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,1,1,0,0,0,0,0,0,0,1,1,0,2],
                [2,0,1,0,0,0,0,0,0,0,0,0,1,0,2],
                [2,0,0,0,0,0,1,1,1,0,0,0,0,0,2],
                [2,0,0,0,0,0,1,0,1,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,1,1,0,0,0,0,0,1,1,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]
            ],
            spawn: {x: 2, y: 12},
            crystal: {x: 7, y: 2},
            exit: {x: 13, y: 12},
            enemies: [{x: 5, y: 6, type: 'goblin', hp: 45}, {x: 9, y: 8, type: 'goblin', hp: 45}, {x: 7, y: 5, type: 'slime', hp: 30}],
            quest: "Find the crystal deep in the cavern"
        },
        // Level 6
        {
            name: "Dragon's Lair",
            tilemap: [
                [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,1,1,1,0,0,0,1,1,1,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,1,1,0,0,0,0,0,0,0,1,1,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,1,1,1,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]
            ],
            spawn: {x: 2, y: 12},
            crystal: {x: 7, y: 4},
            npc: {x: 5, y: 12, name: "Blacksmith", dialog: ["A dragon guards the crystal!", "Take this sword — press A to attack!"]},
            exit: {x: 13, y: 12},
            enemies: [{x: 7, y: 5, type: 'dragon', hp: 100}],
            quest: "Slay the dragon and claim the crystal"
        },
        // Level 7
        {
            name: "Frozen Peak",
            tilemap: [
                [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
                [2,0,0,0,1,1,1,1,1,1,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,1,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,1,1,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,1,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,1,1,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,1,1,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,1,1,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]
            ],
            spawn: {x: 2, y: 12},
            crystal: {x: 6, y: 1},
            exit: {x: 13, y: 1},
            enemies: [{x: 8, y: 8, type: 'goblin', hp: 50}, {x: 4, y: 5, type: 'ghost', hp: 40}, {x: 10, y: 10, type: 'slime', hp: 35}],
            quest: "Scale the frozen peak"
        },
        // Level 8
        {
            name: "Shadow Realm",
            tilemap: [
                [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,1,1,0,0,0,0,0,1,1,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,1,1,1,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,1,1,1,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,1,1,0,0,0,0,0,1,1,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]
            ],
            spawn: {x: 2, y: 12},
            crystal: {x: 7, y: 5},
            exit: {x: 13, y: 12},
            enemies: [{x: 5, y: 3, type: 'ghost', hp: 60}, {x: 9, y: 3, type: 'ghost', hp: 60}, {x: 7, y: 8, type: 'ghost', hp: 55}],
            quest: "Escape the shadow realm"
        },
        // Level 9
        {
            name: "Demon Gate",
            tilemap: [
                [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,1,0,0,0,0,0,0,0,0,0,1,0,2],
                [2,0,1,1,0,0,0,0,0,0,0,1,1,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,1,1,1,1,1,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,1,1,1,1,1,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,1,1,0,0,0,0,0,0,0,1,1,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]
            ],
            spawn: {x: 2, y: 12},
            crystal: {x: 7, y: 2},
            exit: {x: 13, y: 12},
            enemies: [{x: 7, y: 6, type: 'demon', hp: 120}, {x: 4, y: 4, type: 'ghost', hp: 60}, {x: 10, y: 4, type: 'ghost', hp: 60}],
            quest: "Defeat the demon lord"
        },
        // Level 10
        {
            name: "Throne of Dawn",
            tilemap: [
                [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,1,1,1,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,0,0,0,0,0,0,0,0,0,0,0,0,0,2],
                [2,2,2,2,2,2,2,2,2,2,2,2,2,2,2]
            ],
            spawn: {x: 2, y: 12},
            crystal: {x: 7, y: 4},
            npc: {x: 7, y: 12, name: "Elder", dialog: ["You've come so far...", "The final crystal awaits. Restore the light!"]},
            exit: {x: 13, y: 12},
            enemies: [{x: 7, y: 5, type: 'demon', hp: 150}],
            quest: "Claim the Crystal of Dawn"
        }
    ],

    init: function() {
        // Extend RetroQuest levels
        if (typeof RetroQuest !== 'undefined') {
            this.extendedLevels.forEach(level => {
                RetroQuest.story.levels.push(level);
            });

            // Add save/load to RetroQuest
            const origLoad = RetroQuest.loadLevel.bind(RetroQuest);
            RetroQuest.loadLevel = function(idx) {
                origLoad(idx);
                QuestUpgrade.saveProgress();
            };

            // Add attack handling
            RetroQuest.attack = function() {
                // Find nearest enemy and damage it
                const px = this.player.x;
                const py = this.player.y;
                let attacked = false;

                this.enemies.forEach(enemy => {
                    if (enemy.alive) {
                        const dist = Math.abs(enemy.x - px) + Math.abs(enemy.y - py);
                        if (dist <= 2) {
                            enemy.hp = (enemy.hp || 30) - 25;
                            if (enemy.hp <= 0) {
                                enemy.alive = false;
                                this.player.gold += 20;
                                if (typeof sounds !== 'undefined') sounds.coin();
                            }
                            attacked = true;
                        }
                    }
                });

                if (!attacked && typeof sounds !== 'undefined') sounds.back();
            };

            // Load saved progress
            QuestUpgrade.loadProgress();
        }
    },

    saveProgress: function() {
        if (typeof RetroQuest === 'undefined') return;
        const data = {
            level: RetroQuest.currentLevel,
            hp: RetroQuest.player.hp,
            gold: RetroQuest.player.gold
        };
        localStorage.setItem(this.saveKey, JSON.stringify(data));
    },

    loadProgress: function() {
        const raw = localStorage.getItem(this.saveKey);
        if (!raw) return;
        try {
            const data = JSON.parse(raw);
            if (data.level && data.level > 0) {
                RetroQuest.currentLevel = data.level;
                RetroQuest.player.hp = data.hp || 100;
                RetroQuest.player.gold = data.gold || 0;
                RetroQuest.loadLevel(data.level);
            }
        } catch(e) {}
    }
};

// ════════════════════════════════════════════════════════════════════════════
// 4. TACTIC - Chess Timers & Move History
// ════════════════════════════════════════════════════════════════════════════
const ChessTimer = {
    mode: 'rapid', // blitz, rapid, classical, none
    timeLimits: { blitz: 180, rapid: 600, classical: 1800 },
    whiteTime: 600,
    blackTime: 600,
    interval: null,
    active: false,
    moveHistory: [],

    init: function() {
        this.moveHistory = [];
        this.updateDisplay();
        this.updateHistoryDisplay();
    },

    setMode: function(mode) {
        this.mode = mode;
        this.stop();

        if (mode === 'none') {
            this.whiteTime = 0;
            this.blackTime = 0;
        } else {
            this.whiteTime = this.timeLimits[mode];
            this.blackTime = this.timeLimits[mode];
        }

        // Update button styles
        document.querySelectorAll('.chess-timer-btn').forEach(btn => {
            btn.style.background = 'transparent';
            btn.style.color = '#c9a84c44';
            btn.style.borderColor = '#c9a84c22';
        });
        const activeBtn = document.getElementById('chessTimer' + mode.charAt(0).toUpperCase() + mode.slice(1));
        if (activeBtn) {
            activeBtn.style.background = '#c9a84c22';
            activeBtn.style.color = '#c9a84c';
            activeBtn.style.borderColor = '#c9a84c66';
        }

        this.updateDisplay();
    },

    start: function() {
        if (this.mode === 'none' || this.active) return;
        this.stop();
        this.interval = setInterval(() => this.tick(), 1000);
        this.active = true;
    },

    stop: function() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.active = false;
    },

    switchTurn: function(turn) {
        // Reset and start the other player's timer
        if (this.mode === 'none') return;

        if (turn === 'white') {
            this.whiteTime = this.whiteTime; // keep current
            this.start();
        } else {
            this.blackTime = this.blackTime;
            this.start();
        }
    },

    tick: function() {
        if (this.mode === 'none') return;

        // Determine whose turn it is from chess state
        const turnText = document.getElementById('chessStatus')?.textContent || '';
        const isWhiteTurn = turnText.includes('YOUR TURN');

        if (isWhiteTurn) {
            this.whiteTime--;
            if (this.whiteTime <= 0) {
                this.whiteTime = 0;
                this.timeUp('white');
            }
        } else {
            this.blackTime--;
            if (this.blackTime <= 0) {
                this.blackTime = 0;
                this.timeUp('black');
            }
        }

        this.updateDisplay();
    },

    timeUp: function(player) {
        this.stop();
        // Show time up message
        const statusEl = document.getElementById('chessStatus');
        if (statusEl) {
            statusEl.textContent = `${player.toUpperCase()} ran out of time!`;
            statusEl.style.color = '#f44';
        }
    },

    formatTime: function(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    },

    updateDisplay: function() {
        const whiteEl = document.getElementById('chessTimerWhite');
        const blackEl = document.getElementById('chessTimerBlack');
        const timerBar = document.getElementById('chessTimerBar');

        if (this.mode === 'none') {
            if (timerBar) timerBar.style.display = 'none';
            return;
        }
        if (timerBar) timerBar.style.display = 'flex';

        if (whiteEl) {
            whiteEl.textContent = this.formatTime(this.whiteTime);
            whiteEl.style.color = this.whiteTime < 30 ? '#f44' : '#f5edd8';
        }
        if (blackEl) {
            blackEl.textContent = this.formatTime(this.blackTime);
            blackEl.style.color = this.blackTime < 30 ? '#f44' : '#1a0e05';
        }
    },

    addMove: function(move) {
        this.moveHistory.push(move);
        this.updateHistoryDisplay();
    },

    updateHistoryDisplay: function() {
        const el = document.getElementById('chessMoveHistory');
        if (!el) return;

        const moves = [];
        for (let i = 0; i < this.moveHistory.length; i += 2) {
            const num = Math.floor(i / 2) + 1;
            const white = this.moveHistory[i] || '';
            const black = this.moveHistory[i + 1] || '';
            moves.push(`${num}. ${white} ${black}`);
        }
        el.textContent = moves.join('  ') || 'No moves yet';
        el.scrollTop = el.scrollHeight;
    },

    reset: function() {
        this.moveHistory = [];
        this.stop();
        this.setMode(this.mode);
        this.updateHistoryDisplay();
    }
};

// ════════════════════════════════════════════════════════════════════════════
// GLOBAL INITS
// ════════════════════════════════════════════════════════════════════════════

// Terminal init
window.initTerm = function() {
    Terminal.init();
};

// Troll init
window.initTroll = function() {
    TrollUpgrade.init();
};

// Quest init (called from adventure screen)
window.initQuest = function() {
    QuestUpgrade.init();
};

// Chess timer globals
window.setChessTimer = function(mode) {
    ChessTimer.setMode(mode);
};

window.initChessTimer = function() {
    ChessTimer.init();
};

// Hook into chess move handler to track moves and timers
if (typeof window !== 'undefined') {
    const origStartChess = window.startChess;
    window.startChess = function() {
        if (origStartChess) origStartChess();
        ChessTimer.reset();
        ChessTimer.init();
    };

    // Patch initChess to also init timer
    const origInitChess = window.initChess;
    window.initChess = function(resume) {
        if (origInitChess) origInitChess(resume);
        ChessTimer.reset();
        ChessTimer.init();
    };
}
