// ========== SIGNAL ZERO: A MURDER IN THE DEAD CHANNELS (v7.0 STORY TREE) ==========
// Full Detective Case Files: Suspects, Forensics, P2P Co-Op Clue Sync & Accusations!


// Compatibility shims for the legacy tactical Void markup in index.html.
// initVoid() replaces that shell with the mystery UI, but these handlers keep
// direct button taps from throwing if the static markup is exercised first.
window.hideVoidIntro = function() {
    const intro = document.getElementById('voidIntro');
    if(intro) intro.style.display = 'none';
    if(typeof window.startMystery === 'function') window.startMystery();
};

window.voidDoTask = function() {
    const log = document.getElementById('voidLog');
    if(log) log.textContent = 'TASK COMPLETE: SIGNAL STABILIZED';
    if(window.sounds && sounds.coin) sounds.coin();
};

window.voidReport = function() {
    const debate = document.getElementById('voidDebate');
    if(debate) debate.style.display = 'flex';
};

window.voidKill = function() {
    const log = document.getElementById('voidLog');
    if(log) log.textContent = 'INFECT ACTION IS ONLY AVAILABLE IN MULTIPLAYER.';
    if(window.sounds && sounds.back) sounds.back();
};

window.voidSendDebate = function() {
    const input = document.getElementById('voidDebateInput');
    const log = document.getElementById('voidDebateLog');
    const msg = input && input.value ? input.value.trim() : '';
    if(log && msg) log.innerHTML += '<div><b>YOU:</b> ' + sanitizeHTML(msg) + '</div>';
    if(input) input.value = '';
};

const MYSTERY_SUSPECTS = {
    aris: {
        name: "DR. ARIS",
        role: "HEAD QUANTUM PHYSICIST",
        motive: "Stole Tachyon Buffer blueprints to patent time-messaging.",
        location: "Mess Hall (02:30 AM)",
        alibi: "Claims he was talking to Vance in Mess Hall at 02:30 AM.",
        status: "SUSPECT ⚠️"
    },
    carter: {
        name: "ENGINEER CARTER",
        role: "REACTOR & LIFE SUPPORT LEAD",
        motive: "Tampered with reactor voltage grid at 00:50 AM.",
        location: "Reactor Lower Level (01:00 AM)",
        alibi: "Claims he was fixing oxygen scrubbers.",
        status: "SUSPECT ⚠️"
    },
    rex: {
        name: "COMMANDER REX",
        role: "SECURITY CHIEF",
        motive: "Covering up classified Tachyon test failures.",
        location: "Control Deck (01:00 AM)",
        alibi: "Claims he was monitoring array communications.",
        status: "SUSPECT ⚠️"
    },
    vance: {
        name: "DR. EVELYN VANCE",
        role: "VICTIM / CHIEF RESEARCHER",
        motive: "Attempted to destroy Tachyon Buffer to stop time loop.",
        location: "Reactor Core (Found 04:12 AM)",
        alibi: "Autopsy confirms death at 01:00 AM.",
        status: "DECEASED 💀"
    }
};

