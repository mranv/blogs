---
slug: 'webrtc-screen-sharing'

title: "Complete Guide to WebRTC Screen Sharing: Implementation & Best Practices"
description: "Learn how to implement professional-grade WebRTC screen sharing with multi-monitor support, window selection, audio capture, and recording capabilities"
pubDatetime: 2025-07-25T09:15:00+05:30
author: "Tech Blog Team"
tags: ["webrtc", "screen-sharing", "real-time", "javascript", "peer-to-peer"]
image: "/images/webrtc-screen-sharing.jpg"
category: "WebRTC"
draft: false

---

# Complete Guide to WebRTC Screen Sharing: Implementation & Best Practices

Screen sharing has become essential for remote collaboration, online education, and technical support. This comprehensive guide shows you how to implement professional-grade WebRTC screen sharing with advanced features like multi-monitor support, window selection, and recording capabilities.

## Table of Contents

1. [Screen Sharing Fundamentals](#fundamentals)
2. [Basic Screen Sharing Implementation](#basic-implementation)
3. [Advanced Screen Capture Features](#advanced-features)
4. [Multi-Monitor & Window Selection](#multi-monitor)
5. [Audio Capture Integration](#audio-capture)
6. [Recording & Streaming](#recording)
7. [Performance Optimization](#optimization)
8. [Production Deployment](#production)

## Screen Sharing Fundamentals {#fundamentals}

WebRTC screen sharing uses the Screen Capture API (`getDisplayMedia()`) to capture screen content and share it through peer-to-peer connections.

### Key APIs and Concepts

```javascript
// Screen Capture API
navigator.mediaDevices.getDisplayMedia(constraints)

// Screen sharing constraints
const constraints = {
  video: {
    mediaSource: 'screen',
    width: { max: 1920 },
    height: { max: 1080 },
    frameRate: { max: 30 }
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    sampleRate: 44100
  }
};
```

### Browser Support Matrix

| Browser | Screen Sharing | Audio Capture | Window Selection |
|---------|----------------|---------------|------------------|
| Chrome 72+ | ✅ | ✅ | ✅ |
| Firefox 66+ | ✅ | ✅ | ✅ |
| Safari 13+ | ✅ | ❌ | ✅ |
| Edge 79+ | ✅ | ✅ | ✅ |

## Basic Screen Sharing Implementation {#basic-implementation}

Let's start with a complete screen sharing application:

### HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WebRTC Screen Sharing</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <header>
            <h1>WebRTC Screen Sharing</h1>
            <div class="status-indicator" id="connectionStatus">Disconnected</div>
        </header>

        <main>
            <div class="controls-panel">
                <div class="control-group">
                    <button id="startScreenShare" class="btn btn-primary">Start Screen Share</button>
                    <button id="stopScreenShare" class="btn btn-secondary" disabled>Stop Screen Share</button>
                </div>
                
                <div class="control-group">
                    <label for="qualitySelect">Quality:</label>
                    <select id="qualitySelect">
                        <option value="low">Low (720p)</option>
                        <option value="medium" selected>Medium (1080p)</option>
                        <option value="high">High (1440p)</option>
                        <option value="ultra">Ultra (4K)</option>
                    </select>
                </div>

                <div class="control-group">
                    <label>
                        <input type="checkbox" id="includeAudio"> Include System Audio
                    </label>
                </div>

                <div class="control-group">
                    <button id="recordScreen" class="btn btn-accent" disabled>Start Recording</button>
                    <button id="stopRecording" class="btn btn-secondary" disabled>Stop Recording</button>
                </div>
            </div>

            <div class="video-container">
                <div class="local-screen">
                    <h3>Your Screen</h3>
                    <video id="localVideo" autoplay muted playsinline></video>
                    <div class="video-info" id="localInfo"></div>
                </div>

                <div class="remote-screen">
                    <h3>Shared Screen</h3>
                    <video id="remoteVideo" autoplay playsinline controls></video>
                    <div class="video-info" id="remoteInfo"></div>
                </div>
            </div>

            <div class="participants-panel">
                <h3>Participants</h3>
                <div id="participantsList"></div>
            </div>
        </main>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script src="screen-sharing.js"></script>
</body>
</html>
```

### CSS Styling

```css
/* style.css */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: #333;
    min-height: 100vh;
}

.container {
    max-width: 1400px;
    margin: 0 auto;
    padding: 20px;
}

header {
    text-align: center;
    margin-bottom: 30px;
    color: white;
}

header h1 {
    font-size: 2.5rem;
    margin-bottom: 10px;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.status-indicator {
    display: inline-block;
    padding: 8px 16px;
    border-radius: 20px;
    font-weight: 500;
    background: rgba(255,255,255,0.2);
    backdrop-filter: blur(10px);
}

.status-indicator.connected {
    background: rgba(76, 175, 80, 0.8);
}

.status-indicator.connecting {
    background: rgba(255, 193, 7, 0.8);
}

main {
    background: rgba(255,255,255,0.95);
    border-radius: 15px;
    padding: 30px;
    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    backdrop-filter: blur(10px);
}

.controls-panel {
    display: flex;
    gap: 20px;
    align-items: center;
    margin-bottom: 30px;
    padding: 20px;
    background: #f8f9fa;
    border-radius: 10px;
    flex-wrap: wrap;
}

.control-group {
    display: flex;
    align-items: center;
    gap: 10px;
}

.btn {
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
    background: #6c757d;
    color: white;
}

.btn-accent {
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
    color: white;
}

.btn-accent:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(255, 107, 107, 0.4);
}

select {
    padding: 8px 12px;
    border: 2px solid #e9ecef;
    border-radius: 6px;
    font-size: 14px;
    background: white;
}

.video-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 30px;
    margin-bottom: 30px;
}

.local-screen,
.remote-screen {
    background: #000;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
}

.local-screen h3,
.remote-screen h3 {
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 12px 20px;
    margin: 0;
    font-size: 16px;
}

video {
    width: 100%;
    height: 400px;
    object-fit: contain;
    background: #000;
}

.video-info {
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 10px 20px;
    font-size: 12px;
    font-family: monospace;
}

.participants-panel {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 10px;
}

.participants-panel h3 {
    margin-bottom: 15px;
    color: #495057;
}

.participant-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    background: white;
    border-radius: 8px;
    margin-bottom: 10px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.participant-status {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #28a745;
}

@media (max-width: 768px) {
    .video-container {
        grid-template-columns: 1fr;
    }
    
    .controls-panel {
        flex-direction: column;
        align-items: stretch;
    }
    
    .control-group {
        justify-content: center;
    }
}
```

### Core JavaScript Implementation

```javascript
// screen-sharing.js
class ScreenSharingApp {
    constructor() {
        this.socket = null;
        this.localConnection = null;
        this.remoteConnection = null;
        this.localStream = null;
        this.remoteStream = null;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isRecording = false;
        this.roomId = null;
        this.userId = this.generateUserId();
        
        this.qualitySettings = {
            low: { width: 1280, height: 720, frameRate: 15 },
            medium: { width: 1920, height: 1080, frameRate: 24 },
            high: { width: 2560, height: 1440, frameRate: 30 },
            ultra: { width: 3840, height: 2160, frameRate: 30 }
        };
        
        this.init();
    }

    generateUserId() {
        return 'user_' + Math.random().toString(36).substr(2, 9);
    }

    init() {
        this.initializeSocket();
        this.setupEventListeners();
        this.setupWebRTC();
        this.requestRoomId();
    }

    initializeSocket() {
        this.socket = io();
        
        this.socket.on('connect', () => {
            console.log('Connected to signaling server');
            this.updateConnectionStatus('Connected', 'connected');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from signaling server');
            this.updateConnectionStatus('Disconnected', 'disconnected');
        });

        this.socket.on('room-joined', (data) => {
            console.log('Joined room:', data.roomId);
            this.roomId = data.roomId;
            this.updateParticipants(data.participants);
        });

        this.socket.on('participant-joined', (participant) => {
            console.log('Participant joined:', participant);
            this.handleParticipantJoined(participant);
        });

        this.socket.on('participant-left', (participant) => {
            console.log('Participant left:', participant);
            this.handleParticipantLeft(participant);
        });

        this.socket.on('offer', async (data) => {
            console.log('Received offer from:', data.from);
            await this.handleOffer(data.offer, data.from);
        });

        this.socket.on('answer', async (data) => {
            console.log('Received answer from:', data.from);
            await this.handleAnswer(data.answer);
        });

        this.socket.on('ice-candidate', async (data) => {
            console.log('Received ICE candidate from:', data.from);
            await this.handleIceCandidate(data.candidate);
        });

        this.socket.on('screen-share-started', (data) => {
            console.log('Screen share started by:', data.userId);
            this.handleRemoteScreenShare(data);
        });

        this.socket.on('screen-share-stopped', (data) => {
            console.log('Screen share stopped by:', data.userId);
            this.handleRemoteScreenShareStopped(data);
        });
    }

    setupEventListeners() {
        document.getElementById('startScreenShare').addEventListener('click', () => {
            this.startScreenShare();
        });

        document.getElementById('stopScreenShare').addEventListener('click', () => {
            this.stopScreenShare();
        });

        document.getElementById('recordScreen').addEventListener('click', () => {
            this.startRecording();
        });

        document.getElementById('stopRecording').addEventListener('click', () => {
            this.stopRecording();
        });

        document.getElementById('qualitySelect').addEventListener('change', (e) => {
            this.handleQualityChange(e.target.value);
        });
    }

    setupWebRTC() {
        const configuration = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                {
                    urls: 'turn:your-turn-server.com:3478',
                    username: 'your-username',
                    credential: 'your-password'
                }
            ],
            iceCandidatePoolSize: 10
        };

        this.localConnection = new RTCPeerConnection(configuration);
        this.remoteConnection = new RTCPeerConnection(configuration);

        // Local connection event handlers
        this.localConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket.emit('ice-candidate', {
                    candidate: event.candidate,
                    to: 'remote',
                    roomId: this.roomId
                });
            }
        };

        this.localConnection.oniceconnectionstatechange = () => {
            console.log('Local ICE connection state:', this.localConnection.iceConnectionState);
            this.updateConnectionStatus(this.localConnection.iceConnectionState, 'connecting');
        };

        // Remote connection event handlers
        this.remoteConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket.emit('ice-candidate', {
                    candidate: event.candidate,
                    to: 'local',
                    roomId: this.roomId
                });
            }
        };

        this.remoteConnection.ontrack = (event) => {
            console.log('Received remote track:', event.streams[0]);
            this.remoteStream = event.streams[0];
            document.getElementById('remoteVideo').srcObject = this.remoteStream;
            this.updateVideoInfo('remote', this.remoteStream);
        };

        this.remoteConnection.oniceconnectionstatechange = () => {
            console.log('Remote ICE connection state:', this.remoteConnection.iceConnectionState);
        };
    }

    async requestRoomId() {
        const urlParams = new URLSearchParams(window.location.search);
        const roomId = urlParams.get('room') || 'default-room';
        
        this.socket.emit('join-room', {
            roomId: roomId,
            userId: this.userId,
            userName: 'User ' + this.userId.slice(-4)
        });
    }

    async startScreenShare() {
        try {
            const quality = document.getElementById('qualitySelect').value;
            const includeAudio = document.getElementById('includeAudio').checked;
            const settings = this.qualitySettings[quality];

            const constraints = {
                video: {
                    mediaSource: 'screen',
                    width: { ideal: settings.width, max: settings.width },
                    height: { ideal: settings.height, max: settings.height },
                    frameRate: { ideal: settings.frameRate, max: settings.frameRate },
                    cursor: 'always'
                },
                audio: includeAudio ? {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                } : false
            };

            this.localStream = await navigator.mediaDevices.getDisplayMedia(constraints);
            
            // Handle screen share end detection
            this.localStream.getVideoTracks()[0].onended = () => {
                console.log('Screen sharing ended by user');
                this.stopScreenShare();
            };

            document.getElementById('localVideo').srcObject = this.localStream;
            this.updateVideoInfo('local', this.localStream);

            // Add tracks to peer connection
            this.localStream.getTracks().forEach(track => {
                this.localConnection.addTrack(track, this.localStream);
            });

            // Create offer
            const offer = await this.localConnection.createOffer({
                offerToReceiveVideo: true,
                offerToReceiveAudio: includeAudio
            });
            
            await this.localConnection.setLocalDescription(offer);

            // Send offer to remote peer
            this.socket.emit('offer', {
                offer: offer,
                roomId: this.roomId,
                from: this.userId
            });

            // Notify room about screen sharing
            this.socket.emit('screen-share-started', {
                roomId: this.roomId,
                userId: this.userId,
                quality: quality,
                hasAudio: includeAudio
            });

            this.updateUIForScreenSharing(true);

        } catch (error) {
            console.error('Error starting screen share:', error);
            this.handleScreenShareError(error);
        }
    }

    async stopScreenShare() {
        try {
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => {
                    track.stop();
                });
                this.localStream = null;
            }

            document.getElementById('localVideo').srcObject = null;
            
            if (this.localConnection) {
                this.localConnection.getSenders().forEach(sender => {
                    if (sender.track) {
                        this.localConnection.removeTrack(sender);
                    }
                });
            }

            // Notify room about screen sharing stop
            this.socket.emit('screen-share-stopped', {
                roomId: this.roomId,
                userId: this.userId
            });

            this.updateUIForScreenSharing(false);
            
            if (this.isRecording) {
                this.stopRecording();
            }

        } catch (error) {
            console.error('Error stopping screen share:', error);
        }
    }

    async handleOffer(offer, from) {
        try {
            await this.remoteConnection.setRemoteDescription(offer);
            
            const answer = await this.remoteConnection.createAnswer();
            await this.remoteConnection.setLocalDescription(answer);

            this.socket.emit('answer', {
                answer: answer,
                roomId: this.roomId,
                from: this.userId,
                to: from
            });

        } catch (error) {
            console.error('Error handling offer:', error);
        }
    }

    async handleAnswer(answer) {
        try {
            await this.localConnection.setRemoteDescription(answer);
        } catch (error) {
            console.error('Error handling answer:', error);
        }
    }

    async handleIceCandidate(candidate) {
        try {
            await this.localConnection.addIceCandidate(candidate);
        } catch (error) {
            console.error('Error handling ICE candidate:', error);
        }
    }

    startRecording() {
        if (!this.localStream) {
            alert('Please start screen sharing first');
            return;
        }

        try {
            const options = {
                mimeType: 'video/webm;codecs=vp9,opus',
                videoBitsPerSecond: 2500000
            };

            this.mediaRecorder = new MediaRecorder(this.localStream, options);
            this.recordedChunks = [];

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };

            this.mediaRecorder.onstop = () => {
                this.saveRecording();
            };

            this.mediaRecorder.start(1000); // Record in 1-second chunks
            this.isRecording = true;
            this.updateUIForRecording(true);

        } catch (error) {
            console.error('Error starting recording:', error);
            alert('Recording failed: ' + error.message);
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.updateUIForRecording(false);
        }
    }

    saveRecording() {
        const blob = new Blob(this.recordedChunks, {
            type: 'video/webm'
        });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        
        a.href = url;
        a.download = `screen-recording-${timestamp}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
        this.recordedChunks = [];
    }

    handleQualityChange(quality) {
        if (this.localStream) {
            const settings = this.qualitySettings[quality];
            const videoTrack = this.localStream.getVideoTracks()[0];
            
            if (videoTrack && videoTrack.applyConstraints) {
                videoTrack.applyConstraints({
                    width: { ideal: settings.width },
                    height: { ideal: settings.height },
                    frameRate: { ideal: settings.frameRate }
                }).catch(error => {
                    console.error('Error applying quality constraints:', error);
                });
            }
        }
    }

    updateUIForScreenSharing(isSharing) {
        document.getElementById('startScreenShare').disabled = isSharing;
        document.getElementById('stopScreenShare').disabled = !isSharing;
        document.getElementById('recordScreen').disabled = !isSharing;
        
        if (!isSharing && this.isRecording) {
            this.stopRecording();
        }
    }

    updateUIForRecording(isRecording) {
        document.getElementById('recordScreen').disabled = isRecording;
        document.getElementById('stopRecording').disabled = !isRecording;
    }

    updateConnectionStatus(status, className) {
        const statusElement = document.getElementById('connectionStatus');
        statusElement.textContent = status;
        statusElement.className = 'status-indicator ' + className;
    }

    updateVideoInfo(type, stream) {
        if (!stream) return;

        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];
        
        let info = '';
        
        if (videoTrack) {
            const settings = videoTrack.getSettings();
            info += `Video: ${settings.width}x${settings.height} @ ${settings.frameRate}fps\n`;
        }
        
        if (audioTrack) {
            const settings = audioTrack.getSettings();
            info += `Audio: ${settings.sampleRate}Hz, ${settings.channelCount} channels`;
        }

        document.getElementById(type + 'Info').textContent = info;
    }

    updateParticipants(participants) {
        const participantsList = document.getElementById('participantsList');
        participantsList.innerHTML = '';

        participants.forEach(participant => {
            const participantElement = document.createElement('div');
            participantElement.className = 'participant-item';
            participantElement.innerHTML = `
                <div class="participant-status"></div>
                <span>${participant.userName}</span>
                <small>${participant.userId === this.userId ? '(You)' : ''}</small>
            `;
            participantsList.appendChild(participantElement);
        });
    }

    handleParticipantJoined(participant) {
        console.log('New participant:', participant);
        // Update UI to show new participant
    }

    handleParticipantLeft(participant) {
        console.log('Participant left:', participant);
        // Update UI to remove participant
    }

    handleRemoteScreenShare(data) {
        console.log('Remote screen share started:', data);
        // Handle remote screen share UI updates
    }

    handleRemoteScreenShareStopped(data) {
        console.log('Remote screen share stopped:', data);
        document.getElementById('remoteVideo').srcObject = null;
    }

    handleScreenShareError(error) {
        let message = 'Screen sharing failed: ';
        
        switch (error.name) {
            case 'NotAllowedError':
                message += 'Permission denied. Please allow screen capture.';
                break;
            case 'NotFoundError':
                message += 'No screen capture source found.';
                break;
            case 'NotSupportedError':
                message += 'Screen capture not supported in this browser.';
                break;
            case 'AbortError':
                message += 'Screen capture was aborted.';
                break;
            default:
                message += error.message;
        }
        
        alert(message);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new ScreenSharingApp();
});
```

## Advanced Screen Capture Features {#advanced-features}

### Multi-Source Capture

```javascript
class MultiSourceCapture {
    constructor() {
        this.captures = new Map();
        this.mixedStream = null;
    }

    async captureMultipleSources() {
        try {
            // Capture screen
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: { mediaSource: 'screen' }
            });

            // Capture window (user selection)
            const windowStream = await navigator.mediaDevices.getDisplayMedia({
                video: { mediaSource: 'window' }
            });

            // Capture tab
            const tabStream = await navigator.mediaDevices.getDisplayMedia({
                video: { mediaSource: 'browser' }
            });

            this.captures.set('screen', screenStream);
            this.captures.set('window', windowStream);
            this.captures.set('tab', tabStream);

            return this.createMixedStream();

        } catch (error) {
            console.error('Multi-source capture failed:', error);
            throw error;
        }
    }

    createMixedStream() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 1920;
        canvas.height = 1080;

        const videos = [];
        this.captures.forEach((stream, source) => {
            const video = document.createElement('video');
            video.srcObject = stream;
            video.play();
            videos.push({ video, source });
        });

        const drawFrame = () => {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Layout: screen full, window in corner, tab as overlay
            if (videos[0]) { // Screen
                ctx.drawImage(videos[0].video, 0, 0, canvas.width, canvas.height);
            }

            if (videos[1]) { // Window
                const w = canvas.width * 0.3;
                const h = canvas.height * 0.3;
                ctx.drawImage(videos[1].video, canvas.width - w - 20, 20, w, h);
            }

            if (videos[2]) { // Tab
                const w = canvas.width * 0.2;
                const h = canvas.height * 0.2;
                ctx.drawImage(videos[2].video, 20, canvas.height - h - 20, w, h);
            }

            requestAnimationFrame(drawFrame);
        };

        drawFrame();
        this.mixedStream = canvas.captureStream(30);
        return this.mixedStream;
    }

    switchPrimarySource(source) {
        // Dynamically change which source is primary
        const layout = this.getLayoutForSource(source);
        this.applyLayout(layout);
    }

    getLayoutForSource(primarySource) {
        return {
            primary: primarySource,
            secondary: Array.from(this.captures.keys()).filter(s => s !== primarySource)
        };
    }
}
```

### Window Selection Interface

```javascript
class WindowSelector {
    constructor() {
        this.availableSources = [];
    }

    async getAvailableWindows() {
        try {
            // This requires the Screen Capture API with getDisplayMedia
            const sources = await navigator.mediaDevices.enumerateDevices();
            return this.createSourcesInterface();
        } catch (error) {
            console.error('Failed to enumerate windows:', error);
            return [];
        }
    }

    createSourcesInterface() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'window-selector-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <h3>Select Window or Screen</h3>
                    <div class="source-grid">
                        <div class="source-item" data-source="screen">
                            <div class="source-preview">
                                <i class="icon-monitor"></i>
                            </div>
                            <span>Entire Screen</span>
                        </div>
                        <div class="source-item" data-source="window">
                            <div class="source-preview">
                                <i class="icon-window"></i>
                            </div>
                            <span>Application Window</span>
                        </div>
                        <div class="source-item" data-source="tab">
                            <div class="source-preview">
                                <i class="icon-tab"></i>
                            </div>
                            <span>Browser Tab</span>
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
                        <button class="btn btn-primary" onclick="selectSource()">Share</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            window.closeModal = () => {
                document.body.removeChild(modal);
                resolve(null);
            };

            window.selectSource = () => {
                const selected = modal.querySelector('.source-item.selected');
                const source = selected ? selected.dataset.source : 'screen';
                document.body.removeChild(modal);
                resolve(source);
            };

            // Add selection handlers
            modal.querySelectorAll('.source-item').forEach(item => {
                item.addEventListener('click', () => {
                    modal.querySelectorAll('.source-item').forEach(i => i.classList.remove('selected'));
                    item.classList.add('selected');
                });
            });
        });
    }

    async selectAndCapture() {
        const source = await this.getAvailableWindows();
        if (!source) return null;

        const constraints = this.getConstraintsForSource(source);
        return navigator.mediaDevices.getDisplayMedia(constraints);
    }

    getConstraintsForSource(source) {
        const baseConstraints = {
            video: {
                width: { ideal: 1920, max: 1920 },
                height: { ideal: 1080, max: 1080 },
                frameRate: { ideal: 30, max: 30 }
            },
            audio: true
        };

        switch (source) {
            case 'screen':
                baseConstraints.video.mediaSource = 'screen';
                break;
            case 'window':
                baseConstraints.video.mediaSource = 'window';
                break;
            case 'tab':
                baseConstraints.video.mediaSource = 'browser';
                break;
        }

        return baseConstraints;
    }
}
```

## Multi-Monitor & Window Selection {#multi-monitor}

### Monitor Detection and Selection

```javascript
class MultiMonitorCapture {
    constructor() {
        this.monitors = [];
        this.activeCaptures = new Map();
    }

    async detectMonitors() {
        try {
            // Request all available screens
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { mediaSource: 'screen' }
            });

            // Get screen details
            const track = stream.getVideoTracks()[0];
            const settings = track.getSettings();
            
            this.monitors.push({
                id: 'primary',
                width: settings.width,
                height: settings.height,
                stream: stream
            });

            // Clean up initial stream
            stream.getTracks().forEach(track => track.stop());

            return this.monitors;

        } catch (error) {
            console.error('Monitor detection failed:', error);
            return [];
        }
    }

    async captureSpecificMonitor(monitorId) {
        try {
            const constraints = {
                video: {
                    mediaSource: 'screen',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: false
            };

            const stream = await navigator.mediaDevices.getDisplayMedia(constraints);
            this.activeCaptures.set(monitorId, stream);
            
            return stream;

        } catch (error) {
            console.error(`Failed to capture monitor ${monitorId}:`, error);
            throw error;
        }
    }

    async captureAllMonitors() {
        const captures = [];
        
        for (const monitor of this.monitors) {
            try {
                const stream = await this.captureSpecificMonitor(monitor.id);
                captures.push({
                    monitor: monitor,
                    stream: stream
                });
            } catch (error) {
                console.warn(`Skipping monitor ${monitor.id}:`, error);
            }
        }

        return captures;
    }

    createMultiMonitorLayout(captures) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate layout dimensions
        const totalWidth = captures.reduce((sum, c) => sum + c.monitor.width, 0);
        const maxHeight = Math.max(...captures.map(c => c.monitor.height));
        
        canvas.width = totalWidth;
        canvas.height = maxHeight;

        const videos = captures.map(capture => {
            const video = document.createElement('video');
            video.srcObject = capture.stream;
            video.play();
            return { video, monitor: capture.monitor };
        });

        let xOffset = 0;
        const drawFrame = () => {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            videos.forEach(({ video, monitor }) => {
                ctx.drawImage(video, xOffset, 0, monitor.width, monitor.height);
                xOffset += monitor.width;
            });
            
            xOffset = 0;
            requestAnimationFrame(drawFrame);
        };

        drawFrame();
        return canvas.captureStream(30);
    }

    stopAllCaptures() {
        this.activeCaptures.forEach(stream => {
            stream.getTracks().forEach(track => track.stop());
        });
        this.activeCaptures.clear();
    }
}
```

## Audio Capture Integration {#audio-capture}

### System Audio Capture

```javascript
class SystemAudioCapture {
    constructor() {
        this.audioContext = null;
        this.audioStream = null;
        this.mixedStream = null;
    }

    async captureSystemAudio() {
        try {
            // Capture system audio through getDisplayMedia
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: false,
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                    googEchoCancellation: false,
                    googNoiseSuppression: false,
                    googAutoGainControl: false
                }
            });

            this.audioStream = stream;
            return stream;

        } catch (error) {
            console.error('System audio capture failed:', error);
            throw error;
        }
    }

    async captureMicrophoneAudio() {
        try {
            return await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 48000
                }
            });
        } catch (error) {
            console.error('Microphone capture failed:', error);
            throw error;
        }
    }

    async createMixedAudio(systemStream, micStream) {
        this.audioContext = new AudioContext({ sampleRate: 48000 });
        
        const systemSource = this.audioContext.createMediaStreamSource(systemStream);
        const micSource = this.audioContext.createMediaStreamSource(micStream);
        
        // Create gain nodes for volume control
        const systemGain = this.audioContext.createGain();
        const micGain = this.audioContext.createGain();
        
        // Default levels
        systemGain.gain.value = 0.7;
        micGain.gain.value = 0.5;
        
        // Create compressor for audio quality
        const compressor = this.audioContext.createDynamicsCompressor();
        compressor.threshold.value = -24;
        compressor.knee.value = 30;
        compressor.ratio.value = 12;
        compressor.attack.value = 0.003;
        compressor.release.value = 0.25;
        
        // Create mixer
        const mixer = this.audioContext.createGain();
        
        // Connect audio graph
        systemSource.connect(systemGain);
        micSource.connect(micGain);
        
        systemGain.connect(mixer);
        micGain.connect(mixer);
        
        mixer.connect(compressor);
        
        // Create output stream
        const destination = this.audioContext.createMediaStreamDestination();
        compressor.connect(destination);
        
        this.mixedStream = destination.stream;
        return this.mixedStream;
    }

    adjustSystemVolume(level) {
        if (this.audioContext) {
            const systemGain = this.audioContext.createGain();
            systemGain.gain.value = Math.max(0, Math.min(1, level));
        }
    }

    adjustMicrophoneVolume(level) {
        if (this.audioContext) {
            const micGain = this.audioContext.createGain();
            micGain.gain.value = Math.max(0, Math.min(1, level));
        }
    }

    addAudioEffects(effectType) {
        if (!this.audioContext) return;

        let effect;
        
        switch (effectType) {
            case 'reverb':
                effect = this.createReverbEffect();
                break;
            case 'echo':
                effect = this.createEchoEffect();
                break;
            case 'noise-gate':
                effect = this.createNoiseGateEffect();
                break;
        }

        if (effect) {
            // Insert effect into audio chain
            this.insertAudioEffect(effect);
        }
    }

    createReverbEffect() {
        const convolver = this.audioContext.createConvolver();
        
        // Create impulse response
        const impulseLength = this.audioContext.sampleRate * 2;
        const impulse = this.audioContext.createBuffer(2, impulseLength, this.audioContext.sampleRate);
        
        for (let channel = 0; channel < impulse.numberOfChannels; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < impulseLength; i++) {
                channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulseLength, 2);
            }
        }
        
        convolver.buffer = impulse;
        return convolver;
    }

    createEchoEffect() {
        const delay = this.audioContext.createDelay(1.0);
        const feedback = this.audioContext.createGain();
        const wetGain = this.audioContext.createGain();
        
        delay.delayTime.value = 0.3;
        feedback.gain.value = 0.3;
        wetGain.gain.value = 0.2;
        
        delay.connect(feedback);
        feedback.connect(delay);
        delay.connect(wetGain);
        
        return { input: delay, output: wetGain };
    }

    cleanup() {
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        if (this.audioStream) {
            this.audioStream.getTracks().forEach(track => track.stop());
            this.audioStream = null;
        }
    }
}
```

## Recording & Streaming {#recording}

### Advanced Recording Features

```javascript
class AdvancedRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isRecording = false;
        this.recordingStartTime = null;
        this.recordingMetadata = {};
    }

    async startAdvancedRecording(stream, options = {}) {
        const defaultOptions = {
            mimeType: 'video/webm;codecs=vp9,opus',
            videoBitsPerSecond: 5000000,
            audioBitsPerSecond: 128000,
            quality: 'high',
            format: 'webm',
            recordAudio: true,
            recordVideo: true
        };

        const recordingOptions = { ...defaultOptions, ...options };
        
        try {
            // Determine the best codec
            const mimeType = this.getBestMimeType(recordingOptions.format);
            
            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: mimeType,
                videoBitsPerSecond: recordingOptions.videoBitsPerSecond,
                audioBitsPerSecond: recordingOptions.audioBitsPerSecond
            });

            this.recordedChunks = [];
            this.recordingStartTime = Date.now();
            
            this.setupRecorderEvents(recordingOptions);
            
            this.mediaRecorder.start(1000); // 1-second timeslices
            this.isRecording = true;
            
            this.recordingMetadata = {
                startTime: this.recordingStartTime,
                options: recordingOptions,
                stream: {
                    videoTracks: stream.getVideoTracks().length,
                    audioTracks: stream.getAudioTracks().length
                }
            };

            console.log('Advanced recording started:', this.recordingMetadata);
            return true;

        } catch (error) {
            console.error('Failed to start recording:', error);
            throw error;
        }
    }

    getBestMimeType(format) {
        const mimeTypes = {
            'webm': [
                'video/webm;codecs=vp9,opus',
                'video/webm;codecs=vp8,opus',
                'video/webm;codecs=h264,opus',
                'video/webm'
            ],
            'mp4': [
                'video/mp4;codecs=h264,aac',
                'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
                'video/mp4'
            ]
        };

        const candidates = mimeTypes[format] || mimeTypes['webm'];
        
        for (const mimeType of candidates) {
            if (MediaRecorder.isTypeSupported(mimeType)) {
                return mimeType;
            }
        }

        throw new Error(`No supported mime type found for format: ${format}`);
    }

    setupRecorderEvents(options) {
        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.recordedChunks.push(event.data);
                this.updateRecordingProgress();
            }
        };

        this.mediaRecorder.onstop = () => {
            this.finalizeRecording(options);
        };

        this.mediaRecorder.onerror = (event) => {
            console.error('Recording error:', event.error);
            this.handleRecordingError(event.error);
        };

        this.mediaRecorder.onpause = () => {
            console.log('Recording paused');
        };

        this.mediaRecorder.onresume = () => {
            console.log('Recording resumed');
        };
    }

    updateRecordingProgress() {
        const duration = Date.now() - this.recordingStartTime;
        const size = this.recordedChunks.reduce((total, chunk) => total + chunk.size, 0);
        
        const progress = {
            duration: Math.floor(duration / 1000),
            size: this.formatBytes(size),
            chunks: this.recordedChunks.length
        };

        this.onRecordingProgress?.(progress);
    }

    pauseRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.pause();
        }
    }

    resumeRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.resume();
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
        }
    }

    async finalizeRecording(options) {
        const blob = new Blob(this.recordedChunks, {
            type: this.mediaRecorder.mimeType
        });

        const duration = Date.now() - this.recordingStartTime;
        const finalMetadata = {
            ...this.recordingMetadata,
            endTime: Date.now(),
            duration: duration,
            size: blob.size,
            chunks: this.recordedChunks.length
        };

        console.log('Recording finalized:', finalMetadata);

        if (options.autoSave !== false) {
            await this.saveRecording(blob, finalMetadata);
        }

        if (options.autoUpload) {
            await this.uploadRecording(blob, finalMetadata);
        }

        this.onRecordingComplete?.(blob, finalMetadata);
        return { blob, metadata: finalMetadata };
    }

    async saveRecording(blob, metadata) {
        const timestamp = new Date(metadata.startTime).toISOString().slice(0, 19).replace(/:/g, '-');
        const extension = this.getFileExtension(this.mediaRecorder.mimeType);
        const filename = `screen-recording-${timestamp}.${extension}`;

        // Save to downloads
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Also save metadata
        const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], {
            type: 'application/json'
        });
        const metadataUrl = URL.createObjectURL(metadataBlob);
        const metadataLink = document.createElement('a');
        metadataLink.href = metadataUrl;
        metadataLink.download = `${filename.replace(/\.[^.]+$/, '')}-metadata.json`;
        document.body.appendChild(metadataLink);
        metadataLink.click();
        document.body.removeChild(metadataLink);
        URL.revokeObjectURL(metadataUrl);
    }

    async uploadRecording(blob, metadata) {
        const formData = new FormData();
        formData.append('recording', blob);
        formData.append('metadata', JSON.stringify(metadata));

        try {
            const response = await fetch('/api/recordings/upload', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`Upload failed: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('Recording uploaded:', result);
            return result;

        } catch (error) {
            console.error('Upload failed:', error);
            throw error;
        }
    }

    getFileExtension(mimeType) {
        const extensions = {
            'video/webm': 'webm',
            'video/mp4': 'mp4',
            'video/ogg': 'ogv'
        };

        for (const [type, ext] of Object.entries(extensions)) {
            if (mimeType.includes(type)) {
                return ext;
            }
        }

        return 'webm';
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    handleRecordingError(error) {
        console.error('Recording error:', error);
        this.isRecording = false;
        this.onRecordingError?.(error);
    }

    // Event handlers (can be overridden)
    onRecordingProgress(progress) {
        console.log('Recording progress:', progress);
    }

    onRecordingComplete(blob, metadata) {
        console.log('Recording complete:', metadata);
    }

    onRecordingError(error) {
        console.error('Recording error:', error);
    }
}
```

### Live Streaming Integration

```javascript
class LiveStreamingManager {
    constructor() {
        this.streamingTargets = new Map();
        this.isStreaming = false;
        this.streamingMetrics = {};
    }

