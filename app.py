import os
from flask import Flask, request, jsonify, session
from flask_cors import CORS

from nebius_client import query_nebius
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

    data = request.get_json()

    if not data or "command" not in data:
        return jsonify({
            "error": "No command provided"
        }), 400

    user_command = data["command"]

    try:

        response = query_nebius(user_command)

        return jsonify({
            "status": "success",
            "input": user_command,
            "response": response
        })

    except Exception as e:

        return jsonify({
            "error": str(e)
        }), 500


# ==========================================
# START SERVER
# ==========================================

if __name__ == "__main__":

    port = int(os.environ.get("PORT", 5000))

    app.run(
        host="0.0.0.0",
        port=port
    )
