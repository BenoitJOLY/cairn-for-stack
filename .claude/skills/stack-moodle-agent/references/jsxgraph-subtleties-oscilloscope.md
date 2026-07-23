# Subtilités JSXGraph avancées (retours de production, 2026-07-20/21)

Ces règles complètent — et dans certains cas priment sur, car plus récentes et vérifiées empiriquement — le Pôle 6 du DSTU. À appliquer systématiquement dès qu'un bloc `[[jsxgraph]]` est généré.

## 1. `create("text", ...)` : la chaîne littérale n'est PAS du texte, c'est du JessieCode
`board.create("text",[x,y,"chaîne",{...}])` n'affiche pas la chaîne telle quelle : JSXGraph l'enveloppe en `function(){return <chaîne>;}` et la fait analyser par son moteur d'expressions interne (JessieCode), pour permettre du texte dynamique lié à d'autres objets.

Si la chaîne ressemble à du code (identifiant + parenthèses + groupe entre parenthèses, ex `"V(KMnO₄) (mL)"`), JessieCode lève une `Parse error` synchrone **non interceptée**, typiquement à l'intérieur du `Promise.all(...).then(...)` généré par STACK pour `input-ref-*` (voir §2) — qui n'a PAS de `.catch()`. L'exception stoppe tout le reste du script (courbe, curseur, `bind_point`...) souvent sans rien afficher en console (rejet de promesse non géré, iframe sandboxée cross-origin).

**Symptôme typique** : les éléments créés avant le texte fautif s'affichent, rien après, console silencieuse.

**OBLIGATOIRE** : ne jamais passer une chaîne littérale à `create("text", ...)`. Toujours une fonction :
```javascript
board.create("text", [x, y, function(){return "V(KMnO₄) (mL)";}, {...}]);
```

## 2. `stack_jxg.bind_point` : la vraie signature et le vrai pont iframe
La signature réelle (`corsscripts/stackjsxgraph.js` du plugin STACK) est `bind_point(inputRef, point)` — **2 arguments**, jamais 3. `inputRef` doit être une référence DÉJÀ résolue, jamais une chaîne de nom d'input brute ni un objet `board`.

Le graphe s'exécute dans un `<iframe srcdoc>` isolé : `document.getElementById("ansX")` à l'intérieur ne peut PAS voir l'`<input>` réel (page Moodle parente). Un appel type `bind_point(board,"ansX",cur)` échoue silencieusement.

**OBLIGATOIRE** : déclarer `input-ref-ansX="ansXRef"` en attribut d'ouverture :
```
[[jsxgraph width="500px" height="400px" input-ref-ans1="ans1Ref"]]
```
STACK enveloppe alors TOUT le contenu du bloc dans :
```javascript
Promise.all([stack_js.request_access_to_input("ans1", true)]).then(([ans1Ref]) => {
  // ...tout le bloc...
  stack_jxg.bind_point(ans1Ref, cur);
});
```
⚠️ Ce wrapper `.then()` n'a PAS de `.catch()` : toute exception ailleurs dans le bloc (voir §1) empêche silencieusement le `bind_point` de s'exécuter.

