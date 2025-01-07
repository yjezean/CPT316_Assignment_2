// Get DOM elements
const video = document.getElementById("video");
const captureButton = document.getElementById("capture");
const statusDiv = document.getElementById("status");
const switchCanvas = document.getElementById("switchCanvas");
const switchCtx = switchCanvas.getContext("2d");

// Initialize webcam
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then((stream) => {
      video.srcObject = stream;
      // Wait for video to be ready
      video.onloadedmetadata = () => {
        console.log("Video ready");
      };
    })
    .catch((error) => {
      console.error("Camera error:", error);
      statusDiv.textContent = "Camera error ❌";
    });
}

// Create hidden canvas for capture
const captureCanvas = document.createElement("canvas");
captureCanvas.style.display = "none";
document.body.appendChild(captureCanvas);

// Connect to MQTT broker
const client = mqtt.connect(
  "wss://7f76165cd8c94c32be20a6cb488edc87.s1.eu.hivemq.cloud:8884/mqtt",
  {
    username: "hand_gesture",
    password: "Handgesture316",
  }
);

client.on("connect", () => {
  console.log("Connected to HiveMQ");
  statusDiv.textContent = "MQTT Connected ✅";
});

client.on("error", (error) => {
  console.error("MQTT Error:", error);
  statusDiv.textContent = "MQTT Error ❌";
});

client.on("close", () => {
  statusDiv.textContent = "MQTT Disconnected ❌";
});

// Add loading element reference
const loadingContainer = document.getElementById("loadingContainer");

// Update capture button event listener
captureButton.addEventListener("click", () => {
  try {
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      throw new Error("Video not ready");
    }

    // Show loading
    loadingContainer.classList.add("active");
    captureButton.disabled = true;

    const context = captureCanvas.getContext("2d");
    captureCanvas.width = video.videoWidth;
    captureCanvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);

    const imageData = captureCanvas.toDataURL("image/jpeg");
    statusDiv.textContent = "Sending image... 🔄";

    client.publish("hand/gesture/raw", imageData, { qos: 1 }, (error) => {
      if (error) {
        console.error("Publish error:", error);
        statusDiv.textContent = "Send failed ❌";
        loadingContainer.classList.remove("active");
        captureButton.disabled = false;
      } else {
        console.log("Image sent successfully");
        statusDiv.textContent = "Image sent ✅";
        // Don't hide loading yet - wait for result
      }
    });
  } catch (error) {
    console.error("Error capturing/sending image:", error);
    statusDiv.textContent = "Capture error ❌";
    loadingContainer.classList.remove("active");
    captureButton.disabled = false;
  }
});

// Subscribe to results
client.subscribe("hand/gesture/result", { qos: 1 });

// Add at the top with other initializations
const switchSound = new Audio("./assets/switch.mp3");
switchSound.volume = 0.5; // Set volume to 50%

// Handle incoming messages
client.on("message", (topic, message) => {
  if (topic === "hand/gesture/result") {
    // Hide loading
    loadingContainer.classList.remove("active");
    captureButton.disabled = false;

    const result = message.toString();
    console.log("Received result:", result);

    if (result.includes("UP") || result.includes("THUMBS_UP")) {
      switchState = "ON";
      drawSwitch("ON");
      playSound();
    } else if (result.includes("DOWN") || result.includes("THUMBS_DOWN")) {
      switchState = "OFF";
      drawSwitch("OFF");
      playSound();
    }

    statusDiv.textContent = `Detected: ${result} 🤚`;
  }
});

// Initialize switch canvas
switchCanvas.width = 180;
switchCanvas.height = 480;

// Initialize switch state
let switchState = "OFF";

// Draw initial switch state
drawSwitch("OFF");

function drawSwitch(state) {
  const ctx = switchCtx;
  const width = switchCanvas.width;
  const height = switchCanvas.height;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Draw background
  ctx.fillStyle = "#2c2c2c";
  ctx.fillRect(0, 0, width, height);

  // Draw switch track
  ctx.fillStyle = "#1a1a1a";
  ctx.fillRect(20, 20, width - 40, height - 40);

  // Draw switch handle with color based on state
  const handleHeight = 100;
  const handleY = state === "ON" ? 40 : height - handleHeight - 40;

  // Set handle color based on state
  ctx.fillStyle = state === "ON" ? "#4CAF50" : "#ff4444"; // Green for ON, Red for OFF
  if (state === "ON") {
    ctx.fillRect(30, handleY - 15, width - 60, handleHeight);
  } else if (state === "OFF") {
    ctx.fillRect(30, handleY + 15, width - 60, handleHeight);
  }

  // Add a subtle gradient to the handle
  const gradient = ctx.createLinearGradient(
    0,
    handleY,
    0,
    handleY + handleHeight
  );
  gradient.addColorStop(0, "rgba(255, 255, 255, 0.2)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0.1)");
  ctx.fillStyle = gradient;

  if (state === "ON") {
    ctx.fillRect(30, handleY - 15, width - 60, handleHeight);
  } else if (state === "OFF") {
    ctx.fillRect(30, handleY + 15, width - 60, handleHeight);
  }

  // Draw text with improved visibility
  // ON text
  ctx.fillStyle = state === "ON" ? "#FFFFFF" : "#666666";
  ctx.font = "bold 24px Arial"; // Increased font size and made bold
  ctx.textAlign = "center";
  ctx.fillText("ON", width / 2, 80);

  // Add text shadow for better contrast
  if (state === "ON") {
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 4;
    ctx.fillText("ON", width / 2, 80);
    ctx.shadowBlur = 0;
  }

  // OFF text
  ctx.fillStyle = state === "OFF" ? "#FFFFFF" : "#666666";
  ctx.font = "bold 24px Arial"; // Increased font size and made bold
  ctx.textAlign = "center";

  // Add text shadow for better contrast
  if (state === "OFF") {
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 4;
    ctx.fillText("OFF", width / 2, height - 60);
    ctx.shadowBlur = 0;
  } else {
    ctx.fillText("OFF", width / 2, height - 60);
  }
}

// Add sound function
function playSound() {
  try {
    switchSound.currentTime = 0; // Reset sound to start
    switchSound.play().catch(console.error);
  } catch (error) {
    console.error("Sound play error:", error);
  }
}
