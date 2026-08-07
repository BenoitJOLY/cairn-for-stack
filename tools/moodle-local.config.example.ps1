# StackForge — générateur de questions STACK pour Moodle
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

# Copie ce fichier en "moodle-local.config.ps1" (même dossier) et remplis tes
# valeurs. Ce fichier .example est le seul commité sur Git — la copie réelle
# contenant tes identifiants est ignorée (voir .gitignore).

$MoodleBaseUrl   = "http://192.168.1.20:8090"   # sans slash final
$MoodleUser      = "admin"
$MoodlePassword  = "change-me"
$MoodleCourseId  = 2                            # id du cours contenant la banque de questions cible
$MoodleCategory  = "8,15"                        # "id_categorie,id_contexte" — visible dans l'URL d'import.php (paramètre cat=...)
$MoodleRepoId    = 5                             # id du dépôt "Envoyer un fichier" (souvent 5, peut varier selon l'install)

