// ==================== INPUT MODAL ====================
function showInput(title, currentValue) {
    return new Promise((resolve) => {
        const modal = document.getElementById('input-modal');
        const input = document.getElementById('input-modal-value');
        const titleEl = document.getElementById('input-modal-title');
        
        titleEl.textContent = title;
        input.value = currentValue;
        
        const saveBtn = document.getElementById('input-modal-save');
        const cancelBtn = document.getElementById('input-modal-cancel');
        const closeBtn = document.getElementById('input-modal-close');
        
        const cleanup = () => {
            modal.classList.add('hidden');
            saveBtn.removeEventListener('click', handleSave);
            cancelBtn.removeEventListener('click', handleCancel);
            closeBtn.removeEventListener('click', handleCancel);
            modal.removeEventListener('click', handleBackdrop);
        };
        
        const handleSave = () => {
            const value = parseInt(input.value);
            cleanup();
            resolve(value);
        };
        
        const handleCancel = () => {
            cleanup();
            resolve(null);
        };
        
        const handleBackdrop = (e) => {
            if (e.target === modal) {
                cleanup();
                resolve(null);
            }
        };
        
        saveBtn.addEventListener('click', handleSave);
        cancelBtn.addEventListener('click', handleCancel);
        closeBtn.addEventListener('click', handleCancel);
        modal.addEventListener('click', handleBackdrop);
        
        modal.classList.remove('hidden');
        input.focus();
        input.select();
    });
}

// ==================== CONFIRM MODAL ====================
let confirmCallback = null;

function showConfirm(message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirm-modal');
        document.getElementById('confirm-message').textContent = message;
        
        const okBtn = document.getElementById('confirm-ok');
        const cancelBtn = document.getElementById('confirm-cancel');
        
        const cleanup = () => {
            modal.classList.add('hidden');
            okBtn.removeEventListener('click', handleOk);
            cancelBtn.removeEventListener('click', handleCancel);
            modal.removeEventListener('click', handleBackdrop);
        };
        
        const handleOk = () => {
            cleanup();
            resolve(true);
        };
        
        const handleCancel = () => {
            cleanup();
            resolve(false);
        };
        
        const handleBackdrop = (e) => {
            if (e.target === modal) {
                cleanup();
                resolve(false);
            }
        };
        
        okBtn.addEventListener('click', handleOk);
        cancelBtn.addEventListener('click', handleCancel);
        modal.addEventListener('click', handleBackdrop);
        
        modal.classList.remove('hidden');
    });
}

// ==================== TOAST NOTIFICATION ====================
function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    
    // Trigger reflow per animazione
    toast.offsetHeight;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 300);
    }, duration);
}

// ==================== DATABASE (IndexedDB con Dexie) ====================
const db = new Dexie('ChocoFitDB');
db.version(2).stores({
    days: '++id, name, emoji, order',
    exercises: '++id, dayId, name, sets, reps, weight, rest, order',
    settings: 'key',
    cardiac: 'key'
});

// ==================== STATE ====================
let currentDayId = null;
let editingDayId = null;
let editingExerciseId = null;

// ==================== DOM ELEMENTS ====================
const screens = {
    welcome: document.getElementById('welcome-screen'),
    setup: document.getElementById('setup-screen'),
    app: document.getElementById('app-screen'),
    cardiac: document.getElementById('cardiac-screen')
};

const modals = {
    day: document.getElementById('day-modal'),
    exercise: document.getElementById('exercise-modal')
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', async () => {
    await checkFirstRun();
    setupEventListeners();
});

async function checkFirstRun() {
    const days = await db.days.count();
    if (days === 0) {
        showScreen('welcome');
    } else {
        showScreen('app');
        await loadWorkoutApp();
    }
}

