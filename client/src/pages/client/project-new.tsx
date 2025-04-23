import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
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
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

// Project submission schema
const projectSchema = z.object({
  name: z.string().min(3, "Project name must be at least 3 characters"),
  description: z.string().min(20, "Please provide a more detailed description"),
  existingApp: z.boolean().default(false),
  applicationType: z.string().optional(),
  existingMaterialsLinks: z.string().optional(),
  idealCompletionDate: z.date().optional(),
  projectGoal: z.string().min(30, "Please provide a detailed project goal"),
  expectedBusinessImpact: z.string().min(30, "Please describe the expected business impact"),
  successCriteria: z.string().min(30, "Please define success criteria for this project"),
  budgetRange: z.string().optional(),
  budgetNotes: z.string().optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

export default function NewProjectPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      existingApp: false,
      applicationType: undefined,
      existingMaterialsLinks: "",
      idealCompletionDate: undefined,
      projectGoal: "",
      expectedBusinessImpact: "",
      successCriteria: "",
      budgetRange: "",
      budgetNotes: "",
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormData) => {
      const response = await apiRequest('POST', `/api/projects`, {
        ...data,
        clientId: user?.id,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create project');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate projects query to refresh the list
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${user?.id}/projects`] });
      
      // Show success toast
      toast({
        title: "Project Submitted Successfully",
        description: "Your project has been submitted for review.",
      });
      
      // Redirect to projects page
      navigate("/projects");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const nextStep = async () => {
    // Get fields for the current step
    const fieldsToValidate = getFieldsForStep(currentStep);
    
    // Validate only the fields in the current step
    const result = await form.trigger(fieldsToValidate as any);
    
    if (result) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
        window.scrollTo(0, 0);
      } else {
        // Submit form on the last step
        form.handleSubmit(onSubmit)();
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const onSubmit = (data: ProjectFormData) => {
    createProjectMutation.mutate(data);
  };

  // Get fields for validation based on the current step
  const getFieldsForStep = (step: number): (keyof ProjectFormData)[] => {
    switch (step) {
      case 1:
        return ["name", "description"];
      case 2:
        return ["existingApp", "applicationType", "existingMaterialsLinks"];
      case 3:
        return ["idealCompletionDate", "projectGoal", "expectedBusinessImpact", "successCriteria"];
      case 4:
        return ["budgetRange", "budgetNotes"];
      default:
        return [];
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Basic Project Information</h2>
              <p className="text-gray-500">Let's start with the basics of your project.</p>
            </div>
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter project name" {...field} />
                  </FormControl>
                  <FormDescription>
                    A concise name that describes your project.
                  </FormDescription>
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
                      placeholder="Describe your project in detail"
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a comprehensive overview of what you're looking to build.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Existing Application & Materials</h2>
              <p className="text-gray-500">Tell us about any existing applications or materials.</p>
            </div>
            
            <FormField
              control={form.control}
              name="existingApp"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Do you have an existing application?
                    </FormLabel>
                    <FormDescription>
                      Check this if you're looking to update or improve an existing app.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            {form.watch("existingApp") && (
              <FormField
                control={form.control}
                name="applicationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Application Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select application type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Web">Web Application</SelectItem>
                        <SelectItem value="Mobile">Mobile App</SelectItem>
                        <SelectItem value="Both">Both Web & Mobile</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the type of your existing application.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="existingMaterialsLinks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Links to Existing Materials</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Figma, Google Drive folder, staging environments, etc."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Provide links to any existing designs, documentation, or resources.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Project Goals & Timeline</h2>
              <p className="text-gray-500">Help us understand your objectives and timeframe.</p>
            </div>
            
            <FormField
              control={form.control}
              name="idealCompletionDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Ideal Completion Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={`w-full pl-3 text-left font-normal ${
                            !field.value && "text-muted-foreground"
                          }`}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date() || date > new Date(new Date().setFullYear(new Date().getFullYear() + 2))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    When would you like your project to be completed?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="projectGoal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Goal</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Example: The goal of our MVP build is to develop a software solution that streamlines business operations while significantly reducing manual processes in order to shorten the time needed to complete the operations."
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Describe the main objective of your project.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="expectedBusinessImpact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expected Business Impact</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Example: Implementing this Integrated Role would significantly enhance our technical capabilities, allowing us to accelerate product development by approximately 30%."
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    How will this project affect your business operations or metrics?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="successCriteria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Success Criteria</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Example: Successful engagement would be to build feature X, which allows users to do Y, which will increase revenue by Z."
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Define how success will be measured for this project.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold">Budget Information</h2>
              <p className="text-gray-500">Help us understand your budget constraints.</p>
            </div>
            
            <FormField
              control={form.control}
              name="budgetRange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget Range</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select budget range" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="< $10,000">Less than $10,000</SelectItem>
                      <SelectItem value="$10,000 - $25,000">$10,000 - $25,000</SelectItem>
                      <SelectItem value="$25,000 - $50,000">$25,000 - $50,000</SelectItem>
                      <SelectItem value="$50,000 - $100,000">$50,000 - $100,000</SelectItem>
                      <SelectItem value="> $100,000">More than $100,000</SelectItem>
                      <SelectItem value="Flexible">Flexible / To be determined</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the approximate budget range for your project.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="budgetNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Budget Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional information about your budget constraints or considerations"
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Include any additional budget constraints or considerations.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-medium text-gray-900">Ready to Submit?</h3>
              <p className="text-sm text-gray-600 mt-1">
                Please review all information before submitting. After submission, our team will review your project details and get back to you within 1-2 business days.
              </p>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header toggleMobileNav={() => setIsMobileNavOpen(!isMobileNavOpen)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <MobileNav isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />

        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="py-6">
            <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
              <div className="mb-8">
                <Button
                  variant="ghost"
                  onClick={() => navigate("/projects")}
                  className="mb-4"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back to Projects
                </Button>
                
                <h1 className="text-2xl font-bold text-gray-900">Submit New Project</h1>
                <p className="mt-1 text-gray-600">
                  Tell us about your project, and we'll help bring it to life.
                </p>
              </div>

              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  {Array.from({ length: totalSteps }).map((_, index) => (
                    <div
                      key={index}
                      className={`flex-1 h-2 rounded-full mx-1 ${
                        index + 1 <= currentStep ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Basic Info</span>
                  <span>Existing Materials</span>
                  <span>Goals & Timeline</span>
                  <span>Budget</span>
                </div>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <Form {...form}>
                    <form className="space-y-6">
                      {renderStepContent()}
                      
                      <div className="flex justify-between pt-4 border-t">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={prevStep}
                          disabled={currentStep === 1}
                        >
                          <ChevronLeft className="mr-2 h-4 w-4" />
                          Previous
                        </Button>
                        
                        <Button
                          type="button"
                          onClick={nextStep}
                          disabled={createProjectMutation.isPending}
                        >
                          {createProjectMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Submitting...
                            </>
                          ) : currentStep === totalSteps ? (
                            "Submit Project"
                          ) : (
                            <>
                              Next
                              <ChevronRight className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}