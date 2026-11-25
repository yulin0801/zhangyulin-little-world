(() => {
  const root = document.documentElement;
  const nightStyles = document.getElementById('night-theme-styles');
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const preference = 'yulin-site-theme';

  function applyTheme(theme) {
    root.dataset.theme = theme;
    nightStyles.media = theme === 'night' ? 'all' : 'not all';
    themeColor.content = theme === 'night' ? '#15162d' : '#fff0f7';
    for (const button of document.querySelectorAll('[data-theme-choice]')) {
      button.setAttribute('aria-pressed', String(button.dataset.themeChoice === theme));
    }
    document.dispatchEvent(new Event('site-theme-change'));
  }

  let theme = 'night';
  try {
    if (localStorage.getItem(preference) === 'day') theme = 'day';
  } catch {}
  applyTheme(theme);

  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(root.dataset.theme);
    for (const group of document.querySelectorAll('[data-theme-switch]')) {
      group.hidden = false;
      group.addEventListener('click', event => {
        const button = event.target.closest('[data-theme-choice]');
        if (!button) return;
        applyTheme(button.dataset.themeChoice);
        try { localStorage.setItem(preference, button.dataset.themeChoice); } catch {}
      });
    }
  }, {once: true});
})();
