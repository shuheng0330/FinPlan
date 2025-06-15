window.toast = {
    warning: function (message) {
        showToast(message, 'warning', '⚠️');
    },
    success: function (message) {
        showToast(message, 'success', '✅');
    },
    error: function (message) {
        showToast(message, 'error', '❌');
    },
    info: function (message) {
        showToast(message, 'info', 'ℹ️');
    }
};

function showToast(message, type, icon) {
    const container = document.querySelector('.toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type} show`;

    toast.innerHTML = `
                <div class="toast-icon">${icon}</div>
                <div class="toast-body">${message}</div>
                <button class="btn-close" aria-label="Close">&times;</button>
            `;

    container.appendChild(toast);

    // Close manually
    toast.querySelector('.btn-close').addEventListener('click', () => {
        toast.classList.remove('show');
        toast.classList.add('hide'); // Add 'hide' class to trigger fadeOut immediately
        setTimeout(() => toast.remove(), 300); // Match fadeOut duration
    });

    setTimeout(() => {
        if (toast.parentNode) {
            toast.classList.remove('show');
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 300);
        }
    }, 3000);
}

