import React from 'react';

export const fieldBase={
  width:'100%',height:'var(--jt-control-height)',padding:'0 var(--jt-space-3)',
  font:'var(--jt-fw-regular) var(--jt-density-fs-base)/1 var(--jt-font-base)',color:'var(--jt-color-text)',
  background:'var(--jt-color-bg-container)',border:'1px solid var(--jt-color-border)',borderRadius:'var(--jt-r-md)',
  outline:'none',transition:'border-color var(--jt-dur-fast) var(--jt-ease-standard),box-shadow var(--jt-dur-fast) var(--jt-ease-standard)'
};

export function Input({value,onChange,placeholder,type='text',size='md',status,disabled=false,prefix,suffix,numeric=false,style,...rest}){
  const [focus,setFocus]=React.useState(false);
  const ring=status==='error'?'var(--jt-color-error)':status==='warning'?'var(--jt-color-warning)':'var(--jt-color-focus-ring)';
  return React.createElement('div',{style:{display:'flex',alignItems:'center',gap:'var(--jt-space-2)',
    height:size==='sm'?'var(--jt-control-height-sm)':size==='lg'?'var(--jt-control-height-lg)':'var(--jt-control-height)',
    padding:'0 var(--jt-space-3)',background:disabled?'var(--jt-color-bg-subtle)':'var(--jt-color-bg-container)',
    border:'1px solid '+(focus?ring:status==='error'?'var(--jt-color-error-border)':'var(--jt-color-border)'),
    borderRadius:'var(--jt-r-md)',boxShadow:focus?'var(--jt-focus-ring)':'none',opacity:disabled?.6:1,
    transition:'border-color var(--jt-dur-fast) var(--jt-ease-standard),box-shadow var(--jt-dur-fast) var(--jt-ease-standard)',...style}},
    prefix?React.createElement('span',{className:'material-symbols-rounded size-20',style:{color:'var(--jt-color-text-tertiary)'}},prefix):null,
    React.createElement('input',{type,value,onChange,placeholder,disabled,onFocus:()=>setFocus(true),onBlur:()=>setFocus(false),
      style:{flex:1,minWidth:0,border:0,outline:'none',background:'transparent',color:'var(--jt-color-text)',
        font:`var(--jt-fw-regular) var(--jt-density-fs-base)/1.4 ${numeric?'var(--jt-font-num)':'var(--jt-font-base)'}`,
        fontVariantNumeric:numeric?'tabular-nums':undefined,textAlign:numeric?'right':'left'},...rest}),
    suffix?React.createElement('span',{style:{color:'var(--jt-color-text-tertiary)',font:'var(--jt-type-sm)'}},suffix):null);
}

export function InputNumber({value,onChange,step=1,unit,...rest}){
  return React.createElement(Input,{value,onChange,type:'number',numeric:true,suffix:unit,step,...rest});
}

export function Textarea({value,onChange,placeholder,rows=4,disabled=false,style,...rest}){
  const [focus,setFocus]=React.useState(false);
  return React.createElement('textarea',{value,onChange,placeholder,rows,disabled,
    onFocus:()=>setFocus(true),onBlur:()=>setFocus(false),
    style:{...fieldBase,height:'auto',padding:'var(--jt-space-3)',lineHeight:'var(--jt-density-lh)',resize:'vertical',
      borderColor:focus?'var(--jt-color-focus-ring)':'var(--jt-color-border)',boxShadow:focus?'var(--jt-focus-ring)':'none',...style},...rest});
}
