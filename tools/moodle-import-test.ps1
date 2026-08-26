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

<#
.SYNOPSIS
  Importe automatiquement un fichier XML Cairn for Stack dans un Moodle local, en
  rejouant les mêmes requêtes HTTP qu'un import manuel (login -> upload dans
  la zone de brouillon -> soumission du formulaire d'import), puis ouvre la
  page de résultat Moodle dans le navigateur par défaut pour lecture normale.

  Ne remplace pas le jugement humain : ce script ne fait qu'automatiser les
  clics, il ne décide pas si l'import est "réussi" à ta place — la page
  ouverte à la fin est la vraie page de résultat Moodle, à lire comme
  d'habitude.

.PARAMETER XmlPath
  Chemin du fichier .xml exporté par Cairn for Stack à importer.

.PARAMETER ConfigPath
  Chemin du fichier de config (identifiants + paramètres Moodle). Par défaut
  tools/moodle-local.config.ps1 à côté de ce script (voir le fichier
  .example fourni, à copier et remplir toi-même — jamais commité).

.EXAMPLE
  ./tools/moodle-import-test.ps1 -XmlPath "C:\Users\...\export_cairnforstack.xml"
#>
param(
  [Parameter(Mandatory=$true)][string]$XmlPath,
  [string]$ConfigPath = "$PSScriptRoot\moodle-local.config.ps1"
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path $XmlPath)) { throw "Fichier XML introuvable : $XmlPath" }
if (-not (Test-Path $ConfigPath)) {
  throw "Fichier de config introuvable : $ConfigPath`nCopie tools/moodle-local.config.example.ps1 vers tools/moodle-local.config.ps1 et remplis tes identifiants."
}

. $ConfigPath
# Le fichier de config doit définir : $MoodleBaseUrl, $MoodleUser, $MoodlePassword,
# $MoodleCourseId, $MoodleCategory (format "id,contextid", ex: "8,15"), $MoodleRepoId (souvent 5 = "Envoyer un fichier")

function New-RandomItemId { Get-Random -Minimum 100000000 -Maximum 999999999 }
function New-RandomClientId { -join ((1..13) | ForEach-Object { '{0:x}' -f (Get-Random -Minimum 0 -Maximum 16) }) }

# ── 1) Login ─────────────────────────────────────────────────────────────
Write-Host "Connexion à $MoodleBaseUrl ..." -ForegroundColor Cyan
$loginPage = Invoke-WebRequest -Uri "$MoodleBaseUrl/login/index.php" -SessionVariable moodleSession -UseBasicParsing
$logintoken = [regex]::Match($loginPage.Content, 'name="logintoken"\s+value="([^"]+)"').Groups[1].Value
if (-not $logintoken) { throw "logintoken introuvable sur la page de login — la structure de la page a peut-être changé." }

$loginBody = @{
  username   = $MoodleUser
  password   = $MoodlePassword
  logintoken = $logintoken
}
$loginResp = Invoke-WebRequest -Uri "$MoodleBaseUrl/login/index.php" -Method Post -Body $loginBody -WebSession $moodleSession -UseBasicParsing

if ($loginResp.Content -match 'loginerrors|Invalid login|identifiant.*incorrect') {
  throw "Échec de connexion Moodle — identifiants incorrects (vérifie tools/moodle-local.config.ps1)."
}
Write-Host "Connecté." -ForegroundColor Green

# ── 2) Récupération du sesskey + contexte sur la page d'import ─────────
$importUrl = "$MoodleBaseUrl/question/bank/importquestions/import.php?courseid=$MoodleCourseId&cat=$([uri]::EscapeDataString($MoodleCategory))"
$importPage = Invoke-WebRequest -Uri $importUrl -WebSession $moodleSession -UseBasicParsing
$sesskey = [regex]::Match($importPage.Content, '"sesskey":"([^"]+)"').Groups[1].Value
if (-not $sesskey) { $sesskey = [regex]::Match($importPage.Content, 'name="sesskey"\s+value="([^"]+)"').Groups[1].Value }
if (-not $sesskey) { throw "sesskey introuvable sur la page d'import — vérifie que courseid/cat sont corrects et que le compte a accès à cette banque de questions." }

$catParts = $MoodleCategory -split ','
$ctxId = $catParts[1]

# ── 3) Upload du fichier dans une zone de brouillon ─────────────────────
$itemId = New-RandomItemId
$clientId = New-RandomClientId
$fileName = Split-Path $XmlPath -Leaf
$fileBytes = [System.IO.File]::ReadAllBytes($XmlPath)
$boundary = [System.Guid]::NewGuid().ToString()

