import { 
  users, type User, type InsertUser,
  clients, type Client, type InsertClient,
  projects, type Project, type InsertProject,
  communications, type Communication, type InsertCommunication,
  documents, type Document, type InsertDocument,
  onboardingData, type OnboardingData, type InsertOnboardingData
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";

const MemoryStore = createMemoryStore(session);

// INTERFACE

export interface IStorage {
  // Session
  sessionStore: session.SessionStore;
  
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Clients
  getClient(id: number): Promise<Client | undefined>;
  getClientByUserId(userId: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<Client>): Promise<Client | undefined>;
  getAllClients(): Promise<Client[]>;
  getClientsByPipelineStage(stage: string): Promise<Client[]>;
  
  // Projects
  getProject(id: number): Promise<Project | undefined>;
  getProjectsByClientId(clientId: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<Project>): Promise<Project | undefined>;
  getAllProjects(): Promise<Project[]>;
  
  // Communications
  getCommunication(id: number): Promise<Communication | undefined>;
  getCommunicationsByProjectId(projectId: number): Promise<Communication[]>;
  getCommunicationsByUserId(userId: number): Promise<Communication[]>;
  createCommunication(communication: InsertCommunication): Promise<Communication>;
  markCommunicationAsRead(id: number): Promise<Communication | undefined>;
  
  // Documents
  getDocument(id: number): Promise<Document | undefined>;
  getDocumentsByProjectId(projectId: number): Promise<Document[]>;
  getDocumentsByClientId(clientId: number): Promise<Document[]>;
  getDocumentsByType(type: string): Promise<Document[]>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: number, document: Partial<Document>): Promise<Document | undefined>;
  
  // Onboarding
  getOnboardingData(id: number): Promise<OnboardingData | undefined>;
  getOnboardingDataByClientIdAndPhase(clientId: number, phase: string): Promise<OnboardingData | undefined>;
  getAllOnboardingDataForClient(clientId: number): Promise<OnboardingData[]>;
  createOrUpdateOnboardingData(data: InsertOnboardingData): Promise<OnboardingData>;
  completeOnboardingPhase(id: number): Promise<OnboardingData | undefined>;
}

