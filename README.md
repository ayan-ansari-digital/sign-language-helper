# sign-language-helper


SignBridge AI is a beginner-friendly sign language helper for learning and communication. It uses a webcam, MediaPipe Hands, simple landmark-based gesture recognition, browser speech, and LocalStorage training.

> This is an educational prototype. Its built-in letter recognizers are simple shape recognitions, not a complete or official sign-language translation system.

## Features

- Live webcam hand landmarks with MediaPipe Hands
- Detection of up to two hands
- A-Z fingerspelling learning library based on the supplied alphabet chart
- Prototype camera recognition for a few clear letter shapes, with automatic voice output
- Text result, confidence display, and text-to-speech
- Learn mode with practice cards
- Capture labeled gesture images and MediaPipe landmarks from the camera
- Save training samples in browser LocalStorage
- Download a `gesture-training-data.json` dataset for model training
- Responsive and keyboard-friendly interface

## Project structure

```text
sign-language-helper/
├── index.html
├── style.css
├── script.js
├── js/
│   ├── handAI.js
│   ├── gestureRecognition.js
│   ├── training.js
│   └── speech.js
├── data/
│   └── gestures.json
└── README.md
```

## Run with VS Code

1. Open this folder in VS Code.
2. Install the **Live Server** extension by Ritwick Dey from the Extensions view if it is not installed.
3. Right-click `index.html` and choose **Open with Live Server**.
4. Allow camera permission when the browser asks.

The project needs no npm installation or backend. Webcam access normally requires `localhost` or another secure context, which Live Server provides.

## Use the camera

Open **Communicate**, choose **Start camera**, and hold one hand clearly inside the video frame. The program draws MediaPipe landmarks and tries the built-in prototype recognizers. Choose **Speak result** to hear the recognized word.

If permission is denied, use the browser site settings to allow camera access and reload the page.

## Create a training dataset

1. Open **Train AI**.
2. Enter a name and an optional emoji.
3. Select **Start capture** and allow camera access.
4. Show the gesture clearly. When the **Capture sample** button becomes active, click it.
5. Repeat the capture step with different hand positions, distances, and lighting.
6. Select **Save trained gesture** to create the browser recognition template.
7. Select **Download JSON dataset** to download `gesture-training-data.json`.

Each JSON sample contains `label`, `emoji`, `image` as a data URL, normalized `landmarks`, and `capturedAt`. The file can be used by a later Python or TensorFlow training script. The browser stores the working dataset in LocalStorage; downloading the JSON creates the permanent file on your computer. A static webpage cannot write files directly into the project folder.

## Technologies

- HTML, CSS, and beginner-friendly vanilla JavaScript
- MediaPipe Hands, Camera Utils, and Drawing Utils through CDN
- Browser LocalStorage
- Web Speech API

## Accessibility notes

The app uses high-contrast colors, large controls, visible focus styles, labels, status messages, and simple language. Camera recognition should be treated as practice support and not as a replacement for a qualified sign-language interpreter.

hello bellow 