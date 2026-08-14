import React from 'react';

export function Steps({items=[],current=0,style}){
  return React.createElement('ol',{style:{display:'flex',alignItems:'flex-start',gap:0,listStyle:'none',margin:0,padding:0,...style}},
    items.map((it,i)=>{
      const done=i<current,now=i===current;
      const color=done||now?'var(--jt-color-accent)':'var(--jt-color-text-tertiary)';
      return React.createElement('li',{key:i,style:{flex:i===items.length-1?'0 0 auto':1,display:'flex',alignItems:'center',gap:'var(--jt-space-3)',minWidth:0}},
        React.createElement('div',{style:{display:'flex',alignItems:'center',gap:'var(--jt-space-3)',flex:'0 0 auto'}},
          React.createElement('span',{style:{width:24,height:24,borderRadius:'var(--jt-r-full)',display:'grid',placeItems:'center',flex:'0 0 auto',
            background:done?'var(--jt-color-accent)':'transparent',border:'1px solid '+(now?'var(--jt-color-accent)':'var(--jt-color-border)'),
            color:done?'#fff':color,font:'var(--jt-fw-semibold) var(--jt-fs-xs)/1 var(--jt-font-num)'}},
            done?React.createElement('span',{className:'material-symbols-rounded',style:{fontSize:16}},'check'):i+1),
          React.createElement('span',{style:{font:`${now?'var(--jt-fw-semibold)':'var(--jt-fw-regular)'} var(--jt-fs-sm)/1.4 var(--jt-font-base)`,color:now||done?'var(--jt-color-text)':'var(--jt-color-text-tertiary)',whiteSpace:'nowrap'}},it.label)),
        i<items.length-1?React.createElement('span',{style:{flex:1,height:1,background:done?'var(--jt-color-accent-border)':'var(--jt-color-split)',margin:'0 var(--jt-space-3)'}}):null);
    }));
}
