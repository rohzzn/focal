// Constants and Configurations
const POMODORO_TIME = 25 * 60; // 25 minutes in seconds
const NOTIFICATION_DURATION = 3000; // 3 seconds
const CALENDAR_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const MAX_EVENTS_DISPLAY = 5;

const presetShortcuts = [
    { name: 'Gmail', url: 'https://gmail.com' },
    { name: 'Drive', url: 'https://drive.google.com' },
    { name: 'Calendar', url: 'https://calendar.google.com' },
    { name: 'GitHub', url: 'https://github.com' },
    { name: 'Docs', url: 'https://docs.google.com' },
    { name: 'Meet', url: 'https://meet.google.com' }
];

// DOM Elements
const elements = {
    timeDisplay: document.querySelector('.time-display'),
    timerDisplay: document.querySelector('.timer-display'),
    startButton: document.querySelector('.start'),
    resetButton: document.querySelector('.reset'),
    taskForm: document.querySelector('.task-form'),
    taskInput: document.querySelector('.task-input'),
    taskList: document.querySelector('.task-list'),
    icalInput: document.querySelector('.ical-input'),
    saveIcalButton: document.querySelector('.save-ical'),
    eventsList: document.querySelector('.events-list'),
    shortcutsGrid: document.querySelector('.shortcuts-grid'),
    addShortcutButton: document.querySelector('.add-shortcut')
};

// State Management
let state = {
    timerInterval: null,
    timeLeft: POMODORO_TIME,
    tasks: [],
    shortcuts: [...presetShortcuts],
    lastCalendarUpdate: null
};

// Time Display
function updateTime() {
    if (!elements.timeDisplay) return;
    const now = new Date();
    elements.timeDisplay.textContent = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

setInterval(updateTime, 1000);
updateTime();

// Pomodoro Timer
function updateTimerDisplay() {
    if (!elements.timerDisplay) return;
    const minutes = Math.floor(state.timeLeft / 60);
    const seconds = state.timeLeft % 60;
    elements.timerDisplay.textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function startTimer() {
    if (state.timerInterval) return;
    state.timerInterval = setInterval(() => {
        state.timeLeft--;
        updateTimerDisplay();
        if (state.timeLeft === 0) {
            clearInterval(state.timerInterval);
            state.timerInterval = null;
            elements.startButton.textContent = 'Start';
            showNotification('Pomodoro timer completed!');
            playTimerCompleteSound();
        }
    }, 1000);
    elements.startButton.textContent = 'Pause';
}

function pauseTimer() {
    if (!state.timerInterval) return;
    clearInterval(state.timerInterval);
    state.timerInterval = null;
    elements.startButton.textContent = 'Start';
}

function resetTimer() {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
    state.timeLeft = POMODORO_TIME;
    updateTimerDisplay();
    elements.startButton.textContent = 'Start';
}

elements.startButton?.addEventListener('click', () => {
    if (state.timerInterval) {
        pauseTimer();
    } else {
        startTimer();
    }
});

elements.resetButton?.addEventListener('click', resetTimer);

// Tasks Management
function addTask(text) {
    const task = {
        id: Date.now(),
        text,
        completed: false,
        createdAt: new Date().toISOString()
    };
    state.tasks.unshift(task);
    saveTasks();
    renderTasks();
}

function toggleTask(id) {
    const task = state.tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
    }
}

function deleteTask(id) {
    state.tasks = state.tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
}

function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = 'task-item';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => toggleTask(task.id));
    
    const text = document.createElement('span');
    text.textContent = task.text;
    text.style.textDecoration = task.completed ? 'line-through' : 'none';
    
    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '×';
    deleteBtn.className = 'delete-task';
    deleteBtn.addEventListener('click', () => deleteTask(task.id));
    
    li.append(checkbox, text, deleteBtn);
    return li;
}

function renderTasks() {
    if (!elements.taskList) return;
    elements.taskList.innerHTML = '';
    state.tasks.forEach(task => {
        elements.taskList.appendChild(createTaskElement(task));
    });
}

