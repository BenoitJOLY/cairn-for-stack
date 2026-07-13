const STACKFORGE_VERSION = '2.1.0';
const STACKFORGE_VERSION_DATE = 'Juin 2026';

document.addEventListener('DOMContentLoaded', () => {
  const semver = document.getElementById('app-semver');
  if (semver) semver.textContent = STACKFORGE_VERSION;

  const footerVer = document.getElementById('footer-version');
  if (footerVer) footerVer.textContent = `Version ${STACKFORGE_VERSION} — ${STACKFORGE_VERSION_DATE}`;
});
