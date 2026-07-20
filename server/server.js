const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = 'super_secret_jwt_key_123!'; // In prod, use environment variable

// 1. Auth Endpoint
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });
        
        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });
        
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
        res.json({ token, user: { username: user.username, role: user.role } });
    });
});

// Middleware to verify JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer TOKEN"
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// 2. Requirements Endpoints
app.get('/api/requirements', authenticateToken, (req, res) => {
    db.all("SELECT * FROM requirements", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/requirements', authenticateToken, (req, res) => {
    const reqData = req.body;
    const stmt = db.prepare("INSERT INTO requirements (id, title, client, country, location, dateOpened, stage, age, priority, hiringManager, recruiter) VALUES (?,?,?,?,?,?,?,?,?,?,?)");
    stmt.run(reqData.id, reqData.title, reqData.client, reqData.country, reqData.location, reqData.dateOpened, reqData.stage, reqData.age, reqData.priority, reqData.hiringManager, reqData.recruiter, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
    stmt.finalize();
});

// 3. Candidates Endpoints
app.get('/api/candidates', authenticateToken, (req, res) => {
    db.all("SELECT * FROM candidates", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        // Parse history back into JSON arrays before sending to client
        const parsedRows = rows.map(r => ({...r, history: r.history ? JSON.parse(r.history) : []}));
        res.json(parsedRows);
    });
});

app.post('/api/candidates', authenticateToken, (req, res) => {
    const can = req.body;
    const historyStr = can.history ? JSON.stringify(can.history) : '[]';
    
    // Simple upsert logic for sqlite: we'll check if exists first for prototype
    db.get("SELECT id FROM candidates WHERE id = ?", [can.id], (err, row) => {
        if (row) {
            // Update
            const stmt = db.prepare("UPDATE candidates SET name=?, email=?, phone=?, reqId=?, source=?, stage=?, country=?, lastUpdated=?, history=? WHERE id=?");
            stmt.run(can.name, can.email, can.phone, can.reqId, can.source, can.stage, can.country, can.lastUpdated, historyStr, can.id, (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true, updated: true });
            });
            stmt.finalize();
        } else {
            // Insert
            const stmt = db.prepare("INSERT INTO candidates (id, name, email, phone, reqId, source, stage, country, lastUpdated, history) VALUES (?,?,?,?,?,?,?,?,?,?)");
            stmt.run(can.id, can.name, can.email, can.phone, can.reqId, can.source, can.stage, can.country, can.lastUpdated, historyStr, (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true, inserted: true });
            });
            stmt.finalize();
        }
    });
});

// 4. Worklogs Endpoints
app.get('/api/worklogs', authenticateToken, (req, res) => {
    db.all("SELECT * FROM worklogs", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/worklogs', authenticateToken, (req, res) => {
    const log = req.body;
    const stmt = db.prepare("INSERT INTO worklogs (id, date, recruiter, reqId, activity, sourced, screened, submitted) VALUES (?,?,?,?,?,?,?,?)");
    stmt.run(log.id, log.date, log.recruiter, log.reqId, log.activity, log.sourced, log.screened, log.submitted, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
    stmt.finalize();
});


// 5. Bulk Sync Endpoint (For Prototyping Transition)
app.get('/api/sync', authenticateToken, (req, res) => {
    db.all("SELECT * FROM requirements", [], (err, reqs) => {
        db.all("SELECT * FROM candidates", [], (err, cands) => {
            const parsedCands = cands.map(r => ({...r, history: r.history ? JSON.parse(r.history) : []}));
            db.all("SELECT * FROM worklogs", [], (err, logs) => {
                res.json({ requisitions: reqs, candidates: parsedCands, worklogs: logs });
            });
        });
    });
});

app.post('/api/sync', authenticateToken, (req, res) => {
    res.json({ success: true, message: 'Sync complete' });
});

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend Server running on http://localhost:${PORT}`);
});
