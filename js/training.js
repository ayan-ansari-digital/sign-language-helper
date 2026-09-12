const TRAINING_DATA_KEY = "signbridgeTrainingDataset";
const TRAINING_MODEL_KEY = "signbridgeCustomGestures";
const trainingState = { active: false, label: "", emoji: "", samples: [], latestLandmarks: null, startCamera: null, stopCamera: null };

function readTrainingDataset() {
    try {
        const dataset = JSON.parse(localStorage.getItem(TRAINING_DATA_KEY) || "null");
        return dataset && Array.isArray(dataset.samples) ? dataset : { schemaVersion: 1, samples: [] };
    } catch (error) { return { schemaVersion: 1, samples: [] }; }
}
function writeTrainingDataset(dataset) { localStorage.setItem(TRAINING_DATA_KEY, JSON.stringify(dataset)); }
function updateTrainingCount() { document.getElementById("sampleCount").textContent = `${trainingState.samples.length} samples`; }
function updateTrainingStatus(message) { document.getElementById("trainingStatus").textContent = message; }
function setTrainingLandmarks(landmarks) { trainingState.latestLandmarks = landmarks; const button = document.getElementById("captureSampleButton"); if (button) button.disabled = !trainingState.active || !landmarks; }
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", "\"": "&quot;" })[character]); }

function toggleTraining(startCamera, stopCamera) {
    const nameInput = document.getElementById("trainingName");
    const emojiInput = document.getElementById("trainingEmoji");
    const button = document.getElementById("trainingButton");
    if (trainingState.active) {
        trainingState.active = false;
        trainingState.latestLandmarks = null;
        stopCamera();
        button.textContent = "📷 Start capture";
        document.getElementById("captureSampleButton").disabled = true;
        updateTrainingStatus("Capture paused. Your saved samples are still available.");
        return;
    }
    const label = nameInput.value.trim();
    if (!label) { updateTrainingStatus("Enter the gesture text before starting."); nameInput.focus(); return; }
    trainingState.active = true;
    trainingState.label = label;
    trainingState.emoji = emojiInput.value.trim() || "🖐️";
    trainingState.samples = readTrainingDataset().samples.filter((sample) => sample.label === label);
    trainingState.latestLandmarks = null;
    trainingState.startCamera = startCamera;
    trainingState.stopCamera = stopCamera;
    button.textContent = "■ Stop capture";
    updateTrainingCount();
    updateTrainingStatus("Starting camera. Show one hand, then capture a sample.");
    startCamera();
}

function captureTrainingSample() {
    if (!trainingState.active) { updateTrainingStatus("Start capture before taking samples."); return; }
    if (!trainingState.latestLandmarks) { updateTrainingStatus("No hand detected yet. Put one hand clearly in the camera frame."); return; }
    const image = window.captureCameraImage();
    if (!image) { updateTrainingStatus("The camera image is not ready yet. Try again in a moment."); return; }
    const sample = { id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${trainingState.samples.length}`, label: trainingState.label, emoji: trainingState.emoji, capturedAt: new Date().toISOString(), image, landmarks: normalizeLandmarks(trainingState.latestLandmarks) };
    try {
        const dataset = readTrainingDataset();
        dataset.schemaVersion = 1;
        dataset.samples.push(sample);
        writeTrainingDataset(dataset);
        trainingState.samples.push(sample);
        updateTrainingCount();
        updateTrainingStatus(`Saved sample ${trainingState.samples.length}. Change the hand position slightly and capture another.`);
    } catch (error) { updateTrainingStatus("The sample could not be saved. Check browser storage space and permissions."); }
}

function averageLandmarks(samples) {
    return samples[0].landmarks.map((_, index) => ({ x: samples.reduce((sum, sample) => sum + sample.landmarks[index].x, 0) / samples.length, y: samples.reduce((sum, sample) => sum + sample.landmarks[index].y, 0) / samples.length, z: samples.reduce((sum, sample) => sum + sample.landmarks[index].z, 0) / samples.length }));
}
function finishTraining() {
    if (!trainingState.samples.length) { updateTrainingStatus("Capture at least one sample first."); return; }
    try {
        const models = JSON.parse(localStorage.getItem(TRAINING_MODEL_KEY) || "[]").filter((gesture) => gesture.name !== trainingState.label);
        models.push({ name: trainingState.label, emoji: trainingState.emoji, description: "Custom gesture trained from labeled camera samples.", landmarks: averageLandmarks(trainingState.samples), image: trainingState.samples[0].image });
        localStorage.setItem(TRAINING_MODEL_KEY, JSON.stringify(models));
        trainingState.active = false;
        trainingState.latestLandmarks = null;
        trainingState.stopCamera();
        document.getElementById("trainingButton").textContent = "📷 Start capture";
        document.getElementById("captureSampleButton").disabled = true;
        updateTrainingStatus(`✅ ${trainingState.samples.length} samples saved for ${trainingState.label}. Download the JSON dataset below.`);
        renderTrainedGestures();
    } catch (error) { updateTrainingStatus("The trained gesture could not be created. Check browser storage space and permissions."); }
}
function exportTrainingDataset() {
    const dataset = readTrainingDataset();
    if (!dataset.samples.length) { updateTrainingStatus("Capture at least one sample before downloading the dataset."); return; }
    const blob = new Blob([JSON.stringify({ ...dataset, exportedAt: new Date().toISOString() }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "gesture-training-data.json";
    link.click();
    URL.revokeObjectURL(url);
    updateTrainingStatus(`✅ Downloaded ${dataset.samples.length} labeled training samples.`);
}
function clearTrainingDataset() { localStorage.removeItem(TRAINING_DATA_KEY); trainingState.samples = []; updateTrainingCount(); updateTrainingStatus("Training dataset cleared. Your trained recognition models were kept."); }
function renderTrainedGestures() { const list = document.getElementById("trainedGestures"); const samples = readTrainingDataset().samples; const labels = [...new Map(samples.map((sample) => [sample.label, sample])).values()]; if (!labels.length) { list.innerHTML = '<p class="empty-list">No captured samples yet.</p>'; return; } list.innerHTML = labels.map((sample) => { const count = samples.filter((item) => item.label === sample.label).length; return `<div class="trained-item"><span class="trained-emoji">${escapeHtml(sample.emoji)}</span><div><strong>${escapeHtml(sample.label)}</strong><small>${count} image and landmark sample${count === 1 ? "" : "s"}</small></div></div>`; }).join(""); }
function deleteTraining(index) { const gestures = JSON.parse(localStorage.getItem(TRAINING_MODEL_KEY) || "[]"); gestures.splice(index, 1); localStorage.setItem(TRAINING_MODEL_KEY, JSON.stringify(gestures)); renderTrainedGestures(); }
window.trainingState = trainingState;
window.toggleTraining = toggleTraining;
window.setTrainingLandmarks = setTrainingLandmarks;
window.captureTrainingSample = captureTrainingSample;
window.finishTraining = finishTraining;
window.exportTrainingDataset = exportTrainingDataset;
window.clearTrainingDataset = clearTrainingDataset;
window.renderTrainedGestures = renderTrainedGestures;
