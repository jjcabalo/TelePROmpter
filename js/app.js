/**
 * TelePROmpter Application Core & UI Components
 * Coordinates components, playback loop, storage, and event routing.
 */
(function() {
  window.Teleprompter = window.Teleprompter || {};
  window.Teleprompter.components = window.Teleprompter.components || {};

  // 1. ReadingGuide Component
  if (!window.Teleprompter.components.ReadingGuide) {
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
  }

  // 2. CountdownOverlay Component
  if (!window.Teleprompter.components.CountdownOverlay) {
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
  }

  // 3. TopBar Component
  if (!window.Teleprompter.components.TopBar) {
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
  }

  // 4. HudControls Component
  if (!window.Teleprompter.components.HudControls) {
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
  }

  // 5. EditorModal Component
  if (!window.Teleprompter.components.EditorModal) {
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
  }

  // 6. SettingsModal Component
  if (!window.Teleprompter.components.SettingsModal) {
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
  }

  // Application State
  const state = {
    theme: 'dark', // 'dark' | 'light'
    isPlaying: false,
    speed: 5,
    fontSize: 52,
    contentWidth: 900,
    lineHeight: 1.5,
    textColor: '#ffffff',
    textAlign: 'left',
    mirrorH: false,
    mirrorV: false,
    showGuide: true,
    countdownEnabled: true,
    countdownDuration: 3,
    hudVisible: true,
    scrollPos: 0,
    lastTimestamp: null,
    elapsedSeconds: 0,
    timerInterval: null,
    isCountingDown: false,
    countdownTimerId: null
  };

  window.Teleprompter.state = state;

  const viewport = document.getElementById('viewport');
  const prompterContent = document.getElementById('prompter-content');

  const { ReadingGuide, CountdownOverlay, TopBar, HudControls, EditorModal, SettingsModal } = window.Teleprompter.components;

  function loadSavedState() {
    try {
      const savedScript = localStorage.getItem('tp_script');
      if (savedScript && prompterContent) {
        prompterContent.textContent = savedScript;
      }

      const savedSettings = JSON.parse(localStorage.getItem('tp_settings') || '{}');
      if (savedSettings.theme) state.theme = savedSettings.theme;
      if (savedSettings.speed !== undefined) state.speed = savedSettings.speed;
      if (savedSettings.fontSize !== undefined) state.fontSize = savedSettings.fontSize;
      if (savedSettings.contentWidth !== undefined) state.contentWidth = savedSettings.contentWidth;
      if (savedSettings.lineHeight !== undefined) state.lineHeight = savedSettings.lineHeight;
      if (savedSettings.textColor) state.textColor = savedSettings.textColor;
      if (savedSettings.textAlign) state.textAlign = savedSettings.textAlign;
      if (savedSettings.mirrorH !== undefined) state.mirrorH = savedSettings.mirrorH;
      if (savedSettings.mirrorV !== undefined) state.mirrorV = savedSettings.mirrorV;
      if (savedSettings.showGuide !== undefined) state.showGuide = savedSettings.showGuide;
      if (savedSettings.countdownEnabled !== undefined) state.countdownEnabled = savedSettings.countdownEnabled;
      if (savedSettings.countdownDuration !== undefined) state.countdownDuration = savedSettings.countdownDuration;
    } catch (e) {
      console.error('Failed to load settings:', e);
    }

    applyTheme(state.theme, false);
    applyStateToUI();
    updateStats();
  }

  function saveState() {
    try {
      if (prompterContent) {
        localStorage.setItem('tp_script', prompterContent.textContent);
      }
      localStorage.setItem('tp_settings', JSON.stringify({
        theme: state.theme,
        speed: state.speed,
        fontSize: state.fontSize,
        contentWidth: state.contentWidth,
        lineHeight: state.lineHeight,
        textColor: state.textColor,
        textAlign: state.textAlign,
        mirrorH: state.mirrorH,
        mirrorV: state.mirrorV,
        showGuide: state.showGuide,
        countdownEnabled: state.countdownEnabled,
        countdownDuration: state.countdownDuration
      }));
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
  }

  function applyTheme(theme, autoAdjustTextColor = true) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);

    if (theme === 'light') {
      if (autoAdjustTextColor && state.textColor === '#ffffff') {
        state.textColor = '#0f172a';
      }
    } else {
      if (autoAdjustTextColor && state.textColor === '#0f172a') {
        state.textColor = '#ffffff';
      }
    }

    document.documentElement.style.setProperty('--text-color', state.textColor);
    TopBar.updateTheme(theme);
    SettingsModal.updateThemeButtons(theme);
    SettingsModal.updateColorSwatches(state.textColor);
    saveState();
  }

  function toggleTheme() {
    applyTheme(state.theme === 'dark' ? 'light' : 'dark', true);
  }

  function applyStateToUI() {
    document.documentElement.style.setProperty('--font-size', state.fontSize + 'px');
    HudControls.updateFontSize(state.fontSize);

    HudControls.updateSpeed(state.speed);

    document.documentElement.style.setProperty('--content-width', state.contentWidth + 'px');
    document.documentElement.style.setProperty('--line-height', state.lineHeight);
    document.documentElement.style.setProperty('--text-color', state.textColor);

    if (prompterContent) {
      prompterContent.style.textAlign = state.textAlign;
    }

    ReadingGuide.update();
    applyTransforms();
    SettingsModal.syncUI(state);
  }

  function applyTransforms() {
    if (!prompterContent) return;
    prompterContent.classList.remove('mirror-h', 'mirror-v', 'mirror-both');
    if (state.mirrorH && state.mirrorV) {
      prompterContent.classList.add('mirror-both');
    } else if (state.mirrorH) {
      prompterContent.classList.add('mirror-h');
    } else if (state.mirrorV) {
      prompterContent.classList.add('mirror-v');
    }
    HudControls.updateMirror(state.mirrorH);
  }

  function scrollStep(timestamp) {
    if (!state.isPlaying) {
      state.lastTimestamp = null;
      return;
    }

    if (!state.lastTimestamp) state.lastTimestamp = timestamp;
    const delta = (timestamp - state.lastTimestamp) / 1000;
    state.lastTimestamp = timestamp;

    const pxPerSec = state.speed * 42;
    state.scrollPos += pxPerSec * delta;

    if (viewport) {
      viewport.scrollTop = state.scrollPos;

      const maxScroll = viewport.scrollHeight - viewport.clientHeight;
      if (viewport.scrollTop >= maxScroll && maxScroll > 0) {
        pause();
        return;
      }
    }

    requestAnimationFrame(scrollStep);
  }

  if (viewport) {
    viewport.addEventListener('scroll', () => {
      if (Math.abs(viewport.scrollTop - state.scrollPos) > 4) {
        state.scrollPos = viewport.scrollTop;
      }
    });
  }

  function play() {
    if (state.isPlaying || state.isCountingDown) return;

    if (state.countdownEnabled && viewport && viewport.scrollTop <= 20) {
      CountdownOverlay.start(() => {
        startPlayback();
      });
    } else {
      startPlayback();
    }
  }

  function startPlayback() {
    state.isPlaying = true;
    if (viewport) {
      state.scrollPos = viewport.scrollTop;
    }
    state.lastTimestamp = null;

    HudControls.setPlaying(true);

    if (!state.timerInterval) {
      state.timerInterval = setInterval(() => {
        state.elapsedSeconds++;
        TopBar.updateElapsed(formatTime(state.elapsedSeconds));
        updateRemainingTime();
      }, 1000);
    }

    requestAnimationFrame(scrollStep);
  }

  function pause() {
    state.isPlaying = false;
    HudControls.setPlaying(false);

    if (state.timerInterval) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
    }

    CountdownOverlay.cancel();
  }

  function togglePlay() {
    if (state.isCountingDown) {
      CountdownOverlay.cancel();
      return;
    }
    if (state.isPlaying) {
      pause();
    } else {
      play();
    }
  }

  function rewind() {
    pause();
    CountdownOverlay.cancel();
    state.scrollPos = 0;
    if (viewport) viewport.scrollTop = 0;
    state.elapsedSeconds = 0;
    TopBar.updateElapsed('00:00');
    updateRemainingTime();
  }

  function updateStats() {
    const text = prompterContent ? prompterContent.textContent.trim() : '';
    const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
    updateRemainingTime(words);
  }

  function updateRemainingTime(existingWordCount) {
    if (!viewport) return;
    const maxScroll = viewport.scrollHeight - viewport.clientHeight;
    let remainingStr = '--:--';
    if (maxScroll > 0) {
      const remainingPx = Math.max(0, maxScroll - viewport.scrollTop);
      const pxPerSec = state.speed * 42;
      const secondsLeft = Math.round(remainingPx / pxPerSec);
      remainingStr = formatTime(secondsLeft);
    }
    const words = existingWordCount !== undefined
      ? existingWordCount
      : (prompterContent ? prompterContent.textContent.trim().split(/\s+/).filter(Boolean).length : 0);
    TopBar.updateStats(words, remainingStr);
  }

  function formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  function toggleHud() {
    state.hudVisible = !state.hudVisible;
    HudControls.toggleVisibility(state.hudVisible);
    TopBar.toggleVisibility(state.hudVisible);
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  ReadingGuide.init(state);

  CountdownOverlay.init(state, {
    onSkip: () => startPlayback()
  });

  TopBar.init(state, {
    onToggleTheme: () => toggleTheme(),
    onOpenEditor: () => {
      pause();
      EditorModal.open(prompterContent ? prompterContent.textContent : '');
    },
    onOpenSettings: () => {
      pause();
      SettingsModal.open();
    },
    onToggleFullscreen: () => toggleFullscreen()
  });

  HudControls.init(state, {
    onTogglePlay: () => togglePlay(),
    onRewind: () => rewind(),
    onToggleMirror: () => {
      state.mirrorH = !state.mirrorH;
      applyTransforms();
      saveState();
    },
    onSpeedChange: (newSpeed) => {
      state.speed = newSpeed;
      HudControls.updateSpeed(state.speed);
      saveState();
      updateRemainingTime();
    },
    onFontSizeChange: (newSize) => {
      state.fontSize = newSize;
      document.documentElement.style.setProperty('--font-size', state.fontSize + 'px');
      HudControls.updateFontSize(state.fontSize);
      saveState();
    }
  });

  EditorModal.init(state, {
    onSave: (newScript) => {
      if (prompterContent) prompterContent.textContent = newScript;
      rewind();
      updateStats();
      saveState();
    }
  });

  SettingsModal.init(state, {
    onSetTheme: (theme) => applyTheme(theme, true),
    onColorChange: (color) => {
      state.textColor = color;
      document.documentElement.style.setProperty('--text-color', state.textColor);
      SettingsModal.updateColorSwatches(state.textColor);
      saveState();
    },
    onToggleGuide: (show) => {
      ReadingGuide.toggle(show);
      saveState();
    },
    onToggleCountdown: (enabled) => {
      state.countdownEnabled = enabled;
      SettingsModal.syncUI(state);
      saveState();
    },
    onCountdownDurationChange: (duration) => {
      state.countdownDuration = duration;
      SettingsModal.syncUI(state);
      saveState();
    },
    onWidthChange: (width) => {
      state.contentWidth = width;
      document.documentElement.style.setProperty('--content-width', state.contentWidth + 'px');
      SettingsModal.syncUI(state);
      saveState();
    },
    onLineHeightChange: (lh) => {
      state.lineHeight = lh;
      document.documentElement.style.setProperty('--line-height', state.lineHeight);
      SettingsModal.syncUI(state);
      saveState();
    },
    onAlignChange: (align) => {
      state.textAlign = align;
      if (prompterContent) prompterContent.style.textAlign = align;
      saveState();
    },
    onToggleFlipV: (isFlipped) => {
      state.mirrorV = isFlipped;
      applyTransforms();
      saveState();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (EditorModal.isOpen()) {
      if (e.key === 'Escape') {
        EditorModal.close();
      }
      return;
    }

    switch (e.key) {
      case ' ':
        e.preventDefault();
        togglePlay();
        break;
      case 'ArrowUp':
        e.preventDefault();
        state.speed = Math.min(20, +(state.speed + 0.5).toFixed(1));
        HudControls.updateSpeed(state.speed);
        saveState();
        updateRemainingTime();
        break;
      case 'ArrowDown':
        e.preventDefault();
        state.speed = Math.max(1, +(state.speed - 0.5).toFixed(1));
        HudControls.updateSpeed(state.speed);
        saveState();
        updateRemainingTime();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        state.scrollPos = Math.max(0, state.scrollPos - 150);
        if (viewport) viewport.scrollTop = state.scrollPos;
        break;
      case 'ArrowRight':
        e.preventDefault();
        state.scrollPos = state.scrollPos + 150;
        if (viewport) viewport.scrollTop = state.scrollPos;
        break;
      case 'r':
      case 'R':
      case 'Home':
        e.preventDefault();
        rewind();
        break;
      case 'm':
      case 'M':
        state.mirrorH = !state.mirrorH;
        applyTransforms();
        saveState();
        break;
      case 'h':
      case 'H':
        toggleHud();
        break;
      case 'f':
      case 'F':
        toggleFullscreen();
        break;
      case 't':
      case 'T':
        toggleTheme();
        break;
      case 'Escape':
        if (SettingsModal.isOpen()) {
          SettingsModal.close();
        } else {
          pause();
          EditorModal.open(prompterContent ? prompterContent.textContent : '');
        }
        break;
    }
  });

  if (viewport) {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    viewport.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
      }
    }, { passive: true });

    viewport.addEventListener('touchend', (e) => {
      if (e.changedTouches.length === 1) {
        const deltaX = Math.abs(e.changedTouches[0].clientX - touchStartX);
        const deltaY = Math.abs(e.changedTouches[0].clientY - touchStartY);
        const elapsed = Date.now() - touchStartTime;

        if (deltaX < 12 && deltaY < 12 && elapsed < 300) {
          if (EditorModal.isOpen() || SettingsModal.isOpen()) return;

          if (!state.hudVisible) {
            toggleHud();
            return;
          }

          const hudEl = document.getElementById('hud');
          if (hudEl && hudEl.style.opacity === '0') {
            HudControls.showActive();
            return;
          }

          togglePlay();
        }
      }
    }, { passive: true });
  }

  loadSavedState();
})();
