// src/components/CreateMissionScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';

// Виправлення іконок Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function CreateMissionScreen() {
  const { fieldId } = useParams();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const drawnItems = useRef(null);
  const polygonRef = useRef(null);

  const [mission, setMission] = useState({
    altitude: 40,
    speed: 5,
    task: "monitoring",
    fieldName: fieldId === "1" ? "Пшениця-2025" : "Кукурудза-2025",
    polygon: null, // <-- тут зберігатиметься полігон як GeoJSON
  });

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    // Ініціалізація карти
    mapInstance.current = L.map(mapRef.current).setView([50.244973, 30.122926], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(mapInstance.current);

    // Шар для намальованих об'єктів
    drawnItems.current = new L.FeatureGroup();
    mapInstance.current.addLayer(drawnItems.current);

    // Налаштування інструментів малювання (тільки полігон)
    const drawControl = new L.Control.Draw({
      edit: {
        featureGroup: drawnItems.current,
        remove: true,
      },
      draw: {
        polygon: {
          shapeOptions: {
            color: '#3b82f6',
            weight: 4,
            opacity: 0.8,
            fillOpacity: 0.3,
          },
        },
        polyline: false,
        rectangle: false,
        circle: false,
        marker: false,
        circlemarker: false,
      },
    });
    mapInstance.current.addControl(drawControl);

    // Події створення полігону
    mapInstance.current.on(L.Draw.Event.CREATED, (e) => {
      const layer = e.layer;

      // Якщо вже є полігон — видаляємо старий
      if (polygonRef.current) {
        drawnItems.current.removeLayer(polygonRef.current);
      }

      drawnItems.current.addLayer(layer);
      polygonRef.current = layer;

      // Зберігаємо GeoJSON полігону
      const geojson = layer.toGeoJSON();
      setMission((prev) => ({
        ...prev,
        polygon: geojson.geometry, // тільки координати
      }));
    });

    // Події редагування та видалення
    mapInstance.current.on(L.Draw.Event.EDITED, (e) => {
      const layers = e.layers;
      layers.eachLayer((layer) => {
        if (layer === polygonRef.current) {
          setMission((prev) => ({
            ...prev,
            polygon: layer.toGeoJSON().geometry,
          }));
        }
      });
    });

    mapInstance.current.on(L.Draw.Event.DELETED, () => {
      polygonRef.current = null;
      setMission((prev) => ({ ...prev, polygon: null }));
    });

    // Маркер центру поля
    L.marker([50.244973, 30.122926])
        .addTo(mapInstance.current)
        .bindPopup(`Поле: ${mission.fieldName}`)
        .openPopup();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [mission.fieldName]);

  // Збереження місії на бекенд
  const handleSave = async () => {
    if (!mission.polygon) {
      alert('Будь ласка, намалюйте полігон на карті!');
      return;
    }
    localStorage.setItem('lastMissionPolygon', JSON.stringify(mission.polygon));

    const missionData = {
      field_id: Number(fieldId),
      altitude: Number(mission.altitude),
      speed: Number(mission.speed),
      task: mission.task,
      polygon: JSON.stringify(mission.polygon), // зберігаємо як JSON-рядок
    };

    try {
      const res = await fetch('http://localhost:5000/api/missions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(missionData),
      });

      if (res.ok) {
        console.log('Місія успішно збережена!');
        setTimeout(() => navigate('/monitor'), 500);
      } else {
        alert('Помилка збереження місії');
      }
    } catch (err) {
      console.error(err);
      alert('Не вдалося підключитися до сервера');
    }
  };

  return (
      <div className="container mx-auto p-6 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6 text-center">Створення місії (XAG P100)</h1>

        <div className="bg-white p-6 rounded-lg shadow-lg border">
          <p className="mb-4 text-lg">
            <strong>Поле:</strong> {mission.fieldName}
          </p>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <label className="block">
              <span className="font-semibold">Висота (м):</span>
              <input
                  type="number"
                  value={mission.altitude}
                  onChange={(e) => setMission({ ...mission, altitude: e.target.value })}
                  className="border p-2 w-full mt-1 rounded focus:ring-2 focus:ring-blue-500"
                  min="30"
                  max="100"
              />
            </label>

            <label className="block">
              <span className="font-semibold">Швидкість (м/с):</span>
              <input
                  type="number"
                  value={mission.speed}
                  onChange={(e) => setMission({ ...mission, speed: e.target.value })}
                  className="border p-2 w-full mt-1 rounded focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="10"
              />
            </label>
          </div>

          <label className="block mb-4">
            <span className="font-semibold">Тип задачі:</span>
            <select
                value={mission.task}
                onChange={(e) => setMission({ ...mission, task: e.target.value })}
                className="border p-2 w-full mt-1 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="monitoring">Моніторинг (MicaSense RedEdge-P)</option>
              <option value="spraying">Обприскування (XAG JetSpray)</option>
            </select>
          </label>

          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">
              Оберіть зону польоту (намалюйте полігон):
            </h3>
            <div
                ref={mapRef}
                className="w-full h-96 border-2 border-gray-300 rounded-lg shadow-inner"
                style={{ minHeight: '450px' }}
            />
            {mission.polygon && (
                <p className="mt-2 text-green-600 font-medium">
                  Полігон обрано ({mission.polygon.coordinates[0].length} точок)
                </p>
            )}
          </div>

          <button
              onClick={handleSave}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 font-semibold text-lg transition-all duration-200 shadow-md"
          >
            Запустити місію
          </button>
        </div>
      </div>
  );
}

export default CreateMissionScreen;