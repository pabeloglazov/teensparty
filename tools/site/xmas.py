import re
p='/home/claude/teensparty/xmas26/index.html'; s=open(p).read()
def rep(a,n,count=1):
    global s
    assert s.count(a)==count,(s.count(a),a[:90]); s=s.replace(a,n)
# fonts
rep('family=Unbounded:wght@600;900&family=Manrope:wght@500;700;800&display=swap','family=Unbounded:wght@600;700;900&family=Inter:wght@400;500;600;700&display=swap')
# capacity 50
rep('var CAPACITY = 67, STEPS = 5;','var CAPACITY = 50, STEPS = 5;'); rep('<span class="capn">67</span>','<span class="capn">50</span>',2)
rep('<div class="stat hot"><span class="k" data-i="left">SPOTS LEFT</span><span class="v" id="left">67</span></div>','<div class="stat hot"><span class="k" data-i="left">SPOTS LEFT</span><span class="v" id="left">50</span></div>')
s=s.replace('aria-label="67 spots"','aria-label="50 spots"').replace('Only 67 spots','Only 50 spots').replace('Мест всего 67','Мест всего 50').replace('Місць лише 67','Місць лише 50')
# top: nav + candy stripe instead of marquee; language switch inside nav
i=s.index('  <div class="strip top"'); j=s.index('  <div class="wrap">')
flake=lambda st:'<svg class="bigflake" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" style="'+st+'"><path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7"></path><path d="M12 5l-2-2M12 5l2-2M12 19l-2 2M12 19l2 2M6 8.5L3.4 9.4M6 8.5L5.4 5.8M18 15.5l2.6-.9M18 15.5l.6 2.7M6 15.5l-2.6-.9M6 15.5l-.6 2.7M18 8.5l2.6.9M18 8.5l.6-2.7"></path></svg>'
top='''  <nav class="xnav">
    <a class="xlogo" href="/"><img src="/app/icons/icon-192.png" alt=""><span>3:16 TEENS</span></a>
    <div class="xnavr">
      <div class="lang" role="group" aria-label="Language">
        <button type="button" data-lang="ru" aria-pressed="false">RU</button>
        <button type="button" data-lang="uk" aria-pressed="false">UA</button>
        <button type="button" data-lang="en" aria-pressed="true">EN</button>
      </div>
      <a class="xback" href="/" data-i="navBack">← All events</a>
    </div>
  </nav>
  <div class="candy" aria-hidden="true"></div>
  '''+flake('left:44%;top:150px;width:170px;height:170px;color:#F4F4F5;opacity:.12')+flake('left:2%;top:620px;width:110px;height:110px;color:#EF4444;opacity:.45')+flake('right:2%;top:110px;width:70px;height:70px;color:#4ADE80;opacity:.4')+flake('right:4%;top:1180px;width:130px;height:130px;color:#F4F4F5;opacity:.12')+flake('left:4%;top:1500px;width:80px;height:80px;color:#EF4444;opacity:.4')+'''

'''
s=s[:i]+top+s[j:]
# bottom marquee out
i=s.index('  <div class="strip bot"'); j=s.index('  <div class="lb" id="lb"'); s=s[:i]+s[j:]
# address
rep('<div class="f"><span class="k" data-i="venue">ADDRESS</span><span class="addr" data-i="tba">ANNOUNCED SOON</span></div>','<a class="f" href="https://maps.google.com/?q=5948+Pecan+Ave,+Orangevale,+CA+95662" target="_blank" rel="noopener"><span class="k" data-i="venue">ADDRESS</span><span class="addr">5948 Pecan Ave<br>Orangevale, CA 95662</span></a>')
# ticket header with snowflake
rep('<div class="head"><span data-i="admit">ADMIT ONE</span>','<div class="head"><span class="hl"><svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7"></path></svg><span data-i="admit">ADMIT ONE</span></span>')
# recap
i=s.index('  <section class="recap">'); j=s.index('  <section class="fin"')
s=s[:i]+'''  <section class="recap">
    <h2 data-i="recH">HOW IT WAS</h2>
    <div class="rgrid">
      <img loading="lazy" src="/fall26/p/b_5Q4A2391.webp" alt="">
      <img loading="lazy" src="/fall26/p/a_080A5623.webp" alt="">
      <img loading="lazy" src="/fall26/p/a_080A5485.webp" alt="">
    </div>
    <a class="rbig" href="/fall26/#photos" data-i="recB">SEE THE PHOTOS</a>
  </section>
'''+s[j:]
# remove recap fetch into #rgrid
i=s.index("  fetch('/fall26/photos.json').then(function(r){return r.json();}).then(function(L){ var pick="); j=s.index('.catch(function(){});',i)+len('.catch(function(){});'); s=s[:i]+s[j:]
# texts
for en,ru,uk,key in [("CHRISTMAS EDITION","CHRISTMAS EDITION","CHRISTMAS EDITION",'xtag'),("CHRISTMAS PASS","CHRISTMAS PASS","CHRISTMAS PASS",'admit')]:
    pass
