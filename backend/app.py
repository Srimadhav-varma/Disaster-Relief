from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

# Azure Maps API Configuration
AZURE_MAPS_KEY = ""  # Replace with your Azure Maps subscription key
AZURE_SEARCH_URL = "https://atlas.microsoft.com/search/nearby/json"

@app.route("/services", methods=["GET"])
def get_nearby_services():
    """
    Fetch nearby emergency services based on user's location.
    """
    # Get latitude and longitude from request query parameters
    latitude = request.args.get("lat", type=float)
    longitude = request.args.get("lon", type=float)
    radius = request.args.get("radius", default=5000, type=int)  # Default search radius: 5km

    if not latitude or not longitude:
        return jsonify({"error": "Latitude and Longitude are required"}), 400

    # Query parameters for Azure Maps Search Nearby API
    params = {
        "subscription-key": AZURE_MAPS_KEY,
        "lat": latitude,
        "lon": longitude,
        "radius": radius,
        "categorySet": "7321,7322,7323",  # Categories for hospitals, police, fire stations
    }

    try:
        # Make request to Azure Maps Search Nearby API
        response = requests.get(AZURE_SEARCH_URL, params=params)
        response.raise_for_status()  # Raise an exception for HTTP errors
        data = response.json()

        # Extract relevant fields from API response with safeguards
        services = []
        for result in data.get("results", []):
            poi = result.get("poi", {})
            name = poi.get("name", "Unknown")  # Default to "Unknown" if `name` is missing
            position = result.get("position", {})
            latitude = position.get("lat")
            longitude = position.get("lon")
            category = "Unknown"
            if "categorySet" in poi and len(poi["categorySet"]) > 0:
                category = poi["categorySet"][0].get("name", "Unknown")

            # Ensure all necessary fields are present before appending
            if latitude and longitude:
                services.append({
                    "name": name,
                    "latitude": latitude,
                    "longitude": longitude,
                    "category": category
                })

        return jsonify({"services": services, "count": len(services)})

    except requests.RequestException as e:
        return jsonify({"error": f"Failed to fetch data: {str(e)}"}), 500


@app.route("/")
def index():
    """
    Root endpoint to confirm the server is running.
    """
    return jsonify({"message": "Welcome to the Emergency Services API"})


if __name__ == "__main__":
    app.run(debug=True)