// ── STORY TREE: 3 Acts, ~15 Nodes ──────────────────────────────────────────
const MYSTERY_NODES = {
    // ═══ ACT 1: INVESTIGATE CRIME SCENE ═══
    start: {
        title: "ACT I — THE BODY",
        speaker: "CHIEF INVESTIGATOR LOG",
        text: "04:12 AM. Alarms scream through Station Erebus.\n\nDr. Evelyn Vance — lead researcher on Project Tachyon — is found dead in the Reactor Core. Her wristwatch melted at exactly 01:00:14 AM.\n\nYou are the Chief Investigator. The station is on lockdown. Three suspects remain aboard.",
        choices: [
            { text: "Examine the body closely", next: "body" },
            { text: "Check the security cameras first", next: "cctv" }
        ]
    },
    body: {
        title: "THE VICTIM",
        speaker: "FORENSICS",
        text: "Vance's body shows signs of high-voltage electrocution. Her lab coat smells of ozone. In her hand: a crumpled note reading 'THE BUFFER MUST NOT — '\n\nThe note is torn. The rest is missing.\n\nHer keycard chip shows a timestamp of 03:45 AM — four hours AFTER her death.",
        choices: [
            { text: "Investigate the Tachyon Buffer lab", next: "tachyon_lab" },
            { text: "Interrogate Dr. Aris in the Mess Hall", next: "interrogate_aris" },
            { text: "Check the reactor logs", next: "reactor_logs" }
        ],
        unlock: "e1"
    },
    cctv: {
        title: "SECURITY FOOTAGE",
        speaker: "CCTV DATABASE",
        text: "You pull up the Mess Hall camera at 02:30 AM. Dr. Aris is visible — but he's talking to a shimmering holographic projection of... Dr. Vance.\n\nVance was already dead at 01:00 AM.\n\nThe projection speaks with Vance's voice. Aris appears distressed, then the feed cuts to static.",
        choices: [
            { text: "Confront Dr. Aris about the hologram", next: "interrogate_aris" },
            { text: "Investigate the Tachyon Buffer lab", next: "tachyon_lab" },
            { text: "Check the reactor logs", next: "reactor_logs" }
        ],
        unlock: "e3"
    },
    // ═══ ACT 2: INTERROGATE SUSPECTS ═══
    tachyon_lab: {
        title: "TACHYON BUFFER LAB",
        speaker: "SCIENCE WING",
        text: "The Tachyon Buffer is a device that can send 12-second messages through time. The logs show a transmission was sent at 04:00 AM — sending a message 4 hours into the PAST.\n\nThe sender ID is... YOUR keycard.\n\nYou don't remember sending anything. The message reads: 'VANCE MUST DIE. STOP THE BUFFER.'",
        choices: [
            { text: "This is a frame-up! Check the data trails", next: "data_trails" },
            { text: "Interrogate Commander Rex about security", next: "interrogate_rex" },
            { text: "Find Engineer Carter at the reactor", next: "interrogate_carter" }
        ],
        unlock: "e4"
    },
    data_trails: {
        title: "DIGITAL FORENSICS",
        speaker: "DATA ANALYSIS",
        text: "The transmission was forged using YOUR credentials. Someone accessed your keycard at 03:45 AM — the same timestamp on Vance's planted keycard.\n\nBoth keycards were in the evidence locker until 03:00 AM. Only Security Chief Rex has access to the evidence locker.\n\nBut Rex claims he was monitoring comms the whole time...",
        choices: [
            { text: "Confront Commander Rex with this evidence", next: "interrogate_rex" },
            { text: "Question Engineer Carter about the reactor", next: "interrogate_carter" },
            { text: "Return to the crime scene for more clues", next: "body第二次" }
        ]
    },
    body第二次: {
        title: "RE-EXAMINING THE BODY",
        speaker: "SECOND PASS",
        text: "On closer inspection, you notice something: Vance's neural implant port is freshly removed. Someone extracted her Tachyon research directly from her brain.\n\nThe extraction tool matches equipment from Dr. Aris's lab.\n\nBut Aris has no motive to kill — unless the Tachyon data contains something worth dying for.",
        choices: [
            { text: "Confront Dr. Aris about the neural extraction", next: "interrogate_aris" },
            { text: "Check what the Tachyon data actually contains", next: "tachyon_secret" }
        ]
    },
    tachyon_secret: {
        title: "THE TACHYON SECRET",
        speaker: "CLASSIFIED DATA",
        text: "You decrypt Vance's research. The Tachyon Buffer doesn't just send messages — it creates TEMPORAL LOOPS.\n\nVance discovered that every transmission causes a paradox. The station has been stuck in a loop for 72 hours. The 'death' at 01:00 AM already happened — and will happen again.\n\nThe only way to break the loop: destroy the Buffer. But someone wants it preserved.",
        choices: [
            { text: "Interrogate Dr. Aris — he wants the data", next: "interrogate_aris" },
            { text: "Interrogate Commander Rex — he's covering failures", next: "interrogate_rex" },
            { text: "Interrogate Engineer Carter — he tampered with the reactor", next: "interrogate_carter" }
        ]
    },
    reactor_logs: {
        title: "REACTOR CORE DATA",
        speaker: "REACTOR SYSTEMS",
        text: "At 00:50 AM — one hour before the murder — someone tampered with the voltage grid. The surge was routed specifically to the research lab.\n\nEngineer Carter's access code was used. Carter claims he was 'calibrating oxygen scrubbers,' but the scrubbers show no maintenance logs.\n\nThe voltage surge was powerful enough to kill.",
        choices: [
            { text: "Confront Engineer Carter about the voltage", next: "interrogate_carter" },
            { text: "Check who ordered the surge", next: "surge_order" }
        ]
    },
    surge_order: {
        title: "WHO ORDERED THE SURGE?",
        speaker: "COMMAND CHAIN",
        text: "The surge was ordered via remote command — from the Control Deck. Only Commander Rex has override access to reactor systems.\n\nRex's comms log shows he was 'monitoring array communications' at 01:00 AM. But the array was offline for maintenance.\n\nHe was lying about his alibi.",
        choices: [
            { text: "Confront Commander Rex with this evidence", next: "interrogate_rex" },
            { text: "Investigate further before accusing", next: "interrogate_carter" }
        ]
    },
    // ═══ INTERROGATIONS ═══
    interrogate_aris: {
        title: "DR. ARIS — INTERROGATION",
        speaker: "MESS HALL — 02:30 AM RECONSTRUCTION",
        text: "ARIS: 'Yes, I spoke to Vance's projection. The Buffer created a temporal echo — her last moments replayed. She was trying to warn me... about the loop.'\n\nARIS: 'I didn't steal anything. The neural extraction data — it was ALREADY in the Buffer before I touched it. Someone put it there hours ago.'\n\nARIS: 'Vance sent herself a message from 4 hours in the future. The message said: DON'T LET THEM DESTROY THE BUFFER.'\n\nHis hands are shaking.",
        choices: [
            { text: "Interesting... interrogate Rex next", next: "interrogate_rex" },
            { text: "Check Engineer Carter's alibi", next: "interrogate_carter" },
            { text: "Go to the accusation terminal", next: "accuse_prompt" }
        ]
    },
    interrogate_rex: {
        title: "COMMANDER REX — INTERROGATION",
        speaker: "CONTROL DECK",
        text: "REX: 'I was monitoring comms. The array was operational — you're wrong about that.'\n\nBut you show him the maintenance logs. The array WAS offline. He goes pale.\n\nREX: 'Fine. I wasn't monitoring comms. I was... reviewing security footage. Vance came to me two days ago. She said the Tachyon loop was killing her — literally. She begged me to shut down the Buffer.'\n\nREX: 'I refused. Classified project. Then she said she'd do it herself. I ordered the voltage surge to stop her reaching the Buffer room.'\n\nREX: 'I didn't mean to KILL her. Just delay her.'",
        choices: [
            { text: "You killed her over a classified project?", next: "rex_confrontation" },
            { text: "Check Carter's involvement", next: "interrogate_carter" },
            { text: "Go to the accusation terminal", next: "accuse_prompt" }
        ]
    },
    rex_confrontation: {
        title: "REX — THE TRUTH",
        speaker: "CONTROL DECK — BREAKING POINT",
        text: "REX breaks down:\n\n'The Tachyon project was MY idea. I convinced the board to fund it. When Vance proved it was creating loops — killing her repeatedly across timelines — I couldn't admit failure. The project was worth more than...'\n\nHe stops.\n\n'One life. I sacrificed one life to protect a billion-dollar project. And now the loop means she'll die again. And again. Unless someone destroys the Buffer.'",
        choices: [
            { text: "Accuse Commander Rex", next: "accuse_prompt" },
            { text: "Consider all evidence first", next: "accuse_prompt" }
        ]
    },
    interrogate_carter: {
        title: "ENGINEER CARTER — INTERROGATION",
        speaker: "REACTOR LOWER LEVEL",
        text: "CARTER: 'I tampered with the voltage — yes. But Rex ORDERED me to. He said it was a safety override.'\n\nCARTER: 'I didn't know Vance was in the lab. The surge was supposed to lock the doors, not kill anyone. But Rex used a lethal setting.'\n\nCARTER: 'There's something else. The reactor logs show TWO surges. One at 00:50 — mine. Another at 01:00 — that wasn't me. Someone else triggered a second surge after I left.'\n\nHe points to a hidden admin access log. The second surge was triggered by... Dr. Aris's credentials.",
        choices: [
            { text: "Aris triggered the fatal surge?", next: "aris_secret" },
            { text: "This changes everything — accuse someone", next: "accuse_prompt" }
        ]
    },
    aris_secret: {
        title: "DR. ARIS — THE HIDDEN TRUTH",
        speaker: "CONFRONTATION",
        text: "You confront Aris with the evidence.\n\nARIS: '...You found it. Yes. I triggered the second surge. But I did it to SAVE her.'\n\nARIS: 'Vance was dying from temporal radiation. The Buffer was killing her slowly. She asked me to end it — to destroy the reactor and the Buffer together. A mercy kill.'\n\nARIS: 'But Rex's first surge had already electrocuted her. When I triggered mine, she was already dead. I... I was too late.'\n\nThe room goes silent.",
        choices: [
            { text: "Accuse Dr. Aris", next: "accuse_prompt" },
            { text: "The real culprit is the time loop itself", next: "accuse_prompt" }
        ]
    },
    // ═══ ACT 3: ACCUSE ═══
    accuse_prompt: {
        title: "ACT III — FINAL DEDUCTION",
        speaker: "DECISION TIME",
        text: "All evidence collected. All suspects interrogated.\n\nThe truth: The Tachyon Buffer created a temporal loop. Vance died because of a cascade of actions — Rex's security order, Carter's voltage, Aris's delayed response.\n\nBut the REAL question isn't who killed her. It's how to STOP the loop from killing her again.\n\nThe answer lies in the Tachyon Buffer itself.",
        choices: [
            { text: "Go to the Accusation Terminal", next: "accuse_prompt" }
        ]
    }
};

