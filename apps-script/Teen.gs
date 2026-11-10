/**
 * SOL 3:16 Teens — приложение подростка: вход через Telegram-бота, баллы, уровни, ачивки, серии.
 * Токен бота хранится только в свойствах скрипта (Project Settings → Script Properties → TG_TOKEN).
 */
const TG_CHAT_LINK = 'https://t.me/+Q9dPL22CL5owNTUy';
const IG_LINK = 'https://www.instagram.com/sol316teens/';
const MANUAL_PTS = { help: 40, night: 20, camp: 30, bday: 20, back: 20, thanks: 50 }; // ачивки, которые засчитывает лидер
const LEVELS = [[0, 'Новичок'], [100, 'Свой'], [300, 'Опора'], [600, 'Лидер-стажёр'], [1000, 'Легенда']];
// [id, категория, название, описание, сколько нужно, бонус баллов]
const BADGES = [
  ['first', 'meet', 'Первый шаг', 'Прийти на первую встречу SOL 3:16 Teens.', 1, 10],
  ['m5', 'meet', '5 встреч', 'Побывать на 5 встречах.', 5, 10],
  ['m10', 'meet', '10 встреч', 'Побывать на 10 встречах.', 10, 20],
  ['m25', 'meet', '25 встреч', 'Побывать на 25 встречах.', 25, 40],
  ['m50', 'meet', 'Полсотни', 'Побывать на 50 встречах.', 50, 80],
  ['m100', 'meet', 'Сотня', 'Побывать на 100 встречах. Легенда SOL.', 100, 200],
  ['w4', 'streak', 'Серия 4', 'Приходить на встречи 4 недели подряд.', 4, 20],
  ['w8', 'streak', 'Серия 8', 'Приходить на встречи 8 недель подряд.', 8, 40],
  ['w12', 'streak', 'Серия 12', 'Приходить на встречи 12 недель подряд.', 12, 60],
  ['w20', 'streak', 'Серия 20', 'Приходить на встречи 20 недель подряд.', 20, 120],
  ['team', 'streak', 'Командный игрок', 'Побывать на малой группе 8 раз.', 8, 30],
  ['d3', 'app', '3 дня', 'Заходить в приложение 3 дня подряд.', 3, 5],
  ['d7', 'app', 'Неделя в деле', 'Заходить в приложение 7 дней подряд.', 7, 15],
  ['d14', 'app', 'Две недели', 'Заходить в приложение 14 дней подряд.', 14, 30],
  ['d30', 'app', 'Месяц без пропусков', 'Заходить в приложение 30 дней подряд.', 30, 60],
  ['d100', 'app', '100 дней', 'Заходить в приложение 100 дней подряд. Это сильно.', 100, 200],
  ['b1', 'bible', 'Первая глава', 'Выполнить первое задание по чтению.', 1, 10],
  ['book', 'bible', 'Книжный червь', 'Выполнить 7 заданий по чтению Библии.', 7, 40],
  ['verse', 'bible', 'Стих наизусть', 'Выучить 5 стихов из заданий.', 5, 30],
  ['tgchat', 'social', 'В чате', 'Вступить в Telegram-чат SOL 3:16 Teens. Проверяет бот.', 1, 15],
  ['igsub', 'social', 'Подписчик', 'Подписаться на @sol316teens в Instagram. Подтверждает лидер.', 1, 15],
  ['allin', 'social', 'На связи', 'Быть и в Telegram-чате, и в Instagram.', 2, 10],
  ['profile', 'social', 'Всё о себе', 'Заполнить профиль полностью: день рождения, адрес и контакт родителя.', 1, 30],
  ['friend', 'friends', 'Позвал друга', 'Друг пришёл по твоему приглашению и отметился.', 1, 30],
  ['friend3', 'friends', 'Три друга', 'Привести трёх друзей.', 3, 90],
  ['party', 'friends', 'Душа компании', 'Побывать на 3 событиях: TEENS PARTY, выезды, ночёвки.', 3, 30],
  ['groups', 'friends', 'Везде свой', 'Побывать на каждой малой группе хотя бы раз.', 1, 30],
  ['night', 'friends', 'Ночёвка', 'Остаться на ночёвку в SOL. Засчитывает лидер.', 1, 0],
  ['camp', 'friends', 'Выезд', 'Съездить на выезд или в лагерь с SOL. Засчитывает лидер.', 1, 0],
  ['help', 'special', 'Помощник', 'Помочь на служении: техника, прославление, встреча гостей.', 1, 0],
  ['back', 'special', 'С возвращением', 'Вернуться после долгого перерыва. Мы скучали!', 1, 0],
  ['bday', 'special', 'День рождения в SOL', 'Прийти на встречу в неделю своего дня рождения.', 1, 0],
  ['thanks', 'special', 'Особая благодарность', 'За поступок, который хочется отметить.', 1, 0],
  ['legend', 'special', 'Легенда', 'Набрать 1000 баллов.', 1000, 100]
];

