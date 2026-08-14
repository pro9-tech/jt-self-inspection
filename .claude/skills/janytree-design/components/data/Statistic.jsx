import React from 'react';

export function Statistic({label,value,unit,delta,deltaTone='success',icon,style}){
  return React.createElement('div',{style:{display:'flex',flexDirection:'column',gap:'var(--jt-space-2)',...style}},
    React.createElement('span',{style:{display:'flex',alignItems:'center',gap:'var(--jt-space-2)',font:'var(--jt-type-sm)',color:'var(--jt-color-text-secondary)'}},
      icon?React.createElement('span',{className:'material-symbols-rounded size-20'},icon):null,label),
    React.createElement('span',{style:{display:'flex',alignItems:'baseline',gap:'var(--jt-space-2)'}},
      React.createElement('span',{style:{font:'var(--jt-fw-bold) var(--jt-fs-3xl)/1.2 var(--jt-font-num)',fontVariantNumeric:'tabular-nums',color:'var(--jt-color-text)'}},value),
      unit?React.createElement('span',{style:{font:'var(--jt-type-sm)',color:'var(--jt-color-text-secondary)'}},unit):null,
      delta?React.createElement('span',{style:{font:'var(--jt-fw-medium) var(--jt-fs-sm)/1 var(--jt-font-num)',
        color:deltaTone==='error'?'var(--jt-color-error-text)':'var(--jt-color-success-text)'}},delta):null));
}