elements.taskForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = elements.taskInput.value.trim();
    if (text) {
        addTask(text);
        elements.taskInput.value = '';
    }
});

// Calendar Integration
async function fetchCalendarEvents(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch calendar data');
        }
        const data = await response.text();
        return parseICalEvents(data);
    } catch (error) {
        console.error('Calendar fetch error:', error);
        showNotification('Failed to fetch calendar events');
        return [];
    }
}

function parseICalEvents(icalData) {
    try {
        const events = [];
        const lines = icalData.split(/\r\n|\n|\r/);
        let currentEvent = null;
        let lastKey = '';

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            
            // Handle line folding
            while (i + 1 < lines.length && lines[i + 1].match(/^\s/)) {
                line += lines[i + 1].substring(1);
                i++;
            }
            
            if (line === 'BEGIN:VEVENT') {
                currentEvent = {};
            } else if (line === 'END:VEVENT') {
                if (currentEvent?.start && currentEvent?.summary) {
                    events.push(currentEvent);
                }
                currentEvent = null;
            } else if (currentEvent) {
                const [key, ...values] = line.split(':');
                const value = values.join(':');
                
                // Handle property parameters
                const [realKey, ...params] = key.split(';');
                lastKey = realKey;

                switch (realKey) {
                    case 'SUMMARY':
                        currentEvent.summary = value;
                        break;
                    case 'DESCRIPTION':
                        currentEvent.description = value;
                        break;
                    case 'DTSTART':
                        currentEvent.start = parseICalDate(value, params);
                        break;
                    case 'DTEND':
                        currentEvent.end = parseICalDate(value, params);
                        break;
                    case 'LOCATION':
                        currentEvent.location = value;
                        break;
                }
            }
        }

        return events.sort((a, b) => a.start - b.start);
    } catch (error) {
        console.error('Error parsing iCal data:', error);
        return [];
    }
}

function parseICalDate(dateStr, params = []) {
    try {
        // Handle different date formats and timezones
        let parsedDate;
        if (dateStr.includes('T')) {
            // With time
            parsedDate = new Date(dateStr.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?/, '$1-$2-$3T$4:$5:$6Z'));
        } else {
            // Date only
            parsedDate = new Date(dateStr.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3'));
        }

        // Check if date is valid
        if (isNaN(parsedDate.getTime())) {
            throw new Error('Invalid date');
        }

        return parsedDate;
    } catch (error) {
        console.error('Error parsing date:', dateStr, error);
        return new Date(); // Fallback to current date
    }
}

function displayEvents(events) {
    if (!elements.eventsList) return;
    
    elements.eventsList.innerHTML = '';
    const now = new Date();
    const upcomingEvents = events
        .filter(event => event.end > now)
        .slice(0, MAX_EVENTS_DISPLAY);

    if (upcomingEvents.length === 0) {
        const noEvents = document.createElement('div');
        noEvents.className = 'event-item';
        noEvents.textContent = 'No upcoming events';
        elements.eventsList.appendChild(noEvents);
        return;
    }

    upcomingEvents.forEach(event => {
        const eventElement = document.createElement('div');
        eventElement.className = 'event-item';
        
        const title = document.createElement('div');
        title.className = 'event-title';
        title.textContent = event.summary;

        const time = document.createElement('div');
        time.className = 'event-time';
        time.textContent = formatEventDateTime(event);
        
        if (event.location) {
            const location = document.createElement('div');
            location.className = 'event-location';
            location.textContent = event.location;
            eventElement.appendChild(location);
        }
        
        eventElement.append(title, time);
        elements.eventsList.appendChild(eventElement);
    });
}

function formatEventDateTime(event) {
    const options = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    const startTime = event.start.toLocaleString('en-US', options);
    const endTime = event.end.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    return `${startTime} - ${endTime}`;
}

