import React from 'react';

export function Field({label,required=false,hint,error,children,style}){
  return React.createElement('div',{style:{display:'flex',flexDirection:'column',gap:'var(--jt-space-2)',marginBottom:'var(--jt-space-5)',...style}},
    label?React.createElement('label',{style:{display:'flex',gap:4,font:'var(--jt-fw-medium) var(--jt-fs-sm)/1.4 var(--jt-font-base)',color:'var(--jt-color-text-secondary)'}},
      label,required?React.createElement('span',{style:{color:'var(--jt-color-error)'}},'*'):null):null,
    children,
    error?React.createElement('span',{style:{font:'var(--jt-type-sm)',color:'var(--jt-color-error-text)'}},error)
      :hint?React.createElement('span',{style:{font:'var(--jt-type-sm)',color:'var(--jt-color-text-tertiary)'}},hint):null);
}

export function FormSection({title,description,children,style}){
  return React.createElement('section',{style:{background:'var(--jt-color-bg-container)',border:'1px solid var(--jt-color-border)',
    borderRadius:'var(--jt-r-lg)',padding:'var(--jt-space-6)',marginBottom:'var(--jt-space-5)',...style}},
    title?React.createElement('h3',{style:{font:'var(--jt-type-h3)',margin:'0 0 var(--jt-space-1)'}},title):null,
    description?React.createElement('p',{style:{font:'var(--jt-type-sm)',color:'var(--jt-color-text-secondary)',margin:'0 0 var(--jt-space-5)'}},description):null,
    React.createElement('div',{style:{marginTop:title&&!description?'var(--jt-space-5)':0}},children));
}

export function FormActions({children,style}){
  return React.createElement('div',{style:{display:'flex',justifyContent:'flex-end',gap:'var(--jt-space-3)',
    padding:'var(--jt-space-4) var(--jt-space-6)',background:'var(--jt-color-bg-container)',borderTop:'1px solid var(--jt-color-border)',
    position:'sticky',bottom:0,...style}},children);
}
