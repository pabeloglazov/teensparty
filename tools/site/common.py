import re, json
BLOB={'7080853435ed909710028e070d13cc6d':'/app/icons/icon-192.png','e851942f810bf778c9d0ef349026d894':'/fall26/p/b_5Q4A2391.webp','afdf04ba33f89a502aed9b45320de2d4':'/fall26/p/a_080A5623.webp','f26c2c928cf0a50396019364066965c4':'/fall26/p/a_080A5363.webp','24dea847e23828daf9c210955508270f':'/fall26/p/a_080A5485.webp','9f3218a9148e9ed5dc9445371b0f8634':'/fall26/p/a_080A5811.webp','dfbf4f44da01d8fb1aeddab15534245f':'/fall26/p/a_080A5686.webp','3cd97279cbc52915db36006432d2cd98':'/media/stanford.jpg'}
def blobs(s):
    for k,v in BLOB.items(): s=s.replace('/_blob/'+k,v)
    assert '/_blob/' not in s, re.findall(r'/_blob/\w+',s)
    return s
def inner(path):
    s=open(path).read()
    b=s[s.index('</helmet>')+9:s.index('</x-dc>')]
    return b.strip()
HEAD='''<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>%(title)s</title>
<meta name="description" content="%(desc)s">
%(extra)s<link rel="icon" href="/app/icons/icon-192.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Unbounded:wght@600;700;900&family=Inter:wght@400;500;600;700&display=swap">
<style>
*{box-sizing:border-box}
html{scroll-behavior:smooth}
body{margin:0;background:%(bg)s}
a{color:#FF8A3D}a:hover{color:#FFB27A}
button,a{-webkit-tap-highlight-color:transparent}
:focus-visible{outline:3px solid #FF8A3D;outline-offset:3px}
a[style*="border-radius"],button{transition:filter .15s ease,transform .15s ease}
a[style*="border-radius"]:hover,button:hover{filter:brightness(1.12)}
a[style*="border-radius"]:active,button:active{transform:scale(.98)}
.lang{display:flex;gap:2px;padding:4px;background:#15171B;border:1px solid #2A2D35;border-radius:999px}
.lang button{min-width:44px;height:36px;border:0;border-radius:999px;background:transparent;color:#A1A1AA;font:700 13px Inter,sans-serif;cursor:pointer}
.lang button.on{background:#FF8A3D;color:#0E0F12}
.chip{min-height:44px;padding:0 18px;border-radius:999px;border:1px solid #3A3D46;background:#15171B;color:#F4F4F5;font:700 14px Inter,sans-serif;cursor:pointer}
.chip.on{background:#FF8A3D;color:#0E0F12;border-color:#FF8A3D}
.mbr{display:none}
[data-rail]{scrollbar-width:none}[data-rail]::-webkit-scrollbar{display:none}
.lb{position:fixed;inset:0;z-index:60;background:rgba(10,10,12,.96);display:none;align-items:center;justify-content:center}
.lb.on{display:flex}
.lb img{max-width:100vw;max-height:100vh;object-fit:contain}
.lb button{position:absolute;background:rgba(21,23,27,.85);color:#F4F4F5;border:1px solid #3A3D46;border-radius:999px;width:52px;height:52px;font-size:24px;font-weight:700;cursor:pointer}
.lb .x{top:14px;right:14px}.lb .pv{left:10px;top:50%%;margin-top:-26px}.lb .nx{right:10px;top:50%%;margin-top:-26px}
.lb .cnt{position:absolute;bottom:16px;left:0;right:0;text-align:center;font:700 13px Inter,sans-serif;letter-spacing:.12em;color:#A1A1AA}
%(css)s
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}html{scroll-behavior:auto}}
</style>
</head>
<body>
'''
LANGHTML='<div class="lang" role="group" aria-label="Language"><button type="button" data-l="ru">RU</button><button type="button" data-l="uk">UA</button><button type="button" data-l="en">EN</button></div>'
I18N_JS='''
var TR=%s;
(function(){
  var nodes=[], w=document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT), n;
  while((n=w.nextNode())){ var k=n.nodeValue.trim(); if(k && TR[k]) nodes.push([n,k,n.nodeValue]); }
  var attrs=[]; document.querySelectorAll('[aria-label],[alt]').forEach(function(e){ ['aria-label','alt'].forEach(function(a){ var v=e.getAttribute(a); if(v && TR[v]) attrs.push([e,a,v]); }); });
  window.setLang=function(l){ if(['ru','uk','en'].indexOf(l)<0) l='en'; document.documentElement.lang=l; var i=l==='en'?0:1;
    nodes.forEach(function(x){ x[0].nodeValue = l==='ru' ? x[2] : x[2].replace(x[1], TR[x[1]][i]); });
    attrs.forEach(function(x){ x[0].setAttribute(x[1], l==='ru' ? x[2] : TR[x[2]][i]); });
    document.querySelectorAll('.lang button').forEach(function(b){ b.classList.toggle('on', b.getAttribute('data-l')===l); b.setAttribute('aria-pressed', b.getAttribute('data-l')===l); });
    try{ localStorage.setItem('tp_lang', l); }catch(e){}
    document.dispatchEvent(new CustomEvent('tp-lang',{detail:l})); };
  document.querySelectorAll('.lang button').forEach(function(b){ b.addEventListener('click', function(){ setLang(b.getAttribute('data-l')); }); });
  var l0; try{ l0=localStorage.getItem('tp_lang'); }catch(e){}
  if(!l0){ var nl=(navigator.language||'').slice(0,2); l0 = nl==='ru'?'ru':nl==='uk'?'uk':'en'; }
  setLang(l0);
})();
'''
def i18n(tr): return I18N_JS % json.dumps(tr,ensure_ascii=False)