const MYSTERY_EVIDENCE = [
    { id: "e1", title: "AUTOPSY REPORT", detail: "Death by high-voltage pulse at 01:00 AM. Wristwatch melted at 01:00:14 AM." },
    { id: "e2", title: "KEYCARD CHIP #4092", detail: "Timestamped 03:45 AM (Future Time). Contains encrypted message from your key." },
    { id: "e3", title: "CCTV LOG (MESS HALL)", detail: "Footage at 02:30 AM shows Aris talking to a shimmering holographic projection." },
    { id: "e4", title: "TACHYON BUFFER LOG", detail: "Outgoing 12-second transmission sent to 4 hours in the past by Chief Investigator." }
];

let unlockedClues = new Set(["e1"]);
let activeTab = "STORY";
let currentMysteryNode = "start";

window.initVoid = function() {
    window.startMystery();
};

window.startMystery = function() {
    activeTab = "STORY";
    currentMysteryNode = "start";

    // Asymmetric Clue Assignment for Co-Op mode!
    const isCoOp = window.gbConns && window.gbConns.length > 0;
    const isPeer = P2PGameEngine && P2PGameEngine.isPeer;

    if(isCoOp) {
        if(isPeer) {
            // Player 2 gets Even Clues (Keycard & Tachyon Buffer)
            unlockedClues = new Set(["e2", "e4"]);
        } else {
            // Player 1 (Host) gets Odd Clues (Autopsy & CCTV Log)
            unlockedClues = new Set(["e1", "e3"]);
        }
    } else {
        // Solo Mode: Starts with Autopsy Report, unlocks the rest as story progresses
        unlockedClues = new Set(["e1"]);
    }

    renderMysteryUI();
};

