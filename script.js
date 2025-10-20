// Elementi DOM
const navBtns = document.querySelectorAll(".nav-btn");
const sessionCards = document.querySelectorAll(".session-card");
const timerDisplay = document.querySelector(".timer-display");
const timerInput = document.querySelector(".timer-input");
const startBtn = document.querySelector(".timer-btn.start");
const stopBtn = document.querySelector(".timer-btn.stop");
const resetBtn = document.querySelector(".timer-btn.reset");
const kgInputs = document.querySelectorAll(".kg-input");
const repsSelects = document.querySelectorAll(".reps-select");

// Variabili Timer
let timerInterval = null;
let timeLeft = 60;
let isRunning = false;

// Inizializzazione
document.addEventListener("DOMContentLoaded", () => {
  loadWeights();
  loadReps();
  updateTimerDisplay();
  setupEventListeners();
  updateActiveExerciseCard(); // Imposta la card attiva inizialmente

  // Trigger animazioni iniziali per la sessione attiva (Lunedì)
  setTimeout(() => {
    triggerInitialAnimation();
  }, 100);
});

// Trigger animazioni per la prima sessione al caricamento
function triggerInitialAnimation() {
  const activeSession = document.querySelector(".session-card.active");
  if (!activeSession) return;

  const title = activeSession.querySelector(".session-title");
  const exercises = activeSession.querySelectorAll(".exercise-card");
  const footer = activeSession.querySelector(".session-footer");

  // Anima title per primo
  setTimeout(() => {
    if (title) title.classList.add("animate-in");
  }, 50);

  // Anima cards con stagger effect
  exercises.forEach((card, index) => {
    setTimeout(() => {
      card.classList.add("animate-in");
    }, 400 + index * 150); // 400ms base + 150ms per card
  });

  // Anima footer per ultimo
  if (footer) {
    setTimeout(() => {
      footer.classList.add("animate-in");
    }, 400 + exercises.length * 150);
  }
}

// Setup Event Listeners
function setupEventListeners() {
  // Navigazione sessioni
  navBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const session = btn.dataset.session;
      switchSession(session);
    });
  });

  // Timer controls
  startBtn.addEventListener("click", startTimer);
  stopBtn.addEventListener("click", stopTimer);
  resetBtn.addEventListener("click", resetTimer);

  // Timer input change
  timerInput.addEventListener("change", () => {
    if (!isRunning) {
      timeLeft = parseInt(timerInput.value) || 60;
      updateTimerDisplay();
    }
  });

  // Salva pesi quando cambiano
  kgInputs.forEach((input) => {
    input.addEventListener("change", () => {
      saveWeights();
    });
  });

  // Salva ripetizioni quando cambiano
  repsSelects.forEach((select) => {
    select.addEventListener("change", () => {
      saveReps();
    });
  });

  // Scroll listener per aggiornare la card attiva
  const sessionsContainer = document.querySelector(".sessions-container");
  sessionsContainer.addEventListener("scroll", updateActiveExerciseCard);
}

// Cambio Sessione
function switchSession(session) {
  // Aggiorna bottoni nav
  navBtns.forEach((btn) => {
    btn.classList.remove("active");
    if (btn.dataset.session === session) {
      btn.classList.add("active");
    }
  });

  // Rimuovi animazioni dalle vecchie sessioni
  sessionCards.forEach((card) => {
    card.classList.remove("active");
    const title = card.querySelector(".session-title");
    const exercises = card.querySelectorAll(".exercise-card");
    const footer = card.querySelector(".session-footer");

    if (title) title.classList.remove("animate-in");
    exercises.forEach((ex) => ex.classList.remove("animate-in"));
    if (footer) footer.classList.remove("animate-in");
  });

  // Attiva la nuova sessione
  const activeSession = document.querySelector(
    `.session-card[data-session="${session}"]`
  );
  if (activeSession) {
    activeSession.classList.add("active");

    // Trigger animazioni con stagger
    const title = activeSession.querySelector(".session-title");
    const exercises = activeSession.querySelectorAll(".exercise-card");
    const footer = activeSession.querySelector(".session-footer");

    // Anima title per primo (parte subito)
    setTimeout(() => {
      if (title) title.classList.add("animate-in");
    }, 50);

    // Anima cards con stagger effect (partono dopo il title)
    exercises.forEach((card, index) => {
      setTimeout(() => {
        card.classList.add("animate-in");
      }, 400 + index * 150); // 400ms base + 150ms per card
    });

    // Anima footer per ultimo
    if (footer) {
      setTimeout(() => {
        footer.classList.add("animate-in");
      }, 400 + exercises.length * 150);
    }
  }

  // Scrolla all'inizio
  const sessionsContainer = document.querySelector(".sessions-container");
  sessionsContainer.scrollTop = 0;

  // Aggiorna la card attiva per la nuova sessione
  setTimeout(updateActiveExerciseCard, 50);
}

