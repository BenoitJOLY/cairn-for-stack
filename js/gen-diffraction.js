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

/* CAIRN FOR STACK - Generateur Interferences-Diffraction (JSXGraph)
   3 types de mesure : fente_simple, fente_double, young
   2 modes par type : ecran (mesure directe sur la figure), capteur (figure + courbe I(distance))
   La figure de diffraction/interferences est toujours affichee, quel que soit le mode. */

var DIFF_LASERS = [[405, "blue"], [520, "green"], [532, "green"], [635, "red"], [650, "red"]];

var DIFF_A_LIST = [20, 30, 40, 50, 60, 80, 100];
var DIFF_D_LIST = [1, 1.5, 2, 2.5, 3];
var DIFF_B_LIST = [200, 250, 300, 350, 400, 450, 500];

var DIFF_INFO_TYPES = ["fente_simple", "fente_double", "young", "trou_circulaire", "trou_carre"];
var DIFF_INFO_MODES = ["ecran", "capteur"];
function _diffInfoText(type, mode) {
  if (DIFF_INFO_TYPES.indexOf(type) === -1 || DIFF_INFO_MODES.indexOf(mode) === -1) return "";
  return I18N.t("diff.info_" + type + "_" + mode);
}

function _diffNeedsB(type) { return type === "fente_double" || type === "young"; }

function _diffColorHex(lambdaNm) {
  if (lambdaNm < 500) return "#1d4ed8";
  if (lambdaNm < 600) return "#16a34a";
  return "#dc2626";
}

function _diffColorRgb(lambdaNm) {
  if (lambdaNm < 500) return [29, 78, 216];
  if (lambdaNm < 600) return [22, 163, 74];
  return [220, 38, 38];
}

function _diffBesselJ1Src() {
  return function besselJ1(x) {
    if (Math.abs(x) < 1e-8) return x / 2;
    var ax = Math.abs(x), y, ans1, ans2;
    if (ax < 8.0) {
      y = x * x;
      ans1 = x * (72362614232.0 + y * (-7895059235.0 + y * (242396853.1 + y * (-2972611.439 + y * (15704.48260 + y * (-30.16036606))))));
      ans2 = 144725228442.0 + y * (2300535178.0 + y * (18583304.74 + y * (99447.43394 + y * (376.9991397 + y * 1.0))));
      return ans1 / ans2;
    }
    var z = 8.0 / ax; y = z * z;
    var xx = ax - 2.356194491;
    ans1 = 1.0 + y * (0.183105e-2 + y * (-0.3516396496e-4 + y * (0.2457520174e-5 + y * (-0.240337019e-6))));
    ans2 = 0.04687499995 + y * (-0.2002690873e-3 + y * (0.8449199096e-5 + y * (-0.88228987e-6 + y * 0.105787412e-6)));
    var ans = Math.sqrt(0.636619772 / ax) * (Math.cos(xx) * ans1 - z * Math.sin(xx) * ans2);
    return x < 0.0 ? -ans : ans;
  };
}

var _diffBesselJ1JsSrc = "    function besselJ1(x) {\n"
  + "        if (Math.abs(x) < 1e-8) return x / 2;\n"
  + "        var ax = Math.abs(x), y, ans1, ans2;\n"
  + "        if (ax < 8.0) {\n"
  + "            y = x * x;\n"
  + "            ans1 = x * (72362614232.0 + y * (-7895059235.0 + y * (242396853.1 + y * (-2972611.439 + y * (15704.48260 + y * (-30.16036606))))));\n"
  + "            ans2 = 144725228442.0 + y * (2300535178.0 + y * (18583304.74 + y * (99447.43394 + y * (376.9991397 + y * 1.0))));\n"
  + "            return ans1 / ans2;\n"
  + "        }\n"
  + "        var z = 8.0 / ax; y = z * z;\n"
  + "        var xx = ax - 2.356194491;\n"
  + "        ans1 = 1.0 + y * (0.183105e-2 + y * (-0.3516396496e-4 + y * (0.2457520174e-5 + y * (-0.240337019e-6))));\n"
  + "        ans2 = 0.04687499995 + y * (-0.2002690873e-3 + y * (0.8449199096e-5 + y * (-0.88228987e-6 + y * 0.105787412e-6)));\n"
  + "        var ans = Math.sqrt(0.636619772 / ax) * (Math.cos(xx) * ans1 - z * Math.sin(xx) * ans2);\n"
  + "        return x < 0.0 ? -ans : ans;\n"
  + "    }";

/* ── Templates JSXGraph (placeholders STACK {#a1#} {#D1#} {#b1#} {#lambda#}) ── */

function _diffTplBarres(withGlider) {
  var reticuleBlock = !withGlider ? "" : `
    var axeHorizontal = board.create('line', [[0, yCenter], [1, yCenter]], { visible: false, fixed: true });
    var pointMobile = board.create('glider', [0, yCenter, axeHorizontal], {
        name: '', size: 4, fillColor: '#FFFFFF', strokeColor: '#FFFFFF', layer: 4, showInfobox: false, fixed: false
    });
    var ligneReticule = board.create('line', [
        [function() { return pointMobile.X(); }, -0.2],
        [function() { return pointMobile.X(); }, 1.2]
    ], { strokeColor: '#FFFFFF', strokeWidth: 1.5, dash: 1, straightFirst: false, straightLast: false, fixed: true, highlight: false, layer: 3 });
    board.create('text', [
        function() { return pointMobile.X(); }, 1.05,
        function() { return 'x = ' + (pointMobile.X() * 1000).toFixed(2) + ' mm'; }
    ], { fontSize: 14, color: '#FFFFFF', anchorX: 'middle', anchorY: 'bottom', fixed: true, layer: 4, highlight: false,
        cssStyle: 'background: rgba(0,0,0,0.8); padding: 4px 8px; border-radius: 4px;' });`;
  return `[[jsxgraph width="700px" height="250px"]]
(function() {
    var a = {#a1#} * 1e-6;
    var D = {#D1#};
    var lambda = {#lambda#} * 1e-9;
    var lambdaNm = {#lambda#};
    var laserRGB;
    if (lambdaNm < 500) { laserRGB = [29, 78, 216]; }
    else if (lambdaNm < 600) { laserRGB = [22, 163, 74]; }
    else { laserRGB = [220, 38, 38]; }

    var y_min = (lambda * D) / a;
    var xMax = y_min * 5.5;

    function intensite(y) {
        var beta = (Math.PI * a * y) / (lambda * D);
        if (Math.abs(beta) < 1e-10) return 1.0;
        var sinc = Math.sin(beta) / beta;
        return sinc * sinc;
    }

    var board = JXG.JSXGraph.initBoard(divid, {
        boundingbox: [-xMax, 1.2, xMax, -0.2], axis: false, showNavigation: false, showCopyright: false,
        keepaspectratio: false, renderer: 'svg', grid: false
    });
    document.getElementById(divid).style.backgroundColor = '#000000';

    const barHeight = 0.35;
    const yCenter = 0.5;

    var canvas = document.createElement('canvas');
    canvas.width = 700; canvas.height = 250;
    canvas.style.position = 'absolute'; canvas.style.top = '0'; canvas.style.left = '0';
    canvas.style.width = '100%'; canvas.style.height = '100%'; canvas.style.zIndex = '1'; canvas.style.pointerEvents = 'none';
    var ctx = canvas.getContext('2d');

    function redrawCanvas() {
        var bb = board.getBoundingBox();
        var xMinB = bb[0], yMaxB = bb[1], xMaxB = bb[2], yMinB = bb[3];
        var imageData = ctx.createImageData(canvas.width, canvas.height);
        for (var py = 0; py < canvas.height; py++) {
            var yPhys = yMaxB - (py / canvas.height) * (yMaxB - yMinB);
            var inBand = Math.abs(yPhys - yCenter) <= barHeight / 2;
            for (var px = 0; px < canvas.width; px++) {
                var idx = (py * canvas.width + px) * 4;
                if (!inBand) { imageData.data[idx + 3] = 0; continue; }
                var xPhys = xMinB + (px / canvas.width) * (xMaxB - xMinB);
                var I = intensite(xPhys);
                I = Math.pow(I, 0.6);
                var intensity = Math.min(1, I * 1.5);
                imageData.data[idx] = Math.floor(laserRGB[0] * intensity);
                imageData.data[idx + 1] = Math.floor(laserRGB[1] * intensity);
                imageData.data[idx + 2] = Math.floor(laserRGB[2] * intensity);
                imageData.data[idx + 3] = 255;
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }
    redrawCanvas();

    var boardDiv = document.getElementById(divid);
    boardDiv.style.position = 'relative';
    var svgEl = boardDiv.querySelector('svg');
    if (svgEl) { svgEl.style.position = 'relative'; svgEl.style.zIndex = '10'; boardDiv.insertBefore(canvas, svgEl); }
    else { boardDiv.appendChild(canvas); }
    board.on('boundingbox', function() { redrawCanvas(); });
${reticuleBlock}
})();
[[/jsxgraph]]`;
}

function _diffTplCourbeSimple(I18N_D) {
  return `[[jsxgraph width="700px" height="360px"]]
(function() {
    var a = {#a1#} * 1e-6;
    var D = {#D1#};
    var lambda = {#lambda#} * 1e-9;
    var lambdaNm = {#lambda#};
    var couleur = lambdaNm < 500 ? "#1d4ed8" : (lambdaNm < 600 ? "#16a34a" : "#dc2626");

    function calculateIntensity(y) {
        var theta = Math.atan(y / D);
        var beta = (Math.PI * a * Math.sin(theta)) / lambda;
        if (Math.abs(beta) < 0.0001) return 1.0;
        var sinc = Math.sin(beta) / beta;
        return sinc * sinc;
    }
    var firstMinimum = (lambda * D) / a;
    var xMax = Math.min(firstMinimum * 3.5, 0.1);

    var board = JXG.JSXGraph.initBoard(divid, {
        boundingbox: [-xMax, 1.2, xMax, -0.2], axis: true, showNavigation: true, showCopyright: false
    });
    board.defaultAxes.x.setAttribute({ name: ${JSON.stringify(I18N_D.t('diff.axis_position_y'))}, withLabel: true, label: { offset: [0, -20] } });
    board.defaultAxes.y.setAttribute({ name: ${JSON.stringify(I18N_D.t('diff.axis_intensite_normalisee'))}, withLabel: true, label: { offset: [-20, 0] } });

    board.create('functiongraph', [calculateIntensity, -xMax, xMax], { strokeColor: couleur, strokeWidth: 3, name: 'I(y)' });

    var cursor = board.create('glider', [0, 0.5, board.create('functiongraph', [calculateIntensity, -xMax, xMax], { visible: false })], {
        name: '', size: 4, fillColor: '#00AA00', strokeColor: '#00AA00', withLabel: false
    });
    board.create('line', [
        [function() { return cursor.X(); }, -0.2], [function() { return cursor.X(); }, 1.2]
    ], { strokeColor: '#00AA00', strokeWidth: 1, dash: 2, straightFirst: false, straightLast: false, fixed: true, highlight: false });

    board.create('text', [
        function() { return xMax * 0.4; }, 1.1,
        function() { return ${JSON.stringify(I18N_D.t('diff.readout_position_y'))} + (cursor.X() * 1000).toFixed(2) + ' mm'; }
    ], { fontSize: 13, strokeColor: '#006600', highlight: false });
    board.create('text', [
        function() { return xMax * 0.4; }, 1.0,
        function() { return ${JSON.stringify(I18N_D.t('diff.readout_intensity'))} + (calculateIntensity(cursor.X()) * 100).toFixed(1) + ' %'; }
    ], { fontSize: 13, strokeColor: '#CC0000', highlight: false });
})();
[[/jsxgraph]]`;
}

function _diffTplFranges(withGlider) {
  var reticuleBlock = !withGlider ? "" : `
    var axeHorizontal = board.create('line', [[0, yCenter], [1, yCenter]], { visible: false, fixed: true });
    var pointMobile = board.create('glider', [0, yCenter, axeHorizontal], {
        name: '', size: 4, fillColor: '#FFFFFF', strokeColor: '#FFFFFF', layer: 4, showInfobox: false, fixed: false
    });
    board.create('line', [
        [function() { return pointMobile.X(); }, -0.2],
        [function() { return pointMobile.X(); }, 1.2]
    ], { strokeColor: '#FFFFFF', strokeWidth: 1.5, dash: 1, straightFirst: false, straightLast: false, fixed: true, highlight: false, layer: 3 });
    board.create('text', [
        function() { return pointMobile.X(); }, 1.05,
        function() { return 'x = ' + (pointMobile.X() * 1000).toFixed(2) + ' mm'; }
    ], { fontSize: 14, color: '#FFFFFF', anchorX: 'middle', anchorY: 'bottom', fixed: true, layer: 4, highlight: false,
        cssStyle: 'background: rgba(0,0,0,0.8); padding: 4px 8px; border-radius: 4px;' });`;
  return `[[jsxgraph width="700px" height="250px"]]
(function() {
    var a = {#a1#} * 1e-6;
    var b = {#b1#} * 1e-6;
    var D = {#D1#};
    var lambda = {#lambda#} * 1e-9;
    var lambdaNm = {#lambda#};
    var couleur = lambdaNm < 500 ? "#1d4ed8" : (lambdaNm < 600 ? "#16a34a" : "#dc2626");

    function intensite(y) {
        var theta = Math.atan(y / D);
        var alpha = (Math.PI * a * Math.sin(theta)) / lambda;
        var beta = (Math.PI * b * Math.sin(theta)) / lambda;
        var diffraction = 1.0;
        if (Math.abs(alpha) > 0.0001) { var s = Math.sin(alpha) / alpha; diffraction = s * s; }
        return diffraction * Math.cos(beta) * Math.cos(beta);
    }
    var interfrange = (lambda * D) / b;
    var enveloppe = (lambda * D) / a;
    var xMax = Math.min(3 * enveloppe, 0.1);

    var board = JXG.JSXGraph.initBoard(divid, {
        boundingbox: [-xMax, 1.2, xMax, -0.2], axis: false, showNavigation: false, showCopyright: false,
        keepaspectratio: false, renderer: 'svg', grid: false
    });
    document.getElementById(divid).style.backgroundColor = '#000000';
    board.create('polygon', [[-xMax, -0.2], [xMax, -0.2], [xMax, 1.2], [-xMax, 1.2]], {
        fillColor: '#000000', strokeOpacity: 0, layer: 0, fixed: true, highlight: false, withLines: false, vertices: { visible: false }
    });

    const barHeight = 0.35;
    const yCenter = 0.5;
    var largeurBande = 0.35 * interfrange;
    var nMax = Math.ceil(xMax / interfrange) + 1;
    for (var k = -nMax; k <= nMax; k++) {
        var pos = k * interfrange;
        var I_k = intensite(pos);
        if (I_k > 0.02) {
            board.create('polygon', [
                [pos - largeurBande, yCenter - barHeight / 2], [pos + largeurBande, yCenter - barHeight / 2],
                [pos + largeurBande, yCenter + barHeight / 2], [pos - largeurBande, yCenter + barHeight / 2]
            ], { fillColor: couleur, fillOpacity: Math.min(1, I_k), strokeColor: '#000000', strokeWidth: 0, layer: 1, fixed: true, highlight: false, withLines: false, vertices: { visible: false } });
        }
    }
${reticuleBlock}
})();
[[/jsxgraph]]`;
}

