import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function WeatherScreen() {
    const [fields, setFields] = useState([]);
    const [selectedFieldId, setSelectedFieldId] = useState('');
    const [weather, setWeather] = useState(null);
    const [forecast, setForecast] = useState([]);
    const [recommendation, setRecommendation] = useState('');
    const [canFly, setCanFly] = useState(null); // true / false / 'soon'

    const navigate = useNavigate();

    useEffect(() => {
        fetch('http://localhost:5000/api/fields')
            .then(r => r.json())
            .then(setFields);
    }, []);

    // Координати центру України (якщо поле ще не вибрано)
    const fallbackCoords = { lat: 49.0, lon: 31.5 };

    const selectedField = fields.find(f => f.id === Number(selectedFieldId));
    const coords = selectedField
        ? { lat: 50.244973, lon: 30.122926 } // можна зберігати координати поля в БД — поки хардкод
        : fallbackCoords;

    useEffect(() => {
        if (!selectedFieldId) return;

        const fetchWeather = async () => {
            try {
                const res = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation_probability&daily=temperature_2m_max,temperature_2m_min,wind_speed_10m_max,precipitation_probability_max&timezone=Europe/Kiev`
                );
                const data = await res.json();

                const current = {
                    temp: Math.round(data.hourly.temperature_2m[0]),
                    humidity: data.hourly.relative_humidity_2m[0],
                    wind: data.hourly.wind_speed_10m[0].toFixed(1),
                    rainChance: data.hourly.precipitation_probability[0],
                };

                const daily = data.daily.time.slice(0, 7).map((date, i) => ({
                    date: new Date(date).toLocaleDateString('uk-UA'),
                    tempMax: Math.round(data.daily.temperature_2m_max[i]),
                    tempMin: Math.round(data.daily.temperature_2m_min[i]),
                    windMax: data.daily.wind_speed_10m_max[i].toFixed(1),
                    rainChance: data.daily.precipitation_probability_max[i],
                }));

                setWeather(current);
                setForecast(daily);

                // ===== Логіка рекомендацій для дрона XAG P100 =====
                const windMs = parseFloat(current.wind);
                const rain = current.rainChance;

                if (windMs <= 5 && rain < 20) {
                    setRecommendation('Відмінні умови! Можна виконувати обліт та обприскування прямо зараз');
                    setCanFly(true);
                } else if (windMs <= 8 && rain < 50) {
                    setRecommendation('Умови прийнятні. Рекомендується моніторинг, обприскування — з обережністю');
                    setCanFly('caution');
                } else {
                    // шукаємо найближчий хороший час
                    let goodHour = null;
                    for (let i = 0; i < 24; i++) {
                        if (data.hourly.wind_speed_10m[i] <= 6 && data.hourly.precipitation_probability[i] < 30) {
                            goodHour = i;
                            break;
                        }
                    }

                    if (goodHour !== null) {
                        const time = new Date();
                        time.setHours(time.getHours() + goodHour);
                        setRecommendation(`Зараз сильний вітер / дощ. Найкращий час — після ${time.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })}`);
                    } else {
                        setRecommendation('Сьогодні умови не підходять для польоту дроном. Спробуйте завтра.');
                    }
                    setCanFly(false);
                }
            } catch (err) {
                setRecommendation('Не вдалося отримати дані погоди');
            }
        };

        fetchWeather();
        const id = setInterval(fetchWeather, 10 * 60 * 1000); // кожні 10 хв
        return () => clearInterval(id);
    }, [selectedFieldId]);

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <h1 className="text-4xl font-bold text-center mb-10 text-blue-800">
                Погода та рекомендації для польотів
            </h1>

            <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
                <label className="block text-xl font-semibold mb-4">Оберіть поле для якого поля подивитися погоду</label>
                <select
                    value={selectedFieldId}
                    onChange={e => setSelectedFieldId(e.target.value)}
                    className="w-full md:w-96 border-2 border-gray-300 rounded-xl px-6 py-4 text-lg focus:border-blue-600"
                >
                    <option value="">— Оберіть поле —</option>
                    {fields.map(f => (
                        <option key={f.id} value={f.id}>{f.name} ({f.crop_type}, {f.area} га)</option>
                    ))}
                </select>
            </div>

            {!selectedFieldId ? (
                <div className="text-center py-20 text-gray-500">
                    <p className="text-2xl">Оберіть поле ↑ щоб побачити актуальну погоду та рекомендації</p>
                </div>
            ) : (
                <>
                    {/* Поточна погода */}
                    {weather && (
                        <div className="grid md:grid-cols-2 gap-8 mb-10">
                            <div className="bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-3xl p-10 text-center">
                                <p className="text-6xl font-bold">{weather.temp}°C</p>
                                <p className="text-2xl mt-4">Прямо зараз</p>
                                <div className="mt-8 space-y-3 text-lg">
                                    <p>Вітер: {weather.wind} м/с</p>
                                    <p>Вологість: {weather.humidity}%</p>
                                    <p>Ймовірність дощу: {weather.rainChance}%</p>
                                </div>
                            </div>

                            <div className={`rounded-3xl p-10 text-center ${canFly === true ? 'bg-green-500' : canFly === 'caution' ? 'bg-yellow-500' : 'bg-red-500'} text-white`}>
                                <p className="text-7xl mb-6">{canFly === true ? 'Check' : canFly === 'caution' ? 'Warning' : 'Block'}</p>
                                <p className="text-2xl font-bold">Умови для польоту</p>
                                <p className="text-xl mt-4">{recommendation}</p>
                            </div>
                        </div>
                    )}

                    {/* Прогноз на 7 днів */}
                    <h2 className="text-3xl font-bold mb-6">Прогноз на 7 днів</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                        {forecast.map(day => (
                            <div key={day.date} className="bg-gray-50 rounded-2xl p-5 text-center hover:bg-gray-100 transition">
                                <p className="font-semibold text-lg">{day.date}</p>
                                <p className="text-3xl my-3">{day.tempMax}°</p>
                                <p className="text-gray-600">{day.tempMin}°</p>
                                <p className="text-sm mt-2">Вітер до {day.windMax} м/с</p>
                                <p className="text-sm text-blue-600">{day.rainChance > 30 ? 'Дощ' : 'Сухо'}</p>
             </div>
           ))}
         </div>

         <div className="text-center mt-12">
           {canFly === true && (
             <button
               onClick={() => navigate(`/create-mission/${selectedFieldId}`)}
               className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-12 py-6 rounded-2xl text-2xl font-bold shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition"
             >
               Створити місію прямо зараз — погода дозволяє!
             </button>
           )}
           {canFly === false && (
             <button disabled className="bg-gray-400 text-white px-12 py-6 rounded-2xl text-2xl cursor-not-allowed">
               Польоти не рекомендовано
             </button>
           )}
         </div>
       </>
     )}

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

export default WeatherScreen;