import { useState } from "react";
import { Link } from "wouter";
import { Loader2, Grid, List, Filter, SortDesc, Search, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// View types
type ViewType = "grid" | "list";

// Filter states 
type Filters = {
  status: string | null;
  priority: string | null;
  dateRange: {
    start: string | null;
    end: string | null;
  };
  search: string;
};

// Sort options
type SortOption = "recent" | "alphabetical" | "status" | "deadline";

export default function ProjectsPage() {
  const { user } = useAuth();
  const [viewType, setViewType] = useState<ViewType>("grid");
  const [filters, setFilters] = useState<Filters>({
    status: null,
    priority: null,
    dateRange: {
      start: null,
      end: null,
    },
    search: "",
  });
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Fetch client projects
  const clientId = user?.id; // Use the user's id to get their client information
  
  // Define Project type based on what we expect to receive
  type Project = {
    id: number;
    name: string;
    description: string;
    status: string;
    progressPercentage: number;
    startDate?: Date;
    estimatedCompletionDate?: Date;
    actualCompletionDate?: Date;
    requiresAttention?: boolean;
    // Add other fields as needed
  };

  // Define client type
  type Client = {
    id: number;
    userId: number;
    companyName: string;
    // Other client fields
  };

  const { data: client = null as Client | null } = useQuery<Client>({
    queryKey: ["/api/clients", clientId],
    enabled: !!clientId,
  });
  
  const { data: projects = [] as Project[], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/clients", client?.id, "projects"],
    enabled: !!client?.id,
  });

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters((prev) => ({
      ...prev,
      search: e.target.value,
    }));
  };

  // Handle status filter change
  const handleStatusChange = (value: string) => {
    setFilters((prev) => ({
      ...prev,
      status: value === "all" ? null : value,
    }));
  };

  // Handle sort change
  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
  };

  // Toggle view type
  const toggleViewType = () => {
    setViewType((prev) => (prev === "grid" ? "list" : "grid"));
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header toggleMobileNav={() => setIsMobileNavOpen(!isMobileNavOpen)} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <div className="flex items-center justify-center h-96 flex-1">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header toggleMobileNav={() => setIsMobileNavOpen(!isMobileNavOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <MobileNav isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-6">
            <div className="flex flex-col space-y-6">
              <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
                <div className="flex gap-3">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Link href="/client/projects/new">
                      <span className="flex items-center">
                        <Plus size={18} className="mr-2" />
                        Start a Project
                      </span>
                    </Link>
                  </Button>
                  <Button variant="outline" onClick={toggleViewType}>
                    {viewType === "grid" ? <List size={18} /> : <Grid size={18} />}
                    <span className="ml-2">{viewType === "grid" ? "List View" : "Grid View"}</span>
                  </Button>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Projects</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{projects?.length || 0}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {projects?.filter(p => p.status === "in_progress")?.length || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {projects?.filter(p => p.status === "completed")?.length || 0}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Attention Required</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-amber-500">
                      {projects?.filter(p => p.requiresAttention)?.length || 0}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters and Search */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative w-full md:w-2/3">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search projects..."
                    className="pl-8 w-full"
                    value={filters.search}
                    onChange={handleSearchChange}
                  />
                </div>
                <div className="flex gap-2">
                  <Select onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select onValueChange={handleSortChange as (value: string) => void}>
                    <SelectTrigger className="w-[180px]">
                      <SortDesc className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Sort By" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Most Recent</SelectItem>
                      <SelectItem value="alphabetical">Alphabetical</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                      <SelectItem value="deadline">Deadline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* No Projects State */}
              {(!projects || projects.length === 0) && (
                <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-background">
                  <div className="text-center">
                    <h3 className="text-lg font-medium">No projects found</h3>
                    <p className="text-muted-foreground mt-1">
                      There are no projects available or matching your filters.
                    </p>
                  </div>
                </div>
              )}

              {/* Projects Grid/List View */}
              {projects && projects.length > 0 && (
                <div className={viewType === "grid" 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                  : "flex flex-col space-y-4"}>
                  
                  {/* Placeholder Project Card - we'll replace these with real data when available */}
                  <Card className={viewType === "list" ? "flex flex-row" : ""}>
                    <div className={viewType === "list" ? "flex-1" : ""}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>Website Redesign</CardTitle>
                            <CardDescription>Corporate website overhaul</CardDescription>
                          </div>
                          <Badge className="bg-amber-500">In Progress</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>65%</span>
                            </div>
                            <Progress value={65} className="h-2" />
                          </div>
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <div>Started: Apr 5, 2023</div>
                            <div>Due: Jun 30, 2023</div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between pt-0">
                        <Badge variant="outline" className="text-amber-500 border-amber-500">
                          Needs Review
                        </Badge>
                        <Link href="/client/projects/1">
                          <Button variant="outline" size="sm">View Details</Button>
                        </Link>
                      </CardFooter>
                    </div>
                  </Card>

                  {/* Second placeholder project */}
                  <Card className={viewType === "list" ? "flex flex-row" : ""}>
                    <div className={viewType === "list" ? "flex-1" : ""}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>Mobile App Development</CardTitle>
                            <CardDescription>iOS and Android TASKR app</CardDescription>
                          </div>
                          <Badge className="bg-blue-500">Planning</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>15%</span>
                            </div>
                            <Progress value={15} className="h-2" />
                          </div>
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <div>Started: Apr 15, 2023</div>
                            <div>Due: Aug 30, 2023</div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between pt-0">
                        <Badge variant="outline" className="text-blue-500 border-blue-500">
                          Awaiting Approval
                        </Badge>
                        <Link href="/client/projects/2">
                          <Button variant="outline" size="sm">View Details</Button>
                        </Link>
                      </CardFooter>
                    </div>
                  </Card>
                  
                  {/* Third placeholder project */}
                  <Card className={viewType === "list" ? "flex flex-row" : ""}>
                    <div className={viewType === "list" ? "flex-1" : ""}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>CRM Integration</CardTitle>
                            <CardDescription>Connect existing systems with TASKR</CardDescription>
                          </div>
                          <Badge className="bg-green-500">Completed</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>100%</span>
                            </div>
                            <Progress value={100} className="h-2" />
                          </div>
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <div>Started: Feb 10, 2023</div>
                            <div>Completed: Mar 25, 2023</div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between pt-0">
                        <Badge variant="outline" className="text-green-500 border-green-500">
                          Delivered
                        </Badge>
                        <Link href="/client/projects/3">
                          <Button variant="outline" size="sm">View Details</Button>
                        </Link>
                      </CardFooter>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}