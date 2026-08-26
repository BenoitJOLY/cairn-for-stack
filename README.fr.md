⚒️ Cairn for Stack V1

Cairn for Stack est un générateur d'exercices interactifs de haute qualité pour la plateforme Moodle, basé sur le type de question STACK. 

Il permet aux enseignants de concevoir visuellement des exercices mathématiques et scientifiques complexes (algèbre, chimie, optique, électricité, etc.) sans avoir à écrire manuellement le code Maxima ou la structure XML inhérente à STACK. Le projet intègre un moteur de prévisualisation réel et une connexion directe à un serveur Maxima pour valider les questions avant même de les exporter.
✨ Fonctionnalités principales

    Environnement de création visuelle pour ~40 types de questions (Algébrique, Nombres complexes, Calcul, Checkbox, Radio, Dropdown, Vrai/Faux, Redox, Acide-Base, Optique, Électricité, etc.).
    Prévisualisation "Réelle" Maxima : Pour les types à tirage aléatoire (Checkbox, Radio, Dropdown), l'aperçu interroge le vrai serveur Maxima pour afficher exactement ce que l'élève verra (bientôt généralisé à tous les types).
    Génération sécurisée de variantes (deployedseed) : Lors de l'export, Cairn for Stack valide automatiquement un minimum de 5 variantes réelles auprès de Maxima et les insère dans le XML, évitant les erreurs de rendu aléatoires dans Moodle.
    Système de Feedbacks avancé (PRT) : Gestion des arbres de réponses avec entourages, icônes et fonds personnalisables, appliqués à l'export et à la prévisualisation. Seuls les feedbacks atteignables sont affichés dans l'aperçu.
    Pilotage par environnement : Configuration dynamique des serveurs (Maxima/Stack-API, JSmol) et des fichiers de tags.
    Catégorisation par Chips : Polarimétrie, Nomenclature, Incertitude, etc.
    Multilingue : Interface disponible en Français, Anglais, Allemand, Espagnol et Néerlandais.

🚧 En cours de développement (Roadmap)

Les fonctionnalités suivantes sont actuellement en cours d'intégration :

    Généralisation de la prévisualisation réelle à l'ensemble des types de questions (notamment Vrai/Faux).
    Création d'une page de réglages centralisée pour les environnements (Serveur Maxima, Fichier de tags, Serveur JSmol).
    Raffinement du système de feedback (filtrage dynamique dans l'aperçu selon l'atteignabilité).

🛠️ Stack Technique

    Frontend : HTML5, CSS3, JavaScript pur (Vanilla JS), KaTeX (rendu mathématique).
    Backend : Node.js, Express.js (Pour l'API de génération sécurisée et l'authentification).
    Moteur Mathématique : Maxima (via conteneur Docker stackmaths/stackapi).
    Déploiement : Docker (Docker Compose), optimisé pour l'auto-hébergement sur NAS Synology.
    Tests : Suite de 485+ tests unitaires (node --test) sur la logique pure de génération.

📋 Prérequis

    Node.js (v18+ recommandé)
    npm
    Docker & Docker Compose
    Un conteneur Maxima/Stack-API fonctionnel.

🚀 Installation et Démarrage
1. Cloner le dépôt

git clone <url-du-depot-cairn-for-stack.git>cd cairn-for-stack

2. Lancer avec Docker (Recommandé - NAS Synology)

Le projet est conçu pour être déployé via un projet Docker Compose. Le réseau est configuré pour que le serveur Cairn for Stack communique avec l'API Maxima en interne (contournant les problèmes de CORS).
bash
 
  
 
 
# Construction et lancement des conteneurs
docker-compose up -d --build
 
 
3. Lancer en mode développement (Local)
bash
 
  
 
 
# Installer les dépendances de test
npm install

# Lancer la suite de tests unitaires
npm test
 
 

Note : Pour lancer l'interface graphique en local sans le backend Express, ouvrez simplement index.html dans votre navigateur. Les fonctions basculeront automatiquement en mode local.
👤 Administration et Sécurité (Serveur)

Le conteneur cairn-for-stack-server protège l'interface par un système de login (Session cookies httpOnly + secure). La logique métier n'est pas exposée publiquement.

Pour créer un utilisateur (liste fermée), connectez-vous au conteneur via SSH et exécutez :
bash
 
  
 
 
sudo docker exec -it cairn-for-stack node server/create-account.js <identifiant> <mot_de_passe> [admin|validateur]
 
 

Le rôle est optionnel (un compte sans rôle est un enseignant classique). Pour changer
le rôle d'un compte existant :
bash
 
  
 
 
sudo docker exec -it cairn-for-stack node server/set-role.js <identifiant> <admin|validateur|none>
 
 

Le tout premier compte admin peut aussi être créé automatiquement au démarrage du
conteneur en renseignant `ACCOUNT_USERNAME`, `ACCOUNT_PASSWORD` et `ACCOUNT_ROLE=admin`
dans le `.env` avant le premier `docker compose up`.
 
🏗️ Architecture du Code (Pour les contributeurs)

Le projet suit une architecture stricte de découplage (Pattern Wrapper/Cœur pur) :

     genXxx() : Wrapper impur qui lit le DOM du formulaire navigateur.
     genXxxCore() : Le cœur pur (aucun accès DOM). Testé par npm test et appelé par le serveur Node via POST /api/generate.
     server/ : Backend Express (Authentification, routage statique, endpoint de génération).
     js/maxima-client.js : Client réseau pour la validation et le rendu réel via Stack-API.

📜 Licence

Ce projet est distribué sous GNU Affero General Public License v3.0 (AGPL-3.0).

Cela signifie que vous êtes libre d'utiliser, modifier et distribuer ce logiciel, mais que toute modification déployée sur un serveur réseau accessible au public doit être rendue open-source sous la même licence. 

Consultez le fichier LICENSE à la racine de ce dépôt pour plus de détails.
🖼️ Crédits

Icône de l'application (assets/icone_48x48.png) : œuvre d'Adrien Gion.