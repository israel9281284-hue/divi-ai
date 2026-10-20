import requests
import os
from flask import Flask, request, jsonify, session
from flask_cors import CORS


from auth import (
    init_db,
    create_user,
    login_user,
    logout_user,
    is_logged_in,
    current_username
)

app = Flask(__name__)

# Secret used to protect login sessions
app.secret_key = os.environ.get(
    "SESSION_SECRET",
    "change-this-secret-in-render"
)

CORS(app, supports_credentials=True)

# Create the users database
init_db()


# ==========================================
# HOME
# ==========================================

@app.route("/")
def home():
    return jsonify({
        "status": "online",
        "service": "Divi AI Backend",
        "model": "NVIDIA Nemotron via Nebius Serverless",
        "endpoint": "/api/voice-command"
    })


# ==========================================
# REGISTER
# ==========================================

@app.route("/api/register", methods=["POST"])
def register():

    data = request.get_json()

    if not data:
        return jsonify({"error": "No data provided"}), 400

    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or not password:
        return jsonify({
            "error": "Username and password are required"
        }), 400

    if len(username) < 3:
        return jsonify({
            "error": "Username must be at least 3 characters"
        }), 400

    if len(password) < 6:
        return jsonify({
            "error": "Password must be at least 6 characters"
        }), 400

    if create_user(username, password):

        return jsonify({
            "status": "success",
            "message": "Account created successfully"
        })

    return jsonify({
        "error": "Username already exists"
    }), 409


# ==========================================
# LOGIN
# ==========================================

@app.route("/api/login", methods=["POST"])
def login():

    data = request.get_json()

    if not data:
        return jsonify({"error": "No data provided"}), 400

    username = data.get("username", "").strip()
    password = data.get("password", "")

    if login_user(username, password):

        return jsonify({
            "status": "success",
            "message": "Login successful",
            "username": current_username()
        })

    return jsonify({
        "error": "Invalid username or password"
    }), 401


# ==========================================
# CHECK LOGIN
# ==========================================

@app.route("/api/auth/status", methods=["GET"])
def auth_status():

    if is_logged_in():

        return jsonify({
            "logged_in": True,
            "username": current_username()
        })

    return jsonify({
        "logged_in": False
    })


# ==========================================
# LOGOUT
# ==========================================

@app.route("/api/logout", methods=["POST"])
def logout():

    logout_user()

    return jsonify({
        "status": "success",
        "message": "Logged out successfully"
    })


# ==========================================
# DIVI AI
# ==========================================

@app.route("/api/voice-command", methods=["POST"])
def voice_command():
    if not is_logged_in():
        return jsonify({
            "error": "Please log in first"
        }), 401

    data = request.get_json(silent=True) or {}
    app.logger.info("DEBUG request data: %s", data)
    
    user_command = data.get("command", "").strip()

    if not user_command:
        return jsonify({
            "error": "Please enter a command."
        }), 400

    if len(user_command) > 500:
        return jsonify({
            "error": "Your command is too long."
        }), 400

    tavily_api_key = os.environ.get("TAVILY_API_KEY", "").strip()

    if not tavily_api_key:
        return jsonify({
            "error": "Web search is not configured yet."
        }), 503

    try:
        result = requests.post(
            "https://api.tavily.com/search",
            json={
                "api_key": tavily_api_key,
                "query": user_command,
                "search_depth": "basic",
                "max_results": 5,
                "include_answer": True
            },
            timeout=30
        )

        result.raise_for_status()
        search_data = result.json()

        return jsonify({
            "status": "success",
            "input": user_command,
            "response": (
                search_data.get("answer")
                or "Here are the search results I found."
            ),
            "results": [
                {
                    "title": item.get("title"),
                    "url": item.get("url"),
                    "content": item.get("content")
                }
                for item in search_data.get("results", [])
            ]
        })

    except requests.RequestException:
        app.logger.exception("Tavily voice search failed")
        return jsonify({
            "error": "Web search is temporarily unavailable."
        }), 502
# ==========================================
# START SERVER
# ==========================================

# ==========================================
# TAVILY WEB SEARCH
# ==========================================
@app.route("/api/web-search", methods=["POST"])
def web_search():
    tavily_api_key = os.environ.get("TAVILY_API_KEY", "").strip()

    if not tavily_api_key:
        return jsonify({
            "error": "Tavily API key is not configured."
        }), 503

    data = request.get_json(silent=True) or {}
    app.logger.info("DEBUG request data: %s", data)

    query = data.get("query", "").strip()

    if not query:
        return jsonify({
            "error": "Please enter something to search for."
        }), 400

    if len(query) > 500:
        return jsonify({
            "error": "Your search query is too long."
        }), 400

    try:
        result = requests.post(
            "https://api.tavily.com/search",
            json={
                "api_key": tavily_api_key,
                "query": query,
                "search_depth": "basic",
                "max_results": 5,
                "include_answer": True
            },
            timeout=30
        )

        result.raise_for_status()
        search_data = result.json()

        return jsonify({
            "status": "success",
            "query": query,
            "answer": search_data.get("answer"),
            "results": [
                {
                    "title": item.get("title"),
                    "url": item.get("url"),
                    "content": item.get("content")
                }
                for item in search_data.get("results", [])
            ]
        })

    except requests.RequestException:
        app.logger.exception("Tavily search request failed")
        return jsonify({
            "error": "Web search is temporarily unavailable."
        }), 502


if __name__ == "__main__":

    port = int(os.environ.get("PORT", 5000))

    app.run(
        host="0.0.0.0",
        port=port
    )
