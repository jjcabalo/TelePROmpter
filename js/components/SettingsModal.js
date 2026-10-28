/**
 * SettingsModal Component
 * Manages teleprompter preferences (Theme, Text Color, Guide Line, Countdown Duration, Width, Line Height, Align, Flip).
 */
(function() {
  window.Teleprompter = window.Teleprompter || {};
  window.Teleprompter.components = window.Teleprompter.components || {};

  window.Teleprompter.components.SettingsModal = {
    init(state, callbacks) {
      this.state = state;
      this.callbacks = callbacks || {};

      this.el = document.getElementById('settings-modal');
      this.btnClose = document.getElementById('btn-close-settings');
      this.btnDone = document.getElementById('btn-done-settings');

      this.btnThemeDark = document.getElementById('btn-theme-dark');
      this.btnThemeLight = document.getElementById('btn-theme-light');
      this.colorSwatches = document.querySelectorAll('.color-swatch');

      this.toggleGuide = document.getElementById('toggle-guide');
      this.toggleCountdown = document.getElementById('toggle-countdown');
      this.countdownSlider = document.getElementById('countdown-slider');
      this.countdownVal = document.getElementById('countdown-val');
      this.countdownDurationRow = document.getElementById('countdown-duration-row');

      this.widthSlider = document.getElementById('width-slider');
      this.widthVal = document.getElementById('width-val');
      this.lineheightSlider = document.getElementById('lineheight-slider');
      this.lineheightVal = document.getElementById('lineheight-val');

      this.btnAlignLeft = document.getElementById('btn-align-left');
      this.btnAlignCenter = document.getElementById('btn-align-center');
      this.toggleFlipV = document.getElementById('toggle-flip-v');

      this.bindEvents();
    },

    bindEvents() {
      if (this.btnClose) this.btnClose.addEventListener('click', () => this.close());
      if (this.btnDone) this.btnDone.addEventListener('click', () => this.close());

      if (this.btnThemeDark) {
        this.btnThemeDark.addEventListener('click', () => {
          if (this.callbacks.onSetTheme) this.callbacks.onSetTheme('dark');
        });
      }

      if (this.btnThemeLight) {
        this.btnThemeLight.addEventListener('click', () => {
          if (this.callbacks.onSetTheme) this.callbacks.onSetTheme('light');
        });
      }

      if (this.colorSwatches) {
        this.colorSwatches.forEach(swatch => {
          swatch.addEventListener('click', () => {
            const color = swatch.getAttribute('data-color');
            if (this.callbacks.onColorChange) this.callbacks.onColorChange(color);
          });
        });
      }

      if (this.toggleGuide) {
        this.toggleGuide.addEventListener('change', (e) => {
          if (this.callbacks.onToggleGuide) this.callbacks.onToggleGuide(e.target.checked);
        });
      }

      if (this.toggleCountdown) {
        this.toggleCountdown.addEventListener('change', (e) => {
          if (this.callbacks.onToggleCountdown) this.callbacks.onToggleCountdown(e.target.checked);
        });
      }

      if (this.countdownSlider) {
        this.countdownSlider.addEventListener('input', (e) => {
          const val = parseInt(e.target.value, 10);
          if (this.callbacks.onCountdownDurationChange) this.callbacks.onCountdownDurationChange(val);
        });
      }

      if (this.widthSlider) {
        this.widthSlider.addEventListener('input', (e) => {
          const val = parseInt(e.target.value, 10);
          if (this.callbacks.onWidthChange) this.callbacks.onWidthChange(val);
        });
      }

      if (this.lineheightSlider) {
        this.lineheightSlider.addEventListener('input', (e) => {
          const val = parseFloat(e.target.value);
          if (this.callbacks.onLineHeightChange) this.callbacks.onLineHeightChange(val);
        });
      }

      if (this.btnAlignLeft) {
        this.btnAlignLeft.addEventListener('click', () => {
          if (this.callbacks.onAlignChange) this.callbacks.onAlignChange('left');
        });
      }

      if (this.btnAlignCenter) {
        this.btnAlignCenter.addEventListener('click', () => {
          if (this.callbacks.onAlignChange) this.callbacks.onAlignChange('center');
        });
      }

      if (this.toggleFlipV) {
        this.toggleFlipV.addEventListener('change', (e) => {
          if (this.callbacks.onToggleFlipV) this.callbacks.onToggleFlipV(e.target.checked);
        });
      }

      window.addEventListener('click', (e) => {
        if (e.target === this.el) {
          this.close();
        }
      });
    },

    syncUI(state) {
      if (this.widthSlider) {
        this.widthSlider.value = state.contentWidth;
        if (this.widthVal) this.widthVal.textContent = state.contentWidth + 'px';
      }

      if (this.lineheightSlider) {
        this.lineheightSlider.value = state.lineHeight;
        if (this.lineheightVal) this.lineheightVal.textContent = state.lineHeight;
      }

      if (this.toggleGuide) {
        this.toggleGuide.checked = state.showGuide;
      }

      if (this.toggleCountdown) {
        this.toggleCountdown.checked = state.countdownEnabled;
      }

      if (this.countdownSlider) {
        this.countdownSlider.value = state.countdownDuration;
        this.countdownSlider.disabled = !state.countdownEnabled;
        if (this.countdownVal) this.countdownVal.textContent = state.countdownDuration + 's';
      }

      if (this.countdownDurationRow) {
        this.countdownDurationRow.style.opacity = state.countdownEnabled ? '1' : '0.4';
      }

      if (this.toggleFlipV) {
        this.toggleFlipV.checked = state.mirrorV;
      }

      this.updateThemeButtons(state.theme);
      this.updateColorSwatches(state.textColor);
    },

    updateThemeButtons(theme) {
      if (!this.btnThemeDark || !this.btnThemeLight) return;
      if (theme === 'light') {
        this.btnThemeDark.classList.remove('btn-primary');
        this.btnThemeLight.classList.add('btn-primary');
      } else {
        this.btnThemeLight.classList.remove('btn-primary');
        this.btnThemeDark.classList.add('btn-primary');
      }
    },

    updateColorSwatches(color) {
      if (!this.colorSwatches) return;
      this.colorSwatches.forEach(swatch => {
        swatch.classList.toggle('active', swatch.getAttribute('data-color') === color);
      });
    },

    open() {
      this.syncUI(this.state);
      if (this.el) this.el.classList.add('active');
    },

    close() {
      if (this.el) this.el.classList.remove('active');
    },

    isOpen() {
      return this.el && this.el.classList.contains('active');
    }
  };
})();
