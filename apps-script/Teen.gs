/**
 * SOL 3:16 Teens — приложение подростка: вход через Telegram-бота, баллы, уровни, ачивки, серии.
 * Токен бота хранится только в свойствах скрипта (Project Settings → Script Properties → TG_TOKEN).
 */
const TG_CHAT_LINK = 'https://t.me/+Q9dPL22CL5owNTUy';
const IG_LINK = 'https://www.instagram.com/sol316teens/';
const MANUAL_PTS = { help: 40, night: 20, camp: 30, bday: 20, back: 20, thanks: 50 }; // ачивки, которые засчитывает лидер
const LEVELS = [[0, 'Новичок'], [100, 'Свой'], [200, 'Постоянный'], [300, 'Опора'], [450, 'Пример'], [600, 'Лидер-стажёр'], [800, 'Наставник'], [1000, 'Легенда'], [1500, 'Герой веры'], [2500, 'Чемпион 3:16']];
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
  ['wkall', 'tasks', 'Вся неделя', 'Выполнить все задания одной недели.', 1, 40],
  ['wk3', 'tasks', 'Три недели в деле', 'Выполнять задания недели 3 недели подряд.', 3, 30],
  ['wk6', 'tasks', 'Шесть недель в деле', 'Выполнять задания недели 6 недель подряд.', 6, 75],
  ['vid1', 'video', 'Первое слово', 'Досмотреть видео недели до конца.', 1, 10],
  ['vid4', 'video', 'Месяц со Словом', 'Смотреть видео недели 4 недели подряд.', 4, 30],
  ['vid12', 'video', 'Ни одного пропуска', 'Посмотреть 12 видео недели.', 12, 75],
  ['tgchat', 'social', 'В чате', 'Вступить в Telegram-чат SOL 3:16 Teens. Проверяет бот.', 1, 15],
  ['igsub', 'social', 'Подписчик', 'Подписаться на @sol316teens в Instagram. Подтверждает лидер.', 1, 15],
  ['allin', 'social', 'На связи', 'Быть и в Telegram-чате, и в Instagram.', 2, 10],
  ['profile', 'social', 'Всё о себе', 'Заполнить профиль полностью: день рождения, адрес и контакт родителя.', 1, 30],
  ['friend', 'friends', 'Позвал друга', 'Друг пришёл по твоему приглашению и отметился.', 1, 30],
  ['friend3', 'friends', 'Три друга', 'Привести трёх друзей.', 3, 90],
  ['mygroup', 'friends', 'Своя команда', 'Вступить в малую группу.', 1, 20],
  ['friend5', 'friends', 'Пять друзей', 'Привести пятерых друзей.', 5, 100],
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
// названия книг (Синодальный перевод) → коды для ссылки на bible.com
const BOOKS_ = { 'бытие': 'GEN', 'исход': 'EXO', 'левит': 'LEV', 'числа': 'NUM', 'второзаконие': 'DEU', 'иисус навин': 'JOS', 'иисуса навина': 'JOS', 'судей': 'JDG', 'судьи': 'JDG', 'руфь': 'RUT',
  '1 царств': '1SA', '2 царств': '2SA', '3 царств': '1KI', '4 царств': '2KI', '1 паралипоменон': '1CH', '2 паралипоменон': '2CH', 'ездра': 'EZR', 'ездры': 'EZR', 'неемия': 'NEH', 'неемии': 'NEH', 'есфирь': 'EST', 'иов': 'JOB', 'иова': 'JOB',
  'псалом': 'PSA', 'псалтирь': 'PSA', 'псалмы': 'PSA', 'притчи': 'PRO', 'притчей': 'PRO', 'екклесиаст': 'ECC', 'екклесиаста': 'ECC', 'песнь песней': 'SNG', 'исаия': 'ISA', 'исаии': 'ISA', 'иеремия': 'JER', 'иеремии': 'JER', 'плач иеремии': 'LAM',
  'иезекииль': 'EZK', 'иезекииля': 'EZK', 'даниил': 'DAN', 'даниила': 'DAN', 'осия': 'HOS', 'осии': 'HOS', 'иоиль': 'JOL', 'иоиля': 'JOL', 'амос': 'AMO', 'амоса': 'AMO', 'авдий': 'OBA', 'авдия': 'OBA', 'иона': 'JON', 'ионы': 'JON', 'михей': 'MIC', 'михея': 'MIC',
  'наум': 'NAM', 'наума': 'NAM', 'аввакум': 'HAB', 'аввакума': 'HAB', 'софония': 'ZEP', 'софонии': 'ZEP', 'аггей': 'HAG', 'аггея': 'HAG', 'захария': 'ZEC', 'захарии': 'ZEC', 'малахия': 'MAL', 'малахии': 'MAL',
  'матфея': 'MAT', 'марка': 'MRK', 'луки': 'LUK', 'иоанна': 'JHN', 'деяния': 'ACT', 'деяний': 'ACT', 'иакова': 'JAS', '1 петра': '1PE', '2 петра': '2PE', '1 иоанна': '1JN', '2 иоанна': '2JN', '3 иоанна': '3JN', 'иуды': 'JUD',
  'римлянам': 'ROM', '1 коринфянам': '1CO', '2 коринфянам': '2CO', 'галатам': 'GAL', 'ефесянам': 'EPH', 'филиппийцам': 'PHP', 'колоссянам': 'COL', '1 фессалоникийцам': '1TH', '2 фессалоникийцам': '2TH',
  '1 тимофею': '1TI', '2 тимофею': '2TI', 'титу': 'TIT', 'филимону': 'PHM', 'евреям': 'HEB', 'откровение': 'REV', 'откровения': 'REV' };
