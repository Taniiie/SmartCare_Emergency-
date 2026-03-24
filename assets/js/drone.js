// ─── STATE ───
const droneState = {
    selectedDrone: 'DRN-3',
    cargo: null,
    targetLatLng: null,
    targetETA: 0,
    status: 'READY', // READY | IN_FLIGHT | DELIVERED
    missionTimer: null,
    missionSeconds: 0,
    flyingMarker: null,
    flightPath: null
};

// ─── MAP INITIALIZATION ───
const map = L.map('droneMap', {
    center: [28.6139, 77.2090],
    zoom: 14,
    zoomControl: true
});

// Dark CartoDB tiles
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap © CARTO',
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(map);

// Drone BASE marker (fixed)
const baseIcon = L.divIcon({
    className: '',
    html: `<div style="
    background:#001a2a; border:2px solid #00e5ff;
    border-radius:50%; width:44px; height:44px;
    display:flex; align-items:center; justify-content:center;
    font-size:1.3rem;
    box-shadow: 0 0 20px rgba(0,229,255,0.5);
  ">🛸</div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22]
});
const baseMarker = L.marker([28.6139, 77.2090], { icon: baseIcon })
    .bindPopup('<b style="color:#00e5ff">🛸 DRONE BASE</b><br>DRN-3 Ready')
    .addTo(map);

// Patient marker
const patientIcon = L.divIcon({
    className: '',
    html: `<div style="
    width:18px; height:18px; border-radius:50%;
    background:#ff2d3b;
    box-shadow: 0 0 0 5px rgba(255,45,59,0.25),
                0 0 20px rgba(255,45,59,0.5);
    border:2px solid white;
    animation: pulse 1.5s infinite;
  "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
});
const patientMarker = L.marker([28.6280, 77.2190], { icon: patientIcon })
    .bindPopup('<b style="color:#ff2d3b">🚨 PATIENT</b><br>SOS Active')
    .addTo(map);

// Target marker storage
let targetMarker = null;

