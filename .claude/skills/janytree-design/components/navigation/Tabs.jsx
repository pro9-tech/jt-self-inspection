import React from 'react';

export function Tabs({items=[],activeKey,onChange,size='md',style}){
  return React.createElement('div',{role:'tablist',style:{display:'flex',gap:'var(--jt-space-6)',borderBottom:'1px solid var(--jt-color-border)',...style}},
    items.map(it=>{
      const on=it.key===activeKey;
      return React.createElement('button',{key:it.key,role:'tab','aria-selected':on,onClick:()=>onChange&&onChange(it.key),
        style:{display:'flex',alignItems:'center',gap:'var(--jt-space-2)',border:0,background:'transparent',cursor:'pointer',
          padding:size==='sm'?'var(--jt-space-2) 0':'var(--jt-space-3) 0',
          font:`${on?'var(--jt-fw-semibold)':'var(--jt-fw-regular)'} ${size==='sm'?'var(--jt-fs-sm)':'var(--jt-fs-base)'}/1.4 var(--jt-font-base)`,
          color:on?'var(--jt-color-accent)':'var(--jt-color-text-secondary)',
          boxShadow:on?'inset 0 -2px 0 var(--jt-color-accent)':'none',
          transition:'color var(--jt-dur-fast) var(--jt-ease-standard)'}},
        it.icon?React.createElement('span',{className:'material-symbols-rounded size-20'},it.icon):null,
        it.label,
        it.count!=null?React.createElement('span',{style:{font:'var(--jt-type-caption)',color:'var(--jt-color-text-tertiary)'}},it.count):null);
    }));
}
