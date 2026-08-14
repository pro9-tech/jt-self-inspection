import React from 'react';

export function AppShell({sider,header,children,collapsed=false,style}){
  return React.createElement('div',{style:{display:'flex',minHeight:'100%',height:'100%',background:'var(--jt-color-bg-layout)',color:'var(--jt-color-text)',font:'var(--jt-type-body)',...style}},
    sider?React.createElement('aside',{style:{width:collapsed?'var(--jt-sider-collapsed)':'var(--jt-sider-width)',flex:'0 0 auto',
      background:'var(--jt-color-bg-container)',borderRight:'1px solid var(--jt-color-border)',display:'flex',flexDirection:'column',
      transition:'width var(--jt-dur-base) var(--jt-ease-standard)',overflow:'hidden'}},sider):null,
    React.createElement('div',{style:{flex:1,minWidth:0,display:'flex',flexDirection:'column'}},
      header?React.createElement('header',{style:{height:'var(--jt-header-height)',flex:'0 0 auto',display:'flex',alignItems:'center',
        gap:'var(--jt-space-4)',padding:'0 var(--jt-space-6)',background:'var(--jt-color-bg-container)',borderBottom:'1px solid var(--jt-color-border)'}},header):null,
      React.createElement('main',{style:{flex:1,minHeight:0,overflow:'auto',padding:'var(--jt-space-6)'}},children)));
}

export function SiderSection({title,children}){
  return React.createElement('div',{style:{padding:'var(--jt-space-3) 0'}},
    title?React.createElement('div',{style:{padding:'0 var(--jt-space-4) var(--jt-space-2)',font:'var(--jt-fw-semibold) var(--jt-fs-xs)/1.4 var(--jt-font-base)',
      letterSpacing:'.06em',textTransform:'uppercase',color:'var(--jt-color-text-tertiary)'}},title):null,children);
}
