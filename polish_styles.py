def append_styles():
    css_additions = """
/* --- Phase 72: UI/UX Polishing --- */

/* Custom Scrollbars */
::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}
::-webkit-scrollbar-track {
    background: transparent;
}
::-webkit-scrollbar-thumb {
    background: rgba(100, 116, 139, 0.4);
    border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
    background: rgba(100, 116, 139, 0.6);
}

/* Enhanced Form Inputs */
.form-group input:focus, .form-group select:focus, .form-group textarea:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
}

/* Enhanced Buttons */
.btn {
    position: relative;
    overflow: hidden;
}
.btn::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 150%;
    height: 150%;
    background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 60%);
    transform: translate(-50%, -50%) scale(0);
    opacity: 0;
    transition: transform 0.4s, opacity 0.4s;
}
.btn:active::after {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
    transition: 0s;
}

/* Gradients for Action Buttons */
.btn-primary {
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
}
.btn-success {
    background: linear-gradient(135deg, var(--success), hsl(150, 84%, 27%));
}

/* Toast Alerts Stacking & Animations */
.alert {
    position: fixed;
    right: 30px;
    padding: 16px 20px;
    border-radius: 8px;
    background: var(--white);
    box-shadow: var(--shadow-lg);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 12px;
    font-weight: 500;
    border-left: 4px solid var(--primary);
    animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    transition: top 0.4s ease, opacity 0.4s ease;
}
.alert.fade-out {
    animation: fadeOutAlert 0.4s ease forwards;
}
@keyframes slideInRight {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
}
@keyframes fadeOutAlert {
    to { transform: translateX(100%); opacity: 0; }
}

/* Empty States */
.empty-state {
    text-align: center;
    padding: 60px 20px;
    color: var(--text-light);
}
.empty-state-icon {
    font-size: 3rem;
    margin-bottom: 15px;
    opacity: 0.5;
}
.empty-state h3 {
    color: var(--text-dark);
    margin-bottom: 8px;
    font-weight: 600;
}
"""
    with open('src/style.css', 'a', encoding='utf-8') as f:
        f.write(css_additions)

if __name__ == "__main__":
    append_styles()
