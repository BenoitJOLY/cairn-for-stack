# ⚒️ Cairn for Stack

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

**Générateur d'exercices STACK avancé pour Moodle.**

Veuillez choisir votre langue pour consulter la documentation / Please select your language to read the documentation:

🇫🇷 **[Français](./README.fr.md)**
🇬🇧 **[English](./README.en.md)**
🇩🇪 **[Deutsch](./README.de.md)**
🇪🇸 **[Español](./README.es.md)**
🇳🇱 **[Nederlands](./README.nl.md)**

## Architecture

Cairn for Stack ne réimplémente jamais Maxima : l'app Node ne fait que produire du
XML STACK et relayer, via une liste blanche de routes, vers le serveur Maxima
officiel (stack-api / goemaxima) qui reste seul responsable de l'exécution et
du sandboxing du code Maxima.

```mermaid
flowchart LR
    U["Utilisateur<br/>(enseignant·e)"] -->|HTTPS, session cookie| SF

    subgraph SF["Cairn for Stack (Node/Express)"]
        direction TB
        STATIC["App statique<br/>(index.html, js/*.js)<br/>génère le XML STACK"]
        PROXY["Proxy interne<br/>/stack-api/:route<br/>liste blanche : render · grade · validate · diff"]
    end

    SF -->|réseau Docker interne isolé<br/>maxima_default, jamais exposé sur internet| GM

    subgraph GM["Conteneur séparé : maxima-stack-api-1"]
        direction TB
        GOEMAXIMA["stack-api / goemaxima<br/>exécute et sandboxe Maxima"]
    end

    GM -->|résultat rendu / noté| SF
    SF -->|JSON| U
```

Aucun `exec`/`spawn` de process externe côté Cairn for Stack (vérifié) : toute
exécution de code Maxima a lieu exclusivement dans le conteneur `goemaxima`,
isolé sur son propre réseau Docker et jamais atteignable directement depuis
le navigateur.

## Crédits

Icône de l'application (`assets/icone_48x48.png`) : œuvre d'Adrien Gion.

