/**
 * SOL 3:16 Teens — учёт подростков. Сервер (Google Apps Script).
 * Все данные лежат в этой Google Таблице.
 */

const OLD_SHEET_ID = '1cr0gqietxDMumkZDCkqQluDX-1rPqCpLA3YqyS5wnx0';
const TZ = 'America/Los_Angeles';

// [ключ, заголовок в таблице]
const COLS = {
  'Подростки': [['id','ID'],['first','Имя'],['last','Фамилия'],['phone','Телефон'],['birth','Дата рождения'],['addr','Адрес'],
    ['pFirst','Имя родителя'],['pLast','Фамилия родителя'],['pPhone','Телефон родителя'],['pAddr','Адрес родителя'],
    ['groups','Группы (ID)'],['createdAt','Добавлен'],['source','Источник'],['invitedBy','Пригласил (ID)'],['review','Проверить'],
    ['ig','Instagram'],['tgId','Telegram ID'],['archived','Скрыт'],['igStatus','Instagram: статус'],['tgChat','В Telegram-чате'],['age','Возраст (со слов)'],['ageAt','Возраст указан (дата)']],
  'Посещения': [['id','ID'],['date','Дата'],['kind','Тип'],['meetId','Встреча (ID)'],['teenId','Подросток (ID)'],['teenName','Подросток'],['by','Отметил'],['method','Способ'],['ts','Время отметки']],
  'Группы': [['id','ID'],['name','Название'],['leader','Лидер'],['day','День (0=вс)'],['time','Время'],['active','Активна'],['addr','Адрес'],['contact','Контакт лидера']],
  'События': [['id','ID'],['name','Название'],['date','Дата'],['reg','Регистраций']],
  'Лидеры': [['id','ID'],['email','Email'],['name','Имя'],['role','Роль'],['groups','Группы (ID)'],['status','Статус'],['code','Код приглашения'],['invitedAt','Приглашён']],
  'Задания': [['id','ID'],['title','Задание'],['kind','Тип'],['due','Срок'],['pts','Баллы'],['aud','Для групп (ID)'],['createdBy','Создал'],['createdAt','Создано']],
  'Выполнения': [['taskId','Задание (ID)'],['teenId','Подросток (ID)'],['date','Дата'],['by','Засчитал'],['status','Статус']],
  'Напоминания': [['taskId','Задание (ID)'],['teenId','Подросток (ID)'],['date','Дата'],['by','Кто']],
  'Ачивки': [['id','ID'],['badge','Ачивка'],['teenId','Подросток (ID)'],['date','Дата'],['by','Засчитал']],
  'Настройки': [['key','Ключ'],['value','Значение']],
  'Входы': [['teenId','Подросток (ID)'],['date','Дата']],
  'Заявки': [['id','ID'],['teenId','Подросток (ID)'],['groupId','Группа (ID)'],['date','Дата'],['status','Статус'],['by','Решил']],
  'Приглашения': [['id','ID'],['by','Пригласил (ID)'],['first','Имя'],['last','Фамилия'],['phone','Телефон'],['date','Дата'],['status','Статус'],['teenId','Подросток (ID)']],
  '_Сессии': [['token','Токен'],['email','Email'],['expires','Истекает']],
  '_ТГ': [['nonce','Код входа'],['chatId','Telegram чат'],['teenId','Подросток (ID)'],['status','Статус'],['created','Создан']],
  '_Коды': [['email','Email'],['code','Код'],['expires','Истекает']]
};

const DEFAULT_SETTINGS = { win: '8', reg: '6', gone: '3', serviceTime: '15:00', wedTime: '18:00', friTime: '19:00', before: '60', after: '240', qrAlways: '0' };

