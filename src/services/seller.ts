import { refreshOutline } from 'ionicons/icons'
import { requireSupabase } from '../utils/supabase'
import type { Product } from '../data/mockData'
import type { DbProduct, SellerActivityRow } from '../types/database'

export interface InventoryProduct {
  id: string
  name: string
  category: string
  type: string
  price: number
  stock: number
  reorderPoint: number
  autoReorder: boolean
  color: string
  img: string
  sold: number
}

export interface ActivityEntry {
  id: string
  title: string
  detail: string
  date: string
  icon: string
}

export interface ReorderRequest {
  id: string
  productId: string
  currentStock: number
  reorderPoint: number
  status: string
  createdAt: string
}

interface DbReorderRequest {
  id: string
  product_id: string
  current_stock: number
  reorder_point: number
  status: string
  created_at: string
}

const reorderRequestColumns = 'id,product_id,current_stock,reorder_point,status,created_at'

function formatSupabaseError(error: { message: string; details?: string | null; hint?: string | null; code?: string }): Error {
  const reason = [error.message, error.details, error.hint].filter(Boolean).join(' ')
  return new Error(error.code ? `${reason} (${error.code})` : reason)
}

function mapReorderRequest(row: DbReorderRequest): ReorderRequest {
  return {
    id: row.id,
    productId: row.product_id,
    currentStock: row.current_stock,
    reorderPoint: row.reorder_point,
    status: row.status,
    createdAt: row.created_at
  }
}

function mapProduct(row: DbProduct): InventoryProduct {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    type: row.type || '',
    price: Number(row.price),
    stock: row.stock,
    reorderPoint: row.reorder_point,
    autoReorder: row.auto_reorder,
    color: row.color || '',
    img: row.image || '',
    sold: row.sold
  }
}

function mapActivity(row: SellerActivityRow): ActivityEntry {
  return {
    id: row.id,
    title: row.title,
    detail: row.detail || '',
    date: row.created_at,
    icon: refreshOutline
  }
}

export async function listStorefrontProducts(): Promise<Product[]> {
  const { data, error } = await requireSupabase()
    .from('products')
    .select('*')
    .eq('active', true)
    .gt('stock', 0)
    .order('created_at', { ascending: false })

  if (error) throw error

  return ((data ?? []) as DbProduct[]).map(row => ({
    id: `${row.seller_id}:${row.id}`,
    productId: row.id,
    name: row.name,
    price: Number(row.price),
    img: row.image || '',
    cat: row.category,
    type: row.type || undefined,
    newArrival: true
  }))
}

export async function listMyProducts(sellerId: string): Promise<InventoryProduct[]> {
  const { data, error } = await requireSupabase()
    .from('products')
    .select('*')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return ((data ?? []) as DbProduct[]).map(mapProduct)
}

export async function seedMyInventory(): Promise<void> {
  const { error } = await requireSupabase().rpc('seed_my_seller_inventory')
  if (error) throw error
}

export interface NewProductInput {
  name: string
  category: string
  type: string
  price: number
  stock: number
  reorderPoint: number
  color: string
  image: string
}

export async function createSellerProduct(sellerId: string, input: NewProductInput): Promise<InventoryProduct> {
  const { data, error } = await requireSupabase()
    .from('products')
    .insert({
      seller_id: sellerId,
      name: input.name,
      category: input.category,
      type: input.type,
      price: input.price,
      stock: Math.floor(input.stock),
      reorder_point: Math.floor(input.reorderPoint),
      auto_reorder: false,
      color: input.color,
      image: input.image,
      sold: 0,
      active: true
    })
    .select('*')
    .single()

  if (error) throw error
  return mapProduct(data as DbProduct)
}

export async function updateSellerProduct(
  id: string,
  patch: Partial<Pick<InventoryProduct, 'price' | 'stock' | 'reorderPoint' | 'autoReorder'>>
): Promise<void> {
  const update: Record<string, number | boolean> = {}
  if (patch.price !== undefined) update.price = patch.price
  if (patch.stock !== undefined) update.stock = Math.floor(patch.stock)
  if (patch.reorderPoint !== undefined) update.reorder_point = Math.floor(patch.reorderPoint)
  if (patch.autoReorder !== undefined) update.auto_reorder = patch.autoReorder

  if (!Object.keys(update).length) return

  const { data, error } = await requireSupabase()
    .from('products')
    .update(update)
    .eq('id', id)
    .select('id')
    .single()

  if (error) throw formatSupabaseError(error)
  if (!data) throw new Error('The inventory change was not saved. Confirm that this product belongs to your shop.')
}

export async function listMyReorderRequests(productIds: string[]): Promise<ReorderRequest[]> {
  if (!productIds.length) return []

  const { data, error } = await requireSupabase()
    .from('reorder_requests')
    .select(reorderRequestColumns)
    .in('product_id', productIds)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw formatSupabaseError(error)
  return ((data ?? []) as DbReorderRequest[]).map(mapReorderRequest)
}

export async function createReorderRequest(product: InventoryProduct): Promise<ReorderRequest> {
  const { data, error } = await requireSupabase()
    .from('reorder_requests')
    .insert({
      product_id: product.id,
      current_stock: product.stock,
      reorder_point: product.reorderPoint
    })
    .select(reorderRequestColumns)
    .single()

  if (error) throw formatSupabaseError(error)
  return mapReorderRequest(data as DbReorderRequest)
}

export async function deleteSellerProduct(id: string): Promise<void> {
  const { error } = await requireSupabase().from('products').delete().eq('id', id)
  if (error) throw error
}

export async function listMyActivity(sellerId: string): Promise<ActivityEntry[]> {
  const { data, error } = await requireSupabase()
    .from('seller_activity')
    .select('*')
    .eq('seller_id', sellerId)
    .order('created_at', { ascending: false })
    .limit(30)

  if (error) throw error
  return ((data ?? []) as SellerActivityRow[]).map(mapActivity)
}

export async function addActivityRecord(sellerId: string, title: string, detail: string): Promise<ActivityEntry> {
  const { data, error } = await requireSupabase()
    .from('seller_activity')
    .insert({ seller_id: sellerId, title, detail })
    .select('*')
    .single()

  if (error) throw error
  return mapActivity(data as SellerActivityRow)
}
