import React from 'react';

export function Checkbox({checked=false,onChange,label,disabled=false,indeterminate=false,style}){
  return React.createElement('label',{style:{display:'inline-flex',alignItems:'center',gap:'var(--jt-space-2)',cursor:disabled?'not-allowed':'pointer',opacity:disabled?.5:1,font:'var(--jt-type-body)',...style}},
    React.createElement('span',{onClick:()=>!disabled&&onChange&&onChange(!checked),
      style:{width:18,height:18,flex:'0 0 auto',display:'grid',placeItems:'center',borderRadius:'var(--jt-r-sm)',
        background:checked||indeterminate?'var(--jt-color-accent)':'var(--jt-color-bg-container)',
        border:'1px solid '+(checked||indeterminate?'var(--jt-color-accent)':'var(--jt-color-border-strong)'),
        transition:'background var(--jt-dur-instant) var(--jt-ease-standard)'}},
      (checked||indeterminate)?React.createElement('span',{className:'material-symbols-rounded',style:{fontSize:14,color:'#fff'}},indeterminate?'remove':'check'):null),
    label?React.createElement('span',null,label):null);
}

export function Radio({checked=false,onChange,label,disabled=false,style}){
  return React.createElement('label',{style:{display:'inline-flex',alignItems:'center',gap:'var(--jt-space-2)',cursor:disabled?'not-allowed':'pointer',opacity:disabled?.5:1,font:'var(--jt-type-body)',...style}},
    React.createElement('span',{onClick:()=>!disabled&&onChange&&onChange(true),
      style:{width:18,height:18,flex:'0 0 auto',display:'grid',placeItems:'center',borderRadius:'var(--jt-r-full)',
        background:'var(--jt-color-bg-container)',border:'1px solid '+(checked?'var(--jt-color-accent)':'var(--jt-color-border-strong)')}},
      checked?React.createElement('span',{style:{width:9,height:9,borderRadius:'var(--jt-r-full)',background:'var(--jt-color-accent)'}}):null),
    label?React.createElement('span',null,label):null);
}

export function Switch({checked=false,onChange,disabled=false,label,style}){
  return React.createElement('label',{style:{display:'inline-flex',alignItems:'center',gap:'var(--jt-space-3)',cursor:disabled?'not-allowed':'pointer',opacity:disabled?.5:1,font:'var(--jt-type-body)',...style}},
    React.createElement('span',{onClick:()=>!disabled&&onChange&&onChange(!checked),
      style:{width:40,height:22,flex:'0 0 auto',borderRadius:'var(--jt-r-full)',padding:2,
        background:checked?'var(--jt-color-accent)':'var(--jt-neutral-300)',display:'flex',
        transition:'background var(--jt-dur-fast) var(--jt-ease-standard)'}},
      React.createElement('span',{style:{width:18,height:18,borderRadius:'var(--jt-r-full)',background:'#fff',boxShadow:'var(--jt-shadow-1)',
        transform:checked?'translateX(18px)':'translateX(0)',transition:'transform var(--jt-dur-fast) var(--jt-ease-standard)'}})),
    label?React.createElement('span',null,label):null);
}
