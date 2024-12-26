document.addEventListener("DOMContentLoaded", function() {
    const toggleIcon = document.getElementById('theme-toggle');
    const toggleIconSpan = toggleIcon ? toggleIcon.querySelector('span') : null;
    const bgToggleIcon = document.getElementById('bg-toggle');
    const bgToggleIconSpan = bgToggleIcon ? bgToggleIcon.querySelector('span') : null;
    const modal = document.getElementById("popupModal");
    const btn = document.getElementById("howToUseButton");
    const span = document.getElementById("closePopup");
    const searchInput = document.getElementById('locationSearch');
    const clearButton = document.getElementById('clearSearch');
    const bgContainer = document.querySelector('.background-image-container');
    let debounceTimer;
    let themeState = localStorage.getItem('theme') || 'light';
    let bgState = localStorage.getItem('bgImage') || 'on';

    function applyClass() {
        document.documentElement.className = `bg-${bgState}-${themeState}`;
    }

    function switchTheme() {
        themeState = themeState === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', themeState);
        applyClass();
        if (toggleIconSpan) toggleIconSpan.textContent = themeState === 'dark' ? '🌙' : '☀️';
    }

    function toggleBackgroundImage() {
        bgState = bgState === 'on' ? 'off' : 'on';
        localStorage.setItem('bgImage', bgState);
        applyClass();
        if (bgToggleIconSpan) bgToggleIconSpan.textContent = bgState === 'on' ? '🖼️' : '🚫';
    }

    if (toggleIcon) {
        toggleIcon.addEventListener('click', switchTheme);
    }

    if (bgToggleIcon) {
        bgToggleIcon.addEventListener('click', toggleBackgroundImage);
    }

    applyClass();
    
    // Existing code for modal, search and other functionalities
    bgContainer.style.backgroundImage = getComputedStyle(document.documentElement).getPropertyValue('--background-image').trim();

    if (btn) {
        btn.onclick = function() {
            modal.classList.add("show");
        }
    }

    if (span) {
        span.onclick = function() {
            modal.classList.remove("show");
        }
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.classList.remove("show");
        }
    }

    if (clearButton && searchInput) {
        const toggleClearButton = () => {
            clearButton.style.display = searchInput.value.length > 0 ? 'flex' : 'none';
        };

        clearButton.addEventListener('click', () => {
            searchInput.value = '';
            toggleClearButton();
            document.getElementById('searchResults').style.display = 'none';
            searchInput.focus();
        });

        searchInput.addEventListener('input', (e) => {
            toggleClearButton();
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(async () => {
                const searchTerm = e.target.value.trim().toUpperCase();
                if (searchTerm.length === 0) {
                    document.getElementById('searchResults').style.display = 'none';
                    return;
                }
                const results = await searchLocations(searchTerm);
                displayResults(results);
            }, 300);
        });
    }
});

async function searchLocations(searchTerm) {
    try {
        const response = await fetch('locationData.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        searchTerm = searchTerm.toLowerCase();
        const results = [];
        const dataToProcess = Array.isArray(data) ? data : [data];

        dataToProcess.forEach(locationGroup => {
            if (typeof locationGroup === 'object' && locationGroup !== null) {
                Object.entries(locationGroup).forEach(([key, location]) => {
                    if (location && typeof location === 'object') {
                        if (
                            location['Room Num']?.toLowerCase().includes(searchTerm) ||
                            location['Description']?.toLowerCase().includes(searchTerm) ||
                            location['Wing']?.toLowerCase().includes(searchTerm) ||
                            (location['Department'] && location['Department'].toLowerCase().includes(searchTerm))
                        ) {
                            results.push(location);
                        }
                    }
                });
            }
        });

        return results;
    } catch (error) {
        console.error('Error loading or searching location data:', error);
        alert('Error loading location data: ' + error.message);
        return [];
    }
}

function displayResults(results) {
    const resultsContainer = document.getElementById('searchResults');
    const resultsBody = document.getElementById('resultsBody');
    const noResults = document.getElementById('noResults');

    resultsBody.innerHTML = '';

    if (results.length === 0) {
        resultsContainer.style.display = 'block';
        noResults.style.display = 'block';
        return;
    }

    noResults.style.display = 'none';
    resultsContainer.style.display = 'block';

    results.forEach(location => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-label="Room">${location['Room Num']}</td>
            <td data-label="Description">${location['Description']}</td>
            <td data-label="Floor">${location['Floor']}</td>
            <td data-label="Wing">${location['Wing']}</td>
            <td data-label="Department">${location['Department'] || '-'}</td>
        `;
        resultsBody.appendChild(row);
    });
}
