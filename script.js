// Preset shortcuts with professional defaults
const presetShortcuts = [
    { name: 'YouTube', url: 'https://youtube.com' },
    { name: 'Gmail', url: 'https://gmail.com' },
    { name: 'Google Drive', url: 'https://drive.google.com' },
    { name: 'Calendar', url: 'https://calendar.google.com' },
    { name: 'LinkedIn', url: 'https://linkedin.com' },
    { name: 'GitHub', url: 'https://github.com' },
    { name: 'Docs', url: 'https://docs.google.com' },
    { name: 'Meet', url: 'https://meet.google.com' }
];

// Time display
function updateTime() {
    const timeDisplay = document.querySelector('.time-display');
    const now = new Date();
    timeDisplay.textContent = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}
setInterval(updateTime, 1000);
updateTime();

// Pomodoro Timer
const timerDisplay = document.querySelector('.timer-display');
const startButton = document.querySelector('.timer-button.start');
const resetButton = document.querySelector('.timer-button.reset');
const timerMode = document.querySelector('.timer-mode');

let timer;
let timeLeft = 25 * 60; // 25 minutes
let isRunning = false;
let currentMode = 'focus';

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function startTimer() {
    if (!isRunning) {
        isRunning = true;
        startButton.textContent = 'Pause';
        timer = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            if (timeLeft === 0) {
                clearInterval(timer);
                isRunning = false;
                startButton.textContent = 'Start';
                if (currentMode === 'focus') {
                    currentMode = 'break';
                    timeLeft = 5 * 60; // 5 minutes break
                    timerMode.textContent = 'Break Time';
                } else {
                    currentMode = 'focus';
                    timeLeft = 25 * 60; // 25 minutes focus
                    timerMode.textContent = 'Focus Time';
                }
                updateTimerDisplay();
            }
        }, 1000);
    } else {
        clearInterval(timer);
        isRunning = false;
        startButton.textContent = 'Resume';
    }
}

function resetTimer() {
    clearInterval(timer);
    isRunning = false;
    currentMode = 'focus';
    timeLeft = 25 * 60;
    timerMode.textContent = 'Focus Time';
    startButton.textContent = 'Start';
    updateTimerDisplay();
}

startButton.addEventListener('click', startTimer);
resetButton.addEventListener('click', resetTimer);

// Tasks
const taskForm = document.querySelector('.task-form');
const taskInput = document.querySelector('.task-input');
const taskList = document.querySelector('.task-list');
let tasks = [];

function renderTasks() {
    taskList.innerHTML = '';
    tasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.className = 'task-item';
        li.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
            <span class="task-text">${task.text}</span>
            <button class="delete-task" data-index="${index}">&times;</button>
        `;
        taskList.appendChild(li);
    });
}

function addTask(text) {
    tasks.push({ text, completed: false });
    renderTasks();
    saveTasks();
}

function deleteTask(index) {
    tasks.splice(index, 1);
    renderTasks();
    saveTasks();
}

function toggleTask(index) {
    tasks[index].completed = !tasks[index].completed;
    renderTasks();
    saveTasks();
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
        renderTasks();
    }
}

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();
    if (text) {
        addTask(text);
        taskInput.value = '';
    }
});

taskList.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-task')) {
        const index = e.target.dataset.index;
        deleteTask(index);
    } else if (e.target.classList.contains('task-checkbox')) {
        const index = e.target.closest('.task-item').querySelector('.delete-task').dataset.index;
        toggleTask(index);
    }
});

loadTasks();

// Calendar info modal
const infoButton = document.querySelector('.info-button');
const infoModal = document.querySelector('.info-modal');
const closeModal = document.querySelector('.close-modal');

infoButton.addEventListener('click', () => {
    infoModal.classList.remove('hidden');
});

closeModal.addEventListener('click', () => {
    infoModal.classList.add('hidden');
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === infoModal) {
        infoModal.classList.add('hidden');
    }
});

// iCal URL handling
const icalInput = document.querySelector('.ical-input');
const saveIcalButton = document.querySelector('.save-ical');

saveIcalButton.addEventListener('click', () => {
    const icalUrl = icalInput.value.trim();
    if (icalUrl) {
        localStorage.setItem('icalUrl', icalUrl);
        showNotification('Calendar URL saved');
        fetchAndDisplayEvents(icalUrl);
    }
});

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Fetch and display events
function fetchAndDisplayEvents(url) {
    // This is a placeholder function. In a real implementation, you would fetch the iCal data
    // from the server and parse it to display events. For demonstration purposes, we'll just
    // show some dummy events.
    const eventslist = document.querySelector('.events-list');
    eventslist.innerHTML = `
        <div>9:00 AM - Team Meeting</div>
        <div>2:00 PM - Client Call</div>
        <div>4:30 PM - Project Review</div>
    `;
}

// Load saved iCal URL
const savedIcalUrl = localStorage.getItem('icalUrl');
if (savedIcalUrl) {
    icalInput.value = savedIcalUrl;
    fetchAndDisplayEvents(savedIcalUrl);
}

// Shortcuts handling
const shortcutsGrid = document.querySelector('.shortcuts-grid');
const addShortcutButton = document.querySelector('.add-shortcut');
let shortcuts = [...presetShortcuts];

function createShortcutElement(shortcut, index) {
    const div = document.createElement('div');
    div.className = 'shortcut-wrapper';
    
    const a = document.createElement('a');
    a.href = shortcut.url;
    a.className = 'shortcut';
    a.target = '_blank';
    
    const nameSpan = document.createElement('span');
    nameSpan.className = 'shortcut-name';
    nameSpan.textContent = shortcut.name;
    
    a.appendChild(nameSpan);
    div.appendChild(a);

    if (index >= presetShortcuts.length) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-shortcut';
        deleteBtn.innerHTML = '&times;';
        deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            deleteShortcut(index);
        });
        div.appendChild(deleteBtn);
    }
    
    return div;
}

function renderShortcuts() {
    shortcutsGrid.innerHTML = '';
    shortcuts.forEach((shortcut, index) => {
        shortcutsGrid.appendChild(createShortcutElement(shortcut, index));
    });
}

function deleteShortcut(index) {
    if (index >= presetShortcuts.length) {
        shortcuts.splice(index, 1);
        renderShortcuts();
        saveShortcuts();
    }
}

addShortcutButton.addEventListener('click', () => {
    const name = prompt('Enter shortcut name:');
    const url = prompt('Enter shortcut URL:');
    if (name && url) {
        const formattedUrl = url.startsWith('http://') || url.startsWith('https://')
            ? url
            : `https://${url}`;
        shortcuts.push({ name, url: formattedUrl });
        renderShortcuts();
        saveShortcuts();
    }
});

function saveShortcuts() {
    localStorage.setItem('shortcuts', JSON.stringify(shortcuts.slice(presetShortcuts.length)));
}

function loadShortcuts() {
    const savedShortcuts = localStorage.getItem('shortcuts');
    if (savedShortcuts) {
        shortcuts = [...presetShortcuts, ...JSON.parse(savedShortcuts)];
    }
    renderShortcuts();
}

loadShortcuts();

// Theme toggle
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

function setTheme(isDark) {
    body.classList.toggle('dark-mode', isDark);
    localStorage.setItem('darkMode', isDark);
}

themeToggle.addEventListener('click', () => {
    const isDark = !body.classList.contains('dark-mode');
    setTheme(isDark);
});

// Load saved theme preference
const savedTheme = localStorage.getItem('darkMode');
if (savedTheme !== null) {
    setTheme(savedTheme === 'true');
}

