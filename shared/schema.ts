import { pgTable, serial, integer, decimal, varchar, timestamp } from 'drizzle-orm/pg-core';

export const wines = pgTable('wines', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // 'rosso', 'bianco', 'bollicine', 'rosato'
  supplier: varchar('supplier', { length: 255 }).notNull(),
  inventory: integer('inventory').notNull().default(3),
  minStock: integer('min_stock').notNull().default(2),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  vintage: varchar('vintage', { length: 10 }),
  region: varchar('region', { length: 255 }),
  description: varchar('description', { length: 1000 }),
  userId: varchar('user_id', { length: 255 }),
});

export const googleSheetLinks = pgTable('google_sheet_links', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  sheetUrl: varchar('sheet_url', { length: 1000 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export type Wine = typeof wines.$inferSelect;
export type InsertWine = typeof wines.$inferInsert;
export type GoogleSheetLink = typeof googleSheetLinks.$inferSelect;
export type InsertGoogleSheetLink = typeof googleSheetLinks.$inferInsert;