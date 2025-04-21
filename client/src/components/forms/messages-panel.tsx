import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Communication } from "@/lib/types";
import { formatRelativeTime, getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface MessagesPanelProps {
  projectId: number;
}

export function MessagesPanel({ projectId }: MessagesPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("");
  
  // Query for fetching messages
  const { data: communications, isLoading } = useQuery<Communication[]>({
    queryKey: [`/api/projects/${projectId}/communications`],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Mutation for sending a message
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      // Find recipient ID (someone who is not current user, usually the project manager)
      let recipientId = 1; // Default admin ID
      if (communications && communications.length > 0) {
        const otherParty = communications.find(c => c.senderId !== user?.id);
        if (otherParty) {
          recipientId = otherParty.senderId;
        }
      }
      
      const response = await apiRequest("POST", "/api/communications", {
        projectId,
        recipientId,
        message: messageText,
        type: "update" // Default type
      });
      return response.json();
    },
    onSuccess: () => {
      // Clear the message input
      setMessage("");
      // Invalidate the query to refresh messages
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/communications`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: `${error}`,
        variant: "destructive",
      });
    }
  });

  // Scroll to bottom of messages when new ones arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [communications]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessageMutation.mutate(message);
    }
  };

  if (isLoading) {
    return <MessagesPanelSkeleton />;
  }

  const sortedCommunications = communications 
    ? [...communications].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    : [];

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="p-0 flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {sortedCommunications.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 text-gray-400 mx-auto"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No messages yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Start the conversation with your project team.
                </p>
              </div>
            </div>
          ) : (
            sortedCommunications.map((comm) => (
              <MessageBubble
                key={comm.id}
                message={comm}
                isCurrentUser={comm.senderId === user?.id}
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-200 p-4">
          <form onSubmit={handleSendMessage} className="flex flex-col space-y-3">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="resize-none"
              rows={3}
            />
            <div className="flex justify-between items-center">
              <div>
                <Button type="button" variant="outline" size="sm">
                  <Paperclip className="h-4 w-4 mr-2" />
                  Attach
                </Button>
              </div>
              <Button 
                type="submit" 
                disabled={!message.trim() || sendMessageMutation.isPending}
              >
                {sendMessageMutation.isPending ? "Sending..." : (
                  <>
                    Send
                    <Send className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

interface MessageBubbleProps {
  message: Communication;
  isCurrentUser: boolean;
}

function MessageBubble({ message, isCurrentUser }: MessageBubbleProps) {
  return (
    <div className={`flex ${isCurrentUser ? "justify-end" : ""}`}>
      {!isCurrentUser && (
        <div className="flex-shrink-0 mr-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback>
              {getInitials(message.sender?.name || "")}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
      <div className={`flex flex-col ${isCurrentUser ? "items-end" : ""}`}>
        <div className={`px-4 py-2 rounded-lg max-w-xs sm:max-w-md ${
          isCurrentUser ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
        }`}>
          <p className="text-sm">{message.message}</p>
        </div>
        <span className="text-xs text-gray-500 leading-none mt-1">
          {message.sender?.name} • {formatRelativeTime(message.createdAt)}
        </span>
      </div>
      {isCurrentUser && (
        <div className="flex-shrink-0 ml-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback>
              {getInitials(message.sender?.name || "")}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
    </div>
  );
}

function MessagesPanelSkeleton() {
  return (
    <Card className="h-full flex flex-col">
      <CardContent className="p-0 flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : ""}`}>
              {i % 2 !== 0 && <Skeleton className="h-10 w-10 rounded-full mr-3" />}
              <div>
                <Skeleton className={`h-20 w-64 rounded-lg ${i % 2 === 0 ? "ml-auto" : ""}`} />
                <Skeleton className={`h-4 w-40 mt-1 ${i % 2 === 0 ? "ml-auto" : ""}`} />
              </div>
              {i % 2 === 0 && <Skeleton className="h-10 w-10 rounded-full ml-3" />}
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 p-4">
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <div className="flex justify-between">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
