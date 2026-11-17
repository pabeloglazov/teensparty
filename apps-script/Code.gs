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
    ['ig','Instagram'],['tgId','Telegram ID'],['archived','Скрыт'],['igStatus','Instagram: статус'],['tgChat','В Telegram-чате'],['age','Возраст (со слов)'],['ageAt','Возраст указан (дата)'],['isLeader','Лидер'],['del','Удалён']],
  'Посещения': [['id','ID'],['date','Дата'],['kind','Тип'],['meetId','Встреча (ID)'],['teenId','Подросток (ID)'],['teenName','Подросток'],['by','Отметил'],['method','Способ'],['ts','Время отметки']],
  'Группы': [['id','ID'],['name','Название'],['leader','Лидер'],['day','День (0=вс)'],['time','Время'],['active','Активна'],['addr','Адрес'],['contact','Контакт лидера']],
  'События': [['id','ID'],['name','Название'],['date','Дата'],['reg','Регистраций'],['time','Время'],['place','Место'],['desc','Описание'],['descOn','Показывать описание'],['thumb','Миниатюра'],['img','Фото'],['paid','Платно'],['price','Цена'],['incl','Что входит'],['cap','Мест'],['open','Регистрация открыта'],['askFriend','Спросить про друга'],['askBring','Спросить, что принесёт'],['by','Создал']],
  'Регистрации': [['id','ID'],['eventId','Событие (ID)'],['teenId','Подросток (ID)'],['teenName','Подросток'],['friends','Друзей с собой'],['bring','Что принесёт'],['isNew','Новый'],['by','Позвал (ID)'],['parNew','Добавил родителя'],['ts','Когда']],
  '_Фото': [['id','ID'],['n','Часть'],['data','Данные']],
  'Лидеры': [['id','ID'],['email','Email'],['name','Имя'],['role','Роль'],['groups','Группы (ID)'],['status','Статус'],['code','Код приглашения'],['invitedAt','Приглашён']],
  'Задания': [['id','ID'],['title','Задание'],['kind','Тип'],['due','Срок'],['pts','Баллы'],['aud','Для групп (ID)'],['createdBy','Создал'],['createdAt','Создано']],
  'Выполнения': [['taskId','Задание (ID)'],['teenId','Подросток (ID)'],['date','Дата'],['by','Засчитал'],['status','Статус']],
  'Напоминания': [['taskId','Задание (ID)'],['teenId','Подросток (ID)'],['date','Дата'],['by','Кто']],
  'Ачивки': [['id','ID'],['badge','Ачивка'],['teenId','Подросток (ID)'],['date','Дата'],['by','Засчитал']],
  'Настройки': [['key','Ключ'],['value','Значение']],
  'Входы': [['teenId','Подросток (ID)'],['date','Дата']],
  'Журнал': [['ts','Когда (мс)'],['by','Кто'],['act','Действие'],['teenId','Подросток (ID)'],['data','Данные']],
  'Контакты': [['teenId','Подросток (ID)'],['date','Связались'],['by','Кто'],['note','Заметка'],['upd','Обновлено']],
  'Отмены': [['id','ID'],['date','Дата'],['kind','Тип'],['meetId','Встреча (ID)'],['reason','Причина'],['by','Отметил'],['ts','Когда']],
  'Заявки': [['id','ID'],['teenId','Подросток (ID)'],['groupId','Группа (ID)'],['date','Дата'],['status','Статус'],['by','Решил']],
  'Стих дня': [['id','ID'],['date','Дата'],['teenId','Подросток (ID)'],['kind','Тип'],['text','Текст'],['ts','Когда']],
  'Приглашения': [['id','ID'],['by','Пригласил (ID)'],['first','Имя'],['last','Фамилия'],['phone','Телефон'],['date','Дата'],['status','Статус'],['teenId','Подросток (ID)']],
  'Шары': [['id','ID'],['eventId','Событие (ID)'],['teenId','Подросток (ID)'],['name','Имя на шаре'],['wish','Пожелание'],['color','Цвет'],['photo','Фото'],['status','Статус'],['ts','Когда'],['by','Кто проверил']],
  '_Сессии': [['token','Токен'],['email','Email'],['expires','Истекает']],
  '_ТГ': [['nonce','Код входа'],['chatId','Telegram чат'],['teenId','Подросток (ID)'],['status','Статус'],['created','Создан']],
  '_Коды': [['email','Email'],['code','Код'],['expires','Истекает']]
};

const DEFAULT_SETTINGS = { win: '8', reg: '6', gone: '3', serviceTime: '15:00', wedTime: '18:00', friTime: '19:00', before: '60', after: '240', qrAlways: '0' };

