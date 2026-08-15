// ========== TURBO-RACER (v4.0 PREMIUM) ==========

window.initRacer = function() {
    P2PGameEngine.launch('racer', 'TURBO-RACER');
};

window.startRacer = function() {
    const canvas = document.getElementById('racerCanvas');
    const ctx = canvas.getContext('2d');
    
    let diff = P2PGameEngine.difficulty;
    let aiBaseSpeed = diff === 'easy' ? 4.0 : (diff === 'hard' ? 8.5 : 6.0);
    const winDist = 5000;

    let me = { x: 75, distance: 0, speed: 0, color: '#0f0', steer: 0 };
    let peer = { x: 225, distance: 0, speed: 0, color: '#f0f' };
    
    P2PGameEngine.activeGame = {
        onSync: (data) => { peer.distance = data.distance; peer.speed = data.speed; }
    };

    function update() {
        if(currentScreen !== 'racer') return;
        
        if(P2PGameEngine.isSolo) {
            peer.distance += aiBaseSpeed + Math.random();
            peer.speed = aiBaseSpeed;
        }

        // Friction and speed decay
        me.speed *= 0.98;
        me.distance += me.speed;

        if(!P2PGameEngine.isSolo) {
            P2PGameEngine.send({ distance: me.distance, speed: me.speed });
        }
        
        draw();
        
        if(me.distance >= winDist) endRacer("CHAMPION");
        else if(peer.distance >= winDist) endRacer("SECOND PLACE");
        else requestAnimationFrame(update);
    }

    function draw() {
        // Road perspective
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Perspective Lines
        ctx.strokeStyle = '#333';
        ctx.beginPath();
        for(let i=0; i<canvas.width; i+=40) {
            ctx.moveTo(160, 0); ctx.lineTo(i * 2 - 160, 288);
        }
        ctx.stroke();

        // Moving Road markings
        const laneY = (me.distance % 200);
        ctx.strokeStyle = '#555'; ctx.setLineDash([40, 60]);
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(160, -100 + laneY); ctx.lineTo(160, 488 + laneY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Cars (Visual perspective based on distance diff)
        const yBase = 240;
        const distDiff = (peer.distance - me.distance) * 0.1;
        
        drawCar(me.x, yBase, me, "YOU");
        drawCar(240, yBase + distDiff, peer, P2PGameEngine.isSolo ? "CPU" : "PEER");

        // HUD - Speed & Progress
        drawHUD();
    }

    function drawCar(x, y, c, label) {
        if(y < 0 || y > 300) return; // Cull if too far
        
        ctx.save();
        ctx.translate(x, y);
        
        // Scale based on Y (simple fake 3D)
        const scale = 1 + (y - 200) / 400;
        ctx.scale(scale, scale);

        // Car Body
        ctx.fillStyle = c.color;
        ctx.shadowBlur = 10; ctx.shadowColor = c.color;
        ctx.fillRect(-15, -40, 30, 60);
        
        // Windshield
        ctx.fillStyle = '#fff';
        ctx.fillRect(-12, -35, 24, 15);
        
        // Spoiler
        ctx.fillStyle = '#222';
        ctx.fillRect(-18, 15, 36, 8);
        
        ctx.restore();
        
        ctx.fillStyle = '#fff';
        ctx.font = '8px "VT323"';
        ctx.textAlign = 'center';
        ctx.fillText(label, x, y + 35);
    }

    function drawHUD() {
        // Background for HUD
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, canvas.width, 30);
        
        // Progress Bars
        const barWidth = 100;
        ctx.fillStyle = '#333';
        ctx.fillRect(10, 15, barWidth, 4);
        ctx.fillRect(canvas.width - 110, 15, barWidth, 4);
        
        ctx.fillStyle = '#0f0';
        ctx.fillRect(10, 15, (Math.min(me.distance, winDist) / winDist) * barWidth, 4);
        ctx.fillStyle = '#f0f';
        ctx.fillRect(canvas.width - 110, 15, (Math.min(peer.distance, winDist) / winDist) * barWidth, 4);
        
        ctx.fillStyle = '#fff';
        ctx.font = '10px "VT323"';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.floor(me.speed * 20)} MPH`, canvas.width/2, 20);
    }

    function endRacer(msg) {
        alert("RACE COMPLETE: " + msg.toUpperCase());
        P2PGameEngine.launch('racer', 'TURBO-RACER');
    }

    const handleInput = (e) => {
        if(currentScreen !== 'racer') return;
        if(e.target.tagName === 'INPUT') return;
        // A button / ArrowUp / Space = accelerate
        if(e.key === 'z' || e.key === 'a' || e.key === 'ArrowUp' || e.key === ' ' || e.key === 'Enter') {
            me.speed = Math.min(25, me.speed + 1.2);
            if(window.sounds && window.sounds.click) window.sounds.click();
            if(navigator.vibrate) navigator.vibrate(20);
        }
        // D-pad left/right = steer
        if(e.key === 'ArrowLeft') me.x = Math.max(40, me.x - 8);
        if(e.key === 'ArrowRight') me.x = Math.min(280, me.x + 8);
        // B button / ArrowDown = brake
        if(e.key === 'x' || e.key === 'b' || e.key === 'ArrowDown') {
            me.speed = Math.max(0, me.speed - 2);
            if(window.sounds && window.sounds.click) window.sounds.click();
        }
    };

    window.addEventListener('keydown', handleInput);
    update();
};
