let handsModel = null;
let cameraStream = null;
let cameraLoop = null;
let resultHandler = null;

function setupHandsModel() {
    if (handsModel) return handsModel;
    handsModel = new Hands({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
    handsModel.setOptions({ maxNumHands: 2, modelComplexity: 1, minDetectionConfidence: 0.6, minTrackingConfidence: 0.6 });
    handsModel.onResults(drawHandResults);
    return handsModel;
}
function drawHandResults(results) {
    const video = document.getElementById("video"); const canvas = document.getElementById("canvas"); const context = canvas.getContext("2d");
    if (!video.videoWidth) return;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight; context.clearRect(0, 0, canvas.width, canvas.height);
    (results.multiHandLandmarks || []).forEach((landmarks) => { drawConnectors(context, landmarks, HAND_CONNECTIONS, { color: "#b9f5df", lineWidth: 4 }); drawLandmarks(context, landmarks, { color: "#7c3aed", lineWidth: 2, radius: 5 }); });
    if (resultHandler) resultHandler(results);
}
async function startHandCamera(video, onResults) {
    if (cameraStream) return;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error("Camera is not supported");
    resultHandler = onResults; setupHandsModel();
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: "user" }, audio: false });
    video.srcObject = cameraStream; await video.play();
    cameraLoop = new Camera(video, { onFrame: async () => { if (handsModel) await handsModel.send({ image: video }); }, width: 640, height: 480 }); cameraLoop.start();
}
function stopHandCamera() { if (cameraLoop && cameraLoop.stop) cameraLoop.stop(); if (cameraStream) cameraStream.getTracks().forEach((track) => track.stop()); cameraStream = null; cameraLoop = null; const canvas = document.getElementById("canvas"); if (canvas) canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height); }
function captureCameraImage() {
    const video = document.getElementById("video");
    if (!video.videoWidth) return null;
    const snapshot = document.createElement("canvas");
    snapshot.width = 320; snapshot.height = 240;
    const context = snapshot.getContext("2d");
    context.translate(snapshot.width, 0); context.scale(-1, 1);
    context.drawImage(video, 0, 0, snapshot.width, snapshot.height);
    return snapshot.toDataURL("image/jpeg", 0.72);
}
window.startHandCamera = startHandCamera; window.stopHandCamera = stopHandCamera; window.captureCameraImage = captureCameraImage;
