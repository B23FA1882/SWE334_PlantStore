import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase, isConfigured } from '../lib/supabase'
import { demoPlants } from '../data/demoPlants'

const StoreContext = createContext(null)
const readCart = () => { try { return JSON.parse(localStorage.getItem('greenroom-cart') || '[]') } catch { return [] } }

export function StoreProvider({ children }) {
  const [products, setProducts] = useState(demoPlants)
  const [categories, setCategories] = useState([])
  const [cart, setCart] = useState(readCart)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [authReady, setAuthReady] = useState(!isConfigured)
  const [loadingProducts, setLoadingProducts] = useState(isConfigured)
  const [dbError, setDbError] = useState('')

  const refreshProducts = useCallback(async () => {
    if (!supabase) return
    setLoadingProducts(true)
    const [{ data, error }, cat] = await Promise.all([
      supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false }),
      supabase.from('categories').select('id,name,slug').order('name'),
    ])
    if (error) {
      setDbError('Өгөгдлийн сантай холбогдож чадсангүй: ' + error.message)
    } else {
      setProducts((data || []).map(item => ({
        ...item, category: item.categories?.name || 'Ургамал', price: Number(item.price),
      })))
      setDbError('')
    }
    if (!cat.error) setCategories(cat.data || [])
    setLoadingProducts(false)
  }, [])

  useEffect(() => { refreshProducts() }, [refreshProducts])

  useEffect(() => {
    if (!supabase) return
    let mounted = true
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) { setUser(data.user ?? null); setAuthReady(true) }
    }).catch(() => { if (mounted) setAuthReady(true) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) { setUser(session?.user ?? null); setAuthReady(true) }
    })
    return () => { mounted = false; subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    if (!supabase || !user?.id) return
    let mounted = true
    supabase.from('profiles').select('id,full_name,role').eq('id', user.id).single().then(({ data }) => {
      if (mounted) setProfile(data ?? null)
    })
    return () => { mounted = false }
  }, [user?.id])
  useEffect(() => { if (!user) setProfile(null) }, [user])
  useEffect(() => { localStorage.setItem('greenroom-cart', JSON.stringify(cart)) }, [cart])

  const addToCart = (plant, quantity = 1) => {
    if (plant.stock < 1) return
    setCart(current => {
      const existing = current.find(i => i.id === plant.id)
      const total = Math.min(plant.stock, (existing?.quantity || 0) + quantity)
      return existing
        ? current.map(i => i.id === plant.id ? { ...i, quantity: total } : i)
        : [...current, { id: plant.id, slug: plant.slug, name: plant.name, form: plant.form, price: plant.price, stock: plant.stock, quantity: total }]
    })
  }
  const changeQty = (id, quantity) => setCart(current => current.map(i => i.id === id ? { ...i, quantity: Math.min(i.stock, Math.max(1, quantity)) } : i))
  const removeFromCart = id => setCart(current => current.filter(i => i.id !== id))
  const total = cart.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0)

  const placeOrder = async ({ phone, address }) => {
    if (!supabase) throw new Error('Supabase тохируулаагүй байна. Демо өгөгдлөөс бодит захиалга үүсгэхгүй.')
    if (!user) throw new Error('Захиалга хийхийн тулд нэвтэрнэ үү.')
    if (!cart.length || cart.some(i => i.id.startsWith('demo-'))) throw new Error('Бодит бүтээгдэхүүн сонгоно уу.')
    if (!phone.trim() || !address.trim()) throw new Error('Утас, хаягаа бөглөнө үү.')
    const { data, error } = await supabase.rpc('place_order', {
      p_items: cart.map(i => ({ product_id: i.id, quantity: i.quantity })),
      p_phone: phone.trim(),
      p_address: address.trim(),
    })
    if (error) throw error
    setCart([])
    return data
  }

  const value = useMemo(() => ({
    products, categories, cart, user, profile, authReady, loadingProducts, dbError, isConfigured,
    addToCart, changeQty, removeFromCart, placeOrder, cartCount, total, refreshProducts,
  }), [products, categories, cart, user, profile, authReady, loadingProducts, dbError, cartCount, total, refreshProducts])
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export const useStore = () => {
  const context = useContext(StoreContext)
  if (!context) throw new Error('useStore must be inside StoreProvider')
  return context
}
