// xml-lint.js — vérification statique du XML exporté, avant téléchargement.
// But : attraper localement les classes de bugs déjà rencontrées (voir PLAN.md,
// Problèmes connus) sans attendre un aller-retour d'import Moodle réel.
// N'importe quel `warn` retourné ici est un indice fort, pas forcément une
// certitude à 100% (le check d'équilibre CDATA est une heuristique) — l'appelant
// décide s'il bloque ou laisse continuer.

function lintExportedXML(xml) {
  var warnings = [];

  // 1) I18N n'existe que dans le contexte navigateur de StackForge (voir js/i18n.js).
  //    S'il apparaît littéralement dans le XML exporté, ce JS s'exécutera un jour
  //    dans le sandbox Moodle/JSXGraph où I18N est undefined → plantage silencieux.
  //    (cause exacte du Problème connu #36, bug 4 : I18N.t(...) laissé hors ${...}.)
  var i18nCalls = xml.match(/\bI18N\.(t|add|setLang|register)\s*\(/g);
  if (i18nCalls) {
    warnings.push('Appel(s) I18N.* trouvé(s) tel quel dans le XML exporté (' + i18nCalls.length + ') — '
      + 'I18N n\'existe pas côté Moodle. Vérifier que chaque I18N.t(...) dans un template '
      + 'JSXGraph/kbdRaw est bien enveloppé en ${JSON.stringify(I18N.t(...))}.');
  }

  // 2) Marqueurs kbdRaw non restaurés : la substitution du placeholder a échoué
  //    (q.kbdRaw absent/vide alors que le marqueur a été posé dans textFrag).
  var leftoverMarkers = xml.match(/<!--HS-KBD(-FBGEN)?:[^>]*-->/g);
  if (leftoverMarkers) {
    warnings.push('Marqueur(s) <!--HS-KBD...--> non remplacés dans le XML final (' + leftoverMarkers.length + ') — '
      + 'le JS brut correspondant n\'a pas été réinjecté, le widget élève sera probablement vide.');
  }

  // 3) <tans> vide : rejeté par le validateur serveur STACK (Problème connu #36, bug 3).
  if (/<tans>\s*<\/tans>/.test(xml)) {
    warnings.push('<tans></tans> vide détecté — sera rejeté par la validation serveur STACK.');
  }

  // 4) manualgraded:1 : forme rejetée par STACK, seule manualgraded:true est acceptée.
  if (/manualgraded\s*:\s*1\b/.test(xml)) {
    warnings.push('"manualgraded:1" détecté — STACK exige "manualgraded:true".');
  }

  // 5) Équilibre grossier des parenthèses/accolades/crochets à l'intérieur de
  //    chaque bloc <![CDATA[ ... ]]> (où vit le JS JSXGraph brut). Heuristique :
  //    ne tient pas compte des chaînes/commentaires, donc peut faux-positiver sur
  //    du texte contenant des parenthèses non appariées — à lire comme un indice,
  //    pas un verdict.
  var cdataRe = /<!\[CDATA\[([\s\S]*?)\]\]>/g, m, idx = 0;
  while ((m = cdataRe.exec(xml))) {
    idx++;
    var block = m[1];
    ['()', '{}', '[]'].forEach(function(pair) {
      var open = pair[0], close = pair[1];
      var opens = (block.split(open).length - 1);
      var closes = (block.split(close).length - 1);
      if (opens !== closes) {
        warnings.push('Bloc CDATA #' + idx + ' : déséquilibre "' + open + '/' + close + '" '
          + '(' + opens + ' ouvrant(s) / ' + closes + ' fermant(s)) — JS/Maxima potentiellement corrompu.');
      }
    });
  }

  // 6) Limite CHAR(255) côté base Moodle : mdl_qtype_stack_inputs.tans et
  //    mdl_qtype_stack_qtest_inputs.value sont tous deux des CHAR(255) stricts
  //    (voir test/moodle-qtype_stack-master/db/install.xml). Un dépassement ne
  //    remonte PAS via la validation STACK habituelle : Moodle échoue à
  //    l'écriture en base avec un simple "Erreur d'écriture vers la base de
  //    données", sans détail (sauf mode debug développeur). Seuil d'alerte à
  //    220 (marge avant la limite dure de 255) pour laisser de la place à un
  //    arrondi ultérieur sans repasser par un import raté pour le découvrir.
  var TANS_LIMIT = 220;
  var tansRe = /<tans>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/tans>/g, tm;
  while ((tm = tansRe.exec(xml))) {
    var tansVal = tm[1] !== undefined ? tm[1] : tm[2];
    if (tansVal && tansVal.length > TANS_LIMIT) {
      warnings.push('<tans> de ' + tansVal.length + ' caractères (limite base de données : 255) — '
        + 'raccourcir (arrondir les valeurs numériques dans la tolérance du PRT) pour rester sous ' + TANS_LIMIT + '.');
    }
  }
  var qtestValRe = /<testinput>[\s\S]*?<value>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))<\/value>/g, qm;
  while ((qm = qtestValRe.exec(xml))) {
    var qtestVal = qm[1] !== undefined ? qm[1] : qm[2];
    if (qtestVal && qtestVal.length > TANS_LIMIT) {
      warnings.push('<value> de qtest de ' + qtestVal.length + ' caractères (limite base de données : 255) — '
        + 'raccourcir de la même façon que <tans>.');
    }
  }

  // 7) "<"/">" littéraux dans du JS embarqué (bloc [[jsxgraph]]...[[/jsxgraph]] ou
  //    <script>...</script>) : ce texte passe par js/app.js:stripMathDivs(), qui fait
  //    un aller-retour div.innerHTML = html; ...; return div.innerHTML pour nettoyer les
  //    artefacts KaTeX. Or la sérialisation HTML standard (WHATWG) échappe TOUT "<" et
  //    ">" présent dans un nœud texte (pas seulement "<") en "&lt;"/"&gt;" — et sur
  //    Moodle 4.5.12/qtype_stack 4.11.1 ces entités ne sont pas redécodées au rendu :
  //    le navigateur reçoit "&lt;"/"&gt;" tel quel dans le script et plante avec
  //    "SyntaxError: missing ) in parenthetical" (découvert en auditant Redox le
  //    2026-07-20, voir PLAN.md #38 — le premier correctif "r<=0" → "r>0" s'est révélé
  //    insuffisant car ">" est échappé exactement comme "<"). Contournement : écrire le
  //    JS généré sans aucun caractère "<" ni ">" (ex: "r>0" → "Math.sign(r)===1").
  function scanForEscapedComparison(block, label, idx) {
    var ltCount = (block.match(/&lt;/g) || []).length;
    var gtCount = (block.match(/&gt;/g) || []).length;
    var ampCount = (block.match(/&amp;/g) || []).length;
    if (ltCount) {
      warnings.push('"&lt;" trouvé dans ' + label + (idx ? ' #' + idx : '') + ' (' + ltCount + ') — '
        + 'un "<" littéral dans le JS généré sera envoyé tel quel au navigateur par '
        + 'Moodle 4.5.12/qtype_stack 4.11.1 et cassera le script. '
        + 'Réécrire pour n\'utiliser ni "<" ni ">" (ex: "r>0" → "Math.sign(r)===1").');
    }
    if (gtCount) {
      warnings.push('"&gt;" trouvé dans ' + label + (idx ? ' #' + idx : '') + ' (' + gtCount + ') — '
        + 'un ">" littéral dans le JS généré sera envoyé tel quel au navigateur par '
        + 'Moodle 4.5.12/qtype_stack 4.11.1 et cassera le script (même mécanisme que "&lt;", '
        + 'stripMathDivs() échappe les deux). '
        + 'Réécrire pour n\'utiliser ni "<" ni ">" (ex: "r>0" → "Math.sign(r)===1").');
    }
    if (ampCount) {
      warnings.push('"&amp;" trouvé dans ' + label + (idx ? ' #' + idx : '') + ' (' + ampCount + ') — '
        + 'un "&" littéral (ex: "&&") dans le JS généré sera envoyé tel quel au navigateur par '
        + 'Moodle 4.5.12/qtype_stack 4.11.1 et cassera le script (même mécanisme que "&lt;"/"&gt;", '
        + 'stripMathDivs() échappe aussi "&"). '
        + 'Réécrire pour n\'utiliser aucun "&" littéral (ex: "a && b" → if imbriqués, ou "a || !x return" reste sûr).');
    }
  }
  var jsxRe = /\[\[jsxgraph[^\]]*\]\]([\s\S]*?)\[\[\/jsxgraph\]\]/g, jm, jidx = 0;
  while ((jm = jsxRe.exec(xml))) { jidx++; scanForEscapedComparison(jm[1], 'un bloc [[jsxgraph]]', jidx); }
  var scriptRe = /<script[^>]*>([\s\S]*?)<\/script>/g, sm, sidx = 0;
  while ((sm = scriptRe.exec(xml))) { sidx++; scanForEscapedComparison(sm[1], 'un bloc <script>', sidx); }

  return warnings;
}
