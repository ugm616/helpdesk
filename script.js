document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM fully loaded and parsed");
    const toggleIcon = document.getElementById('theme-toggle');
    const toggleIconSpan = toggleIcon ? toggleIcon.querySelector('span') : null;
    const modal = document.getElementById("popupModal");
    const btn = document.getElementById("howToUseButton");
    const span = document.getElementById("closePopup");
    const searchInput = document.getElementById('locationSearch');
    const clearButton = document.getElementById('clearSearch');
    let debounceTimer;
    let themeState = localStorage.getItem('theme') || 'light';

    function applyClass() {
        document.documentElement.dataset.theme = themeState;
    }

    function switchTheme() {
        themeState = themeState === 'dark' ? 'light' : 'dark';
        localStorage.setItem('theme', themeState);
        applyClass();
        if (toggleIconSpan) toggleIconSpan.textContent = themeState === 'dark' ? '\ud83c\udf19' : '\u2600\ufe0f';
    }

    if (toggleIcon) {
        toggleIcon.addEventListener('click', switchTheme);
    }

    applyClass();

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
                console.log("Searching for:", searchTerm);
                const results = await searchLocations(searchTerm);
                displayResults(results);
            }, 300);
        });
    }
});

async function searchLocations(searchTerm) {
    try {
        const response = await fetch('locations.csv');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const textData = await response.text();
        console.log("CSV data fetched:", textData);
        const data = parseCSV(textData);

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

        console.log("Search results:", results);
        return results;
    } catch (error) {
        console.error('Error loading or searching location data:', error);
        alert('Error loading location data: ' + error.message);
        return [];
    }
}

function parseCSV(text) {
    const rows = text.split('\n');
    const headers = rows[0].split(',');
    console.log("CSV headers:", headers);

    return rows.slice(1).map(row => {
        const values = row.split(',');
        const obj = headers.reduce((obj, header, index) => {
            obj[header.trim()] = values[index] ? values[index].trim() : '';
            return obj;
        }, {});
        console.log("Parsed row:", obj);
        return obj;
    });
}

function displayResults(results) {
    const searchResults = document.getElementById('searchResults');
    const resultsBody = document.getElementById('resultsBody');
    const noResults = document.getElementById('noResults');

    // Clear previous results
    resultsBody.innerHTML = '';

    if (results.length === 0) {
        searchResults.style.display = 'block';
        noResults.style.display = 'block';
        return;
    }

    // Hide the no results message and show table
    noResults.style.display = 'none';
    searchResults.style.display = 'block';

    // Add results to table
    results.forEach(location => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-label="Room Number">${location['Room Num'] || '-'}</td>
            <td data-label="Description">${location['Description'] || '-'}</td>
            <td data-label="Floor">${location['Floor'] || '-'}</td>
            <td data-label="Wing">${location['Wing'] || '-'}</td>
            <td data-label="Department">${location['Department'] || '-'}</td>
        `;
        resultsBody.appendChild(row);
    });

    console.log("Displayed results:", results);
}
