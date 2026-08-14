import React from 'react';

export function Dropdown({trigger,items=[],align='left',onSelect,style}){
  const [open,setOpen]=React.useState(false);
  const ref=React.useRef(null);
  React.useEffect(()=>{const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false)};
    document.addEventListener('mousedown',h);return()=>document.removeEventListener('mousedown',h)},[]);
  return React.createElement('div',{ref,style:{position:'relative',display:'inline-block',...style}},
    React.createElement('span',{onClick:()=>setOpen(o=>!o),style:{display:'inline-flex',cursor:'pointer'}},trigger),
    open?React.createElement('div',{role:'menu',style:{position:'absolute',top:'calc(100% + 4px)',[align]:0,minWidth:180,zIndex:40,
      background:'var(--jt-color-bg-elevated)',border:'1px solid var(--jt-color-border)',borderRadius:'var(--jt-r-md)',boxShadow:'var(--jt-shadow-2)',
      padding:'var(--jt-space-1) 0',animation:'jt-drop var(--jt-dur-base) var(--jt-ease-decelerate)'}},
      items.map((it,i)=>it.divider
        ?React.createElement('div',{key:i,style:{height:1,background:'var(--jt-color-split)',margin:'var(--jt-space-1) 0'}})
        :React.createElement('button',{key:i,role:'menuitem',onClick:()=>{setOpen(false);onSelect?onSelect(it.key):it.onClick&&it.onClick()},
          style:{display:'flex',alignItems:'center',gap:'var(--jt-space-3)',width:'100%',border:0,background:'transparent',cursor:'pointer',
            padding:'0 var(--jt-space-4)',height:32,textAlign:'left',font:'var(--jt-type-body)',
            color:it.danger?'var(--jt-color-error-text)':'var(--jt-color-text)'},
          onMouseEnter:e=>e.currentTarget.style.background='var(--jt-color-bg-hover)',
          onMouseLeave:e=>e.currentTarget.style.background='transparent'},
          it.icon?React.createElement('span',{className:'material-symbols-rounded size-20'},it.icon):null,it.label))):null);
}
