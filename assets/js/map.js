// 1. INITIALIZATION
const CENTER = [28.6139, 77.2090]; // New Delhi coordinates

const map = L.map('map', {
    center: CENTER,
    zoom: 14,
    zoomControl: false,
});

// Dark map tiles - CartoDB Dark Matter
L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© OpenStreetMap © CARTO',
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(map);

// Move zoom control
L.control.zoom({ position: 'bottomright' }).addTo(map);

// 2. CUSTOM ICONS (Using L.divIcon for styling)
const patientIcon = L.divIcon({
    className: '',
    html: `<div style="
    width:20px; height:20px; border-radius:50%;
    background:#ff2d3b;
    box-shadow: 0 0 0 6px rgba(255,45,59,0.2),
                0 0 20px 8px rgba(255,45,59,0.4);
    border: 2px solid white;
    animation: markerPulse 1.5s infinite;
  "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
});

const ambIcon = L.divIcon({
    className: '',
    html: `<div style="
    background:#1a3a6b; border:2px solid #4a9eff;
    border-radius:8px; padding:4px 6px; font-size:1.1rem;
    box-shadow: 0 0 12px rgba(74,158,255,0.5);
    white-space:nowrap;
  ">🚑</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
});

const hospitalIcon = L.divIcon({
    className: '',
    html: `<div style="
    background:#0a2a1a; border:2px solid #00ff9d;
    border-radius:8px; padding:4px 6px; font-size:1.1rem;
    box-shadow: 0 0 12px rgba(0,255,157,0.4);
  ">🏥</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
});

const droneIcon = L.divIcon({
    className: '',
    html: `<div style="
    background:#001a2a; border:2px solid #00e5ff;
    border-radius:50%; padding:5px; font-size:1.1rem;
    box-shadow: 0 0 15px rgba(0,229,255,0.5);
    animation: droneBob 2s ease-in-out infinite;
  ">🚁</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18]
});

// 3. MARKERS & POPUPS
const patientMarker = L.marker([28.6139, 77.2090], { icon: patientIcon }).addTo(map);
const ambMarker = L.marker([28.6280, 77.2190], { icon: ambIcon }).addTo(map);
const hospitalMarker = L.marker([28.6050, 77.1980], { icon: hospitalIcon }).addTo(map);
const droneMarker = L.marker([28.6200, 77.1950], { icon: droneIcon }).addTo(map);

patientMarker.bindPopup(`
  <div style="font-family:'DM Sans', sans-serif;">
    <b style="color:#ff2d3b; font-family:'Bebas Neue',sans-serif; font-size:1.1rem;">🚨 PATIENT</b><br>
    Status: SOS Active<br>
    Coords: 28.6139°N, 77.2090°E
  </div>
`);

ambMarker.bindPopup(`
  <div style="font-family:'DM Sans', sans-serif;">
    <b style="color:#4a9eff; font-family:'Bebas Neue',sans-serif; font-size:1.1rem;">🚑 AMBULANCE AMB-7</b><br>
    Driver: Rajesh K.<br>
    Speed: 42 km/h<br>
    ETA: 4:32
  </div>
`);

hospitalMarker.bindPopup(`
  <div style="font-family:'DM Sans', sans-serif;">
    <b style="color:#00ff9d; font-family:'Bebas Neue',sans-serif; font-size:1.1rem;">🏥 CITY EMERGENCY HOSPITAL</b><br>
    Emergency Ward: Ready<br>
    Distance: 2.1 km
  </div>
`);

droneMarker.bindPopup(`
  <div style="font-family:'DM Sans', sans-serif;">
    <b style="color:#00e5ff; font-family:'Bebas Neue',sans-serif; font-size:1.1rem;">🚁 DRONE DRN-3</b><br>
    Cargo: Emergency Kit + AED<br>
    Altitude: 85m<br>
    ETA: 3:00
  </div>
`);

// 4. ROUTES (Polylines)
const ambWaypoints = [
    [28.6280, 77.2190],
    [28.6240, 77.2170],
    [28.6200, 77.2150],
    [28.6170, 77.2130],
    [28.6150, 77.2110],
    [28.6139, 77.2090]
];

