// Tests unitaires du moteur physique pur de gen-cinematique-physics.js
// (digitalisation manuelle des points Mᵢ : conversion pixel→mètres via
// calibration, puis vᵢ/vᵢ₊₁/Δv par différences consécutives).
//
// Lancer :  npm test
//
// Ces fonctions ne lisent jamais document : tout est passé en paramètres
// (points, calib, dt, iIdx). Voir test/unit/gen-avancement.test.js pour le
// même découpage deps-injectable.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const {
    cinPointsToMeters, cinComputeAll
} = require(path.join('..', '..', 'js', 'gen-cinematique-physics.js'));

function approxEqual(a, b, eps, msg) {
    assert.ok(Math.abs(a - b) < (eps || 1e-6), (msg || '') + ` (attendu ~${b}, obtenu ${a})`);
}

// ── cinPointsToMeters ───────────────────────────────────────────────
test('cinPointsToMeters : calibration 100px = 1m, repère à l\'origine -> conversion directe', () => {
    const calib = { x1: 0, y1: 0, x2: 100, y2: 0, realDist: 1 };
    const points = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 50, y: -50 }];
    const M = cinPointsToMeters(points, calib);
    approxEqual(M[0][0], 0); approxEqual(M[0][1], 0);
    approxEqual(M[1][0], 1); approxEqual(M[1][1], 0);
    approxEqual(M[2][0], 0.5); approxEqual(M[2][1], 0.5); // y image vers le bas -> inversé
});

test('cinPointsToMeters : échelle non unitaire (200px = 2m) et origine décalée', () => {
    const calib = { x1: 10, y1: 10, x2: 210, y2: 10, realDist: 2 };
    const points = [{ x: 10, y: 10 }, { x: 110, y: 10 }];
    const M = cinPointsToMeters(points, calib);
    approxEqual(M[0][0], 0); approxEqual(M[0][1], 0);
    approxEqual(M[1][0], 1); approxEqual(M[1][1], 0); // 100px * (2/200) = 1m
});

// ── cinComputeAll : cas d'échec ──────────────────────────────────────
test('cinComputeAll : moins de 3 points -> failReason "notEnoughPoints"', () => {
    const calib = { x1: 0, y1: 0, x2: 100, y2: 0, realDist: 1 };
    const res = cinComputeAll([{ x: 0, y: 0 }, { x: 10, y: 0 }], calib, 0.1, 0);
    assert.equal(res.ok, false);
    assert.equal(res.failReason, 'notEnoughPoints');
});

test('cinComputeAll : calibration absente -> failReason "badCalib"', () => {
    const points = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 20, y: 0 }];
    const res = cinComputeAll(points, null, 0.1, 0);
    assert.equal(res.ok, false);
    assert.equal(res.failReason, 'badCalib');
});

test('cinComputeAll : distance réelle nulle -> failReason "badCalib"', () => {
    const points = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 20, y: 0 }];
    const calib = { x1: 0, y1: 0, x2: 100, y2: 0, realDist: 0 };
    const res = cinComputeAll(points, calib, 0.1, 0);
    assert.equal(res.ok, false);
    assert.equal(res.failReason, 'badCalib');
});

test('cinComputeAll : les 2 repères de calibration confondus -> failReason "badCalib"', () => {
    const points = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 20, y: 0 }];
    const calib = { x1: 50, y1: 50, x2: 50, y2: 50, realDist: 1 };
    const res = cinComputeAll(points, calib, 0.1, 0);
    assert.equal(res.ok, false);
    assert.equal(res.failReason, 'badCalib');
});

test('cinComputeAll : indice i hors limites -> failReason "badIndex"', () => {
    // 3 points -> iMax = 3-3 = 0. i=1 est hors limites.
    const calib = { x1: 0, y1: 0, x2: 100, y2: 0, realDist: 1 };
    const points = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 20, y: 0 }];
    const res = cinComputeAll(points, calib, 0.1, 1);
    assert.equal(res.ok, false);
    assert.equal(res.failReason, 'badIndex');
    assert.equal(res.iIdx, 1);
    assert.equal(res.iMax, 0);
});

