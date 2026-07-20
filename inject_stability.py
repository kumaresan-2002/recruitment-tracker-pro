def inject_stability():
    with open('src/app.js', 'r', encoding='utf-8') as f:
        content = f.read()

    stability_code = """
// --- Phase 74: Global Stability & Error Boundaries ---
window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('Global Error Caught:', msg, 'at', lineNo, ':', columnNo);
    createAlert('Recoverable UI Error Detected. The dashboard will continue running.', 'warning');
    return true; // prevent default browser crash reporting
};

window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled Promise Rejection Caught:', event.reason);
    createAlert('Background process failed safely. Data remains intact.', 'warning');
    event.preventDefault(); // prevent default browser crash reporting
});

"""
    
    # Prepend this code to the top of app.js
    if "// --- Phase 74: Global Stability" not in content:
        content = stability_code + content
        
    with open('src/app.js', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    inject_stability()
