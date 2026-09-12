// This file connects the small feature modules to the page.
const appState = { selectedGesture: null, lastResult: { name: "A", emoji: "A", confidence: 80 }, lastSpokenText: "", lastSpokenAt: 0 };
const elements = {
    video: document.getElementById("video"), canvas: document.getElementById("canvas"), startButton: document.getElementById("startButton"), stopButton: document.getElementById("stopButton"), cameraText: document.getElementById("cameraText"), cameraStatus: document.getElementById("cameraStatus"), cameraStatusDot: document.getElementById("cameraStatusDot"), cameraEmpty: document.getElementById("cameraEmpty"), resultEmoji: document.getElementById("resultEmoji"), resultName: document.getElementById("resultName"), resultDescription: document.getElementById("resultDescription"), confidenceValue: document.getElementById("confidenceValue"), confidenceBar: document.getElementById("confidenceBar"), speakButton: document.getElementById("speakButton"), gestureGrid: document.getElementById("gestureGrid"), detailEmoji: document.getElementById("detailEmoji"), detailName: document.getElementById("detailName"), detailInstructions: document.getElementById("detailInstructions"), practiceButton: document.getElementById("practiceButton"), trainingButton: document.getElementById("trainingButton")
};

function showResult(result, shouldSpeak = true) {
    appState.lastResult = result;
    elements.resultEmoji.textContent = result.emoji;
    elements.resultName.textContent = result.name;
    elements.resultDescription.textContent = result.description || "A simple prototype gesture recognized from hand landmarks.";
    elements.confidenceValue.textContent = `${result.confidence}%`;
    elements.confidenceBar.style.width = `${result.confidence}%`;
    if (shouldSpeak) speakRecognizedText(result);
}

function speakRecognizedText(result) {
    const now = Date.now();
    const text = result.name === "UNKNOWN" ? "Unknown gesture" : result.name;
    // Camera results arrive many times per second, so repeat a letter only after a short pause.
    if (text !== appState.lastSpokenText || now - appState.lastSpokenAt > 3000) {
        window.speakText(text);
        appState.lastSpokenText = text;
        appState.lastSpokenAt = now;
    }
}

function setCameraMessage(message) { elements.cameraText.textContent = message; }

function handleResults(results) {
    const landmarks = results.multiHandLandmarks || [];
    if (!landmarks.length) { window.setTrainingLandmarks(null); setCameraMessage("✋ Show your hand to the camera."); return; }
    window.setTrainingLandmarks(landmarks[0]);
    const result = window.detectGesture(landmarks[0]);
    showResult(result);
    setCameraMessage(`Detected ${result.name.toLowerCase()}. Try another gesture whenever you like.`);
}

async function startCamera() {
    try {
        await window.startHandCamera(elements.video, handleResults);
        elements.cameraEmpty.hidden = true; elements.startButton.disabled = true; elements.stopButton.disabled = false; elements.cameraStatus.textContent = "AI is watching"; elements.cameraStatusDot.style.background = "#b9f5df"; setCameraMessage("✋ Show your hand to the camera!");
    } catch (error) { setCameraMessage("Camera permission is required for SignBridge AI."); elements.cameraStatus.textContent = "Camera unavailable"; console.error(error); }
}

function stopCamera() { window.stopHandCamera(); elements.cameraEmpty.hidden = false; elements.startButton.disabled = false; elements.stopButton.disabled = true; elements.cameraStatus.textContent = "Camera ready"; setCameraMessage("Camera is off. When ready, show one hand clearly."); }

function renderGestureCards() {
    const gestures = window.getBuiltInGestures();
    elements.gestureGrid.innerHTML = gestures.map((gesture, index) => `<button class="gesture-card${index === 0 ? " selected" : ""}" data-gesture="${gesture.name}"><span class="card-emoji">${gesture.emoji}</span><strong>${gesture.name}</strong><small>${gesture.description}</small></button>`).join("");
    appState.selectedGesture = gestures[0];
    elements.gestureGrid.querySelectorAll(".gesture-card").forEach((card) => card.addEventListener("click", () => selectGesture(card.dataset.gesture)));
}

function selectGesture(name) { const gesture = window.getBuiltInGestures().find((item) => item.name === name); if (!gesture) return; appState.selectedGesture = gesture; elements.detailEmoji.textContent = gesture.emoji; elements.detailName.textContent = gesture.name; elements.detailInstructions.textContent = gesture.description; elements.gestureGrid.querySelectorAll(".gesture-card").forEach((card) => card.classList.toggle("selected", card.dataset.gesture === name)); document.getElementById("learnDetail").scrollIntoView({ behavior: "smooth", block: "center" }); }

elements.startButton.addEventListener("click", startCamera); elements.stopButton.addEventListener("click", stopCamera); elements.speakButton.addEventListener("click", () => window.speakText(appState.lastResult.name)); elements.practiceButton.addEventListener("click", () => { document.getElementById("communicate").scrollIntoView({ behavior: "smooth" }); startCamera(); });
elements.trainingButton.addEventListener("click", () => window.toggleTraining(startCamera, stopCamera));
document.getElementById("clearTrainingButton").addEventListener("click", window.clearAllTraining);
document.getElementById("captureSampleButton").addEventListener("click", window.captureTrainingSample);
document.getElementById("finishTrainingButton").addEventListener("click", window.finishTraining);
document.getElementById("exportTrainingButton").addEventListener("click", window.exportTrainingDataset);
window.addEventListener("load", async () => { await window.loadGestureData(); renderGestureCards(); window.renderTrainedGestures(); showResult(appState.lastResult, false); });