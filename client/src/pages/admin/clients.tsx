import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Client } from "@/lib/types";
import { formatDate, getStatusColor, getStatusText } from "@/lib/utils";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable, createSortableHeader } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Calendar, User, Building, Phone, Mail, Clock } from "lucide-react";

// Schema for new client form
const newClientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  companyName: z.string().min(1, "Company name is required"),
});

export default function AdminClients() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isAddClientDialogOpen, setIsAddClientDialogOpen] = useState(false);

  // Fetch clients
  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  // Form setup for new client
  const form = useForm<z.infer<typeof newClientSchema>>({
    resolver: zodResolver(newClientSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      companyName: "",
    },
  });

  // Mutation for creating a user and client
  const createClientMutation = useMutation({
    mutationFn: async (data: z.infer<typeof newClientSchema>) => {
      // In a real app, this would create a user first, then associate the client
      // For this demo, we'll simulate a successful creation
      const username = `${data.firstName.toLowerCase()}${data.lastName.toLowerCase()}`;
      
      // First create user
      const userResponse = await apiRequest("POST", "/api/register", {
        username,
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        password: "password123", // In a real app, would generate or ask for password
        phone: data.phone,
        role: "client",
        companyName: data.companyName,
      });
      
      return userResponse.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Client created",
        description: "New client has been successfully created",
      });
      setIsAddClientDialogOpen(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Failed to create client",
        description: `${error}`,
        variant: "destructive",
      });
    },
  });

  // Define table columns
  const columns: ColumnDef<Client>[] = [
    {
      accessorKey: "companyName",
      header: createSortableHeader("Company"),
      cell: ({ row }) => (
        <div className="font-medium text-blue-600">{row.getValue("companyName")}</div>
      ),
    },
    {
      accessorKey: "userInfo.name",
      header: createSortableHeader("Contact"),
      cell: ({ row }) => {
        const client = row.original;
        return (
          <div className="flex items-center">
            <User className="h-4 w-4 mr-2 text-gray-400" />
            <span>{client.userInfo?.name || "N/A"}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "userInfo.email",
      header: createSortableHeader("Email"),
      cell: ({ row }) => {
        const client = row.original;
        return client.userInfo?.email || "N/A";
      },
    },
    {
      accessorKey: "onboardingStatus",
      header: createSortableHeader("Status"),
      cell: ({ row }) => {
        const status = row.getValue("onboardingStatus") as string;
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
      accessorKey: "pipelineStage",
      header: createSortableHeader("Pipeline Stage"),
      cell: ({ row }) => {
        const stage = row.getValue("pipelineStage") as string;
        return getStatusText(stage);
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
  ];

  // Handle row click to navigate to client details
  const handleRowClick = (client: Client) => {
    navigate(`/admin/clients/${client.id}`);
  };

  // Handle form submission
  const onSubmit = (data: z.infer<typeof newClientSchema>) => {
    createClientMutation.mutate(data);
  };

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
                title="Clients"
                description="Manage your client relationships"
                action={{
                  label: "Add client",
                  onClick: () => setIsAddClientDialogOpen(true),
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
                    data={clients || []}
                    onRowClick={handleRowClick}
                  />
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Add Client Dialog */}
      <Dialog open={isAddClientDialogOpen} onOpenChange={setIsAddClientDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>
              Enter the client's information to create a new account.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (optional)</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="(123) 456-7890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Inc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddClientDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createClientMutation.isPending}
                >
                  {createClientMutation.isPending ? "Creating..." : "Create Client"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
