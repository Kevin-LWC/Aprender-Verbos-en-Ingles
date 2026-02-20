// --- CONFIGURACIÓN GITHUB ---
const GITHUB_CONFIG = {
    username: "Kevin-LWC",
    repo: "Aprender-Verbos-en-Ingles",
    folder: "data" 
};

let verbData = [];
let currentIndex = 0;
let score = 0;
let questionStatus = []; // true (correcto), false (incorrecto), null (sin responder)
let userAnswers = [];    // Almacena lo que escribió el usuario {base: "...", past: "..."}
let currentMode = 1;     // 1: Mostrar Español, 2: Mostrar Inglés
let currentPromptText = "";
let isPhrasalVerbMode = false; // Bandera para saber tipo de juego
let isConnectorMode = false; // Bandera para conectores
let isTop3000Mode = false; // Bandera para Top 3000

// Elementos del DOM
const promptText = document.getElementById('prompt-text');
const promptAudioBtn = document.getElementById('prompt-audio-btn');
const labelBase = document.getElementById('label-base');
const inputs = {
    base: document.getElementById('input-base'),
    past: document.getElementById('input-past'),
    participle: document.getElementById('input-participle'),
    sform: document.getElementById('input-sform'),
    ing: document.getElementById('input-ing'),
    spanish: document.getElementById('input-spanish')
};
// Elementos de corrección
const corrections = {
    base: document.getElementById('correct-base'),
    past: document.getElementById('correct-past'),
    participle: document.getElementById('correct-participle'),
    sform: document.getElementById('correct-sform'),
    ing: document.getElementById('correct-ing'),
    spanish: document.getElementById('correct-spanish')
};

const feedbackMessage = document.getElementById('feedback-message');
const navBoxesContainer = document.getElementById('nav-boxes-container');
const resultsModal = document.getElementById('results-modal');
const scoreText = document.getElementById('score-text');
const githubFileSelect = document.getElementById('github-file-select');
const navLinks = document.querySelectorAll('.nav-link');
const hamburgerBtn = document.getElementById('hamburger-btn');
const mobileMenu = document.getElementById('mobile-menu');
const loadingIndicator = document.getElementById('loading-indicator');
const checkBtn = document.getElementById('check-btn');

// --- Inicialización ---
window.addEventListener('DOMContentLoaded', () => {
    loadCategory('verbs'); 
});

// --- Lógica de GitHub ---
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        loadCategory(link.getAttribute('data-folder'));
    });
});

// Mobile menu handling (toggle and link clicks)
if (hamburgerBtn && mobileMenu) {
    hamburgerBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });

    // Delegate click events to mobile menu links
    mobileMenu.querySelectorAll('.nav-link').forEach(mlink => {
        mlink.addEventListener('click', (e) => {
            e.preventDefault();
            // Close mobile menu
            mobileMenu.classList.add('hidden');
            // Remove active from desktop links and set correct active
            document.querySelectorAll('.top-nav .nav-link').forEach(dl => dl.classList.remove('active'));
            // Also mark desktop link with same data-folder active if exists
            const folder = mlink.getAttribute('data-folder');
            const matching = document.querySelector(`.top-nav .nav-link[data-folder="${folder}"]`);
            if (matching) matching.classList.add('active');
            loadCategory(folder);
        });
    });
}

async function loadCategory(folderName) {
    loadingIndicator.classList.remove('hidden');
    githubFileSelect.innerHTML = '<option>Cargando archivos...</option>';
    githubFileSelect.disabled = true;
    promptText.textContent = "Conectando...";

    const apiUrl = `https://api.github.com/repos/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.folder}/${folderName}`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`GitHub API Error: ${response.status}`);
        const files = await response.json();
        const jsonFiles = files.filter(file => file.name.endsWith('.json'));

        if (jsonFiles.length === 0) throw new Error("No hay JSON aquí.");

        populateFileSelect(jsonFiles);
        loadRemoteJson(jsonFiles[0].download_url);

    } catch (error) {
        console.error(error);
        githubFileSelect.innerHTML = '<option>Error</option>';
        promptText.textContent = "Error de conexión 😕";
    } finally {
        loadingIndicator.classList.add('hidden');
    }
}

