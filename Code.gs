/**
 * AI Recommendations — Pretests 1·2·3
 * Google Apps Script backend  (v2 — append-only, loss-resistant)
 *
 * Design principle: every incoming request is written as ONE appended row to a
 * raw log. Nothing is ever overwritten, nothing is read-modify-written during
 * data collection. The analysis-ready wide table is rebuilt from that log.
 * If the rebuild ever breaks, the raw data is still intact.
 *
 * Deploy:  Extensions ▸ Apps Script ▸ paste ▸ Deploy ▸ New deployment
 *          Web app · Execute as "Me" · Access "Anyone"
 * After deploying, run installRebuildTrigger() once from the editor.
 */

var SH_RAW    = 'raw';           // append-only source of truth
var SH_ASSIGN = 'assignments';   // one row per participant, written once
var SH_RESP   = 'responses';     // rebuilt wide table (derived, disposable)
var RECLAIM_MIN = 90;

/* ============================ factors ============================ */
function FACTORS() {
  return {
    order:   ['P1P2P3','P1P3P2','P2P1P3','P2P3P1','P3P1P2','P3P2P1'],
    p1:      ['SELF','AIT','AI4'],
    p2pair:  pairsOf(['S1L','S1H','S2L','S2H','S3L','S3H']),
    p2order: ['AB','BA'],
    p3pair:  pairsOf(['S1STD','S1SER','S2STD','S2SER','S3STD','S3SER']),
    p3order: ['AB','BA']
  };
}
function pairsOf(a) {
  var o = [];
  for (var i = 0; i < a.length; i++)
    for (var j = i + 1; j < a.length; j++) o.push(a[i] + '+' + a[j]);
  return o;
}
function shuffle(a) {
  for (var i = a.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}

/* ============================ sheets ============================ */
function sheet_(name, header) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    if (header) sh.appendRow(header);
  }
  return sh;
}
var RAW_HEADER    = ['received_at','token','action','seq','payload'];
var ASSIGN_HEADER = ['token','pid','study_id','session_id','assigned_at','completed_at',
                     'status','order','p1','p2pair','p2order','p3pair','p3order','user_agent'];

/* ============================ endpoints ============================ */
function doGet() { return json_({ok: true, service: 'pretests', v: 2}); }

function doPost(e) {
  try {
    var req = JSON.parse(e.postData.contents);

    /* Saves are append-only and take no lock: they can never block or fail
       because of contention, and they can never corrupt an existing row. */
    if (req.action === 'save' || req.action === 'complete') {
      sheet_(SH_RAW, RAW_HEADER).appendRow([
        new Date(), req.token || '', req.action, req.seq || 0,
        JSON.stringify(req.data || {})
      ]);
      if (req.action === 'complete') markComplete_(req);   /* complete · no_consent · under19 · never_booked · duplicate */
      return json_({ok: true});
    }

    if (req.action === 'assign') return json_(handleAssign_(req));
    return json_({ok: false, error: 'unknown action'});
  } catch (err) {
    /* Even a malformed request is preserved so nothing is silently lost. */
    try {
      sheet_(SH_RAW, RAW_HEADER).appendRow([new Date(), 'ERROR', 'error', 0,
        String(err) + ' :: ' + (e && e.postData ? e.postData.contents : '')]);
    } catch (e2) {}
    return json_({ok: false, error: String(err)});
  }
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
         .setMimeType(ContentService.MimeType.JSON);
}