// Calendar Auto-refresh
function setupCalendarRefresh() {
    async function refreshCalendar() {
        const url = elements.icalInput?.value.trim();
        if (url) {
            const events = await fetchCalendarEvents(url);
            if (events.length > 0) {
                displayEvents(events);
                state.lastCalendarUpdate = new Date();
            }
        }
    }

    // Initial load
    refreshCalendar();

    // Setup periodic refresh
    setInterval(refreshCalendar, CALENDAR_REFRESH_INTERVAL);
}

elements.saveIcalButton?.addEventListener('click', async () => {
    const url = elements.icalInput?.value.trim();
    if (url) {
        showNotification('Fetching calendar events...');
        const events = await fetchCalendarEvents(url);
        if (events.length > 0) {
            chrome.storage.sync.set({ icalUrl: url });
            displayEvents(events);
            showNotification('Calendar updated successfully');
        }
    }
});

// Shortcuts Management
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
    
    if (index >= presetShortcuts.length) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-shortcut';
        deleteBtn.innerHTML = '×';
        deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            deleteShortcut(index);
        });
        div.appendChild(deleteBtn);
    }
    
    a.appendChild(nameSpan);
    div.appendChild(a);
    return div;
}

function renderShortcuts() {
    if (!elements.shortcutsGrid) return;
    elements.shortcutsGrid.innerHTML = '';
    state.shortcuts.forEach((shortcut, index) => {
        elements.shortcutsGrid.appendChild(createShortcutElement(shortcut, index));
    });
}

function deleteShortcut(index) {
    if (index >= presetShortcuts.length) {
        state.shortcuts.splice(index, 1);
        renderShortcuts();
        chrome.storage.sync.set({ shortcuts: state.shortcuts });
    }
}

elements.addShortcutButton?.addEventListener('click', () => {
    const name = prompt('Enter shortcut name:')?.trim();
    const url = prompt('Enter shortcut URL:')?.trim();
    
    if (name && url) {
        const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
        state.shortcuts.push({ name, url: formattedUrl });
        renderShortcuts();
        chrome.storage.sync.set({ shortcuts: state.shortcuts });
        showNotification('Shortcut added successfully');
    }
});

// Notifications
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, NOTIFICATION_DURATION);
}

// Data Persistence
function saveTasks() {
    chrome.storage.sync.set({ tasks: state.tasks });
}

// Initialize
async function initialize() {
    try {
        const storage = await chrome.storage.sync.get(['tasks', 'shortcuts', 'icalUrl']);
        
        // Load tasks
        if (storage.tasks) {
            state.tasks = storage.tasks;
            renderTasks();
        }
        
        // Load shortcuts
        if (storage.shortcuts) {
            state.shortcuts = [...presetShortcuts, ...storage.shortcuts.filter(s => 
                !presetShortcuts.some(ps => ps.url === s.url)
            )];
            renderShortcuts();
        } else {
            renderShortcuts();
        }
        
        // Load calendar
        if (storage.icalUrl) {
            elements.icalInput.value = storage.icalUrl;
            setupCalendarRefresh();
        }
        
        // Set up timer display
        updateTimerDisplay();
        
    } catch (error) {
        console.error('Error initializing app:', error);
        showNotification('Error loading saved data');
    }
}

// Handle visibility change for timer
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (state.timerInterval) {
            // Store the time when tab becomes hidden
            state.hiddenTime = new Date();
        }
    } else {
        if (state.hiddenTime && state.timerInterval) {
            // Calculate elapsed time and update timer
            const elapsedSeconds = Math.floor((new Date() - state.hiddenTime) / 1000);
            state.timeLeft = Math.max(0, state.timeLeft - elapsedSeconds);
            updateTimerDisplay();
            
            if (state.timeLeft === 0) {
                clearInterval(state.timerInterval);
                state.timerInterval = null;
                elements.startButton.textContent = 'Start';
                showNotification('Pomodoro timer completed while tab was hidden!');
            }
        }
    }
});

// Start initialization
initialize();