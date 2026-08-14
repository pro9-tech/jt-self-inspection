import React from 'react';

const heights={sm:'var(--jt-control-height-sm)',md:'var(--jt-control-height)',lg:'var(--jt-control-height-lg)'};
const pads={sm:'0 10px',md:'0 14px',lg:'0 20px'};
const fonts={sm:'var(--jt-fs-sm)',md:'var(--jt-fs-base)',lg:'var(--jt-fs-lg)'};

export function Button({variant='primary',size='md',danger=false,disabled=false,block=false,iconLeft,iconRight,loading=false,onClick,type='button',children,style,...rest}){
  const base={display:'inline-flex',alignItems:'center',justifyContent:'center',gap:'var(--jt-space-2)',
    height:heights[size],padding:pads[size],font:`var(--jt-fw-medium) ${fonts[size]}/1 var(--jt-font-base)`,
    borderRadius:'var(--jt-r-md)',border:'1px solid transparent',cursor:disabled?'not-allowed':'pointer',
    width:block?'100%':'auto',whiteSpace:'nowrap',opacity:disabled?.45:1,
    transition:'background var(--jt-dur-fast) var(--jt-ease-standard),color var(--jt-dur-fast) var(--jt-ease-standard),border-color var(--jt-dur-fast) var(--jt-ease-standard)'};
  const looks={
    primary:{background:danger?'var(--jt-color-error-solid)':'var(--jt-color-primary)',color:danger?'#fff':'var(--jt-color-on-primary)'},
    default:{background:'var(--jt-color-bg-container)',color:danger?'var(--jt-color-error-text)':'var(--jt-color-text)',borderColor:danger?'var(--jt-color-error-border)':'var(--jt-color-border)'},
    text:{background:'transparent',color:danger?'var(--jt-color-error-text)':'var(--jt-color-text)'},
    link:{background:'transparent',color:'var(--jt-color-link)',padding:0,height:'auto'}
  };
  return React.createElement('button',{type,disabled,onClick,style:{...base,...looks[variant],...style},...rest},
    loading?React.createElement('span',{className:'material-symbols-rounded size-20',style:{animation:'jt-spin 1s linear infinite'}},'progress_activity'):
      (iconLeft?React.createElement('span',{className:'material-symbols-rounded size-20'},iconLeft):null),
    children,
    iconRight?React.createElement('span',{className:'material-symbols-rounded size-20'},iconRight):null);
}
