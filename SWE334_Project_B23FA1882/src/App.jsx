import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, BarChart3, Check, ChevronDown, Flower2, Heart, Leaf, LogIn, Menu, Minus, Plus, Search, ShoppingBag, SlidersHorizontal, Sprout, Trash2, UserRound, X } from 'lucide-react'
import { supabase } from './lib/supabase'
import { demoPlants, money } from './data/demoPlants'
import { useStore } from './store/StoreProvider'
import PlantArt from './components/PlantArt'
import PlantShelf, { PlantDetail } from './components/PlantShelf'

function Header() {
  const { cartCount, user, profile } = useStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  return <header className="site-header">
    <div className="max-w-[1260px] mx-auto px-5 sm:px-9 h-[76px] flex items-center justify-between gap-4">
      <Link to="/" className="flex items-center gap-2 relative z-20" onClick={()=>setMobileOpen(false)}>
        <span className="brand-mark"><Sprout size={22} strokeWidth={1.7}/></span>
        <span className="font-semibold tracking-[.18em] text-base sm:text-lg">GREENROOM<span className="text-[#99a58e]">.</span></span>
      </Link>
      <nav className="hidden md:flex gap-9 text-sm font-medium text-[#68736a]">
        <NavLink to="/" end className={({isActive})=>isActive?'nav-active':'hover:text-[#234a36]'}>Нүүр</NavLink>
        <NavLink to="/shop" className={({isActive})=>isActive?'nav-active':'hover:text-[#234a36]'}>Ургамлууд</NavLink>
        <a href="/#about" className="hover:text-[#234a36]">Бидний тухай</a>
        {profile?.role==='admin' && <NavLink to="/admin" className={({isActive})=>isActive?'nav-active':'hover:text-[#234a36]'}>Админ</NavLink>}
      </nav>
      <div className="flex items-center gap-2 sm:gap-4">
        <Link to={user?'/orders':'/auth'} aria-label="Миний бүртгэл" className="header-icon"><UserRound size={20} strokeWidth={1.6}/></Link>
        <Link to="/cart" aria-label={`Сагс, ${cartCount} бүтээгдэхүүн`} className="header-icon relative"><ShoppingBag size={20} strokeWidth={1.6}/>{cartCount>0 && <span className="count-badge">{cartCount}</span>}</Link>
        <button className="md:hidden header-icon" onClick={()=>setMobileOpen(v=>!v)} aria-label="Цэс">{mobileOpen?<X size={21}/>:<Menu size={21}/>}</button>
      </div>
    </div>
    {mobileOpen && <nav className="mobile-nav" onClick={()=>setMobileOpen(false)}>
      <Link to="/">Нүүр</Link><Link to="/shop">Ургамлууд</Link><Link to="/cart">Сагс</Link><Link to={user?'/orders':'/auth'}>Миний бүртгэл</Link>{profile?.role==='admin'&&<Link to="/admin">Админ</Link>}
    </nav>}
  </header>
}

function Footer() {
  return <footer className="border-t border-[#e1e4d8] bg-[#eff1e8] mt-20">
    <div className="max-w-[1260px] mx-auto px-6 py-12 grid gap-8 md:grid-cols-3">
      <div><div className="font-bold tracking-[.2em] text-[#2a4936]">GREENROOM.</div><p className="mt-3 text-sm text-[#7c897c] max-w-xs">Таны ажил дахь амьд орчин.</p></div>
      <div><h4 className="font-medium mb-3">Дэлгүүр</h4><Link className="text-sm text-[#687869] hover:underline" to="/shop">Бүх ургамал</Link><p className="text-sm text-[#687869] mt-2">Арчилгааны зөвлөгөө бүтээгдэхүүн бүрд</p></div>
      <div><h4 className="font-medium mb-3">Холбоо барих</h4><p className="text-sm text-[#687869]">Улаанбаатар, Монгол</p><p className="text-sm text-[#687869] mt-2">88325880</p></div>
    </div>
    <p className="pb-6 text-center text-xs text-[#9aa399]">© 2026 GREENROOM. All plants deserve a good home.</p>
  </footer>
}

function Notice() {
  const {isConfigured,dbError} = useStore()
  if (isConfigured&&!dbError) return null
  return <div className="mx-auto max-w-[1230px] px-6 mt-5">
    <div className="rounded-xl border border-[#dfcda4] bg-[#fff6dd] px-4 py-3 text-sm text-[#775e36]">
      {dbError || 'Дизайны демо горим ажиллаж байна. Бодит бүртгэл, CRUD, захиалгын хувьд Supabase .env.local тохируулна уу.'}
    </div>
  </div>
}

