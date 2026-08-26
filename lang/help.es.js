/*
 * Cairn for Stack — générateur de questions STACK pour Moodle
 * Copyright (C) 2026  Benoit Joly
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

/* ════════════════════════════════════════════════════════════════
   CAIRN FOR STACK — CONTENIDO DE AYUDA: ESPAÑOL
   Solo datos (sin lógica). Para añadir un idioma de ayuda,
   copie este archivo (ej. help.en.js), traduzca los textos
   y termine con: window.HELP_LANG.en = HELP_CONTENT;
   ════════════════════════════════════════════════════════════════ */
(function(){
  "use strict";
function _hSection(title, html){ return `<h3 class="help-h">${title}</h3>${html}`; }
function _hList(items){ return '<ul class="help-ul">'+items.map(i=>`<li>${i}</li>`).join('')+'</ul>'; }

// Recordatorio común mostrado al final de cada ayuda (elementos compartidos por todos los módulos).
const _HELP_COMMON = `
  <div class="help-common">
    <strong>Recordatorios comunes para todos los módulos</strong>
    ${_hList([
      'Botón <b><svg class="hs-ico"><use href="#ico-type-composition"></use></svg> Editor</b>: abre el editor rico (negrita, colores, listas, imágenes, sonidos, tablas, enlaces).',
      'Para insertar una fórmula, haga clic en <b>∑ LaTeX</b> en el editor. En sintaxis bruta: <code>$ ... $</code> en línea, <code>$$ ... $$</code> centrado (ej.&nbsp;: <code>$\\frac{1}{2}$</code>).',
      '<b><svg class="hs-ico"><use href="#ico-tool-ai"></use></svg> Prompt IA</b> (cuando está presente): genera un texto para copiar en una IA y producir automáticamente el contenido de la pregunta.',
      '<b><svg class="hs-ico"><use href="#ico-file-import"></use></svg> / <svg class="hs-ico"><use href="#ico-file-export"></use></svg> JSON</b> (cuando están presentes): importar o exportar la configuración de la pregunta para reutilizarla.'
    ])}
  </div>`;

const HELP_CONTENT = {

  // ───────────────────────────────────────── CASILLAS DE VERIFICACIÓN
  checkbox: {
    title: '<svg class="hs-ico"><use href="#ico-type-checkbox"></use></svg> Casillas de verificación — Ayuda',
    body:
      _hSection('¿Para qué sirve?',
        '<p>Pregunta de opción múltiple con <b>respuestas múltiples</b>: el estudiante puede marcar varias casillas. La puntuación es <b>parcial automática</b> (cada casilla correcta/incorrecta cuenta).</p>') +
      _hSection('Cómo llenarlo', _hList([
        '<b>Enunciado</b>: la instrucción (ej. « Marque todas las proposiciones exactas »).',
        '<b>Número total de propuestas</b>: cuántas casillas serán visibles para el estudiante.',
        '<b>Nº de respuestas correctas</b>: <i>Fijo</i> (siempre el mismo número de verdaderas) o <i>Aleatorio</i>.',
        'Añada sus propuestas con <b>✅ + VERDADERO</b> y <b>❌ + FALSO</b>. Para cada una: un <b>Texto</b> (el texto mostrado) y un <b>Feedback</b> (explicación).'
      ])) +
      _hSection('Consejos / trampas', _hList([
        'Ponga <b>más propuestas</b> en las listas de las que se muestran: el sistema sacará al azar en cada intento → cada estudiante ve una variante.',
        'Verifique la advertencia naranja: indica un pool insuficiente para el sorteo solicitado.',
        'El texto acepta LaTeX (<code>$...$</code>) y formato.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── BOTONES DE RADIO
  radio: {
    title: '<svg class="hs-ico"><use href="#ico-type-radio"></use></svg> Botones de radio — Ayuda',
    body:
      _hSection('¿Para qué sirve?',
        '<p>Pregunta de opción múltiple con <b>respuesta única</b>: una sola respuesta correcta, presentada en forma de botones de radio.</p>') +
      _hSection('Cómo llenarlo', _hList([
        '<b>Enunciado</b>: la instrucción.',
        '<b>Nº total de botones mostrados</b>: 1 respuesta correcta + distractores.',
        'Rellene el <b>Pool VERDADERO</b> (respuestas correctas) y el <b>Pool FALSO</b> (distractores).'
      ])) +
      _hSection('Funcionamiento del sorteo', _hList([
        '1 respuesta correcta se saca <b>al azar</b> del pool VERDADERO.',
        'Los otros botones son distractores sacados del pool FALSO.',
        'Se necesita como mínimo <b>1 VERDADERO</b> y <b>(nº mostrados − 1) FALSO</b>.'
      ])) +
      _hSection('Consejo',
        '<p>¿Varias respuestas correctas posibles en el pool VERDADERO? El sistema elige una por intento: ideal para variar las preguntas.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── MENÚ DESPLEGABLE
  dropdown: {
    title: '<svg class="hs-ico"><use href="#ico-type-dropdown"></use></svg> Menú desplegable — Ayuda',
    body:
      _hSection('¿Para qué sirve?',
        '<p>Idéntico al botón de radio (una sola respuesta correcta), pero presentado en forma de <b>lista desplegable</b>. Práctico para insertar una respuesta en medio de una frase.</p>') +
      _hSection('Cómo llenarlo', _hList([
        '<b>Enunciado</b> + <b>Nº de propuestas mostradas</b>.',
        '<b>Pool VERDADERO</b>: la(s) respuesta(s) correcta(s). <b>Pool FALSO</b>: los distractores.',
        'Mínimo requerido: 1 VERDADERO y (nº total − 1) FALSO.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── ALGEBRAICO
  algebraic: {
    title: '<svg class="hs-ico"><use href="#ico-type-algebraic"></use></svg> Algebraico — Ayuda',
    body:
      _hSection('¿Para qué sirve?',
        '<p>El estudiante introduce una <b>expresión matemática</b>. STACK verifica la equivalencia algebraica (ej. <code>2*x+y</code> = <code>y+2*x</code>), no la escritura exacta.</p>') +
      _hSection('Cómo llenarlo', _hList([
        '<b>Variables</b>: liste las utilizadas, separadas por comas (ej. <code>x, y</code>).',
        '<b>Respuesta esperada</b>: la fórmula correcta. El botón <b><svg class="hs-ico"><use href="#ico-tool-keyboard"></use></svg> Ayuda de entrada</b> abre un teclado para escribirla sin errores.',
        'Pestaña <b><svg class="hs-ico"><use href="#ico-tool-help-student"></use></svg> Ayuda estudiante</b>: marque las instrucciones a mostrar (punto decimal, potencias de 10…) y el teclado virtual.',
        'Pestaña <b>💡 Solución</b>: redacte la corrección detallada.'
      ])) +
      _hSection('Sintaxis a respetar', _hList([
        'Multiplicación explícita: escriba <code>2*x</code>, nunca <code>2x</code> (de lo contrario « 2x » se lee como una sola variable).',
        'Potencias con <code>^</code> (ej. <code>x^2</code>), decimales con un punto (ej. <code>1.5</code>).',
        'Potencias de 10: <code>1e6</code> o <code>10^6</code>.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── NUMÉRICO
  numerical: {
    title: '<svg class="hs-ico"><use href="#ico-type-numeric"></use></svg> Aritmética (Numérico) — Ayuda',
    body:
      _hSection('¿Para qué sirve?',
        '<p>El estudiante introduce un <b>valor numérico</b>. STACK compara con un valor objetivo con una tolerancia.</p>') +
      _hSection('Cómo llenarlo', _hList([
        '<b>Valor objetivo</b>: la respuesta correcta (punto para los decimales).',
        '<b>Redondeo auto</b>: si « Sí », fije el número de <b>cifras significativas</b> conservadas.',
        '<b>Tipo de tolerancia</b>: <i>Relativa</i> (% del valor) o <i>Absoluta</i> (diferencia fija).',
        '<b>Margen de error</b>: ej. <code>0.05</code> = 5 % en relativo.',
        '<b>Float permitido</b>: aceptar o no números con coma.'
      ])) +
      _hSection('Consejo',
        '<p>Para una medida física, prefiera la tolerancia <b>relativa</b> (ej. 2 %) para aceptar redondeos razonables.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── UNIDAD
  units: {
    title: '<svg class="hs-ico"><use href="#ico-type-units"></use></svg> Unidad — Ayuda',
    body:
      _hSection('¿Para qué sirve?',
        '<p>El estudiante debe dar un <b>valor Y su unidad</b> (ej. <code>9.81 m/s^2</code>). STACK verifica el número (tolerancia relativa) y la unidad física.</p>') +
      _hSection('Cómo llenarlo', _hList([
        '<b>Valor numérico</b> + <b>Unidad Maxima</b> (sintaxis: <code>m/s^2</code>, <code>N</code>, <code>Pa</code>, <code>J/(kg*K)</code>…).',
        '<b>Tolerancia relativa</b> (ej. 0.05 = 5 %) y <b>cifras significativas mínimas</b>.',
        'Pestaña <b><svg class="hs-ico"><use href="#ico-tool-help-student"></use></svg> Ayuda estudiante</b>: muestre la lista de unidades habituales y las reglas de escritura.'
      ])) +
      _hSection('Escritura de las unidades', _hList([
        'Una número y unidad con <code>*</code> en el lado del estudiante (ej. <code>10*m</code>).',
        'Unidades compuestas: <code>J/(kg*K)</code> o <code>J*kg^(-1)*K^(-1)</code>.',
        'Habituales: <code>m, kg, g, N, J, W, Pa, V, A, Ohm, s, h, K, degC</code>.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── STRING
  string: {
    title: '<svg class="hs-ico"><use href="#ico-type-string"></use></svg> Respuesta de texto (String) — Ayuda',
    body:
      _hSection('¿Para qué sirve?',
        '<p>El estudiante escribe una <b>palabra o una expresión corta</b> (ej. « Newton »). La comparación es textual.</p>') +
      _hSection('Cómo llenarlo', _hList([
        '<b>Respuesta esperada</b>: el texto exacto correcto.',
        '<b>Tamaño del campo</b>: ancho del campo de entrada.',
        '<b>Tolerancia</b>: <i>StringSloppy</i> (ignora mayúsculas/espacios — recomendado) o <i>String</i> (exactitud absoluta).',
        'Opción <b><svg class="hs-ico"><use href="#ico-tool-palette"></use></svg> Ayuda de entrada</b>: añada paletas de botones (fracciones, operadores, letras griegas…) para ayudar al estudiante.'
      ])) +
      _hSection('Trampa',
        '<p>El modo estricto rechaza la menor diferencia de mayúsculas o acentos. En caso de duda, use <b>StringSloppy</b>.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── MATCH (RELACIONAR)
  match: {
    title: '<svg class="hs-ico"><use href="#ico-type-match"></use></svg> Relacionar (Matching) — Ayuda',
    body:
      _hSection('¿Para qué sirve?',
        '<p>El estudiante relaciona los elementos de la <b>columna A</b> con los de la <b>columna B</b>.</p>') +
      _hSection('Cómo llenarlo', _hList([
        '<b>Enunciado</b>: la instrucción.',
        'Añada los elementos de las dos columnas con <b>+ Añadir</b> (cada elemento acepta texto, LaTeX, imagen).',
        'En <b>« Crear las relaciones esperadas »</b>: haga clic en un elemento a la <b>izquierda</b> y luego en su correspondiente a la <b>derecha</b> para crear el par correcto.',
        'Las relaciones creadas aparecen abajo; « <svg class="hs-ico"><use href="#ico-action-delete"></use></svg> Borrar todo » reinicia.'
      ])) +
      _hSection('Bueno saber',
        '<p>La visualización interactiva (líneas para trazar) solo aparece en Moodle, durante el intento del estudiante.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── CRUCIGRAMA
  crossword: {
    title: '<svg class="hs-ico"><use href="#ico-type-crossword"></use></svg> Crucigrama — Ayuda',
    body:
      _hSection('¿Para qué sirve?',
        '<p>Genera una cuadrícula de crucigrama a partir de una lista de <b>palabras + definiciones</b>.</p>') +
      _hSection('Cómo llenarlo', _hList([
        '<b>Palabras a utilizar</b>: deje vacío para tomar todas, o indique un número para sacar un subconjunto al azar.',
        'Añada cada entrada con <b>+ Añadir una palabra</b>: la <b>Palabra</b> (la respuesta) y su <b>Definición</b> (la pista).',
        'Haga clic en <b>Generar la cuadrícula</b> para verificar la disposición antes de validar.'
      ])) +
      _hSection('Consejos', _hList([
        'Priorice palabras que compartan letras: la cuadrícula será más compacta.',
        'Evite espacios y caracteres especiales en las palabras.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── DOI
  doi: {
    title: '<svg class="hs-ico"><use href="#ico-type-doi"></use></svg> Diagrama Objeto-Interacción — Ayuda',
    body:
      _hSection('¿Para qué sirve?',
        '<p>El estudiante identifica los objetos en interacción con un <b>objeto de estudio central</b> (sistema físico).</p>') +
      _hSection('Cómo llenarlo', _hList([
        '<b>Objeto de estudio</b>: el sistema en el centro (ej. « Esquiador »).',
        '<b>Objetos e Interacciones</b>: añada cada objeto exterior y el tipo de interacción esperado.',
        '<b>Zonas azules vacías (extra)</b>: añade ubicaciones señuelo para no dar el número exacto de interacciones.',
        'La vista previa (canvas) muestra el diagrama tal como será generado.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── ECUACIÓN QUÍMICA
  chemical: {
    title: '<svg class="hs-ico"><use href="#ico-type-chemistry"></use></svg> Ecuación química — Ayuda',
    body:
      _hSection('¿Para qué sirve?',
        '<p>El estudiante escribe/equilibra una <b>ecuación química</b>. El sistema verifica el equilibrio.</p>') +
      _hSection('Cómo llenarlo', _hList([
        '<b>Enunciado</b> (opcional): la instrucción.',
        'Ingrese la ecuación modelo en el editor. Barra de herramientas: <b>índice</b> (x₂), <b>exponente</b> (xⁿ), flechas <b>→</b>, <b>⇌</b>, <b>↔</b>.',
        '<b><svg class="hs-ico"><use href="#ico-action-refresh"></use></svg> Actualizar la vista previa</b> para visualizar el resultado.',
        '<b>Tipo de reacción</b> y <b>grupo funcional esperado</b> precisan la corrección.'
      ])) +
      _hSection('Consejo',
        '<p>Indique los coeficientes (ej. <code>2 O₂</code>): el equilibrio depende de ello.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── QUÍMICA TOPOLOGICA
  chemical_topo: {
    title: '<svg class="hs-ico"><use href="#ico-type-chemical_topo"></use></svg> Química topológica — Ayuda',
    body:
      _hSection('¿Para qué sirve?',
        '<p>Reacciones con <b>estructuras topológicas</b> (notación SMILES o fórmula). Permite el dibujo de moléculas.</p>') +
      _hSection('Cómo llenarlo', _hList([
        '<b>Enunciado</b>: la instrucción.',
        '<b>Ecuación</b>: escriba en SMILES/fórmula, o haga clic en <b><svg class="hs-ico"><use href="#ico-tool-structure"></use></svg> Dibujar (JSME)</b> para construirla visualmente.',
        '<b><svg class="hs-ico"><use href="#ico-action-refresh"></use></svg> Actualizar</b> muestra la vista previa de la reacción.'
      ])) +
      _hSection('Scoring PRT (avanzado)', _hList([
        'La puntuación se distribuye entre varios criterios: flecha (PRT1), átomos (N0), cargas (N1), fórmulas (N2), coeficientes (N4).',
        'La suma <b>PRT1 + N0 + N1 + N2 + N4 debe ser 100 %</b> (los nodos 3 y 5 son de respaldo).',
        'El banner muestra « Suma = 100 % » cuando la distribución es correcta.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── NUCLEAR
  nuclear: {
    title: '<svg class="hs-ico"><use href="#ico-type-nuclear"></use></svg> Reacciones nucleares — Ayuda',
    body:
      _hSection('¿Para qué sirve?',
        '<p>El estudiante completa/escribe una <b>reacción nuclear</b> con la notación de isótopos.</p>') +
      _hSection('Cómo llenarlo', _hList([
        '<b>Enunciado</b>: la instrucción.',
        'Construya la reacción con la barra de herramientas: <b>isótopo</b> <code>{}^{A}_{Z}X</code>, operadores <b>+</b> y <b>→</b>, partículas <b>α</b>, <b>β⁻</b>, <b>β⁺</b>, <b>γ</b>.',
        '<b><svg class="hs-ico"><use href="#ico-action-refresh"></use></svg> Vista previa</b> para verificar el resultado, <b><svg class="hs-ico"><use href="#ico-action-delete"></use></svg> Vaciar</b> para empezar de nuevo.'
      ])) +
      _hSection('Consejo',
        '<p>Verifique la conservación: la suma de los números de masa (A) y de los números atómicos (Z) debe ser idéntica a cada lado de la flecha.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── REDACCIÓN LIBRE
  composition: {
    title: '<svg class="hs-ico"><use href="#ico-type-composition"></use></svg> Redacción libre — Ayuda',
    body:
      _hSection('¿Para qué sirve?',
        '<p>Pregunta de <b>respuesta libre redactada</b> (texto, fórmulas, formato). <b>No corregida automáticamente</b>: es el profesor quien califica en Moodle.</p>') +
      _hSection('Cómo llenarlo', _hList([
        '<b>Enunciado</b>: la pregunta planteada (imágenes, LaTeX, tablas posibles).',
        '<b>¿Sobre cuántos puntos?</b>: informa al estudiante del peso de la pregunta.',
        '<b>Tamaño del editor del estudiante</b>: según la longitud de respuesta esperada.',
        '<b>Mensaje bajo el editor</b>: instrucción mostrada al estudiante.'
      ])) +
      _hSection('Recordatorio',
        '<p>STACK no evalúa esta pregunta: prevea la corrección manual.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── INECUACIONES
  inequation: {
    title: '<svg class="hs-ico"><use href="#ico-type-inequation"></use></svg> Inecuaciones — Ayuda',
    body:
      _hSection('¿Para qué sirve?',
        '<p>El estudiante resuelve una <b>inecuación</b> (lineal, trinomio de 2º grado o valor absoluto) e introduce el <b>conjunto-solución</b> en notación de intervalo STACK. AlgEquiv verifica la equivalencia.</p>') +
      _hSection('Cómo llenarlo', _hList([
        '<b>Preconfiguración</b>: elija un ejemplo común.',
        '<b>Tipo</b>: lineal <code>ax+b ▷ 0</code>, trinomio <code>ax²+bx+c ▷ 0</code>, valor absoluto <code>|ax+b| ▷ c</code>.',
        '<b>Operador</b>: >, ≥, &lt;, ≤.',
        '<b>Coeficientes a, b, c</b> según el tipo elegido.',
        '<b>Conjunto-solución</b>: auto-calculado en la mayoría de los casos; corrija si la vista previa es insuficiente.',
        '<b>Instrucción</b>: a través de « ✏️ Editor ».',
        '<b>Feedback</b> correcto / incorrecto.'
      ])) +
      _hSection('Notación STACK de intervalos', _hList([
        '<code>oo(a,b)</code> = ]a ; b[ (abierto en ambos lados).',
        '<code>oc(a,b)</code> = ]a ; b] (cerrado a la derecha).',
        '<code>co(a,b)</code> = [a ; b[ (cerrado a la izquierda).',
        '<code>cc(a,b)</code> = [a ; b] (cerrado en ambos lados).',
        '<code>union(A,B)</code> = A ∪ B (para dos intervalos disjuntos).',
        '<code>inf</code> = +∞, <code>-inf</code> = −∞.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── BASE N
  basen: {
    title: '<svg class="hs-ico"><use href="#ico-type-basen"></use></svg> Conversión Base N — Ayuda',
    body:
      _hSection('¿Para qué sirve?',
        '<p>El estudiante <b>convierte un número</b> entre diferentes bases (binario, octal, decimal, hexadecimal). STACK verifica la igualdad algebraica de la respuesta.</p>') +
      _hSection('Cómo llenarlo', _hList([
        '<b>Preconfiguración</b>: elija un ejemplo común para rellenar los campos automáticamente.',
        '<b>Tipo de pregunta</b>: conversión directa, valor de un bit, representación en base objetivo.',
        '<b>Número fuente</b> + <b>base fuente</b> (ej : 1010 en base 2).',
        '<b>Base objetivo</b>: la base hacia la cual el estudiante debe convertir.',
        '<b>La vista previa</b> calcula automáticamente la respuesta correcta.'
      ])) +
      _hSection('Consejo',
        '<p>Hexadecimal: las letras A–F representan 10–15. Verifique que el estudiante sepa que puede responder en notación decimal o hexa según la pregunta.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── CIRCUITOS ELÉCTRICOS
  circuit: {
    title: '<svg class="hs-ico"><use href="#ico-type-circuit"></use></svg> Circuitos eléctricos — Ayuda',
    body:
      _hSection('¿Para qué sirve?',
        '<p>Leyes de los circuitos eléctricos: <b>Ley de Ohm</b>, asociaciones <b>serie / paralelo</b>, intensidad, potencia. La respuesta numérica es verificada por STACK (NumRelative, 1 %).</p>') +
      _hSection('Cómo llenarlo', _hList([
        '<b>Preconfiguración</b>: elija un escenario de circuito tipo.',
        '<b>Tipo de pregunta</b>: ley de Ohm, resistencia serie/paralelo, intensidad, potencia…',
        '<b>Parámetros</b>: ingrese U (V), I (A), R (Ω), P (W) según el escenario.',
        '<b>La vista previa</b> muestra la fórmula y el resultado esperado.',
        '<b>Instrucción</b> (opcional): personalice el enunciado a través del editor.'
      ])) +
      _hSection('Consejo',
        '<p>La tolerancia es del 1 %: un cálculo detenido en 2 decimales es aceptado.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── LÓGICA BOOLEANA
  logique: {
    title: '<svg class="hs-ico"><use href="#ico-type-logique"></use></svg> Lógica booleana — Ayuda',
    body:
      _hSection('¿Para qué sirve?',
        '<p>Preguntas sobre las <b>tablas de verdad</b>, la <b>simplificación</b> de expresiones y las <b>equivalencias lógicas</b>. STACK usa PropLogic para la verificación.</p>') +
      _hSection('Cómo llenarlo', _hList([
        '<b>Preconfiguración</b>: elija un operador o una ley tipo (De Morgan, XOR…).',
        '<b>Tipo de pregunta</b>: tabla de verdad (una celda), simplificación, equivalencia.',
        '<b>Expresión booleana</b>: notación <code>A and B</code>, <code>not A</code>, <code>A xor B</code>, <code>A implies B</code>.',
        '<b>La vista previa</b> muestra la tabla de verdad completa y el valor esperado.'
      ])) +
      _hSection('Consejo',
        '<p>Para una pregunta de tabla: elija una fila precisa de la tabla (valoración A=1, B=0 por ejemplo). La respuesta es entonces 0 o 1.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── NÚMEROS COMPLEJOS
  complexe: {
    title: '<svg class="hs-ico"><use href="#ico-type-complexe"></use></svg> Números complejos — Ayuda',
    body:
      _hSection('¿Para qué sirve?',
        '<p>Preguntas sobre la <b>forma algebraica</b>, el <b>módulo</b>, el <b>argumento</b> y el <b>conjugado</b> de un número complejo. STACK verifica la equivalencia algebraica.</p>') +
      _hSection('Cómo llenarlo', _hList([
        '<b>Preconfiguración</b>: elija una operación tipo.',
        '<b>Partes real (a) e imaginaria (b)</b> del número z = a + bi.',
        '<b>Tipo de pregunta</b>: forma algebraica, módulo, argumento, conjugado, suma/producto.',
        '<b>La vista previa</b> muestra la respuesta en sintaxis Maxima.'
      ])) +
      _hSection('Sintaxis Maxima', _hList([
        '<code>%i</code> representa i (unidad imaginaria).',
        '<code>abs(z)</code> da el módulo, <code>carg(z)</code> el argumento.',
        'Argumento en fracción de π: <code>%pi/4</code>, <code>3*%pi/4</code>…'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── CÁLCULO DIFERENCIAL
  calcul: {
    title: '<svg class="hs-ico"><use href="#ico-type-calcul"></use></svg> Cálculo diferencial e integral — Ayuda',
    body:
      _hSection('¿Para qué sirve?',
        '<p>Preguntas sobre las <b>derivadas</b>, <b>primitivas</b> e <b>integrales definidas</b>. STACK usa <code>Diff</code> (derivada) o <code>Antidiff</code> (primitiva) o <code>AlgEquiv</code> (valor numérico).</p>') +
      _hSection('Cómo llenarlo', _hList([
        '<b>Preconfiguración</b>: elija una función tipo (polinomio, sin, exp, ln…).',
        '<b>Tipo de pregunta</b>: derivada, primitiva, integral definida, valor numérico.',
        '<b>Función f(x)</b>: sintaxis Maxima — ej : <code>x^3+2*x</code>, <code>sin(x)</code>, <code>exp(x)</code>.',
        '<b>Límites a, b</b>: para la integral definida ∫[a,b] f(x) dx.',
        '<b>La vista previa</b> muestra la respuesta calculada en el lado del profesor.'
      ])) +
      _hSection('Sintaxis Maxima', _hList([
        'Derivada: <code>diff(f,x)</code>, Primitiva: <code>integrate(f,x)</code>.',
        'Integral definida: <code>integrate(f,x,a,b)</code>.',
        'Logaritmo natural: <code>log(x)</code> (no ln).'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── ESTADÍSTICAS
  statistiques: {
    title: '<svg class="hs-ico"><use href="#ico-type-statistiques"></use></svg> Estadísticas — Ayuda',
    body:
      _hSection('¿Para qué sirve?',
        '<p>Cálculos estadísticos sobre una serie: <b>media</b>, <b>mediana</b>, <b>varianza</b>, <b>desviación estándar</b>, <b>cuartiles</b>, <b>rango</b>. STACK verifica el valor numérico (AlgEquiv).</p>') +
      _hSection('Cómo llenarlo', _hList([
        '<b>Preconfiguración</b>: elija un conjunto de datos tipo.',
        '<b>Tipo de pregunta</b>: media, mediana, varianza, desviación estándar, Q1, Q3, rango, media ponderada.',
        '<b>Datos</b>: lista de valores separados por comas (ej : <code>3, 7, 2, 9, 5</code>).',
        '<b>Frecuencias</b>: para la media ponderada (misma cantidad de valores que los datos).',
        '<b>La vista previa</b> calcula la respuesta esperada.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── MATRICES
  matrices: {
    title: '<svg class="hs-ico"><use href="#ico-type-matrices"></use></svg> Matrices — Ayuda',
    body:
      _hSection('¿Para qué sirve?',
        '<p>Cálculos de <b>álgebra lineal</b>: producto de matrices, determinante, transpuesta, traza. STACK acepta la notación <code>matrix([a,b],[c,d])</code>.</p>') +
      _hSection('Cómo llenarlo', _hList([
        '<b>Preconfiguración</b>: elija una operación (producto, determinante…).',
        '<b>Tipo de pregunta</b>: producto A×B, determinante, transpuesta, traza, inversa.',
        '<b>Tamaño</b>: 2×2 o 3×3.',
        '<b>Coeficientes de las matrices A y B</b>: ingrese cada entrada.',
        '<b>La vista previa</b> calcula y muestra la matriz resultado en sintaxis Maxima.'
      ])) +
      _hSection('Sintaxis respuesta estudiante',
        '<p>El estudiante ingresa: <code>matrix([1,2],[3,4])</code> para una matriz 2×2.<br>La palabra clave <code>matrix</code> está permitida en STACK (<code>allowwords</code>).</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── GEOMETRÍA
  geometrie: {
    title: '<svg class="hs-ico"><use href="#ico-type-geometrie"></use></svg> Geometría analítica — Ayuda',
    body:
      _hSection('¿Para qué sirve?',
        '<p>Preguntas de <b>geometría 2D / 3D</b>: distancia, punto medio, norma de vector, producto escalar, colinealidad. STACK verifica con AlgEquiv (acepta <code>sqrt(n)</code>).</p>') +
      _hSection('Cómo llenarlo', _hList([
        '<b>Preconfiguración</b>: elija un ejemplo (distancia AB, punto medio, vector AB…).',
        '<b>Tipo de pregunta</b>: distancia, punto medio, norma, producto escalar, colinealidad, 3D.',
        '<b>Coordenadas</b> de los puntos A, B, C (campos x, y, z según la dimensión).',
        '<b>La vista previa</b> muestra el valor exacto en sintaxis Maxima.'
      ])) +
      _hSection('Consejo',
        '<p>Las distancias se expresan con <code>sqrt(n)</code> cuando no son enteras. AlgEquiv reconoce <code>sqrt(25)=5</code>.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── SUCESIONES
  suites: {
    title: '<svg class="hs-ico"><use href="#ico-type-suites"></use></svg> Sucesiones numéricas — Ayuda',
    body:
      _hSection('¿Para qué sirve?',
        '<p>Preguntas sobre las <b>sucesiones aritméticas</b> y <b>geométricas</b>: término general, suma de los n primeros términos, límite. STACK verifica con AlgEquiv.</p>') +
      _hSection('Cómo llenarlo', _hList([
        '<b>Preconfiguración</b>: elija una sucesión tipo.',
        '<b>Tipo de pregunta</b>: término u(n), suma S(n), límite, naturaleza de la sucesión.',
        '<b>u₀ (primer término)</b> y <b>r o d (razón/diferencia)</b>.',
        '<b>Rango n</b> para los términos y sumas (entero ≥ 0).',
        '<b>La vista previa</b> calcula y muestra la respuesta esperada.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── PROBABILIDADES
  probabilites: {
    title: '<svg class="hs-ico"><use href="#ico-type-probabilites"></use></svg> Probabilidades — Ayuda',
    body:
      _hSection('¿Para qué sirve?',
        '<p>Preguntas de <b>probabilidades</b>: combinaciones, distribución binomial (P(X=k), E(X), Var(X)), probabilidad condicional, unión. STACK verifica con AlgEquiv.</p>') +
      _hSection('Cómo llenarlo', _hList([
        '<b>Preconfiguración</b>: elija un escenario probabilístico.',
        '<b>Tipo de pregunta</b>: C(n,k), P(X=k), E(X), Var(X), P(A|B), P(A∪B).',
        '<b>Parámetros</b>: n, k (enteros) y p (probabilidad, 0–1) según la ley.',
        '<b>Probabilidades P(A), P(B), P(A∩B)</b> para los eventos compuestos.',
        '<b>La vista previa</b> calcula la respuesta exacta (fracción si es posible).'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── TRIGONOMETRÍA
  trigonometrie: {
    title: '<svg class="hs-ico"><use href="#ico-type-trigonometrie"></use></svg> Trigonometría — Ayuda',
    body:
      _hSection('¿Para qué sirve?',
        '<p>Preguntas sobre los <b>valores exactos</b> (sin, cos, tan), las <b>identidades trigonométricas</b> y la resolución de <b>ecuaciones</b>. STACK fuerza las respuestas exactas (<code>forbidfloat</code>).</p>') +
      _hSection('Cómo llenarlo', _hList([
        '<b>Preconfiguración</b>: elija un ángulo tipo (π/6, π/4, π/3, π/2…).',
        '<b>Tipo de pregunta</b>: valor exacto de sin/cos/tan, identidad, ecuación trig.',
        '<b>Ángulo θ</b>: en sintaxis Maxima — ej : <code>%pi/6</code>, <code>%pi/4</code>, <code>2*%pi/3</code>.',
        '<b>La vista previa</b> muestra el valor exacto y su correspondencia Maxima.'
      ])) +
      _hSection('Consejo',
        '<p>Los decimales están <b>prohibidos</b>: el estudiante debe responder en fracciones o radicales (<code>sqrt(3)/2</code>).</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── POLINOMIOS
  polynomes: {
    title: '<svg class="hs-ico"><use href="#ico-type-polynomes"></use></svg> Polinomios de 2º grado — Ayuda',
    body:
      _hSection('¿Para qué sirve?',
        '<p>Preguntas sobre el <b>trinomio ax²+bx+c</b>: discriminante, raíces, fórmulas de Vieta, número de raíces reales. STACK verifica con AlgEquiv.</p>') +
      _hSection('Cómo llenarlo', _hList([
        '<b>Preconfiguración</b>: elija un trinomio tipo.',
        '<b>Tipo de pregunta</b>: discriminante Δ, raíces x₁/x₂, suma x₁+x₂, producto x₁×x₂, nº de raíces.',
        '<b>Coeficientes a, b, c</b> del trinomio (enteros o decimales).',
        '<b>La vista previa</b> calcula Δ y las raíces en tiempo real.'
      ])) +
      _hSection('Fórmulas de Vieta',
        '<p>x₁+x₂ = −b/a y x₁×x₂ = c/a (sin calcular las raíces explícitamente).</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── LÍMITES
  limites: {
    title: '<svg class="hs-ico"><use href="#ico-type-limites"></use></svg> Límites de funciones — Ayuda',
    body:
      _hSection('¿Para qué sirve?',
        '<p>Preguntas sobre los <b>límites</b>: en el infinito, en un punto, formas indeterminadas. STACK verifica con AlgEquiv. <b>La respuesta esperada se introduce manualmente</b> por el docente.</p>') +
      _hSection('Cómo llenarlo', _hList([
        '<b>Preconfiguración</b>: elija una función y un punto tipo.',
        '<b>Tipo de límite</b>: x→+∞, x→−∞, x→a (finito), x→a⁺.',
        '<b>Expresión f(x)</b>: sintaxis Maxima — ej : <code>(x^2-1)/(x-1)</code>, <code>sin(x)/x</code>.',
        '<b>Respuesta esperada</b>: introducirla explícitamente (<code>inf</code>, <code>-inf</code>, <code>2</code>, <code>%pi</code>…).',
        '<b>La vista previa</b> muestra la fórmula sin calcularla automáticamente.'
      ])) +
      _hSection('Valores especiales Maxima', _hList([
        '<code>inf</code> → +∞, <code>minf</code> → −∞.',
        '<code>%pi</code> → π, <code>1/2</code> → ½.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── FÍSICA
  physique: {
    title: '<svg class="hs-ico"><use href="#ico-type-physique"></use></svg> Física — Mecánica — Ayuda',
    body:
      _hSection('¿Para qué sirve?',
        '<p>Cálculos de <b>mecánica clásica</b>: MRUA, caída libre, energía cinética/potencial, conservación de la energía mecánica, 2ª ley de Newton. Respuesta numérica verificada con tolerancia 1 % (NumRelative).</p>') +
      _hSection('Cómo llenarlo', _hList([
        '<b>Preconfiguración</b>: elija un escenario físico tipo.',
        '<b>Tipo de pregunta</b>: v(t), x(t), altura h, tiempo t, Ec = ½mv², Ep = mgh, v final (Em conservada), F = ma.',
        '<b>Parámetros cinemáticos</b>: v₀ (m/s), a (m/s²), t (s).',
        '<b>Parámetros mecánicos</b>: m (kg), h o v (m o m/s).',
        '<b>La vista previa</b> muestra la fórmula y el resultado numérico.'
      ])) +
      _hSection('Consejo',
        '<p>g = 9.81 m/s² está codificado por defecto. Para ejercicios de caída libre, solo t y h son pertinentes; los campos no utilizados se ocultan automáticamente.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── OSCILOSCOPIO
  oscilloscope: {
    title: '<svg class="hs-ico"><use href="#ico-type-oscilloscope"></use></svg> Osciloscopio — Ayuda',
    body:
      _hSection('¿Para qué sirve?',
        '<p>Simulación de un <b>osciloscopio interactivo</b>: el estudiante ajusta la base de tiempo (Δt, violeta) y la sensibilidad vertical (ΔV, rojo) con controles deslizantes, y luego mide una magnitud física (período, frecuencia, constante de tiempo RC, retardo…) en el oscilograma.</p>') +
      _hSection('Cómo llenarlo', _hList([
        '<b>Tipo de medida</b>: Período/Frecuencia, Carga RC, Descarga RC, o Retardo entre 2 canales (ultrasonidos).',
        '<b>Modo pedagógico</b>: <b>Guiado</b> detalla cada paso (unidad, valor, trampas de confusión); <b>Autónomo</b> verifica cada magnitud con un feedback genérico; <b>Experto</b> no da ninguna pista, solo cuenta el resultado. Este ajuste no cambia la dificultad del oscilograma, solo el nivel de detalle de los feedbacks.',
        'Según el tipo elegido, aparecen parámetros específicos: forma de la señal y frecuencia (fija o aleatoria) para Período/Frecuencia; E y τ para Carga/Descarga RC; frecuencias portadora/ráfaga y Δt min-max para Retardo.',
        '<b>Ajustes iniciales del osciloscopio</b> (base de tiempo SH, sensibilidad SV): marque <b>Auto</b> para una calibración automática coherente con la señal, o desmárquela para elegir manualmente un valor de la lista.'
      ])) +
      _hSection('Consejo',
        '<p>El modo Guiado se recomienda para un primer uso en clase: señala explícitamente las trampas de confusión (ej. confundir medio período y período). Pase a Experto para una evaluación sumativa.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── INTERFERENCIAS-DIFRACCIÓN
  diffraction: {
    title: '<svg class="hs-ico"><use href="#ico-type-diffraction"></use></svg> Interferencias-Difracción — Ayuda',
    body:
      _hSection('¿Para qué sirve?',
        '<p>El estudiante observa un <b>patrón de difracción/interferencias</b> (rendija simple, doble rendija, agujeros de Young, agujero circular, agujero cuadrado) y deduce una magnitud física (ancho de rendija, longitud de onda…) a partir de medidas en el patrón.</p>') +
      _hSection('Cómo llenarlo', _hList([
        '<b>Tipo</b>: forma de la abertura (rendija simple, doble rendija, agujeros de Young, agujero circular, agujero cuadrado).',
        '<b>Modo</b>: <b>Pantalla</b> (el estudiante mide directamente en el patrón proyectado) o <b>Sensor</b> (patrón acompañado de una curva de intensidad luminosa).',
        '<b>Parámetros aleatorios (a, D, b)</b>: marque para un sorteo aleatorio en cada pregunta, o desmarque para fijar manualmente el ancho de rendija a, la distancia a la pantalla D, la separación de los agujeros b y la longitud de onda λ.',
        '<b>Tolerancia relativa (%)</b>: margen de error aceptado en la respuesta numérica (ej. 10 % acepta 632 nm para un valor esperado de 635 nm).',
        '<b>Instrucción</b>: redacte la pregunta planteada al estudiante, ej. « Mida la distancia con el retículo y deduzca λ ».'
      ])) +
      _hSection('Consejo',
        '<p>El campo Separación b solo aparece para los patrones de dos aberturas (doble rendija, agujeros de Young) — se oculta automáticamente para rendija simple/agujero circular/agujero cuadrado.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── ORDENAMIENTO
  ord: {
    title: '<svg class="hs-ico"><use href="#ico-type-ord"></use></svg> Ordenamiento — Ayuda',
    body:
      _hSection('¿Para qué sirve?',
        '<p>El estudiante <b>reordena elementos en el orden correcto</b> arrastrando y soltando (bloques Parsons de STACK). Ideal para algoritmos, cronologías, pasos de razonamiento o secuencias de código.</p>') +
      _hSection('Cómo llenarlo', _hList([
        '<b>Enunciado</b>: redacte la instrucción (HTML/LaTeX aceptado).',
        '<b>＋ Añadir un elemento</b>: cada línea es un elemento de la secuencia a ordenar. El orden de entrada es el orden correcto.',
        '<b>Elementos reutilizables (clon)</b>: marque si un mismo elemento puede aparecer varias veces en la respuesta.',
        'Los elementos se presentan al estudiante en un <b>orden mezclado aleatoriamente</b> por STACK.'
      ])) +
      _hSection('Consejo',
        '<p>Redacte cada elemento de manera autónoma y no ambigua. Evite las formulaciones "luego…" o "después…" que revelan el orden.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── IMAGEN CLICABLE
  imgclick: {
    title: '<svg class="hs-ico"><use href="#ico-type-imgclick"></use></svg> Selección en imagen — Ayuda',
    body:
      _hSection('¿Para qué sirve?',
        '<p>El estudiante <b>hace clic en la zona correcta de una imagen</b> (diagrama de biología, mapa geográfico, diagrama físico…). La zona de respuesta permanece <b>invisible</b> para el estudiante.</p>') +
      _hSection('Cómo llenarlo', _hList([
        '<b>URL de la imagen</b>: enlace directo a la imagen (debe ser accesible desde Moodle).',
        '<b>Ancho / Alto</b>: dimensiones de visualización en píxeles (la imagen se redimensiona).',
        '<b>Instrucción</b>: instrucción mostrada al estudiante, ej. « Haga clic en el ventrículo izquierdo ».',
        '<b>Zona correcta — Círculo</b>: X centro, Y centro, Radio (todos en % del ancho/alto).',
        '<b>Zona correcta — Rectángulo</b>: X izquierda, Y arriba, X derecha, Y abajo (en %).',
        '<b>Etiqueta de zona</b>: texto usado en el feedback, ej. « ventrículo izquierdo ».'
      ])) +
      _hSection('Coordenadas en %',
        '<p>0 % = borde izquierdo (o superior), 100 % = borde derecho (o inferior). Un círculo centrado en medio con radio 10 %: X=50, Y=50, R=10.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── ARRASTRAR Y SOLTAR JSXGRAPH
  jxgdrop: {
    title: '<svg class="hs-ico"><use href="#ico-type-jxgdrop"></use></svg> Arrastrar y Soltar JSXGraph — Ayuda',
    body:
      _hSection('¿Para qué sirve?',
        '<p>El estudiante <b>arrastra etiquetas (propuestas) sobre una imagen</b> para depositarlas en zonas definidas (diagrama legendado, mapa, montaje experimental…). Cairn for Stack genera automáticamente el código JSXGraph responsive y la corrección.</p>') +
      _hSection('Cómo llenarlo', _hList([
        '<b>Imagen de fondo</b>: cargue una imagen (PNG/JPG) — sirve de soporte visual para las zonas y propuestas.',
        '<b>Propuestas</b>: haga clic en <b>＋ Añadir una propuesta</b> para cada etiqueta que el estudiante podrá depositar.',
        '<b>Zonas de depósito</b>: herramientas <b>Círculo</b>/<b>Rectángulo</b> para colocar una zona en la imagen (clic en la imagen), <b>Seleccionar</b> para ajustar una zona existente (centro/radio o posición/dimensiones en el panel de la derecha).',
        'Para cada zona seleccionada, marque en <b>Respuestas aceptadas</b> la o las propuestas consideradas correctas para esta zona.',
        '<b>Zonas de depósito visibles</b>: desmarque para ocultar el contorno de las zonas al estudiante (zona invisible, más difícil) — las zonas siguen activas para la corrección, solo cambia la visualización.'
      ])) +
      _hSection('Consejo',
        '<p>Una misma propuesta puede ser aceptada en varias zonas si la pregunta lo exige. Pruebe el arrastrar/soltar en la vista previa antes de exportar — la validación se bloquea después del depósito, como en un test real de Moodle.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── RGB / CMYK
  rvbcmj: {
    title: '<svg class="hs-ico"><use href="#ico-type-rvbcmj"></use></svg> RGB / CMYK — Ayuda',
    body:
      _hSection('¿Para qué sirve?',
        '<p>El estudiante <b>identifica el color de un objeto</b> observando su imagen a través de diferentes <b>filtros de color</b> (Rojo-Verde-Azul o Cian-Magenta-Amarillo). Usado en óptica física y educación artística.</p>') +
      _hSection('Cómo llenarlo', _hList([
        '<b>Tipo de filtros</b>: RGB (síntesis aditiva) o CMY (síntesis sustractiva).',
        '<b>Renderizado B&N</b>: muestra la imagen en escalas de grises antes del filtrado (más realista).',
        '<b>Imagen del objeto</b>: importe una imagen PNG/JPG — se codificará en Base64 en el XML.',
        '<b>Color correcto</b>: seleccione el color real del objeto (Rojo, Verde, Azul, Amarillo, Cian, Magenta, Blanco, Negro).',
        '<b>Previsualizar los filtros</b>: verifique la apariencia de la imagen a través de cada filtro antes de exportar.'
      ])) +
      _hSection('Principio pedagógico',
        '<p>En RGB: un filtro rojo solo deja pasar la componente roja — un objeto verde aparecerá oscuro a través de un filtro rojo. En CMY: un filtro cian absorbe el rojo, dejando pasar verde y azul.</p>') + _HELP_COMMON
  },

  // ───────────────────────────────────────── INCERTIDUMBRE DE MEDIDA
  incertitude: {
    title: '<svg class="hs-ico"><use href="#ico-type-incertitude"></use></svg> Incertidumbre de medida — Ayuda',
    body:
      _hSection('¿Para qué sirve?',
        '<p>El estudiante procesa una serie de <b>medidas experimentales</b> y calcula la <b>incertidumbre de medida</b> (método GUM): incertidumbre de tipo A (estadística, a partir de las medidas), incertidumbre de tipo B (instrumental), incertidumbre combinada, incertidumbre expandida, y la escritura final del resultado <code>X = x̄ ± U</code>. Cada paso marcado se califica de forma independiente.</p>') +
      _hSection('Cómo llenarlo', _hList([
        '<b>Magnitud / Símbolo / Unidad</b>: describen la medida (p. ej. Longitud, L, cm) — se usan para generar automáticamente los comentarios.',
        '<b>Tipo A</b>: bien una <i>lista de medidas</i> introducida manualmente, bien un conjunto <i>generado aleatoriamente</i> calibrado sobre una media y una desviación típica objetivo.',
        '<b>Tipo B</b>: elija el origen del error instrumental — <i>resolución</i> (u_B = q/√12), <i>tolerancia del fabricante</i> (u_B = Δ/√3), <i>certificado de calibración</i> (u_B = U_cert/k_cert), o un <i>valor impuesto</i> directamente.',
        '<b>Presentación del resultado</b>: número de cifras significativas de U (1 o 2), redondeo por exceso opcional, factor de cobertura k (1 o 2).',
        '<b>Pasos evaluados</b>: marque los pasos que el estudiante debe calcular (media, desviación típica, uA, uB, uc, U, escritura final) — cada uno genera su propio campo de respuesta calificado por separado.'
      ])) +
      _hSection('Trucos / trampas', _hList([
        'El modo aleatorio de tipo A usa ruido uniforme calibrado (no una distribución normal real) para alcanzar exactamente la desviación típica solicitada.',
        'El paso «Escritura final» espera el formato <code>X = x̄ ± U</code> (unidad incluida) — la corrección tolera espacios, la notación <code>+/-</code> y ceros finales.',
        'El factor de Student (n pequeño, nivel de confianza) todavía no está disponible en este módulo — previsto para una iteración posterior.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── Z-SCORE (COMPATIBILIDAD METROLÓGICA)
  zscore: {
    title: '<svg class="hs-ico"><use href="#ico-type-zscore"></use></svg> Z-score — Ayuda',
    body:
      _hSection('¿Para qué sirve?',
        '<p>El estudiante compara un <b>valor medido</b> con un <b>valor de referencia</b> calculando el <b>score de compatibilidad metrológica</b>: <code>z = |x_medido - x_referencia| / u_c</code>, y concluye si el resultado es compatible con la referencia (z por debajo de un umbral configurable) o no.</p>') +
      _hSection('Cómo llenarlo', _hList([
        '<b>Magnitud / Símbolo / Unidad</b>: describen la medida — se usan para generar automáticamente el enunciado y los comentarios.',
        '<b>Valores dados</b>: x_medido, x_referencia y u_c se introducen directamente por el profesor (valores fijos, sin generación aleatoria) y se muestran automáticamente en el enunciado.',
        '<b>Umbral de compatibilidad</b>: valor de comparación para la conclusión (compatible si z &lt; umbral) — 2 por defecto, pero totalmente configurable.',
        '<b>Pasos evaluados</b>: marque «Cálculo del z-score» y/o «Conclusión de compatibilidad» — cada uno genera su propio campo de respuesta calificado por separado.'
      ])) +
      _hSection('Trucos / trampas', _hList([
        'Este módulo es un tipo autónomo, distinto del tipo «Incertidumbre de medida»: no reutiliza ningún dato introducido en otro lugar.',
        'La conclusión de compatibilidad es una lista desplegable (Compatible / Incompatible), no un campo numérico.',
        'No hay generación aleatoria disponible en esta versión (MVP solo con valores fijos).'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── CÁMARA FOTOGRÁFICA (EXPOSICIÓN)
  apn: {
    title: '<svg class="hs-ico"><use href="#ico-type-apn"></use></svg> Cámara fotográfica (exposición) — Ayuda',
    body:
      _hSection('¿Para qué sirve?',
        '<p>El estudiante encuentra, mediante un <b>cuestionario de opción múltiple</b>, el valor del ajuste desconocido (diafragma, velocidad de obturación o ISO) que mantiene la <b>misma exposición</b> cuando uno o dos de los otros dos ajustes cambian, a partir de una configuración inicial dada en el enunciado.</p>') +
      _hSection('Cómo llenarlo', _hList([
        '<b>Parámetro a encontrar</b>: cuál de los tres ajustes (Velocidad / Diafragma / ISO) debe encontrar el estudiante — se convierte en la pregunta de opción múltiple.',
        '<b>Parámetro(s) modificado(s)</b>: entre los dos ajustes restantes, marque el o los que cambian entre la configuración inicial y la configuración objetivo (al menos uno marcado).',
        'La configuración inicial (valores de partida de los 3 ajustes) y el valor objetivo del/de los parámetro(s) modificado(s) se describen en el <b>enunciado</b> — el módulo no genera esos valores, solo corrige la respuesta de opción múltiple.',
        '<b>Mensajes si respuesta correcta/incorrecta</b>: opcionales, sustituyen el texto por defecto.'
      ])) +
      _hSection('Trucos / trampas', _hList([
        'El triángulo de exposición sigue la regla de los «pasos EV»: un cambio de 1 paso en un ajuste debe compensarse con 1 paso (en el sentido correcto) de otro para mantener la misma exposición — esta es la lógica que corrige la pregunta de opción múltiple, no un cálculo mostrado al estudiante.',
        'Sin generación aleatoria en esta versión: los valores numéricos (aperturas, velocidades, ISO) se escriben a mano en el enunciado.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── NOMENCLATURA QUÍMICA
  nomenclature: {
    title: '<svg class="hs-ico"><use href="#ico-type-nomenclature"></use></svg> Nomenclatura química — Ayuda',
    body:
      _hSection('¿Para qué sirve?',
        '<p>El estudiante identifica el <b>nombre IUPAC</b> y/o la <b>familia</b> de una molécula descrita por su fórmula <b>SMILES</b>, o marca los <b>grupos funcionales</b> que contiene. Tres modos independientes según el objetivo pedagógico.</p>') +
      _hSection('Cómo llenarlo', _hList([
        '<b>Molécula fija</b>: introduzca el SMILES, el nombre IUPAC esperado y la familia esperada. La comparación del nombre acepta guiones/espacios/mayúsculas indistintamente (comparación tolerante, sin sintaxis exacta requerida).',
        '<b>Generador aleatorio</b>: se extrae una molécula al azar de una base de datos integrada, filtrada por <b>familia(s)</b> (casillas, varias posibles; ninguna marcada = todas) y opcionalmente un <b>número máximo de carbonos</b>. Si ninguna molécula cumple los filtros, la extracción recurre automáticamente al conjunto completo en lugar de fallar.',
        '<b>Análisis funcional (casillas)</b>: introduzca un SMILES y dos listas separadas por comas — los grupos funcionales realmente presentes, y grupos señuelo ausentes. El estudiante marca los que identifica; se mezclan aleatoriamente en la lista que se le muestra.',
        'El botón <b>🧬 Ver en 3D</b> en la vista previa del estudiante carga una representación 3D interactiva de la molécula (requiere un servidor JSmol configurado en Admin) — se carga solo al hacer clic, nunca automáticamente.'
      ])) +
      _hSection('Trucos / trampas', _hList([
        'En modo Casillas, la puntuación es proporcional al número de aciertos menos los errores (no es una calificación todo o nada).',
        'La vista 3D en la pregunta exportada depende de un servidor JSmol externo (autoalojado) configurado por el administrador; sin él, el iframe 3D no se muestra en Moodle pero el resto de la pregunta funciona con normalidad.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── CINEMÁTICA DEL PUNTO
  cinematique: {
    title: '<svg class="hs-ico"><use href="#ico-type-cinematique"></use></svg> Cinemática del punto — Ayuda',
    body:
      _hSection('¿Para qué sirve?',
        '<p>A partir de una <b>cronofotografía</b> de un punto M en movimiento, el estudiante mide las normas de los vectores velocidad v_i y v_{i+1} (mediante diferencias de posiciones sucesivas), y luego construye el vector variación de velocidad Δv_i = v_{i+1} − v_i mediante la <b>relación de Chasles</b> (clonación, selección, inversión, adhesión magnética en la vista previa).</p>') +
      _hSection('Cómo llenarlo', _hList([
        '<b>Taller de digitalización</b>: marque cada posición M0, M1, M2… en orden cronológico, sobre fondo libre o una imagen importada como guía (la imagen nunca se guarda ni se exporta — solo se guardan los puntos marcados y la calibración).',
        '<b>Calibración</b>: coloque 2 marcadores en modo Calibración e indique la distancia real (en metros) entre ellos, para convertir los píxeles del taller en metros.',
        '<b>Intervalo entre 2 fotos (Δt)</b>: duración entre dos puntos M consecutivos.',
        '<b>Método de cálculo de la velocidad</b>: «Punto siguiente» (programa 2019, M_iM_{i+1}/Δt) o «Derivada simétrica» (M_{i-1}M_{i+1}/2Δt) — esta última se recomienda para movimientos circulares o parabólicos, donde da una dirección tangente correcta.',
        '<b>Índice i de partida</b>: determina qué puntos se usan para calcular v_i (segmento M_iM_{i+1}) y luego v_{i+1} (segmento M_{i+1}M_{i+2}) — aparece un mensaje de error en la vista previa si i está fuera de rango para el número de puntos digitalizados.'
      ])) +
      _hSection('Trucos / trampas', _hList([
        'Con el método «Derivada simétrica», el índice i debe dejar espacio a ambos lados (necesita M_{i-1} y M_{i+2}) — revise la vista previa si aparece un mensaje de error.',
        'La imagen importada como guía es solo una ayuda visual para usted durante la digitalización: no forma parte ni de la pregunta guardada ni de la exportación a Moodle.',
        'Sin generación aleatoria en esta versión: las posiciones digitalizadas y Δt son valores fijos.'
      ])) + _HELP_COMMON
  },

  // ───────────────────────────────────────── HARDY-WEINBERG (BIOLOGÍA)
  hardyweinberg: {
    title: '<svg class="hs-ico"><use href="#ico-type-hardyweinberg"></use></svg> Hardy-Weinberg — Ayuda',
    body:
      _hSection('¿Para qué sirve?',
        '<p>Para una población en <b>equilibrio de Hardy-Weinberg</b>, el estudiante determina, a partir del porcentaje observado de individuos con fenotipo recesivo, la <b>frecuencia del alelo recesivo q</b>, la del alelo dominante <b>p</b>, y la frecuencia de <b>heterocigotos</b> (2pq).</p>') +
      _hSection('Cómo llenarlo', _hList([
        '<b>Especie / Fenotipo dominante / Fenotipo recesivo</b>: visten el enunciado (ej. «ratones», «pelaje gris», «pelaje blanco»).',
        '<b>Frecuencias posibles de q</b>: lista de fracciones o números separados por comas (sintaxis Maxima, ej. <code>1/10,2/10,3/10</code>) — un valor se sortea aleatoriamente <b>del lado de Maxima, en cada intento del estudiante</b>: una sola pregunta STACK cubre así todas las variantes, sin ningún sorteo del lado del profesor.',
        '<b>Enunciado / consigna</b>: texto opcional añadido antes de la pregunta generada.'
      ])) +
      _hSection('Trucos / trampas', _hList([
        'El sorteo aleatorio es nativo de Maxima (no un sorteo JS antes de exportar): a diferencia de «Z-score» o «Incertidumbre», la vista previa simulada no puede mostrar un valor numérico hasta que se solicite la vista previa real (botón 👁️) — esto es normal.',
        'Las tres subpreguntas (q, p, heterocigotos) siempre están presentes, sin ningún paso desactivable: el escenario solo tiene sentido pedagógico con las tres respuestas.',
        'Un error clásico se diagnostica automáticamente en la subpregunta de heterocigotos: si el estudiante responde con la frecuencia de individuos de fenotipo <b>dominante</b> (1−q²) en lugar de la frecuencia de <b>heterocigotos</b> solos (2pq), un feedback específico se lo señala.'
      ])) + _HELP_COMMON
  }
};

  window.HELP_LANG = window.HELP_LANG || {};
  window.HELP_LANG.es = HELP_CONTENT;
})();
