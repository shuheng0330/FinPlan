// Bootstrap Toast System
class BootstrapToastManager {
  constructor() {
    this.container = null
    this.init()
  }

  init() {
    // Find existing container or create one
    this.container = document.querySelector(".toast-container")

    if (!this.container) {
      this.container = document.createElement("div")
      this.container.className = "toast-container position-fixed top-0 end-0 p-3"
      this.container.style.zIndex = "1055"
      document.body.appendChild(this.container)
    }
  }

  getIcon(type) {
    const icons = {
      success: "bi-check-circle-fill",
      error: "bi-x-circle-fill",
      warning: "bi-exclamation-triangle-fill",
      info: "bi-info-circle-fill",
    }
    return icons[type] || icons.info
  }

  getTypeClass(type) {
    const classes = {
      success: "toast-success",
      error: "toast-error",
      warning: "toast-warning",
      info: "toast-info",
    }
    return classes[type] || classes.info
  }

  show(type, title, message = "", duration = 5000) {
    const toastId = "toast-" + Math.random().toString(36).substr(2, 9)
    const icon = this.getIcon(type)
    const typeClass = this.getTypeClass(type)

    const toastHTML = `
      <div id="${toastId}" class="toast ${typeClass}" role="alert" aria-live="assertive" aria-atomic="true" data-bs-delay="${duration}">
        <div class="toast-header">
          <i class="bi ${icon} toast-icon"></i>
          <strong class="me-auto">${title}</strong>
          <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        ${message ? `<div class="toast-body">${message}</div>` : ""}
      </div>
    `

    // Add toast to container
    this.container.insertAdjacentHTML("beforeend", toastHTML)

    // Initialize and show the toast
    const toastElement = document.getElementById(toastId)
    const bsToast = new bootstrap.Toast(toastElement)

    // Remove toast from DOM after it's hidden
    toastElement.addEventListener("hidden.bs.toast", () => {
      toastElement.remove()
    })

    bsToast.show()
    return toastId
  }

  success(title, message, duration) {
    return this.show("success", title, message, duration)
  }

  error(title, message, duration) {
    return this.show("error", title, message, duration)
  }

  warning(title, message, duration) {
    return this.show("warning", title, message, duration)
  }

  info(title, message, duration) {
    return this.show("info", title, message, duration)
  }
}

// Initialize the toast manager
const toastManager = new BootstrapToastManager()

// Global functions for easy use
function showToast(type, title, message, duration) {
  return toastManager.show(type, title, message, duration)
}

// Convenience functions
window.toast = {
  success: (title, message, duration) => toastManager.success(title, message, duration),
  error: (title, message, duration) => toastManager.error(title, message, duration),
  warning: (title, message, duration) => toastManager.warning(title, message, duration),
  info: (title, message, duration) => toastManager.info(title, message, duration),
}
