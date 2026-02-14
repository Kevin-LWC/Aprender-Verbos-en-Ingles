// --- CONFIGURACIÓN GITHUB ---
const GITHUB_CONFIG = {
    username: "Kevin-LWC",
    repo: "Aprender-Verbos-en-Ingles",
    folder: "data" 
};

let verbData = [];
let currentIndex = 0;
let score = 0;
let questionStatus = []; 
let currentMode = 1; 
let currentPromptText = "";

// Elementos del DOM
const promptText = document.getElementById('prompt-text');
const promptAudioBtn = document.getElementById('prompt-audio-btn');
const inputs = {
    base: document.getElementById('input-base'),
    past: document.getElementById('input-past'),
    participle: document.getElementById('input-participle'),
    spanish: document.getElementById('input-spanish')
};
const feedbackMessage = document.getElementById('feedback-message');
const navBoxesContainer = document.getElementById('nav-boxes-container');
const resultsModal = document.getElementById('results-modal');
const scoreText = document.getElementById('score-text');
const githubFileSelect = document.getElementById('github-file-select');
const navLinks = document.querySelectorAll('.nav-link');
const loadingIndicator = document.getElementById('loading-indicator');

// --- Inicialización ---
window.addEventListener('DOMContentLoaded', () => {
    loadCategory('verbs'); // Cargar categoría por defecto
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

async function loadCategory(folderName) {
    loadingIndicator.classList.remove('hidden');
    githubFileSelect.innerHTML = '<option>Cargando archivos...</option>';
    githubFileSelect.disabled = true;
    promptText.textContent = "Conectando a GitHub...";

    const apiUrl = `https://api.github.com/repos/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.folder}/${folderName}`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`GitHub API Error: ${response.status}`);
        const files = await response.json();
        const jsonFiles = files.filter(file => file.name.endsWith('.json'));

        if (jsonFiles.length === 0) throw new Error("No se encontraron archivos JSON en esta carpeta.");

        populateFileSelect(jsonFiles);
        loadRemoteJson(jsonFiles[0].download_url); // Cargar el primero

    } catch (error) {
        console.error(error);
        githubFileSelect.innerHTML = '<option>Error al cargar lista</option>';
        promptText.textContent = "Error de conexión 😕";
        feedbackMessage.textContent = `Detalles: ${error.message}. Verifica tu conexión o el límite de la API.`;
        feedbackMessage.className = 'feedback error';
        feedbackMessage.classList.remove('hidden');
    } finally {
        loadingIndicator.classList.add('hidden');
    }
}

function populateFileSelect(files) {
    githubFileSelect.innerHTML = '';
    files.forEach(file => {
        const option = document.createElement('option');
        option.value = file.download_url;
        // Formatear nombre: quitar .json y reemplazar guiones bajos por espacios
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
        promptText.textContent = "Descargando datos...";
        resetUI();
        const response = await fetch(url);
        if (!response.ok) throw new Error("Error al descargar el archivo JSON");
        const data = await response.json();
        initGame(data);
    } catch (error) {
        promptText.textContent = "Error al cargar JSON";
        console.error(error);
    }
}

// --- Carga Manual ---
document.getElementById('jsonUpload').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            initGame(data);
            githubFileSelect.value = "";
            navLinks.forEach(l => l.classList.remove('active')); // Desactivar nav superior si es manual
        } catch (error) {
            alert("Error al leer el archivo JSON. Asegúrate de que el formato sea correcto.");
        }
    };
    reader.readAsText(file);
});

// --- Lógica del Juego ---
function initGame(data) {
    if (!data || data.length === 0) {
         promptText.textContent = "El archivo JSON está vacío.";
         return;
    }
    verbData = data;
    currentIndex = 0;
    score = 0;
    questionStatus = new Array(verbData.length).fill(null);
    resultsModal.classList.add('hidden');
    renderNavBoxes();
    loadQuestion(currentIndex);
}

function loadQuestion(index) {
    const verb = verbData[index];
    if (!verb) return;
    resetUI();
    
    // Modo aleatorio (1: Español -> Inglés, 2: Participio -> Resto)
    currentMode = Math.random() < 0.5 ? 1 : 2;

    if (currentMode === 1) {
        promptText.textContent = capitalize(verb.spanish);
        currentPromptText = ""; 
        promptAudioBtn.classList.add('hidden');

        toggleInputVisibility('base', true);
        toggleInputVisibility('past', true);
        toggleInputVisibility('participle', true);
        toggleInputVisibility('spanish', false);
        setTimeout(() => inputs.base.focus(), 100); // Foco automático
    } else {
        promptText.textContent = capitalize(verb.participle);
        currentPromptText = verb.participle;
        promptAudioBtn.classList.remove('hidden');

        toggleInputVisibility('base', true);
        toggleInputVisibility('past', true);
        toggleInputVisibility('spanish', true);
        toggleInputVisibility('participle', false);
        inputs.participle.value = verb.participle;
        setTimeout(() => inputs.base.focus(), 100); // Foco automático
    }
    updateNavigationState();
}