function _diffTplCourbeDouble(I18N_D) {
  return `[[jsxgraph width="700px" height="400px"]]
(function() {
    var a = {#a1#} * 1e-6;
    var b = {#b1#} * 1e-6;
    var D = {#D1#};
    var lambda = {#lambda#} * 1e-9;
    var lambdaNm = {#lambda#};
    var couleur = lambdaNm < 500 ? "#1d4ed8" : (lambdaNm < 600 ? "#16a34a" : "#dc2626");

    var board = JXG.JSXGraph.initBoard(divid, {
        boundingbox: [-0.05, 1.2, 0.05, -0.2], axis: true, showNavigation: true, showCopyright: false
    });
    board.defaultAxes.x.setAttribute({ name: ${JSON.stringify(I18N_D.t('diff.axis_position_y'))}, withLabel: true, label: { offset: [0, -20] } });
    board.defaultAxes.y.setAttribute({ name: ${JSON.stringify(I18N_D.t('diff.axis_intensite_normalisee'))}, withLabel: true, label: { offset: [-20, 0] } });

    function calculateIntensity(y) {
        var theta = Math.atan(y / D);
        var alpha = (Math.PI * a * Math.sin(theta)) / lambda;
        var beta = (Math.PI * b * Math.sin(theta)) / lambda;
        var diffraction = 1.0;
        if (Math.abs(alpha) > 0.0001) { var s = Math.sin(alpha) / alpha; diffraction = s * s; }
        return diffraction * Math.cos(beta) * Math.cos(beta);
    }
    var largeurEnveloppe = (lambda * D) / a;
    var xMax = Math.min(largeurEnveloppe * 2, 0.1);
    board.setBoundingBox([-xMax, 1.2, xMax, -0.2]);

    board.create('functiongraph', [calculateIntensity, -xMax, xMax], { strokeColor: couleur, strokeWidth: 3, name: 'I(y)' });

    var cursor = board.create('point', [0, 0.5], { name: '', size: 4, fillColor: '#00AA00', strokeColor: '#00AA00', withLabel: false });
    board.create('line', [
        [function() { return cursor.X(); }, -0.2], [function() { return cursor.X(); }, 1.2]
    ], { strokeColor: '#00AA00', strokeWidth: 1, dash: 2, straightFirst: false, straightLast: false, fixed: true, highlight: false });
    board.create('line', [
        [-xMax, function() { return cursor.Y(); }], [xMax, function() { return cursor.Y(); }]
    ], { strokeColor: '#00AA00', strokeWidth: 1, dash: 2, straightFirst: false, straightLast: false, fixed: true, highlight: false });
    board.create('point', [
        function() { return cursor.X(); }, function() { return calculateIntensity(cursor.X()); }
    ], { name: '', size: 3, fillColor: '#FF6600', strokeColor: '#FF6600', fixed: true, highlight: false });

    board.create('text', [
        function() { return xMax * 0.4; }, 1.1,
        function() { return ${JSON.stringify(I18N_D.t('diff.readout_position_y'))} + (cursor.X() * 1000).toFixed(2) + ' mm'; }
    ], { fontSize: 13, strokeColor: '#006600', highlight: false });
    board.create('text', [
        function() { return xMax * 0.4; }, 1.0,
        function() { return ${JSON.stringify(I18N_D.t('diff.readout_intensity'))} + (calculateIntensity(cursor.X()) * 100).toFixed(1) + ' %'; }
    ], { fontSize: 13, strokeColor: '#CC0000', highlight: false });
})();
[[/jsxgraph]]`;
}

function _diffTplYoung2D(withGlider, I18N_D) {
  return `[[jsxgraph width="700px" height="500px"]]
(function() {
    var a1 = {#a1#};
    var D1 = {#D1#};
    var b1 = {#b1#};
    var lambda = {#lambda#};

    function getLaserColor(l) {
        if (l < 500) return [29, 78, 216];
        if (l < 600) return [22, 163, 74];
        return [220, 38, 38];
    }
    var laserRGB = getLaserColor(lambda);

    function besselJ1(x) {
        if (Math.abs(x) < 1e-8) return x / 2;
        var ax = Math.abs(x), y, ans1, ans2;
        if (ax < 8.0) {
            y = x * x;
            ans1 = x * (72362614232.0 + y * (-7895059235.0 + y * (242396853.1 + y * (-2972611.439 + y * (15704.48260 + y * (-30.16036606))))));
            ans2 = 144725228442.0 + y * (2300535178.0 + y * (18583304.74 + y * (99447.43394 + y * (376.9991397 + y * 1.0))));
            return ans1 / ans2;
        }
        var z = 8.0 / ax; y = z * z;
        var xx = ax - 2.356194491;
        ans1 = 1.0 + y * (0.183105e-2 + y * (-0.3516396496e-4 + y * (0.2457520174e-5 + y * (-0.240337019e-6))));
        ans2 = 0.04687499995 + y * (-0.2002690873e-3 + y * (0.8449199096e-5 + y * (-0.88228987e-6 + y * 0.105787412e-6)));
        var ans = Math.sqrt(0.636619772 / ax) * (Math.cos(xx) * ans1 - z * Math.sin(xx) * ans2);
        return x < 0.0 ? -ans : ans;
    }

    function intensite(x, y) {
        var r = Math.sqrt(x * x + y * y);
        var theta = r * 1e-3 / D1;
        var beta = Math.PI * a1 * 1e-6 * theta / (lambda * 1e-9);
        var diffraction = 1;
        if (Math.abs(beta) > 1e-6) { var bt = 2 * besselJ1(beta) / beta; diffraction = bt * bt; }
        var alpha = Math.PI * b1 * 1e-6 * x * 1e-3 / (lambda * 1e-9 * D1);
        var interference = Math.cos(alpha) * Math.cos(alpha);
        return diffraction * interference;
    }

    var board = JXG.JSXGraph.initBoard(divid, {
        boundingbox: [-25, 25, 25, -25], axis: false, showNavigation: true, showCopyright: false, keepaspectratio: true
    });

    var canvas = document.createElement('canvas');
    canvas.width = 800; canvas.height = 800;
    canvas.style.position = 'absolute'; canvas.style.top = '0'; canvas.style.left = '0';
    canvas.style.width = '100%'; canvas.style.height = '100%'; canvas.style.zIndex = '1'; canvas.style.pointerEvents = 'none';
    var ctx = canvas.getContext('2d');

    function redrawCanvas() {
        var bb = board.getBoundingBox();
        var xMin = bb[0], yMax = bb[1], xMax = bb[2], yMin = bb[3];
        var imageData = ctx.createImageData(canvas.width, canvas.height);
        for (var py = 0; py < canvas.height; py++) {
            for (var px = 0; px < canvas.width; px++) {
                var x = xMin + (px / canvas.width) * (xMax - xMin);
                var y = yMax - (py / canvas.height) * (yMax - yMin);
                var I = intensite(x, y);
                I = Math.pow(I, 0.6);
                var intensity = Math.min(1, I * 1.5);
                var idx = (py * canvas.width + px) * 4;
                imageData.data[idx] = Math.floor(laserRGB[0] * intensity);
                imageData.data[idx + 1] = Math.floor(laserRGB[1] * intensity);
                imageData.data[idx + 2] = Math.floor(laserRGB[2] * intensity);
                imageData.data[idx + 3] = 255;
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }
    redrawCanvas();

    var boardDiv = document.getElementById(divid);
    boardDiv.style.position = 'relative'; boardDiv.style.background = '#000';
    var svg = boardDiv.querySelector('svg');
    if (svg) { svg.style.position = 'relative'; svg.style.zIndex = '10'; boardDiv.insertBefore(canvas, svg); }
    else { boardDiv.appendChild(canvas); }
    board.on('boundingbox', function() { redrawCanvas(); });

    board.create('point', [0, 0], { name: '', size: 4, fillColor: '#ffffff', strokeColor: '#ffffff', fixed: true });
    board.create('text', [0, -1.5, ${JSON.stringify(I18N_D.t('diff.label_centre'))}], { fontSize: 11, color: '#ffffff', anchorX: 'middle', anchorY: 'top', fixed: true });
${withGlider ? `
    var centre = board.create('point', [0, 0], { visible: false, fixed: true });
    var reticule = board.create('point', [5, 5], { name: '', size: 5, fillColor: '#00ff00', strokeColor: '#ffffff', strokeWidth: 2 });
    board.create('segment', [centre, reticule], { strokeColor: '#ffffff', strokeWidth: 2, dash: 2 });
    board.create('text', [
        function() { return reticule.X() + 2.5; }, function() { return reticule.Y() + 2.5; },
        function() { var d = Math.sqrt(reticule.X() * reticule.X() + reticule.Y() * reticule.Y()); return 'd = ' + d.toFixed(2) + ' mm'; }
    ], { fontSize: 14, color: '#FFFFFF', anchorX: 'left', anchorY: 'bottom', fixed: true });` : ""}
})();
[[/jsxgraph]]`;
}

function _diffTplCoupeYoung(I18N_D) {
  return `[[jsxgraph width="700px" height="360px"]]
(function() {
    var a1 = {#a1#};
    var D1 = {#D1#};
    var b1 = {#b1#};
    var lambda = {#lambda#};
    var couleur = lambda < 500 ? "#1d4ed8" : (lambda < 600 ? "#16a34a" : "#dc2626");

    function besselJ1(x) {
        if (Math.abs(x) < 1e-8) return x / 2;
        var ax = Math.abs(x), y, ans1, ans2;
        if (ax < 8.0) {
            y = x * x;
            ans1 = x * (72362614232.0 + y * (-7895059235.0 + y * (242396853.1 + y * (-2972611.439 + y * (15704.48260 + y * (-30.16036606))))));
            ans2 = 144725228442.0 + y * (2300535178.0 + y * (18583304.74 + y * (99447.43394 + y * (376.9991397 + y * 1.0))));
            return ans1 / ans2;
        }
        var z = 8.0 / ax; y = z * z;
        var xx = ax - 2.356194491;
        ans1 = 1.0 + y * (0.183105e-2 + y * (-0.3516396496e-4 + y * (0.2457520174e-5 + y * (-0.240337019e-6))));
        ans2 = 0.04687499995 + y * (-0.2002690873e-3 + y * (0.8449199096e-5 + y * (-0.88228987e-6 + y * 0.105787412e-6)));
        var ans = Math.sqrt(0.636619772 / ax) * (Math.cos(xx) * ans1 - z * Math.sin(xx) * ans2);
        return x < 0.0 ? -ans : ans;
    }
    function intensite(x, y) {
        var r = Math.sqrt(x * x + y * y);
        var theta = r * 1e-3 / D1;
        var beta = Math.PI * a1 * 1e-6 * theta / (lambda * 1e-9);
        var diffraction = 1;
        if (Math.abs(beta) > 1e-6) { var bt = 2 * besselJ1(beta) / beta; diffraction = bt * bt; }
        var alpha = Math.PI * b1 * 1e-6 * x * 1e-3 / (lambda * 1e-9 * D1);
        var interference = Math.cos(alpha) * Math.cos(alpha);
        return diffraction * interference;
    }
    function intensiteCoupe(x_mm) { return intensite(x_mm, 0); }

    var xMax = Math.min(6 * (lambda * 1e-9 * D1 / (b1 * 1e-6) * 1e3), 20);

    var board = JXG.JSXGraph.initBoard(divid, {
        boundingbox: [-xMax, 1.2, xMax, -0.2], axis: true, showNavigation: true, showCopyright: false
    });
    board.defaultAxes.x.setAttribute({ name: ${JSON.stringify(I18N_D.t('diff.axis_position_x'))}, withLabel: true, label: { offset: [0, -20] } });
    board.defaultAxes.y.setAttribute({ name: ${JSON.stringify(I18N_D.t('diff.axis_intensite_normalisee'))}, withLabel: true, label: { offset: [-20, 0] } });

    board.create('functiongraph', [intensiteCoupe, -xMax, xMax], { strokeColor: couleur, strokeWidth: 3, name: 'I(x,0)' });

    var cursor = board.create('point', [0, 0.5], { name: '', size: 4, fillColor: '#00AA00', strokeColor: '#00AA00', withLabel: false });
    board.create('line', [
        [function() { return cursor.X(); }, -0.2], [function() { return cursor.X(); }, 1.2]
    ], { strokeColor: '#00AA00', strokeWidth: 1, dash: 2, straightFirst: false, straightLast: false, fixed: true, highlight: false });
    board.create('point', [
        function() { return cursor.X(); }, function() { return intensiteCoupe(cursor.X()); }
    ], { name: '', size: 3, fillColor: '#FF6600', strokeColor: '#FF6600', fixed: true, highlight: false });

    board.create('text', [
        function() { return xMax * 0.4; }, 1.1,
        function() { return ${JSON.stringify(I18N_D.t('diff.readout_position_x'))} + cursor.X().toFixed(2) + ' mm'; }
    ], { fontSize: 13, strokeColor: '#006600', highlight: false });
})();
[[/jsxgraph]]`;
}

