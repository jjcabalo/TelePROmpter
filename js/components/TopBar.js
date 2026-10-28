/**
 * TopBar Component
 * Manages the top floating header: live presentation stats and quick action triggers.
 */
(function() {
  window.Teleprompter = window.Teleprompter || {};
  window.Teleprompter.components = window.Teleprompter.components || {};

  window.Teleprompter.components.TopBar = {
    init(state, callbacks) {
      this.state = state;
      this.callbacks = callbacks || {};

      this.el = document.getElementById('top-bar');
      this.elapsedTimeEl = document.getElementById('elapsed-time');
      this.remainingTimeEl = document.getElementById('remaining-time');
      this.wordCountEl = document.getElementById('word-count');

      this.btnThemeToggle = document.getElementById('btn-theme-toggle');
      this.themeSunIcon = document.getElementById('theme-sun-icon');
      this.themeMoonIcon = document.getElementById('theme-moon-icon');

      this.btnEdit = document.getElementById('btn-edit');
      this.btnSettings = document.getElementById('btn-settings');
      this.btnFullscreen = document.getElementById('btn-fullscreen');

      this.bindEvents();
    },

    bindEvents() {
      if (this.btnThemeToggle) {
        this.btnThemeToggle.addEventListener('click', () => {
          if (this.callbacks.onToggleTheme) this.callbacks.onToggleTheme();
        });
      }

      if (this.btnEdit) {
        this.btnEdit.addEventListener('click', () => {
          if (this.callbacks.onOpenEditor) this.callbacks.onOpenEditor();
        });
      }

      if (this.btnSettings) {
        this.btnSettings.addEventListener('click', () => {
          if (this.callbacks.onOpenSettings) this.callbacks.onOpenSettings();
        });
      }

      if (this.btnFullscreen) {
        this.btnFullscreen.addEventListener('click', () => {
          if (this.callbacks.onToggleFullscreen) this.callbacks.onToggleFullscreen();
        });
      }
    },

    updateTheme(theme) {
      if (!this.themeSunIcon || !this.themeMoonIcon) return;
      if (theme === 'light') {
        this.themeSunIcon.style.display = 'none';
        this.themeMoonIcon.style.display = 'inline';
      } else {
        this.themeSunIcon.style.display = 'inline';
        this.themeMoonIcon.style.display = 'none';
      }
    },

    updateStats(wordCount, remainingFormatted) {
      if (this.wordCountEl) this.wordCountEl.textContent = wordCount.toLocaleString();
      if (this.remainingTimeEl) this.remainingTimeEl.textContent = remainingFormatted;
    },

    updateElapsed(elapsedFormatted) {
      if (this.elapsedTimeEl) this.elapsedTimeEl.textContent = elapsedFormatted;
    },

    toggleVisibility(visible) {
      if (this.el) {
        this.el.classList.toggle('hidden', !visible);
      }
    }
  };
})();
