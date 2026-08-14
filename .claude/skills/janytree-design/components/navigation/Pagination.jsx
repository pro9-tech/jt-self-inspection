import React from 'react';

export function Pagination({page=1,pageSize=20,total=0,onChange,style}){
  const pages=Math.max(1,Math.ceil(total/pageSize));
  const win=[];for(let i=Math.max(1,page-2);i<=Math.min(pages,page+2);i++)win.push(i);
  const btn=(on)=>({minWidth:32,height:32,padding:'0 var(--jt-space-2)',border:'1px solid '+(on?'var(--jt-color-accent)':'var(--jt-color-border)'),
    background:on?'var(--jt-color-accent-bg)':'var(--jt-color-bg-container)',color:on?'var(--jt-color-accent-text)':'var(--jt-color-text)',
    borderRadius:'var(--jt-r-sm)',cursor:'pointer',fontFamily:'var(--jt-font-num)',fontSize:'var(--jt-fs-sm)',fontVariantNumeric:'tabular-nums',
    fontWeight:on?'var(--jt-fw-semibold)':'var(--jt-fw-regular)'});
  return React.createElement('div',{style:{display:'flex',alignItems:'center',gap:'var(--jt-space-2)',...style}},
    React.createElement('span',{style:{font:'var(--jt-type-sm)',color:'var(--jt-color-text-secondary)',marginRight:'var(--jt-space-2)'}},`총 ${total.toLocaleString()}건`),
    React.createElement('button',{onClick:()=>onChange&&onChange(Math.max(1,page-1)),disabled:page<=1,style:{...btn(false),opacity:page<=1?.4:1}},'‹'),
    win.map(p=>React.createElement('button',{key:p,onClick:()=>onChange&&onChange(p),style:btn(p===page)},p)),
    React.createElement('button',{onClick:()=>onChange&&onChange(Math.min(pages,page+1)),disabled:page>=pages,style:{...btn(false),opacity:page>=pages?.4:1}},'›'));
}
