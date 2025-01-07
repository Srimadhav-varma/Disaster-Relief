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
AZURE_MAPS_KEY = os.getenv('AZURE_MAPS_KEY')
AZURE_SEARCH_URL = "https://atlas.microsoft.com/search/nearby/json"

@app.route("/")
def index():
    return jsonify({"message": "Welcome to the Emergency Services API"})

@app.route("/api/maps-token", methods=["GET"])
def get_maps_token():
    """Endpoint to securely provide Azure Maps token"""
    if not AZURE_MAPS_KEY:
        return jsonify({"error": "Azure Maps key not configured"}), 500
    return jsonify({
        "token": AZURE_MAPS_KEY
    })

@app.route("/api/services", methods=["POST"])
def get_nearby_services():
    """Proxy endpoint for Azure Maps Nearby Search"""
    data = request.get_json()
    
    latitude = data.get("latitude")
    longitude = data.get("longitude")
    radius = data.get("radius", 5000)

    if not latitude or not longitude:
        return jsonify({"error": "Latitude and Longitude are required"}), 400

    params = {
        "subscription-key": AZURE_MAPS_KEY,
        "lat": latitude,
        "lon": longitude,
        "radius": radius,
        "categorySet": "7321,7322,7323"
    }

    try:
        response = requests.get(AZURE_SEARCH_URL, params=params)
        response.raise_for_status()
        azure_response = response.json()

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

        return jsonify(services)

    except requests.RequestException as e:
        return jsonify({"error": f"Azure Maps API Error: {str(e)}"}), 500

if __name__ == "__main__":
    app.run(debug=True)