function bibleUrl_(ref) {
  const m = /^(.*?)[\s,]+(\d+)/.exec(String(ref || '').trim().toLowerCase().replace(/ё/g, 'е').replace(/[-–]\s*е\b/g, ''));
  const code = m && BOOKS_[m[1].replace(/\s+/g, ' ').trim()];
  return code ? 'https://www.bible.com/bible/143/' + code + '.' + m[2] + '.НРП' : 'https://www.bible.com/search/bible?query=' + encodeURIComponent(ref || '');
}
// план недель и правки заданий: из «Настроек» (plan, weekTasks), иначе — встроенные
let PLANCFG_ = null;
function planCfg_() {
  if (PLANCFG_) return PLANCFG_;
  const st = settings_(); let plan = null, tk = null;
  try { const j = JSON.parse(st.plan || ''); if (Array.isArray(j) && j.length) plan = j; } catch (e) {}
  try { const j = JSON.parse(st.weekTasks || ''); if (j && typeof j === 'object') tk = j; } catch (e) {}
  if (!plan) plan = PLAN.map(p => ({ ref: p[2], title: p[3], verse: p[4] }));
  return (PLANCFG_ = { plan: plan, g: (tk && tk.g) || {}, w: (tk && tk.w) || {} });
}
function weekInfo_(dateStr) {
  const cfg = planCfg_(), n = dnum_(dateStr), mon = n - ((n + 3) % 7), k = Math.round((mon - dnum_(PLAN_START)) / 7);
  const idx = ((k % cfg.plan.length) + cfg.plan.length) % cfg.plan.length, p = cfg.plan[idx];
  return { mon: dstr_(mon), end: dstr_(mon + 6), n: k + 1, idx: idx, ref: p.ref, title: p.title, verse: p.verse, url: bibleUrl_(p.ref) };
}
function weekTaskDefs_(idx) {
  const cfg = planCfg_();
  return WEEK_TASKS.map(t => { const o = Object.assign({}, cfg.g[t[0]] || {}, (cfg.w[idx] || {})[t[0]] || {});
    return { kind: t[0], title: o.title || t[1], desc: o.desc || t[2], pts: o.pts != null && o.pts !== '' ? +o.pts : t[3], btn: t[4] }; });
}
function weekTasks_(w) { return weekTaskDefs_(w.idx).map(t => ({ id: 'W' + w.mon + ':' + t.kind, kind: t.kind, title: t.title, desc: t.desc.replace('{ref}', w.ref).replace('{verse}', w.verse), pts: t.pts, btn: t.btn })); }
function vtask_(id) {
  if (/^V\d{4}-\d{2}-\d{2}$/.test(String(id || ''))) return { id: id, kind: 'video', title: 'Видео недели', pts: VIDEO_PTS, week: String(id).slice(1) };
  const m = /^W(\d{4}-\d{2}-\d{2}):(\w+)$/.exec(String(id || '')); if (!m) return null;
  const w = weekInfo_(m[1]); const t = weekTaskDefs_(w.idx).find(x => x.kind === m[2]); if (!t) return null;
  return { id: id, kind: t.kind, title: t.title + (t.kind === 'verse' ? ' · ' + w.verse : t.kind === 'share' ? ' · ' + w.ref : ''), pts: t.pts, week: w.mon };
}
// ---------- стих дня ----------
// Текст — Синодальный перевод (общественное достояние); кнопка «Читать» открывает главу в YouVersion (НРП).
const VIDEO_PTS = 15, VCOM_PTS = 5;
const VERSES = [
  ['Псалом 118:105', 'PSA.118.105', 'Слово Твое — светильник ноге моей и свет стезе моей.'],
  ['Иоанна 3:16', 'JHN.3.16', 'Ибо так возлюбил Бог мир, что отдал Сына Своего Единородного, дабы всякий верующий в Него, не погиб, но имел жизнь вечную.'],
  ['Филиппийцам 4:13', 'PHP.4.13', 'Все могу в укрепляющем меня Иисусе Христе.'],
  ['Притчи 3:5', 'PRO.3.5', 'Надейся на Господа всем сердцем твоим, и не полагайся на разум твой.'],
  ['Исаия 41:10', 'ISA.41.10', 'Не бойся, ибо Я с тобою; не смущайся, ибо Я Бог твой; Я укреплю тебя, и помогу тебе, и поддержу тебя десницею правды Моей.'],
  ['Иисус Навин 1:9', 'JOS.1.9', 'Вот Я повелеваю тебе: будь тверд и мужествен, не страшись и не ужасайся; ибо с тобою Господь Бог твой везде, куда ни пойдешь.'],
  ['Римлянам 8:28', 'ROM.8.28', 'Притом знаем, что любящим Бога, призванным по Его изволению, все содействует ко благу.'],
  ['Матфея 6:33', 'MAT.6.33', 'Ищите же прежде Царства Божия и правды Его, и это все приложится вам.'],
  ['Матфея 11:28', 'MAT.11.28', 'Придите ко Мне все труждающиеся и обремененные, и Я успокою вас.'],
  ['Псалом 22:1', 'PSA.22.1', 'Господь — Пастырь мой; я ни в чем не буду нуждаться.'],
  ['1 Тимофею 4:12', '1TI.4.12', 'Никто да не пренебрегает юностью твоею; но будь образцом для верных в слове, в житии, в любви, в духе, в вере, в чистоте.'],
  ['Иеремия 29:11', 'JER.29.11', 'Ибо только Я знаю намерения, какие имею о вас, говорит Господь, намерения во благо, а не на зло, чтобы дать вам будущность и надежду.'],
  ['2 Тимофею 1:7', '2TI.1.7', 'Ибо дал нам Бог духа не боязни, но силы и любви и целомудрия.'],
  ['Римлянам 12:2', 'ROM.12.2', 'И не сообразуйтесь с веком сим, но преобразуйтесь обновлением ума вашего, чтобы вам познавать, что есть воля Божия, благая, угодная и совершенная.'],
  ['Иоанна 14:6', 'JHN.14.6', 'Иисус сказал ему: Я есмь путь и истина и жизнь; никто не приходит к Отцу, как только через Меня.'],
  ['1 Иоанна 4:19', '1JN.4.19', 'Будем любить Его, потому что Он прежде возлюбил нас.'],
  ['Филиппийцам 4:6', 'PHP.4.6', 'Не заботьтесь ни о чем, но всегда в молитве и прошении с благодарением открывайте свои желания пред Богом.'],
  ['Евреям 11:1', 'HEB.11.1', 'Вера же есть осуществление ожидаемого и уверенность в невидимом.'],
  ['1 Коринфянам 16:14', '1CO.16.14', 'Все у вас да будет с любовью.'],
  ['Иакова 1:5', 'JAS.1.5', 'Если же у кого из вас недостает мудрости, да просит у Бога, дающего всем просто и без упреков, — и дастся ему.'],
  ['Матфея 5:16', 'MAT.5.16', 'Так да светит свет ваш пред людьми, чтобы они видели ваши добрые дела и прославляли Отца вашего Небесного.'],
  ['Матфея 7:7', 'MAT.7.7', 'Просите, и дано будет вам; ищите, и найдете; стучите, и отворят вам.'],
  ['Римлянам 8:31', 'ROM.8.31', 'Что же сказать на это? Если Бог за нас, кто против нас?'],
  ['1 Петра 5:7', '1PE.5.7', 'Все заботы ваши возложите на Него, ибо Он печется о вас.'],
  ['Ефесянам 2:8', 'EPH.2.8', 'Ибо благодатью вы спасены через веру, и сие не от вас, Божий дар.'],
  ['2 Коринфянам 5:17', '2CO.5.17', 'Итак, кто во Христе, тот новая тварь; древнее прошло, теперь все новое.'],
  ['Псалом 36:4', 'PSA.36.4', 'Утешайся Господом, и Он исполнит желания сердца твоего.'],
  ['Притчи 4:23', 'PRO.4.23', 'Больше всего хранимого храни сердце твое, потому что из него источники жизни.'],
  ['Иоанна 15:5', 'JHN.15.5', 'Я есмь лоза, а вы ветви; кто пребывает во Мне, и Я в нем, тот приносит много плода; ибо без Меня не можете делать ничего.'],
  ['Колоссянам 3:23', 'COL.3.23', 'И все, что делаете, делайте от души, как для Господа, а не для человеков.'],
  ['1 Иоанна 1:9', '1JN.1.9', 'Если исповедуем грехи наши, то Он, будучи верен и праведен, простит нам грехи наши и очистит нас от всякой неправды.'],
  ['Исаия 40:31', 'ISA.40.31', 'А надеющиеся на Господа обновятся в силе: поднимут крылья, как орлы, потекут — и не устанут, пойдут — и не утомятся.'],
  ['Псалом 118:9', 'PSA.118.9', 'Как юноше содержать в чистоте путь свой? — Хранением себя по слову Твоему.'],
  ['Иоанна 16:33', 'JHN.16.33', 'Сие сказал Я вам, чтобы вы имели во Мне мир. В мире будете иметь скорбь; но мужайтесь: Я победил мир.'],
  ['1 Коринфянам 10:31', '1CO.10.31', 'Итак, едите ли, пьете ли, или иное что делаете, все делайте в славу Божию.'],
  ['Евреям 13:8', 'HEB.13.8', 'Иисус Христос вчера и сегодня и во веки Тот же.']
];
const VERSE_START = '2026-11-09';
function verseOf_(date) { const n = VERSES.length, v = VERSES[(((dnum_(date) - dnum_(VERSE_START)) % n) + n) % n];
  return { date: date, ref: v[0], text: v[2], url: 'https://www.bible.com/bible/143/' + v[1] + '.НРП' }; }