// ---------------- установка бота (запускается из редактора один раз) ----------------
function setupTeens() {
  setup(); // создаёт новые листы и колонки, ничего не удаляет
  const me = tg_('getMe');
  setSetting_('tgBot', me.username);
  try { tg_('deleteWebhook', {}); } catch (e) {}
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'tgPump').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('tgPump').timeBased().everyMinutes(1).create();
  Logger.log('Бот подключён: @' + me.username + '. Добавьте его в Telegram-чат SOL 3:16 Teens, чтобы он мог проверять участников.');
}

// ---------------- Telegram ----------------
function tgToken_() { const P = PropertiesService.getScriptProperties(); const t = P.getProperty('TG_TOKEN') || P.getProperty('TG_Token'); if (!t) throw new Error('no_bot'); return String(t).trim(); }
function tg_(method, payload) {
  const r = UrlFetchApp.fetch('https://api.telegram.org/bot' + tgToken_() + '/' + method, { method: 'post', contentType: 'application/json', payload: JSON.stringify(payload || {}), muteHttpExceptions: true });
  const j = JSON.parse(r.getContentText());
  if (!j.ok) throw new Error('tg: ' + j.description);
  return j.result;
}
function setSetting_(k, v) {
  const r = rows_('Настройки').find(x => x.key === k);
  if (r) update_('Настройки', r, { value: String(v) }); else append_('Настройки', { key: k, value: String(v) });
}
const contactKb_ = () => ({ keyboard: [[{ text: 'Поделиться номером', request_contact: true }]], resize_keyboard: true, one_time_keyboard: true });
const appKb_ = () => ({ inline_keyboard: [[{ text: 'Открыть SOL 3:16 Teens', url: APP_URL + 'me/' }]] });
function say_(chatId, text, kb) { try { tg_('sendMessage', { chat_id: chatId, text, reply_markup: kb }); } catch (e) { Logger.log(e); } }

