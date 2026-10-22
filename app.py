import os
import requests

from flask import Flask, request, jsonify, session
from flask_cors import CORS

from auth import (
    init_db,
    create_user,
    login_user,
    logout_user,
    is_logged_in,
    current_username,
)


# =========================================================
# FLASK APPLICATION
# =========================================================

app = Flask(__name__)

# Allow the GitHub Pages frontend to communicate with Render.
CORS(
    app,
    supports_credentials=True,
    origins=[
        "https://israel9281284-hue.github.io"
    ],
)

# Configure the session secret in Render's environment variables.
app.secret_key = os.environ.get("SESSION_SECRET")

if not app.secret_key:
    raise RuntimeError(
        "SESSION_SECRET is missing. "
        "Set it in your Render environment variables."
    )

# Allow secure session cookies between the frontend and backend.
app.config.update(
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="None",
    SESSION_COOKIE_PATH="/",
)

# Create the users database table if it does not exist.
init_db()


# =========================================================
# TAVILY CONFIGURATION
# =========================================================

TAVILY_API_URL = "https://api.tavily.com/search"


def tavily_search(query):
    """Search the web using the Tavily API."""

    api_key = os.environ.get("TAVILY_API_KEY")

    if not api_key:
        raise RuntimeError(
            "Tavily API key is not configured in Render."
        )

    response = requests.post(
        TAVILY_API_URL,
        json={
            "api_key": api_key,
            "query": query,
            "search_depth": "basic",
            "max_results": 5,
            "include_answer": True,
        },
        timeout=30,
    )

    response.raise_for_status()

    return response.json()


# =========================================================
# HELPER FUNCTIONS
# =========================================================

def require_login():
    """Return an error response if the user is not logged in."""

    if not is_logged_in():
        return jsonify({
            "success": False,
            "error": "Please log in first.",
            "message": "Please log in first.",
        }), 401

    return None


def get_error_message(error):
    """Return a readable error message."""

    if isinstance(error, requests.exceptions.Timeout):
        return "The search service took too long to respond."

    if isinstance(error, requests.exceptions.RequestException):
        return "Could not connect to the search service."

    return str(error)


# =========================================================
# HOME / HEALTH CHECK
# =========================================================

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "service": "Divi AI Backend",
        "status": "online",
        "endpoints": [
            "/api/register",
            "/api/login",
            "/api/auth/status",
            "/api/logout",
            "/api/web-search",
            "/api/voice-command",
        ],
    })


# =========================================================
# REGISTER
# =========================================================

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}

    username = str(data.get("username", "")).strip()
    password = str(data.get("password", ""))

    if not username or not password:
        return jsonify({
            "success": False,
            "error": "Please enter a username and password.",
            "message": "Please enter a username and password.",
        }), 400

    if len(username) < 3:
        return jsonify({
            "success": False,
            "error": "Username must contain at least 3 characters.",
            "message": "Username must contain at least 3 characters.",
        }), 400

    if len(password) < 8:
        return jsonify({
            "success": False,
            "error": "Password must contain at least 8 characters.",
            "message": "Password must contain at least 8 characters.",
        }), 400

    try:
        created = create_user(username, password)

        if not created:
            return jsonify({
                "success": False,
                "error": "That username may already exist.",
                "message": "That username may already exist.",
            }), 409

        return jsonify({
            "success": True,
            "message": "Account created successfully. You can now log in.",
        }), 201

    except Exception:
        app.logger.exception("Registration failed")

        return jsonify({
            "success": False,
            "error": "Registration failed. Please try again.",
            "message": "Registration failed. Please try again.",
        }), 500


# =========================================================
# LOGIN
# =========================================================

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}

    # Support the field names used by the existing frontend.
    username = str(
        data.get("username")
        or data.get("identifier")
        or ""
    ).strip()

    password = str(data.get("password", ""))

    if not username or not password:
        return jsonify({
            "success": False,
            "error": "Please enter your username and password.",
            "message": "Please enter your username and password.",
        }), 400

    try:
        if login_user(username, password):
            return jsonify({
                "success": True,
                "logged_in": True,
                "username": current_username(),
                "message": "Login successful.",
            }), 200

        return jsonify({
            "success": False,
            "logged_in": False,
            "error": "Incorrect username or password.",
            "message": "Incorrect username or password.",
        }), 401

    except Exception:
        app.logger.exception("Login failed")

        return jsonify({
            "success": False,
            "error": "A server error occurred while logging in.",
            "message": "A server error occurred while logging in.",
        }), 500


