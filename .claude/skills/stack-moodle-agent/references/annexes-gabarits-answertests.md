# ANNEXES : Gabarits XML de Référence

**Méthodologie du gabarit (règle absolue)** : pour toute nouvelle question, partir du gabarit correspondant (Annexe 1 ou 2) et n'y modifier QUE les zones de texte, les variables Maxima et les nœuds du PRT. Ne jamais réécrire les balises de configuration générales (`<defaultgrade>`, `<penalty>`, `<hidden>`, etc.).

## ANNEXE 1 : Question Classique / Numération

```xml
<?xml version="1.0" encoding="UTF-8"?>
<quiz>
  <question type="stack">
    <name><text>NOM_DE_LA_QUESTION</text></name>
    <questiontext format="html">
      <text><![CDATA[ <!-- INSERER HTML ET [[input:ans1]] [[validation:ans1]] ICI --> ]]></text>
    </questiontext>
    <generalfeedback format="html">
      <text><![CDATA[ <!-- INSERER LE FEEDBACK GENERAL ICI --> ]]> </text>
    </generalfeedback>
    <defaultgrade>1</defaultgrade>
    <penalty>0.1</penalty>
    <hidden>0</hidden>
    <idnumber></idnumber>
    <stackversion><text>2024092500</text></stackversion>
    <questionvariables>
      <text><![CDATA[ /* INSERER LE CODE MAXIMA ICI (Règles du Pôle 2) */ ]]></text>
    </questionvariables>
    <specificfeedback format="html">
      <text><![CDATA[<div>[[feedback:prt1]]</div> ]]></text>
    </specificfeedback>
    <!-- ... autres balises générales ... -->
    <input>
      <name>ans1</name>
      <type>algebraic</type>
      <tans>VARIABLE_MAXIMA_ATTENDUE</tans>
      <boxsize>15</boxsize>
      <strictsyntax>1</strictsyntax>
      <insertstars>0</insertstars>
      <syntaxhint></syntaxhint>
      <syntaxattribute>0</syntaxattribute>
      <forbidwords></forbidwords>
      <allowwords></allowwords>
      <forbidfloat>0</forbidfloat>
      <requirelowestterms>0</requirelowestterms>
      <checkanswertype>1</checkanswertype>
      <mustverify>1</mustverify>
      <showvalidation>2</showvalidation>
      <options></options>
    </input>
    <prt>
      <name>prt1</name>
      <value>1</value>
      <autosimplify>1</autosimplify>
      <feedbackstyle>1</feedbackstyle>
      <feedbackvariables><text></text></feedbackvariables>
      <node>
        <name>0</name>
        <description>Noeud 0</description>
        <answertest>AlgEquiv</answertest>
        <sans>ans1</sans>
        <tans>VARIABLE_PROF</tans>
        <testoptions></testoptions>
        <quiet>0</quiet>
        <truescoremode>=</truescoremode>
        <truescore>1</truescore>
        <truepenalty></truepenalty>
        <truenextnode>-1</truenextnode>
        <trueanswernote>PRT-OK</trueanswernote>
        <truefeedback format="html"><text><![CDATA[ <!-- OK --> ]]></text></truefeedback>
        <falsescoremode>=</falsescoremode>
        <falsescore>0</falsescore>
        <falsepenalty></falsepenalty>
        <falsenextnode>-1</falsenextnode>
        <falseanswernote>PRT-NOK</falseanswernote>
        <falsefeedback format="html"><text><![CDATA[ <!-- NOK --> ]]></text></falsefeedback>
      </node>
    </prt>
  </question>
</quiz>
```
*(Note : un seul nœud → `<node>` directement enfant de `<prt>`, sans `<nodes>` englobante, cf. Pôle 1.2.)*

## ANNEXE 2 : Question Parsons Puzzle