function renderMysteryUI() {
    const screen = document.getElementById('voidScreen');
    if(!screen) return;

    let tabContent = "";
    if(activeTab === "STORY") tabContent = getStoryHTML();
    else if(activeTab === "SUSPECTS") tabContent = getSuspectsHTML();
    else if(activeTab === "FORENSICS") tabContent = getForensicsHTML();
    else if(activeTab === "ACCUSE") tabContent = getAccuseHTML();

    screen.innerHTML = `
        <div style="padding: 8px; display: flex; flex-direction: column; height: 100%; box-sizing: border-box; background: #000; color: #0f0; font-family: 'VT323', monospace;">
            <!-- DOSSIER TABS -->
            <div style="display: flex; gap: 2px; margin-bottom: 6px; flex-shrink: 0;">
                <button onclick="switchMysteryTab('STORY')" style="flex: 1; font-size: 6px; padding: 4px; background: ${activeTab==='STORY'?'#0f0':'#111'}; color: ${activeTab==='STORY'?'#000':'#0f0'}; border: 1px solid #0f0;">📜 STORY</button>
                <button onclick="switchMysteryTab('SUSPECTS')" style="flex: 1; font-size: 6px; padding: 4px; background: ${activeTab==='SUSPECTS'?'#0f0':'#111'}; color: ${activeTab==='SUSPECTS'?'#000':'#0f0'}; border: 1px solid #0f0;">🕵️ SUSPECTS</button>
                <button onclick="switchMysteryTab('FORENSICS')" style="flex: 1; font-size: 6px; padding: 4px; background: ${activeTab==='FORENSICS'?'#0f0':'#111'}; color: ${activeTab==='FORENSICS'?'#000':'#0f0'}; border: 1px solid #0f0;">🔬 CLUES (${unlockedClues.size})</button>
                <button onclick="switchMysteryTab('ACCUSE')" style="flex: 1; font-size: 6px; padding: 4px; background: ${activeTab==='ACCUSE'?'#f00':'#200'}; color: #fff; border: 1px solid #f00;">⚖️ ACCUSE</button>
            </div>

            <div style="flex: 1; min-height: 0; display: flex; flex-direction: column;">
                ${tabContent}
            </div>

            <!-- BITCHAT P2P SHARE FOOTER -->
            <div style="margin-top: 6px; padding-top: 4px; border-top: 1px dashed #0f04; display: flex; justify-content: space-between; align-align: center; font-size: 6px;">
                <span>P2P LINK: ${window.gbConns && window.gbConns.length > 0 ? 'CONNECTED 🟢' : 'SOLO MODE 🟡'}</span>
                <button onclick="shareCluesP2P()" style="font-size: 5px; padding: 2px 6px; background: transparent; color: #0f0; border: 1px solid #0f0;">📡 SHARE CLUES VIA BITCHAT</button>
            </div>
        </div>
    `;
}