# =========================================================
# CHECK LOGIN STATUS
# =========================================================

@app.route("/api/auth/status", methods=["GET"])
def auth_status():
    logged_in = is_logged_in()

    return jsonify({
        "success": True,
        "logged_in": logged_in,
        "authenticated": logged_in,
        "username": current_username() if logged_in else None,
    }), 200


# =========================================================
# LOGOUT
# =========================================================

@app.route("/api/logout", methods=["POST"])
def logout():
    logout_user()

    response = jsonify({
        "success": True,
        "logged_in": False,
        "message": "You have been logged out.",
    })

    response.status_code = 200
    response.delete_cookie(
        "session",
        path="/",
        secure=True,
        httponly=True,
        samesite="None",
    )

    return response


# =========================================================
# WEB SEARCH
# =========================================================

@app.route("/api/web-search", methods=["POST"])
def web_search():
    login_error = require_login()

    if login_error:
        return login_error

    data = request.get_json(silent=True) or {}

    query = str(
        data.get("query")
        or data.get("search_query")
        or data.get("message")
        or ""
    ).strip()

    if not query:
        return jsonify({
            "success": False,
            "error": "Please enter something to search for.",
            "message": "Please enter something to search for.",
        }), 400

    try:
        search_data = tavily_search(query)

        answer = search_data.get("answer") or ""
        results = search_data.get("results") or []

        # Provide a readable answer if Tavily does not return one.
        if not answer and results:
            answer = "\n\n".join(
                (
                    f"{item.get('title', 'Search result')}\n"
                    f"{item.get('content', '')}\n"
                    f"Source: {item.get('url', '')}"
                )
                for item in results
            )

        return jsonify({
            "success": True,
            "query": query,
            "answer": answer,
            "response": answer,
            "results": results,
        }), 200

    except requests.exceptions.HTTPError as error:
        app.logger.error("Tavily HTTP error: %s", error)

        return jsonify({
            "success": False,
            "error": "The web search service rejected the request. "
                     "Check your Tavily API key and account.",
            "message": "Web search failed. Please try again.",
        }), 502

    except Exception:
        app.logger.exception("Web search failed")

        return jsonify({
            "success": False,
            "error": "Web search is temporarily unavailable.",
            "message": "Web search is temporarily unavailable.",
        }), 500


# =========================================================
# VOICE COMMAND
# =========================================================

@app.route("/api/voice-command", methods=["POST"])
def voice_command():
    login_error = require_login()

    if login_error:
        return login_error

    data = request.get_json(silent=True) or {}

    command = str(
        data.get("command")
        or data.get("query")
        or data.get("message")
        or ""
    ).strip()

    if not command:
        return jsonify({
            "success": False,
            "error": "Please provide a voice command.",
            "message": "Please provide a voice command.",
        }), 400

    try:
        # Use Tavily to find information related to the command.
        search_data = tavily_search(command)

        answer = search_data.get("answer") or ""
        results = search_data.get("results") or []

        if not answer and results:
            answer = "\n\n".join(
                (
                    f"{item.get('title', 'Search result')}\n"
                    f"{item.get('content', '')}\n"
                    f"Source: {item.get('url', '')}"
                )
                for item in results
            )

        return jsonify({
            "success": True,
            "status": "success",
            "input": command,
            "command": command,
            "response": answer,
            "answer": answer,
            "results": results,
        }), 200

    except Exception:
        app.logger.exception("Voice command failed")

        return jsonify({
            "success": False,
            "status": "error",
            "error": "Could not process the voice command.",
            "message": "Could not process the voice command.",
        }), 500


# =========================================================
# ERROR HANDLERS
# =========================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "success": False,
        "error": "Endpoint not found.",
    }), 404


@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({
        "success": False,
        "error": "This request method is not allowed.",
    }), 405


# =========================================================
# START SERVER
# =========================================================

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))

    app.run(
        host="0.0.0.0",
        port=port,
        debug=False,
    )
