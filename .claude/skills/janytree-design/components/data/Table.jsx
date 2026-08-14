import React from 'react';

export function Table({columns=[],rows=[],rowKey='id',selectedKeys=[],onRowClick,sort,onSort,empty,style}){
  return React.createElement('div',{style:{overflowX:'auto',border:'1px solid var(--jt-color-border)',borderRadius:'var(--jt-r-lg)',background:'var(--jt-color-bg-container)',...style}},
    React.createElement('table',{style:{width:'100%',borderCollapse:'collapse',font:'var(--jt-fw-regular) var(--jt-density-fs-base)/var(--jt-density-lh) var(--jt-font-base)'}},
      React.createElement('thead',null,
        React.createElement('tr',null,columns.map(c=>React.createElement('th',{key:c.key,onClick:()=>c.sortable&&onSort&&onSort(c.key),
          style:{textAlign:c.align||'left',padding:'var(--jt-cell-pad-y) var(--jt-cell-pad-x)',background:'var(--jt-color-table-header-bg)',
            borderBottom:'1px solid var(--jt-color-border)',font:'var(--jt-fw-semibold) var(--jt-density-fs-sm)/1.4 var(--jt-font-base)',
            color:'var(--jt-color-text-secondary)',whiteSpace:'nowrap',cursor:c.sortable?'pointer':'default',width:c.width,
            position:'sticky',top:0,zIndex:1}},
          React.createElement('span',{style:{display:'inline-flex',alignItems:'center',gap:4,justifyContent:c.align==='right'?'flex-end':'flex-start'}},
            c.title,
            c.sortable?React.createElement('span',{className:'material-symbols-rounded',style:{fontSize:16,color:sort===c.key?'var(--jt-color-accent)':'var(--jt-color-text-tertiary)'}},'unfold_more'):null))))),
      React.createElement('tbody',null,
        rows.length===0
          ?React.createElement('tr',null,React.createElement('td',{colSpan:columns.length,style:{padding:'var(--jt-space-9)',textAlign:'center',color:'var(--jt-color-text-tertiary)'}},empty||'데이터가 없습니다'))
          :rows.map((r,i)=>{
            const k=r[rowKey]!=null?r[rowKey]:i, on=selectedKeys.indexOf(k)>=0;
            return React.createElement('tr',{key:k,onClick:()=>onRowClick&&onRowClick(r),
              style:{background:on?'var(--jt-color-row-selected)':'transparent',cursor:onRowClick?'pointer':'default',
                transition:'background var(--jt-dur-fast) var(--jt-ease-standard)'},
              onMouseEnter:e=>{if(!on)e.currentTarget.style.background='var(--jt-color-row-hover)'},
              onMouseLeave:e=>{if(!on)e.currentTarget.style.background='transparent'}},
              columns.map(c=>React.createElement('td',{key:c.key,
                style:{textAlign:c.align||'left',padding:'var(--jt-cell-pad-y) var(--jt-cell-pad-x)',borderBottom:'1px solid var(--jt-color-split)',
                  fontFamily:c.numeric?'var(--jt-font-num)':undefined,fontVariantNumeric:c.numeric?'tabular-nums':undefined,
                  color:c.muted?'var(--jt-color-text-secondary)':'var(--jt-color-text)',whiteSpace:c.wrap?'normal':'nowrap'}},
                c.render?c.render(r):r[c.key])));
          }))));
}
