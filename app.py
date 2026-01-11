from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from db import get_connection
from werkzeug.security import generate_password_hash, check_password_hash
import os, jwt
from datetime import datetime, timedelta, timezone

app = Flask(__name__)
CORS(app, resources={r"/accounts": {"origins": "http://127.0.0.1:8000"}})

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_EXP_MINUTES = int(os.getenv("JWT_EXP_MINUTES"))

@app.post("/auth/signup")
def signup():
    data = request.get_json()

    full_name = data.get("full_name")
    email = data.get("email")
    password = data.get("password")

    if not full_name or not email or not password:
        return jsonify({"error": "full_name, email and password are required"}), 400

    password_hash = generate_password_hash(password)

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id FROM accounts WHERE email = %s", (email,))
            if cur.fetchone():
                return jsonify({"error": "email already exists"}), 409

            cur.execute(
                """
                INSERT INTO accounts (full_name, email, password_hash)
                VALUES (%s, %s, %s)
                """,
                (full_name, email, password_hash)
            )

            return jsonify({
                "message": "account created",
                "account_id": cur.lastrowid
            }), 201
    finally:
        conn.close()

@app.post("/auth/login")
def login():
    data = request.get_json(silent=True) or {}
    email = data.get("email").strip().lower()
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, full_name, email, password_hash, device_id FROM accounts WHERE email=%s",
                (email,),
            )
            user = cur.fetchone()

            if not user or not check_password_hash(user["password_hash"], password):
                return jsonify({"error": "invalid email or password"}), 401

            payload = {
                "sub": user["id"],
                "email": user["email"],
                "exp": datetime.now(timezone.utc) + timedelta(minutes=JWT_EXP_MINUTES),
                "iat": datetime.now(timezone.utc),
            }
            token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")

            return jsonify({
                "message": "login ok",
                "token": token,
                "account": {
                    "id": user["id"],
                    "full_name": user["full_name"],
                    "email": user["email"],
                    "device_id": user["device_id"],
                }
            }), 200
    finally:
        conn.close()

@app.route("/")
def auth():
    return render_template("auth/index.html")

@app.route("/app")
def dashboard():
    return render_template("app/index.html")

if __name__ == "__main__":
    app.run(port=8000, debug=True)