def setkey(k,en,ru,uk):
    global s
    vals=[en,ru,uk]
    ms=list(re.finditer(r'\b'+k+r':"((?:[^"\\]|\\.)*)"',s)); assert len(ms)==3,(k,len(ms))
    for m,v in reversed(list(zip(ms,vals))): s=s[:m.start(1)]+v+s[m.end(1):]
# order of dictionaries in file: en, ru, uk
setkey('xtag','CHRISTMAS EDITION','CHRISTMAS EDITION','CHRISTMAS EDITION')
setkey('admit','CHRISTMAS PASS','CHRISTMAS PASS','CHRISTMAS PASS')
setkey('soonP','Program and surprises will be announced later. Grab your ticket now — spots are limited.','Программу и сюрпризы объявим позже. Бери билет уже сейчас — мест немного.','Програму й сюрпризи оголосимо пізніше. Бери квиток уже зараз — місць небагато.')
setkey('recH','HOW IT WAS LAST TIME','КАК ЭТО БЫЛО В ПРОШЛЫЙ РАЗ','ЯК ЦЕ БУЛО МИНУЛОГО РАЗУ')
setkey('recB','SEE THE PHOTOS','СМОТРЕТЬ ФОТО','ДИВИТИСЯ ФОТО')
setkey('parentBtn',"Register my teen\\nI'm a parent",'Зарегистрировать подростка\\nя родитель','Зареєструвати підлітка\\nя з батьків')
setkey('again','Register someone else','Зарегистрировать ещё кого-то','Зареєструвати ще когось')
setkey('check','Already registered? Open my ticket','Уже зарегистрирован? Открыть билет','Вже зареєстрований? Відкрити квиток')
setkey('cta','Get my ticket','Получить билет','Отримати квиток')
for k,(en,ru,uk) in {'navBack':('← All events','← Все события','← Усі події')}.items():
    for lang,v in [('en',en),('ru',ru),('uk',uk)]:
        a='    %s:{'%lang; assert s.count(a)==1; s=s.replace(a,a+'%s:"%s",'%(k,v))