function populateFileSelect(files) {
    githubFileSelect.innerHTML = '';
    files.forEach(file => {
        const option = document.createElement('option');
        option.value = file.download_url;
        option.textContent = file.name.replace('.json', '').replace(/_/g, ' ').toUpperCase(); 
        githubFileSelect.appendChild(option);
    });
    githubFileSelect.disabled = false;
}

githubFileSelect.addEventListener('change', (e) => {
    if (e.target.value) loadRemoteJson(e.target.value);
});

async function loadRemoteJson(url) {
    try {
        promptText.textContent = "Cargando...";
        resetUI();
        const response = await fetch(url);
        if (!response.ok) throw new Error("Error de descarga");
        const data = await response.json();
        initGame(data);
    } catch (error) {
        promptText.textContent = "Error JSON";
        console.error(error);
    }
}

document.getElementById('jsonUpload').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            initGame(data);
            githubFileSelect.value = "";
        } catch (error) {
            alert("JSON inválido");
        }
    };
    reader.readAsText(file);
});

// --- Lógica del Juego ---
function initGame(data) {
    if (!data) return;

    // Algunos JSON de conectores vienen envueltos en { "connectors": [ ... ] }
    let dataArray = data;
    if (data && data.connectors && Array.isArray(data.connectors)) dataArray = data.connectors;
    if (!Array.isArray(dataArray) || dataArray.length === 0) return;

    verbData = dataArray;
    
    // Reset all modes
    isPhrasalVerbMode = false;
    isConnectorMode = false;
    isTop3000Mode = false;

    // Detect mode based on data structure
    if (verbData[0].hasOwnProperty('verb') && !verbData[0].hasOwnProperty('base')) {
        isPhrasalVerbMode = true;
    } else if (verbData[0].hasOwnProperty('connector') && verbData[0].hasOwnProperty('meaning_es')) {
        isConnectorMode = true;
    } else if (verbData[0].hasOwnProperty('word') && verbData[0].hasOwnProperty('translation')) {
        isTop3000Mode = true;
    }

    currentIndex = 0;
    score = 0;
    questionStatus = new Array(verbData.length).fill(null);
    userAnswers = new Array(verbData.length).fill(null); // Reiniciar historial
    
    resultsModal.classList.add('hidden');
    renderNavBoxes();
    loadQuestion(currentIndex);
}

function loadQuestion(index) {
    const item = verbData[index];
    if (!item) return;

    // Limpiar UI visualmente (bordes, colores)
    resetUI();

    // 1. Configurar layout según modo (Verbo vs Phrasal)
    configureLayout(item);

    // 2. Determinar dirección de pregunta (Español->Ingles o Viceversa)
    // Si ya respondimos, mantenemos el modo guardado, sino aleatorio
    let savedState = userAnswers[index];
    
    if (savedState) {
        currentMode = savedState.mode;
    } else {
        currentMode = Math.random() < 0.5 ? 1 : 2; 
    }

    // 3. Mostrar Prompt
    setupPrompt(item, currentMode);

    // 4. Restaurar respuestas si existen (Historial)
    if (savedState) {
        // Rellenar inputs con lo que escribió el usuario
        if (inputs.base) inputs.base.value = savedState.base || "";
        if (inputs.past) inputs.past.value = savedState.past || "";
        if (inputs.participle) inputs.participle.value = savedState.participle || "";
        if (inputs.sform) inputs.sform.value = savedState.sform || "";
        if (inputs.ing) inputs.ing.value = savedState.ing || "";
        if (inputs.spanish) inputs.spanish.value = savedState.spanish || "";

        // Si ya fue respondida, ejecutar validación visual inmediatamente para mostrar correcciones
        validateVisuals(item, savedState);
        checkBtn.disabled = true; // No dejar cambiar si ya respondió
    } else {
        // Pregunta nueva
        checkBtn.disabled = false;
        // Auto-foco
        setTimeout(() => {
             // Enfocar el primer input visible
             if (!inputs.base.parentElement.classList.contains('hidden')) inputs.base.focus();
             else if (!inputs.participle.parentElement.classList.contains('hidden')) inputs.participle.focus();
             else inputs.spanish.focus();
        }, 100);
    }

    updateNavigationState();
}