// ==================== SCREEN MANAGEMENT ====================
function showScreen(screenName) {
    Object.keys(screens).forEach(key => {
        screens[key].classList.remove('active');
        screens[key].classList.add('hidden');
    });
    
    screens[screenName].classList.remove('hidden');
    screens[screenName].classList.add('active');
    
    if (screenName === 'setup') {
        loadSetupScreen();
    } else if (screenName === 'cardiac') {
        loadCardiacPage();
    }
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    // Welcome screen
    document.getElementById('start-setup-btn').addEventListener('click', () => {
        showScreen('setup');
    });
    
    document.getElementById('import-welcome').addEventListener('change', handleImport);
    
    // Setup screen
    document.getElementById('add-day-btn').addEventListener('click', () => openDayModal());
    document.getElementById('start-workout-btn').addEventListener('click', async () => {
        showScreen('app');
        await loadWorkoutApp();
    });
    document.getElementById('export-btn').addEventListener('click', handleExport);
    document.getElementById('import-setup').addEventListener('change', handleImport);
    document.getElementById('delete-all-btn').addEventListener('click', handleDeleteAll);
    
    // Day modal
    document.getElementById('modal-close').addEventListener('click', closeDayModal);
    document.getElementById('modal-cancel').addEventListener('click', closeDayModal);
    document.getElementById('modal-save').addEventListener('click', saveDayModal);
    
    // Exercise modal
    document.getElementById('exercise-modal-close').addEventListener('click', closeExerciseModal);
    document.getElementById('exercise-modal-cancel').addEventListener('click', closeExerciseModal);
    document.getElementById('exercise-modal-save').addEventListener('click', saveExerciseModal);
    
    // Progressive toggle
    document.getElementById('exercise-progressive').addEventListener('change', (e) => {
        const isProgressive = e.target.checked;
        document.getElementById('standard-reps-group').classList.toggle('hidden', isProgressive);
        document.getElementById('progressive-reps-group').classList.toggle('hidden', !isProgressive);
    });
    
    // App screen
    document.getElementById('settings-btn').addEventListener('click', () => {
        showScreen('setup');
    });
    
    // Timer
    document.getElementById('timer-start').addEventListener('click', startTimer);
    document.getElementById('timer-stop').addEventListener('click', stopTimer);
    document.getElementById('timer-reset').addEventListener('click', resetTimer);
    document.getElementById('timer-input').addEventListener('change', (e) => {
        if (!timerRunning) {
            timeLeft = parseInt(e.target.value) || 60;
            updateTimerDisplay();
        }
    });
    
    // Close modals on backdrop click
    modals.day.addEventListener('click', (e) => {
        if (e.target === modals.day) closeDayModal();
    });
    modals.exercise.addEventListener('click', (e) => {
        if (e.target === modals.exercise) closeExerciseModal();
    });
    
    // Cardiac toggle
    document.getElementById('cardiac-toggle').addEventListener('change', async (e) => {
        await db.settings.put({ key: 'cardiacEnabled', value: e.target.checked });
        updateCardiacFabVisibility();
    });
    
    // Cardiac FAB
    document.getElementById('cardiac-fab').addEventListener('click', () => {
        showScreen('cardiac');
    });
    
    // Cardiac back button
    document.getElementById('cardiac-back-btn').addEventListener('click', () => {
        showScreen('app');
    });
    
    // Cardiac last week input
    document.getElementById('cardiac-last-week').addEventListener('change', async (e) => {
        const lastWeek = parseFloat(e.target.value) || 0;
        const cardiacData = await getCardiacData();
        cardiacData.lastWeekAvg = lastWeek;
        cardiacData.targetAvg = Math.round(lastWeek * 1.1 * 10) / 10; // +10%
        await saveCardiacData(cardiacData);
        updateCardiacDisplay(cardiacData);
    });
}

// ==================== SETUP SCREEN ====================
async function loadSetupScreen() {
    const days = await db.days.orderBy('order').toArray();
    const daysList = document.getElementById('days-list');
    daysList.innerHTML = '';
    
    for (const day of days) {
        const exercises = await db.exercises.where('dayId').equals(day.id).sortBy('order');
        daysList.appendChild(createDayCard(day, exercises));
    }
    
    updateStartButton();
    
    // Load cardiac toggle state
    await loadCardiacSettings();
}

function createDayCard(day, exercises) {
    const card = document.createElement('div');
    card.className = 'day-card';
    card.dataset.dayId = day.id;
    
    card.innerHTML = `
        <div class="day-header" data-day-id="${day.id}">
            <div class="day-info">
                <span class="day-emoji">${day.emoji || '📅'}</span>
                <span class="day-name">${day.name}</span>
                <span class="day-count">${exercises.length} esercizi</span>
            </div>
            <div class="day-header-right">
                <svg class="day-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </div>
        </div>
        <div class="day-content hidden">
            <div class="day-exercises">
                ${exercises.map((ex, index) => createExerciseItem(ex, index + 1)).join('')}
                <button class="add-exercise-btn" data-day-id="${day.id}">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                    <span>Aggiungi esercizio</span>
                </button>
            </div>
            <div class="day-actions-bottom">
                <button class="day-action-btn-bottom edit" data-day-id="${day.id}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    <span>Modifica giorno</span>
                </button>
                <button class="day-action-btn-bottom delete" data-day-id="${day.id}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    <span>Elimina giorno</span>
                </button>
            </div>
        </div>
    `;
    
    // Toggle expand/collapse
    card.querySelector('.day-header').addEventListener('click', () => {
        const content = card.querySelector('.day-content');
        const chevron = card.querySelector('.day-chevron');
        content.classList.toggle('hidden');
        chevron.classList.toggle('rotated');
    });
    
    // Event listeners for actions
    card.querySelector('.day-action-btn-bottom.edit').addEventListener('click', async (e) => {
        e.stopPropagation();
        const dayData = await db.days.get(day.id);
        openDayModal(dayData);
    });
    
    card.querySelector('.day-action-btn-bottom.delete').addEventListener('click', (e) => {
        e.stopPropagation();
        deleteDay(day.id);
    });
    
    card.querySelector('.add-exercise-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        openExerciseModal(day.id);
    });
    
    // Exercise actions
    card.querySelectorAll('.exercise-action-btn.edit').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const exerciseId = parseInt(btn.closest('.exercise-item').dataset.exerciseId);
            const exercise = await db.exercises.get(exerciseId);
            openExerciseModal(day.id, exercise);
        });
    });
    
    card.querySelectorAll('.exercise-action-btn.delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const exerciseId = parseInt(btn.closest('.exercise-item').dataset.exerciseId);
            await deleteExercise(exerciseId);
        });
    });
    
    // Drag & Drop for exercises
    setupDragAndDrop(card, day.id);
    
    return card;
}