function getStoryHTML() {
    const node = MYSTERY_NODES[currentMysteryNode] || MYSTERY_NODES.start;
    let choicesHtml = node.choices.map((c) => `
        <button onclick="selectMysteryChoice('${c.next}')" style="width: 100%; text-align: left; padding: 6px; font-family: 'VT323', monospace; font-size: 8px; background: rgba(0,255,0,0.1); color: #0f0; border: 1px solid #0f0; margin-bottom: 4px; cursor: pointer;">
            ${c.text}
        </button>
    `).join('');

    return `
        <div style="font-size: 10px; font-weight: bold; border-bottom: 1px solid #0f0; padding-bottom: 2px; margin-bottom: 4px;">${node.title}</div>
        <div style="font-size: 6px; opacity: 0.7; margin-bottom: 4px; color: #ffa;">[LOG: ${node.speaker}]</div>
        <div style="font-size: 8px; line-height: 1.3; flex: 1; overflow-y: auto; white-space: pre-wrap; margin-bottom: 6px; background: rgba(0,20,0,0.8); padding: 6px; border: 1px solid #0f03;">
            ${node.text}
        </div>
        <div style="display: flex; flex-direction: column; gap: 2px;">
            ${choicesHtml}
        </div>
    `;
}

function getSuspectsHTML() {
    return Object.values(MYSTERY_SUSPECTS).map(s => `
        <div style="background: rgba(0,30,0,0.8); border: 1px solid #0f0; padding: 6px; margin-bottom: 6px; border-radius: 3px; font-size: 7px;">
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 8px; color: #0f0;">
                <span>${s.name}</span>
                <span style="color: #ffa;">${s.status}</span>
            </div>
            <div style="opacity: 0.8; margin-top: 2px;">ROLE: ${s.role}</div>
            <div style="opacity: 0.8;">ALIBI: ${s.alibi}</div>
            <div style="color: #f88; margin-top: 2px;">MOTIVE: ${s.motive}</div>
        </div>
    `).join('');
}

function getForensicsHTML() {
    const isCoOp = window.gbConns && window.gbConns.length > 0;
    const coOpBanner = isCoOp ? `
        <div style="background: rgba(0,255,0,0.15); border: 1px solid #0f0; padding: 4px; margin-bottom: 6px; font-size: 6px; color: #ffa; text-align: center;">
            📡 <b>ASYMMETRIC CO-OP ACTIVE:</b> You hold 2 clues; your partner holds the other 2! Use the floating 💬 button to compare findings!
        </div>
    ` : '';

    const cluesList = MYSTERY_EVIDENCE.map(e => {
        const isUnlocked = unlockedClues.has(e.id);
        return `
            <div style="background: ${isUnlocked ? 'rgba(0,40,0,0.8)' : 'rgba(20,20,20,0.8)'}; border: 1px solid ${isUnlocked ? '#0f0' : '#444'}; padding: 6px; margin-bottom: 6px; border-radius: 3px; font-size: 7px;">
                <div style="font-weight: bold; font-size: 8px; color: ${isUnlocked ? '#0f0' : '#666'};">
                    ${isUnlocked ? '🔓 ' + e.title : '🔒 LOCKED CLUE'}
                </div>
                <div style="opacity: 0.9; margin-top: 3px; line-height: 1.3;">
                    ${isUnlocked ? e.detail : 'Investigate scene or request clue from Co-Op partner.'}
                </div>
            </div>
        `;
    }).join('');

    return coOpBanner + cluesList;
}

