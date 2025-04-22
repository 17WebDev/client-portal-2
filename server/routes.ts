import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { db } from "./db";
import { 
  insertClientSchema, 
  insertProjectSchema, 
  insertCommunicationSchema, 
  insertDocumentSchema, 
  insertOnboardingDataSchema,
  insertProjectStatusHistorySchema,
  insertProjectClarificationSchema,
  insertProjectStatusDataSchema,
  projectClarifications
} from "@shared/schema";
import { 
  projectStatusService, 
  webhookService, 
  notificationService, 
  n8nService 
} from "./services";
import { z } from "zod";
import { eq } from "drizzle-orm";

// Middleware to check if user is authenticated
const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized - Please login" });
};

// Middleware to check if user is an admin
const isAdmin = (req: any, res: any, next: any) => {
  if (req.isAuthenticated() && req.user.role === "admin") {
    return next();
  }
  res.status(403).json({ message: "Forbidden - Admin access required" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // PROJECT STATUS ROUTES
  
  // Get project status data
  app.get("/api/projects/:id/status", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check permissions
      if (req.user?.role !== "admin") {
        // For clients, check if the project belongs to them
        const client = await storage.getClientByUserId(req.user?.id || 0);
        if (!client || client.id !== project.clientId) {
          return res.status(403).json({ message: "You don't have permission to access this project" });
        }
      }
      
      try {
        const statusData = await projectStatusService.getProjectStatusData(projectId);
        res.json(statusData);
      } catch (error) {
        // If status data doesn't exist yet, initialize it for this project
        if (error instanceof Error && error.message.includes("not found")) {
          await projectStatusService.initializeProjectStatus(projectId, "SCOPING", req.user?.id || 1);
          const statusData = await projectStatusService.getProjectStatusData(projectId);
          res.json(statusData);
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error("Error fetching project status:", error);
      res.status(500).json({ message: "Failed to fetch project status" });
    }
  });
  
  // Get project status history
  app.get("/api/projects/:id/status/history", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check permissions
      if (req.user?.role !== "admin") {
        // For clients, check if the project belongs to them
        const client = await storage.getClientByUserId(req.user?.id || 0);
        if (!client || client.id !== project.clientId) {
          return res.status(403).json({ message: "You don't have permission to access this project" });
        }
      }
      
      const history = await projectStatusService.getProjectStatusHistory(projectId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching project status history:", error);
      res.status(500).json({ message: "Failed to fetch project status history" });
    }
  });
  
  // Update project status (admin only)
  app.post("/api/projects/:id/status", isAdmin, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { statusCode, notes } = req.body;
      
      if (!statusCode) {
        return res.status(400).json({ message: "Status code is required" });
      }
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const result = await projectStatusService.updateProjectStatus(
        projectId,
        statusCode,
        req.user?.id || 1,
        notes
      );
      
      res.json(result);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Invalid status transition")) {
        return res.status(400).json({ message: error.message });
      }
      console.error("Error updating project status:", error);
      res.status(500).json({ message: "Failed to update project status" });
    }
  });
  
  // Set project sub-status (admin only)
  app.post("/api/projects/:id/substatus", isAdmin, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { subStatus, reason } = req.body;
      
      if (!subStatus) {
        return res.status(400).json({ message: "Sub-status is required" });
      }
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const result = await projectStatusService.setProjectSubStatus(
        projectId,
        subStatus,
        req.user?.id || 1,
        reason
      );
      
      res.json(result);
    } catch (error) {
      console.error("Error setting project sub-status:", error);
      res.status(500).json({ message: "Failed to set project sub-status" });
    }
  });
  
  // Request clarification for a project (admin only)
  app.post("/api/projects/:id/clarification/request", isAdmin, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { question } = req.body;
      
      if (!question) {
        return res.status(400).json({ message: "Question is required" });
      }
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const result = await projectStatusService.requestClarification(
        projectId,
        question,
        req.user?.id || 1
      );
      
      res.json(result);
    } catch (error) {
      console.error("Error requesting clarification:", error);
      res.status(500).json({ message: "Failed to request clarification" });
    }
  });
  
  // Respond to a clarification request (client can respond)
  app.post("/api/projects/clarification/:id/respond", isAuthenticated, async (req, res) => {
    try {
      const clarificationId = parseInt(req.params.id);
      const { response } = req.body;
      
      if (!response) {
        return res.status(400).json({ message: "Response is required" });
      }
      
      // Get the clarification to check permissions
      const clarifications = await db
        .select()
        .from(projectClarifications)
        .where(eq(projectClarifications.id, clarificationId));
      
      if (clarifications.length === 0) {
        return res.status(404).json({ message: "Clarification request not found" });
      }
      
      const clarification = clarifications[0];
      const project = await storage.getProject(clarification.projectId);
      
      // Check permissions
      if (req.user?.role !== "admin") {
        // For clients, check if the project belongs to them
        const client = await storage.getClientByUserId(req.user?.id || 0);
        if (!client || client.id !== project.clientId) {
          return res.status(403).json({ message: "You don't have permission to respond to this clarification" });
        }
      }
      
      const result = await projectStatusService.respondToClarification(
        clarificationId,
        response,
        req.user?.id || 1
      );
      
      res.json(result);
    } catch (error) {
      console.error("Error responding to clarification:", error);
      res.status(500).json({ message: "Failed to respond to clarification" });
    }
  });
  
  // Get project clarifications
  app.get("/api/projects/:id/clarifications", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check permissions
      if (req.user?.role !== "admin") {
        // For clients, check if the project belongs to them
        const client = await storage.getClientByUserId(req.user?.id || 0);
        if (!client || client.id !== project.clientId) {
          return res.status(403).json({ message: "You don't have permission to access this project" });
        }
      }
      
      const clarifications = await projectStatusService.getProjectClarifications(projectId);
      
      // Enhance with user information
      const enhancedClarifications = await Promise.all(
        clarifications.map(async (clarification) => {
          const requestedBy = await storage.getUser(clarification.requestedById);
          let respondedBy = null;
          if (clarification.respondedById) {
            respondedBy = await storage.getUser(clarification.respondedById);
          }
          
          return {
            ...clarification,
            requestedBy: requestedBy ? { id: requestedBy.id, name: requestedBy.name } : null,
            respondedBy: respondedBy ? { id: respondedBy.id, name: respondedBy.name } : null
          };
        })
      );
      
      res.json(enhancedClarifications);
    } catch (error) {
      console.error("Error fetching clarifications:", error);
      res.status(500).json({ message: "Failed to fetch clarifications" });
    }
  });
  
  // Update project health (admin only)
  app.post("/api/projects/:id/health", isAdmin, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const { healthStatus, healthFactors } = req.body;
      
      if (!healthStatus || !healthFactors) {
        return res.status(400).json({ message: "Health status and factors are required" });
      }
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const result = await projectStatusService.updateProjectHealth(
        projectId,
        healthStatus,
        healthFactors,
        req.user?.id || 1
      );
      
      res.json(result);
    } catch (error) {
      if (error instanceof Error && error.message.includes("Invalid health status")) {
        return res.status(400).json({ message: error.message });
      }
      console.error("Error updating project health:", error);
      res.status(500).json({ message: "Failed to update project health" });
    }
  });

  // CLIENTS ROUTES
  
  // Get all clients (admin only)
  app.get("/api/clients", isAdmin, async (req, res) => {
    try {
      const clients = await storage.getAllClients();
      
      // Enhance client data with user information
      const clientsWithUserInfo = await Promise.all(clients.map(async (client) => {
        const user = await storage.getUser(client.userId);
        return {
          ...client,
          userInfo: user ? { 
            name: user.name, 
            email: user.email, 
            phone: user.phone 
          } : null
        };
      }));
      
      res.json(clientsWithUserInfo);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });
  
  // Get client by ID
  app.get("/api/clients/:id", isAuthenticated, async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      
      // Check user permissions
      if (req.user.role !== "admin") {
        // For clients, check if they're requesting their own data
        const userClient = await storage.getClientByUserId(req.user.id);
        if (!userClient || userClient.id !== clientId) {
          return res.status(403).json({ message: "You don't have permission to access this client data" });
        }
      }
      
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      // Get user info for this client
      const user = await storage.getUser(client.userId);
      
      res.json({
        ...client,
        userInfo: user ? { 
          name: user.name, 
          email: user.email, 
          phone: user.phone 
        } : null
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });
  
  // Create new client (admin only)
  app.post("/api/clients", isAdmin, async (req, res) => {
    try {
      const clientData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(clientData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid client data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create client" });
    }
  });
  
  // Update a client
  app.put("/api/clients/:id", isAuthenticated, async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      
      // Check permissions
      if (req.user.role !== "admin") {
        // For clients, check if they're updating their own data
        const userClient = await storage.getClientByUserId(req.user.id);
        if (!userClient || userClient.id !== clientId) {
          return res.status(403).json({ message: "You don't have permission to update this client" });
        }
      }
      
      const existingClient = await storage.getClient(clientId);
      if (!existingClient) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      const updatedClient = await storage.updateClient(clientId, req.body);
      res.json(updatedClient);
    } catch (error) {
      res.status(500).json({ message: "Failed to update client" });
    }
  });
  
  // Get client projects
  app.get("/api/clients/:id/projects", isAuthenticated, async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      
      // Check permissions
      if (req.user.role !== "admin") {
        // For clients, check if they're requesting their own projects
        const userClient = await storage.getClientByUserId(req.user.id);
        if (!userClient || userClient.id !== clientId) {
          return res.status(403).json({ message: "You don't have permission to access these projects" });
        }
      }
      
      const projects = await storage.getProjectsByClientId(clientId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch client projects" });
    }
  });
  
  // Get client onboarding status
  app.get("/api/clients/:id/onboarding-status", isAuthenticated, async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      
      // Check permissions
      if (req.user.role !== "admin") {
        // For clients, check if they're requesting their own onboarding status
        const userClient = await storage.getClientByUserId(req.user.id);
        if (!userClient || userClient.id !== clientId) {
          return res.status(403).json({ message: "You don't have permission to access this information" });
        }
      }
      
      const client = await storage.getClient(clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      const onboardingData = await storage.getAllOnboardingDataForClient(clientId);
      
      res.json({
        status: client.onboardingStatus,
        phases: onboardingData
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch onboarding status" });
    }
  });
  
  // Create/update onboarding data
  app.post("/api/clients/:id/onboarding-data", isAuthenticated, async (req, res) => {
    try {
      const clientId = parseInt(req.params.id);
      
      // Check permissions
      if (req.user.role !== "admin") {
        // For clients, check if they're updating their own onboarding data
        const userClient = await storage.getClientByUserId(req.user.id);
        if (!userClient || userClient.id !== clientId) {
          return res.status(403).json({ message: "You don't have permission to update this information" });
        }
      }
      
      const onboardingData = insertOnboardingDataSchema.parse({
        ...req.body,
        clientId
      });
      
      const savedData = await storage.createOrUpdateOnboardingData(onboardingData);
      
      // If this is the last phase, update client onboarding status
      if (onboardingData.phase === "company_profile") {
        await storage.updateClient(clientId, { onboardingStatus: "completed" });
      } else if (onboardingData.phase === "project_details") {
        await storage.updateClient(clientId, { onboardingStatus: "in_progress" });
      }
      
      res.status(201).json(savedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid onboarding data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to save onboarding data" });
    }
  });
  
  // PROJECTS ROUTES
  
  // Get all projects
  app.get("/api/projects", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role === "admin") {
        // Admin can see all projects
        const projects = await storage.getAllProjects();
        return res.json(projects);
      } else {
        // Clients can only see their own projects
        const client = await storage.getClientByUserId(req.user.id);
        if (!client) {
          return res.json([]);
        }
        const projects = await storage.getProjectsByClientId(client.id);
        return res.json(projects);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });
  
  // Get project by ID
  app.get("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check permissions
      if (req.user.role !== "admin") {
        // For clients, check if the project belongs to them
        const client = await storage.getClientByUserId(req.user.id);
        if (!client || client.id !== project.clientId) {
          return res.status(403).json({ message: "You don't have permission to access this project" });
        }
      }
      
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });
  
  // Create new project
  app.post("/api/projects", isAdmin, async (req, res) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create project" });
    }
  });
  
  // Update a project
  app.put("/api/projects/:id", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check permissions
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Only admins can update projects" });
      }
      
      const updatedProject = await storage.updateProject(projectId, req.body);
      res.json(updatedProject);
    } catch (error) {
      res.status(500).json({ message: "Failed to update project" });
    }
  });
  
  // Get project documents
  app.get("/api/projects/:id/documents", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check permissions
      if (req.user.role !== "admin") {
        // For clients, check if the project belongs to them
        const client = await storage.getClientByUserId(req.user.id);
        if (!client || client.id !== project.clientId) {
          return res.status(403).json({ message: "You don't have permission to access these documents" });
        }
      }
      
      const documents = await storage.getDocumentsByProjectId(projectId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project documents" });
    }
  });
  
  // Get project communications
  app.get("/api/projects/:id/communications", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check permissions
      if (req.user.role !== "admin") {
        // For clients, check if the project belongs to them
        const client = await storage.getClientByUserId(req.user.id);
        if (!client || client.id !== project.clientId) {
          return res.status(403).json({ message: "You don't have permission to access these communications" });
        }
      }
      
      const communications = await storage.getCommunicationsByProjectId(projectId);
      
      // Enhance with user information
      const enhancedCommunications = await Promise.all(communications.map(async (comm) => {
        const sender = await storage.getUser(comm.senderId);
        const recipient = await storage.getUser(comm.recipientId);
        
        return {
          ...comm,
          sender: sender ? { id: sender.id, name: sender.name } : null,
          recipient: recipient ? { id: recipient.id, name: recipient.name } : null
        };
      }));
      
      res.json(enhancedCommunications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project communications" });
    }
  });
  
  // DOCUMENTS ROUTES
  
  // Get all documents
  app.get("/api/documents", isAuthenticated, async (req, res) => {
    try {
      if (req.user.role === "admin") {
        // Filter by type if provided
        if (req.query.type) {
          const documents = await storage.getDocumentsByType(req.query.type as string);
          return res.json(documents);
        }
        
        // Get all documents for admin
        const allDocuments = await Promise.all([
          storage.getDocumentsByType("contract"),
          storage.getDocumentsByType("invoice"),
          storage.getDocumentsByType("deliverable")
        ]).then(arrays => arrays.flat());
        
        return res.json(allDocuments);
      } else {
        // For clients, get documents associated with their client ID
        const client = await storage.getClientByUserId(req.user.id);
        if (!client) {
          return res.json([]);
        }
        
        // Filter by type if provided
        if (req.query.type) {
          const documents = await storage.getDocumentsByType(req.query.type as string);
          return res.json(documents.filter(doc => 
            doc.clientId === client.id || 
            storage.getProject(doc.projectId!).then(project => project?.clientId === client.id)
          ));
        }
        
        const clientDocuments = await storage.getDocumentsByClientId(client.id);
        
        // Also get documents from client's projects
        const projects = await storage.getProjectsByClientId(client.id);
        const projectDocuments = await Promise.all(
          projects.map(project => storage.getDocumentsByProjectId(project.id))
        ).then(arrays => arrays.flat());
        
        // Combine and remove duplicates
        const combinedDocuments = [...clientDocuments];
        projectDocuments.forEach(doc => {
          if (!combinedDocuments.some(d => d.id === doc.id)) {
            combinedDocuments.push(doc);
          }
        });
        
        return res.json(combinedDocuments);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });
  
  // Get document by ID
  app.get("/api/documents/:id", isAuthenticated, async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Check permissions
      if (req.user.role !== "admin") {
        // For clients, check if they have access to this document
        const client = await storage.getClientByUserId(req.user.id);
        if (!client) {
          return res.status(403).json({ message: "You don't have permission to access this document" });
        }
        
        // Check if document is directly associated with client
        if (document.clientId === client.id) {
          return res.json(document);
        }
        
        // Check if document is associated with client's project
        if (document.projectId) {
          const project = await storage.getProject(document.projectId);
          if (project && project.clientId === client.id) {
            return res.json(document);
          }
        }
        
        return res.status(403).json({ message: "You don't have permission to access this document" });
      }
      
      res.json(document);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch document" });
    }
  });
  
  // Create new document
  app.post("/api/documents", isAdmin, async (req, res) => {
    try {
      const documentData = insertDocumentSchema.parse(req.body);
      const document = await storage.createDocument(documentData);
      res.status(201).json(document);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid document data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create document" });
    }
  });
  
  // Update a document
  app.put("/api/documents/:id", isAuthenticated, async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Only admins can update documents, except for signing
      if (req.user.role !== "admin" && req.body.status !== "signed") {
        return res.status(403).json({ message: "You don't have permission to update this document" });
      }
      
      const updatedDocument = await storage.updateDocument(documentId, req.body);
      res.json(updatedDocument);
    } catch (error) {
      res.status(500).json({ message: "Failed to update document" });
    }
  });
  
  // COMMUNICATIONS ROUTES
  
  // Create new communication
  app.post("/api/communications", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.body.projectId);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check permissions
      if (req.user.role !== "admin") {
        // For clients, check if the project belongs to them
        const client = await storage.getClientByUserId(req.user.id);
        if (!client || client.id !== project.clientId) {
          return res.status(403).json({ message: "You don't have permission to send messages for this project" });
        }
      }
      
      const communicationData = insertCommunicationSchema.parse({
        ...req.body,
        senderId: req.user.id
      });
      
      const communication = await storage.createCommunication(communicationData);
      res.status(201).json(communication);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid communication data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create communication" });
    }
  });
  
  // Mark communication as read
  app.post("/api/communications/:id/read", isAuthenticated, async (req, res) => {
    try {
      const communicationId = parseInt(req.params.id);
      const communication = await storage.getCommunication(communicationId);
      
      if (!communication) {
        return res.status(404).json({ message: "Communication not found" });
      }
      
      // Check if user is the recipient
      if (communication.recipientId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "You don't have permission to mark this message as read" });
      }
      
      const updatedCommunication = await storage.markCommunicationAsRead(communicationId);
      res.json(updatedCommunication);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark communication as read" });
    }
  });
  
  // ANALYTICS ROUTES
  
  // Get pipeline analytics
  app.get("/api/analytics/pipeline", isAdmin, async (req, res) => {
    try {
      const pipelineStages = [
        "qualifying_call",
        "discovery_call",
        "followup_call",
        "free_work_delivery",
        "final_presentation"
      ];
      
      const pipelineData = await Promise.all(
        pipelineStages.map(async (stage) => {
          const clients = await storage.getClientsByPipelineStage(stage);
          return {
            stage,
            count: clients.length,
            clients: clients.map(client => ({ id: client.id, companyName: client.companyName }))
          };
        })
      );
      
      res.json(pipelineData);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pipeline analytics" });
    }
  });
  
  // Get project analytics
  app.get("/api/analytics/projects", isAdmin, async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      
      // Calculate project statistics
      const totalProjects = projects.length;
      const completedProjects = projects.filter(p => p.status === "completed").length;
      const inProgressProjects = projects.filter(p => p.status === "in_progress").length;
      const planningProjects = projects.filter(p => p.status === "planning").length;
      const onHoldProjects = projects.filter(p => p.status === "on_hold").length;
      
      // Calculate average completion time (if data available)
      let avgCompletionDays = 0;
      const completedWithDates = projects.filter(p => 
        p.status === "completed" && p.createdAt && p.updatedAt
      );
      
      if (completedWithDates.length > 0) {
        const totalDays = completedWithDates.reduce((sum, project) => {
          const createdDate = new Date(project.createdAt);
          const completedDate = new Date(project.updatedAt);
          const days = Math.floor((completedDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
          return sum + days;
        }, 0);
        
        avgCompletionDays = Math.round(totalDays / completedWithDates.length);
      }
      
      res.json({
        totalProjects,
        projectsByStatus: {
          completed: completedProjects,
          inProgress: inProgressProjects,
          planning: planningProjects,
          onHold: onHoldProjects
        },
        completionRate: totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0,
        avgCompletionDays
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project analytics" });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