// ---------------- доступ к таблице ----------------
function ss_() {
  const id = PropertiesService.getScriptProperties().getProperty('SS_ID');
  return id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
}
function sh_(name) { return ss_().getSheetByName(name); }
function keys_(name) { return COLS[name].map(c => c[0]); }
function rows_(name) {
  const s = sh_(name); const last = s.getLastRow();
  if (last < 2) return [];
  const keys = keys_(name);
  const v = s.getRange(2, 1, last - 1, keys.length).getDisplayValues();
  return v.map((r, i) => { const o = { _row: i + 2 }; keys.forEach((k, j) => o[k] = r[j]); return o; });
}
function toRow_(name, obj) { return keys_(name).map(k => obj[k] == null ? '' : String(obj[k])); }
function append_(name, obj) { sh_(name).appendRow(toRow_(name, obj)); }
function appendMany_(name, objs) {
  if (!objs.length) return;
  const s = sh_(name);
  s.getRange(s.getLastRow() + 1, 1, objs.length, keys_(name).length).setValues(objs.map(o => toRow_(name, o)));
}
function update_(name, rowObj, patch) {
  const o = Object.assign({}, rowObj, patch);
  sh_(name).getRange(rowObj._row, 1, 1, keys_(name).length).setValues([toRow_(name, o)]);
  return o;
}
function delete_(name, rowNums) {
  const s = sh_(name);
  rowNums.sort((a, b) => b - a).forEach(r => s.deleteRow(r));
}
function uid_(p) { return p + Date.now().toString(36).toUpperCase() + Math.floor(Math.random() * 1296).toString(36).toUpperCase(); }
function today_() { return Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd'); }
function nowIso_() { return Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd HH:mm"); }
function digits_(x) { return String(x || '').replace(/\D/g, '').slice(-10); }
function lock_(fn) { const l = LockService.getScriptLock(); l.waitLock(20000); try { return fn(); } finally { l.releaseLock(); } }
// Общие встречи для всех подростков (не малые группы): день недели и ключ времени в «Настройках»
const SERVICES = [
  { id: 'sunday', day: 0, key: 'serviceTime', name: 'Sunday Service' },
  { id: 'wed', day: 3, key: 'wedTime', name: 'Wednesday Youth' },
  { id: 'fri', day: 5, key: 'friTime', name: 'Friday Youth' }
];
// Актуальный список общих встреч: из настройки meetings (JSON), иначе — стандартные три. all=true — вместе с удалёнными (для истории)
function services_(st, all) {
  st = st || settings_();
  let list = null;
  try { const j = JSON.parse(st.meetings || ''); if (Array.isArray(j) && j.length) list = j; } catch (e) {}
  if (!list) list = SERVICES.map(x => ({ id: x.id, name: x.name, day: x.day, time: st[x.key] || '' }));
  list = list.map(x => ({ id: String(x.id), name: String(x.name || ''), day: +x.day, time: String(x.time || ''), off: x.off ? 1 : 0 }));
  return all ? list : list.filter(x => !x.off);
}
// Разовая настройка расписания: вс 15:00, ср 18:00, пт 19:00
function updateSchedule() {
  const want = { serviceTime: '15:00', wedTime: '18:00', friTime: '19:00' };
  const rows = rows_('Настройки');
  Object.keys(want).forEach(k => { const r = rows.find(x => x.key === k); if (r) update_('Настройки', r, { value: want[k] }); else append_('Настройки', { key: k, value: want[k] }); });
  Logger.log('Расписание: ' + JSON.stringify(settings_()));
}
function settings_() {
  const o = Object.assign({}, DEFAULT_SETTINGS);
  rows_('Настройки').forEach(r => { if (r.key) o[r.key] = r.value; });
  return o;
}
function owner_() { return (Session.getEffectiveUser().getEmail() || '').toLowerCase(); }
// Адрес приложения на GitHub Pages (репозиторий teensparty, папка app)
const APP_URL = 'https://teensparty.fun/app/';
function execUrl_() { return APP_URL; }

// ---------------- установка ----------------
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet() || ss_();
  PropertiesService.getScriptProperties().setProperty('SS_ID', ss.getId());
  Object.keys(COLS).forEach(name => {
    let s = ss.getSheetByName(name);
    if (!s) s = ss.insertSheet(name);
    const heads = COLS[name].map(c => c[1]);
    s.getRange(1, 1, 1, heads.length).setValues([heads]).setFontWeight('bold').setBackground('#FFE3CC');
    s.setFrozenRows(1);
    s.getRange(1, 1, s.getMaxRows(), heads.length).setNumberFormat('@');
    if (name.charAt(0) === '_') s.hideSheet();
  });
  const def = ss.getSheetByName('Sheet1') || ss.getSheetByName('Лист1');
  if (def && ss.getSheets().length > 1) ss.deleteSheet(def);
  // настройки по умолчанию
  const have = {}; rows_('Настройки').forEach(r => have[r.key] = 1);
  Object.keys(DEFAULT_SETTINGS).forEach(k => { if (!have[k]) append_('Настройки', { key: k, value: DEFAULT_SETTINGS[k] }); });
  // владелец — админ
  const me = owner_();
  if (me && !rows_('Лидеры').some(l => l.email.toLowerCase() === me)) {
    append_('Лидеры', { id: uid_('L'), email: me, name: 'Pavel', role: 'admin', groups: '', status: 'active', code: '', invitedAt: nowIso_() });
  }
  let report = 'Готово. ';
  if (rows_('Подростки').length === 0) report += JSON.stringify(migrate());
  Logger.log(report);
  return report;
}

// ---------------- перенос старой таблицы ----------------
function migrate() {
  const old = SpreadsheetApp.openById(OLD_SHEET_ID).getSheetByName('Учёт');
  const v = old.getDataRange().getDisplayValues();
  const MONTHS = { january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12 };
  const pad = n => (n < 10 ? '0' : '') + n;
  const yearFor = m => (m >= 9 ? 2025 : 2026);
  const parse = (a, b) => {
    for (const s of [a, b]) {
      const t = String(s || '').trim();
      let m = t.match(/^(\d{1,2})\.(\d{1,2})$/);
      if (m) { const mo = +m[2]; return yearFor(mo) + '-' + pad(mo) + '-' + pad(+m[1]); }
      m = t.match(/^(\d{1,2})\/(\d{1,2})$/);
      if (m) { const mo = +m[1]; return yearFor(mo) + '-' + pad(mo) + '-' + pad(+m[2]); }
      m = t.match(/^([A-Za-z]+)\s+(\d{1,2})$/);
      if (m && MONTHS[m[1].toLowerCase()]) { const mo = MONTHS[m[1].toLowerCase()]; return yearFor(mo) + '-' + pad(mo) + '-' + pad(+m[2]); }
    }
    return null;
  };
  const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return Utilities.formatDate(d, TZ, 'yyyy-MM-dd'); };
  // столбцы с датами: D (3) .. до «Всего ✓»
  let endCol = v[0].findIndex((x, i) => i > 2 && /Всего/.test(x)); if (endCol < 0) endCol = v[0].length;
  const teenRows = v.slice(4).filter(r => String(r[1] || '').trim());
  const cols = []; let prev = null; const approx = [];
  for (let c = 3; c < endCol; c++) {
    const used = teenRows.some(r => /[✓ХX]/.test(r[c]));
    let d = parse(v[0][c], v[1][c]);
    if (!d && used && prev) { d = addDays(prev, 7); approx.push(d); }
    if (d) prev = d;
    if (d && used) cols.push([c, d]);
  }
  const teens = [], att = [];
  teenRows.forEach((r, i) => {
    const name = String(r[1]).trim().split(/\s+/);
    const id = 'T' + pad(i + 1) + uid_('').slice(-3);
    let first = null;
    cols.forEach(([c, d]) => {
      const cell = String(r[c] || '').trim();
      if (!cell) return;
      if (!first || d < first) first = d;
      if (cell === '✓') att.push({ id: uid_('A'), date: d, kind: 'service', meetId: 'sunday', teenId: id, teenName: r[1], by: 'import', method: 'import', ts: '' });
    });
    teens.push({ id, first: name[0], last: name.slice(1).join(' '), phone: String(r[2] || '').trim(), groups: '', createdAt: first || today_(), source: 'import', review: '', archived: '' });
  });
  appendMany_('Подростки', teens);
  appendMany_('Посещения', att);
  if (approx.length) append_('Настройки', { key: 'importApproxDates', value: approx.join(', ') });
  return { teens: teens.length, visits: att.length, sundays: cols.length, approxDates: approx };
}