    async startLiveStream(stream, targets) {
        try {
            for (const target of targets) {
                await this.initializeStreamingTarget(target, stream);
            }

            this.isStreaming = true;
            this.startMetricsCollection();
            
            console.log('Live streaming started to targets:', targets);
            return true;

        } catch (error) {
            console.error('Failed to start live streaming:', error);
            throw error;
        }
    }

    async initializeStreamingTarget(target, stream) {
        switch (target.type) {
            case 'rtmp':
                return this.initializeRTMPStream(target, stream);
            case 'webrtc':
                return this.initializeWebRTCStream(target, stream);
            case 'youtube':
                return this.initializeYouTubeStream(target, stream);
            case 'twitch':
                return this.initializeTwitchStream(target, stream);
            default:
                throw new Error(`Unsupported streaming target: ${target.type}`);
        }
    }

    async initializeRTMPStream(target, stream) {
        // RTMP streaming requires a media server
        const rtmpConfig = {
            url: target.url,
            key: target.streamKey,
            bitrate: target.bitrate || 2500,
            resolution: target.resolution || '1080p'
        };

        // This would typically use a WebRTC-to-RTMP bridge service
        const streamingEndpoint = await this.createRTMPBridge(rtmpConfig);
        
        // Create peer connection to streaming service
        const pc = new RTCPeerConnection();
        stream.getTracks().forEach(track => {
            pc.addTrack(track, stream);
        });

        // Connect to streaming endpoint
        await this.connectToStreamingEndpoint(pc, streamingEndpoint);
        
        this.streamingTargets.set(target.id, {
            type: 'rtmp',
            connection: pc,
            config: rtmpConfig,
            status: 'connected'
        });
    }