const ambRoute = L.polyline(ambWaypoints, {
    color: '#4a9eff',
    weight: 3,
    dashArray: '8, 8',
    opacity: 0.6
}).addTo(map);

const droneWaypoints = [
    [28.6200, 77.1950],
    [28.6180, 77.1980],
    [28.6160, 77.2010],
    [28.6150, 77.2040],
    [28.6139, 77.2090]
];

const droneRoute = L.polyline(droneWaypoints, {
    color: '#00e5ff',
    weight: 2,
    dashArray: '5, 8',
    opacity: 0.5
}).addTo(map);

// 5. ANIMATIONS
let ambStep = 0;
setInterval(() => {
    if (ambStep < ambWaypoints.length - 1) {
        ambStep++;
        ambMarker.setLatLng(ambWaypoints[ambStep]);
        ambRoute.setLatLngs(ambWaypoints.slice(ambStep));
    }
}, 8000);

let droneStep = 0;
setInterval(() => {
    if (droneStep < droneWaypoints.length - 1) {
        droneStep++;
        droneMarker.setLatLng(droneWaypoints[droneStep]);
        droneRoute.setLatLngs(droneWaypoints.slice(droneStep));
    }
}, 5000);

// 6. TOGGLES & UTILS
function toggleMarker(type, btn) {
    const isSelected = btn.classList.toggle('active');

    if (type === 'ambulance') {
        if (isSelected) {
            ambMarker.addTo(map);
            ambRoute.addTo(map);
        } else {
            map.removeLayer(ambMarker);
            map.removeLayer(ambRoute);
        }
    } else if (type === 'drone') {
        if (isSelected) {
            droneMarker.addTo(map);
            droneRoute.addTo(map);
        } else {
            map.removeLayer(droneMarker);
            map.removeLayer(droneRoute);
        }
    } else if (type === 'patient') {
        if (isSelected) {
            patientMarker.addTo(map);
        } else {
            map.removeLayer(patientMarker);
        }
    }
}

function refreshLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const latlng = [pos.coords.latitude, pos.coords.longitude];
                patientMarker.setLatLng(latlng);
                map.setView(latlng, 14);
                document.getElementById('patientCoords').textContent =
                    `${pos.coords.latitude.toFixed(4)}°N, ${pos.coords.longitude.toFixed(4)}°E`;

                // Update route endpoints to new patient location
                ambWaypoints[ambWaypoints.length - 1] = latlng;
                droneWaypoints[droneWaypoints.length - 1] = latlng;
                ambRoute.setLatLngs(ambWaypoints.slice(ambStep));
                droneRoute.setLatLngs(droneWaypoints.slice(droneStep));
            }
        );
    }
}

// 7. PANEL TIMER LOGIC
let ambSeconds = 272;
const ambInterval = setInterval(() => {
    if (ambSeconds <= 0) {
        clearInterval(ambInterval);
        document.getElementById('panelAmbETA').textContent = 'ARRIVED';
        return;
    }
    ambSeconds--;
    const m = String(Math.floor(ambSeconds / 60)).padStart(2, '0');
    const s = String(ambSeconds % 60).padStart(2, '0');
    document.getElementById('panelAmbETA').textContent = `${m}:${s}`;
    document.getElementById('panelAmbProgress').style.width = ((272 - ambSeconds) / 272 * 100) + '%';
}, 1000);

let droneSeconds = 180;
const droneInterval = setInterval(() => {
    if (droneSeconds <= 0) {
        clearInterval(droneInterval);
        document.getElementById('panelDroneETA').textContent = 'DELIVERED';
        return;
    }
    droneSeconds--;
    const m = String(Math.floor(droneSeconds / 60)).padStart(2, '0');
    const s = String(droneSeconds % 60).padStart(2, '0');
    document.getElementById('panelDroneETA').textContent = `${m}:${s}`;
    document.getElementById('panelDroneProgress').style.width = ((180 - droneSeconds) / 180 * 100) + '%';
}, 1000);
