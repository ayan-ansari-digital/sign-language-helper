// These cards are an A-Z fingerspelling learning library based on the supplied chart.
// The camera recognizers below are still a small prototype, not full ASL translation.
let BUILT_IN_GESTURES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => ({
    name: letter,
    emoji: letter,
    description: `Fingerspelling letter ${letter}. Compare your hand with the alphabet chart.`,
    image: null
}));

function getBuiltInGestures() { return BUILT_IN_GESTURES; }
async function loadGestureData() {
    try {
        const response = await fetch("data/gestures.json");
        if (response.ok) BUILT_IN_GESTURES = await response.json();
    } catch (error) {
        console.warn("Using the built-in alphabet fallback because gesture data could not load.");
    }
    return BUILT_IN_GESTURES;
}
function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0)); }
function fingerIsOpen(landmarks, tip, pip) { return landmarks[tip].y < landmarks[pip].y; }
function normalizeLandmarks(landmarks) {
    const wrist = landmarks[0];
    const moved = landmarks.map((point) => ({ x: point.x - wrist.x, y: point.y - wrist.y, z: (point.z || 0) - (wrist.z || 0) }));
    const handSize = Math.max(distance(moved[0], moved[9]), 0.01);
    return moved.map((point) => ({ x: point.x / handSize, y: point.y / handSize, z: point.z / handSize }));
}
function detectOpenPalm(landmarks) { return [8, 12, 16, 20].every((tip, index) => fingerIsOpen(landmarks, tip, [6, 10, 14, 18][index])); }
function detectFist(landmarks) { return [8, 12, 16, 20].every((tip, index) => !fingerIsOpen(landmarks, tip, [6, 10, 14, 18][index])); }
function detectLetterV(landmarks) { return fingerIsOpen(landmarks, 8, 6) && fingerIsOpen(landmarks, 12, 10) && !fingerIsOpen(landmarks, 16, 14) && !fingerIsOpen(landmarks, 20, 18); }
function detectOne(landmarks) { return fingerIsOpen(landmarks, 8, 6) && [12, 16, 20].every((tip, index) => !fingerIsOpen(landmarks, tip, [10, 14, 18][index])); }
function detectLetterL(landmarks) { return fingerIsOpen(landmarks, 8, 6) && !fingerIsOpen(landmarks, 12, 10) && !fingerIsOpen(landmarks, 16, 14) && !fingerIsOpen(landmarks, 20, 18) && landmarks[4].x < landmarks[3].x; }
function detectLetterB(landmarks) { return [8, 12, 16, 20].every((tip, index) => fingerIsOpen(landmarks, tip, [6, 10, 14, 18][index])) && landmarks[4].x > landmarks[3].x; }
function compareLandmarks(current, saved) { if (!saved || saved.length !== current.length) return Infinity; return current.reduce((total, point, index) => total + distance(point, saved[index]), 0) / current.length; }
function getCustomGestures() {
    let stored = [];
    try { stored = JSON.parse(localStorage.getItem("signbridgeCustomGestures") || "[]"); } catch (error) { stored = []; }
    const fileGestures = BUILT_IN_GESTURES.filter((gesture) => Array.isArray(gesture.landmarks));
    const combined = new Map(fileGestures.map((gesture) => [gesture.name, gesture]));
    stored.forEach((gesture) => combined.set(gesture.name, gesture));
    return [...combined.values()];
}
function detectGesture(landmarks) {
    const normalized = normalizeLandmarks(landmarks);
    let closest = null; let closestDistance = Infinity;
    getCustomGestures().forEach((gesture) => { const currentDistance = compareLandmarks(normalized, gesture.landmarks); if (currentDistance < closestDistance) { closest = gesture; closestDistance = currentDistance; } });
    if (closest && closestDistance < 0.75) return { name: closest.name, emoji: closest.emoji, confidence: Math.max(70, Math.round(100 - closestDistance * 35)), description: "A custom gesture from your personal library." };
    if (detectLetterL(landmarks)) return { name: "L", emoji: "L", confidence: 88, description: "Prototype match: index finger and thumb form an L shape." };
    if (detectLetterV(landmarks)) return { name: "V", emoji: "V", confidence: 89, description: "Prototype match: two fingers are raised." };
    if (detectLetterB(landmarks)) return { name: "B", emoji: "B", confidence: 86, description: "Prototype match: four fingers are raised together." };
    if (detectOne(landmarks)) return { name: "D", emoji: "D", confidence: 87, description: "Prototype match: one finger is raised." };
    if (detectOpenPalm(landmarks)) return { name: "B", emoji: "B", confidence: 82, description: "Prototype match: an open hand is detected." };
    if (detectFist(landmarks)) return { name: "A", emoji: "A", confidence: 80, description: "Prototype match: a closed hand is detected." };
    return { name: "UNKNOWN", emoji: "?", confidence: 35, description: "This letter is not recognized yet. Try training it below." };
}
window.getBuiltInGestures = getBuiltInGestures; window.loadGestureData = loadGestureData; window.normalizeLandmarks = normalizeLandmarks; window.detectGesture = detectGesture;
