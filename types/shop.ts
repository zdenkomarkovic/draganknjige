export interface ProductImage {
  path: string
  thumbPath?: string | null
  alt?: string | null
  width?: number | null
  height?: number | null
}

export interface Category {
  _id: string
  name: string
  slug: string
  description?: string
  seoTitle?: string
  seoDescription?: string
  /** HTML teksta stranice kategorije (uvod + FAQ) */
  body?: string
  pageSeoTitle?: string
  pageSeoDescription?: string
  image?: { path: string; alt?: string }
  parent?: { _id: string; name: string; slug: string }
  subcategories?: { _id: string; name: string; slug: string }[]
}

export interface Product {
  _id: string
  name: string
  slug: string
  /** Običan tekst; novi red = novi pasus */
  description?: string
  summary?: string
  shortDescription?: string
  price?: number
  salePrice?: number
  images: ProductImage[]
  category?: { name: string; slug: string }
  subcategory?: { name: string; slug: string }
  condition?: string
  inStock: boolean
  featured: boolean
  seoTitle?: string
  seoDescription?: string
  _updatedAt?: string
}

export interface CartItem {
  _id: string
  name: string
  slug: string
  price?: number
  salePrice?: number
  image?: ProductImage
  quantity: number
}

export interface OrderFormData {
  ime: string
  prezime: string
  email: string
  telefon: string
  adresa: string
  grad: string
  postanskiBroj: string
  napomena?: string
  marketingConsent?: boolean
}

export interface Post {
  _id: string
  title: string
  slug: string
  publishedAt: string
  modifiedAt?: string
  excerpt?: string
  categories?: { name: string; slug: string }[]
  mainImage?: { path: string; alt?: string }
  body?: string
  seoTitle?: string
  seoDescription?: string
}