function getAccuseHTML() {
    return `
        <div style="padding: 6px; text-align: center; font-size: 8px;">
            <div style="font-size: 10px; font-weight: bold; color: #f00; margin-bottom: 6px;">⚖️ FINAL DEDUCTION TERMINAL</div>
            <div style="margin-bottom: 10px; opacity: 0.8;">SELECT THE CULPRIT RESPONSIBLE FOR THE PARADOX:</div>
            
            <button onclick="accuseCulprit('aris')" style="width: 100%; padding: 8px; margin-bottom: 6px; background: #200; color: #fff; border: 1px solid #f00; font-family: 'VT323';">DR. ARIS — NEURAL EXTRACTION</button>
            <button onclick="accuseCulprit('rex')" style="width: 100%; padding: 8px; margin-bottom: 6px; background: #200; color: #fff; border: 1px solid #f00; font-family: 'VT323';">CMDR. REX — ORDERED THE SURGE</button>
            <button onclick="accuseCulprit('carter')" style="width: 100%; padding: 8px; margin-bottom: 6px; background: #200; color: #fff; border: 1px solid #f00; font-family: 'VT323';">ENGINEER CARTER — TAMPERED REACTOR</button>
            <button onclick="accuseCulprit('paradox')" style="width: 100%; padding: 8px; background: #040; color: #0f0; border: 1px solid #0f0; font-family: 'VT323';">EXPOSE THE TEMPORAL LOOP (BREAK THE CYCLE)</button>
        </div>
    `;
}

window.switchMysteryTab = function(tab) {
    activeTab = tab;
    renderMysteryUI();
};

window.selectMysteryChoice = function(nextNodeKey) {
    currentMysteryNode = nextNodeKey;
    const node = MYSTERY_NODES[nextNodeKey];
    if(node && node.unlock) unlockedClues.add(node.unlock);
    if(nextNodeKey === "accuse_prompt") {
        activeTab = "ACCUSE";
    }
    renderMysteryUI();
};

window.accuseCulprit = function(culprit) {
    if(culprit === 'paradox') {
        alert("🏆 CORRECT DEDUCTION!\n\nYou proved Evelyn Vance was killed by a temporal voltage feedback loop — a cascade of actions across timelines. Rex ordered the surge, Carter executed it, Aris tried to save her. But the REAL killer is the Tachyon Buffer itself.\n\nYou destroy the Buffer. The loop breaks. Vance lives — in the next timeline.\n\nCASE RESOLVED: TIME LOOP CLOSED.");
    } else if(culprit === 'rex') {
        alert("⚠️ PARTIAL TRUTH!\n\nCommander Rex ordered the voltage surge, but he didn't act alone. The temporal loop means this will happen again — unless you expose the system itself.\n\nTry a different deduction.");
        window.startMystery();
    } else if(culprit === 'aris') {
        alert("⚠️ PARTIAL TRUTH!\n\nDr. Aris triggered the second surge — but he was trying to HELP Vance, not kill her. The real cause is deeper.\n\nTry a different deduction.");
        window.startMystery();
    } else if(culprit === 'carter') {
        alert("⚠️ PARTIAL TRUTH!\n\nEngineer Carter tampered with the reactor — but he was following Rex's orders. The real cause is the system.\n\nTry a different deduction.");
        window.startMystery();
    }
};

window.shareCluesP2P = function() {
    if(window.gbConns && window.gbConns.length > 0) {
        window.gbConns.forEach(c => {
            if(c.open) c.send({ type: 'msg', content: `[MYSTERY CLUE SHARE] Unlocked ${unlockedClues.size}/4 clues in Signal Zero!`, nick: 'INVESTIGATOR' });
        });
        alert("CLUES SHARED WITH BITCHAT PEERS! 📡");
    } else {
        alert("NO ACTIVE BITCHAT CONNECTION. LINK DEVICES VIA BITCHAT TO CO-OP!");
    }
};
