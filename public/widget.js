(function(){"use strict";

var D={
  slug:'',
  baseUrl:'https://jandosoft.vercel.app',
  position:'bottom-right',
  primaryColor:'#dc2626',
  logo:'',
  title:'',
};
var S={isOpen:false,isMinimized:false,isMaximized:false,w:320,h:460,x:null,y:null};
var C={};
var iframeLoaded=false,initialized=false;
var root,btn,win,header,bodyEl,iframeEl,footer,resizeHandles={};

function stKey(){return'jandosoft_widget_'+C.slug}
function loadS(){
  try{
    var s=JSON.parse(localStorage.getItem(stKey()));
    if(s){
      S.isOpen=s.isOpen||false;S.isMinimized=s.isMinimized||false;S.isMaximized=s.isMaximized||false;
      S.w=s.w||380;S.h=s.h||600;S.x=s.x||null;S.y=s.y||null;
    }
  }catch(e){}
}
function saveS(){
  try{localStorage.setItem(stKey(),JSON.stringify({isOpen:S.isOpen,isMinimized:S.isMinimized,isMaximized:S.isMaximized,w:S.w,h:S.h,x:S.x,y:S.y}))}catch(e){}
}

function css(){
  var t=document.createElement('style');
  t.textContent=[
    '#jandosoft-root *{box-sizing:border-box;margin:0;padding:0}',
    '#jandosoft-root{all:initial;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;font-size:14px;line-height:1.4}',
    '.jds-btn{position:fixed;z-index:2147483646;width:60px;height:60px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .2s,box-shadow .2s,opacity .3s;box-shadow:0 4px 20px rgba(0,0,0,.25)}',
    '.jds-btn:hover{transform:scale(1.08);box-shadow:0 6px 28px rgba(0,0,0,.3)}',
    '.jds-btn:active{transform:scale(.95)}',
    '.jds-btn svg{width:28px;height:28px}',
    '.jds-br{bottom:24px;right:24px}',
    '.jds-bl{bottom:24px;left:24px}',
    '.jds-tr{top:24px;right:24px}',
    '.jds-tl{top:24px;left:24px}',
    '.jds-win{position:fixed;z-index:2147483647;border-radius:16px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,.2);display:none;flex-direction:column;background:#fff;opacity:0;transform:scale(.95) translateY(10px);transition:opacity .25s ease,transform .25s ease}',
    '.jds-win.open{display:flex;opacity:1;transform:scale(1) translateY(0)}',
    '.jds-hdr{display:flex;align-items:center;padding:12px 16px;border-bottom:1px solid rgba(0,0,0,.08);cursor:grab;user-select:none;flex-shrink:0}',
    '.jds-hdr:active{cursor:grabbing}',
    '.jds-hdr-img{width:32px;height:32px;border-radius:10px;object-fit:cover;margin-right:10px;flex-shrink:0}',
    '.jds-hdr-fb{width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;color:#fff;margin-right:10px;flex-shrink:0}',
    '.jds-hdr-i{flex:1;min-width:0}',
    '.jds-hdr-n{font-size:14px;font-weight:700;color:#1a1a1a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.jds-hdr-s{display:flex;align-items:center;gap:4px;font-size:11px;color:#22c55e;font-weight:600;margin-top:1px}',
    '.jds-hdr-sd{width:6px;height:6px;border-radius:50%;background:#22c55e;display:inline-block}',
    '.jds-hdr-a{display:flex;gap:2px;flex-shrink:0}',
    '.jds-hdr-b{width:32px;height:32px;border:none;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;background:transparent;color:#666;transition:background .15s}',
    '.jds-hdr-b:hover{background:rgba(0,0,0,.06)}',
    '.jds-hdr-b svg{width:16px;height:16px}',
    '.jds-body{flex:1;position:relative;overflow:hidden;background:#fff}',
    '.jds-body iframe{width:100%;height:100%;border:none;display:block}',
    '.jds-rh{position:absolute;z-index:10}',
    '.jds-rhn{top:0;left:4px;right:4px;height:4px;cursor:n-resize}',
    '.jds-rhs{bottom:0;left:4px;right:4px;height:4px;cursor:s-resize}',
    '.jds-rhe{right:0;top:4px;bottom:4px;width:4px;cursor:e-resize}',
    '.jds-rhw{left:0;top:4px;bottom:4px;width:4px;cursor:w-resize}',
    '.jds-rhne{top:0;right:0;width:8px;height:8px;cursor:ne-resize}',
    '.jds-rhnw{top:0;left:0;width:8px;height:8px;cursor:nw-resize}',
    '.jds-rhse{bottom:0;right:0;width:8px;height:8px;cursor:se-resize}',
    '.jds-rhsw{bottom:0;left:0;width:8px;height:8px;cursor:sw-resize}',
    '.jds-ftr{padding:6px 16px;text-align:center;font-size:10px;color:#999;border-top:1px solid rgba(0,0,0,.06);flex-shrink:0;background:#fafafa;letter-spacing:.05em}',
    '.jds-ftr a{color:#dc2626;text-decoration:none;font-weight:700}',
    '.jds-win.maxed{width:100vw!important;height:100vh!important;max-width:100vw!important;max-height:100vh!important;border-radius:0!important;top:0!important;left:0!important;right:0!important;bottom:0!important}',
    '@media(max-width:640px){.jds-win.open{width:100vw!important;height:100dvh!important;max-width:100vw!important;max-height:100dvh!important;border-radius:0!important;top:0!important;left:0!important;right:0!important;bottom:0!important}.jds-btn{width:48px;height:48px}.jds-btn svg{width:22px;height:22px}.jds-br{bottom:16px;right:16px}.jds-bl{bottom:16px;left:16px}.jds-tr{top:16px;right:16px}.jds-tl{top:16px;left:16px}}'
  ].join('\n');
  document.head.appendChild(t);
}

function icon(name){
  var m={
    chat:'<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="9" cy="11" r="1.5"/><circle cx="15" cy="11" r="1.5"/><path d="M8 16h8"/><path d="M8 5l-2-3"/><path d="M16 5l2-3"/></svg>',
    close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    minus:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/></svg>',
    max:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>',
    restore:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="7" y="7" width="14" height="14" rx="2"/><path d="M3 14.5V5a2 2 0 0 1 2-2h9.5"/></svg>'
  };
  return m[name]||'';
}

function updateWindowPos(){
  if(S.x!==null&&S.y!==null){
    win.style.left=S.x+'px';win.style.top=S.y+'px';
    win.style.right='auto';win.style.bottom='auto';
  }else{
    var p=C.position;
    win.style.left='auto';win.style.right='auto';win.style.top='auto';win.style.bottom='auto';
    if(p==='bottom-right'){win.style.bottom='96px';win.style.right='24px'}
    else if(p==='bottom-left'){win.style.bottom='96px';win.style.left='24px'}
    else if(p==='top-right'){win.style.top='96px';win.style.right='24px'}
    else if(p==='top-left'){win.style.top='96px';win.style.left='24px'}
  }
}

function loadIframe(){
  if(iframeLoaded)return;
  iframeLoaded=true;
  iframeEl=document.createElement('iframe');
  iframeEl.src=C.baseUrl+'/s/'+C.slug+'/chat?embed=1';
  iframeEl.title='Jandosoft AI Chat';
  iframeEl.setAttribute('loading','lazy');
  iframeEl.setAttribute('importance','low');
  bodyEl.appendChild(iframeEl);
}

function open(){
  if(S.isOpen)return;
  S.isOpen=true;
  loadIframe();
  win.classList.add('open');
  btn.style.opacity='0';
  btn.style.pointerEvents='none';
  saveS();
}

function close(){
  S.isOpen=false;S.isMinimized=false;S.isMaximized=false;
  win.classList.remove('open','maxed');
  btn.style.opacity='1';
  btn.style.pointerEvents='auto';
  saveS();
}

function minimize(){
  S.isMinimized=true;
  win.classList.remove('maxed');
  updateMaxBtn();
  close();
}

function maximize(){
  S.isMaximized=!S.isMaximized;
  if(S.isMaximized){win.classList.add('maxed')}else{win.classList.remove('maxed')}
  updateMaxBtn();
  saveS();
}

function updateMaxBtn(){
  var b=header.querySelector('.jds-hdr-max');
  if(b){b.innerHTML=S.isMaximized?icon('restore'):icon('max')}
}

function toggle(){S.isOpen?close():open()}

function build(){
  root=document.createElement('div');root.id='jandosoft-root';

  btn=document.createElement('button');
  btn.className='jds-btn jds-'+({br:'br',bl:'bl',tr:'tr',tl:'tl'}[C.position]||'br');
  btn.style.background=C.primaryColor;
  btn.innerHTML=icon('chat');
  btn.setAttribute('aria-label','Abrir chat');
  root.appendChild(btn);

  win=document.createElement('div');win.className='jds-win';
  win.style.width=S.w+'px';win.style.height=S.h+'px';

  header=document.createElement('div');header.className='jds-hdr';
  if(C.logo){
    var img=document.createElement('img');img.className='jds-hdr-img';
    img.src=C.logo;img.alt='';header.appendChild(img);
  }else{
    var fb=document.createElement('div');fb.className='jds-hdr-fb';
    fb.style.background=C.primaryColor;
    fb.textContent=(C.title||'J').charAt(0).toUpperCase();
    header.appendChild(fb);
  }
  var hi=document.createElement('div');hi.className='jds-hdr-i';
  hi.innerHTML='<div class="jds-hdr-n">'+escHtml(C.title||'Asistente IA')+'</div><div class="jds-hdr-s"><span class="jds-hdr-sd"></span>Online</div>';
  header.appendChild(hi);

  var ha=document.createElement('div');ha.className='jds-hdr-a';
  function hbtn(html,cls,fn){
    var b=document.createElement('button');b.className='jds-hdr-b '+cls;
    b.innerHTML=html;b.addEventListener('click',function(e){e.stopPropagation();fn()});
    ha.appendChild(b);return b;
  }
  hbtn(icon('minus'),'jds-hdr-min',minimize);
  hbtn(icon('max'),'jds-hdr-max',maximize);
  hbtn(icon('close'),'jds-hdr-close',close);
  header.appendChild(ha);
  win.appendChild(header);

  bodyEl=document.createElement('div');bodyEl.className='jds-body';
  win.appendChild(bodyEl);

  var edges=['n','s','e','w','ne','nw','se','sw'];
  edges.forEach(function(e){
    var h=document.createElement('div');h.className='jds-rh jds-rh'+e;
    win.appendChild(h);
    resizeHandles[e]=h;
  });

  footer=document.createElement('div');footer.className='jds-ftr';
  footer.innerHTML='Powered by <a href="https://jandosoft.com" target="_blank" rel="noopener">JANDOSOFT</a>';
  win.appendChild(footer);

  root.appendChild(win);
  document.body.appendChild(root);

  updateWindowPos();

  if(S.isOpen){open()}
}

// ===== EVENTS =====
function bindEvents(){
  btn.addEventListener('click',function(){if(S.isMinimized&&!S.isOpen){S.isMinimized=false;open()}else{toggle()}});

  // Drag from header
  var dragState=null;
  header.addEventListener('mousedown',function(e){
    if(e.target.closest('.jds-hdr-a'))return;
    if(S.isMaximized)return;
    dragState={ox:e.clientX-win.getBoundingClientRect().left,oy:e.clientY-win.getBoundingClientRect().top};
  });

  document.addEventListener('mousemove',function(e){
    if(!dragState)return;
    S.x=e.clientX-dragState.ox;S.y=e.clientY-dragState.oy;
    S.x=Math.max(0,Math.min(S.x,window.innerWidth-win.offsetWidth));
    S.y=Math.max(24,Math.min(S.y,window.innerHeight-win.offsetHeight));
    win.style.left=S.x+'px';win.style.top=S.y+'px';
    win.style.right='auto';win.style.bottom='auto';
  });
  document.addEventListener('mouseup',function(){if(dragState){dragState=null;saveS()}});

  // Resize
  var resState=null;
  Object.keys(resizeHandles).forEach(function(edge){
    resizeHandles[edge].addEventListener('mousedown',function(e){
      e.preventDefault();e.stopPropagation();
      if(S.isMaximized)return;
      var r=win.getBoundingClientRect();
      resState={edge:edge,sx:e.clientX,sy:e.clientY,sw:r.width,sh:r.height,sl:r.left,st:r.top};
    });
  });

  document.addEventListener('mousemove',function(e){
    if(!resState)return;
    var dx=e.clientX-resState.sx,dy=e.clientY-resState.sy;
    var nw=resState.sw,nh=resState.sh,nx=resState.sl,ny=resState.st;
    var e2=resState.edge;
    var minW=280,minH=360,maxW=window.innerWidth*0.9,maxH=window.innerHeight*0.9;

    if(e2.includes('e')){nw=Math.max(minW,Math.min(resState.sw+dx,maxW))}
    if(e2.includes('w')){nw=Math.max(minW,Math.min(resState.sw-dx,maxW));nx=resState.sl+(resState.sw-nw)}
    if(e2.includes('s')){nh=Math.max(minH,Math.min(resState.sh+dy,maxH))}
    if(e2.includes('n')){nh=Math.max(minH,Math.min(resState.sh-dy,maxH));ny=resState.st+(resState.sh-nh)}

    if(e2.includes('e')||e2.includes('w')){win.style.width=nw+'px';S.w=nw}
    if(e2.includes('s')||e2.includes('n')){win.style.height=nh+'px';S.h=nh}
    if(nx!==resState.sl){win.style.left=nx+'px';win.style.right='auto';S.x=nx}
    if(ny!==resState.st){win.style.top=ny+'px';win.style.bottom='auto';S.y=ny}
  });
  document.addEventListener('mouseup',function(){if(resState){resState=null;saveS()}});

  // postMessage from iframe
  window.addEventListener('message',function(e){
    var d=e.data;
    if(!d||!d.type)return;
    switch(d.type){
      case'jandosoft_minimize':minimize();break;
      case'jandosoft_maximize':maximize();break;
      case'jandosoft_close':close();break;
      case'jandosoft_restore':S.isMinimized=false;open();break;
    }
  });

  // Responsive: on resize, clamp position
  window.addEventListener('resize',function(){
    if(S.isMaximized)return;
    if(S.x!==null){
      S.x=Math.max(0,Math.min(S.x,window.innerWidth-win.offsetWidth));
      win.style.left=S.x+'px';
    }
    if(S.y!==null){
      S.y=Math.max(24,Math.min(S.y,window.innerHeight-win.offsetHeight));
      win.style.top=S.y+'px';
    }
  });
}

function escHtml(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}

// ===== PUBLIC API =====
window.Jandosoft={
  init:function(opts){
    if(initialized)return;
    initialized=true;
    C={};for(var k in D)C[k]=D[k];
    if(opts){for(var k2 in opts)C[k2]=opts[k2]}
    if(!C.slug){console.error('Jandosoft: slug is required');return}
    C.title=C.title||C.slug;
    loadS();
    css();
    build();
    bindEvents();
  },
  open:open,
  close:close,
  toggle:toggle,
};

})();
