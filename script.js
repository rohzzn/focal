// Preset shortcuts
const presetShortcuts = [
    { name: 'YouTube', url: 'https://youtube.com', icon: '🎥' },
    { name: 'WhatsApp', url: 'https://web.whatsapp.com', icon: '💬' },
    { name: 'Netflix', url: 'https://netflix.com', icon: '🎬' },
    { name: 'Amazon', url: 'https://amazon.com', icon: '🛒' },
    { name: 'Instagram', url: 'https://instagram.com', icon: '📸' },
    { name: 'ChatGPT', url: 'https://chat.openai.com', icon: '🤖' },
    { name: 'Claude', url: 'https://claude.ai', icon: '🧠' },
    { name: 'Perplexity', url: 'https://perplexity.ai', icon: '🔍' },
    { name: 'v0.dev', url: 'https://v0.dev', icon: '⚡' },
    { name: 'Zoom', url: 'https://zoom.us/join', icon: '🎥' }
];

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

// Load saved iCal URL
chrome.storage.sync.get(['icalUrl'], function(result) {
    if (result.icalUrl) {
        icalInput.value = result.icalUrl;
    }
});

// Shortcuts with presets
const shortcutsGrid = document.querySelector('.shortcuts-grid');
const addShortcutButton = document.querySelector('.add-shortcut');
let shortcuts = [...presetShortcuts]; // Initialize with presets

window.deleteShortcut = function(index, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    // Don't allow deletion of preset shortcuts
    if (index >= presetShortcuts.length) {
        shortcuts.splice(index, 1);
        renderShortcuts();
        chrome.storage.sync.set({ shortcuts });
    }
};

function createShortcutElement(shortcut, index) {
    const div = document.createElement('div');
    div.className = 'shortcut-wrapper';
    
    const a = document.createElement('a');
    a.href = shortcut.url;
    a.className = 'shortcut';
    a.target = '_blank';
    
    const iconSpan = document.createElement('span');
    iconSpan.className = 'shortcut-icon';
    iconSpan.textContent = shortcut.icon;
    
    const nameSpan = document.createElement('span');
    nameSpan.className = 'shortcut-name';
    nameSpan.textContent = shortcut.name;
    
    // Only add delete button for non-preset shortcuts
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
    
    a.appendChild(iconSpan);
    a.appendChild(nameSpan);
    div.appendChild(a);
    
    return div;
}

function renderShortcuts() {
    shortcutsGrid.innerHTML = '';
    shortcuts.forEach((shortcut, index) => {
        shortcutsGrid.appendChild(createShortcutElement(shortcut, index));
    });
}

addShortcutButton.addEventListener('click', () => {
    const name = prompt('Enter shortcut name:');
    const url = prompt('Enter shortcut URL:');
    if (name && url) {
        const formattedUrl = url.startsWith('http://') || url.startsWith('https://')
            ? url
            : `https://${url}`;
        shortcuts.push({ 
            name, 
            url: formattedUrl,
            icon: '🔗' // Default icon for custom shortcuts
        });
        renderShortcuts();
        chrome.storage.sync.set({ shortcuts });
    }
});

// Load saved shortcuts (will merge with presets)
chrome.storage.sync.get(['shortcuts'], function(result) {
    if (result.shortcuts) {
        // Merge presets with saved shortcuts, keeping presets at the beginning
        shortcuts = [...presetShortcuts, ...result.shortcuts.filter(s => 
            !presetShortcuts.some(ps => ps.url === s.url)
        )];
    }
    renderShortcuts();
});