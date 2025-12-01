import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function MissionsHistoryScreen() {
    const [missions, setMissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMission, setSelectedMission] = useState(null);
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const polygonLayer = useRef(null);
    const markersLayer = useRef(null);

    const navigate = useNavigate();

    useEffect(() => {
        fetch('http://localhost:5000/api/missions/all')
            .then(r => r.json())
            .then(async (missionsData) => {
                // Додаємо до кожної місії назву поля
                const fieldsRes = await fetch('http://localhost:5000/api/fields');
                const fields = await fieldsRes.json();
                const fieldsMap = Object.fromEntries(fields.map(f => [f.id, f]));

                const enriched = missionsData.map(m => ({
                    ...m,
                    fieldName: fieldsMap[m.field_id]?.name || 'Невідоме поле',
                    crop: fieldsMap[m.field_id]?.crop_type || '-'
                }));

                setMissions(enriched);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const showMissionOnMap = (mission) => {
        setSelectedMission(mission);

        if (!mapInstance.current) {
            mapInstance.current = L.map(mapRef.current).setView([50.244973, 30.122926], 14);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance.current);
            markersLayer.current = L.layerGroup().addTo(mapInstance.current);
        }

        // Очищаємо попередні шари
        if (polygonLayer.current) mapInstance.current.removeLayer(polygonLayer.current);
        if (markersLayer.current) markersLayer.current.clearLayers();

        // Полігон поля
        try {
            const coords = JSON.parse(mission.polygon).coordinates[0].map(c => [c[1], c[0]]);
            polygonLayer.current = L.polygon(coords, {
                color: '#3b82f6',
                weight: 4,
                fillOpacity: 0.2
            }).addTo(mapInstance.current);

            mapInstance.current.fitBounds(polygonLayer.current.getBounds());
        } catch (e) {
            console.warn('Не вдалося намалювати полігон');
        }

        // Спостереження (аномалії)
        fetch(`http://localhost:5000/api/observations/mission/${mission.id}`)
            .then(r => r.json())
            .then(obs => {
                obs.forEach(o => {
                    const color = o.message.includes('нормально') ? '#10b981' : '#ef4444';
                    L.circleMarker([o.lat, o.lng], {
                        radius: 8,
                        color,
                        fillOpacity: 0.9
                    })
                        .addTo(markersLayer.current)
                        .bindPopup(`
              <strong>${o.message}</strong><br>
              ${new Date(o.timestamp).toLocaleString('uk-UA')}
            `);
                });
            });
    };

    if (loading) return <div className="text-center p-16 text-2xl">Завантаження історії місій...</div>;

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <h1 className="text-4xl font-bold text-center mb-10 text-blue-800">
                Історія всіх місій
            </h1>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Список місій */}
                <div className="space-y-4 max-h-screen overflow-y-auto pr-4">
                    {missions.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 text-xl">
                            Ще немає виконаних місій
                        </div>
                    ) : (
                        missions.map(mission => (
                            <div
                                key={mission.id}
                                onClick={() => showMissionOnMap(mission)}
                                className={`bg-white rounded-2xl shadow-lg p-6 cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-1 border-2 ${
                                    selectedMission?.id === mission.id ? 'border-blue-500' : 'border-gray-200'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="text-xl font-bold">{mission.fieldName}</h3>
                                        <p className="text-gray-600">{mission.crop} • {new Date(mission.timestamp || mission.id * 1000).toLocaleDateString('uk-UA')}</p>
                                    </div>
                                    <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                                        mission.task === 'monitoring' ? 'bg-cyan-100 text-cyan-800' : 'bg-orange-100 text-orange-800'
                                    }`}>
                    {mission.task === 'monitoring' ? 'Моніторинг' : 'Обприскування'}
                  </span>
                                </div>

                                <div className="grid grid-cols-3 gap-3 text-sm">
                                    <div><strong>Висота:</strong> {mission.altitude} м</div>
                                    <div><strong>Швидкість:</strong> {mission.speed} м/с</div>
                                    <div><strong>ID:</strong> #{mission.id}</div>
                                </div>

                                <div className="mt-4 flex gap-3">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/mission/${mission.id}`);
                                        }}
                                        className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-lg font-bold hover:from-indigo-700"
                                    >
                                        Деталі місії
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            showMissionOnMap(mission);
                                        }}
                                        className="px-5 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
                                    >
                                        На карті
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Карта */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden sticky top-6">
                    <div className="p-4 bg-gray-100 border-b-2">
                        <h2 className="text-xl font-bold">
                            {selectedMission ? `Місія #${selectedMission.id} — ${selectedMission.fieldName}` : 'Оберіть місію'}
                        </h2>
                    </div>
                    <div
                        ref={mapRef}
                        className="w-full"
                        style={{ height: '700px' }}
                    />
                    {!selectedMission && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <p className="text-3xl text-gray-400 font-light">Натисніть на місію ←</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="text-center mt-10">
                <button
                    onClick={() => navigate('/')}
                    className="bg-gray-600 text-white px-10 py-4 rounded-xl text-lg font-bold hover:bg-gray-700"
                >
                    На головну
                </button>
            </div>
        </div>
    );
}

export default MissionsHistoryScreen;