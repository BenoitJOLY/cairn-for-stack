const HESTACK_VERSION = '2.1.0';
const HESTACK_VERSION_DATE = 'Juin 2026';

document.addEventListener('DOMContentLoaded', () => {
  const semver = document.getElementById('app-semver');
  if (semver) semver.textContent = HESTACK_VERSION;

  const footerVer = document.getElementById('footer-version');
  if (footerVer) footerVer.textContent = `Version ${HESTACK_VERSION} — ${HESTACK_VERSION_DATE}`;
});