    async initializeWebRTCStream(target, stream) {
        const pc = new RTCPeerConnection({
            iceServers: target.iceServers || [
                { urls: 'stun:stun.l.google.com:19302' }
            ]
        });

        stream.getTracks().forEach(track => {
            pc.addTrack(track, stream);
        });

        // Handle WebRTC signaling
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.sendSignalingMessage(target, {
                    type: 'ice-candidate',
                    candidate: event.candidate
                });
            }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // Send offer to target
        await this.sendSignalingMessage(target, {
            type: 'offer',
            offer: offer
        });

        this.streamingTargets.set(target.id, {
            type: 'webrtc',
            connection: pc,
            config: target,
            status: 'connecting'
        });
    }

    async createRTMPBridge(config) {
        // This would connect to a WebRTC-to-RTMP bridge service
        const response = await fetch('/api/streaming/rtmp-bridge', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config)
        });

        if (!response.ok) {
            throw new Error('Failed to create RTMP bridge');
        }

        return response.json();
    }

    startMetricsCollection() {
        this.metricsInterval = setInterval(() => {
            this.collectStreamingMetrics();
        }, 5000);
    }

    collectStreamingMetrics() {
        const metrics = {};

        this.streamingTargets.forEach((target, id) => {
            if (target.connection && target.connection.getStats) {
                target.connection.getStats().then(stats => {
                    metrics[id] = this.parseRTCStats(stats);
                });
            }
        });

        this.streamingMetrics = metrics;
        this.onMetricsUpdate?.(metrics);
    }

    parseRTCStats(stats) {
        const parsed = {
            bitrate: 0,
            packetsLost: 0,
            roundTripTime: 0,
            jitter: 0
        };

        stats.forEach(report => {
            if (report.type === 'outbound-rtp') {
                parsed.bitrate += report.bytesPerSecond || 0;
                parsed.packetsLost += report.packetsLost || 0;
            }
            if (report.type === 'candidate-pair' && report.nominated) {
                parsed.roundTripTime = report.currentRoundTripTime || 0;
            }
        });

        return parsed;
    }

    async stopLiveStream() {
        try {
            this.streamingTargets.forEach((target, id) => {
                if (target.connection) {
                    target.connection.close();
                }
            });

            this.streamingTargets.clear();
            this.isStreaming = false;

            if (this.metricsInterval) {
                clearInterval(this.metricsInterval);
                this.metricsInterval = null;
            }

            console.log('Live streaming stopped');
            return true;

        } catch (error) {
            console.error('Failed to stop live streaming:', error);
            throw error;
        }
    }

    getStreamingStatus() {
        const status = {
            isStreaming: this.isStreaming,
            targets: Array.from(this.streamingTargets.entries()).map(([id, target]) => ({
                id,
                type: target.type,
                status: target.status
            })),
            metrics: this.streamingMetrics
        };

        return status;
    }

    // Event handlers
    onMetricsUpdate(metrics) {
        console.log('Streaming metrics:', metrics);
    }

    async sendSignalingMessage(target, message) {
        // Implementation depends on signaling method
        if (target.signaling === 'websocket') {
            target.ws.send(JSON.stringify(message));
        } else if (target.signaling === 'http') {
            await fetch(target.signalingUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(message)
            });
        }
    }
}
```

## Performance Optimization {#optimization}

### Adaptive Quality Control

```javascript
class AdaptiveQualityController {
    constructor() {
        this.currentQuality = 'medium';
        this.metrics = {
            bandwidth: 0,
            cpu: 0,
            frameRate: 0,
            packetsLost: 0
        };
        this.qualityLevels = {
            ultra: { width: 3840, height: 2160, frameRate: 30, bitrate: 8000 },
            high: { width: 2560, height: 1440, frameRate: 30, bitrate: 5000 },
            medium: { width: 1920, height: 1080, frameRate: 24, bitrate: 2500 },
            low: { width: 1280, height: 720, frameRate: 15, bitrate: 1000 },
            potato: { width: 854, height: 480, frameRate: 10, bitrate: 500 }
        };
        this.adaptationHistory = [];
    }