// IMPLEMENTATION

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private clients: Map<number, Client>;
  private projects: Map<number, Project>;
  private communications: Map<number, Communication>;
  private documents: Map<number, Document>;
  private onboardingData: Map<number, OnboardingData>;
  
  sessionStore: session.SessionStore;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.clients = new Map();
    this.projects = new Map();
    this.communications = new Map();
    this.documents = new Map();
    this.onboardingData = new Map();
    this.currentId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Prune expired entries every 24h
    });
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: now,
      lastLogin: null 
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  // Clients
  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }
  
  async getClientByUserId(userId: number): Promise<Client | undefined> {
    return Array.from(this.clients.values()).find(
      (client) => client.userId === userId,
    );
  }
  
  async createClient(insertClient: InsertClient): Promise<Client> {
    const id = this.currentId++;
    const now = new Date();
    const client: Client = {
      ...insertClient,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.clients.set(id, client);
    return client;
  }
  
  async updateClient(id: number, clientData: Partial<Client>): Promise<Client | undefined> {
    const client = await this.getClient(id);
    if (!client) return undefined;
    
    const now = new Date();
    const updatedClient = { ...client, ...clientData, updatedAt: now };
    this.clients.set(id, updatedClient);
    return updatedClient;
  }
  
  async getAllClients(): Promise<Client[]> {
    return Array.from(this.clients.values());
  }
  
  async getClientsByPipelineStage(stage: string): Promise<Client[]> {
    return Array.from(this.clients.values()).filter(
      (client) => client.pipelineStage === stage,
    );
  }
  
  // Projects
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }
  
  async getProjectsByClientId(clientId: number): Promise<Project[]> {
    return Array.from(this.projects.values()).filter(
      (project) => project.clientId === clientId,
    );
  }
  
  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.currentId++;
    const now = new Date();
    const project: Project = {
      ...insertProject,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.projects.set(id, project);
    return project;
  }
  
  async updateProject(id: number, projectData: Partial<Project>): Promise<Project | undefined> {
    const project = await this.getProject(id);
    if (!project) return undefined;
    
    const now = new Date();
    const updatedProject = { ...project, ...projectData, updatedAt: now };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }
  
  async getAllProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }
  
  // Communications
  async getCommunication(id: number): Promise<Communication | undefined> {
    return this.communications.get(id);
  }
  
  async getCommunicationsByProjectId(projectId: number): Promise<Communication[]> {
    return Array.from(this.communications.values()).filter(
      (comm) => comm.projectId === projectId,
    );
  }
  
  async getCommunicationsByUserId(userId: number): Promise<Communication[]> {
    return Array.from(this.communications.values()).filter(
      (comm) => comm.senderId === userId || comm.recipientId === userId,
    );
  }
  
  async createCommunication(insertCommunication: InsertCommunication): Promise<Communication> {
    const id = this.currentId++;
    const now = new Date();
    const communication: Communication = {
      ...insertCommunication,
      id,
      createdAt: now,
      readAt: null
    };
    this.communications.set(id, communication);
    return communication;
  }
  
  async markCommunicationAsRead(id: number): Promise<Communication | undefined> {
    const communication = await this.getCommunication(id);
    if (!communication) return undefined;
    
    const now = new Date();
    const updatedCommunication = { ...communication, readAt: now };
    this.communications.set(id, updatedCommunication);
    return updatedCommunication;
  }
  
  // Documents
  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }
  
  async getDocumentsByProjectId(projectId: number): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(
      (doc) => doc.projectId === projectId,
    );
  }
  
  async getDocumentsByClientId(clientId: number): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(
      (doc) => doc.clientId === clientId,
    );
  }
  
  async getDocumentsByType(type: string): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(
      (doc) => doc.type === type,
    );
  }
  
  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.currentId++;
    const now = new Date();
    const document: Document = {
      ...insertDocument,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.documents.set(id, document);
    return document;
  }
  
  async updateDocument(id: number, documentData: Partial<Document>): Promise<Document | undefined> {
    const document = await this.getDocument(id);
    if (!document) return undefined;
    
    const now = new Date();
    const updatedDocument = { ...document, ...documentData, updatedAt: now };
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }
  
  // Onboarding
  async getOnboardingData(id: number): Promise<OnboardingData | undefined> {
    return this.onboardingData.get(id);
  }
  
  async getOnboardingDataByClientIdAndPhase(clientId: number, phase: string): Promise<OnboardingData | undefined> {
    return Array.from(this.onboardingData.values()).find(
      (data) => data.clientId === clientId && data.phase === phase,
    );
  }
  
  async getAllOnboardingDataForClient(clientId: number): Promise<OnboardingData[]> {
    return Array.from(this.onboardingData.values()).filter(
      (data) => data.clientId === clientId,
    );
  }
  
  async createOrUpdateOnboardingData(insertData: InsertOnboardingData): Promise<OnboardingData> {
    // Check if data already exists for this client and phase
    const existingData = await this.getOnboardingDataByClientIdAndPhase(
      insertData.clientId,
      insertData.phase
    );
    
    if (existingData) {
      const now = new Date();
      const updatedData = { 
        ...existingData, 
        data: insertData.data,
        updatedAt: now 
      };
      this.onboardingData.set(existingData.id, updatedData);
      return updatedData;
    } else {
      const id = this.currentId++;
      const now = new Date();
      const newData: OnboardingData = {
        ...insertData,
        id,
        completedAt: null,
        createdAt: now,
        updatedAt: now
      };
      this.onboardingData.set(id, newData);
      return newData;
    }
  }
  
  async completeOnboardingPhase(id: number): Promise<OnboardingData | undefined> {
    const data = await this.getOnboardingData(id);
    if (!data) return undefined;
    
    const now = new Date();
    const updatedData = { ...data, completedAt: now, updatedAt: now };
    this.onboardingData.set(id, updatedData);
    return updatedData;
  }
}

export const storage = new MemStorage();
