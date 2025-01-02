from flask import Flask, request, jsonify
import requests
from dotenv import load_dotenv
import os
from flask_cors import CORS

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Azure Maps API Configuration
AZURE_MAPS_KEY = os.getenv('AZURE_MAPS_KEY')  # Replace with your Azure Maps subscription key
AZURE_SEARCH_URL = "https://atlas.microsoft.com/search/nearby/json"

@app.route("/services", methods=["POST"])
def get_nearby_services():
    data = request.get_json()
    app.logger.debug(f"Received request data: {data}")

    latitude = data.get("latitude")
    longitude = data.get("longitude")
    radius = data.get("radius", 5000)

    if not latitude or not longitude:
        app.logger.error("Missing latitude or longitude")
        return jsonify({"error": "Latitude and Longitude are required"}), 400

    params = {
        "subscription-key": AZURE_MAPS_KEY,
        "lat": latitude,
        "lon": longitude,
        "radius": radius,
        "categorySet": "7321,7322,7323"
    }
    app.logger.debug(f"Sending request to Azure Maps API with params: {params}")

    try:
        response = requests.get(AZURE_SEARCH_URL, params=params)
        response.raise_for_status()
        azure_response = response.json()
        app.logger.debug(f"Raw Azure Maps API response: {azure_response}")

        # Transform Azure Maps response to frontend-friendly format
        services = []
        for result in azure_response.get("results", []):
            services.append({
                "name": result["poi"].get("name", "Unknown"),
                "type": result["poi"].get("categories", ["Unknown"])[0],
                "phone": result["poi"].get("phone", "N/A"),
                "latitude": result["position"]["lat"],
                "longitude": result["position"]["lon"],
                "distance": result.get("dist"),
                "address": result["address"].get("freeformAddress", "Unknown Address")
            })

        app.logger.debug(f"Transformed services: {services}")
        return jsonify(services)

    except requests.RequestException as e:
        app.logger.error(f"Error communicating with Azure Maps: {e}")
        return jsonify({"error": "Failed to fetch data"}), 500


    """
    Proxy endpoint for Azure Maps Nearby Search
    """
    data = request.get_json()

    latitude = data.get("latitude")
    longitude = data.get("longitude")
    radius = data.get("radius", 5000)
    categorySet = data.get("categorySet", "7321,7322,7323")

    if not latitude or not longitude:
        return jsonify({"error": "Latitude and Longitude are required"}), 400

    params = {
        "subscription-key": AZURE_MAPS_KEY,
        "lat": latitude,
        "lon": longitude,
        "radius": radius,
        "categorySet": categorySet
    }

    try:
        response = requests.get(AZURE_SEARCH_URL, params=params)
        response.raise_for_status()
        return jsonify(response.json())
    except requests.RequestException as e:
        return jsonify({"error": f"Azure Maps API Error: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(debug=True)

@app.route('/get-api-key', methods=['GET'])
def get_api_key():
    """
    Endpoint to securely provide the Azure Maps API key to the frontend.
    """
    if not AZURE_MAPS_KEY:
        return jsonify({"error": "API key not configured"}), 500

    return jsonify({"apiKey": AZURE_MAPS_KEY})


if __name__ == "__main__":
    app.run(debug=True)

@app.route("/")
def index():
    return jsonify({"message": "Welcome to the Emergency Services API"})

if __name__ == "__main__":
    app.run(debug=True)
