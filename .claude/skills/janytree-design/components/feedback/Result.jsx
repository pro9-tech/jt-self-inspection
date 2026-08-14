import React from 'react';

export function Result({status='success',title,description,extra,style}){
  const map={success:{icon:'check_circle',color:'var(--jt-color-success)'},error:{icon:'cancel',color:'var(--jt-color-error)'},
    warning:{icon:'warning',color:'var(--jt-color-warning-solid)'},info:{icon:'info',color:'var(--jt-color-accent)'}};
  const s=map[status]||map.success;
  return React.createElement('div',{style:{display:'flex',flexDirection:'column',alignItems:'center',gap:'var(--jt-space-3)',
    padding:'var(--jt-space-11) var(--jt-space-6)',textAlign:'center',...style}},
    React.createElement('span',{className:'material-symbols-rounded',style:{fontSize:56,color:s.color}},s.icon),
    React.createElement('h2',{style:{font:'var(--jt-type-h2)',margin:0}},title),
    description?React.createElement('p',{style:{font:'var(--jt-type-body)',color:'var(--jt-color-text-secondary)',margin:0,maxWidth:420}},description):null,
    extra?React.createElement('div',{style:{display:'flex',gap:'var(--jt-space-3)',marginTop:'var(--jt-space-4)'}},extra):null);
}