function configureLayout(item) {
    // Ocultar correcciones previas
    Object.values(corrections).forEach(el => el.classList.add('hidden'));

    if (isPhrasalVerbMode) {
        labelBase.textContent = "Phrasal Verb";
        toggleInputVisibility('base', true);
        toggleInputVisibility('past', false);
        toggleInputVisibility('participle', false);
        toggleInputVisibility('sform', false);
        toggleInputVisibility('ing', false);
        toggleInputVisibility('spanish', true);
        document.querySelector('.audio-btn[data-form="base"]').setAttribute('data-key', 'verb');
    } else if (isConnectorMode) {
        labelBase.textContent = "Connector";
        toggleInputVisibility('base', true);
        toggleInputVisibility('past', false);
        toggleInputVisibility('participle', false);
        toggleInputVisibility('sform', false);
        toggleInputVisibility('ing', false);
        toggleInputVisibility('spanish', true);
        const baseAudioBtn = document.querySelector('.audio-btn[data-form="base"]');
        if (baseAudioBtn) baseAudioBtn.setAttribute('data-key', 'connector');
        const spanishAudioBtn = document.querySelector('.audio-btn[data-form="spanish"]');
        if (spanishAudioBtn) spanishAudioBtn.setAttribute('data-key', 'meaning_es');
    } else if (isTop3000Mode) {
        labelBase.textContent = "Word";
        toggleInputVisibility('base', true);
        toggleInputVisibility('past', false);
        toggleInputVisibility('participle', false);
        toggleInputVisibility('sform', false);
        toggleInputVisibility('ing', false);
        toggleInputVisibility('spanish', true);
        document.querySelector('.audio-btn[data-form="base"]').setAttribute('data-key', 'word');
    } else {
        // MODO VERBO REGULAR
        labelBase.textContent = "Base Form";
        toggleInputVisibility('base', true);
        toggleInputVisibility('past', true);
        toggleInputVisibility('participle', true);
        toggleInputVisibility('sform', true);
        toggleInputVisibility('ing', true);
        toggleInputVisibility('spanish', true);
        document.querySelector('.audio-btn[data-form="base"]').setAttribute('data-key', 'base');
    }
}

function setupPrompt(item, mode) {
    // Definir qué palabra se muestra arriba
    let promptWord = "";

    if (isConnectorMode) {
        if (mode === 1) { // Muestra español, pregunta conector
            promptWord = item.meaning_es;
            currentPromptText = "";
            promptAudioBtn.classList.add('hidden');
            toggleInputVisibility('spanish', false);
            toggleInputVisibility('base', true);
        } else { // Muestra conector, pregunta español
            promptWord = item.connector;
            currentPromptText = item.connector;
            promptAudioBtn.classList.remove('hidden');
            toggleInputVisibility('base', false);
            toggleInputVisibility('spanish', true);
        }
        promptText.textContent = capitalize(promptWord);
        return;
    }

    if (isTop3000Mode) {
        if (mode === 1) { // Muestra 'translation', pregunta 'word'
            promptWord = item.translation;
            currentPromptText = ""; // No audio for Spanish prompt
            promptAudioBtn.classList.add('hidden');
            toggleInputVisibility('spanish', false);
            toggleInputVisibility('base', true);
        } else { // Muestra 'word', pregunta 'translation'
            promptWord = item.word;
            currentPromptText = item.word;
            promptAudioBtn.classList.remove('hidden');
            toggleInputVisibility('base', false);
            toggleInputVisibility('spanish', true);
        }
        promptText.textContent = capitalize(promptWord);
        return;
    }

    // Modo 1: Español -> Inglés (verbos)
    if (mode === 1) {
        promptWord = item.spanish;
        currentPromptText = ""; // No audio para español arriba
        promptAudioBtn.classList.add('hidden');
        toggleInputVisibility('spanish', false); // Ocultar input español pues es la pregunta
    } 
    // Modo 2: Inglés -> Resto
    else {
        if (isPhrasalVerbMode) {
            promptWord = item.verb;
            currentPromptText = item.verb;
            toggleInputVisibility('base', false); // Ocultar input phrasal
        } else {
            promptWord = item.participle; // Preguntar por participio
            currentPromptText = item.participle;
            toggleInputVisibility('participle', false);
        }
        promptAudioBtn.classList.remove('hidden');
    }

    promptText.textContent = capitalize(promptWord);
}

// --- Validación ---
checkBtn.addEventListener('click', checkAnswer);