// ==================== DRAG & DROP ====================
let draggedItem = null;
let touchStartY = 0;
let touchCurrentItem = null;

function setupDragAndDrop(card, dayId) {
    const container = card.querySelector('.day-exercises');
    const items = card.querySelectorAll('.exercise-item');
    
    items.forEach(item => {
        // Mouse drag events
        item.addEventListener('dragstart', (e) => {
            draggedItem = item;
            item.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });
        
        item.addEventListener('dragend', async () => {
            item.classList.remove('dragging');
            document.querySelectorAll('.exercise-item').forEach(i => i.classList.remove('drag-over'));
            
            if (draggedItem) {
                await updateExerciseOrder(dayId, container);
                draggedItem = null;
            }
        });
        
        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (draggedItem && draggedItem !== item) {
                item.classList.add('drag-over');
            }
        });
        
        item.addEventListener('dragleave', () => {
            item.classList.remove('drag-over');
        });
        
        item.addEventListener('drop', (e) => {
            e.preventDefault();
            item.classList.remove('drag-over');
            
            if (draggedItem && draggedItem !== item) {
                const allItems = [...container.querySelectorAll('.exercise-item')];
                const draggedIndex = allItems.indexOf(draggedItem);
                const dropIndex = allItems.indexOf(item);
                
                if (draggedIndex < dropIndex) {
                    item.after(draggedItem);
                } else {
                    item.before(draggedItem);
                }
            }
        });
        
        // Touch events for mobile
        const handle = item.querySelector('.drag-handle');
        
        handle.addEventListener('touchstart', (e) => {
            touchCurrentItem = item;
            touchStartY = e.touches[0].clientY;
            item.classList.add('dragging');
        }, { passive: true });
        
        handle.addEventListener('touchmove', (e) => {
            if (!touchCurrentItem) return;
            
            const touchY = e.touches[0].clientY;
            const items = [...container.querySelectorAll('.exercise-item')];
            
            items.forEach(otherItem => {
                if (otherItem === touchCurrentItem) return;
                
                const rect = otherItem.getBoundingClientRect();
                const centerY = rect.top + rect.height / 2;
                
                if (Math.abs(touchY - centerY) < rect.height / 2) {
                    otherItem.classList.add('drag-over');
                } else {
                    otherItem.classList.remove('drag-over');
                }
            });
        }, { passive: true });
        
        handle.addEventListener('touchend', async (e) => {
            if (!touchCurrentItem) return;
            
            const touchY = e.changedTouches[0].clientY;
            const items = [...container.querySelectorAll('.exercise-item')];
            
            let targetItem = null;
            items.forEach(otherItem => {
                otherItem.classList.remove('drag-over');
                if (otherItem === touchCurrentItem) return;
                
                const rect = otherItem.getBoundingClientRect();
                const centerY = rect.top + rect.height / 2;
                
                if (Math.abs(touchY - centerY) < rect.height / 2) {
                    targetItem = otherItem;
                }
            });
            
            if (targetItem) {
                const draggedIndex = items.indexOf(touchCurrentItem);
                const dropIndex = items.indexOf(targetItem);
                
                if (draggedIndex < dropIndex) {
                    targetItem.after(touchCurrentItem);
                } else {
                    targetItem.before(touchCurrentItem);
                }
            }
            
            touchCurrentItem.classList.remove('dragging');
            await updateExerciseOrder(dayId, container);
            touchCurrentItem = null;
        });
    });
}

async function updateExerciseOrder(dayId, container) {
    const items = container.querySelectorAll('.exercise-item');
    const updates = [];
    
    items.forEach((item, index) => {
        const exerciseId = parseInt(item.dataset.exerciseId);
        updates.push(db.exercises.update(exerciseId, { order: index }));
        
        // Update visual number
        const numberEl = item.querySelector('.exercise-item-number');
        if (numberEl) {
            numberEl.textContent = index + 1;
        }
    });
    
    await Promise.all(updates);
}

