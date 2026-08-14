import React from 'react';

export function Descriptions({items=[],columns=2,style}){
  return React.createElement('dl',{style:{display:'grid',gridTemplateColumns:`repeat(${columns},minmax(0,1fr))`,gap:'var(--jt-space-5) var(--jt-space-6)',margin:0,...style}},
    items.map((it,i)=>React.createElement('div',{key:i,style:{display:'flex',flexDirection:'column',gap:4,minWidth:0,gridColumn:it.span?`span ${it.span}`:undefined}},
      React.createElement('dt',{style:{font:'var(--jt-type-sm)',color:'var(--jt-color-text-secondary)'}},it.label),
      React.createElement('dd',{style:{margin:0,font:'var(--jt-fw-medium) var(--jt-fs-base)/1.5 var(--jt-font-base)',color:'var(--jt-color-text)',
        fontFamily:it.numeric?'var(--jt-font-num)':undefined,fontVariantNumeric:it.numeric?'tabular-nums':undefined}},it.value))));
}
