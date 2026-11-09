import { useEffect, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import { ChevronLeft, ChevronDown, Leaf, Minus, Plus, ShoppingBag, Sun, Droplets, X } from 'lucide-react'
import PlantArt from './PlantArt'
import { money } from '../data/demoPlants'
import { useStore } from '../store/StoreProvider'

const spring = { type: 'spring', bounce: 0, duration: 0.55 }

export function PlantDetail({ plant, onClose }) {
  const { addToCart } = useStore()
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [section, setSection] = useState('Тайлбар')
  useEffect(() => {
    if (!onClose) return
    const key = event => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [onClose])
  const info = [
    ['Тайлбар', plant.description || 'Оффисын орчныг ногооруулж, тайван уур амьсгал бүрдүүлэх ургамал.'],
    ['Арчилгаа', `Гэрэл: ${plant.light || 'Шууд бус гэрэл'}. Усалгаа: ${plant.water || 'Хөрс хатах үед'}.`],
    ['Хүргэлт', 'Улаанбаатар хотод хүргэлтийн нөхцөлийг захиалга баталгаажуулах үед тохиролцоно.'],
  ]
  return <div className="product-detail">
    <div className="detail-art">
      <motion.div layoutId={`plant-${plant.id}`} transition={spring} className="detail-plant">
        {plant.image_url ? <img src={plant.image_url} alt={plant.name} className="h-full w-full object-contain"/> : <PlantArt plant={plant} className="h-full w-full"/>}
      </motion.div>
      <div className="detail-pedestal"/>
      <p className="mt-6 text-xs uppercase tracking-[.23em] text-[#8b8e7a]">Grown for good spaces</p>
    </div>
    <div className="detail-copy">
      {onClose && <button onClick={onClose} className="back-link"><ChevronLeft size={18}/> Тавиур руу буцах</button>}
      <p className="eyebrow">{plant.category || 'Тасалгааны ургамал'} · GREENROOM COLLECTION</p>
      <h2 className="serif text-5xl md:text-[64px] leading-[1.02] mt-3">{plant.name}</h2>
      <p className="text-[#768071] mt-4 text-lg">{plant.subtitle || 'Оффисын ургамал'}</p>
      <div className="flex items-center gap-2 mt-6 text-sm text-[#637663]"><Leaf size={16}/> Арчилгааны зөвлөгөөтэй</div>
      <p className="mt-6 text-3xl font-semibold tracking-tight">{money(plant.price)}</p>
      <p className="mt-5 leading-relaxed text-[#6b7167]">{plant.description}</p>
      <div className="grid grid-cols-2 gap-3 mt-7">
        <div className="info-pill"><Sun size={19}/><span><b>Гэрэл</b><small>{plant.light || 'Шууд бус гэрэл'}</small></span></div>
        <div className="info-pill"><Droplets size={19}/><span><b>Усалгаа</b><small>{plant.water || 'Хөрс хатах үед'}</small></span></div>
      </div>
      <div className="flex gap-3 mt-8">
        <div className="quantity"><button aria-label="Хасах" onClick={()=>setQty(q=>Math.max(1,q-1))}><Minus size={17}/></button><span>{qty}</span><button aria-label="Нэмэх" onClick={()=>setQty(q=>Math.min(Math.min(plant.stock || 1,20),q+1))}><Plus size={17}/></button></div>
        <button className="primary-btn flex-1" disabled={!plant.stock} onClick={()=>{addToCart(plant,qty);setAdded(true);setTimeout(()=>setAdded(false),1800)}}><ShoppingBag size={19}/>{added?'Сагсанд нэмлээ':plant.stock?'Сагсанд нэмэх':'Дууссан'}</button>
      </div>
      <div className="mt-8 border-t border-[#dadbd1]">
        {info.map(([title,body])=><div className="border-b border-[#dadbd1]" key={title}>
          <button className="w-full py-4 flex justify-between items-center font-medium" onClick={()=>setSection(section===title?'':title)} aria-expanded={section===title}>{title}<ChevronDown size={17} className={section===title?'rotate-180 transition':'transition'}/></button>
          <AnimatePresence initial={false}>{section===title && <motion.p initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden pb-4 text-sm text-[#697068] leading-relaxed">{body}</motion.p>}</AnimatePresence>
        </div>)}
      </div>
    </div>
  </div>
}

export default function PlantShelf({ plants }) {
  const [openId, setOpenId] = useState(null)
  const rows = [plants.slice(0,4),plants.slice(4,8),plants.slice(8,12)].filter(row=>row.length)
  const open = plants.find(plant=>plant.id===openId)
  return <LayoutGroup><div className="shelf-wrap" aria-label="Ургамлын тавиур">
    {rows.map((row,i)=><section key={i} className="shelf-row">
      <div className="shelf-scroll">
        <div className="shelf-grid">
          {row.map(plant=><div key={plant.id} className="text-center min-w-0">
            {openId===plant.id ? <div className="plant-slot" /> : 
            <motion.button
              layoutId={`plant-${plant.id}`} transition={spring}
              onClick={()=>setOpenId(plant.id)} className="plant-slot"
              aria-label={`${plant.name} ${money(plant.price)} — дэлгэрэнгүй`}>
              {plant.image_url ? <img src={plant.image_url} alt="" className="h-full w-full object-contain"/> : <PlantArt plant={plant} className="h-full w-full"/>}
            </motion.button>}
          </div>)}
        </div>
        <div className="shelf-plank"><div/></div>
        <div className="shelf-labels">
          {row.map(plant=><button key={plant.id} onClick={()=>setOpenId(plant.id)} className="text-center leading-tight">
            <strong className="block text-[13px] sm:text-[15px] font-medium truncate">{plant.name}</strong>
            <span className="block text-[#7c8177] text-[12px] mt-1">{money(plant.price)}</span>
          </button>)}
        </div>
      </div>
    </section>)}
  </div>
  <AnimatePresence>{open && <motion.div className="fixed inset-0 z-40 overflow-y-auto bg-[#f6f5ef]" role="dialog" aria-modal="true" aria-label={open.name} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
    <button onClick={()=>setOpenId(null)} aria-label="Хаах" className="fixed top-5 right-5 z-50 rounded-full p-3 bg-white shadow-md"><X size={20}/></button>
    <PlantDetail key={open.id} plant={open} onClose={()=>setOpenId(null)}/>
  </motion.div>}</AnimatePresence>
  </LayoutGroup>
}
