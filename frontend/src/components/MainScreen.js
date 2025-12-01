import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function MainScreen() {
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingField, setEditingField] = useState(null);
    const [form, setForm] = useState({ name: '', crop_type: '', area: '' });

    const navigate = useNavigate();

    const loadFields = async () => {
        const res = await fetch('http://localhost:5000/api/fields');
        const data = await res.json();
        setFields(data);
        setLoading(false);
    };

    useEffect(() => {
        loadFields();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = editingField
            ? `http://localhost:5000/api/fields/${editingField.id}`
            : 'http://localhost:5000/api/fields';

        const method = editingField ? 'PUT' : 'POST';

        await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: form.name,
                crop_type: form.crop_type,
                area: Number(form.area)
            })
        });

        closeModal();
        loadFields();
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Видалити це поле та всі його місії?')) return;

        await fetch(`http://localhost:5000/api/fields/${id}`, { method: 'DELETE' });
        loadFields();
    };

    const openAddModal = () => {
        setEditingField(null);
        setForm({ name: '', crop_type: '', area: '' });
        setShowAddModal(true);
    };

    const openEditModal = (field) => {
        setEditingField(field);
        setForm({ name: field.name, crop_type: field.crop_type, area: field.area });
        setShowEditModal(true);
    };

    const closeModal = () => {
        setShowAddModal(false);
        setShowEditModal(false);
        setEditingField(null);
    };

    if (loading) return <div className="text-center p-10 text-xl">Завантаження...</div>;

    return (
        <div className="container mx-auto p-6">
            <button
                onClick={() => navigate('/settings')}
                className="bg-purple-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-purple-700 shadow-lg ml-auto"
            >
                Налаштування
            </button>
            <button
                onClick={() => navigate('/calendar')}
                className="bg-teal-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-teal-700 shadow-lg ml-4"
            >
                Календар робіт
            </button>
            <button
                onClick={() => navigate('/support')}
                className="bg-rose-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-rose-700 shadow-lg ml-4"
            >
                Допомога
            </button>

            <h1 className="text-4xl font-bold text-center mb-8 text-blue-800">
                Система управління дроном XAG P100
            </h1>

            <div className="text-center mb-10">
                <button
                    onClick={openAddModal}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-10 py-5 rounded-2xl text-xl font-bold shadow-xl hover:shadow-2xl transition transform hover:-translate-y-1"
                >
                    + Додати нове поле
                </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {fields.map(field => (
                    <div key={field.id}
                         className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 hover:border-blue-300 transition-all hover:-translate-y-2">
                        <div className="p-8">
                            <h2 className="text-2xl font-bold text-gray-800 mb-3">{field.name}</h2>
                            <div className="space-y-2 text-gray-600 mb-6">
                                <p><strong>Культура:</strong> {field.crop_type}</p>
                                <p><strong>Площа:</strong> {field.area} га</p>
                            </div>

                            <div className="flex gap-2 mb-4">
                                <button
                                    onClick={() => navigate(`/create-mission/${field.id}`)}
                                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
                                >
                                    Створити місію
                                </button>
                                <button
                                    onClick={() => navigate('/reports')}
                                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700"
                                >
                                    Звіти
                                </button>
                            </div>

                            <div className="flex gap-2 pt-3 border-t">
                                <button
                                    onClick={() => openEditModal(field)}
                                    className="flex-1 bg-amber-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-amber-600"
                                >
                                    Редагувати
                                </button>
                                <button
                                    onClick={() => handleDelete(field.id)}
                                    className="flex-1 bg-red-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-600"
                                >
                                    Видалити
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="text-center mt-12">
                <button
                    onClick={() => navigate('/missions')}
                    className="bg-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-indigo-700 shadow-lg ml-4"
                >
                    Історія місій
                </button>
                <button
                    onClick={() => navigate('/monitor')}
                    className="bg-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-indigo-700 shadow-lg ml-4"
                >
                    Моніторинг польоту
                </button>
                <button
                    onClick={() => navigate('/spray-calculator')}
                    className="bg-orange-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-orange-700 shadow-lg ml-4"
                >
                    Розрахунок препарату
                </button>
                <button
                    onClick={() => navigate('/weather')}
                    className="bg-cyan-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-cyan-700 shadow-lg ml-4"
                >
                    Погода та рекомендації
                </button>
            </div>

            {/* Модальне вікно (одне на додавання і редагування) */}
            {(showAddModal || showEditModal) && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-lg w-full">
                        <h2 className="text-3xl font-bold mb-8 text-center">
                            {editingField ? 'Редагувати поле' : 'Додати нове поле'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <input
                                type="text"
                                placeholder="Назва поля"
                                value={form.name}
                                onChange={e => setForm({...form, name: e.target.value})}
                                className="w-full border-2 border-gray-300 rounded-xl px-5 py-4 text-lg focus:border-blue-500 focus:outline-none"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Культура"
                                value={form.crop_type}
                                onChange={e => setForm({...form, crop_type: e.target.value})}
                                className="w-full border-2 border-gray-300 rounded-xl px-5 py-4 text-lg focus:border-blue-500 focus:outline-none"
                                required
                            />
                            <input
                                type="number"
                                step="0.1"
                                placeholder="Площа, га"
                                value={form.area}
                                onChange={e => setForm({...form, area: e.target.value})}
                                className="w-full border-2 border-gray-300 rounded-xl px-5 py-4 text-lg focus:border-blue-500 focus:outline-none"
                                required
                            />

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-bold text-xl hover:from-blue-700 hover:to-blue-800"
                                >
                                    {editingField ? 'Зберегти зміни' : 'Додати поле'}
                                </button>
                                <button
                                    type="button"
                                    onClick={closeModal}
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

export default MainScreen;