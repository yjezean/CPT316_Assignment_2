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

1. Create and activate a Python virtual environment:
bash
Create virtual environment
python -m venv venv
Activate virtual environment
On Windows:
venv\Scripts\activate
On Unix/MacOS:
source venv/bin/activate

2. Install Python requirements:
pip install -r .\backend\requirements.txt


3. Run the backend:
bash
python backend/gesture_recognition.py

4. Open the frontend:
- Use LiveServer in VS Code or any web server
- Access via: http://localhost:3000

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
