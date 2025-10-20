// --- КОНФИГУРАЦИЯ ---
const firebaseConfig = {
  apiKey: "AIzaSyD6BqKPRowLjYemh6myfED1-O3wNjExk7s",
  authDomain: "yourchoice-ttfotg.firebaseapp.com",
  databaseURL: "https://yourchoice-ttfotg-default-rtdb.firebaseio.com",
  projectId: "yourchoice-ttfotg",
  storageBucket: "yourchoice-ttfotg.firebasestorage.app",
  messagingSenderId: "621138787927",
  appId: "1:621138787927:web:5dff911d3066676b012d12",
  measurementId: "G-MPNNXC903V"
};

// --- ЛОГИКА ПРИЛОЖЕНИЯ ---
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Получаем все HTML элементы
const nameModalOverlay = document.getElementById('name-modal-overlay');
const nameInput = document.getElementById('name-input');
const saveNameButton = document.getElementById('save-name-button');
const menuToggle = document.getElementById('menu-toggle');
const sideMenu = document.getElementById('side-menu');
const questionList = document.getElementById('question-list');
const mainContent = document.getElementById('main-content');
const questionTitle = document.getElementById('question-title');
const splitScreen = document.getElementById('split-screen');
const optionA = document.getElementById('optionA');
const optionB = document.getElementById('optionB');
const imgA = document.getElementById('imgA');
const imgB = document.getElementById('imgB');
const labelA = document.getElementById('labelA');
const labelB = document.getElementById('labelB');
const percentA = document.getElementById('percentA');
const percentB = document.getElementById('percentB');
const countA = document.getElementById('countA');
const countB = document.getElementById('countB');
const totalVotesCounter = document.getElementById('total-votes-counter');

let questions = [];
let questionOrder = [];
let currentQuestionIndex = 0;
let allVotes = {};
const ANSWERED_QUESTIONS_KEY = 'answeredQuestions';
let userId;

// --- НОВОЕ: Переменная-флаг для блокировки голосования ---
let isVotingLocked = false;

// --- ФУНКЦИИ ---

function getOrCreateUserId() { let storedUserId = localStorage.getItem('uniqueUserId'); if (storedUserId) { userId = storedUserId; if (!localStorage.getItem('userName')) { nameModalOverlay.style.display = 'flex'; } } else { userId = database.ref().push().key; localStorage.setItem('uniqueUserId', userId); nameModalOverlay.style.display = 'flex'; } }
function saveUserName() { const name = nameInput.value.trim(); if (name) { localStorage.setItem('userName', name); database.ref(`users/${userId}`).set({ name: name }); nameModalOverlay.style.display = 'none'; } else { alert('Пожалуйста, введите имя.'); } }

// --- ИЗМЕНЕННАЯ ЛОГИКА ГОЛОСОВАНИЯ ---
async function handleVote(choice) {
    // 1. Если голосование заблокировано, ничего не делаем
    if (isVotingLocked) return;

    // 2. Блокируем дальнейшие нажатия
    isVotingLocked = true;

    const questionId = questionOrder[currentQuestionIndex];
    markQuestionAsAnswered(questionId);

    const userAnswerRef = database.ref(`user_answers/${userId}/${questionId}/${choice}`);
    userAnswerRef.transaction((currentCount) => (currentCount || 0) + 1);
    
    const voteRef = database.ref(`votes/${questionId}/${choice}`);
    voteRef.transaction((currentValue) => (currentValue || 0) + 1);

    splitScreen.classList.add('show-results');
    
    setTimeout(() => {
        currentQuestionIndex = (currentQuestionIndex + 1) % questions.length;
        loadQuestion(currentQuestionIndex);
    }, 2500);
}

// --- ИЗМЕНЕННАЯ ФУНКЦИЯ ЗАГРУЗКИ ВОПРОСА ---
function loadQuestion(index) {
    if (!questions[index]) return;
    splitScreen.classList.add('loading');
    setTimeout(() => {
        splitScreen.classList.remove('show-results');
        const question = questions[index];
        questionTitle.textContent = question.title;
        imgA.src = question.optionA.imageUrl;
        labelA.textContent = question.optionA.name;
        imgB.src = question.optionB.imageUrl;
        labelB.textContent = question.optionB.name;
        updateUI();
        
        // 3. Разблокируем возможность голосовать для нового вопроса
        isVotingLocked = false;

        splitScreen.classList.remove('loading');
    }, 400);
}

// Остальные функции без изменений
function populateMenu() { questionList.innerHTML = ''; const answered = JSON.parse(localStorage.getItem(ANSWERED_QUESTIONS_KEY)) || []; questions.forEach((question, index) => { const li = document.createElement('li'); li.textContent = question.title; li.dataset.index = index; if (answered.includes(question.id)) { li.classList.add('answered'); } li.addEventListener('click', () => { currentQuestionIndex = index; loadQuestion(index); document.body.classList.remove('menu-open'); }); questionList.appendChild(li); }); }
function markQuestionAsAnswered(questionId) { let answered = JSON.parse(localStorage.getItem(ANSWERED_QUESTIONS_KEY)) || []; if (!answered.includes(questionId)) { answered.push(questionId); localStorage.setItem(ANSWERED_QUESTIONS_KEY, JSON.stringify(answered)); populateMenu(); } }
function updateUI() { if (!questions[currentQuestionIndex]) return; const questionId = questionOrder[currentQuestionIndex]; const votesForThisQuestion = allVotes[questionId] || { A: 0, B: 0 }; const votesA = votesForThisQuestion.A || 0; const votesB = votesForThisQuestion.B || 0; const total = votesA + votesB; totalVotesCounter.textContent = `Всего ответов: ${total}`; const percentValA = total === 0 ? 0 : Math.round((votesA / total) * 100); const percentValB = total === 0 ? 0 : Math.round((votesB / total) * 100); percentA.textContent = `${percentValA}%`; countA.textContent = `${votesA} голосов`; percentB.textContent = `${percentValB}%`; countB.textContent = `${votesB} голосов`; }

// --- ЗАПУСК И ОБРАБОТЧИКИ СОБЫТИЙ ---
getOrCreateUserId();
saveNameButton.addEventListener('click', saveUserName);
nameInput.addEventListener('keyup', (event) => { if (event.key === 'Enter') saveUserName(); });
database.ref('votes').on('value', (snapshot) => { allVotes = snapshot.val() || {}; updateUI(); });
database.ref('questions').on('value', (snapshot) => { const questionsData = snapshot.val(); if (questionsData) { questionOrder = Object.keys(questionsData); questions = questionOrder.map(key => ({ id: key, ...questionsData[key] })); populateMenu(); if (currentQuestionIndex >= questions.length) currentQuestionIndex = 0; loadQuestion(currentQuestionIndex); } else { questionTitle.textContent = "Вопросов пока нет"; } });
menuToggle.addEventListener('click', () => document.body.classList.toggle('menu-open'));
mainContent.addEventListener('click', () => { if (document.body.classList.contains('menu-open')) document.body.classList.remove('menu-open'); });
optionA.addEventListener('click', () => handleVote('A'));
optionB.addEventListener('click', () => handleVote('B'));