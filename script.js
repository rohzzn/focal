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

// Calendar info modal
const infoButton = document.querySelector('.info-button');
const infoModal = document.querySelector('.info-modal');
const closeModal = document.querySelector('.close-modal');

infoButton?.addEventListener('click', () => {
    infoModal.classList.remove('hidden');
});

closeModal?.addEventListener('click', () => {
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

saveIcalButton?.addEventListener('click', () => {
    const icalUrl = icalInput.value.trim();
    if (icalUrl) {
        chrome.storage.sync.set({ icalUrl }, () => {
            showNotification('Calendar URL saved');
        });
    }
});

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.remove();
    }, 3000);
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
    
    if (index >= presetShortcuts.length) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-shortcut';
        deleteBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        `;
        deleteBtn.addEventListener('click', (e) => deleteShortcut(index, e));
        div.appendChild(deleteBtn);
    }
    
    a.appendChild(nameSpan);
    div.appendChild(a);
    
    return div;
}

function renderShortcuts() {
    if (!shortcutsGrid) return;
    shortcutsGrid.innerHTML = '';
    shortcuts.forEach((shortcut, index) => {
        shortcutsGrid.appendChild(createShortcutElement(shortcut, index));
    });
}

window.deleteShortcut = function(index, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    if (index >= presetShortcuts.length) {
        shortcuts.splice(index, 1);
        renderShortcuts();
        chrome.storage.sync.set({ shortcuts });
    }
};

addShortcutButton?.addEventListener('click', () => {
    const name = prompt('Enter shortcut name:');
    const url = prompt('Enter shortcut URL:');
    if (name && url) {
        const formattedUrl = url.startsWith('http://') || url.startsWith('https://')
            ? url
            : `https://${url}`;
        shortcuts.push({ name, url: formattedUrl });
        renderShortcuts();
        chrome.storage.sync.set({ shortcuts });
    }
});

// Load saved shortcuts
chrome.storage.sync.get(['shortcuts'], function(result) {
    if (result.shortcuts) {
        shortcuts = [...presetShortcuts, ...result.shortcuts.filter(s => 
            !presetShortcuts.some(ps => ps.url === s.url)
        )];
    }
    renderShortcuts();
});