// Мгновенные ответы: Telegram сам присылает сообщения на сервер (вебхук). Запустить один раз из редактора.
const API_EXEC = 'https://script.google.com/macros/s/AKfycbw1J4PnxNLtZ8H8dCWhJpTiAeA2V-X5RWmJdB6VQPr_IFzemiKS-y_SW50PvR0dAnL6Cg/exec';
function tgSecret_() { return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, 'sol:' + tgToken_()).map(b => ('0' + (b & 255).toString(16)).slice(-2)).join('').slice(0, 32); }
function setupWebhook() {
  tg_('setWebhook', { url: API_EXEC + '?tg=' + tgSecret_(), allowed_updates: ['message', 'my_chat_member'], max_connections: 5 });
  setSetting_('tgMode', 'webhook');
  Logger.log(JSON.stringify(tg_('getWebhookInfo')));
}
function tgWebhook_(e) {
  if (!e.parameter || e.parameter.tg !== tgSecret_()) return false;
  const u = JSON.parse(e.postData.contents);
  const cache = CacheService.getScriptCache(), key = 'tgu' + u.update_id;
  if (cache.get(key)) return true; // Telegram прислал повторно — уже обработано
  cache.put(key, '1', 21600);
  lock_(() => { try { handle_(u); } catch (err) { Logger.log('update ' + u.update_id + ': ' + err); } });
  return true;
}
function tgPump() { lock_(() => pump_()); } // по триггеру раз в минуту (запасной путь)
function pump_() {
  const st = settings_();
  if (st.tgMode === 'webhook') return;
  const ups = tg_('getUpdates', { offset: (+st.tgOffset || 0) + 1, timeout: 0, allowed_updates: ['message', 'my_chat_member'] });
  if (!ups.length) return;
  ups.forEach(u => { try { handle_(u); } catch (e) { Logger.log('update ' + u.update_id + ': ' + e); } });
  setSetting_('tgOffset', ups[ups.length - 1].update_id);
}
function finishNonces_(chatId, teenId) {
  rows_('_ТГ').filter(n => n.chatId === chatId && n.status === 'wait').forEach(n => update_('_ТГ', n, { teenId, status: 'ok' }));
}
function handle_(u) {
  if (u.my_chat_member) {
    const c = u.my_chat_member.chat, s = u.my_chat_member.new_chat_member.status;
    if ((c.type === 'group' || c.type === 'supergroup') && (s === 'member' || s === 'administrator')) { setSetting_('tgChatId', c.id); setSetting_('tgChatTitle', c.title || ''); }
    return;
  }
  const m = u.message; if (!m || !m.chat || !m.from) return;
  if (m.chat.type !== 'private') { if (m.migrate_to_chat_id) setSetting_('tgChatId', m.migrate_to_chat_id); return; }
  const chatId = String(m.chat.id), uid = String(m.from.id);
  const teens = rows_('Подростки').filter(t => t.archived !== '1');
  const teen = teens.find(t => t.tgId === uid);
  if (m.contact) {
    if (String(m.contact.user_id) !== uid) return say_(chatId, 'Отправь, пожалуйста, свой номер — кнопкой ниже.', contactKb_());
    const ph = digits_(m.contact.phone_number);
    const t = ph.length >= 7 && teens.find(x => digits_(x.phone) === ph);
    if (!t) return say_(chatId, 'Не нашли тебя по этому номеру. Отметься на встрече по QR (как новенький) или подойди к лидеру — и возвращайся сюда.', { remove_keyboard: true });
    update_('Подростки', t, { tgId: uid });
    finishNonces_(chatId, t.id);
    return say_(chatId, 'Готово, ' + t.first + '! Возвращайся в приложение SOL 3:16 Teens — вход уже выполнен.', appKb_());
  }
  const txt = String(m.text || '');
  if (txt.indexOf('/start') === 0) {
    const nonce = txt.split(' ')[1] || '';
    if (nonce) { const n = rows_('_ТГ').find(x => x.nonce === nonce); if (n && n.status === 'new') update_('_ТГ', n, { chatId, status: 'wait' }); }
    if (teen) { finishNonces_(chatId, teen.id); return say_(chatId, 'Привет, ' + teen.first + '! Вход выполнен — возвращайся в приложение.', appKb_()); }
    return say_(chatId, 'Привет! Это бот SOL 3:16 Teens.\nЧтобы войти в приложение, поделись номером телефона — тем, что ты указывал на встрече.', contactKb_());
  }
  if (teen) return say_(chatId, 'Открой приложение SOL 3:16 Teens:', appKb_());
  return say_(chatId, 'Нажми кнопку «Поделиться номером» внизу экрана — вводить номер вручную не нужно.', contactKb_());
}

// ---------------- вход подростка ----------------
function tgStart() {
  return out_(() => lock_(() => {
    const st = settings_(); if (!st.tgBot) throw new Error('no_bot');
    const nonce = Utilities.getUuid().replace(/-/g, '').slice(0, 24);
    append_('_ТГ', { nonce, chatId: '', teenId: '', status: 'new', created: String(Date.now()) });
    return { nonce, link: 'https://t.me/' + st.tgBot + '?start=' + nonce };
  }));
}
function tgPoll(nonce) {
  return out_(() => lock_(() => {
    let n = rows_('_ТГ').find(x => x.nonce === nonce); if (!n) throw new Error('bad_nonce');
    if (n.status === 'new' || n.status === 'wait') { pump_(); n = rows_('_ТГ').find(x => x.nonce === nonce); }
    if (n.status === 'ok') { update_('_ТГ', n, { status: 'used' }); return { status: 'ok', token: newSession_('teen:' + n.teenId) }; }
    if (Date.now() - +n.created > 30 * 60000) return { status: 'expired' };
    return { status: n.status };
  }));
}
function teenAuth_(token) {
  if (!token) throw new Error('auth');
  const s = rows_('_Сессии').find(x => x.token === token);
  if (!s || +s.expires < Date.now() || s.email.indexOf('teen:') !== 0) throw new Error('auth');
  const t = rows_('Подростки').find(x => x.id === s.email.slice(5) && x.archived !== '1');
  if (!t) throw new Error('auth');
  return t;
}

