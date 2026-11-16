import re
from common import *
SRC='/tmp/claude-0/-home-claude/c7e849ba-ea5c-56e6-bfd9-536391e688a4/scratchpad/ds/project/Fall.dc.html'
b=blobs(inner(SRC))
def rep(a,n,count=1):
    global b
    assert b.count(a)==count,(b.count(a),a[:80]); b=b.replace(a,n)
rep('href="Main.dc.html"','href="/"',2); rep('href="Event.dc.html"','href="/xmas26/"')
# lang switch next to back link
m=re.search(r'<a href="/" style="display: inline-flex; align-items: center; height: 44px;[^>]*>← Все события</a>',b); assert m
b=b.replace(m.group(0),'<div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap; justify-content: flex-end; margin-left: auto">'+m.group(0)+LANGHTML+'</div>')
rep('TEENS <span style="color: #0E0F12;','TEENS <br class="mbr"><span style="color: #0E0F12;')
g='<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px">'
assert b.count(g)==2
b=b.replace(g,'<div class="pgrid" style="display: grid; gap: 12px">',1)
i=b.index(g); j=b.index('</div>',i)+6
b=b[:i]+'<div class="phgrid" id="grid"></div>'+b[j:]
m=re.search(r'<button type="button" (style="min-height: 68px;[^"]*")>Показать все 385 фото</button>',b); assert m
b=b.replace(m.group(0),'<button type="button" id="more" %s>Показать все 385 фото</button>\n  <div class="orig"><a href="https://drive.google.com/drive/folders/1QIw4TVgPmyOMGkzsL4CC16FU-Yhdnsno" target="_blank" rel="noopener">Оригиналы · часть 1</a><a href="https://drive.google.com/drive/folders/11PTTfKbpxl5khkHiY6QnLCak1cJREZJA" target="_blank" rel="noopener">Оригиналы · часть 2</a></div>\n  <a class="tgbtn" href="https://t.me/+P1QV3wSylSQyNDFi" target="_blank" rel="noopener"><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M21.9 4.3l-3 14.3c-.2 1-.8 1.2-1.7.8l-4.6-3.4-2.2 2.1c-.2.2-.5.5-.9.5l.3-4.7 8.5-7.7c.4-.3-.1-.5-.6-.2L7.2 12.6 2.7 11.2c-1-.3-1-1 .2-1.4L20.6 3c.8-.3 1.5.2 1.3 1.3z"></path></svg><span>Вступить в Telegram-чат</span></a>'%m.group(1))
# photos anchor
rep('<h2 style="margin: 0; font-family: Unbounded, sans-serif; font-weight: 700; font-size: clamp(30px, 4.4vw, 52px); line-height: 1; letter-spacing: -0.02em">Фото</h2>','<h2 id="photos" style="margin: 0; scroll-margin-top: 20px; font-family: Unbounded, sans-serif; font-weight: 700; font-size: clamp(30px, 4.4vw, 52px); line-height: 1; letter-spacing: -0.02em">Фото</h2>')
assert '{{' not in b and '<img src="/fall26' not in b
# v3: регистрация на новое событие — рождественский баннер, как на главной
i=b.index('<div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; background: #15171B; border: 1px solid #2A2D35; border-radius: 20px; padding: 20px 24px">'); j=b.index('</a>',i); j=b.index('</div>',j)+6
b=b[:i]+'<span style="font-family: Unbounded, sans-serif; font-weight: 700; font-size: clamp(22px, 3vw, 34px); line-height: 1.1; margin-top: 24px">Хочешь на следующую?</span>\n  '+BAN.strip()+b[j:]
# v3: порядок — фото, регистрация на новое событие, программа
P='<div style="max-width: 1200px; margin: 0 auto; padding: 0 24px 56px; display: flex; flex-direction: column; gap: 24px">'; Q='<div style="max-width: 1200px; margin: 0 auto; padding: 0 24px 72px; display: flex; flex-direction: column; gap: 24px">'
assert b.count(P)==1 and b.count(Q)==1
i=b.index(P); j=b.index(Q); prog=b[i:j]; k=b.rindex('</div>')
b=b[:i]+b[j:k]+prog.replace('padding: 0 24px 56px','padding: 0 24px 72px')+b[k:]
css=XBAN_CSS+'''
.xban .mbr{display:none}@media (max-width:720px){.xban .mbr{display:inline}}
.pgrid{grid-template-columns:repeat(3,minmax(0,1fr))}
.orig{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.orig a{display:flex;align-items:center;justify-content:center;min-height:56px;padding:8px 14px;border-radius:16px;border:1px solid #3A3D46;background:#15171B;color:#F4F4F5;text-decoration:none;font-weight:600;font-size:15px;text-align:center}
.tgbtn{display:flex;align-items:center;justify-content:center;gap:10px;min-height:60px;padding:8px 18px;border-radius:16px;background:#229ED9;color:#fff!important;text-decoration:none;font-weight:700;font-size:17px}
.orig a,.tgbtn{transition:filter .15s ease,transform .15s ease}.orig a:hover,.tgbtn:hover{filter:brightness(1.12)}.orig a:active,.tgbtn:active{transform:scale(.98)}
.phgrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.phgrid button{display:block;padding:0;border:0;background:#15171B;border-radius:18px;overflow:hidden;cursor:zoom-in}
.phgrid img{display:block;width:100%;aspect-ratio:3 / 2;object-fit:cover}
@media (max-width:720px){.pgrid{grid-template-columns:1fr}.phgrid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.phgrid button{border-radius:14px}.mbr{display:inline}}'''
TR={'← Все события':['← All events','← Усі події'],'УЖЕ ПРОШЛО':['ALREADY HAPPENED','ВЖЕ МИНУЛО'],'Программа':['Program','Програма'],'Фото':['Photos','Фото'],
'Фотозона':['Photo zone','Фотозона'],'Кадры для сторис с друзьями.':['Grab shots for your stories with friends.','Кадри для сторіс із друзями.'],
'Секретная миссия':['Secret mission','Секретна місія'],'Сканируй QR, получи задания и знакомься с людьми по всему залу.':['Scan the QR, get your missions and meet people across the room.','Скануй QR, отримуй завдання і знайомся з людьми по всій залі.'],
'Секретный агент':['Secret agent','Секретний агент'],'Командный квиз: узнаем, кто здесь лучший агент.':['A team quiz to find the best agent in the room.','Командний квіз: дізнаємось, хто тут найкращий агент.'],
'Короткий честный разговор с пастором о главном.':['A short, honest talk with the pastor about what really matters.','Коротка чесна розмова з пастором про головне.'],
'Еда и напитки':['Food & drinks','Їжа та напої'],'Еда, напитки и закуски — хватит всем.':['Food, drinks and snacks — enough for everyone.','Їжа, напої та закуски — вистачить усім.'],
'Живое общение':['Hang out','Живе спілкування'],'Новые знакомства, разговоры и просто классное время вместе.':['Meet new people, talk and just have a good time.','Нові знайомства, розмови і просто класний час разом.'],
'Показать все 385 фото':['Show all 385 photos','Показати всі 385 фото'],'Показать ещё':['Show more','Показати ще'],
'Вступить в Telegram-чат':['Join our Telegram chat','Вступити в Telegram-чат'],'Оригиналы · часть 1':['Originals · part 1','Оригінали · частина 1'],'Оригиналы · часть 2':['Originals · part 2','Оригінали · частина 2'],
'Хочешь на следующую?':['Want to come to the next one?','Хочеш на наступну?'],'Зарегистрироваться':['Register','Зареєструватися']}
js='''
(function(){
  var FEAT=['b_5Q4A2391','a_080A5623','a_080A5485','a_080A5811','a_080A5363','a_080A5686'], L=[], shown=0, cur=0, lang='ru';
  var grid=document.getElementById('grid'), more=document.getElementById('more');
  var lb=document.getElementById('lb'), im=document.getElementById('lbImg');
  function add(n){ var end=Math.min(L.length, shown+n);
    for(var i=shown;i<end;i++){ (function(i){ var b=document.createElement('button'); b.type='button'; var g=new Image(); g.loading='lazy'; g.decoding='async'; g.alt=''; g.src='/fall26/t/'+L[i]+'.webp'; b.appendChild(g); b.addEventListener('click', function(){ open(i); }); grid.appendChild(b); })(i); }
    shown=end; label(); }
  function label(){ more.hidden = shown>=L.length; more.textContent = shown<=6 ? ({ru:'Показать все '+L.length+' фото',uk:'Показати всі '+L.length+' фото',en:'Show all '+L.length+' photos'})[lang] : ({ru:'Показать ещё',uk:'Показати ще',en:'Show more'})[lang]; }
  function show(){ im.src='/fall26/p/'+L[cur]+'.webp'; document.getElementById('lbC').textContent=(cur+1)+' / '+L.length; [cur+1,cur-1].forEach(function(j){ if(L[j]) (new Image()).src='/fall26/p/'+L[j]+'.webp'; }); }
  function open(i){ cur=i; show(); lb.classList.add('on'); lb.setAttribute('aria-hidden','false'); }
  function close(){ lb.classList.remove('on'); lb.setAttribute('aria-hidden','true'); }
  function go(d){ cur=(cur+d+L.length)%L.length; show(); }
  more.addEventListener('click', function(){ add(60); });
  lb.querySelector('.x').addEventListener('click', close); lb.querySelector('.pv').addEventListener('click', function(){ go(-1); }); lb.querySelector('.nx').addEventListener('click', function(){ go(1); });
  lb.addEventListener('click', function(e){ if(e.target===lb) close(); });
  document.addEventListener('keydown', function(e){ if(!lb.classList.contains('on')) return; if(e.key==='Escape') close(); if(e.key==='ArrowLeft') go(-1); if(e.key==='ArrowRight') go(1); });
  var x0=null; lb.addEventListener('touchstart', function(e){ x0=e.touches[0].clientX; }, {passive:true});
  lb.addEventListener('touchend', function(e){ if(x0===null) return; var dx=e.changedTouches[0].clientX-x0; if(Math.abs(dx)>40) go(dx<0?1:-1); x0=null; });
  document.addEventListener('tp-lang', function(e){ lang=e.detail; if(L.length) label(); });
  try{ lang=document.documentElement.lang||'ru'; }catch(e){}
  fetch('/fall26/photos.json').then(function(r){ return r.json(); }).then(function(d){ var all=d.map(function(x){ return x.f; }); L=FEAT.filter(function(f){ return all.indexOf(f)>=0; }).concat(all.filter(function(f){ return FEAT.indexOf(f)<0; })); add(6); }).catch(function(){ more.hidden=true; });
})();
'''
LB='<div class="lb" id="lb" aria-hidden="true"><img id="lbImg" alt=""><button type="button" class="x" aria-label="Close">×</button><button type="button" class="pv" aria-label="Previous">‹</button><button type="button" class="nx" aria-label="Next">›</button><div class="cnt" id="lbC"></div></div>'
# i18n must run before gallery so lang is known; gallery listens to tp-lang
html=HEAD%dict(title='TEENS PARTY · OCT 31, 2026',desc='TEENS PARTY 31 октября 2026 — программа и фото.',extra='<meta name="robots" content="noindex">\n',bg='#0E0F12',css=css)+b+'\n'+LB+'\n<script>'+i18n(TR)+js+'</script>\n</body>\n</html>\n'
open('/home/claude/teensparty/fall26/index.html','w').write(html); print(len(html))