function Add-FormField($sb, $boundary, $name, $value) {
  [void]$sb.Append("--$boundary`r`n")
  [void]$sb.Append("Content-Disposition: form-data; name=`"$name`"`r`n`r`n")
  [void]$sb.Append("$value`r`n")
}

$sbHeader = New-Object System.Text.StringBuilder
Add-FormField $sbHeader $boundary 'title' $fileName
Add-FormField $sbHeader $boundary 'author' $MoodleUser
Add-FormField $sbHeader $boundary 'license' 'unknown'
Add-FormField $sbHeader $boundary 'itemid' $itemId
Add-FormField $sbHeader $boundary 'repo_id' $MoodleRepoId
Add-FormField $sbHeader $boundary 'p' ''
Add-FormField $sbHeader $boundary 'page' ''
Add-FormField $sbHeader $boundary 'env' 'filepicker'
Add-FormField $sbHeader $boundary 'sesskey' $sesskey
Add-FormField $sbHeader $boundary 'client_id' $clientId
Add-FormField $sbHeader $boundary 'maxbytes' '-1'
Add-FormField $sbHeader $boundary 'areamaxbytes' '-1'
Add-FormField $sbHeader $boundary 'ctx_id' $ctxId
Add-FormField $sbHeader $boundary 'savepath' '/'
[void]$sbHeader.Append("--$boundary`r`n")
[void]$sbHeader.Append("Content-Disposition: form-data; name=`"repo_upload_file`"; filename=`"$fileName`"`r`n")
[void]$sbHeader.Append("Content-Type: text/xml`r`n`r`n")

$footer = "`r`n--$boundary--`r`n"

$enc = [System.Text.Encoding]::UTF8
$headerBytes = $enc.GetBytes($sbHeader.ToString())
$footerBytes = $enc.GetBytes($footer)
$bodyBytes = New-Object byte[] ($headerBytes.Length + $fileBytes.Length + $footerBytes.Length)
[System.Buffer]::BlockCopy($headerBytes, 0, $bodyBytes, 0, $headerBytes.Length)
[System.Buffer]::BlockCopy($fileBytes, 0, $bodyBytes, $headerBytes.Length, $fileBytes.Length)
[System.Buffer]::BlockCopy($footerBytes, 0, $bodyBytes, $headerBytes.Length + $fileBytes.Length, $footerBytes.Length)

Write-Host "Upload de $fileName ..." -ForegroundColor Cyan
$uploadResp = Invoke-WebRequest -Uri "$MoodleBaseUrl/repository/repository_ajax.php?action=upload" `
  -Method Post -Body $bodyBytes -ContentType "multipart/form-data; boundary=$boundary" `
  -WebSession $moodleSession -UseBasicParsing

if ($uploadResp.Content -match '"error"') {
  throw "Échec de l'upload du fichier : $($uploadResp.Content)"
}
Write-Host "Upload OK (itemid=$itemId)." -ForegroundColor Green

# ── 4) Soumission du formulaire d'import ────────────────────────────────
$importBody = @{
  courseid = $MoodleCourseId
  cat = $MoodleCategory
  sesskey = $sesskey
  '_qf__qbank_importquestions_form_question_import_form' = '1'
  mform_isexpanded_id_fileformat = '1'
  mform_isexpanded_id_general = '0'
  mform_isexpanded_id_importfileupload = '1'
  format = 'xml'
  category = $MoodleCategory
  catfromfile = '1'
  contextfromfile = '1'
  matchgrades = 'error'
  stoponerror = '1'
  newfile = $itemId
  submitbutton = 'Importation'
}

Write-Host "Soumission de l'import..." -ForegroundColor Cyan
$resultResp = Invoke-WebRequest -Uri "$MoodleBaseUrl/question/bank/importquestions/import.php" `
  -Method Post -Body $importBody -WebSession $moodleSession -UseBasicParsing

# ── 5) Sauvegarde + ouverture du résultat réel Moodle ───────────────────
$outDir = Join-Path $env:TEMP "cairnforstack-moodle-import"
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }
$outFile = Join-Path $outDir ("resultat-{0:yyyyMMdd-HHmmss}.html" -f (Get-Date))

# Réécrit les liens relatifs en absolus pour que la page s'affiche correctement hors du domaine Moodle
$html = $resultResp.Content -replace '(href|src)="/', ('$1="' + $MoodleBaseUrl + '/')
Set-Content -Path $outFile -Value $html -Encoding UTF8

Write-Host "Résultat enregistré : $outFile" -ForegroundColor Green
Start-Process $outFile

