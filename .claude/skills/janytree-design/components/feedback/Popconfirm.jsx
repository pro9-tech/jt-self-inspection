import React from 'react';
import { Button } from '../general/Button.jsx';

export function Popconfirm({title,description,confirmLabel='삭제',cancelLabel='취소',danger=true,onConfirm,children,style}){
  const [open,setOpen]=React.useState(false);
  const ref=React.useRef(null);
  React.useEffect(()=>{const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false)};
    document.addEventListener('mousedown',h);return()=>document.removeEventListener('mousedown',h)},[]);
  return React.createElement('span',{ref,style:{position:'relative',display:'inline-flex',...style}},
    React.createElement('span',{onClick:()=>setOpen(o=>!o),style:{display:'inline-flex'}},children),
    open?React.createElement('div',{style:{position:'absolute',top:'calc(100% + 6px)',right:0,zIndex:60,width:260,
      background:'var(--jt-color-bg-elevated)',border:'1px solid var(--jt-color-border)',borderRadius:'var(--jt-r-md)',boxShadow:'var(--jt-shadow-3)',
      padding:'var(--jt-space-4)',animation:'jt-drop var(--jt-dur-base) var(--jt-ease-decelerate)'}},
      React.createElement('div',{style:{display:'flex',gap:'var(--jt-space-2)'}},
        React.createElement('span',{className:'material-symbols-rounded size-20',style:{color:'var(--jt-color-warning-solid)',flex:'0 0 auto'}},'warning'),
        React.createElement('div',null,
          React.createElement('div',{style:{font:'var(--jt-fw-semibold) var(--jt-fs-base)/1.5 var(--jt-font-base)'}},title),
          description?React.createElement('div',{style:{font:'var(--jt-type-sm)',color:'var(--jt-color-text-secondary)',marginTop:2}},description):null)),
      React.createElement('div',{style:{display:'flex',justifyContent:'flex-end',gap:'var(--jt-space-2)',marginTop:'var(--jt-space-4)'}},
        React.createElement(Button,{variant:'default',size:'sm',onClick:()=>setOpen(false)},cancelLabel),
        React.createElement(Button,{variant:'primary',size:'sm',danger,onClick:()=>{setOpen(false);onConfirm&&onConfirm()}},confirmLabel))):null);
}
