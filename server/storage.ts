import { wines, googleSheetLinks, type Wine, type InsertWine, type GoogleSheetLink, type InsertGoogleSheetLink } from "../shared/schema";
import { db } from "./db";
import { eq, sql } from "drizzle-orm";

export interface IStorage {
  getWines(): Promise<Wine[]>;
  getWineById(id: number): Promise<Wine | undefined>;
  createWine(insertWine: InsertWine): Promise<Wine>;
  updateWine(id: number, updates: Partial<InsertWine>): Promise<Wine | undefined>;
  deleteWine(id: number): Promise<boolean>;
  getWinesByType(type: string): Promise<Wine[]>;
  getWinesBySupplier(supplier: string): Promise<Wine[]>;
  getLowStockWines(): Promise<Wine[]>;
  getSuppliers(): Promise<string[]>;
  
  // Google Sheet Link methods
  getGoogleSheetLink(userId: string): Promise<GoogleSheetLink | undefined>;
  saveGoogleSheetLink(userId: string, sheetUrl: string): Promise<GoogleSheetLink>;
  deleteGoogleSheetLink(userId: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getWines(): Promise<Wine[]> {
    return await db.select().from(wines);
  }

  async getWineById(id: number): Promise<Wine | undefined> {
    const [wine] = await db.select().from(wines).where(eq(wines.id, id));
    return wine || undefined;
  }

  async createWine(insertWine: InsertWine): Promise<Wine> {
    const [wine] = await db
      .insert(wines)
      .values(insertWine)
      .returning();
    return wine;
  }

  async updateWine(id: number, updates: Partial<InsertWine>): Promise<Wine | undefined> {
    // Filtra solo i campi che hanno valori definiti
    const filteredUpdates: any = {};
    Object.keys(updates).forEach(key => {
      const value = (updates as any)[key];
      if (value !== undefined && value !== null && value !== '') {
        filteredUpdates[key] = value;
      }
    });

    const [wine] = await db
      .update(wines)
      .set(filteredUpdates)
      .where(eq(wines.id, id))
      .returning();
    return wine || undefined;
  }

  async deleteWine(id: number): Promise<boolean> {
    const result = await db.delete(wines).where(eq(wines.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getWinesByType(type: string): Promise<Wine[]> {
    return await db.select().from(wines).where(eq(wines.type, type));
  }

  async getWinesBySupplier(supplier: string): Promise<Wine[]> {
    return await db.select().from(wines).where(eq(wines.supplier, supplier));
  }

  async getLowStockWines(): Promise<Wine[]> {
    return await db.select().from(wines).where(sql`${wines.inventory} <= ${wines.minStock}`);
  }

  async getSuppliers(): Promise<string[]> {
    const result = await db.select({ supplier: wines.supplier }).from(wines).where(sql`${wines.supplier} IS NOT NULL AND ${wines.supplier} != ''`);
    const uniqueSuppliers = [...new Set(result.map(row => row.supplier))];
    return uniqueSuppliers;
  }

  // Google Sheet Link methods
  async getGoogleSheetLink(userId: string): Promise<GoogleSheetLink | undefined> {
    const [link] = await db.select().from(googleSheetLinks).where(eq(googleSheetLinks.userId, userId));
    return link || undefined;
  }

  async saveGoogleSheetLink(userId: string, sheetUrl: string): Promise<GoogleSheetLink> {
    // Check if link already exists for this user
    const existingLink = await this.getGoogleSheetLink(userId);
    
    if (existingLink) {
      // Update existing link
      const [updatedLink] = await db
        .update(googleSheetLinks)
        .set({ 
          sheetUrl, 
          updatedAt: sql`NOW()` 
        })
        .where(eq(googleSheetLinks.userId, userId))
        .returning();
      return updatedLink;
    } else {
      // Create new link
      const [newLink] = await db
        .insert(googleSheetLinks)
        .values({ userId, sheetUrl })
        .returning();
      return newLink;
    }
  }

  async deleteGoogleSheetLink(userId: string): Promise<boolean> {
    const result = await db
      .delete(googleSheetLinks)
      .where(eq(googleSheetLinks.userId, userId));
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();