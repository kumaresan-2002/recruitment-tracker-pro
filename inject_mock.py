import re

def inject():
    mock_code = """
// --- Mock Data Initialization (if missing) ---
const MOCK_REQS = [
    {id: 'REQ-101', title: 'Senior Full Stack Engineer', client: 'TechCorp', country: 'US', location: 'San Francisco, CA (Remote)', dateOpened: '2023-10-01', stage: 'Active', age: 14, priority: 'High', hiringManager: 'John Doe', recruiter: 'Recruiter A'},
    {id: 'REQ-102', title: 'Frontend Developer (React)', client: 'Innovate LLC', country: 'IN', location: 'Bangalore (Hybrid)', dateOpened: '2023-10-10', stage: 'Active', age: 5, priority: 'Medium', hiringManager: 'Sarah Smith', recruiter: 'Recruiter B'},
    {id: 'REQ-103', title: 'Data Scientist', client: 'DataWorks', country: 'US', location: 'New York, NY', dateOpened: '2023-09-15', stage: 'On Hold', age: 30, priority: 'Low', hiringManager: 'Mike Johnson', recruiter: 'Recruiter C'},
    {id: 'REQ-104', title: 'DevOps Engineer', client: 'CloudSys', country: 'US', location: 'Austin, TX', dateOpened: '2023-10-12', stage: 'Active', age: 3, priority: 'High', hiringManager: 'Emily Davis', recruiter: 'Recruiter A'}
];

const MOCK_CANDS = [
    {id: 'CAN-901', name: 'Alice Smith', email: 'alice@example.com', phone: '555-0101', reqId: 'REQ-101', source: 'LinkedIn', stage: 'Sourced', country: 'US', lastUpdated: '2023-10-15', history: [{date: '2023-10-15', stage: 'Sourced', comment: 'Added from LinkedIn'}]},
    {id: 'CAN-902', name: 'Bob Johnson', email: 'bob@example.com', phone: '555-0102', reqId: 'REQ-101', source: 'Referral', stage: 'Screening', country: 'US', lastUpdated: '2023-10-14', history: [{date: '2023-10-14', stage: 'Screening', comment: 'Screening scheduled'}]},
    {id: 'CAN-903', name: 'Charlie Brown', email: 'charlie@example.com', phone: '555-0103', reqId: 'REQ-102', source: 'Job Board', stage: 'Technical Interview', country: 'IN', lastUpdated: '2023-10-13', history: [{date: '2023-10-13', stage: 'Technical Interview', comment: 'Passed screening'}]},
    {id: 'CAN-904', name: 'Diana Prince', email: 'diana@example.com', phone: '555-0104', reqId: 'REQ-101', source: 'Direct', stage: 'Offer Released', country: 'US', lastUpdated: '2023-10-12', history: [{date: '2023-10-12', stage: 'Offer Released', comment: 'Offer sent to candidate'}]},
    {id: 'CAN-905', name: 'Evan Wright', email: 'evan@example.com', phone: '555-0105', reqId: 'REQ-102', source: 'Agency', stage: 'Joined', country: 'IN', lastUpdated: '2023-10-10', history: [{date: '2023-10-10', stage: 'Joined', comment: 'Candidate joined successfully'}]}
];

const MOCK_WORKLOGS = [
    {id: 'LOG-001', date: '2023-10-15', recruiter: 'Recruiter A', reqId: 'REQ-101', activity: 'Sourced 5 candidates', sourced: 5, screened: 2, submitted: 1},
    {id: 'LOG-002', date: '2023-10-15', recruiter: 'Recruiter B', reqId: 'REQ-102', activity: 'Conducted screening calls', sourced: 2, screened: 4, submitted: 2}
];

if (!localStorage.getItem(STORE_KEYS.reqs) || JSON.parse(localStorage.getItem(STORE_KEYS.reqs)).length === 0) {
    localStorage.setItem(STORE_KEYS.reqs, JSON.stringify(MOCK_REQS));
}
if (!localStorage.getItem(STORE_KEYS.candidates) || JSON.parse(localStorage.getItem(STORE_KEYS.candidates)).length === 0) {
    localStorage.setItem(STORE_KEYS.candidates, JSON.stringify(MOCK_CANDS));
}
if (!localStorage.getItem(STORE_KEYS.worklogs) || JSON.parse(localStorage.getItem(STORE_KEYS.worklogs)).length === 0) {
    localStorage.setItem(STORE_KEYS.worklogs, JSON.stringify(MOCK_WORKLOGS));
}
"""

    with open('src/app.js', 'r', encoding='utf-8') as f:
        content = f.read()
        
    if "MOCK_REQS" not in content:
        # Inject right after STORE_KEYS
        pattern = r"(const STORE_KEYS = \{.*?\};\n)"
        match = re.search(pattern, content, re.DOTALL)
        if match:
            new_content = content[:match.end()] + "\n" + mock_code + "\n" + content[match.end():]
            with open('src/app.js', 'w', encoding='utf-8') as f:
                f.write(new_content)
            print("Successfully injected mock data.")
        else:
            print("Could not find STORE_KEYS in app.js")
    else:
        print("Mock data already injected.")

if __name__ == "__main__":
    inject()
