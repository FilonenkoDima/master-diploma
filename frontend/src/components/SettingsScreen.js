import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function SettingsScreen() {
    const navigate = useNavigate();

    // Завантажуємо збережені налаштування (або дефолтні)
    const [settings, setSettings] = useState({
        droneModel: 'XAG P100',
        tankVolume: 40,        // літри
        maxAltitude: 100,      // метри
        maxSpeed: 10,          // м/с
        defaultAltitude: 40,
        defaultSpeed: 5,
        waterRate: 30,         // л/га (для розрахунку робочого розчину)
        batteryWarning: 20,    // % – коли починати попереджати
        language: 'uk',
        theme: 'light',
        weatherApiKey: '',     // в майбутньому можна додати OpenWeatherMap тощо
    });

    useEffect(() => {
        const saved = localStorage.getItem('droneSettings');
        if (saved) {
            setSettings({ ...settings, ...JSON.parse(saved) });
        }
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: name.includes('Volume') || name.includes('Altitude') || name.includes('Speed') || name.includes('Rate') || name.includes('Warning')
                ? Number(value)
                : value
        }));
    };

    const handleSave = () => {
        localStorage.setItem('droneSettings', JSON.stringify(settings));
        alert('Налаштування успішно збережено!');
    };

    const handleReset = () => {
        if (window.confirm('Скинути всі налаштування до стандартних?')) {
            localStorage.removeItem('droneSettings');
            window.location.reload();
        }
    };

    return (
        <div className="container mx-auto p-6 max-w-5xl">
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-4xl font-bold text-blue-800">
                    Налаштування системи
                </h1>
                <button
                    onClick={() => navigate('/')}
                    className="bg-gray-600 text-white px-6 py-3 rounded-xl hover:bg-gray-700 transition"
                >
                    На головну
                </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">

                {/* === Дрон та політ === */}
                <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-blue-100">
                    <h2 className="text-2xl font-bold mb-6 text-blue-700 flex items-center">
                        Дрон та параметри польоту
                    </h2>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-lg font-semibold mb-2">Модель дрона</label>
                            <select
                                name="droneModel"
                                value={settings.droneModel}
                                onChange={handleChange}
                                className="w-full border-2 border-gray-300 rounded-xl px-5 py-4 text-lg focus:border-blue-500"
                            >
                                <option value="XAG P100">XAG P100 (40 л)</option>
                                <option value="XAG P150">XAG P150 (70 л)</option>
                                <option value="DJI Agras T40">DJI Agras T40 (40 л)</option>
                                <option value="DJI Agras T50">DJI Agras T50 (50 л)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-lg font-semibold mb-2">
                                Об'єм бака (літрів)
                            </label>
                            <input
                                type="number"
                                name="tankVolume"
                                value={settings.tankVolume}
                                onChange={handleChange}
                                min="10"
                                max="100"
                                className="w-full border-2 border-gray-300 rounded-xl px-5 py-4 text-lg focus:border-blue-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-lg font-semibold mb-2">Висота за замовчуванням (м)</label>
                                <input
                                    type="number"
                                    name="defaultAltitude"
                                    value={settings.defaultAltitude}
                                    onChange={handleChange}
                                    min="20"
                                    max={settings.maxAltitude}
                                    className="w-full border-2 border-gray-300 rounded-xl px-5 py-4 text-lg focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-lg font-semibold mb-2">Швидкість за замовчуванням (м/с)</label>
                                <input
                                    type="number"
                                    name="defaultSpeed"
                                    value={settings.defaultSpeed}
                                    onChange={handleChange}
                                    min="1"
                                    max={settings.maxSpeed}
                                    step="0.5"
                                    className="w-full border-2 border-gray-300 rounded-xl px-5 py-4 text-lg focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-lg font-semibold mb-2">Макс. висота (м)</label>
                                <input
                                    type="number"
                                    name="maxAltitude"
                                    value={settings.maxAltitude}
                                    onChange={handleChange}
                                    min="50"
                                    max="150"
                                    className="w-full border-2 border-gray-300 rounded-xl px-5 py-4 text-lg focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-lg font-semibold mb-2">Макс. швидкість (м/с)</label>
                                <input
                                    type="number"
                                    name="maxSpeed"
                                    value={settings.maxSpeed}
                                    onChange={handleChange}
                                    min="8"
                                    max="15"
                                    step="0.5"
                                    className="w-full border-2 border-gray-300 rounded-xl px-5 py-4 text-lg focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* === Розрахунки та сповіщення === */}
                <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-green-100">
                    <h2 className="text-2xl font-bold mb-6 text-green-700 flex items-center">
                        Розрахунки та сповіщення
                    </h2>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-lg font-semibold mb-2">
                                Норма води для обприскування (л/га)
                            </label>
                            <input
                                type="number"
                                name="waterRate"
                                value={settings.waterRate}
                                onChange={handleChange}
                                min="10"
                                max="100"
                                className="w-full border-2 border-gray-300 rounded-xl px-5 py-4 text-lg focus:border-green-500"
                            />
                            <p className="text-sm text-gray-600 mt-1">Використовується в калькуляторі препаратів</p>
                        </div>

                        <div>
                            <label className="block text-lg font-semibold mb-2">
                                Попередження про низький заряд батареї (%)
                            </label>
                            <input
                                type="number"
                                name="batteryWarning"
                                value={settings.batteryWarning}
                                onChange={handleChange}
                                min="5"
                                max="50"
                                className="w-full border-2 border-gray-300 rounded-xl px-5 py-4 text-lg focus:border-green-500"
                            />
                        </div>

                        <div>
                            <label className="block text-lg font-semibold mb-2">Мова інтерфейсу</label>
                            <select
                                name="language"
                                value={settings.language}
                                onChange={handleChange}
                                className="w-full border-2 border-gray-300 rounded-xl px-5 py-4 text-lg focus:border-green-500"
                            >
                                <option value="uk">Українська</option>
                                <option value="en">English</option>
                                <option value="pl">Polski</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-lg font-semibold mb-2">Тема</label>
                            <select
                                name="theme"
                                value={settings.theme}
                                onChange={handleChange}
                                className="w-full border-2 border-gray-300 rounded-xl px-5 py-4 text-lg focus:border-green-500"
                            >
                                <option value="light">Світла</option>
                                <option value="dark">Темна</option>
                                <option value="auto">Як у системі</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* === Кнопки збереження === */}
            <div className="flex justify-center gap-6 mt-12">
                <button
                    onClick={handleSave}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-12 py-5 rounded-2xl text-xl font-bold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition"
                >
                    Зберегти налаштування
                </button>

                <button
                    onClick={handleReset}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-10 py-5 rounded-2xl text-xl font-bold transition"
                >
                    Скинути до стандартних
                </button>
            </div>

            <div className="text-center mt-10 text-gray-500">
                <p>Налаштування зберігаються локально у вашому браузері</p>
            </div>
        </div>
    );
}

export default SettingsScreen;