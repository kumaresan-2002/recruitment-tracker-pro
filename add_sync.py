import re

with open('server/server.js', 'r', encoding='utf-8') as f:
    server = f.read()

sync_endpoint = """
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

const PORT = 5000;"""

server = server.replace('const PORT = 5000;', sync_endpoint)

with open('server/server.js', 'w', encoding='utf-8') as f:
    f.write(server)
