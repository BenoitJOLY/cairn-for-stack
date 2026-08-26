# Architecture applicative "Cairn for Stack" (générateur no-code de questions STACK)

À utiliser quand la demande porte sur la RECONSTRUCTION ou l'ÉVOLUTION de l'application JS de génération de questions (pas sur une question isolée). Contexte : l'ancienne version a échoué à cause de fichiers monolithiques de 2000-5000 lignes mélangeant HTML, Maxima et génération XML.

## Le moteur XML puriste (VERROUILLÉ — ne jamais réécrire, seulement consommer)

Ce module prend un objet JSON en entrée et produit un XML Moodle 100% conforme au DSTU (CDATA, espace vital avant `]]>` en specificfeedback, toutes les balises cachées requises). Il doit rester tel quel dans le projet :

```javascript
/**
 * MOTEUR XML STACK - SPRINT 1.5
 */
function moodleTextTag(content, useCData = false, isSpecificFeedback = false) {
    let strContent = String(content === undefined || content === null ? '' : content);
    if (useCData) {
        if (isSpecificFeedback) {
            strContent = strContent.replace(/\]\]>/g, '] ]]>'); // Règle Pôle 1.3
        }
        return `<text><![CDATA[${strContent}]]></text>`;
    }
    return `<text>${strContent}</text>`;
}

export function generateStackXML(data) {
    if (!data.metadata || !data.metadata.stackversion || data.metadata.stackversion.trim() === '') {
        throw new Error("ALERT FATAL : La balise <stackversion> ne doit JAMAIS être vide.");
    }

    const defaultGrade = data.metadata.defaultgrade || "1";
    const penalty = data.metadata.penalty || "0.1";

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<quiz>\n  <question type="stack">\n`;
    xml += `    <name>\n      ${moodleTextTag(data.metadata.name)}\n    </name>\n`;
    xml += `    <questiontext format="html">\n      ${moodleTextTag(data.questiontext, true)}\n    </questiontext>\n`;
    xml += `    <generalfeedback format="html">\n      ${moodleTextTag(data.generalfeedback || '', true)}\n    </generalfeedback>\n`;
    xml += `    <defaultgrade>${defaultGrade}</defaultgrade>\n`;
    xml += `    <penalty>${penalty}</penalty>\n`;
    xml += `    <hidden>0</hidden>\n`;
    xml += `    <idnumber></idnumber>\n`;
    xml += `    <stackversion>\n      ${moodleTextTag(data.metadata.stackversion)}\n    </stackversion>\n`;

    if (data.questionvariables) {
        xml += `    <questionvariables>\n      ${moodleTextTag(data.questionvariables, true)}\n    </questionvariables>\n`;
    }

    xml += `    <specificfeedback format="html">\n      ${moodleTextTag(data.specificfeedback || '', true, true)}\n    </specificfeedback>\n`;
    xml += `    <questionnote format="html">\n      ${moodleTextTag(data.questionnote || '', true)}\n    </questionnote>\n`;
    xml += `    <questiondescription format="html">\n      ${moodleTextTag(data.questiondescription || '', true)}\n    </questiondescription>\n`;
    xml += `    <questionsimplify>1</questionsimplify>\n`;
    xml += `    <assumepositive>0</assumepositive>\n`;
    xml += `    <assumereal>0</assumereal>\n`;
    xml += `    <prtcorrect format="html"><text></text></prtcorrect>\n`;
    xml += `    <prtpartiallycorrect format="html"><text></text></prtpartiallycorrect>\n`;
    xml += `    <prtincorrect format="html"><text></text></prtincorrect>\n`;
    xml += `    <decimals>.</decimals>\n`;
    xml += `    <scientificnotation>*10</scientificnotation>\n`;
    xml += `    <multiplicationsign>dot</multiplicationsign>\n`;
    xml += `    <sqrtsign>1</sqrtsign>\n`;
    xml += `    <complexno>i</complexno>\n`;
    xml += `    <inversetrig>cos-1</inversetrig>\n`;
    xml += `    <logicsymbol>lang</logicsymbol>\n`;
    xml += `    <matrixparens>[</matrixparens>\n`;
    xml += `    <isbroken>0</isbroken>\n`;
    xml += `    <variantsselectionseed></variantsselectionseed>\n`;

    if (data.inputs && data.inputs.length > 0) {
        data.inputs.forEach(input => {
            const def = {
                boxsize: input.boxsize || 15,
                strictsyntax: input.strictsyntax !== undefined ? input.strictsyntax : 1,
                insertstars: input.insertstars !== undefined ? input.insertstars : 0,
                syntaxhint: input.syntaxhint || '',
                syntaxattribute: input.syntaxattribute !== undefined ? input.syntaxattribute : 0,
                forbidwords: input.forbidwords || '',
                allowwords: input.allowwords || '',
                forbidfloat: input.forbidfloat !== undefined ? input.forbidfloat : 0,
                requirelowestterms: input.requirelowestterms !== undefined ? input.requirelowestterms : 0,
                checkanswertype: input.checkanswertype !== undefined ? input.checkanswertype : 0,
                mustverify: input.mustverify !== undefined ? input.mustverify : 0,
                showvalidation: input.showvalidation !== undefined ? input.showvalidation : 0
            };

            xml += `    <input>\n`;
            xml += `      <name>${input.name}</name>\n`;
            xml += `      <type>${input.type}</type>\n`;
            xml += `      <tans>${moodleTextTag(input.modelAnswer, true)}</tans>\n`;
            xml += `      <boxsize>${def.boxsize}</boxsize>\n`;
            xml += `      <strictsyntax>${def.strictsyntax}</strictsyntax>\n`;
            xml += `      <insertstars>${def.insertstars}</insertstars>\n`;
            xml += `      <syntaxhint>${moodleTextTag(def.syntaxhint)}</syntaxhint>\n`;
            xml += `      <syntaxattribute>${def.syntaxattribute}</syntaxattribute>\n`;
            xml += `      <forbidwords>${moodleTextTag(def.forbidwords)}</forbidwords>\n`;
            xml += `      <allowwords>${moodleTextTag(def.allowwords)}</allowwords>\n`;
            xml += `      <forbidfloat>${def.forbidfloat}</forbidfloat>\n`;
            xml += `      <requirelowestterms>${def.requirelowestterms}</requirelowestterms>\n`;
            xml += `      <checkanswertype>${def.checkanswertype}</checkanswertype>\n`;
            xml += `      <mustverify>${def.mustverify}</mustverify>\n`;
            xml += `      <showvalidation>${def.showvalidation}</showvalidation>\n`;
            xml += `      <options>${moodleTextTag(input.options || '')}</options>\n`;
            xml += `    </input>\n`;
        });
    }

    if (data.prts && data.prts.length > 0) {
        data.prts.forEach(prt => {
            xml += `    <prt>\n`;
            xml += `      <name>${prt.name}</name>\n`;
            xml += `      <value>${prt.value || "1.0000000"}</value>\n`;
            xml += `      <autosimplify>1</autosimplify>\n`;
            xml += `      <feedbackstyle>1</feedbackstyle>\n`;
            xml += `      <feedbackvariables>\n        ${moodleTextTag(prt.feedbackvariables || '', true)}\n      </feedbackvariables>\n`;

            if (prt.nodes && prt.nodes.length > 0) {
                xml += `      <nodes>\n`;
                prt.nodes.forEach((node, index) => {
                    const trueScore = node.trueScore !== undefined ? node.trueScore : 1;
                    const falseScore = node.falseScore !== undefined ? node.falseScore : 0;
                    const trueNextNode = node.trueNextNode !== undefined ? node.trueNextNode : -1;
                    const falseNextNode = node.falseNextNode !== undefined ? node.falseNextNode : -1;

                    xml += `        <node>\n`;
                    xml += `          <name>${index}</name>\n`;
                    xml += `          <description>${moodleTextTag(node.description || '')}</description>\n`;
                    xml += `          <answertest>${node.type}</answertest>\n`;
                    xml += `          <sans>${moodleTextTag(node.sans, true)}</sans>\n`;
                    xml += `          <tans>${moodleTextTag(node.tans, true)}</tans>\n`;
                    xml += `          <testoptions>${moodleTextTag(node.testOptions || '', true)}</testoptions>\n`;
                    xml += `          <quiet>0</quiet>\n`;
                    xml += `          <truescoremode>${node.trueScoreMode || '='}</truescoremode>\n`;
                    xml += `          <truescore>${Number(trueScore).toFixed(7)}</truescore>\n`;
                    xml += `          <truepenalty>${moodleTextTag(node.truePenalty || '')}</truepenalty>\n`;
                    xml += `          <truenextnode>${trueNextNode}</truenextnode>\n`;
                    xml += `          <trueanswernote>${moodleTextTag(node.trueAnswerNote || '')}</trueanswernote>\n`;
                    xml += `          <truefeedback format="html">\n            ${moodleTextTag(node.trueFeedback || '', true)}\n          </truefeedback>\n`;
                    xml += `          <falsescoremode>${node.falseScoreMode || '='}</falsescoremode>\n`;
                    xml += `          <falsescore>${Number(falseScore).toFixed(7)}</falsescore>\n`;
                    xml += `          <falsepenalty>${moodleTextTag(node.falsePenalty || '')}</falsepenalty>\n`;
                    xml += `          <falsenextnode>${falseNextNode}</falsenextnode>\n`;
                    xml += `          <falseanswernote>${moodleTextTag(node.falseAnswerNote || '')}</falseanswernote>\n`;
                    xml += `          <falsefeedback format="html">\n            ${moodleTextTag(node.falseFeedback || '', true)}\n          </falsefeedback>\n`;
                    xml += `        </node>\n`;
                });
                xml += `      </nodes>\n`;
            }
            xml += `    </prt>\n`;
        });
    }

    // ATTENTION : forme fausse — STACK n'a pas de wrapper <deployedseeds>. Vérifié
    // contre un export réel le 2026-07-25 : ce sont des <deployedseed>N</deployedseed>
    // répétés (un par variante), placés juste avant <tags>. Voir insertDeployedSeeds()
    // dans js/maxima-client.js pour l'implémentation réelle.
    seeds.forEach(seed => { xml += `    <deployedseed>${seed}</deployedseed>\n`; });
    xml += `    <qtype_options></qtype_options>\n`;
    xml += `  </question>\n</quiz>`;

    return xml;
}
```

## Les deux lois intouchables

### LOI 1 : Anti-fichier monstre (max ~200 lignes)
Pattern MVC strict obligatoire pour toute logique de génération :
- `.view.js` : uniquement le HTML/CSS de la modale (template literal).
- `.data.js` : uniquement les variables Maxima, les `tans`, les textes de feedback.
- `.controller.js` : uniquement la logique (clics, affichage conditionnel Fixe/Aléatoire) et l'appel final à `generateStackXML()`.

Si une réponse dépasserait 200 lignes : s'arrêter et le signaler ("La logique est trop grosse, on doit la diviser.") plutôt que de produire un fichier monolithique.

### LOI 2 : Anti-effet domino (isolation des variants)
Chaque variante complexe (ex "Moyenne Fixe", "Moyenne Aléatoire", "Matrice 3x3") doit être isolée dans son propre fichier/fonction. Un scénario ne doit JAMAIS dépendre de variables ou d'index (`truenextnode`) d'un autre scénario.

## Méthode de travail pour cette partie du skill
1. L'utilisateur fournit un XML valide d'une question complexe existante (ex : Statistiques en mode Fixe).
2. Analyser et découper en `.view.js` / `.data.js` / `.controller.js` en respectant les Lois 1 et 2.
3. Les données (Maxima, PRTs) formatées en JSON pur, consommées par `generateStackXML()` — jamais de balise XML écrite à la main dans ce contexte.
