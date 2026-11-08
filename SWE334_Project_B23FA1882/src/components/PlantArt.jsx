import { useId } from 'react'

// Original, scalable vector plant illustrations: no external image dependency.
export default function PlantArt({ plant, className = '' }) {
  const id = useId().replace(/:/g, '')
  const form = plant.form || 'monstera'
  const pot = plant.pot_color || '#b99070'
  const leaf = (x,y,w,h,deg,k,col='#416c43') =>
    <ellipse key={k} cx={x} cy={y} rx={w} ry={h} transform={`rotate(${deg} ${x} ${y})`} fill={col} stroke="#254d31" strokeWidth=".8" />
  const path = (d,k) => <path key={k} d={d} stroke="#4a6b42" strokeWidth="3.2" fill="none" strokeLinecap="round"/>
  let branches = []

  if (form === 'cactus') {
    branches = <g><rect x="92" y="74" width="39" height="118" rx="20" fill="#558a5d" stroke="#2e6644" strokeWidth="3"/><rect x="72" y="119" width="28" height="52" rx="14" fill="#649b66" stroke="#326e48" strokeWidth="2"/><rect x="124" y="104" width="27" height="58" rx="13" fill="#649b66" stroke="#326e48" strokeWidth="2"/>{Array.from({length:13},(_,i)=><path key={i} d={`M ${99+(i%3)*10} ${82+Math.floor(i/3)*20} l -4 -3 m 4 3 l 4 -3`} stroke="#d8e2b4" strokeWidth="1.2"/>)}</g>
  } else if (form === 'snake') {
    branches = <g>{Array.from({length:10},(_,i)=>{
      const x=77+i*8, h=55+(i*29)%77
      return <path key={i} d={`M ${x-6} 190 Q ${x-7} ${120-h/4} ${x+3} ${190-h} Q ${x+18} 126 ${x+9} 190 Z`} fill={i%2?'#5c8555':'#3c764b'} stroke="#d1b56e" strokeWidth="1.6"/>
    })}</g>
  } else if (form === 'succulent') {
    branches = <g>{Array.from({length:15},(_,i)=>{
      const a=i*24*Math.PI/180, ring=i<9?37:23
      return leaf(110+Math.cos(a)*ring,178+Math.sin(a)*ring*.45,10,27,i*24,i,'#69987a')
    })}</g>
  } else if (form === 'flower') {
    branches = <g>{[0,1,2].map((n)=><g key={n}>
      {path(`M 110 191 Q ${78+n*25} 118 ${83+n*27} ${86-n*10}`, 's'+n)}
      {[0,1,2,3,4].map((m)=>{
        const a=m*Math.PI*2/5
        return <ellipse key={m} cx={83+n*27+Math.cos(a)*10} cy={86-n*10+Math.sin(a)*10} rx="8" ry="11" fill="#f7f2e6" stroke="#ded8be" strokeWidth="1"/>
      })}
      <circle cx={83+n*27} cy={86-n*10} r="5" fill="#e5bd5e"/>
    </g>)}{leaf(87,139,14,28,-50,'l1')}{leaf(135,153,14,28,45,'l2')}</g>
  } else if (form === 'palm' || form === 'fern') {
    branches = <g>{Array.from({length:9},(_,i)=>{
      const angle=(i-4)*19
      const endX=110+(i-4)*16, endY=56+Math.abs(i-4)*15
      return <g key={i}>{path(`M110 191 Q ${110+(i-4)*11} 105 ${endX} ${endY}`, 's'+i)}
        {Array.from({length:5},(_,j)=>leaf(110+(endX-110)*(j+1)/5,169+(endY-169)*(j+1)/5,form==='fern'?7:11,form==='fern'?17:29,angle+(j%2?32:-32),j,i%2?'#46754d':'#5e905f'))}
      </g>
    })}</g>
  } else {
    const isTrail = form === 'pothos'
    const isFicus = form === 'ficus'
    branches = <g>{Array.from({length:9},(_,i)=>{
      const right=i%2===0, x=right?146+(i%3)*3:77-(i%3)*4, y=60+Math.floor(i/2)*27
      const baseX=isTrail?104:110
      const tipY=isTrail?y+42:y
      return <g key={i}>{path(`M${baseX} 192 Q ${baseX+(right?15:-15)} ${y+37} ${x} ${tipY}`, 's'+i)}
        {leaf(x,tipY,isFicus?21:23,isFicus?31:29,right?36:-36,'l'+i,i%3===0?'#36694b':i%3===1?'#60936b':'#4c8258')}
        {form==='monstera' && <path d={`M${x-6} ${tipY-9} l 12 18`} stroke="#a5c4a0" opacity=".55" strokeWidth="1.4"/>}
      </g>
    })}</g>
  }

  return <svg viewBox="0 0 220 300" className={className} role="img" aria-label={plant.name}>
    <defs>
      <linearGradient id={`pot-${id}`} x1="0" y1="0" x2="1" y2=".25"><stop offset="0" stopColor="#694a36"/><stop offset=".2" stopColor={pot}/><stop offset=".67" stopColor={pot}/><stop offset="1" stopColor="#7a5344"/></linearGradient>
      <linearGradient id={`leaf-${id}`} x1="0" y1="0" x2=".9" y2=".8"><stop stopColor="#79aa76"/><stop offset="1" stopColor="#275a3b"/></linearGradient>
      <radialGradient id={`shade-${id}`}><stop stopColor="#5b4c36" stopOpacity=".27"/><stop offset="1" stopColor="#5b4c36" stopOpacity="0"/></radialGradient>
    </defs>
    <ellipse cx="110" cy="275" rx="73" ry="12" fill={`url(#shade-${id})`}/>
    {branches}
    <ellipse cx="110" cy="191" rx="47" ry="11" fill="#584337"/>
    <path d="M62 188 L69 264 Q70 272 80 272 H140 Q150 272 151 263 L158 188 Z" fill={`url(#pot-${id})`} stroke="#a77e68" strokeWidth="1.5"/>
    <ellipse cx="110" cy="191" rx="49" ry="11" fill={pot} stroke="#866450" strokeWidth="2.5"/>
    <ellipse cx="110" cy="194" rx="39" ry="6" fill="#524338"/>
    <path d="M73 213 Q80 248 85 261" stroke="#f9efe1" strokeWidth="8" opacity=".15" fill="none" strokeLinecap="round"/>
    <path d="M92 241 H128" stroke="#f9eee5" strokeWidth="1.7" opacity=".45"/>
    <text x="110" y="253" fontSize="8" letterSpacing="3" fontWeight="700" fill="#f9eee5" textAnchor="middle">GREENROOM</text>
  </svg>
}