function _diffTplCirc2D(withGlider, I18N_D) {
  return `[[jsxgraph width="700px" height="500px"]]
(function() {
    var a1 = {#a1#};
    var D1 = {#D1#};
    var lambda = {#lambda#};

    function getLaserColor(l) {
        if (l < 500) return [29, 78, 216];
        if (l < 600) return [22, 163, 74];
        return [220, 38, 38];
    }
    var laserRGB = getLaserColor(lambda);

${_diffBesselJ1JsSrc}

    function intensite(x, y) {
        var r = Math.sqrt(x * x + y * y);
        var theta = r * 1e-3 / D1;
        var beta = Math.PI * a1 * 1e-6 * theta / (lambda * 1e-9);
        if (Math.abs(beta) < 1e-6) return 1;
        var bt = 2 * besselJ1(beta) / beta;
        return bt * bt;
    }

    var yMinM = (lambda * 1e-9 * D1) / (a1 * 1e-6);
    var half = Math.min(yMinM * 1000 * 5.5, 25);

    var board = JXG.JSXGraph.initBoard(divid, {
        boundingbox: [-half, half, half, -half], axis: false, showNavigation: true, showCopyright: false, keepaspectratio: true
    });

    var canvas = document.createElement('canvas');
    canvas.width = 800; canvas.height = 800;
    canvas.style.position = 'absolute'; canvas.style.top = '0'; canvas.style.left = '0';
    canvas.style.width = '100%'; canvas.style.height = '100%'; canvas.style.zIndex = '1'; canvas.style.pointerEvents = 'none';
    var ctx = canvas.getContext('2d');

    function redrawCanvas() {
        var bb = board.getBoundingBox();
        var xMin = bb[0], yMax = bb[1], xMax = bb[2], yMin = bb[3];
        var imageData = ctx.createImageData(canvas.width, canvas.height);
        for (var py = 0; py < canvas.height; py++) {
            for (var px = 0; px < canvas.width; px++) {
                var x = xMin + (px / canvas.width) * (xMax - xMin);
                var y = yMax - (py / canvas.height) * (yMax - yMin);
                var I = intensite(x, y);
                I = Math.pow(I, 0.6);
                var intensity = Math.min(1, I * 1.5);
                var idx = (py * canvas.width + px) * 4;
                imageData.data[idx] = Math.floor(laserRGB[0] * intensity);
                imageData.data[idx + 1] = Math.floor(laserRGB[1] * intensity);
                imageData.data[idx + 2] = Math.floor(laserRGB[2] * intensity);
                imageData.data[idx + 3] = 255;
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }
    redrawCanvas();

    var boardDiv = document.getElementById(divid);
    boardDiv.style.position = 'relative'; boardDiv.style.background = '#000';
    var svg = boardDiv.querySelector('svg');
    if (svg) { svg.style.position = 'relative'; svg.style.zIndex = '10'; boardDiv.insertBefore(canvas, svg); }
    else { boardDiv.appendChild(canvas); }
    board.on('boundingbox', function() { redrawCanvas(); });

    board.create('point', [0, 0], { name: '', size: 4, fillColor: '#ffffff', strokeColor: '#ffffff', fixed: true });
    board.create('text', [0, -1.5, ${JSON.stringify(I18N_D.t('diff.label_centre'))}], { fontSize: 11, color: '#ffffff', anchorX: 'middle', anchorY: 'top', fixed: true });
${withGlider ? `
    var centre = board.create('point', [0, 0], { visible: false, fixed: true });
    var reticule = board.create('point', [half * 0.2, half * 0.2], { name: '', size: 5, fillColor: '#00ff00', strokeColor: '#ffffff', strokeWidth: 2 });
    board.create('segment', [centre, reticule], { strokeColor: '#ffffff', strokeWidth: 2, dash: 2 });
    board.create('text', [
        function() { return reticule.X() + half * 0.05; }, function() { return reticule.Y() + half * 0.05; },
        function() { var d = Math.sqrt(reticule.X() * reticule.X() + reticule.Y() * reticule.Y()); return 'r = ' + d.toFixed(2) + ' mm'; }
    ], { fontSize: 14, color: '#FFFFFF', anchorX: 'left', anchorY: 'bottom', fixed: true });` : ""}
})();
[[/jsxgraph]]`;
}

function _diffTplCoupeCirc(I18N_D) {
  return `[[jsxgraph width="700px" height="360px"]]
(function() {
    var a1 = {#a1#};
    var D1 = {#D1#};
    var lambda = {#lambda#};
    var couleur = lambda < 500 ? "#1d4ed8" : (lambda < 600 ? "#16a34a" : "#dc2626");

${_diffBesselJ1JsSrc}
    function intensiteCoupe(r_mm) {
        var theta = r_mm * 1e-3 / D1;
        var beta = Math.PI * a1 * 1e-6 * theta / (lambda * 1e-9);
        if (Math.abs(beta) < 1e-6) return 1;
        var bt = 2 * besselJ1(beta) / beta;
        return bt * bt;
    }

    var xMax = Math.min(6 * (1.22 * lambda * 1e-9 * D1 / (a1 * 1e-6) * 1e3), 20);

    var board = JXG.JSXGraph.initBoard(divid, {
        boundingbox: [-xMax, 1.2, xMax, -0.2], axis: true, showNavigation: true, showCopyright: false
    });
    board.defaultAxes.x.setAttribute({ name: ${JSON.stringify(I18N_D.t('diff.axis_position_r'))}, withLabel: true, label: { offset: [0, -20] } });
    board.defaultAxes.y.setAttribute({ name: ${JSON.stringify(I18N_D.t('diff.axis_intensite_normalisee'))}, withLabel: true, label: { offset: [-20, 0] } });

    board.create('functiongraph', [intensiteCoupe, -xMax, xMax], { strokeColor: couleur, strokeWidth: 3, name: 'I(r)' });

    var cursor = board.create('point', [0, 0.5], { name: '', size: 4, fillColor: '#00AA00', strokeColor: '#00AA00', withLabel: false });
    board.create('line', [
        [function() { return cursor.X(); }, -0.2], [function() { return cursor.X(); }, 1.2]
    ], { strokeColor: '#00AA00', strokeWidth: 1, dash: 2, straightFirst: false, straightLast: false, fixed: true, highlight: false });
    board.create('point', [
        function() { return cursor.X(); }, function() { return intensiteCoupe(cursor.X()); }
    ], { name: '', size: 3, fillColor: '#FF6600', strokeColor: '#FF6600', fixed: true, highlight: false });

    board.create('text', [
        function() { return xMax * 0.4; }, 1.1,
        function() { return ${JSON.stringify(I18N_D.t('diff.readout_position_r'))} + cursor.X().toFixed(2) + ' mm'; }
    ], { fontSize: 13, strokeColor: '#006600', highlight: false });
})();
[[/jsxgraph]]`;
}

function _diffTplCarre2D(withGlider) {
  return `[[jsxgraph width="700px" height="500px"]]
(function() {
    var a1 = {#a1#};
    var D1 = {#D1#};
    var lambda = {#lambda#};

    function getLaserColor(l) {
        if (l < 500) return [29, 78, 216];
        if (l < 600) return [22, 163, 74];
        return [220, 38, 38];
    }
    var laserRGB = getLaserColor(lambda);

    function sinc2(u_mm) {
        var theta = u_mm * 1e-3 / D1;
        var beta = Math.PI * a1 * 1e-6 * theta / (lambda * 1e-9);
        if (Math.abs(beta) < 1e-10) return 1;
        var s = Math.sin(beta) / beta;
        return s * s;
    }
    function intensite(x, y) { return sinc2(x) * sinc2(y); }

    var yMinM = (lambda * 1e-9 * D1) / (a1 * 1e-6);
    var half = yMinM * 1000 * 5.5;

    var board = JXG.JSXGraph.initBoard(divid, {
        boundingbox: [-half, half, half, -half], axis: false, showNavigation: true, showCopyright: false, keepaspectratio: true
    });

    var canvas = document.createElement('canvas');
    canvas.width = 800; canvas.height = 800;
    canvas.style.position = 'absolute'; canvas.style.top = '0'; canvas.style.left = '0';
    canvas.style.width = '100%'; canvas.style.height = '100%'; canvas.style.zIndex = '1'; canvas.style.pointerEvents = 'none';
    var ctx = canvas.getContext('2d');

    function redrawCanvas() {
        var bb = board.getBoundingBox();
        var xMin = bb[0], yMax = bb[1], xMax = bb[2], yMin = bb[3];
        var imageData = ctx.createImageData(canvas.width, canvas.height);
        for (var py = 0; py < canvas.height; py++) {
            for (var px = 0; px < canvas.width; px++) {
                var x = xMin + (px / canvas.width) * (xMax - xMin);
                var y = yMax - (py / canvas.height) * (yMax - yMin);
                var I = intensite(x, y);
                I = Math.pow(I, 0.6);
                var intensity = Math.min(1, I * 1.5);
                var idx = (py * canvas.width + px) * 4;
                imageData.data[idx] = Math.floor(laserRGB[0] * intensity);
                imageData.data[idx + 1] = Math.floor(laserRGB[1] * intensity);
                imageData.data[idx + 2] = Math.floor(laserRGB[2] * intensity);
                imageData.data[idx + 3] = 255;
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }
    redrawCanvas();

    var boardDiv = document.getElementById(divid);
    boardDiv.style.position = 'relative'; boardDiv.style.background = '#000';
    var svg = boardDiv.querySelector('svg');
    if (svg) { svg.style.position = 'relative'; svg.style.zIndex = '10'; boardDiv.insertBefore(canvas, svg); }
    else { boardDiv.appendChild(canvas); }
    board.on('boundingbox', function() { redrawCanvas(); });

    board.create('point', [0, 0], { name: '', size: 4, fillColor: '#ffffff', strokeColor: '#ffffff', fixed: true });
${withGlider ? `
    var axeHorizontal = board.create('line', [[0, 0], [1, 0]], { visible: false, fixed: true });
    var pointMobile = board.create('glider', [half * 0.2, 0, axeHorizontal], {
        name: '', size: 5, fillColor: '#00ff00', strokeColor: '#ffffff', strokeWidth: 2, showInfobox: false, fixed: false
    });
    board.create('line', [
        [function() { return pointMobile.X(); }, -half], [function() { return pointMobile.X(); }, half]
    ], { strokeColor: '#FFFFFF', strokeWidth: 1.5, dash: 1, straightFirst: false, straightLast: false, fixed: true, highlight: false });
    board.create('text', [
        function() { return pointMobile.X(); }, function() { return half * 0.92; },
        function() { return 'x = ' + pointMobile.X().toFixed(2) + ' mm'; }
    ], { fontSize: 14, color: '#FFFFFF', anchorX: 'middle', anchorY: 'bottom', fixed: true,
        cssStyle: 'background: rgba(0,0,0,0.8); padding: 4px 8px; border-radius: 4px;' });` : ""}
})();
[[/jsxgraph]]`;
}

function _diffBuildJsx(type, mode, I18N_D) {
  if (type === "fente_simple") {
    return mode === "ecran" ? _diffTplBarres(true) : (_diffTplBarres(false) + "\n" + _diffTplCourbeSimple(I18N_D));
  }
  if (type === "fente_double") {
    return mode === "ecran" ? _diffTplFranges(true) : (_diffTplFranges(false) + "\n" + _diffTplCourbeDouble(I18N_D));
  }
  if (type === "trou_circulaire") {
    return mode === "ecran" ? _diffTplCirc2D(true, I18N_D) : (_diffTplCirc2D(true, I18N_D) + "\n" + _diffTplCoupeCirc(I18N_D));
  }
  if (type === "trou_carre") {
    return mode === "ecran" ? _diffTplCarre2D(true) : (_diffTplCarre2D(false) + "\n" + _diffTplCourbeSimple(I18N_D));
  }
  return mode === "ecran" ? _diffTplYoung2D(true, I18N_D) : (_diffTplYoung2D(true, I18N_D) + "\n" + _diffTplCoupeYoung(I18N_D));
}

/* ── UI : selection type / mode ── */
function diffTypeChange() {
  var type = (document.getElementById("diff-type") || {}).value || "fente_simple";
  var mode = (document.getElementById("diff-mode") || {}).value || "ecran";
  var info = document.getElementById("diff-info-box");
  if (info) info.innerHTML = _diffInfoText(type, mode);
  var bRow = document.getElementById("diff-row-b");
  if (bRow) bRow.style.display = _diffNeedsB(type) ? "" : "none";
  diffUpdatePreview();
}

function diffModeChange() { diffTypeChange(); }

function diffRandomToggle() {
  var rnd = document.getElementById("diff-random");
  var fixed = document.getElementById("diff-fixed-params");
  if (rnd && fixed) fixed.style.display = rnd.checked ? "none" : "";
  diffUpdatePreview();
}

function _diffCurrentParams() {
  var type = (document.getElementById("diff-type") || {}).value || "fente_simple";
  var mode = (document.getElementById("diff-mode") || {}).value || "ecran";
  var rnd = document.getElementById("diff-random");
  var isRnd = rnd ? rnd.checked : true;
  var a = parseFloat((document.getElementById("diff-a") || {}).value) || 50;
  var D = parseFloat((document.getElementById("diff-d") || {}).value) || 2;
  var b = parseFloat((document.getElementById("diff-b") || {}).value) || 200;
  var lambda = parseFloat((document.getElementById("diff-lambda") || {}).value) || 532;
  if (isRnd) {
    a = DIFF_A_LIST[Math.floor(DIFF_A_LIST.length / 2)];
    D = DIFF_D_LIST[Math.floor(DIFF_D_LIST.length / 2)];
    b = DIFF_B_LIST[Math.floor(DIFF_B_LIST.length / 2)];
    lambda = 532;
  }
  return { type: type, mode: mode, isRnd: isRnd, a: a, D: D, b: b, lambda: lambda };
}

