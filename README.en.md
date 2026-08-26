# ⚒️ Cairn for Stack V1

**Cairn for Stack** is a high-quality interactive exercise generator for the Moodle platform, based on the **STACK** question type.

It allows teachers to visually design complex mathematical and scientific exercises (algebra, chemistry, optics, electricity, etc.) without manually writing the Maxima code or the XML structure inherent to STACK. The project integrates a real preview engine and a direct connection to a Maxima server to validate questions before even exporting them.

## ✨ Key Features

- **Visual creation environment** for ~40 question types (Algebraic, Complex numbers, Calculus, Checkbox, Radio, Dropdown, True/False, Redox, Acid-Base, Optics, Electricity, etc.).
- **"Real" Maxima Preview**: For random-draw types (Checkbox, Radio, Dropdown), the preview queries the real Maxima server to show exactly what the student will see (soon to be generalized to all types).
- **Secure variant generation (`deployedseed`)**: On export, Cairn for Stack automatically validates a minimum of 5 real variants with Maxima and inserts them into the XML, preventing random rendering errors in Moodle.
- **Advanced Feedback System (PRT)**: Management of response trees with customizable borders, icons, and backgrounds, applied to export and preview. Only reachable feedbacks are displayed in the preview.
- **Environment-driven settings**: Dynamic configuration of servers (Maxima/Stack-API, JSmol) and tag files, from a centralized admin settings page.
- **Categorization Chips**: Polarimetry, Nomenclature, Uncertainty, etc.
- **Multilingual**: Interface available in French, English, German, Spanish, and Dutch.

## 🚧 Under Development (Roadmap)

The following features are currently being integrated:
- Generalization of the real preview to all question types (especially image-click).
- Refinement of the feedback system (dynamic filtering in the preview based on reachability).

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript, KaTeX (math rendering).
- **Backend**: Node.js, Express.js (For the secure generation API and authentication).
- **Math Engine**: Maxima (via `stackmaths/stackapi` Docker container).
- **Deployment**: Docker (Docker Compose), optimized for self-hosting on Synology NAS.
- **Testing**: Suite of 485+ unit tests (`node --test`) on pure generation logic.

## 📋 Prerequisites

- **Node.js** (v18+ recommended)
- **npm**
- **Docker & Docker Compose**
- A working **Maxima/Stack-API** container.

## 🚀 Installation & Setup

### 1. Clone the repository

```bash
git clone <cairn-for-stack-repo-url.git>
cd cairn-for-stack
```

### 2. Run with Docker (Recommended - Synology NAS)

The project is designed to be deployed via a Docker Compose project. The network is configured so the Cairn for Stack server communicates with the Maxima API internally (bypassing CORS issues).

```bash
# Build and start the containers
docker-compose up -d --build
```

### 3. Run in Development mode (Local)

```bash
# Install test dependencies
npm install

# Run the unit test suite
npm test
```

*Note: To run the GUI locally without the Express backend, simply open `index.html` in your browser. Functions will automatically fallback to local mode.*

## 👤 Administration & Security (Server)

The `cairn-for-stack-server` container protects the interface with a login system (Session cookies `httpOnly` + `secure`). The business logic is not publicly exposed.

To create a user (closed list), SSH into the container and run:

```bash
sudo docker exec -it cairn-for-stack node server/create-account.js <username> <password> [admin|validateur]
```

The role is optional (an account without a role is a regular teacher). To change the role of an existing account:

```bash
sudo docker exec -it cairn-for-stack node server/set-role.js <username> <admin|validateur|none>
```

The very first admin account can also be created automatically on container startup by setting `ACCOUNT_USERNAME`, `ACCOUNT_PASSWORD`, and `ACCOUNT_ROLE=admin` in the `.env` file before the first `docker compose up`.

## 🏗️ Code Architecture (For contributors)

The project follows a strict decoupling architecture (Wrapper/Pure Core pattern):
- **`genXxx()`**: Impure wrapper that reads the browser form DOM.
- **`genXxxCore()`**: The pure core (no DOM access). Tested by `npm test` and called by the Node server via `POST /api/generate`.
- **`server/`**: Express backend (Authentication, static routing, generation endpoint).
- **`js/maxima-client.js`**: Network client for validation and real rendering via Stack-API.

## 📜 License

This project is distributed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

This means you are free to use, modify, and distribute this software, but any modification deployed on a publicly accessible network server must be made open-source under the same license.

See the [LICENSE](./LICENSE) file at the root of this repository for more details.

## 🖼️ Credits

App icon (`assets/icone_48x48.png`): artwork by Adrien Gion.
