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

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Получение элементов (без изменений)
const passwordGate = document.getElementById('password-gate');
const adminPanel = document.getElementById('admin-panel');
const passwordInput = document.getElementById('password-input');
const loginButton = document.getElementById('login-button');
const CORRECT_PASSWORD = "120405504408";
const tabQuestions = document.getElementById('tab-questions');
const tabAnswers = document.getElementById('tab-answers');
const questionsContent = document.getElementById('questions-content');
const answersContent = document.getElementById('answers-content');
const questionListContainer = document.getElementById('admin-question-list');
const addQuestionButton = document.getElementById('add-question-button');
const saveAllButton = document.getElementById('save-all-button');
const userAnswersListContainer = document.getElementById('user-answers-list');
const resetAllUsersButton = document.getElementById('reset-all-users-button');

let allQuestionsData = {};
let allUsersData = {};

// Вход и логика вкладок (без изменений)
loginButton.addEventListener('click', () => { if (passwordInput.value === CORRECT_PASSWORD) { passwordGate.style.display = 'none'; adminPanel.style.display = 'block'; loadAdminData(); } else { alert('Неверный пароль!'); } });
tabQuestions.addEventListener('click', () => { tabQuestions.classList.add('active'); tabAnswers.classList.remove('active'); questionsContent.style.display = 'block'; answersContent.style.display = 'none'; });
tabAnswers.addEventListener('click', () => { tabAnswers.classList.add('active'); tabQuestions.classList.remove('active'); answersContent.style.display = 'block'; questionsContent.style.display = 'none'; });

// Загрузка данных (без изменений)
function loadAdminData() {
    database.ref('questions').on('value', (snapshot) => { questionListContainer.innerHTML = ''; allQuestionsData = snapshot.val() || {}; for (const id in allQuestionsData) { createQuestionEditor(id, allQuestionsData[id]); } });
    database.ref('users').on('value', (userSnapshot) => { allUsersData = userSnapshot.val() || {}; loadUserAnswers(); });
}

// Управление вопросами (без изменений)
function createQuestionEditor(id, data = {}) { const editorDiv = document.createElement('div'); editorDiv.className = 'question-editor'; editorDiv.dataset.id = id; const title = data.title || '', oAName = data.optionA?.name || '', oAImg = data.optionA?.imageUrl || '', oBName = data.optionB?.name || '', oBImg = data.optionB?.imageUrl || ''; editorDiv.innerHTML = `<button class="delete-button">Удалить</button><h3>Вопрос ID: ${id.substring(0, 8)}...</h3><div class="form-group"><label>Текст вопроса</label><input class="title-input" value="${title}"></div><div class="form-group"><label>Вариант A: Название</label><input class="optionA-name-input" value="${oAName}"></div><div class="form-group"><label>Вариант A: URL картинки</label><input class="optionA-img-input" value="${oAImg}"></div><div class="form-group"><label>Вариант B: Название</label><input class="optionB-name-input" value="${oBName}"></div><div class="form-group"><label>Вариант B: URL картинки</label><input class="optionB-img-input" value="${oBImg}"></div>`; editorDiv.querySelector('.delete-button').addEventListener('click', () => { if (confirm(`Вы уверены, что хотите удалить вопрос "${editorDiv.querySelector('.title-input').value}"?`)) { database.ref(`questions/${id}`).remove(); database.ref(`votes/${id}`).remove(); } }); questionListContainer.appendChild(editorDiv); }
addQuestionButton.addEventListener('click', () => { const newQuestionId = database.ref('questions').push().key; createQuestionEditor(newQuestionId); });
saveAllButton.addEventListener('click', () => { const updates = {}; const editors = document.querySelectorAll('.question-editor'); editors.forEach(editor => { const id = editor.dataset.id; updates[`/questions/${id}`] = { title: editor.querySelector('.title-input').value, optionA: { name: editor.querySelector('.optionA-name-input').value, imageUrl: editor.querySelector('.optionA-img-input').value }, optionB: { name: editor.querySelector('.optionB-name-input').value, imageUrl: editor.querySelector('.optionB-img-input').value } }; }); database.ref().update(updates).then(() => alert('Все изменения успешно сохранены!')).catch((error) => alert('Ошибка при сохранении: ' + error)); });

