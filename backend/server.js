// backend/server.js
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Отримати всі поля
app.get('/api/fields', (req, res) => {
    db.all('SELECT * FROM fields', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Зберегти місію — ЦЕ ТОЙ МАРШРУТ, ЯКИЙ У ТЕБЕ НЕ ПРАЦЮЄ!
app.post('/api/missions', (req, res) => {
    const { field_id, altitude, speed, task, polygon } = req.body;

    console.log("Отримано місію:", req.body); // Це має з'явитися в консолі бекенду!

    const sql = `INSERT INTO missions (field_id, altitude, speed, task, polygon) 
               VALUES (?, ?, ?, ?, ?)`;

    db.run(sql, [field_id, altitude, speed, task, polygon], function(err) {
        if (err) {
            console.error("Помилка вставки в БД:", err.message);
            return res.status(500).json({ error: err.message });
        }
        console.log("Місія успішно збережена з ID:", this.lastID);
        res.json({ id: this.lastID });
    });
});

// Отримати останню місію
app.get('/api/missions/last', (req, res) => {
    db.get('SELECT id, polygon FROM missions ORDER BY id DESC LIMIT 1', (err, row) => {
        if (err || !row) return res.json({ id: null, polygon: null });
        res.json(row);
    });
});

// Зберегти спостереження (фото)
app.post('/api/observations', (req, res) => {
    const { mission_id, lat, lng, message } = req.body;
    db.run(
        'INSERT INTO observations (mission_id, lat, lng, message) VALUES (?, ?, ?, ?)',
        [mission_id, lat, lng, message],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

// Отримати всі спостереження
app.get('/api/observations', (req, res) => {
    db.all('SELECT * FROM observations ORDER BY id DESC', (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/fields', (req, res) => {
    const { name, crop_type, area } = req.body;
    console.log("Додаємо поле:", req.body);

    const sql = `INSERT INTO fields (name, crop_type, area) VALUES (?, ?, ?)`;
    db.run(sql, [name, crop_type, area], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json({ id: this.lastID });
    });
});

// Оновити поле
app.put('/api/fields/:id', (req, res) => {
    const { name, crop_type, area } = req.body;
    const { id } = req.params;

    const sql = `UPDATE fields SET name = ?, crop_type = ?, area = ? WHERE id = ?`;
    db.run(sql, [name, crop_type, area, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        if (this.changes === 0) return res.status(404).json({ error: "Поле не знайдено" });
        res.json({ success: true });
    });
});

// Видалити поле (і всі пов'язані місії + спостереження!)
app.delete('/api/fields/:id', (req, res) => {
    const { id } = req.params;

    db.serialize(() => {
        db.run('DELETE FROM observations WHERE mission_id IN (SELECT id FROM missions WHERE field_id = ?)', [id]);
        db.run('DELETE FROM missions WHERE field_id = ?', [id]);
        db.run('DELETE FROM fields WHERE id = ?', [id], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (this.changes === 0) return res.status(404).json({ error: "Поле не знайдено" });
            res.json({ success: true });
        });
    });
});

app.get('/api/missions/all', (req, res) => {
    const sql = `
    SELECT m.*, f.name as field_name 
    FROM missions m 
    LEFT JOIN fields f ON m.field_id = f.id 
    ORDER BY m.id DESC
  `;
    db.all(sql, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Спостереження для конкретної місії
app.get('/api/observations/mission/:missionId', (req, res) => {
    const { missionId } = req.params;
    db.all('SELECT * FROM observations WHERE mission_id = ? ORDER BY id', [missionId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/api/missions/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM missions WHERE id = ?', [id], (err, row) => {
        if (err || !row) return res.status(404).json({ error: 'Not found' });
        res.json(row);
    });
});

// Поле за ID
app.get('/api/fields/:id', (req, res) => {
    const { id } = req.params;
    db.get('SELECT * FROM fields WHERE id = ?', [id], (err, row) => {
        if (err || !row) return res.status(404).json({ error: 'Not found' });
        res.json(row);
    });
});

app.listen(PORT, () => {
    console.log(`Сервер запущений: http://localhost:${PORT}`);
});