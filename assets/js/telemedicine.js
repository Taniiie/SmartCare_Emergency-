// ─── STATE ───
let callActive = false;
let callDuration = 0;
let callTimer = null;
let vitalsInterval = null;

// ─── VITALS STATE ───
let vitals = {
    heartRate: 72,
    spo2: 98,
    bpSystolic: 120,
    bpDiastolic: 80,
    temp: 36.8
};

// ─── QUICK CONNECT ───
function quickConnect() {
    const randomRoom = 'SmartCare-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    document.getElementById('roomInput').value = randomRoom;
    startCall();
}

// ─── START CALL ───
function startCall() {
    const roomInput = document.getElementById('roomInput');
    const roomName = roomInput.value.trim() ||
        'SmartCare-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    roomInput.value = roomName;

    // Switch screens
    document.getElementById('preCallScreen').style.display = 'none';
    document.getElementById('inCallScreen').style.display = 'grid';

    // Set Jitsi iframe
    const safeRoom = encodeURIComponent(roomName.replace(/\s+/g, '-'));
    document.getElementById('jitsiFrame').src =
        `https://meet.jit.si/${safeRoom}#config.prejoinPageEnabled=false`;

    // Show room name in header
    document.getElementById('callRoomName').textContent = `Room: ${roomName}`;

    // Start call duration timer
    callDuration = 0;
    callTimer = setInterval(() => {
        callDuration++;
        const m = String(Math.floor(callDuration / 60)).padStart(2, '0');
        const s = String(callDuration % 60).padStart(2, '0');
        document.getElementById('callDuration').textContent = `${m}:${s}`;
    }, 1000);

    // Start vitals animation
    startVitalsAnimation();

    callActive = true;

    if (window.toast) toast(`Joined room: ${roomName}`, 'success');
}

// ─── END CALL ───
function endCall() {
    // Stop timers
    clearInterval(callTimer);
    clearInterval(vitalsInterval);

    // Clear iframe
    document.getElementById('jitsiFrame').src = '';

    // Switch back to pre-call screen
    document.getElementById('inCallScreen').style.display = 'none';
    document.getElementById('preCallScreen').style.display = 'block';

    callActive = false;

    // Show toast
    if (window.toast) toast('Call ended. Stay safe! 🩺', 'info');
}

// ─── VITALS ANIMATION ───
function startVitalsAnimation() {
    updateVitalsDisplay(); // immediate first update

    vitalsInterval = setInterval(() => {
        // Fluctuate values within realistic ranges
        vitals.heartRate = clamp(vitals.heartRate + rand(-3, 3), 55, 120);
        vitals.spo2 = clamp(vitals.spo2 + rand(-1, 0.5), 90, 100);
        vitals.bpSystolic = clamp(vitals.bpSystolic + rand(-4, 4), 100, 160);
        vitals.bpDiastolic = clamp(vitals.bpDiastolic + rand(-3, 3), 60, 100);
        vitals.temp = clamp(vitals.temp + rand(-0.1, 0.1), 35.5, 39.5);

        updateVitalsDisplay();
    }, 2000);
}

function updateVitalsDisplay() {
    // Heart Rate
    const hr = Math.round(vitals.heartRate);
    const hrEl = document.getElementById('heartRateValue');
    const hrStatusEl = document.getElementById('hrStatus');

    hrEl.textContent = hr;
    if (hr > 110) {
        hrEl.style.color = 'var(--red)';
        hrStatusEl.textContent = 'CRITICAL';
        hrStatusEl.className = 'badge-red';
    } else if (hr > 100) {
        hrEl.style.color = 'var(--yellow)';
        hrStatusEl.textContent = 'ELEVATED';
        hrStatusEl.className = 'badge-yellow';
    } else {
        hrEl.style.color = 'var(--red)'; // Heart rate is always red themed
        hrStatusEl.textContent = 'NORMAL';
        hrStatusEl.className = 'badge-green';
    }

    // SpO2
    const sp = Math.round(vitals.spo2);
    const spEl = document.getElementById('spo2Value');
    const spStatusEl = document.getElementById('spo2Status');
    const ring = document.getElementById('spo2Ring');

    spEl.textContent = sp;
    if (ring) {
        // svg circumference is ~201 (2 * pi * 32)
        const offset = 201 - (sp / 100 * 201);
        ring.style.strokeDashoffset = offset;
    }

    if (sp < 94) {
        spStatusEl.textContent = 'CRITICAL';
        spStatusEl.className = 'badge-red';
    } else if (sp < 96) {
        spStatusEl.textContent = 'LOW';
        spStatusEl.className = 'badge-yellow';
    } else {
        spStatusEl.textContent = 'NORMAL';
        spStatusEl.className = 'badge-green';
    }

    // Blood Pressure
    const sys = Math.round(vitals.bpSystolic);
    const dia = Math.round(vitals.bpDiastolic);
    const bpStatusEl = document.getElementById('bpStatus');

    document.getElementById('bpSystolic').textContent = sys;
    document.getElementById('bpDiastolic').textContent = dia;

    if (sys > 150) {
        bpStatusEl.textContent = 'CRITICAL';
        bpStatusEl.className = 'badge-red';
    } else if (sys > 140) {
        bpStatusEl.textContent = 'ELEVATED';
        bpStatusEl.className = 'badge-yellow';
    } else {
        bpStatusEl.textContent = 'NORMAL';
        bpStatusEl.className = 'badge-green';
    }

    // Temperature
    const temp = vitals.temp.toFixed(1);
    const tEl = document.getElementById('tempValue');
    const tStatusEl = document.getElementById('tempStatus');

    tEl.textContent = temp;
    if (temp > 38.5) {
        tStatusEl.textContent = 'FEVER';
        tStatusEl.className = 'badge-red';
    } else {
        tStatusEl.textContent = 'NORMAL';
        tStatusEl.className = 'badge-green';
    }

    // Overall status
    const isCritical = hr > 115 || sp < 93 || sys > 155;
    const overallEl = document.getElementById('overallStatus');
    if (overallEl) {
        overallEl.textContent = isCritical ? 'CRITICAL' : 'STABLE';
        overallEl.style.color = isCritical ? 'var(--red)' : 'var(--green)';
    }

    // Update timestamp
    const tsEl = document.getElementById('lastUpdated');
    if (tsEl) {
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        tsEl.textContent = `Last updated: ${timeStr}`;
    }
}

// ─── CALL CONTROLS ───
let muted = false;
let videoOff = false;

function toggleMute() {
    muted = !muted;
    const btn = document.getElementById('muteBtn');
    btn.textContent = muted ? '🔇' : '🎤';
    btn.style.background = muted ? 'var(--red)' : 'var(--card)';
    btn.style.color = muted ? 'white' : 'var(--text)';
    if (window.toast) toast(muted ? 'Microphone Muted' : 'Microphone Active', 'info');
}

function toggleVideo() {
    videoOff = !videoOff;
    const btn = document.getElementById('videoBtn');
    btn.textContent = videoOff ? '📵' : '📹';
    btn.style.background = videoOff ? 'var(--red)' : 'var(--card)';
    btn.style.color = videoOff ? 'white' : 'var(--text)';
    if (window.toast) toast(videoOff ? 'Camera Off' : 'Camera Active', 'info');
}

// ─── HELPERS ───
function rand(min, max) {
    return Math.random() * (max - min) + min;
}
function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
}
