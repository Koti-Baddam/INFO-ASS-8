const API_URL = 'https://zipbites.free.beeceptor.com/restaurants';
let restaurantsCache = JSON.parse(localStorage.getItem('restaurantsCache')) || [];

// Fetch and display top 10 restaurants on page load
document.addEventListener("DOMContentLoaded", async () => {
    await fetchRestaurantsFromAPI(); // Fetch restaurants once
    fetchTop10Restaurants(); // Display top 10
});

// Fetch restaurants from API and update local cache
async function fetchRestaurantsFromAPI() {
    if (restaurantsCache.length) return; // Prevent redundant API calls if cache is populated

    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error('Failed to fetch restaurants');
        }
        const data = await response.json();
        restaurantsCache = data; // Update cache
        localStorage.setItem('restaurantsCache', JSON.stringify(restaurantsCache)); // Save to localStorage
    } catch (error) {
        console.error('Error fetching restaurants:', error);
    }
}

// Fetch and display the top 10 restaurants from local cache
function fetchTop10Restaurants() {
    if (!restaurantsCache.length) {
        console.warn('No restaurants in cache. Fetching from API again.');
        return; // Avoid recursion; rely on initial fetch
    }

    const top10Restaurants = restaurantsCache
        .sort((a, b) => b.rating - a.rating) // Sort by rating in descending order
        .slice(0, 10); // Limit to top 10

    displayRestaurants(top10Restaurants); // Render on homepage
}

// Fetch and display filtered restaurants based on search criteria
function fetchRestaurants() {
    const zipcode = document.getElementById('zipcode').value.trim();
    const dietaryFilter = document.getElementById('dietary-filter').value.trim();

    let filteredRestaurants = [...restaurantsCache]; // Use local cache for filtering

    // Step 1: Filter by pincode
    if (zipcode) {
        const exactMatches = filteredRestaurants.filter(restaurant => restaurant.pincode === zipcode);
        const nearbyMatches = filteredRestaurants.filter(
            restaurant =>
                restaurant.pincode.startsWith(zipcode.slice(0, 2)) &&
                restaurant.pincode !== zipcode
        );
        filteredRestaurants = [...new Set([...exactMatches, ...nearbyMatches])]; // Combine matches
    }

    // Step 2: Filter by dietary options if specified
    if (dietaryFilter) {
        filteredRestaurants = filteredRestaurants.filter(restaurant =>
            restaurant.dietary_options.includes(dietaryFilter)
        );
    }

    // Step 3: Limit results to top 10 after filtering
    const limitedRestaurants = filteredRestaurants.slice(0, 10);

    // Display filtered restaurants
    displayRestaurants(limitedRestaurants);
}

// Display restaurants in the main section
function displayRestaurants(restaurants) {
    const restaurantList = document.getElementById('restaurant-list');
    restaurantList.innerHTML = ''; // Clear previous content

    if (restaurants.length === 0) {
        restaurantList.innerHTML = `<p>No restaurants found matching your criteria.</p>`;
        return;
    }

    restaurants.forEach(restaurant => {
        const restaurantItem = document.createElement('div');
        restaurantItem.classList.add('restaurant-item');

        // Add restaurant details and action buttons
        restaurantItem.innerHTML = `
            <div class="restaurant-name">
                <a href="details.html?id=${restaurant.id}">${restaurant.name}</a>
            </div>
            <div class="restaurant-details">
                <p><strong>Style:</strong> ${restaurant.style}</p>
                <p><strong>Rating:</strong> ${restaurant.rating}</p>
                <a href="review.html?id=${restaurant.id}" class="review-link">Submit a Review</a>
                <button onclick="window.location.href='edit.html?id=${restaurant.id}'" class="edit-button">Edit</button>
                <button onclick="deleteRestaurant(${restaurant.id})" class="delete-button">Delete</button>
            </div>
        `;

        restaurantList.appendChild(restaurantItem);
    });
}

// Add a new restaurant
function addRestaurant(newRestaurant) {
    fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRestaurant),
    })
        .then(response => {
            if (response.ok) {
                alert('Restaurant added successfully!');
                // Simulate adding to local cache
                newRestaurant.id = Math.max(...restaurantsCache.map(r => r.id), 0) + 1;
                restaurantsCache.push(newRestaurant);
                localStorage.setItem('restaurantsCache', JSON.stringify(restaurantsCache));
                fetchTop10Restaurants(); // Refresh homepage
                window.location.href = 'index.html'; // Redirect to homepage
            } else {
                throw new Error('Failed to add restaurant');
            }
        })
        .catch(error => console.error('Error adding restaurant:', error));
}

// Edit an existing restaurant
function editRestaurant(updatedRestaurant, restaurantId) {
    fetch(`${API_URL}/${restaurantId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedRestaurant),
    })
        .then(response => {
            if (response.ok) {
                alert('Restaurant updated successfully!');
                // Update local cache
                const index = restaurantsCache.findIndex(r => r.id === parseInt(restaurantId));
                if (index !== -1) {
                    restaurantsCache[index] = { ...restaurantsCache[index], ...updatedRestaurant };
                    localStorage.setItem('restaurantsCache', JSON.stringify(restaurantsCache));
                }
                fetchTop10Restaurants(); // Refresh homepage
                window.location.href = 'index.html'; // Redirect to homepage
            } else {
                throw new Error('Failed to update restaurant');
            }
        })
        .catch(error => console.error('Error updating restaurant:', error));
}

// Delete a restaurant
function deleteRestaurant(id) {
    fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
    })
        .then(response => {
            if (response.ok) {
                alert('Restaurant deleted successfully.');
                // Remove from local cache
                restaurantsCache = restaurantsCache.filter(restaurant => restaurant.id !== id);
                localStorage.setItem('restaurantsCache', JSON.stringify(restaurantsCache));
                fetchTop10Restaurants(); // Refresh homepage
            } else {
                alert('Failed to delete the restaurant.');
            }
        })
        .catch(error => console.error('Error deleting restaurant:', error));
}
