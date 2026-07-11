import json

fichier_entree = "test/arborescence.txt"
fichier_sortie = "test/taxonomy.js"

taxonomy = {}

print("Lecture de l'arborescence...")
with open(fichier_entree, "r", encoding="utf-8") as f:
    for ligne in f:
        ligne = ligne.strip()
        if not ligne: continue

        parties = [p.strip() for p in ligne.split('\t')]
        if len(parties) != 4: continue

        matiere, classe, chapitre, mots_cles_str = parties

        if matiere not in taxonomy:
            taxonomy[matiere] = {}
        if classe not in taxonomy[matiere]:
            taxonomy[matiere][classe] = {}
        if chapitre not in taxonomy[matiere][classe]:
            taxonomy[matiere][classe][chapitre] = []

        # Séparation des mots-clés
        for mot in mots_cles_str.split(','):
            mot = mot.strip()
            if mot and mot not in taxonomy[matiere][classe][chapitre]:
                taxonomy[matiere][classe][chapitre].append(mot)

# On génère un vrai fichier JavaScript
with open(fichier_sortie, "w", encoding="utf-8") as f:
    f.write("// Fichier généré automatiquement - NE PAS MODIFIER MANUELLEMENT\n")
    f.write("const TAXONOMY = ")
    json.dump(taxonomy, f, ensure_ascii=False, indent=2)
    f.write(";\n")

print(f"✅ Succès ! Le fichier '{fichier_sortie}' a été créé.")