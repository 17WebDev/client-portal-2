import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRandomColor } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { PipelineStageData, ProjectAnalytics } from "@/lib/types";

export default function AdminAnalytics() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pipeline");

  // Fetch pipeline analytics
  const { data: pipelineData, isLoading: isPipelineLoading } = useQuery<PipelineStageData[]>({
    queryKey: ["/api/analytics/pipeline"],
  });

  // Fetch project analytics
  const { data: projectAnalytics, isLoading: isProjectAnalyticsLoading } = useQuery<ProjectAnalytics>({
    queryKey: ["/api/analytics/projects"],
  });

  const isLoading = isPipelineLoading || isProjectAnalyticsLoading;

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
                title="Analytics"
                description="Visualize and analyze your business metrics"
              />

              <div className="mt-6">
                <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3 mb-8">
                    <TabsTrigger value="pipeline">Pipeline Analytics</TabsTrigger>
                    <TabsTrigger value="projects">Project Analytics</TabsTrigger>
                    <TabsTrigger value="financial">Financial Metrics</TabsTrigger>
                  </TabsList>

                  <TabsContent value="pipeline" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {isLoading ? (
                        <>
                          <Skeleton className="h-80 w-full" />
                          <Skeleton className="h-80 w-full" />
                        </>
                      ) : (
                        <>
                          {/* Pipeline Stage Distribution */}
                          <Card>
                            <CardHeader>
                              <CardTitle>Pipeline Stage Distribution</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={pipelineData}
                                      dataKey="count"
                                      nameKey="stage"
                                      cx="50%"
                                      cy="50%"
                                      outerRadius={80}
                                      label={({ name, percent }) => 
                                        `${name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} (${(percent * 100).toFixed(0)}%)`
                                      }
                                    >
                                      {pipelineData?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getRandomColor(index)} />
                                      ))}
                                    </Pie>
                                    <Tooltip />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Pipeline Conversion Rates */}
                          <Card>
                            <CardHeader>
                              <CardTitle>Pipeline Conversion Rates</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart
                                    data={pipelineData?.map(stage => ({
                                      name: stage.stage.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
                                      count: stage.count,
                                    }))}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="count" fill="#3b82f6" />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </CardContent>
                          </Card>
                        </>
                      )}
                    </div>

                    {/* Pipeline Trends Over Time */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Pipeline Trends Over Time</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isLoading ? (
                          <Skeleton className="h-64 w-full" />
                        ) : (
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={[
                                  { month: 'Jan', leads: 12, conversions: 5 },
                                  { month: 'Feb', leads: 19, conversions: 7 },
                                  { month: 'Mar', leads: 15, conversions: 6 },
                                  { month: 'Apr', leads: 22, conversions: 9 },
                                  { month: 'May', leads: 28, conversions: 12 },
                                  { month: 'Jun', leads: 24, conversions: 10 },
                                ]}
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="leads" stroke="#8884d8" />
                                <Line type="monotone" dataKey="conversions" stroke="#82ca9d" />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="projects" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {isLoading ? (
                        <>
                          <Skeleton className="h-80 w-full" />
                          <Skeleton className="h-80 w-full" />
                        </>
                      ) : (
                        <>
                          {/* Project Status Distribution */}
                          <Card>
                            <CardHeader>
                              <CardTitle>Project Status Distribution</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={[
                                        { name: 'Completed', value: projectAnalytics?.projectsByStatus.completed },
                                        { name: 'In Progress', value: projectAnalytics?.projectsByStatus.inProgress },
                                        { name: 'Planning', value: projectAnalytics?.projectsByStatus.planning },
                                        { name: 'On Hold', value: projectAnalytics?.projectsByStatus.onHold },
                                      ]}
                                      dataKey="value"
                                      nameKey="name"
                                      cx="50%"
                                      cy="50%"
                                      outerRadius={80}
                                      label={({ name, percent }) => 
                                        `${name} (${(percent * 100).toFixed(0)}%)`
                                      }
                                    >
                                      <Cell fill="#10b981" />
                                      <Cell fill="#f59e0b" />
                                      <Cell fill="#3b82f6" />
                                      <Cell fill="#6b7280" />
                                    </Pie>
                                    <Tooltip />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Project Completion Metrics */}
                          <Card>
                            <CardHeader>
                              <CardTitle>Project Completion Metrics</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart
                                    data={[
                                      { name: 'Completion Rate', value: Math.round(projectAnalytics?.completionRate || 0) },
                                      { name: 'Avg Days to Complete', value: projectAnalytics?.avgCompletionDays || 0 },
                                      { name: 'On-Time Delivery', value: 85 }, // This would come from the API in a real app
                                    ]}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="value" fill="#8884d8" />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </CardContent>
                          </Card>
                        </>
                      )}
                    </div>

                    {/* Project Timeline */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Project Timeline Efficiency</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isLoading ? (
                          <Skeleton className="h-64 w-full" />
                        ) : (
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={[
                                  { month: 'Jan', estimated: 45, actual: 48 },
                                  { month: 'Feb', estimated: 60, actual: 58 },
                                  { month: 'Mar', estimated: 30, actual: 35 },
                                  { month: 'Apr', estimated: 55, actual: 52 },
                                  { month: 'May', estimated: 70, actual: 68 },
                                  { month: 'Jun', estimated: 40, actual: 42 },
                                ]}
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="estimated" stroke="#8884d8" />
                                <Line type="monotone" dataKey="actual" stroke="#82ca9d" />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="financial" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {isLoading ? (
                        <>
                          <Skeleton className="h-80 w-full" />
                          <Skeleton className="h-80 w-full" />
                        </>
                      ) : (
                        <>
                          {/* Revenue by Project Type */}
                          <Card>
                            <CardHeader>
                              <CardTitle>Revenue by Project Type</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={[
                                        { name: 'Web Development', value: 125000 },
                                        { name: 'Mobile Apps', value: 87000 },
                                        { name: 'UI/UX Design', value: 65000 },
                                        { name: 'Consulting', value: 42000 },
                                      ]}
                                      dataKey="value"
                                      nameKey="name"
                                      cx="50%"
                                      cy="50%"
                                      outerRadius={80}
                                      label={({ name, percent }) => 
                                        `${name} (${(percent * 100).toFixed(0)}%)`
                                      }
                                    >
                                      <Cell fill="#3b82f6" />
                                      <Cell fill="#10b981" />
                                      <Cell fill="#f59e0b" />
                                      <Cell fill="#6366f1" />
                                    </Pie>
                                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                            </CardContent>
                          </Card>

                          {/* Average Contract Value Over Time */}
                          <Card>
                            <CardHeader>
                              <CardTitle>Average Contract Value</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart
                                    data={[
                                      { quarter: 'Q1 2023', value: 18500 },
                                      { quarter: 'Q2 2023', value: 22000 },
                                      { quarter: 'Q3 2023', value: 24500 },
                                      { quarter: 'Q4 2023', value: 27800 },
                                      { quarter: 'Q1 2024', value: 29500 },
                                    ]}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                  >
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="quarter" />
                                    <YAxis />
                                    <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                                    <Bar dataKey="value" fill="#3b82f6" />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </CardContent>
                          </Card>
                        </>
                      )}
                    </div>

                    {/* Monthly Revenue Trends */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Monthly Revenue Trends</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {isLoading ? (
                          <Skeleton className="h-64 w-full" />
                        ) : (
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart
                                data={[
                                  { month: 'Jan', revenue: 35000, expenses: 22000, profit: 13000 },
                                  { month: 'Feb', revenue: 42000, expenses: 24000, profit: 18000 },
                                  { month: 'Mar', revenue: 38000, expenses: 20000, profit: 18000 },
                                  { month: 'Apr', revenue: 55000, expenses: 28000, profit: 27000 },
                                  { month: 'May', revenue: 62000, expenses: 30000, profit: 32000 },
                                  { month: 'Jun', revenue: 58000, expenses: 29000, profit: 29000 },
                                ]}
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis />
                                <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                                <Legend />
                                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" />
                                <Line type="monotone" dataKey="expenses" stroke="#ef4444" />
                                <Line type="monotone" dataKey="profit" stroke="#10b981" />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// This would be available in recharts, adding it here for completeness
function Cell({ fill, ...props }: any) {
  return <div {...props} style={{ fill }} />;
}
