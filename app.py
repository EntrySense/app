from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from db import get_connection
from werkzeug.security import generate_password_hash

app = Flask(__name__)
CORS(app, resources={r"/accounts": {"origins": "http://127.0.0.1:8000"}})

@app.get("/ping")
def ping():
    return jsonify({"ok": True})

@app.post("/accounts")
def create_account():
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

@app.route("/")
def auth():
    return render_template("auth/index.html")

@app.route("/app")
def dashboard():
    return render_template("app/index.html")

if __name__ == "__main__":
    app.run(port=8000, debug=True)