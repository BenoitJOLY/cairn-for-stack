⚒️ StackForge V1

StackForge es un generador de ejercicios interactivos de alta calidad para la plataforma Moodle, basado en el tipo de pregunta STACK. 

Permite a los docentes diseñar visualmente ejercicios matemáticos y científicos complejos (álgebra, química, óptica, electricidad, etc.) sin tener que escribir manualmente el código Maxima ni la estructura XML inherente a STACK. El proyecto integra un motor de vista previa real y una conexión directa a un servidor Maxima para validar las preguntas incluso antes de exportarlas.
✨ Funcionalidades principales

    Entorno de creación visual para unos 40 tipos de preguntas (Algebraicas, Números complejos, Cálculo, Checkbox, Radio, Dropdown, Verdadero/Falso, Redox, Ácido-Base, Óptica, Electricidad, etc.).
    Vista previa "Real" de Maxima: Para los tipos de selección aleatoria (Checkbox, Radio, Dropdown), la vista previa consulta el servidor Maxima real para mostrar exactamente lo que el alumno verá (próximamente se generalizará a todos los tipos).
    Generación segura de variantes (deployedseed): Durante la exportación, StackForge valida automáticamente un mínimo de 5 variantes reales con Maxima y las inserta en el XML, evitando errores de renderizado aleatorios en Moodle.
    Sistema avanzado de Feedback (PRT): Gestión de árboles de respuestas con bordes, iconos y fondos personalizables, aplicados tanto en la exportación como en la vista previa. Solo se muestran los feedbacks alcanzables en la vista previa.
    Gestión por entorno: Configuración dinámica de servidores (Maxima/Stack-API, JSmol) y archivos de etiquetas (tags).
    Categorización por Chips: Polarimetría, Nomenclatura, Incertidumbre, etc.
    Multilingüe: Interfaz disponible en francés, inglés, alemán, español y neerlandés.

🚧 En desarrollo (Roadmap)

Las siguientes funcionalidades se encuentran actualmente en proceso de integración:

    Generalización de la vista previa real a todos los tipos de preguntas (en particular Verdadero/Falso).
    Creación de una página de configuración centralizada para los entornos (Servidor Maxima, Archivo de etiquetas, Servidor JSmol).
    Refinamiento del sistema de feedback (filtrado dinámico en la vista previa según la alcanzabilidad).

🛠️ Stack Técnico

    Frontend: HTML5, CSS3, JavaScript puro (Vanilla JS), KaTeX (renderizado matemático).
    Backend: Node.js, Express.js (Para la API de generación segura y la autenticación).
    Motor Matemático: Maxima (mediante el contenedor Docker stackmaths/stackapi).
    Despliegue: Docker (Docker Compose), optimizado para el autohospedaje (self-hosting) en NAS Synology.
    Pruebas: Suite de más de 485 pruebas unitarias (node --test) sobre la lógica pura de generación.

📋 Requisitos previos

    Node.js (v18+ recomendado)
    npm
    Docker y Docker Compose
    Un contenedor Maxima/Stack-API funcional.

🚀 Instalación e Inicio
1. Clonar el repositorio

git clone <url-du-depot-stackforge.git>cd stackforge

2. Iniciar con Docker (Recomendado - NAS Synology)

El proyecto está diseñado para ser desplegado mediante un proyecto de Docker Compose. La red está configurada para que el servidor StackForge se comunique con la API de Maxima internamente (evitando problemas de CORS).
bash
 
  
 
 
# Construcción e inicio de los contenedores
docker-compose up -d --build
 
 
3. Iniciar en modo desarrollo (Local)
bash
 
  
 
 
# Instalar las dependencias de prueba
npm install

# Iniciar la suite de pruebas unitarias
npm test
 
 

Nota: Para iniciar la interfaz gráfica localmente sin el backend Express, simplemente abra el archivo index.html en su navegador. Las funciones cambiarán automáticamente al modo local.
👤 Administración y Seguridad (Servidor)

El contenedor stackforge-server protege la interfaz mediante un sistema de inicio de sesión (cookies de sesión httpOnly + secure). La lógica de negocio no está expuesta públicamente.

Para crear un usuario (lista cerrada), conéctese al contenedor mediante SSH y ejecute:
bash
 
  
 
 
sudo docker exec -it stackforge node server/create-account.js <nombre_de_usuario> <contraseña>
 
 
🏗️ Arquitectura del Código (Para colaboradores)

El proyecto sigue una arquitectura estricta de desacoplamiento (Patrón Wrapper/Núcleo puro):

     genXxx(): Wrapper impuro que lee el DOM del formulario del navegador.
     genXxxCore(): El núcleo puro (sin acceso al DOM). Probado mediante npm test y llamado por el servidor Node a través de POST /api/generate.
     server/: Backend Express (Autenticación, enrutamiento estático, endpoint de generación).
     js/maxima-client.js: Cliente de red para la validación y el renderizado real mediante la Stack-API.

📜 Licencia

Este proyecto se distribuye bajo la GNU Affero General Public License v3.0 (AGPL-3.0).

Esto significa que es libre de usar, modificar y distribuir este software, pero cualquier modificación que se despliegue en un servidor de red accesible al público debe ser de código abierto bajo la misma licencia. 

Consulte el archivo LICENSE en la raíz de este repositorio para más detalles.