// ---------------- веб-страницы ----------------
function doGet(e) {
  // Интерфейс живёт на GitHub Pages; старые ссылки ведут туда.
  const p = (e && e.parameter && e.parameter.p) || '';
  const url = APP_URL + (p === 'join' ? 'join/' : '');
  return HtmlService.createHtmlOutput('<base target="_top"><meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<div style="font-family:system-ui,sans-serif;background:#0E0F12;color:#F4F4F5;min-height:100vh;display:flex;align-items:center;justify-content:center;margin:-8px">'
    + '<a href="' + url + '" style="background:#FF8A3D;color:#0E0F12;font-weight:700;padding:16px 28px;border-radius:16px;text-decoration:none;font-size:17px">Открыть SOL 3:16 Teens</a></div>'
    + '<script>try{window.top.location.replace(' + JSON.stringify(url) + ')}catch(e){}</script>')
    .setTitle('SOL 3:16 Teens')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// JSON-API для приложения на GitHub Pages: POST {fn, args} -> {ok, data|error}
function doPost(e) {
  if (e && e.parameter && e.parameter.tg) { try { tgWebhook_(e); } catch (err) { Logger.log(err); } return HtmlService.createHtmlOutput('ok'); }
  const FNS = { requestCode, verifyCode, joinByCode, logout, api, joinInfo, joinKnown, joinNew, joinFriends, inviteInfo, inviteJoin, tgStart, tgPoll, teenApi };
  let r;
  try {
    const b = JSON.parse(e.postData.contents);
    const f = FNS[b.fn];
    r = f ? f.apply(null, b.args || []) : JSON.stringify({ ok: false, error: 'unknown_fn' });
  } catch (err) { r = JSON.stringify({ ok: false, error: String(err && err.message || err) }); }
  return ContentService.createTextOutput(r).setMimeType(ContentService.MimeType.JSON);
}

// ---------------- вход лидеров ----------------
function out_(fn) {
  try { return JSON.stringify({ ok: true, data: fn() }); }
  catch (e) { return JSON.stringify({ ok: false, error: String(e && e.message || e) }); }
}
function leaderByEmail_(email) {
  email = String(email || '').trim().toLowerCase();
  return rows_('Лидеры').find(l => l.email.toLowerCase() === email && l.status !== 'removed');
}
function requestCode(email) {
  return out_(() => {
    email = String(email || '').trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('bad_email');
    const l = leaderByEmail_(email);
    if (!l) throw new Error('not_invited');
    const code = String(Math.floor(100000 + Math.random() * 900000));
    lock_(() => {
      const old = rows_('_Коды').filter(r => r.email === email).map(r => r._row);
      delete_('_Коды', old);
      append_('_Коды', { email, code, expires: String(Date.now() + 15 * 60000) });
    });
    MailApp.sendEmail({ to: email, subject: 'SOL 3:16 Teens — код входа: ' + code,
      htmlBody: '<p>Твой код для входа в SOL 3:16 Teens:</p><p style="font-size:28px;font-weight:bold;letter-spacing:4px">' + code + '</p><p>Код действует 15 минут.</p>' });
    return true;
  });
}
function newSession_(email) {
  const token = Utilities.getUuid() + Utilities.getUuid().slice(0, 8);
  append_('_Сессии', { token, email, expires: String(Date.now() + 90 * 86400000) });
  return token;
}
function verifyCode(email, code) {
  return out_(() => lock_(() => {
    email = String(email || '').trim().toLowerCase();
    const r = rows_('_Коды').find(x => x.email === email && x.code === String(code).trim());
    if (!r || +r.expires < Date.now()) throw new Error('bad_code');
    delete_('_Коды', [r._row]);
    const l = leaderByEmail_(email);
    if (!l) throw new Error('not_invited');
    if (l.status !== 'active') update_('Лидеры', l, { status: 'active' });
    return { token: newSession_(email) };
  }));
}
function joinByCode(code, name, email) {
  return out_(() => lock_(() => {
    code = String(code || '').trim().toUpperCase();
    email = String(email || '').trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('bad_email');
    if (!String(name || '').trim()) throw new Error('need_name');
    const l = rows_('Лидеры').find(x => x.code.toUpperCase() === code && x.status === 'pending');
    if (!l) throw new Error('bad_invite');
    const age = Date.now() - new Date(l.invitedAt.replace(' ', 'T')).getTime();
    if (age > 7 * 86400000) throw new Error('invite_expired');
    if (leaderByEmail_(email)) throw new Error('email_taken');
    update_('Лидеры', l, { email, name: String(name).trim(), status: 'active', code: '' });
    return { token: newSession_(email) };
  }));
}
function auth_(token) {
  if (!token) throw new Error('auth');
  const s = rows_('_Сессии').find(x => x.token === token);
  if (!s || +s.expires < Date.now()) throw new Error('auth');
  const l = leaderByEmail_(s.email);
  if (!l || l.status !== 'active') throw new Error('auth');
  return { id: l.id, email: l.email, name: l.name, role: l.role, groups: l.groups ? l.groups.split(',').filter(Boolean) : [] };
}
function logout(token) {
  return out_(() => lock_(() => { const s = rows_('_Сессии').filter(x => x.token === token).map(x => x._row); delete_('_Сессии', s); return true; }));
}

// ---------------- API для админки ----------------
const CAN = {
  mark: ['admin', 'leader', 'mod'], attNow: ['admin', 'leader', 'mod', 'viewer'], addTeen: ['admin', 'leader', 'mod'], updateTeen: ['admin', 'leader', 'mod'], reviewTeen: ['admin', 'leader', 'mod'],
  addEvent: ['admin', 'leader'], editEvent: ['admin'], delEvent: ['admin'], saveGroup: ['admin'], saveSettings: ['admin'],
  invite: ['admin'], updateLeader: ['admin'], removeLeader: ['admin'],
  groupReq: ['admin'], confirmTask: ['admin', 'leader'], addTask: ['admin', 'leader'], taskDone: ['admin', 'leader'], remind: ['admin', 'leader'], award: ['admin', 'leader'], igReview: ['admin', 'leader']
};
function api(token, action, payload) {
  return out_(() => {
    const me = auth_(token);
    if (action !== 'bootstrap' && (!CAN[action] || CAN[action].indexOf(me.role) < 0)) throw new Error('forbidden');
    const fn = A_[action]; if (!fn) throw new Error('unknown_action');
    if (action === 'bootstrap') return fn(asMe_(me, payload || {}), payload || {});
    return lock_(() => fn(me, payload || {}));
  });
}

// Админ смотрит админку глазами другого: as = id лидера или asRole = роль без человека. Только чтение.
function asMe_(me, p) {
  if (me.role !== 'admin' || (!p.as && !p.asRole)) return me;
  if (p.as) {
    const l = rows_('Лидеры').find(x => x.id === p.as && x.status !== 'removed');
    if (!l) throw new Error('not_found');
    return { id: l.id, email: l.email, name: l.name, role: l.role, groups: l.groups ? l.groups.split(',').filter(Boolean) : [], preview: true };
  }
  if (['leader', 'mod', 'viewer'].indexOf(p.asRole) < 0) throw new Error('bad_role');
  return { id: '', email: '', name: '', role: p.asRole, groups: [], preview: true };
}
let LEAD_NAMES_ = null;
function markerName_(a) {
  if (a.method === 'qr') return 'QR';
  if (a.method === 'app') return 'сам в приложении';
  if (a.method === 'import' || a.method === 'teensparty') return 'импорт';
  if (!LEAD_NAMES_) { LEAD_NAMES_ = {}; rows_('Лидеры').forEach(l => LEAD_NAMES_[String(l.email).toLowerCase()] = l.name || l.email); }
  return LEAD_NAMES_[String(a.by || '').toLowerCase()] || String(a.by || '');
}
const PARENT_KEYS = ['pFirst', 'pLast', 'pPhone', 'pAddr'];
const CONTACT_KEYS = ['phone', 'birth', 'addr', 'ig', 'igStatus', 'tgChat', 'age', 'ageAt'];

const A_ = {
  bootstrap(me) {
    const teens = rows_('Подростки').filter(t => t.archived !== '1');
    const myGroups = me.groups;
    const visTeens = teens.map(t => {
      const o = { id: t.id, first: t.first, last: t.last, groups: t.groups ? t.groups.split(',').filter(Boolean) : [], createdAt: t.createdAt, source: t.source, review: t.review === '1', invitedBy: t.invitedBy };
      const own = me.role === 'admin' || (me.role === 'leader' && o.groups.some(g => myGroups.indexOf(g) >= 0));
      if (me.role !== 'viewer') CONTACT_KEYS.forEach(k => o[k] = t[k]);
      if (own) PARENT_KEYS.forEach(k => o[k] = t[k]);
      o.canEditParent = own;
      return o;
    });
    if (me.role !== 'viewer') { const P = allPoints_(); visTeens.forEach(o => o.pts = P[o.id] || 0); }
    const att = rows_('Посещения').map(a => [a.date, a.kind, a.meetId, a.teenId]);
    const st = settings_();
    const res = {
      me, today: today_(), execUrl: execUrl_(), settings: st,
      teens: visTeens, att,
      groups: rows_('Группы').filter(g => g.active !== '0').map(g => ({ id: g.id, name: g.name, leader: g.leader, day: +g.day, time: g.time, addr: g.addr || '', contact: g.contact || '' })),
      events: rows_('События').map(e => ({ id: e.id, name: e.name, date: e.date, reg: +e.reg || 0 })),
      tasks: rows_('Задания').map(t => ({ id: t.id, title: t.title, kind: t.kind, due: t.due, pts: +t.pts || 0, aud: t.aud ? t.aud.split(',').filter(Boolean) : [], createdAt: t.createdAt })),
      done: rows_('Выполнения').filter(counted_).map(d => [d.taskId, d.teenId, d.date]),
      reminders: rows_('Напоминания').map(d => [d.taskId, d.teenId]),
      awards: rows_('Ачивки').map(a => ({ id: a.id, badge: a.badge, teenId: a.teenId, date: a.date }))
    };
    if (me.role === 'admin' || me.role === 'leader') {
      const allDone = rows_('Выполнения'), w = weekInfo_(today_());
      res.pending = allDone.filter(d => d.status === 'pending').map(d => { const k = vtask_(d.taskId) || {}; return { taskId: d.taskId, teenId: d.teenId, date: d.date, title: k.title || '', pts: k.pts || 0 }; });
      const okNow = {}; allDone.filter(counted_).forEach(d => { if (String(d.taskId).indexOf('W' + w.mon + ':') === 0) okNow[d.teenId] = 1; });
      res.plan = [0, 1, 2, 3].map(i => { const x = weekInfo_(dstr_(dnum_(w.mon) + 7 * i)); return { n: x.n, mon: x.mon, ref: x.ref, title: x.title, verse: x.verse }; });
      res.planDone = Object.keys(okNow).length;
    }
    if (me.role === 'admin') res.greqs = greqs_().filter(x => x.status === 'pending').map(x => ({ id: x.id, teenId: x.teenId, groupId: x.groupId, date: x.date }));
    if (me.role === 'admin') res.ssUrl = ss_().getUrl();
    if (me.role === 'admin') res.leaders = rows_('Лидеры').filter(l => l.status !== 'removed').map(l => ({ id: l.id, email: l.email, name: l.name, role: l.role, groups: l.groups ? l.groups.split(',').filter(Boolean) : [], status: l.status, code: l.code, me: l.email.toLowerCase() === me.email.toLowerCase() }));
    return res;
  },

  mark(me, p) {
    const all = rows_('Посещения');
    const hit = all.filter(a => a.date === p.date && a.kind === p.kind && a.meetId === p.meetId && a.teenId === p.teenId);
    if (p.on && hit.length) return { already: true, by: markerName_(hit[0]), mine: hit[0].by === me.email };
    if (p.on) {
      const t = rows_('Подростки').find(x => x.id === p.teenId);
      append_('Посещения', { id: uid_('A'), date: p.date, kind: p.kind, meetId: p.meetId, teenId: p.teenId, teenName: t ? (t.first + ' ' + t.last).trim() : '', by: me.email, method: 'leader', ts: nowIso_() });
      return { on: true };
    }
    if (hit.length) delete_('Посещения', hit.map(h => h._row));
    return { on: false };
  },
  // кто уже отмечен на встрече — для живой синхронизации между лидерами
  attNow(me, p) {
    return rows_('Посещения').filter(a => a.date === p.date && a.kind === p.kind && a.meetId === p.meetId)
      .map(a => [a.teenId, markerName_(a), String(a.ts || '').slice(11, 16), a.by === me.email ? 1 : 0]);
  },

  addTeen(me, p) {
    const t = p.teen || {};
    if (!String(t.first || '').trim()) throw new Error('need_name');
    if (!p.force) {
      const dup = findDup_(t);
      if (dup) return { dup: { id: dup.id, name: (dup.first + ' ' + dup.last).trim() } };
    }
    const o = { id: uid_('T'), groups: (t.groups || []).join(','), createdAt: today_(), source: 'leader', review: '', archived: '' };
    ['first', 'last', 'phone', 'birth', 'addr', 'pFirst', 'pLast', 'pPhone', 'pAddr'].forEach(k => o[k] = String(t[k] || '').trim());
    if (me.role === 'mod') PARENT_KEYS.forEach(k => o[k] = '');
    append_('Подростки', o);
    if (p.mark) A_.mark(me, Object.assign({}, p.mark, { teenId: o.id, on: true }));
    return { id: o.id };
  },

  updateTeen(me, p) {
    const t = rows_('Подростки').find(x => x.id === p.id);
    if (!t) throw new Error('not_found');
    const groups = t.groups ? t.groups.split(',') : [];
    const own = me.role === 'admin' || (me.role === 'leader' && groups.some(g => me.groups.indexOf(g) >= 0));
    if (me.role === 'leader' && !own && t.source !== 'qr') throw new Error('forbidden');
    const patch = {};
    ['first', 'last', 'phone', 'birth', 'addr'].forEach(k => { if (p.fields && k in p.fields) patch[k] = String(p.fields[k] || '').trim(); });
    if (own || me.role === 'admin') PARENT_KEYS.forEach(k => { if (p.fields && k in p.fields) patch[k] = String(p.fields[k] || '').trim(); });
    if (p.groups && me.role !== 'mod') patch.groups = p.groups.join(',');
    if (p.archived != null && me.role === 'admin') patch.archived = p.archived ? '1' : '';
    patch.review = '';
    update_('Подростки', t, patch);
    return true;
  },

  reviewTeen(me, p) {
    const t = rows_('Подростки').find(x => x.id === p.id); if (t) update_('Подростки', t, { review: '' }); return true;
  },

  groupReq(me, p) {
    const r = greqs_().find(x => x.id === p.id && x.status === 'pending'); if (!r) return { gone: true };
    if (p.ok) { const t = rows_('Подростки').find(x => x.id === r.teenId);
      if (t) { const gs = t.groups ? t.groups.split(',').filter(Boolean) : []; if (gs.indexOf(r.groupId) < 0) gs.push(r.groupId); update_('Подростки', t, { groups: gs.join(',') }); } }
    update_('Заявки', r, { status: p.ok ? 'ok' : 'no', by: me.email });
    return { ok: !!p.ok };
  },
  confirmTask(me, p) {
    const r = rows_('Выполнения').find(d => d.taskId === p.taskId && d.teenId === p.teenId && d.status === 'pending');
    if (!r) return { gone: true };
    update_('Выполнения', r, { status: p.ok ? 'ok' : 'no', by: me.email });
    return { ok: !!p.ok };
  },
  addEvent(me, p) {
    const name = String(p.name || '').trim(); if (!name) throw new Error('need_name');
    const e = { id: uid_('E'), name, date: p.date || today_() };
    append_('События', e); return e;
  },
  editEvent(me, p) {
    const e = rows_('События').find(x => x.id === p.id); if (!e) throw new Error('not_found');
    const name = String(p.name || '').trim(); if (!name) throw new Error('need_name');
    const date = /^\d{4}-\d{2}-\d{2}$/.test(p.date || '') ? p.date : e.date;
    update_('События', e, { name, date });
    if (date !== e.date) rows_('Посещения').filter(a => a.kind === 'event' && a.meetId === e.id).forEach(a => update_('Посещения', a, { date }));
    return true;
  },
  delEvent(me, p) {
    const e = rows_('События').find(x => x.id === p.id); if (!e) throw new Error('not_found');
    delete_('Посещения', rows_('Посещения').filter(a => a.kind === 'event' && a.meetId === e.id).map(a => a._row));
    delete_('События', [e._row]);
    return true;
  },

  saveGroup(me, p) {
    const name = String(p.name || '').trim(); if (!name) throw new Error('need_name');
    if (p.id) {
      const g = rows_('Группы').find(x => x.id === p.id); if (!g) throw new Error('not_found');
      update_('Группы', g, { name, leader: p.leader || '', day: String(p.day), time: p.time || '19:00', active: p.active === false ? '0' : '1', addr: 'addr' in p ? String(p.addr || '').trim() : g.addr, contact: 'contact' in p ? String(p.contact || '').trim() : g.contact });
      return { id: g.id };
    }
    const g = { id: uid_('G'), name, leader: p.leader || '', day: String(p.day), time: p.time || '19:00', active: '1', addr: String(p.addr || '').trim(), contact: String(p.contact || '').trim() };
    append_('Группы', g); return { id: g.id };
  },

  saveSettings(me, p) {
    const rows = rows_('Настройки');
    Object.keys(p).forEach(k => {
      const r = rows.find(x => x.key === k);
      if (r) update_('Настройки', r, { value: String(p[k]) }); else append_('Настройки', { key: k, value: String(p[k]) });
    });
    return true;
  },

  invite(me, p) {
    const role = ['admin', 'leader', 'mod', 'viewer'].indexOf(p.role) >= 0 ? p.role : 'leader';
    const name = String(p.name || '').trim(); if (!name) throw new Error('need_name');
    const groups = role === 'leader' ? (p.groups || []).join(',') : '';
    if (p.mode === 'email') {
      const email = String(p.email || '').trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('bad_email');
      if (leaderByEmail_(email)) throw new Error('email_taken');
      append_('Лидеры', { id: uid_('L'), email, name, role, groups, status: 'pending', code: '', invitedAt: nowIso_() });
      const url = execUrl_();
      MailApp.sendEmail({ to: email, subject: 'Приглашение в SOL 3:16 Teens',
        htmlBody: '<p>' + name + ', тебя пригласили в приложение SOL 3:16 Teens.</p><p><a href="' + url + '">Открыть SOL 3:16 Teens</a> и войти по этой почте — придёт код.</p>' });
      return { ok: true };
    }
    let code; const used = rows_('Лидеры').map(l => l.code);
    do { code = 'SOL-' + Math.floor(1000 + Math.random() * 9000); } while (used.indexOf(code) >= 0);
    append_('Лидеры', { id: uid_('L'), email: '', name, role, groups, status: 'pending', code, invitedAt: nowIso_() });
    return { code };
  },

  updateLeader(me, p) {
    const l = rows_('Лидеры').find(x => x.id === p.id); if (!l) throw new Error('not_found');
    if (l.email.toLowerCase() === me.email.toLowerCase()) throw new Error('self');
    update_('Лидеры', l, { role: p.role, groups: p.role === 'leader' ? (p.groups || []).join(',') : '' });
    return true;
  },

  removeLeader(me, p) {
    const l = rows_('Лидеры').find(x => x.id === p.id); if (!l) throw new Error('not_found');
    if (l.email.toLowerCase() === me.email.toLowerCase()) throw new Error('self');
    update_('Лидеры', l, { status: 'removed', code: '' });
    const ss = rows_('_Сессии').filter(x => x.email.toLowerCase() === l.email.toLowerCase()).map(x => x._row);
    delete_('_Сессии', ss);
    return true;
  },

  addTask(me, p) {
    const title = String(p.title || '').trim(); if (!title) throw new Error('need_title');
    const t = { id: uid_('K'), title, kind: p.kind || 'read', due: p.due || today_(), pts: String(p.pts || 20), aud: (p.aud || []).join(','), createdBy: me.email, createdAt: nowIso_() };
    append_('Задания', t); return { id: t.id };
  },

  taskDone(me, p) {
    const hit = rows_('Выполнения').filter(d => d.taskId === p.taskId && d.teenId === p.teenId);
    if (p.on && !hit.length) append_('Выполнения', { taskId: p.taskId, teenId: p.teenId, date: today_(), by: me.email });
    if (!p.on && hit.length) delete_('Выполнения', hit.map(h => h._row));
    return true;
  },

  remind(me, p) {
    appendMany_('Напоминания', (p.teenIds || []).map(id => ({ taskId: p.taskId, teenId: id, date: nowIso_(), by: me.email })));
    return true;
  },

  award(me, p) {
    if (!p.badge || !(p.teenIds || []).length) throw new Error('bad_award');
    appendMany_('Ачивки', p.teenIds.map(id => ({ id: uid_('W'), badge: p.badge, teenId: id, date: today_(), by: me.email })));
    return true;
  },

  igReview(me, p) {
    const t = rows_('Подростки').find(x => x.id === p.id); if (!t) throw new Error('not_found');
    update_('Подростки', t, { igStatus: p.ok ? 'ok' : '' });
    return true;
  }
};

function findDup_(t, teens) {
  teens = teens || rows_('Подростки');
  const ph = digits_(t.phone);
  const full = (String(t.first || '').trim() + ' ' + String(t.last || '').trim()).toLowerCase().replace(/\s+/g, ' ');
  return teens.find(x => (ph && ph.length >= 7 && digits_(x.phone) === ph) || ((x.first + ' ' + x.last).toLowerCase().replace(/\s+/g, ' ').trim() === full.trim() && full.trim().indexOf(' ') > 0));
}

// ---------------- QR: публичная страница ----------------
function currentMeeting_() {
  const st = settings_();
  const now = new Date();
  const day = +Utilities.formatDate(now, TZ, 'u') % 7; // 1=пн..7=вс → 0=вс
  const today = today_();
  const mins = +Utilities.formatDate(now, TZ, 'H') * 60 + +Utilities.formatDate(now, TZ, 'm');
  const inWin = hhmm => { const p = String(hhmm || '12:00').split(':'); const t = (+p[0]) * 60 + (+p[1] || 0); return mins >= t - (+st.before) && mins <= t + (+st.after); };
  const ev = rows_('События').find(e => e.date === today);
  if (ev) return { kind: 'event', meetId: ev.id, label: ev.name, date: today };
  const SV = services_(st);
  const sv = SV.find(x => x.day === day && inWin(x.time));
  if (sv) return { kind: 'service', meetId: sv.id, label: sv.name, date: today };
  const g = rows_('Группы').find(x => x.active !== '0' && +x.day === day && inWin(x.time));
  if (g) return { kind: 'group', meetId: g.id, label: g.name, date: today };
  if (st.qrAlways === '1') { const t = SV.find(x => x.day === day) || SV[0]; if (!t) return null; return { kind: 'service', meetId: t.id, label: t.name, date: today, test: true }; }
  return null;
}
function joinInfo() { return out_(() => ({ meet: currentMeeting_() })); }

function checkIn_(teenId, teenName, meet, method) {
  const all = rows_('Посещения');
  if (!all.some(a => a.date === meet.date && a.kind === meet.kind && a.meetId === meet.meetId && a.teenId === teenId)) {
    append_('Посещения', { id: uid_('A'), date: meet.date, kind: meet.kind, meetId: meet.meetId, teenId, teenName, by: 'self', method, ts: nowIso_() });
    return true;
  }
  return false;
}
function joinKnown(phone) {
  return out_(() => lock_(() => {
    const meet = currentMeeting_(); if (!meet) throw new Error('no_meeting');
    const ph = digits_(phone); if (ph.length < 7) throw new Error('bad_phone');
    const t = rows_('Подростки').find(x => digits_(x.phone) === ph && x.archived !== '1');
    if (!t) return { found: false };
    const fresh = checkIn_(t.id, (t.first + ' ' + t.last).trim(), meet, 'qr');
    return { found: true, first: t.first, already: !fresh, meet };
  }));
}
function joinNew(form, confirmDupId) {
  return out_(() => lock_(() => {
    const meet = currentMeeting_(); if (!meet) throw new Error('no_meeting');
    const teens = rows_('Подростки');
    if (confirmDupId) {
      const t = teens.find(x => x.id === confirmDupId); if (!t) throw new Error('not_found');
      checkIn_(t.id, (t.first + ' ' + t.last).trim(), meet, 'qr');
      return { done: true, first: t.first, isNew: false, meet };
    }
    const f = form || {};
    if (!String(f.first || '').trim() || !String(f.last || '').trim() || digits_(f.phone).length < 10) throw new Error('need_fields');
    if (!f.forceNew) {
      const dup = findDup_(f, teens);
      if (dup) return { dup: { id: dup.id, name: (dup.first + ' ' + String(dup.last || '').charAt(0) + '.').trim() } };
    }
    const o = { id: uid_('T'), groups: '', createdAt: today_(), source: 'qr', review: '1', archived: '', invitedBy: f.invitedBy || '' };
    ['first', 'last', 'phone', 'birth', 'pFirst', 'pLast', 'pPhone'].forEach(k => o[k] = String(f[k] || '').trim());
    // приглашение засчитывается только за совсем нового человека
    const invs = invites_(), ph = digits_(o.phone), mineInv = invs.find(x => x.status === 'wait' && digits_(x.phone) === ph && x.by !== o.id);
    if (knownPerson_(o, teens)) o.invitedBy = '';
    else if (mineInv) o.invitedBy = mineInv.by;
    if (o.invitedBy && !teens.some(x => x.id === o.invitedBy)) o.invitedBy = '';
    if (mineInv) update_('Приглашения', mineInv, { status: o.invitedBy === mineInv.by ? 'came' : 'known', teenId: o.id });
    append_('Подростки', o);
    checkIn_(o.id, (o.first + ' ' + o.last).trim(), meet, 'qr');
    return { done: true, first: o.first, isNew: true, meet };
  }));
}
function joinFriends(q) {
  return out_(() => {
    q = String(q || '').trim().toLowerCase(); if (q.length < 2) return [];
    return rows_('Подростки').filter(t => t.archived !== '1' && (t.first + ' ' + t.last).toLowerCase().indexOf(q) >= 0).slice(0, 5)
      .map(t => ({ id: t.id, name: t.first + ' ' + String(t.last || '').charAt(0) + '.' }));
  });
}


// ---------------- импорт TEENS PARTY (31.10.2026) ----------------
// Запуск из редактора: importTeensPartyDry() — только показать план; importTeensParty() — записать.
const PARTY_SHEET_ID = '150N4AgcxRO5kA5C8CFp8h01koFmrYqUUGEMxiie7pZo';
const PARTY_DATE = '2026-10-31';
function importTeensPartyDry() { return importTeensParty(true); }
function importTeensParty(dry) {
  setup(); // добавит новые колонки (возраст, регистраций), ничего не стирает
  const cap = w => String(w || '').trim().split(/\s+/).filter(Boolean).map(x => x.charAt(0).toUpperCase() + x.slice(1)).join(' ');
  const norm = w => String(w || '').toLowerCase().replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
  const v = SpreadsheetApp.openById(PARTY_SHEET_ID).getSheetByName('Registrations').getDataRange().getDisplayValues();
  const H = v[0].map(h => String(h).trim().toLowerCase());
  const col = n => H.indexOf(n);
  const regs = [], skipped = [];
  v.slice(1).forEach(r => {
    const name = cap(r[col('name')]); const age = +r[col('age')] || 0;
    if (!name) return;
    if (age < 10 || age > 19 || name.split(' ')[0].length < 2) { skipped.push(name + ' (' + age + ')'); return; }
    regs.push({ name, phone: digits_(r[col('phone')]), age, parent: cap(r[col('parent name')]), pPhone: digits_(r[col('parent phone')]), came: !!String(r[col('checked in')] || '').trim(), ts: r[col('timestamp')] });
  });
  // склеиваем повторные регистрации одного человека (по имени или телефону)
  const uniq = [];
  regs.forEach(x => {
    const d = uniq.find(u => norm(u.name) === norm(x.name) || (x.phone && u.phone === x.phone && norm(u.name).split(' ')[0] === norm(x.name).split(' ')[0]));
    if (d) { d.came = d.came || x.came; ['phone', 'parent', 'pPhone'].forEach(k => { if (x[k]) d[k] = x[k]; }); d.age = x.age; }
    else uniq.push(Object.assign({}, x));
  });
  const teens = rows_('Подростки');
  const pool = teens.slice();
  const plan = { matched: [], fuzzy: [], created: [], came: 0, registered: uniq.length, skipped, unsure: [] };
  const newRows = [], att = [];
  let ev = rows_('События').find(e => e.date === PARTY_DATE && /teens\s*party/i.test(e.name));
  const evId = ev ? ev.id : uid_('E');
  const haveAtt = {}; rows_('Посещения').forEach(a => { if (a.kind === 'event' && a.meetId === evId) haveAtt[a.teenId] = 1; });
  uniq.forEach(x => {
    const parts = x.name.split(' '), pp = x.parent.split(' ');
    const m = matchTeen_(parts[0], parts.slice(1).join(' '), x.phone, pool);
    let t = m.t;
    if (m.unsure) plan.unsure.push(x.name + ' ~ ' + m.unsure);
    if (t) {
      const patch = {};
      if (!t.phone && x.phone) patch.phone = x.phone;
      if (!t.pFirst && x.parent) { patch.pFirst = pp[0]; patch.pLast = pp.slice(1).join(' '); }
      if (!t.pPhone && x.pPhone && x.pPhone !== x.phone) patch.pPhone = x.pPhone;
      if (!t.birth) { patch.age = String(x.age); patch.ageAt = PARTY_DATE; }
      (m.how === 'fuzzy' ? plan.fuzzy : plan.matched).push(x.name + ' → ' + t.first + ' ' + t.last + (Object.keys(patch).length ? ' (+' + Object.keys(patch).join(',') + ')' : ''));
      if (!dry && Object.keys(patch).length && t._row) Object.assign(t, update_('Подростки', t, patch));
      else Object.assign(t, patch);
    } else {
      t = { id: uid_('T'), first: parts[0], last: parts.slice(1).join(' '), phone: x.phone, pFirst: pp[0] || '', pLast: pp.slice(1).join(' '), pPhone: x.pPhone !== x.phone ? x.pPhone : '', age: String(x.age), ageAt: PARTY_DATE,
        groups: '', createdAt: PARTY_DATE, source: 'teensparty', review: '', archived: '' };
      newRows.push(t); pool.push(t);
      plan.created.push(x.name + ', ' + x.age + (x.came ? ' ✓' : ''));
    }
    if (x.came) { plan.came++; if (!haveAtt[t.id]) att.push({ id: uid_('A'), date: PARTY_DATE, kind: 'event', meetId: evId, teenId: t.id, teenName: (t.first + ' ' + t.last).trim(), by: 'import', method: 'teensparty', ts: '' }); }
  });
  if (!dry) {
    if (!ev) append_('События', { id: evId, name: 'TEENS PARTY', date: PARTY_DATE, reg: plan.registered });
    else update_('События', ev, { reg: plan.registered });
    appendMany_('Подростки', newRows);
    appendMany_('Посещения', att);
  }
  const rep = (dry ? 'ПЛАН (ничего не записано)\n' : 'ИМПОРТ ВЫПОЛНЕН\n') +
    'Регистраций (уникальных подростков): ' + plan.registered + '\nПришли: ' + plan.came +
    '\nУже были в базе (точно): ' + plan.matched.length + '\n  ' + plan.matched.join('\n  ') +
    '\nУже были в базе (по похожему имени — проверь): ' + plan.fuzzy.length + '\n  ' + plan.fuzzy.join('\n  ') +
    '\nНе уверен, создан новый: ' + plan.unsure.length + '\n  ' + plan.unsure.join('\n  ') +
    '\nНовые в базе: ' + plan.created.length + '\n  ' + plan.created.join('\n  ') +
    '\nПропущены (взрослые/тестовые): ' + skipped.join(', ');
  Logger.log(rep);
  return rep;
}

// --- сопоставление имён: транслит, уменьшительные, опечатки ---
const NICK_ = [['aleksei','alexei','aleksey','alexey','alex','alek','lesha','lesa','alesha','sasha','sasa','aleksandr','alexander','aleksandra','alexandra','sanya','oleksii','oleksandr'],
  ['mikhail','mihail','misha','misa','michael','mykhailo'],['anna','ana','anya','ania','anka','annie','hanna'],['sofiya','sofia','sofa','sonya','sonia','sophia'],
  ['ivan','vanya','vania','ivanko'],['dmitrii','dmitry','dima','dmytro'],['maksim','maxim','maksym','max','maks'],['ekaterina','katya','katia','kate','katerina','kateryna'],
  ['anastasiia','anastasia','nastya','nastia'],['elena','lena','olena','helen'],['timofei','timofey','tima','tymofii','tim'],['daniil','daniel','danya','dania','danylo','dan'],
  ['mariia','maria','masha','mary'],['elizaveta','liza'],['nikolai','kolya'],['pavel','pasha','pavlo','paul'],['vasilina','vasylyna'],['iliia','ilia','ilya','illia'],['artem','artemii','tema'],
  ['yuliia','yulia','julia'],['olga','olia','olya'],['viktoriia','viktoria','vika'],['khrystyna','kristina','christina'],['mark','marko'],['kamila','camila'],['nelli','nelly']];
function lat_(w) {
  const T = { а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'i',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'i',ь:'',э:'e',ю:'iu',я:'ia',і:'i',ї:'i',є:'e',ґ:'g' };
  return String(w || '').toLowerCase().split('').map(c => T[c] != null ? T[c] : c).join('')
    .replace(/kh/g, 'h').replace(/[yj]/g, 'i').replace(/x/g, 'ks').replace(/w/g, 'v').replace(/[^a-z]/g, '').replace(/(.)\1+/g, '$1');
}
function lev_(a, b) { const m = a.length, n = b.length; if (!m) return n; if (!n) return m; let p = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) { const c = [i]; for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; } return p[n]; }
function nickOf_(f) { const l = lat_(f); for (let i = 0; i < NICK_.length; i++) if (NICK_[i].map(lat_).indexOf(l) >= 0) return i; return -1; }
function sameFirst_(a, b) { const x = lat_(a), y = lat_(b); if (!x || !y) return false; if (x === y) return true; const n1 = nickOf_(a), n2 = nickOf_(b); if (n1 >= 0 && n1 === n2) return true;
  return lev_(x, y) <= 1 || (x.length >= 3 && y.length >= 3 && (x.indexOf(y) === 0 || y.indexOf(x) === 0)); }
