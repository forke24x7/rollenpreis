(() => {
  let preference = 'system';
  try { preference = localStorage.getItem('rollenpreis-theme') || 'system'; } catch {}
  const media = matchMedia('(prefers-color-scheme: dark)');
  function apply() {
    document.documentElement.dataset.theme = preference === 'system' ? (media.matches ? 'dark' : 'light') : preference;
    document.querySelector('meta[name="theme-color"]').content = document.documentElement.dataset.theme === 'dark' ? '#12171d' : '#f6f7f9';
    document.querySelectorAll('[data-theme-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.themeChoice === preference)));
  }
  media.addEventListener('change', apply);
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-theme-choice]').forEach(button => button.addEventListener('click', () => {
      preference = button.dataset.themeChoice;
      try { localStorage.setItem('rollenpreis-theme', preference); } catch {}
      apply();
    }));
    apply();
  });
  apply();
})();