function createExerciseItem(exercise, number) {
    let repsDisplay;
    if (exercise.isProgressive) {
        repsDisplay = `${exercise.repsMin}→${exercise.repsMax}`;
    } else {
        repsDisplay = `${exercise.sets}×${exercise.reps}`;
    }
    
    return `
        <div class="exercise-item" data-exercise-id="${exercise.id}" data-order="${exercise.order}" draggable="true">
            <div class="drag-handle">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="8" y1="6" x2="16" y2="6"></line>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                    <line x1="8" y1="18" x2="16" y2="18"></line>
                </svg>
            </div>
            <div class="exercise-item-number">${number}</div>
            <div class="exercise-item-info">
                <div class="exercise-item-name">${exercise.name}</div>
                <div class="exercise-item-details">
                    ${repsDisplay} • ${exercise.weight}kg • ${exercise.rest}s riposo
                </div>
            </div>
            <div class="exercise-item-actions">
                <button class="exercise-action-btn edit" title="Modifica">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                </button>
                <button class="exercise-action-btn delete" title="Elimina">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                </button>
            </div>
        </div>
    `;
}

async function updateStartButton() {
    const days = await db.days.count();
    const btn = document.getElementById('start-workout-btn');
    btn.disabled = days === 0;
}

// ==================== DAY MODAL ====================
let selectedEmoji = '';

function openDayModal(day = null) {
    editingDayId = day ? day.id : null;
    
    document.getElementById('modal-title').textContent = day ? 'Modifica Giorno' : 'Nuovo Giorno';
    document.getElementById('day-name').value = day ? day.name : '';
    document.getElementById('day-emoji').value = day ? day.emoji || '' : '';
    selectedEmoji = day ? day.emoji || '' : '';
    
    // Reset emoji selection
    document.querySelectorAll('.emoji-btn').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.emoji === selectedEmoji);
    });
    
    // Setup emoji button listeners
    document.querySelectorAll('.emoji-btn').forEach(btn => {
        btn.onclick = () => {
            selectedEmoji = btn.dataset.emoji;
            document.getElementById('day-emoji').value = selectedEmoji;
            document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        };
    });
    
    modals.day.classList.remove('hidden');
}

function closeDayModal() {
    modals.day.classList.add('hidden');
    editingDayId = null;
}

async function saveDayModal() {
    const nameSelect = document.getElementById('day-name');
    const name = nameSelect.value.trim();
    const emoji = document.getElementById('day-emoji').value.trim();
    
    if (!name) {
        showToast('Seleziona un giorno della settimana');
        return;
    }
    
    if (!emoji) {
        showToast('Seleziona un\'emoji');
        return;
    }
    
    if (editingDayId) {
        await db.days.update(editingDayId, { name, emoji });
    } else {
        // Check if day already exists
        const existingDay = await db.days.where('name').equals(name).first();
        if (existingDay) {
            showToast('Questo giorno è già presente nella scheda');
            return;
        }
        
        const count = await db.days.count();
        await db.days.add({ name, emoji, order: count });
    }
    
    closeDayModal();
    await loadSetupScreen();
}

async function deleteDay(dayId) {
    const confirmed = await showConfirm('Eliminare questo giorno e tutti i suoi esercizi?');
    if (!confirmed) return;
    
    await db.exercises.where('dayId').equals(dayId).delete();
    await db.days.delete(dayId);
    await loadSetupScreen();
}

// ==================== EXERCISE MODAL ====================
function openExerciseModal(dayId, exercise = null) {
    currentDayId = dayId;
    editingExerciseId = exercise ? exercise.id : null;
    
    document.getElementById('exercise-modal-title').textContent = exercise ? 'Modifica Esercizio' : 'Nuovo Esercizio';
    document.getElementById('exercise-name').value = exercise ? exercise.name : '';
    document.getElementById('exercise-sets').value = exercise ? exercise.sets : 3;
    document.getElementById('exercise-reps').value = exercise ? exercise.reps : 10;
    document.getElementById('exercise-weight').value = exercise ? exercise.weight : 0;
    document.getElementById('exercise-rest').value = exercise ? exercise.rest : 60;
    
    // Progressive fields
    const isProgressive = exercise ? exercise.isProgressive : false;
    document.getElementById('exercise-progressive').checked = isProgressive;
    document.getElementById('exercise-reps-min').value = exercise ? (exercise.repsMin || 10) : 10;
    document.getElementById('exercise-reps-max').value = exercise ? (exercise.repsMax || 12) : 12;
    
    // Show/hide appropriate fields
    document.getElementById('standard-reps-group').classList.toggle('hidden', isProgressive);
    document.getElementById('progressive-reps-group').classList.toggle('hidden', !isProgressive);
    
    modals.exercise.classList.remove('hidden');
    document.getElementById('exercise-name').focus();
}

function closeExerciseModal() {
    modals.exercise.classList.add('hidden');
    editingExerciseId = null;
    currentDayId = null;
}

