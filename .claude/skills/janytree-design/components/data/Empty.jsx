import React from 'react';

export function Empty({icon='inbox',title='데이터가 없습니다',description,action,style}){
  return React.createElement('div',{style:{display:'flex',flexDirection:'column',alignItems:'center',gap:'var(--jt-space-3)',
    padding:'var(--jt-space-10) var(--jt-space-6)',textAlign:'center',...style}},
    React.createElement('span',{className:'material-symbols-rounded',style:{fontSize:40,color:'var(--jt-color-text-tertiary)'}},icon),
    React.createElement('p',{style:{font:'var(--jt-fw-semibold) var(--jt-fs-lg)/1.4 var(--jt-font-base)',margin:0}},title),
    description?React.createElement('p',{style:{font:'var(--jt-type-body)',color:'var(--jt-color-text-secondary)',margin:0,maxWidth:360}},description):null,
    action?React.createElement('div',{style:{marginTop:'var(--jt-space-2)'}},action):null);
}
