// src/components/ReportsScreen.jsx
import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import L from 'leaflet';

import robotoNormal from './fonts/Roboto-Regular-normal'; // Створи цей файл!
const ReportsScreen = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const mapInstance = useRef(null);
  const mapRef = useRef(null);

  // Завантажуємо всі спостереження + поле + місію
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [obsRes, missionsRes, fieldsRes] = await Promise.all([
          fetch('http://localhost:5000/api/observations').then(r => r.json()),
          fetch('http://localhost:5000/api/missions/last').then(r => r.json()),
          fetch('http://localhost:5000/api/fields').then(r => r.json())
        ]);

        if (!missionsRes.id) {
          setReports([]);
          setLoading(false);
          return;
        }

        // Знайдемо назву поля
        const field = fieldsRes.find(f => f.id === missionsRes.field_id) || { name: "Невідоме поле" };

        // Групуємо спостереження по місії (в нас одна остання)
        const anomalies = obsRes.filter(o => !o.message.includes("все нормально"));
        const normal = obsRes.filter(o => o.message.includes("все нормально"));

        const reportData = {
          id: missionsRes.id,
          fieldName: field.name,
          crop: field.crop_type || "Пшениця",
          area: field.area || 50,
          date: new Date().toLocaleDateString('uk-UA'),
          time: new Date().toLocaleTimeString('uk-UA'),
          ndvi: 0.78,
          totalPhotos: obsRes.length,
          anomalies: anomalies.length,
          anomalyList: anomalies,
          polygon: JSON.parse(missionsRes.polygon || '{}')
        };

        setReports([reportData]);
        setLoading(false);

        // Ініціалізуємо карту після завантаження даних
        setTimeout(() => initMap(reportData), 300);
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const initMap = (report) => {
    if (!mapRef.current || mapInstance.current) return;

    // Створюємо екземпляр карти
    mapInstance.current = L.map(mapRef.current).setView([50.244973, 30.122926], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(mapInstance.current);

    if (report.polygon?.coordinates?.[0]) {
      const coords = report.polygon.coordinates[0].map(c => [c[1], c[0]]);
      L.polygon(coords, { color: '#3b82f6', weight: 3, fillOpacity: 0.2 })
          .addTo(mapInstance.current);

      report.anomalyList.forEach(obs => {
        L.circleMarker([obs.lat, obs.lng], {
          radius: 8,
          color: '#ef4444',
          fillOpacity: 0.9
        })
            .addTo(mapInstance.current)
            .bindPopup(`<strong>${obs.message}</strong><br>${new Date(obs.timestamp).toLocaleString('uk-UA')}`);
      });

      // Центруємо карту по полігону
      mapInstance.current.fitBounds(L.polygon(coords).getBounds());
    }
  };

  // Фейкові фото шкідників (можна замінити на реальні знімки з дрона пізніше)
  const pestImages = [
    "https://i.ibb.co/7zvz9Yt/aphid.jpg",        // попелиця
    "https://i.ibb.co/4p7vK1Q/rust.jpg",         // іржа
    "https://i.ibb.co/3hK9nYk/drought.jpg",      // посуха
    "https://i.ibb.co/8Xg5n7P/weeds.jpg",        // бур'яни
  ];

  const generatePDF = async (report) => {
    const doc = new jsPDF('p', 'mm', 'a4');

    // Правильний імпорт шрифту (він у тебе вже є!)

    // Додаємо шрифт з кирилицею
    doc.addFileToVFS('Roboto-Regular.ttf', robotoNormal);
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
    doc.setFont('Roboto');

    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    doc.setFontSize(22);
    doc.text('ЗВІТ МОНІТОРИНГУ ПОЛЯ', pageWidth / 2, y, { align: 'center' });
    y += 15;

    doc.setFontSize(14);
    doc.text(`Поле: ${report.fieldName}`, pageWidth / 2, y, { align: 'center' });
    y += 8;
    doc.text(`Культура: ${report.crop} • Площа: ${report.area} га`, pageWidth / 2, y, { align: 'center' });
    y += 8;
    doc.text(`Дата: ${report.date} • Час: ${report.time}`, pageWidth / 2, y, { align: 'center' });
    y += 20;

    // Основні показники
    doc.setFontSize(16);
    doc.setFillColor(30, 64, 175);
    doc.setTextColor(255, 255, 255);
    doc.rect(15, y - 10, pageWidth - 30, 14, 'F');
    doc.text('ОСНОВНІ ПОКАЗНИКИ', pageWidth / 2, y - 1, { align: 'center' });
    y += 15;

    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.setFont('Roboto');

    const lines = [
      `Середнє NDVI: ${report.ndvi.toFixed(2)} (здорові рослини)`,
      `Всього знімків: ${report.totalPhotos}`,
      `Виявлено проблем: ${report.anomalies}`,
      `Рекомендація: термінова обробка ділянок з шкідниками та стресом`
    ];

    lines.forEach(line => {
      doc.text(line, 20, y);
      y += 8;
    });
    y += 10;

    // Карта
    if (mapRef.current) {
      try {
        const canvas = await html2canvas(mapRef.current, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff'
        });
        const imgData = canvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', 15, y, pageWidth - 30, 110);
        y += 120;
      } catch (err) {
        console.warn('Карта не додана в PDF');
      }
    }

    // Аномалії
    if (report.anomalies > 0) {
      doc.setFontSize(16);
      doc.setFillColor(220, 38, 38);
      doc.setTextColor(255, 255, 255);
      doc.rect(15, y - 10, pageWidth - 30, 14, 'F');
      doc.text(`ВИЯВЛЕНІ ПРОБЛЕМИ (${report.anomalies})`, pageWidth / 2, y - 1, { align: 'center' });
      y += 15;

      doc.setTextColor(0);
      doc.setFontSize(11);

      report.anomalyList.slice(0, 10).forEach((obs, i) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.setFont('Roboto', 'bold');
        doc.text(`${i + 1}. ${obs.message}`, 20, y);
        doc.setFont('Roboto', 'normal');
        doc.text(`Координати: ${obs.lat.toFixed(6)}, ${obs.lng.toFixed(6)}`, 20, y + 7);
        doc.text(`${new Date(obs.timestamp).toLocaleString('uk-UA')}`, 20, y + 14);
        y += 25;
      });
    }

    // Підвал
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Звіт згенеровано системою моніторингу дроном XAG P100 + MicaSense', 20, 280);
    doc.text('agro-drone.com • +380 99 123-45-67', 20, 286);

    doc.save(`Звіт_${report.fieldName}_${report.date.replaceAll('.', '-')}.pdf`);
  };

  if (loading) return <div className="text-center p-10">Завантаження звіту...</div>;
  if (reports.length === 0) return <div className="text-center p-10">Немає даних для звіту. Запустіть місію!</div>;

  return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6 text-center">Звіти моніторингу</h1>

        {/* Прихована карта для скріншота */}
        <div style={{ position: 'absolute', left: '-9999px', top: 0, width: '800px', height: '600px' }}>
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        </div>

        {reports.map(r => (
            <div key={r.id} className="bg-white p-8 mb-8 rounded-xl shadow-lg border-2 border-blue-100">
              <h2 className="text-2xl font-bold mb-4">{r.fieldName}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded"><strong>NDVI:</strong> {r.ndvi}</div>
                <div className="bg-green-50 p-4 rounded"><strong>Знімків:</strong> {r.totalPhotos}</div>
                <div className="bg-red-50 p-4 rounded"><strong>Аномалій:</strong> {r.anomalies}</div>
                <div className="bg-purple-50 p-4 rounded"><strong>Дата:</strong> {r.date}</div>
              </div>

              {r.anomalies > 0 && (
                  <div className="bg-red-100 p-4 rounded mb-6 border border-red-300">
                    <strong>Увага!</strong> Виявлено {r.anomalies} проблемних ділянок. Рекомендується термінова обробка!
                  </div>
              )}

              <button
                  onClick={() => generatePDF(r)}
                  className="w-full bg-gradient-to-r from-blue-600 to-green-600 text-white py-4 text-xl font-bold rounded-xl hover:from-blue-700 hover:to-green-700 transition-all shadow-lg"
              >
                Завантажити професійний PDF-звіт
              </button>
            </div>
        ))}
      </div>
  );
};

export default ReportsScreen;