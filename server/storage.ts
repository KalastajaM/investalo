
import { db } from "./db";
import {
  projects,
  properties,
  settings,
  type Project,
  type InsertProject,
  type Property,
  type InsertProperty,
  type Settings,
  type InsertSettings,
} from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { NotFoundError } from "./errors";

type CreatePropertyData = InsertProperty & { userId: string };
type CreateProjectData = InsertProject & { userId: string };

export interface IStorage {
  getProjects(userId: string): Promise<Project[]>;
  getProject(id: number, userId: string): Promise<Project | undefined>;
  createProject(project: CreateProjectData): Promise<Project>;
  updateProject(id: number, userId: string, updates: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: number, userId: string): Promise<void>;
  getProperties(userId: string): Promise<Property[]>;
  getProperty(id: number, userId: string): Promise<Property | undefined>;
  createProperty(property: CreatePropertyData): Promise<Property>;
  updateProperty(id: number, userId: string, updates: Partial<InsertProperty>): Promise<Property>;
  deleteProperty(id: number, userId: string): Promise<void>;
  duplicateProperty(id: number, userId: string): Promise<Property>;
  getSettings(userId: string): Promise<Settings>;
  updateSettings(userId: string, settings: InsertSettings): Promise<Settings>;
}

export class DatabaseStorage implements IStorage {
  async getProjects(userId: string): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.userId, userId)).orderBy(projects.createdAt);
  }

  async getProject(id: number, userId: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(and(eq(projects.id, id), eq(projects.userId, userId)));
    return project;
  }

  async createProject(insertProject: CreateProjectData): Promise<Project> {
    const [project] = await db.insert(projects).values(insertProject).returning();
    return project;
  }

  async updateProject(id: number, userId: string, updates: Partial<InsertProject>): Promise<Project> {
    const [updated] = await db
      .update(projects)
      .set(updates)
      .where(and(eq(projects.id, id), eq(projects.userId, userId)))
      .returning();
    if (!updated) throw new NotFoundError("Project", id);
    return updated;
  }

  async deleteProject(id: number, userId: string): Promise<void> {
    await db.transaction(async (tx) => {
      await tx
        .update(properties)
        .set({ projectIds: sql`array_remove(${properties.projectIds}, ${id})` })
        .where(eq(properties.userId, userId));
      await tx.delete(projects).where(and(eq(projects.id, id), eq(projects.userId, userId)));
    });
  }

  async getProperties(userId: string): Promise<Property[]> {
    return await db.select().from(properties).where(eq(properties.userId, userId)).orderBy(properties.createdAt);
  }

  async getProperty(id: number, userId: string): Promise<Property | undefined> {
    const [property] = await db.select().from(properties).where(and(eq(properties.id, id), eq(properties.userId, userId)));
    return property;
  }

  async createProperty(insertProperty: CreatePropertyData): Promise<Property> {
    const [property] = await db.insert(properties).values(insertProperty).returning();
    return property;
  }

  async updateProperty(id: number, userId: string, updates: Partial<InsertProperty>): Promise<Property> {
    const [updated] = await db
      .update(properties)
      .set(updates)
      .where(and(eq(properties.id, id), eq(properties.userId, userId)))
      .returning();
    if (!updated) throw new NotFoundError("Property", id);
    return updated;
  }

  async deleteProperty(id: number, userId: string): Promise<void> {
    await db.delete(properties).where(and(eq(properties.id, id), eq(properties.userId, userId)));
  }

  async duplicateProperty(id: number, userId: string): Promise<Property> {
    const [original] = await db.select().from(properties).where(and(eq(properties.id, id), eq(properties.userId, userId)));
    if (!original) throw new NotFoundError("Property", id);
    const { id: _id, createdAt: _createdAt, ...rest } = original;
    const [duplicate] = await db.insert(properties).values({
      ...rest,
      name: `${original.name} (Copy)`,
    }).returning();
    return duplicate;
  }

  async getSettings(userId: string): Promise<Settings> {
    const [existing] = await db.select().from(settings).where(eq(settings.userId, userId)).limit(1);
    if (existing) return existing;
    const [created] = await db.insert(settings).values({ userId }).returning();
    return created;
  }

  async updateSettings(userId: string, newSettings: InsertSettings): Promise<Settings> {
    const existing = await this.getSettings(userId);
    const [updated] = await db
      .update(settings)
      .set({ ...newSettings, userId })
      .where(eq(settings.id, existing.id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
