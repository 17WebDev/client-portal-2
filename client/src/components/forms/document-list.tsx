import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Document } from "@/lib/types";
import { formatDate, getStatusColor, getStatusText } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Calendar,
  Clock,
  Download,
  Eye,
  CheckCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface DocumentListProps {
  clientId?: number;
  projectId?: number;
}

export function DocumentList({ clientId, projectId }: DocumentListProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("contracts");
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);

  // Construct the query endpoint based on whether we're listing documents for a client or project
  const endpoint = projectId
    ? `/api/projects/${projectId}/documents`
    : clientId
    ? `/api/documents?clientId=${clientId}`
    : "/api/documents";

  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: [endpoint],
  });

  const handleDownload = (document: Document) => {
    // In a real application, this would download the actual file
    // For this example, we'll just show a toast
    toast({
      title: "Download started",
      description: `Downloading ${document.name}...`,
    });
    window.open(document.url, "_blank");
  };

  const handleViewDocument = (document: Document) => {
    setViewingDocument(document);
  };

  const filterDocumentsByType = (type: string) => {
    if (!documents) return [];
    return documents.filter((doc) => doc.type === type);
  };

  if (isLoading) {
    return <DocumentListSkeleton />;
  }

  if (!documents || documents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>
            View and manage all your project documents, contracts, and invoices.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No documents yet
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Documents related to your projects will appear here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group documents by type for the tabs
  const contracts = filterDocumentsByType("contract");
  const invoices = filterDocumentsByType("invoice");
  const deliverables = filterDocumentsByType("deliverable");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documents</CardTitle>
        <CardDescription>
          View and manage all your project documents, contracts, and invoices.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="contracts" value={activeTab} onValueChange={setActiveTab}>
          <div className="px-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="contracts" className="text-sm">
                Contracts{" "}
                {contracts.length > 0 && (
                  <Badge variant="outline" className="ml-2">
                    {contracts.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="invoices" className="text-sm">
                Invoices{" "}
                {invoices.length > 0 && (
                  <Badge variant="outline" className="ml-2">
                    {invoices.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="deliverables" className="text-sm">
                Deliverables{" "}
                {deliverables.length > 0 && (
                  <Badge variant="outline" className="ml-2">
                    {deliverables.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="contracts">
            <DocumentListContent
              documents={contracts}
              onDownload={handleDownload}
              onView={handleViewDocument}
            />
          </TabsContent>

          <TabsContent value="invoices">
            <DocumentListContent
              documents={invoices}
              onDownload={handleDownload}
              onView={handleViewDocument}
            />
          </TabsContent>

          <TabsContent value="deliverables">
            <DocumentListContent
              documents={deliverables}
              onDownload={handleDownload}
              onView={handleViewDocument}
            />
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Document Preview Dialog */}
      <Dialog open={!!viewingDocument} onOpenChange={(open) => !open && setViewingDocument(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{viewingDocument?.name}</DialogTitle>
            <DialogDescription>
              {viewingDocument?.type.charAt(0).toUpperCase() + viewingDocument?.type.slice(1)} - {formatDate(viewingDocument?.createdAt || "")}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 border rounded-md p-4 h-96 flex items-center justify-center">
            <div className="text-center">
              <FileText className="mx-auto h-16 w-16 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">
                Document preview would appear here. For this demo, please download the document to view it.
              </p>
              <Button
                className="mt-4"
                onClick={() => viewingDocument && handleDownload(viewingDocument)}
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

interface DocumentListContentProps {
  documents: Document[];
  onDownload: (document: Document) => void;
  onView: (document: Document) => void;
}

function DocumentListContent({
  documents,
  onDownload,
  onView,
}: DocumentListContentProps) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-10">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          No documents in this category
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Documents will appear here when they become available.
        </p>
      </div>
    );
  }

  return (
    <ul role="list" className="divide-y divide-gray-200">
      {documents.map((document) => (
        <li key={document.id}>
          <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="flex-shrink-0 h-5 w-5 text-gray-400" />
                <p className="ml-3 text-sm font-medium text-blue-600 truncate">
                  {document.name}
                </p>
              </div>
              <div className="ml-2 flex-shrink-0 flex">
                <Badge
                  variant="outline"
                  className={`bg-${getStatusColor(document.status)}-100 text-${getStatusColor(document.status)}-800 border-${getStatusColor(document.status)}-200`}
                >
                  {getStatusText(document.status)}
                </Badge>
              </div>
            </div>
            <div className="mt-2 sm:flex sm:justify-between">
              <div className="sm:flex">
                <p className="flex items-center text-sm text-gray-500">
                  <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                  <span>
                    {document.status === "signed" || document.status === "paid"
                      ? `${getStatusText(document.status)} on ${formatDate(document.updatedAt)}`
                      : `Created on ${formatDate(document.createdAt)}`}
                  </span>
                </p>
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 space-x-4">
                {document.status === "sent" && document.type === "contract" && (
                  <button
                    onClick={() => {
                      // In a real app, this would open a signing process
                      // For this demo, we'll just show a toast
                      alert("Signing functionality would be integrated here");
                    }}
                    className="flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <CheckCircle className="flex-shrink-0 mr-1.5 h-4 w-4" />
                    <span>Sign</span>
                  </button>
                )}
                <button
                  onClick={() => onView(document)}
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  <Eye className="flex-shrink-0 mr-1.5 h-4 w-4" />
                  <span>View</span>
                </button>
                <button
                  onClick={() => onDownload(document)}
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  <Download className="flex-shrink-0 mr-1.5 h-4 w-4" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function DocumentListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-4 w-80" />
      </CardHeader>
      <CardContent className="p-0">
        <div className="px-4 py-4">
          <Skeleton className="h-10 w-full mb-6" />
          <ul role="list" className="divide-y divide-gray-200">
            {[1, 2, 3].map((i) => (
              <li key={i} className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Skeleton className="h-5 w-5 mr-3" />
                    <Skeleton className="h-5 w-56" />
                  </div>
                  <Skeleton className="h-5 w-24" />
                </div>
                <div className="mt-2 flex justify-between">
                  <Skeleton className="h-4 w-40" />
                  <div className="flex space-x-4">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
