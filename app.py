from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from db import get_connection
from werkzeug.security import generate_password_hash, check_password_hash
import os, jwt
from datetime import datetime, timedelta, timezone
from functools import wraps
from pubnub.pnconfiguration import PNConfiguration
from pubnub.pubnub import PubNub

app = Flask(__name__)
CORS(app, resources={r"/accounts": {"origins": "http://127.0.0.1:8000"}})

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_EXP_MINUTES = int(os.getenv("JWT_EXP_MINUTES"))

pnconfig = PNConfiguration()
pnconfig.subscribe_key = os.getenv("PUBNUB_SUBSCRIBE_KEY")
pnconfig.publish_key = os.getenv("PUBNUB_PUBLISH_KEY")
pnconfig.user_id = os.getenv("PUBNUB_SERVICE_ID")

pubnub = PubNub(pnconfig)

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
        return jsonify({"error": "Email and password are required to enter"}), 400

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, full_name, email, password_hash, device_id FROM accounts WHERE email=%s",
                (email,),
            )
            user = cur.fetchone()

            if not user or not check_password_hash(user["password_hash"], password):
                return jsonify({"error": "User with specified credentials does not exist"}), 401

            payload = {
                "sub": str(user["id"]),
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

def require_auth(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return jsonify({"error": "missing token"}), 401

        token = auth.split(" ", 1)[1].strip()
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            request.user_id = payload["sub"]
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "token expired"}), 401
        except Exception:
            return jsonify({"error": "invalid token"}), 401

        return fn(*args, **kwargs)
    return wrapper

@app.get("/auth/me")
@require_auth
def me():
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT id, full_name, email, device_id FROM accounts WHERE id=%s",(request.user_id,),)
            user = cur.fetchone()

            if not user: return jsonify({"error": "user not found"}), 404

            return jsonify({
                "ok": True,
                "account": {
                    "id": user["id"],
                    "full_name": user["full_name"],
                    "email": user["email"],
                    "device_id": user["device_id"],
                }
            }), 200
    finally:
        conn.close()

def my_device(user_id: int) -> int | None:
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT device_id FROM accounts WHERE id=%s",
                (user_id,)
            )
            row = cur.fetchone()
            return row["device_id"] if row else None
    finally:
        conn.close()

def set_arm_status(device_id: int, arm: bool):
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE devices SET arm_status=%s WHERE id=%s",
                (1 if arm else 0, device_id),
            )
        conn.commit()
    finally:
        conn.close()

def is_armed(device_id: int) -> bool:
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT arm_status FROM devices WHERE id=%s", (device_id,))
            row = cur.fetchone()
            return bool(row["arm_status"]) if row else False
    finally:
        conn.close()

def insert_history(device_id: int, event: str, description: str = "", assume_armed: bool | None = None):
    armed = assume_armed if assume_armed is not None else is_armed(device_id)
    if not armed and event != "arm": return

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO history (device_id, created_at, event, description)
                VALUES (%s, NOW(), %s, %s)
                """,
                (device_id, event, description),
            )
        conn.commit()
    finally:
        conn.close()

@app.post("/devices/me/arm")
@require_auth
def arm_me():
    device_id = my_device(request.user_id)
    if device_id is None: return jsonify({"error": "No device assigned"}), 400

    set_arm_status(device_id, True)
    insert_history(device_id, "arm", "System armed by user")
    pubnub.publish().channel(f"device.{device_id}.cmd").message({"cmd": "arm"}).sync()
    return jsonify({"ok": True, "device_id": device_id, "armed": True}), 200

@app.post("/devices/me/disarm")
@require_auth
def disarm_me():
    device_id = my_device(request.user_id)
    if device_id is None: return jsonify({"error": "No device assigned"}), 400
    was_armed = is_armed(device_id)

    set_arm_status(device_id, False)
    insert_history(device_id, "disarm", "System disarmed by user", assume_armed=was_armed)
    pubnub.publish().channel(f"device.{device_id}.cmd").message({"cmd": "disarm"}).sync()
    return jsonify({"ok": True, "device_id": device_id, "armed": False}), 200

@app.route("/")
def auth():
    return render_template("auth/index.html")

@app.route("/app")
def dashboard():
    return render_template("app/index.html")

if __name__ == "__main__":
    app.run(port=8000, debug=True)