// ---------------- подсчёт баллов ----------------
const dnum_ = s => { const p = String(s).split('-'); return Math.round(Date.UTC(+p[0], +p[1] - 1, +p[2]) / 86400000); };
// ---------------- задания недели (глава + задания с подтверждением лидера) ----------------
const PLAN_START = '2026-11-09'; // понедельник первой недели
const PLAN = [['JHN', 3, 'Иоанна 3', 'Бог так возлюбил мир', 'Иоанна 3:16'], ['LUK', 15, 'Луки 15', 'Блудный сын', 'Луки 15:10'], ['MAT', 5, 'Матфея 5', 'Нагорная проповедь', 'Матфея 5:16'],
  ['MRK', 4, 'Марка 4', 'Буря на море', 'Марка 4:40'], ['PRO', 3, 'Притчи 3', 'Мудрость и доверие', 'Притчи 3:5–6'], ['ROM', 8, 'Римлянам 8', 'Ничто не отлучит', 'Римлянам 8:28'],
  ['DAN', 3, 'Даниил 3', 'Три друга в печи', 'Даниил 3:17–18'], ['PHP', 4, 'Филиппийцам 4', 'Радость и мир', 'Филиппийцам 4:13'], ['1SA', 17, '1 Царств 17', 'Давид и Голиаф', '1 Царств 17:45'],
  ['JAS', 1, 'Иакова 1', 'Вера в деле', 'Иакова 1:22'], ['EPH', 6, 'Ефесянам 6', 'Всеоружие Божье', 'Ефесянам 6:10–11'], ['1CO', 13, '1 Коринфянам 13', 'Что такое любовь', '1 Коринфянам 13:4']];
const WEEK_TASKS = [['share', 'Расскажи на группе', 'Прочитай главу недели ({ref}) и расскажи на малой группе, что ты понял.', 20, 'Я рассказал'],
  ['verse', 'Выучи стих', '{verse} — расскажи лидеру наизусть.', 25, 'Я рассказал лидеру'],
  ['good', 'Доброе дело', 'Сделай доброе дело дома или в школе и расскажи о нём на группе.', 20, 'Я сделал'],
  ['serve', 'Послужи на встрече', 'Встреть гостей, помоги с техникой или убери зал.', 20, 'Я послужил']];