async function saveExerciseModal() {
    const name = document.getElementById('exercise-name').value.trim();
    const isProgressive = document.getElementById('exercise-progressive').checked;
    const weight = parseFloat(document.getElementById('exercise-weight').value) || 0;
    const rest = parseInt(document.getElementById('exercise-rest').value) || 60;
    
    if (!name) {
        showToast('Inserisci un nome per l\'esercizio');
        return;
    }
    
    let sets, reps, repsMin, repsMax;
    
    // Serie sempre lette dal campo dedicato
    sets = parseInt(document.getElementById('exercise-sets').value) || 3;
    
    if (isProgressive) {
        repsMin = parseInt(document.getElementById('exercise-reps-min').value) || 10;
        repsMax = parseInt(document.getElementById('exercise-reps-max').value) || 12;
        
        if (repsMin >= repsMax) {
            showToast('Il minimo deve essere inferiore al massimo');
            return;
        }
        
        reps = repsMin; // Valore base per compatibilità
    } else {
        reps = parseInt(document.getElementById('exercise-reps').value) || 10;
        repsMin = null;
        repsMax = null;
    }
    
    const exerciseData = {
        name,
        sets,
        reps,
        weight,
        rest,
        isProgressive,
        repsMin,
        repsMax
    };
    
    if (editingExerciseId) {
        await db.exercises.update(editingExerciseId, exerciseData);
    } else {
        const count = await db.exercises.where('dayId').equals(currentDayId).count();
        await db.exercises.add({
            dayId: currentDayId,
            ...exerciseData,
            order: count
        });
    }
    
    closeExerciseModal();
    await loadSetupScreen();
}

async function deleteExercise(exerciseId) {
    const confirmed = await showConfirm('Eliminare questo esercizio?');
    if (!confirmed) return;
    
    await db.exercises.delete(exerciseId);
    await loadSetupScreen();
}

// ==================== WORKOUT APP ====================
async function loadWorkoutApp() {
    const days = await db.days.orderBy('order').toArray();
    
    if (days.length === 0) {
        showScreen('setup');
        return;
    }
    
    // Build navigation
    const navContainer = document.getElementById('nav-container');
    navContainer.innerHTML = '';
    
    days.forEach((day, index) => {
        const btn = document.createElement('button');
        btn.className = `nav-btn ${index === 0 ? 'active' : ''}`;
        btn.dataset.dayId = day.id;
        btn.innerHTML = `
            <span class="nav-emoji">${day.emoji || '📅'}</span>
        `;
        btn.title = day.name;
        btn.addEventListener('click', () => switchSession(day.id));
        navContainer.appendChild(btn);
    });
    
    // Build sessions
    const sessionsContainer = document.getElementById('sessions-container');
    sessionsContainer.innerHTML = '';
    
    for (let i = 0; i < days.length; i++) {
        const day = days[i];
        const exercises = await db.exercises.where('dayId').equals(day.id).sortBy('order');
        sessionsContainer.appendChild(createSessionCard(day, exercises, i === 0));
    }
    
    // Trigger initial animation
    setTimeout(() => {
        triggerInitialAnimation();
    }, 100);
    
    // Setup scroll listener
    sessionsContainer.addEventListener('scroll', updateActiveExerciseCard);
    
    // Load cardiac FAB visibility
    await updateCardiacFabVisibility();
}

function createSessionCard(day, exercises, isActive) {
    const card = document.createElement('div');
    card.className = `session-card ${isActive ? 'active' : ''}`;
    card.dataset.dayId = day.id;
    
    let html = `
        <div class="session-title-wrapper">
            <div class="session-title">${day.emoji || '📅'} ${day.name}</div>
        </div>
    `;
    
    if (exercises.length === 0) {
        html += `
            <div class="empty-state">
                <div class="empty-state-icon">🏋️</div>
                <p class="empty-state-text">Nessun esercizio configurato</p>
            </div>
        `;
    } else {
        exercises.forEach((exercise, index) => {
            html += createExerciseCard(exercise, index + 1);
        });
    }
    
    html += `
        <div class="session-footer">
            <div class="session-footer-main">
                Made with Love
                <svg class="heart-icon" width="16" height="16" viewBox="0 0 24 24" fill="#ff0000">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                by PwR
            </div>
            <div class="session-footer-copyright">
                © 2025 ChocoFit Academy
            </div>
        </div>
    `;
    
    card.innerHTML = html;
    
    // Add event listeners for weight inputs
    card.querySelectorAll('.kg-input').forEach(input => {
        input.addEventListener('change', async () => {
            const exerciseId = parseInt(input.dataset.exerciseId);
            const weight = parseFloat(input.value) || 0;
            await db.exercises.update(exerciseId, { weight });
        });
    });
    
    // Add event listeners for sets/reps buttons
    card.querySelectorAll('.sets-reps-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            openQuickEditModal(
                parseInt(btn.dataset.exerciseId),
                btn.dataset.field,
                parseInt(btn.dataset.value)
            );
        });
    });
    
    // Add event listeners for progressive reps select
    card.querySelectorAll('.reps-select').forEach(select => {
        select.addEventListener('change', async () => {
            const exerciseId = parseInt(select.dataset.exerciseId);
            const currentRep = parseInt(select.value);
            // Salva la ripetizione corrente selezionata
            await db.exercises.update(exerciseId, { currentRep });
        });
    });
    
    return card;
}

