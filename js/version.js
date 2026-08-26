/*
 * Cairn for Stack — générateur de questions STACK pour Moodle
 * Copyright (C) 2026  Benoit Joly
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

const CAIRN_FOR_STACK_VERSION = '1.1';
const CAIRN_FOR_STACK_VERSION_DATE = 'Juillet 2026';

document.addEventListener('DOMContentLoaded', () => {
  const semver = document.getElementById('app-semver');
  if (semver) semver.textContent = CAIRN_FOR_STACK_VERSION;

  const footerVer = document.getElementById('footer-version');
  if (footerVer) footerVer.textContent = `Version ${CAIRN_FOR_STACK_VERSION} — ${CAIRN_FOR_STACK_VERSION_DATE}`;
});
