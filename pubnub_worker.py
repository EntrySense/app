import os, time
from dotenv import load_dotenv
from pubnub.pnconfiguration import PNConfiguration
from pubnub.pubnub import PubNub
from pubnub.callbacks import SubscribeCallback
from pubnub.enums import PNStatusCategory
from db import get_connection
from datetime import datetime

load_dotenv()

CHANNEL = os.getenv("PUBNUB_CHANNEL")
SERVICE_ID = os.getenv("PUBNUB_SERVICE_ID")
pnconfig = PNConfiguration()
pnconfig.subscribe_key = os.getenv("PUBNUB_SUBSCRIBE_KEY")
pnconfig.publish_key = os.getenv("PUBNUB_PUBLISH_KEY")
pnconfig.user_id = SERVICE_ID
pubnub = PubNub(pnconfig)

def insert_history(device_id: int, event: str, ts: str, description: str):
    sql = """
        INSERT INTO history (device_id, created_at, event, description)
        VALUES (%s, %s, %s, %s)
    """
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, (device_id, ts, event, description))
    finally:
        conn.close()

def to_mysql_datetime(ts_iso: str | None) -> str:
    if not ts_iso:
        return datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    dt = datetime.fromisoformat(ts_iso.replace("Z", "+00:00"))
    return dt.astimezone().replace(tzinfo=None).strftime("%Y-%m-%d %H:%M:%S")

class DoorListener(SubscribeCallback):
    def message(self, pubnub, event):
        msg = event.message

        device_id = int(msg.get("device_id"))
        evt = msg.get("event")
        ts = msg.get("ts")

        if not isinstance(device_id, int):
            print("Ignored: device_id must be int:", msg)
            return
        if evt not in ("open", "close"):
            print("Ignored: invalid event:", msg)
            return

        mysql_ts = to_mysql_datetime(ts)

        try:
            insert_history(
                device_id=device_id,
                event=evt,
                ts=mysql_ts,
                description=f"Door {'opened' if evt == 'open' else 'closed'}"
            )
            print("Saved to DB:", msg)
        except Exception as e:
            print("DB error:", e, "msg:", msg)

    def status(self, pubnub, status):
        if status.category == PNStatusCategory.PNConnectedCategory:
            print("Connected to PubNub")
        elif status.category == PNStatusCategory.PNUnexpectedDisconnectCategory:
            print("Disconnected unexpectedly")
        elif status.category == PNStatusCategory.PNReconnectedCategory:
            print("Reconnected")

pubnub.add_listener(DoorListener())
pubnub.subscribe().channels(CHANNEL).execute()

while True:
    time.sleep(60)
