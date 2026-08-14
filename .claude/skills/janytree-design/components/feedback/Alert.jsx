import React from 'react';

const tones={
  info:{bg:'var(--jt-color-info-bg)',bd:'var(--jt-color-info-border)',fg:'var(--jt-color-info-text)',icon:'info'},
  success:{bg:'var(--jt-color-success-bg)',bd:'var(--jt-color-success-border)',fg:'var(--jt-color-success-text)',icon:'check_circle'},
  warning:{bg:'var(--jt-color-warning-bg)',bd:'var(--jt-color-warning-border)',fg:'var(--jt-color-warning-text)',icon:'warning'},
  error:{bg:'var(--jt-color-error-bg)',bd:'var(--jt-color-error-border)',fg:'var(--jt-color-error-text)',icon:'report'}
};

export function Alert({tone='info',title,children,action,onClose,style}){
  const t=tones[tone]||tones.info;
  return React.createElement('div',{role:'alert',style:{display:'flex',gap:'var(--jt-space-3)',padding:'var(--jt-space-4)',
    background:t.bg,border:'1px solid '+t.bd,borderRadius:'var(--jt-r-md)',...style}},
    React.createElement('span',{className:'material-symbols-rounded size-20',style:{color:t.fg,flex:'0 0 auto',marginTop:1}},t.icon),
    React.createElement('div',{style:{flex:1,minWidth:0}},
      title?React.createElement('div',{style:{font:'var(--jt-fw-semibold) var(--jt-fs-base)/1.5 var(--jt-font-base)',color:t.fg}},title):null,
      children?React.createElement('div',{style:{font:'var(--jt-type-sm)',color:'var(--jt-color-text-secondary)',marginTop:title?4:0}},children):null,
      action?React.createElement('div',{style:{marginTop:'var(--jt-space-3)'}},action):null),
    onClose?React.createElement('button',{onClick:onClose,'aria-label':'닫기',style:{border:0,background:'transparent',cursor:'pointer',color:'var(--jt-color-text-tertiary)',padding:0,height:20}},
      React.createElement('span',{className:'material-symbols-rounded size-20'},'close')):null);
}
