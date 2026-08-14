import React from 'react';

export function Skeleton({width='100%',height=14,radius='var(--jt-r-sm)',style}){
  return React.createElement('span',{style:{display:'block',width,height,borderRadius:radius,
    background:'linear-gradient(90deg,var(--jt-color-split) 25%,var(--jt-color-bg-subtle) 37%,var(--jt-color-split) 63%)',
    backgroundSize:'400% 100%',animation:'jt-shimmer 1.2s ease-in-out infinite',...style}});
}

export function Spin({size=24,style}){
  return React.createElement('span',{className:'material-symbols-rounded',
    style:{fontSize:size,color:'var(--jt-color-accent)',animation:'jt-spin 1s linear infinite',display:'inline-block',...style}},'progress_activity');
}
