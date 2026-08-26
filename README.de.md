# ⚒️ Cairn for Stack V1

**Cairn for Stack** ist ein hochwertiger Generator für interaktive Übungen für die Moodle-Plattform, basierend auf dem Fragetyp **STACK**.

Er ermöglicht Lehrkräften, komplexe mathematische und naturwissenschaftliche Übungen (Algebra, Chemie, Optik, Elektrizitätslehre usw.) visuell zu gestalten, ohne manuell Maxima-Code oder die für STACK typische XML-Struktur schreiben zu müssen. Das Projekt integriert eine echte Vorschau-Engine und eine direkte Verbindung zu einem Maxima-Server, um die Fragen bereits vor dem Export zu validieren.

## ✨ Hauptfunktionen

- **Visuelle Erstellungsumgebung** für ca. 40 Fragetypen (Algebra, Komplexe Zahlen, Analysis, Checkbox, Radio-Button, Dropdown, Wahr/Falsch, Redox, Säure-Base, Optik, Elektrizitätslehre usw.).
- **"Echte" Maxima-Vorschau**: Bei Typen mit Zufallsauswahl (Checkbox, Radio-Button, Dropdown) fragt die Vorschau den echten Maxima-Server ab, um exakt das anzuzeigen, was der Schüler sehen wird (wird bald auf alle Typen erweitert).
- **Sichere Generierung von Varianten (`deployedseed`)**: Beim Export validiert Cairn for Stack automatisch mindestens 5 echte Varianten über Maxima und fügt sie in die XML-Datei ein, um zufällige Renderfehler in Moodle zu vermeiden.
- **Erweitertes Feedback-System (PRT)**: Verwaltung von Antwortbäumen mit anpassbaren Rahmen, Symbolen und Hintergründen, die beim Export und in der Vorschau angewendet werden. In der Vorschau werden nur erreichbare Feedbacks angezeigt.
- **Umgebungsgesteuerte Einstellungen**: Dynamische Konfiguration von Servern (Maxima/Stack-API, JSmol) und Tag-Dateien über eine zentrale Admin-Einstellungsseite.
- **Kategorisierung durch Chips**: Polarimetrie, Nomenklatur, Messunsicherheit usw.
- **Mehrsprachig**: Oberfläche verfügbar auf Französisch, Englisch, Deutsch, Spanisch und Niederländisch.

## 🚧 In Entwicklung (Roadmap)

Die folgenden Funktionen werden derzeit integriert:
- Ausweitung der echten Vorschau auf alle Fragetypen (insbesondere Klick-auf-Bild).
- Verfeinerung des Feedback-Systems (dynamische Filterung in der Vorschau basierend auf der Erreichbarkeit).

## 🛠️ Technologie-Stack

- **Frontend**: HTML5, CSS3, reines JavaScript (Vanilla JS), KaTeX (mathematisches Rendering).
- **Backend**: Node.js, Express.js (für die sichere Generierungs-API und die Authentifizierung).
- **Mathematische Engine**: Maxima (via Docker-Container `stackmaths/stackapi`).
- **Bereitstellung (Deployment)**: Docker (Docker Compose), optimiert für Self-Hosting auf Synology-NAS.
- **Tests**: Test-Suite mit über 485 Unit-Tests (`node --test`) für die reine Generierungslogik.

## 📋 Voraussetzungen

- **Node.js** (v18+ empfohlen)
- **npm**
- **Docker & Docker Compose**
- Ein funktionierender **Maxima/Stack-API**-Container.

## 🚀 Installation und Start

### 1. Repository klonen

```bash
git clone <url-du-depot-cairn-for-stack.git>
cd cairn-for-stack
```

### 2. Mit Docker starten (Empfohlen - Synology NAS)

Das Projekt ist dafür ausgelegt, über ein Docker-Compose-Projekt bereitgestellt zu werden. Das Netzwerk ist so konfiguriert, dass der Cairn for Stack-Server intern mit der Maxima-API kommuniziert (um CORS-Probleme zu umgehen).

```bash
# Bau und Start der Container
docker-compose up -d --build
```

### 3. Im Entwicklungsmodus starten (Lokal)

```bash
# Testabhängigkeiten installieren
npm install

# Die Unit-Test-Suite starten
npm test
```

*Hinweis: Um die grafische Oberfläche lokal ohne das Express-Backend zu starten, öffnen Sie einfach die `index.html` in Ihrem Browser. Die Funktionen wechseln dann automatisch in den lokalen Modus.*

## 👤 Administration und Sicherheit (Server)

Der Container `cairn-for-stack-server` schützt die Oberfläche durch ein Login-System (`httpOnly` + `secure` Session-Cookies). Die Geschäftslogik ist nicht öffentlich zugänglich.

Um einen Benutzer zu erstellen (geschlossene Liste), verbinden Sie sich via SSH mit dem Container und führen Sie folgenden Befehl aus:

```bash
sudo docker exec -it cairn-for-stack node server/create-account.js <benutzername> <passwort> [admin|validateur]
```

Die Rolle ist optional (ein Konto ohne Rolle ist eine normale Lehrkraft). Um die Rolle eines bestehenden Kontos zu ändern:

```bash
sudo docker exec -it cairn-for-stack node server/set-role.js <benutzername> <admin|validateur|none>
```

Das allererste Admin-Konto kann auch automatisch beim Start des Containers erstellt werden, indem `ACCOUNT_USERNAME`, `ACCOUNT_PASSWORD` und `ACCOUNT_ROLE=admin` in der `.env`-Datei vor dem ersten `docker compose up` gesetzt werden.

## 🏗️ Code-Architektur (Für Mitwirkende)

Das Projekt folgt einer strikt entkoppelten Architektur (Wrapper/Reiner-Kern-Muster):
- **`genXxx()`**: Unreiner Wrapper, der das DOM des Browser-Formulars ausliest.
- **`genXxxCore()`**: Der reine Kern (kein DOM-Zugriff). Wird durch `npm test` getestet und vom Node-Server über `POST /api/generate` aufgerufen.
- **`server/`**: Express-Backend (Authentifizierung, statisches Routing, Generierungs-Endpoint).
- **`js/maxima-client.js`**: Netzwerk-Client für die Validierung und das echte Rendering über die Stack-API.

## 📜 Lizenz

Dieses Projekt wird unter der **GNU Affero General Public License v3.0 (AGPL-3.0)** vertrieben.

Dies bedeutet, dass Sie diese Software frei verwenden, modifizieren und verbreiten dürfen, aber jede Modifikation, die auf einem öffentlich zugänglichen Netzwerkserver bereitgestellt wird, als Open-Source unter derselben Lizenz veröffentlicht werden muss.

Weitere Details entnehmen Sie bitte der Datei [LICENSE](./LICENSE) im Stammverzeichnis dieses Repositories.

## 🖼️ Credits

App-Icon (`assets/icone_48x48.png`): Artwork von Adrien Gion.
