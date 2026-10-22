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
    current_username
)


# ==========================================
# APPLICATION CONFIGURATION
# ==========================================

```python
app = Flask(__name__)

app.secret_key = os.environ.get("SESSION_SECRET")

if not app.secret_key:
    raise RuntimeError(
        "SESSION_SECRET is missing. "
        "Set it in your Render environment variables."
    )

# Allow the browser to send the login session cookie.
app.config.update(
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="None",
    SESSION_COOKIE_PATH="/"
)
```
# ==========================================
# HOME / HEALTH CHECK
# ==========================================

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "name": "Divi AI Backend",
        "status": "online",
        "message": "Welcome to Divi AI!",
        "endpoints": [
            "/api/register",
            "/api/login",
            "/api/auth/status",
            "/api/logout",
            "/api/voice-command",
            "/api/web-search"
        ]
    })


# ==========================================
# REGISTER
# ==========================================

@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}

    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or not password:
        return jsonify({
            "error": "Username and password are required."
        }), 400

    if len(username) < 3:
        return jsonify({
            "error": "Username must be at least 3 characters."
        }), 400

    if len(password) < 6:
        return jsonify({
            "error": "Password must be at least 6 characters."
        }), 400

    if create_user(username, password):
        return jsonify({
            "status": "success",
            "message": "Account created successfully."
        }), 201

    return jsonify({
        "error": "Username already exists."
    }), 409


# ==========================================
# LOGIN
# ==========================================

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}

    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or not password:
        return jsonify({
            "error": "Enter your username and password."
        }), 400

    if login_user(username, password):
        return jsonify({
            "status": "success",
            "message": "Login successful.",
            "username": current_username()
        })

    return jsonify({
        "error": "Invalid username or password."
    }), 401


# ==========================================
# CHECK LOGIN STATUS
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
        "message": "Logged out successfully."
    })


# ==========================================
# TAVILY SEARCH HELPER
# ==========================================

def search_tavily(query):
    """
    Search the web through Tavily.

    Returns a dictionary containing an answer and sources.
    Raises ValueError for configuration or API errors.
    """

    api_key = os.environ.get("TAVILY_API_KEY", "").strip()

    if not api_key:
        app.logger.error(
            "TAVILY_API_KEY is missing from environment variables."
        )

        raise ValueError(
            "Web search is not configured. "
            "Add TAVILY_API_KEY to your Render environment variables."
        )

    try:
        response = requests.post(
            "https://api.tavily.com/search",
            json={
                "api_key": api_key,
                "query": query,
                "search_depth": "basic",
                "max_results": 5,
                "include_answer": True
            },
            timeout=30
        )

    except requests.Timeout as exc:
        app.logger.exception("Tavily request timed out.")

        raise ValueError(
            "The web search took too long. Please try again."
        ) from exc

    except requests.RequestException as exc:
        app.logger.exception("Could not connect to Tavily.")

        raise ValueError(
            "Could not connect to the web search service."
        ) from exc

    if not response.ok:
        app.logger.error(
            "Tavily returned HTTP %s: %s",
            response.status_code,
            response.text[:500]
        )

        if response.status_code in (401, 403):
            raise ValueError(
                "Tavily rejected the API key. "
                "Check that TAVILY_API_KEY is valid."
            )

        if response.status_code == 429:
            raise ValueError(
                "Tavily rate limit or usage limit reached. "
                "Check your Tavily account."
            )

        raise ValueError(
            "The web search service returned an error. "
            "Check your Tavily account and Render logs."
        )

    try:
        search_data = response.json()
    except ValueError as exc:
        raise ValueError(
            "The web search service returned invalid data."
        ) from exc

    raw_results = search_data.get("results", [])

    results = []

    for item in raw_results:
        results.append({
            "title": item.get("title", "Search result"),
            "url": item.get("url", ""),
            "content": item.get("content", "")
        })

    # Prefer Tavily's direct answer.
    answer = search_data.get("answer")

    # If no direct answer exists, build a readable response
    # from the available search snippets.
    if not answer and results:
        sections = []

        for index, item in enumerate(results[:3], start=1):
            title = item["title"]
            content = item["content"]

            if content:
                sections.append(
                    f"{index}. {title}\n{content}"
                )

        answer = "\n\n".join(sections)

    if not answer:
        answer = (
            "I couldn't find enough information to answer that "
            "question. Try using different search terms."
        )

    return {
        "answer": answer,
        "results": results
    }

# ==========================================
# CONVERSATION CONTEXT
# ==========================================