function _diffBuildSvgPreview(type, mode, a_um, D_m, b_um, lambdaNm) {
  var col = _diffColorHex(lambdaNm);
  var W = 420, H = 150;
  var a = a_um * 1e-6, D = D_m, b = b_um * 1e-6, lam = lambdaNm * 1e-9;
  var ymin = lam * D / a;
  var inter = b > 0 ? lam * D / b : 0;
  var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="max-width:' + W + 'px;background:#0b0b0f;border-radius:6px;">';
  var isCurve = mode === "capteur";

  if (isCurve && type !== "young" && type !== "trou_circulaire") {
    var xMax = (type === "fente_double") ? Math.min(2 * lam * D / a, 0.1) : Math.min(3.5 * ymin, 0.1);
    var pts = [], N = 240;
    for (var i = 0; i <= N; i++) {
      var y = -xMax + (2 * xMax) * i / N;
      var theta = Math.atan(y / D);
      var alpha = Math.PI * a * Math.sin(theta) / lam;
      var I = 1;
      if (Math.abs(alpha) > 1e-6) { var s = Math.sin(alpha) / alpha; I = s * s; }
      if (type === "fente_double") {
        var beta = Math.PI * b * Math.sin(theta) / lam;
        I = I * Math.cos(beta) * Math.cos(beta);
      }
      var px = 20 + (W - 30) * (y + xMax) / (2 * xMax);
      var py = H - 18 - (H - 30) * I;
      pts.push(px.toFixed(1) + "," + py.toFixed(1));
    }
    svg += '<line x1="20" y1="' + (H - 18) + '" x2="' + (W - 8) + '" y2="' + (H - 18) + '" stroke="#444" stroke-width="1"/>';
    svg += '<polyline points="' + pts.join(" ") + '" fill="none" stroke="' + col + '" stroke-width="2.2"/>';
    svg += '<text x="' + (W / 2) + '" y="14" fill="#bbb" font-size="11" text-anchor="middle" font-family="sans-serif">' + I18N.t('diff.svg_axis_intensite') + '</text>';
  } else if (type === "young") {
    /* Rendu raster (canvas, meme resolution logique que le board JSXGraph reel
       _diffTplYoung2D) plutot qu'une grille de <rect> SVG : a basse resolution
       les rect adjacents creent un moire (quadrillage) qui n'existe pas dans
       le rendu pixel-a-pixel reel. Fenetre physique fixe +/-25 mm, meme
       mapping d'intensite (I^0.6 * 1.5, clamp 1). */
    var half = 25;
    var sizePx = Math.round(Math.min(W - 16, H - 16));
    var laserRGB = lambdaNm < 500 ? [29, 78, 216] : (lambdaNm < 600 ? [22, 163, 74] : [220, 38, 38]);
    function besselJ1(x) {
      if (Math.abs(x) < 1e-8) return x / 2;
      var ax = Math.abs(x), y2, ans1, ans2;
      if (ax < 8.0) {
        y2 = x * x;
        ans1 = x * (72362614232.0 + y2 * (-7895059235.0 + y2 * (242396853.1 + y2 * (-2972611.439 + y2 * (15704.48260 + y2 * (-30.16036606))))));
        ans2 = 144725228442.0 + y2 * (2300535178.0 + y2 * (18583304.74 + y2 * (99447.43394 + y2 * (376.9991397 + y2 * 1.0))));
        return ans1 / ans2;
      }
      var z = 8.0 / ax; y2 = z * z;
      var xx2 = ax - 2.356194491;
      ans1 = 1.0 + y2 * (0.183105e-2 + y2 * (-0.3516396496e-4 + y2 * (0.2457520174e-5 + y2 * (-0.240337019e-6))));
      ans2 = 0.04687499995 + y2 * (-0.2002690873e-3 + y2 * (0.8449199096e-5 + y2 * (-0.88228987e-6 + y2 * 0.105787412e-6)));
      var ans = Math.sqrt(0.636619772 / ax) * (Math.cos(xx2) * ans1 - z * Math.sin(xx2) * ans2);
      return x < 0.0 ? -ans : ans;
    }
    function intensiteYoung(xmm, ymm) {
      var r = Math.sqrt(xmm * xmm + ymm * ymm);
      var theta = r * 1e-3 / D;
      var beta = Math.PI * a * theta / lam;
      var diffraction = 1;
      if (Math.abs(beta) > 1e-6) { var bt = 2 * besselJ1(beta) / beta; diffraction = bt * bt; }
      var alpha = Math.PI * b * xmm * 1e-3 / (lam * D);
      return diffraction * Math.cos(alpha) * Math.cos(alpha);
    }
    var dataUrl = "";
    if (typeof document !== "undefined") {
      var cnv = document.createElement("canvas");
      cnv.width = sizePx; cnv.height = sizePx;
      var cctx = cnv.getContext("2d");
      var imgData = cctx.createImageData(sizePx, sizePx);
      for (var py = 0; py < sizePx; py++) {
        for (var px = 0; px < sizePx; px++) {
          var xmm = (px / sizePx - 0.5) * 2 * half;
          var ymm = (0.5 - py / sizePx) * 2 * half;
          var I2 = intensiteYoung(xmm, ymm);
          I2 = Math.pow(I2, 0.6);
          var intensity = Math.min(1, I2 * 1.5);
          var idx = (py * sizePx + px) * 4;
          imgData.data[idx] = Math.floor(laserRGB[0] * intensity);
          imgData.data[idx + 1] = Math.floor(laserRGB[1] * intensity);
          imgData.data[idx + 2] = Math.floor(laserRGB[2] * intensity);
          imgData.data[idx + 3] = 255;
        }
      }
      cctx.putImageData(imgData, 0, 0);
      dataUrl = cnv.toDataURL("image/png");
    }
    if (dataUrl) {
      svg += '<image href="' + dataUrl + '" x="' + ((W - sizePx) / 2).toFixed(1) + '" y="' + ((H - sizePx) / 2).toFixed(1) + '" width="' + sizePx + '" height="' + sizePx + '"/>';
    }
  } else if (type === "fente_simple") {
    var yc = H / 2, bh = 44;
    var halfW = 5.5 * ymin;
    var wPx = W - 16, hPx = bh;
    var rgbCol = _diffColorRgb(lambdaNm);
    var dataUrl2 = "";
    if (typeof document !== "undefined") {
      var cnv2 = document.createElement("canvas");
      cnv2.width = wPx; cnv2.height = hPx;
      var cctx2 = cnv2.getContext("2d");
      var imgData2 = cctx2.createImageData(wPx, hPx);
      for (var px2 = 0; px2 < wPx; px2++) {
        var xPhys2 = -halfW + (2 * halfW) * px2 / wPx;
        var beta2 = Math.PI * a * xPhys2 / (lam * D);
        var I3 = 1;
        if (Math.abs(beta2) > 1e-10) { var s2 = Math.sin(beta2) / beta2; I3 = s2 * s2; }
        I3 = Math.pow(I3, 0.6);
        var intensity2 = Math.min(1, I3 * 1.5);
        for (var py2 = 0; py2 < hPx; py2++) {
          var idx2 = (py2 * wPx + px2) * 4;
          imgData2.data[idx2] = Math.floor(rgbCol[0] * intensity2);
          imgData2.data[idx2 + 1] = Math.floor(rgbCol[1] * intensity2);
          imgData2.data[idx2 + 2] = Math.floor(rgbCol[2] * intensity2);
          imgData2.data[idx2 + 3] = 255;
        }
      }
      cctx2.putImageData(imgData2, 0, 0);
      dataUrl2 = cnv2.toDataURL("image/png");
    }
    if (dataUrl2) {
      svg += '<image href="' + dataUrl2 + '" x="8" y="' + (yc - bh / 2) + '" width="' + wPx + '" height="' + bh + '"/>';
    }
    svg += '<line x1="' + (W / 2) + '" y1="6" x2="' + (W / 2) + '" y2="' + (H - 6) + '" stroke="#fff" stroke-width="1" stroke-dasharray="3 3" opacity="0.6"/>';
  } else if (type === "trou_circulaire") {
    var halfC = 5.5 * ymin * 1000;
    var sizePxC = Math.round(Math.min(W - 16, H - 16));
    var rgbColC = _diffColorRgb(lambdaNm);
    var besselJ1C = _diffBesselJ1Src();
    function intensiteCirc(xmm, ymm) {
      var r = Math.sqrt(xmm * xmm + ymm * ymm);
      var theta = r * 1e-3 / D;
      var beta = Math.PI * a * theta / lam;
      if (Math.abs(beta) < 1e-6) return 1;
      var bt = 2 * besselJ1C(beta) / beta;
      return bt * bt;
    }
    var dataUrlC = "";
    if (typeof document !== "undefined") {
      var cnvC = document.createElement("canvas");
      cnvC.width = sizePxC; cnvC.height = sizePxC;
      var cctxC = cnvC.getContext("2d");
      var imgDataC = cctxC.createImageData(sizePxC, sizePxC);
      for (var pyC = 0; pyC < sizePxC; pyC++) {
        for (var pxC = 0; pxC < sizePxC; pxC++) {
          var xmmC = (pxC / sizePxC - 0.5) * 2 * halfC;
          var ymmC = (0.5 - pyC / sizePxC) * 2 * halfC;
          var IC = Math.pow(intensiteCirc(xmmC, ymmC), 0.6);
          var intensityC = Math.min(1, IC * 1.5);
          var idxC = (pyC * sizePxC + pxC) * 4;
          imgDataC.data[idxC] = Math.floor(rgbColC[0] * intensityC);
          imgDataC.data[idxC + 1] = Math.floor(rgbColC[1] * intensityC);
          imgDataC.data[idxC + 2] = Math.floor(rgbColC[2] * intensityC);
          imgDataC.data[idxC + 3] = 255;
        }
      }
      cctxC.putImageData(imgDataC, 0, 0);
      dataUrlC = cnvC.toDataURL("image/png");
    }
    if (dataUrlC) {
      svg += '<image href="' + dataUrlC + '" x="' + ((W - sizePxC) / 2).toFixed(1) + '" y="' + ((H - sizePxC) / 2).toFixed(1) + '" width="' + sizePxC + '" height="' + sizePxC + '"/>';
    }
  } else if (type === "trou_carre") {
    var halfS = 5.5 * ymin * 1000;
    var sizePxS = Math.round(Math.min(W - 16, H - 16));
    var rgbColS = _diffColorRgb(lambdaNm);
    function sinc2mm(u_mm) {
      var theta = u_mm * 1e-3 / D;
      var beta = Math.PI * a * theta / lam;
      if (Math.abs(beta) < 1e-10) return 1;
      var s = Math.sin(beta) / beta;
      return s * s;
    }
    var dataUrlS = "";
    if (typeof document !== "undefined") {
      var cnvS = document.createElement("canvas");
      cnvS.width = sizePxS; cnvS.height = sizePxS;
      var cctxS = cnvS.getContext("2d");
      var imgDataS = cctxS.createImageData(sizePxS, sizePxS);
      for (var pyS = 0; pyS < sizePxS; pyS++) {
        for (var pxS = 0; pxS < sizePxS; pxS++) {
          var xmmS = (pxS / sizePxS - 0.5) * 2 * halfS;
          var ymmS = (0.5 - pyS / sizePxS) * 2 * halfS;
          var IS = Math.pow(sinc2mm(xmmS) * sinc2mm(ymmS), 0.6);
          var intensityS = Math.min(1, IS * 1.5);
          var idxS = (pyS * sizePxS + pxS) * 4;
          imgDataS.data[idxS] = Math.floor(rgbColS[0] * intensityS);
          imgDataS.data[idxS + 1] = Math.floor(rgbColS[1] * intensityS);
          imgDataS.data[idxS + 2] = Math.floor(rgbColS[2] * intensityS);
          imgDataS.data[idxS + 3] = 255;
        }
      }
      cctxS.putImageData(imgDataS, 0, 0);
      dataUrlS = cnvS.toDataURL("image/png");
    }
    if (dataUrlS) {
      svg += '<image href="' + dataUrlS + '" x="' + ((W - sizePxS) / 2).toFixed(1) + '" y="' + ((H - sizePxS) / 2).toFixed(1) + '" width="' + sizePxS + '" height="' + sizePxS + '"/>';
    }
  } else {
    var yc2 = H / 2, bh2 = 44;
    var largeurBande = 0.35 * inter;
    var scale2 = (W / 2 - 16) / (3 * (lam * D / a));
    var nMax = Math.ceil((W / 2 - 16) / scale2 / inter) + 1;
    for (var k2 = -nMax; k2 <= nMax; k2++) {
      var posK = k2 * inter;
      var theta2 = Math.atan(posK / D);
      var alphaK = Math.PI * a * Math.sin(theta2) / lam;
      var envK = 1; if (Math.abs(alphaK) > 1e-6) { var sK = Math.sin(alphaK) / alphaK; envK = sK * sK; }
      var betaK = Math.PI * b * Math.sin(theta2) / lam;
      var IK = envK * Math.cos(betaK) * Math.cos(betaK);
      if (IK > 0.02) {
        var cx = W / 2 + posK * scale2, w = Math.max(1.5, largeurBande * scale2);
        svg += '<rect x="' + (cx - w).toFixed(1) + '" y="' + (yc2 - bh2 / 2) + '" width="' + (2 * w).toFixed(1) + '" height="' + bh2 + '" fill="' + col + '" fill-opacity="' + Math.min(1, IK).toFixed(2) + '"/>';
      }
    }
  }
  svg += "</svg>";

  var meas = "";
  if (type === "fente_simple" || type === "trou_carre") meas = I18N.t("diff.meas_largeur") + "<strong>" + (2 * ymin * 1000).toFixed(2) + " mm</strong>";
  else if (type === "trou_circulaire") meas = I18N.t("diff.meas_rayon") + "<strong>" + (1.22 * ymin * 1000).toFixed(2) + " mm</strong>";
  else meas = I18N.t("diff.meas_interfrange") + "<strong>" + (inter * 1000).toFixed(3) + " mm</strong>";
  return { svg: svg, meas: meas, ymin: ymin, inter: inter };
}

function diffUpdatePreview() {
  var box = document.getElementById("diff-preview");
  if (!box) return;
  var p = _diffCurrentParams();
  var demo = _diffBuildSvgPreview(p.type, p.mode, p.a, p.D, p.b, p.lambda);
  var lasersTxt = DIFF_LASERS.map(function (l) { return l[0]; }).join(", ");
  box.innerHTML =
    '<div style="margin-bottom:6px;">' + demo.svg + "</div>"
    + '<div style="font-size:.82rem;color:#334155;">'
    + (p.isRnd
      ? I18N.t("diff.preview_random_ad") + (_diffNeedsB(p.type) ? I18N.t("diff.preview_random_b") : "") + I18N.t("diff.preview_random_suffix")
      : I18N.t("diff.preview_fixed"))
    + "a=" + p.a + " µm, D=" + p.D + " m" + (_diffNeedsB(p.type) ? ", b=" + p.b + " µm" : "")
    + ", λ=" + p.lambda + " nm"
    + (p.isRnd ? I18N.t("diff.preview_laser_choice") + lasersTxt + " nm" : "")
    + "<br>" + demo.meas + "</div>";
}

