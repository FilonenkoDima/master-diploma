import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { uk } from 'date-fns/locale';

function CalendarScreen() {
    const navigate = useNavigate();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [tasks, setTasks] = useState([]); // { id, date: "2025-04-05", fieldId, fieldName, type: "monitoring" | "spraying" | "fertilizer", title, status: "planned"|"done"|"cancelled" }
    const [showModal, setShowModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [fields, setFields] = useState([]);

    // Завантаження полів та завдань
    useEffect(() => {
        fetch('http://localhost:5000/api/fields')
            .then(r => r.json())
            .then(setFields);

        const saved = localStorage.getItem('calendarTasks');
        if (saved) {
            setTasks(JSON.parse(saved));
        } else {
            // Демо-дані
            setTasks([
                { id: 1, date: format(new Date(), 'yyyy-MM-dd'), fieldId: 1, fieldName: 'Пшениця-2025', type: 'monitoring', title: 'Моніторинг NDVI', status: 'planned' },
                { id: 2, date: format(addDays(new Date(), 2), 'yyyy-MM-dd'), fieldId: 2, fieldName: 'Кукурудза-2025', type: 'spraying', title: 'Обприскування від попелиці', status: 'planned' },
                { id: 3, date: format(addDays(new Date(), -3), 'yyyy-MM-dd'), fieldId: 1, fieldName: 'Пшениця-2025', type: 'monitoring', title: 'Моніторинг вологозабезпечення', status: 'done' },
            ]);
        }
    }, []);

    // Допоміжна функція
    const addDays = (date, days) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const getTasksForDay = (date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return tasks.filter(t => t.date === dateStr);
    };

    const openModal = (date) => {
        setSelectedDate(date);
        setShowModal(true);
    };

    const saveTask = (e) => {
        e.preventDefault();
        const form = e.target;
        const newTask = {
            id: Date.now(),
            date: format(selectedDate, 'yyyy-MM-dd'),
            fieldId: Number(form.field.value),
            fieldName: fields.find(f => f.id === Number(form.field.value))?.name || '—',
            type: form.type.value,
            title: form.title.value.trim() || 'Завдання',
            status: 'planned'
        };

        const updated = [...tasks, newTask];
        setTasks(updated);
        localStorage.setItem('calendarTasks', JSON.stringify(updated));
        setShowModal(false);
    };

    const deleteTask = (id) => {
        if (window.confirm('Видалити завдання?')) {
            const updated = tasks.filter(t => t.id !== id);
            setTasks(updated);
            localStorage.setItem('calendarTasks', JSON.stringify(updated));
        }
    };

    const goToMission = (fieldId) => {
        navigate(`/create-mission/${fieldId}`);
    };

    return (
        <div className="container mx-auto p-6 max-w-7xl">
            <div className="flex justify-between items-center mb-10">
                <h1 className="text-4xl font-bold text-blue-800">
                    Календар планування робіт
                </h1>
                <button
                    onClick={() => navigate('/')}
                    className="bg-gray-600 text-white px-6 py-3 rounded-xl hover:bg-gray-700"
                >
                    На головну
                </button>
            </div>

            {/* Навігація по місяцях */}
            <div className="bg-white rounded-3xl shadow-2xl p-6 mb-8">
                <div className="flex justify-between items-center mb-6">
                    <button
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        className="text-3xl font-bold text-blue-600 hover:text-blue-800"
                    >
                        ←
                    </button>
                    <h2 className="text-3xl font-bold text-blue-900">
                        {format(currentMonth, 'LLLL yyyy', { locale: uk })}
                    </h2>
                    <button
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        className="text-3xl font-bold text-blue-600 hover:text-blue-800"
                    >
                        →
                    </button>
                </div>

                {/* Сітка днів */}
                <div className="grid grid-cols-7 gap-4 text-center font-semibold text-gray-700 mb-2">
                    <div>Пн</div><div>Вт</div><div>Ср</div><div>Чт</div><div>Пт</div>
                    <div className="text-blue-600">Сб</div><div className="text-blue-600">Нд</div>
                </div>

                <div className="grid grid-cols-7 gap-4">
                    {/* Порожні клітинки до першого дня місяця */}
                    {Array.from({ length: monthStart.getDay() === 0 ? 6 : monthStart.getDay() - 1 }).map((_, i) => (
                        <div key={`empty-${i}`} />
                    ))}

                    {monthDays.map(day => {
                        const dayTasks = getTasksForDay(day);
                        const isToday = isSameDay(day, new Date());

                        return (
                            <div
                                key={day.toString()}
                                onClick={() => openModal(day)}
                                className={`min-h-32 bg-gray-50 rounded-2xl p-3 border-2 transition-all cursor-pointer
                  ${isToday ? 'border-blue-500 shadow-lg ring-4 ring-blue-200' : 'border-gray-200 hover:border-blue-400 hover:shadow-md'}`}
                            >
                                <div className={`text-xl font-bold ${isToday ? 'text-blue-700' : 'text-gray-800'}`}>
                                    {format(day, 'd')}
                                </div>

                                <div className="mt-2 space-y-1">
                                    {dayTasks.slice(0, 3).map(task => (
                                        <div
                                            key={task.id}
                                            className={`text-xs px-2 py-1 rounded-full text-white truncate
                        ${task.type === 'monitoring' ? 'bg-cyan-600' :
                                                task.type === 'spraying' ? 'bg-orange-600' :
                                                    task.type === 'fertilizer' ? 'bg-green-600' : 'bg-purple-600'}
                        ${task.status === 'done' ? 'opacity-70 line-through' : ''}`}
                                            onClick={(e) => { e.stopPropagation(); task.status === 'done' || deleteTask(task.id); }}
                                        >
                                            {task.type === 'monitoring' && 'Моніторинг'} {task.type === 'spraying' && 'Обприскування'} {task.title}
                                        </div>
                                    ))}
                                    {dayTasks.length > 3 && (
                                        <div className="text-xs text-gray-500">+{dayTasks.length - 3} ще</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Легенда */}
            <div className="bg-white rounded-2xl shadow-xl p-6 text-center">
                <div className="flex flex-wrap justify-center gap-6 text-sm font-semibold">
                    <span className="flex items-center gap-2"><div className="w-5 h-5 bg-cyan-600 rounded-full"></div> Моніторинг</span>
                    <span className="flex items-center gap-2"><div className="w-5 h-5 bg-orange-600 rounded-full"></div> Обприскування</span>
                    <span className="flex items-center gap-2"><div className="w-5 h-5 bg-green-600 rounded-full"></div> Внесення добрив</span>
                    <span className="flex items-center gap-2"><div className="w-5 h-5 bg-purple-600 rounded-full"></div> Інше</span>
                </div>
            </div>

            {/* Модальне вікно додавання завдання */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
                        <h3 className="text-2xl font-bold mb-6">
                            Нове завдання на {format(selectedDate, 'd MMMM yyyy', { locale: uk })}
                        </h3>

                        <form onSubmit={saveTask} className="space-y-5">
                            <div>
                                <label className="block text-lg font-semibold mb-2">Поле</label>
                                <select name="field" required className="w-full border-2 border-gray-300 rounded-xl px-5 py-3 text-lg focus:border-blue-500">
                                    <option value="">— Оберіть поле —</option>
                                    {fields.map(f => (
                                        <option key={f.id} value={f.id}>{f.name} ({f.crop_type}, {f.area} га)</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-lg font-semibold mb-2">Тип завдання</label>
                                <select name="type" required className="w-full border-2 border-gray-300 rounded-xl px-5 py-3 text-lg focus:border-blue-500">
                                    <option value="monitoring">Моніторинг (NDVI, волога)</option>
                                    <option value="spraying">Обприскування ЗЗР</option>
                                    <option value="fertilizer">Внесення добрив</option>
                                    <option value="other">Інше</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-lg font-semibold mb-2">Назва (не обов’язково)</label>
                                <input
                                    name="title"
                                    type="text"
                                    placeholder="Напр. Обробка від іржі"
                                    className="w-full border-2 border-gray-300 rounded-xl px-5 py-3 text-lg focus:border-blue-500"
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-bold text-xl hover:from-blue-700"
                                >
                                    Додати завдання
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 bg-gray-500 text-white py-4 rounded-xl font-bold text-xl hover:bg-gray-600"
                                >
                                    Скасувати
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CalendarScreen;