def build_contextual_query(query, history):
    """
    Use previous conversation messages to clarify follow-up
    questions before sending them to Tavily.
    """

    if not isinstance(history, list):
        return query, False

    # Find the most recent earlier user question.
    previous_question = None

    for message in reversed(history):
        if not isinstance(message, dict):
            continue

        role = message.get("role", "")
        content = message.get("content", "")

        if role != "user" or not isinstance(content, str):
            continue

        content = content.strip()

        if not content or content.lower() == query.lower():
            continue

        previous_question = content
        break

    if not previous_question:
        return query, False

    # Identify follow-up questions that need earlier context.
    words = set(query.lower().replace("?", "").replace(",", "").split())

    follow_up_phrases = (
        "tell me more",
        "explain it",
        "explain that",
        "what about",
        "how about",
        "why is that",
        "what does it",
        "give me an example",
        "give an example",
        "in simple words",
        "in simpler words",
        "continue",
        "elaborate",
    )

    follow_up_words = {
        "it",
        "that",
        "they",
        "them",
        "those",
        "these",
        "its",
        "their",
        "more",
        "another",
    }

    is_follow_up = (
        len(words) <= 7
        or bool(words.intersection(follow_up_words))
        or any(
            phrase in query.lower()
            for phrase in follow_up_phrases
        )
    )

    if not is_follow_up:
        return query, False

    contextual_query = (
        f"Previous question: {previous_question}\n"
        f"Follow-up question: {query}"
    )

    # Keep the search query within a reasonable length.
    contextual_query = contextual_query[:1000]

    return contextual_query, True
# ==========================================
# WEB SEARCH — MAIN FRONTEND ENDPOINT
# ==========================================
@app.route("/api/web-search", methods=["POST"])
def web_search():
    data = request.get_json(silent=True) or {}

    query = data.get("query") or data.get("question") or ""

    if not isinstance(query, str):
        return jsonify({
            "error": "Your question must be text."
        }), 400

    query = query.strip()

    if not query:
        return jsonify({
            "error": "Please enter a question."
        }), 400

    if len(query) > 500:
        return jsonify({
            "error": "Your question is too long. Keep it under 500 characters."
        }), 400

    # Accept conversation history from script.js.
    history = data.get("history")

    if not isinstance(history, list):
        history = data.get("messages", [])

    if not isinstance(history, list):
        history = []

    # Avoid processing an unnecessarily large history.
    history = history[-12:]

    # Clarify follow-up questions using earlier messages.
    search_query, context_used = build_contextual_query(
        query,
        history
    )

    try:
        result = search_tavily(search_query)

        return jsonify({
            "status": "success",
            "query": query,
            "search_query": search_query,
            "context_used": context_used,
            "answer": result["answer"],
            "results": result["results"]
        }), 200

    except ValueError as error:
        app.logger.warning(
            "Web search failed: %s",
            error
        )

        message = str(error)

        if "TAVILY_API_KEY" in message:
            return jsonify({
                "error": message
            }), 503

        if "too long" in message.lower():
            return jsonify({
                "error": message
            }), 504

        if "rate limit" in message.lower():
            return jsonify({
                "error": message
            }), 429

        if "api key" in message.lower():
            return jsonify({
                "error": message
            }), 502

        return jsonify({
            "error": message
        }), 502

    except Exception:
        app.logger.exception(
            "Unexpected web-search error."
        )

        return jsonify({
            "error": "An unexpected server error occurred. Please try again."
        }), 500
# ==========================================
# VOICE COMMAND
# ==========================================

@app.route("/api/voice-command", methods=["POST"])
def voice_command():
    if not is_logged_in():
        return jsonify({
            "error": "Please log in first."
        }), 401

    data = request.get_json(silent=True) or {}

    user_command = data.get("command", "")

    if not isinstance(user_command, str):
        return jsonify({
            "error": "Your command must be text."
        }), 400

    user_command = user_command.strip()

    if not user_command:
        return jsonify({
            "error": "Please enter a command."
        }), 400

    if len(user_command) > 500:
        return jsonify({
            "error": "Your command is too long."
        }), 400

    try:
        result = search_tavily(user_command)

        return jsonify({
            "status": "success",
            "command": user_command,
            "answer": result["answer"],
            "results": result["results"]
        }), 200

    except ValueError as error:
        app.logger.warning(
            "Voice-command search failed: %s",
            error
        )

        return jsonify({
            "error": str(error)
        }), 502

    except Exception:
        app.logger.exception(
            "Unexpected voice-command error."
        )

        return jsonify({
            "error": "The voice command could not be completed."
        }), 500


# ==========================================
# START SERVER
# ==========================================

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))

    app.run(
        host="0.0.0.0",
        port=port,
        debug=False
    )
