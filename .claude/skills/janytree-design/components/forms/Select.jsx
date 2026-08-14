import React from 'react';

export function Select({value,onChange,options=[],placeholder='선택',disabled=false,size='md',style,...rest}){
  const [focus,setFocus]=React.useState(false);
  return React.createElement('div',{style:{position:'relative',display:'block',...style}},
    React.createElement('select',{value,onChange,disabled,onFocus:()=>setFocus(true),onBlur:()=>setFocus(false),
      style:{width:'100%',height:size==='sm'?'var(--jt-control-height-sm)':'var(--jt-control-height)',
        padding:'0 var(--jt-space-8) 0 var(--jt-space-3)',appearance:'none',cursor:disabled?'not-allowed':'pointer',
        font:'var(--jt-fw-regular) var(--jt-density-fs-base)/1 var(--jt-font-base)',color:value?'var(--jt-color-text)':'var(--jt-color-text-tertiary)',
        background:disabled?'var(--jt-color-bg-subtle)':'var(--jt-color-bg-container)',
        border:'1px solid '+(focus?'var(--jt-color-focus-ring)':'var(--jt-color-border)'),borderRadius:'var(--jt-r-md)',
        boxShadow:focus?'var(--jt-focus-ring)':'none',outline:'none',opacity:disabled?.6:1},...rest},
      React.createElement('option',{value:'',disabled:true},placeholder),
      options.map(o=>React.createElement('option',{key:o.value,value:o.value},o.label))),
    React.createElement('span',{className:'material-symbols-rounded size-20',
      style:{position:'absolute',right:'var(--jt-space-3)',top:'50%',transform:'translateY(-50%)',pointerEvents:'none',color:'var(--jt-color-text-tertiary)'}},'expand_more'));
}
