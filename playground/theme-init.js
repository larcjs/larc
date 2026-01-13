/**
 * Early Theme Initialization
 * Loads BEFORE page renders to prevent flash of wrong theme
 *
 * This script MUST be placed in <head> with blocking script tag
 */
(function() {
  'use strict';

  const STORAGE_KEY = 'larc-theme-preference';

  function getSystemTheme() {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function getSavedTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (err) {
      return null;
    }
  }

  function getEffectiveTheme() {
    const savedTheme = getSavedTheme();

    // If user has explicitly chosen light or dark, use that
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }

    // Otherwise use system preference (savedTheme is 'auto' or null)
    return getSystemTheme();
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
  }

  // Apply theme IMMEDIATELY to prevent flash
  const effectiveTheme = getEffectiveTheme();
  applyTheme(effectiveTheme);

  // Listen for system theme changes (only if user hasn't explicitly set a theme)
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', function(e) {
      const savedTheme = getSavedTheme();

      // Only auto-switch if user is in 'auto' mode (or hasn't set a preference)
      if (!savedTheme || savedTheme === 'auto') {
        const newTheme = e.matches ? 'dark' : 'light';
        applyTheme(newTheme);
      }
    });
  }
})();
