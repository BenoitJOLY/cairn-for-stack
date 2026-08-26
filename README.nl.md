# ⚒️ Cairn for Stack V1

**Cairn for Stack** is een generator voor interactieve oefeningen van hoge kwaliteit voor het Moodle-platform, gebaseerd op het **STACK**-vraagtype.

Het stelt docenten in staat om visueel complexe wiskundige en wetenschappelijke oefeningen (algebra, scheikunde, optica, elektriciteit, enz.) te ontwerpen zonder handmatig de Maxima-code of de voor STACK typische XML-structuur te hoeven schrijven. Het project integreert een echte preview-engine en een directe verbinding met een Maxima-server om de vragen te valideren nog voordat ze worden geëxporteerd.

## ✨ Hoofdfuncties

- **Visuele ontwerpomgeving** voor ca. 40 vraagtypen (Algebra, Complexe getallen, Analyse, Checkbox, Radio, Dropdown, Waar/Onwaar, Redox, Zuur-Base, Optica, Elektriciteit, enz.).
- **"Echte" Maxima-preview**: Voor typen met willekeurige selectie (Checkbox, Radio, Dropdown) vraagt de preview de echte Maxima-server op om exact weer te geven wat de student zal zien (binnenkort uitgebreid naar alle typen).
- **Veilige generatie van varianten (`deployedseed`)**: Bij het exporteren valideert Cairn for Stack automatisch minimaal 5 echte varianten via Maxima en voegt deze in de XML, waardoor willekeurige weergave-fouten in Moodle worden voorkomen.
- **Geavanceerd Feedbacksysteem (PRT)**: Beheer van antwoordbomen met aanpasbare randen, pictogrammen en achtergronden, die worden toegepast bij de export en in de preview. Alleen bereikbare feedbacks worden weergegeven in de preview.
- **Omgeving-gestuurde instellingen**: Dynamische configuratie van servers (Maxima/Stack-API, JSmol) en tag-bestanden, via een gecentraliseerde admin-instellingenpagina.
- **Categorisering via Chips**: Polarimetrie, Nomenclatuur, Meetonzekerheid, enz.
- **Meertalig**: Interface beschikbaar in het Frans, Engels, Duits, Spaans en Nederlands.

## 🚧 In ontwikkeling (Roadmap)

De volgende functies worden momenteel geïntegreerd:
- Algemene toepassing van de echte preview op alle vraagtypen (met name klik-op-afbeelding).
- Verfijning van het feedbacksysteem (dynamische filtering in de preview op basis van bereikbaarheid).

## 🛠️ Technische Stack

- **Frontend**: HTML5, CSS3, puur JavaScript (Vanilla JS), KaTeX (wiskundige weergave).
- **Backend**: Node.js, Express.js (Voor de veilige generatie-API en de authenticatie).
- **Wiskundige Engine**: Maxima (via Docker-container `stackmaths/stackapi`).
- **Deployment**: Docker (Docker Compose), geoptimaliseerd voor self-hosting op een Synology NAS.
- **Tests**: Testsuite met 485+ unit-tests (`node --test`) voor de pure generatielogica.

## 📋 Vereisten

- **Node.js** (v18+ aanbevolen)
- **npm**
- **Docker & Docker Compose**
- Een werkende **Maxima/Stack-API**-container.

## 🚀 Installatie en Opstarten

### 1. Repository klonen

```bash
git clone <url-du-depot-cairn-for-stack.git>
cd cairn-for-stack
```

### 2. Starten met Docker (Aanbevolen - Synology NAS)

Het project is ontworpen om te worden geïmplementeerd via een Docker Compose-project. Het netwerk is geconfigureerd zodat de Cairn for Stack-server intern communiceert met de Maxima-API (waardoor CORS-problemen worden omzeild).

```bash
# Bouwen en starten van de containers
docker-compose up -d --build
```

### 3. Starten in ontwikkelingsmodus (Lokaal)

```bash
# Testafhankelijkheden installeren
npm install

# De unit-test suite starten
npm test
```

*Opmerking: Om de grafische interface lokaal te starten zonder de Express-backend, opent u eenvoudigweg het bestand `index.html` in uw browser. De functies schakelen dan automatisch over naar de lokale modus.*

## 👤 Administratie en Beveiliging (Server)

De container `cairn-for-stack-server` beschermt de interface met een inlogsysteem (`httpOnly` + `secure` sessiecookies). De bedrijfslogica is niet publiek toegankelijk.

Om een gebruiker te maken (gesloten lijst), maakt u via SSH verbinding met de container en voert u het volgende uit:

```bash
sudo docker exec -it cairn-for-stack node server/create-account.js <gebruikersnaam> <wachtwoord> [admin|validateur]
```

De rol is optioneel (een account zonder rol is een gewone docent). Om de rol van een bestaand account te wijzigen:

```bash
sudo docker exec -it cairn-for-stack node server/set-role.js <gebruikersnaam> <admin|validateur|none>
```

Het allereerste adminaccount kan ook automatisch worden aangemaakt bij het opstarten van de container door `ACCOUNT_USERNAME`, `ACCOUNT_PASSWORD` en `ACCOUNT_ROLE=admin` in te stellen in het `.env`-bestand vóór de eerste `docker compose up`.

## 🏗️ Code-architectuur (Voor bijdragers)

Het project volgt een strikte ontkoppelingsarchitectuur (Wrapper/Pure Core-patroon):
- **`genXxx()`**: Onzuivere wrapper die het DOM van het browserformulier uitleest.
- **`genXxxCore()`**: De pure core (geen DOM-toegang). Getest via `npm test` en aangeroepen door de Node-server via `POST /api/generate`.
- **`server/`**: Express-backend (Authenticatie, statisch routeren, generatie-endpoint).
- **`js/maxima-client.js`**: Netwerkclient voor validatie en echte weergave via de Stack-API.

## 📜 Licentie

Dit project wordt gedistribueerd onder de **GNU Affero General Public License v3.0 (AGPL-3.0)**.

Dit betekent dat u vrij bent om deze software te gebruiken, te wijzigen en te distribueren, maar dat elke wijziging die wordt geïmplementeerd op een publiek toegankelijke netwerkserver open-source moet worden gemaakt onder dezelfde licentie.

Raadpleeg het bestand [LICENSE](./LICENSE) in de hoofdmap van deze repository voor meer details.

## 🖼️ Credits

App-icoon (`assets/icone_48x48.png`): werk van Adrien Gion.
