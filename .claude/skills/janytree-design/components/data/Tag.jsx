import React from 'react';

const tones={
  default:{bg:'var(--jt-color-bg-subtle)',fg:'var(--jt-color-text-secondary)',bd:'var(--jt-color-border)'},
  success:{bg:'var(--jt-color-success-bg)',fg:'var(--jt-color-success-text)',bd:'var(--jt-color-success-border)'},
  warning:{bg:'var(--jt-color-warning-bg)',fg:'var(--jt-color-warning-text)',bd:'var(--jt-color-warning-border)'},
  error:{bg:'var(--jt-color-error-bg)',fg:'var(--jt-color-error-text)',bd:'var(--jt-color-error-border)'},
  info:{bg:'var(--jt-color-info-bg)',fg:'var(--jt-color-info-text)',bd:'var(--jt-color-info-border)'},
  purple:{bg:'var(--jt-purple-50)',fg:'var(--jt-purple-700)',bd:'var(--jt-purple-100)'},
  teal:{bg:'var(--jt-teal-50)',fg:'var(--jt-teal-700)',bd:'var(--jt-teal-100)'}
};

export function Tag({tone='default',icon,children,style}){
  const t=tones[tone]||tones.default;
  return React.createElement('span',{style:{display:'inline-flex',alignItems:'center',gap:4,height:22,padding:'0 var(--jt-space-2)',
    borderRadius:'var(--jt-r-sm)',background:t.bg,color:t.fg,border:'1px solid '+t.bd,
    font:'var(--jt-fw-medium) var(--jt-fs-sm)/1 var(--jt-font-base)',whiteSpace:'nowrap',...style}},
    icon?React.createElement('span',{className:'material-symbols-rounded',style:{fontSize:14}},icon):null,children);
}

export function Badge({count,dot=false,tone='error',style}){
  const t=tones[tone]||tones.error;
  if(dot) return React.createElement('span',{style:{width:6,height:6,borderRadius:'var(--jt-r-full)',background:t.fg,display:'inline-block',...style}});
  return React.createElement('span',{style:{minWidth:18,height:18,padding:'0 5px',borderRadius:'var(--jt-r-full)',display:'inline-grid',placeItems:'center',
    background:'var(--jt-color-error)',color:'#fff',font:'var(--jt-fw-semibold) var(--jt-fs-xs)/1 var(--jt-font-num)',fontVariantNumeric:'tabular-nums',...style}},count);
}
