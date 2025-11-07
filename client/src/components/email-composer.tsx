import { useState } from "react";
import { RichTextEditor } from "@/components/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, X, Paperclip, Users, AtSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export type EmailTemplate = "blank" | "marketing" | "sales" | "invoice" | "report" | "notification";

interface EmailComposerProps {
  onSend?: (email: EmailData) => Promise<void>;
  onCancel?: () => void;
  defaultTo?: string[];
  defaultSubject?: string;
  defaultTemplate?: EmailTemplate;
  className?: string;
}

export interface EmailData {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  plainText: string;
  template: EmailTemplate;
  attachments?: File[];
}

const emailTemplates: Record<EmailTemplate, { name: string; description: string }> = {
  blank: {
    name: "Blank Email",
    description: "Start from scratch"
  },
  marketing: {
    name: "Marketing Email",
    description: "Promotional campaigns and announcements"
  },
  sales: {
    name: "Sales Email",
    description: "Customer outreach and follow-ups"
  },
  invoice: {
    name: "Invoice Email",
    description: "Billing and payment notifications"
  },
  report: {
    name: "Report Email",
    description: "Analytics and performance reports"
  },
  notification: {
    name: "System Notification",
    description: "Automated system alerts"
  },
};

export function EmailComposer({
  onSend,
  onCancel,
  defaultTo = [],
  defaultSubject = "",
  defaultTemplate = "blank",
  className = "",
}: EmailComposerProps) {
  const { toast } = useToast();
  const [template, setTemplate] = useState<EmailTemplate>(defaultTemplate);
  const [to, setTo] = useState<string[]>(defaultTo);
  const [cc, setCc] = useState<string[]>([]);
  const [bcc, setBcc] = useState<string[]>([]);
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState("");
  const [plainText, setPlainText] = useState("");
  const [currentRecipient, setCurrentRecipient] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);

  const addRecipient = (list: string[], setter: (list: string[]) => void) => {
    const email = currentRecipient.trim();
    if (email && !list.includes(email)) {
      if (validateEmail(email)) {
        setter([...list, email]);
        setCurrentRecipient("");
      } else {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address",
          variant: "destructive",
        });
      }
    }
  };

  const removeRecipient = (email: string, list: string[], setter: (list: string[]) => void) => {
    setter(list.filter(e => e !== email));
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSend = async () => {
    if (to.length === 0) {
      toast({
        title: "No Recipients",
        description: "Please add at least one recipient",
        variant: "destructive",
      });
      return;
    }

    if (!subject.trim()) {
      toast({
        title: "No Subject",
        description: "Please add a subject line",
        variant: "destructive",
      });
      return;
    }

    if (!plainText.trim()) {
      toast({
        title: "Empty Message",
        description: "Please write your message",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    try {
      const emailData: EmailData = {
        to,
        cc: cc.length > 0 ? cc : undefined,
        bcc: bcc.length > 0 ? bcc : undefined,
        subject,
        body,
        plainText,
        template,
        attachments: attachments.length > 0 ? attachments : undefined,
      };

      if (onSend) {
        await onSend(emailData);
      }

      toast({
        title: "Email Sent",
        description: `Message sent to ${to.length} recipient${to.length > 1 ? 's' : ''}`,
      });
    } catch (error) {
      toast({
        title: "Send Failed",
        description: error instanceof Error ? error.message : "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments([...attachments, ...Array.from(e.target.files)]);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Compose Email</CardTitle>
            <CardDescription>
              Send professional emails for marketing, sales, invoicing, and more
            </CardDescription>
          </div>
          <Select value={template} onValueChange={(v) => setTemplate(v as EmailTemplate)}>
            <SelectTrigger className="w-[200px]" data-testid="select-email-template">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(emailTemplates).map(([key, { name, description }]) => (
                <SelectItem key={key} value={key}>
                  <div>
                    <div className="font-medium">{name}</div>
                    <div className="text-xs text-muted-foreground">{description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* To Field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>To</Label>
            <div className="flex gap-2">
              {!showCc && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCc(true)}
                  data-testid="button-show-cc"
                >
                  <Users className="h-3 w-3 mr-1" />
                  Cc
                </Button>
              )}
              {!showBcc && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBcc(true)}
                  data-testid="button-show-bcc"
                >
                  <Users className="h-3 w-3 mr-1" />
                  Bcc
                </Button>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="recipient@example.com"
              value={currentRecipient}
              onChange={(e) => setCurrentRecipient(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addRecipient(to, setTo);
                }
              }}
              data-testid="input-email-to"
            />
            <Button
              type="button"
              onClick={() => addRecipient(to, setTo)}
              data-testid="button-add-recipient"
            >
              <AtSign className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {to.map((email) => (
              <Badge key={email} variant="secondary">
                {email}
                <button
                  type="button"
                  onClick={() => removeRecipient(email, to, setTo)}
                  className="ml-1 hover:text-destructive"
                  data-testid={`button-remove-recipient-${email}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>

        {/* Cc Field */}
        {showCc && (
          <div className="space-y-2">
            <Label>Cc</Label>
            <div className="flex gap-2">
              <Input
                placeholder="cc@example.com"
                value={currentRecipient}
                onChange={(e) => setCurrentRecipient(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addRecipient(cc, setCc);
                  }
                }}
                data-testid="input-email-cc"
              />
              <Button
                type="button"
                onClick={() => addRecipient(cc, setCc)}
                data-testid="button-add-cc"
              >
                <AtSign className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {cc.map((email) => (
                <Badge key={email} variant="secondary">
                  {email}
                  <button
                    type="button"
                    onClick={() => removeRecipient(email, cc, setCc)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Bcc Field */}
        {showBcc && (
          <div className="space-y-2">
            <Label>Bcc</Label>
            <div className="flex gap-2">
              <Input
                placeholder="bcc@example.com"
                value={currentRecipient}
                onChange={(e) => setCurrentRecipient(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addRecipient(bcc, setBcc);
                  }
                }}
                data-testid="input-email-bcc"
              />
              <Button
                type="button"
                onClick={() => addRecipient(bcc, setBcc)}
                data-testid="button-add-bcc"
              >
                <AtSign className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {bcc.map((email) => (
                <Badge key={email} variant="secondary">
                  {email}
                  <button
                    type="button"
                    onClick={() => removeRecipient(email, bcc, setBcc)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Subject */}
        <div className="space-y-2">
          <Label>Subject</Label>
          <Input
            placeholder="Email subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            data-testid="input-email-subject"
          />
        </div>

        {/* Rich Text Editor */}
        <div className="space-y-2">
          <Label>Message</Label>
          <RichTextEditor
            value={body}
            onChange={(html, text) => {
              setBody(html);
              setPlainText(text);
            }}
            placeholder="Compose your message with rich formatting..."
            minHeight="300px"
          />
        </div>

        {/* Attachments */}
        <div className="space-y-2">
          <Label>Attachments</Label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById("file-upload")?.click()}
              data-testid="button-attach-file"
            >
              <Paperclip className="h-4 w-4 mr-2" />
              Attach File
            </Button>
            <input
              id="file-upload"
              type="file"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachments.map((file, index) => (
                <Badge key={index} variant="outline">
                  {file.name}
                  <button
                    type="button"
                    onClick={() => setAttachments(attachments.filter((_, i) => i !== index))}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            data-testid="button-cancel-email"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending}
            data-testid="button-send-email"
          >
            <Send className="h-4 w-4 mr-2" />
            {isSending ? "Sending..." : "Send Email"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
