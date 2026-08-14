import React from 'react';

export function Tooltip({content,placement='top',children,style}){
  const [on,setOn]=React.useState(false);
  const pos=placement==='bottom'?{top:'calc(100% + 6px)'}:{bottom:'calc(100% + 6px)'};
  return React.createElement('span',{onMouseEnter:()=>setOn(true),onMouseLeave:()=>setOn(false),
    style:{position:'relative',display:'inline-flex',...style}},children,
    on?React.createElement('span',{role:'tooltip',style:{position:'absolute',left:'50%',transform:'translateX(-50%)',...pos,zIndex:50,
      background:'var(--jt-neutral-900)',color:'#fff',padding:'var(--jt-space-2) var(--jt-space-3)',borderRadius:'var(--jt-r-sm)',
      font:'var(--jt-type-sm)',whiteSpace:'nowrap',boxShadow:'var(--jt-shadow-2)',pointerEvents:'none',
      animation:'jt-drop var(--jt-dur-base) var(--jt-ease-decelerate)'}},content):null);
}

export function Popover({content,title,children,style}){
  const [on,setOn]=React.useState(false);
  const ref=React.useRef(null);
  React.useEffect(()=>{const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOn(false)};
    document.addEventListener('mousedown',h);return()=>document.removeEventListener('mousedown',h)},[]);
  return React.createElement('span',{ref,style:{position:'relative',display:'inline-flex',...style}},
    React.createElement('span',{onClick:()=>setOn(o=>!o),style:{display:'inline-flex',cursor:'pointer'}},children),
    on?React.createElement('div',{style:{position:'absolute',top:'calc(100% + 6px)',left:0,zIndex:50,minWidth:220,
      background:'var(--jt-color-bg-elevated)',border:'1px solid var(--jt-color-border)',borderRadius:'var(--jt-r-md)',boxShadow:'var(--jt-shadow-3)',
      padding:'var(--jt-space-4)'}},
      title?React.createElement('div',{style:{font:'var(--jt-fw-semibold) var(--jt-fs-base)/1.4 var(--jt-font-base)',marginBottom:'var(--jt-space-2)'}},title):null,
      React.createElement('div',{style:{font:'var(--jt-type-sm)',color:'var(--jt-color-text-secondary)'}},content)):null);
}
