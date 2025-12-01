import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function SprayCalculatorScreen() {
    const [fields, setFields] = useState([]);
    const [selectedFieldId, setSelectedFieldId] = useState('');
    const [productName, setProductName] = useState('');
    const [rateLperHa, setRateLperHa] = useState(2.0); // норма на гектар
    const [tankVolume, setTankVolume] = useState(40); // літрів у баку XAG P100
    const [result, setResult] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        fetch('http://localhost:5000/api/fields')
            .then(r => r.json())
            .then(setFields);
    }, []);

    const calculate = () => {
        const field = fields.find(f => f.id === Number(selectedFieldId));
        if (!field || !productName || rateLperHa <= 0 || tankVolume <= 0) {
            alert('Заповніть усі поля правильно!');
            return;
        }

        const areaHa = field.area;
        const totalProductLiters = areaHa * rateLperHa;
        const tanksNeeded = Math.ceil(totalProductLiters / tankVolume);
        const waterNeededLiters = areaHa * 30; // припустимо 30 л/га води (можна зробити налаштовуваним)

        setResult({
            fieldName: field.name,
            areaHa,
            productName,
            rateLperHa,
            tankVolume,
            totalProductLiters: +totalProductLiters.toFixed(2),
            tanksNeeded,
            waterNeededLiters: +waterNeededLiters.toFixed(1),
            totalLiquidLiters: +(totalProductLiters + waterNeededLiters).toFixed(1)
        });
    };

    const selectedField = fields.find(f => f.id === Number(selectedFieldId));

    return (
        <div className="container mx-auto p-6 max-w-5xl">
            <h1 className="text-4xl font-bold text-center mb-10 text-blue-800">
                Розрахунок препарату для обприскування
            </h1>

            <div className="bg-white rounded-3xl shadow-2xl p-10">
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Ліва колонка — форма */}
                    <div className="space-y-6">
                        <div>
                            <label className="block text-lg font-semibold mb-2">Оберіть поле</label>
                            <select
                                value={selectedFieldId}
                                onChange={e => setSelectedFieldId(e.target.value)}
                                className="w-full border-2 border-gray-300 rounded-xl px-5 py-4 text-lg focus:border-blue-500 focus:outline-none"
                            >
                                <option value="">— Оберіть поле —</option>
                                {fields.map(f => (
                                    <option key={f.id} value={f.id}>
                                        {f.name} ({f.crop_type} – {f.area} га)
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-lg font-semibold mb-2">Назва препарату</label>
                            <input
                                type="text"
                                placeholder="Напр. Інсектицид Актеллік"
                                value={productName}
                                onChange={e => setProductName(e.target.value)}
                                className="w-full border-2 border-gray-300 rounded-xl px-5 py-4 text-lg focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-lg font-semibold mb-2">
                                Норма препарату (л/га або кг/га)
                            </label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={rateLperHa}
                                onChange={e => setRateLperHa(e.target.value)}
                                className="w-full border-2 border-gray-300 rounded-xl px-5 py-4 text-lg focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-lg font-semibold mb-2">
                                Об'єм бака дрона (літрів)
                            </label>
                            <input
                                type="number"
                                value={tankVolume}
                                onChange={e => setTankVolume(e.target.value)}
                                className="w-full border-2 border-gray-300 rounded-xl px-5 py-4 text-lg focus:border-blue-500"
                                placeholder="XAG P100 – 40 л"
                            />
                        </div>

                        <button
                            onClick={calculate}
                            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-5 rounded-2xl text-2xl font-bold hover:from-green-700 shadow-lg transform hover:-translate-y-1 transition"
                        >
                            Розрахувати
                        </button>
                    </div>

                    {/* Права колонка — результат */}
                    <div className="space-y-6">
                        {result ? (
                            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-8 rounded-3xl border-2 border-blue-200">
                                <h2 className="text-3xl font-bold text-center mb-8 text-blue-900">
                                    Результат розрахунку
                                </h2>

                                <div className="space-y-4 text-lg">
                                    <p><strong>Поле:</strong> {result.fieldName}</p>
                                    <p><strong>Площа:</strong> {result.areaHa} га</p>
                                    <p><strong>Препарат:</strong> {result.productName}</p>
                                    <hr className="my-4 border-dashed" />

                                    <div className="bg-white p-5 rounded-2xl shadow">
                                        <p className="text-2xl font-bold text-green-700">
                                            {result.totalProductLiters} л
                                        </p>
                                        <p className="text-gray-600">потрібно препарату всього</p>
                                    </div>

                                    <div className="bg-white p-5 rounded-2xl shadow">
                                        <p className="text-2xl font-bold text-blue-700">
                                            {result.tanksNeeded} баків
                                        </p>
                                        <p className="text-gray-600">по {result.tankVolume} л</p>
                                    </div>

                                    <div className="bg-white p-5 rounded-2xl shadow">
                                        <p className="text-2xl font-bold text-cyan-700">
                                            ≈ {result.waterNeededLiters} л води
                                        </p>
                                        <p className="text-gray-600">при нормі 30 л/га</p>
                                    </div>

                                    <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-2xl text-center">
                                        <p className="text-3xl font-bold">
                                            {result.totalLiquidLiters} л
                                        </p>
                                        <p className="text-lg">робочого розчину загалом</p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => navigate(`/create-mission/${selectedFieldId}`)}
                                    className="w-full mt-8 bg-orange-600 text-white py-4 rounded-xl font-bold text-xl hover:bg-orange-700"
                                >
                                    Створити місію обприскування
                                </button>
                            </div>
                        ) : (
                            <div className="text-center text-gray-400 py-20">
                                <div className="text-6xl mb-4">Droplet Icon</div>
                                <p className="text-2xl">Заповніть форму ←<br/>та натисніть "Розрахувати"</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="text-center mt-12">
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

export default SprayCalculatorScreen;