function createExerciseCard(exercise, number) {
    let repsHtml;
    
    if (exercise.isProgressive) {
        // Genera le opzioni del select da min a max
        let options = '';
        const currentRep = exercise.currentRep || exercise.repsMin;
        for (let i = exercise.repsMin; i <= exercise.repsMax; i++) {
            const selected = i === currentRep ? 'selected' : '';
            options += `<option value="${i}" ${selected}>${i}</option>`;
        }
        
        repsHtml = `
            <span class="sets-label">${exercise.sets} ×</span>
            <div class="reps-select-group">
                <select class="reps-select" data-exercise-id="${exercise.id}">
                    ${options}
                </select>
            </div>
            <span class="sets-label">×</span>
        `;
    } else {
        repsHtml = `
            <button class="sets-reps-btn" data-exercise-id="${exercise.id}" data-field="sets" data-value="${exercise.sets}">
                <span class="value">${exercise.sets}</span>
                <span class="label">serie</span>
            </button>
            <span style="color: white; font-size: 18px;">×</span>
            <button class="sets-reps-btn" data-exercise-id="${exercise.id}" data-field="reps" data-value="${exercise.reps}">
                <span class="value">${exercise.reps}</span>
                <span class="label">reps</span>
            </button>
            <span style="color: white; font-size: 18px;">×</span>
        `;
    }
    
    return `
        <div class="exercise-card" data-exercise-id="${exercise.id}">
            <div class="exercise-header">
                <div class="exercise-number">${number}</div>
                <div class="exercise-info">
                    <div class="exercise-name">${exercise.name}</div>
                </div>
            </div>
            <div class="exercise-details">
                <div class="exercise-details-row">
                    ${repsHtml}
                    <div class="weight-input-group">
                        <input type="number" class="kg-input" data-exercise-id="${exercise.id}" value="${exercise.weight}" step="0.5" min="0">
                        <span class="weight-unit">kg</span>
                    </div>
                </div>
                <div class="rest-info">
                    <span class="rest-icon">⏱️</span>
                    <span class="rest-time">${exercise.rest}s riposo</span>
                </div>
            </div>
        </div>
    `;
}

function switchSession(dayId) {
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', parseInt(btn.dataset.dayId) === dayId);
    });
    
    // Reset animations
    document.querySelectorAll('.session-card').forEach(card => {
        card.classList.remove('active');
        const title = card.querySelector('.session-title');
        const exercises = card.querySelectorAll('.exercise-card');
        const footer = card.querySelector('.session-footer');
        
        if (title) title.classList.remove('animate-in');
        exercises.forEach(ex => ex.classList.remove('animate-in'));
        if (footer) footer.classList.remove('animate-in');
    });
    
    // Activate new session
    const activeSession = document.querySelector(`.session-card[data-day-id="${dayId}"]`);
    if (activeSession) {
        activeSession.classList.add('active');
        
        const title = activeSession.querySelector('.session-title');
        const exercises = activeSession.querySelectorAll('.exercise-card');
        const footer = activeSession.querySelector('.session-footer');
        
        setTimeout(() => {
            if (title) title.classList.add('animate-in');
        }, 50);
        
        exercises.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('animate-in');
            }, 400 + index * 150);
        });
        
        if (footer) {
            setTimeout(() => {
                footer.classList.add('animate-in');
            }, 400 + exercises.length * 150);
        }
    }
    
    // Scroll to top
    document.getElementById('sessions-container').scrollTop = 0;
    
    setTimeout(updateActiveExerciseCard, 50);
}

function triggerInitialAnimation() {
    const activeSession = document.querySelector('.session-card.active');
    if (!activeSession) return;
    
    const title = activeSession.querySelector('.session-title');
    const exercises = activeSession.querySelectorAll('.exercise-card');
    const footer = activeSession.querySelector('.session-footer');
    
    setTimeout(() => {
        if (title) title.classList.add('animate-in');
    }, 50);
    
    exercises.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('animate-in');
        }, 400 + index * 150);
    });
    
    if (footer) {
        setTimeout(() => {
            footer.classList.add('animate-in');
        }, 400 + exercises.length * 150);
    }
}

function updateActiveExerciseCard() {
    const activeSession = document.querySelector('.session-card.active');
    if (!activeSession) return;
    
    const sessionTitle = activeSession.querySelector('.session-title');
    const exerciseCards = activeSession.querySelectorAll('.exercise-card');
    
    if (!sessionTitle || exerciseCards.length === 0) return;
    
    const titleRect = sessionTitle.getBoundingClientRect();
    const titleBottom = titleRect.bottom;
    
    let closestCard = null;
    let minDistance = Infinity;
    
    exerciseCards.forEach(card => {
        const cardRect = card.getBoundingClientRect();
        const cardTop = cardRect.top;
        const distance = Math.abs(cardTop - titleBottom);
        
        if (cardTop >= titleBottom - 80 && distance < minDistance) {
            minDistance = distance;
            closestCard = card;
        }
    });
    
    exerciseCards.forEach(card => {
        card.classList.toggle('exercise-card-active', card === closestCard);
    });
}

