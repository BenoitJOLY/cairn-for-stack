# Copie ce fichier en "moodle-local.config.ps1" (même dossier) et remplis tes
# valeurs. Ce fichier .example est le seul commité sur Git — la copie réelle
# contenant tes identifiants est ignorée (voir .gitignore).

$MoodleBaseUrl   = "http://192.168.1.20:8090"   # sans slash final
$MoodleUser      = "admin"
$MoodlePassword  = "change-me"
$MoodleCourseId  = 2                            # id du cours contenant la banque de questions cible
$MoodleCategory  = "8,15"                        # "id_categorie,id_contexte" — visible dans l'URL d'import.php (paramètre cat=...)
$MoodleRepoId    = 5                             # id du dépôt "Envoyer un fichier" (souvent 5, peut varier selon l'install)