// --- Audio ---
promptAudioBtn.addEventListener('click', () => {
    if (currentPromptText) playIndividualAudio(currentPromptText);
});

document.querySelectorAll('.audio-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        btn.blur(); // Quitar foco del botón después de click
        const formType = btn.getAttribute('data-form');
        const verb = verbData[currentIndex];
        if (verb && verb[formType]) {
            playIndividualAudio(verb[formType]);
        }
    });
});

function playIndividualAudio(text) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US'; 
    utterance.rate = 0.9; 
    const voices = window.speechSynthesis.getVoices();
    // Intentar usar una voz de Google si está disponible
    const preferredVoice = voices.find(v => v.name.includes("Google US English")) || voices.find(v => v.lang === 'en-US');
    if (preferredVoice) utterance.voice = preferredVoice;
    window.speechSynthesis.speak(utterance);
}

// --- Validación ---
document.getElementById('check-btn').addEventListener('click', checkAnswer);

function checkAnswer() {
    const verb = verbData[currentIndex];
    let isCorrect = true;
    let inputsToCheck = currentMode === 1 ? ['base', 'past', 'participle'] : ['base', 'past', 'spanish'];

    inputsToCheck.forEach(type => {
        const inputElem = inputs[type];
        const userAnswer = inputElem.value.trim().toLowerCase();
        // Asegurar que la data existe antes de lowercase
        const correctAnswer = (verb[type] || "").toLowerCase(); 
        
        if (userAnswer !== correctAnswer || userAnswer === "") {
            isCorrect = false;
            inputElem.style.borderColor = 'var(--accent-red)';
            inputElem.style.backgroundColor = 'rgba(255, 23, 68, 0.1)';
            inputElem.classList.add('shake'); // Añadir efecto de vibración si quieres en CSS
        } else {
            inputElem.style.borderColor = 'var(--accent-green)';
            inputElem.style.backgroundColor = 'rgba(0, 230, 118, 0.1)';
        }
    });

    if (isCorrect) {
        showFeedback("✅ ¡Respuesta Correcta!", "success");
        triggerConfetti();
        if (questionStatus[currentIndex] === null) score++;
        questionStatus[currentIndex] = true;
    } else {
        showFeedback("❌ Revisa los campos en rojo.", "error");
        questionStatus[currentIndex] = false;
    }
    
    renderNavBoxes();
}

function resetUI() {
    feedbackMessage.classList.add('hidden');
    Object.values(inputs).forEach(input => {
        input.value = '';
        input.style.borderColor = 'var(--glass-border)';
        input.style.backgroundColor = 'var(--input-bg)';
    });
}

function toggleInputVisibility(type, show) {
    const group = inputs[type].parentElement;
    show ? group.classList.remove('hidden') : group.classList.add('hidden');
}

function showFeedback(message, type) {
    feedbackMessage.textContent = message;
    feedbackMessage.className = `feedback ${type}`;
}

function capitalize(str) { return str ? str.charAt(0).toUpperCase() + str.slice(1) : ""; }

// --- Navegación ---
function renderNavBoxes() {
    navBoxesContainer.innerHTML = '';
    verbData.forEach((_, index) => {
        const box = document.createElement('div');
        box.classList.add('nav-box');
        // --- CORRECCIÓN AQUÍ: Añadir el número ---
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

prevBtn.addEventListener('click', () => { if(currentIndex > 0) { currentIndex--; loadQuestion(currentIndex); }});
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

// Confetti pequeño para aciertos
function triggerConfetti() { 
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 }, colors: ['#00e676', '#1fddff'] }); 
}
// Confetti grande para el final
function triggerConfettiBig() {
    var end = Date.now() + (2 * 1000);
    (function frame() {
        confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#ff4e50', '#1fddff', '#f9d423'] });
        confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#ff4e50', '#1fddff', '#f9d423'] });
        if (Date.now() < end) requestAnimationFrame(frame);
    }());
}

// Enter key support
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && resultsModal.classList.contains('hidden')) {
        if(e.ctrlKey || e.metaKey) { // Ctrl+Enter para siguiente
             handleNext();
        } else {
             checkAnswer();
        }
    }
});
