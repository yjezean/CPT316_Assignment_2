hand-gesture-project/
├── frontend/
│ ├── index.html
│ ├── style.css
│ └── script.js
│
└── backend/
├── gesture_recognition.py
└── requirements.txt

## Setup

1. Install Python requirements:
bash
python -m venv venv
source venv/bin/activate # On Windows: venv\Scripts\activate
pip install -r backend/requirements.txt


2. Run the backend:
bash
python gesture_recognition.py

3. Open the frontend in your browser, with LiveServer:
http://localhost:3000

## Usage
1. Allow camera access in browser
2. Make hand gestures:
   - Thumbs Up: Switch ON
   - Thumbs Down: Switch OFF
3. Click "Capture Gesture" to process

## Technologies Used
- MediaPipe for hand gesture recognition
- HiveMQ for MQTT communication
- HTML5/CSS3/JavaScript for frontend
- Python for backend processing
