import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { createClient } from '@supabase/supabase-js'

const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env
const port = Number(process.env.PORT ?? 3000)
const host = process.env.HOST ?? '127.0.0.1'
const allowedOrigins = (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY must be configured.')
}

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be a valid TCP port.')
}

const app = express()
const asyncRoute = handler => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next)
}

class ApiError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

function getSupabaseClient(accessToken) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false
    },
    global: accessToken
      ? { headers: { Authorization: `Bearer ${accessToken}` } }
      : undefined
  })
}

function getAccessToken(req) {
  const authorization = req.get('authorization') ?? ''
  const match = authorization.match(/^Bearer\s+(\S+)$/i)
  return match?.[1] ?? null
}

const productColumns =
  'id,seller_id,name,category,type,price,stock,reorder_point,auto_reorder,color,image,sold,active,created_at,updated_at'

app.disable('x-powered-by')
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
      return
    }
    callback(new ApiError(403, 'This origin is not allowed.'))
  }
}))
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.get('/api/products', asyncRoute(async (req, res) => {
  const { data, error } = await getSupabaseClient()
    .from('products')
    .select(productColumns)
    .eq('active', true)
    .gt('stock', 0)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Unable to list storefront products:', error.message)
    throw new ApiError(500, 'Unable to load products.')
  }

  res.json({ products: data })
}))

app.use('/api', asyncRoute(async (req, res, next) => {
  const accessToken = getAccessToken(req)
  if (!accessToken) throw new ApiError(401, 'A valid bearer token is required.')

  const supabase = getSupabaseClient(accessToken)
  const { data: authData, error: authError } = await supabase.auth.getUser(accessToken)
  if (authError || !authData.user) throw new ApiError(401, 'The access token is invalid or expired.')

  req.supabase = supabase
  req.authUser = authData.user
  next()
}))

app.get('/api/me', asyncRoute(async (req, res) => {
  const { data, error } = await req.supabase
    .from('profiles')
    .select('*')
    .eq('id', req.authUser.id)
    .single()

  if (error) {
    console.error('Unable to load user profile:', error.message)
    throw new ApiError(500, 'Unable to load profile.')
  }

  res.json({ profile: data })
}))

app.patch('/api/me', asyncRoute(async (req, res) => {
  const allowedFields = ['full_name', 'phone', 'address', 'avatar']
  const body = req.body
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'A JSON object is required.')
  }

  const entries = Object.entries(body)
  if (!entries.length || entries.some(([key]) => !allowedFields.includes(key))) {
    throw new ApiError(400, 'Provide one or more supported profile fields.')
  }

  for (const [key, value] of entries) {
    if (value !== null && typeof value !== 'string') {
      throw new ApiError(400, `${key} must be a string or null.`)
    }
    if (key === 'full_name' && value === null) {
      throw new ApiError(400, 'full_name cannot be null.')
    }
    const maxLength = key === 'avatar' ? 1_000_000 : 2000
    if (typeof value === 'string' && value.length > maxLength) {
      throw new ApiError(400, `${key} is too long.`)
    }
  }

  const update = Object.fromEntries(entries.map(([key, value]) => [
    key,
    typeof value === 'string' && key !== 'avatar'
      ? key === 'full_name' ? value.trim() : value.trim() || null
      : value
  ]))
  const { data, error } = await req.supabase
    .from('profiles')
    .update(update)
    .eq('id', req.authUser.id)
    .select('*')
    .single()

  if (error) {
    console.error('Unable to update user profile:', error.message)
    throw new ApiError(500, 'Unable to update profile.')
  }

  res.json({ profile: data })
}))

app.use('/api/seller', asyncRoute(async (req, res, next) => {
  const { data: profile, error } = await req.supabase
    .from('profiles')
    .select('role')
    .eq('id', req.authUser.id)
    .single()

  if (error) {
    console.error('Unable to verify seller role:', error.message)
    throw new ApiError(500, 'Unable to verify account role.')
  }
  if (profile.role !== 'seller') throw new ApiError(403, 'Seller access is required.')
  next()
}))

