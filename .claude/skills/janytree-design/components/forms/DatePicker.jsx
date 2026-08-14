import React from 'react';
import { Input } from './Input.jsx';

export function DatePicker({value,onChange,disabled=false,style,...rest}){
  return React.createElement(Input,{type:'date',value,onChange,disabled,numeric:true,style:{...style},...rest});
}
