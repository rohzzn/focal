// Time display
function updateTime() {
    const now = new Date();
    const timeDisplay = document.querySelector('.time-display');
    timeDisplay.textContent = now.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });

// Initialize Clerk
const clerk = window.Clerk.init({
    publishableKey: 'CLERK_PUBLISHABLE_KEY' // Replace with your Clerk publishable key
});

// Initialize Clerk user button
clerk.mountUserButton(document.getElementById('user-button'), {
    afterSignOutUrl: '/',
    afterSignInUrl: '/'
});

// Handle authentication state changes
clerk.addListener(({ user }) => {
    if (user) {
        // User is signed in
        document.querySelector('.auth-required-message').classList.add('hidden');
        document.querySelector('.events-today').classList.remove('hidden');
        document.querySelector('.events-upcoming').classList.remove('hidden');
        
        // Get OAuth token for Google Calendar
        user.getToken('oauth_google').then(token => {
            if (token) {
                fetchCalendarEvents(token);
            }
        });
    } else {
        // User is signed out
        document.querySelector('.auth-required-message').classList.remove('hidden');
        document.querySelector('.events-today').classList.add('hidden');
        document.querySelector('.events-upcoming').classList.add('hidden');
    }
});

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

function renderEvents(events, container) {
    container.innerHTML = events.length === 0 
        ? '<div class="event-card">No events scheduled</div>'
        : '';

    events.forEach(event => {
        const startTime = event.start.dateTime 
            ? new Date(event.start.dateTime)
            : new Date(event.start.date);

        const eventElement = document.createElement('div');
        eventElement.className = 'event-card';
        eventElement.innerHTML = `
            <div class="event-time">
                ${formatEventTime(startTime)}
            </div>
            <div class="event-details">
                <div class="event-title">${event.summary}</div>
                ${event.location ? `
                    <div class="event-location">📍 ${event.location}</div>
                ` : ''}
                ${event.hangoutLink ? `
                    <a href="${event.hangoutLink}" target="_blank" class="event-link">
                        Join Meeting
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M15 3h6v6M14 10l7-7M10 3H3v18h18v-7"/>
                        </svg>
                    </a>
                ` : ''}
            </div>
        `;
        container.appendChild(eventElement);
    });
}

function formatEventTime(date) {
    return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    }).toLowerCase();
}

// Google Calendar Integration
const signInButton = document.getElementById('signin-button');
const eventsToday = document.getElementById('events-today');
const eventsUpcoming = document.getElementById('events-upcoming');

signInButton.addEventListener('click', () => {
    chrome.identity.getAuthToken({ interactive: true }, function(token) {
        if (chrome.runtime.lastError || !token) {
            console.error(chrome.runtime.lastError);
            return;
        }
        signInButton.style.display = 'none';
        fetchCalendarEvents(token);
    });
});

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

        renderEvents(todayEvents, eventsToday);
        renderEvents(upcomingEvents, eventsUpcoming);
    } catch (error) {
        console.error('Error fetching calendar events:', error);
    }
}

function renderEvents(events, container) {
    container.innerHTML = events.length === 0 
        ? '<div class="event-card">No events scheduled</div>'
        : '';

    events.forEach(event => {
        const startTime = event.start.dateTime 
            ? new Date(event.start.dateTime)
            : new Date(event.start.date);

        const eventElement = document.createElement('div');
        eventElement.className = 'event-card';
        eventElement.innerHTML = `
            <div class="event-time">
                ${formatEventTime(startTime)}
            </div>
            <div class="event-details">
                <div class="event-title">${event.summary}</div>
                ${event.location ? `
                    <div class="event-location">📍 ${event.location}</div>
                ` : ''}
                ${event.hangoutLink ? `
                    <a href="${event.hangoutLink}" target="_blank" class="event-link">
                        Join Meeting
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M15 3h6v6M14 10l7-7M10 3H3v18h18v-7"/>
                        </svg>
                    </a>
                ` : ''}
            </div>
        `;
        container.appendChild(eventElement);
    });
}

function formatEventTime(date) {
    return date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    }).toLowerCase();
}

// Try to auto-sign in on load
chrome.identity.getAuthToken({ interactive: false }, function(token) {
    if (token) {
        signInButton.style.display = 'none';
        fetchCalendarEvents(token);
    }
});
}
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
        audio.play();
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
                notification.play();
                
                if (isBreak) {
                    timeLeft = 25 * 60; // 25 minutes
                    isBreak = false;
                    timerMode.textContent = 'Focus Time';
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

function createTaskElement(task, index) {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.innerHTML = `
        <div class="task-checkbox ${task.completed ? 'checked' : ''}" onclick="toggleTask(${index})">
            ${task.completed ? '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
        </div>
        <span class="task-text ${task.completed ? 'completed' : ''}">${task.text}</span>
        <button class="delete-task" onclick="deleteTask(${index})">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;
    return li;
}

function renderTasks() {
    taskList.innerHTML = '';
    tasks.forEach((task, index) => {
        taskList.appendChild(createTaskElement(task, index));
    });
    chrome.storage.sync.set({ tasks });
}

function toggleTask(index) {
    tasks[index].completed = !tasks[index].completed;
    renderTasks();
}

function deleteTask(index) {
    tasks.splice(index, 1);
    renderTasks();
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

function createShortcutElement(shortcut, index) {
    const a = document.createElement('a');
    a.href = shortcut.url;
    a.className = 'shortcut';
    a.target = '_blank';
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

function deleteShortcut(index) {
    shortcuts.splice(index, 1);
    renderShortcuts();
}

addShortcutButton.addEventListener('click', () => {
    const name = prompt('Enter shortcut name:');
    const url = prompt('Enter shortcut URL:');
    if (name && url) {
        shortcuts.push({ name, url });
        renderShortcuts();
    }
});

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