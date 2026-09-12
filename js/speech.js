function speakText(text) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const message = new SpeechSynthesisUtterance(text);
    message.rate = 0.95; message.pitch = 1;
    window.speechSynthesis.speak(message);
}
window.speakText = speakText;