# theme
css='''
/* ===== v2: единый дизайн + рождественские краски ===== */
:root{--bg:#10231A;--fg:#F4F4F5;--paper:#FBF7EE;--ink:#0E0F12;--orange:#EF4444;--orange-dark:#B91C1C;--muted:#B6C4BB;--paper-muted:#52525B;--seat-empty:#0C1C14;--track:#E4DDCB;--body:Inter,system-ui,sans-serif}
body{font-family:var(--body)}
.page{min-height:0}
.xnav{width:100%;max-width:1200px;margin:0 auto;padding:20px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;position:relative;z-index:2}
.xlogo{display:flex;align-items:center;gap:12px;color:var(--fg);text-decoration:none;font-family:var(--display);font-weight:700;font-size:16px}
.xlogo img{width:44px;height:44px;border-radius:12px}
.xnavr{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.xback{display:inline-flex;align-items:center;height:44px;padding:0 16px;border-radius:14px;border:1px solid #3F7A5A;color:var(--fg);text-decoration:none;font-weight:600;font-size:14px}
.xback:hover{background:#0C1C14}
.candy{height:10px;background:repeating-linear-gradient(135deg,#EF4444 0 18px,#F4F4F5 18px 36px,#1F7A46 36px 54px)}
.bigflake{position:absolute;pointer-events:none;z-index:0}
.lang{display:flex;gap:2px;padding:4px;background:#0C1C14;border:1px solid #245B3D;border-radius:999px}
.lang button{min-width:44px;height:36px;min-height:0;padding:0;border:0!important;border-radius:999px;background:transparent;color:var(--muted);font:700 13px Inter,sans-serif;letter-spacing:0}
.lang button[aria-pressed="true"]{background:#EF4444;color:#0E0F12}
.wrap{position:relative;z-index:1;padding:56px 24px 80px;gap:48px;align-items:flex-start}
.left{gap:26px}
.xtag{align-self:flex-start;background:#EF4444;color:#0E0F12;font-weight:700;font-size:14px;padding:10px 18px;border-radius:999px;box-shadow:none;margin:0}
h1{font-size:clamp(56px,10vw,136px);line-height:.86;letter-spacing:-.04em}
h1 .outline{color:var(--bg);-webkit-text-stroke:2px var(--fg)}
.board{max-width:none;gap:26px}
.stats{gap:12px;background:none;border:0}
.stat{background:#0C1C14;border:1px solid #245B3D;border-radius:18px;padding:18px 20px;gap:4px}
.stat.hot{background:#EF4444;border-color:#EF4444}
.stat .k{min-height:0;color:var(--muted)}.stat.hot .k{color:var(--ink)}
.stat .v{font-weight:700;font-size:40px}
.seats{grid-template-columns:repeat(25,minmax(0,1fr));gap:6px}
.seat{border:1px solid #245B3D;border-radius:5px}
.seat.on{background:#EF4444;border-color:#EF4444}
.legend{display:flex;gap:18px;margin-top:-14px}
.tgrid{gap:12px;background:none;border:0}
.tgrid div{background:#0C1C14;border:1px solid #245B3D;border-radius:14px}
.tgrid b{font-weight:700;font-size:24px}
.ticket{position:relative;background:var(--paper);border:0;border-radius:28px;box-shadow:none;transform:none;overflow:hidden;animation:none;max-width:420px}
@media (min-width:900px){.ticket{flex:0 0 420px;width:420px}}
.ticket::before,.ticket::after{content:"";display:block;height:14px;flex:none;background:repeating-linear-gradient(135deg,#DC2626 0 14px,#FBF7EE 14px 28px,#1F7A46 28px 42px)}
.ticket::after{order:99}
.part{padding:24px 28px}
.head{margin:-24px -28px 0;padding:16px 28px;height:auto;background:#B91C1C;color:#FBF7EE;font-family:var(--display);font-weight:700;font-size:14px;letter-spacing:.08em}
.head .hl{display:flex;align-items:center;gap:10px}
.no{background:#FBF7EE;color:#14532D;font-family:var(--body);font-size:12px;font-weight:700;letter-spacing:0;padding:6px 12px;border-radius:999px}
.bigdate{border-top:0;border-bottom:2px solid var(--ink);padding:0 0 14px}
.bigdate .dd{color:#B91C1C;font-size:104px}
.bigdate .dm{font-weight:700;font-size:18px}
.big{font-weight:700;font-size:22px}
.f .k{font-weight:700;letter-spacing:.12em;text-transform:uppercase}
.addr{font-weight:700;text-decoration:underline;text-underline-offset:3px}
.perf{position:relative;height:28px;border:0;flex:none}
.perf::before,.perf::after{content:"";position:absolute;top:0;width:28px;height:28px;border-radius:50%;background:var(--bg)}
.perf::before{left:-14px}.perf::after{right:-14px;left:auto}
.perf{background:linear-gradient(90deg,#B91C1C 55%,transparent 0) 26px 13px/12px 2px repeat-x;background-clip:content-box;padding:0 26px}
.part.stub{gap:10px;padding-top:20px}
.btn{background:#DC2626;color:#FBF7EE;border:0;border-radius:14px;box-shadow:none;font-family:var(--body);font-weight:700;font-size:17px;letter-spacing:0;min-height:56px;white-space:normal}
.btn:hover:not(:disabled){transform:none;box-shadow:none;filter:brightness(1.1)}
.btn:active:not(:disabled){transform:scale(.98)}
.btn2{white-space:pre-line;border:1.5px solid #14532D;color:#14532D;border-radius:14px;font-family:var(--body);font-weight:700;font-size:15px;letter-spacing:0;min-height:56px}
.btn2:hover:not(:disabled){background:#14532D;color:#FBF7EE}
.linkbtn{align-self:stretch;margin-top:8px;min-height:52px;padding:10px 14px;background:#1F7A46;color:#F4F4F5;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;letter-spacing:0}
.linkbtn:hover{filter:brightness(1.1)}
.stamp,.barcode,#fin{display:none!important}
.done .k{font-family:var(--display);letter-spacing:.08em;color:#14532D}
.tno{font-weight:900}
.qr{border:0;border-radius:14px;box-shadow:0 0 0 2px #0E0F12 inset}
.share{border:0;border-radius:14px;font-family:var(--body);font-weight:700;background:#1F7A46;color:#F4F4F5}
.share:hover{background:#14532D;color:#F4F4F5}
.again{align-self:stretch;min-height:52px;border:1.5px solid #B91C1C;border-radius:14px;color:#B91C1C;text-decoration:none;font-weight:700;text-align:center}
.again:hover{background:#B91C1C;color:#FBF7EE}
.soonnote{border-radius:14px;border-width:2px}
.mcta{background:linear-gradient(180deg,rgba(16,35,26,0),rgba(16,35,26,.95) 35%)!important}
.soon,.recap{position:relative;z-index:1;padding:0 24px 80px;gap:24px}
.soon{border:0;padding-bottom:80px}
.soon{display:block}
.soon .gk{display:none}
.soon h2,.recap h2{font-weight:700;font-size:clamp(26px,3.6vw,44px);line-height:1.05;letter-spacing:-.02em}
.soon h2{background:#0C1C14;border:1px solid #1F7A46;border-bottom:0;border-radius:24px 24px 0 0;padding:32px 32px 10px}
.soon p{max-width:none;background:#0C1C14;border:1px solid #1F7A46;border-top:0;border-radius:0 0 24px 24px;padding:0 32px 32px;font-weight:400;font-size:17px;color:var(--muted)}
.recap h2{font-size:clamp(30px,4.4vw,52px)}
.rgrid{gap:12px}
.rgrid img{aspect-ratio:3/2;border-radius:18px;transform:none!important}
@media(max-width:640px){.rgrid{grid-template-columns:1fr}}
.rbig{display:flex;align-items:center;justify-content:center;min-height:68px;padding:0 28px;border-radius:18px;background:#EF4444;color:#0E0F12;text-decoration:none;font-family:var(--display);font-weight:700;font-size:clamp(18px,2.2vw,24px)}
.rbig:hover{filter:brightness(1.1)}
dialog{border:0;border-radius:24px;box-shadow:0 30px 80px rgba(0,0,0,.5);overflow:hidden}
.step label{font-weight:700}
.step input{border:2px solid #0E0F12;border-radius:12px}
.ghost{border:1.5px solid #0E0F12;border-radius:12px;font-weight:700}
.q-bar{border-radius:99px;overflow:hidden}.opt{border-radius:6px}
.pv-body img{border:0;border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,.35)}
.qrz .big{border:0;border-radius:20px}
@media (max-width:520px){dialog{border-radius:24px 24px 0 0}}
@media (max-width:899px){.page{padding-bottom:96px}}
'''
rep('@media (prefers-reduced-motion:reduce){*{animation:none!important}}',css+'@media (prefers-reduced-motion:reduce){*{animation:none!important}}')
open(p,'w').write(s); print('ok',len(s))