function Home() {
  const {products,loadingProducts} = useStore()
  return <>
    <section className="home-hero">
      <div className="max-w-[1260px] mx-auto px-6 md:px-10 relative z-10 pt-20 md:pt-28 pb-14 md:pb-16">
        <div className="max-w-[760px] mx-auto text-center">
          <p className="eyebrow tracking-[.28em] flex justify-center items-center gap-2"><Leaf size={15}/> OFFICE PLANT STUDIO · УЛААНБААТАР</p>
          <h1 className="serif text-[clamp(54px,8.4vw,118px)] leading-[.95] tracking-[-.046em] mt-6 text-[#254b37]">Bring nature <em className="font-normal">inside.</em></h1>
          <p className="mt-7 text-[#6c786d] text-base md:text-lg max-w-[550px] mx-auto leading-relaxed">Ажлын ширээнээс оффисын булан хүртэл — өдөр бүрийг илүү ногоон, тайван, бүтээлч болгох ургамлууд.</p>
          <div className="mt-9 flex justify-center gap-3 flex-wrap"><Link className="primary-btn" to="/shop">Ургамлууд үзэх <ArrowRight size={18}/></Link><a href="#collection" className="secondary-btn">Тавиуртай танилцах <ChevronDown size={17}/></a></div>
        </div>
        <div className="flex items-center justify-center gap-7 sm:gap-12 mt-16 text-[#9ba596] uppercase text-[10px] sm:text-xs tracking-[.19em]"><span>Thoughtful greenery</span><span className="w-1 h-1 bg-[#a7b6a2] rounded-full"/><span>Carefully curated</span><span className="w-1 h-1 bg-[#a7b6a2] rounded-full"/><span>Made for workspaces</span></div>
      </div>
    </section>
    <section className="max-w-[1160px] mx-auto px-5 sm:px-9 pt-16" id="collection">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-end sm:justify-between mb-12">
        <div><p className="eyebrow">01 / THE COLLECTION</p><h2 className="serif text-4xl sm:text-6xl text-[#284d39] mt-3">The living shelf<span className="text-[#b7c5b5]">.</span></h2><p className="text-[#879185] mt-3">Таалагдсан ургамал дээрээ дараад дэлгэрэнгүй үзээрэй.</p></div>
        <Link to="/shop" className="text-sm font-medium text-[#345640] flex items-center gap-2 hover:underline">Бүгдийг үзэх <ArrowRight size={17}/></Link>
      </div>
      {loadingProducts && <p className="text-center text-sm text-[#8d9889] pb-8">Ургамлуудыг ачаалж байна...</p>}
      <PlantShelf plants={products.slice(0,12)}/>
    </section>
    <section id="about" className="mx-auto max-w-[1180px] mt-20 px-6"><div className="about-panel">
      <div className="relative"><p className="eyebrow text-[#b7c9b2]">A LITTLE MORE GREEN</p><h2 className="serif text-4xl md:text-6xl leading-tight mt-5">Good spaces <em>grow</em> good ideas.</h2><p className="text-[#ceddd0] max-w-md mt-5 leading-relaxed">Оффисын орон зайгаа өөрчлөхөд их зүйл хэрэггүй. Зөв сонгосон ганц ургамлаас бүх зүйл эхэлнэ.</p><Link to="/shop" className="inline-flex items-center gap-2 bg-[#f4f4e9] text-[#31553c] rounded-full px-6 py-3 mt-7 text-sm font-semibold">Ургамлаа сонгох <ArrowRight size={17}/></Link></div>
      <div className="flex justify-center items-end"><PlantArt plant={demoPlants[0]} className="w-60 h-[270px] sm:w-[310px] sm:h-[340px] drop-shadow-2xl"/></div>
    </div></section>
  </>
}

function PlantTile({plant}) {
  const {addToCart} = useStore()
  return <article className="plant-card">
    <Link to={`/plant/${plant.slug}`} className="plant-card-art">
      {plant.image_url?<img src={plant.image_url} alt={plant.name} className="w-full h-full object-contain"/>:<PlantArt plant={plant} className="h-full w-full"/>}
      <span className="absolute top-4 left-4 bg-[#fffdf8]/90 rounded-full px-3 py-1 text-[10px] tracking-wide text-[#55735a]">{plant.category||'Ургамал'}</span>
    </Link>
    <div className="pt-4"><Link to={`/plant/${plant.slug}`} className="font-medium text-lg hover:text-[#477b51]">{plant.name}</Link>
      <p className="text-[#879186] text-sm mt-1">{plant.subtitle || plant.light || 'Оффисын ургамал'}</p>
      <div className="flex items-center justify-between mt-4"><strong className="text-[#304c36]">{money(plant.price)}</strong><button disabled={!plant.stock} className="small-add" aria-label={`${plant.name} сагсанд нэмэх`} onClick={()=>addToCart(plant)}><Plus size={19}/></button></div>
    </div>
  </article>
}