/* ---------- assignment: the only locked operation ---------- */
function handleAssign_(req) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(45000)) return {ok: false, error: 'busy'};
  try {
    var props = PropertiesService.getScriptProperties();
    var sh = sheet_(SH_ASSIGN, ASSIGN_HEADER);
    var token = req.cid || Utilities.getUuid();
    var n = sh.getLastRow();

    if (n > 1) {
      var v = sh.getRange(2, 1, n - 1, ASSIGN_HEADER.length).getValues();
      for (var i = 0; i < v.length; i++) {
        /* Idempotent: a refresh or a retried request must not draw a second
           condition, which would silently unbalance the design. */
        if (String(v[i][0]) === String(token))
          return {ok: true, token: token, assignment: {
            order: v[i][7], p1: v[i][8], p2pair: v[i][9],
            p2order: v[i][10], p3pair: v[i][11], p3order: v[i][12]}};
        /* One completed response per Prolific account. */
        if (req.pid && String(v[i][1]) === String(req.pid) && v[i][6] === 'complete')
          return {ok: false, duplicate: true};
      }
    }

    reclaimStale_(props);

    var F = FACTORS(), a = {};
    Object.keys(F).forEach(function (k) {
      var q = JSON.parse(props.getProperty('q_' + k) || '[]');
      if (!q.length) q = shuffle(F[k].slice());
      a[k] = q.shift();
      props.setProperty('q_' + k, JSON.stringify(q));
    });

    sh.appendRow([token, req.pid || '', req.study_id || '', req.session_id || '',
                  new Date(), '', 'assigned',
                  a.order, a.p1, a.p2pair, a.p2order, a.p3pair, a.p3order, req.ua || '']);
    return {ok: true, token: token, assignment: a};
  } finally {
    lock.releaseLock();
  }
}

function reclaimStale_(props) {
  var sh = sheet_(SH_ASSIGN, ASSIGN_HEADER);
  var n = sh.getLastRow();
  if (n < 2) return;
  var rng = sh.getRange(2, 1, n - 1, ASSIGN_HEADER.length), v = rng.getValues();
  var cut = new Date(Date.now() - RECLAIM_MIN * 60 * 1000), changed = false;
  for (var i = 0; i < v.length; i++) {
    if (v[i][6] !== 'assigned') continue;
    var t = v[i][4] instanceof Date ? v[i][4] : new Date(v[i][4]);
    if (t > cut) continue;
    ['order','p1','p2pair','p2order','p3pair','p3order'].forEach(function (k, j) {
      var q = JSON.parse(props.getProperty('q_' + k) || '[]');
      q.splice(Math.floor(Math.random() * (q.length + 1)), 0, v[i][7 + j]);
      props.setProperty('q_' + k, JSON.stringify(q));
    });
    v[i][6] = 'expired';
    changed = true;
  }
  if (changed) rng.setValues(v);
}

function markComplete_(req) {
  try {
    var sh = sheet_(SH_ASSIGN, ASSIGN_HEADER);
    var n = sh.getLastRow();
    if (n < 2) return;
    var col = sh.getRange(2, 1, n - 1, 1).getValues();
    for (var i = 0; i < col.length; i++) {
      if (String(col[i][0]) === String(req.token)) {
        sh.getRange(i + 2, 6).setValue(new Date());
        sh.getRange(i + 2, 7).setValue(req.status || 'complete');
        return;
      }
    }
  } catch (e) { /* never let this break the save */ }
}

/* ============================ rebuild ============================
   Collapses the raw log into one row per token (latest value wins).
   Safe to run at any time; it only rewrites the derived sheet.      */
