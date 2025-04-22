import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Loader2, 
  ArrowLeft, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Calendar, 
  Users, 
  FileText, 
  MessageSquare,
  ArrowRight,
  ExternalLink,
  AlertTriangle,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";

const getStatusColor = (status: string) => {
  const statusColors: Record<string, string> = {
    "planning": "bg-blue-500",
    "scoping": "bg-blue-500",
    "reviewing": "bg-blue-500",
    "proposal_phase": "bg-blue-500",
    "approved": "bg-blue-500",
    "setting_up": "bg-blue-500",
    "in_progress": "bg-amber-500",
    "on_hold": "bg-purple-500",
    "revision_required": "bg-amber-500",
    "internal_review": "bg-amber-500",
    "ready_for_client_review": "bg-amber-500",
    "uat_testing": "bg-amber-500",
    "deployment_preparation": "bg-amber-500",
    "deployed": "bg-amber-500",
    "completed": "bg-green-500",
    "maintenance": "bg-green-500"
  };
  
  return statusColors[status.toLowerCase()] || "bg-gray-500";
};

const getHealthColor = (health: string) => {
  const healthColors: Record<string, string> = {
    "excellent": "bg-green-500",
    "good": "bg-green-400",
    "at_risk": "bg-amber-500",
    "critical": "bg-red-500"
  };
  
  return healthColors[health.toLowerCase()] || "bg-gray-500";
};

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Define Project type
  type ProjectTeamMember = {
    id: string;
    name: string;
    role: string;
  };
  
  type Project = {
    id: string;
    name: string;
    description: string;
    startDate: Date;
    estimatedCompletionDate: Date;
    actualCompletionDate?: Date | null;
    client: {
      id: string;
      name: string;
      primaryContact: string;
    };
    team: {
      projectManager: {
        id: string;
        name: string;
        email: string;
      };
      members: ProjectTeamMember[];
    };
    tags: string[];
    priority: string;
    currentStatus: {
      code: string;
      label: string;
      since: Date;
      notes: string;
    };
    subStatus: {
      code: string;
      label: string;
      reason: string;
    };
    progressPercentage: number;
    healthMetrics: {
      overallHealth: string;
      factors: {
        [key: string]: { status: string; details: string };
      }
    };
    requiredActions?: {
      id: string;
      title: string;
      description: string;
      type: string;
      priority: string;
      dueDate: Date;
      status: string;
    }[];
    statusJourney: {
      status: string;
      startDate: Date | null;
      endDate: Date | null;
      completed: boolean;
    }[];
  };

  // Fetch project details
  const { data: project, isLoading } = useQuery<Project>({
    queryKey: ["/api/projects", id],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Placeholder project data for UI demonstration
  const demoProject = {
    id: id,
    name: "Website Redesign Project",
    description: "Complete overhaul of the company website with modern design and improved functionality",
    startDate: new Date("2023-04-05"),
    estimatedCompletionDate: new Date("2023-06-30"),
    client: {
      id: "1",
      name: "Acme Corporation",
      primaryContact: "John Doe"
    },
    team: {
      projectManager: {
        id: "1",
        name: "Sarah Smith",
        email: "sarah@example.com"
      },
      members: [
        { id: "2", name: "Mike Johnson", role: "Designer" },
        { id: "3", name: "Emily Chen", role: "Developer" },
        { id: "4", name: "Carlos Rodriguez", role: "QA Specialist" }
      ]
    },
    tags: ["Web Development", "Design", "Frontend"],
    priority: "High",
    currentStatus: {
      code: "in_progress",
      label: "In Progress",
      since: new Date("2023-04-20"),
      notes: "Development phase ongoing"
    },
    subStatus: {
      code: "frontend_development",
      label: "Frontend Development",
      reason: "Working on responsive layouts"
    },
    progressPercentage: 65,
    healthMetrics: {
      overallHealth: "Good",
      factors: {
        timeline: { status: "Good", details: "On schedule" },
        budget: { status: "Good", details: "Within budget" },
        scopeClarity: { status: "At Risk", details: "Some requirements need clarification" },
        communication: { status: "Excellent", details: "Regular updates and meetings" }
      }
    },
    requiredActions: [
      {
        id: "action1",
        title: "Review Homepage Design",
        description: "Please review the latest homepage design mockups and provide feedback",
        type: "Review",
        priority: "High",
        dueDate: new Date("2023-05-10"),
        status: "Pending"
      }
    ],
    statusJourney: [
      { status: "Planning", startDate: new Date("2023-03-20"), endDate: new Date("2023-04-05"), completed: true },
      { status: "Design", startDate: new Date("2023-04-05"), endDate: new Date("2023-04-20"), completed: true },
      { status: "Development", startDate: new Date("2023-04-20"), endDate: null, completed: false },
      { status: "Testing", startDate: null, endDate: null, completed: false },
      { status: "Deployment", startDate: null, endDate: null, completed: false },
      { status: "Completed", startDate: null, endDate: null, completed: false }
    ]
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/projects">Projects</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{demoProject.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">{demoProject.name}</h1>
          <Link href="/projects">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Projects
            </Button>
          </Link>
        </div>
        <p className="text-muted-foreground">{demoProject.description}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {demoProject.tags.map((tag, i) => (
          <Badge key={i} variant="secondary">{tag}</Badge>
        ))}
        <Badge variant="outline" className="ml-auto">Priority: {demoProject.priority}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center">
            <Badge className={getStatusColor(demoProject.currentStatus.code)}>
              {demoProject.currentStatus.label}
            </Badge>
            <span className="text-xs text-muted-foreground ml-2">
              since {new Date(demoProject.currentStatus.since).toLocaleDateString()}
            </span>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Health</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center">
            <Badge className={getHealthColor(demoProject.healthMetrics.overallHealth)}>
              {demoProject.healthMetrics.overallHealth}
            </Badge>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex flex-col">
              <span>Start: {demoProject.startDate.toLocaleDateString()}</span>
              <span>Est. Completion: {demoProject.estimatedCompletionDate.toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-1">
              <div className="flex justify-between text-xs">
                <span>Overall Completion</span>
                <span>{demoProject.progressPercentage}%</span>
              </div>
              <Progress value={demoProject.progressPercentage} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Required Alert */}
      {demoProject.requiredActions && demoProject.requiredActions.length > 0 && (
        <Card className="border-amber-500">
          <CardHeader className="pb-2 bg-amber-50">
            <CardTitle className="text-amber-800 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              Action Required
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              {demoProject.requiredActions.map((action) => (
                <div key={action.id} className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{action.title}</h4>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                    <div className="flex items-center mt-1">
                      <Badge variant="outline" className="mr-2">{action.type}</Badge>
                      <span className="text-xs text-muted-foreground">
                        Due: {new Date(action.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button size="sm">Take Action</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project Tabs */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4 pt-4">
          <h2 className="text-xl font-semibold">Project Details</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status Journey</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {demoProject.statusJourney.map((phase, i) => (
                    <div key={i} className="flex items-start space-x-3">
                      <div className={`mt-0.5 rounded-full p-1 ${phase.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                        {phase.completed ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">{phase.status}</span>
                        {phase.startDate && (
                          <span className="text-xs text-muted-foreground">
                            {phase.completed && phase.endDate
                              ? `${new Date(phase.startDate).toLocaleDateString()} - ${phase.endDate ? new Date(phase.endDate).toLocaleDateString() : 'Present'}`
                              : `Started: ${new Date(phase.startDate).toLocaleDateString()}`}
                          </span>
                        )}
                        {!phase.startDate && (
                          <span className="text-xs text-muted-foreground">Not started</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Health Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(demoProject.healthMetrics.factors).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <Badge 
                          className={getHealthColor(value.status)}
                          title={value.details}
                        >
                          {value.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Client Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-muted-foreground">Client</span>
                      <p>{demoProject.client.name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Primary Contact</span>
                      <p>{demoProject.client.primaryContact}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4 pt-4">
          <h2 className="text-xl font-semibold">Project Timeline</h2>
          <p className="text-muted-foreground">Detailed timeline and milestone information will be displayed here.</p>
          <div className="h-64 flex items-center justify-center border rounded-lg">
            <span className="text-muted-foreground">Timeline visualization goes here</span>
          </div>
        </TabsContent>
        
        {/* Communications Tab */}
        <TabsContent value="communication" className="space-y-4 pt-4">
          <h2 className="text-xl font-semibold">Communications</h2>
          <p className="text-muted-foreground">Project messages and updates will be displayed here.</p>
          <div className="h-64 flex items-center justify-center border rounded-lg">
            <span className="text-muted-foreground">Communications feed goes here</span>
          </div>
        </TabsContent>
        
        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4 pt-4">
          <h2 className="text-xl font-semibold">Project Documents</h2>
          <p className="text-muted-foreground">Project files and documentation will be displayed here.</p>
          <div className="h-64 flex items-center justify-center border rounded-lg">
            <span className="text-muted-foreground">Document repository goes here</span>
          </div>
        </TabsContent>
        
        {/* Team Tab */}
        <TabsContent value="team" className="space-y-4 pt-4">
          <h2 className="text-xl font-semibold">Project Team</h2>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Project Manager</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-foreground">
                  {demoProject.team.projectManager.name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium">{demoProject.team.projectManager.name}</p>
                  <p className="text-sm text-muted-foreground">{demoProject.team.projectManager.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <h3 className="text-lg font-medium mt-6">Team Members</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {demoProject.team.members.map((member) => (
              <Card key={member.id}>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-foreground">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}