// --- КЛЮЧЕВЫЕ ИЗМЕНЕНИЯ: Управление ответами ---
function loadUserAnswers() {
    database.ref('user_answers').on('value', (snapshot) => {
        userAnswersListContainer.innerHTML = '';
        const userAnswers = snapshot.val();
        if (userAnswers) { for (const userId in userAnswers) { createUserEntry(userId, userAnswers[userId]); } } 
        else { userAnswersListContainer.innerHTML = '<p>Пока никто не ответил.</p>'; }
    });
}

function createUserEntry(userId, answers) {
    const entryDiv = document.createElement('div');
    entryDiv.className = 'user-entry';
    const userName = allUsersData[userId]?.name || 'Аноним';
    let totalUserVotes = 0;

    let answersHtml = '<ul class="user-answers-list">';
    for (const questionId in answers) {
        const votesData = answers[questionId]; // Это объект вида { A: 2, B: 4 }
        const questionTitle = allQuestionsData[questionId]?.title || `(удаленный вопрос)`;
        
        let questionVotesHtml = '';
        const countA = votesData.A || 0;
        const countB = votesData.B || 0;
        
        if (countA > 0) {
            const optionAName = allQuestionsData[questionId]?.optionA?.name || 'Вариант "A"';
            questionVotesHtml += `<li>${optionAName} - ${countA} раз(а)</li>`;
        }
        if (countB > 0) {
            const optionBName = allQuestionsData[questionId]?.optionB?.name || 'Вариант "B"';
            questionVotesHtml += `<li>${optionBName} - ${countB} раз(а)</li>`;
        }

        if (questionVotesHtml) {
            answersHtml += `<li><b>${questionTitle}</b><ul>${questionVotesHtml}</ul></li>`;
        }
        
        totalUserVotes += countA + countB;
    }
    answersHtml += '</ul>';

    entryDiv.innerHTML = `
        <div class="user-entry-header">
            <div>
                <strong class="user-name">${userName}</strong>
                <span class="user-id">ID: ${userId}</span>
            </div>
            <div>
                <span class="user-total-votes">Всего голосов: ${totalUserVotes}</span>
                <button class="reset-user-button" data-userid="${userId}">Обнулить</button>
            </div>
        </div>
        ${answersHtml}`;
    entryDiv.querySelector('.reset-user-button').addEventListener('click', (e) => { if (confirm(`Вы уверены, что хотите обнулить все ответы пользователя ${userName}?`)) { resetUser(e.target.dataset.userid); } });
    userAnswersListContainer.appendChild(entryDiv);
}

async function resetUser(userId) {
    const userAnswersRef = database.ref(`user_answers/${userId}`);
    const userAnswersSnapshot = await userAnswersRef.once('value');
    const userAnswers = userAnswersSnapshot.val();
    if (!userAnswers) return;

    for (const questionId in userAnswers) {
        const votesData = userAnswers[questionId];
        const countA = votesData.A || 0;
        const countB = votesData.B || 0;

        if (countA > 0) {
            database.ref(`votes/${questionId}/A`).transaction((currentValue) => (currentValue >= countA ? currentValue - countA : 0));
        }
        if (countB > 0) {
            database.ref(`votes/${questionId}/B`).transaction((currentValue) => (currentValue >= countB ? currentValue - countB : 0));
        }
    }
    userAnswersRef.remove().then(() => alert(`Ответы пользователя ${allUsersData[userId]?.name || userId} обнулены.`));
}

resetAllUsersButton.addEventListener('click', () => {
    if (confirm('ВЫ УВЕРЕНЫ, ЧТО ХОТИТЕ ОБНУЛИТЬ ВСЕ ГОЛОСА И ОТВЕТЫ ВСЕХ ПОЛЬЗОВАТЕЛЕЙ? ЭТО ДЕЙСТВИЕ НЕОБРАТИМО!')) {
        database.ref('votes').remove();
        database.ref('user_answers').remove();
        // Оставляем имена пользователей, удаляем только их голоса
        alert('Все ответы и голоса были полностью обнулены. Имена пользователей сохранены.');
    }
});