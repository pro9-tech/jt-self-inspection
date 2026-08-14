import React from 'react';

export function Icon({name,size=24,filled=false,weight=400,color='currentColor',style,...rest}){
  return React.createElement('span',{
    className:'material-symbols-rounded',
    style:{fontSize:size+'px',color,lineHeight:1,
      fontVariationSettings:`'FILL' ${filled?1:0},'wght' ${weight},'GRAD' 0,'opsz' ${size}`,
      ...style},...rest},name);
}
