/* ════════════════════════════════════════════════════════════════════════
   STACKFORGE — Contenido del MODO ASISTENTE (Español)
   Guardado en window.ASSIST_LANG.es ; leído por assistant.js según el idioma.
   Para añadir un idioma: copie este archivo, traduzca los valores,
   y guárdelos en window.ASSIST_LANG.<code>.
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  window.ASSIST_LANG = window.ASSIST_LANG || {};

  window.ASSIST_LANG.es = {
    /* ── Interfaz del panel ── */
    toggle: "Modo asistente",
    toggleTitle: "Guía paso a paso: resalta el paso actual y detalla los campos",
    panelTitle: "Modo asistente",
    disable: "Desactivar",

    /* ── Puntuación (añadido al principio de los campos para todos los tipos) ── */
    notation: "<strong>Puntuación (calificación)</strong> — en el banner amarillo superior del formulario: número de puntos asignados a la pregunta.",

    /* ── Pasos ── */
    step1: {
      title: "Paso 1 — Nombrar",
      explain: "Dale un nombre a tu ejercicio en el campo resaltado, luego presiona <strong>Enter</strong> o haz clic en otro lado.",
      tip: "Este nombre identificará el ejercicio generado para Moodle."
    },
    step2: {
      title: "Paso 2 — Elegir un tipo",
      explain: "Haz clic en el <strong>tipo de pregunta</strong> a crear entre las tarjetas resaltadas.",
      tip: "Cada tipo abre un formulario adaptado justo debajo — la guía se precisará entonces campo por campo."
    },
    step3: {
      editTitle: "Edición de P{n} — {label}",
      editExplain: "Estás modificando la pregunta <strong>P{n}</strong>. Ajusta los campos a continuación:",
      editDo: "Haz clic en « Actualizar P{n} » para guardar, o en « Cancelar » para abandonar.",
      title: "Paso 3 — {label}",
      noGuideExplain: "Completa el formulario resaltado, luego añade la pregunta.",
      noGuideDo: "Haz clic en « Añadir esta pregunta ».",
      do: "Una vez rellenado, haz clic en « Añadir esta pregunta ».",
      done: "{qn} pregunta(s) ya añadida(s). Repite para añadir otras, o pasa al paso 4."
    },
    step4: {
      title: "Paso 4 — Generar",
      explain: "Tus <strong>{qn} pregunta(s)</strong> están listas. Haz clic en « <strong>🏷️ Etiquetas &amp; Vista previa</strong> » para verificar, luego generar y exportar.",
      tip: "Aún puedes modificar (✏️) o eliminar (✕) una pregunta a través de sus badges."
    },

    /* ── Lista lateral de pasos ── */
    stepsList: ["Nombrar el ejercicio", "Elegir un tipo", "Rellenar y añadir", "Generar / Exportar"],

    /* ── Variantes V4 (editor arrastrar y soltar) ── */
    step2_v4: {
      title: "Paso 2 — Insertar una pregunta",
      explain: "En la paleta de la <strong>izquierda</strong>, haz clic en una categoría para desplegarla, luego arrastra un bloque al editor.",
      tip: "El panel de configuración se abrirá automáticamente para parametrizar la pregunta."
    },
    step3_v4: {
      editTitle: "Configuración de P{n} — {label}",
      editExplain: "Completa los campos para la pregunta <strong>P{n}</strong>:",
      editDo: "Haz clic en « Guardar » para validar.",
      title: "Paso 3 — {label}",
      noGuideExplain: "Completa el formulario resaltado.",
      noGuideDo: "Haz clic en « Guardar ».",
      do: "Una vez rellenado, haz clic en « Guardar ».",
      done: "{qn} pregunta(s) ya configurada(s). Inserta otras o pasa a la exportación."
    },
    step4_v4: {
      title: "Paso 4 — Exportar",
      explain: "Tus <strong>{qn} pregunta(s)</strong> están listas. Haz clic en <strong>Exportar el XML</strong> para verificar y descargar.",
      tip: "Las viñetas griseadas señalan preguntas que aún faltan por configurar."
    },
    stepsList_v4: ["Nombrar el ejercicio", "Arrastrar un bloque", "Configurar", "Exportar"],

    /* ── Banner de ayuda en las ventanas « Prompt IA » ── */
    prompt: {
      title: "Cómo usar el Prompt IA",
      steps: [
        "Rellena el <strong>contexto</strong> a continuación (tema, materia, nivel, idioma, número de elementos).",
        "El <strong>prompt se construye solo</strong> en el marco oscuro de abajo.",
        "Haz clic en « <strong>📋 Copiar el prompt</strong> ».",
        "Pégalo en una <strong>IA</strong> (ChatGPT, Claude, Gemini…) y lanza la generación.",
        "Recupera el <strong>resultado</strong> producido por la IA (en formato JSON).",
        "Vuelve a Stackforge e <strong>impórtalo</strong> a través del botón « 📥 JSON » del formulario."
      ],
      note: "⚠️ <strong>No lo confundas con la visualización del estudiante.</strong> " +
        "Estos dos campos describen lo que <strong>la IA debe producir</strong> (el banco), no lo que verá el estudiante:" +
        "<ul class=\"hs-pb-note-list\">" +
          "<li>« <strong>Propuestas totales (XE)</strong> » = número total de propuestas a <strong>crear</strong> " +
            "(banco VERDADERO + FALSO), y no el número mostrado al estudiante.</li>" +
          "<li>« <strong>Propuestas verdaderas (XB)</strong> » = número de propuestas verdaderas a <strong>generar</strong> " +
            "en este banco, y no el número de buenas respuestas mostradas al estudiante.</li>" +
        "</ul>" +
        "El número realmente mostrado y sorteado se ajusta <strong>en el formulario</strong>, no aquí."
    },

    /* ── Etiquetas legibles por tipo ── */
    TYPE_LABEL: {
      checkbox: "Casillas de verificación", radio: "Botones de radio", dropdown: "Menú desplegable",
      algebraic: "Algebraico", numerical: "Aritmética (Numérico)", units: "Unidad", string: "Texto (String)",
      match: "Relacionar (Matching)", crossword: "Crucigrama", doi: "Diagrama objetos-interacciones",
      chemical: "Química — ecuación", chemical_topo: "Química topológica",
      nuclear: "Reacción nuclear", composition: "Redacción libre",
      jxgdrop: "Arrastrar y Soltar (JSXGraph)", vf: "Verdadero / Falso", ord: "Clasificación",
      imgclick: "Selección en imagen", rvbcmj: "RGB / CMYK",
      optique: "Óptica geométrica", "acide-base": "pH-metría / Valoración", redox: "Valoración redox",
      basen: "Conversión de base N", circuit: "Circuitos eléctricos",
      logique: "Lógica booleana", complexe: "Números complejos",
      calcul: "Cálculo diferencial e integral", statistiques: "Estadísticas",
      matrices: "Matrices", geometrie: "Geometría analítica",
      suites: "Sucesiones numéricas", probabilites: "Probabilidades",
      trigonometrie: "Trigonometría", polynomes: "Polinomios de 2º grado",
      limites: "Límites de funciones", physique: "Física — Mecánica",
      inequation: "Inecuaciones (conjunto solución)"
    },

    /* ── Guía detallada del paso 3, campo por campo, por tipo ── */
    STEP3: {
      checkbox: {
        intro: "Opción múltiple: Stackforge sortea al azar las propuestas buenas/malas en cada intento.",
        fields: [
          "<strong>Enunciado</strong> — haz clic en « ✏️ Editor » para redactar la pregunta (texto, fórmula, imagen).",
          "<strong>Puntuación</strong> (banner amarillo arriba) — puntos asignados.",
          "<strong>Número total de propuestas</strong> — cuántas casillas verá el estudiante.",
          "<strong>Nº de respuestas correctas</strong> — cuántas son verdaderas (número fijo o aleatorio).",
          "<strong>Propuestas</strong> — añade tus respuestas con « ✅ + VERDADERO » y « ❌ + FALSO ».",
          "<strong>Feedback</strong> — mensajes mostrados si es correcto / si hay error."
        ],
        tip: "Pon más propuestas VERDADERO/FALSO de las que se muestran: el sorteo variará de un estudiante a otro."
      },
      radio: {
        intro: "Una sola respuesta correcta: sacada del grupo VERDADERO, rodeada de distractores del grupo FALSO.",
        fields: [
          "<strong>Enunciado</strong> — a través de « ✏️ Editor ».",
          "<strong>Puntuación</strong> — puntos.",
          "<strong>Nº total de botones mostrados</strong> — 1 respuesta correcta + el resto en distractores.",
          "<strong>Grupo VERDADERO</strong> — añade las posibles respuestas correctas (« + Buena respuesta »).",
          "<strong>Grupo FALSO</strong> — añade los distractores."
        ],
        tip: "Varias respuestas correctas en el grupo VERDADERO = una variante diferente en cada pasada."
      },
      dropdown: {
        intro: "Mismo principio que el botón de radio, pero en forma de menú desplegable.",
        fields: [
          "<strong>Enunciado</strong> — a través de « ✏️ Editor ».",
          "<strong>Puntuación</strong> — puntos.",
          "<strong>Nº de propuestas mostradas</strong> en el menú.",
          "<strong>Grupo VERDADERO</strong> — respuestas correctas.",
          "<strong>Grupo FALSO</strong> — distractores."
        ]
      },
      algebraic: {
        intro: "El estudiante introduce una expresión matemática; Stackforge verifica la equivalencia algebraica.",
        fields: [
          "<strong>Enunciado</strong> — a través de « ✏️ Editor ».",
          "<strong>Variables</strong> — lista las utilizadas (ej: x, y, z).",
          "<strong>Respuesta esperada</strong> — la expresión correcta. Usa « 🎹 Ayuda de entrada » para la sintaxis Maxima.",
          "<strong>Feedback</strong> si es correcto / si es falso.",
          "<span class='opt'>Solución detallada (opcional)</span> — explicación mostrada después."
        ],
        tip: "Escribe la respuesta en sintaxis Maxima (ej: 2*x^2, sqrt(3)), no en notación manuscrita."
      },
      numerical: {
        intro: "Respuesta numérica única, con gestión del redondeo y la tolerancia.",
        fields: [
          "<strong>Enunciado</strong> — a través de « ✏️ Editor ».",
          "<strong>Valor objetivo</strong> — el número esperado.",
          "<strong>Redondeo auto / decimales</strong> — ajusta si la respuesta debe redondearse.",
          "<strong>Tipo de tolerancia</strong> + <strong>margen de error</strong> — diferencia aceptada.",
          "<strong>Feedback</strong> si es correcto / si hay error."
        ]
      },
      units: {
        intro: "Respuesta = un valor numérico Y una unidad (Stackforge verifica ambas).",
        fields: [
          "<strong>Enunciado</strong> — a través de « ✏️ Editor ».",
          "<strong>Valor numérico</strong> esperado.",
          "<strong>Unidad Maxima</strong> — ej: m/s, kg, N (sintaxis Maxima).",
          "<strong>Tolerancia relativa</strong> + <strong>cifras significativas</strong>.",
          "<strong>Feedback</strong> si es correcto / si hay error."
        ],
        tip: "La unidad se nota en sintaxis Maxima: usa « 🎹 Ayuda de entrada » en caso de duda."
      },
      string: {
        intro: "Respuesta de texto libre, comparada con una respuesta esperada.",
        fields: [
          "<strong>Enunciado</strong> — a través de « ✏️ Editor ».",
          "<strong>Respuesta esperada</strong> — el texto correcto.",
          "<strong>Tamaño del campo</strong> + <strong>tolerancia</strong> (flexibilidad de comparación).",
          "<strong>Feedback</strong> si es correcto / si es falso.",
          "<span class='opt'>Solución / explicación (opcional)</span>."
        ]
      },
      match: {
        intro: "El estudiante relaciona los elementos de dos columnas.",
        fields: [
          "<strong>Enunciado</strong> — a través de « ✏️ Editor ».",
          "<strong>Columnas izquierda / derecha</strong> — añade los elementos a relacionar.",
          "<strong>Asociaciones</strong> — traza las correspondencias correctas entre columnas."
        ],
        tip: "El botón « 🤖 Prompt IA » genera un prompt listo para pegar para crear los pares."
      },
      crossword: {
        intro: "Cuadrícula de crucigrama generada a partir de una lista palabras + definiciones.",
        fields: [
          "<strong>Puntuación</strong> y <strong>número de palabras</strong> a utilizar.",
          "<strong>Palabras + definiciones</strong> — añade cada línea (« + Añadir una palabra »).",
          "<strong>Generar la cuadrícula</strong> — Stackforge calcula la disposición."
        ],
        tip: "« 🤖 Prompt IA » fabrica una lista palabras/definiciones sobre un tema en un clic."
      },
      doi: {
        intro: "Diagrama objetos-interacciones: el estudiante relaciona un objeto central con su entorno.",
        fields: [
          "<strong>Enunciado</strong> — a través de « ✏️ Editor ».",
          "<strong>Objeto de estudio</strong> — la zona central del sistema.",
          "<span class='opt'>Zonas azules vacías extra (opcional)</span> — trampas adicionales.",
          "<strong>Objetos e interacciones</strong> — lista cada objeto y su tipo (gravitacional, contacto, intruso…)."
        ]
      },
      chemical: {
        intro: "Ecuación química: el estudiante completa o identifica una reacción.",
        fields: [
          "<span class='opt'>Enunciado (opcional)</span> — a través de « ✏️ Editor ».",
          "<strong>Entrada de la ecuación</strong> — escríbela luego « 🔄 Actualizar la vista previa ».",
          "<strong>Tipo de reacción</strong>.",
          "<strong>Nombre del grupo funcional esperado</strong>.",
          "<strong>Feedback</strong> si es correcto / si hay error."
        ]
      },
      chemical_topo: {
        intro: "Química topológica: ecuación a partir de estructuras SMILES, notación detallada.",
        fields: [
          "<strong>Enunciado</strong> — a través de « ✏️ Editor ».",
          "<strong>Ecuación (SMILES o fórmula)</strong> — ingrésala luego « 🔄 Actualizar ».",
          "<strong>Ponderaciones</strong> — distribuye los % entre la flecha (PRT1) y los nodos.",
          "<strong>Suma de los % = 100</strong> — el mensaje verde confirma el equilibrio."
        ],
        tip: "Verifica el indicador de suma: mientras esté en rojo, la puntuación no es válida."
      },
      nuclear: {
        intro: "Reacción nuclear: el estudiante completa la ecuación (conservación A y Z).",
        fields: [
          "<strong>Enunciado</strong> — a través de « ✏️ Editor ».",
          "<strong>Reacción nuclear modelo</strong> — ingresa la ecuación, luego « 🔄 Vista previa »."
        ]
      },
      composition: {
        intro: "Respuesta redactada libre en un editor (redacción / pregunta abierta).",
        fields: [
          "<strong>Enunciado</strong> — a través de « ✏️ Editor ».",
          "<strong>Tamaño del editor del estudiante</strong> — altura de la zona de redacción.",
          "<span class='opt'>Mensaje mostrado bajo el editor (opcional)</span> — instrucción para el estudiante."
        ]
      },
      basen: {
        intro: "Conversión de base N: el estudiante convierte un número entre bases (2, 8, 10, 16).",
        fields: [
          "<strong>Preconfiguración</strong> — elige un ejemplo común.",
          "<strong>Número fuente</strong> + <strong>base fuente</strong> (ej: 1010 en base 2).",
          "<strong>Base objetivo</strong> — base hacia la cual convertir.",
          "<strong>Instrucción</strong> — a través de « ✏️ Editor ».",
          "<strong>Feedback</strong> correcto / incorrecto."
        ],
        tip: "La vista previa calcula automáticamente la respuesta correcta para verificación."
      },
      circuit: {
        intro: "Leyes de los circuitos eléctricos: Ohm, asociaciones serie/paralelo, potencia.",
        fields: [
          "<strong>Preconfiguración</strong> — elige un escenario de circuito.",
          "<strong>Tipo de pregunta</strong> — ley de Ohm, resistencia serie/paralelo, intensidad, potencia…",
          "<strong>Parámetros</strong> U, I, R, P según el escenario.",
          "<strong>Instrucción</strong> — a través de « ✏️ Editor ».",
          "<strong>Feedback</strong> correcto / incorrecto."
        ]
      },
      logique: {
        intro: "Lógica booleana: tablas de verdad, simplificación, equivalencias.",
        fields: [
          "<strong>Preconfiguración</strong> — elige un ejemplo (AND, OR, NOT, XOR, De Morgan…).",
          "<strong>Tipo de pregunta</strong> — tabla de verdad, simplificación, equivalencia.",
          "<strong>Expresión booleana</strong> — notación con AND/OR/NOT/XOR.",
          "<strong>Instrucción</strong> — a través de « ✏️ Editor ».",
          "<strong>Feedback</strong> correcto / incorrecto."
        ],
        tip: "La vista previa muestra la tabla de verdad completa y el valor esperado."
      },
      complexe: {
        intro: "Números complejos: forma algebraica, módulo, argumento, conjugado.",
        fields: [
          "<strong>Preconfiguración</strong> — elige un ejemplo (forma alg., módulo, argumento…).",
          "<strong>Tipo de pregunta</strong> — forma algebraica, módulo, argumento, conjugado, operaciones.",
          "<strong>Partes real e imaginaria</strong> a + bi.",
          "<strong>Instrucción</strong> — a través de « ✏️ Editor ».",
          "<strong>Feedback</strong> correcto / incorrecto."
        ],
        tip: "La respuesta es en sintaxis Maxima: %i para i, %pi para π."
      },
      calcul: {
        intro: "Cálculo diferencial e integral: derivada, primitiva, integral definida.",
        fields: [
          "<strong>Preconfiguración</strong> — elige una función tipo.",
          "<strong>Tipo de pregunta</strong> — derivada, primitiva, integral, valor numérico.",
          "<strong>Función f(x)</strong> en sintaxis Maxima.",
          "<strong>Límites a, b</strong> para la integral definida.",
          "<strong>Instrucción</strong> — a través de « ✏️ Editor ».",
          "<strong>Feedback</strong> correcto / incorrecto."
        ],
        tip: "Sintaxis Maxima: diff(x^3,x) = 3x², integrate(x^2,x,0,1) = 1/3."
      },
      statistiques: {
        intro: "Estadísticas: media, mediana, varianza, cuartiles, rango.",
        fields: [
          "<strong>Preconfiguración</strong> — elige un conjunto de datos tipo.",
          "<strong>Tipo de pregunta</strong> — media, mediana, varianza, desviación estándar, Q1, Q3, rango.",
          "<strong>Datos</strong> — lista de valores separados por comas.",
          "<span class='opt'>Frecuencias</span> — para la media ponderada.",
          "<strong>Instrucción</strong> — a través de « ✏️ Editor ».",
          "<strong>Feedback</strong> correcto / incorrecto."
        ]
      },
      matrices: {
        intro: "Álgebra lineal: producto de matrices, determinante, transpuesta, traza.",
        fields: [
          "<strong>Preconfiguración</strong> — elige una operación.",
          "<strong>Tipo de pregunta</strong> — producto, determinante, transpuesta, traza, inversa.",
          "<strong>Tamaño</strong> — matriz 2×2 o 3×3.",
          "<strong>Coeficientes</strong> — ingresa las entradas de la(s) matriz(es).",
          "<strong>Instrucción</strong> — a través de « ✏️ Editor ».",
          "<strong>Feedback</strong> correcto / incorrecto."
        ],
        tip: "La respuesta es en sintaxis Maxima: matrix([a,b],[c,d])."
      },
      geometrie: {
        intro: "Geometría analítica: distancia, punto medio, vectores, rectas, círculos.",
        fields: [
          "<strong>Preconfiguración</strong> — elige un ejemplo 2D o 3D.",
          "<strong>Tipo de pregunta</strong> — distancia, punto medio, norma, producto escalar, colinealidad.",
          "<strong>Puntos / vectores</strong> — coordenadas A, B, C.",
          "<strong>Instrucción</strong> — a través de « ✏️ Editor ».",
          "<strong>Feedback</strong> correcto / incorrecto."
        ]
      },
      suites: {
        intro: "Sucesiones numéricas: término general, suma, límite de una sucesión geométrica.",
        fields: [
          "<strong>Preconfiguración</strong> — elige una sucesión tipo.",
          "<strong>Tipo de pregunta</strong> — término, suma, límite, naturaleza.",
          "<strong>Parámetros</strong> u₀, r (o d), n según el escenario.",
          "<strong>Instrucción</strong> — a través de « ✏️ Editor ».",
          "<strong>Feedback</strong> correcto / incorrecto."
        ]
      },
      probabilites: {
        intro: "Probabilidades: combinaciones, distribución binomial, esperanza, probabilidad condicional.",
        fields: [
          "<strong>Preconfiguración</strong> — elige un ejemplo.",
          "<strong>Tipo de pregunta</strong> — combinación, P(X=k), E(X), Var(X), proba condicional.",
          "<strong>Parámetros</strong> n, k, p según la ley.",
          "<strong>Instrucción</strong> — a través de « ✏️ Editor ».",
          "<strong>Feedback</strong> correcto / incorrecto."
        ]
      },
      trigonometrie: {
        intro: "Trigonometría: valores exactos (sin/cos/tan), identidades, ecuaciones.",
        fields: [
          "<strong>Preconfiguración</strong> — elige un ángulo tipo (π/6, π/4, π/3…).",
          "<strong>Tipo de pregunta</strong> — valor exacto, identidad, ecuación trigonométrica.",
          "<strong>Ángulo θ</strong> — fracción de π en sintaxis Maxima (ej: %pi/6).",
          "<strong>Instrucción</strong> — a través de « ✏️ Editor ».",
          "<strong>Feedback</strong> correcto / incorrecto."
        ],
        tip: "Las respuestas son en forma exacta (fracciones de π) — sin decimales."
      },
      polynomes: {
        intro: "Trinomio de 2º grado ax²+bx+c: discriminante, raíces, fórmulas de Vieta.",
        fields: [
          "<strong>Preconfiguración</strong> — elige un trinomio tipo.",
          "<strong>Tipo de pregunta</strong> — discriminante Δ, raíces, suma/producto de las raíces, nº de raíces.",
          "<strong>Coeficientes a, b, c</strong> del trinomio.",
          "<strong>Instrucción</strong> — a través de « ✏️ Editor ».",
          "<strong>Feedback</strong> correcto / incorrecto."
        ],
        tip: "La vista previa calcula Δ y las raíces en tiempo real para verificación."
      },
      limites: {
        intro: "Límites de funciones: límite en el infinito, en un punto, formas indeterminadas.",
        fields: [
          "<strong>Preconfiguración</strong> — elige una función y un punto tipo.",
          "<strong>Tipo de límite</strong> — x→+∞, x→−∞, x→a, x→a⁺.",
          "<strong>Expresión f(x)</strong> en sintaxis Maxima.",
          "<strong>Respuesta esperada</strong> — ingresar el límite (inf, -inf, fracción, %pi…).",
          "<strong>Instrucción</strong> — a través de « ✏️ Editor ».",
          "<strong>Feedback</strong> correcto / incorrecto."
        ],
        tip: "La respuesta se ingresa manualmente ya que algunos límites requieren un juicio humano."
      },
      physique: {
        intro: "Mecánica clásica: MRUA, caída libre, energía cinética/potencial, Newton.",
        fields: [
          "<strong>Preconfiguración</strong> — elige un escenario físico.",
          "<strong>Tipo de pregunta</strong> — v(t), x(t), altura, tiempo, Ec, Ep, conservación Em, F=ma.",
          "<strong>Parámetros</strong> v₀, a, t, m, h según el escenario.",
          "<strong>Instrucción</strong> — a través de « ✏️ Editor ».",
          "<strong>Feedback</strong> correcto / incorrecto."
        ],
        tip: "El estudiante ingresa un número decimal; la tolerancia es del 1 % (NumRelative)."
      },
      inequation: {
        intro: "Inecuaciones: conjunto solución en notación de intervalo STACK (oo, cc, union…). AlgEquiv gestiona los intervalos.",
        fields: [
          "<strong>Preconfiguración</strong> — elige un ejemplo.",
          "<strong>Tipo</strong> — lineal (ax+b ▷ 0), trinomio (ax²+bx+c ▷ 0), valor absoluto.",
          "<strong>Operador</strong> — >, ≥, <, ≤.",
          "<strong>Coeficientes a, b, c</strong> según el tipo.",
          "<strong>Conjunto solución</strong> — auto-calculado; corregir si es necesario: <code>oo(2,inf)</code>, <code>cc(-2,2)</code>, <code>union(...)</code>.",
          "<strong>Instrucción</strong> — a través de « ✏️ Editor ».",
          "<strong>Feedback</strong> correcto / incorrecto."
        ],
        tip: "STACK acepta oo/oc/co/cc para los intervalos y union() para las uniones. Añadir inf y -inf para las semirrectas."
      }
    }
  };
})();