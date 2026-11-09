import { requireSupabase } from '../utils/supabase'
import type { DbProductReview, Json } from '../types/database'

export interface ProductReview {
  id: string
  userId: string
  productId: string
  rating: number
  reviewText: string
  sellerServiceRating: number
  deliveryServiceRating: number
  showUsername: boolean
  photoUrls: string[]
  videoUrls: string[]
  createdAt: string
}

export interface NewProductReview {
  userId: string
  productId: string
  rating: number
  reviewText: string
  sellerServiceRating: number
  deliveryServiceRating: number
  showUsername: boolean
  photo?: File | null
  video?: File | null
}

function mapReview(row: DbProductReview): ProductReview {
  return {
    id: row.id,
    userId: row.user_id,
    productId: row.product_id,
    rating: row.rating,
    reviewText: row.review_text,
    sellerServiceRating: row.seller_service_rating,
    deliveryServiceRating: row.delivery_service_rating,
    showUsername: row.show_username,
    photoUrls: toStringArray(row.photo_urls),
    videoUrls: toStringArray(row.video_urls),
    createdAt: row.created_at
  }
}

function toStringArray(value: Json): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function formatSupabaseError(error: { message: string; details?: string | null; hint?: string | null; code?: string }): Error {
  const reason = [error.message, error.details, error.hint].filter(Boolean).join(' ')
  return new Error(error.code ? `${reason} (${error.code})` : reason)
}

const reviewColumns = 'id,user_id,product_id,rating,review_text,seller_service_rating,delivery_service_rating,show_username,photo_urls,video_urls,created_at'

function fileToDataUrl(file: File | null | undefined): Promise<string[]> {
  if (!file) return Promise.resolve([])

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('The selected review media could not be read.'))
        return
      }
      resolve([reader.result])
    }
    reader.onerror = () => reject(reader.error ?? new Error('The selected review media could not be read.'))
    reader.readAsDataURL(file)
  })
}

export async function listBuyerProductReviews(userId: string): Promise<ProductReview[]> {
  const { data, error } = await requireSupabase()
    .from('product_reviews')
    .select(reviewColumns)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return ((data ?? []) as DbProductReview[]).map(mapReview)
}

export async function listSellerProductReviews(productIds: string[]): Promise<ProductReview[]> {
  if (!productIds.length) return []

  const { data, error } = await requireSupabase()
    .from('product_reviews')
    .select(reviewColumns)
    .in('product_id', productIds)
    .order('created_at', { ascending: false })

  if (error) throw error
  return ((data ?? []) as DbProductReview[]).map(mapReview)
}

export async function createProductReview(input: NewProductReview): Promise<ProductReview> {
  if (!input.productId) {
    throw new Error('This order item is not linked to a product ID, so the review cannot be saved.')
  }

  const supabase = requireSupabase()
  const [photoUrls, videoUrls] = await Promise.all([
    fileToDataUrl(input.photo),
    fileToDataUrl(input.video)
  ])

  const { data, error } = await supabase
    .from('product_reviews')
    .insert({
      user_id: input.userId,
      product_id: input.productId,
      rating: input.rating,
      review_text: input.reviewText.trim(),
      seller_service_rating: input.sellerServiceRating,
      delivery_service_rating: input.deliveryServiceRating,
      show_username: input.showUsername,
      photo_urls: photoUrls,
      video_urls: videoUrls
    })
    .select(reviewColumns)
    .single()

  if (error) throw formatSupabaseError(error)
  return mapReview(data as DbProductReview)
}