function sameLast_(a, b) { const x = lat_(a), y = lat_(b); if (!x || !y) return false; const strip = z => z.replace(/(a|aia|ova|eva|ina|aia|skaia|ska)$/, ''); return x === y || lev_(x, y) <= 2 && Math.min(x.length, y.length) >= 4 || (strip(x).length >= 4 && strip(x) === strip(y)); }
function matchTeen_(first, last, phone, pool) {
  const ok = t => sameFirst_(first, t.first) && sameLast_(last, t.last);
  const okRev = t => sameFirst_(last, t.first) && sameLast_(first, t.last);
  const exact = t => lat_(first) === lat_(t.first) && lat_(last) === lat_(t.last);
  // 1) телефон + совпадает имя (у братьев/сестёр бывает один телефон)
  const byPh = phone ? pool.filter(t => digits_(t.phone) === phone) : [];
  let c = byPh.filter(t => sameFirst_(first, t.first) || okRev(t));
  if (c.length === 1) return { t: c[0], how: 'phone' };
  // 2) точное имя (с транслитом)
  c = pool.filter(exact); if (c.length === 1) return { t: c[0], how: 'name' };
  if (!last) return byPh.length === 1 && !byPh[0].last ? { t: byPh[0], how: 'phone' } : { t: null, unsure: byPh.length ? byPh.map(t => t.first + ' ' + t.last).join(', ') + ' (тот же телефон)' : '' };
  // 3) похожее имя: уменьшительные, транслит, опечатки
  c = pool.filter(t => t.last && (ok(t) || okRev(t)));
  if (c.length === 1) return { t: c[0], how: 'fuzzy' };
  if (c.length > 1) return { t: null, unsure: c.map(t => t.first + ' ' + t.last).join(' / ') };
  const sameLastOnly = pool.filter(t => t.last && sameLast_(last, t.last));
  return { t: null, unsure: sameLastOnly.length && sameLastOnly.length <= 3 ? sameLastOnly.map(t => t.first + ' ' + t.last).join(', ') + ' (та же фамилия)' : '' };
}


