const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'recruitment.db');
const db = new sqlite3.Database(dbPath);

function initDb() {
    db.serialize(() => {
        // Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            role TEXT
        )`);

        // Requirements Table
        db.run(`CREATE TABLE IF NOT EXISTS requirements (
            id TEXT PRIMARY KEY,
            title TEXT,
            client TEXT,
            country TEXT,
            location TEXT,
            dateOpened TEXT,
            stage TEXT,
            age INTEGER,
            priority TEXT,
            hiringManager TEXT,
            recruiter TEXT
        )`);

        // Candidates Table
        db.run(`CREATE TABLE IF NOT EXISTS candidates (
            id TEXT PRIMARY KEY,
            name TEXT,
            email TEXT,
            phone TEXT,
            reqId TEXT,
            source TEXT,
            stage TEXT,
            country TEXT,
            lastUpdated TEXT,
            history TEXT
        )`);

        // Worklogs Table
        db.run(`CREATE TABLE IF NOT EXISTS worklogs (
            id TEXT PRIMARY KEY,
            date TEXT,
            recruiter TEXT,
            reqId TEXT,
            activity TEXT,
            sourced INTEGER,
            screened INTEGER,
            submitted INTEGER
        )`);

        // Seed Admin User if not exists
        db.get("SELECT * FROM users WHERE username = ?", ['admin'], (err, row) => {
            if (!row) {
                const hash = bcrypt.hashSync('admin123', 8);
                db.run("INSERT INTO users (username, password, role) VALUES (?, ?, ?)", ['admin', hash, 'Admin']);
                console.log("Seeded default admin user.");
            }
        });
        
        // Seed default Mock Data if requirements table is empty
        db.get("SELECT COUNT(*) as count FROM requirements", [], (err, row) => {
            if (row && row.count === 0) {
                console.log("Seeding initial mock data...");
                const stmtReq = db.prepare("INSERT INTO requirements (id, title, client, country, location, dateOpened, stage, age, priority, hiringManager, recruiter) VALUES (?,?,?,?,?,?,?,?,?,?,?)");
                stmtReq.run('REQ-101', 'Senior Full Stack Engineer', 'TechCorp', 'US', 'San Francisco, CA (Remote)', '2023-10-01', 'Active', 14, 'High', 'John Doe', 'Recruiter A');
                stmtReq.run('REQ-102', 'Frontend Developer (React)', 'Innovate LLC', 'IN', 'Bangalore (Hybrid)', '2023-10-10', 'Active', 5, 'Medium', 'Sarah Smith', 'Recruiter B');
                stmtReq.finalize();

                const stmtCan = db.prepare("INSERT INTO candidates (id, name, email, phone, reqId, source, stage, country, lastUpdated, history) VALUES (?,?,?,?,?,?,?,?,?,?)");
                const h1 = JSON.stringify([{date: '2023-10-15', stage: 'Sourced', comment: 'Added from LinkedIn'}]);
                const h2 = JSON.stringify([{date: '2023-10-14', stage: 'Screening', comment: 'Screening scheduled'}]);
                stmtCan.run('CAN-901', 'Alice Smith', 'alice@example.com', '555-0101', 'REQ-101', 'LinkedIn', 'Sourced', 'US', '2023-10-15', h1);
                stmtCan.run('CAN-902', 'Bob Johnson', 'bob@example.com', '555-0102', 'REQ-101', 'Referral', 'Screening', 'US', '2023-10-14', h2);
                stmtCan.finalize();
                
                const stmtLog = db.prepare("INSERT INTO worklogs (id, date, recruiter, reqId, activity, sourced, screened, submitted) VALUES (?,?,?,?,?,?,?,?)");
                stmtLog.run('LOG-001', '2023-10-15', 'Recruiter A', 'REQ-101', 'Sourced 5 candidates', 5, 2, 1);
                stmtLog.finalize();
            }
        });
    });
}

initDb();

module.exports = db;
