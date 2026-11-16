import re
from common import *
SRC='/tmp/claude-0/-home-claude/c7e849ba-ea5c-56e6-bfd9-536391e688a4/scratchpad/ds/project/Main.dc.html'
b=blobs(inner(SRC))
def rep(a,n,count=1):
    global b
    assert b.count(a)==count,(b.count(a),a[:80]); b=b.replace(a,n)
# lang switch
i=b.index('<div style="display: flex; gap: 2px; padding: 4px; background: #15171B; border: 1px solid #2A2D35; border-radius: 999px">'); j=b.index('</div>',i)+6
b=b[:i]+LANGHTML+b[j:]
# nav links → class
rep('<div style="display: flex; align-items: center; gap: 4px; flex-wrap: wrap">','<div class="navlinks" style="display: flex; align-items: center; gap: 4px; flex-wrap: wrap">')
# flips
for k in ['wed','fri']:
    rep('transition: transform 0.6s; transform: {{%s.t}}"'%k,'transition: transform 0.6s" data-flip="%s"'%k)
    rep('onClick="{{%s.flip}}"'%k,'data-flipbtn="%s"'%k,2)
rep('onClick="{{prev}}"','data-move="-1"',2); rep('onClick="{{next}}"','data-move="1"',2)
# chips
def chips(prefix,attr):
    global b
    pat=re.compile(r'<button type="button" onClick="\{\{%s\.(\w+)\.pick\}\}"[^>]*>([^<]*)</button>'%prefix)
    b,n=pat.subn(lambda m:'<button type="button" class="chip" data-%s="%s">%s</button>'%(attr,m.group(1),m.group(2)),b); return n
assert chips('f','f')==5 and chips('g','g')==3
b,n=re.subn(r'<div style="display: flex; flex-wrap: wrap; gap: 8px">(<button type="button" class="chip")',r'<div class="chips" style="display: flex; flex-wrap: wrap; gap: 8px">\1',b); assert n==2,n
rep('<div style="display: flex; flex-wrap: wrap; gap: 12px">\n      <a href="#events"','<div class="herobtns" style="display: flex; flex-wrap: wrap; gap: 12px">\n      <a href="#events"')
# sc-if → wrappers
b,n1=re.subn(r'<sc-if value="\{\{show\.(\w+)\}\}"[^>]*>',lambda m:'<div data-cat="%s" style="display: contents">'%m.group(1),b)
b,n2=re.subn(r'<sc-if value="\{\{gshow\.(\w+)\}\}"[^>]*>',lambda m:'<div data-gcat="%s" style="display: contents">'%m.group(1),b)
assert (n1,n2)==(4,3); b=b.replace('</sc-if>','</div>'); assert '{{' not in b, re.findall(r'\{\{[^}]*\}\}',b)
# links
rep('href="Event.dc.html"','href="/xmas26/"',2); rep('href="Fall.dc.html"','href="/fall26/"')
rep('href="#top"','href="/"')
# small groups: real data
rep('<span style="font-weight: 600; font-size: 15px">[АДРЕС ГРУППЫ]</span>','<a href="https://maps.google.com/?q=7457+Walnut+Road,+CA" target="_blank" rel="noopener" style="font-weight: 600; font-size: 15px">7457 Walnut Road</a>')
m=re.search(r'<a href="#week" (style="[^"]*")>\[ТЕЛЕФОН\]</a>',b); assert m
b=b.replace(m.group(0),'<a href="tel:+19165595882" %s>Позвонить</a>'%m.group(1))
m=re.search(r'<a href="https://t\.me/\+P1QV3wSylSQyNDFi" (style="[^"]*")>Написать</a>',b); assert m
b=b.replace(m.group(0),'<a href="https://t.me/pabeloglazov" target="_blank" rel="noopener" %s>Написать</a>'%m.group(1))
b,n=re.subn(r'<a href="#week" (style="[^"]*")>Записаться</a>',r'<a href="/app/me/" \1>Записаться</a>',b); assert n==2
rep('href="https://maps.google.com/?q=5357+Hidden+Glen+Dr,+Rocklin,+CA+95677"','href="https://maps.google.com/?q=5357+Hidden+Glen+Dr,+Rocklin,+CA+95677" target="_blank" rel="noopener"')
# small groups v2: без адреса, одна кнопка «Написать лидеру»
b,n=re.subn(r'\s*<div style="display: flex; flex-direction: column; gap: 2px"><span style="font-size: 12px; font-weight: 600; color: #A1A1AA">Адрес</span>.*?</div>','',b,flags=re.S); assert n==2,n
BTN='<a href="%s" target="_blank" rel="noopener" style="margin-top: auto; display: flex; align-items: center; justify-content: center; height: 52px; border-radius: 14px; background: #FF8A3D; color: #0E0F12; text-decoration: none; font-weight: 700; font-size: 16px">Написать лидеру</a>'
rows=list(re.finditer(r'<div style="margin-top: auto; display: flex; gap: 8px">.*?</div>',b,flags=re.S)); assert len(rows)==2
for m,u in reversed(list(zip(rows,['sms:+19165595882','https://t.me/pabeloglazov']))): b=b[:m.start()]+BTN%u+b[m.end():]
rep('Адрес, лидер и запись','Лидер и контакт',2)
# stanford: one photo opens large
m=re.search(r'<a href="#past" (style="[^"]*")>Смотреть</a>',b); assert m
b=b.replace(m.group(0),'<a href="/media/stanford.jpg" data-zoom="/media/stanford.jpg" %s>Смотреть</a>'%m.group(1))
# external links new tab
for u in ['https://t.me/+P1QV3wSylSQyNDFi','https://www.instagram.com/sol316teens/','https://www.solsacramento.com/','https://maps.google.com/?q=5948+Pecan+Ave,+Orangevale,+CA+95662']:
    b=b.replace('href="%s" style'%u,'href="%s" target="_blank" rel="noopener" style'%u)