function Shop() {
  const {products,loadingProducts} = useStore()
  const [search,setSearch] = useState('')
  const [category,setCategory] = useState('Бүгд')
  const [sort,setSort] = useState('latest')
  const [maxPrice,setMaxPrice] = useState('')
  const [page,setPage] = useState(1)
  const categories = ['Бүгд', ...new Set(products.map(p=>p.category||'Ургамал'))]
  const filtered=useMemo(()=>{
    const arr=products.filter(p => (p.name+' '+(p.description||'')).toLowerCase().includes(search.toLowerCase()) && (category==='Бүгд'||p.category===category) && (!maxPrice||p.price<=Number(maxPrice)))
    return arr.sort((a,b)=>sort==='priceLow'?a.price-b.price:sort==='priceHigh'?b.price-a.price:sort==='name'?a.name.localeCompare(b.name):new Date(b.created_at)-new Date(a.created_at))
  },[products,search,category,maxPrice,sort])
  useEffect(()=>setPage(1),[search,category,maxPrice,sort])
  const perPage=8
  const pages=Math.max(1,Math.ceil(filtered.length/perPage))
  return <main className="page-shell">
    <div className="section-heading"><p className="eyebrow">BOTANICAL COLLECTION</p><h1 className="serif">Find your green <em>companion.</em></h1><p>Таны ажлын орчинд тохирох ургамлыг хайж олоорой.</p></div>
    <div className="filters">
      <label className="searchbox"><Search size={19}/><input placeholder="Нэрээр хайх..." aria-label="Ургамал хайх" value={search} onChange={e=>setSearch(e.target.value)}/></label>
      <label><span className="sr-only">Ангилал</span><select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></label>
      <label><span className="sr-only">Үнийн дээд хязгаар</span><input type="number" min="0" placeholder="Дээд үнэ (₮)" value={maxPrice} onChange={e=>setMaxPrice(e.target.value)}/></label>
      <label><span className="sr-only">Эрэмбэлэх</span><select value={sort} onChange={e=>setSort(e.target.value)}><option value="latest">Шинэ эхэнд</option><option value="priceLow">Үнэ өсөхөөр</option><option value="priceHigh">Үнэ буурахаар</option><option value="name">Нэрээр</option></select></label>
    </div>
    <div className="flex items-center gap-2 text-xs text-[#899588] mb-6"><SlidersHorizontal size={15}/>{filtered.length} ургамал олдлоо</div>
    {loadingProducts?<div className="empty-state">Ачаалж байна...</div>:!filtered.length?<div className="empty-state"><Search className="mx-auto mb-4" size={32}/>Таны хайлтанд тохирох ургамал олдсонгүй.<button className="block text-[#456f50] underline mx-auto mt-3" onClick={()=>{setSearch('');setCategory('Бүгд');setMaxPrice('')}}>Шүүлтүүр цэвэрлэх</button></div>:<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-7">{filtered.slice((page-1)*perPage,page*perPage).map(p=><PlantTile plant={p} key={p.id}/>)}</div>}
    {pages>1&&<div className="pagination">{Array.from({length:pages},(_,i)=><button key={i} className={i+1===page?'active':''} onClick={()=>{setPage(i+1);window.scrollTo({top:200,behavior:'smooth'})}}>{i+1}</button>)}</div>}
  </main>
}

function PlantRoute() {
  const {slug} = useParams()
  const {products} = useStore()
  const plant=products.find(p=>p.slug===slug)
  return plant?<main className="page-shell"><Link to="/shop" className="back-link mb-6"><ArrowLeft size={17}/> Бүх ургамал</Link><PlantDetail plant={plant}/></main>:<div className="empty-state page-shell">Ургамал олдсонгүй. <Link to="/shop" className="underline">Дэлгүүр рүү буцах</Link></div>
}

function Auth() {
  const {user,isConfigured} = useStore()
  const navigate=useNavigate()
  const [mode,setMode] = useState('login')
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [fullName,setFullName] = useState('')
  const [error,setError] = useState('')
  const [notice,setNotice] = useState('')
  const [busy,setBusy] = useState(false)
  if (user && mode!=='reset') return <Navigate to="/orders" replace/>
  const submit=async e=>{
    e.preventDefault();setBusy(true);setError('');setNotice('')
    if (!isConfigured) {setError('Supabase холболтоо тохируулна уу.');setBusy(false);return}
    try {
      if(mode==='reset'){const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+'/reset-password'});if(error)throw error;setNotice('Нууц үг сэргээх холбоосыг и-мэйлээр илгээлээ.')}
      else if(mode==='register'){if(password.length<8)throw new Error('Нууц үг 8 ба түүнээс дээш тэмдэгттэй байх ёстой.');const {data,error}=await supabase.auth.signUp({email,password,options:{data:{full_name:fullName},emailRedirectTo:window.location.origin+'/auth'}});if(error)throw error;setNotice(data.session?'Бүртгэл амжилттай.':'Бүртгэл үүслээ. И-мэйлээ баталгаажуулна уу.');if(data.session)navigate('/orders')}
      else {const {error}=await supabase.auth.signInWithPassword({email,password});if(error)throw error;navigate('/orders')}
    } catch(err){setError(err.message)} finally {setBusy(false)}
  }
  return <main className="page-shell flex justify-center"><div className="auth-card">
    <div className="text-center"><span className="brand-mark mx-auto mb-5"><Sprout size={23}/></span><p className="eyebrow">WELCOME TO GREENROOM</p><h1 className="serif text-4xl mt-3">{mode==='register'?'Бүртгэл үүсгэх':mode==='reset'?'Нууц үг сэргээх':'Тавтай морил'}</h1><p className="text-sm text-[#829085] mt-3">{mode==='register'?'Ногоон ертөнцийн нэг хэсэг болоорой':mode==='reset'?'Бүртгэлтэй и-мэйлээ оруулна уу':'Бүртгэлээрээ нэвтрэн захиалгаа удирдаарай'}</p></div>
    <form onSubmit={submit} className="mt-8 space-y-4">{mode==='register'&&<label className="form-field">Таны нэр<input required minLength="2" value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Бүтэн нэр"/></label>}
      <label className="form-field">И-мэйл<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@example.com"/></label>
      {mode!=='reset'&&<label className="form-field">Нууц үг<input required type="password" minLength={mode==='register'?8:1} autoComplete={mode==='register'?'new-password':'current-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/></label>}
      {error&&<p role="alert" className="error-text">{error}</p>}{notice&&<p className="success-text">{notice}</p>}
      <button disabled={busy} className="primary-btn w-full justify-center" type="submit">{busy?'Түр хүлээнэ үү...':mode==='register'?'Бүртгүүлэх':mode==='reset'?'Холбоос илгээх':'Нэвтрэх'}<ArrowRight size={17}/></button>
    </form>
    <div className="mt-6 text-center text-sm text-[#65756b] space-y-3"><button className="hover:underline" onClick={()=>{setMode(mode==='register'?'login':'register');setError('')}}>{mode==='register'?'Бүртгэлтэй юу? Нэвтрэх':'Бүртгэл байхгүй юу? Бүртгүүлэх'}</button><br/><button className="hover:underline" onClick={()=>{setMode(mode==='reset'?'login':'reset');setError('')}}>{mode==='reset'?'Нэвтрэх рүү буцах':'Нууц үгээ мартсан уу?'}</button></div>
  </div></main>
}

function ResetPassword() {
  const [pass,setPass]=useState('')
  const [message,setMessage]=useState('')
  const submit=async e=>{e.preventDefault();const {error}=await supabase.auth.updateUser({password:pass});setMessage(error?error.message:'Нууц үг шинэчлэгдлээ. Нэвтэрнэ үү.')}
  return <main className="page-shell max-w-xl"><h1 className="serif text-4xl mb-7">Шинэ нууц үг</h1><form onSubmit={submit} className="space-y-4"><input required minLength="8" type="password" className="input" value={pass} onChange={e=>setPass(e.target.value)}/><button className="primary-btn">Шинэчлэх</button></form><p className="mt-3">{message}</p></main>
}

function Cart() {
  const {cart,changeQty,removeFromCart,total,user,placeOrder,isConfigured} = useStore()
  const navigate=useNavigate()
  const [phone,setPhone]=useState('')
  const [address,setAddress]=useState('')
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const checkout=async e=>{
    e.preventDefault()
    if(!user){navigate('/auth');return}
    setBusy(true);setError('')
    try{await placeOrder({phone,address});navigate('/orders',{state:{notice:'Захиалга үүслээ. Төлбөрийн төлөв хүлээгдэж байна.'}})}
    catch(err){setError(err.message)}
    finally{setBusy(false)}
  }
  return <main className="page-shell"><div className="section-heading"><p className="eyebrow">YOUR GREEN BAG</p><h1 className="serif">Таны сагс</h1><p>{cart.length} төрлийн ургамал</p></div>
    {!cart.length?<div className="empty-state min-h-[260px] flex flex-col gap-5"><div className="flex justify-end"><Link className="primary-btn" to="/shop">Ургамал сонгох <ArrowRight size={17}/></Link></div><div className="flex flex-1 flex-col items-center justify-center gap-4"><ShoppingBag size={36} aria-hidden="true"/><p>Таны сагс одоогоор хоосон байна.</p></div></div>:<div className="grid lg:grid-cols-[1.3fr_.7fr] gap-8 items-start">
      <div className="space-y-3">{cart.map(item=><div key={item.id} className="cart-item"><div className="cart-art"><PlantArt plant={item} className="h-full w-full"/></div><div className="flex-1 min-w-0"><p className="font-medium">{item.name}</p><p className="text-sm text-[#8b958b] mt-1">{money(item.price)}</p><div className="flex items-center gap-3 mt-4"><button onClick={()=>changeQty(item.id,item.quantity-1)} aria-label="Тоо хасах"><Minus size={16}/></button><span className="font-semibold text-sm">{item.quantity}</span><button onClick={()=>changeQty(item.id,item.quantity+1)} aria-label="Тоо нэмэх"><Plus size={16}/></button></div></div><div className="flex flex-col items-end justify-between h-full gap-6"><button aria-label="Устгах" onClick={()=>{if(window.confirm('Сагснаас хасах уу?'))removeFromCart(item.id)}}><Trash2 size={17} className="text-[#a5a4a0] hover:text-red-500"/></button><strong className="text-sm">{money(item.price*item.quantity)}</strong></div></div>)}</div>
      <form className="checkout-panel" onSubmit={checkout}><h2 className="serif text-3xl mb-6">Захиалгын мэдээлэл</h2><label className="form-field">Утасны дугаар<input required maxLength="20" placeholder="99xxxxxx" value={phone} onChange={e=>setPhone(e.target.value)}/></label><label className="form-field mt-4">Хүргэлтийн хаяг<textarea required maxLength="400" placeholder="Дүүрэг, хороо, байр..." rows="3" value={address} onChange={e=>setAddress(e.target.value)}/></label>
        <div className="border-t border-[#e0e4db] flex items-center justify-between mt-6 pt-5"><span>Нийт</span><strong className="text-2xl">{money(total)}</strong></div>
        {!isConfigured&&<p className="text-xs mt-4 text-[#95673a]">Демо горим: захиалга Supabase холбосны дараа ажиллана.</p>}
        {error&&<p className="error-text mt-4" role="alert">{error}</p>}
        <button type="submit" disabled={busy||!isConfigured} className="primary-btn w-full mt-6 justify-center">{busy?'Үүсгэж байна...':user?'Захиалга үүсгэх':'Нэвтэрч захиалах'}<ArrowRight size={17}/></button>
        <p className="text-xs text-[#8c988d] leading-relaxed mt-4">Захиалга эхлээд “Хүлээгдэж буй” төлөвтэй үүснэ. Зөвхөн баталгаажсан webhook төлбөрийг “Төлөгдсөн” болгоно.</p>
      </form>
    </div>}
  </main>
}

function RequireUser({children,admin=false}) {
  const {user,profile,authReady} = useStore()
  if(!authReady) return <div className="empty-state page-shell">Бүртгэл шалгаж байна...</div>
  if(!user) return <Navigate to="/auth" replace/>
  if(admin && !profile) return <div className="empty-state page-shell">Эрхийг шалгаж байна...</div>
  if(admin && profile.role!=='admin') return <Navigate to="/" replace/>
  return children
}

function Orders() {
  const {user,profile} = useStore()
  const [orders,setOrders]=useState([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const [paying,setPaying]=useState(null)
  useEffect(()=>{
    if(!supabase||!user)return
    let alive=true
    supabase.from('orders').select('*, order_items(quantity,unit_price,products(name))').eq('user_id',user.id).order('created_at',{ascending:false})
      .then(({data,error})=>{if(alive){setOrders(data||[]);setError(error?.message||'');setLoading(false)}})
    return ()=>{alive=false}
  },[user])
  const signOut=async()=>{await supabase.auth.signOut()}
  const pay=async order=>{
    setPaying(order.id);setError('')
    try{const {data,error}=await supabase.functions.invoke('create-checkout',{body:{orderId:order.id}});if(error)throw error;if(!data?.url)throw new Error(data?.error||'Checkout URL олдсонгүй');window.location.assign(data.url)}
    catch(err){setError('Төлбөрийн үйлчилгээ одоогоор идэвхгүй: '+err.message)}
    finally{setPaying(null)}
  }
  return <main className="page-shell"><div className="section-heading"><p className="eyebrow">YOUR ACCOUNT</p><h1 className="serif">Миний захиалгууд</h1><p>Сайн байна уу, {profile?.full_name || user.email}</p><button className="secondary-btn mt-5" onClick={signOut}><LogIn size={17}/> Гарах</button></div>
    {error&&<p className="error-text mb-6" role="alert">{error}</p>}
    {loading?<div className="empty-state">Захиалга ачаалж байна...</div>:!orders.length?<div className="empty-state min-h-[260px] flex flex-col gap-5"><div className="flex justify-end"><Link to="/shop" className="primary-btn">Ургамал сонгох <ArrowRight size={17}/></Link></div><div className="flex flex-1 flex-col items-center justify-center gap-4"><ShoppingBag size={36} aria-hidden="true"/><p>Захиалгын түүх хоосон байна.</p></div></div>:<div className="space-y-5">{orders.map(o=><article className="order-card" key={o.id}><div className="flex flex-wrap gap-4 justify-between items-start"><div><p className="text-xs text-[#92a093]">#{o.id.slice(0,8)} · {new Date(o.created_at).toLocaleDateString('mn-MN')}</p><h3 className="text-xl font-semibold mt-2">{money(o.total_amount)}</h3></div><span className={o.status==='paid'?'status-paid':'status-pending'}>{o.status==='paid'?'Төлөгдсөн':o.status==='cancelled'?'Цуцлагдсан':'Хүлээгдэж буй'}</span></div><div className="mt-4 text-sm text-[#748274] space-y-1">{o.order_items?.map((i,j)=><p key={j}>{i.products?.name || 'Ургамал'} × {i.quantity} · {money(i.unit_price)}</p>)}</div>{o.status==='pending'&&<button disabled={paying===o.id} className="primary-btn mt-5" onClick={()=>pay(o)}>{paying===o.id?'Шилжүүлж байна...':'Төлбөр төлөх (Stripe test)'}<ArrowRight size={17}/></button>}</article>)}</div>}
  </main>
}

function Admin() {
  const {products,categories,refreshProducts} = useStore()
  const [tab,setTab]=useState('products')
  const [orders,setOrders]=useState([])
  const [users,setUsers]=useState([])
  const [payments,setPayments]=useState([])
  const [editing,setEditing]=useState(null)
  const empty={name:'',slug:'',description:'',subtitle:'',category_id:'',price:'',stock:'',form:'monstera',light:'Шууд бус гэрэл',water:'7 хоногт 1 удаа',pot_color:'#b99070',active:true,image_url:''}
  const [form,setForm]=useState(empty)
  const [image,setImage]=useState(null)
  const [preview,setPreview]=useState('')
  const [error,setError]=useState('')
  const [notice,setNotice]=useState('')
  const [busy,setBusy]=useState(false)

  const loadAdmin=async()=>{
    const [o,u,pm]=await Promise.all([
      supabase.from('orders').select('id,total_amount,status,created_at,profiles(full_name)').order('created_at',{ascending:false}),
      supabase.from('profiles').select('id,full_name,role,created_at'),
      supabase.from('payments').select('id,amount,status,provider,created_at').order('created_at',{ascending:false}),
    ])
    setOrders(o.data||[]);setUsers(u.data||[]);setPayments(pm.data||[])
  }
  useEffect(()=>{loadAdmin()},[])
  const startEdit=p=>{setEditing(p.id);setForm({...empty,...p,category_id:p.category_id||''});setImage(null);setPreview(p.image_url||'');window.scrollTo({top:150,behavior:'smooth'})}
  const reset=()=>{setEditing(null);setForm(empty);setImage(null);setPreview('');setError('');setNotice('')}
  const onFile=e=>{
    const f=e.target.files?.[0];if(!f)return
    if(!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>4*1024*1024){setError('JPG, PNG, WEBP зураг (4 MB хүртэл) оруулна уу.');return}
    setImage(f);setPreview(URL.createObjectURL(f));setError('')
  }
  const save=async e=>{
    e.preventDefault();setError('');setNotice('');setBusy(true)
    try{
      if(form.name.trim().length<2||Number(form.price)<0||Number(form.stock)<0||!form.category_id)throw new Error('Нэр, ангилал, үнэ, үлдэгдлээ шалгана уу.')
      let image_url=form.image_url||null
      if(image){
        const path=`catalog/${crypto.randomUUID()}.${image.name.split('.').pop().toLowerCase()}`
        const {error:uploadError}=await supabase.storage.from('plant-images').upload(path,image,{contentType:image.type,upsert:false})
        if(uploadError)throw uploadError
        image_url=supabase.storage.from('plant-images').getPublicUrl(path).data.publicUrl
      }
      const payload={name:form.name.trim(),slug:form.slug.trim().toLowerCase(),description:form.description,subtitle:form.subtitle,category_id:form.category_id,price:Number(form.price),stock:Number(form.stock),form:form.form,light:form.light,water:form.water,pot_color:form.pot_color,active:form.active,image_url}
      const query=editing?supabase.from('products').update(payload).eq('id',editing):supabase.from('products').insert(payload)
      const {error:saveError}=await query
      if(saveError)throw saveError
      setNotice('Амжилттай хадгаллаа.');await refreshProducts();reset()
    }catch(err){setError(err.message)}finally{setBusy(false)}
  }
  const remove=async plant=>{
    if(!window.confirm(`"${plant.name}" бүтээгдэхүүнийг устгах уу? Холбоотой захиалга байвал устгах боломжгүй.`))return
    const {error}=await supabase.from('products').delete().eq('id',plant.id)
    if(error)setError(error.message);else await refreshProducts()
  }
  const revenue=orders.filter(o=>o.status==='paid').reduce((a,o)=>a+Number(o.total_amount),0)
  const latest=orders.slice(0,6).reverse()
  const max=Math.max(1,...latest.map(o=>Number(o.total_amount)))
  return <main className="page-shell"><div className="section-heading"><p className="eyebrow">MANAGEMENT / GREENROOM</p><h1 className="serif">Админ самбар</h1><p>Бүтээгдэхүүн, захиалга, орлогын удирдлага</p></div>
    <div className="grid sm:grid-cols-3 gap-4 mb-10"><div className="stat-card"><span>Бүтээгдэхүүн</span><strong>{products.length}</strong><Leaf size={21}/></div><div className="stat-card"><span>Захиалга</span><strong>{orders.length}</strong><ShoppingBag size={21}/></div><div className="stat-card"><span>Төлөгдсөн орлого</span><strong className="text-2xl">{money(revenue)}</strong><BarChart3 size={21}/></div></div>
    <div className="flex gap-3 overflow-auto border-b border-[#dce2d5] mb-8 pb-3">{[['products','Бүтээгдэхүүн'],['orders','Захиалга'],['users','Хэрэглэгч'],['payments','Төлбөр']].map(([value,label])=><button key={value} className={tab===value?'tab-active':'tab'} onClick={()=>setTab(value)}>{label}</button>)}</div>
    {error&&<p className="error-text mb-4" role="alert">{error}</p>}{notice&&<p className="success-text mb-4">{notice}</p>}
    {tab==='products'&&<div className="grid xl:grid-cols-[.85fr_1.15fr] gap-8 items-start"><form className="admin-form space-y-4" onSubmit={save}><div className="flex items-center justify-between"><h2 className="serif text-2xl">{editing?'Бүтээгдэхүүн засах':'Шинэ ургамал'}</h2>{editing&&<button type="button" onClick={reset} aria-label="Болих"><X size={20}/></button>}</div>
      <label className="form-field">Нэр<input required minLength="2" value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
      <label className="form-field">Slug (латин, URL)<input required pattern="[a-z0-9-]+" value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})}/></label>
      <label className="form-field">Ангилал<select required value={form.category_id} onChange={e=>setForm({...form,category_id:e.target.value})}><option value="">Сонгох</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <div className="grid grid-cols-2 gap-3"><label className="form-field">Үнэ (₮)<input type="number" required min="0" step="1" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/></label><label className="form-field">Үлдэгдэл<input type="number" required min="0" step="1" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})}/></label></div>
      <label className="form-field">Товч тайлбар<input value={form.subtitle} onChange={e=>setForm({...form,subtitle:e.target.value})}/></label>
      <label className="form-field">Дэлгэрэнгүй<textarea rows="3" value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>
      <div className="grid grid-cols-2 gap-3"><label className="form-field">Гэрэл<input value={form.light} onChange={e=>setForm({...form,light:e.target.value})}/></label><label className="form-field">Усалгаа<input value={form.water} onChange={e=>setForm({...form,water:e.target.value})}/></label></div>
      <label className="form-field">Ургамлын хэлбэр<select value={form.form} onChange={e=>setForm({...form,form:e.target.value})}>{['monstera','snake','ficus','cactus','pothos','flower','stem','succulent','palm','fern'].map(v=><option key={v}>{v}</option>)}</select></label>
      <label className="form-field">Зураг (JPG, PNG, WEBP / max 4MB)<input type="file" accept="image/png,image/jpeg,image/webp" onChange={onFile}/></label>
      {preview&&<img src={preview} alt="Зургийн урьдчилсан харагдац" className="w-32 h-32 object-contain rounded-xl bg-[#f0f1e8]"/>}
      <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={form.active} onChange={e=>setForm({...form,active:e.target.checked})}/> Нийтэд харуулах</label>
      <button disabled={busy} className="primary-btn w-full justify-center" type="submit">{busy?'Хадгалж байна...':editing?'Өөрчлөлт хадгалах':'Бүтээгдэхүүн нэмэх'}<Check size={16}/></button>
      </form><div className="admin-table"><h2 className="serif text-2xl mb-5">Бүтээгдэхүүний жагсаалт</h2>{products.map(pl=><div key={pl.id} className="flex gap-3 justify-between items-center border-b border-[#e3e5df] py-3"><div><p className="font-medium text-sm">{pl.name}</p><p className="text-xs text-[#899588]">{money(pl.price)} · {pl.stock} ширхэг</p></div><div className="flex gap-3 text-sm"><button className="text-[#376648] hover:underline" onClick={()=>startEdit(pl)}>Засах</button><button className="text-red-700 hover:underline" onClick={()=>remove(pl)}>Устгах</button></div></div>)}</div></div>}
    {tab==='orders'&&<div className="admin-table overflow-x-auto"><h2 className="serif text-2xl mb-4">Захиалгын мэдээлэл</h2><table className="w-full text-sm text-left"><thead><tr><th>Захиалга</th><th>Хэрэглэгч</th><th>Нийт</th><th>Огноо</th><th>Төлөв</th></tr></thead><tbody>{orders.map(o=><tr key={o.id}><td>#{o.id.slice(0,8)}</td><td>{o.profiles?.full_name||'Хэрэглэгч'}</td><td>{money(o.total_amount)}</td><td>{new Date(o.created_at).toLocaleDateString('mn-MN')}</td><td>{o.status}</td></tr>)}</tbody></table><h3 className="font-semibold mt-9 mb-4">Сүүлийн захиалгын дүн</h3><div className="flex items-end gap-3 h-44 border-b border-[#d7dbd0]">{latest.map(o=><div key={o.id} title={money(o.total_amount)} className="flex-1 bg-[#94b49a] rounded-t-md" style={{height:`${Math.max(7,Number(o.total_amount)/max*100)}%`}}/>)}</div></div>}
    {tab==='users'&&<div className="admin-table"><h2 className="serif text-2xl mb-4">Хэрэглэгчид</h2>{users.map(u=><div key={u.id} className="flex justify-between border-b py-3 text-sm"><span>{u.full_name||u.id.slice(0,8)}</span><span className="uppercase text-[#7d9780]">{u.role}</span></div>)}</div>}
    {tab==='payments'&&<div className="admin-table"><h2 className="serif text-2xl mb-4">Төлбөрийн бүртгэл</h2>{payments.length?payments.map(pm=><div key={pm.id} className="flex justify-between border-b py-3 text-sm"><span>{pm.provider} · {pm.status}</span><strong>{money(pm.amount)}</strong></div>):<p className="text-[#899588]">Төлбөр хараахан бүртгэгдээгүй байна.</p>}</div>}
  </main>
}

function NotFound() {return <main className="page-shell empty-state"><Flower2 size={42} className="mx-auto mb-5"/><h1 className="serif text-4xl mb-3">Хуудас олдсонгүй</h1><Link to="/" className="primary-btn w-fit mx-auto mt-4">Нүүр рүү <ArrowRight size={17}/></Link></main>}

export default function App() {
  return <div className="min-h-screen flex flex-col"><Header/><Notice/><div className="flex-1">
    <Routes><Route path="/" element={<Home/>}/><Route path="/shop" element={<Shop/>}/><Route path="/plant/:slug" element={<PlantRoute/>}/><Route path="/auth" element={<Auth/>}/><Route path="/reset-password" element={<ResetPassword/>}/><Route path="/cart" element={<Cart/>}/><Route path="/orders" element={<RequireUser><Orders/></RequireUser>}/><Route path="/admin" element={<RequireUser admin><Admin/></RequireUser>}/><Route path="*" element={<NotFound/>}/></Routes>
  </div><Footer/></div>
}
