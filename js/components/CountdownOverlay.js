/**
 * CountdownOverlay Component
 * Manages the animated pre-scroll countdown and immediate tap-to-skip.
 */
(function() {
  window.Teleprompter = window.Teleprompter || {};
  window.Teleprompter.components = window.Teleprompter.components || {};

  window.Teleprompter.components.CountdownOverlay = {
    init(state, callbacks) {
      this.state = state;
      this.callbacks = callbacks || {};
      this.el = document.getElementById('countdown-overlay');

      if (this.el) {
        this.el.addEventListener('click', () => {
          if (this.state.isCountingDown) {
            this.cancel();
            if (this.callbacks.onSkip) this.callbacks.onSkip();
          }
        });
      }
    },

    start(callback) {
      this.cancel();
      this.state.isCountingDown = true;
      let count = this.state.countdownDuration || 3;
      this.el.textContent = count;
      this.el.classList.add('active');

      this.state.countdownTimerId = setInterval(() => {
        count--;
        if (count > 0) {
          this.el.textContent = count;
        } else {
          this.cancel();
          if (callback) callback();
        }
      }, 950);
    },

    cancel() {
      if (this.state.countdownTimerId) {
        clearInterval(this.state.countdownTimerId);
        this.state.countdownTimerId = null;
      }
      if (this.el) {
        this.el.classList.remove('active');
      }
      this.state.isCountingDown = false;
    }
  };
})();