// ==================== TIMER ====================
let timerInterval = null;
let timeLeft = 60;
let timerRunning = false;

function startTimer() {
    if (timerRunning) return;
    
    timerRunning = true;
    document.getElementById('timer-start').style.opacity = '0.5';
    
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        
        if (timeLeft <= 0) {
            stopTimer();
            playSound();
            vibrate();
            timeLeft = parseInt(document.getElementById('timer-input').value) || 60;
            updateTimerDisplay();
        }
    }, 1000);
}

function stopTimer() {
    timerRunning = false;
    clearInterval(timerInterval);
    timerInterval = null;
    document.getElementById('timer-start').style.opacity = '1';
}

function resetTimer() {
    stopTimer();
    timeLeft = parseInt(document.getElementById('timer-input').value) || 60;
    updateTimerDisplay();
}

function updateTimerDisplay() {
    const display = document.getElementById('timer-display');
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    display.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    if (timeLeft <= 10 && timerRunning) {
        display.style.color = '#f44336';
    } else {
        display.style.color = '#ff6b35';
    }
}

function playSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
        console.log('Audio non disponibile');
    }
}

function vibrate() {
    if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
    }
}

// ==================== QUICK EDIT MODAL (Serie/Reps) ====================
async function openQuickEditModal(exerciseId, field, currentValue) {
    const fieldLabel = field === 'sets' ? 'Serie' : 'Ripetizioni';
    const newValue = await showInput(fieldLabel, currentValue);
    
    if (newValue === null) return; // Cancelled
    
    if (isNaN(newValue) || newValue < 1) {
        showToast('Inserisci un numero valido');
        return;
    }
    
    // Update database
    await db.exercises.update(exerciseId, { [field]: newValue });
    
    // Update UI in workout app
    const btn = document.querySelector(`.sets-reps-btn[data-exercise-id="${exerciseId}"][data-field="${field}"]`);
    if (btn) {
        btn.dataset.value = newValue;
        btn.querySelector('.value').textContent = newValue;
    }
}

// ==================== IMPORT/EXPORT ====================
async function handleExport() {
    const days = await db.days.orderBy('order').toArray();
    const exercises = await db.exercises.toArray();
    
    if (days.length === 0) {
        showToast('Nessuna scheda da esportare');
        return;
    }
    
    const data = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        days: days,
        exercises: exercises
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `chocofit-${new Date().toISOString().split('T')[0]}.chocofit`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Scheda esportata! 💾');
}

async function handleDeleteAll() {
    const days = await db.days.count();
    
    if (days === 0) {
        showToast('Nessuna scheda da cancellare');
        return;
    }
    
    const confirmed = await showConfirm('Cancellare tutta la scheda? Questa azione non può essere annullata.');
    if (!confirmed) return;
    
    await db.days.clear();
    await db.exercises.clear();
    
    showToast('Scheda cancellata');
    await loadSetupScreen();
}

async function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        if (!data.days || !data.exercises) {
            throw new Error('Formato file non valido');
        }
        
        // Clear existing data
        await db.days.clear();
        await db.exercises.clear();
        
        // Import days and create ID mapping
        const dayIdMap = {};
        for (const day of data.days) {
            const oldId = day.id;
            delete day.id;
            const newId = await db.days.add(day);
            dayIdMap[oldId] = newId;
        }
        
        // Import exercises with updated dayIds
        for (const exercise of data.exercises) {
            delete exercise.id;
            exercise.dayId = dayIdMap[exercise.dayId];
            await db.exercises.add(exercise);
        }
        
        showToast('Scheda importata con successo! 💪');
        
        // Refresh current screen
        const currentScreen = Object.keys(screens).find(key => !screens[key].classList.contains('hidden'));
        if (currentScreen === 'welcome') {
            showScreen('app');
            await loadWorkoutApp();
        } else if (currentScreen === 'setup') {
            await loadSetupScreen();
        } else {
            await loadWorkoutApp();
        }
        
    } catch (error) {
        showToast('Errore: ' + error.message);
    }
    
    event.target.value = '';
}

// Prevent zoom on input focus (iOS)
document.querySelectorAll('input[type="number"], input[type="text"]').forEach(input => {
    input.addEventListener('focus', function() {
        this.style.fontSize = '16px';
    });
});

// ==================== CARDIAC LOAD ====================
const DAYS_OF_WEEK = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

async function getCardiacData() {
    const data = await db.cardiac.get('weekData');
    if (!data) {
        return createEmptyCardiacData();
    }
    
    // Check if we need to reset for a new week
    const currentWeekStart = getWeekStart(new Date());
    if (data.weekStart !== currentWeekStart) {
        return createEmptyCardiacData();
    }
    
    return data;
}