    async startAdaptiveMonitoring(stream, peerConnection) {
        this.stream = stream;
        this.peerConnection = peerConnection;
        
        this.monitoringInterval = setInterval(() => {
            this.collectMetrics();
            this.analyzeAndAdapt();
        }, 5000);

        this.cpuMonitor = this.startCPUMonitoring();
        await this.setupBandwidthMonitoring();
    }

    async collectMetrics() {
        if (this.peerConnection) {
            const stats = await this.peerConnection.getStats();
            this.parseWebRTCStats(stats);
        }

        this.metrics.cpu = await this.getCPUUsage();
        this.metrics.timestamp = Date.now();
    }

    parseWebRTCStats(stats) {
        stats.forEach(report => {
            if (report.type === 'outbound-rtp' && report.mediaType === 'video') {
                this.metrics.frameRate = report.framesPerSecond || 0;
                this.metrics.bitrate = report.bytesPerSecond * 8 || 0;
                this.metrics.packetsLost = report.packetsLost || 0;
            }
            
            if (report.type === 'candidate-pair' && report.nominated) {
                this.metrics.bandwidth = this.estimateBandwidth(report);
                this.metrics.rtt = report.currentRoundTripTime || 0;
            }
        });
    }

    estimateBandwidth(report) {
        const bytesReceived = report.bytesReceived || 0;
        const bytesSent = report.bytesSent || 0;
        const timeElapsed = report.timestamp / 1000;
        
        return ((bytesReceived + bytesSent) * 8) / timeElapsed;
    }

