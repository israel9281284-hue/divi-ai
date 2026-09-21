import os
import sqlite3
from flask import session
from werkzeug.security import generate_password_hash, check_password_hash

DATABASE = "users.db"


def init_db():
    conn = sqlite3.connect(DATABASE)

    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL
        )
    """)

    conn.commit()
    conn.close()


def create_user(username, password):
    conn = sqlite3.connect(DATABASE)

    try:
        hashed_password = generate_password_hash(password)

        conn.execute(
            "INSERT INTO users (username, password) VALUES (?, ?)",
            (username, hashed_password)
        )

        conn.commit()
        return True

    except sqlite3.IntegrityError:
        return False

    finally:
        conn.close()


def login_user(username, password):
    conn = sqlite3.connect(DATABASE)

    user = conn.execute(
        "SELECT * FROM users WHERE username = ?",
        (username,)
    ).fetchone()

    conn.close()

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
