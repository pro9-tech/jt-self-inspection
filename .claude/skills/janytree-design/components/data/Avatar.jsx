import React from 'react';

export function Avatar({name='',src,size=32,style}){
  const initials=name.trim().slice(0,2);
  return React.createElement('span',{style:{width:size,height:size,flex:'0 0 auto',borderRadius:'var(--jt-r-full)',overflow:'hidden',
    display:'grid',placeItems:'center',background:'var(--jt-color-primary-bg)',color:'var(--jt-color-text-secondary)',
    font:`var(--jt-fw-semibold) ${Math.round(size*0.38)}px/1 var(--jt-font-base)`,...style}},
    src?React.createElement('img',{src,alt:name,style:{width:'100%',height:'100%',objectFit:'cover'}}):initials);
}
