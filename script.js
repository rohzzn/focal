// Time display
function updateTime() {
    const now = new Date();
    const timeDisplay = document.querySelector('.time-display');
    timeDisplay.textContent = now.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

// Start the time update immediately
setInterval(updateTime, 1000);
updateTime();

// Lofi music player
const lofiTracks = [
    'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
    'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0c6ff1def.mp3',
    'https://cdn.pixabay.com/download/audio/2022/03/07/audio_c8b9a8d33e.mp3'
];

let currentTrack = 0;
const audio = new Audio(lofiTracks[currentTrack]);
audio.loop = true;

const playButton = document.querySelector('.play-button');
const volumeSlider = document.querySelector('.volume-slider');

playButton.addEventListener('click', () => {
    if (audio.paused) {
        audio.play().catch(e => console.error('Error playing audio:', e));
        playButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="6" y="4" width="4" height="16"></rect>
                <rect x="14" y="4" width="4" height="16"></rect>
            </svg>
        `;
    } else {
        audio.pause();
        playButton.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
        `;
    }
});

volumeSlider.addEventListener('input', (e) => {
    audio.volume = e.target.value / 100;
});

// Pomodoro timer
let timeLeft = 25 * 60;
let timerInterval = null;
let isBreak = false;

const timerDisplay = document.querySelector('.timer-display');
const startButton = document.querySelector('.timer-button.start');
const resetButton = document.querySelector('.timer-button.reset');
const timerMode = document.querySelector('.timer-mode');

function updateTimer() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function toggleTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        startButton.textContent = 'Start';
    } else {
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimer();
            
            if (timeLeft === 0) {
                clearInterval(timerInterval);
                timerInterval = null;
                const notification = new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3');
                notification.play().catch(e => console.error('Error playing notification:', e));
                
                if (isBreak) {
                    timeLeft = 25 * 60; // 25 minutes
                    isBreak = false;
                    timerMode.textContent = '';
                } else {
                    timeLeft = 5 * 60; // 5 minutes
                    isBreak = true;
                    timerMode.textContent = 'Break Time';
                }
                updateTimer();
                startButton.textContent = 'Start';
            }
        }, 1000);
        startButton.textContent = 'Pause';
    }
}

startButton.addEventListener('click', toggleTimer);
resetButton.addEventListener('click', () => {
    clearInterval(timerInterval);
    timerInterval = null;
    timeLeft = 25 * 60;
    isBreak = false;
    timerMode.textContent = 'Focus Time';
    updateTimer();
    startButton.textContent = 'Start';
});

// Tasks
const taskForm = document.querySelector('.task-form');
const taskInput = document.querySelector('.task-input');
const taskList = document.querySelector('.task-list');
let tasks = [];

// Define these functions in the global scope
window.toggleTask = function(index) {
    tasks[index].completed = !tasks[index].completed;
    renderTasks();
};

window.deleteTask = function(index) {
    tasks.splice(index, 1);
    renderTasks();
};

function createTaskElement(task, index) {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.innerHTML = `
        <div class="task-checkbox ${task.completed ? 'checked' : ''}">
            ${task.completed ? '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
        </div>
        <span class="task-text ${task.completed ? 'completed' : ''}">${task.text}</span>
        <button class="delete-task">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;
    
    // Add event listeners
    const checkbox = li.querySelector('.task-checkbox');
    checkbox.addEventListener('click', () => toggleTask(index));
    
    const deleteBtn = li.querySelector('.delete-task');
    deleteBtn.addEventListener('click', () => deleteTask(index));
    return li;
}

function renderTasks() {
    taskList.innerHTML = '';
    tasks.forEach((task, index) => {
        taskList.appendChild(createTaskElement(task, index));
    });
    chrome.storage.sync.set({ tasks });
}

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();
    if (text) {
        tasks.push({ text, completed: false });
        taskInput.value = '';
        renderTasks();
    }
});

// Shortcuts
const shortcutsGrid = document.querySelector('.shortcuts-grid');
const addShortcutButton = document.querySelector('.add-shortcut');
let shortcuts = [];

// Define deleteShortcut in the global scope
window.deleteShortcut = function(index) {
    shortcuts.splice(index, 1);
    renderShortcuts();
};

function createShortcutElement(shortcut, index) {
    const a = document.createElement('a');
    a.href = shortcut.url;
    a.className = 'shortcut';
    a.target = '_blank';
    a.style.display = 'flex';
    a.style.justifyContent = 'space-between';
    a.style.alignItems = 'center';
    a.style.padding = '1rem';
    a.innerHTML = `
        ${shortcut.name}
        <button class="delete-task" onclick="event.preventDefault(); deleteShortcut(${index})">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;
    return a;
}

