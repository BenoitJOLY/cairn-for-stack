import json, re, sys
from py_mini_racer import MiniRacer

def gen(fn_name, args_js):
    ctx = MiniRacer()
    ctx.eval("""
    var FORM = {};
    function v(id){ return FORM[id] !== undefined ? FORM[id] : ''; }
    function richVal(id){ return FORM[id] !== undefined ? FORM[id] : ''; }
    var window = this;
    window.I18N = { t: function(k){ return k; } };
    window.v = v; window.richVal = richVal;
    window.stack_js = { resize_containing_frame: function(){} };
    window.document = {
        readyState: 'complete',
        addEventListener: function(){},
        getElementById: function(){ return { addEventListener: function(){}, value: '', getContext: function(){ return null; } }; }
    };
    document = window.document;
    """)
    for f in ['js/gen-math-shared.js', 'js/prt-manager.js', 'js/gen-optique.js']:
        ctx.eval(open(f, encoding='utf-8').read())
    ctx.eval("""
    FORM['opt-bareme']='1'; FORM['opt-text']='Enonce test';
    FORM['opt-f']='3'; FORM['opt-oa']='-6'; FORM['opt-ab']='1.5';
    FORM['opt-mir-f']='3'; FORM['opt-mir-sa']='7'; FORM['opt-mir-ab']='1.5';
    FORM['opt-w']='700'; FORM['opt-h']='380';
    FORM['opt-fb-ok']=''; FORM['opt-fb-wrong']=''; FORM['opt-fbgen']='';
    """)
    ctx.eval(f"var __r = {fn_name}({args_js});")
    r = json.loads(ctx.eval("JSON.stringify(__r)"))
    return r['kbdRaw']

def extract_jxg(kbd):
    m = re.search(r'\]\]\n([\s\S]*)\n\[\[/jsxgraph\]\]', kbd)
    return m.group(1)

scenarios = [
    ('LENTILLE_CONVERGENTE', '_genOptiqueLentilleRayons', '1'),
    ('LENTILLE_DIVERGENTE', '_genOptiqueLentilleDivergente', '1'),
    ('MIROIR_CONCAVE', '_genOptiqueMiroirCore', '1, false'),
    ('MIROIR_CONVEXE', '_genOptiqueMiroirCore', '1, true'),
]

jxg_by_label = {}
for label, fn, args in scenarios:
    kbd = gen(fn, args)
    jxg_by_label[label] = extract_jxg(kbd)

# Build one big HTML harness that runs all 4 scenarios sequentially in one page.
parts = []
parts.append("""<!doctype html>
<html><head><meta charset="utf-8"><title>harness</title>
<link rel="stylesheet" href="/lib/jsxgraph/jsxgraph.css">
</head><body>
<div id="log" style="white-space:pre-wrap;font-family:monospace;font-size:12px;"></div>
<script src="/lib/jsxgraph/jsxgraphcore.js"></script>
<script type="module">
import { stack_jxg } from '/test/moodle-qtype_stack-master/corsscripts/stackjsxgraph.js';
window.stack_jxg = stack_jxg;
window.stack_js = { resize_containing_frame: function(){} };

var LOG = [];
function log(s){ LOG.push(s); document.getElementById('log').textContent = LOG.join('\\n'); }
window.__log = log;
window.onerror = function(msg, src, line, col, err){
    log('WINDOW ERROR: ' + msg + ' @' + line + ':' + col + (err && err.stack ? ('\\n' + err.stack) : ''));
    return false;
};

var results = {};
window.__results = results;

function runScenario(label, jxgSrc, drawFn) {
    log('=== ' + label + ' : PASSE 1 (dessin initial) ===');
    var div1 = document.createElement('div'); div1.id = 'board_' + label + '_1'; div1.style.width='300px'; div1.style.height='200px';
    document.body.appendChild(div1);
    var in1 = document.createElement('input'); in1.type = 'text'; in1.id = 'input_' + label + '_1'; in1.value = '';
    document.body.appendChild(in1);

    // Hook: expose internal fns right before custom_bind call, works for both single-input variants.
    var hookMarker = 'stack_jxg.custom_bind(state';
    var idx = jxgSrc.indexOf(hookMarker);
    if (idx === -1) { log(label + ': COULD NOT FIND custom_bind ANCHOR'); results[label] = 'FAIL-NO-ANCHOR'; return; }
    var expose = 'window.__hook_' + label + ' = { addRayFromPieces: addRayFromPieces, serialiser: serialiser, deserialiser: deserialiser, ' +
        'board: board, logicalRaysRef: function(){ return logicalRays; }, standaloneElementsRef: function(){ return standaloneElements; } };\\n';
    var patched1 = jxgSrc.slice(0, idx) + expose + jxgSrc.slice(idx);

    try {
        window.divid = div1.id;
        window.state = in1.id;
        (0, eval)(patched1);
        log(label + ': board init (pass 1) OK');
    } catch (e) {
        log(label + ': INIT THREW (pass1): ' + e.message + '\\n' + e.stack);
        results[label] = 'FAIL-INIT1';
        return;
    }

    var t1 = window['__hook_' + label];
    if (!t1) { log(label + ': NO HOOK (pass1)'); results[label] = 'FAIL-NOHOOK1'; return; }

    try {
        drawFn(t1);
        log(label + ': draw OK, logicalRays=' + t1.logicalRaysRef().length + ', standalone=' + t1.standaloneElementsRef().length);
    } catch (e) {
        log(label + ': DRAW THREW: ' + e.message + '\\n' + e.stack);
        results[label] = 'FAIL-DRAW';
        return;
    }

    var savedValue;
    try {
        savedValue = t1.serialiser();
        log(label + ': serialised value (pass1) = ' + savedValue);
    } catch (e) {
        log(label + ': SERIALISE THREW: ' + e.message + '\\n' + e.stack);
        results[label] = 'FAIL-SERIALISE';
        return;
    }

    log('=== ' + label + ' : PASSE 2 (rechargement a froid, simule reouverture Moodle) ===');
    var div2 = document.createElement('div'); div2.id = 'board_' + label + '_2'; div2.style.width='300px'; div2.style.height='200px';
    document.body.appendChild(div2);
    var in2 = document.createElement('input'); in2.type = 'text'; in2.id = 'input_' + label + '_2'; in2.value = savedValue;
    document.body.appendChild(in2);

    // Fresh eval of the SAME original (unpatched) jxg source, exactly as a real page reload would run it,
    // except we again splice a hook so we can read back the reconstructed state and re-serialise it.
    var patched2 = jxgSrc.slice(0, idx) + expose.replace(new RegExp('__hook_' + label, 'g'), '__hook2_' + label) + jxgSrc.slice(idx);

    try {
        window.divid = div2.id;
        window.state = in2.id;
        (0, eval)(patched2);
        log(label + ': board init (pass 2, avec valeur existante) OK');
    } catch (e) {
        log(label + ': INIT THREW (pass2): ' + e.message + '\\n' + e.stack);
        results[label] = 'FAIL-INIT2';
        return;
    }

    var t2 = window['__hook2_' + label];
    if (!t2) { log(label + ': NO HOOK (pass2)'); results[label] = 'FAIL-NOHOOK2'; return; }

    var reserialised;
    try {
        reserialised = t2.serialiser();
        log(label + ': logicalRays after reload=' + t2.logicalRaysRef().length + ', standalone after reload=' + t2.standaloneElementsRef().length);
        log(label + ': re-serialised (pass2) = ' + reserialised);
    } catch (e) {
        log(label + ': RE-SERIALISE THREW: ' + e.message + '\\n' + e.stack);
        results[label] = 'FAIL-RESERIALISE';
        return;
    }

    var match = (reserialised === savedValue);
    log(label + ': MATCH APRES RECHARGEMENT = ' + match);
    results[label] = match ? 'OK' : ('MISMATCH: ' + savedValue + ' !== ' + reserialised);
}
""")

