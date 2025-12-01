const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const db = new sqlite3.Database(path.join(__dirname, "drone.db"));

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS fields (
                                              id INTEGER PRIMARY KEY, name TEXT, crop_type TEXT, area REAL
          )`);

  db.run(`CREATE TABLE IF NOT EXISTS missions (
                                                id INTEGER PRIMARY KEY,
                                                field_id INTEGER,
                                                altitude REAL,
                                                speed REAL,
                                                task TEXT,
                                                polygon TEXT
          )`);

  db.run(`CREATE TABLE IF NOT EXISTS observations (
                                                    id INTEGER PRIMARY KEY,
                                                    mission_id INTEGER,
                                                    lat REAL,
                                                    lng REAL,
                                                    message TEXT,
                                                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
          )`);

  db.run(`INSERT OR IGNORE INTO fields VALUES 
    (1, 'Пшениця-2025', 'Пшениця', 50), 
    (2, 'Кукурудза-2025', 'Кукурудза', 30)`
  );
});

module.exports = db;