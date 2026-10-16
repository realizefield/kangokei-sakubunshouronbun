/**
 * 看護作文GAMBA：AIの質問・評価・アドバイス と スプレッドシート記録
 * 使い方は「設定手順.txt」を見てください。
 * スクリプトプロパティ：ANTHROPIC_API_KEY（AIを使うときだけ必要。シートへの保存だけなら不要）／MODEL（任意）
 */
var DEFAULT_MODEL = 'claude-sonnet-5-5';
var SHEET_NAME = '記録';
var PER_PEN_LIMIT = 40;     // 1人（ペンネーム）が1日に使えるAI回数の目安
var ALL_LIMIT = 400;        // 全体で1日に使えるAI回数の上限

var SYSTEM = [
  'あなたは、看護学校（正看護・准看護）の作文・小論文の入試対策を支える、やさしい指導者です。',
  '生徒さんは、不登校経験者、中退、通信制高校、社会人、ひとり親など、作文が苦手な方が多いです。',
  '守ること：',
  '・否定しません。できているところを先に認めます。直す点は多くても3つに絞り、具体的に伝えます。',
  '・やさしい言葉で、短く書きます。',
  '・生徒さんの代わりに全文を書きません。書き出しの型や、言い換えの例を示します。',
  '・住所・氏名・電話番号などの個人情報を書くようにすすめません。',
  '・志望校の理念やキーワードは、無理に詰め込ませず、本人の経験とつなげる形で提案します。学校の情報が不確かなときは断定しません。',
  '・本人が書いていない経験を、勝手に作って足しません。'
].join('\n');

var JSON_RULE = '\n出力は、次の形のJSONだけを返してください（前後に文章を付けない）：\n' +
  '{"score":0〜100の整数,"comment":"一言（40字以内）","good":["よい点（最大3つ）"],"issues":["のばせる点（最大3つ）"],"advice":"次にすること（やさしい言葉で）","example":"書き方の例（任意。空でもよい）"}\n' +
  'scoreの目安：内容の具体性30点／構成20点／文章の正しさ20点／志望校・看護とのつながり20点／字数10点。';

function doPost(e) {
  var out;
  try {
    var p = JSON.parse(e.postData.contents);
    if (hasPII_(JSON.stringify(p))) {
      out = {ok: false, err: 'pii', text: '電話番号・住所・メールアドレスのような文字が入っています。消してからもう一度送ってください。'};
    } else if (p.action === 'save') {
      saveProfile_(p);
      out = {ok: true};
    } else if (p.action === 'log') {
      writeRow_(p, '送信');
      out = {ok: true};
    } else if (!limitOk_(p.pen)) {
      out = {ok: false, err: 'limit', text: '今日はたくさん使いました。続きは、野田先生に質問してください。'};
    } else {
      out = handle_(p);
    }
  } catch (err) {
    out = {ok: false, err: String(err)};
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return ContentService.createTextOutput('看護作文GAMBA AI サーバーは動いています。');
}

function handle_(p) {
  var ctx = '【志望校】\n' + JSON.stringify(p.schools || []) +
    '\n【入試】形式：' + (p.exam || '') + '／字数：' + (p.chars || '') + '／時間：' + (p.mins || '') +
    '\n【素材シート（本人が書いた素材）】\n' + (p.sheet || '');
  var a = p.action, user, r, kind, para = '';
  if (a === 'ask') {
    var t = call_(SYSTEM, '生徒さんからの質問に、やさしく答えてください。短く（300字以内）。\n【いまのページ】' + p.page + '\n' + ctx + '\n【質問】\n' + p.question, 700);
    return {ok: true, text: t.trim()};
  }
  if (a === 'structure') {
    user = ctx + '\n【段落の構成（本人の構想）】\n' + (p.roles || []).map(function (n, i) { return (i + 1) + '段落目（' + n + '）：' + (p.plan[i] || '（未記入）'); }).join('\n') +
      '\n\n上の「段落の構成」を評価してください。素材シートを使って、本人の経験が活きる構成か、足りない段落はないか、順番はよいかを見てください。' +
      'adviceには、構想が弱い段落の作り方（問いかけ）を書いてください。exampleには、構想の言い換え例を1〜2個。' + JSON_RULE;
    kind = '構成';
  } else if (a === 'paragraph') {
    user = ctx + '\n【全体の構想】\n' + (p.plan || []).join('\n') + '\n【これまでの段落】\n' + (p.prev || []).join('\n\n') +
      '\n\n【いま書いた' + p.index + '段落目（' + p.role + '）】\n' + p.text +
      '\n\nこの段落だけを評価してください。構想どおりか、素材シートの経験とつながっているか、文章は正しいかを見ます。' +
      'exampleには、直した一文の例（1つだけ）。' + JSON_RULE;
    kind = '段落'; para = p.index;
  } else if (a === 'hint') {
    user = ctx + '\n【全体の構想】\n' + (p.plan || []).join('\n') + '\n【これまでの段落】\n' + (p.prev || []).join('\n\n') +
      '\n\n生徒さんは' + p.index + '段落目（' + p.role + '）が書けません。いま書けている分：\n' + (p.text || '（なし）') +
      '\n\n書き出しの型と、考えるための問いかけを2〜3個、示してください。全文は書かないでください。' +
      '次のJSONだけを返してください：{"advice":"問いかけ（箇条書きの文章）","example":"書き出しの型（〜の部分は空けておく）"}';
    kind = ''; 
  } else if (a === 'full') {
    user = ctx + '\n【段落の構想】\n' + (p.plan || []).join('\n') + '\n\n【全文】\n' + (p.paras || []).join('\n\n') +
      '\n\n全文を評価してください。入試の作文として、内容・構成・文章・志望校とのつながり・字数を見ます。adviceには、清書の前に直すとよいことを書いてください。' + JSON_RULE;
    kind = '全文';
  } else {
    return {ok: false, err: 'unknown action'};
  }
  var raw = call_(SYSTEM, user, 1400);
  r = parseJson_(raw);
  if (!r) return {ok: false, err: 'parse'};
  r.ok = true;
  if (kind) {
    writeRow_({pen: p.pen, round: p.round, schools: (p.schools || []).map(function (s) { return s.name; }),
      score: r.score, good: (r.good || []).join(' / '), issues: (r.issues || []).join(' / '),
      chars: String(a === 'full' ? (p.paras || []).join('').length : (p.text || '').length),
      text: a === 'full' ? (p.paras || []).join('\n') : (a === 'paragraph' ? p.text : (p.plan || []).join('\n')), para: para}, kind);
  }
  return r;
}

function call_(system, user, maxTokens) {
  var props = PropertiesService.getScriptProperties();
  var key = props.getProperty('ANTHROPIC_API_KEY');
  if (!key) throw new Error('ANTHROPIC_API_KEY が設定されていません');
  var model = props.getProperty('MODEL') || DEFAULT_MODEL;
  var res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post', contentType: 'application/json',
    headers: {'x-api-key': key, 'anthropic-version': '2023-06-01'},
    payload: JSON.stringify({model: model, max_tokens: maxTokens, system: system, messages: [{role: 'user', content: user}]}),
    muteHttpExceptions: true
  });
  var code = res.getResponseCode(), body = res.getContentText();
  if (code !== 200) throw new Error('AI error ' + code + ': ' + body.slice(0, 200));
  var j = JSON.parse(body);
  return (j.content || []).map(function (c) { return c.text || ''; }).join('');
}

