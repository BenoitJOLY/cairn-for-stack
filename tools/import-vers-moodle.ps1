# Cairn for Stack — générateur de questions STACK pour Moodle
# Copyright (C) 2026  Benoit Joly
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.

# Double-clique sur "Importer vers Moodle.bat" (à côté de ce fichier) pour lancer ceci.
# Une fenêtre s'ouvre pour choisir ton fichier XML, comme dans n'importe quel logiciel.

Add-Type -AssemblyName System.Windows.Forms
$dialog = New-Object System.Windows.Forms.OpenFileDialog
$dialog.Filter = "Fichiers XML (*.xml)|*.xml"
$dialog.InitialDirectory = [Environment]::GetFolderPath('MyDocuments')
$downloads = Join-Path $env:USERPROFILE 'Downloads'
if (Test-Path $downloads) { $dialog.InitialDirectory = $downloads }
$dialog.Title = "Choisis le fichier XML exporté par Cairn for Stack"

if ($dialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) {
  Write-Host "Aucun fichier choisi, on arrête là."
  Read-Host "Appuie sur Entrée pour fermer"
  exit
}

& "$PSScriptRoot\moodle-import-test.ps1" -XmlPath $dialog.FileName

Read-Host "Termine. Appuie sur Entrée pour fermer cette fenêtre"

