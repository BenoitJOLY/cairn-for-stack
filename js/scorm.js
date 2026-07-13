// ══════════════════════════════════════════════════
//  SCORM 1.2 — Stackforge Générateur
//  Complété = au moins 1 XML téléchargé
// ══════════════════════════════════════════════════
var SCORM_API = null;
var _scormCompleted = false;

function _findAPI(win) {
  var attempts = 0;
  try {
    while (!win.API && win.parent && win.parent !== win && attempts < 10) {
      win = win.parent; attempts++;
    }
    return win.API || null;
  } catch(e) { return null; }
}

function scormInit() {
  try {
    SCORM_API = _findAPI(window);
    if (!SCORM_API && window.opener) SCORM_API = _findAPI(window.opener);
    if (SCORM_API) {
      SCORM_API.LMSInitialize("");
      SCORM_API.LMSSetValue("cmi.core.lesson_status", "incomplete");
      SCORM_API.LMSSetValue("cmi.core.score.min", "0");
      SCORM_API.LMSSetValue("cmi.core.score.max", "100");
      SCORM_API.LMSCommit("");
    }
  } catch(e) {}
}

// Appelé par app.js lors du téléchargement du XML
function scormOnDownload() {
  if (_scormCompleted) return;
  try {
    if (SCORM_API) {
      SCORM_API.LMSSetValue("cmi.core.lesson_status", "completed");
      SCORM_API.LMSSetValue("cmi.core.score.raw", "100");
      SCORM_API.LMSCommit("");
      _scormCompleted = true;
    }
  } catch(e) {}
}

function scormFinish() {
  try {
    if (SCORM_API) {
      if (!_scormCompleted) {
        SCORM_API.LMSSetValue("cmi.core.lesson_status", "incomplete");
        SCORM_API.LMSCommit("");
      }
      SCORM_API.LMSFinish("");
    }
  } catch(e) {}
}

window.addEventListener("load", scormInit);
window.addEventListener("beforeunload", scormFinish);
