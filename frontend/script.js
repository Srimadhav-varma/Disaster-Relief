// Azure Maps Subscription Key
const azureMapsKey = ''; // Replace with your actual key
const backendUrl = 'http://127.0.0.1:5000/services'; // Update with your backend URL

let map;
// Trigger location fetching and map initialization on page load
window.onload = () => {
    getUserLocation();
};

function getUserLocation() {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const userLatitude = position.coords.latitude;
            const userLongitude = position.coords.longitude;

            console.log("User's location fetched:", { latitude: userLatitude, longitude: userLongitude });

            // Initialize the map centered on the user's location
            initializeMap([userLongitude, userLatitude]);
        },
        (error) => {
            console.error("Error fetching user location:", error);
            alert("Failed to get your location.");
        }
    );
}

// Function to initialize the Azure Map
function initializeMap(center) {
    if (!azureMapsKey || azureMapsKey === '<YOUR_AZURE_MAPS_SUBSCRIPTION_KEY>') {
        console.error("Azure Maps Key is missing or invalid.");
        alert("Azure Maps Key is required to load the map.");
        return;
    }

    try {
        // Initialize the map
        map = new atlas.Map('map', {
            center: center,
            zoom: 12,
            authOptions: {
                authType: 'subscriptionKey',
                subscriptionKey: azureMapsKey
            }
        });

        // Once the map is ready, add the user's location marker and fetch services
        map.events.add('ready', () => {
            addUserLocationMarker(center);
            fetchNearbyEmergencyServices(center[1], center[0]);
        });

        console.log("Map initialized successfully.");
    } catch (error) {
        console.error("Error initializing Azure Map:", error.message);
        alert("Failed to load the map. Please check the console for details.");
    }
}

// Function to add a red marker for the user's location
function addUserLocationMarker(location) {
    const userMarker = new atlas.HtmlMarker({
        color: 'red',
        position: location,
        htmlContent: '<div style="background-color: red; width: 15px; height: 15px; border-radius: 50%; border: 2px solid white;"></div>'
    });

    map.markers.add(userMarker);

    console.log("Red marker added at user's location:", location);
}

// Function to fetch nearby emergency services from the backend
async function fetchNearbyEmergencyServices(latitude, longitude) {
    console.log("Sending request to backend:", { latitude, longitude });

    try {
        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude, longitude, radius: 5000 })
        });

        console.log("Response status:", response.status);

        if (response.ok) {
            const services = await response.json();
            console.log("Services received from backend:", services);

            // Validate response
            if (Array.isArray(services) && services.length > 0) {
                displayEmergencyServices(services, { latitude, longitude });
            } else {
                alert("No emergency services found within a 5km radius.");
                console.error("Services array is empty or not valid:", services);
            }
        } else {
            console.error("Failed to fetch services. Status:", response.status, response.statusText);
            alert("Error fetching services from backend.");
        }
    } catch (error) {
        console.error("Error during fetch:", error.message);
        alert("Unable to connect to the server. Please check your network.");
    }
}

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
            htmlContent: '<div style="background-color: blue; width: 15px; height: 15px; border-radius: 50%; border: 2px solid white;"></div>'
        });
        map.markers.add(serviceMarker);
        console.log(`Added marker for service: ${service.name} at position: [${service.longitude}, ${service.latitude}]`);

        // Add service details to the ordered list
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            ${index + 1}. <strong>${service.name}</strong> (${service.type}) - 
            ${service.phone} (${service.distance.toFixed(2)/1000} km) 
            <br>Address: ${service.address}
        `;
        listContainer.appendChild(listItem);
        console.log(`Added list item for service: ${service.name}`);
    });

    console.log("Services displayed successfully.");
}


// Function to get user's current location and initialize the map
function getUserLocation() {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const userLatitude = position.coords.latitude;
            const userLongitude = position.coords.longitude;

            console.log("User location:", { userLatitude, userLongitude });

            // Initialize the map centered on the user's location
            initializeMap([userLongitude, userLatitude]);
        },
        (error) => {
            console.error("Error fetching user location:", error.message);
            alert("Failed to get your location. Please enable location services.");
        }
    );
}

// Trigger the location fetching and map initialization on page load
window.onload = () => {
    getUserLocation();
};
