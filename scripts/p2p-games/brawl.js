// ========== BIT-BRAWL (v4.0 PREMIUM) ==========

window.initBrawl = function() {
    P2PGameEngine.launch('brawl', 'BIT-BRAWL');
};

window.startBrawl = function() {
    const canvas = document.getElementById('brawlCanvas');
    const ctx = canvas.getContext('2d');
    
    let diff = P2PGameEngine.difficulty;
    let aiSpeed = diff === 'easy' ? 1.0 : (diff === 'hard' ? 3.0 : 1.8);
    let aiAggro = diff === 'easy' ? 0.02 : (diff === 'hard' ? 0.12 : 0.06);

    let player = { x: 60, y: 220, state: 'idle', hp: 100, color: '#f5edd8', name: 'YOU' };
    let opponent = { x: 260, y: 220, state: 'idle', hp: diff === 'hard' ? 150 : 100, color: '#c9a84c', name: P2PGameEngine.isSolo ? 'CPU' : 'PEER' };
    
    P2PGameEngine.activeGame = {
        onSync: (data) => { 
            opponent.x = data.x; 
            opponent.state = data.state; 
            opponent.hp = data.hp; 
        }
    };

    function update() {
        if(currentScreen !== 'brawl') return;
        
        if(P2PGameEngine.isSolo) {
            // Advanced AI
            const dist = Math.abs(opponent.x - player.x);
            if(dist > 45) {
                opponent.x += (player.x > opponent.x) ? aiSpeed : -aiSpeed;
            } else {
                if(Math.random() < aiAggro) {
                    opponent.state = 'punch';
                    if(dist < 40) player.hp -= (diff === 'hard' ? 6 : 3);
                    setTimeout(() => opponent.state = 'idle', 250);
                }
            }
        } else {
            P2PGameEngine.send({ x: player.x, state: player.state, hp: player.hp });
        }

        draw();

        if(player.hp <= 0) endGameBrawl(opponent.name);
        else if(opponent.hp <= 0) endGameBrawl(player.name);
        else requestAnimationFrame(update);
    }

    function draw() {
        // High-end Background
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        grad.addColorStop(0, '#1a1a1a');
        grad.addColorStop(0.7, '#0f380f');
        grad.addColorStop(1, '#000');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Floor with perspective
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 240, canvas.width, 50);
        ctx.strokeStyle = 'rgba(0,255,0,0.1)';
        for(let i=0; i<canvas.width; i+=40) {
            ctx.beginPath(); ctx.moveTo(i, 240); ctx.lineTo(i - 20, 288); ctx.stroke();
        }

        drawFighter(player);
        drawFighter(opponent);
        
        // HUD
        drawHUD(15, 20, player);
        drawHUD(canvas.width - 115, 20, opponent, true);
    }

    function drawFighter(f) {
        ctx.save();
        ctx.translate(f.x, f.y);
        
        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath(); ctx.ellipse(0, 0, 15, 5, 0, 0, Math.PI*2); ctx.fill();

        // Body with glow
        ctx.shadowBlur = 10; ctx.shadowColor = f.color;
        ctx.fillStyle = f.color;
        
        // Head
        ctx.fillRect(-10, -65, 20, 20);
        // Torso
        ctx.fillRect(-15, -45, 30, 45);
        
        if(f.state === 'punch') {
            ctx.fillStyle = f.color;
            const dir = f.x < opponent.x ? 1 : -1;
            ctx.fillRect(10 * dir, -35, 25 * dir, 10);
            ctx.shadowBlur = 20;
            ctx.fillStyle = '#fff';
            ctx.fillRect(30 * dir, -35, 5 * dir, 10);
        }
        
        ctx.restore();
    }

    function drawHUD(x, y, f, right = false) {
        const hpWidth = 100;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(x, y, hpWidth, 10);
        
        const currentHP = (f.hp / (diff === 'hard' && f.name === 'CPU' ? 150 : 100)) * hpWidth;
        const hpGrad = ctx.createLinearGradient(x, 0, x + hpWidth, 0);
        hpGrad.addColorStop(0, '#f00');
        hpGrad.addColorStop(1, '#0f0');
        
        ctx.fillStyle = hpGrad;
        ctx.fillRect(right ? x + (hpWidth - currentHP) : x, y, currentHP, 10);
        
        ctx.fillStyle = '#fff';
        ctx.font = '8px "VT323"';
        ctx.fillText(f.name, x, y - 5);
    }

    function endGameBrawl(winner) {
        alert("TERMINAL PHASE COMPLETE\n\nWINNER: " + winner.toUpperCase());
        P2PGameEngine.launch('brawl', 'BIT-BRAWL');
    }

    const handleInput = (e) => {
        if(currentScreen !== 'brawl') return;
        if(e.key === 'ArrowLeft') player.x = Math.max(20, player.x - 10);
        if(e.key === 'ArrowRight') player.x = Math.min(300, player.x + 10);
        if(e.key === 'z' || e.key === ' ') {
            if(player.state === 'idle') {
                player.state = 'punch';
                sounds.click();
                if(Math.abs(player.x - opponent.x) < 45) {
                    opponent.hp -= 5;
                    if(navigator.vibrate) navigator.vibrate(50);
                }
                setTimeout(() => player.state = 'idle', 150);
            }
        }
    };

    window.addEventListener('keydown', handleInput);
    update();
};
