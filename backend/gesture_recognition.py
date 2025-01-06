import cv2
import mediapipe as mp
import paho.mqtt.client as mqtt
import base64
import numpy as np
from PIL import Image
import io
import time
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Initialize MediaPipe
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=True,
    max_num_hands=1,
    min_detection_confidence=0.5
)
mp_drawing = mp.solutions.drawing_utils

# Track message statistics
message_count = 0
last_message_time = None

# MQTT callbacks
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        logging.info("Successfully connected to MQTT broker ✅")
        client.subscribe("hand/gesture/raw", qos=1)
    else:
        logging.error(f"Failed to connect to MQTT broker, return code: {rc} ❌")

def on_disconnect(client, userdata, rc):
    logging.warning("Disconnected from MQTT broker ❌")

def on_subscribe(client, userdata, mid, granted_qos):
    logging.info(f"Subscribed to topics with QoS: {granted_qos}")

def on_message(client, userdata, msg):
    global message_count, last_message_time
    
    message_count += 1
    current_time = time.time()
    
    if last_message_time:
        time_diff = current_time - last_message_time
        logging.info(f"Time since last message: {time_diff:.2f} seconds")
    
    last_message_time = current_time
    logging.info(f"Message #{message_count} received on topic: {msg.topic}")

    if msg.topic == "hand/gesture/raw":
        try:
            # Extract base64 data from data URL
            base64_data = msg.payload.decode().split(',')[1]
            logging.info("Successfully decoded base64 data")
            
            # Convert base64 image to numpy array
            img_data = base64.b64decode(base64_data)
            image = Image.open(io.BytesIO(img_data))
            image_np = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
            logging.info(f"Image converted successfully. Shape: {image_np.shape}")

            # Process the image
            results = process_image(image_np)
            
            # Publish results back
            if results:
                client.publish("hand/gesture/result", results, qos=1)
                logging.info(f"Published result: {results} ✅")
                
        except Exception as e:
            error_msg = f"Error processing image: {str(e)}"
            logging.error(error_msg)
            client.publish("hand/gesture/result", f"Error: {str(e)}", qos=1)

def process_image(image):
    logging.info("Processing image with MediaPipe...")
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = hands.process(image_rgb)
    
    if results.multi_hand_landmarks:
        hand_landmarks = results.multi_hand_landmarks[0]
        thumb_tip = hand_landmarks.landmark[mp_hands.HandLandmark.THUMB_TIP]
        thumb_ip = hand_landmarks.landmark[mp_hands.HandLandmark.THUMB_IP]
        
        gesture = "THUMBS UP" if thumb_tip.y < thumb_ip.y else "THUMBS DOWN"
        logging.info(f"Detected gesture: {gesture}")
        return gesture
    
    logging.info("No hand detected")
    return "NO HAND DETECTED"

def main():
    # Set up MQTT client
    client = mqtt.Client(client_id=f"python-mqtt-{time.time()}")
    
    # Add these lines for SSL/TLS
    client.tls_set()  # Enable SSL/TLS
    
    # Set up callbacks
    client.on_connect = on_connect
    client.on_message = on_message
    client.on_disconnect = on_disconnect
    client.on_subscribe = on_subscribe
    
    try:
        client.username_pw_set("hand_gesture", "Handgesture316")
        # Note: Using port 8883 for SSL
        client.connect("7f76165cd8c94c32be20a6cb488edc87.s1.eu.hivemq.cloud", 8883, 60)
        logging.info("Starting MQTT loop...")
        client.loop_forever()
    except Exception as e:
        logging.error(f"Failed to start MQTT client: {str(e)}")

if __name__ == "__main__":
    main()
