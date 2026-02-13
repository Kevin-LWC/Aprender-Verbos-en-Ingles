let verbData = [];
let currentIndex = 0;
let score = 0;
let questionStatus = []; 
let currentMode = 1; 

const promptText = document.getElementById('prompt-text');
const inputsContainer = document.getElementById('inputs-container');
const checkBtn = document.getElementById('check-btn');
const feedbackMessage = document.getElementById('feedback-message');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const navBoxesContainer = document.getElementById('nav-boxes-container');
const jsonUpload = document.getElementById('jsonUpload');
const resultsModal = document.getElementById('results-modal');
const scoreText = document.getElementById('score-text');
const restartBtn = document.getElementById('restart-btn');

const inputs = {
    base: document.getElementById('input-base'),
    past: document.getElementById('input-past'),
    participle: document.getElementById('input-participle'),
    spanish: document.getElementById('input-spanish')
};

// --- Inicialización ---
window.addEventListener('DOMContentLoaded', () => {
    loadGameData('data/verbs/verbs_list.json');
});

jsonUpload.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            initGame(data);
        } catch (error) {
            alert("Error al leer el archivo JSON.");
        }
    };
    reader.readAsText(file);
});

async function loadGameData(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        initGame(data);
    } catch (error) {
        promptText.textContent = "Sube tu JSON para empezar";
    }
}

function initGame(data) {
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
    resetUI();
    
    currentMode = Math.random() < 0.5 ? 1 : 2;

    if (currentMode === 1) {
        promptText.textContent = `${capitalize(verb.spanish)}`;
        toggleInputVisibility('base', true);
        toggleInputVisibility('past', true);
        toggleInputVisibility('participle', true);
        toggleInputVisibility('spanish', false);
    } else {
        promptText.textContent = `${capitalize(verb.participle)}`;
        toggleInputVisibility('base', true);
        toggleInputVisibility('past', true);
        toggleInputVisibility('spanish', true);
        toggleInputVisibility('participle', false);
        inputs.participle.value = verb.participle;
    }
    updateNavigationState();
}

function checkAnswer() {
    const verb = verbData[currentIndex];
    let isCorrect = true;
    let inputsToCheck = currentMode === 1 ? ['base', 'past', 'participle'] : ['base', 'past', 'spanish'];

    inputsToCheck.forEach(type => {
        const userAnswer = inputs[type].value.trim().toLowerCase();
        const correctAnswer = verb[type].toLowerCase();
        
        if (userAnswer !== correctAnswer) {
            isCorrect = false;
            inputs[type].style.borderColor = 'var(--error-color)';
        } else {
            inputs[type].style.borderColor = 'var(--success-color)';
        }
    });

    if (isCorrect) {
        showFeedback("¡Excelente!", "success");
        triggerConfetti();
        if (questionStatus[currentIndex] === null) score++;
        questionStatus[currentIndex] = true;
    } else {
        showFeedback("Revisa los campos en rojo.", "error");
        questionStatus[currentIndex] = false;
    }
    
    renderNavBoxes();
    updateNavigationState();
}

function resetUI() {
    feedbackMessage.classList.add('hidden');
    Object.values(inputs).forEach(input => {
        input.value = '';
        input.style.borderColor = '#444';
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

function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

// --- Audio Individual (TTS) ---
// Agregamos Event Listeners a los 3 botones de audio
document.querySelectorAll('.audio-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault(); // Evita comportamientos indeseados
        const formType = btn.getAttribute('data-form'); // 'base', 'past' o 'participle'
        const verb = verbData[currentIndex];
        
        if (verb && verb[formType]) {
            playIndividualAudio(verb[formType]);
        }
    });
});

function playIndividualAudio(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US'; 
    utterance.rate = 0.85; 

    const voices = speechSynthesis.getVoices();
    const englishVoice = voices.find(voice => voice.lang.includes('en-US') && voice.name.includes('Google'));
    if (englishVoice) {
        utterance.voice = englishVoice;
    }
    speechSynthesis.speak(utterance);
}

// Para asegurarnos de que las voces carguen correctamente en algunos navegadores
speechSynthesis.onvoiceschanged = () => { speechSynthesis.getVoices(); };

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

function updateNavigationState() {
    prevBtn.disabled = currentIndex === 0;
    nextBtn.textContent = (currentIndex === verbData.length - 1) ? "Finalizar" : "Siguiente →";
}

function handleNext() {
    if (currentIndex < verbData.length - 1) {
        currentIndex++;
        loadQuestion(currentIndex);
    } else {
        showResults();
    }
}

function showResults() {
    const percentage = Math.round((score / verbData.length) * 100);
    scoreText.textContent = `Puntuación: ${score} de ${verbData.length} (${percentage}%)`;
    resultsModal.classList.remove('hidden');
    triggerConfetti();
}

function triggerConfetti() { confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } }); }

checkBtn.addEventListener('click', checkAnswer);
prevBtn.addEventListener('click', () => { if (currentIndex > 0) { currentIndex--; loadQuestion(currentIndex); } });
nextBtn.addEventListener('click', handleNext);
restartBtn.addEventListener('click', () => { initGame(verbData); });

document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && resultsModal.classList.contains('hidden')) {
        checkAnswer();
    }
});