app.get('/api/seller/products', asyncRoute(async (req, res) => {
  const { data, error } = await req.supabase
    .from('products')
    .select(productColumns)
    .eq('seller_id', req.authUser.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Unable to list seller products:', error.message)
    throw new ApiError(500, 'Unable to load inventory.')
  }

  res.json({ products: data })
}))

app.post('/api/seller/products', asyncRoute(async (req, res) => {
  const input = req.body
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new ApiError(400, 'A JSON object is required.')
  }

  const { name, category, type, price, stock, reorderPoint, color, image } = input
  if (typeof name !== 'string' || !name.trim() || name.length > 200 ||
      typeof category !== 'string' || !category.trim() || category.length > 100 ||
      (type !== undefined && type !== null && (typeof type !== 'string' || type.length > 100)) ||
      !Number.isFinite(price) || price <= 0 ||
      !Number.isInteger(stock) || stock < 0 ||
      !Number.isInteger(reorderPoint) || reorderPoint < 0 ||
      (color !== undefined && color !== null && (typeof color !== 'string' || color.length > 100)) ||
      (image !== undefined && image !== null && (typeof image !== 'string' || image.length > 1_000_000))) {
    throw new ApiError(400, 'Product fields are invalid.')
  }

  const { data, error } = await req.supabase
    .from('products')
    .insert({
      seller_id: req.authUser.id,
      name: name.trim(),
      category: category.trim(),
      type: type?.trim() || null,
      price,
      stock,
      reorder_point: reorderPoint,
      auto_reorder: false,
      color: color?.trim() || null,
      image: image || null,
      sold: 0,
      active: true
    })
    .select(productColumns)
    .single()

  if (error) {
    console.error('Unable to create seller product:', error.message)
    throw new ApiError(500, 'Unable to create product.')
  }

  res.status(201).json({ product: data })
}))

app.patch('/api/seller/products/:id', asyncRoute(async (req, res) => {
  const id = req.params.id
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    throw new ApiError(400, 'A valid product ID is required.')
  }

  const fields = {
    price: 'price',
    stock: 'stock',
    reorderPoint: 'reorder_point',
    autoReorder: 'auto_reorder'
  }
  const entries = Object.entries(req.body ?? {})
  if (!entries.length || entries.some(([key]) => !Object.hasOwn(fields, key))) {
    throw new ApiError(400, 'Provide one or more supported inventory fields.')
  }

  const update = {}
  for (const [key, value] of entries) {
    if (key === 'price') {
      if (!Number.isFinite(value) || value <= 0) throw new ApiError(400, 'price must be greater than zero.')
    } else if (key === 'autoReorder') {
      if (typeof value !== 'boolean') throw new ApiError(400, 'autoReorder must be a boolean.')
    } else if (!Number.isInteger(value) || value < 0) {
      throw new ApiError(400, `${key} must be a non-negative integer.`)
    }
    update[fields[key]] = value
  }

  const { data, error } = await req.supabase
    .from('products')
    .update(update)
    .eq('id', id)
    .eq('seller_id', req.authUser.id)
    .select(productColumns)
    .maybeSingle()

  if (error) {
    console.error('Unable to update seller product:', error.message)
    throw new ApiError(500, 'Unable to update product.')
  }
  if (!data) throw new ApiError(404, 'Product not found.')

  res.json({ product: data })
}))

app.delete('/api/seller/products/:id', asyncRoute(async (req, res) => {
  const id = req.params.id
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    throw new ApiError(400, 'A valid product ID is required.')
  }

  const { data, error } = await req.supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('seller_id', req.authUser.id)
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('Unable to delete seller product:', error.message)
    throw new ApiError(500, 'Unable to delete product.')
  }
  if (!data) throw new ApiError(404, 'Product not found.')

  res.status(204).end()
}))

app.use((req, res, next) => {
  next(new ApiError(404, 'Route not found.'))
})

app.use((error, req, res, next) => {
  if (res.headersSent) {
    next(error)
    return
  }

  const status = Number.isInteger(error.status) ? error.status : 500
  if (status === 500) console.error('Unhandled API error:', error)
  res.status(status).json({
    error: status === 500 ? 'Internal server error.' : error.message
  })
})

app.listen(port, host, () => {
  console.log(`Pre-Loved Thrift API listening on http://${host}:${port}.`)
})
