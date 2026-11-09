export type UserRole = 'buyer' | 'seller' | 'rider'
export type OrderStatus = 'Pending' | 'Confirmed' | 'Processing' | 'Packed' | 'Shipped' | 'Delivered' | 'Cancelled'
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  role_locked: boolean
  phone: string | null
  address: string | null
  avatar: string | null
  inventory_seeded: boolean
  created_at: string
  updated_at: string
}

export interface AppUser {
  id: string
  role: UserRole
  name: string
  email: string
  phone?: string
  address?: string
  avatar?: string
}

export interface RiderSummary {
  id: string
  name: string
  email: string
  phone?: string
}

export interface DbProduct {
  id: string
  seller_id: string
  name: string
  category: string
  type: string | null
  price: number
  stock: number
  reorder_point: number
  auto_reorder: boolean
  color: string | null
  image: string | null
  sold: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface DbCartItem {
  id: string
  user_id: string
  product_key: string
  product_id: string | null
  name: string
  price: number
  image: string | null
  selected: boolean
  size: string
  note: string | null
  cat: string | null
  type: string | null
  slot: string | null
  fit: unknown
  quantity: number
  created_at: string
  updated_at: string
}

export interface DbWishlistItem {
  id: string
  user_id: string
  product_key: string
  product_id: string | null
  name: string
  price: number
  image: string | null
  cat: string | null
  type: string | null
  slot: string | null
  fit: unknown
  created_at: string
}

export interface DbOrderItem {
  id: string
  order_id: string
  product_key: string
  product_id: string | null
  name: string
  price: number
  image: string | null
  size: string
  note: string | null
  cat: string | null
  type: string | null
  slot: string | null
  fit: unknown
  quantity: number
  created_at: string
}

export interface DbOrderMessage {
  id: string
  order_id: string
  sender: 'rider' | 'customer'
  sender_id: string | null
  text: string
  created_at: string
}

export interface DbOrder {
  id: string
  code: string
  buyer_id: string
  buyer_name: string
  buyer_email: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  customer_address: string
  payment: string
  payment_proof: string | null
  status: OrderStatus
  subtotal: number
  shipping: number
  total: number
  rider_id: string | null
  rider_name: string | null
  rider_email: string | null
  rider_phone: string | null
  delivered_item_indexes: number[]
  delivery_proof: string | null
  delivery_completed_at: string | null
  created_at: string
  updated_at: string
  order_items?: DbOrderItem[]
  order_messages?: DbOrderMessage[]
}

export interface SellerActivityRow {
  id: string
  seller_id: string
  title: string
  detail: string | null
  created_at: string
}

export interface DbProductReview {
  id: string
  user_id: string
  product_id: string
  rating: number
  review_text: string
  seller_service_rating: number
  delivery_service_rating: number
  show_username: boolean
  photo_urls: Json
  video_urls: Json
  created_at: string
}