function createEmptyCardiacData() {
    return {
        key: 'weekData',
        weekStart: getWeekStart(new Date()),
        lastWeekAvg: 0,
        targetAvg: 0,
        dailyValues: [null, null, null, null, null, null, null] // Lun-Dom
    };
}

function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().split('T')[0];
}

function getTodayIndex() {
    const day = new Date().getDay();
    return day === 0 ? 6 : day - 1; // Convert Sunday=0 to index 6, Monday=1 to index 0
}

async function saveCardiacData(data) {
    await db.cardiac.put(data);
}

async function loadCardiacSettings() {
    const setting = await db.settings.get('cardiacEnabled');
    const enabled = setting ? setting.value : false;
    document.getElementById('cardiac-toggle').checked = enabled;
    return enabled;
}

async function updateCardiacFabVisibility() {
    const enabled = await loadCardiacSettings();
    const fab = document.getElementById('cardiac-fab');
    
    if (enabled) {
        fab.classList.remove('hidden');
        const cardiacData = await getCardiacData();
        updateFabValue(cardiacData);
    } else {
        fab.classList.add('hidden');
    }
}

function updateFabValue(cardiacData) {
    const todayTarget = calculateTodayTarget(cardiacData);
    document.getElementById('cardiac-fab-value').textContent = 
        todayTarget !== null ? todayTarget.toFixed(1) : '--';
}

function calculateTodayTarget(cardiacData) {
    if (!cardiacData.targetAvg || cardiacData.targetAvg === 0) {
        return null;
    }
    
    const todayIndex = getTodayIndex();
    const weeklyTotal = cardiacData.targetAvg * 7;
    
    // Calculate total done so far (before today)
    let totalDone = 0;
    for (let i = 0; i < todayIndex; i++) {
        if (cardiacData.dailyValues[i] !== null) {
            totalDone += cardiacData.dailyValues[i];
        }
    }
    
    // Days remaining including today
    const daysRemaining = 7 - todayIndex;
    
    // Target for today
    const remaining = weeklyTotal - totalDone;
    const todayTarget = remaining / daysRemaining;
    
    return Math.round(todayTarget * 10) / 10;
}

async function loadCardiacPage() {
    const cardiacData = await getCardiacData();
    
    // Set last week input
    document.getElementById('cardiac-last-week').value = cardiacData.lastWeekAvg || '';
    
    // Generate week grid
    generateWeekGrid(cardiacData);
    
    // Update displays
    updateCardiacDisplay(cardiacData);
}

function generateWeekGrid(cardiacData) {
    const grid = document.getElementById('cardiac-week-grid');
    const todayIndex = getTodayIndex();
    
    grid.innerHTML = DAYS_OF_WEEK.map((day, index) => {
        const value = cardiacData.dailyValues[index];
        const isToday = index === todayIndex;
        const isFuture = index > todayIndex;
        
        return `
            <div class="cardiac-day">
                <span class="cardiac-day-label">${day}</span>
                <input type="number" 
                    class="cardiac-day-input ${isToday ? 'today' : ''}" 
                    data-day-index="${index}"
                    value="${value !== null ? value : ''}"
                    placeholder="-"
                    min="0"
                    step="0.1"
                    ${isFuture ? 'disabled' : ''}>
            </div>
        `;
    }).join('');
    
    // Add event listeners
    grid.querySelectorAll('.cardiac-day-input').forEach(input => {
        input.addEventListener('change', async (e) => {
            const dayIndex = parseInt(e.target.dataset.dayIndex);
            const value = e.target.value ? parseFloat(e.target.value) : null;
            
            const cardiacData = await getCardiacData();
            cardiacData.dailyValues[dayIndex] = value;
            await saveCardiacData(cardiacData);
            updateCardiacDisplay(cardiacData);
        });
    });
}

function updateCardiacDisplay(cardiacData) {
    // Target display
    const targetDisplay = document.getElementById('cardiac-target-display');
    targetDisplay.textContent = cardiacData.targetAvg ? cardiacData.targetAvg.toFixed(1) : '--';
    
    // Today's target
    const todayTarget = calculateTodayTarget(cardiacData);
    document.getElementById('cardiac-today-target').textContent = 
        todayTarget !== null ? todayTarget.toFixed(1) : '--';
    
    // Total done
    const totalDone = cardiacData.dailyValues.reduce((sum, val) => sum + (val || 0), 0);
    document.getElementById('cardiac-total-done').textContent = totalDone.toFixed(1);
    
    // Remaining
    const weeklyTotal = cardiacData.targetAvg * 7;
    const remaining = weeklyTotal - totalDone;
    document.getElementById('cardiac-remaining').textContent = 
        cardiacData.targetAvg ? remaining.toFixed(1) : '--';
    
    // Update FAB
    updateFabValue(cardiacData);
}
