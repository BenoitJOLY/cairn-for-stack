# Double-clique sur "Importer vers Moodle.bat" (à côté de ce fichier) pour lancer ceci.
# Une fenêtre s'ouvre pour choisir ton fichier XML, comme dans n'importe quel logiciel.

Add-Type -AssemblyName System.Windows.Forms
$dialog = New-Object System.Windows.Forms.OpenFileDialog
$dialog.Filter = "Fichiers XML (*.xml)|*.xml"
$dialog.InitialDirectory = [Environment]::GetFolderPath('MyDocuments')
$downloads = Join-Path $env:USERPROFILE 'Downloads'
if (Test-Path $downloads) { $dialog.InitialDirectory = $downloads }
$dialog.Title = "Choisis le fichier XML exporté par StackForge"

if ($dialog.ShowDialog() -ne [System.Windows.Forms.DialogResult]::OK) {
  Write-Host "Aucun fichier choisi, on arrête là."
  Read-Host "Appuie sur Entrée pour fermer"
  exit
}

& "$PSScriptRoot\moodle-import-test.ps1" -XmlPath $dialog.FileName

Read-Host "Termine. Appuie sur Entrée pour fermer cette fenêtre"

