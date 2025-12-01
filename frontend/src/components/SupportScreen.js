import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function SupportScreen() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });
    const [sent, setSent] = useState(false);

    const faq = [
        {
            q: "Як намалювати поле для польоту?",
            a: "На сторінці «Створити місію» оберіть поле → на карті натисніть кнопку «Полігон» (у правому верхньому куті інструментів) → клікайте по межах поля → подвійний клік для завершення."
        },
        {
            q: "Чому не зберігається місія?",
            a: "Перевірте, чи запущений бекенд (server.js) на порту 5000. У консолі має бути напис «Сервер запущений: http://localhost:5000». Якщо ні — запустіть `node server.js`."
        },
        {
            q: "Де зберігаються налаштування дрона?",
            a: "Усі налаштування (об’єм бака, висота, швидкість) зберігаються у вашому браузері (localStorage). Вони не втрачаються при оновленні сторінки."
        },
        {
            q: "Чи можна працювати офлайн?",
            a: "Так! Після першого завантаження карти працюють офлайн (кешуються тайли OpenStreetMap). Але для збереження місій потрібен запущений бекенд."
        },
        {
            q: "Як експортувати звіт у PDF?",
            a: "Після виконання місії перейдіть у «Деталі місії» → кнопка «Завантажити PDF-звіт». Звіт містить карту, аномалії та рекомендації."
        },
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        // Тут можна підключити EmailJS, formspree, або просто відкрити поштовий клієнт
        const subject = encodeURIComponent(`Питання від ${formData.name || 'Користувач'}`);
        const body = encodeURIComponent(`${formData.message}\n\nВід: ${formData.email}`);
        window.open(`mailto:support@agro-drone.com?subject=${subject}&body=${body}`);

        setSent(true);
        setTimeout(() => setSent(false), 5000);
    };

    return (
        <div className="container mx-auto p-6 max-w-6xl">
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-4xl font-bold text-blue-800">
                    Допомога та підтримка
                </h1>
                <button
                    onClick={() => navigate('/')}
                    className="bg-gray-600 text-white px-6 py-3 rounded-xl hover:bg-gray-700 transition"
                >
                    На головну
                </button>
            </div>

            {/* Відеоінструкції */}
            <section className="mb-12">
                <h2 className="text-3xl font-bold text-blue-700 mb-8 text-center">Відеоінструкції</h2>
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                        <div className="aspect-w-16 aspect-h-9">
                            <iframe
                                src="https://www.youtube.com/embed/dQw4w9WgXcQ?si=YOUTUBE_ID_1"
                                title="Як створити першу місію"
                                allowFullScreen
                                className="w-full h-64"
                            ></iframe>
                        </div>
                        <div className="p-6">
                            <h3 className="text-xl font-bold">Як створити та запустити першу місію</h3>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                        <div className="aspect-w-16 aspect-h-9">
                            <iframe
                                src="https://www.youtube.com/embed/dQw4w9WgXcQ?si=YOUTUBE_ID_2"
                                title="Розрахунок препарату"
                                allowFullScreen
                                className="w-full h-64"
                            ></iframe>
                        </div>
                        <div className="p-6">
                            <h3 className="text-xl font-bold">Розрахунок ЗЗР та обприскування</h3>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="mb-12">
                <h2 className="text-3xl font-bold text-blue-700 mb-8 text-center">Поширені запитання (FAQ)</h2>
                <div className="space-y-6">
                    {faq.map((item, i) => (
                        <details key={i} className="bg-white rounded-2xl shadow-lg border-2 border-gray-100">
                            <summary className="px-8 py-6 text-xl font-semibold cursor-pointer hover:bg-blue-50 transition">
                                {item.q}
                            </summary>
                            <div className="px-8 pb-8 pt-2 text-gray-700 leading-relaxed">
                                {item.a}
                            </div>
                        </details>
                    ))}
                </div>
            </section>

            {/* Зворотний зв'язок */}
            <section className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl shadow-2xl p-10 text-white">
                <h2 className="text-3xl font-bold mb-8 text-center">
                    Не знайшли відповідь? Напишіть нам!
                </h2>

                <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div>
                        <p className="text-xl mb-6">
                            Ми відповідаємо протягом 1 години (з 8:00 до 22:00)
                        </p>
                        <div className="space-y-4 text-lg">
                            <p>support@agro-drone.com</p>
                            <p>+380 99 123-45-67</p>
                            <a
                                href="https://t.me/agrodrone_support"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-3 bg-white text-blue-600 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition"
                            >
                                Написати в Telegram
                            </a>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <input
                            type="text"
                            placeholder="Ваше ім'я"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-6 py-4 rounded-xl text-gray-800 text-lg"
                        />
                        <input
                            type="email"
                            placeholder="Email або телефон"
                            required
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-6 py-4 rounded-xl text-gray-800 text-lg"
                        />
                        <textarea
                            placeholder="Опишіть ваше питання..."
                            required
                            rows="5"
                            value={formData.message}
                            onChange={e => setFormData({ ...formData, message: e.target.value })}
                            className="w-full px-6 py-4 rounded-xl text-gray-800 text-lg resize-none"
                        ></textarea>

                        <button
                            type="submit"
                            className="w-full bg-white text-blue-700 py-5 rounded-xl text-xl font-bold hover:bg-gray-100 transition"
                        >
                            Надіслати питання
                        </button>

                        {sent && (
                            <p className="text-green-300 text-center font-bold">
                                Повідомлення відправлено! Очікуйте відповідь на пошту або в Telegram
                            </p>
                        )}
                    </form>
                </div>
            </section>

            <div className="text-center mt-12 text-gray-500">
                <p>Версія системи: 1.5.0 • Оновлено: 30 листопада 2025</p>
            </div>
        </div>
    );
}

export default SupportScreen;