# responsive hooks
b=b.replace('width: min(78%, 860px)','width: var(--cw)').replace('width: min(70%, 520px)','width: var(--gw)').replace('aspect-ratio: 9 / 4','aspect-ratio: var(--ar)')
rep('TEENS <span style="color: #10231A;','TEENS <br class="mbr"><span style="color: #10231A;')
b=b.replace('<img ','<img loading="lazy" decoding="async" ').replace('<img loading="lazy" decoding="async" src="/app/icons/icon-192.png"','<img src="/app/icons/icon-192.png"')
b=b.replace('data-railwrap="1"','data-railwrap')

# ===== v3 (правки 16.11): баннер-ссылка с календариком, Small Group без переворота, анимация hero, ничего не прыгает при смене языка =====
FL='<path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7"></path><path d="M12 5l-2-2M12 5l2-2M12 19l-2 2M12 19l2 2M6 8.5L3.4 9.4M6 8.5L5.4 5.8M18 15.5l2.6-.9M18 15.5l.6 2.7M6 15.5l-2.6-.9M6 15.5l-.6 2.7M18 8.5l2.6.9M18 8.5l.6-2.7"></path>'
def fl(st): return '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" style="position: absolute; %s">%s</svg>'%(st,FL)
i=b.index('<div style="position: relative; overflow: hidden; background: #10231A; border: 1px solid #1F7A46;'); j=b.index('<!-- WEEK -->'); j=b.rindex('</div>',0,j)
BAN='''<a class="xban" href="/xmas26/">
    '''+fl('left: 46%; top: 16%; width: 44px; height: 44px; color: #F4F4F5; opacity: 0.3')+fl('left: 62%; bottom: 30%; width: 96px; height: 96px; color: #EF4444; opacity: 0.4')+fl('left: 30%; bottom: 34%; width: 34px; height: 34px; color: #4ADE80; opacity: 0.35')+'''
    <div class="candy" aria-hidden="true"></div>
    <div class="xtxt">
      <span class="xtag">CHRISTMAS EDITION</span>
      <h3>TEENS <br class="mbr"><span>PARTY</span></h3>
    </div>
    <div class="xcal" role="img" aria-label="December 19"><span class="m">DEC</span><span class="d">19</span></div>
    <span class="xbtn">Зарегистрироваться</span>
  </a>
'''
b=b[:i]+BAN+b[j:]
PH='<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"></path></svg>'
def sg(day,time,leader,msg,tel,ext):
    return '''<div class="sg">
      <span class="sgd">%s</span>
      <span class="sgn">Small Group</span>
      <span class="sgt">%s</span>
      <span class="sgl">%s</span>
      <div class="sgb"><a class="sgw" href="%s"%s>Написать лидеру</a><a class="sgp" href="tel:%s" aria-label="Позвонить лидеру">%s</a></div>
    </div>
    '''%(day,time,leader,msg,' target="_blank" rel="noopener"' if ext else '',tel,PH)
