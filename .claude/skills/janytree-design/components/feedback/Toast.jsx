import React from 'react';

export function Toast({tone='default',message,icon,style}){
  const fg=tone==='success'?'var(--jt-color-success)':tone==='error'?'var(--jt-color-error)':'var(--jt-color-accent)';
  return React.createElement('div',{role:'status',style:{display:'inline-flex',alignItems:'center',gap:'var(--jt-space-3)',
    padding:'var(--jt-space-3) var(--jt-space-4)',background:'var(--jt-neutral-900)',color:'#fff',borderRadius:'var(--jt-r-md)',
    boxShadow:'var(--jt-shadow-3)',font:'var(--jt-type-body)',animation:'jt-rise var(--jt-dur-base) var(--jt-ease-decelerate)',...style}},
    React.createElement('span',{className:'material-symbols-rounded size-20',style:{color:fg}},icon||(tone==='success'?'check_circle':tone==='error'?'report':'info')),
    message);
}

export function Notification({tone='info',title,description,time,onClose,style}){
  const fg=tone==='success'?'var(--jt-color-success)':tone==='error'?'var(--jt-color-error)':tone==='warning'?'var(--jt-color-warning-solid)':'var(--jt-color-accent)';
  return React.createElement('div',{role:'status',style:{display:'flex',gap:'var(--jt-space-3)',width:340,padding:'var(--jt-space-4)',
    background:'var(--jt-color-bg-elevated)',border:'1px solid var(--jt-color-border)',borderRadius:'var(--jt-r-md)',boxShadow:'var(--jt-shadow-3)',
    animation:'jt-slide var(--jt-dur-base) var(--jt-ease-decelerate)',...style}},
    React.createElement('span',{className:'material-symbols-rounded size-20',style:{color:fg,flex:'0 0 auto',marginTop:1}},
      tone==='success'?'check_circle':tone==='error'?'report':tone==='warning'?'warning':'info'),
    React.createElement('div',{style:{flex:1,minWidth:0}},
      React.createElement('div',{style:{font:'var(--jt-fw-semibold) var(--jt-fs-base)/1.5 var(--jt-font-base)'}},title),
      description?React.createElement('div',{style:{font:'var(--jt-type-sm)',color:'var(--jt-color-text-secondary)',marginTop:2}},description):null,
      time?React.createElement('div',{className:'jt-num',style:{font:'var(--jt-type-caption)',color:'var(--jt-color-text-tertiary)',marginTop:'var(--jt-space-2)'}},time):null),
    onClose?React.createElement('button',{onClick:onClose,'aria-label':'닫기',style:{border:0,background:'transparent',cursor:'pointer',color:'var(--jt-color-text-tertiary)',padding:0,height:20}},
      React.createElement('span',{className:'material-symbols-rounded size-20'},'close')):null);
}