/* ── Helpers XML : nodes / PRT multi-noeuds ── */
function _diffNode(idx, test, sans, tans, opts, tMode, tScore, tNext, tFb, fMode, fScore, fNext, fFb, notePrefix) {
  return "      <node>\n"
    + "        <name>" + idx + "</name><description></description>\n"
    + "        <answertest>" + test + "</answertest>\n"
    + "        <sans>" + sans + "</sans><tans>" + tans + "</tans>\n"
    + "        <testoptions>" + opts + "</testoptions><quiet>0</quiet>\n"
    + "        <truescoremode>" + tMode + "</truescoremode><truescore>" + tScore + "</truescore><truepenalty></truepenalty>\n"
    + "        <truenextnode>" + tNext + "</truenextnode><trueanswernote>" + notePrefix + "-" + idx + "-T</trueanswernote>\n"
    + "        <truefeedback format=\"html\"><text><![CDATA[" + tFb + "]]></text></truefeedback>\n"
    + "        <falsescoremode>" + fMode + "</falsescoremode><falsescore>" + fScore + "</falsescore><falsepenalty></falsepenalty>\n"
    + "        <falsenextnode>" + fNext + "</falsenextnode><falseanswernote>" + notePrefix + "-" + idx + "-F</falseanswernote>\n"
    + "        <falsefeedback format=\"html\"><text><![CDATA[" + fFb + "]]></text></falsefeedback>\n"
    + "      </node>";
}

function _diffPRT(name, val, feedvars, nodesXML) {
  return "    <prt>\n"
    + "      <name>" + name + "</name>\n"
    + "      <value>" + val + "</value>\n"
    + "      <autosimplify>1</autosimplify><feedbackstyle>1</feedbackstyle>\n"
    + "      <feedbackvariables><text>" + (feedvars || "") + "</text></feedbackvariables>\n"
    + nodesXML.join("\n") + "\n"
    + "    </prt>";
}

function _diffInp(n, X, type, tans) {
  return "    <input>\n"
    + "      <name>ans" + n + X + "</name><type>" + type + "</type><tans>" + tans + "</tans>\n"
    + "      <boxsize>10</boxsize><strictsyntax>1</strictsyntax><insertstars>0</insertstars>\n"
    + "      <syntaxhint></syntaxhint><syntaxattribute>0</syntaxattribute>\n"
    + "      <forbidwords></forbidwords><allowwords></allowwords>\n"
    + "      <forbidfloat>0</forbidfloat><requirelowestterms>0</requirelowestterms>\n"
    + "      <checkanswertype>0</checkanswertype><mustverify>0</mustverify><showvalidation>1</showvalidation>\n"
    + "    </input>";
}

// _diffOK/_diffKO/_diffEnd : fragments d'encadre pre-decoupes (ouverture+icone / fermeture),
// derives dynamiquement d'applyFbBox() (js/fb-box.js) pour respecter la personnalisation
// eventuelle des couleurs (getFbBoxStyles/localStorage), au lieu de couleurs codees en dur.
// Ce fichier construit le XML du PRT directement en chaines (pas de noeuds canoniques
// JSON comme les autres generateurs) : aucun champ n'est expose pour edition via
// prt-manager.js, l'encadre n'est donc applique qu'a ce point d'export unique — voir
// _diffFbBoxParts(), calcule localement dans genDiffractionCore() a partir de applyFbBox_D.
function _diffFbBoxParts(applyFbBox_D, kind) {
  var MARK = ' SF_DIFF_FB_MARK ';
  var wrapped = applyFbBox_D(kind, MARK) || (MARK + '</div>');
  var idx = wrapped.indexOf(MARK);
  return { pre: wrapped.slice(0, idx), post: wrapped.slice(idx + MARK.length) };
}

/* ── Generateur ── */
function genDiffractionParams() {
  var type = v("diff-type") || "fente_simple";
  var mode = v("diff-mode") || "ecran";
  var bareme = parseFloat(v("diff-bareme")) || 1;
  var text = richVal("diff-text");
  var rnd = document.getElementById("diff-random");
  var isRnd = rnd ? rnd.checked : true;
  var aFix = parseFloat(v("diff-a")) || 50;
  var DFix = parseFloat(v("diff-d")) || 2;
  var bFix = parseFloat(v("diff-b")) || 200;
  var lambdaFix = parseFloat(v("diff-lambda")) || 532;
  var fbGenRaw = v("diff-fbgen");
  return {
    type: type, mode: mode, bareme: bareme, text: text, isRnd: isRnd,
    aFix: aFix, DFix: DFix, bFix: bFix, lambdaFix: lambdaFix, fbGenRaw: fbGenRaw
  };
}

async function genDiffraction(X) {
  var p = genDiffractionParams();
  try {
    var res = await fetch('/api/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'diffraction', X: X, params: p })
    });
    if (res.ok) {
      var data = await res.json();
      if (data && data.ok) return data.parts;
    }
    if (res.status === 429) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || I18N.t('msg.err_quota_hebdo'));
    }
    console.warn('[cairnforstack] /api/generate a répondu ' + res.status + ' pour "diffraction", repli sur le calcul local (session expirée ?).');
  } catch (e) {
    console.warn('[cairnforstack] /api/generate injoignable pour "diffraction", repli sur le calcul local.', e);
  }
  return genDiffractionCore(X, p);
}