const dstr_ = n => new Date(n * 86400000).toISOString().slice(0, 10);
function weekInfo_(dateStr) {
  const n = dnum_(dateStr), mon = n - ((n + 3) % 7), k = Math.round((mon - dnum_(PLAN_START)) / 7);
  const p = PLAN[((k % PLAN.length) + PLAN.length) % PLAN.length];
  return { mon: dstr_(mon), end: dstr_(mon + 6), n: k + 1, ref: p[2], title: p[3], verse: p[4], url: 'https://www.bible.com/bible/400/' + p[0] + '.' + p[1] + '.SYNO' };
}
function weekTasks_(w) { return WEEK_TASKS.map(t => ({ id: 'W' + w.mon + ':' + t[0], kind: t[0], title: t[1], desc: t[2].replace('{ref}', w.ref).replace('{verse}', w.verse), pts: t[3], btn: t[4] })); }
function vtask_(id) {
  const m = /^W(\d{4}-\d{2}-\d{2}):(\w+)$/.exec(String(id || '')); if (!m) return null;
  const t = WEEK_TASKS.find(x => x[0] === m[2]); if (!t) return null; const w = weekInfo_(m[1]);
  return { id: id, kind: t[0], title: t[1] + (t[0] === 'verse' ? ' · ' + w.verse : t[0] === 'share' ? ' · ' + w.ref : ''), pts: t[3], week: w.mon };
}
const counted_ = d => d.status !== 'pending' && d.status !== 'no';
function loadCtx_() {
  const teens = rows_('Подростки').filter(t => t.archived !== '1');
  const tasks = {}; rows_('Задания').forEach(k => tasks[k.id] = k);
  const by = (rows, key) => { const o = {}; rows.forEach(r => (o[r[key]] = o[r[key]] || []).push(r)); return o; };
  return {
    teens, tasks, today: today_(), month: today_().slice(0, 7),
    att: by(rows_('Посещения'), 'teenId'), done: by(rows_('Выполнения'), 'teenId'),
    awards: by(rows_('Ачивки'), 'teenId'), logins: by(rows_('Входы'), 'teenId'),
    groups: rows_('Группы').filter(g => g.active !== '0'),
    invited: by(teens.filter(t => t.invitedBy), 'invitedBy')
  };
}
function score_(t, C, full) {
  const att = C.att[t.id] || [], done = C.done[t.id] || [], aw = C.awards[t.id] || [], lg = C.logins[t.id] || [];
  const log = []; let pts = 0, month = 0;
  const add = (what, date, p) => { pts += p; if (date && date.slice(0, 7) === C.month) month += p; if (full) log.push({ what, date, pts: p }); };
  att.forEach(a => add(a.kind === 'event' ? 'Событие' : a.kind === 'group' ? 'Малая группа' : 'Встреча', a.date, a.kind === 'event' ? 15 : 10));
  done.filter(counted_).forEach(d => { const k = C.tasks[d.taskId] || vtask_(d.taskId); if (k) add('Задание: ' + k.title, d.date, +k.pts || 0); });
  const appDays = Array.from(new Set(lg.map(l => l.date))).sort();
  appDays.forEach(d => add('Зашёл в приложение', d, 2));
  aw.forEach(a => { if (MANUAL_PTS[a.badge]) add('Ачивка от лидера', a.date, MANUAL_PTS[a.badge]); });
  if (t.tgChat === '1') add('Вступил в Telegram-чат', '', 15);
  if (t.igStatus === 'ok') add('Подписался на Instagram', '', 15);
  (C.invited[t.id] || []).filter(f => (C.att[f.id] || []).length).forEach(f => add('Привёл друга: ' + f.first, f.createdAt || '', 30));
  // серия недель на встречах
  const weeks = Array.from(new Set(att.map(a => { const n = dnum_(a.date); return n - ((n + 3) % 7); }))).sort((a, b) => a - b); // понедельник недели
  let best = 0, run = 0; weeks.forEach((w, i) => { run = i && w - weeks[i - 1] === 7 ? run + 1 : 1; best = Math.max(best, run); });
  const tn = dnum_(C.today), thisW = tn - ((tn + 3) % 7);
  let wk = 0; for (let w = weeks.indexOf(thisW) >= 0 ? thisW : thisW - 7; weeks.indexOf(w) >= 0; w -= 7) wk++;
  // серия дней в приложении (раз в 7 дней пропуск прощается — «заморозка»)
  const set = new Set(appDays.map(dnum_)); let dRun = 0, dBest = 0, frz = -99;
  if (appDays.length) for (let d = dnum_(appDays[0]); d <= tn; d++) {
    if (set.has(d)) dRun++; else if (d < tn && d - frz >= 7) frz = d; else if (d < tn) dRun = 0;
    dBest = Math.max(dBest, dRun);
  }
  const last7 = []; for (let d = tn - 6; d <= tn; d++) last7.push(set.has(d) ? 1 : (d === frz ? 2 : 0));
  // ачивки
  const cntKind = kind => done.filter(counted_).filter(d => { const k = C.tasks[d.taskId] || vtask_(d.taskId); return k && k.kind === kind; }).length;
  const manual = id => aw.filter(a => a.badge === id).length;
  const friends = (C.invited[t.id] || []).filter(f => (C.att[f.id] || []).length).length + manual('friend');
  const visitedGroups = new Set(att.filter(a => a.kind === 'group').map(a => a.meetId));
  const have = {
    first: att.length, m5: att.length, m10: att.length, m25: att.length, m50: att.length, m100: att.length,
    w4: best, w8: best, w12: best, w20: best, team: att.filter(a => a.kind === 'group').length,
    d3: dBest, d7: dBest, d14: dBest, d30: dBest, d100: dBest,
    b1: cntKind('read'), book: cntKind('read'), verse: cntKind('verse'),
    tgchat: t.tgChat === '1' ? 1 : 0, igsub: t.igStatus === 'ok' ? 1 : 0, allin: (t.tgChat === '1' ? 1 : 0) + (t.igStatus === 'ok' ? 1 : 0),
    profile: profileLeft_(t).length ? 0 : 1,
    friend: friends, friend3: friends, party: att.filter(a => a.kind === 'event').length,
    groups: C.groups.length >= 2 && C.groups.every(g => visitedGroups.has(g.id)) ? 1 : 0,
    night: manual('night'), camp: manual('camp'), help: manual('help'), back: manual('back'), bday: manual('bday'), thanks: manual('thanks')
  };
  const badges = BADGES.map(([id, cat, name, desc, need, bonus]) => ({ id, cat, name, desc, need, bonus, have: id === 'legend' ? 0 : Math.min(have[id] || 0, need) }));
  badges.forEach(b => { if (b.id !== 'legend' && b.have >= b.need && b.bonus) add('Ачивка «' + b.name + '»', '', b.bonus); });
  const lg_ = badges.find(b => b.id === 'legend'); lg_.have = Math.min(pts, 1000); if (pts >= 1000) add('Ачивка «Легенда»', '', 100);
  return { pts, month, visits: att.length, weekStreak: wk, weekBest: best, appStreak: dRun, appBest: dBest, last7, badges, log };
}
function allPoints_() { const C = loadCtx_(); const o = {}; C.teens.forEach(t => o[t.id] = score_(t, C, false).pts); return o; }

