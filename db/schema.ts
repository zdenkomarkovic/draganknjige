// Šema MariaDB baze (Drizzle ORM). PREDLOG ZA PREGLED – još se ne koristi nigde u sajtu.
import {
  boolean,
  datetime,
  index,
  int,
  json,
  mediumtext,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core'

const createdAt = () => timestamp('created_at').notNull().defaultNow()
const updatedAt = () => timestamp('updated_at').notNull().defaultNow().onUpdateNow()

// ─── Katalog ─────────────────────────────────────────────────────────────────

export const categories = mysqlTable(
  'categories',
  {
    id: int('id', { unsigned: true }).autoincrement().primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    // Kategorija i podkategorija dele istu rutu (/product-category/[slug]),
    // pa slug mora da bude jedinstven i između ove dve tabele (proverava aplikacija).
    slug: varchar('slug', { length: 255 }).notNull(),
    description: text('description'),
    body: mediumtext('body'), // HTML teksta stranice kategorije (uvod + FAQ)
    imagePath: varchar('image_path', { length: 500 }),
    seoTitle: varchar('seo_title', { length: 255 }),
    seoDescription: text('seo_description'),
    pageSeoTitle: varchar('page_seo_title', { length: 255 }), // SEO naslov stranice /naziv-kategorije/
    pageSeoDescription: text('page_seo_description'),
    visible: boolean('visible').notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex('categories_slug_uq').on(t.slug)],
)

export const subcategories = mysqlTable(
  'subcategories',
  {
    id: int('id', { unsigned: true }).autoincrement().primaryKey(),
    categoryId: int('category_id', { unsigned: true })
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    seoTitle: varchar('seo_title', { length: 255 }),
    seoDescription: text('seo_description'),
    visible: boolean('visible').notNull().default(true),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex('subcategories_slug_uq').on(t.slug), index('subcategories_category_idx').on(t.categoryId)],
)

export const products = mysqlTable(
  'products',
  {
    id: int('id', { unsigned: true }).autoincrement().primaryKey(),
    // Ključ za idempotentan uvoz: ID oglasa na KupujemProdajem. Ručno dodati proizvodi ga nemaju.
    kpId: int('kp_id', { unsigned: true }),
    sourceUrl: varchar('source_url', { length: 500 }),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 300 }).notNull(),
    categoryId: int('category_id', { unsigned: true }).references(() => categories.id, { onDelete: 'set null' }),
    subcategoryId: int('subcategory_id', { unsigned: true }).references(() => subcategories.id, {
      onDelete: 'set null',
    }),
    price: int('price', { unsigned: true }), // RSD, cele vrednosti
    salePrice: int('sale_price', { unsigned: true }),
    shortDescription: varchar('short_description', { length: 255 }),
    description: text('description'), // običan tekst, redovi = pasusi
    summary: text('summary'),
    condition: varchar('condition', { length: 60 }), // stanje: npr. "Novo", "Korišćeno (polovno)"
    inStock: boolean('in_stock').notNull().default(true),
    visible: boolean('visible').notNull().default(true), // false = sakriveno sa sajta (ostaje u dashboardu)
    featured: boolean('featured').notNull().default(false),
    seoTitle: varchar('seo_title', { length: 255 }),
    seoDescription: text('seo_description'),
    // Faze uvoza: linkovi → detalji → slike → gotovo (omogućava nastavak posle prekida)
    importStatus: mysqlEnum('import_status', ['link', 'details', 'images', 'done']).notNull().default('done'),
    importedAt: datetime('imported_at'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('products_slug_uq').on(t.slug),
    uniqueIndex('products_kp_id_uq').on(t.kpId),
    // Liste: filter po (pod)kategoriji, sortirano po datumu ili ceni
    index('products_sub_created_idx').on(t.subcategoryId, t.visible, t.createdAt),
    index('products_cat_created_idx').on(t.categoryId, t.visible, t.createdAt),
    index('products_sub_price_idx').on(t.subcategoryId, t.visible, t.price),
    index('products_created_idx').on(t.visible, t.createdAt),
    index('products_featured_idx').on(t.featured, t.visible),
    index('products_import_status_idx').on(t.importStatus),
    // FULLTEXT(name) za pretragu se dodaje ručno u SQL migraciji (Drizzle ga ne podržava).
  ],
)

