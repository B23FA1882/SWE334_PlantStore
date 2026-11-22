import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowDown, ArrowUpRight, Code2, Database, Github, Leaf, Mail, Moon, Sun, Sparkles } from 'lucide-react'

// БИЕ ДААЛТ 2: Хамгаалалтаас өмнө нийтэд харуулахыг зөвшөөрсөн мэдээллээр солих.
// Жишээ имэйл болон нэрийг өөрийн бодит утгаар шинэчилсний дараа нийтэлнэ.
const person = {
  name: 'Таны нэр',
  headline: 'Мэдээллийн систем, веб хөгжүүлэлтийн чиглэлээр суралцагч',
  statement: 'Санааг бодит ажилладаг дижитал бүтээгдэхүүн болгох дуртай.',
  about: 'React, өгөгдлийн сан, хэрэглэгчийн туршлага болон системийн уялдаа дээр ажиллах сонирхолтой. Сурсан зүйлээ бодит төслөөр баталгаажуулж, тасралтгүй хөгжихийг зорьдог.',
  email: 'your-email@example.com',
  github: 'https://github.com/B23FA1882',
}

const skills = ['React', 'JavaScript', 'Tailwind CSS', 'Supabase', 'PostgreSQL', 'GitHub', 'Vercel', 'BigQuery']
const projects = [
  { id: '01', type: 'Веб', title: 'GREENROOM', subtitle: 'Оффисын ургамлын дэлгүүр', description: 'Ургамлын интерактив тавиур, сагс, хэрэглэгчийн эрх, бүтээгдэхүүний удирдлага бүхий full-stack React + Supabase төсөл.', href: 'https://swe-334-plant-store.vercel.app', code: 'https://github.com/B23FA1882/SWE334_PlantStore', style: 'from-[#dce6d3] to-[#f5f1e6]', symbol: '🌿' },
  { id: '02', type: 'Веб', title: 'ISM DIGITAL MUSEUM', subtitle: 'Интерактив дижитал музей', description: 'Тэнхимийн түүх, багш нар, үйл явдал болон оюутны бүтээлийг нэг дор танилцуулах React + Supabase апп.', href: 'https://github.com/B23FA1882/SWE334_ISMmuseum', code: 'https://github.com/B23FA1882/SWE334_ISMmuseum', style: 'from-[#dce3f3] to-[#f6f0ef]', symbol: '🏛️' },
  { id: '03', type: 'Өгөгдөл', title: 'DATA QUALITY LAB', subtitle: 'BigQuery өгөгдлийн чанарын шинжилгээ', description: 'SQL ашиглан өгөгдөл цэвэрлэх, шалгах, DQ бүртгэл үүсгэх болон алдааг ангилсан сургалтын ажил. Шууд төслийн холбоосыг нэмж баталгаажуулах шаардлагатай.', href: 'https://github.com/B23FA1882?tab=repositories', code: 'https://github.com/B23FA1882?tab=repositories', style: 'from-[#f0e1cf] to-[#faf4e9]', symbol: '📊' },
]

