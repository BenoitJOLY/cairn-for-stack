import os

def afficher_arborescence(racine, prefixe=""):
    # Ignorer certains dossiers (optionnel)
    ignore = ['node_modules', '.git', '__pycache__', 'venv', '.vscode']

    try:
        elements = sorted([e for e in os.listdir(racine) if e not in ignore])
    except PermissionError:
        # Gère le cas où on n'a pas le droit de lire un dossier
        return

    fichiers = [e for e in elements if os.path.isfile(os.path.join(racine, e))]
    dossiers = [e for e in elements if os.path.isdir(os.path.join(racine, e))]

    # Afficher les dossiers d'abord
    for i, dossier in enumerate(dossiers):
        est_dernier = (i == len(dossiers) - 1) and len(fichiers) == 0
        connecteur = "└── " if est_dernier else "├── "
        print(f"{prefixe}{connecteur}{dossier}/")

        # Récursivité pour les sous-dossiers
        extension = "    " if est_dernier else "│   "
        afficher_arborescence(os.path.join(racine, dossier), prefixe + extension)

    # Afficher les fichiers
    for i, fichier in enumerate(fichiers):
        est_dernier = (i == len(fichiers) - 1)
        connecteur = "└── " if est_dernier else "├── "
        print(f"{prefixe}{connecteur}{fichier}")

# Lancer la fonction
afficher_arborescence('.')