export const productImages = mysqlTable(
  'product_images',
  {
    id: int('id', { unsigned: true }).autoincrement().primaryKey(),
    productId: int('product_id', { unsigned: true })
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    position: int('position').notNull().default(0), // 0 = glavna slika
    path: varchar('path', { length: 500 }).notNull(), // npr. 12/34/12345-0.webp (800 px)
    thumbPath: varchar('thumb_path', { length: 500 }), // samo za glavnu sliku (300 px)
    width: int('width', { unsigned: true }),
    height: int('height', { unsigned: true }),
    alt: varchar('alt', { length: 255 }),
    sourceUrl: varchar('source_url', { length: 500 }),
    hash: varchar('hash', { length: 40 }), // sha1 originala – ista slika se ne skida dvaput
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('product_images_pos_uq').on(t.productId, t.position), index('product_images_hash_idx').on(t.hash)],
)

// ─── Narudžbine ──────────────────────────────────────────────────────────────

export const orders = mysqlTable(
  'orders',
  {
    id: int('id', { unsigned: true }).autoincrement().primaryKey(),
    status: mysqlEnum('status', ['nova', 'potvrdjena', 'poslata', 'zavrsena', 'otkazana']).notNull().default('nova'),
    ime: varchar('ime', { length: 100 }).notNull(),
    prezime: varchar('prezime', { length: 100 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    telefon: varchar('telefon', { length: 50 }).notNull(),
    adresa: varchar('adresa', { length: 255 }).notNull(),
    grad: varchar('grad', { length: 100 }).notNull(),
    postanskiBroj: varchar('postanski_broj', { length: 20 }).notNull(),
    napomena: text('napomena'),
    marketingConsent: boolean('marketing_consent').notNull().default(false),
    subtotal: int('subtotal', { unsigned: true }).notNull(),
    total: int('total', { unsigned: true }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('orders_status_created_idx').on(t.status, t.createdAt), index('orders_email_idx').on(t.email)],
)

export const orderItems = mysqlTable(
  'order_items',
  {
    id: int('id', { unsigned: true }).autoincrement().primaryKey(),
    orderId: int('order_id', { unsigned: true })
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    // Proizvod može kasnije da se obriše; naziv i cena su zato kopirani u stavku
    productId: int('product_id', { unsigned: true }).references(() => products.id, { onDelete: 'set null' }),
    name: varchar('name', { length: 255 }).notNull(),
    quantity: int('quantity', { unsigned: true }).notNull(),
    price: int('price', { unsigned: true }).notNull(),
  },
  (t) => [index('order_items_order_idx').on(t.orderId)],
)

// ─── Blog ────────────────────────────────────────────────────────────────────

export const posts = mysqlTable(
  'posts',
  {
    id: int('id', { unsigned: true }).autoincrement().primaryKey(),
    title: varchar('title', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 300 }).notNull(),
    excerpt: text('excerpt'),
    body: mediumtext('body'), // HTML iz editora u dashboardu
    mainImagePath: varchar('main_image_path', { length: 500 }),
    mainImageAlt: varchar('main_image_alt', { length: 255 }),
    blogCategories: json('blog_categories').$type<{ name: string; slug: string }[]>(),
    seoTitle: varchar('seo_title', { length: 255 }),
    seoDescription: text('seo_description'),
    publishedAt: datetime('published_at'), // null = skica
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex('posts_slug_uq').on(t.slug), index('posts_published_idx').on(t.publishedAt)],
)

// ─── Dashboard: korisnici i sesije ───────────────────────────────────────────

export const users = mysqlTable(
  'users',
  {
    id: int('id', { unsigned: true }).autoincrement().primaryKey(),
    email: varchar('email', { length: 255 }).notNull(),
    name: varchar('name', { length: 100 }).notNull(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(), // scrypt/argon2, nikad čist tekst
    role: mysqlEnum('role', ['admin', 'editor']).notNull().default('admin'),
    failedLogins: int('failed_logins', { unsigned: true }).notNull().default(0),
    lockedUntil: datetime('locked_until'),
    lastLoginAt: datetime('last_login_at'),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('users_email_uq').on(t.email)],
)

export const sessions = mysqlTable(
  'sessions',
  {
    // Čuva se SHA-256 heš tokena iz cookie-ja, ne sam token
    id: varchar('id', { length: 64 }).primaryKey(),
    userId: int('user_id', { unsigned: true })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: datetime('expires_at').notNull(),
    createdAt: createdAt(),
  },
  (t) => [index('sessions_user_idx').on(t.userId), index('sessions_expires_idx').on(t.expiresAt)],
)
