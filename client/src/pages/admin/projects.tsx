import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Project, Client } from "@/lib/types";
import { formatDate, getStatusColor, getStatusText } from "@/lib/utils";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, createSortableHeader } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ColumnDef } from "@tanstack/react-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Calendar, Clock, Building } from "lucide-react";

// Schema for new project form
const newProjectSchema = z.object({
  name: z.string().min(3, "Project name is required"),
  clientId: z.string().min(1, "Client is required"),
  description: z.string().min(10, "Description is required"),
  goal: z.string().optional(),
  budget: z.string().optional(),
  timeline: z.string().optional(),
  goLiveDate: z.string().optional(),
  status: z.string().default("planning"),
});

export default function AdminProjects() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);

  // Fetch projects
  const { data: projects, isLoading: isProjectsLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
  });

  // Fetch clients for the dropdown
  const { data: clients, isLoading: isClientsLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  // Form setup for new project
  const form = useForm<z.infer<typeof newProjectSchema>>({
    resolver: zodResolver(newProjectSchema),
    defaultValues: {
      name: "",
      clientId: "",
      description: "",
      goal: "",
      budget: "",
      timeline: "",
      goLiveDate: "",
      status: "planning",
    },
  });

  // Mutation for creating a project
  const createProjectMutation = useMutation({
    mutationFn: async (data: z.infer<typeof newProjectSchema>) => {
      const response = await apiRequest("POST", "/api/projects", {
        ...data,
        clientId: parseInt(data.clientId),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project created",
        description: "New project has been successfully created",
      });
      setIsAddProjectDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to create project",
        description: `${error}`,
        variant: "destructive",
      });
    },
  });

  // Define table columns
  const columns: ColumnDef<Project>[] = [
    {
      accessorKey: "name",
      header: createSortableHeader("Project Name"),
      cell: ({ row }) => (
        <div className="font-medium text-blue-600">{row.getValue("name")}</div>
      ),
    },
    {
      accessorKey: "clientId",
      header: createSortableHeader("Client"),
      cell: ({ row }) => {
        const clientId = row.getValue("clientId") as number;
        const client = clients?.find(c => c.id === clientId);
        return (
          <div className="flex items-center">
            <Building className="h-4 w-4 mr-2 text-gray-400" />
            <span>{client?.companyName || "Unknown Client"}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: createSortableHeader("Status"),
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge 
            variant="outline" 
            className={`bg-${getStatusColor(status)}-100 text-${getStatusColor(status)}-800 border-${getStatusColor(status)}-200`}
          >
            {getStatusText(status)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "progressPercentage",
      header: createSortableHeader("Progress"),
      cell: ({ row }) => {
        const progress = row.getValue("progressPercentage") as number;
        return (
          <div className="w-full max-w-md">
            <div className="flex justify-between mb-1 text-xs">
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: createSortableHeader("Created"),
      cell: ({ row }) => {
        const date = row.getValue("createdAt") as string;
        return (
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
            <span>{formatDate(date)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "goLiveDate",
      header: createSortableHeader("Target Date"),
      cell: ({ row }) => {
        const date = row.getValue("goLiveDate") as string;
        return date ? (
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-gray-400" />
            <span>{formatDate(date)}</span>
          </div>
        ) : (
          <span className="text-gray-400">Not set</span>
        );
      },
    },
  ];

  // Handle row click to navigate to project details
  const handleRowClick = (project: Project) => {
    navigate(`/admin/projects/${project.id}`);
  };

  // Handle form submission
  const onSubmit = (data: z.infer<typeof newProjectSchema>) => {
    createProjectMutation.mutate(data);
  };

  const isLoading = isProjectsLoading || isClientsLoading;

  return (
    <div className="min-h-screen flex flex-col">
      <Header toggleMobileNav={() => setIsMobileNavOpen(!isMobileNavOpen)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <MobileNav isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />

        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="py-6">
            <div className="px-4 sm:px-6 lg:px-8">
              <PageHeader
                title="Projects"
                description="Manage your client projects"
                action={{
                  label: "Add project",
                  onClick: () => setIsAddProjectDialogOpen(true),
                }}
              />

              <div className="mt-6 bg-white rounded-md shadow">
                {isLoading ? (
                  <div className="p-4">
                    <Skeleton className="h-64 w-full" />
                  </div>
                ) : (
                  <DataTable
                    columns={columns}
                    data={projects || []}
                    onRowClick={handleRowClick}
                  />
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Add Project Dialog */}
      <Dialog open={isAddProjectDialogOpen} onOpenChange={setIsAddProjectDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Enter the project details to create a new project record.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Website Redesign" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients?.map((client) => (
                          <SelectItem key={client.id} value={client.id.toString()}>
                            {client.companyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe the project scope and objectives"
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="budget"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget</FormLabel>
                      <FormControl>
                        <Input placeholder="$10,000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timeline"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timeline</FormLabel>
                      <FormControl>
                        <Input placeholder="3 months" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="goLiveDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Go-Live Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="planning">Planning</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="on_hold">On Hold</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="goal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Goal</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="The main objective of this project"
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddProjectDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createProjectMutation.isPending}
                >
                  {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
