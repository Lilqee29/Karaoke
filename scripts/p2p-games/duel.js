// ========== NEON-DUEL (v4.0 PREMIUM) ==========

window.initDuel = function() {
    P2PGameEngine.launch('duel', 'NEON-DUEL');
};

window.startDuel = function() {
    const canvas = document.getElementById('duelCanvas');
    const ctx = canvas.getContext('2d');
    
    let diff = P2PGameEngine.difficulty;
    let aiTurnSpeed = diff === 'easy' ? 3 : (diff === 'hard' ? 12 : 6);
    let aiFireRate = diff === 'easy' ? 0.01 : (diff === 'hard' ? 0.1 : 0.04);
    let aiSpeed = diff === 'easy' ? 1 : (diff === 'hard' ? 2.5 : 1.5);

    let ship = { x: 50, y: 150, rot: 0, hp: 100, color: '#00ffff' };
    let enemy = { x: 250, y: 150, rot: 180, hp: diff === 'hard' ? 200 : 100, color: '#ff00ff' };
    let bullets = [];
    let particles = [];
    
    P2PGameEngine.activeGame = {
        onSync: (data) => {
            enemy.x = data.x; enemy.y = data.y; enemy.rot = data.rot; enemy.hp = data.hp;
            if(data.fire) spawnBullet(enemy.x, enemy.y, enemy.rot, false);
        }
    };

    function update() {
        if(currentScreen !== 'duel') return;

        if(P2PGameEngine.isSolo) {
            // Predator AI
            let targetAngle = Math.atan2(ship.y - enemy.y, ship.x - enemy.x) * 180 / Math.PI;
            let diffAngle = targetAngle - enemy.rot;
            while (diffAngle < -180) diffAngle += 360;
            while (diffAngle > 180) diffAngle -= 360;
            
            enemy.rot += Math.sign(diffAngle) * Math.min(Math.abs(diffAngle), aiTurnSpeed);
            enemy.x += Math.cos(enemy.rot * Math.PI/180) * aiSpeed;
            enemy.y += Math.sin(enemy.rot * Math.PI/180) * aiSpeed;
            
            if(Math.random() < aiFireRate) spawnBullet(enemy.x, enemy.y, enemy.rot, false);
            
            // Screen wrap
            if(enemy.x < 0) enemy.x = 320; if(enemy.x > 320) enemy.x = 0;
            if(enemy.y < 0) enemy.y = 288; if(enemy.y > 288) enemy.y = 0;
        }

        bullets.forEach((b, i) => {
            b.x += Math.cos(b.r * Math.PI/180) * 6;
            b.y += Math.sin(b.r * Math.PI/180) * 6;
            
            if(b.x < 0 || b.x > 320 || b.y < 0 || b.y > 288) { bullets.splice(i,1); return; }
            
            let distToEnemy = Math.hypot(b.x - enemy.x, b.y - enemy.y);
            let distToPlayer = Math.hypot(b.x - ship.x, b.y - ship.y);

            if(b.isMine && distToEnemy < 15) {
                enemy.hp -= 10; bullets.splice(i, 1);
                createExplosion(enemy.x, enemy.y, '#ff00ff');
                sounds.launch();
            } else if(!b.isMine && distToPlayer < 15) {
                ship.hp -= 10; bullets.splice(i, 1);
                createExplosion(ship.x, ship.y, '#00ffff');
                sounds.launch();
            }
        });

        // Update Screen Wrap for Player
        if(ship.x < 0) ship.x = 320; if(ship.x > 320) ship.x = 0;
        if(ship.y < 0) ship.y = 288; if(ship.y > 288) ship.y = 0;

        particles.forEach((p, i) => {
            p.x += p.vx; p.y += p.vy; p.life -= 0.05;
            if(p.life <= 0) particles.splice(p, 1);
        });

        if(!P2PGameEngine.isSolo) {
            P2PGameEngine.send({ x: ship.x, y: ship.y, rot: ship.rot, hp: ship.hp });
        }
        
        draw();
        
        if(ship.hp <= 0) endDuel("MISSION FAILED");
        else if(enemy.hp <= 0) endDuel("TARGET ELIMINATED");
        else requestAnimationFrame(update);
    }

    function createExplosion(x, y, color) {
        for(let i=0; i<15; i++) {
            particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                color,
                life: 1.0
            });
        }
        if(navigator.vibrate) navigator.vibrate(100);
    }

    function spawnBullet(x, y, r, mine) {
        bullets.push({ x, y, r, isMine: mine });
        sounds.click();
    }

    function draw() {
        // Deep Space Background
        ctx.fillStyle = '#050505';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Stars
        ctx.fillStyle = '#fff';
        for(let i=0; i<20; i++) {
            let sx = (Date.now() * 0.05 + i*50) % 320;
            let sy = (i*80) % 288;
            ctx.fillRect(sx, sy, 1, 1);
        }

        // Bullets
        bullets.forEach(b => {
            ctx.shadowBlur = 10; ctx.shadowColor = b.isMine ? '#0ff' : '#f0f';
            ctx.fillStyle = b.isMine ? '#0ff' : '#f0f';
            ctx.fillRect(b.x - 1, b.y - 1, 3, 3);
            ctx.shadowBlur = 0;
        });

        // Particles
        particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, 2, 2);
        });
        ctx.globalAlpha = 1.0;

        drawShip(ship, "VOYAGER");
        drawShip(enemy, P2PGameEngine.isSolo ? "INTERCEPTOR" : "PHANTOM");

        // HUD
        drawHUD(10, 10, ship);
        drawHUD(canvas.width - 110, 10, enemy, true);
    }

    function drawShip(s, label) {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rot * Math.PI / 180);
        
        // Engine Glow
        ctx.shadowBlur = 15; ctx.shadowColor = s.color;
        ctx.fillStyle = s.color;
        
        // Custom Ship Shape
        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.lineTo(-10, 12);
        ctx.lineTo(-5, 5);
        ctx.lineTo(-5, -5);
        ctx.lineTo(-10, -12);
        ctx.closePath();
        ctx.fill();
        
        // Cockpit
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, -3, 6, 6);
        
        ctx.restore();
        
        ctx.fillStyle = s.color;
        ctx.font = '8px "VT323"';
        ctx.textAlign = 'center';
        ctx.fillText(label, s.x, s.y + 25);
    }

    function drawHUD(x, y, s, right = false) {
        const hpWidth = 100;
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(x, y, hpWidth, 4);
        
        const maxHP = (s.name === 'INTERCEPTOR' && diff === 'hard') ? 200 : 100;
        const currentHP = (s.hp / maxHP) * hpWidth;
        
        ctx.fillStyle = s.color;
        ctx.fillRect(right ? x + (hpWidth - currentHP) : x, y, currentHP, 4);
    }

    function endDuel(msg) {
        alert("TERMINAL MESSAGE: " + msg.toUpperCase());
        P2PGameEngine.launch('duel', 'NEON-DUEL');
    }

    const handleInput = (e) => {
        if(currentScreen !== 'duel') return;
        if(e.key === 'ArrowLeft') ship.rot -= 15;
        if(e.key === 'ArrowRight') ship.rot += 15;
        if(e.key === 'ArrowUp') {
            ship.x += Math.cos(ship.rot * Math.PI/180) * 5;
            ship.y += Math.sin(ship.rot * Math.PI/180) * 5;
        }
        if(e.target.tagName !== 'INPUT' && (e.key === 'z' || e.key === ' ')) {
            spawnBullet(ship.x, ship.y, ship.rot, true);
            if(!P2PGameEngine.isSolo) {
                P2PGameEngine.send({ x: ship.x, y: ship.y, rot: ship.rot, hp: ship.hp, fire: true });
            }
        }
    };

    window.addEventListener('keydown', handleInput);
    update();
};