function renderShortcuts() {
    shortcutsGrid.innerHTML = '';
    shortcuts.forEach((shortcut, index) => {
        shortcutsGrid.appendChild(createShortcutElement(shortcut, index));
    });
    chrome.storage.sync.set({ shortcuts });
}

addShortcutButton.addEventListener('click', () => {
    const name = prompt('Enter shortcut name:');
    const url = prompt('Enter shortcut URL:');
    if (name && url) {
        // Add http:// if no protocol is specified
        const formattedUrl = url.startsWith('http://') || url.startsWith('https://')
            ? url
            : `https://${url}`;
        shortcuts.push({ name, url: formattedUrl });
        renderShortcuts();
    }
});

// Update layout
const main = document.querySelector('main');
main.style.gridTemplateAreas = '"pomodoro pomodoro pomodoro" "tasks calendar calendar" "shortcuts shortcuts shortcuts"';
main.style.gridTemplateColumns = '1fr 1fr 1fr';

document.querySelector('.tasks').style.gridArea = 'tasks';
document.querySelector('.calendar').style.gridArea = 'calendar';
document.querySelector('.pomodoro').style.gridArea = 'pomodoro';
document.querySelector('.shortcuts').style.gridArea = 'shortcuts';

// Initialize Clerk and calendar functionality only if Clerk is available
if (window.Clerk) {
    const clerk = window.Clerk.init({
        publishableKey: 'pk_test_Z29vZC1jb2xsaWUtODYuY2xlcmsuYWNjb3VudHMuZGV2JA', // Using a test key - replace with your actual key
    });

    // Initialize Clerk user button
    clerk.mountUserButton(document.getElementById('user-button'), {
        afterSignOutUrl: '/',
        afterSignInUrl: '/'
    });

    // Handle authentication state changes
    clerk.addListener(({ user }) => {
        if (user) {
            document.querySelector('.auth-required-message').classList.add('hidden');
            document.querySelector('.events-today').classList.remove('hidden');
            document.querySelector('.events-upcoming').classList.remove('hidden');
            
            user.getToken('oauth_google').then(token => {
                if (token) {
                    fetchCalendarEvents(token);
                }
            });
        } else {
            document.querySelector('.auth-required-message').classList.remove('hidden');
            document.querySelector('.events-today').classList.add('hidden');
            document.querySelector('.events-upcoming').classList.add('hidden');
        }
    });
}

// Load saved data
chrome.storage.sync.get(['tasks', 'shortcuts'], function(result) {
    if (result.tasks) {
        tasks = result.tasks;
        renderTasks();
    }
    if (result.shortcuts) {
        shortcuts = result.shortcuts;
        renderShortcuts();
    }
});

// Calendar event rendering function
function formatEventTime(date) {
    return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    }).toLowerCase();
}

// Calendar events fetching function
async function fetchCalendarEvents(token) {
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + 7);

    try {
        const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
            `timeMin=${now.toISOString()}&` +
            `timeMax=${endOfWeek.toISOString()}&` +
            `orderBy=startTime&` +
            `singleEvents=true`,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const events = data.items || [];

        // Filter events for today and upcoming
        const todayEvents = events.filter(event => {
            const eventDate = new Date(event.start.dateTime || event.start.date);
            return eventDate <= endOfDay;
        });

        const upcomingEvents = events.filter(event => {
            const eventDate = new Date(event.start.dateTime || event.start.date);
            return eventDate > endOfDay;
        });

        renderEvents(todayEvents, document.getElementById('events-today'));
        renderEvents(upcomingEvents, document.getElementById('events-upcoming'));
    } catch (error) {
        console.error('Error fetching calendar events:', error);
    }
}