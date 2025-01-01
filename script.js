let map;
let lastEarthquakeTime = 0;

// Inisialisasi peta
function createMap() {
    map = L.map('map').setView([-6.21462, 106.84513], 5); // Fokus di Jakarta

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
}

// Fetch data gempa
function fetchEarthquakeData() {
    fetch('https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2024-12-01')
        .then(response => response.json())
        .then(data => updateMapAndList(data))
        .catch(error => console.error('Error fetching earthquake data:', error));
}

// Update peta dan daftar gempa
function updateMapAndList(data) {
    const content = document.getElementById('content');
    content.innerHTML = '';

    data.features.forEach(gempa => {
        const [longitude, latitude, depth] = gempa.geometry.coordinates;
        const { mag: magnitude, place, time } = gempa.properties;
        
        const formattedTime = new Date(time).toLocaleString();

        const impact = getImpactDescription(magnitude);
        const distance = calculateDistance(latitude, longitude);

        L.circleMarker([latitude, longitude], {
            radius: magnitude * 2,
            color: impact.color,
            fillColor: impact.color,
            fillOpacity: 0.5,
        })
            .addTo(map)
            .bindPopup(`<b>${place}</b><br>Magnitudo: ${magnitude}<br>Waktu: ${formattedTime}<br>${impact.description}<br>Jarak Pengguna ke Titik Gempa : ${distance.toFixed(2)} km`);

        const card = document.createElement('div');
        card.className = `earthquake-card ${impact.className}`;
        card.innerHTML = `
            <h3>${place}</h3>
            <p>Magnitudo: ${magnitude}</p>
            <p><b>Waktu :</b> ${formattedTime}</p>
            <p>${impact.description}</p>
            <p>Jarak Pengguna ke Titik Gempa: ${distance.toFixed(2)} km</p>
        `;
        content.appendChild(card);
    });
}

// Dampak gempa berdasarkan magnitudo
function getImpactDescription(magnitude) {
    if (magnitude < 4) {
        return { description: "Dampak rendah", color: "#4CAF50", className: "low-impact" };
    }
    if (magnitude < 6) {
        return { description: "Dampak sedang", color: "#FFC107", className: "medium-impact" };
    }
    return { description: "Dampak tinggi", color: "#f44336", className: "high-impact" };
}

// Hitung jarak antara pengguna dan titik gempa
function calculateDistance(lat, lon) {
    const userLocation = { latitude: -6.21462, longitude: 106.84513 }; // Jakarta
    const earthRadius = 6371;

    const dLat = toRadians(lat - userLocation.latitude);
    const dLon = toRadians(lon - userLocation.longitude);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(userLocation.latitude)) *
            Math.cos(toRadians(lat)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
}

function toRadians(degree) {
    return (degree * Math.PI) / 180;
}

// Pencarian lokasi gempa
function searchEarthquakes() {
    const query = document.getElementById('location-search').value.toLowerCase();
    const earthquakes = document.querySelectorAll('.earthquake-card');

    earthquakes.forEach(card => {
        if (card.textContent.toLowerCase().includes(query)) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Notifikasi gempa baru
function enableNotifications() {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                alert('Notifikasi diaktifkan!');
                startNotificationCheck();
            }
        });
    } else {
        alert('Browser Anda tidak mendukung notifikasi.');
    }
}

function startNotificationCheck() {
    setInterval(() => {
        fetch('https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=2024-12-01')
            .then(response => response.json())
            .then(data => {
                if (data.features.length > 0) {
                    const latest = data.features[0];
                    if (latest.properties.time > lastEarthquakeTime) {
                        lastEarthquakeTime = latest.properties.time;
                        new Notification('Gempa Baru!', {
                            body: `Lokasi: ${latest.properties.place}, Magnitudo: ${latest.properties.mag}`,
                        });
                    }
                }
            });
    }, 60000);
}

// Jalankan aplikasi
createMap();
fetchEarthquakeData();
