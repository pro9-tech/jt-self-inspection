import React from 'react';

export function Upload({label='파일을 끌어다 놓거나 클릭해 선택',hint,files=[],onPick,progress,style}){
  const [over,setOver]=React.useState(false);
  return React.createElement('div',{style:{display:'flex',flexDirection:'column',gap:'var(--jt-space-3)',...style}},
    React.createElement('div',{onClick:onPick,onDragOver:e=>{e.preventDefault();setOver(true)},onDragLeave:()=>setOver(false),
      onDrop:e=>{e.preventDefault();setOver(false);onPick&&onPick(e)},
      style:{display:'flex',flexDirection:'column',alignItems:'center',gap:'var(--jt-space-2)',padding:'var(--jt-space-7) var(--jt-space-5)',
        border:'1px dashed '+(over?'var(--jt-color-accent)':'var(--jt-color-border)'),borderRadius:'var(--jt-r-md)',cursor:'pointer',
        background:over?'var(--jt-color-accent-bg)':'var(--jt-color-bg-container)',textAlign:'center',
        transition:'border-color var(--jt-dur-fast) var(--jt-ease-standard),background var(--jt-dur-fast) var(--jt-ease-standard)'}},
      React.createElement('span',{className:'material-symbols-rounded',style:{fontSize:32,color:'var(--jt-color-text-tertiary)'}},'upload_file'),
      React.createElement('span',{style:{font:'var(--jt-type-body)',color:'var(--jt-color-text)'}},label),
      hint?React.createElement('span',{style:{font:'var(--jt-type-sm)',color:'var(--jt-color-text-tertiary)'}},hint):null),
    progress!=null?React.createElement('div',{style:{height:4,borderRadius:'var(--jt-r-full)',background:'var(--jt-color-split)',overflow:'hidden'}},
      React.createElement('div',{style:{width:progress+'%',height:'100%',background:'var(--jt-color-accent)',transition:'width var(--jt-dur-base) var(--jt-ease-standard)'}})):null,
    files.length?React.createElement('ul',{style:{listStyle:'none',margin:0,padding:0,display:'flex',flexDirection:'column',gap:'var(--jt-space-2)'}},
      files.map((fl,i)=>React.createElement('li',{key:i,style:{display:'flex',alignItems:'center',gap:'var(--jt-space-3)',padding:'var(--jt-space-2) var(--jt-space-3)',
        border:'1px solid var(--jt-color-border)',borderRadius:'var(--jt-r-md)',font:'var(--jt-type-sm)',background:'var(--jt-color-bg-container)'}},
        React.createElement('span',{className:'material-symbols-rounded size-20',style:{color:'var(--jt-color-text-tertiary)'}},'description'),
        React.createElement('span',{style:{flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}},fl.name),
        React.createElement('span',{className:'jt-num',style:{color:'var(--jt-color-text-tertiary)'}},fl.size)))):null);
}
