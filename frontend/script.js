const backendUrl = 'http://127.0.0.1:5000'; 
let map;
let azureMapsToken = null;

// Fetch Azure Maps token from backend
async function getAzureMapsToken() {
    try {
        const response = await fetch(`${backendUrl}/api/maps-token`);
        if (!response.ok) throw new Error('Failed to fetch maps token');
        const data = await response.json();
        return data.token;
    } catch (error) {
        console.error('Error fetching Azure Maps token:', error);
        throw error;
    }
}

// Initialize on page load
window.onload = async () => {
    try {
        // Get token first
        azureMapsToken = await getAzureMapsToken();
        getUserLocation();
    } catch (error) {
        alert('Failed to initialize map services. Please try again later.');
    }
};

// Function to the users loaction
function getUserLocation() {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }

    // Watch the user's location and update it dynamically
    const watchId = navigator.geolocation.watchPosition(
        (position) => {
            const userLatitude = position.coords.latitude;
            const userLongitude = position.coords.longitude;

            console.log("User's location updated:", { latitude: userLatitude, longitude: userLongitude });

            // Update the map or any other logic with the new user location
            initializeMap([userLongitude, userLatitude]);
        },
        (error) => {
            console.error("Error fetching user location:", error);
            alert("Failed to track your location.");
        },
        {
            enableHighAccuracy: true, // Use high-accuracy mode (e.g., GPS)
            maximumAge: 0,           // No cached positions
            timeout: 10000           // Timeout for location retrieval
        }
    );

    // Optionally, allow the user to stop tracking their location
    return function stopTracking() {
        navigator.geolocation.clearWatch(watchId);
        console.log("Stopped tracking user location.");
    };
}

// Function to initialize the Azure Map
function initializeMap(center) {
    if (!azureMapsToken) {
        console.error("Azure Maps Token is not available.");
        alert("Failed to initialize map. Please refresh the page.");
        return;
    }

    try {
        map = new atlas.Map('map', {
            center: center,
            zoom: 12,
            authOptions: {
                authType: 'subscriptionKey',
                subscriptionKey: azureMapsToken
            }
        });

        map.events.add('ready', () => {
            addUserLocationMarker(center);
            fetchNearbyEmergencyServices(center[1], center[0]);
        });

    } catch (error) {
        console.error("Error initializing Azure Map:", error);
        alert("Failed to load the map. Please try again later.");
    }
}

// Function to add a red marker for the user's location
function addUserLocationMarker(location) {
    const userMarker = new atlas.HtmlMarker({
        color: 'red',
        position: location,
        htmlContent: 
        `   <div style="
                display: flex; 
                align-items: center; 
                flex-direction: column; 
                text-align: center;">
                <div style="
                    background-color: red; 
                    width: 15px; 
                    height: 15px; 
                    border-radius: 50%; 
                    border: 2px solid white;
                "></div>
                <div style="
                    margin-top: 5px; 
                    background-color: white; 
                    padding: 2px 5px; 
                    border-radius: 3px; 
                    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.2); 
                    font-size: 12px;
                ">
                 <strong>You are here</strong>
                </div>
            </div>`
    });

    map.markers.add(userMarker);

    console.log("Red marker added at user's location:", location);
}

// Function to fetch nearby emergency services from the backend
async function fetchNearbyEmergencyServices(latitude, longitude) {
    try {
        const response = await fetch(`${backendUrl}/api/services`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude, longitude, radius: 5000 })
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const services = await response.json();
        
        if (Array.isArray(services) && services.length > 0) {
            displayEmergencyServices(services, { latitude, longitude });
        } else {
            alert("No emergency services found within a 5km radius.");
        }
    } catch (error) {
        console.error("Error fetching services:", error);
        alert("Failed to fetch nearby services. Please try again later.");
    }
}


// Function to display blue markers of emergency services nearby in order 
function displayEmergencyServices(services, userLocation) {
    console.log("Displaying services on map and list:", services);

    // Clear previous markers and list items
    //map.markers.clear(); // Clear all existing markers on the map
    
    
    const listContainer = document.getElementById('services-list');
    listContainer.innerHTML = ''; // Clear the previous list items

    // Sort services by distance
    services.sort((a, b) => a.distance - b.distance);

    services.forEach((service, index) => {
        // Add a blue marker for each service
        const serviceMarker = new atlas.HtmlMarker({
            position: [service.longitude, service.latitude],
            htmlContent: 
            `   <div style="
                display: flex; 
                align-items: center; 
                flex-direction: column; 
                text-align: center;">
                <div style="
                    background-color: blue; 
                    width: 15px; 
                    height: 15px; 
                    border-radius: 50%; 
                    border: 2px solid white;
                "></div>
                <div style="
                    margin-top: 5px; 
                    background-color: white; 
                    padding: 2px 5px; 
                    border-radius: 3px; 
                    box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.2); 
                    font-size: 12px;
                ">
                    ${service.name}
                </div>
            </div>`
        });
        map.markers.add(serviceMarker);
        console.log(`Added marker for service: ${service.name} at position: [${service.longitude}, ${service.latitude}]`);
    
        // Add service details to the ordered list
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            ${index + 1}. <strong>${service.name}</strong> (${service.type}) - 
            ${service.phone} (${(service.distance /1000).toFixed(2)} km)
            <br>Address: ${service.address}
        `;
        listContainer.appendChild(listItem);
        console.log(`Added list item for service: ${service.name}`);
    });

    console.log("Services displayed successfully.");
}

