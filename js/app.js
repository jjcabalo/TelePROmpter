/**
 * TelePROmpter Application Core
 * Coordinates UI components, playback loop, storage, and event routing.
 */
(function() {
  window.Teleprompter = window.Teleprompter || {};

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

  // Viewport & Content DOM references
  const viewport = document.getElementById('viewport');
  const prompterContent = document.getElementById('prompter-content');

  // Shortcut access to components
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
    // Font size
    document.documentElement.style.setProperty('--font-size', state.fontSize + 'px');
    HudControls.updateFontSize(state.fontSize);

    // Speed
    HudControls.updateSpeed(state.speed);

    // Content width
    document.documentElement.style.setProperty('--content-width', state.contentWidth + 'px');

    // Line height
    document.documentElement.style.setProperty('--line-height', state.lineHeight);

    // Text color
    document.documentElement.style.setProperty('--text-color', state.textColor);

    // Text align
    if (prompterContent) {
      prompterContent.style.textAlign = state.textAlign;
    }

    // Guide overlay
    ReadingGuide.update();

    // Mirror transforms
    applyTransforms();

    // Settings modal fields
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

  // Smooth scroll loop
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

  // User manual scroll sync
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

  // Initialize UI Components & Callbacks
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

  // Global Keyboard Shortcuts (PC)
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

  // Mobile Touch Support
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

  // Load Initial Settings & Script
  loadSavedState();
})();
