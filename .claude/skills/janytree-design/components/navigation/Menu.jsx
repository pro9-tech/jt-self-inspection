import React from 'react';

export function NavItem({icon,label,active=false,collapsed=false,badge,onClick,style}){
  const [hover,setHover]=React.useState(false);
  return React.createElement('button',{type:'button',onClick,onMouseEnter:()=>setHover(true),onMouseLeave:()=>setHover(false),
    style:{display:'flex',alignItems:'center',gap:'var(--jt-space-3)',width:'100%',border:0,background:active?'var(--jt-color-accent-bg)':(hover?'var(--jt-color-bg-hover)':'transparent'),
      cursor:'pointer',textAlign:'left',padding:'0 var(--jt-space-4)',height:'var(--jt-control-height)',
      color:active?'var(--jt-color-accent-text)':'var(--jt-color-text-secondary)',
      font:`${active?'var(--jt-fw-semibold)':'var(--jt-fw-regular)'} var(--jt-fs-base)/1 var(--jt-font-base)`,
      boxShadow:active?'inset 3px 0 0 var(--jt-color-accent)':'none',
      transition:'background var(--jt-dur-fast) var(--jt-ease-standard),color var(--jt-dur-fast) var(--jt-ease-standard)',...style}},
    icon?React.createElement('span',{className:'material-symbols-rounded size-20',style:{flex:'0 0 auto',fontVariationSettings:active?"'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 20":undefined}},icon):null,
    collapsed?null:React.createElement('span',{style:{flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}},label),
    (!collapsed&&badge!=null)?React.createElement('span',{style:{font:'var(--jt-type-caption)',color:'var(--jt-color-text-tertiary)'}},badge):null);
}

export function Menu({items=[],activeKey,collapsed=false,onSelect,style}){
  return React.createElement('nav',{style:{display:'flex',flexDirection:'column',gap:2,...style}},
    items.map(it=>React.createElement(NavItem,{key:it.key,icon:it.icon,label:it.label,badge:it.badge,collapsed,
      active:it.key===activeKey,onClick:()=>onSelect&&onSelect(it.key)})));
}
