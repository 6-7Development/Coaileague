import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Mail, Inbox, Send, FileText, Star, Archive, Trash2, 
  Search, Plus, RefreshCw, ChevronLeft, Reply, Forward,
  MailOpen, Clock, AlertCircle, Check
} from "lucide-react";

interface Email {
  id: string;
  fromAddress: string;
  fromName: string | null;
  toAddresses: string;
  subject: string | null;
  bodyText: string | null;
  bodyHtml: string | null;
  priority: string;
  isInternal: boolean;
  sentAt: string | null;
  createdAt: string;
  isRead: boolean;
  isStarred: boolean;
  isImportant: boolean;
  recipientId: string;
  status: string;
  threadId: string | null;
}

interface Mailbox {
  id: string;
  emailAddress: string;
  displayName: string | null;
  unreadCount: number;
  totalMessages: number;
}

interface Folder {
  id: string;
  name: string;
  folderType: string;
  messageCount: number;
  unreadCount: number;
  isSystem: boolean;
}

const folderIcons: Record<string, typeof Inbox> = {
  inbox: Inbox,
  sent: Send,
  drafts: FileText,
  starred: Star,
  archive: Archive,
  trash: Trash2,
  custom: Mail,
};

export default function InboxPage() {
  const { toast } = useToast();
  const [selectedFolder, setSelectedFolder] = useState("inbox");
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");

  const { data: mailboxData, isLoading: mailboxLoading } = useQuery({
    queryKey: ["/api/internal-email/mailbox/auto-create"],
  });

  const mailbox = mailboxData?.mailbox as Mailbox | undefined;

  const { data: foldersData } = useQuery({
    queryKey: ["/api/internal-email/folders"],
    enabled: !!mailbox,
  });

  const folders = (foldersData?.folders || []) as Folder[];

  const { data: emailsData, isLoading: emailsLoading, refetch: refetchEmails } = useQuery({
    queryKey: ["/api/internal-email/inbox", selectedFolder, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams({ folder: selectedFolder });
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`/api/internal-email/inbox?${params}`, { credentials: "include" });
      return res.json();
    },
    enabled: !!mailbox,
  });

  const emails = (emailsData?.emails || []) as Email[];

  const sendEmailMutation = useMutation({
    mutationFn: async (data: { to: string[]; subject: string; bodyText: string; sendExternal?: boolean }) => {
      return apiRequest("/api/internal-email/send", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      toast({ title: "Email sent successfully" });
      setComposeOpen(false);
      setComposeTo("");
      setComposeSubject("");
      setComposeBody("");
      queryClient.invalidateQueries({ queryKey: ["/api/internal-email/inbox"] });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to send email", description: err.message, variant: "destructive" });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async ({ id, isRead }: { id: string; isRead: boolean }) => {
      return apiRequest(`/api/internal-email/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isRead }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/internal-email/inbox"] });
      queryClient.invalidateQueries({ queryKey: ["/api/internal-email/mailbox/auto-create"] });
    },
  });

  const toggleStarMutation = useMutation({
    mutationFn: async ({ id, isStarred }: { id: string; isStarred: boolean }) => {
      return apiRequest(`/api/internal-email/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ isStarred }),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/internal-email/inbox"] });
    },
  });

  const deleteEmailMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/internal-email/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast({ title: "Email moved to trash" });
      setSelectedEmail(null);
      queryClient.invalidateQueries({ queryKey: ["/api/internal-email/inbox"] });
    },
  });

  const handleSendEmail = () => {
    if (!composeTo.trim() || !composeSubject.trim()) {
      toast({ title: "Please fill in recipient and subject", variant: "destructive" });
      return;
    }
    const recipients = composeTo.split(",").map(e => e.trim()).filter(Boolean);
    const sendExternal = recipients.some(r => !r.endsWith("@coaileague.internal"));
    sendEmailMutation.mutate({
      to: recipients,
      subject: composeSubject,
      bodyText: composeBody,
      sendExternal,
    });
  };

  const handleEmailClick = (email: Email) => {
    setSelectedEmail(email);
    if (!email.isRead) {
      markReadMutation.mutate({ id: email.id, isRead: true });
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 86400000) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const parseRecipients = (str: string) => {
    try {
      return JSON.parse(str);
    } catch {
      return [str];
    }
  };

  if (mailboxLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-full" data-testid="inbox-page">
      <div className="w-56 border-r bg-muted/30 p-3 flex flex-col gap-2">
        <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
          <DialogTrigger asChild>
            <Button className="w-full gap-2" data-testid="button-compose">
              <Plus className="h-4 w-4" />
              Compose
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>New Message</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>To</Label>
                <Input 
                  placeholder="recipient@coaileague.internal or external@email.com"
                  value={composeTo}
                  onChange={(e) => setComposeTo(e.target.value)}
                  data-testid="input-compose-to"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Separate multiple recipients with commas. External emails will be sent via Resend.
                </p>
              </div>
              <div>
                <Label>Subject</Label>
                <Input 
                  placeholder="Email subject"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  data-testid="input-compose-subject"
                />
              </div>
              <div>
                <Label>Message</Label>
                <Textarea 
                  placeholder="Write your message..."
                  className="min-h-[200px]"
                  value={composeBody}
                  onChange={(e) => setComposeBody(e.target.value)}
                  data-testid="input-compose-body"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setComposeOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSendEmail}
                  disabled={sendEmailMutation.isPending}
                  data-testid="button-send-email"
                >
                  {sendEmailMutation.isPending ? "Sending..." : "Send"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Separator className="my-2" />

        {mailbox && (
          <div className="px-2 py-1 text-xs text-muted-foreground truncate" title={mailbox.emailAddress}>
            {mailbox.emailAddress}
          </div>
        )}

        <ScrollArea className="flex-1">
          <div className="space-y-1">
            {folders.map((folder) => {
              const Icon = folderIcons[folder.folderType] || Mail;
              const isSelected = selectedFolder === folder.folderType;
              return (
                <Button
                  key={folder.id}
                  variant={isSelected ? "secondary" : "ghost"}
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    setSelectedFolder(folder.folderType);
                    setSelectedEmail(null);
                  }}
                  data-testid={`folder-${folder.folderType}`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{folder.name}</span>
                  {folder.unreadCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {folder.unreadCount}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="p-3 border-b flex items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search emails..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-emails"
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => refetchEmails()} data-testid="button-refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          <div className={`${selectedEmail ? "w-1/3 border-r" : "flex-1"} overflow-hidden`}>
            <ScrollArea className="h-full">
              {emailsLoading ? (
                <div className="p-4 text-center text-muted-foreground">Loading...</div>
              ) : emails.length === 0 ? (
                <div className="p-8 text-center">
                  <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No emails in {selectedFolder}</p>
                </div>
              ) : (
                <div>
                  {emails.map((email) => (
                    <div
                      key={email.id}
                      className={`p-3 border-b cursor-pointer hover-elevate ${
                        !email.isRead ? "bg-primary/5" : ""
                      } ${selectedEmail?.id === email.id ? "bg-muted" : ""}`}
                      onClick={() => handleEmailClick(email)}
                      data-testid={`email-item-${email.id}`}
                    >
                      <div className="flex items-start gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStarMutation.mutate({ id: email.id, isStarred: !email.isStarred });
                          }}
                        >
                          <Star className={`h-4 w-4 ${email.isStarred ? "fill-yellow-400 text-yellow-400" : ""}`} />
                        </Button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm truncate ${!email.isRead ? "font-semibold" : ""}`}>
                              {email.fromName || email.fromAddress}
                            </span>
                            {email.priority === "high" || email.priority === "urgent" ? (
                              <AlertCircle className="h-3 w-3 text-destructive shrink-0" />
                            ) : null}
                            <span className="text-xs text-muted-foreground ml-auto shrink-0">
                              {formatDate(email.sentAt || email.createdAt)}
                            </span>
                          </div>
                          <p className={`text-sm truncate ${!email.isRead ? "font-medium" : "text-muted-foreground"}`}>
                            {email.subject || "(No subject)"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {email.bodyText?.substring(0, 80)}...
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {selectedEmail && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-3 border-b flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedEmail(null)}
                  data-testid="button-back"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex-1" />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setComposeTo(selectedEmail.fromAddress);
                    setComposeSubject(`Re: ${selectedEmail.subject || ""}`);
                    setComposeOpen(true);
                  }}
                  data-testid="button-reply"
                >
                  <Reply className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setComposeSubject(`Fwd: ${selectedEmail.subject || ""}`);
                    setComposeBody(`\n\n--- Forwarded message ---\nFrom: ${selectedEmail.fromAddress}\nSubject: ${selectedEmail.subject}\n\n${selectedEmail.bodyText || ""}`);
                    setComposeOpen(true);
                  }}
                  data-testid="button-forward"
                >
                  <Forward className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteEmailMutation.mutate(selectedEmail.id)}
                  data-testid="button-delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="max-w-3xl">
                  <h2 className="text-xl font-semibold mb-4" data-testid="email-subject">
                    {selectedEmail.subject || "(No subject)"}
                  </h2>
                  
                  <div className="flex items-start gap-3 mb-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                      {(selectedEmail.fromName || selectedEmail.fromAddress).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {selectedEmail.fromName || selectedEmail.fromAddress}
                        </span>
                        {selectedEmail.isInternal && (
                          <Badge variant="outline" className="text-xs">Internal</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {selectedEmail.fromAddress}
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(selectedEmail.sentAt || selectedEmail.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground mb-4">
                    <span>To: {parseRecipients(selectedEmail.toAddresses).join(", ")}</span>
                  </div>

                  <Separator className="my-4" />

                  <div className="prose prose-sm dark:prose-invert max-w-none" data-testid="email-body">
                    {selectedEmail.bodyHtml ? (
                      <div dangerouslySetInnerHTML={{ __html: selectedEmail.bodyHtml }} />
                    ) : (
                      <pre className="whitespace-pre-wrap font-sans">{selectedEmail.bodyText}</pre>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
