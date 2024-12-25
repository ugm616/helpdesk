document.addEventListener("DOMContentLoaded", function() {
    const toggleIcon = document.getElementById('theme-toggle');
    const toggleIconSpan = toggleIcon.querySelector('span');
    const modal = document.getElementById("popupModal");
    const btn = document.getElementById("howToUseButton");
    const span = document.getElementById("closePopup");
    const searchInput = document.getElementById('locationSearch');
    const clearButton = document.getElementById('clearSearch');
    let debounceTimer;

    // Theme Toggle Functionality
    if (toggleIcon) {
        toggleIcon.addEventListener('click', switchTheme);
    }

    function switchTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        if (currentTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
            toggleIconSpan.textContent = '☀️';  // Set to sun emoji
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            toggleIconSpan.textContent = '🌙';  // Set to moon emoji
        }
    }

    // Check for saved theme preference
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme) {
        document.documentElement.setAttribute('data-theme', currentTheme);
        toggleIconSpan.textContent = currentTheme === 'dark' ? '🌙' : '☀️';
    }

    // Modal Functionality
    btn.onclick = function() {
        modal.classList.add("show");
    }

    span.onclick = function() {
        modal.classList.remove("show");
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.classList.remove("show");
        }
    }

    // Search Functionality
    const toggleClearButton = () => {
        clearButton.style.display = searchInput.value.length > 0 ? 'flex' : 'none';
    };

    clearButton.addEventListener('click', () => {
        searchInput.value = '';
        toggleClearButton();
        document.getElementById('searchResults').style.display = 'none';
        searchInput.focus(); // Keep focus on input after clearing
    });

    searchInput.addEventListener('input', (e) => {
        toggleClearButton();
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
            const searchTerm = e.target.value.trim();
            if (searchTerm.length === 0) {
                document.getElementById('searchResults').style.display = 'none';
                return;
            }
            const results = await searchLocations(searchTerm);
            displayResults(results);
        }, 300); // Debounce for 300ms to prevent too many searches
    });
});

// Function to load and search location data
async function searchLocations(searchTerm) {
    try {
        const response = await fetch('locationData.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Convert search term to lowercase for case-insensitive search
        searchTerm = searchTerm.toLowerCase();

        // Create an array to store all matching results
        const results = [];

        // If data is not an array, treat it as a single object
        const dataToProcess = Array.isArray(data) ? data : [data];

        // Loop through each object in the array
        dataToProcess.forEach(locationGroup => {
            // Ensure locationGroup is an object
            if (typeof locationGroup === 'object' && locationGroup !== null) {
                // Loop through each numbered key in the location group
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

// Function to display search results
function displayResults(results) {
    const resultsContainer = document.getElementById('searchResults');
    const resultsBody = document.getElementById('resultsBody');
    const noResults = document.getElementById('noResults');

    // Clear previous results
    resultsBody.innerHTML = '';

    if (results.length === 0) {
        resultsContainer.style.display = 'block';
        noResults.style.display = 'block';
        return;
    }

    // Hide no results message and show table
    noResults.style.display = 'none';
    resultsContainer.style.display = 'block';

    // Add results to table
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