    async getCPUUsage() {
        if ('getGamepads' in navigator) {
            // Use performance API as proxy for CPU usage
            const now = performance.now();
            const entries = performance.getEntries();
            const recentEntries = entries.filter(entry => 
                entry.startTime > now - 5000
            );
            
            const avgDuration = recentEntries.reduce((sum, entry) => 
                sum + (entry.duration || 0), 0
            ) / recentEntries.length;
            
            return Math.min(avgDuration / 16.67 * 100, 100); // Normalize to percentage
        }
        return 0;
    }

    analyzeAndAdapt() {
        const currentLevel = this.qualityLevels[this.currentQuality];
        let newQuality = this.currentQuality;
        let reason = '';

        // Check for degradation conditions
        if (this.metrics.cpu > 80) {
            newQuality = this.downgradeQuality(this.currentQuality);
            reason = 'High CPU usage';
        } else if (this.metrics.packetsLost > 5) {
            newQuality = this.downgradeQuality(this.currentQuality);
            reason = 'High packet loss';
        } else if (this.metrics.bandwidth < currentLevel.bitrate * 1.2) {
            newQuality = this.downgradeQuality(this.currentQuality);
            reason = 'Insufficient bandwidth';
        } else if (this.metrics.frameRate < currentLevel.frameRate * 0.8) {
            newQuality = this.downgradeQuality(this.currentQuality);
            reason = 'Low frame rate';
        }
        
        // Check for improvement conditions
        else if (
            this.metrics.cpu < 50 && 
            this.metrics.packetsLost < 1 &&
            this.metrics.bandwidth > this.getNextQualityLevel(this.currentQuality)?.bitrate * 1.5
        ) {
            newQuality = this.upgradeQuality(this.currentQuality);
            reason = 'Good conditions, upgrading';
        }

        if (newQuality !== this.currentQuality) {
            this.adaptQuality(newQuality, reason);
        }
    }

