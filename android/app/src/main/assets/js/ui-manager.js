/* ===================================
   UI MANAGER - NAVIGATION SYSTEM
   ================================== */

class UIManager {
    /**
     * Show a specific screen and hide all others
     * @param {string} screenId - ID of the screen to show
     */
    static showScreen(screenId) {
        // Hide all screens with class 'screen'
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });

        // Show the requested screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.remove('hidden');
            console.log(`📱 Screen changed to: ${screenId}`);
        } else {
            console.error(`❌ Screen not found: ${screenId}`);
        }
    }

    /**
     * Navigate to Start Menu
     */
    static showStartMenu() {
        this.showScreen('startMenu');
        // Hide game elements
        document.getElementById('gameHUD')?.classList.remove('active');
        document.querySelector('.mobile-controls')?.classList.remove('active');
    }

    /**
     * Navigate to Level Selector
     */
    static showLevelSelector() {
        this.showScreen('levelSelector');
    }

    /**
     * Navigate to Stats Page
     */
    static showStats() {
        this.showScreen('statsPage');
    }

    /**
     * Navigate to Settings
     */
    static showSettings() {
        this.showScreen('settingsMenu');
    }

    /**
     * Show modal overlay
     * @param {string} modalId - ID of the modal to show
     */
    static showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            console.log(`📋 Modal opened: ${modalId}`);
        } else {
            console.error(`❌ Modal not found: ${modalId}`);
        }
    }

    /**
     * Hide modal overlay
     * @param {string} modalId - ID of the modal to hide
     */
    static hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            console.log(`📋 Modal closed: ${modalId}`);
        }
    }

    /**
     * Hide all modals
     */
    static hideAllModals() {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.style.display = 'none';
        });
    }

    /**
     * Toggle element visibility
     * @param {string} elementId - ID of the element
     * @param {boolean} show - True to show, false to hide
     */
    static toggleElement(elementId, show) {
        const element = document.getElementById(elementId);
        if (element) {
            if (show) {
                element.classList.remove('hidden');
                element.classList.add('active');
            } else {
                element.classList.add('hidden');
                element.classList.remove('active');
            }
        }
    }
}

// Make UIManager globally accessible
window.UIManager = UIManager;
