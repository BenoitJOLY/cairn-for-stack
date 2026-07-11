import os
import json
import xml.etree.ElementTree as ET

# ==========================================
# CONFIGURATION
# ==========================================
DOSSIER_RACINE = r"test\mise à jour"
FICHIER_SORTIE = r"test\index.json"
# ==========================================

inventaire = []

if not os.path.exists(DOSSIER_RACINE):
    print(f"❌ Erreur : Le dossier '{DOSSIER_RACINE}' est introuvable.")
    print(f"Assure-toi que le script est bien au même niveau que le dossier 'test'.")
    exit()

# On parcourt tous les sous-dossiers
for dossier_courant, sous_dossiers, fichiers in os.walk(DOSSIER_RACINE):
    for nom_fichier in fichiers:
        if nom_fichier.endswith(".xml"):
            chemin_complet = os.path.join(dossier_courant, nom_fichier)

            try:
                arbre = ET.parse(chemin_complet)
                racine = arbre.getroot()

                # 1. On cherche le bloc principal <tags>
                bloc_tags = racine.find('.//tags')
                liste_tags = []

                # 2. Si le bloc existe, on le parcourt
                if bloc_tags is not None:
                    for balise_tag in bloc_tags.findall('tag'):
                        # 3. Pour chaque <tag>, on cherche la balise <text> à l'intérieur
                        balise_text = balise_tag.find('text')
                        if balise_text is not None and balise_text.text:
                            # On ajoute le texte en minuscules et sans espaces au début/fin
                            liste_tags.append(balise_text.text.strip().lower())

                # Si on a trouvé au moins un tag, on ajoute le fichier à l'inventaire
                if liste_tags:
                    # On remplace les \ par des / pour que GitHub soit content
                    chemin_relatif = chemin_complet.replace('\\', '/')
                    inventaire.append({
                        "fichier": chemin_relatif,
                        "tags": liste_tags
                    })
                else:
                    print(f"⚠️ Aucun tag trouvé dans : {nom_fichier}")

            except ET.ParseError:
                print(f"❌ Erreur de lecture XML dans : {nom_fichier}")

# On trie par ordre alphabétique des noms de fichiers
inventaire.sort(key=lambda x: x['fichier'])

# On sauvegarde en JSON
with open(FICHIER_SORTIE, 'w', encoding='utf-8') as f:
    json.dump(inventaire, f, indent=2, ensure_ascii=False)

print(f"\n✅ Succès ! {len(inventaire)} fichiers XML répertoriés.")
print(f"📄 Le fichier '{FICHIER_SORTIE}' a été généré.")