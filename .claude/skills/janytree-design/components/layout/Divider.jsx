import React from 'react';

export function Divider({vertical=false,label,spacing='var(--jt-space-4)',style}){
  if(vertical) return React.createElement('span',{style:{display:'inline-block',width:1,alignSelf:'stretch',background:'var(--jt-color-split)',margin:`0 ${spacing}`,...style}});
  if(label) return React.createElement('div',{style:{display:'flex',alignItems:'center',gap:'var(--jt-space-3)',margin:`${spacing} 0`,...style}},
    React.createElement('span',{style:{flex:1,height:1,background:'var(--jt-color-split)'}}),
    React.createElement('span',{style:{font:'var(--jt-type-sm)',color:'var(--jt-color-text-tertiary)'}},label),
    React.createElement('span',{style:{flex:1,height:1,background:'var(--jt-color-split)'}}));
  return React.createElement('hr',{style:{border:0,height:1,background:'var(--jt-color-split)',margin:`${spacing} 0`,...style}});
}