// ---------------- приглашения друзей ----------------
function ensure_(name) {
  const ss = ss_(); let sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); const heads = COLS[name].map(c => c[1]); sh.getRange(1, 1, 1, heads.length).setValues([heads]).setFontWeight('bold').setBackground('#FFE3CC'); sh.setFrozenRows(1); sh.getRange(1, 1, sh.getMaxRows(), heads.length).setNumberFormat('@'); }
  return sh;
}
function invites_() { return ss_().getSheetByName('Приглашения') ? rows_('Приглашения') : []; }
// человек уже есть в базе: совпал телефон (его или родителя) или похожие имя и фамилия
function knownPerson_(f, teens) {
  const ph = digits_(f.phone), pp = digits_(f.pPhone);
  const hit = n => n && n.length >= 10 && teens.some(t => digits_(t.phone) === n || digits_(t.pPhone) === n);
  if (hit(ph) || hit(pp)) return true;
  const m = matchTeen_(String(f.first || '').trim(), String(f.last || '').trim(), ph, teens.filter(t => t.archived !== '1' || true));
  return !!m.t;
}
const DAYS_RU_ = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
function t12_(hhmm) { const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || '')); if (!m) return String(hhmm || ''); const h = +m[1]; return ((h % 12) || 12) + ':' + m[2] + ' ' + (h < 12 ? 'AM' : 'PM'); }
function greqs_() { return ss_().getSheetByName('Заявки') ? rows_('Заявки') : []; }
function nextMeet_() { const sv = services_()[0]; return sv ? DAYS_RU_[sv.day] + ', ' + t12_(sv.time) : ''; }
// разовая настройка: новые колонки и адрес группы Тимы
function patchGroups1() {
  setup(); ensure_('Заявки'); ensure_('Приглашения');
  const g = rows_('Группы').find(x => /^tima/i.test(x.name)); if (g) update_('Группы', g, { addr: g.addr || '7457 Walnut Road', contact: g.contact || '(916) 559-5882' });
  const g2 = rows_('Группы').find(x => /^pasha/i.test(x.name)); if (g2 && !g2.contact) update_('Группы', g2, { contact: 't.me/pabeloglazov 2797592990' });
  Logger.log('Группы: ' + JSON.stringify(rows_('Группы').map(x => [x.name, x.addr, x.contact])));
}
function inviteInfo(by) {
  return out_(() => { const t = rows_('Подростки').find(x => x.id === by && x.archived !== '1'); if (!t) throw new Error('bad_invite'); return { first: t.first, when: nextMeet_() }; });
}
function inviteJoin(by, form) {
  return out_(() => lock_(() => {
    ensure_('Приглашения');
    const teens = rows_('Подростки'); const inviter = teens.find(x => x.id === by && x.archived !== '1'); if (!inviter) throw new Error('bad_invite');
    const f = form || {}; const cl = v => String(v || '').replace(/\s+/g, ' ').trim().slice(0, 60);
    const first = cl(f.first), last = cl(f.last), ph = digits_(f.phone);
    if (!first || !last || ph.length < 10) throw new Error('need_fields');
    const inv = rows_('Приглашения');
    if (inv.filter(x => x.by === by && x.date === today_()).length >= 15) throw new Error('too_many');
    const mine = inv.find(x => x.by === by && digits_(x.phone) === ph);
    if (mine) return mine.status === 'known' ? { known: true, first } : { ok: true, first, when: nextMeet_(), inviter: inviter.first };
    const known = knownPerson_({ first, last, phone: ph }, teens) || inv.some(x => digits_(x.phone) === ph && x.status !== 'known');
    append_('Приглашения', { id: uid_('I'), by, first, last, phone: ph, date: today_(), status: known ? 'known' : 'wait', teenId: '' });
    return known ? { known: true, first } : { ok: true, first, when: nextMeet_(), inviter: inviter.first };
  }));
}