// ---------------- API подростка ----------------
function teenApi(token, action, p) {
  return out_(() => {
    const t = teenAuth_(token);
    const fn = TA_[action]; if (!fn) throw new Error('unknown_action');
    return action === 'me' ? fn(t, p || {}) : lock_(() => fn(t, p || {}));
  });
}
// что подростку осталось заполнить в профиле
const PROFILE_PARTS = [['name', ['first', 'last']], ['phone', ['phone']], ['birth', ['birth']], ['addr', ['addr']], ['parent', ['pFirst', 'pPhone']]];
function profileLeft_(t) { return PROFILE_PARTS.filter(p => !p[1].every(k => String(t[k] || '').trim())).map(p => p[0]); }
const shortName_ = t => (t.first + ' ' + (t.last ? t.last.charAt(0) + '.' : '')).trim();
const TA_ = {
  me(t) {
    if (!rows_('Входы').some(l => l.teenId === t.id && l.date === today_())) lock_(() => append_('Входы', { teenId: t.id, date: today_() }));
    const C = loadCtx_(); const me = C.teens.find(x => x.id === t.id) || t;
    const sc = score_(me, C, true);
    const all = C.teens.map(x => { const s = x.id === t.id ? sc : score_(x, C, false); return { id: x.id, name: shortName_(x), pts: s.pts, month: s.month }; });
    const top = key => all.filter(x => x[key] > 0).sort((a, b) => b[key] - a[key]).map((x, i) => ({ place: i + 1, name: x.name, pts: x[key], me: x.id === t.id }));
    const month = top('month'), allTime = top('pts');
    const groups = (me.groups || '').split(',').filter(Boolean);
    const gname = {}; C.groups.forEach(g => gname[g.id] = g.name);
    const myDone = {}; (C.done[t.id] || []).forEach(d => myDone[d.taskId] = d.date);
    const doneCount = {}; Object.keys(C.done).forEach(k => C.done[k].forEach(d => doneCount[d.taskId] = (doneCount[d.taskId] || 0) + 1));
    const tasks = Object.keys(C.tasks).map(id => C.tasks[id]).filter(k => {
      const aud = k.aud ? k.aud.split(',').filter(Boolean) : [];
      return (!aud.length || aud.some(g => groups.indexOf(g) >= 0)) && (k.due >= C.today || (myDone[k.id] && dnum_(C.today) - dnum_(myDone[k.id]) <= 7));
    }).sort((a, b) => a.due.localeCompare(b.due)).map(k => ({ id: k.id, title: k.title, kind: k.kind, due: k.due, pts: +k.pts || 0, done: !!myDone[k.id], doneCount: doneCount[k.id] || 0 }));
    const st = settings_();
    sc.log.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return {
      today: C.today, levels: LEVELS,
      me: { id: me.id, first: me.first, last: me.last, since: me.createdAt, groups: groups.map(g => gname[g]).filter(Boolean) },
      pts: sc.pts, month: sc.month, visits: sc.visits, weekStreak: sc.weekStreak, appStreak: sc.appStreak, appBest: sc.appBest, last7: sc.last7,
      badges: sc.badges, log: sc.log.filter(x => x.date).slice(0, 12), tasks,
      rank: { month: month.slice(0, 20), all: allTime.slice(0, 20), myMonth: (month.find(x => x.me) || {}).place || 0, myAll: (allTime.find(x => x.me) || {}).place || 0 },
      tg: { link: TG_CHAT_LINK, ok: me.tgChat === '1', canCheck: !!st.tgChatId },
      profile: { first: me.first, last: me.last, phone: me.phone, birth: me.birth, addr: me.addr, pFirst: me.pFirst, pLast: me.pLast, pPhone: me.pPhone, left: profileLeft_(me), total: PROFILE_PARTS.length },
      week: (() => { const w = weekInfo_(C.today); const mine = {}; (C.done[t.id] || []).forEach(d => mine[d.taskId] = d);
        return Object.assign(w, { tasks: weekTasks_(w).map(k => { const r = mine[k.id]; return Object.assign(k, { status: r ? (r.status || 'ok') : '', by: r && counted_(r) ? markerName_({ by: r.by }) : '' }); }) }); })(),
      ig: { link: IG_LINK, status: me.igStatus || '', nick: me.ig || '' },
      meet: currentMeeting_(),
      schedule: services_(st).map(x => ({ name: x.name, day: x.day, time: x.time }))
    };
  },
  saveProfile(t, p) {
    const row = rows_('Подростки').find(x => x.id === t.id); if (!row) throw new Error('not_found');
    const f = p.fields || {}, patch = {};
    const txt = k => String(f[k] == null ? '' : f[k]).replace(/\s+/g, ' ').trim().slice(0, 120);
    ['first', 'last', 'addr', 'pFirst', 'pLast'].forEach(k => { if (k in f) patch[k] = txt(k); });
    if ('first' in patch && !patch.first) throw new Error('need_name');
    if ('birth' in f) {
      const b = txt('birth');
      if (b) { if (!/^\d{4}-\d{2}-\d{2}$/.test(b)) throw new Error('bad_birth'); const age = (dnum_(today_()) - dnum_(b)) / 365.25; if (!(age >= 8 && age <= 25)) throw new Error('bad_birth'); }
      patch.birth = b;
    }
    if ('pPhone' in f) { const d = digits_(f.pPhone); if (txt('pPhone') && d.length < 10) throw new Error('bad_phone'); patch.pPhone = d; }
    if (Object.keys(patch).length) update_('Подростки', row, patch);
    return true;
  },
  weekDone(t, p) {
    const k = weekTasks_(weekInfo_(today_())).find(x => x.id === p.id); if (!k) throw new Error('bad_task');
    const hit = rows_('Выполнения').filter(d => d.taskId === k.id && d.teenId === t.id);
    if (!hit.length) append_('Выполнения', { taskId: k.id, teenId: t.id, date: today_(), by: 'self', status: 'pending' });
    else if (hit[0].status === 'no') update_('Выполнения', hit[0], { status: 'pending', date: today_(), by: 'self' });
    return true;
  },
  taskDone(t, p) {
    const hit = rows_('Выполнения').filter(d => d.taskId === p.taskId && d.teenId === t.id);
    if (p.on && !hit.length) append_('Выполнения', { taskId: p.taskId, teenId: t.id, date: today_(), by: 'self' });
    if (!p.on && hit.length && hit.every(h => h.by === 'self')) delete_('Выполнения', hit.map(h => h._row));
    return true;
  },
  tgVerify(t) {
    const st = settings_(); if (!st.tgChatId) throw new Error('no_chat');
    if (!t.tgId) throw new Error('no_tg');
    let m; try { m = tg_('getChatMember', { chat_id: st.tgChatId, user_id: +t.tgId }); } catch (e) { return { ok: false }; }
    const ok = ['creator', 'administrator', 'member'].indexOf(m.status) >= 0 || (m.status === 'restricted' && m.is_member);
    if (ok && t.tgChat !== '1') update_('Подростки', t, { tgChat: '1' });
    return { ok };
  },
  igSubmit(t, p) {
    const nick = String(p.nick || '').trim().replace(/^@/, '').replace(/[^\w.]/g, '');
    if (!nick) throw new Error('need_nick');
    if (t.igStatus !== 'ok') update_('Подростки', t, { ig: nick, igStatus: 'pending' });
    return { nick };
  },
  checkin(t) {
    const meet = currentMeeting_(); if (!meet) throw new Error('no_meeting');
    const fresh = checkIn_(t.id, (t.first + ' ' + t.last).trim(), meet, 'app');
    return { meet, already: !fresh };
  }
};