# Now inject each scenario's jxg source as a JS string constant, and a draw function
# tailored to what that scenario's toolbar exposes (addRayFromPieces signature is shared).
draw_snippets = {
    'LENTILLE_CONVERGENTE': """function(t){
        t.addRayFromPieces(0, 1.5, false, null, [[-6,0,1],[0,7,1]]);
        t.addRayFromPieces(-0.2, 0, false, null, [[-7,7,1]]);
        var p1 = t.board.create('point', [6,-1.5], { name: \"B'\", size:4, color:'black', fixed:true, highlight:false, tabindex:null });
        var p2 = t.board.create('point', [6,0], { name: \"A'\", size:4, color:'black', fixed:true, highlight:false, tabindex:null });
        t.standaloneElementsRef().push(p1, p2);
        t.board.update();
    }""",
    'LENTILLE_DIVERGENTE': """function(t){
        t.addRayFromPieces(0, 1.5, false, null, [[-6,0,1]]);
        t.addRayFromPieces(-0.2, 0, false, null, [[-7,7,1]]);
        var p1 = t.board.create('point', [-2,0.5], { name: \"B'\", size:4, color:'black', fixed:true, highlight:false, tabindex:null });
        var p2 = t.board.create('point', [-2,0], { name: \"A'\", size:4, color:'black', fixed:true, highlight:false, tabindex:null });
        t.standaloneElementsRef().push(p1, p2);
        t.board.update();
    }""",
    'MIROIR_CONCAVE': """function(t){
        t.addRayFromPieces(0, 1.5, false, null, [[-7,0,1]]);
        t.addRayFromPieces(-0.2, 0, false, null, [[-7,7,1]]);
        var p1 = t.board.create('point', [-5.2,-1.1], { name: \"B'\", size:4, color:'black', fixed:true, highlight:false, tabindex:null });
        var p2 = t.board.create('point', [-5.2,0], { name: \"A'\", size:4, color:'black', fixed:true, highlight:false, tabindex:null });
        t.standaloneElementsRef().push(p1, p2);
        t.board.update();
    }""",
    'MIROIR_CONVEXE': """function(t){
        t.addRayFromPieces(0, 1.5, false, null, [[-7,0,1]]);
        t.addRayFromPieces(-0.2, 0, false, null, [[-7,7,1]]);
        var p1 = t.board.create('point', [2.1,0.5], { name: \"B'\", size:4, color:'black', fixed:true, highlight:false, tabindex:null });
        var p2 = t.board.create('point', [2.1,0], { name: \"A'\", size:4, color:'black', fixed:true, highlight:false, tabindex:null });
        t.standaloneElementsRef().push(p1, p2);
        t.board.update();
    }""",
}

for label, _, _ in scenarios:
    js_src_escaped = json.dumps(jxg_by_label[label])
    parts.append(f"var jxg_{label} = {js_src_escaped};\n")

parts.append("function run() {\n")
for label, _, _ in scenarios:
    parts.append(f"  runScenario('{label}', jxg_{label}, {draw_snippets[label]});\n")
parts.append("""
  document.title = 'DONE:' + JSON.stringify(results);
  window.__done = true;
}
run();
</script>
</body></html>
""")

open('_test/harness2.html', 'w', encoding='utf-8').write(''.join(parts))
print('wrote _test/harness2.html')
