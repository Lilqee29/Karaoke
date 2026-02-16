// ── HABIT TRACKER ──────────────────────────────────────────────────────────
(function() {
    let habits = [];
    
    function loadHabits() {
        try {
            const saved = localStorage.getItem('gbHabits');
            const data = saved ? JSON.parse(saved) : null;
            if (Array.isArray(data)) {
                habits = data;
            } else {
                habits = [
                    { name: 'EXERCISE', streak: 0, lastCheck: null, icon: '💪' },
                    { name: 'READ', streak: 0, lastCheck: null, icon: '📚' },
                    { name: 'MEDITATE', streak: 0, lastCheck: null, icon: '🧘' }
                ];
            }
        } catch(e) {
            console.warn('Failed to load habits, resetting:', e);
            habits = [];
        }
    }

    window.initHabit = function() {
        loadHabits();
        window.renderHabits();
    };

    window.renderHabits = function() {
        const list = document.getElementById('habitList');
        if (!list) return;
        
        list.innerHTML = '';
        const today = new Date().toDateString();
        
        if (!Array.isArray(habits) || habits.length === 0) {
            list.innerHTML = '<div style="text-align: center; font-size: 8px; opacity: 0.5; padding: 20px;">NO HABITS YET.<br>ADD ONE BELOW!</div>';
            return;
        }
        
        habits.forEach((habit, i) => {
            const item = document.createElement('div');
            item.style.cssText = `
                padding: 10px;
                border: 2px solid var(--gb-text);
                margin-bottom: 8px;
                border-radius: 4px;
                background: rgba(128, 128, 128, 0.1);
            `;
            
            const checkedToday = habit.lastCheck === today;
            const checkBtn = checkedToday ? '✅' : '⬜';
            
            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <div style="font-size: 8px; font-weight: bold;">${habit.icon || '⭐'} ${habit.name}</div>
                        <div style="font-size: 6px; opacity: 0.7; margin-top: 2px;">🔥 ${habit.streak || 0} DAY STREAK</div>
                    </div>
                    <button onclick="toggleHabit(${i})" style="font-size: 20px; padding: 5px 10px; background: none; border: none; cursor: pointer;">${checkBtn}</button>
                </div>
            `;
            list.appendChild(item);
        });
    };

    window.toggleHabit = function(index) {
        const today = new Date().toDateString();
        const habit = habits[index];
        if (!habit) return;
        
        if (habit.lastCheck === today) {
            habit.lastCheck = null;
            if (habit.streak > 0) habit.streak--;
        } else {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const wasYesterday = habit.lastCheck === yesterday.toDateString();
            
            habit.streak = wasYesterday ? (habit.streak || 0) + 1 : 1;
            habit.lastCheck = today;
            
            if (window.sounds && window.sounds.coin) window.sounds.coin();
            if (window.addGems) window.addGems(5);
            if (window.trackQuest) trackQuest('habit', 1);
        }
        
        localStorage.setItem('gbHabits', JSON.stringify(habits));
        window.renderHabits();
    };

    window.addHabit = function() {
        const name = prompt('HABIT NAME:');
        if (name && name.trim()) {
            if (!Array.isArray(habits)) habits = [];
            habits.push({ 
                name: name.trim().toUpperCase().substring(0, 15), 
                streak: 0, 
                lastCheck: null, 
                icon: '⭐' 
            });
            localStorage.setItem('gbHabits', JSON.stringify(habits));
            window.renderHabits();
        }
    };
})();

// ── JOURNAL ────────────────────────────────────────────────────────────────
let journalEntries = JSON.parse(localStorage.getItem('gbJournal')) || [];

window.initJournal = function() {
    showJournalList();
};

function showJournalList() {
    const screen = document.getElementById('journalScreen');
    if (!screen) return;
    
    let html = `
        <div style="padding: 10px;">
            <button onclick="newJournalEntry()" style="width: 100%; margin-bottom: 10px;">📝 NEW ENTRY</button>
            <div style="max-height: 250px; overflow-y: auto;">
    `;
    
    journalEntries.slice().reverse().forEach((entry, i) => {
        const actualIndex = journalEntries.length - 1 - i;
        const date = new Date(entry.date).toLocaleDateString();
        const preview = entry.text.substring(0, 40) + (entry.text.length > 40 ? '...' : '');
        
        html += `
            <div onclick="viewJournalEntry(${actualIndex})" style="
                padding: 8px;
                border: 1px solid var(--gb-text);
                margin-bottom: 5px;
                cursor: pointer;
                background: rgba(15, 56, 15, 0.05);
            ">
                <div style="font-size: 6px; opacity: 0.7;">${date}</div>
                <div style="font-size: 7px; margin-top: 3px;">${sanitizeHTML(preview)}</div>
            </div>
        `;
    });
    
    html += `</div></div>`;
    screen.innerHTML = html;
}

window.newJournalEntry = function() {
    const text = prompt('JOURNAL ENTRY (Max 500 chars):');
    if (text && text.trim()) {
        journalEntries.push({
            date: new Date().toISOString(),
            text: text.trim().substring(0, 500)
        });
        localStorage.setItem('gbJournal', JSON.stringify(journalEntries));
        if (window.trackQuest) trackQuest('journal', 1);
        sounds.click();
        showJournalList();
    }
};

window.viewJournalEntry = function(index) {
    const entry = journalEntries[index];
    if (!entry) return;
    
    const screen = document.getElementById('journalScreen');
    const date = new Date(entry.date).toLocaleString();
    
    screen.innerHTML = `
        <div style="padding: 10px;">
            <button onclick="showJournalList()" style="margin-bottom: 10px;">← BACK</button>
            <div style="font-size: 6px; opacity: 0.7; margin-bottom: 10px;">${date}</div>
            <div style="
                background: rgba(15, 56, 15, 0.1);
                padding: 10px;
                border: 2px solid var(--gb-text);
                border-radius: 4px;
                max-height: 220px;
                overflow-y: auto;
                font-size: 8px;
                line-height: 1.4;
                word-wrap: break-word;
            ">${sanitizeHTML(entry.text)}</div>
            <button onclick="deleteJournalEntry(${index})" style="margin-top: 10px; background: #8b0000;">🗑️ DELETE</button>
        </div>
    `;
};

window.deleteJournalEntry = function(index) {
    if (confirm('DELETE THIS ENTRY?')) {
        journalEntries.splice(index, 1);
        localStorage.setItem('gbJournal', JSON.stringify(journalEntries));
        sounds.back();
        showJournalList();
    }
};

// ── WORKOUT TRACKER ────────────────────────────────────────────────────────
const workouts = [
    { name: 'PUSH-UPS', reps: 10, sets: 3 },
    { name: 'SQUATS', reps: 15, sets: 3 },
    { name: 'PLANK', reps: 30, sets: 3 }, // seconds
    { name: 'JUMPING JACKS', reps: 20, sets: 3 }
];

let workoutLog = JSON.parse(localStorage.getItem('gbWorkoutLog')) || [];

window.initWorkout = function() {
    const screen = document.getElementById('workoutScreen');
    if (!screen) return;
    
    let html = `
        <div style="padding: 10px;">
            <div style="font-size: 8px; margin-bottom: 10px; text-align: center;">💪 QUICK WORKOUT</div>
            <div style="margin-bottom: 15px;">
    `;
    
    workouts.forEach((w, i) => {
        html += `
            <div style="
                padding: 8px;
                border: 2px solid var(--gb-text);
                margin-bottom: 8px;
                border-radius: 4px;
                background: rgba(15, 56, 15, 0.05);
            ">
                <div style="font-size: 8px; font-weight: bold;">${w.name}</div>
                <div style="font-size: 6px; margin-top: 3px;">${w.sets} sets × ${w.reps} ${w.name.includes('PLANK') ? 'sec' : 'reps'}</div>
                <button onclick="logWorkout(${i})" style="margin-top: 5px; font-size: 6px; padding: 4px 8px;">✓ DONE</button>
            </div>
        `;
    });
    
    html += `
            </div>
            <div style="font-size: 6px; text-align: center; opacity: 0.7;">
                TOTAL WORKOUTS: ${workoutLog.length}
            </div>
        </div>
    `;
    
    screen.innerHTML = html;
};

window.logWorkout = function(index) {
    const workout = workouts[index];
    workoutLog.push({
        workout: workout.name,
        date: new Date().toISOString()
    });
    localStorage.setItem('gbWorkoutLog', JSON.stringify(workoutLog));
    sounds.coin();
    addGems(10);
    alert(`${workout.name} LOGGED! +10 GEMS`);
};

// ── STUDY FLASHCARDS ───────────────────────────────────────────────────────
let flashcards = JSON.parse(localStorage.getItem('gbFlashcards')) || [
    { front: 'HTML', back: 'HyperText Markup Language' },
    { front: 'CSS', back: 'Cascading Style Sheets' },
    { front: 'JS', back: 'JavaScript' }
];

let currentCard = 0;
let showFront = true;

window.initStudy = function() {
    currentCard = 0;
    showFront = true;
    renderFlashcard();
};

function renderFlashcard() {
    const screen = document.getElementById('studyScreen');
    if (!screen || flashcards.length === 0) return;
    
    const card = flashcards[currentCard];
    const text = showFront ? card.front : card.back;
    
    screen.innerHTML = `
        <div style="padding: 10px; display: flex; flex-direction: column; height: 100%;">
            <div style="font-size: 6px; text-align: center; margin-bottom: 10px;">
                CARD ${currentCard + 1} / ${flashcards.length}
            </div>
            
            <div onclick="flipCard()" style="
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(15, 56, 15, 0.1);
                border: 3px solid var(--gb-text);
                border-radius: 8px;
                padding: 20px;
                cursor: pointer;
                text-align: center;
                font-size: 10px;
                word-wrap: break-word;
                margin-bottom: 15px;
            ">
                ${sanitizeHTML(text)}
            </div>
            
            <div style="display: flex; gap: 5px; margin-bottom: 10px;">
                <button onclick="prevCard()" style="flex: 1;">← PREV</button>
                <button onclick="flipCard()" style="flex: 1;">🔄 FLIP</button>
                <button onclick="nextCard()" style="flex: 1;">NEXT →</button>
            </div>
            
            <button onclick="addFlashcard()" style="font-size: 6px; padding: 6px;">+ ADD CARD</button>
        </div>
    `;
}

window.flipCard = function() {
    showFront = !showFront;
    sounds.click();
    renderFlashcard();
};

window.nextCard = function() {
    currentCard = (currentCard + 1) % flashcards.length;
    showFront = true;
    sounds.click();
    renderFlashcard();
};

window.prevCard = function() {
    currentCard = (currentCard - 1 + flashcards.length) % flashcards.length;
    showFront = true;
    sounds.click();
    renderFlashcard();
};

window.addFlashcard = function() {
    const front = prompt('FRONT (Question):');
    if (!front) return;
    const back = prompt('BACK (Answer):');
    if (!back) return;
    
    flashcards.push({
        front: front.trim().substring(0, 100),
        back: back.trim().substring(0, 200)
    });
    localStorage.setItem('gbFlashcards', JSON.stringify(flashcards));
    sounds.coin();
    renderFlashcard();
};

// ── BUDGET TRACKER ─────────────────────────────────────────────────────────
let budget = JSON.parse(localStorage.getItem('gbBudget')) || {
    monthlyBudget: 1000,
    expenses: []
};

window.initBudget = function() {
    renderBudget();
};

function renderBudget() {
    const screen = document.getElementById('budgetScreen');
    if (!screen) return;
    
    const totalSpent = budget.expenses.reduce((sum, e) => sum + e.amount, 0);
    const remaining = budget.monthlyBudget - totalSpent;
    const percentUsed = Math.round((totalSpent / budget.monthlyBudget) * 100);
    
    let html = `
        <div style="padding: 10px;">
            <div style="text-align: center; margin-bottom: 15px;">
                <div style="font-size: 6px; opacity: 0.7;">MONTHLY BUDGET</div>
                <div style="font-size: 12px; font-weight: bold; margin: 5px 0;">$${budget.monthlyBudget}</div>
                <div style="font-size: 8px; color: ${remaining >= 0 ? '#0f0' : '#f00'};">
                    ${remaining >= 0 ? 'REMAINING' : 'OVER'}: $${Math.abs(remaining)}
                </div>
                <div style="
                    width: 100%;
                    height: 10px;
                    background: rgba(15, 56, 15, 0.2);
                    border: 1px solid var(--gb-text);
                    border-radius: 5px;
                    margin-top: 8px;
                    overflow: hidden;
                ">
                    <div style="
                        width: ${Math.min(percentUsed, 100)}%;
                        height: 100%;
                        background: ${percentUsed > 100 ? '#f00' : percentUsed > 75 ? '#ff0' : '#0f0'};
                        transition: width 0.3s;
                    "></div>
                </div>
            </div>
            
            <button onclick="addExpense()" style="width: 100%; margin-bottom: 10px;">+ ADD EXPENSE</button>
            <button onclick="setBudget()" style="width: 100%; margin-bottom: 10px; font-size: 6px;">⚙️ SET BUDGET</button>
            
            <div style="max-height: 150px; overflow-y: auto; border-top: 1px solid var(--gb-text); padding-top: 10px;">
    `;
    
    budget.expenses.slice().reverse().forEach((exp, i) => {
        const actualIndex = budget.expenses.length - 1 - i;
        html += `
            <div style="
                padding: 5px;
                border-bottom: 1px solid rgba(15, 56, 15, 0.2);
                display: flex;
                justify-content: space-between;
                font-size: 7px;
            ">
                <span>${sanitizeHTML(exp.name)}</span>
                <span style="font-weight: bold;">-$${exp.amount}</span>
            </div>
        `;
    });
    
    html += `</div></div>`;
    screen.innerHTML = html;
}

window.addExpense = function() {
    const name = prompt('EXPENSE NAME:');
    if (!name) return;
    const amount = parseFloat(prompt('AMOUNT:'));
    if (isNaN(amount) || amount <= 0) return;
    
    budget.expenses.push({
        name: name.trim().substring(0, 30),
        amount: Math.round(amount * 100) / 100,
        date: new Date().toISOString()
    });
    localStorage.setItem('gbBudget', JSON.stringify(budget));
    sounds.click();
    renderBudget();
};

window.setBudget = function() {
    const amount = parseFloat(prompt('MONTHLY BUDGET:'));
    if (isNaN(amount) || amount <= 0) return;
    
    budget.monthlyBudget = Math.round(amount * 100) / 100;
    localStorage.setItem('gbBudget', JSON.stringify(budget));
    sounds.coin();
    renderBudget();
};

window.clearBudget = function() {
    if (confirm('CLEAR ALL EXPENSES?')) {
        budget.expenses = [];
        localStorage.setItem('gbBudget', JSON.stringify(budget));
        sounds.back();
        renderBudget();
    }
};
