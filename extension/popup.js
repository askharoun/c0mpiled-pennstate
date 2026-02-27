// popup.js

document.addEventListener('DOMContentLoaded', function() {
    const openDashButton = document.getElementById('openDash');

    // Add a click event listener to the "Open Dashboard" button
    openDashButton.addEventListener('click', () => {
        // chrome.tabs.create is a built-in Chrome Extension API 
        // It opens a new tab pointing to our dashboard.html file
        chrome.tabs.create({ 
            url: chrome.runtime.getURL('dashboard.html') 
        });
    });
});