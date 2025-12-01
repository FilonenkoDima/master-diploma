// src/components/MonitorScreen.js
import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function MonitorScreen() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const droneMarker = useRef(null);
  const pathLine = useRef(null);
  const polygonLayer = useRef(null);
  const intervalRef = useRef(null);
  const destroyed = useRef(false); // захист від подвійного mount у StrictMode

  const [telemetry, setTelemetry] = useState({
    lat: 50.244973,
    lng: 30.122926,
    battery: 100,
    alt: 40,
    speed: 5,
  });

  const [missionId, setMissionId] = useState(null);
  const [observationsCount, setObservationsCount] = useState(0);


  /** ================================
   *   GEO HELPERS
   * ================================ */

  const isPointInPolygon = (point, polygon) => {
    const [x, y] = point;
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][1], yi = polygon[i][0];
      const xj = polygon[j][1], yj = polygon[j][0];

      const intersect = ((yi > y) !== (yj > y))
          && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

      if (intersect) inside = !inside;
    }
    return inside;
  };

  const generateFlightPath = (polygonCoords) => {
    const lats = polygonCoords.map(p => p[0]);
    const lngs = polygonCoords.map(p => p[1]);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const path = [];
    const step = 0.00003;
    const lineSpacing = step * 3;

    let lat = minLat + lineSpacing;
    let goingRight = true;

    while (lat <= maxLat - lineSpacing) {
      const startLng = goingRight ? minLng : maxLng;
      const endLng = goingRight ? maxLng : minLng;
      const stepDir = goingRight ? step : -step;

      for (let lng = startLng + step;
           goingRight ? lng <= endLng - step : lng >= endLng + step;
           lng += stepDir) {

        if (isPointInPolygon([lng, lat], polygonCoords)) {
          path.push([lat, lng]);
        }
      }
      lat += lineSpacing;
      goingRight = !goingRight;
    }

    return path.length > 0 ? path : polygonCoords.slice(0, -1);
  };


  /** ================================
   *   MAIN EFFECT
   * ================================ */

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    destroyed.current = false;

    // === INITIALIZE MAP ===
    mapInstance.current = L.map(mapRef.current).setView([50.244973, 30.122926], 16);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png")
        .addTo(mapInstance.current);

    // Fix for Leaflet container resize
    setTimeout(() => {
      if (mapInstance.current) mapInstance.current.invalidateSize();
    }, 200);

    // MARKER
    droneMarker.current = L.marker([50.244973, 30.122926], {
      icon: L.divIcon({
        html: 'Drone',
        className: 'text-3xl font-bold text-blue-600',
        iconSize: [40, 40]
      })
    }).addTo(mapInstance.current);

    pathLine.current = L.polyline([], {
      color: '#10b981',
      weight: 6,
      opacity: 0.9
    }).addTo(mapInstance.current);


    /** ================================
     *   LOAD MISSION
     * ================================ */
    fetch("http://localhost:5000/api/missions/last")
        .then(r => r.json())
        .then(data => {
          if (destroyed.current) return;

          if (!data.id || !data.polygon) {
            alert("Не знайдено останньої місії!");
            return;
          }

          setMissionId(data.id);

          const coords = JSON.parse(data.polygon).coordinates[0]
              .map(c => [c[1], c[0]]); // [lat,lng]

          polygonLayer.current = L.polygon(coords, {
            color: "#3b82f6",
            fillOpacity: 0.25
          }).addTo(mapInstance.current);

          startMissionSimulation(coords, data.id);
        })
        .catch(console.error);


    /** ================================
     *   CLEANUP
     * ================================ */
    return () => {
      destroyed.current = true;

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);


  /** ================================
   *   SIMULATION LOGIC
   * ================================ */

  const startMissionSimulation = (coords, missionId) => {
    const flightPath = generateFlightPath(coords);

    let i = 0;

    intervalRef.current = setInterval(() => {
      if (destroyed.current || !mapInstance.current) return;

      if (i >= flightPath.length) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        return;
      }

      const [lat, lng] = flightPath[i];

      setTelemetry(prev => ({
        ...prev,
        lat,
        lng,
        battery: Math.max(0, prev.battery - 0.08)
      }));

      // === MOVE MARKER ===
      droneMarker.current.setLatLng([lat, lng]);

      // Safe pan (no spam during animation)
      if (!mapInstance.current._animating) {
        mapInstance.current.panTo([lat, lng], { animate: true });
      }

      pathLine.current.addLatLng([lat, lng]);

      // SNAPSHOTS
      if (i % 10 === 0) handleSnapshot(lat, lng, missionId);

      i++;
    }, 600);
  };


  /** ================================
   *   SNAPSHOT LOGIC
   * ================================ */

  const handleSnapshot = (lat, lng, missionId) => {
    const issues = [
      "все нормально", "все нормально", "все нормально",
      "все нормально", "все нормально", "все нормально",
      "все нормально", "все нормально", "все нормально",
      "все нормально", "все нормально", "все нормально",
      "все нормально", "все нормально", "все нормально",
      "все нормально", "все нормально", "все нормально",
      "все нормально", "все нормально", "все нормально",
      "все нормально", "все нормально", "все нормально",
      "недостатньо вологи!",
      "виявлено шкідників (попелиця)",
      "виявлено захворювання (іржа)",
      "низький NDVI – стрес рослини"
    ];

    const issue = issues[Math.floor(Math.random() * issues.length)];
    const color = issue === "все нормально" ? "#10b981" : "#ef4444";
    const message = `Фото зроблено → ${issue}`;

    L.circleMarker([lat, lng], {
      radius: 9,
      color,
      fillOpacity: 0.95,
      weight: 3
    })
        .addTo(mapInstance.current)
        .bindPopup(`<strong>${message}</strong><br>${new Date().toLocaleTimeString()}`)
        .openPopup();

    fetch("http://localhost:5000/api/observations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mission_id: missionId, lat, lng, message })
    });

    setObservationsCount(prev => prev + 1);
  };


  /** ================================
   *   RENDER
   * ================================ */

  return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-800">
          Моніторинг польоту (LoRa/4G)
        </h1>

        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6 text-sm">
            <div><strong>Координати:</strong><br />{telemetry.lat.toFixed(6)}, {telemetry.lng.toFixed(6)}</div>
            <div><strong>Батарея:</strong><br />{telemetry.battery.toFixed(1)}%</div>
            <div><strong>Знімків:</strong><br />{observationsCount}</div>
            <div><strong>Швидкість:</strong><br />{telemetry.speed} м/с</div>
          </div>

          <div
              ref={mapRef}
              className="w-full border-4 border-gray-300 rounded-xl"
              style={{ height: "620px" }}
          />

          <div className="mt-6 flex justify-between items-center">
            <div className="text-lg">
              Всього знімків: <strong className="text-green-600">{observationsCount}</strong>
            </div>
            <button
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-10 rounded-xl"
            >
              Аварійне повернення
            </button>
          </div>
        </div>
      </div>
  );
}

export default MonitorScreen;
