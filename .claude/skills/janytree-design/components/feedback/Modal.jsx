import React from 'react';

export function Modal({open,title,onClose,footer,width=520,children}){
  if(!open) return null;
  return React.createElement('div',{style:{position:'fixed',inset:0,zIndex:100,display:'grid',placeItems:'center',
    background:'var(--jt-color-overlay)',padding:'var(--jt-space-6)',animation:'jt-fade var(--jt-dur-slow) var(--jt-ease-decelerate)'},onClick:onClose},
    React.createElement('div',{onClick:e=>e.stopPropagation(),style:{width:'100%',maxWidth:width,maxHeight:'85vh',display:'flex',flexDirection:'column',
      background:'var(--jt-color-bg-elevated)',borderRadius:'var(--jt-r-lg)',boxShadow:'var(--jt-shadow-3)',overflow:'hidden',
      animation:'jt-pop var(--jt-dur-slow) var(--jt-ease-decelerate)'}},
      React.createElement('div',{style:{display:'flex',alignItems:'center',gap:'var(--jt-space-3)',padding:'var(--jt-space-5) var(--jt-space-6)',borderBottom:'1px solid var(--jt-color-split)'}},
        React.createElement('h2',{style:{flex:1,font:'var(--jt-fw-bold) var(--jt-fs-xl)/1.4 var(--jt-font-base)',margin:0}},title),
        React.createElement('button',{onClick:onClose,'aria-label':'닫기',style:{border:0,background:'transparent',cursor:'pointer',color:'var(--jt-color-text-tertiary)',padding:0,height:24}},
          React.createElement('span',{className:'material-symbols-rounded'},'close'))),
      React.createElement('div',{style:{padding:'var(--jt-space-6)',overflow:'auto',flex:1}},children),
      footer?React.createElement('div',{style:{display:'flex',justifyContent:'flex-end',gap:'var(--jt-space-3)',padding:'var(--jt-space-4) var(--jt-space-6)',borderTop:'1px solid var(--jt-color-split)'}},footer):null));
}

export function Drawer({open,title,onClose,width=420,footer,children}){
  if(!open) return null;
  return React.createElement('div',{style:{position:'fixed',inset:0,zIndex:100,background:'var(--jt-color-overlay)',animation:'jt-fade var(--jt-dur-slow) var(--jt-ease-decelerate)'},onClick:onClose},
    React.createElement('aside',{onClick:e=>e.stopPropagation(),style:{position:'absolute',top:0,right:0,bottom:0,width:'100%',maxWidth:width,
      background:'var(--jt-color-bg-elevated)',boxShadow:'var(--jt-shadow-4)',display:'flex',flexDirection:'column',
      animation:'jt-slide var(--jt-dur-slow) var(--jt-ease-decelerate)'}},
      React.createElement('div',{style:{display:'flex',alignItems:'center',gap:'var(--jt-space-3)',padding:'var(--jt-space-5) var(--jt-space-6)',borderBottom:'1px solid var(--jt-color-split)'}},
        React.createElement('h2',{style:{flex:1,font:'var(--jt-fw-bold) var(--jt-fs-xl)/1.4 var(--jt-font-base)',margin:0}},title),
        React.createElement('button',{onClick:onClose,'aria-label':'닫기',style:{border:0,background:'transparent',cursor:'pointer',color:'var(--jt-color-text-tertiary)',padding:0,height:24}},
          React.createElement('span',{className:'material-symbols-rounded'},'close'))),
      React.createElement('div',{style:{padding:'var(--jt-space-6)',overflow:'auto',flex:1}},children),
      footer?React.createElement('div',{style:{display:'flex',justifyContent:'flex-end',gap:'var(--jt-space-3)',padding:'var(--jt-space-4) var(--jt-space-6)',borderTop:'1px solid var(--jt-color-split)'}},footer):null));
}
