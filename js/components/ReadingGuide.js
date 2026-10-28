/**
 * ReadingGuide Component
 * Manages the eye-tracking guide line and pointer arrows overlay.
 */
(function() {
  window.Teleprompter = window.Teleprompter || {};
  window.Teleprompter.components = window.Teleprompter.components || {};

  window.Teleprompter.components.ReadingGuide = {
    init(state) {
      this.state = state;
      this.el = document.getElementById('guide-overlay');
      this.update();
    },

    update() {
      if (!this.el) return;
      this.el.classList.toggle('hidden', !this.state.showGuide);
    },

    toggle(show) {
      this.state.showGuide = show !== undefined ? show : !this.state.showGuide;
      this.update();
    }
  };
})();
