/**
 * EditorModal Component
 * Manages the script editor modal, text editing, sample script loading, and word counting.
 */
(function() {
  window.Teleprompter = window.Teleprompter || {};
  window.Teleprompter.components = window.Teleprompter.components || {};

  window.Teleprompter.components.EditorModal = {
    init(state, callbacks) {
      this.state = state;
      this.callbacks = callbacks || {};

      this.el = document.getElementById('editor-modal');
      this.textarea = document.getElementById('script-textarea');
      this.btnClose = document.getElementById('btn-close-editor');
      this.btnSave = document.getElementById('btn-save-script');
      this.btnSample = document.getElementById('btn-load-sample');
      this.wordCountEl = document.getElementById('modal-word-count');

      this.sampleScript = `Good morning and welcome to today's keynote presentation.

Today, we are thrilled to unveil our latest breakthroughs in creative technology. Over the past year, our team has worked tirelessly to build tools that empower communicators, creators, and leaders worldwide.

As we look at the changing landscape of modern broadcasting, three fundamental themes stand out:

First, clarity of delivery. When you speak directly to your audience, every pause and every expression matters.

Second, seamless tools that stay completely out of your way, giving you full control over your pacing.

And third, accessibility. High quality teleprompting should be available directly in your browser on any device, with no expensive hardware required.

Thank you so much for joining us today, and let us begin our journey into what comes next!`;

      this.bindEvents();
    },

    bindEvents() {
      if (this.btnClose) {
        this.btnClose.addEventListener('click', () => this.close());
      }

      if (this.btnSave) {
        this.btnSave.addEventListener('click', () => {
          const text = this.textarea ? this.textarea.value.trim() : '';
          this.close();
          if (this.callbacks.onSave) {
            this.callbacks.onSave(text || 'Please enter script in editor.');
          }
        });
      }

      if (this.btnSample) {
        this.btnSample.addEventListener('click', () => {
          if (this.textarea) {
            this.textarea.value = this.sampleScript;
            this.updateWordCount(this.sampleScript);
          }
        });
      }

      if (this.textarea) {
        this.textarea.addEventListener('input', () => {
          this.updateWordCount(this.textarea.value);
        });
      }

      window.addEventListener('click', (e) => {
        if (e.target === this.el) {
          this.close();
        }
      });
    },

    updateWordCount(text) {
      const words = (text || '').trim().split(/\s+/).filter(Boolean).length;
      if (this.wordCountEl) {
        this.wordCountEl.textContent = words.toLocaleString() + ' words';
      }
    },

    open(currentScript) {
      if (this.textarea) {
        this.textarea.value = currentScript || '';
        this.updateWordCount(this.textarea.value);
      }
      if (this.el) {
        this.el.classList.add('active');
      }
      if (this.textarea) {
        this.textarea.focus();
      }
    },

    close() {
      if (this.el) {
        this.el.classList.remove('active');
      }
    },

    isOpen() {
      return this.el && this.el.classList.contains('active');
    }
  };
})();