    downgradeQuality(current) {
        const levels = Object.keys(this.qualityLevels);
        const currentIndex = levels.indexOf(current);
        return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : current;
    }

    upgradeQuality(current) {
        const levels = Object.keys(this.qualityLevels);
        const currentIndex = levels.indexOf(current);
        return currentIndex > 0 ? levels[currentIndex - 1] : current;
    }

    getNextQualityLevel(current) {
        const upgraded = this.upgradeQuality(current);
        return this.qualityLevels[upgraded];
    }

    async adaptQuality(newQuality, reason) {
        const oldQuality = this.currentQuality;
        this.currentQuality = newQuality;
        
        const adaptation = {
            timestamp: Date.now(),
            from: oldQuality,
            to: newQuality,
            reason: reason,
            metrics: { ...this.metrics }
        };
        
        this.adaptationHistory.push(adaptation);
        
        // Keep only last 50 adaptations
        if (this.adaptationHistory.length > 50) {
            this.adaptationHistory.shift();
        }

        console.log(`Quality adapted: ${oldQuality} → ${newQuality} (${reason})`);
        
        try {
            await this.applyQualitySettings(newQuality);
            this.onQualityAdapted?.(adaptation);
        } catch (error) {
            console.error('Failed to apply quality settings:', error);
            this.currentQuality = oldQuality; // Rollback
        }
    }