// Timer Functions
function startTimer() {
  if (isRunning) return;

  isRunning = true;
  startBtn.style.opacity = "0.5";

  timerInterval = setInterval(() => {
    timeLeft--;
    updateTimerDisplay();

    if (timeLeft <= 0) {
      stopTimer();
      playSound();
      vibrate();
      timeLeft = parseInt(timerInput.value) || 60;
      updateTimerDisplay();
    }
  }, 1000);
}

function stopTimer() {
  isRunning = false;
  clearInterval(timerInterval);
  timerInterval = null;
  startBtn.style.opacity = "1";
}

function resetTimer() {
  stopTimer();
  timeLeft = parseInt(timerInput.value) || 60;
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  timerDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;

  // Cambia colore quando sta per finire
  if (timeLeft <= 10 && isRunning) {
    timerDisplay.style.color = "#f44336";
  } else {
    timerDisplay.style.color = "#ff6b35";
  }
}

// Notifiche
function playSound() {
  // Crea un beep usando Web Audio API
  try {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.5
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    console.log("Audio non disponibile");
  }
}

function vibrate() {
  // Vibrazione su dispositivi mobili
  if ("vibrate" in navigator) {
    navigator.vibrate([200, 100, 200]);
  }
}

// LocalStorage per i pesi
function saveWeights() {
  const weights = {};
  kgInputs.forEach((input) => {
    const exerciseId = input.dataset.exercise;
    const value = input.value;
    if (exerciseId && value) {
      weights[exerciseId] = value;
    }
  });
  localStorage.setItem("gymWeights", JSON.stringify(weights));
}

function loadWeights() {
  const saved = localStorage.getItem("gymWeights");
  if (saved) {
    try {
      const weights = JSON.parse(saved);
      kgInputs.forEach((input) => {
        const exerciseId = input.dataset.exercise;
        if (exerciseId && weights[exerciseId]) {
          input.value = weights[exerciseId];
        }
      });
    } catch (e) {
      console.log("Errore nel caricamento dei pesi");
    }
  }
}

// LocalStorage per le ripetizioni
function saveReps() {
  const reps = {};
  repsSelects.forEach((select) => {
    const exerciseId = select.dataset.exercise;
    const value = select.value;
    if (exerciseId && value) {
      reps[exerciseId] = value;
    }
  });
  localStorage.setItem("gymReps", JSON.stringify(reps));
}

function loadReps() {
  const saved = localStorage.getItem("gymReps");
  if (saved) {
    try {
      const reps = JSON.parse(saved);
      repsSelects.forEach((select) => {
        const exerciseId = select.dataset.exercise;
        if (exerciseId && reps[exerciseId]) {
          select.value = reps[exerciseId];
        }
      });
    } catch (e) {
      console.log("Errore nel caricamento delle ripetizioni");
    }
  }
}

// Aggiorna dinamicamente quale exercise card ha l'effetto blur scuro
function updateActiveExerciseCard() {
  // Trova la sessione attiva
  const activeSession = document.querySelector(".session-card.active");
  if (!activeSession) return;

  // Trova il session title e tutte le exercise cards della sessione attiva
  const sessionTitle = activeSession.querySelector(".session-title");
  const exerciseCards = activeSession.querySelectorAll(".exercise-card");

  if (!sessionTitle || exerciseCards.length === 0) return;

  // Ottieni la posizione del session title (che è sticky)
  const titleRect = sessionTitle.getBoundingClientRect();
  const titleBottom = titleRect.bottom;

  // Trova la card più vicina alla posizione sotto il title
  let closestCard = null;
  let minDistance = Infinity;

  exerciseCards.forEach((card) => {
    const cardRect = card.getBoundingClientRect();
    const cardTop = cardRect.top;

    // Distanza tra il bottom del title e il top della card
    const distance = Math.abs(cardTop - titleBottom);

    // Se la card è visibile sotto il title
    if (cardTop >= titleBottom - 80 && distance < minDistance) {
      minDistance = distance;
      closestCard = card;
    }
  });

  // Applica la classe active solo alla card più vicina
  exerciseCards.forEach((card) => {
    if (card === closestCard) {
      card.classList.add("exercise-card-active");
    } else {
      card.classList.remove("exercise-card-active");
    }
  });
}

// Previeni zoom su input focus (iOS)
document.querySelectorAll('input[type="number"]').forEach((input) => {
  input.addEventListener("focus", function () {
    this.style.fontSize = "16px";
  });
});
