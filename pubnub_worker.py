import os, time
from dotenv import load_dotenv

from pubnub.pnconfiguration import PNConfiguration
from pubnub.pubnub import PubNub
from pubnub.callbacks import SubscribeCallback
from pubnub.enums import PNStatusCategory

load_dotenv()

CHANNEL = os.getenv("PUBNUB_CHANNEL")
SERVICE_ID = os.getenv("PUBNUB_SERVICE_ID")
pnconfig = PNConfiguration()
pnconfig.subscribe_key = os.getenv("PUBNUB_SUBSCRIBE_KEY")
pnconfig.publish_key = os.getenv("PUBNUB_PUBLISH_KEY")
pnconfig.user_id = SERVICE_ID
pubnub = PubNub(pnconfig)

class DoorListener(SubscribeCallback):
    def message(self, pubnub, event):
        msg = event.message
        print("Received:", msg)

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
