import { requireSupabase } from '../utils/supabase'
import { shippingFor } from '../utils/currency'
import type { CartItem, OrderMessage, OrderRecord, SellerOrderRecord } from '../data/mockData'
import type {
  AppUser,
  DbCartItem,
  DbOrder,
  DbOrderItem,
  DbOrderMessage,
  DbWishlistItem,
  RiderSummary
} from '../types/database'

const money = (value: unknown) => Number(value ?? 0)

function productKeyFor(item: CartItem): string {
  return String(item.id).split('::')[0]
}

function mapCartItem(row: DbCartItem): CartItem {
  const size = row.size || undefined
  return {
    id: size ? `${row.product_key}::${size}` : row.product_key,
    rowId: row.id,
    productId: row.product_id ?? undefined,
    name: row.name,
    price: money(row.price),
    img: row.image || '',
    slot: (row.slot as CartItem['slot']) || undefined,
    fit: (row.fit as CartItem['fit']) || undefined,
    selected: row.selected,
    size,
    note: row.note || undefined,
    cat: row.cat || undefined,
    type: row.type || undefined
  }
}

function mapWishlistItem(row: DbWishlistItem): CartItem {
  return {
    id: row.product_key,
    rowId: row.id,
    productId: row.product_id ?? undefined,
    name: row.name,
    price: money(row.price),
    img: row.image || '',
    slot: (row.slot as CartItem['slot']) || undefined,
    fit: (row.fit as CartItem['fit']) || undefined,
    selected: true,
    cat: row.cat || undefined,
    type: row.type || undefined
  }
}

function mapOrderItem(row: DbOrderItem): CartItem {
  const size = row.size || undefined
  return {
    id: size ? `${row.product_key}::${size}` : row.product_key,
    rowId: row.id,
    productId: row.product_id ?? undefined,
    name: row.name,
    price: money(row.price),
    img: row.image || '',
    slot: (row.slot as CartItem['slot']) || undefined,
    fit: (row.fit as CartItem['fit']) || undefined,
    selected: true,
    size,
    note: row.note || undefined,
    cat: row.cat || undefined,
    type: row.type || undefined
  }
}

function mapMessage(row: DbOrderMessage): OrderMessage {
  return {
    sender: row.sender,
    text: row.text,
    sentAt: row.created_at
  }
}

function mapOrder(row: DbOrder): OrderRecord {
  const items = [...(row.order_items ?? [])]
    .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))
    .map(mapOrderItem)
  const messages = [...(row.order_messages ?? [])]
    .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))
    .map(mapMessage)

  return {
    id: row.code,
    dbId: row.id,
    date: row.created_at,
    items,
    subtotal: money(row.subtotal),
    shipping: money(row.shipping),
    total: money(row.total),
    payment: row.payment,
    paymentProof: row.payment_proof || undefined,
    status: row.status,
    rider: row.rider_name || undefined,
    riderEmail: row.rider_email || undefined,
    riderPhone: row.rider_phone || undefined,
    customerEmail: row.customer_email,
    customerName: row.customer_name,
    customerPhone: row.customer_phone || undefined,
    customerAddress: row.customer_address,
    deliveredItemIndexes: row.delivered_item_indexes ?? [],
    deliveryProof: row.delivery_proof || undefined,
    deliveryCompletedAt: row.delivery_completed_at || undefined,
    messages
  }
}

function mapSellerOrder(row: DbOrder): SellerOrderRecord {
  return {
    ...mapOrder(row),
    buyer: row.buyer_name,
    payment: row.payment,
    status: row.status
  }
}

const orderSelect = '*, order_items(*), order_messages(*)'

