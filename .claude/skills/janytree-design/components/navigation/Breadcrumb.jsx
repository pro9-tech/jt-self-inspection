import React from 'react';

export function Breadcrumb({items=[],style}){
  return React.createElement('nav',{'aria-label':'breadcrumb',style:{display:'flex',alignItems:'center',gap:'var(--jt-space-2)',font:'var(--jt-type-sm)',...style}},
    items.map((it,i)=>React.createElement(React.Fragment,{key:i},
      i>0?React.createElement('span',{style:{color:'var(--jt-color-text-tertiary)'}},'/'):null,
      i===items.length-1
        ?React.createElement('span',{style:{color:'var(--jt-color-text)',fontWeight:'var(--jt-fw-medium)'}},it.label)
        :React.createElement('a',{href:it.href||'#',onClick:it.onClick,style:{color:'var(--jt-color-link)'}},it.label))));
}