function rebuildResponses() {
  var raw = sheet_(SH_RAW, RAW_HEADER);
  var n = raw.getLastRow();
  if (n < 2) return;
  var rows = raw.getRange(2, 1, n - 1, RAW_HEADER.length).getValues();

  var byToken = {}, order = [], keys = {};
  rows.forEach(function (r) {
    var token = String(r[1]);
    if (!token || token === 'ERROR') return;
    var d;
    try { d = JSON.parse(r[4]); } catch (e) { return; }
    if (!byToken[token]) { byToken[token] = {token: token}; order.push(token); }
    Object.keys(d).forEach(function (k) {
      if (d[k] === '' || d[k] === null || d[k] === undefined) return;
      byToken[token][k] = d[k];
      keys[k] = true;
    });
  });

  /* stable column order: identifiers, design, then everything else */
  var lead = ['token','pid','study_id','session_id','assign_source','started_at',
              'finished_at','screened_out','order','p1_cond','p2_pair','p2_order',
              'p3_pair','p3_order','CONSENT','SCR_AGE','SCR_FREQ'];
  var rest = Object.keys(keys).filter(function (k) { return lead.indexOf(k) === -1; }).sort();
  var header = lead.concat(rest);

  var out = [header];
  order.forEach(function (t) {
    var o = byToken[t];
    out.push(header.map(function (k) { return o[k] === undefined ? '' : o[k]; }));
  });

  var sh = sheet_(SH_RESP, null);
  sh.clear();
  sh.getRange(1, 1, out.length, header.length).setValues(out);
  sh.setFrozenRows(1);
}

/* run once from the editor: rebuilds the wide table every 15 minutes */
function installRebuildTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'rebuildResponses') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('rebuildResponses').timeBased().everyMinutes(15).create();
}

/* ============================ participant lookup ============================
   For answering "I did your study, why wasn't I paid?" messages.
   Run from the editor, then read the log.                                    */
function findParticipant(prolificId) {
  var raw = sheet_(SH_RAW, RAW_HEADER);
  var n = raw.getLastRow();
  if (n < 2) { Logger.log('no data'); return; }
  var rows = raw.getRange(2, 1, n - 1, RAW_HEADER.length).getValues();
  var hits = [];
  rows.forEach(function (r) {
    var d; try { d = JSON.parse(r[4]); } catch (e) { return; }
    if (String(d.pid) !== String(prolificId)) return;
    hits.push({when: r[0], token: r[1], action: r[2],
               reached: d.reached || '', screened_out: d.screened_out || '',
               answered: Object.keys(d).filter(function (k) {
                 return /^(P1_|P2_|P3_|DEM_|CONSENT|SCR_)/.test(k); }).length});
  });
  if (!hits.length) { Logger.log('No record for ' + prolificId +
    ' — this person never opened the study link.'); return; }
  Logger.log('records for ' + prolificId + ': ' + hits.length);
  Logger.log('first seen: ' + hits[0].when + '   last seen: ' + hits[hits.length-1].when);
  var last = hits[hits.length - 1];
  Logger.log('furthest point: ' + last.reached +
             (last.screened_out ? '  (ended: ' + last.screened_out + ')' : '') +
             '   answers recorded: ' + last.answered);
}

/* ============================ monitoring ============================ */
function statusReport() {
  var sh = sheet_(SH_ASSIGN, ASSIGN_HEADER);
  var n = sh.getLastRow();
  if (n < 2) { Logger.log('no assignments yet'); return; }
  var v = sh.getRange(2, 7, n - 1, 7).getValues();
  var st = {}, cells = {};
  v.forEach(function (r) {
    st[r[0]] = (st[r[0]] || 0) + 1;
    if (r[0] !== 'complete') return;
    ['order','p1','p2pair','p2order','p3pair','p3order'].forEach(function (k, i) {
      cells[k] = cells[k] || {};
      cells[k][r[i + 1]] = (cells[k][r[i + 1]] || 0) + 1;
    });
  });
  var F = FACTORS(), bal = {};
  Object.keys(F).forEach(function (k) {
    var c = F[k].map(function (x) { return (cells[k] || {})[x] || 0; });
    bal[k] = {min: Math.min.apply(null, c), max: Math.max.apply(null, c),
              spread: Math.max.apply(null, c) - Math.min.apply(null, c)};
  });
  Logger.log('status: ' + JSON.stringify(st));
  Logger.log('balance: ' + JSON.stringify(bal, null, 2));
  Logger.log('raw rows: ' + (sheet_(SH_RAW, RAW_HEADER).getLastRow() - 1));
}
