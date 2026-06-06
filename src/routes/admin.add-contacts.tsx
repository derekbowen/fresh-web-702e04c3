import * as React from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin-layout";
import { addContacts, type AddContactsResult } from "@/server/add-contacts.functions";

export const Route = createFileRoute("/admin/add-contacts")({
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth", search: { redirect: "/admin/add-contacts", mode: "signin" } });
    }
  },
  head: () => ({
    meta: [
      { title: "Add contacts — Admin" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AddContactsPage,
});

function AddContactsPage() {
  const [raw, setRaw] = React.useState("");
  const [hostList, setHostList] = React.useState(false);
  const [renterList, setRenterList] = React.useState(false);
  const [scheduleDrip, setScheduleDrip] = React.useState(true);

  const fn = useServerFn(addContacts);
  const mutation = useMutation<AddContactsResult, Error, void>({
    mutationFn: () =>
      fn({
        data: {
          raw,
          lists: [hostList && "host", renterList && "renter"].filter(Boolean) as ("host" | "renter")[],
          scheduleDrip,
        },
      }),
  });

  const canSubmit = raw.trim().length > 0 && (hostList || renterList) && !mutation.isPending;
  const result = mutation.data;

  return (
    <AdminLayout title="Add contacts">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold">Add contacts to email lists</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste one email per line. Optional formats: <code>email,name</code> or <code>Name &lt;email&gt;</code>.
        </p>

        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder={"jane@example.com\njohn@example.com,John Smith\nJane Doe <jane2@example.com>"}
          className="mt-3 h-64 w-full rounded-md border border-border bg-background p-3 font-mono text-sm"
        />

        <div className="mt-4 rounded-md border border-border bg-card p-3">
          <div className="text-sm font-medium">Add to lists</div>
          <div className="mt-2 space-y-1.5 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={hostList} onChange={(e) => setHostList(e.target.checked)} />
              <span>Host drip list (7-touch weekly sequence)</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={renterList} onChange={(e) => setRenterList(e.target.checked)} />
              <span>Renter drip list</span>
            </label>
          </div>
          <div className="mt-3 border-t border-border pt-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={scheduleDrip} onChange={(e) => setScheduleDrip(e.target.checked)} />
              <span>Start the drip sequence for new contacts</span>
            </label>
            <p className="mt-1 text-xs text-muted-foreground">
              Existing contacts already in a sequence are never duplicated.
            </p>
          </div>
        </div>

        <button
          onClick={() => mutation.mutate()}
          disabled={!canSubmit}
          className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {mutation.isPending ? "Adding…" : "Add contacts"}
        </button>

        {mutation.isError && (
          <div className="mt-4 rounded-md border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-700">
            {String(mutation.error)}
          </div>
        )}

        {result && (
          <div className="mt-4 rounded-md border border-border bg-card p-3 text-sm">
            {result.error && (
              <div className="mb-2 text-red-600">{result.error}</div>
            )}
            <div>Parsed valid emails: <b>{result.parsed}</b></div>
            {result.invalid.length > 0 && (
              <details className="mt-1">
                <summary className="cursor-pointer text-muted-foreground">
                  Skipped invalid lines ({result.invalid.length})
                </summary>
                <pre className="mt-1 max-h-32 overflow-auto rounded bg-muted p-2 text-xs">{result.invalid.join("\n")}</pre>
              </details>
            )}
            {(["host", "renter"] as const).map((k) => {
              const r = result.perList[k];
              const touched = r.added + r.existing + r.skipped;
              if (touched === 0) return null;
              return (
                <div key={k} className="mt-3 border-t border-border pt-2">
                  <div className="font-medium">{k === "host" ? "Host drip" : "Renter drip"}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    Added: <b className="text-foreground">{r.added}</b> · Already on list: <b className="text-foreground">{r.existing}</b> · Drip scheduled: <b className="text-foreground">{r.scheduled}</b> · Skipped: <b className="text-foreground">{r.skipped}</b>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
