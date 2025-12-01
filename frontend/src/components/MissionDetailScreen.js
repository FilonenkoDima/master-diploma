import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function MissionDetailScreen() {
    const { id } = useParams();
    const navigate = useNavigate();
    const mapRef = useRef(null);
    const mapInstance = useRef(null);

    const [mission, setMission] = useState(null);
    const [observations, setObservations] = useState([]);
    const [field, setField] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Місія
                const mRes = await fetch(`http://localhost:5000/api/missions/${id}`);
                const missionData = await mRes.json();

                // Поле
                const fRes = await fetch(`http://localhost:5000/api/fields/${missionData.field_id}`);
                const fieldData = await fRes.json();

                // Спостереження
                const oRes = await fetch(`http://localhost:5000/api/observations/mission/${id}`);
                const obsData = await oRes.json();

                setMission(missionData);
                setField(fieldData);
                setObservations(obsData);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    // Ініціалізація карти після завантаження даних
    useEffect(() => {
        if (!mission || !mapRef.current) return;

        // Prevent re-initializing the map if it already exists
        if (!mapInstance.current) {
            mapInstance.current = L.map(mapRef.current).setView([50.244973, 30.122926], 15);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstance.current);
        }

        try {
            const coords = JSON.parse(mission.polygon).coordinates[0].map(c => [c[1], c[0]]);
            const polygon = L.polygon(coords, { color: '#3b82f6', weight: 4, fillOpacity: 0.2 })
                .addTo(mapInstance.current);

            // Clear existing markers before adding new ones
            mapInstance.current.eachLayer(layer => {
                if (layer instanceof L.CircleMarker) mapInstance.current.removeLayer(layer);
            });

            observations.forEach(obs => {
                const isNormal = obs.message.includes('нормально');
                L.circleMarker([obs.lat, obs.lng], {
                    radius: 10,
                    color: isNormal ? '#10b981' : '#ef4444',
                    fillOpacity: 0.9,
                    weight: 3
                })
                    .bindPopup(`
                    <div class="font-semibold">${obs.message}</div>
                    <div class="text-sm">${new Date(obs.timestamp).toLocaleString('uk-UA')}</div>
                `)
                    .addTo(mapInstance.current);
            });

            mapInstance.current.fitBounds(polygon.getBounds());
        } catch (e) {
            console.warn('Не вдалося відобразити полігон');
        }

        // Cleanup only when the component unmounts
        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, [mission, observations]);

    const generatePDF = async () => {
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();

        doc.setFontSize(22);
        doc.text(`ЗВІТ ПО МІСІЇ #${mission.id}`, pageWidth / 2, 20, { align: 'center' });
        doc.setFontSize(14);
        doc.text(`Поле: ${field.name}`, 20, 40);
        doc.text(`Культура: ${field.crop_type}`, 20, 48);
        doc.text(`Площа: ${field.area} га`, 20, 56);
        doc.text(`Дата: ${new Date(mission.timestamp || Date.now()).toLocaleDateString('uk-UA')}`, 20, 64);
        doc.text(`Тип: ${mission.task === 'monitoring' ? 'Моніторинг' : 'Обприскування'}`, 20, 72);

        if (mapRef.current) {
            const canvas = await html2canvas(mapRef.current);
            const imgData = canvas.toDataURL('image/png');
            doc.addImage(imgData, 'PNG', 15, 90, pageWidth - 30, 120);
        }

        const anomalies = observations.filter(o => !o.message.includes('нормально'));
        doc.setFontSize(16);
        doc.text(`Виявлено аномалій: ${anomalies.length}`, 20, 220);
        anomalies.slice(0, 8).forEach((a, i) => {
            doc.setFontSize(11);
            doc.text(`${i+1}. ${a.message} — ${new Date(a.timestamp).toLocaleTimeString('uk-UA')}`, 25, 230 + i*8);
        });

        doc.save(`Місія_${mission.id}_${field.name}.pdf`);
    };

    if (loading) return <div className="text-center p-20 text-2xl">Завантаження місії...</div>;
    if (!mission) return <div className="text-center p-20 text-red-600 text-2xl">Місію не знайдено</div>;

    const anomaliesCount = observations.filter(o => !o.message.includes('нормально')).length;
    const totalPhotos = observations.length;

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold text-blue-900">
                    Місія #{mission.id} — {field.name}
                </h1>
                <button
                    onClick={() => navigate('/missions')}
                    className="bg-gray-600 text-white px-6 py-3 rounded-xl hover:bg-gray-700"
                >
                    ← Назад до історії
                </button>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Ліва колонка — інфо */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <h2 className="text-2xl font-bold mb-6">Параметри місії</h2>
                        <div className="space-y-4 text-lg">
                            <p><strong>Поле:</strong> {field.name}</p>
                            <p><strong>Культура:</strong> {field.crop_type}</p>
                            <p><strong>Площа:</strong> {field.area} га</p>
                            <p><strong>Тип задачі:</strong>
                                <span className={`ml-3 px-4 py-1 rounded-full text-white ${mission.task === 'monitoring' ? 'bg-cyan-600' : 'bg-orange-600'}`}>
                  {mission.task === 'monitoring' ? 'Моніторинг' : 'Обприскування'}
                </span>
                            </p>
                            <p><strong>Висота польоту:</strong> {mission.altitude} м</p>
                            <p><strong>Швидкість:</strong> {mission.speed} м/с</p>
                            <p><strong>Дата та час:</strong> {new Date(mission.timestamp || Date.now()).toLocaleString('uk-UA')}</p>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-2xl p-8 text-center">
                        <p className="text-5xl font-bold">{totalPhotos}</p>
                        <p className="text-xl mt-2">знімків зроблено</p>
                        {anomaliesCount > 0 && (
                            <>
                                <p className="text-6xl font-bold mt-6 text-red-300">{anomaliesCount}</p>
                                <p className="text-xl">аномалій виявлено</p>
                            </>
                        )}
                    </div>

                    <div className="flex flex-col gap-4">
                        <button
                            onClick={() => navigate(`/create-mission/${field.id}`)}
                            className="bg-green-600 text-white py-4 rounded-xl font-bold text-xl hover:bg-green-700"
                        >
                            Повторити місію
                        </button>
                        <button
                            onClick={generatePDF}
                            className="bg-blue-600 text-white py-4 rounded-xl font-bold text-xl hover:bg-blue-700"
                        >
                            Завантажити PDF-звіт
                        </button>
                    </div>
                </div>

                {/* Карта */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                        <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                            <h2 className="text-2xl font-bold">Карта польоту та спостережень</h2>
                            <p className="opacity-90">Клікніть на маркери — подивитися деталі</p>
                        </div>
                        <div
                            ref={mapRef}
                            className="w-full"
                            style={{ height: '680px' }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default MissionDetailScreen;