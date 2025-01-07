// Get DOM elements
const video = document.getElementById("video");
const captureButton = document.getElementById("capture");
const statusDiv = document.getElementById("status");

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
const switchImage = document.getElementById("switchImage");
let switchState = "OFF";

// Handle incoming messages
client.on("message", (topic, message) => {
  if (topic === "hand/gesture/result") {
    // Hide loading
    loadingContainer.classList.remove("active");
    captureButton.disabled = false;

    const result = message.toString();
    console.log("Received result:", result);

    // Handle switch state
    if (result.includes("UP") || result.includes("THUMBS_UP")) {
      if (switchState !== "ON") {
        switchState = "ON";
        switchImage.src = "./assets/ON.png";
        playSound();
      }
    } else if (result.includes("DOWN") || result.includes("THUMBS_DOWN")) {
      if (switchState !== "OFF") {
        switchState = "OFF";
        switchImage.src = "./assets/OFF.png";
        playSound();
      }
    }

    statusDiv.textContent = `Detected: ${result} 🤚`;
  }
});

// Add sound function
function playSound() {
  try {
    switchSound.currentTime = 0; // Reset sound to start
    switchSound.play().catch(console.error);
  } catch (error) {
    console.error("Sound play error:", error);
  }
}
