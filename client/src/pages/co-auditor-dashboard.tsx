import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, AlertTriangle, Loader2, FileText, Plus, Calendar, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Audit {
  id: string;
  workspace_id: string;
  license_number: string | null;
  status: string;
  opened_at: string;
  closes_at: string;
  closed_at: string | null;
  scope: string;
}

export default function CoAuditorDashboard() {
  const [, setLocation] = useLocation();
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRequest, setShowRequest] = useState(false);

  // New audit form
  const [workspaceId, setWorkspaceId] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [orderDocUrl, setOrderDocUrl] = useState("");
  const [notes, setNotes] = useState("");

  async function load() {
    setLoading(true);
    try {
      const me = await apiRequest("GET", "/api/auditor/me", undefined);
      const meBody = await me.json();
      if (!meBody.ok) { setLocation("/co-auditor/login"); return; }
      const r = await apiRequest("GET", "/api/auditor/me/audits", undefined);
      const body = await r.json();
      if (!body.ok) { setError(body.error); setLoading(false); return; }
      setAudits(body.audits || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load");
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function requestAudit() {
    setError(null);
    if (!workspaceId) { setError("Workspace ID is required"); return; }
    try {
      const r = await apiRequest("POST", "/api/auditor/audits", { workspaceId, licenseNumber, orderDocUrl, notes });
      const body = await r.json();
      if (!body.ok) { setError(body.error); return; }
      setShowRequest(false);
      setWorkspaceId(""); setLicenseNumber(""); setOrderDocUrl(""); setNotes("");
      load();
    } catch (e: any) { setError(e?.message); }
  }

  async function closeAudit(id: string) {
    if (!confirm("Close this audit? You won't be able to access this workspace's records after closing.")) return;
    await apiRequest("POST", `/api/auditor/audits/${id}/close`, {});
    load();
  }

  async function extendAudit(id: string) {
    const days = parseInt(prompt("Extend by how many days? (max 90)", "30") || "0", 10);
    if (!days || days < 1) return;
    await apiRequest("POST", `/api/auditor/audits/${id}/extend`, { days });
    load();
  }

  async function logout() {
    await apiRequest("POST", "/api/auditor/logout", {});
    setLocation("/co-auditor/login");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-emerald-400" />
            <div>
              <h1 className="text-2xl font-bold">Auditor portal</h1>
              <p className="text-slate-400 text-sm">Read &amp; print only — Co-League Compliance Concierge</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowRequest(s => !s)} className="border-slate-700">
              <Plus className="w-4 h-4 mr-2" /> Request new audit
            </Button>
            <Button variant="ghost" onClick={logout}>Sign out</Button>
          </div>
        </header>

        {error && (
          <div className="flex items-start gap-2 p-3 rounded-md bg-red-950/40 border border-red-900 text-red-200">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {showRequest && (
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle>Request a new audit window</CardTitle>
              <CardDescription className="text-slate-400">
                Submit the workspace ID + license number you've been authorized to audit. Trinity will queue it for tenant review.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Workspace ID</Label>
                <Input value={workspaceId} onChange={e => setWorkspaceId(e.target.value)} className="bg-slate-800 border-slate-700" />
              </div>
              <div>
                <Label>License number</Label>
                <Input value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} className="bg-slate-800 border-slate-700" />
              </div>
              <div>
                <Label>Order document URL (optional)</Label>
                <Input value={orderDocUrl} onChange={e => setOrderDocUrl(e.target.value)} className="bg-slate-800 border-slate-700" />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} className="bg-slate-800 border-slate-700" rows={3} />
              </div>
              <Button onClick={requestAudit} className="bg-emerald-600 hover:bg-emerald-500">Submit request</Button>
            </CardContent>
          </Card>
        )}

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> Your audits</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-slate-400"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>
            ) : audits.length === 0 ? (
              <p className="text-slate-400">No audits on file. Click "Request new audit" to begin.</p>
            ) : (
              <div className="space-y-3">
                {audits.map(a => (
                  <div key={a.id} className="border border-slate-800 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-mono text-sm text-slate-400">{a.id}</div>
                        <div className="font-semibold mt-1">License: {a.license_number || "—"}</div>
                        <div className="text-sm text-slate-400">Workspace: {a.workspace_id}</div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                          <Calendar className="w-3 h-3" />
                          Opened {new Date(a.opened_at).toLocaleDateString()} · Closes {new Date(a.closes_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={
                          a.status === 'closed' ? 'bg-slate-700' :
                          a.status === 'pending_review' ? 'bg-amber-700' :
                          'bg-emerald-700'
                        }>
                          {a.status}
                        </Badge>
                        {a.status !== 'closed' && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => extendAudit(a.id)} className="border-slate-700">Extend</Button>
                            <Button size="sm" variant="ghost" onClick={() => closeAudit(a.id)}>
                              <X className="w-3 h-3 mr-1" /> Close
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-slate-600 text-center">
          Every action you take is recorded in the auditor session log for regulatory defensibility.
        </p>
      </div>
    </div>
  );
}