i=b.index('<div style="flex: 1 1 260px; min-width: 0; height: 300px; perspective: 1200px">'); j=b.index('<div style="flex: 1 1 260px; min-width: 0; background: #1C140F; border: 1px solid #FF8A3D;')
b=b[:i]+sg('СРЕДА','6:00 PM','Tima','sms:+19165595882','+19165595882',0)+sg('ПЯТНИЦА','7:00 PM','Pasha','https://t.me/pabeloglazov','+12797592990',1)+b[j:]
assert 'data-flip' not in b
rep('Подростковое служение русскоязычного потока SOL Church','Подростковое служение SOL RU')
b=b.replace('OCT 20','OCT 17')  # дата поездки в Стенфорд — как в Check-in (2026-10-17)
rep('line-height: 0.86; letter-spacing: -0.04em">3:16<br><span style="color: #0E0F12; -webkit-text-stroke: 2px #F4F4F5">TEENS</span></h1>','line-height: 0.86; letter-spacing: -0.04em" class="hero" aria-label="3:16 TEENS"><span class="hl1" aria-hidden="true"><i>3</i><i>:</i><i>1</i><i>6</i></span><span class="hl2" aria-hidden="true">TEENS</span></h1>')
rep('font-size: clamp(64px, 12vw, 168px); line-height: 0.86; letter-spacing: -0.04em" class="hero"','font-size: 0; line-height: 0" class="hero"')
rep('<p style="margin: 0; max-width: 540px; font-size: 19px; line-height: 1.5; color: #D4D4D8; width: 747px">','<p class="lead" style="margin: 0; font-size: 19px; line-height: 1.5; color: #D4D4D8">')
rep('<div style="max-width: 1200px; margin: 0 auto; padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap">','<div class="nav">')
css=''':root{--cw:min(78%,860px);--gw:min(70%,520px);--ar:9 / 4}
@media (max-width:720px){:root{--cw:88%;--gw:82%;--ar:3 / 2}.navlinks{display:none!important}.mbr{display:inline}}
[data-flip]{transform:rotateY(0deg)}[data-flip].on{transform:rotateY(180deg)}
#gallery [data-rail] img{cursor:zoom-in}
.chip{flex:none;white-space:nowrap}
.nav{max-width:1200px;margin:0 auto;padding:20px 24px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:20px}
.nav>:last-child{justify-self:end}
.herobtns a{min-width:230px}
.xban{position:relative;overflow:hidden;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:28px 24px;background:#10231A;border:1px solid #1F7A46;border-radius:24px;padding:clamp(34px,5vw,56px) clamp(22px,5vw,56px) clamp(22px,4vw,40px);color:#F4F4F5!important;text-decoration:none;transition:border-color .2s ease,transform .2s ease}
.xban:hover{border-color:#4ADE80;transform:translateY(-2px)}.xban:hover .xbtn{filter:brightness(1.1)}
.xban .candy{position:absolute;left:0;right:0;top:0;height:10px;background:repeating-linear-gradient(135deg,#EF4444 0 18px,#F4F4F5 18px 36px,#1F7A46 36px 54px)}
.xtxt{position:relative;display:flex;flex-direction:column;gap:18px;min-width:0}
.xtag{align-self:flex-start;white-space:nowrap;background:#EF4444;color:#0E0F12;font:700 13px Unbounded,sans-serif;letter-spacing:.08em;padding:9px 16px;border-radius:999px;transform:rotate(-3deg)}
.xban h3{margin:0;font:900 clamp(40px,7vw,96px)/.9 Unbounded,sans-serif;letter-spacing:-.03em}
.xban h3 span{color:#10231A;-webkit-text-stroke:2px #F4F4F5}
.xcal{position:relative;width:clamp(84px,12vw,148px);border-radius:18px;overflow:hidden;background:#FBF7EE;color:#0E0F12;text-align:center;transform:rotate(4deg);box-shadow:0 14px 30px rgba(0,0,0,.35)}
.xcal .m{display:block;background:#DC2626;color:#FBF7EE;font:700 clamp(14px,2vw,22px)/1 Unbounded,sans-serif;letter-spacing:.1em;padding:clamp(8px,1.1vw,13px) 0}
.xcal .d{display:block;font:900 clamp(40px,6.4vw,80px)/1 Unbounded,sans-serif;letter-spacing:-.04em;padding:clamp(8px,1.2vw,16px) 0 clamp(10px,1.5vw,20px)}
.xbtn{position:relative;grid-column:1 / -1;display:flex;align-items:center;justify-content:center;height:64px;border-radius:16px;background:#EF4444;color:#0E0F12;font:700 18px Inter,sans-serif}
.sg{flex:1 1 260px;min-width:0;background:#15171B;border:1px solid #2A2D35;border-radius:20px;padding:24px;display:flex;flex-direction:column;gap:10px}
.sgd{font-weight:700;font-size:12px;letter-spacing:.14em;color:#A1A1AA}
.sgn{font:700 26px Unbounded,sans-serif}.sgt{font:700 20px Unbounded,sans-serif;color:#FF8A3D}
.sgl{color:#D4D4D8;font-size:14px}
.sgb{margin-top:18px;display:flex;gap:10px}
.sgw{flex:1;min-width:0;display:flex;align-items:center;justify-content:center;height:58px;border-radius:16px;background:#FF8A3D;color:#0E0F12!important;text-decoration:none;font-weight:700;font-size:17px;white-space:nowrap}
.sgp{flex:none;width:58px;height:58px;display:flex;align-items:center;justify-content:center;border-radius:16px;border:1px solid #FF8A3D;color:#FF8A3D!important}
.sgw,.sgp{transition:filter .15s ease,transform .15s ease}.sgw:hover,.sgp:hover{filter:brightness(1.12)}.sgw:active,.sgp:active{transform:scale(.97)}
/* «3:16 TEENS» во всю ширину: на компьютере одной строкой, на телефоне двумя — размер подгоняет скрипт */
.hero{white-space:nowrap}.hero .hl1,.hero .hl2{font-size:min(13.4vw,161px);line-height:.9;letter-spacing:-.04em;vertical-align:top}
.hero .hl1{display:inline-block;overflow:hidden;padding:.06em .04em .02em 0;margin:-.06em .2em -.02em 0}
.hero .hl1 i{display:inline-block;font-style:normal;transform:translateY(110%);animation:hup .7s cubic-bezier(.2,.8,.2,1) forwards}
.hero .hl1 i:nth-child(2){animation-delay:.07s}.hero .hl1 i:nth-child(3){animation-delay:.14s}.hero .hl1 i:nth-child(4){animation-delay:.21s}
.hero .hl2{display:inline-block;color:transparent;-webkit-text-stroke:2px #F4F4F5;opacity:0;animation:hin .7s .35s ease forwards}
@keyframes hup{to{transform:translateY(0)}}
@keyframes hin{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.hero .hl1 i{transform:none}.hero .hl2{opacity:1}}
@media (max-width:720px){.nav{grid-template-columns:1fr auto}.xban{align-items:start}.xcal{border-radius:14px}.xbtn{height:58px;font-size:17px}.xtag{font-size:11px;padding:8px 12px}.herobtns a{flex:1 1 100%;min-width:0}.hero .hl1,.hero .hl2{display:block;width:max-content}.hero .hl1{font-size:36vw;margin-right:0}.hero .hl2{font-size:21.5vw;margin-top:.06em}.lead{font-size:17px!important;min-height:3em}[data-move]{display:none!important}.chips{flex-wrap:nowrap!important;overflow-x:auto;scrollbar-width:none;margin:0 -24px;padding:0 24px;-webkit-overflow-scrolling:touch}.chips::-webkit-scrollbar{display:none}}'''
TR={
'Подростковое служение SOL RU':['SOL RU youth ministry','Підліткове служіння SOL RU'],
'События':['Events','Події'],'Встречи':['Meetings','Зустрічі'],'Фото':['Photos','Фото'],'Контакты':['Contacts','Контакти'],
'Ближайшее событие':['Next event','Найближча подія'],'Наши встречи':['Our events','Наші зустрічі'],'Скоро':['Coming up','Незабаром'],
'Зарегистрироваться':['Register','Зареєструватися'],'Каждую неделю':['Every week','Щотижня'],
'СРЕДА':['WEDNESDAY','СЕРЕДА'],'ПЯТНИЦА':['FRIDAY','ПʼЯТНИЦЯ'],'ВОСКРЕСЕНЬЕ':['SUNDAY','НЕДІЛЯ'],
'СРЕДА · 6:00 PM':['WEDNESDAY · 6:00 PM','СЕРЕДА · 6:00 PM'],'ПЯТНИЦА · 7:00 PM':['FRIDAY · 7:00 PM','ПʼЯТНИЦЯ · 7:00 PM'],
'Позвонить лидеру':['Call the leader','Подзвонити лідеру'],'Написать лидеру':['Message the leader','Написати лідеру'],'Лидер':['Leader','Лідер'],'Адрес':['Address','Адреса'],
'Написать':['Message','Написати'],'Позвонить':['Call','Подзвонити'],'Записаться':['Sign up','Записатися'],
'Повернуть карточку обратно':['Flip the card back','Повернути картку назад'],
'Все':['All','Усі'],'Пати':['Parties','Паті'],'Выезды':['Trips','Виїзди'],'Праздники':['Holidays','Свята'],
'УЖЕ ПРОШЛО':['ALREADY HAPPENED','ВЖЕ МИНУЛО'],'Смотреть':['View','Дивитися'],'Стенфорд':['Stanford','Стенфорд'],
'Фото появятся здесь после пати':['Photos will show up here after the party','Фото зʼявляться тут після паті'],
'Пока пусто':['Nothing here yet','Поки порожньо'],'Здесь появятся фото, когда добавим первое событие в этот раздел.':['Photos will appear here once we add the first event to this section.','Тут зʼявляться фото, коли додамо першу подію до цього розділу.'],
'Галерея':['Gallery','Галерея'],'Все события':['All events','Усі події'],'Стенфорд · OCT 17':['Stanford · OCT 17','Стенфорд · OCT 17'],
'Предыдущая встреча':['Previous event','Попередня зустріч'],'Следующая встреча':['Next event','Наступна зустріч'],'Предыдущие фото':['Previous photos','Попередні фото'],'Следующие фото':['Next photos','Наступні фото'],
'Чат 3:16 TEENS':['3:16 TEENS chat','Чат 3:16 TEENS'],'Где мы':['Find us','Де ми'],
'3:16 TEENS · подростковое служение SOL Church':['3:16 TEENS · SOL Church youth ministry','3:16 TEENS · підліткове служіння SOL Church'],
}
js='''
(function(){
  function $$(s,r){ return [].slice.call((r||document).querySelectorAll(s)); }
  $$('[data-flipbtn]').forEach(function(b){ b.addEventListener('click', function(){ var c=document.querySelector('[data-flip="'+b.getAttribute('data-flipbtn')+'"]'); c.classList.toggle('on'); }); });
  $$('[data-move]').forEach(function(b){ b.addEventListener('click', function(){ var r=b.closest('[data-railwrap]').querySelector('[data-rail]'); r.scrollBy({left:(+b.getAttribute('data-move'))*r.clientWidth*0.8, behavior:'smooth'}); }); });
  function filt(attr, catAttr, rule){ var btns=$$('['+attr+']');
    function set(k){ btns.forEach(function(b){ var on=b.getAttribute(attr)===k; b.classList.toggle('on',on); b.setAttribute('aria-pressed',on); });
      $$('['+catAttr+']').forEach(function(w){ w.style.display = rule(k, w.getAttribute(catAttr)) ? 'contents' : 'none'; });
      var r=btns[0].closest('[data-railwrap]').querySelector('[data-rail]'); r.scrollLeft=0; }
    btns.forEach(function(b){ b.addEventListener('click', function(){ set(b.getAttribute(attr)); }); }); set('all'); }
  filt('data-f','data-cat', function(k,c){ return c==='empty' ? (k==='meet'||k==='holiday') : (k==='all'||k===c); });
  filt('data-g','data-gcat', function(k,c){ return k==='all'||k===c; });
  /* «3:16 TEENS» ровно во всю ширину блока */
  (function(){ var h=document.querySelector('.hero'); if(!h) return; var a=h.querySelector('.hl1'), b=h.querySelector('.hl2');
    function fit(){ var W=h.clientWidth-2, mob=window.innerWidth<=720; a.style.fontSize=b.style.fontSize='100px';
      var wa=a.getBoundingClientRect().width, wb=b.getBoundingClientRect().width;
      if(mob){ a.style.fontSize=(100*W/wa)+'px'; b.style.fontSize=(100*W/wb)+'px'; }
      else { var fs=100*W/(wa+wb+20); a.style.fontSize=b.style.fontSize=fs+'px'; } }
    fit(); if(document.fonts&&document.fonts.ready) document.fonts.ready.then(fit); window.addEventListener('resize', fit); window.addEventListener('load', fit); })();
  /* lightbox */
  var lb=document.getElementById('lb'), im=document.getElementById('lbImg'), list=[], cur=0;
  function show(){ im.src=list[cur]; document.getElementById('lbC').textContent = list.length>1 ? (cur+1)+' / '+list.length : ''; lb.querySelector('.pv').hidden=lb.querySelector('.nx').hidden=list.length<2; }
  function open(l,i){ list=l; cur=i; show(); lb.classList.add('on'); lb.setAttribute('aria-hidden','false'); }
  function close(){ lb.classList.remove('on'); lb.setAttribute('aria-hidden','true'); }
  function go(d){ cur=(cur+d+list.length)%list.length; show(); }
  $$('[data-zoom]').forEach(function(a){ a.addEventListener('click', function(e){ e.preventDefault(); open([a.getAttribute('data-zoom')],0); }); });
  var grail=document.querySelector('#gallery [data-rail]');
  function full(x){ return x.getAttribute('data-full')||x.currentSrc||x.src; }
  grail.addEventListener('click', function(e){ var g=e.target; if(g.tagName!=='IMG') return; var vis=$$('img',grail).filter(function(x){ return x.offsetParent!==null; }); open(vis.map(full), vis.indexOf(g)); });
  /* вся галерея TEENS PARTY: догружается по мере листания */
  var rest=[], tpw=$$('[data-gcat="tp"]',grail).pop(), tpl=tpw.lastElementChild;
  function more(n){ rest.splice(0,n).forEach(function(f){ var c=tpl.cloneNode(true), g=c.querySelector('img'); g.alt=''; g.src='/fall26/t/'+f+'.webp'; g.setAttribute('data-full','/fall26/p/'+f+'.webp'); tpw.appendChild(c); }); }
  grail.addEventListener('scroll', function(){ if(rest.length && grail.scrollLeft+grail.clientWidth*3>grail.scrollWidth) more(12); }, {passive:true});
  fetch('/fall26/photos.json').then(function(r){ return r.json(); }).then(function(d){ var have=$$('img',grail).map(function(x){ return x.getAttribute('src'); }).join(' '); rest=d.map(function(x){ return x.f; }).filter(function(f){ return have.indexOf(f)<0; }); more(12); }).catch(function(){});
  lb.querySelector('.x').addEventListener('click', close); lb.querySelector('.pv').addEventListener('click', function(){ go(-1); }); lb.querySelector('.nx').addEventListener('click', function(){ go(1); });
  lb.addEventListener('click', function(e){ if(e.target===lb) close(); });
  document.addEventListener('keydown', function(e){ if(!lb.classList.contains('on')) return; if(e.key==='Escape') close(); if(e.key==='ArrowLeft') go(-1); if(e.key==='ArrowRight') go(1); });
  var x0=null; lb.addEventListener('touchstart', function(e){ x0=e.touches[0].clientX; }, {passive:true});
  lb.addEventListener('touchend', function(e){ if(x0===null) return; var dx=e.changedTouches[0].clientX-x0; if(Math.abs(dx)>40 && list.length>1) go(dx<0?1:-1); x0=null; });
})();
'''
LB='<div class="lb" id="lb" aria-hidden="true"><img id="lbImg" alt=""><button type="button" class="x" aria-label="Close">×</button><button type="button" class="pv" aria-label="Previous">‹</button><button type="button" class="nx" aria-label="Next">›</button><div class="cnt" id="lbC"></div></div>'
html=HEAD%dict(title='3:16 TEENS · SOL Church',desc='3:16 TEENS — подростковое служение SOL RU: TEENS PARTY, small groups, фото.',extra='',bg='#0E0F12',css=css)+b+'\n'+LB+'\n<script>'+js+i18n(TR)+'</script>\n</body>\n</html>\n'
html=html.replace('href="sms:+19165595882" target="_blank" rel="noopener"','href="sms:+19165595882"')
open('/home/claude/teensparty/index.html','w').write(html); print(len(html))
