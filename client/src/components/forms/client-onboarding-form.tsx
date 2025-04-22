import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ClientOnboardingStatus } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Schema for basic info phase
const basicInfoSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(7, "Phone number is required"),
  companyName: z.string().min(2, "Company name is required"),
  isSignee: z.boolean(),
});

// Schema for project details phase
const projectDetailsSchema = z.object({
  projectGoal: z.string().min(10, "Project goal description is required"),
  businessImpact: z.string().min(10, "Business impact description is required"),
  successCriteria: z.string().min(10, "Success criteria is required"),
  budget: z.string().optional(),
  timeline: z.string().optional(),
  goLiveDate: z.string().optional(),
  references: z.string().optional(),
});

// Schema for company profile phase
const companyProfileSchema = z.object({
  legalEntityName: z.string().min(2, "Legal entity name is required"),
  legalBusinessAddress: z.string().min(5, "Legal business address is required"),
  signeeName: z.string().min(2, "Signee name is required"),
  signeeEmail: z.string().email("Invalid signee email address"),
  signeePhone: z.string().min(7, "Signee phone number is required"),
});

export function ClientOnboardingForm({ clientId }: { clientId: number }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPhase, setCurrentPhase] = useState<string>("basic_info");

  // Fetch onboarding status and existing data
  const { data: onboardingStatus, isLoading } = useQuery<ClientOnboardingStatus>({
    queryKey: [`/api/clients/${clientId}/onboarding-status`],
  });

  // Find current phase data if it exists
  const findPhaseData = (phase: string) => {
    if (!onboardingStatus?.phases) return null;
    return onboardingStatus.phases.find(p => p.phase === phase)?.data || null;
  };

  // Setup form for basic info
  const basicInfoForm = useForm<z.infer<typeof basicInfoSchema>>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      firstName: user?.name?.split(" ")[0] || "",
      lastName: user?.name?.split(" ").slice(1).join(" ") || "",
      email: user?.email || "",
      phone: user?.phone || "",
      companyName: "",
      isSignee: true,
    },
  });

  // Setup form for project details
  const projectDetailsForm = useForm<z.infer<typeof projectDetailsSchema>>({
    resolver: zodResolver(projectDetailsSchema),
    defaultValues: {
      projectGoal: "",
      businessImpact: "",
      successCriteria: "",
      budget: "",
      timeline: "",
      goLiveDate: "",
      references: "",
    },
  });

  // Setup form for company profile
  const companyProfileForm = useForm<z.infer<typeof companyProfileSchema>>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      legalEntityName: "",
      legalBusinessAddress: "",
      signeeName: user?.name || "",
      signeeEmail: user?.email || "",
      signeePhone: user?.phone || "",
    },
  });

  // Populate forms with existing data when it loads
  useEffect(() => {
    if (onboardingStatus?.phases) {
      // Set current phase based on completion status
      const basicInfoData = findPhaseData("basic_info");
      const projectDetailsData = findPhaseData("project_details");
      const companyProfileData = findPhaseData("company_profile");

      if (basicInfoData) {
        basicInfoForm.reset(basicInfoData as any);
        if (!projectDetailsData) {
          setCurrentPhase("project_details");
        }
      }

      if (projectDetailsData) {
        projectDetailsForm.reset(projectDetailsData as any);
        if (!companyProfileData) {
          setCurrentPhase("company_profile");
        }
      }

      if (companyProfileData) {
        companyProfileForm.reset(companyProfileData as any);
      }
    }
  }, [onboardingStatus]);

  // Save onboarding data mutation
  const saveDataMutation = useMutation({
    mutationFn: async ({
      phase,
      data,
    }: {
      phase: string;
      data: Record<string, any>;
    }) => {
      const response = await apiRequest("POST", `/api/clients/${clientId}/onboarding-data`, {
        phase,
        data,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}/onboarding-status`] });
      queryClient.invalidateQueries({ queryKey: [`/api/clients/${clientId}`] });
      toast({
        title: "Progress saved",
        description: "Your information has been saved successfully.",
      });

      // Advance to next phase
      if (currentPhase === "basic_info") {
        setCurrentPhase("project_details");
      } else if (currentPhase === "project_details") {
        setCurrentPhase("company_profile");
      }
    },
    onError: () => {
      toast({
        title: "Error saving data",
        description: "There was a problem saving your information. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle form submissions
  const handleBasicInfoSubmit = (data: z.infer<typeof basicInfoSchema>) => {
    saveDataMutation.mutate({ phase: "basic_info", data });
  };

  const handleProjectDetailsSubmit = (data: z.infer<typeof projectDetailsSchema>) => {
    saveDataMutation.mutate({ phase: "project_details", data });
  };

  const handleCompanyProfileSubmit = (data: z.infer<typeof companyProfileSchema>) => {
    saveDataMutation.mutate({ phase: "company_profile", data });
  };

  if (isLoading) {
    return <OnboardingFormSkeleton />;
  }

  // Prepare steps for progress indicator
  const steps = [
    {
      id: "basic_info",
      name: "Basic Info",
      status: findPhaseData("basic_info")
        ? "complete"
        : currentPhase === "basic_info"
        ? "current"
        : "upcoming",
    },
    {
      id: "project_details",
      name: "Project Details",
      status: findPhaseData("project_details")
        ? "complete"
        : currentPhase === "project_details"
        ? "current"
        : "upcoming",
    },
    {
      id: "company_profile",
      name: "Company Profile",
      status: findPhaseData("company_profile")
        ? "complete"
        : currentPhase === "company_profile"
        ? "current"
        : "upcoming",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="mt-6">
        <ProgressSteps steps={steps} />
      </div>

      {currentPhase === "basic_info" && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-1">Basic Information</h3>
            <p className="text-sm text-gray-500 mb-6">
              Let's start with some basic information about you and your company.
            </p>

            <Form {...basicInfoForm}>
              <form onSubmit={basicInfoForm.handleSubmit(handleBasicInfoSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <FormField
                      control={basicInfoForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <FormField
                      control={basicInfoForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <FormField
                      control={basicInfoForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Work email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <FormField
                      control={basicInfoForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone number</FormLabel>
                          <FormControl>
                            <Input type="tel" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <FormField
                      control={basicInfoForm.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="sm:col-span-6">
                    <FormField
                      control={basicInfoForm.control}
                      name="isSignee"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              I am authorized to sign contracts and make decisions on behalf of my company
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="pt-5 flex justify-end space-x-3">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      basicInfoForm.reset();
                      toast({
                        title: "Form cleared",
                        description: "All form fields have been reset",
                      });
                    }}
                  >
                    Reset
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={saveDataMutation.isPending}
                  >
                    {saveDataMutation.isPending ? "Saving..." : "Next Step"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {currentPhase === "project_details" && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-1">Project Details</h3>
            <p className="text-sm text-gray-500 mb-6">
              Help us understand your project goals and requirements.
            </p>

            <Form {...projectDetailsForm}>
              <form onSubmit={projectDetailsForm.handleSubmit(handleProjectDetailsSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-6">
                    <FormField
                      control={projectDetailsForm.control}
                      name="projectGoal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Project Goal</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe the main goal of your project"
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="sm:col-span-6">
                    <FormField
                      control={projectDetailsForm.control}
                      name="businessImpact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expected Business Impact</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="How will this project impact your business?"
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="sm:col-span-6">
                    <FormField
                      control={projectDetailsForm.control}
                      name="successCriteria"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Success Criteria</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="How will we measure the success of this project?"
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <FormField
                      control={projectDetailsForm.control}
                      name="budget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Budget Range</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select budget range" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="under_5k">Under $5,000</SelectItem>
                                <SelectItem value="5k_15k">$5,000 - $15,000</SelectItem>
                                <SelectItem value="15k_30k">$15,000 - $30,000</SelectItem>
                                <SelectItem value="30k_50k">$30,000 - $50,000</SelectItem>
                                <SelectItem value="50k_100k">$50,000 - $100,000</SelectItem>
                                <SelectItem value="over_100k">Over $100,000</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormDescription>
                            This helps us understand your investment level
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <FormField
                      control={projectDetailsForm.control}
                      name="timeline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ideal Timeline</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select timeline" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="under_1m">Less than 1 month</SelectItem>
                                <SelectItem value="1_3m">1-3 months</SelectItem>
                                <SelectItem value="3_6m">3-6 months</SelectItem>
                                <SelectItem value="6_12m">6-12 months</SelectItem>
                                <SelectItem value="over_12m">Over 12 months</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormDescription>
                            How quickly do you need this completed?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <FormField
                      control={projectDetailsForm.control}
                      name="goLiveDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ideal Go-Live Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="sm:col-span-6">
                    <FormField
                      control={projectDetailsForm.control}
                      name="references"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>References or Examples</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Any websites, products, or designs that inspire you?"
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Share links to examples or inspiration
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="pt-5 flex justify-end space-x-3">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setCurrentPhase("basic_info")}
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={saveDataMutation.isPending}
                  >
                    {saveDataMutation.isPending ? "Saving..." : "Next Step"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {currentPhase === "company_profile" && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-1">Company Profile</h3>
            <p className="text-sm text-gray-500 mb-6">
              Please provide legal information about your company for our records.
            </p>

            <Form {...companyProfileForm}>
              <form onSubmit={companyProfileForm.handleSubmit(handleCompanyProfileSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-6">
                    <FormField
                      control={companyProfileForm.control}
                      name="legalEntityName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Legal Entity Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormDescription>
                            The official registered name of your company
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="sm:col-span-6">
                    <FormField
                      control={companyProfileForm.control}
                      name="legalBusinessAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Legal Business Address</FormLabel>
                          <FormControl>
                            <Textarea
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="sm:col-span-6">
                    <h4 className="font-medium text-gray-700 mb-2">Contract Signee Information</h4>
                    <p className="text-sm text-gray-500 mb-4">
                      Please provide information about the person authorized to sign contracts.
                    </p>
                  </div>

                  <div className="sm:col-span-6">
                    <FormField
                      control={companyProfileForm.control}
                      name="signeeName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Signee Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <FormField
                      control={companyProfileForm.control}
                      name="signeeEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Signee Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <FormField
                      control={companyProfileForm.control}
                      name="signeePhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Signee Phone</FormLabel>
                          <FormControl>
                            <Input type="tel" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="pt-5 flex justify-end space-x-3">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setCurrentPhase("project_details")}
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={saveDataMutation.isPending}
                  >
                    {saveDataMutation.isPending ? "Saving..." : "Complete Onboarding"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {onboardingStatus?.status === "completed" && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4 mt-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Onboarding Complete</h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Thank you for completing the onboarding process. Our team will review your information and be in touch shortly.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OnboardingFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="mt-6">
        <Skeleton className="h-10 w-full" />
      </div>
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-96 mb-6" />
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
              
              <div className="sm:col-span-3">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
              
              <div className="sm:col-span-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
              
              <div className="sm:col-span-3">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
              
              <div className="sm:col-span-3">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
            
            <div className="pt-5 flex justify-end space-x-3">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
