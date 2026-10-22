```python
import os
import sqlite3
from functools import wraps

import requests
from flask import Flask, jsonify, request, session
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

from auth import (
    init_db,
    create_user,
    login_user,
    logout_user,
    is_logged_in,
    current_username,
)

# ==================================================
# DIVI AI CONFIGURATION
# ==================================================

app = Flask(__name__)

app.secret_key = os.environ.get("SESSION_SECRET")

if not app.secret_key:
    raise RuntimeError(
        "SESSION_SECRET is missing. Add it in Render Environment Variables."
    )

FRONTEND_ORIGINS = [
    origin.strip()
    for origin in os.environ.get(
        "FRONTEND_ORIGINS",
        "https://divi-ai.onrender.com"
    ).split(",")
    if origin.strip()
]

CORS(
    app,
    supports_credentials=True,
    origins=FRONTEND_ORIGINS,
)

# Initialize the user database.
init_db()


# ==================================================
# HOME / HEALTH CHECK
# ==================================================

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "service": "Divi AI Backend",
        "status": "online",
        "endpoints": [
            "/api/register",
            "/api/login",
            "/api/logout",
            "/api/auth/status",
            "/api/web-search",
        ],
    }), 200


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


# ==================================================
# AUTHENTICATION STATUS
# ==================================================

@app.route("/api/auth/status", methods=["GET"])
def auth_status():
    if is_logged_in():
        return jsonify({
            "logged_in": True,
            "username": current_username(),
        }), 200

    return jsonify({"logged_in": False}), 200


# Also support the alternate status route if older
# frontend code calls /api/login/status.
@app.route("/api/login/status", methods=["GET"])
def login_status():
    return auth_status()


# ==================================================
# REGISTER
# ==================================================

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}

    username = str(data.get("username", "")).strip()
    password = str(data.get("password", ""))

    if not username or not password:
        return jsonify({
            "success": False,
            "error": "Username and password are required.",
        }), 400

    if len(username) < 3:
        return jsonify({
            "success": False,
            "error": "Username must be at least 3 characters.",
        }), 400

    if len(password) < 8:
        return jsonify({
            "success": False,
            "error": "Password must be at least 8 characters.",
        }), 400

    try:
        result = create_user(username, password)

        if result is False or result is None:
            return jsonify({
                "success": False,
                "error": "Username may already exist.",
            }), 409

        return jsonify({
            "success": True,
            "message": "Account created successfully. You can now log in.",
        }), 201

    except sqlite3.IntegrityError:
        return jsonify({
            "success": False,
            "error": "That username is already registered.",
        }), 409

    except Exception:
        app.logger.exception("Registration failed")
        return jsonify({
            "success": False,
            "error": "Registration failed. Please try again.",
        }), 500


# ==================================================
# LOGIN
# ==================================================

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}

    username = str(data.get("username", "")).strip()
    password = str(data.get("password", ""))

    if not username or not password:
        return jsonify({
            "success": False,
            "error": "Username and password are required.",
        }), 400

    try:
        result = login_user(username, password)

        if not result:
            return jsonify({
                "success": False,
                "error": "Invalid username or password.",
            }), 401

        session.clear()
        session["username"] = username
        session.permanent = True

        return jsonify({
            "success": True,
            "logged_in": True,
            "username": username,
            "message": "Login successful.",
        }), 200

    except Exception:
        app.logger.exception("Login failed")
        return jsonify({
            "success": False,
            "error": "Login failed. Please try again.",
        }), 500


# ==================================================
# LOGOUT
# ==================================================

@app.route("/api/logout", methods=["POST"])
def logout():
    try:
        logout_user()
    finally:
        session.clear()

    return jsonify({
        "success": True,
        "logged_in": False,
        "message": "Logged out successfully.",
    }), 200


# ==================================================
# WEB SEARCH
# ==================================================

@app.route("/api/web-search", methods=["POST"])
def web_search():
    if not is_logged_in():
        return jsonify({
            "success": False,
            "error": "Please log in first.",
        }), 401

    data = request.get_json(silent=True) or {}

    query = str(
        data.get("query")
        or data.get("q")
        or data.get("message")
        or ""
    ).strip()

    if not query:
        return jsonify({
            "success": False,
            "error": "Please enter something to search for.",
        }), 400

    api_key = os.environ.get("TAVILY_API_KEY")

    if not api_key:
        return jsonify({
            "success": False,
            "error": "Tavily API key is not configured.",
        }), 503

    try:
        response = requests.post(
            "https://api.tavily.com/search",
            json={
                "api_key": api_key,
                "query": query,
                "search_depth": "basic",
                "max_results": 5,
                "include_answer": True,
            },
            timeout=30,
        )

        if not response.ok:
            app.logger.error(
                "Tavily returned HTTP %s",
                response.status_code,
            )
            return jsonify({
                "success": False,
                "error": "The web search service could not complete your request.",
            }), 502

        result = response.json()

        return jsonify({
            "success": True,
            "query": query,
            "answer": result.get("answer") or "",
            "results": result.get("results", []),
        }), 200

    except requests.RequestException:
        app.logger.exception("Web search request failed")
        return jsonify({
            "success": False,
            "error": "Unable to connect to the web search service.",
        }), 502

    except Exception:
        app.logger.exception("Unexpected web search error")
        return jsonify({
            "success": False,
            "error": "An unexpected search error occurred.",
        }), 500


# ==================================================
# ERROR HANDLERS
# ==================================================

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
        "error": "This HTTP method is not supported for this endpoint.",
    }), 405


# ==================================================
# LOCAL DEVELOPMENT
# ==================================================

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
        debug=False,
    )
```
