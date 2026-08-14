import React from 'react';

export function Progress({value=0,tone,showLabel=true,size='md',style}){
  const done=value>=100;
  // tone 으로 변수 이름을 조립하는 곳. 접두사 --jt- 를 반드시 포함해야 한다.
  const color=tone?`var(--jt-color-${tone})`:done?'var(--jt-color-success)':'var(--jt-color-accent)';
  return React.createElement('div',{style:{display:'flex',alignItems:'center',gap:'var(--jt-space-3)',...style}},
    React.createElement('div',{style:{flex:1,height:size==='sm'?4:8,borderRadius:'var(--jt-r-full)',background:'var(--jt-color-split)',overflow:'hidden'}},
      React.createElement('div',{style:{width:Math.min(100,Math.max(0,value))+'%',height:'100%',background:color,borderRadius:'var(--jt-r-full)',
        transition:'width var(--jt-dur-base) var(--jt-ease-standard)'}})),
    showLabel?React.createElement('span',{className:'jt-num',style:{font:'var(--jt-type-sm)',color:'var(--jt-color-text-secondary)',minWidth:36,textAlign:'right'}},Math.round(value)+'%'):null);
}