function parseJson_(t) {
  var m = String(t).match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch (e) { return null; }
}

function writeRow_(p, kind) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(['日時', 'ペンネーム', '氏名', '回', '種別', '段落', '志望校', '点数', '良い点', '課題点', '字数', '本文']);
    sh.setFrozenRows(1);
  }
  var schools = Array.isArray(p.schools) ? p.schools.join('、') : (p.schools || '');
  sh.appendRow([new Date(), p.pen || '', '', p.round || '', p.kind || kind, p.para || '', schools,
    p.score === undefined ? '' : p.score, p.good || '', p.issues || '', p.chars || '', p.text || '']);
  var rr = sh.getLastRow(); // 氏名は「素材」シートから自動で引く
  sh.getRange(rr, 3).setFormula('=IFERROR(VLOOKUP(B' + rr + ',\'素材\'!B:C,2,FALSE),"")');
}

/** 素材シートの内容を「素材」シートに保存（ペンネームごとに1行。同じペンネームなら上書き） */
var PROFILE_KEYS = ['立場', '学歴区分', '学科', '志望校', '入試形式', '字数', '制限時間', '部活動', '役職', '高校での入賞', '高校で頑張ったこと',
  '職歴', 'モットー', '看護につながる経験', 'つらかったこと', '乗り越え方', '看護師に役立つこと', 'お子さん', 'ひとり親', '入学後の不安',
  '自己PR', '頑張ったこと', '研究', 'なりたい看護師'];
function saveProfile_(p) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('素材') || ss.insertSheet('素材');
  var head = ['更新日時', 'ペンネーム', '氏名（先生が記入）', '最新の回'].concat(PROFILE_KEYS);
  if (sh.getLastRow() === 0) { sh.appendRow(head); sh.setFrozenRows(1); }
  var pr = p.profile || {};
  var row = [new Date(), p.pen || '', '', p.round || ''].concat(PROFILE_KEYS.map(function (k) { return pr[k] || ''; }));
  var last = sh.getLastRow(), r = 0;
  if (last > 1) {
    var pens = sh.getRange(2, 2, last - 1, 1).getValues();
    for (var i = 0; i < pens.length; i++) { if (pens[i][0] === p.pen) { r = i + 2; break; } }
  }
  if (r) { row[2] = sh.getRange(r, 3).getValue(); sh.getRange(r, 1, 1, row.length).setValues([row]); } // 氏名は上書きしない
  else sh.appendRow(row);
}

function limitOk_(pen) {
  var c = CacheService.getScriptCache();
  var day = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMdd');
  var k1 = 'p_' + day + '_' + (pen || 'x'), k2 = 'all_' + day;
  var n1 = Number(c.get(k1) || 0), n2 = Number(c.get(k2) || 0);
  if (n1 >= PER_PEN_LIMIT || n2 >= ALL_LIMIT) return false;
  c.put(k1, String(n1 + 1), 21600); c.put(k2, String(n2 + 1), 21600);
  return true;
}

function hasPII_(t) {
  return /0\d{1,4}[-ー−\s]?\d{1,4}[-ー−\s]?\d{3,4}/.test(t) || /\d{3}[-ー−]\d{4}/.test(t) ||
         /[\w.+-]+@[\w-]+\.[\w.]+/.test(t) || /〒/.test(t);
}

/** 動作テスト：エディタで実行すると「記録」シートに1行できます */
function testLog() {
  writeRow_({pen: 'テスト', round: 1, schools: ['テスト校'], score: 70, good: 'テスト', issues: 'テスト', chars: 10, text: 'テスト'}, '送信');
}
