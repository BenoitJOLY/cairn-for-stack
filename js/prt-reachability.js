// ── ATTEIGNABILITÉ DES BRANCHES PRT — analyse statique pure ──
// Détecte les nœuds PRT dont une branche (vraie ou fausse) ne peut mathématiquement
// jamais se déclencher : un ancêtre sur le chemin qui mène à ce nœud a déjà testé le
// même triplet (answertest, sans, tans) et a évalué faux (resp. vrai) pour qu'on
// arrive ici — donc le nœud, testant à nouveau exactement la même condition, ne peut
// évaluer que faux (resp. vrai) lui aussi. Module pur (aucune dépendance DOM/Maxima),
// chargé uniquement par scripts/check-prt-reachability.js — jamais depuis index.html.
function _prtReachTestKey(n) {
    return n.answertest + '' + n.sans + '' + n.tans;
}

function computePrtReachability(nodes) {
    var reach = {};
    if (!nodes || !nodes.length) return reach;

    var byName = {};
    nodes.forEach(function (n) { byName[n.name] = n; reach[n.name] = { trueReachable: false, falseReachable: false }; });

    var pointed = {};
    nodes.forEach(function (n) {
        if (n.truenextnode !== '-1') pointed[n.truenextnode] = true;
        if (n.falsenextnode !== '-1') pointed[n.falsenextnode] = true;
    });
    var rootName = null;
    for (var i = 0; i < nodes.length; i++) {
        if (!pointed[nodes[i].name]) { rootName = nodes[i].name; break; }
    }
    if (rootName === null) rootName = nodes[0].name;

    var visiting = {};
    function visit(name, knownFalse, knownTrue) {
        var n = byName[name];
        if (!n) return;
        var key = _prtReachTestKey(n);
        var trueOK = knownFalse.indexOf(key) === -1;
        var falseOK = knownTrue.indexOf(key) === -1;
        if (trueOK) reach[name].trueReachable = true;
        if (falseOK) reach[name].falseReachable = true;

        if (visiting[name]) return; // garde-fou anti-cycle
        visiting[name] = true;

        if (trueOK && n.truenextnode !== '-1') visit(n.truenextnode, knownFalse, knownTrue.concat([key]));
        if (falseOK && n.falsenextnode !== '-1') visit(n.falsenextnode, knownFalse.concat([key]), knownTrue);

        visiting[name] = false;
    }

    visit(rootName, [], []);
    return reach;
}

// fail-open : un nœud absent de reachMap (orphelin, jamais visité par le DFS) est
// considéré atteignable par défaut, pour ne jamais signaler un faux positif sur une
// entrée mal formée plutôt qu'une vraie branche morte.
function isPrtFeedbackReachable(reachMap, nodeName, branch) {
    var r = reachMap && reachMap[nodeName];
    if (!r) return true;
    return branch === 'true' ? r.trueReachable : r.falseReachable;
}

// findDanglingNodeRefs : détecte un truenextnode/falsenextnode qui ne correspond au
// <name> d'AUCUN nœud du PRT (autre que '-1', qui signifie "nœud terminal"). C'est
// précisément la classe de bug qui a cassé l'import Moodle du type "avancement" : un
// nœud nommé de façon descriptive (ex. "ninit1") au lieu de son indice séquentiel de
// position, alors que d'autres nœuds le référençaient par cet indice — Moodle ne
// retrouve alors plus le nœud suivant et l'import échoue ("Unsupported operand types:
// string + int"). computePrtReachability() ne la détecte PAS : elle est fail-open sur
// les références inconnues (byName[name] undefined -> visit() retourne silencieusement).
function findDanglingNodeRefs(nodes) {
    var problems = [];
    if (!nodes || !nodes.length) return problems;
    var names = {};
    nodes.forEach(function (n) { names[n.name] = true; });
    nodes.forEach(function (n) {
        ['true', 'false'].forEach(function (branch) {
            var target = branch === 'true' ? n.truenextnode : n.falsenextnode;
            if (target != null && String(target) !== '-1' && !names[target]) {
                problems.push({ name: n.name, branch: branch, target: target });
            }
        });
    });
    return problems;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        computePrtReachability: computePrtReachability,
        isPrtFeedbackReachable: isPrtFeedbackReachable,
        findDanglingNodeRefs: findDanglingNodeRefs
    };
}
