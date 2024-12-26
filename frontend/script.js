// Azure Maps key
const azureMapsKey = "";
const azureSearchUrl = "https://atlas.microsoft.com/search/nearby/json";

let map;

// Initialize map
function initializeMap(centerCoordinates) {
    map = new atlas.Map('map', {
        center: centerCoordinates,
        zoom: 12,
        authOptions: {
            authType: 'subscriptionKey',
            subscriptionKey: azureMapsKey
        }
    });

    // Add custom marker for user's location
    addUserMarker(centerCoordinates[0], centerCoordinates[1]);

    // Fetch and display nearby emergency services
    fetchNearbyEmergencyServices(centerCoordinates[1], centerCoordinates[0]);
}

// Add a custom red marker for user's location
function addUserMarker(longitude, latitude) {
    const userMarker = new atlas.HtmlMarker({
        position: [longitude, latitude],
        htmlContent: `
            <div style="text-align: center;">
                <div style="width: 15px; height: 15px; background-color: red; border-radius: 50%;"></div>
                <span style="font-size: 12px; color: black;"><strong>You're current loaction<strong/></span>
            </div>
        `,
    });

    map.markers.add(userMarker);
}

// Add a marker with service name on the map
function addServiceMarker(longitude, latitude, name) {
    const serviceMarker = new atlas.HtmlMarker({
        position: [longitude, latitude],
        htmlContent: `
            <div style="text-align: center;">
                <div style="width: 15px; height: 15px; background-color: blue; border-radius: 50%;"></div>
                <span style="font-size: 12px; color: black;"><strong>${name}<strong/></span>
            </div>
        `
    });

    map.markers.add(serviceMarker);
}

// Fetch nearby emergency services using Azure Maps API
function fetchNearbyEmergencyServices(latitude, longitude) {
    const radius = 5000; // Search within 5km
    const categorySet = "7321,7322,7323"; // Categories for hospitals, police stations, etc.

    const url = `${azureSearchUrl}?lat=${latitude}&lon=${longitude}&radius=${radius}&categorySet=${categorySet}&subscription-key=${azureMapsKey}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log("Nearby emergency services:", data);

            // Add markers for each service and display names on the map
            if (data.results) {
                data.results.forEach(service => {
                    const { lon, lat } = service.position;
                    const name = service.poi.name;

                    // Add marker for the service with name
                    addServiceMarker(lon, lat, name);
                });
            } else {
                console.error("No emergency services found.");
            }
        })
        .catch(error => {
            console.error("Error fetching emergency services:", error);
        });
}

// Save location to local storage
function saveUserLocation(longitude, latitude) {
    localStorage.setItem("userLocation", JSON.stringify({ longitude, latitude }));
    console.log("User location saved:", longitude, latitude);
}

// Get saved location from local storage
function getSavedLocation() {
    const location = localStorage.getItem("userLocation");
    return location ? JSON.parse(location) : null;
}

// Get user's current location
function getUserLocation() {
    const savedLocation = getSavedLocation();
    if (savedLocation) {
        console.log("Using saved location:", savedLocation);
        initializeMap([savedLocation.longitude, savedLocation.latitude]);
    } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const userCoordinates = [
                    position.coords.longitude,
                    position.coords.latitude
                ];
                console.log("User's coordinates:", userCoordinates);

                // Save user location and initialize map
                saveUserLocation(userCoordinates[0], userCoordinates[1]);
                initializeMap(userCoordinates);
            },
            error => {
                console.error("Geolocation failed:", error.message);
                // Fallback: Default coordinates
                const defaultCoordinates = [-122.33, 47.6]; // Seattle, WA
                initializeMap(defaultCoordinates);
            }
        );
    } else {
        console.error("Geolocation is not supported by this browser.");
        // Fallback: Default coordinates
        const defaultCoordinates = [-122.33, 47.6];
        initializeMap(defaultCoordinates);
    }
}

// Automatically get the user's location on page load
window.onload = getUserLocation;
