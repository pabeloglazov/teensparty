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
css=''':root{--cw:min(78%,860px);--gw:min(70%,520px);--ar:9 / 4}
@media (max-width:720px){:root{--cw:88%;--gw:82%;--ar:3 / 2}.navlinks{display:none!important}.mbr{display:inline}}
[data-flip]{transform:rotateY(0deg)}[data-flip].on{transform:rotateY(180deg)}
#gallery [data-rail] img{cursor:zoom-in}
.chip{flex:none;white-space:nowrap}
@media (max-width:720px){.herobtns a{flex:1 1 100%}#top p{max-width:100%!important;width:auto!important}.chips{flex-wrap:nowrap!important;overflow-x:auto;scrollbar-width:none;margin:0 -24px;padding:0 24px;-webkit-overflow-scrolling:touch}.chips::-webkit-scrollbar{display:none}}'''
TR={
'Подростковое служение русскоязычного потока SOL Church':['Youth ministry of the Russian-speaking stream of SOL Church','Підліткове служіння російськомовного потоку SOL Church'],
'События':['Events','Події'],'Встречи':['Meetings','Зустрічі'],'Фото':['Photos','Фото'],'Контакты':['Contacts','Контакти'],
'Ближайшее событие':['Next event','Найближча подія'],'Наши встречи':['Our events','Наші зустрічі'],'Скоро':['Coming up','Незабаром'],
'Зарегистрироваться':['Register','Зареєструватися'],'Каждую неделю':['Every week','Щотижня'],
'СРЕДА':['WEDNESDAY','СЕРЕДА'],'ПЯТНИЦА':['FRIDAY','ПʼЯТНИЦЯ'],'ВОСКРЕСЕНЬЕ':['SUNDAY','НЕДІЛЯ'],
'СРЕДА · 6:00 PM':['WEDNESDAY · 6:00 PM','СЕРЕДА · 6:00 PM'],'ПЯТНИЦА · 7:00 PM':['FRIDAY · 7:00 PM','ПʼЯТНИЦЯ · 7:00 PM'],
'Лидер и контакт':['Leader and contact','Лідер і контакт'],'Написать лидеру':['Message the leader','Написати лідеру'],'Лидер':['Leader','Лідер'],'Адрес':['Address','Адреса'],
'Написать':['Message','Написати'],'Позвонить':['Call','Подзвонити'],'Записаться':['Sign up','Записатися'],
'Повернуть карточку обратно':['Flip the card back','Повернути картку назад'],
'Все':['All','Усі'],'Пати':['Parties','Паті'],'Выезды':['Trips','Виїзди'],'Праздники':['Holidays','Свята'],
'УЖЕ ПРОШЛО':['ALREADY HAPPENED','ВЖЕ МИНУЛО'],'Смотреть':['View','Дивитися'],'Стенфорд':['Stanford','Стенфорд'],
'Фото появятся здесь после пати':['Photos will show up here after the party','Фото зʼявляться тут після паті'],
'Пока пусто':['Nothing here yet','Поки порожньо'],'Здесь появятся фото, когда добавим первое событие в этот раздел.':['Photos will appear here once we add the first event to this section.','Тут зʼявляться фото, коли додамо першу подію до цього розділу.'],
'Галерея':['Gallery','Галерея'],'Все события':['All events','Усі події'],'Стенфорд · OCT 20':['Stanford · OCT 20','Стенфорд · OCT 20'],
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
  /* lightbox */
  var lb=document.getElementById('lb'), im=document.getElementById('lbImg'), list=[], cur=0;
  function show(){ im.src=list[cur]; document.getElementById('lbC').textContent = list.length>1 ? (cur+1)+' / '+list.length : ''; lb.querySelector('.pv').hidden=lb.querySelector('.nx').hidden=list.length<2; }
  function open(l,i){ list=l; cur=i; show(); lb.classList.add('on'); lb.setAttribute('aria-hidden','false'); }
  function close(){ lb.classList.remove('on'); lb.setAttribute('aria-hidden','true'); }
  function go(d){ cur=(cur+d+list.length)%list.length; show(); }
  $$('[data-zoom]').forEach(function(a){ a.addEventListener('click', function(e){ e.preventDefault(); open([a.getAttribute('data-zoom')],0); }); });
  $$('#gallery [data-rail] img').forEach(function(g){ g.addEventListener('click', function(){ var vis=$$('#gallery [data-rail] img').filter(function(x){ return x.offsetParent!==null; }); open(vis.map(function(x){ return x.currentSrc||x.src; }), vis.indexOf(g)); }); });
  lb.querySelector('.x').addEventListener('click', close); lb.querySelector('.pv').addEventListener('click', function(){ go(-1); }); lb.querySelector('.nx').addEventListener('click', function(){ go(1); });
  lb.addEventListener('click', function(e){ if(e.target===lb) close(); });
  document.addEventListener('keydown', function(e){ if(!lb.classList.contains('on')) return; if(e.key==='Escape') close(); if(e.key==='ArrowLeft') go(-1); if(e.key==='ArrowRight') go(1); });
  var x0=null; lb.addEventListener('touchstart', function(e){ x0=e.touches[0].clientX; }, {passive:true});
  lb.addEventListener('touchend', function(e){ if(x0===null) return; var dx=e.changedTouches[0].clientX-x0; if(Math.abs(dx)>40 && list.length>1) go(dx<0?1:-1); x0=null; });
})();
'''
LB='<div class="lb" id="lb" aria-hidden="true"><img id="lbImg" alt=""><button type="button" class="x" aria-label="Close">×</button><button type="button" class="pv" aria-label="Previous">‹</button><button type="button" class="nx" aria-label="Next">›</button><div class="cnt" id="lbC"></div></div>'
html=HEAD%dict(title='3:16 TEENS · SOL Church',desc='3:16 TEENS — подростковое служение русскоязычного потока SOL Church: TEENS PARTY, small groups, фото.',extra='',bg='#0E0F12',css=css)+b+'\n'+LB+'\n<script>'+js+i18n(TR)+'</script>\n</body>\n</html>\n'
html=html.replace('href="sms:+19165595882" target="_blank" rel="noopener"','href="sms:+19165595882"')
open('/home/claude/teensparty/index.html','w').write(html); print(len(html))
