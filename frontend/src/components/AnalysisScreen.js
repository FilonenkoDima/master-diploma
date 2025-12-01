import React, { useEffect } from 'react';
import L from 'leaflet';

const AnalysisScreen = () => {
  useEffect(() => {
    const map = L.map('ndvi-map').setView([50.45, 30.52], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
    return () => map.remove();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Аналіз NDVI (MicaSense RedEdge-P)</h1>
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Карта вегетації</h2>
        <div id="ndvi-map" className="h-64 border rounded mb-4"></div>
        <div className="bg-green-100 p-4 rounded">
          <p><strong>Середнє NDVI:</strong> 0.78</p>
          <p><strong>Аномалії:</strong> 2 ділянки (вододефіцит, хвороба)</p>
          <p><strong>Рекомендація:</strong> Внести фунгіцид 2 л/га на ділянці 1.2</p>
        </div>
      </div>
    </div>
  );
};

export default AnalysisScreen;