# рождественский баннер (общий для главной и страницы прошедшей пати)
FL='<path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7"></path><path d="M12 5l-2-2M12 5l2-2M12 19l-2 2M12 19l2 2M6 8.5L3.4 9.4M6 8.5L5.4 5.8M18 15.5l2.6-.9M18 15.5l.6 2.7M6 15.5l-2.6-.9M6 15.5l-.6 2.7M18 8.5l2.6.9M18 8.5l.6-2.7"></path>'
def fl(st): return '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" style="position: absolute; %s">%s</svg>'%(st,FL)
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

XBAN_CSS='.xban{position:relative;overflow:hidden;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:28px 24px;background:#10231A;border:1px solid #1F7A46;border-radius:24px;padding:clamp(34px,5vw,56px) clamp(22px,5vw,56px) clamp(22px,4vw,40px);color:#F4F4F5!important;text-decoration:none;transition:border-color .2s ease,transform .2s ease}\n.xban:hover{border-color:#4ADE80;transform:translateY(-2px)}.xban:hover .xbtn{filter:brightness(1.1)}\n.xban .candy{position:absolute;left:0;right:0;top:0;height:10px;background:repeating-linear-gradient(135deg,#EF4444 0 18px,#F4F4F5 18px 36px,#1F7A46 36px 54px)}\n.xtxt{position:relative;display:flex;flex-direction:column;gap:18px;min-width:0}\n.xtag{align-self:flex-start;white-space:nowrap;background:#EF4444;color:#0E0F12;font:700 13px Unbounded,sans-serif;letter-spacing:.08em;padding:9px 16px;border-radius:999px;transform:rotate(-3deg)}\n.xban h3{margin:0;font:900 clamp(40px,7vw,96px)/.9 Unbounded,sans-serif;letter-spacing:-.03em}\n.xban h3 span{color:#10231A;-webkit-text-stroke:2px #F4F4F5}\n.xcal{position:relative;width:clamp(84px,12vw,148px);border-radius:18px;overflow:hidden;background:#FBF7EE;color:#0E0F12;text-align:center;transform:rotate(4deg);box-shadow:0 14px 30px rgba(0,0,0,.35)}\n.xcal .m{display:block;background:#DC2626;color:#FBF7EE;font:700 clamp(14px,2vw,22px)/1 Unbounded,sans-serif;letter-spacing:.1em;padding:clamp(8px,1.1vw,13px) 0}\n.xcal .d{display:block;font:900 clamp(40px,6.4vw,80px)/1 Unbounded,sans-serif;letter-spacing:-.04em;padding:clamp(8px,1.2vw,16px) 0 clamp(10px,1.5vw,20px)}\n.xbtn{position:relative;grid-column:1 / -1;display:flex;align-items:center;justify-content:center;height:64px;border-radius:16px;background:#EF4444;color:#0E0F12;font:700 18px Inter,sans-serif}\n@media (max-width:720px){.xban{align-items:start}.xcal{border-radius:14px}.xbtn{height:58px;font-size:17px}.xtag{font-size:11px;padding:8px 12px}}'
