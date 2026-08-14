import React from 'react';

export function Card({title,extra,footer,padded=true,accent,children,onClick,style}){
  return React.createElement('div',{onClick,style:{background:'var(--jt-color-bg-container)',border:'1px solid var(--jt-color-border)',
    borderRadius:'var(--jt-r-lg)',boxShadow:'var(--jt-shadow-1)',overflow:'hidden',cursor:onClick?'pointer':'default',
    transition:'box-shadow var(--jt-dur-fast) var(--jt-ease-standard)',...style}},
    (title||extra)?React.createElement('div',{style:{display:'flex',alignItems:'center',gap:'var(--jt-space-3)',
      padding:'var(--jt-space-4) var(--jt-space-5)',borderBottom:'1px solid var(--jt-color-split)'}},
      accent?React.createElement('span',{className:'material-symbols-rounded size-20',style:{color:accent.color||'var(--jt-color-text-secondary)'}},accent.icon):null,
      React.createElement('h3',{style:{flex:1,minWidth:0,font:'var(--jt-fw-semibold) var(--jt-fs-lg)/1.4 var(--jt-font-base)',margin:0}},title),
      extra):null,
    React.createElement('div',{style:{padding:padded?'var(--jt-space-5)':0}},children),
    footer?React.createElement('div',{style:{padding:'var(--jt-space-4) var(--jt-space-5)',borderTop:'1px solid var(--jt-color-split)',background:'var(--jt-color-bg-layout)'}},footer):null);
}

export function AppTile({name,icon,color,onClick}){
  const [h,setH]=React.useState(false);
  return React.createElement('button',{onClick,onMouseEnter:()=>setH(true),onMouseLeave:()=>setH(false),
    style:{display:'flex',flexDirection:'column',alignItems:'flex-start',gap:'var(--jt-space-4)',padding:'var(--jt-space-5)',
      background:'var(--jt-color-bg-container)',border:'1px solid var(--jt-color-border)',borderRadius:'var(--jt-r-lg)',cursor:'pointer',
      boxShadow:h?'var(--jt-shadow-2)':'var(--jt-shadow-1)',textAlign:'left',width:'100%',
      transition:'box-shadow var(--jt-dur-fast) var(--jt-ease-standard)'}},
    React.createElement('span',{style:{width:40,height:40,borderRadius:'var(--jt-r-md)',display:'grid',placeItems:'center',background:color,color:'#fff'}},
      React.createElement('span',{className:'material-symbols-rounded'},icon)),
    React.createElement('span',{style:{font:'var(--jt-fw-semibold) var(--jt-fs-base)/1.4 var(--jt-font-base)',color:'var(--jt-color-text)'}},name));
}