// ── cinComputeAll : cas nominal, vérifiable analytiquement ───────────
// Calibration : 100px = 1m, repère à l'origine pixel (0,0). Points digitalisés
// en ligne, espacés de 100px en x (donc 1m), Δt=0.1s -> vitesse constante 10 m/s.
test('cinComputeAll : mouvement rectiligne uniforme -> vi = vip1, dv = 0', () => {
    const calib = { x1: 0, y1: 0, x2: 100, y2: 0, realDist: 1 };
    const points = [
        { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 200, y: 0 }, { x: 300, y: 0 }
    ];
    const res = cinComputeAll(points, calib, 0.1, 1);
    assert.equal(res.ok, true);
    assert.equal(res.iIdx, 1);
    assert.equal(res.iMax, 1);
    assert.equal(res.Mlist.length, 4);

    approxEqual(res.vi[0], 10, 1e-9, 'vi.x');
    approxEqual(res.vi[1], 0, 1e-9, 'vi.y');
    approxEqual(res.vip1[0], 10, 1e-9, 'vip1.x');
    approxEqual(res.vip1[1], 0, 1e-9, 'vip1.y');
    approxEqual(res.dv[0], 0, 1e-9, 'dv.x');
    approxEqual(res.dv[1], 0, 1e-9, 'dv.y');
    approxEqual(res.vi_norm, 10, 1e-9);
    approxEqual(res.vip1_norm, 10, 1e-9);
});

test('cinComputeAll : mouvement accéléré -> vi ≠ vip1, dv non nul', () => {
    // Points digitalisés avec un espacement croissant (0, 100, 250, 450 px en x).
    const calib = { x1: 0, y1: 0, x2: 100, y2: 0, realDist: 1 };
    const points = [
        { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 250, y: 0 }, { x: 450, y: 0 }
    ];
    const res = cinComputeAll(points, calib, 1, 1);
    assert.equal(res.ok, true);
    // vi = (M2-M1)/dt = (2.5-1)/1 = 1.5 m/s ; vip1 = (M3-M2)/dt = (4.5-2.5)/1 = 2 m/s
    approxEqual(res.vi[0], 1.5, 1e-9);
    approxEqual(res.vip1[0], 2, 1e-9);
    approxEqual(res.dv[0], 0.5, 1e-9);
});

test('cinComputeAll : kv (échelle d\'affichage Phase 2) est positif et fini', () => {
    const calib = { x1: 0, y1: 0, x2: 100, y2: 0, realDist: 1 };
    const points = [
        { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 200, y: 0 }, { x: 300, y: 0 }
    ];
    const res = cinComputeAll(points, calib, 0.1, 1);
    assert.equal(res.ok, true);
    assert.ok(res.kv > 0 && isFinite(res.kv));
});

test('cinComputeAll : boundingbox englobe tous les points digitalisés', () => {
    const calib = { x1: 0, y1: 0, x2: 100, y2: 0, realDist: 1 };
    const points = [
        { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 200, y: -100 }, { x: 300, y: 0 }
    ];
    const res = cinComputeAll(points, calib, 0.1, 1);
    assert.equal(res.ok, true);
    res.Mlist.forEach(function (m) {
        assert.ok(m[0] >= res.xmin && m[0] <= res.xmax, 'x dans boundingbox');
        assert.ok(m[1] >= res.ymin && m[1] <= res.ymax, 'y dans boundingbox');
    });
});

