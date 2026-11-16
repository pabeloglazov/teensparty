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
