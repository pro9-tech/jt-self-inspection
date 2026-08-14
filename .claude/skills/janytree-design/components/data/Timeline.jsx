import React from 'react';

export function Timeline({items=[],style}){
  return React.createElement('ol',{style:{listStyle:'none',margin:0,padding:0,display:'flex',flexDirection:'column',...style}},
    items.map((it,i)=>React.createElement('li',{key:i,style:{display:'flex',gap:'var(--jt-space-4)',minHeight:52}},
      React.createElement('div',{style:{display:'flex',flexDirection:'column',alignItems:'center',flex:'0 0 auto'}},
        React.createElement('span',{style:{width:9,height:9,marginTop:6,borderRadius:'var(--jt-r-full)',
          background:it.tone==='pending'?'var(--jt-color-border-strong)':'var(--jt-color-accent)'}}),
        i<items.length-1?React.createElement('span',{style:{flex:1,width:1,background:'var(--jt-color-split)'}}):null),
      React.createElement('div',{style:{paddingBottom:'var(--jt-space-5)',minWidth:0}},
        React.createElement('div',{style:{font:'var(--jt-fw-medium) var(--jt-fs-base)/1.5 var(--jt-font-base)'}},it.title),
        it.meta?React.createElement('div',{className:'jt-num',style:{font:'var(--jt-type-sm)',color:'var(--jt-color-text-tertiary)'}},it.meta):null,
        it.description?React.createElement('div',{style:{font:'var(--jt-type-sm)',color:'var(--jt-color-text-secondary)',marginTop:4}},it.description):null))));
}