function checkAnswer() {
    if (checkBtn.disabled) return; // Evitar doble check

    const item = verbData[currentIndex];
    
    // Recolectar respuestas del usuario
    const currentAnswers = {
        mode: currentMode,
        base: inputs.base.value,
        past: inputs.past.value,
        participle: inputs.participle.value,
        sform: inputs.sform.value,
        ing: inputs.ing.value,
        spanish: inputs.spanish.value
    };

    // Guardar en historial
    userAnswers[currentIndex] = currentAnswers;

    // Ejecutar validación visual y lógica
    const isCorrect = validateVisuals(item, currentAnswers);

    if (isTop3000Mode) {
        const wordInput = inputs.base;
        const translationInput = inputs.spanish;

        toggleInputVisibility('base', true);
        toggleInputVisibility('spanish', true);

        wordInput.disabled = true;
        translationInput.disabled = true;

        if (currentAnswers.mode === 1) { // Prompt was translation
            translationInput.value = item.translation;
        } else { // Prompt was word
            wordInput.value = item.word;
        }

        if (!isCorrect) {
            if (currentAnswers.mode === 1) {
                wordInput.value = item.word;
            } else {
                translationInput.value = item.translation;
            }
        }
    }

    if (isCorrect) {
        showFeedback("✅ ¡Correcto!", "success");
        triggerConfetti();
        score++;
        questionStatus[currentIndex] = true;
    } else {
        showFeedback("❌ Revisa las correcciones.", "error");
        questionStatus[currentIndex] = false;
    }
    
    checkBtn.disabled = true; // Bloquear botón tras responder
    renderNavBoxes();
}

/**
 * Compara respuestas con datos reales y actualiza UI (colores y textos de corrección).
 * Retorna true si todo es correcto.
 */
function validateVisuals(item, answers) {
    let allCorrect = true;
    
    let fieldsToCheck = [];

    if (isPhrasalVerbMode) {
        if (answers.mode === 1) fieldsToCheck = ['base']; 
        else fieldsToCheck = ['spanish'];
    } else if (isConnectorMode) {
        if (answers.mode === 1) fieldsToCheck = ['base'];
        else fieldsToCheck = ['spanish'];
    } else if (isTop3000Mode) {
        if (answers.mode === 1) fieldsToCheck = ['base']; // prompt was translation, check word (in base)
        else fieldsToCheck = ['spanish']; // prompt was word, check translation (in spanish)
    } else {
        // Verbos
        if (answers.mode === 1) fieldsToCheck = ['base', 'past', 'participle', 'sform', 'ing'];
        else fieldsToCheck = ['base', 'past', 'spanish', 'sform', 'ing'];
    }

    fieldsToCheck.forEach(field => {
        const inputElem = inputs[field];
        const correctElem = corrections[field];
        
        const userVal = (answers[field] || "").trim().toLowerCase();
        
        let correctValKey;
        if (isConnectorMode) {
            correctValKey = (field === 'base') ? 'connector' : 'meaning_es';
        } else if (isTop3000Mode) {
            correctValKey = (field === 'base') ? 'word' : 'translation';
        } else if (isPhrasalVerbMode && field === 'base') {
            correctValKey = 'verb';
        } else if (field === 'sform') {
            correctValKey = 'S-ES-IES';
        } else if (field === 'ing') {
            correctValKey = 'ing-form';
        } else {
            correctValKey = field;
        }

        const correctVal = (item[correctValKey] || "").toLowerCase();

        // Limpiar estado previo
        correctElem.classList.add('hidden');
        inputElem.classList.remove('shake');

        if (userVal !== correctVal) {
            allCorrect = false;
            inputElem.style.borderColor = 'var(--accent-red)';
            inputElem.style.backgroundColor = 'rgba(255, 23, 68, 0.1)';
            
            // MOSTRAR CORRECCIÓN
            let correctionHTML = `Correcto: <strong>${correctVal}</strong>`;
            if (isConnectorMode || isTop3000Mode) {
                const ex = item.example_en || item.example || '';
                const exEs = item.example_es || '';
                correctionHTML += `<br>Ejemplo: ${ex}<br>${exEs}`;
            }
            correctElem.innerHTML = correctionHTML;
            correctElem.classList.remove('hidden');
        } else {
            inputElem.style.borderColor = 'var(--accent-green)';
            inputElem.style.backgroundColor = 'rgba(0, 230, 118, 0.1)';
            
            if (isConnectorMode || isTop3000Mode) {
                const ex = item.example_en || item.example || '';
                const exEs = item.example_es || '';
                correctElem.innerHTML = `Ejemplo: ${ex}<br>${exEs}`;
                correctElem.classList.remove('hidden');
            }
        }
    });

    return allCorrect;
}