    async applyQualitySettings(quality) {
        const settings = this.qualityLevels[quality];
        
        if (this.stream) {
            const videoTrack = this.stream.getVideoTracks()[0];
            if (videoTrack && videoTrack.applyConstraints) {
                await videoTrack.applyConstraints({
                    width: { ideal: settings.width },
                    height: { ideal: settings.height },
                    frameRate: { ideal: settings.frameRate }
                });
            }
        }

        // Update encoding parameters if using RTCRtpSender
        if (this.peerConnection) {
            const senders = this.peerConnection.getSenders();
            for (const sender of senders) {
                if (sender.track && sender.track.kind === 'video') {
                    const params = sender.getParameters();
                    if (params.encodings && params.encodings[0]) {
                        params.encodings[0].maxBitrate = settings.bitrate * 1000;
                        params.encodings[0].maxFramerate = settings.frameRate;
                        await sender.setParameters(params);
                    }
                }
            }
        }
    }

    getQualityReport() {
        return {
            currentQuality: this.currentQuality,
            currentSettings: this.qualityLevels[this.currentQuality],
            metrics: this.metrics,
            adaptationHistory: this.adaptationHistory.slice(-10), // Last 10 adaptations
            qualityScore: this.calculateQualityScore()
        };
    }

    calculateQualityScore() {
        const weights = {
            frameRate: 0.3,
            bitrate: 0.3,
            packetsLost: -0.2,
            cpu: -0.1,
            rtt: -0.1
        };

        const normalized = {
            frameRate: Math.min(this.metrics.frameRate / 30, 1),
            bitrate: Math.min(this.metrics.bitrate / 5000000, 1),
            packetsLost: Math.max(1 - this.metrics.packetsLost / 10, 0),
            cpu: Math.max(1 - this.metrics.cpu / 100, 0),
            rtt: Math.max(1 - this.metrics.rtt * 1000 / 200, 0)
        };

        let score = 0;
        for (const [metric, weight] of Object.entries(weights)) {
            score += (normalized[metric] || 0) * Math.abs(weight);
        }

        return Math.round(score * 100);
    }

    stopAdaptiveMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        
        if (this.cpuMonitor) {
            this.cpuMonitor.disconnect();
            this.cpuMonitor = null;
        }
    }

    onQualityAdapted(adaptation) {
        console.log('Quality adaptation:', adaptation);
    }
}
```

## Production Deployment {#production}

### Node.js Signaling Server

```javascript
// server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

class ScreenSharingServer {
    constructor(port = 3000) {
        this.port = port;
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server, {
            cors: {
                origin: process.env.ALLOWED_ORIGINS?.split(',') || ["http://localhost:3000"],
                methods: ["GET", "POST"]
            },
            transports: ['websocket', 'polling']
        });
        
        this.rooms = new Map();
        this.users = new Map();
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupSocketHandlers();
    }

    setupMiddleware() {
        // Security
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    mediaSrc: ["'self'", "blob:", "data:"],
                    connectSrc: ["'self'", "wss:", "ws:"]
                }
            }
        }));

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 1000, // Limit each IP to 1000 requests per windowMs
            message: 'Too many requests from this IP'
        });
        this.app.use(limiter);

        // Compression and parsing
        this.app.use(compression());
        this.app.use(cors());
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.static('public'));
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                uptime: process.uptime(),
                timestamp: new Date().toISOString(),
                rooms: this.rooms.size,
                users: this.users.size
            });
        });

        // Room management API
        this.app.get('/api/rooms', (req, res) => {
            const roomList = Array.from(this.rooms.entries()).map(([id, room]) => ({
                id,
                participants: room.participants.length,
                created: room.created,
                hasScreenShare: room.hasScreenShare
            }));
            res.json(roomList);
        });

        this.app.post('/api/rooms/:roomId/join', (req, res) => {
            const { roomId } = req.params;
            const { userId, userName } = req.body;

            if (!this.rooms.has(roomId)) {
                this.rooms.set(roomId, {
                    id: roomId,
                    participants: [],
                    created: new Date(),
                    hasScreenShare: false
                });
            }

            const room = this.rooms.get(roomId);
            const existingUser = room.participants.find(p => p.userId === userId);
            
            if (!existingUser) {
                room.participants.push({
                    userId,
                    userName,
                    joined: new Date(),
                    isScreenSharing: false
                });
            }

            res.json({ 
                room: {
                    id: roomId,
                    participants: room.participants
                }
            });
        });

        // Recording upload endpoint
        this.app.post('/api/recordings/upload', (req, res) => {
            // Implementation for handling recording uploads
            res.json({ success: true, id: Date.now() });
        });
    }

    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log('User connected:', socket.id);

            socket.on('join-room', (data) => {
                this.handleJoinRoom(socket, data);
            });

            socket.on('leave-room', (data) => {
                this.handleLeaveRoom(socket, data);
            });

            socket.on('offer', (data) => {
                this.handleOffer(socket, data);
            });

            socket.on('answer', (data) => {
                this.handleAnswer(socket, data);
            });

            socket.on('ice-candidate', (data) => {
                this.handleIceCandidate(socket, data);
            });

            socket.on('screen-share-started', (data) => {
                this.handleScreenShareStarted(socket, data);
            });

            socket.on('screen-share-stopped', (data) => {
                this.handleScreenShareStopped(socket, data);
            });

            socket.on('disconnect', () => {
                this.handleDisconnect(socket);
            });
        });
    }

    handleJoinRoom(socket, data) {
        const { roomId, userId, userName } = data;
        
        socket.join(roomId);
        socket.userId = userId;
        socket.roomId = roomId;
        
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, {
                id: roomId,
                participants: [],
                created: new Date(),
                hasScreenShare: false
            });
        }

        const room = this.rooms.get(roomId);
        const existingUserIndex = room.participants.findIndex(p => p.userId === userId);
        
        if (existingUserIndex >= 0) {
            room.participants[existingUserIndex].socketId = socket.id;
        } else {
            room.participants.push({
                userId,
                userName,
                socketId: socket.id,
                joined: new Date(),
                isScreenSharing: false
            });
        }

        this.users.set(socket.id, {
            userId,
            userName,
            roomId,
            joined: new Date()
        });

        // Notify user of successful join
        socket.emit('room-joined', {
            roomId,
            participants: room.participants
        });

        // Notify other participants
        socket.to(roomId).emit('participant-joined', {
            userId,
            userName,
            joined: new Date()
        });

        console.log(`User ${userId} joined room ${roomId}`);
    }

    handleLeaveRoom(socket, data) {
        const { roomId, userId } = data;
        
        socket.leave(roomId);
        
        if (this.rooms.has(roomId)) {
            const room = this.rooms.get(roomId);
            room.participants = room.participants.filter(p => p.userId !== userId);
            
            if (room.participants.length === 0) {
                this.rooms.delete(roomId);
            }

            socket.to(roomId).emit('participant-left', { userId });
        }

        this.users.delete(socket.id);
        console.log(`User ${userId} left room ${roomId}`);
    }

    handleOffer(socket, data) {
        const { offer, roomId, from } = data;
        
        socket.to(roomId).emit('offer', {
            offer,
            from,
            timestamp: new Date()
        });

        console.log(`Offer from ${from} in room ${roomId}`);
    }

    handleAnswer(socket, data) {
        const { answer, roomId, from, to } = data;
        
        if (to) {
            // Send to specific user
            const targetSocket = this.findSocketByUserId(to, roomId);
            if (targetSocket) {
                targetSocket.emit('answer', {
                    answer,
                    from,
                    timestamp: new Date()
                });
            }
        } else {
            // Broadcast to room
            socket.to(roomId).emit('answer', {
                answer,
                from,
                timestamp: new Date()
            });
        }

        console.log(`Answer from ${from} in room ${roomId}`);
    }

    handleIceCandidate(socket, data) {
        const { candidate, roomId, to } = data;
        
        if (to) {
            const targetSocket = this.findSocketByUserId(to, roomId);
            if (targetSocket) {
                targetSocket.emit('ice-candidate', {
                    candidate,
                    from: socket.userId,
                    timestamp: new Date()
                });
            }
        } else {
            socket.to(roomId).emit('ice-candidate', {
                candidate,
                from: socket.userId,
                timestamp: new Date()
            });
        }
    }

    handleScreenShareStarted(socket, data) {
        const { roomId, userId, quality, hasAudio } = data;
        
        if (this.rooms.has(roomId)) {
            const room = this.rooms.get(roomId);
            const participant = room.participants.find(p => p.userId === userId);
            if (participant) {
                participant.isScreenSharing = true;
            }
            room.hasScreenShare = true;
        }

        socket.to(roomId).emit('screen-share-started', {
            userId,
            quality,
            hasAudio,
            timestamp: new Date()
        });

        console.log(`Screen share started by ${userId} in room ${roomId}`);
    }

    handleScreenShareStopped(socket, data) {
        const { roomId, userId } = data;
        
        if (this.rooms.has(roomId)) {
            const room = this.rooms.get(roomId);
            const participant = room.participants.find(p => p.userId === userId);
            if (participant) {
                participant.isScreenSharing = false;
            }
            
            // Check if anyone else is sharing
            room.hasScreenShare = room.participants.some(p => p.isScreenSharing);
        }

        socket.to(roomId).emit('screen-share-stopped', {
            userId,
            timestamp: new Date()
        });

        console.log(`Screen share stopped by ${userId} in room ${roomId}`);
    }

    handleDisconnect(socket) {
        console.log('User disconnected:', socket.id);
        
        const user = this.users.get(socket.id);
        if (user) {
            this.handleLeaveRoom(socket, {
                roomId: user.roomId,
                userId: user.userId
            });
        }
    }

    findSocketByUserId(userId, roomId) {
        const room = this.io.sockets.adapter.rooms.get(roomId);
        if (!room) return null;

        for (const socketId of room) {
            const socket = this.io.sockets.sockets.get(socketId);
            if (socket && socket.userId === userId) {
                return socket;
            }
        }
        return null;
    }

    start() {
        this.server.listen(this.port, () => {
            console.log(`Screen sharing server running on port ${this.port}`);
            console.log(`Health check: http://localhost:${this.port}/health`);
        });
    }

    stop() {
        this.server.close();
    }
}

