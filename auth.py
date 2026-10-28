import os
import sqlite3

from flask import session
from werkzeug.security import generate_password_hash, check_password_hash


# Store the database alongside this Python file[cite: 3].
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE = os.path.join(BASE_DIR, "users.db")


def init_db():
    with sqlite3.connect(DATABASE) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT,
                password TEXT NOT NULL
            )
        """)
        conn.commit()


def create_user(username, password, email=""):
    username = username.strip()
    email = email.strip() if email else ""

    if not username or not password:
        return False

    try:
        hashed_password = generate_password_hash(password)

        with sqlite3.connect(DATABASE) as conn:
            conn.execute(
                "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
                (username, email, hashed_password)
            )
            conn.commit()

        return True

    except sqlite3.IntegrityError:
        return False


def login_user(username, password):
    username = username.strip()

    with sqlite3.connect(DATABASE) as conn:
        user = conn.execute(
            "SELECT id, username, password FROM users WHERE username = ?",
            (username,)
        ).fetchone()

    if user and check_password_hash(user[2], password):
        session["user_id"] = user[0]
        session["username"] = user[1]
        return True

    return False


def logout_user():
    session.clear()


def is_logged_in():
    return "user_id" in session


def current_username():
    return session.get("username")
