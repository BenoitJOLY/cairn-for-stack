function renderPreviewHTML_cw(state) {
  try {
  var gridData = state.gridData;
  var placedWords = state.placedWords || [];

  var gridHTML = '';
  if (gridData && gridData.grid && gridData.maxX !== undefined) {
    gridHTML = '<div style="text-align:center;margin-bottom:16px;">' +
      (typeof renderCWGridHTMLEmpty === 'function'
        ? renderCWGridHTMLEmpty(gridData.grid, gridData.maxX, gridData.maxY)
        : '') +
      '</div>';
  } else {
    gridHTML = '<p style="color:#94a3b8;font-style:italic;margin-bottom:12px;">G\xe9n\xe9rez la grille dans l\'onglet Config pour afficher l\'aper\xe7u.</p>';
  }

  var defsHTML = '';
  if (placedWords.length > 0) {
    var horizWords = placedWords.filter(function(w){ return w.direction === 'H'; }).sort(function(a,b){ return a.number - b.number; });
    var vertWords  = placedWords.filter(function(w){ return w.direction === 'V'; }).sort(function(a,b){ return a.number - b.number; });
    if (horizWords.length > 0) {
      defsHTML += '<p style="font-weight:700;margin:8px 0 4px;">Horizontal</p><ul style="padding-left:1.2em;margin:0 0 10px;">';
      horizWords.forEach(function(w){ defsHTML += '<li style="margin-bottom:3px;"><strong>' + w.number + '.</strong> ' + (w.def || '') + '</li>'; });
      defsHTML += '</ul>';
    }
    if (vertWords.length > 0) {
      defsHTML += '<p style="font-weight:700;margin:8px 0 4px;">Vertical</p><ul style="padding-left:1.2em;margin:0 0 10px;">';
      vertWords.forEach(function(w){ defsHTML += '<li style="margin-bottom:3px;"><strong>' + w.number + '.</strong> ' + (w.def || '') + '</li>'; });
      defsHTML += '</ul>';
    }
  } else if ((state.rows || []).length > 0) {
    defsHTML = '<ul style="padding-left:1.2em;">' +
      state.rows.map(function(r){ return '<li><strong>' + (r.w||'').replace(/</g,'&lt;') + '</strong> — ' + (r.d||'') + '</li>'; }).join('') +
      '</ul>';
  } else {
    defsHTML = '<p style="color:#94a3b8;font-style:italic;">Ajoutez des mots pour afficher l\'aper\xe7u.</p>';
  }

  // Feedback général : grille complétée (styles inline pour l'iframe) + réponses
  var fbGenContent = '';
  if (gridData && gridData.grid && gridData.maxX !== undefined) {
    var BLUE = '#4095AD';
    var filledTable = '<table style="border-collapse:collapse;border:2px solid ' + BLUE + ';background:' + BLUE + ';display:inline-table;line-height:1;border-spacing:0;"><tbody>';
    for (var fy = 0; fy <= gridData.maxY; fy++) {
      filledTable += '<tr>';
      for (var fx = 0; fx <= gridData.maxX; fx++) {
        var fkey = fx + ',' + fy;
        var fcell = gridData.grid[fkey];
        if (fcell) {
          var fnum = fcell.number ? '<span style="position:absolute;top:1px;left:2px;font-size:9px;color:#333;font-weight:normal;line-height:1;font-family:Arial,sans-serif;">' + fcell.number + '</span>' : '';
          filledTable += '<td style="width:30px;height:30px;min-width:30px;background:#fff;border:1px solid #999;padding:0;position:relative;text-align:center;vertical-align:middle;font-weight:bold;font-size:.9rem;">' + fnum + (fcell.letter || '') + '</td>';
        } else {
          filledTable += '<td style="width:30px;height:30px;min-width:30px;background:' + BLUE + ';border:none;padding:0;"></td>';
        }
      }
      filledTable += '</tr>';
    }
    filledTable += '</tbody></table>';
    fbGenContent += '<div style="text-align:center;margin-bottom:14px;">' + filledTable + '</div>';
  }
  if (placedWords.length > 0) {
    var horizFb = placedWords.filter(function(w){ return w.direction === 'H'; }).sort(function(a,b){ return a.number - b.number; });
    var vertFb  = placedWords.filter(function(w){ return w.direction === 'V'; }).sort(function(a,b){ return a.number - b.number; });
    if (horizFb.length > 0) {
      fbGenContent += '<p style="font-weight:700;margin:6px 0 3px;">Horizontal</p><ul style="padding-left:1.2em;margin:0 0 8px;">';
      horizFb.forEach(function(w){ fbGenContent += '<li><strong>' + w.number + '.</strong> ' + (w.word||'') + (w.def ? ' — ' + w.def : '') + '</li>'; });
      fbGenContent += '</ul>';
    }
    if (vertFb.length > 0) {
      fbGenContent += '<p style="font-weight:700;margin:6px 0 3px;">Vertical</p><ul style="padding-left:1.2em;margin:0 0 8px;">';
      vertFb.forEach(function(w){ fbGenContent += '<li><strong>' + w.number + '.</strong> ' + (w.word||'') + (w.def ? ' — ' + w.def : '') + '</li>'; });
      fbGenContent += '</ul>';
    }
  }
  if (!fbGenContent) {
    fbGenContent = '<p style="color:#94a3b8;font-style:italic;">G\xe9n\xe9rez la grille pour afficher la solution.</p>';
  }

  return _hsSimplePreviewHTML({
    badge: 'Mots Crois\xe9s', badgeColor: '#c2410c', noteBg: '#fff7ed', noteColor: '#9a3412',
    prefix: 'cw', bareme: state.bareme || 10,
    text: gridHTML + defsHTML,
    hideExampleBox: true,
    fbGenAuto: fbGenContent,
    fbOk: '', fbWrong: '', fbGen: state.fbGen
  });
  } catch(e) {
    return '<html><body style="font-family:sans-serif;padding:12px;color:#dc2626;"><strong>Erreur aperçu mots croisés :</strong><pre style="font-size:.8rem;white-space:pre-wrap;">' + String(e) + '</pre></body></html>';
  }
}
window.cwRefreshPreview = _hsWireSimplePreview('crossword', 'cw', 'cw-preview-container', 'fp-crossword', renderPreviewHTML_cw);
