const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const captureButton = document.getElementById("capture");
const statusDiv = document.getElementById("status");
const switchCanvas = document.getElementById("switchCanvas");
const switchCtx = switchCanvas.getContext("2d");

// Set canvas size
switchCanvas.width = 400;
switchCanvas.height = 200;

// Switch state
let switchState = "OFF";

// Function to draw the switch
function drawSwitch(state) {
  switchCtx.clearRect(0, 0, switchCanvas.width, switchCanvas.height);

  // Set background based on state
  switchCtx.fillStyle = state === "ON" ? "#4CAF50" : "#ff4444";
  switchCtx.fillRect(0, 0, switchCanvas.width, switchCanvas.height);

  // Draw switch text
  switchCtx.fillStyle = "#ffffff";
  switchCtx.font = "bold 48px Arial";
  switchCtx.textAlign = "center";
  switchCtx.textBaseline = "middle";
  switchCtx.fillText(state, switchCanvas.width / 2, switchCanvas.height / 2);
}

// Initialize switch
drawSwitch(switchState);

// Start the camera
navigator.mediaDevices
  .getUserMedia({ video: true })
  .then((stream) => {
    video.srcObject = stream;
    updateStatus("Camera connected ✅");
  })
  .catch((error) => {
    console.error("Error accessing camera: ", error);
    updateStatus("Camera error ❌");
  });

// Connect to HiveMQ
const client = mqtt.connect(
  "wss://7f76165cd8c94c32be20a6cb488edc87.s1.eu.hivemq.cloud:8884/mqtt",
  {
    username: "hand_gesture",
    password: "Handgesture316",
  }
);

client.on("connect", () => {
  console.log("Connected to HiveMQ");
  updateStatus("MQTT Connected ✅");
});

client.on("error", (error) => {
  console.error("MQTT Error:", error);
  updateStatus("MQTT Error ❌");
});

client.on("close", () => {
  updateStatus("MQTT Disconnected ❌");
});

captureButton.addEventListener("click", () => {
  try {
    const context = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL("image/jpeg");
    updateStatus("Sending image... 🔄");

    client.publish("hand/gesture/raw", imageData, { qos: 1 }, (error) => {
      if (error) {
        console.error("Publish error:", error);
        updateStatus("Send failed ❌");
      } else {
        console.log("Image sent successfully");
        updateStatus("Image sent ✅");
      }
    });
  } catch (error) {
    console.error("Error capturing/sending image:", error);
    updateStatus("Capture error ❌");
  }
});

client.subscribe("hand/gesture/result", { qos: 1 });

client.on("message", (topic, message) => {
  if (topic === "hand/gesture/result") {
    const result = message.toString();
    console.log(`Received Gesture: ${result}`);

    // Update switch state based on gesture
    if (result.includes("THUMBS UP")) {
      switchState = "ON";
    } else if (result.includes("THUMBS DOWN")) {
      switchState = "OFF";
    }

    // Update the switch visualization
    drawSwitch(switchState);

    updateStatus(`Detected: ${result} 🤚`);
  }
});

function updateStatus(message) {
  statusDiv.innerHTML = `Status: ${message}`;
  console.log(`Status Update: ${message}`);
}