// Map Click Handler
map.on('click', function (e) {
    if (droneState.status === 'IN_FLIGHT') return;

    droneState.targetLatLng = e.latlng;

    if (targetMarker) map.removeLayer(targetMarker);

    const targetIcon = L.divIcon({
        className: '',
        html: `<div style="
      background:#1a0a00; border:2px solid #ffd166;
      border-radius:8px; padding:4px 6px; font-size:1.1rem;
      box-shadow: 0 0 15px rgba(255,209,102,0.5);
    ">📍</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
    });

    targetMarker = L.marker(e.latlng, { icon: targetIcon })
        .bindPopup('<b style="color:#ffd166">📍 DROP ZONE</b><br>Click Dispatch to confirm')
        .addTo(map);

    // Stats calculation
    const dist = map.distance([28.6139, 77.2090], e.latlng);
    const distKm = (dist / 1000).toFixed(1);
    const etaSec = Math.max(30, Math.ceil(dist / (65000 / 3600))); // 65km/h speed, min 30s for demo
    const etaMin = Math.ceil(etaSec / 60);

    droneState.targetETA = etaSec;

    // UI Updates
    document.getElementById('targetStatus').textContent =
        `Target: ${e.latlng.lat.toFixed(4)}°N, ${e.latlng.lng.toFixed(4)}°E`;
    document.getElementById('targetStatus').style.color = 'var(--green)';
    document.getElementById('distanceInfo').style.display = 'block';
    document.getElementById('distanceInfo').textContent =
        `📏 Distance: ${distKm} km · ETA: ~${etaMin}:00`;

    checkReadyState();
});

// ─── CARGO SELECTION ───
function selectCargo(type) {
    if (droneState.status === 'IN_FLIGHT') return;

    droneState.cargo = type;

    // Visual update
    ['meds', 'aed', 'kit'].forEach(id => {
        document.getElementById('cargo-' + id).classList.remove('selected');
    });
    document.getElementById('cargo-' + type).classList.add('selected');

    // Summary update
    const info = {
        meds: { name: 'Medicines', weight: '0.5 kg' },
        aed: { name: 'Defibrillator', weight: '2.0 kg' },
        kit: { name: 'Emergency Kit', weight: '1.5 kg' }
    };

    document.getElementById('summaryCargoName').textContent = info[type].name;
    document.getElementById('summaryWeight').textContent = info[type].weight;

    checkReadyState();
}

// ─── READY STATE CHECK ───
function checkReadyState() {
    const btn = document.getElementById('dispatchBtn');
    const summary = document.getElementById('missionSummary');

    if (droneState.cargo && droneState.targetLatLng) {
        btn.disabled = false;
        btn.classList.add('ready');
        btn.textContent = '🚁 DISPATCH DRONE';
        summary.style.display = 'block';

        const t = droneState.targetLatLng;
        document.getElementById('summaryTarget').textContent =
            `${t.lat.toFixed(4)}°N, ${t.lng.toFixed(4)}°E`;

        // Smooth scroll to summary if hidden?
    } else {
        btn.disabled = true;
        btn.classList.remove('ready');
        btn.textContent = 'SELECT CARGO + SET TARGET FIRST';
        summary.style.display = 'none';
    }
}

// ─── DISPATCH ───
function dispatch() {
    if (droneState.status !== 'READY') return;

    droneState.status = 'IN_FLIGHT';
    const totalSeconds = droneState.targetETA;
    droneState.missionSeconds = totalSeconds;

    // UI State
    document.getElementById('droneStatusBadge').textContent = '🚁 IN FLIGHT';
    document.getElementById('droneStatusBadge').className = 'badge-cyan';
    document.getElementById('activeMission').style.display = 'block';
    document.getElementById('missionSummary').style.display = 'none';

    const btn = document.getElementById('dispatchBtn');
    btn.disabled = true;
    btn.classList.remove('ready');
    btn.classList.add('in-flight');

    // Log entries
    addMissionLog('#ffd166', '🚁 Drone DRN-3 powered up');
    setTimeout(() => addMissionLog('#00e5ff', '📡 GPS lock confirmed'), 800);
    setTimeout(() => addMissionLog('#ff2d3b', '🚀 Drone airborne — mission active'), 1500);
    setTimeout(() => addMissionLog('#00e5ff', `📦 Cargo: ${document.getElementById('summaryCargoName').textContent} secured`), 2200);

    // Timer
    let remaining = totalSeconds;
    droneState.missionTimer = setInterval(() => {
        remaining--;
        const m = String(Math.floor(remaining / 60)).padStart(2, '0');
        const s = String(remaining % 60).padStart(2, '0');
        document.getElementById('missionETA').textContent = `${m}:${s}`;
        btn.textContent = `🚁 IN FLIGHT — ${m}:${s}`;

        const pct = ((totalSeconds - remaining) / totalSeconds) * 100;
        document.getElementById('missionProgress').style.width = pct + '%';

        if (remaining <= 0) {
            clearInterval(droneState.missionTimer);
        }
    }, 1000);

    // Map Animation
    const baseLatLng = L.latLng(28.6139, 77.2090);
    animateDroneFlight(baseLatLng, droneState.targetLatLng, totalSeconds);

    if (window.toast) toast('🚁 Drone dispatched! Mission active.', 'success');
}

// ─── FLIGHT ANIMATION ───
function animateDroneFlight(from, to, duration) {
    const icon = L.divIcon({
        className: '',
        html: `<div style="
      background:#001a2a; border:2px solid #00e5ff;
      border-radius:50%; width:40px; height:40px;
      display:flex; align-items:center; justify-content:center;
      font-size:1.2rem;
      box-shadow: 0 0 20px rgba(0,229,255,0.6);
      animation: droneBob 1s ease-in-out infinite;
    ">🚁</div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    });

    droneState.flyingMarker = L.marker(from, { icon }).addTo(map);

    droneState.flightPath = L.polyline([from, to], {
        color: '#00e5ff',
        weight: 2,
        dashArray: '6 8',
        opacity: 0.7
    }).addTo(map);

    const steps = duration * 10; // 100ms updates
    let step = 0;
    const animInterval = setInterval(() => {
        step++;
        const t = step / steps;
        const lat = from.lat + (to.lat - from.lat) * t;
        const lng = from.lng + (to.lng - from.lng) * t;
        droneState.flyingMarker.setLatLng([lat, lng]);

        if (step >= steps || droneState.status !== 'IN_FLIGHT') {
            clearInterval(animInterval);
            if (droneState.status === 'IN_FLIGHT') {
                deliveryComplete(to);
            }
        }
    }, 100);
}

function deliveryComplete(point) {
    map.removeLayer(droneState.flyingMarker);
    map.removeLayer(droneState.flightPath);

    const icon = L.divIcon({
        className: '',
        html: `<div style="
      background:#002a1a; border:2px solid #00ff9d;
      border-radius:8px; padding:6px 8px; font-size:1rem;
      box-shadow: 0 0 20px rgba(0,255,157,0.5);
      white-space:nowrap; color:#00ff9d;
      font-family:'JetBrains Mono',monospace; font-size:0.7rem;
    ">✅ DELIVERED</div>`,
        iconSize: [90, 32],
        iconAnchor: [45, 16]
    });
    L.marker(point, { icon }).addTo(map);

    droneState.status = 'DELIVERED';
    document.getElementById('droneStatusBadge').textContent = '✅ DELIVERED';
    document.getElementById('droneStatusBadge').className = 'badge-green';
    document.getElementById('dispatchBtn').textContent = 'MISSION COMPLETE';

    addMissionLog('#00ff9d', '✅ Cargo delivered successfully!');
    addMissionLog('#00ff9d', '🔄 Drone returning to base...');

    if (window.toast) toast('🚁 Delivery successful! Package delivered.', 'success');

    setTimeout(() => resetMission(), 5000);
}

// ─── ABORT & RESET ───
function abortMission() {
    if (droneState.missionTimer) clearInterval(droneState.missionTimer);
    if (droneState.flyingMarker) map.removeLayer(droneState.flyingMarker);
    if (droneState.flightPath) map.removeLayer(droneState.flightPath);

    droneState.status = 'READY';
    addMissionLog('#ff2d3b', '⚠️ Mission aborted by operator');
    resetMission();
    if (window.toast) toast('Mission aborted. Drone returning to base.', 'error');
}

function resetMission() {
    droneState.cargo = null;
    droneState.targetLatLng = null;
    droneState.status = 'READY';

    document.getElementById('activeMission').style.display = 'none';
    document.getElementById('missionSummary').style.display = 'none';
    document.getElementById('droneStatusBadge').textContent = '● READY';
    document.getElementById('droneStatusBadge').className = 'badge-green';
    document.getElementById('distanceInfo').style.display = 'none';
    document.getElementById('targetStatus').textContent = 'Click anywhere on the map to set drop zone';
    document.getElementById('targetStatus').style.color = '';
    document.getElementById('missionETA').textContent = '00:00';
    document.getElementById('missionProgress').style.width = '0%';

    const btn = document.getElementById('dispatchBtn');
    btn.classList.remove('in-flight');
    btn.disabled = true;

    ['meds', 'aed', 'kit'].forEach(id => {
        document.getElementById('cargo-' + id).classList.remove('selected');
    });

    if (targetMarker) map.removeLayer(targetMarker);
}

// ─── LOGGING ───
function addMissionLog(color, message) {
    const log = document.getElementById('missionLog');
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    const entry = document.createElement('div');
    entry.style.cssText = `
    display:flex; align-items:center; gap:0.6rem;
    padding:0.5rem 0; border-bottom:1px solid rgba(255,255,255,0.04);
    animation: logFlash 0.5s ease;
  `;
    entry.innerHTML = `
    <div style="width:7px;height:7px;border-radius:50%; background:${color}; flex-shrink:0; box-shadow:0 0 5px ${color};"></div>
    <div style="font-family:'JetBrains Mono',monospace; font-size:0.68rem; color:#7a8aaa; min-width:70px;">${time}</div>
    <div style="font-size:0.8rem; color:#f0f4ff;">${message}</div>
  `;
    log.prepend(entry);
}

// ─── INIT ───
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('dispatchBtn').addEventListener('click', dispatch);
    document.getElementById('abortBtn').addEventListener('click', abortMission);
});