export async function listCart(userId: string): Promise<CartItem[]> {
  const { data, error } = await requireSupabase()
    .from('cart_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return ((data ?? []) as DbCartItem[]).map(mapCartItem)
}

export async function addCartItemRecord(userId: string, item: CartItem): Promise<CartItem> {
  const row = {
    user_id: userId,
    product_key: productKeyFor(item),
    product_id: item.productId ?? null,
    name: item.name,
    price: item.price,
    image: item.img,
    selected: item.selected !== false,
    size: item.size ?? '',
    note: item.note ?? null,
    cat: item.cat ?? null,
    type: item.type ?? null,
    slot: item.slot ?? null,
    fit: item.fit ?? null,
    quantity: 1
  }

  const { data, error } = await requireSupabase()
    .from('cart_items')
    .upsert(row, { onConflict: 'user_id,product_key,size' })
    .select('*')
    .single()

  if (error) throw error
  return mapCartItem(data as DbCartItem)
}

export async function updateCartItemRecord(
  rowId: string,
  patch: { size?: string; note?: string }
): Promise<CartItem> {
  const update: Record<string, string | null> = {}
  if (patch.size !== undefined) update.size = patch.size
  if (patch.note !== undefined) update.note = patch.note || null

  const { data, error } = await requireSupabase()
    .from('cart_items')
    .update(update)
    .eq('id', rowId)
    .select('*')
    .single()

  if (error) throw error
  return mapCartItem(data as DbCartItem)
}

export async function setCartSelected(rowIds: string[], selected: boolean): Promise<void> {
  if (!rowIds.length) return
  const { error } = await requireSupabase()
    .from('cart_items')
    .update({ selected })
    .in('id', rowIds)
  if (error) throw error
}

export async function deleteCartItemRecord(rowId: string): Promise<void> {
  const { error } = await requireSupabase().from('cart_items').delete().eq('id', rowId)
  if (error) throw error
}

export async function deleteCartItems(rowIds: string[]): Promise<void> {
  if (!rowIds.length) return
  const { error } = await requireSupabase().from('cart_items').delete().in('id', rowIds)
  if (error) throw error
}

export async function listWishlist(userId: string): Promise<CartItem[]> {
  const { data, error } = await requireSupabase()
    .from('wishlist_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return ((data ?? []) as DbWishlistItem[]).map(mapWishlistItem)
}

export async function addWishlistItem(userId: string, item: CartItem): Promise<CartItem> {
  const row = {
    user_id: userId,
    product_key: productKeyFor(item),
    product_id: item.productId ?? null,
    name: item.name,
    price: item.price,
    image: item.img,
    cat: item.cat ?? null,
    type: item.type ?? null,
    slot: item.slot ?? null,
    fit: item.fit ?? null
  }

  const { data, error } = await requireSupabase()
    .from('wishlist_items')
    .upsert(row, { onConflict: 'user_id,product_key' })
    .select('*')
    .single()

  if (error) throw error
  return mapWishlistItem(data as DbWishlistItem)
}

export async function deleteWishlistItem(rowId: string): Promise<void> {
  const { error } = await requireSupabase().from('wishlist_items').delete().eq('id', rowId)
  if (error) throw error
}

export interface CreateOrderInput {
  buyer: AppUser
  items: CartItem[]
  payment: string
  paymentProof?: string
  customerName: string
  customerEmail: string
  customerPhone: string
  customerAddress: string
}

function generateOrderCode(): string {
  const random = globalThis.crypto?.getRandomValues
    ? globalThis.crypto.getRandomValues(new Uint32Array(1))[0]
    : Math.floor(Math.random() * 1_000_000)
  return `PL-${String(random % 1_000_000).padStart(6, '0')}`
}

export async function createOrder(input: CreateOrderInput): Promise<OrderRecord> {
  const client = requireSupabase()
  const subtotal = input.items.reduce((sum, item) => sum + item.price, 0)
  const shipping = shippingFor(subtotal)
  let code = generateOrderCode()

  // A duplicate code is very unlikely, but retry once with a fresh one.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { data, error } = await client
      .from('orders')
      .insert({
        code,
        buyer_id: input.buyer.id,
        buyer_name: input.buyer.name,
        buyer_email: input.buyer.email,
        customer_name: input.customerName,
        customer_email: input.customerEmail || input.buyer.email,
        customer_phone: input.customerPhone || null,
        customer_address: input.customerAddress,
        payment: input.payment,
        payment_proof: input.payment === 'GCash' ? input.paymentProof ?? null : null,
        status: 'Pending',
        subtotal,
        shipping,
        total: subtotal + shipping
      })
      .select('*')
      .single()

    if (!error && data) {
      const order = data as DbOrder

      const itemRows = input.items.map(item => ({
        order_id: order.id,
        product_key: productKeyFor(item),
        product_id: item.productId ?? null,
        name: item.name,
        price: item.price,
        image: item.img,
        size: item.size ?? '',
        note: item.note ?? null,
        cat: item.cat ?? null,
        type: item.type ?? null,
        slot: item.slot ?? null,
        fit: item.fit ?? null,
        quantity: 1
      }))

      const { error: itemsError } = await client.from('order_items').insert(itemRows)
      if (itemsError) {
        await client.from('orders').delete().eq('id', order.id)
        throw itemsError
      }

      const { data: fullOrder, error: fetchError } = await client
        .from('orders')
        .select(orderSelect)
        .eq('id', order.id)
        .single()

      if (fetchError) throw fetchError
      return mapOrder(fullOrder as DbOrder)
    }

    if (error?.code === '23505') {
      code = generateOrderCode()
      continue
    }

    throw error ?? new Error('Unable to place the order.')
  }

  throw new Error('Unable to generate a unique order number. Please try again.')
}

export async function listBuyerOrders(buyerId: string): Promise<OrderRecord[]> {
  const { data, error } = await requireSupabase()
    .from('orders')
    .select(orderSelect)
    .eq('buyer_id', buyerId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return ((data ?? []) as DbOrder[]).map(mapOrder)
}

export async function listSellerOrders(): Promise<SellerOrderRecord[]> {
  const { data, error } = await requireSupabase()
    .from('orders')
    .select(orderSelect)
    .order('created_at', { ascending: false })

  if (error) throw error
  return ((data ?? []) as DbOrder[]).map(mapSellerOrder)
}

export async function listRiderOrders(riderId: string): Promise<SellerOrderRecord[]> {
  const { data, error } = await requireSupabase()
    .from('orders')
    .select(orderSelect)
    .eq('rider_id', riderId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return ((data ?? []) as DbOrder[]).map(mapSellerOrder)
}

export async function updateOrderStatus(dbId: string, status: string): Promise<void> {
  const { error } = await requireSupabase().from('orders').update({ status }).eq('id', dbId)
  if (error) throw error
}

export async function assignOrderRider(dbId: string, rider: RiderSummary): Promise<void> {
  const { error } = await requireSupabase()
    .from('orders')
    .update({
      rider_id: rider.id,
      rider_name: rider.name,
      rider_email: rider.email,
      rider_phone: rider.phone || null
    })
    .eq('id', dbId)
  if (error) throw error
}

export interface DeliveryPatch {
  status?: string
  deliveredItemIndexes?: number[]
  deliveryProof?: string
  deliveryCompletedAt?: string
}

export async function updateDeliveryOrder(dbId: string, patch: DeliveryPatch): Promise<void> {
  const update: Record<string, string | number[] | null> = {}
  if (patch.status !== undefined) update.status = patch.status
  if (patch.deliveredItemIndexes !== undefined) update.delivered_item_indexes = patch.deliveredItemIndexes
  if (patch.deliveryProof !== undefined) update.delivery_proof = patch.deliveryProof || null
  if (patch.deliveryCompletedAt !== undefined) update.delivery_completed_at = patch.deliveryCompletedAt || null

  if (!Object.keys(update).length) return

  const { error } = await requireSupabase().from('orders').update(update).eq('id', dbId)
  if (error) throw error
}

export async function addOrderMessageRecord(dbId: string, message: OrderMessage): Promise<void> {
  const client = requireSupabase()
  const { data: { user } } = await client.auth.getUser()
  const { error } = await client.from('order_messages').insert({
    order_id: dbId,
    sender: message.sender,
    sender_id: user?.id ?? null,
    text: message.text
  })
  if (error) throw error
}
