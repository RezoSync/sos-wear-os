const map = L.map("map", { zoomControl: true }).setView([23.6345, -102.5528], 5);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

const markers = new Map();
const emergenciesList = document.getElementById("emergencies");
const emptyState = document.getElementById("empty-state");
const connection = document.getElementById("connection");
const numberFormat = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 5 });

function updateList(emergencies) {
  emergenciesList.replaceChildren();
  emptyState.hidden = emergencies.length > 0;

  for (const emergency of emergencies) {
    const item = document.createElement("li");
    item.className = "emergency-card";
    const name = document.createElement("strong");
    name.textContent = emergency.name;
    const position = document.createElement("span");
    position.textContent = `${numberFormat.format(emergency.lat)}, ${numberFormat.format(emergency.lng)}`;
    const updated = document.createElement("span");
    updated.textContent = `Última ubicación: ${new Date(emergency.lastLocationAt).toLocaleTimeString("es-MX")}`;
    item.append(name, position, updated);
    emergenciesList.append(item);
  }
}

async function refreshEmergencies() {
  try {
    const response = await fetch("/api/sos/active", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const { emergencies } = await response.json();
    connection.textContent = "Backend conectado";
    connection.className = "connection online";
    updateList(emergencies);

    const activeIds = new Set(emergencies.map((emergency) => emergency.id));
    for (const [id, marker] of markers) {
      if (!activeIds.has(id)) {
        map.removeLayer(marker);
        markers.delete(id);
      }
    }

    for (const emergency of emergencies) {
      const position = [emergency.lat, emergency.lng];
      const marker = markers.get(emergency.id);
      const popup = `<strong>${escapeHtml(emergency.name)}</strong><br>${numberFormat.format(emergency.lat)}, ${numberFormat.format(emergency.lng)}`;
      if (marker) {
        marker.setLatLng(position).setPopupContent(popup);
      } else {
        markers.set(emergency.id, L.marker(position).addTo(map).bindPopup(popup));
      }
    }

    if (emergencies.length === 1) {
      map.setView([emergencies[0].lat, emergencies[0].lng], Math.max(map.getZoom(), 15));
    } else if (emergencies.length > 1) {
      map.fitBounds(emergencies.map((emergency) => [emergency.lat, emergency.lng]), { padding: [32, 32] });
    }
  } catch (error) {
    connection.textContent = "Backend no disponible";
    connection.className = "connection offline";
    console.error("No se pudo actualizar el dashboard:", error);
  }
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

refreshEmergencies();
window.setInterval(refreshEmergencies, 2000);