// ── cinComputeAll : non-régression — appel sans 5e argument ──────────
test('cinComputeAll : appel sans method (4 args) reproduit exactement le comportement "apres"', () => {
    const calib = { x1: 0, y1: 0, x2: 100, y2: 0, realDist: 1 };
    const points = [
        { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 250, y: 0 }, { x: 450, y: 0 }
    ];
    const resSansMethod = cinComputeAll(points, calib, 1, 1);
    const resApres = cinComputeAll(points, calib, 1, 1, 'apres');
    assert.deepEqual(resSansMethod, resApres);
    assert.equal(resSansMethod.method, 'apres');
    assert.equal(resSansMethod.iMin, 0);
    assert.equal(resSansMethod.vec1From, 1); assert.equal(resSansMethod.vec1To, 2);
    assert.equal(resSansMethod.vec2From, 2); assert.equal(resSansMethod.vec2To, 3);
    assert.deepEqual(resSansMethod.highlightIdx, [1, 2, 3]);
});

// ── cinComputeAll : méthode de la dérivée symétrique ──────────────────
test('cinComputeAll : method="symetrique", iMin=1, iIdx=0 hors limites -> badIndex', () => {
    const calib = { x1: 0, y1: 0, x2: 100, y2: 0, realDist: 1 };
    const points = [
        { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 200, y: 0 }, { x: 300, y: 0 }, { x: 400, y: 0 }
    ];
    const res = cinComputeAll(points, calib, 0.1, 0, 'symetrique');
    assert.equal(res.ok, false);
    assert.equal(res.failReason, 'badIndex');
    assert.equal(res.iIdx, 0);
    assert.equal(res.iMin, 1);
});

test('cinComputeAll : method="symetrique", vec1From/To et vec2From/To sautent le point médian', () => {
    const calib = { x1: 0, y1: 0, x2: 100, y2: 0, realDist: 1 };
    const points = [
        { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 200, y: 0 }, { x: 300, y: 0 }, { x: 400, y: 0 }
    ];
    const res = cinComputeAll(points, calib, 0.1, 1, 'symetrique');
    assert.equal(res.ok, true);
    assert.equal(res.iMin, 1);
    assert.equal(res.iMax, 2); // Mlist.length(5) - 3
    assert.equal(res.vec1From, 0); assert.equal(res.vec1To, 2);
    assert.equal(res.vec2From, 1); assert.equal(res.vec2To, 3);
    assert.equal(res.divisor, 0.2); // 2*dt
    assert.deepEqual(res.highlightIdx, [0, 1, 2, 3]);
});

test('cinComputeAll : method="symetrique", formule vi=(M_{i+1}-M_{i-1})/(2dt) vérifiée analytiquement (mouvement accéléré)', () => {
    // Mêmes points que le test "mouvement accéléré" (méthode apres) : M0=0, M1=1, M2=2.5, M3=4.5 (m), dt=1.
    const calib = { x1: 0, y1: 0, x2: 100, y2: 0, realDist: 1 };
    const points = [
        { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 250, y: 0 }, { x: 450, y: 0 }
    ];
    const res = cinComputeAll(points, calib, 1, 1, 'symetrique');
    assert.equal(res.ok, true);
    assert.equal(res.iMin, 1); assert.equal(res.iMax, 1); // seul iIdx=1 valide pour 4 points
    // vi = (M2-M0)/(2*1) = (2.5-0)/2 = 1.25 ; vip1 = (M3-M1)/(2*1) = (4.5-1)/2 = 1.75
    approxEqual(res.vi[0], 1.25, 1e-9);
    approxEqual(res.vip1[0], 1.75, 1e-9);
    approxEqual(res.dv[0], 0.5, 1e-9);
});

test('cinComputeAll : method="symetrique" sur mouvement rectiligne uniforme -> vi = vip1, dv = 0', () => {
    const calib = { x1: 0, y1: 0, x2: 100, y2: 0, realDist: 1 };
    const points = [
        { x: 0, y: 0 }, { x: 100, y: 0 }, { x: 200, y: 0 }, { x: 300, y: 0 }
    ];
    const res = cinComputeAll(points, calib, 0.1, 1, 'symetrique');
    assert.equal(res.ok, true);
    approxEqual(res.vi[0], 10, 1e-9);
    approxEqual(res.vip1[0], 10, 1e-9);
    approxEqual(res.dv[0], 0, 1e-9);
});