*(Cette signature à 2 arguments remplace/précise le Pôle 6.3 du DSTU — l'ancienne méthode à 3 arguments `stack_jxxg.bind_point("ans1", board, point)` est obsolète et cause `input is not defined` sur les iframes modernes.)*

## 3. Axe créé avec `axis:false` : rester dans le `boundingbox`
Un axe custom (`board.create("axis",[[x1,y1],[x2,y2]],...)`) fixé par habitude sur `y=0` sans vérifier que cette valeur est dans le `boundingbox` réel (ex. grandeurs toujours positives, potentiel redox 0.3V–1.8V) → l'axe se dessine hors du cadre visible, sans erreur.

**OBLIGATOIRE** : caler l'axe sur une valeur réellement présente dans la plage visible (ex. le bord bas `yLow`), jamais `0` par défaut sans vérification.

## 4. Points indésirables sur un `polygon`
Un `polygon` crée des sommets déplaçables par défaut. Pour un cadre strict : cacher les sommets (`vertices:{visible:false, fixed:true}`) et dessiner les bords manuellement avec `create('segment')` (ne génère aucun point).

## 5. Attacher un point à une courbe : `glider`
Ne pas créer un `point` puis lier ses coordonnées avec des fonctions complexes — utiliser `create('glider', [x, y, objetCourbe])` : le point glisse mathématiquement sur la courbe.

## 6. Couper une courbe (clip)
Régler le `boundingbox` exactement aux dimensions de l'écran plutôt que de faire des maths de découpe — le moteur SVG/Canvas de l'iframe gère le reste.

## 7. Plein écran en iframe
`element.requestFullscreen()` bloque sur un conteneur interne dans un `srcdoc`. Appeler obligatoirement sur la racine de l'iframe : `document.documentElement.requestFullscreen()`.

## 8. Fatwall Elea / HTMLPurifier
Les ENT (ex Elea) suppriment silencieusement boutons/id placés dans le texte normal de la question (hors JSXGraph). C'est pourquoi cibler un bouton par id/data-attribute depuis le JS échoue systématiquement — le bouton n'existe plus au moment de l'exécution. → Pattern Overlay Absolu (Pôle 6.8) obligatoire.

---

# Manifeste StackForge : Oscilloscope JSXGraph (Cheat Sheet)

À utiliser dès que la question porte sur un oscilloscope / signal électrique / RC.

## Règles d'or
1. Dans `[[jsxgraph]]` : TOUJOURS `{#var#}`, JAMAIS `{@var@}`.
2. Aléatoire côté Maxima : `rand()`, pas `random()`.
3. Signaux carrés/triangulaires : `point` avec `drag:['x']`/`drag:['y']`, jamais `glider` (bug sur sommets).
4. Angles nets : `{numberPoints: 4000, doAdvancedPlot: false}` sur `functiongraph`.
5. Décalage XPOS : toujours soustraire `xp` à `xd` dans les fonctions mathématiques (bouton XPOS déplace la courbe).

## Socle Commun JS (à copier tel quel)
```javascript
var lSH=[5e-7,0.000001,0.000002,0.000005,0.00001,0.00002,0.00005,0.0001,0.0002,0.0005,0.001,0.002,0.005,0.01,0.02,0.05,0.1,0.2,0.5];
var lSV=[0.005,0.01,0.02,0.05,0.1,0.2,0.5,1,2,5,10];
var si=7, ti=9, xp=0, yp=0;

var fq = parseFloat("{#ma_frequence#}");
var um = parseFloat("{#ma_tension#}");

function SV(){return lSV[si];}
function SH(){return lSH[ti];}
function fV(v){return v<0.05?(v*1e3).toPrecision(3)+" mV":v+" V";}
function fT(s){
  return s<5e-5?(s*1e6).toPrecision(3)+" \u00B5s"
        :s<0.05?(s*1e3).toPrecision(3)+" ms"
        :s.toPrecision(3)+" s";
}
var bd=JXG.JSXGraph.initBoard(divid,{ boundingbox:[-5.4,4.5,5.4,-4.8], axis:false, grid:false, showNavigation:false, showCopyright:false, pan:{enabled:false}, zoom:{enabled:false} });

/* Grille et fond clair — copier-coller tel quel */
bd.create("polygon",[[-5,-4],[5,-4],[5,4],[-5,4]], {fillColor:"#ffffff",fillOpacity:1,strokeWidth:0, fixed:true,layer:0,highlight:false, vertices:{visible:false, fixed:true}, borders:{visible:false}});
bd.create("segment",[[-5,-4],[5,-4]], {strokeColor:"#4b5563",strokeWidth:2,fixed:true,layer:0,highlight:false});
bd.create("segment",[[5,-4],[5,4]], {strokeColor:"#4b5563",strokeWidth:2,fixed:true,layer:0,highlight:false});
bd.create("segment",[[5,4],[-5,4]], {strokeColor:"#4b5563",strokeWidth:2,fixed:true,layer:0,highlight:false});
bd.create("segment",[[-5,4],[-5,-4]], {strokeColor:"#4b5563",strokeWidth:2,fixed:true,layer:0,highlight:false});
var gs={strokeColor:"#e5e7eb",strokeWidth:0.8,fixed:true,layer:1,highlight:false};
var gc={strokeColor:"#d1d5db",strokeWidth:1.2,fixed:true,layer:1,highlight:false};
var ts={strokeColor:"#9ca3af",strokeWidth:0.55,fixed:true,layer:1,highlight:false};
for(var xi=-4;xi<=4;xi++) bd.create("segment",[[xi,-4],[xi,4]],xi===0?gc:gs);
for(var yi=-3;yi<=3;yi++) bd.create("segment",[[-5,yi],[5,yi]],yi===0?gc:gs);
bd.create("segment",[[-5,0],[5,0]],gc);
bd.create("segment",[[0,-4],[0,4]],gc);
for(var xt=-5;xt<=5.01;xt+=0.2) if(Math.abs(xt%1)>0.05) bd.create("segment",[[xt,-0.07],[xt,0.07]],ts);
for(var yt=-4;yt<=4.01;yt+=0.2) if(Math.abs(yt%1)>0.05) bd.create("segment",[[-0.07,yt],[0.07,yt]],ts);
```

## Bibliothèque de signaux

**Sinusoïde**
```javascript
var phase = Math.random() * 2 * Math.PI;
function phi0(){ var T=fq>0?1/fq:0; return T>0?Math.PI/2+10*Math.PI*SH()/T:0; }
function sinSig(xd){
  var T=fq>0?1/fq:0, s=SH(), sv=SV();
  if(T<=0) return 0;
  var y = um/sv * Math.cos(2*Math.PI*s*(xd-xp)/T - phi0() + phase) + yp;
  return y>4.5?4.5:y<-4.5?-4.5:y;
}
/* bd.create("functiongraph",[sinSig,-5,5], {strokeColor:"#2563eb",strokeWidth:3,...}); */
```

**Carré**
```javascript
function carreSig(xd){
  var s=SH(), sv=SV(), T=fq>0?1/fq:0;
  if(T<=0) return yp;
  var Td=T/s, ph=(((xd-xp)/Td)%1+1)%1;
  var y = (ph<0.5 ? um : -um)/sv + yp;
  return y>4.5?4.5:y<-4.5?-4.5:y;
}
/* bd.create("functiongraph",[carreSig,-5,5], {strokeColor:"#2563eb",strokeWidth:3, numberPoints:4000, doAdvancedPlot:false,...}); */
```

**Triangle**
```javascript
function triSig(xd){
  var s=SH(), sv=SV(), T=fq>0?1/fq:0;
  if(T<=0) return yp;
  var Td=T/s, ph=(((xd-xp)/Td+0.25)%1+1)%1;
  var raw = ph<0.5 ? (-um+4*um*ph) : (3*um-4*um*ph);
  var y = raw/sv + yp;
  return y>4.5?4.5:y<-4.5?-4.5:y;
}
/* bd.create("functiongraph",[triSig,-5,5], {strokeColor:"#2563eb",strokeWidth:3, numberPoints:4000, doAdvancedPlot:false,...}); */
```

**RC Charge** (`ta` injecté en ms depuis Maxima)
```javascript
function rcChargeSig(xd){
  var t=(xd-xp+5)*SH(), sv=SV();
  var y = t>=0 ? ev/sv*(1-Math.exp(-t/ta))+yp : 0+yp;
  return y>4.5?4.5:y<-4.5?-4.5:y;
}
```

**RC Décharge**
```javascript
function rcDechargeSig(xd){
  var t=(xd-xp+5)*SH(), sv=SV();
  var y = t>=0 ? ev/sv*Math.exp(-t/ta)+yp : ev/sv+yp;
  return y>4.5?4.5:y<-4.5?-4.5:y;
}
```

**Retard Ultrasons** (2 sinusoïdes)
```javascript
function sinRetard(xd, dt){
  var T=fq>0?1/fq:0, s=SH(), sv=SV();
  if(T<=0) return 0;
  var xd2 = xd - dt/s; /* dt = retard en ms */
  var y = um/sv * Math.cos(2*Math.PI*s*(xd2-xp)/T - phi0() + phase) + yp;
  return y>4.5?4.5:y<-4.5?-4.5:y;
}
/* Tracer CH1 (dt=0) puis CH2 (dt différent) */
```

## Curseurs et barre de contrôle
Réutiliser tels quels les blocs `CURSEURS VIOLETS`/`CURSEURS ROUGES` et la barre de contrôle (V/div, t/div, YPOS) standardisés d'un exercice précédent, avec la fonction `toggleGroup` pour cacher/afficher via boutons ■X/■Y.

## Préparation Maxima (côté questionvariables)
Toujours préparer les réponses avec `stackunits()` :
```maxima
ev_val: 2.0 + rand(10)/10$ /* Tension entre 2 et 3 V */
ta_val: 1.0 + rand(10)/10$ /* Tau entre 1 et 2 ms */

ta_tau: stackunits(ta_val, ms)$
ta_E: stackunits(ev_val, V)$
tau_unit: ms$
E_unit: V$
```

## PRT Intelligent à 6 nœuds (valeur + unité, 2 grandeurs)
```maxima
/* Extraction unité réponse 1 (ex tau) */
stud_si_tau : stack_unit_si_to_si_base(ans_tau)$
teach_si_tau : tau_unit$
v_pure_e_tau : subst(map(lambda([u], u=1), listofvars(stud_si_tau)), stud_si_tau)$
v_pure_t_tau : subst(map(lambda([u], u=1), listofvars(teach_si_tau)), teach_si_tau)$
eleve_unit_tau : 2 * stud_si_tau / v_pure_e_tau$
teacher_unit_tau : 2 * teach_si_tau / v_pure_t_tau$
/* Répéter pour la réponse 2, ex E */
```
Structure :
- Nœud 0 (Unité 1) : `UnitsAbsolute` eleve_unit_tau/teacher_unit_tau → Vrai +0.25 → Nœud 1
- Nœud 1 (Valeur 1) : `UnitsRelative` ans_tau/ta_tau (opt 0.05) → Vrai +0.25 → Nœud 2
- Nœud 2 (Unité 2) : `UnitsAbsolute` eleve_unit_E/teacher_unit_E → Vrai +0.25 → Nœud 3
- Nœud 3 (Valeur 2) : `UnitsRelative` ans_E/ta_E (opt 0.05) → Vrai +0.25 → Fin
- Nœud 4 (Fallback/Cohérence) : si Nœud 1 faux, tester quand même unité+valeur de E ; feedback jaune si E juste mais Tau faux.
- Nœud 5 (Cohérence math, ex Ultrasons) : si Δt faux, `d_calc_eleve: v*ans_dt/2$`, comparer à `ans_d` ; feedback jaune si formule cohérente malgré Δt faux.
