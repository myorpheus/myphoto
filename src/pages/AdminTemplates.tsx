import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";

interface Template {
  id: string; name: string; name_ru: string; name_zh: string; icon: string;
  color_from: string; color_to: string; generated_image_url: string | null;
  is_active: boolean; display_order: number;
}

type TemplateForm = Omit<Template, "id">;

const icons = ["Building2", "Landmark", "Stethoscope", "Scale", "Briefcase", "GraduationCap", "Camera", "Palette"];
const colors = ["blue-500", "blue-700", "emerald-500", "emerald-700", "red-500", "red-700", "amber-500", "amber-700", "violet-500", "violet-700", "cyan-500", "cyan-700", "pink-500", "pink-700", "orange-500", "orange-700"];

const emptyForm: TemplateForm = {
  name: "", name_ru: "", name_zh: "", icon: "Building2",
  color_from: "blue-500", color_to: "blue-700", generated_image_url: null,
  is_active: true, display_order: 0,
};

const AdminTemplates = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<(TemplateForm & { id?: string }) | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["adminTemplates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("templates" as any).select("*").order("display_order");
      if (error) throw error;
      return data as unknown as Template[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (t: TemplateForm & { id?: string }) => {
      const { id, ...rest } = t;
      if (id) {
        const { error } = await supabase.from("templates" as any).update(rest as any).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("templates" as any).insert(rest as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminTemplates"] });
      setDialogOpen(false); setEditing(null);
      toast({ title: "Saved", description: "Template saved." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("templates" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminTemplates"] });
      toast({ title: "Deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/admin")}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>
            <h1 className="text-2xl font-bold">Templates</h1>
          </div>
          <Button onClick={() => { setEditing({ ...emptyForm }); setDialogOpen(true); }}><Plus className="w-4 h-4 mr-2" />New Template</Button>
        </div>
      </header>

      <main className="container py-8">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((t) => (
              <Card key={t.id}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{t.name}</h3>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setEditing({ ...t }); setDialogOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { if (confirm("Delete?")) deleteMutation.mutate(t.id); }}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">RU: {t.name_ru} · ZH: {t.name_zh}</p>
                  <p className="text-sm text-muted-foreground">Icon: {t.icon} · Order: {t.display_order} · {t.is_active ? "Active" : "Inactive"}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit Template" : "New Template"}</DialogTitle></DialogHeader>
          {editing && (
            <TemplateFormFields
              template={editing}
              onChange={setEditing}
              onSave={() => saveMutation.mutate(editing)}
              isSaving={saveMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

function TemplateFormFields({ template, onChange, onSave, isSaving }: {
  template: TemplateForm & { id?: string };
  onChange: (t: TemplateForm & { id?: string }) => void;
  onSave: () => void;
  isSaving: boolean;
}) {
  const update = (field: string, value: any) => onChange({ ...template, [field]: value });

  return (
    <div className="space-y-4">
      <div><Label>Name (EN)</Label><Input value={template.name} onChange={(e) => update("name", e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Name (RU)</Label><Input value={template.name_ru} onChange={(e) => update("name_ru", e.target.value)} /></div>
        <div><Label>Name (ZH)</Label><Input value={template.name_zh} onChange={(e) => update("name_zh", e.target.value)} /></div>
      </div>
      <div><Label>Icon</Label>
        <Select value={template.icon} onValueChange={(v) => update("icon", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{icons.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Color From</Label>
          <Select value={template.color_from} onValueChange={(v) => update("color_from", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{colors.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Color To</Label>
          <Select value={template.color_to} onValueChange={(v) => update("color_to", v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{colors.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div><Label>Image URL (optional)</Label><Input value={template.generated_image_url || ""} onChange={(e) => update("generated_image_url", e.target.value || null)} /></div>
      <div><Label>Display Order</Label><Input type="number" value={template.display_order} onChange={(e) => update("display_order", parseInt(e.target.value) || 0)} /></div>
      <div className="flex items-center gap-2">
        <Switch checked={template.is_active} onCheckedChange={(v) => update("is_active", v)} />
        <Label>Active</Label>
      </div>
      <Button onClick={onSave} disabled={isSaving || !template.name} className="w-full">
        {isSaving ? "Saving..." : "Save Template"}
      </Button>
    </div>
  );
}

export default AdminTemplates;