function genDiffractionCore(X, p, deps) {
  deps = deps || {};
  var I18N_D = deps.I18N || I18N;
  var _mkFbGen_D = deps._mkFbGen || _mkFbGen;
  var _diffBuildSvgPreview_D = deps._diffBuildSvgPreview || _diffBuildSvgPreview;
  var applyFbBox_D = deps.applyFbBox || applyFbBox;

  var _diffOKParts = _diffFbBoxParts(applyFbBox_D, 'true');
  var _diffKOParts = _diffFbBoxParts(applyFbBox_D, 'false');
  var _diffOK = _diffOKParts.pre;
  var _diffKO = _diffKOParts.pre;
  var _diffEnd = _diffOKParts.post;

  var type = p.type, mode = p.mode, bareme = p.bareme, text = p.text, isRnd = p.isRnd,
    aFix = p.aFix, DFix = p.DFix, bFix = p.bFix, lambdaFix = p.lambdaFix;
  var needsB = _diffNeedsB(type);
  var nPRT = (type === "young") ? 6 : 7;
  var bpp = Math.round(bareme / nPRT * 100) / 100;

  function _lColor(nm) { return nm < 500 ? "blue" : nm < 600 ? "green" : "red"; }

  var A = "diffA" + X, uA = "diffuA" + X;
  var D = "diffD" + X, uD = "diffuD" + X;
  var B = "diffB" + X, uB = "diffuB" + X;
  var L = "diffL" + X, C = "diffC" + X;
  var UI_ = "diffUI" + X;
  var t = function (n) { return "difft" + n + "q" + X; };

  var vars = "";
  vars += A + ": " + (isRnd ? "rand([20,30,40,50,60,80,100])" : aFix) + ";\n";
  vars += uA + ": float(round(" + A + "*rand(100)/100))/10;\n";
  vars += D + ": " + (isRnd ? "rand([1,1.5,2,2.5,3])" : DFix) + ";\n";
  vars += uD + ": 1E-3*(rand(2)+1)/2;\n";
  if (needsB) {
    vars += B + ": " + (isRnd ? "rand([200,250,300,350,400,450,500])" : bFix) + ";\n";
    vars += uB + ": float(round(" + B + "*rand(100)/100))/10;\n";
  }
  if (isRnd) {
    vars += "difflasers" + X + ": [[405,\"blue\"],[520,\"green\"],[532,\"green\"],[635,\"red\"],[650,\"red\"]];\n";
    vars += "difflc" + X + ": rand(difflasers" + X + ");\n";
    vars += L + ": first(difflc" + X + ");\n";
    vars += C + ": second(difflc" + X + ");\n";
  } else {
    vars += L + ": " + lambdaFix + ";\n";
    vars += C + ": \"" + _lColor(lambdaFix) + "\";\n";
  }

  var inputXML, prtXML, feedbackRef, subQs, consigneJsx, consigneMes, params;
  params = '<p>a = ({@' + A + '@} ± {@' + uA + '@}) µm ; D = ({@' + D + '@} ± {@' + uD + '@}) m</p>';
  if (needsB) params += '<p>b = ({@' + B + '@} ± {@' + uB + '@}) µm</p>';

  function inp(n) { return "[[input:ans" + n + X + "]] [[validation:ans" + n + X + "]]"; }

  if (type === "fente_simple") {
    var LW = "diffLW" + X, UL = "diffUL" + X;
    vars += UL + ": 0.06E-3;\n";
    vars += LW + ": float(" + D + "*" + L + "/" + A + ");\n";
    vars += t(1) + ": [[1,false," + JSON.stringify(I18N_D.t('diff.opt_refraction')) + "],[2,false," + JSON.stringify(I18N_D.t('diff.opt_diffusion')) + "],"
      + "[3,false," + JSON.stringify(I18N_D.t('diff.opt_interferences')) + "],[4,true," + JSON.stringify(I18N_D.t('diff.opt_diffraction')) + "]];\n";
    vars += "difffb1" + X + ": [" + JSON.stringify(I18N_D.t('diff.fb1_diffraction_refraction')) + ","
      + JSON.stringify(I18N_D.t('diff.fb1_diffraction_diffusion')) + ","
      + JSON.stringify(I18N_D.t('diff.fb1_diffraction_interf_fentes')) + ","
      + JSON.stringify(I18N_D.t('diff.fb1_diffraction_ok_fente')) + "];\n";
    vars += t(2) + ": l/(2*D);\n";
    vars += t(3) + ": float(" + L + "/" + A + "*1E-3);\n";
    vars += t(4) + ": " + L + "*nm;\n";
    vars += "difft5i" + X + ": " + L + "*((" + uA + "/" + A + ")^2+(" + uD + "/" + D + ")^2+(" + UL + "/" + LW + ")^2)^0.5;\n";
    vars += "difftpk" + X + ": floor(log(abs(difft5i" + X + "))/log(10));\n";
    vars += "difftkk" + X + ": 10^((2-1)-difftpk" + X + ");\n";
    vars += t(5) + ": float((round(difft5i" + X + "*difftkk" + X + ")/difftkk" + X + "))*nm;\n";
    vars += "diffira" + X + ": " + uA + "/" + A + "; diffirD" + X + ": " + uD + "/" + D + "; diffirl" + X + ": " + UL + "/" + LW + ";\n";
    vars += "diffmv" + X + ": max(diffira" + X + ",diffirD" + X + ",diffirl" + X + ");\n";
    vars += t(6) + ": [[1,is(diffira" + X + "=diffmv" + X + ")," + JSON.stringify(I18N_D.t('diff.opt_ameliorer_fente')) + "],"
      + "[2,is(diffirD" + X + "=diffmv" + X + ")," + JSON.stringify(I18N_D.t('diff.opt_ameliorer_distance_d')) + "],"
      + "[3,is(diffirl" + X + "=diffmv" + X + ")," + JSON.stringify(I18N_D.t('diff.opt_ameliorer_mesure_l')) + "]];\n";
    vars += t(7) + ": float((" + L + "+" + t(5) + "/nm))*nm;\n";
    vars += t(8) + ": float((" + L + "-" + t(5) + "/nm))*nm;";

    consigneJsx = mode === "ecran"
      ? I18N_D.t("diff.consigne_diffraction_l_ecran")
      : I18N_D.t("diff.consigne_diffraction_l_capteur");
    consigneMes = I18N_D.t("diff.mesincert_l");

    subQs = "<ol>"
      + "<li>" + I18N_D.t("diff.subq_phenomene") + inp(1) + "</li>"
      + "<li>" + I18N_D.t("diff.subq_tan_ld") + inp(2) + "</li>"
      + "<li>" + I18N_D.t("diff.subq_angle") + inp(3) + "</li>"
      + "<li>" + I18N_D.t("diff.subq_lambda_ex") + inp(4) + "</li>"
      + "<li>" + I18N_D.t("diff.subq_incertitude_l") + inp(5) + "</li>"
      + "<li>" + I18N_D.t("diff.subq_parametre_ameliorer") + inp(6) + "</li>"
      + "<li>" + I18N_D.t("diff.subq_encadrement") + inp(7) + I18N_D.t("diff.lt_lambda_lt") + inp(8) + "</li>"
      + "</ol>";

    var fv6a = "gl" + X + ": mcq_correct(" + t(6) + "); rp6" + X + ": if(" + t(6) + "[ans6" + X + "][1]=gl" + X + "[1]) then 1 else 0;";
    var fv1a = "repq1" + X + ": difffb1" + X + "[ans1" + X + "]; text1" + X + ": repq1" + X + ";";
    var fv2a = "";
    var fv3a = "p1" + X + ": floor(log(abs(ans3" + X + "))/log(10)); verif1" + X + ": ans3" + X + "/10^p1" + X + ";"
      + " p2" + X + ": floor(log(abs(" + t(3) + "))/log(10)); verif2" + X + ": " + t(3) + "/10^p2" + X + ";";
    var fv4a = "p3" + X + ": floor(log(abs(ans4" + X + "))/log(10)); verif3" + X + ": ans4" + X + "/10^p3" + X + ";"
      + " p4" + X + ": floor(log(abs(" + t(4) + "))/log(10)); verif4" + X + ": " + t(4) + "/10^p4" + X + ";";

    inputXML = [
      _diffInp(1, X, "radio", t(1)),
      _diffInp(2, X, "algebraic", t(2)),
      _diffInp(3, X, "numerical", t(3)),
      _diffInp(4, X, "units", t(4)),
      _diffInp(5, X, "units", t(5)),
      _diffInp(6, X, "radio", t(6)),
      _diffInp(7, X, "units", t(7)),
      _diffInp(8, X, "units", t(8))
    ].join("\n");

    prtXML = [
      _diffPRT("prt1" + X, bpp, fv1a, [
        _diffNode(0, "NumRelative", "ans1" + X, "4", "0", "=", 1, -1,
          "{@text1" + X + "@}", "=", 0, -1, "{@text1" + X + "@}", "prt1" + X)
      ]),
      _diffPRT("prt2" + X, bpp, fv2a, [
        _diffNode(0, "AlgEquiv", "ans2" + X, t(2), "", "=", 1, -1,
          _diffOK + I18N_D.t("diff.fb_tan_l_ok") + _diffEnd,
          "=", 0, 1, "", "prt2" + X),
        _diffNode(1, "AlgEquiv", "ans2" + X, "1/(" + t(2) + ")", "", "+", 0.25, -1,
          _diffOK + I18N_D.t("diff.fb_tan_l_inverted") + _diffEnd,
          "-", 0, -1, _diffKO + I18N_D.t("diff.fb_tan_l_ko") + _diffEnd, "prt2" + X)
      ]),
      _diffPRT("prt3" + X, bpp, fv3a, [
        _diffNode(0, "NumRelative", "ans3" + X, t(3), "0.05", "=", 1, -1,
          _diffOK + I18N_D.t("diff.fb_angle_ok") + _diffEnd, "=", 0, 1, "", "prt3" + X),
        _diffNode(1, "NumRelative", "verif1" + X, "verif2" + X, "0.05", "+", 0.25, -1,
          _diffOK + I18N_D.t("diff.fb_ordre_grandeur_ok") + _diffEnd,
          "-", 0, -1, _diffKO + I18N_D.t("diff.fb_angle_ko_std").split("{V}").join("{@" + t(3) + "@}") + _diffEnd, "prt3" + X)
      ]),
      _diffPRT("prt4" + X, bpp, fv4a, [
        _diffNode(0, "UnitsRelative", "ans4" + X, t(4), "0.05", "=", 1, -1,
          _diffOK + I18N_D.t("diff.fb_lambda_ok").split("{V}").join("{@" + t(4) + "@}") + _diffEnd, "=", 0, 1, "", "prt4" + X),
        _diffNode(1, "UnitsRelative", "verif3" + X, "verif4" + X, "0.05", "+", 0.25, -1,
          _diffOK + I18N_D.t("diff.fb_ordre_grandeur_ok") + _diffEnd,
          "-", 0, -1, _diffKO + I18N_D.t("diff.fb_lambda_ko_l") + _diffEnd, "prt4" + X)
      ]),
      _diffPRT("prt5" + X, bpp, "", [
        _diffNode(0, "UnitsRelative", "ans5" + X, t(5), "0.15", "=", 1, -1,
          _diffOK + I18N_D.t("diff.fb_incertitude_ok") + _diffEnd, "=", 0, -1,
          _diffKO + I18N_D.t("diff.fb_incertitude_ko_l") + _diffEnd, "prt5" + X)
      ]),
      _diffPRT("prt6" + X, bpp, fv6a, [
        _diffNode(0, "NumRelative", "rp6" + X, "1", "0", "=", 1, -1,
          _diffOK + I18N_D.t("diff.fb_ameliorer_ok").split("{V}").join("{@" + t(6) + "[ans6" + X + "][3]@}") + _diffEnd,
          "=", 0, -1, _diffKO + I18N_D.t("diff.fb_comparer_l") + _diffEnd, "prt6" + X)
      ]),
      _diffPRT("prt7" + X, bpp, "", [
        _diffNode(0, "UnitsRelative", "ans7" + X, t(7), "0.05", "=", 1, 1, "", "=", 0, 2, "", "prt7" + X),
        _diffNode(1, "UnitsRelative", "ans8" + X, t(8), "0.05", "+", 1, -1,
          I18N_D.t("diff.fb_encadrement_ok").split("{V1}").join("{@" + t(8) + "@}").split("{V2}").join("{@" + t(7) + "@}") + _diffEnd,
          "-", 0, -1, _diffKO + I18N_D.t("diff.fb_borne_inf_ko").split("{V}").join("{@" + t(8) + "@}") + _diffEnd, "prt7" + X),
        _diffNode(2, "UnitsRelative", "ans7" + X, t(8), "0.05", "+", 0.5, 3, "", "-", 0, 3, "", "prt7" + X),
        _diffNode(3, "UnitsRelative", "ans8" + X, t(8), "0.05", "+", 1, -1,
          _diffOK + I18N_D.t("diff.fb_borne_basse_ok") + _diffEnd, "-", 0, 4, "", "prt7" + X),
        _diffNode(4, "UnitsRelative", "ans8" + X, t(7), "0.05", "+", 0.5, -1,
          I18N_D.t("diff.fb_bornes_interverties") + _diffEnd,
          "-", 0, -1, _diffKO + I18N_D.t("diff.fb_borne_sup_ko").split("{V}").join("{@" + t(7) + "@}") + _diffEnd, "prt7" + X)
      ])
    ].join("\n\n");
    feedbackRef = [1, 2, 3, 4, 5, 6, 7].map(function (n) { return "[[feedback:prt" + n + X + "]]"; }).join("");

  } else if (type === "fente_double") {
    vars += UI_ + ": (rand(10)+3)/10*1E-3;\n";
    vars += "diffI" + X + ": float((round(100*" + L + "*1E-9*" + D + "/(" + B + "*1E-6)*1E3))/100);\n";
    vars += t(1) + ": [[1,false," + JSON.stringify(I18N_D.t('diff.opt_refraction')) + "],[2,false," + JSON.stringify(I18N_D.t('diff.opt_diffusion')) + "],"
      + "[3,true," + JSON.stringify(I18N_D.t('diff.opt_interferences')) + "],[4,false," + JSON.stringify(I18N_D.t('diff.opt_diffraction')) + "]];\n";
    vars += "difffb1" + X + ": [" + JSON.stringify(I18N_D.t('diff.fb1_interf_refraction')) + ","
      + JSON.stringify(I18N_D.t('diff.fb1_interf_diffusion')) + ","
      + JSON.stringify(I18N_D.t('diff.fb1_interf_ok_fentes')) + ","
      + JSON.stringify(I18N_D.t('diff.fb1_interf_diffraction_fente')) + "];\n";
    vars += t(2) + ": diffI" + X + "*mm;\n";
    vars += t(3) + ": (D*lambda)/(i);\n";
    vars += t(4) + ": " + B + "*1E-6*m;\n";
    vars += t(5) + ": float((round(100*2*" + L + "*" + D + "/" + A + "))/100)*mm;\n";
    vars += t(6) + ": 2*lambda*D/l;\n";
    vars += t(7) + ": float((round(100*" + A + "))/100*1E-6)*m;";

    consigneJsx = mode === "ecran"
      ? I18N_D.t("diff.consigne_franges_ecran")
      : I18N_D.t("diff.consigne_franges_capteur");
    consigneMes = "";

    subQs = "<ol>"
      + "<li>" + I18N_D.t("diff.subq_phenomene") + inp(1) + "</li>"
      + "<li>" + I18N_D.t("diff.subq_interfrange_i") + inp(2) + "</li>"
      + "<li>" + I18N_D.t("diff.subq_expr_b") + inp(3) + "</li>"
      + "<li>" + I18N_D.t("diff.subq_calc_b") + inp(4) + "</li>"
      + "<li>" + I18N_D.t("diff.subq_mesurer_l") + inp(5) + "</li>"
      + "<li>" + I18N_D.t("diff.subq_expr_a") + inp(6) + "</li>"
      + "<li>" + I18N_D.t("diff.subq_calc_a") + inp(7) + "</li>"
      + "</ol>";

    var fv1b = "repq1" + X + ": difffb1" + X + "[ans1" + X + "]; text1" + X + ": repq1" + X + ";";
    inputXML = [
      _diffInp(1, X, "radio", t(1)),
      _diffInp(2, X, "units", t(2)),
      _diffInp(3, X, "algebraic", t(3)),
      _diffInp(4, X, "units", t(4)),
      _diffInp(5, X, "units", t(5)),
      _diffInp(6, X, "algebraic", t(6)),
      _diffInp(7, X, "units", t(7))
    ].join("\n");
    prtXML = [
      _diffPRT("prt1" + X, bpp, fv1b, [
        _diffNode(0, "NumRelative", "ans1" + X, "3", "0", "=", 1, -1,
          "{@text1" + X + "@}", "=", 0, -1, "{@text1" + X + "@}", "prt1" + X)
      ]),
      _diffPRT("prt2" + X, bpp, "", [
        _diffNode(0, "UnitsRelative", "ans2" + X, t(2), "0.05", "=", 1, -1,
          I18N_D.t("diff.fb_interfrange_ok").split("{V}").join("{@" + t(2) + "@}") + _diffEnd,
          "=", 0, -1, _diffKO + I18N_D.t("diff.fb_interfrange_ko") + _diffEnd, "prt2" + X)
      ]),
      _diffPRT("prt3" + X, bpp, "", [
        _diffNode(0, "AlgEquiv", "ans3" + X, t(3), "", "=", 1, -1,
          I18N_D.t("diff.fb_formule_b_ok") + _diffEnd,
          "=", 0, -1, _diffKO + I18N_D.t("diff.fb_formule_b_ko") + _diffEnd, "prt3" + X)
      ]),
      _diffPRT("prt4" + X, bpp, "", [
        _diffNode(0, "UnitsRelative", "ans4" + X, t(4), "0.05", "=", 1, -1,
          I18N_D.t("diff.fb_valeur_b_ok") + _diffEnd,
          "=", 0, -1, _diffKO + I18N_D.t("diff.fb_valeur_b_ko") + _diffEnd, "prt4" + X)
      ]),
      _diffPRT("prt5" + X, bpp, "", [
        _diffNode(0, "UnitsRelative", "ans5" + X, t(5), "0.05", "=", 1, -1,
          I18N_D.t("diff.fb_largeur_l_ok") + _diffEnd,
          "=", 0, -1, _diffKO + I18N_D.t("diff.fb_largeur_l_ko") + _diffEnd, "prt5" + X)
      ]),
      _diffPRT("prt6" + X, bpp, "", [
        _diffNode(0, "AlgEquiv", "ans6" + X, t(6), "", "=", 1, -1,
          I18N_D.t("diff.fb_formule_a_ok") + _diffEnd,
          "=", 0, -1, _diffKO + I18N_D.t("diff.fb_formule_a_ko") + _diffEnd, "prt6" + X)
      ]),
      _diffPRT("prt7" + X, bpp, "", [
        _diffNode(0, "UnitsRelative", "ans7" + X, t(7), "0.05", "=", 1, -1,
          I18N_D.t("diff.fb_valeur_a_ok") + _diffEnd,
          "=", 0, -1, _diffKO + I18N_D.t("diff.fb_valeur_a_ko") + _diffEnd, "prt7" + X)
      ])
    ].join("\n\n");
    feedbackRef = [1, 2, 3, 4, 5, 6, 7].map(function (n) { return "[[feedback:prt" + n + X + "]]"; }).join("");

  } else if (type === "trou_circulaire") {
    var RW = "diffRW" + X, UR = "diffUR" + X;
    vars += UR + ": 0.06E-3;\n";
    vars += RW + ": float(1.22*" + D + "*" + L + "/" + A + ");\n";
    vars += t(1) + ": [[1,false," + JSON.stringify(I18N_D.t('diff.opt_refraction')) + "],[2,false," + JSON.stringify(I18N_D.t('diff.opt_diffusion')) + "],"
      + "[3,false," + JSON.stringify(I18N_D.t('diff.opt_interferences')) + "],[4,true," + JSON.stringify(I18N_D.t('diff.opt_diffraction')) + "]];\n";
    vars += "difffb1" + X + ": [" + JSON.stringify(I18N_D.t('diff.fb1_diffraction_refraction')) + ","
      + JSON.stringify(I18N_D.t('diff.fb1_diffraction_diffusion')) + ","
      + JSON.stringify(I18N_D.t('diff.fb1_diffraction_interf_trous')) + ","
      + JSON.stringify(I18N_D.t('diff.fb1_diffraction_ok_trou_circ')) + "];\n";
    vars += t(2) + ": r/D;\n";
    vars += t(3) + ": float(1.22*" + L + "/" + A + "*1E-3);\n";
    vars += t(4) + ": " + L + "*nm;\n";
    vars += "difft5i" + X + ": " + L + "*((" + uA + "/" + A + ")^2+(" + uD + "/" + D + ")^2+(" + UR + "/" + RW + ")^2)^0.5;\n";
    vars += "difftpk" + X + ": floor(log(abs(difft5i" + X + "))/log(10));\n";
    vars += "difftkk" + X + ": 10^((2-1)-difftpk" + X + ");\n";
    vars += t(5) + ": float((round(difft5i" + X + "*difftkk" + X + ")/difftkk" + X + "))*nm;\n";
    vars += "diffira" + X + ": " + uA + "/" + A + "; diffirD" + X + ": " + uD + "/" + D + "; diffirl" + X + ": " + UR + "/" + RW + ";\n";
    vars += "diffmv" + X + ": max(diffira" + X + ",diffirD" + X + ",diffirl" + X + ");\n";
    vars += t(6) + ": [[1,is(diffira" + X + "=diffmv" + X + ")," + JSON.stringify(I18N_D.t('diff.opt_ameliorer_trou')) + "],"
      + "[2,is(diffirD" + X + "=diffmv" + X + ")," + JSON.stringify(I18N_D.t('diff.opt_ameliorer_distance_d')) + "],"
      + "[3,is(diffirl" + X + "=diffmv" + X + ")," + JSON.stringify(I18N_D.t('diff.opt_ameliorer_mesure_r')) + "]];\n";
    vars += t(7) + ": float((" + L + "+" + t(5) + "/nm))*nm;\n";
    vars += t(8) + ": float((" + L + "-" + t(5) + "/nm))*nm;";

    consigneJsx = mode === "ecran"
      ? I18N_D.t("diff.consigne_airy_circ_ecran")
      : I18N_D.t("diff.consigne_airy_circ_capteur");
    consigneMes = I18N_D.t("diff.mesincert_r");

    subQs = "<ol>"
      + "<li>" + I18N_D.t("diff.subq_phenomene") + inp(1) + "</li>"
      + "<li>" + I18N_D.t("diff.subq_tan_rd") + inp(2) + "</li>"
      + "<li>" + I18N_D.t("diff.subq_angle_airy") + inp(3) + "</li>"
      + "<li>" + I18N_D.t("diff.subq_lambda_ex") + inp(4) + "</li>"
      + "<li>" + I18N_D.t("diff.subq_incertitude_r") + inp(5) + "</li>"
      + "<li>" + I18N_D.t("diff.subq_parametre_ameliorer") + inp(6) + "</li>"
      + "<li>" + I18N_D.t("diff.subq_encadrement") + inp(7) + I18N_D.t("diff.lt_lambda_lt") + inp(8) + "</li>"
      + "</ol>";

    var fv6d = "gl" + X + ": mcq_correct(" + t(6) + "); rp6" + X + ": if(" + t(6) + "[ans6" + X + "][1]=gl" + X + "[1]) then 1 else 0;";
    var fv1d = "repq1" + X + ": difffb1" + X + "[ans1" + X + "]; text1" + X + ": repq1" + X + ";";
    var fv2d = "";
    var fv3d = "p1" + X + ": floor(log(abs(ans3" + X + "))/log(10)); verif1" + X + ": ans3" + X + "/10^p1" + X + ";"
      + " p2" + X + ": floor(log(abs(" + t(3) + "))/log(10)); verif2" + X + ": " + t(3) + "/10^p2" + X + ";";
    var fv4d = "p3" + X + ": floor(log(abs(ans4" + X + "))/log(10)); verif3" + X + ": ans4" + X + "/10^p3" + X + ";"
      + " p4" + X + ": floor(log(abs(" + t(4) + "))/log(10)); verif4" + X + ": " + t(4) + "/10^p4" + X + ";";

    inputXML = [
      _diffInp(1, X, "radio", t(1)),
      _diffInp(2, X, "algebraic", t(2)),
      _diffInp(3, X, "numerical", t(3)),
      _diffInp(4, X, "units", t(4)),
      _diffInp(5, X, "units", t(5)),
      _diffInp(6, X, "radio", t(6)),
      _diffInp(7, X, "units", t(7)),
      _diffInp(8, X, "units", t(8))
    ].join("\n");

    prtXML = [
      _diffPRT("prt1" + X, bpp, fv1d, [
        _diffNode(0, "NumRelative", "ans1" + X, "4", "0", "=", 1, -1,
          "{@text1" + X + "@}", "=", 0, -1, "{@text1" + X + "@}", "prt1" + X)
      ]),
      _diffPRT("prt2" + X, bpp, fv2d, [
        _diffNode(0, "AlgEquiv", "ans2" + X, t(2), "", "=", 1, -1,
          _diffOK + I18N_D.t("diff.fb_tan_r_ok") + _diffEnd,
          "=", 0, 1, "", "prt2" + X),
        _diffNode(1, "AlgEquiv", "ans2" + X, "1/(" + t(2) + ")", "", "+", 0.25, -1,
          _diffOK + I18N_D.t("diff.fb_tan_r_inverted") + _diffEnd,
          "-", 0, -1, _diffKO + I18N_D.t("diff.fb_tan_r_ko") + _diffEnd, "prt2" + X)
      ]),
      _diffPRT("prt3" + X, bpp, fv3d, [
        _diffNode(0, "NumRelative", "ans3" + X, t(3), "0.05", "=", 1, -1,
          _diffOK + I18N_D.t("diff.fb_angle_ok") + _diffEnd, "=", 0, 1, "", "prt3" + X),
        _diffNode(1, "NumRelative", "verif1" + X, "verif2" + X, "0.05", "+", 0.25, -1,
          _diffOK + I18N_D.t("diff.fb_ordre_grandeur_ok") + _diffEnd,
          "-", 0, -1, _diffKO + I18N_D.t("diff.fb_angle_ko_airy").split("{V}").join("{@" + t(3) + "@}") + _diffEnd, "prt3" + X)
      ]),
      _diffPRT("prt4" + X, bpp, fv4d, [
        _diffNode(0, "UnitsRelative", "ans4" + X, t(4), "0.05", "=", 1, -1,
          _diffOK + I18N_D.t("diff.fb_lambda_ok").split("{V}").join("{@" + t(4) + "@}") + _diffEnd, "=", 0, 1, "", "prt4" + X),
        _diffNode(1, "UnitsRelative", "verif3" + X, "verif4" + X, "0.05", "+", 0.25, -1,
          _diffOK + I18N_D.t("diff.fb_ordre_grandeur_ok") + _diffEnd,
          "-", 0, -1, _diffKO + I18N_D.t("diff.fb_lambda_ko_r") + _diffEnd, "prt4" + X)
      ]),
      _diffPRT("prt5" + X, bpp, "", [
        _diffNode(0, "UnitsRelative", "ans5" + X, t(5), "0.15", "=", 1, -1,
          _diffOK + I18N_D.t("diff.fb_incertitude_ok") + _diffEnd, "=", 0, -1,
          _diffKO + I18N_D.t("diff.fb_incertitude_ko_r") + _diffEnd, "prt5" + X)
      ]),
      _diffPRT("prt6" + X, bpp, fv6d, [
        _diffNode(0, "NumRelative", "rp6" + X, "1", "0", "=", 1, -1,
          _diffOK + I18N_D.t("diff.fb_ameliorer_ok").split("{V}").join("{@" + t(6) + "[ans6" + X + "][3]@}") + _diffEnd,
          "=", 0, -1, _diffKO + I18N_D.t("diff.fb_comparer_r") + _diffEnd, "prt6" + X)
      ]),
      _diffPRT("prt7" + X, bpp, "", [
        _diffNode(0, "UnitsRelative", "ans7" + X, t(7), "0.05", "=", 1, 1, "", "=", 0, 2, "", "prt7" + X),
        _diffNode(1, "UnitsRelative", "ans8" + X, t(8), "0.05", "+", 1, -1,
          I18N_D.t("diff.fb_encadrement_ok").split("{V1}").join("{@" + t(8) + "@}").split("{V2}").join("{@" + t(7) + "@}") + _diffEnd,
          "-", 0, -1, _diffKO + I18N_D.t("diff.fb_borne_inf_ko").split("{V}").join("{@" + t(8) + "@}") + _diffEnd, "prt7" + X),
        _diffNode(2, "UnitsRelative", "ans7" + X, t(8), "0.05", "+", 0.5, 3, "", "-", 0, 3, "", "prt7" + X),
        _diffNode(3, "UnitsRelative", "ans8" + X, t(8), "0.05", "+", 1, -1,
          _diffOK + I18N_D.t("diff.fb_borne_basse_ok") + _diffEnd, "-", 0, 4, "", "prt7" + X),
        _diffNode(4, "UnitsRelative", "ans8" + X, t(7), "0.05", "+", 0.5, -1,
          I18N_D.t("diff.fb_bornes_interverties") + _diffEnd,
          "-", 0, -1, _diffKO + I18N_D.t("diff.fb_borne_sup_ko").split("{V}").join("{@" + t(7) + "@}") + _diffEnd, "prt7" + X)
      ])
    ].join("\n\n");
    feedbackRef = [1, 2, 3, 4, 5, 6, 7].map(function (n) { return "[[feedback:prt" + n + X + "]]"; }).join("");

  } else if (type === "trou_carre") {
    var LW = "diffLW" + X, UL = "diffUL" + X;
    vars += UL + ": 0.06E-3;\n";
    vars += LW + ": float(" + D + "*" + L + "/" + A + ");\n";
    vars += t(1) + ": [[1,false," + JSON.stringify(I18N_D.t('diff.opt_refraction')) + "],[2,false," + JSON.stringify(I18N_D.t('diff.opt_diffusion')) + "],"
      + "[3,false," + JSON.stringify(I18N_D.t('diff.opt_interferences')) + "],[4,true," + JSON.stringify(I18N_D.t('diff.opt_diffraction')) + "]];\n";
    vars += "difffb1" + X + ": [" + JSON.stringify(I18N_D.t('diff.fb1_diffraction_refraction')) + ","
      + JSON.stringify(I18N_D.t('diff.fb1_diffraction_diffusion')) + ","
      + JSON.stringify(I18N_D.t('diff.fb1_diffraction_interf_trous')) + ","
      + JSON.stringify(I18N_D.t('diff.fb1_diffraction_ok_trou_carre')) + "];\n";
    vars += t(2) + ": l/(2*D);\n";
    vars += t(3) + ": float(" + L + "/" + A + "*1E-3);\n";
    vars += t(4) + ": " + L + "*nm;\n";
    vars += "difft5i" + X + ": " + L + "*((" + uA + "/" + A + ")^2+(" + uD + "/" + D + ")^2+(" + UL + "/" + LW + ")^2)^0.5;\n";
    vars += "difftpk" + X + ": floor(log(abs(difft5i" + X + "))/log(10));\n";
    vars += "difftkk" + X + ": 10^((2-1)-difftpk" + X + ");\n";
    vars += t(5) + ": float((round(difft5i" + X + "*difftkk" + X + ")/difftkk" + X + "))*nm;\n";
    vars += "diffira" + X + ": " + uA + "/" + A + "; diffirD" + X + ": " + uD + "/" + D + "; diffirl" + X + ": " + UL + "/" + LW + ";\n";
    vars += "diffmv" + X + ": max(diffira" + X + ",diffirD" + X + ",diffirl" + X + ");\n";
    vars += t(6) + ": [[1,is(diffira" + X + "=diffmv" + X + ")," + JSON.stringify(I18N_D.t('diff.opt_ameliorer_trou')) + "],"
      + "[2,is(diffirD" + X + "=diffmv" + X + ")," + JSON.stringify(I18N_D.t('diff.opt_ameliorer_distance_d')) + "],"
      + "[3,is(diffirl" + X + "=diffmv" + X + ")," + JSON.stringify(I18N_D.t('diff.opt_ameliorer_mesure_l')) + "]];\n";
    vars += t(7) + ": float((" + L + "+" + t(5) + "/nm))*nm;\n";
    vars += t(8) + ": float((" + L + "-" + t(5) + "/nm))*nm;";

    consigneJsx = mode === "ecran"
      ? I18N_D.t("diff.consigne_diffraction_carre_ecran")
      : I18N_D.t("diff.consigne_diffraction_l_capteur");
    consigneMes = I18N_D.t("diff.mesincert_l");

    subQs = "<ol>"
      + "<li>" + I18N_D.t("diff.subq_phenomene") + inp(1) + "</li>"
      + "<li>" + I18N_D.t("diff.subq_tan_ld") + inp(2) + "</li>"
      + "<li>" + I18N_D.t("diff.subq_angle") + inp(3) + "</li>"
      + "<li>" + I18N_D.t("diff.subq_lambda_ex") + inp(4) + "</li>"
      + "<li>" + I18N_D.t("diff.subq_incertitude_l") + inp(5) + "</li>"
      + "<li>" + I18N_D.t("diff.subq_parametre_ameliorer") + inp(6) + "</li>"
      + "<li>" + I18N_D.t("diff.subq_encadrement") + inp(7) + I18N_D.t("diff.lt_lambda_lt") + inp(8) + "</li>"
      + "</ol>";

    var fv6e = "gl" + X + ": mcq_correct(" + t(6) + "); rp6" + X + ": if(" + t(6) + "[ans6" + X + "][1]=gl" + X + "[1]) then 1 else 0;";
    var fv1e = "repq1" + X + ": difffb1" + X + "[ans1" + X + "]; text1" + X + ": repq1" + X + ";";
    var fv2e = "";
    var fv3e = "p1" + X + ": floor(log(abs(ans3" + X + "))/log(10)); verif1" + X + ": ans3" + X + "/10^p1" + X + ";"
      + " p2" + X + ": floor(log(abs(" + t(3) + "))/log(10)); verif2" + X + ": " + t(3) + "/10^p2" + X + ";";
    var fv4e = "p3" + X + ": floor(log(abs(ans4" + X + "))/log(10)); verif3" + X + ": ans4" + X + "/10^p3" + X + ";"
      + " p4" + X + ": floor(log(abs(" + t(4) + "))/log(10)); verif4" + X + ": " + t(4) + "/10^p4" + X + ";";

    inputXML = [
      _diffInp(1, X, "radio", t(1)),
      _diffInp(2, X, "algebraic", t(2)),
      _diffInp(3, X, "numerical", t(3)),
      _diffInp(4, X, "units", t(4)),
      _diffInp(5, X, "units", t(5)),
      _diffInp(6, X, "radio", t(6)),
      _diffInp(7, X, "units", t(7)),
      _diffInp(8, X, "units", t(8))
    ].join("\n");

    prtXML = [
      _diffPRT("prt1" + X, bpp, fv1e, [
        _diffNode(0, "NumRelative", "ans1" + X, "4", "0", "=", 1, -1,
          "{@text1" + X + "@}", "=", 0, -1, "{@text1" + X + "@}", "prt1" + X)
      ]),
      _diffPRT("prt2" + X, bpp, fv2e, [
        _diffNode(0, "AlgEquiv", "ans2" + X, t(2), "", "=", 1, -1,
          _diffOK + I18N_D.t("diff.fb_tan_l_ok") + _diffEnd,
          "=", 0, 1, "", "prt2" + X),
        _diffNode(1, "AlgEquiv", "ans2" + X, "1/(" + t(2) + ")", "", "+", 0.25, -1,
          _diffOK + I18N_D.t("diff.fb_tan_l_inverted") + _diffEnd,
          "-", 0, -1, _diffKO + I18N_D.t("diff.fb_tan_l_ko") + _diffEnd, "prt2" + X)
      ]),
      _diffPRT("prt3" + X, bpp, fv3e, [
        _diffNode(0, "NumRelative", "ans3" + X, t(3), "0.05", "=", 1, -1,
          _diffOK + I18N_D.t("diff.fb_angle_ok") + _diffEnd, "=", 0, 1, "", "prt3" + X),
        _diffNode(1, "NumRelative", "verif1" + X, "verif2" + X, "0.05", "+", 0.25, -1,
          _diffOK + I18N_D.t("diff.fb_ordre_grandeur_ok") + _diffEnd,
          "-", 0, -1, _diffKO + I18N_D.t("diff.fb_angle_ko_std").split("{V}").join("{@" + t(3) + "@}") + _diffEnd, "prt3" + X)
      ]),
      _diffPRT("prt4" + X, bpp, fv4e, [
        _diffNode(0, "UnitsRelative", "ans4" + X, t(4), "0.05", "=", 1, -1,
          _diffOK + I18N_D.t("diff.fb_lambda_ok").split("{V}").join("{@" + t(4) + "@}") + _diffEnd, "=", 0, 1, "", "prt4" + X),
        _diffNode(1, "UnitsRelative", "verif3" + X, "verif4" + X, "0.05", "+", 0.25, -1,
          _diffOK + I18N_D.t("diff.fb_ordre_grandeur_ok") + _diffEnd,
          "-", 0, -1, _diffKO + I18N_D.t("diff.fb_lambda_ko_l") + _diffEnd, "prt4" + X)
      ]),
      _diffPRT("prt5" + X, bpp, "", [
        _diffNode(0, "UnitsRelative", "ans5" + X, t(5), "0.15", "=", 1, -1,
          _diffOK + I18N_D.t("diff.fb_incertitude_ok") + _diffEnd, "=", 0, -1,
          _diffKO + I18N_D.t("diff.fb_incertitude_ko_l") + _diffEnd, "prt5" + X)
      ]),
      _diffPRT("prt6" + X, bpp, fv6e, [
        _diffNode(0, "NumRelative", "rp6" + X, "1", "0", "=", 1, -1,
          _diffOK + I18N_D.t("diff.fb_ameliorer_ok").split("{V}").join("{@" + t(6) + "[ans6" + X + "][3]@}") + _diffEnd,
          "=", 0, -1, _diffKO + I18N_D.t("diff.fb_comparer_l") + _diffEnd, "prt6" + X)
      ]),
      _diffPRT("prt7" + X, bpp, "", [
        _diffNode(0, "UnitsRelative", "ans7" + X, t(7), "0.05", "=", 1, 1, "", "=", 0, 2, "", "prt7" + X),
        _diffNode(1, "UnitsRelative", "ans8" + X, t(8), "0.05", "+", 1, -1,
          I18N_D.t("diff.fb_encadrement_ok").split("{V1}").join("{@" + t(8) + "@}").split("{V2}").join("{@" + t(7) + "@}") + _diffEnd,
          "-", 0, -1, _diffKO + I18N_D.t("diff.fb_borne_inf_ko").split("{V}").join("{@" + t(8) + "@}") + _diffEnd, "prt7" + X),
        _diffNode(2, "UnitsRelative", "ans7" + X, t(8), "0.05", "+", 0.5, 3, "", "-", 0, 3, "", "prt7" + X),
        _diffNode(3, "UnitsRelative", "ans8" + X, t(8), "0.05", "+", 1, -1,
          _diffOK + I18N_D.t("diff.fb_borne_basse_ok") + _diffEnd, "-", 0, 4, "", "prt7" + X),
        _diffNode(4, "UnitsRelative", "ans8" + X, t(7), "0.05", "+", 0.5, -1,
          I18N_D.t("diff.fb_bornes_interverties") + _diffEnd,
          "-", 0, -1, _diffKO + I18N_D.t("diff.fb_borne_sup_ko").split("{V}").join("{@" + t(7) + "@}") + _diffEnd, "prt7" + X)
      ])
    ].join("\n\n");
    feedbackRef = [1, 2, 3, 4, 5, 6, 7].map(function (n) { return "[[feedback:prt" + n + X + "]]"; }).join("");

  } else {
    vars += UI_ + ": (rand(10)+3)/10*1E-3;\n";
    vars += "diffI" + X + ": " + L + "*1E-9*" + D + "/(" + B + "*1E-6)*1E3;\n";
    vars += t(1) + ": [[1,false," + JSON.stringify(I18N_D.t('diff.opt_refraction')) + "],[2,false," + JSON.stringify(I18N_D.t('diff.opt_diffusion')) + "],"
      + "[3,true," + JSON.stringify(I18N_D.t('diff.opt_interferences')) + "],[4,false," + JSON.stringify(I18N_D.t('diff.opt_diffraction')) + "]];\n";
    vars += "difffb1" + X + ": [" + JSON.stringify(I18N_D.t('diff.fb1_interf_refraction')) + ","
      + JSON.stringify(I18N_D.t('diff.fb1_interf_diffusion')) + ","
      + JSON.stringify(I18N_D.t('diff.fb1_interf_ok_trous')) + ","
      + JSON.stringify(I18N_D.t('diff.fb1_interf_diffraction_trou')) + "];\n";
    vars += t(2) + ": diffI" + X + "*mm;\n";
    vars += t(3) + ": " + L + "*1E-9*m;\n";
    vars += "difft4i" + X + ": " + L + "*((" + UI_ + "/diffI" + X + ")^2+(" + uD + "/" + D + ")^2+(" + uB + "/" + B + ")^2)^0.5;\n";
    vars += "difftpk" + X + ": floor(log(abs(difft4i" + X + "))/log(10));\n";
    vars += "difftkk" + X + ": 10^((2-1)-difftpk" + X + ");\n";
    vars += t(4) + ": float((round(difft4i" + X + "*difftkk" + X + ")/difftkk" + X + "))*nm;\n";
    vars += "diffirb" + X + ": " + uB + "/" + B + "; diffirD" + X + ": " + uD + "/" + D + "; diffiri" + X + ": " + UI_ + "/diffI" + X + ";\n";
    vars += "diffmv" + X + ": max(diffirb" + X + ",diffirD" + X + ",diffiri" + X + ");\n";
    vars += t(5) + ": [[1,is(diffirb" + X + "=diffmv" + X + ")," + JSON.stringify(I18N_D.t('diff.opt_ameliorer_ecartement')) + "],"
      + "[2,is(diffirD" + X + "=diffmv" + X + ")," + JSON.stringify(I18N_D.t('diff.opt_ameliorer_distance_d')) + "],"
      + "[3,is(diffiri" + X + "=diffmv" + X + ")," + JSON.stringify(I18N_D.t('diff.opt_ameliorer_mesure_i')) + "]];\n";
    vars += t(6) + ": float((" + L + "+" + t(4) + "/nm))*nm;\n";
    vars += t(7) + ": float((" + L + "-" + t(4) + "/nm))*nm;";

    consigneJsx = mode === "ecran"
      ? I18N_D.t("diff.consigne_young_ecran")
      : I18N_D.t("diff.consigne_young_capteur");
    consigneMes = I18N_D.t("diff.mesincert_interfrange").split("{V}").join("{@" + UI_ + "@}");

    subQs = "<ol>"
      + "<li>" + I18N_D.t("diff.subq_phenomene") + inp(1) + "</li>"
      + "<li>" + I18N_D.t("diff.subq_interfrange_i") + inp(2) + "</li>"
      + "<li>" + I18N_D.t("diff.subq_determiner_lambda_young") + inp(3) + "</li>"
      + "<li>" + I18N_D.t("diff.subq_incertitude_young") + inp(4) + "</li>"
      + "<li>" + I18N_D.t("diff.subq_parametre_ameliorer") + inp(5) + "</li>"
      + "<li>" + I18N_D.t("diff.subq_encadrement") + inp(6) + I18N_D.t("diff.lt_lambda_lt") + inp(7) + "</li>"
      + "</ol>";

    var fv1c = "repq1" + X + ": difffb1" + X + "[ans1" + X + "]; text1" + X + ": repq1" + X + ";";
    var fv3c = "p1" + X + ": floor(log(abs(ans3" + X + "))/log(10)); verif1" + X + ": ans3" + X + "/10^p1" + X + ";"
      + " p2" + X + ": floor(log(abs(" + t(3) + "))/log(10)); verif2" + X + ": " + t(3) + "/10^p2" + X + ";";
    var fv4c = "p3" + X + ": floor(log(abs(ans4" + X + "))/log(10)); verif3" + X + ": ans4" + X + "/10^p3" + X + ";"
      + " p4" + X + ": floor(log(abs(" + t(4) + "))/log(10)); verif4" + X + ": " + t(4) + "/10^p4" + X + ";";
    var fv5c = "gl" + X + ": mcq_correct(" + t(5) + "); rp5" + X + ": if(" + t(5) + "[ans5" + X + "][1]=gl" + X + "[1]) then 1 else 0;";

    inputXML = [
      _diffInp(1, X, "radio", t(1)),
      _diffInp(2, X, "units", t(2)),
      _diffInp(3, X, "units", t(3)),
      _diffInp(4, X, "units", t(4)),
      _diffInp(5, X, "radio", t(5)),
      _diffInp(6, X, "units", t(6)),
      _diffInp(7, X, "units", t(7))
    ].join("\n");
    prtXML = [
      _diffPRT("prt1" + X, bpp, fv1c, [
        _diffNode(0, "NumRelative", "ans1" + X, "3", "0", "=", 1, -1,
          "{@text1" + X + "@}", "=", 0, -1, "{@text1" + X + "@}", "prt1" + X)
      ]),
      _diffPRT("prt2" + X, bpp, "", [
        _diffNode(0, "UnitsRelative", "ans2" + X, t(2), "0.05", "=", 1, -1,
          I18N_D.t("diff.fb_interfrange_ok").split("{V}").join("{@" + t(2) + "@}") + _diffEnd,
          "=", 0, -1, _diffKO + I18N_D.t("diff.fb_interfrange_ko") + _diffEnd, "prt2" + X)
      ]),
      _diffPRT("prt3" + X, bpp, fv3c, [
        _diffNode(0, "UnitsRelative", "ans3" + X, t(3), "0.05", "=", 1, -1,
          _diffOK + I18N_D.t("diff.fb_lambda_ok").split("{V}").join("{@" + t(3) + "@}") + _diffEnd, "=", 0, 1, "", "prt3" + X),
        _diffNode(1, "NumRelative", "verif1" + X, "verif2" + X, "0.05", "+", 0.25, -1,
          _diffOK + I18N_D.t("diff.fb_ordre_grandeur_ok") + _diffEnd,
          "-", 0, -1, _diffKO + I18N_D.t("diff.fb_lambda_ko_young") + _diffEnd, "prt3" + X)
      ]),
      _diffPRT("prt4" + X, bpp, fv4c, [
        _diffNode(0, "UnitsRelative", "ans4" + X, t(4), "0.05", "=", 1, -1,
          _diffOK + I18N_D.t("diff.fb_incertitude_ok") + _diffEnd, "=", 0, 1, "", "prt4" + X),
        _diffNode(1, "UnitsRelative", "verif3" + X, "verif4" + X, "0.05", "+", 0.25, -1,
          _diffOK + I18N_D.t("diff.fb_ordre_grandeur_ok") + _diffEnd,
          "-", 0, -1, _diffKO + I18N_D.t("diff.fb_incertitude_ko_young") + _diffEnd, "prt4" + X)
      ]),
      _diffPRT("prt5" + X, bpp, fv5c, [
        _diffNode(0, "NumRelative", "rp5" + X, "1", "0", "=", 1, -1,
          _diffOK + I18N_D.t("diff.fb_ameliorer_ok").split("{V}").join("{@" + t(5) + "[ans5" + X + "][3]@}") + _diffEnd,
          "=", 0, -1, _diffKO + I18N_D.t("diff.fb_comparer_young") + _diffEnd, "prt5" + X)
      ]),
      _diffPRT("prt6" + X, bpp, "", [
        _diffNode(0, "UnitsRelative", "ans6" + X, t(6), "0.05", "=", 1, 1, "", "=", 0, 2, "", "prt6" + X),
        _diffNode(1, "UnitsRelative", "ans7" + X, t(7), "0.05", "+", 1, -1,
          I18N_D.t("diff.fb_encadrement_ok").split("{V1}").join("{@" + t(7) + "@}").split("{V2}").join("{@" + t(6) + "@}") + _diffEnd,
          "-", 0, -1, _diffKO + I18N_D.t("diff.fb_borne_inf_ko").split("{V}").join("{@" + t(7) + "@}") + _diffEnd, "prt6" + X),
        _diffNode(2, "UnitsRelative", "ans6" + X, t(7), "0.05", "+", 0.5, 3, "", "-", 0, 3, "", "prt6" + X),
        _diffNode(3, "NumRelative", "ans7" + X, t(7), "0.05", "+", 1, -1,
          _diffOK + I18N_D.t("diff.fb_borne_basse_ok") + _diffEnd, "-", 0, 4, "", "prt6" + X),
        _diffNode(4, "UnitsRelative", "ans7" + X, t(6), "0.05", "+", 0.5, -1,
          I18N_D.t("diff.fb_bornes_interverties") + _diffEnd,
          "-", 0, -1, _diffKO + I18N_D.t("diff.fb_borne_sup_ko").split("{V}").join("{@" + t(6) + "@}") + _diffEnd, "prt6" + X)
      ])
    ].join("\n\n");
    feedbackRef = [1, 2, 3, 4, 5, 6].map(function (n) { return "[[feedback:prt" + n + X + "]]"; }).join("");
  }

  var jsx = _diffBuildJsx(type, mode, I18N_D)
    .replace(/\{#a1#\}/g, "{#" + A + "#}")
    .replace(/\{#D1#\}/g, "{#" + D + "#}")
    .replace(/\{#b1#\}/g, "{#" + B + "#}")
    .replace(/\{#lambda#\}/g, "{#" + L + "#}");

  var header = '<div style="background:#4338ca;border-left:5px solid #312e81;border-radius:0 8px 8px 0;'
    + 'padding:10px 16px;margin-bottom:12px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">'
    + '<strong style="font-weight:800;color:#fff;font-size:.95rem;">Q' + X + ' — ' + I18N_D.t("diff.header_title") + '</strong>'
    + '<span style="background:#312e81;color:#fff;padding:2px 9px;border-radius:20px;font-size:.78rem;font-weight:700;">/ ' + bareme + ' pt</span>'
    + '<span style="background:#fff;color:#312e81;border:1px solid #312e81;padding:2px 9px;border-radius:20px;font-size:.75rem;font-weight:600;">' + I18N_D.t('diff.type_' + type) + ' / ' + I18N_D.t('diff.mode_' + mode) + '</span>'
    + "</div>";

  var textFrag = header
    + "<!-- ENONCE-START --><div style=\"margin-bottom:14px;\">" + (text || "") + "</div><!-- ENONCE-END -->\n"
    + params + "<!--HS-KBD:" + X + "-->\n"
    + consigneJsx + consigneMes + "\n"
    + subQs;

  var demo = _diffBuildSvgPreview_D(type, mode,
    isRnd ? DIFF_A_LIST[3] : aFix,
    isRnd ? DIFF_D_LIST[2] : DFix,
    isRnd ? DIFF_B_LIST[2] : bFix,
    isRnd ? 532 : lambdaFix);
  var previewFrag = header
    + "<!-- ENONCE-START --><div style=\"margin-bottom:10px;\">" + (text || "") + "</div><!-- ENONCE-END -->\n"
    + '<div style="text-align:center;">' + demo.svg + "</div>"
    + '<p style="font-size:.85rem;color:#475569;">' + demo.meas + " – " + nPRT + " sous-questions</p>"
    + params + subQs.replace(/\[\[input:[^\]]+\]\] \[\[validation:[^\]]+\]\]/g, "<em style=\"color:#6b7280;\">[reponse]</em>");

  var recap = I18N_D.t("diff.recap_prefix") + ((type === "fente_simple" || type === "trou_circulaire" || type === "trou_carre") ? I18N_D.t("diff.recap_diffraction") : I18N_D.t("diff.recap_interferences")) + I18N_D.t("diff.recap_lambda_suffix")
    + "{@" + L + "@} nm.</p>";

  return {
    bareme: bareme, vars: vars, qnote: "{@" + L + "@} nm",
    textFrag: textFrag, previewFrag: previewFrag,
    inputXML: inputXML, prtXML: prtXML,
    generalFeedback: _mkFbGen_D(recap, p.fbGenRaw),
    feedbackRef: feedbackRef,
    kbdRaw: jsx
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    genDiffraction: genDiffraction,
    genDiffractionCore: genDiffractionCore,
    genDiffractionParams: genDiffractionParams
  };
}