// ---------------- доступ к таблице ----------------
// Таблицу и каждый лист читаем один раз за запрос: чтение листа — самая медленная операция Apps Script.
let SS_C_ = null, SS_ID_C_ = null, READS_ONCE_ = false; // READS_ONCE_ включаем только в запросах на чтение (загрузка данных)
const ROWS_C_ = {};
function ss_() {
  const id = PropertiesService.getScriptProperties().getProperty('SS_ID');
  if (SS_C_ && SS_ID_C_ === id) return SS_C_;
  SS_ID_C_ = id; Object.keys(ROWS_C_).forEach(k => delete ROWS_C_[k]);
  return SS_C_ = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.getActiveSpreadsheet();
}
// прямой доступ к листу почти всегда означает запись — сбрасываем прочитанное
function sh_(name) { delete ROWS_C_[name]; return ss_().getSheetByName(name); }
function keys_(name) { return COLS[name].map(c => c[0]); }
function rows_(name) {
  const ss = ss_(); let c = READS_ONCE_ ? ROWS_C_[name] : null;
  if (!c) {
    const s = ss.getSheetByName(name), last = s.getLastRow(), keys = keys_(name);
    const v = last < 2 ? [] : s.getRange(2, 1, last - 1, keys.length).getDisplayValues();
    c = v.map((r, i) => { const o = { _row: i + 2 }; keys.forEach((k, j) => o[k] = r[j]); return o; });
    if (!READS_ONCE_) return c;
    ROWS_C_[name] = c;
  }
  return c.map(o => Object.assign({}, o)); // копии: вызывающий код может менять строки
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
  const FNS = { requestCode, verifyCode, joinByCode, logout, api, joinInfo, joinKnown, joinPick, joinNew, joinFriends, evInfo, evLookup, evJoinKnown, evJoinNew, evJoinSite, evTicket, balls, ballPut, ballsAdmin, ballMod, inviteInfo, inviteJoin, tgStart, tgPoll, teenApi, teenByCode };
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
  const clean = () => { READS_ONCE_ = false; Object.keys(ROWS_C_).forEach(k => delete ROWS_C_[k]); }; // прочитанное живёт только внутри одного запроса
  clean();
  try { return JSON.stringify({ ok: true, data: fn() }); }
  catch (e) { return JSON.stringify({ ok: false, error: String(e && e.message || e) }); }
  finally { clean(); }
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
  addEvent: ['admin', 'leader'], editEvent: ['admin', 'leader'], delEvent: ['admin'], evUnreg: ['admin', 'leader'], saveGroup: ['admin'], saveSettings: ['admin'],
  meetOff: ['admin', 'leader'], mergeTeens: ['admin'], notDup: ['admin'], contact: ['admin', 'leader', 'mod'], log: ['admin'], delTeen: ['admin'], restoreTeen: ['admin'], wipeTeen: ['admin'], trash: ['admin'],
  invite: ['admin'], updateLeader: ['admin'], removeLeader: ['admin'],
  savePlanWeek: ['admin'], delVcom: ['admin', 'leader'], teenCode: ['admin', 'leader'], groupReq: ['admin'], confirmTask: ['admin', 'leader'], addTask: ['admin', 'leader'], taskDone: ['admin', 'leader'], remind: ['admin', 'leader'], award: ['admin', 'leader'], igReview: ['admin', 'leader']
};
function api(token, action, payload) {
  return out_(() => {
    const me = auth_(token);
    if (action !== 'bootstrap' && (!CAN[action] || CAN[action].indexOf(me.role) < 0)) throw new Error('forbidden');
    const fn = A_[action]; if (!fn) throw new Error('unknown_action');
    if (action === 'bootstrap') { READS_ONCE_ = true; return fn(asMe_(me, payload || {}), payload || {}); }
    return lock_(() => { const res = fn(me, payload || {}); try { logAct_(me, action, payload || {}, res); } catch (e) {} return res; });
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
    const allT = rows_('Подростки'), teens = allT.filter(t => t.archived !== '1');
    const myGroups = me.groups;
    const visTeens = teens.map(t => {
      const o = { id: t.id, first: t.first, last: t.last, groups: t.groups ? t.groups.split(',').filter(Boolean) : [], createdAt: t.createdAt, source: t.source, review: t.review === '1', invitedBy: t.invitedBy, isLeader: t.isLeader === '1' };
      const own = me.role === 'admin' || (me.role === 'leader' && o.groups.some(g => myGroups.indexOf(g) >= 0));
      if (me.role !== 'viewer') CONTACT_KEYS.forEach(k => o[k] = t[k]);
      if (own) PARENT_KEYS.forEach(k => o[k] = t[k]);
      o.canEditParent = own;
      return o;
    });
    if (me.role !== 'viewer') { const P = allPoints_(); visTeens.forEach(o => o.pts = P[o.id] || 0); }
    const dups = me.role === 'admin' ? dupPairs_(teens, settings_().notDup) : [];
    const att = rows_('Посещения').map(a => [a.date, a.kind, a.meetId, a.teenId]);
    const st = settings_();
    const res = {
      me, today: today_(), execUrl: execUrl_(), settings: st,
      teens: visTeens, dups, trashN: me.role === 'admin' ? allT.filter(inTrash_).length : 0, contacts: cts_().map(c => [c.teenId, c.date, c.by ? markerName_({ by: c.by }) : '', c.note, c.upd]), att, off: offs_().map(o => [o.date, o.kind, o.meetId, o.reason, markerName_({ by: o.by })]),
      groups: rows_('Группы').filter(g => g.active !== '0').map(g => ({ id: g.id, name: g.name, leader: g.leader, day: +g.day, time: g.time, addr: g.addr || '', contact: g.contact || '' })),
      events: rows_('События').map(evOut_), regs: regs_().map(r => [r.eventId, r.teenId, +r.friends || 0, r.bring, r.isNew === '1' ? 1 : 0, r.by, r.parNew === '1' ? 1 : 0, r.ts]),
      tasks: rows_('Задания').map(t => ({ id: t.id, title: t.title, kind: t.kind, due: t.due, pts: +t.pts || 0, aud: t.aud ? t.aud.split(',').filter(Boolean) : [], createdAt: t.createdAt })),
      done: rows_('Выполнения').filter(counted_).map(d => [d.taskId, d.teenId, d.date]),
      reminders: rows_('Напоминания').map(d => [d.taskId, d.teenId]),
      awards: rows_('Ачивки').map(a => ({ id: a.id, badge: a.badge, teenId: a.teenId, date: a.date }))
    };
    if (me.role === 'admin' || me.role === 'leader') {
      const allDone = rows_('Выполнения'), w = weekInfo_(today_());
      res.pending = allDone.filter(d => d.status === 'pending').map(d => { const k = vtask_(d.taskId) || {}; return { taskId: d.taskId, teenId: d.teenId, date: d.date, title: k.title || '', pts: k.pts || 0 }; });
      const okNow = {}; allDone.filter(counted_).forEach(d => { if (String(d.taskId).indexOf('W' + w.mon + ':') === 0) okNow[d.teenId] = 1; });
      res.plan = planCfg_().plan.map((_, i) => { const x = weekInfo_(dstr_(dnum_(w.mon) + 7 * i)); return { n: x.n, mon: x.mon, idx: x.idx, ref: x.ref, title: x.title, verse: x.verse, tasks: weekTasks_(x).map(k => ({ kind: k.kind, title: k.title, desc: k.desc, pts: k.pts })) }; });
      res.weekWho = allDone.filter(d => String(d.taskId).indexOf('W' + w.mon + ':') === 0 && d.status !== 'no').map(d => { const k = vtask_(d.taskId) || {}; return { teenId: d.teenId, title: k.title || '', pts: k.pts || 0, status: d.status || 'ok' }; });
      res.planDone = Object.keys(okNow).length;
      res.vcom = vrows_().filter(r => r.kind === 'com' && dnum_(today_()) - dnum_(r.date) <= 14).map(r => ({ id: r.id, date: r.date, ref: verseOf_(r.date).ref, teenId: r.teenId, text: r.text, ts: r.ts })).reverse();
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
      if (offs_().some(o => o.date === p.date && o.kind === p.kind && o.meetId === p.meetId)) throw new Error('meet_off');
      if (String(p.date) > today_()) throw new Error('future'); // отметить пришедших заранее нельзя
      const t = rows_('Подростки').find(x => x.id === p.teenId);
      append_('Посещения', { id: uid_('A'), date: p.date, kind: p.kind, meetId: p.meetId, teenId: p.teenId, teenName: t ? (t.first + ' ' + t.last).trim() : '', by: me.email, method: 'leader', ts: nowIso_() });
      return { on: true };
    }
    if (hit.length) delete_('Посещения', hit.map(h => h._row));
    return { on: false };
  },
  // Удаление карточки: скрываем и кладём в корзину на 30 дней; посещения остаются в статистике
  delTeen(me, p) {
    const t = rows_('Подростки').find(x => x.id === p.id && x.archived !== '1'); if (!t) throw new Error('not_found');
    const sh = sh_('Подростки'), ci = keys_('Подростки').indexOf('del') + 1;
    if (!sh.getRange(1, ci, 1, 1).getDisplayValues()[0][0]) sh.getRange(1, ci, 1, 1).setValues([['Удалён']]);
    update_('Подростки', t, { archived: '1', review: '', del: [today_(), me.email, String(p.reason || '').replace(/\|/g, ' ').trim().slice(0, 80)].join('|') });
    const key = 'teen:' + t.id; ['_Сессии', '_Коды'].forEach(n => { const r = rows_(n).filter(x => x.email === key); if (r.length) delete_(n, r.map(x => x._row)); });
    purgeTrash_();
    return { name: (t.first + ' ' + t.last).trim() };
  },
  restoreTeen(me, p) {
    const t = rows_('Подростки').find(x => x.id === p.id && inTrash_(x)); if (!t) throw new Error('not_found');
    update_('Подростки', t, { archived: '', del: '' });
    return { name: (t.first + ' ' + t.last).trim() };
  },
  wipeTeen(me, p) {
    const t = rows_('Подростки').find(x => x.id === p.id && inTrash_(x)); if (!t) throw new Error('not_found');
    const name = (t.first + ' ' + t.last).trim(); wipeTeen_(t); return { name: name };
  },
  trash(me) {
    purgeTrash_();
    const cnt = {}; rows_('Посещения').forEach(a => { cnt[a.teenId] = (cnt[a.teenId] || 0) + 1; });
    return rows_('Подростки').filter(inTrash_).map(t => { const d = t.del.split('|'); return { id: t.id, name: (t.first + ' ' + t.last).trim(), date: d[0], by: markerName_({ by: d[1] }), mine: String(d[1]).toLowerCase() === String(me.email).toLowerCase(), reason: d[2] || '', left: Math.max(0, 30 - (dnum_(today_()) - dnum_(d[0]))), visits: cnt[t.id] || 0 }; }).sort((a, b) => a.left - b.left);
  },
  // Журнал действий команды за 90 дней — только админу
  log(me) {
    if (!ss_().getSheetByName('Журнал')) return { rows: [], who: {} };
    const min = Date.now() - 90 * 864e5, who = {};
    rows_('Лидеры').forEach(l => { who[String(l.email).toLowerCase()] = [l.name, l.role]; });
    return { rows: rows_('Журнал').filter(r => +r.ts >= min).slice(-2000).map(r => [+r.ts, r.by, r.act, r.teenId, r.data]), who: who };
  },
  // «Давно не были»: отметка «связались» и заметка — одна строка на подростка
  contact(me, p) {
    const t = rows_('Подростки').find(x => x.id === p.teenId && x.archived !== '1'); if (!t) throw new Error('not_found');
    if (me.role === 'leader' && !(t.groups || '').split(',').some(g => g && me.groups.indexOf(g) >= 0)) throw new Error('forbidden');
    ensure_('Контакты');
    const cur = rows_('Контакты').filter(x => x.teenId === t.id), row = cur[0];
    const next = { teenId: t.id, date: row ? row.date : '', by: row ? row.by : '', note: row ? row.note : '', upd: today_() };
    if (p.on === true) { next.date = today_(); next.by = me.email; }
    if (p.on === false) { next.date = ''; next.by = ''; }
    if (p.note != null) next.note = String(p.note).trim().slice(0, 200);
    if (cur.length > 1) delete_('Контакты', cur.slice(1).map(x => x._row));
    if (!next.date && !next.note) { if (row) delete_('Контакты', [row._row]); return { date: '', note: '' }; }
    if (row) update_('Контакты', row, next); else append_('Контакты', next);
    return { date: next.date, note: next.note, by: next.date ? (me.name || me.email) : '' };
  },
  // Склейка дублей: всё с профиля drop переезжает на keep, drop скрывается
  mergeTeens(me, p) {
    const teens = rows_('Подростки');
    const keep = teens.find(x => x.id === p.keepId && x.archived !== '1'), drop = teens.find(x => x.id === p.dropId && x.archived !== '1');
    if (!keep || !drop || keep.id === drop.id) throw new Error('not_found');
    const K = keep.id, Dp = drop.id, keepName = p.name === 'drop' ? (drop.first + ' ' + drop.last).trim() : (keep.first + ' ' + keep.last).trim();
    const move = (name, col, keyFn, extra) => {
      if (!ss_().getSheetByName(name)) return 0;
      const rows = rows_(name), sh = sh_(name), ci = keys_(name).indexOf(col) + 1;
      const seen = {}; if (keyFn) rows.forEach(r => { if (r[col] === K) seen[keyFn(r)] = 1; });
      const del = []; let n = 0;
      rows.forEach(r => { if (r[col] !== Dp) return;
        if (keyFn) { const k = keyFn(r); if (seen[k]) { del.push(r._row); return; } seen[k] = 1; }
        sh.getRange(r._row, ci, 1, 1).setValues([[K]]); if (extra) extra(sh, r); n++; });
      if (del.length) delete_(name, del);
      return n;
    };
    const ni = keys_('Посещения').indexOf('teenName') + 1;
    const moved = move('Посещения', 'teenId', r => r.date + '|' + r.kind + '|' + r.meetId, (sh, r) => sh.getRange(r._row, ni, 1, 1).setValues([[keepName]]));
    move('Выполнения', 'teenId', r => r.taskId);
    move('Напоминания', 'teenId', r => r.taskId + '|' + r.date);
    move('Ачивки', 'teenId', r => r.badge + '|' + r.date);
    move('Входы', 'teenId', r => r.date);
    move('Заявки', 'teenId', r => r.groupId + '|' + r.status);
    move('Стих дня', 'teenId', r => r.kind === 'com' ? r.id : r.date + '|' + r.kind + '|' + r.text);
    move('Приглашения', 'teenId'); move('Приглашения', 'by');
    if (ss_().getSheetByName('Регистрации')) { move('Регистрации', 'teenId', r => r.eventId); move('Регистрации', 'by'); }
    move('_ТГ', 'teenId'); move('Подростки', 'invitedBy'); move('Контакты', 'teenId', r => 'one');
    const sess = rows_('_Сессии').filter(x => x.email === 'teen:' + Dp), si = keys_('_Сессии').indexOf('email') + 1;
    sess.forEach(x => sh_('_Сессии').getRange(x._row, si, 1, 1).setValues([['teen:' + K]]));
    const codes = rows_('_Коды').filter(x => x.email === 'teen:' + Dp); if (codes.length) delete_('_Коды', codes.map(x => x._row));
    const patch = {};
    ['phone', 'birth', 'addr', 'pFirst', 'pLast', 'pPhone', 'pAddr', 'invitedBy'].forEach(k => { if (!keep[k] && drop[k]) patch[k] = drop[k]; });
    if (!keep.ig && drop.ig) { patch.ig = drop.ig; patch.igStatus = drop.igStatus; }
    if (!keep.tgId && drop.tgId) { patch.tgId = drop.tgId; patch.tgChat = drop.tgChat; }
    if (!keep.birth && !drop.birth && !keep.age && drop.age) { patch.age = drop.age; patch.ageAt = drop.ageAt; }
    if (patch.invitedBy === K) delete patch.invitedBy;
    const gs = (keep.groups ? keep.groups.split(',') : []).concat(drop.groups ? drop.groups.split(',') : []).filter((g, i, a) => g && a.indexOf(g) === i).join(',');
    if (gs !== keep.groups) patch.groups = gs;
    if (drop.createdAt && (!keep.createdAt || drop.createdAt < keep.createdAt)) patch.createdAt = drop.createdAt;
    if (drop.isLeader === '1' && keep.isLeader !== '1') patch.isLeader = '1';
    if (p.name === 'drop') { patch.first = drop.first; patch.last = drop.last; }
    const fresh = rows_('Подростки');
    update_('Подростки', fresh.find(x => x.id === K), patch);
    update_('Подростки', fresh.find(x => x.id === Dp), { archived: '1', review: '', tgId: '', source: 'merged:' + K });
    return { moved: moved, keepName: keepName, dropName: (drop.first + ' ' + drop.last).trim() };
  },
  notDup(me, p) {
    if (!p.a || !p.b) throw new Error('bad_request');
    const key = [p.a, p.b].sort().join('|'); const cur = String(settings_().notDup || '').split(',').filter(Boolean);
    if (cur.indexOf(key) < 0) { cur.push(key); A_.saveSettings(me, { notDup: cur.join(',') }); }
    return true;
  },
  // «Встречи не было»: день закрыт с причиной и не считается пропуском
  meetOff(me, p) {
    if (['service', 'group'].indexOf(p.kind) < 0 || !/^\d{4}-\d{2}-\d{2}$/.test(String(p.date || '')) || !p.meetId) throw new Error('bad_request');
    if (me.role !== 'admin' && !(p.kind === 'group' && me.groups.indexOf(p.meetId) >= 0)) throw new Error('forbidden');
    const hit = offs_().filter(o => o.date === p.date && o.kind === p.kind && o.meetId === p.meetId);
    if (p.on === false) { if (hit.length) delete_('Отмены', hit.map(h => h._row)); return { on: false }; }
    const reason = String(p.reason || '').trim().slice(0, 80); if (!reason) throw new Error('bad_request');
    const marks = rows_('Посещения').filter(a => a.date === p.date && a.kind === p.kind && a.meetId === p.meetId);
    if (marks.length) { if (!p.clear) throw new Error('has_marks'); delete_('Посещения', marks.map(x => x._row)); }
    ensure_('Отмены');
    if (hit.length) { update_('Отмены', hit[0], { reason: reason, by: me.email, ts: nowIso_() }); if (hit.length > 1) delete_('Отмены', hit.slice(1).map(h => h._row)); }
    else append_('Отмены', { id: uid_('X'), date: p.date, kind: p.kind, meetId: p.meetId, reason: reason, by: me.email, ts: nowIso_() });
    return { on: true, reason: reason, by: me.name || me.email };
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
    const o = { id: uid_('T'), groups: (t.groups || []).join(','), createdAt: today_(), source: 'leader', review: '', archived: '', isLeader: t.isLeader ? '1' : '' };
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
    if (p.fields && 'isLeader' in p.fields && me.role !== 'mod') patch.isLeader = p.fields.isLeader ? '1' : '';
    if (p.groups && me.role !== 'mod') patch.groups = p.groups.join(',');
    if (p.archived != null && me.role === 'admin') patch.archived = p.archived ? '1' : '';
    patch.review = '';
    update_('Подростки', t, patch);
    return true;
  },

  reviewTeen(me, p) {
    const t = rows_('Подростки').find(x => x.id === p.id); if (t) update_('Подростки', t, { review: '' }); return true;
  },

  delVcom(me, p) { const hit = vrows_().filter(r => (r.id === p.id && r.kind === 'com') || (r.kind === 'clike' && r.text === p.id)); if (hit.length) delete_('Стих дня', hit.map(h => h._row)); return true; },
  // одноразовый код входа для подростка без Telegram: выдаёт лидер, действует 24 часа
  teenCode(me, p) {
    const t = rows_('Подростки').find(x => x.id === p.teenId && x.archived !== '1'); if (!t) throw new Error('not_found');
    const key = 'teen:' + t.id; let code;
    const taken = {}; rows_('_Коды').forEach(r => { if (r.email.indexOf('teen:') === 0) taken[r.code] = 1; });
    do { code = String(Math.floor(100000 + Math.random() * 900000)); } while (taken[code]);
    delete_('_Коды', rows_('_Коды').filter(r => r.email === key).map(r => r._row));
    append_('_Коды', { email: key, code: code, expires: String(Date.now() + 24 * 3600000) });
    return { code: code, hours: 24 };
  },
  savePlanWeek(me, p) {
    const cfg = planCfg_(), idx = +p.idx; if (!(idx >= 0 && idx < cfg.plan.length)) throw new Error('bad_week');
    const cl = (v, n) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim().slice(0, n || 200);
    const plan = cfg.plan.map(x => ({ ref: x.ref, title: x.title, verse: x.verse })); const old = plan[idx];
    const nw = { ref: cl(p.ref, 60) || old.ref, title: cl(p.title, 80), verse: cl(p.verse, 60) }; plan[idx] = nw;
    const g = JSON.parse(JSON.stringify(cfg.g)), w = JSON.parse(JSON.stringify(cfg.w));
    Object.keys(p.tasks || {}).forEach(kind => {
      const def = WEEK_TASKS.find(t => t[0] === kind); if (!def) return; const t = p.tasks[kind] || {};
      // текст с названием главы/стиха храним шаблоном, чтобы он подходил и другим неделям
      let desc = cl(t.desc, 300); [[nw.verse, '{verse}'], [old.verse, '{verse}'], [nw.ref, '{ref}'], [old.ref, '{ref}']].forEach(a => { if (a[0]) desc = desc.split(a[0]).join(a[1]); });
      const pts = Math.max(0, Math.min(200, Math.round(+t.pts || 0)));
      const o = { title: cl(t.title, 60) || def[1], desc: desc || def[2], pts: pts };
      if (t.all) { g[kind] = o; Object.keys(w).forEach(i => { if (w[i]) delete w[i][kind]; }); } else { (w[idx] = w[idx] || {})[kind] = o; }
    });
    A_.saveSettings(me, { plan: JSON.stringify(plan), weekTasks: JSON.stringify({ g: g, w: w }) });
    PLANCFG_ = null;
    return true;
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
    fixHeads_('События');
    const e = Object.assign({ id: uid_('E'), name: name.slice(0, 80), date: /^\d{4}-\d{2}-\d{2}$/.test(p.date || '') ? p.date : today_(), by: me.email }, evClean_(p));
    if (typeof p.img === 'string') Object.assign(e, evSaveImg_(e.id, p.img, p.thumb));
    append_('События', e); return evOut_(e);
  },
  editEvent(me, p) {
    const e = rows_('События').find(x => x.id === p.id); if (!e) throw new Error('not_found');
    const name = String(p.name || '').trim(); if (!name) throw new Error('need_name');
    const date = /^\d{4}-\d{2}-\d{2}$/.test(p.date || '') ? p.date : e.date;
    fixHeads_('События');
    const patch = Object.assign({ name: name.slice(0, 80), date }, evClean_(p));
    if (typeof p.img === 'string') Object.assign(patch, evSaveImg_(e.id, p.img, p.thumb));
    const o = update_('События', e, patch);
    if (date !== e.date) rows_('Посещения').filter(a => a.kind === 'event' && a.meetId === e.id).forEach(a => update_('Посещения', a, { date }));
    return evOut_(o);
  },
  delEvent(me, p) {
    const e = rows_('События').find(x => x.id === p.id); if (!e) throw new Error('not_found');
    delete_('Посещения', rows_('Посещения').filter(a => a.kind === 'event' && a.meetId === e.id).map(a => a._row));
    const rg = regs_().filter(r => r.eventId === e.id); if (rg.length) delete_('Регистрации', rg.map(r => r._row));
    evSaveImg_(e.id, '', '');
    delete_('События', [e._row]);
    return true;
  },
  evUnreg(me, p) {
    const rg = regs_().filter(r => r.eventId === p.eventId && r.teenId === p.teenId);
    if (rg.length) delete_('Регистрации', rg.map(r => r._row));
    return { gone: rg.length };
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
  const OFF = offs_(), isOff = (k, id) => OFF.some(o => o.date === today && o.kind === k && o.meetId === id);
  const sv = SV.find(x => x.day === day && inWin(x.time) && !isOff('service', x.id));
  if (sv) return { kind: 'service', meetId: sv.id, label: sv.name, date: today };
  const g = rows_('Группы').find(x => x.active !== '0' && +x.day === day && inWin(x.time) && !isOff('group', x.id));
  if (g) return { kind: 'group', meetId: g.id, label: g.name, date: today };
  if (st.qrAlways === '1') { const t = SV.find(x => x.day === day) || SV[0]; if (!t || isOff('service', t.id)) return null; return { kind: 'service', meetId: t.id, label: t.name, date: today, test: true }; }
  return null;
}
function joinInfo() { return out_(() => { READS_ONCE_ = true; return { meet: currentMeeting_() }; }); }

function checkIn_(teenId, teenName, meet, method) {
  if (offs_().some(o => o.date === meet.date && o.kind === meet.kind && o.meetId === meet.meetId)) throw new Error('no_meeting');
  const all = rows_('Посещения');
  if (!all.some(a => a.date === meet.date && a.kind === meet.kind && a.meetId === meet.meetId && a.teenId === teenId)) {
    append_('Посещения', { id: uid_('A'), date: meet.date, kind: meet.kind, meetId: meet.meetId, teenId, teenName, by: 'self', method, ts: nowIso_() });
    return true;
  }
  return false;
}
// Отметка «я уже был»: телефон (свой или родителя) + день и месяц рождения. Имена не показываем, пока не совпало и то и другое.
function bMD_(b) {
  const v = String(b || '').trim(); let m;
  if ((m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) return [+m[2], +m[3]];
  if ((m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/))) return [+m[1], +m[2]];
  if ((m = v.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/))) return [+m[2], +m[1]];
  return null;
}
function tries_(key, add) {
  const c = CacheService.getScriptCache(), n = +(c.get(key) || 0);
  if (add) c.put(key, String(n + 1), 3600);
  return n;
}
// кандидаты по телефону и дню рождения; у кого дата рождения не записана — подходят по одному телефону
function whoAmI_(phone, d, m, teens) {
  const ph = digits_(phone); if (ph.length < 10) throw new Error('bad_phone');
  if (tries_('who:' + ph) >= 8) throw new Error('too_many');
  const byPh = teens.filter(t => t.archived !== '1' && (digits_(t.phone) === ph || digits_(t.pPhone) === ph));
  const exact = byPh.filter(t => { const b = bMD_(t.birth); return b && b[0] === +m && b[1] === +d; });
  const pool = exact.length ? exact : byPh.filter(t => !bMD_(t.birth));
  if (!pool.length) tries_('who:' + ph, true);
  return pool;
}
function keyFor_(teenId) { const k = uid_('K') + Math.floor(Math.random() * 1e9).toString(36); CacheService.getScriptCache().put('who:k:' + k, teenId, 1800); return k; }
function byKey_(k) { const id = CacheService.getScriptCache().get('who:k:' + String(k || '')); if (!id) throw new Error('expired'); const t = rows_('Подростки').find(x => x.id === id && x.archived !== '1'); if (!t) throw new Error('expired'); return t; }
function joinKnown(phone, d, m) {
  return out_(() => lock_(() => {
    const meet = currentMeeting_(); if (!meet) throw new Error('no_meeting');
    const teens = rows_('Подростки');
    if (!d || !m) { // старая версия страницы: пускаем только однозначный случай без даты рождения в базе
      const ph = digits_(phone); if (ph.length < 7) throw new Error('bad_phone');
      const c = teens.filter(x => digits_(x.phone) === ph && x.archived !== '1');
      if (c.length !== 1 || bMD_(c[0].birth)) return { found: false, needBirth: c.length > 0 };
      const fresh0 = checkIn_(c[0].id, (c[0].first + ' ' + c[0].last).trim(), meet, 'qr');
      return { found: true, first: c[0].first, already: !fresh0, meet };
    }
    const pool = whoAmI_(phone, d, m, teens);
    if (!pool.length) return { found: false };
    if (pool.length > 1) return { found: true, pick: pool.map(t => ({ k: keyFor_(t.id), first: t.first })) };
    const t = pool[0], fresh = checkIn_(t.id, (t.first + ' ' + t.last).trim(), meet, 'qr');
    return { found: true, first: t.first, already: !fresh, meet };
  }));
}
function joinPick(key) {
  return out_(() => lock_(() => {
    const meet = currentMeeting_(); if (!meet) throw new Error('no_meeting');
    const t = byKey_(key), fresh = checkIn_(t.id, (t.first + ' ' + t.last).trim(), meet, 'qr');
    return { found: true, first: t.first, already: !fresh, meet };
  }));
}
function joinNew(form, confirmDupId) {
  return out_(() => lock_(() => {
    const meet = currentMeeting_(); if (!meet) throw new Error('no_meeting');
    const teens = rows_('Подростки');
    if (confirmDupId) throw new Error('use_lookup'); // «да, это я» по имени больше не отмечает: только телефон + день рождения
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
const LAT_C_ = Object.create(null); // транслитерация чистая — считаем каждое слово один раз, иначе поиск дублей тормозит загрузку
function lat_(w) {
  const key = String(w || ''); if (key in LAT_C_) return LAT_C_[key];
  return LAT_C_[key] = latRaw_(key);
}
function latRaw_(w) {
  const T = { а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'i',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'i',ь:'',э:'e',ю:'iu',я:'ia',і:'i',ї:'i',є:'e',ґ:'g' };
  return String(w || '').toLowerCase().split('').map(c => T[c] != null ? T[c] : c).join('')
    .replace(/kh/g, 'h').replace(/[yj]/g, 'i').replace(/x/g, 'ks').replace(/w/g, 'v').replace(/[^a-z]/g, '').replace(/(.)\1+/g, '$1');
}
function lev_(a, b) { const m = a.length, n = b.length; if (!m) return n; if (!n) return m; let p = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) { const c = [i]; for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; } return p[n]; }
let NICK_MAP_ = null;
function nickOf_(f) { if (!NICK_MAP_) { NICK_MAP_ = Object.create(null); NICK_.forEach((g, i) => g.forEach(n => { const k = lat_(n); if (!(k in NICK_MAP_)) NICK_MAP_[k] = i; })); } const l = lat_(f); return l in NICK_MAP_ ? NICK_MAP_[l] : -1; }
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
  delete ROWS_C_[name]; const ss = ss_(); let sh = ss.getSheetByName(name);
  if (!sh) { sh = ss.insertSheet(name); const heads = COLS[name].map(c => c[1]); sh.getRange(1, 1, 1, heads.length).setValues([heads]).setFontWeight('bold').setBackground('#FFE3CC'); sh.setFrozenRows(1); sh.getRange(1, 1, sh.getMaxRows(), heads.length).setNumberFormat('@'); }
  return sh;
}
function invites_() { return ss_().getSheetByName('Приглашения') ? rows_('Приглашения') : []; }
// человек уже есть в базе: совпал телефон (его или родителя) или похожие имя и фамилия
function knownPerson_(f, teens) {
  const ph = digits_(f.phone), pp = digits_(f.pPhone);
  const hit = n => n && n.length >= 10 && teens.some(t => digits_(t.phone) === n || digits_(t.pPhone) === n);
  if (hit(ph) || hit(pp)) return true;
  const m = matchTeen_(String(f.first || '').trim(), String(f.last || '').trim(), ph, teens.filter(t => String(t.source || '').indexOf('merged:') !== 0));
  return !!m.t;
}
const DAYS_RU_ = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
function t12_(hhmm) { const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || '')); if (!m) return String(hhmm || ''); const h = +m[1]; return ((h % 12) || 12) + ':' + m[2] + ' ' + (h < 12 ? 'AM' : 'PM'); }
// Пары, похожие на дубли: то же имя (с транслитом и опечатками) или тот же телефон + то же имя
function dupPairs_(teens, notDup) {
  const skip = {}; String(notDup || '').split(',').forEach(k => { if (k) skip[k] = 1; });
  const res = [];
  for (let i = 0; i < teens.length; i++) for (let j = i + 1; j < teens.length; j++) {
    const a = teens[i], b = teens[j]; if (skip[[a.id, b.id].sort().join('|')]) continue;
    const sf = sameFirst_(a.first, b.first), pa = digits_(a.phone), ph = pa.length >= 7 && pa === digits_(b.phone);
    const rev = sameFirst_(a.first, b.last) && sameLast_(a.last, b.first);
    let how = '';
    if (ph && (sf || rev)) how = 'phone';
    else if ((sf && a.last && b.last && sameLast_(a.last, b.last)) || (rev && a.last && b.last)) how = 'name';
    if (how && a.birth && b.birth && a.birth !== b.birth) how = '';
    if (how) res.push([a.id, b.id, how]);
  }
  return res.slice(0, 30);
}
// Запись в журнал действий. Пишем только то, что меняет данные; ошибки журнала не ломают действие.
function logAct_(me, act, p, res) {
  let teen = '', d = null;
  const nm = t => ((t.first || '') + ' ' + (t.last || '')).trim();
  switch (act) {
    case 'mark': teen = p.teenId; d = { d: p.date, k: p.kind, m: p.meetId, on: !!p.on }; break;
    case 'addTeen': if (!res || !res.id) return; teen = res.id; d = { n: nm(p.teen || {}) }; break;
    case 'updateTeen': teen = p.id; d = { n: nm(p.fields || {}) }; break;
    case 'mergeTeens': teen = p.keepId; d = { keep: res.keepName, drop: res.dropName, moved: res.moved }; break;
    case 'teenCode': teen = p.teenId; d = {}; break;
    case 'delTeen': teen = p.id; d = { n: res.name, r: p.reason || '' }; break;
    case 'restoreTeen': teen = p.id; d = { n: res.name }; break;
    case 'wipeTeen': d = { n: res.name }; break;
    case 'contact': teen = p.teenId; d = { on: p.on, note: p.note == null ? null : String(p.note).slice(0, 120) }; break;
    case 'igReview': teen = p.id; d = { ok: !!p.ok }; break;
    case 'groupReq': if (res && res.gone) return; d = { ok: !!p.ok }; break;
    case 'meetOff': d = { d: p.date, k: p.kind, m: p.meetId, on: p.on !== false, r: p.reason || '', clear: !!p.clear }; break;
    case 'addEvent': d = { n: res.name, d: res.date }; break;
    case 'evUnreg': if (!res || !res.gone) return; teen = p.teenId; d = { e: p.eventId }; break;
    case 'editEvent': d = { n: p.name, d: p.date, id: p.id }; break;
    case 'delEvent': d = { id: p.id }; break;
    case 'saveGroup': d = { n: p.name, isNew: !p.id }; break;
    case 'saveSettings': { const ks = Object.keys(p).filter(k => k !== 'notDup'); if (!ks.length) return; d = { keys: ks.slice(0, 12) }; break; }
    case 'invite': d = { n: p.name, role: p.role }; break;
    case 'updateLeader': d = { id: p.id, role: p.role }; break;
    case 'removeLeader': d = { id: p.id }; break;
    case 'savePlanWeek': d = { idx: p.idx }; break;
    case 'delVcom': d = {}; break;
    case 'confirmTask': if (res && res.gone) return; teen = p.teenId; d = { task: p.taskId, ok: !!p.ok }; break;
    case 'addTask': d = { n: p.title }; break;
    case 'taskDone': teen = p.teenId; d = { task: p.taskId, on: !!p.on }; break;
    case 'remind': d = { task: p.taskId, cnt: (p.teenIds || []).length }; break;
    case 'award': d = { badge: p.badge, cnt: (p.teenIds || []).length, ids: (p.teenIds || []).slice(0, 15) }; break;
    default: return;
  }
  ensure_('Журнал');
  append_('Журнал', { ts: String(Date.now()), by: me.email, act: act, teenId: teen || '', data: JSON.stringify(d).slice(0, 600) });
  if (Math.random() < 0.03) { const min = Date.now() - 90 * 864e5; const old = rows_('Журнал').filter(r => +r.ts < min); if (old.length) delete_('Журнал', old.map(r => r._row)); }
}
// Корзина: карточка удалена (del = дата|кто|причина) и ещё не стёрта
function inTrash_(t) { return t.archived === '1' && !!t.del && String(t.del).indexOf('wiped') !== 0; }
// Стираем личные данные, оставляя строку с ID: посещения, баллы и ачивки остаются в статистике без имени
function wipeTeen_(t) {
  const blank = { first: 'Удалён', last: '', del: 'wiped|' + today_(), groups: '', invitedBy: '', tgId: '', review: '' };
  ['phone', 'birth', 'addr', 'ig', 'igStatus', 'tgChat', 'age', 'ageAt'].concat(PARENT_KEYS).forEach(k => { blank[k] = ''; });
  update_('Подростки', t, blank);
  const sh = sh_('Посещения'), ni = keys_('Посещения').indexOf('teenName') + 1;
  rows_('Посещения').forEach(a => { if (a.teenId === t.id && a.teenName) sh.getRange(a._row, ni, 1, 1).setValues([['']]); });
  const drop = (name, fn) => { if (!ss_().getSheetByName(name)) return; const r = rows_(name).filter(fn); if (r.length) delete_(name, r.map(x => x._row)); };
  drop('_Сессии', x => x.email === 'teen:' + t.id); drop('_Коды', x => x.email === 'teen:' + t.id); drop('_ТГ', x => x.teenId === t.id);
  if (ss_().getSheetByName('Регистрации')) { const rs = sh_('Регистрации'), rn = keys_('Регистрации').indexOf('teenName') + 1; regs_().forEach(r => { if (r.teenId === t.id && r.teenName) rs.getRange(r._row, rn, 1, 1).setValues([['']]); }); }
  drop('Контакты', x => x.teenId === t.id); drop('Заявки', x => x.teenId === t.id); drop('Стих дня', x => x.teenId === t.id && x.kind === 'com');
}
function purgeTrash_() { const today = dnum_(today_()); rows_('Подростки').filter(inTrash_).forEach(t => { if (today - dnum_(t.del.split('|')[0]) >= 30) wipeTeen_(t); }); }
function cts_() { return ss_().getSheetByName('Контакты') ? rows_('Контакты') : []; }
function offs_() { return ss_().getSheetByName('Отмены') ? rows_('Отмены') : []; }
function greqs_() { return ss_().getSheetByName('Заявки') ? rows_('Заявки') : []; }
function nextMeet_() { const sv = services_()[0]; return sv ? DAYS_RU_[sv.day] + ', ' + t12_(sv.time) : ''; }
// разовая настройка: новые колонки и адрес группы Тимы
function patchGroups1() {
  setup(); ensure_('Заявки'); ensure_('Приглашения');
  const g = rows_('Группы').find(x => /^tima/i.test(x.name)); if (g) update_('Группы', g, { addr: g.addr || '7457 Walnut Road', contact: g.contact || '(916) 559-5882' });
  const g2 = rows_('Группы').find(x => /^pasha/i.test(x.name)); if (g2) update_('Группы', g2, { contact: g2.contact || 't.me/pabeloglazov 2797592990', addr: g2.addr || '5357 Hidden Glen Dr' });
  Logger.log('Группы: ' + JSON.stringify(rows_('Группы').map(x => [x.name, x.addr, x.contact])));
}
// ---------------- события с регистрацией ----------------
function regs_() { return ss_().getSheetByName('Регистрации') ? rows_('Регистрации') : []; }
function fixHeads_(name) {
  const c = CacheService.getScriptCache(); if (c.get('heads:' + name)) return;
  const s = sh_(name), heads = COLS[name].map(x => x[1]);
  if (s.getMaxColumns && s.getMaxColumns() < heads.length) s.insertColumnsAfter(s.getMaxColumns(), heads.length - s.getMaxColumns());
  s.getRange(1, 1, 1, heads.length).setValues([heads]).setFontWeight('bold').setBackground('#FFE3CC');
  s.getRange(1, 1, s.getMaxRows(), heads.length).setNumberFormat('@'); // иначе «18:00» и «15» превратятся в время и число
  c.put('heads:' + name, '1', 21600);
}
function evClean_(p) {
  const cl = (v, n) => String(v == null ? '' : v).replace(/[ \t]+/g, ' ').trim().slice(0, n), o = {};
  if ('time' in p) o.time = /^\d{1,2}:\d{2}$/.test(p.time || '') ? p.time : '';
  if ('place' in p) o.place = cl(p.place, 120);
  if ('desc' in p) o.desc = String(p.desc || '').trim().slice(0, 600);
  ['descOn', 'paid', 'open', 'askFriend', 'askBring'].forEach(k => { if (k in p) o[k] = p[k] ? '1' : ''; });
  if ('price' in p) o.price = cl(p.price, 20);
  if ('incl' in p) o.incl = cl(p.incl, 60);
  if ('cap' in p) { const n = parseInt(p.cap, 10); o.cap = n > 0 ? String(Math.min(n, 9999)) : ''; }
  return o;
}
function evOut_(e) {
  return { id: e.id, name: e.name, date: e.date, reg: +e.reg || 0, time: e.time || '', place: e.place || '', desc: e.desc || '', descOn: e.descOn === '1', thumb: e.thumb || '', img: e.img === '1',
    paid: e.paid === '1', price: e.price || '', incl: e.incl || '', cap: +e.cap || 0, open: e.open === '1', askFriend: e.askFriend === '1', askBring: e.askBring === '1' };
}
// фото события режем на части по 40 000 знаков: в ячейку больше не помещается
function evSaveImg_(id, img, thumb) {
  const sh = ensure_('_Фото'); try { if (!sh.isSheetHidden()) sh.hideSheet(); } catch (e) {}
  const old = rows_('_Фото').filter(r => r.id === id); if (old.length) delete_('_Фото', old.map(r => r._row));
  if (!img) return { img: '', thumb: '' };
  if (!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+$/.test(img) || img.length > 400000) throw new Error('bad_image');
  const parts = []; for (let i = 0; i < img.length; i += 40000) parts.push({ id, n: String(parts.length), data: img.slice(i, i + 40000) });
  appendMany_('_Фото', parts);
  return { img: '1', thumb: /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+\/=]+$/.test(thumb || '') && thumb.length <= 12000 ? thumb : '' };
}
function evImg_(id) { return ss_().getSheetByName('_Фото') ? rows_('_Фото').filter(r => r.id === id).sort((a, b) => a.n - b.n).map(r => r.data).join('') : ''; }
function evGoing_(eid, rg) { return (rg || regs_()).filter(r => r.eventId === eid).reduce((a, r) => a + 1 + (+r.friends || 0), 0); }
function evGet_(eid) { const e = rows_('События').find(x => x.id === String(eid || '')); if (!e) throw new Error('no_event'); return e; }
function evInfo(eid, by) {
  return out_(() => {
    READS_ONCE_ = true; const e = evGet_(eid), o = evOut_(e), going = evGoing_(e.id);
    delete o.thumb; delete o.reg;
    o.img = e.img === '1' ? evImg_(e.id) : '';
    o.going = going; o.full = !!o.cap && going >= o.cap; o.past = e.date < today_();
    if (by) { const t = rows_('Подростки').find(x => x.id === by && x.archived !== '1'); if (t) o.inviter = (t.first + ' ' + String(t.last || '').charAt(0) + '.').trim(); }
    return o;
  });
}
function evOpen_(eid) { const e = evGet_(eid); if (e.open !== '1' || e.date < today_()) throw new Error('closed'); return e; }
function evLookup(eid, phone, d, m) {
  return out_(() => {
    const e = evOpen_(eid), rg = regs_().filter(r => r.eventId === e.id);
    if (!(+d >= 1 && +d <= 31 && +m >= 1 && +m <= 12)) throw new Error('need_birth');
    const pool = whoAmI_(phone, d, m, rows_('Подростки'));
    if (!pool.length) return { found: false };
    return { found: true, cands: pool.map(t => { const c = { k: keyFor_(t.id), first: t.first, lead: t.isLeader === '1', needPar: t.isLeader !== '1' && !(String(t.pFirst || '').trim() && digits_(t.pPhone).length >= 10), already: rg.some(r => r.teenId === t.id) }; const mine = rg.find(r => r.teenId === t.id); if (mine) { c.friends = +mine.friends || 0; c.bring = mine.bring || ''; } return c; }) };
  });
}
// ---------------- ёлка: шар участника события (фото или пожелание) ----------------
// Ключ шара выдаётся вместе с билетом (запись с сайта или «Уже есть билет?») — по нему человек вешает и меняет только свой шар.
// Шар виден всем только после одобрения лидером (status = ok); до этого его видит только автор.
function ballSecret_() { const p = PropertiesService.getScriptProperties(); let s = p.getProperty('BALL_SECRET'); if (!s) { s = Utilities.getUuid() + Utilities.getUuid(); p.setProperty('BALL_SECRET', s); } return s; }
function ballKey_(teenId, eid) { return teenId + '.' + Utilities.computeHmacSha256Signature(teenId + '|' + eid, ballSecret_()).slice(0, 9).map(b => ('0' + (b & 255).toString(16)).slice(-2)).join(''); }
function ballWho_(eid, bk) { const id = String(bk || '').split('.')[0]; if (!id || ballKey_(id, eid) !== String(bk)) throw new Error('bad_key'); return id; }
function balls_() { return ss_().getSheetByName('Шары') ? rows_('Шары') : []; }
function ballView_(b, i) { return { i: i, n: b.name, w: b.wish, c: b.color, p: b.photo }; }
function balls(eid, bk) {
  return out_(() => {
    READS_ONCE_ = true; const e = evGet_(eid); let me = ''; try { if (bk) me = ballWho_(e.id, bk); } catch (x) {}
    const out = []; let mine = null;
    balls_().filter(b => b.eventId === e.id).forEach((b, i) => { if (b.status === 'ok') out.push(ballView_(b, i)); if (me && b.teenId === me) { mine = ballView_(b, i); mine.status = b.status; } });
    return { balls: out, mine: mine };
  });
}
function ballPut(eid, bk, d) {
  return out_(() => lock_(() => {
    const e = evGet_(eid), id = ballWho_(e.id, bk); d = d || {};
    if (!regs_().some(r => r.eventId === e.id && r.teenId === id)) throw new Error('no_ticket');
    const cl = (v, n) => String(v || '').replace(/\s+/g, ' ').trim().slice(0, n);
    const name = cl(d.name, 20), wish = cl(d.wish, 90), color = ['red', 'gold', 'white', 'blue', 'green'].indexOf(d.color) >= 0 ? d.color : 'red', photo = String(d.photo || '');
    if (photo && (photo.indexOf('data:image/jpeg;base64,') !== 0 || photo.length > 24000)) throw new Error('bad_photo');
    if (!name) throw new Error('need_name');
    if (!photo && !wish) throw new Error('need_wish');
    ensure_('Шары'); const all = rows_('Шары').filter(b => b.eventId === e.id), cur = all.find(b => b.teenId === id);
    const patch = { name: name, wish: wish, color: color, photo: photo, status: 'wait', ts: String(Date.now()), by: '' };
    if (cur) update_('Шары', cur, patch); else append_('Шары', Object.assign({ id: uid_('B'), eventId: e.id, teenId: id }, patch));
    return { ok: true, mine: { i: cur ? all.indexOf(cur) : all.length, n: name, w: wish, c: color, p: photo, status: 'wait' } };
  }));
}
function ballsAdmin(token, eid) {
  return out_(() => { auth_(token); const e = evGet_(eid); return balls_().filter(b => b.eventId === e.id).map((b, i) => ({ id: b.id, i: i, n: b.name, w: b.wish, c: b.color, p: b.photo, status: b.status, ts: b.ts })); });
}
function ballMod(token, id, status) {
  return out_(() => lock_(() => {
    const me = auth_(token); if (['ok', 'no', 'wait'].indexOf(status) < 0) throw new Error('bad_status');
    const b = balls_().find(x => x.id === id); if (!b) throw new Error('not_found');
    update_('Шары', b, { status: status, by: me.email }); return true;
  }));
}
// Найти свой билет на сайте: телефон (свой или родителя) + имя. Отдаём только имя, номер записи и число друзей.
function evTicket(eid, phone, name) {
  return out_(() => {
    READS_ONCE_ = true; const e = evGet_(eid), ph = digits_(phone), nm = String(name || '').replace(/\s+/g, ' ').trim().split(' ')[0];
    if (ph.length < 10) throw new Error('bad_phone');
    if (!nm) throw new Error('need_name');
    if (tries_('tk:' + ph) >= 8) throw new Error('too_many');
    const same = (a, b) => { const x = lat_(a), y = lat_(b); if (!x || !y) return false; if (x === y) return true; const n = nickOf_(a); return n >= 0 && n === nickOf_(b); };
    const rg = regs_().filter(r => r.eventId === e.id), byId = {}; rows_('Подростки').forEach(t => { byId[t.id] = t; });
    const out = [];
    rg.forEach((r, i) => { const t = byId[r.teenId]; if (t && (digits_(t.phone) === ph || digits_(t.pPhone) === ph) && same(nm, t.first)) out.push({ first: t.first, no: i + 1, friends: +r.friends || 0, bk: ballKey_(t.id, e.id) }); });
    if (!out.length) { tries_('tk:' + ph, true); return { found: false }; }
    return { found: true, tickets: out };
  });
}
function evAns_(e, f) { const n = parseInt(f && f.friends, 10); return { friends: e.askFriend === '1' && n >= 1 && n <= 3 ? String(n) : '', bring: e.askBring === '1' ? String((f && f.bring) || '').replace(/\s+/g, ' ').trim().slice(0, 80) : '' }; }
function evPut_(e, t, f, extra) {
  ensure_('Регистрации');
  const all = regs_(), mine = all.find(r => r.eventId === e.id && r.teenId === t.id), ans = evAns_(e, f);
  if (!mine && +e.cap > 0 && evGoing_(e.id, all) >= +e.cap) throw new Error('full');
  if (mine) update_('Регистрации', mine, Object.assign(ans, extra && extra.parNew ? { parNew: '1' } : {}));
  else append_('Регистрации', Object.assign({ id: uid_('R'), eventId: e.id, teenId: t.id, teenName: (t.first + ' ' + t.last).trim(), ts: nowIso_() }, ans, extra || {}));
  try { ensure_('Журнал'); append_('Журнал', { ts: String(Date.now()), by: 'self', act: 'evReg', teenId: t.id, data: JSON.stringify({ n: e.name, d: e.date, id: e.id, isNew: !!(extra && extra.isNew), again: !!mine }) }); } catch (err) {}
  // no — порядковый номер записи на это событие (для билета на сайте): позиция строки среди записей события
  const evRegs = all.filter(r => r.eventId === e.id), no = mine ? evRegs.indexOf(mine) + 1 : evRegs.length + 1;
  return { ok: true, id: t.id, first: t.first, again: !!mine, no: no, name: e.name, date: e.date, time: e.time || '', place: e.place || '' };
}
function parent_(f) {
  const cl = v => String(v || '').replace(/\s+/g, ' ').trim().slice(0, 60);
  const o = { pFirst: cl(f.pFirst), pLast: cl(f.pLast), pPhone: cl(f.pPhone) };
  if (!o.pFirst || !o.pLast || digits_(o.pPhone).length < 10) throw new Error('need_parent');
  return o;
}
function evJoinKnown(eid, key, f) {
  return out_(() => lock_(() => {
    const e = evOpen_(eid); let t = byKey_(key); f = f || {};
    const lead = t.isLeader === '1'; // лидеры — взрослые: согласие и контакт родителей не нужны
    if (!lead && !f.consent) throw new Error('need_consent');
    let parNew = false;
    if (!lead && !(String(t.pFirst || '').trim() && digits_(t.pPhone).length >= 10)) { t = update_('Подростки', t, parent_(f)); parNew = true; }
    return evPut_(e, t, f, parNew ? { parNew: '1' } : null);
  }));
}
function evJoinNew(eid, f, by) {
  return out_(() => lock_(() => {
    const e = evOpen_(eid); f = f || {};
    const cl = v => String(v || '').replace(/\s+/g, ' ').trim().slice(0, 60);
    const first = cl(f.first), last = cl(f.last), age = parseInt(f.age, 10);
    if (!first || !last) throw new Error('need_name');
    if (!(age >= 8 && age <= 20)) throw new Error('need_age');
    const par = parent_(f);
    const phone = f.noPhone ? par.pPhone : cl(f.phone);
    if (digits_(phone).length < 10) throw new Error('need_phone');
    if (!f.consent) throw new Error('need_consent');
    const teens = rows_('Подростки'), ph = digits_(phone), low = x => String(x || '').trim().toLowerCase();
    if (regs_().filter(r => r.eventId === e.id && r.isNew === '1' && String(r.ts).slice(0, 10) === today_()).length >= 80) throw new Error('too_many');
    // тот же человек записывается второй раз (то же имя и тот же телефон) — второй карточки не создаём
    const same = teens.find(t => t.archived !== '1' && low(t.first) === low(first) && low(t.last) === low(last) && digits_(t.phone) === ph);
    if (same) return evPut_(e, same, f, null);
    const o = Object.assign({ id: uid_('T'), first, last, phone, age: String(age), ageAt: today_(), groups: '', createdAt: today_(), source: 'event', review: '1', archived: '', invitedBy: '' }, par);
    const inviter = by ? teens.find(x => x.id === by && x.archived !== '1') : null;
    if (inviter && !knownPerson_(o, teens)) o.invitedBy = inviter.id;
    const res = evPut_(e, o, f, { isNew: '1', by: inviter ? inviter.id : '' });
    append_('Подростки', o);
    res.isNew = true; if (inviter) res.inviter = inviter.first;
    return res;
  }));
}
// ---------------- запись с сайта (страница события на teensparty.fun) ----------------
// Подросток ничего не ищет: сервер сам сверяет его с базой. Привязываем к существующей карточке только при уверенном
// совпадении (тот же телефон + то же имя, либо имя и фамилия один в один с учётом транслита). Всё остальное — новая карточка «проверить».
function siteMatch_(first, last, ph, pPh, teens) {
  const pool = teens.filter(t => t.archived !== '1' && String(t.source || '').indexOf('merged:') !== 0);
  const sameName = (a, b) => { const x = lat_(a), y = lat_(b); if (!x || !y) return false; if (x === y) return true; const n = nickOf_(a); return n >= 0 && n === nickOf_(b); };
  const nums = [ph, pPh].filter(n => n && n.length >= 10);
  let c = pool.filter(t => sameName(first, t.first) && nums.some(n => digits_(t.phone) === n || digits_(t.pPhone) === n));
  if (c.length === 1) return c[0];
  if (c.length > 1) return null;
  if (!lat_(last)) return null;
  c = pool.filter(t => lat_(first) === lat_(t.first) && lat_(last) === lat_(t.last));
  return c.length === 1 ? c[0] : null;
}
function evJoinSite(eid, f) {
  return out_(() => lock_(() => {
    const e = evOpen_(eid); f = f || {};
    const cl = v => String(v || '').replace(/\s+/g, ' ').trim().slice(0, 60);
    const first = cl(f.first), last = cl(f.last), age = parseInt(f.age, 10);
    if (!first || !last) throw new Error('need_name');
    if (!(age >= 8 && age <= 20)) throw new Error('need_age');
    const par = parent_(f);
    const phone = f.noPhone ? par.pPhone : cl(f.phone);
    if (digits_(phone).length < 10) throw new Error('need_phone');
    if (!f.consent) throw new Error('need_consent');
    const teens = rows_('Подростки');
    if (regs_().filter(r => r.eventId === e.id && r.isNew === '1' && String(r.ts).slice(0, 10) === today_()).length >= 80) throw new Error('too_many');
    let t = siteMatch_(first, last, f.noPhone ? '' : digits_(phone), digits_(par.pPhone), teens), res;
    if (t) {
      let parNew = false;
      if (t.isLeader !== '1' && !(String(t.pFirst || '').trim() && digits_(t.pPhone).length >= 10)) { t = update_('Подростки', t, par); parNew = true; }
      res = evPut_(e, t, f, parNew ? { parNew: '1' } : null);
    } else {
      const o = Object.assign({ id: uid_('T'), first, last, phone, age: String(age), ageAt: today_(), groups: '', createdAt: today_(), source: 'site', review: '1', archived: '', invitedBy: '' }, par);
      res = evPut_(e, o, f, { isNew: '1', by: '' });
      append_('Подростки', o);
      res.isNew = true;
    }
    res.first = first; res.bk = ballKey_(res.id, e.id); delete res.id; // наружу — только то, что человек ввёл сам, и ключ его шара
    return res;
  }));
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