export default function Portfolio() {
  const [dark, setDark] = useState(false)
  const [filter, setFilter] = useState('Бүгд')
  const [revealed, setRevealed] = useState(false)
  const visible = projects.filter(project => filter === 'Бүгд' || project.type === filter)
  const surface = dark ? 'bg-[#121b19] text-[#ebf0e8]' : 'bg-[#f8f7f2] text-[#1c342b]'
  const card = dark ? 'bg-[#1f302b] border-[#30453e]' : 'bg-white/80 border-[#d9e3d6]'
  const muted = dark ? 'text-[#acbcb0]' : 'text-[#697c70]'

  return <main className={`min-h-screen ${surface} transition-colors duration-300`}>
    <nav className="sticky top-0 z-30 border-b border-[#9eb69c]/20 backdrop-blur-xl bg-inherit">
      <div className="max-w-[1140px] mx-auto px-6 py-5 flex items-center justify-between gap-4">
        <a href="#ehlel" className="flex items-center gap-2 font-bold tracking-[.14em] text-sm"><span className="w-9 h-9 grid place-items-center rounded-full bg-[#a4c1a0]/30"><Code2 size={17}/></span>МИНИЙ ПОРТФОЛИО</a>
        <div className="flex items-center gap-3 md:gap-6 text-sm">
          <a className="hidden sm:inline hover:underline" href="#buteelee">Бүтээлүүд</a>
          <a className="hidden sm:inline hover:underline" href="#minii-tuhai">Миний тухай</a>
          <a className="hidden sm:inline hover:underline" href="#holboo">Холбоо</a>
          <button aria-label={dark ? 'Гэрэлтэй горим' : 'Харанхуй горим'} onClick={()=>setDark(v=>!v)} className="p-2 rounded-full border border-[#8aaa8b]/30">{dark?<Sun size={17}/>:<Moon size={17}/>}</button>
        </div>
      </div>
    </nav>

    <section id="ehlel" className="relative overflow-hidden max-w-[1140px] mx-auto px-6 pt-20 pb-20 md:pt-28 md:pb-28">
      <div aria-hidden="true" className="absolute -right-14 top-12 w-72 h-72 md:w-96 md:h-96 rounded-full border border-[#7da781]/35 grid place-items-center"><div className="w-[70%] h-[70%] rounded-full border border-[#7da781]/30 grid place-items-center"><div className="w-2/3 h-2/3 rounded-full bg-[#bfd7ac]/25"/></div></div>
      <motion.p initial={{opacity:0,y:15}} animate={{opacity:1,y:0}} className={`text-xs tracking-[.25em] font-bold uppercase ${muted}`}>ВЕБ ХӨГЖҮҮЛЭЛТ · МЭДЭЭЛЛИЙН СИСТЕМ</motion.p>
      <motion.h1 initial={{opacity:0,y:28}} animate={{opacity:1,y:0}} transition={{delay:.12}} className="relative mt-7 text-[clamp(64px,9vw,126px)] leading-[.94] tracking-[-.055em] max-w-[800px] serif">{person.name}<span className="text-[#679a70]">.</span></motion.h1>
      <motion.p initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{delay:.2}} className="relative mt-8 text-xl md:text-3xl max-w-[740px] leading-snug">{person.statement}</motion.p>
      <p className={`relative mt-5 text-base max-w-[650px] ${muted}`}>{person.headline}</p>
      <div className="relative mt-10 flex flex-wrap gap-3">
        <a href="#buteelee" className="inline-flex gap-2 items-center rounded-full px-6 py-3 bg-[#284e38] text-white font-semibold text-sm">Миний бүтээлүүд <ArrowDown size={18}/></a>
        <a href="#holboo" className="inline-flex gap-2 items-center rounded-full px-6 py-3 border border-[#7da781]/40 font-semibold text-sm">Холбоо барих <ArrowUpRight size={18}/></a>
      </div>
    </section>

    <section id="buteelee" className="px-6 pb-20 max-w-[1140px] mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-5 mb-9">
        <div><p className={`text-xs tracking-[.22em] font-bold ${muted}`}>01 / БҮТЭЭЛҮҮД</p><h2 className="serif text-5xl md:text-6xl mt-3">Хийсэн ажлууд</h2></div>
        <div className="flex gap-2">{['Бүгд','Веб','Өгөгдөл'].map(value=><button key={value} className={`text-sm px-4 py-2 rounded-full border transition ${filter===value?'bg-[#284e38] text-white border-transparent':'border-[#8aaa8b]/40'}`} onClick={()=>setFilter(value)}>{value}</button>)}</div>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">{visible.map(p=><motion.article key={p.id} layout initial={{opacity:0,scale:.96}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:.96}} whileHover={{y:-6}} className={`rounded-3xl border overflow-hidden ${card}`}>
          <div className={`h-44 bg-gradient-to-br ${p.style} flex items-center justify-center relative`}><span aria-hidden="true" className="text-7xl">{p.symbol}</span><span className="absolute top-5 left-5 text-xs font-bold tracking-widest text-[#314e3b]">{p.id}</span></div>
          <div className="p-6"><span className={`text-xs font-semibold tracking-widest ${muted}`}>{p.type}</span><h3 className="font-bold text-xl mt-2">{p.title}</h3><p className="font-medium text-sm mt-1">{p.subtitle}</p><p className={`text-sm leading-relaxed mt-4 min-h-[120px] ${muted}`}>{p.description}</p>
          <div className="flex gap-4 flex-wrap mt-4"><a href={p.href} target="_blank" rel="noopener noreferrer" className="text-sm underline flex items-center gap-1">Төсөл үзэх <ArrowUpRight size={15}/></a><a href={p.code} target="_blank" rel="noopener noreferrer" className="text-sm underline flex items-center gap-1">Код <Github size={15}/></a></div>
          </div>
        </motion.article>)}</AnimatePresence>
      </div>
    </section>

    <section id="minii-tuhai" className="border-y border-[#9eb69c]/25 py-20">
      <div className="max-w-[1140px] mx-auto px-6 grid md:grid-cols-2 gap-12 items-start">
        <div><p className={`text-xs tracking-[.22em] font-bold ${muted}`}>02 / ТАНИЛЦУУЛГА</p><h2 className="serif text-5xl md:text-6xl mt-4">Миний тухай</h2><p className={`mt-7 leading-8 ${muted}`}>{person.about}</p></div>
        <div className={`rounded-3xl border p-7 md:p-9 ${card}`}>
          <div className="flex gap-3 items-center mb-6"><Database size={23}/><h3 className="font-semibold text-xl">Ашигладаг технологиуд</h3></div>
          <div className="flex flex-wrap gap-2">{skills.map(skill=><span key={skill} className="rounded-full px-4 py-2 border border-[#8aaa8b]/35 text-sm">{skill}</span>)}</div>
          <button className="flex items-center gap-2 underline text-sm mt-7" onClick={()=>setRevealed(v=>!v)} aria-expanded={revealed}><Sparkles size={17}/> {revealed ? 'Нуух' : 'Нууц тэмдэглэл нээх'}</button>
          <AnimatePresence>{revealed&&<motion.p initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className={`overflow-hidden mt-3 text-sm ${muted}`}>Сайхан санаа хэрэгжихийн тулд эхлээд жижиг алхмаар туршиж үзэх хэрэгтэй. Энэ хэсэг портфолионы жижиг interactive “easter egg”.</motion.p>}</AnimatePresence>
        </div>
      </div>
    </section>

    <section id="holboo" className="max-w-[1140px] mx-auto px-6 py-20">
      <p className={`text-xs tracking-[.22em] font-bold ${muted}`}>03 / ХОЛБОО БАРИХ</p>
      <h2 className="serif text-5xl md:text-7xl mt-4 max-w-[850px]">Хамтдаа шинэ санаа хэрэгжүүлье.</h2>
      <div className="flex flex-wrap gap-3 mt-9">
        <a href={`mailto:${person.email}`} className="rounded-full px-6 py-3 bg-[#284e38] text-white inline-flex items-center gap-2"><Mail size={18}/> Имэйл илгээх</a>
        <a href={person.github} target="_blank" rel="noopener noreferrer" className="rounded-full px-6 py-3 border border-[#8aaa8b]/45 inline-flex items-center gap-2"><Github size={18}/> GitHub</a>
      </div>
      <p className={`text-xs mt-5 ${muted}`}>Анхаар: Энэ бол өөрийн нэр, имэйл болон гурав дахь төслийн шууд холбоосыг шинэчлэх шаардлагатай загвар. Хувийн мэдээллээ нийтлэхээс өмнө шалгаарай.</p>
    </section>

    <footer className={`border-t border-[#8aaa8b]/20 px-6 py-7 text-center text-sm ${muted}`}>© 2026 · Хувийн портфолио · <Link className="underline" to="/">GREENROOM дэлгүүр рүү буцах</Link></footer>
  </main>
}