function vrows_() { return ss_().getSheetByName('Стих дня') ? rows_('Стих дня') : []; }
function vdate_(p) { const d = String((p && p.date) || today_()); if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || d > today_() || dnum_(today_()) - dnum_(d) > 30) throw new Error('bad_date'); return d; }
function verseOut_(t, date, full, rows) {
  rows = (rows || vrows_()).filter(r => r.date === date);
  const o = verseOf_(date); const likes = rows.filter(r => r.kind === 'like'), com = rows.filter(r => r.kind === 'com');
  o.likes = likes.length; o.liked = likes.some(r => r.teenId === t.id); o.ncom = com.length;
  if (full) { const nm = {}; rows_('Подростки').forEach(x => nm[x.id] = shortName_(x));
    const cl = rows.filter(r => r.kind === 'clike');
    o.com = com.map(r => ({ id: r.id, name: nm[r.teenId] || 'Гость', text: r.text, ts: r.ts, mine: r.teenId === t.id, likes: cl.filter(x => x.text === r.id).length, liked: cl.some(x => x.text === r.id && x.teenId === t.id) }));
    o.past = []; for (let i = 1; i <= 6; i++) { const d = dstr_(dnum_(today_()) - i); o.past.push({ date: d, ref: verseOf_(d).ref }); } }
  return o;
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
    invited: by(teens.filter(t => t.invitedBy), 'invitedBy'),
    vcom: by(vrows_().filter(r => r.kind === 'com'), 'teenId')
  };
}
function score_(t, C, full) {
  const att = C.att[t.id] || [], done = C.done[t.id] || [], aw = C.awards[t.id] || [], lg = C.logins[t.id] || [];
  const log = []; let pts = 0, month = 0;
  const add = (what, date, p) => { pts += p; if (date && date.slice(0, 7) === C.month) month += p; if (full) log.push({ what, date, pts: p }); };
  att.forEach(a => add(a.kind === 'event' ? 'Событие' : a.kind === 'group' ? 'Малая группа' : 'Встреча', a.date, a.kind === 'event' ? 15 : 10));
  done.filter(counted_).forEach(d => { const k = C.tasks[d.taskId] || vtask_(d.taskId); if (k) add('Задание: ' + k.title, d.date, +k.pts || 0); });
  Array.from(new Set((C.vcom[t.id] || []).map(r => r.date))).sort().forEach(d => add('Комментарий к стиху дня', d, VCOM_PTS));
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
  const wkBy = {}; done.filter(counted_).forEach(d => { const m = /^W(\d{4}-\d{2}-\d{2}):(\w+)$/.exec(String(d.taskId || '')); if (m) (wkBy[m[1]] = wkBy[m[1]] || new Set()).add(m[2]); });
  const wkMons = Object.keys(wkBy).map(dnum_).sort((a, b) => a - b); let wkBest = 0, wkRun = 0; wkMons.forEach((w, i) => { wkRun = i && w - wkMons[i - 1] === 7 ? wkRun + 1 : 1; wkBest = Math.max(wkBest, wkRun); });
  const vidMons = Array.from(new Set(done.filter(d => /^V\d{4}-\d{2}-\d{2}$/.test(String(d.taskId || ''))).map(d => dnum_(String(d.taskId).slice(1))))).sort((a, b) => a - b);
  let vidBest = 0, vidRun = 0; vidMons.forEach((w, i) => { vidRun = i && w - vidMons[i - 1] === 7 ? vidRun + 1 : 1; vidBest = Math.max(vidBest, vidRun); });
  const wkAll = Object.keys(wkBy).some(k => wkBy[k].size >= WEEK_TASKS.length) ? 1 : 0;
  const manual = id => aw.filter(a => a.badge === id).length;
  const friends = (C.invited[t.id] || []).filter(f => (C.att[f.id] || []).length).length + manual('friend');
  const visitedGroups = new Set(att.filter(a => a.kind === 'group').map(a => a.meetId));
  const have = {
    first: att.length, m5: att.length, m10: att.length, m25: att.length, m50: att.length, m100: att.length,
    w4: best, w8: best, w12: best, w20: best, team: att.filter(a => a.kind === 'group').length,
    d3: dBest, d7: dBest, d14: dBest, d30: dBest, d100: dBest,
    b1: cntKind('read'), book: cntKind('read'), verse: cntKind('verse'),
    tgchat: t.tgChat === '1' ? 1 : 0, igsub: t.igStatus === 'ok' ? 1 : 0, allin: (t.tgChat === '1' ? 1 : 0) + (t.igStatus === 'ok' ? 1 : 0),
    profile: profileLeft_(t).length ? 0 : 1, wkall: wkAll, wk3: wkBest, wk6: wkBest, vid1: vidMons.length, vid4: vidBest, vid12: vidMons.length,
    friend: friends, friend3: friends, friend5: friends, mygroup: String(t.groups || '').split(',').filter(Boolean).length ? 1 : 0, party: att.filter(a => a.kind === 'event').length,
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
const sgOut_ = g => ({ id: g.id, name: g.name, leader: g.leader || '', day: +g.day, time: g.time, addr: g.addr || '', contact: g.contact || '' });
const shortName_ = t => (t.first + ' ' + (t.last ? t.last.charAt(0) + '.' : '')).trim();
const TA_ = {
  me(t) {
    if (!rows_('Входы').some(l => l.teenId === t.id && l.date === today_())) lock_(() => append_('Входы', { teenId: t.id, date: today_() }));
    const C = loadCtx_(); const me = C.teens.find(x => x.id === t.id) || t;
    const sc = score_(me, C, true);
    const all = C.teens.map(x => { const s = x.id === t.id ? sc : score_(x, C, false); return { id: x.id, name: shortName_(x), pts: s.pts, month: s.month }; });
    const ldr = {}; C.teens.forEach(x => { if (x.isLeader === '1' && x.id !== t.id) ldr[x.id] = 1; });
    const top = key => all.filter(x => x[key] > 0 && !ldr[x.id]).sort((a, b) => b[key] - a[key]).map((x, i) => ({ place: i + 1, name: x.name, pts: x[key], me: x.id === t.id }));
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
      sg: { mine: C.groups.filter(g => groups.indexOf(g.id) >= 0).map(sgOut_), all: groups.length ? [] : C.groups.map(sgOut_),
        req: (() => { const r = greqs_().filter(x => x.teenId === t.id).pop(); return r && r.status !== 'ok' ? { groupId: r.groupId, status: r.status } : null; })() },
      invite: { link: APP_URL + 'join/?by=' + me.id, came: (C.invited[t.id] || []).filter(f => (C.att[f.id] || []).length).length,
        list: invites_().filter(x => x.by === t.id).map(x => ({ name: (x.first + ' ' + String(x.last || '').charAt(0) + '.').trim(), status: x.status, date: x.date })).reverse().slice(0, 30) },
      ig: { link: IG_LINK, status: me.igStatus || '', nick: me.ig || '' },
      verse: verseOut_(t, C.today, true),
      vid: (C.done[t.id] || []).filter(d => /^V\d/.test(String(d.taskId || ''))).map(d => String(d.taskId).slice(1)), vidPts: VIDEO_PTS, vcomPts: VCOM_PTS,
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
  groupReq(t, p) {
    ensure_('Заявки');
    const g = rows_('Группы').find(x => x.id === p.groupId && x.active !== '0'); if (!g) throw new Error('bad_group');
    const me = rows_('Подростки').find(x => x.id === t.id); if (me && String(me.groups || '').split(',').filter(Boolean).length) throw new Error('has_group');
    const r = rows_('Заявки').find(x => x.teenId === t.id && x.status === 'pending');
    if (r) update_('Заявки', r, { groupId: g.id, date: today_() }); else append_('Заявки', { id: uid_('Q'), teenId: t.id, groupId: g.id, date: today_(), status: 'pending', by: '' });
    return true;
  },
  weekDone(t, p) {
    const k = weekTasks_(weekInfo_(today_())).find(x => x.id === p.id); if (!k) throw new Error('bad_task');
    const hit = rows_('Выполнения').filter(d => d.taskId === k.id && d.teenId === t.id);
    if (!hit.length) append_('Выполнения', { taskId: k.id, teenId: t.id, date: today_(), by: 'self', status: 'pending' });
    else if (hit[0].status === 'no') update_('Выполнения', hit[0], { status: 'pending', date: today_(), by: 'self' });
    return true;
  },
  verse(t, p) { return verseOut_(t, vdate_(p), true); },
  verseLike(t, p) {
    const d = vdate_(p); ensure_('Стих дня');
    lock_(() => { const hit = rows_('Стих дня').filter(r => r.date === d && r.kind === 'like' && r.teenId === t.id);
      if (hit.length) delete_('Стих дня', hit.map(h => h._row)); else append_('Стих дня', { id: uid_('L'), date: d, teenId: t.id, kind: 'like', text: '', ts: nowIso_() }); });
    return verseOut_(t, d, true);
  },
  vcLike(t, p) {
    const c = vrows_().find(r => r.id === p.id && r.kind === 'com'); if (!c) throw new Error('not_found');
    lock_(() => { const hit = rows_('Стих дня').filter(r => r.kind === 'clike' && r.text === c.id && r.teenId === t.id);
      if (hit.length) delete_('Стих дня', hit.map(h => h._row)); else append_('Стих дня', { id: uid_('K'), date: c.date, teenId: t.id, kind: 'clike', text: c.id, ts: nowIso_() }); });
    return verseOut_(t, c.date, true);
  },
  verseCom(t, p) {
    const d = vdate_(p), text = String(p.text || '').replace(/\s+/g, ' ').trim().slice(0, 300); if (!text) throw new Error('empty');
    ensure_('Стих дня');
    if (rows_('Стих дня').filter(r => r.date === d && r.kind === 'com' && r.teenId === t.id).length >= 10) throw new Error('Слишком много комментариев за день');
    append_('Стих дня', { id: uid_('M'), date: d, teenId: t.id, kind: 'com', text: text, ts: nowIso_() });
    return verseOut_(t, d, true);
  },
  videoDone(t, p) {
    const mon = String(p.mon || ''), w = weekInfo_(today_()).mon;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(mon) || mon > w || (dnum_(mon) + 3) % 7 !== 0) throw new Error('bad_week');
    if (!rows_('Выполнения').some(d => d.taskId === 'V' + mon && d.teenId === t.id)) append_('Выполнения', { taskId: 'V' + mon, teenId: t.id, date: today_(), by: 'self' });
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
