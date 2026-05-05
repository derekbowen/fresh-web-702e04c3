import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import {
  getSiteFooterAdmin,
  updateSiteFooter,
  resetSiteFooter,
  type SiteFooterSettings,
  type FooterLink,
  type FooterMarket,
  type FooterSocial,
} from "@/server/site-footer.functions";

export const Route = createFileRoute("/admin/site-footer")({
  component: SiteFooterAdmin,
});

const SOCIAL_OPTIONS = ["facebook", "x", "twitter", "youtube", "linkedin", "instagram", "tiktok", "pinterest"];

function SiteFooterAdmin() {
  const [data, setData] = React.useState<SiteFooterSettings | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    getSiteFooterAdmin().then(setData).catch((e) => toast.error(e.message));
  }, []);

  if (!data) {
    return (
      <AdminLayout title="Site Footer">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </AdminLayout>
    );
  }

  const update = <K extends keyof SiteFooterSettings>(key: K, value: SiteFooterSettings[K]) =>
    setData((d) => (d ? { ...d, [key]: value } : d));

  const save = async () => {
    if (!data) return;
    setSaving(true);
    try {
      await updateSiteFooter({ data: data as any });
      toast.success("Footer saved. Reload pages to see changes.");
    } catch (e: any) {
      toast.error(e.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (!confirm("Reset footer to defaults?")) return;
    setSaving(true);
    try {
      await resetSiteFooter();
      const fresh = await getSiteFooterAdmin();
      setData(fresh);
      toast.success("Reset to defaults.");
    } catch (e: any) {
      toast.error(e.message ?? "Reset failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Site Footer">
      <div className="flex items-center justify-between gap-2 pb-6">
        <p className="text-sm text-muted-foreground">
          Edit company links, contact info, social icons, and popular markets shown in the global footer.
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={reset} disabled={saving}>Reset defaults</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Contact</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label="Phone label" value={data.contact_phone_label ?? ""} onChange={(v) => update("contact_phone_label", v || null)} placeholder="Call us 888-940-4247" />
            <Field label="Phone link (tel:)" value={data.contact_phone ?? ""} onChange={(v) => update("contact_phone", v || null)} placeholder="tel:18889404247" />
            <Field label="Hours" value={data.contact_phone_hours ?? ""} onChange={(v) => update("contact_phone_hours", v || null)} placeholder="10am - 5pm PST" />
            <Field label="Support email" value={data.contact_email ?? ""} onChange={(v) => update("contact_email", v || null)} placeholder="support@example.com" />
            <div>
              <Label>Bottom legal text</Label>
              <Textarea
                value={data.bottom_text ?? ""}
                onChange={(e) => update("bottom_text", e.target.value || null)}
                placeholder="© 2026 Company Inc."
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Social Links</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.socials.map((s, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_2fr_auto] gap-2">
                <select
                  className="h-10 rounded-md border border-input bg-background px-2 text-sm"
                  value={s.icon}
                  onChange={(e) => updateArrayItem(setData, "socials", i, { ...s, icon: e.target.value })}
                >
                  {SOCIAL_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
                <Input value={s.label} onChange={(e) => updateArrayItem(setData, "socials", i, { ...s, label: e.target.value })} placeholder="Label" />
                <Input value={s.href} onChange={(e) => updateArrayItem(setData, "socials", i, { ...s, href: e.target.value })} placeholder="https://…" />
                <Button variant="ghost" size="icon" onClick={() => removeArrayItem(setData, "socials", i)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addArrayItem(setData, "socials", { label: "", href: "", icon: "facebook" } as FooterSocial)}>
              <Plus className="mr-1 h-4 w-4" /> Add social
            </Button>
          </CardContent>
        </Card>

        <LinkColumnEditor title="Explore" field="explore_links" data={data} setData={setData} />
        <LinkColumnEditor title="Become a Host" field="host_links" data={data} setData={setData} />
        <LinkColumnEditor title="Company" field="company_links" data={data} setData={setData} />

        <Card>
          <CardHeader><CardTitle>Popular Markets</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {data.popular_markets.map((mkt, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                <Input value={mkt.name} onChange={(e) => updateArrayItem(setData, "popular_markets", i, { ...mkt, name: e.target.value })} placeholder="City, ST" />
                <Input value={mkt.slug} onChange={(e) => updateArrayItem(setData, "popular_markets", i, { ...mkt, slug: e.target.value })} placeholder="city-st" />
                <Button variant="ghost" size="icon" onClick={() => removeArrayItem(setData, "popular_markets", i)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addArrayItem(setData, "popular_markets", { name: "", slug: "" } as FooterMarket)}>
              <Plus className="mr-1 h-4 w-4" /> Add market
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button variant="outline" onClick={reset} disabled={saving}>Reset defaults</Button>
        <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
      </div>
    </AdminLayout>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function LinkColumnEditor({
  title,
  field,
  data,
  setData,
}: {
  title: string;
  field: "explore_links" | "host_links" | "company_links";
  data: SiteFooterSettings;
  setData: React.Dispatch<React.SetStateAction<SiteFooterSettings | null>>;
}) {
  const items = data[field];
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {items.map((it, i) => (
          <div key={i} className="grid grid-cols-[1fr_2fr_auto] gap-2">
            <Input value={it.label} onChange={(e) => updateArrayItem(setData, field, i, { ...it, label: e.target.value })} placeholder="Label" />
            <Input value={it.href} onChange={(e) => updateArrayItem(setData, field, i, { ...it, href: e.target.value })} placeholder="/path or https://…" />
            <Button variant="ghost" size="icon" onClick={() => removeArrayItem(setData, field, i)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={() => addArrayItem(setData, field, { label: "", href: "" } as FooterLink)}>
          <Plus className="mr-1 h-4 w-4" /> Add link
        </Button>
      </CardContent>
    </Card>
  );
}

function updateArrayItem<K extends keyof SiteFooterSettings>(
  setData: React.Dispatch<React.SetStateAction<SiteFooterSettings | null>>,
  key: K,
  index: number,
  value: any,
) {
  setData((d) => {
    if (!d) return d;
    const arr = [...(d[key] as any[])];
    arr[index] = value;
    return { ...d, [key]: arr };
  });
}

function addArrayItem<K extends keyof SiteFooterSettings>(
  setData: React.Dispatch<React.SetStateAction<SiteFooterSettings | null>>,
  key: K,
  value: any,
) {
  setData((d) => (d ? { ...d, [key]: [...(d[key] as any[]), value] } : d));
}

function removeArrayItem<K extends keyof SiteFooterSettings>(
  setData: React.Dispatch<React.SetStateAction<SiteFooterSettings | null>>,
  key: K,
  index: number,
) {
  setData((d) => {
    if (!d) return d;
    const arr = [...(d[key] as any[])];
    arr.splice(index, 1);
    return { ...d, [key]: arr };
  });
}
