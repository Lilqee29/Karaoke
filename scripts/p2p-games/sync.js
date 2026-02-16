// ========== NEURAL-SYNC (v4.0 PREMIUM) ==========

window.initSync = function() {
    P2PGameEngine.launch('sync', 'NEURAL-SYNC');
};

window.startSync = function() {
    const screen = document.getElementById('p2pLobby').parentNode; // Just to get a container if needed
    launchApp('sync'); // Pulse sync doesn't have a canvas usually, but let's see.
    
    const status = document.getElementById('syncStatus') || document.createElement('div');
    if(!status.parentNode) {
        const syncScreen = document.getElementById('syncScreen');
        syncScreen.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #0f0; font-family: 'VT323'; height: 100%; display: flex; flex-direction: column; justify-content: center; background: #000;">
                <div style="font-size: 24px; text-shadow: 0 0 10px #0f0; margin-bottom: 20px;">NEURAL INTERFACE</div>
                <div id="syncVisualizer" style="height: 100px; border: 2px solid #0f0; margin-bottom: 20px; position: relative; overflow: hidden; background: rgba(0,255,0,0.05);">
                    <div id="syncWave" style="position: absolute; top: 50%; left: 0; width: 200%; height: 2px; background: #0f0; box-shadow: 0 0 10px #0f0;"></div>
                    <div id="syncTarget" style="position: absolute; top: 0; bottom: 0; left: 50%; width: 4px; background: #fff; box-shadow: 0 0 15px #fff; opacity: 0.5;"></div>
                </div>
                <div id="syncStatus" style="font-size: 14px; height: 30px;">CALIBRATING...</div>
                <div style="font-size: 8px; margin-top: 40px; opacity: 0.5;">PRESS [ Z ] ON BEAT</div>
            </div>
        `;
    }

    let diff = P2PGameEngine.difficulty;
    let aiError = diff === 'easy' ? 250 : (diff === 'hard' ? 40 : 120);
    let beatInterval = 800;
    let lastBeat = Date.now();
    let myTap = 0;
    let peerTap = 0;

    P2PGameEngine.activeGame = {
        onSync: (data) => {
            if(data.type === 'tap') { peerTap = data.time; checkSync(); }
        }
    };

    function update() {
        if(currentScreen !== 'sync') return;
        
        let now = Date.now();
        let progress = (now - lastBeat) / beatInterval;
        
        // Update visualizer
        const wave = document.getElementById('syncWave');
        if(wave) {
            wave.style.left = ((-progress * 100) % 100) + '%';
        }

        if(now - lastBeat > beatInterval) {
            lastBeat = now;
            sounds.click();
            if(P2PGameEngine.isSolo) {
                setTimeout(() => {
                    peerTap = Date.now();
                    checkSync();
                }, (Math.random() - 0.5) * aiError);
            }
        }
        requestAnimationFrame(update);
    }

    function checkSync() {
        if(myTap === 0 || peerTap === 0) return;
        const diffMS = Math.abs(myTap - peerTap);
        const threshold = diff === 'hard' ? 60 : 120;
        const statusEl = document.getElementById('syncStatus');

        if(diffMS < threshold) {
            statusEl.textContent = "SYNCHRONIZED (+" + diffMS + "ms)";
            statusEl.style.color = "#0f0";
            statusEl.style.textShadow = "0 0 10px #0f0";
            sounds.coin();
            if(navigator.vibrate) navigator.vibrate([30, 30, 30]);
        } else {
            statusEl.textContent = "OFFSET: " + diffMS + "ms";
            statusEl.style.color = "#f00";
            statusEl.style.textShadow = "none";
        }
    }

    const handleInput = (e) => {
        if(currentScreen !== 'sync') return;
        if(e.target.tagName !== 'INPUT' && (e.key === 'z' || e.key === ' ')) {
            myTap = Date.now();
            if(!P2PGameEngine.isSolo) {
                P2PGameEngine.send({ type: 'tap', time: myTap });
            }
            checkSync();
            
            // Visual feedback for tap
            const visual = document.getElementById('syncVisualizer');
            if(visual) {
                visual.style.background = 'rgba(255,255,255,0.2)';
                setTimeout(() => visual.style.background = 'rgba(0,255,0,0.05)', 100);
            }
        }
    };

    window.addEventListener('keydown', handleInput);
    update();
};
