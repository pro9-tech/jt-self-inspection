import React from 'react';

const roles={
  display:{font:'var(--jt-type-display)',tag:'h1'},
  h1:{font:'var(--jt-type-h1)',tag:'h1'},
  h2:{font:'var(--jt-type-h2)',tag:'h2'},
  h3:{font:'var(--jt-type-h3)',tag:'h3'},
  bodyLg:{font:'var(--jt-type-body-lg)',tag:'p'},
  body:{font:'var(--jt-type-body)',tag:'p'},
  sm:{font:'var(--jt-type-sm)',tag:'p'},
  caption:{font:'var(--jt-type-caption)',tag:'span'}
};
const tones={default:'var(--jt-color-text)',secondary:'var(--jt-color-text-secondary)',tertiary:'var(--jt-color-text-tertiary)',accent:'var(--jt-color-accent)',inverse:'var(--jt-color-text-inverse)'};

export function Text({role='body',tone='default',as,numeric=false,children,style,...rest}){
  const r=roles[role]||roles.body;
  return React.createElement(as||r.tag,{style:{font:r.font,color:tones[tone],margin:0,
    fontFamily:numeric?'var(--jt-font-num)':undefined,fontVariantNumeric:numeric?'tabular-nums':undefined,...style},...rest},children);
}