```xml
<?xml version="1.0" encoding="UTF-8"?>
<quiz>
  <question type="stack">
    <name><text>Parsons - NOM</text></name>
    <questiontext format="moodle_auto_format">
      <text><![CDATA[
        [[parsons input="ans1"]]
        {# parsons_encode(proof_steps) #}
        [[/parsons ]]
        <p>[[input:ans1]] [[validation:ans1]]</p>
      ]]></text>
    </questiontext>
    <generalfeedback format="moodle_auto_format">
      <text><![CDATA[ <!-- FEEDBACK GENERAL --> ]]> </text>
    </generalfeedback>
    <defaultgrade>1</defaultgrade>
    <penalty>0.1</penalty>
    <hidden>0</hidden>
    <idnumber></idnumber>
    <stackversion><text>2024092500</text></stackversion>
    <questionvariables>
      <text><![CDATA[
stack_include_contrib("prooflib.mac");

proof_steps: [
    ["L1", "Ligne de code 1"],
    ["L2", "Ligne de code 2"]
];

ta: proof("L1", "L2");
proof_steps: random_permutation(proof_steps);

tal: proof_alternatives(ta);
tas: setify(map(proof_flatten, tal));
      ]]></text>
    </questionvariables>
    <specificfeedback format="html"><text>[[feedback:prt1]]</text></specificfeedback>
    <questionnote format="html"><text>{@map(first, proof_steps)@}</text></questionnote>
    <!-- ... autres balises générales ... -->
    <input>
      <name>ans1</name>
      <type>parsons</type>
      <tans>[ta, proof_steps]</tans>
      <boxsize>15</boxsize>
      <strictsyntax>1</strictsyntax>
      <insertstars>0</insertstars>
      <syntaxhint></syntaxhint>
      <syntaxattribute>0</syntaxattribute>
      <forbidwords></forbidwords>
      <allowwords></allowwords>
      <forbidfloat>1</forbidfloat>
      <requirelowestterms>0</requirelowestterms>
      <checkanswertype>0</checkanswertype>
      <mustverify>0</mustverify>
      <showvalidation>0</showvalidation>
      <options></options>
    </input>
    <prt>
      <name>prt1</name>
      <value>1.0000000</value>
      <autosimplify>1</autosimplify>
      <feedbackstyle>1</feedbackstyle>
      <feedbackvariables>
        <text><![CDATA[sa: parsons_decode(ans1);
check: elementp(sa,tas);]]></text>
      </feedbackvariables>
      <node>
        <name>0</name>
        <description></description>
        <answertest>AlgEquiv</answertest>
        <sans>check</sans>
        <tans>true</tans>
        <testoptions></testoptions>
        <quiet>0</quiet>
        <truescoremode>=</truescoremode>
        <truescore>1</truescore>
        <truepenalty></truepenalty>
        <truenextnode>-1</truenextnode>
        <trueanswernote>prt1-1-T</trueanswernote>
        <truefeedback format="html"><text></text></truefeedback>
        <falsescoremode>=</falsescoremode>
        <falsescore>0</falsescore>
        <falsepenalty></falsepenalty>
        <falsenextnode>-1</falsenextnode>
        <falseanswernote>prt1-1-F</falseanswernote>
        <falsefeedback format="html"><text></text></falsefeedback>
      </node>
    </prt>
  </question>
</quiz>
```

## ANNEXE 3 : Sécurité des Answer Tests

### Liste Blanche Autorisée (OBLIGATOIRE — utiliser exclusivement ces tests)

**A. Algèbre et Logique pure**
- `AlgEquiv` : test par défaut (équivalence math, ensembles, listes, booléens).
- `LowestTerms` : fraction irréductible.
- `Sets` : format ensemble strict (alternative à AlgEquiv pour forcer `{a,b}`).

**B. Chaînes de caractères**
- `String` : comparaison stricte (casse/espaces comptent).
- `StringSloppy` : casse/espaces extrémités ignorés.
- `Levenshtein` : distance algorithmique.
- `RegExp` : validation regex — `<tans>` en guillemets doubles échappés.

**C. Numérique**
- `NumAbsolute` : tolérance absolue.
- `NumRelative` : tolérance relative.
- `NumDecPlaces` : nombre de décimales.
- `NumSigFigs` : chiffres significatifs.
- (Num-GT/Num-LT ignorés au profit de prédicats Maxima évalués par AlgEquiv, cf. Pôle 3.3 exception.)

**D. Unités**
- `UnitsAbsolute`, `UnitsRelative` : comparaison stricte/tolérante.
- `UnitsStrictAbsolute`/`UnitsStrictRelative` : variantes strictes.

**E. Exception très stricte**
- `SubstEquiv` : UNIQUEMENT Pôle 4.11 (forçage absolu du +k pour primitives). Interdit ailleurs.

### Liste Noire Absolue (INTERDIT — ALERT FATAL, rejet systématique)
- `Equiv` : INTERDIT FORMEL — banni pour instabilité chronique avec inputs texte/radio.
  ⚠️ **Point de vigilance / contradiction à trancher avec l'utilisateur** : le Pôle 3.5 du DSTU décrit un usage légitime de `Equiv` pour le type d'input `equiv` (logique Vrai/Faux/Je ne sais pas). Cette Annexe 3 le bannit sans exception listée. **Avant de générer une question de type `equiv`, signaler cette contradiction à l'utilisateur et demander confirmation explicite** plutôt que de trancher seul.
- `EquivFirst`/`EquivReasoning` : logique propositionnelle avancée, hors périmètre.
- `Sausages` : test de débogage interne STACK.
- `CasEqual`/`EqualComAss`/`EqualComAssRules` : forme CAS interne, retours incohérents pour l'élève → utiliser `AlgEquiv`/`FacForm`.
- `Antidiff`/`Int` : obsolètes → utiliser validation par dérivation (Pôle 4.11).
- `Validator` : fonction personnalisée complexe, hors périmètre.
