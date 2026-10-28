/**
 * HudControls Component
 * Manages the floating control bar (Play, Rewind, Speed, Font Size, Mirror, Shortcuts Hint).
 */
(function() {
  window.Teleprompter = window.Teleprompter || {};
  window.Teleprompter.components = window.Teleprompter.components || {};

  window.Teleprompter.components.HudControls = {
    init(state, callbacks) {
      this.state = state;
      this.callbacks = callbacks || {};

      this.el = document.getElementById('hud');
      this.hudHint = document.getElementById('hud-hint');

      this.btnPlayPause = document.getElementById('btn-play-pause');
      this.playIcon = document.getElementById('play-icon');
      this.pauseIcon = document.getElementById('pause-icon');
      this.playText = document.getElementById('play-text');

      this.btnRewind = document.getElementById('btn-rewind');
      this.btnMirror = document.getElementById('btn-mirror');

      this.speedSlider = document.getElementById('speed-slider');
      this.speedVal = document.getElementById('speed-val');
      this.fontsizeSlider = document.getElementById('fontsize-slider');
      this.fontsizeVal = document.getElementById('fontsize-val');

      this.idleTimer = null;

      this.bindEvents();
      this.setupIdleFade();
    },

    bindEvents() {
      if (this.btnPlayPause) {
        this.btnPlayPause.addEventListener('click', () => {
          if (this.callbacks.onTogglePlay) this.callbacks.onTogglePlay();
        });
      }

      if (this.btnRewind) {
        this.btnRewind.addEventListener('click', () => {
          if (this.callbacks.onRewind) this.callbacks.onRewind();
        });
      }

      if (this.btnMirror) {
        this.btnMirror.addEventListener('click', () => {
          if (this.callbacks.onToggleMirror) this.callbacks.onToggleMirror();
        });
      }

      if (this.speedSlider) {
        this.speedSlider.addEventListener('input', (e) => {
          const val = parseFloat(e.target.value);
          if (this.callbacks.onSpeedChange) this.callbacks.onSpeedChange(val);
        });
      }

      if (this.fontsizeSlider) {
        this.fontsizeSlider.addEventListener('input', (e) => {
          const val = parseInt(e.target.value, 10);
          if (this.callbacks.onFontSizeChange) this.callbacks.onFontSizeChange(val);
        });
      }
    },

    setupIdleFade() {
      window.addEventListener('mousemove', () => {
        if (!this.state.hudVisible) return;
        this.showActive();
        clearTimeout(this.idleTimer);
        if (this.state.isPlaying) {
          this.idleTimer = setTimeout(() => {
            this.fadeIdle();
          }, 2500);
        }
      });
    },

    showActive() {
      if (this.el) this.el.style.opacity = '1';
      const topBar = document.getElementById('top-bar');
      if (topBar) topBar.style.opacity = '1';
      if (this.hudHint) this.hudHint.style.opacity = '1';
    },

    fadeIdle() {
      if (this.el) this.el.style.opacity = '0';
      const topBar = document.getElementById('top-bar');
      if (topBar) topBar.style.opacity = '0';
      if (this.hudHint) this.hudHint.style.opacity = '0';
    },

    setPlaying(isPlaying) {
      if (!this.btnPlayPause) return;
      if (isPlaying) {
        this.playIcon.style.display = 'none';
        this.pauseIcon.style.display = 'inline';
        this.playText.textContent = 'Pause';
        this.btnPlayPause.classList.add('btn-primary');
      } else {
        this.playIcon.style.display = 'inline';
        this.pauseIcon.style.display = 'none';
        this.playText.textContent = 'Play';
      }
    },

    updateSpeed(speed) {
      if (this.speedSlider) this.speedSlider.value = speed;
      if (this.speedVal) this.speedVal.textContent = speed + 'x';
    },

    updateFontSize(size) {
      if (this.fontsizeSlider) this.fontsizeSlider.value = size;
      if (this.fontsizeVal) this.fontsizeVal.textContent = size + 'px';
    },

    updateMirror(isMirrored) {
      if (!this.btnMirror) return;
      this.btnMirror.style.borderColor = isMirrored ? 'var(--accent)' : 'var(--btn-border)';
      this.btnMirror.style.background = isMirrored ? 'rgba(37, 99, 235, 0.25)' : 'var(--btn-bg)';
    },

    toggleVisibility(visible) {
      if (this.el) this.el.classList.toggle('hidden', !visible);
      if (this.hudHint) this.hudHint.classList.toggle('hidden', !visible);
    }
  };
})();