// Start server
const port = process.env.PORT || 3000;
const server = new ScreenSharingServer(port);
server.start();

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('Shutting down gracefully...');
    server.stop();
    process.exit(0);
});

module.exports = ScreenSharingServer;
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    ffmpeg \
    python3 \
    make \
    g++

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy application files
COPY . .

# Create uploads directory
RUN mkdir -p uploads recordings

# Set permissions
RUN addgroup -g 1001 -S nodejs
RUN adduser -S screenapp -u 1001
RUN chown -R screenapp:nodejs /app
USER screenapp

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start application
CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  screen-sharing-app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - ALLOWED_ORIGINS=https://yourdomain.com
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
      - coturn
    volumes:
      - ./recordings:/app/recordings
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

  coturn:
    image: coturn/coturn:latest
    ports:
      - "3478:3478"
      - "3478:3478/udp"
      - "49152-65535:49152-65535/udp"
    environment:
      - TURN_USERNAME=screenapp
      - TURN_PASSWORD=your-secure-password
      - TURN_REALM=yourdomain.com
    volumes:
      - ./coturn.conf:/etc/turnserver.conf
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - screen-sharing-app
    restart: unless-stopped

volumes:
  redis_data:
```

### Production Security Configuration

```javascript
// security-config.js
const securityConfig = {
    // HTTPS enforcement
    https: {
        enabled: process.env.NODE_ENV === 'production',
        cert: process.env.SSL_CERT_PATH,
        key: process.env.SSL_KEY_PATH,
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        }
    },

    // CORS configuration
    cors: {
        origin: (origin, callback) => {
            const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',');
            
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization']
    },

    // Rate limiting
    rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: (req) => {
            if (req.path.includes('/api/recordings/upload')) {
                return 5; // Stricter limit for uploads
            }
            return 1000; // General limit
        },
        message: 'Too many requests from this IP',
        standardHeaders: true,
        legacyHeaders: false
    },

    // Content Security Policy
    csp: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
            fontSrc: ["'self'", "fonts.gstatic.com"],
            mediaSrc: ["'self'", "blob:", "data:"],
            connectSrc: ["'self'", "wss:", "ws:", "*.yourdomain.com"],
            imgSrc: ["'self'", "data:", "blob:"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: []
        }
    },

    // File upload restrictions
    upload: {
        maxFileSize: 500 * 1024 * 1024, // 500MB
        allowedMimeTypes: [
            'video/webm',
            'video/mp4',
            'video/ogg'
        ],
        maxFiles: 10,
        destination: process.env.UPLOAD_PATH || './uploads'
    },

    // WebRTC security
    webrtc: {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            {
                urls: `turn:${process.env.TURN_SERVER_URL || 'your-turn-server.com'}:3478`,
                username: process.env.TURN_USERNAME,
                credential: process.env.TURN_PASSWORD
            }
        ],
        iceCandidatePoolSize: 10,
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require'
    },

    // Session configuration
    session: {
        secret: process.env.SESSION_SECRET || 'your-super-secret-key-change-in-production',
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            sameSite: 'strict'
        }
    },

    // Logging configuration
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.NODE_ENV === 'production' ? 'json' : 'dev',
        file: {
            enabled: true,
            path: process.env.LOG_PATH || './logs',
            maxSize: '20m',
            maxFiles: '14d'
        }
    }
};

module.exports = securityConfig;
```

## Conclusion

This comprehensive guide covers professional-grade WebRTC screen sharing implementation with:

- **Multi-source capture** with window selection
- **Advanced audio processing** with system audio capture
- **Adaptive quality control** based on network conditions
- **Professional recording** with multiple formats
- **Live streaming** to various platforms
- **Production-ready deployment** with Docker and security

The implementation provides a solid foundation for building enterprise-level screen sharing applications with real-time optimization and professional features.

Key features achieved:
- ✅ Multi-monitor support
- ✅ System audio capture
- ✅ Adaptive quality control
- ✅ Advanced recording capabilities
- ✅ Live streaming integration
- ✅ Production security
- ✅ Docker deployment
- ✅ Performance optimization

This solution can handle enterprise workloads and provides the foundation for building commercial screen sharing applications.