// --- Audio System ---
promptAudioBtn.addEventListener('click', () => {
    if (currentPromptText) playIndividualAudio(currentPromptText);
});

document.querySelectorAll('.audio-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        btn.blur();
        // Obtener la key correcta (base, past, participle O verb)
        let key = btn.getAttribute('data-key') || btn.getAttribute('data-form');
        // Parche rápido: si estamos en modo phrasal y piden 'base', es 'verb'
        if (isPhrasalVerbMode && key === 'base') key = 'verb';

        // Mapear keys de UI a claves reales del JSON
        if (key === 'sform') key = 'S-ES-IES';
        if (key === 'ing') key = 'ing-form';

        const item = verbData[currentIndex];
        if (item && item[key]) {
            const lang = (key === 'meaning_es') ? 'es-ES' : 'en-US';
            playIndividualAudio(item[key], lang);
        }
    });
});

function playIndividualAudio(text, lang = 'en-US') {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang; 
    utterance.rate = 0.9; 
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang === lang) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;
    window.speechSynthesis.speak(utterance);
}

// --- UI Helpers ---
function resetUI() {
    feedbackMessage.classList.add('hidden');
    Object.values(inputs).forEach(input => {
        input.value = '';
        input.style.borderColor = 'var(--glass-border)';
        input.style.backgroundColor = 'var(--input-bg)';
    });
    Object.values(corrections).forEach(c => c.classList.add('hidden'));
}

function toggleInputVisibility(type, show) {
    const group = inputs[type].parentElement;
    if (show) group.classList.remove('hidden');
    else group.classList.add('hidden');
}

function showFeedback(message, type) {
    feedbackMessage.textContent = message;
    feedbackMessage.className = `feedback ${type}`;
    feedbackMessage.classList.remove('hidden');
}

function capitalize(str) { return str ? str.charAt(0).toUpperCase() + str.slice(1) : ""; }

// --- Navegación ---
function renderNavBoxes() {
    navBoxesContainer.innerHTML = '';
    verbData.forEach((_, index) => {
        const box = document.createElement('div');
        box.classList.add('nav-box');
        box.textContent = index + 1; 
        
        if (index === currentIndex) box.classList.add('active');
        if (questionStatus[index] === true) box.classList.add('correct');
        if (questionStatus[index] === false) box.classList.add('incorrect');
        
        box.addEventListener('click', () => {
            currentIndex = index;
            loadQuestion(currentIndex);
        });
        navBoxesContainer.appendChild(box);
    });
}

const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');

function updateNavigationState() {
    prevBtn.disabled = currentIndex === 0;
    nextBtn.textContent = (currentIndex === verbData.length - 1) ? "Ver Resultados ✨" : "Siguiente →";
}

prevBtn.addEventListener('click', () => { 
    if(currentIndex > 0) { 
        currentIndex--; 
        loadQuestion(currentIndex); 
    }
});

nextBtn.addEventListener('click', handleNext);

function handleNext() {
    if (currentIndex < verbData.length - 1) {
        currentIndex++;
        loadQuestion(currentIndex);
    } else {
        showResults();
    }
}

function showResults() {
    const percentage = Math.round((score / verbData.length) * 100) || 0;
    scoreText.innerHTML = `Puntuación final:<br><strong style="font-size: 3rem; color: var(--accent-green)">${percentage}%</strong><br>(${score} de ${verbData.length} correctas)`;
    resultsModal.classList.remove('hidden');
    triggerConfettiBig();
}

document.getElementById('restart-btn').addEventListener('click', () => { initGame(verbData); });

// Confetti
function triggerConfetti() { 
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 }, colors: ['#00e676', '#1fddff'] }); 
}
function triggerConfettiBig() {
    var end = Date.now() + (2 * 1000);
    (function frame() {
        confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#ff4e50', '#1fddff', '#f9d423'] });
        confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#ff4e50', '#1fddff', '#f9d423'] });
        if (Date.now() < end) requestAnimationFrame(frame);
    }());
}

// Teclado
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && resultsModal.classList.contains('hidden')) {
        if(e.ctrlKey || e.metaKey) handleNext();
        else checkAnswer();
    }
});
