import { useEffect, useId, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useServerFn } from "@tanstack/react-start";
import {
  sendListingInquiry,
  type InquiryResult,
  type ListingInquiryPayload,
} from "@/server/listing-inquiry.functions";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { canonicalListingUrl } from "@/lib/listing-url";
import { SITE_URL } from "@/lib/seo";

/**
 * "Ask about this pool": a question goes to PRNM's support inbox, and only
 * there. Nobody else is emailed by this form, so the copy promises only what
 * is true: we'll get back to you by email.
 *
 * The browser checks below are for instant feedback. They mirror
 * INQUIRY_LIMITS in src/server/listing-inquiry.server.ts, which re-validates
 * every field and is the authority. (That module is server-only, so the
 * numbers are repeated here rather than imported.)
 */

const SUPPORT_EMAIL = "support@poolrentalnearme.com";
const LIMITS = {
  nameMax: 100,
  emailMax: 254,
  phoneMax: 40,
  messageMin: 10,
  messageMax: 2000,
  groupSizeMax: 100,
} as const;

const LINE_BREAK = /[\r\n\u0085\u2028\u2029]/;
const PHONE_RE = /^[0-9+().\-/\s]+(?:\s*(?:x|ext\.?)\s*\d{1,6})?$/i;

function todayLocalIso(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

const groupSizeError = `Please enter a number from 1 to ${LIMITS.groupSizeMax}.`;
const messageMaxError = `Please keep your message under ${LIMITS.messageMax.toLocaleString("en-US")} characters.`;

const formSchema = z.object({
  name: z
    .string()
    .refine((s) => !LINE_BREAK.test(s), "Your name can't contain line breaks.")
    .pipe(
      z
        .string()
        .trim()
        .min(1, "Please tell us your name.")
        .max(LIMITS.nameMax, `Please keep your name under ${LIMITS.nameMax} characters.`),
    ),
  email: z
    .string()
    .trim()
    .min(1, "Please enter your email address.")
    .max(LIMITS.emailMax, "Please enter a valid email address.")
    .pipe(z.email("Please enter a valid email address.")),
  phone: z
    .string()
    .trim()
    .max(LIMITS.phoneMax, "That phone number looks too long.")
    .refine((s) => s === "" || PHONE_RE.test(s), "Please use digits, spaces, + ( ) - only.")
    .refine(
      (s) => s === "" || (s.match(/\d/g) ?? []).length >= 5,
      "That phone number looks too short.",
    ),
  preferredDate: z
    .string()
    .refine((s) => s === "" || /^\d{4}-\d{2}-\d{2}$/.test(s), "Please pick a date.")
    // ISO dates compare correctly as strings.
    .refine((s) => s === "" || s >= todayLocalIso(), "Please pick a date from today onwards."),
  groupSize: z
    .string()
    .trim()
    .refine(
      (s) =>
        s === "" || (/^\d{1,3}$/.test(s) && Number(s) >= 1 && Number(s) <= LIMITS.groupSizeMax),
      groupSizeError,
    ),
  message: z
    .string()
    .trim()
    .min(1, "Please write your question.")
    .min(
      LIMITS.messageMin,
      `Please add a little more detail (at least ${LIMITS.messageMin} characters).`,
    )
    .max(LIMITS.messageMax, messageMaxError),
  /** Honeypot. Must match HONEYPOT_FIELD on the server. */
  hp_extra_notes: z.string(),
});

type FormInput = z.input<typeof formSchema>;
type FormOutput = z.output<typeof formSchema>;
type VisibleField = Exclude<keyof FormInput, "hp_extra_notes">;

const EMPTY: FormInput = {
  name: "",
  email: "",
  phone: "",
  preferredDate: "",
  groupSize: "",
  message: "",
  hp_extra_notes: "",
};

const VISIBLE_FIELDS: readonly VisibleField[] = [
  "name",
  "email",
  "phone",
  "preferredDate",
  "groupSize",
  "message",
];

/**
 * The email-us fallback: subject carries the listing title, body carries the
 * listing link and, when it fits in a mailto URL, what the visitor already
 * typed so they do not have to write it twice.
 */
function inquiryMailto(listingTitle: string, listingUrl: string, message?: string): string {
  const subject = `Pool inquiry: ${listingTitle}`.replace(/[\r\n]+/g, " ").slice(0, 200);
  const intro = `About this pool: ${listingUrl}\n\n`;
  const withMessage = message ? `${intro}${message}` : intro;
  const body = encodeURIComponent(withMessage).length <= 1500 ? withMessage : intro;
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

type Status =
  | { kind: "idle" }
  | { kind: "sent"; email: string }
  | { kind: "failed"; title: string; message: string };

interface Props {
  listingId: string;
  listingTitle: string;
}

export function ListingInquiryForm({ listingId, listingTitle }: Props) {
  const send = useServerFn(sendListingInquiry);
  const headingId = useId();
  const hpId = useId();
  const sentHeadingRef = useRef<HTMLHeadingElement>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [formNote, setFormNote] = useState<string | null>(null);
  // Set after mount: the server renders in UTC, the visitor's "today" is local.
  const [minDate, setMinDate] = useState<string | undefined>(undefined);
  useEffect(() => setMinDate(todayLocalIso()), []);

  const form = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(formSchema),
    defaultValues: EMPTY,
    mode: "onTouched",
  });

  const listingUrl = canonicalListingUrl(listingId, SITE_URL);
  const messageValue = form.watch("message") ?? "";

  useEffect(() => {
    if (status.kind === "sent") sentHeadingRef.current?.focus();
  }, [status.kind]);

  function fail(title: string, message: string) {
    setStatus({ kind: "failed", title, message });
  }

  async function onValid(values: FormOutput) {
    setFormNote(null);
    setStatus({ kind: "idle" });

    const payload: ListingInquiryPayload = {
      listingId,
      name: values.name,
      email: values.email,
      phone: values.phone || undefined,
      preferredDate: values.preferredDate || undefined,
      groupSize: values.groupSize ? Number(values.groupSize) : undefined,
      message: values.message,
      hp_extra_notes: values.hp_extra_notes,
    };

    let result: InquiryResult;
    try {
      result = await send({ data: payload });
    } catch {
      fail(
        "Message not sent",
        "Something went wrong sending your message. Please email us instead.",
      );
      return;
    }

    if (result.ok) {
      setStatus({ kind: "sent", email: values.email });
      form.reset(EMPTY);
      return;
    }

    if (result.reason === "invalid") {
      let first: VisibleField | null = null;
      for (const field of VISIBLE_FIELDS) {
        const msg = result.fieldErrors[field];
        if (msg) {
          form.setError(field, { type: "server", message: msg });
          first ??= field;
        }
      }
      if (first) {
        setFormNote(result.message);
        form.setFocus(first);
      } else {
        // Only the listing id was rejected: nothing the visitor can fix here.
        fail("Message not sent", "Something went wrong with this page. Please email us instead.");
      }
      return;
    }

    fail(
      result.reason === "listing_not_found" ? "Pool not found" : "Message not sent",
      result.message,
    );
  }

  function onInvalid() {
    setFormNote("Please check the highlighted fields.");
  }

  if (status.kind === "sent") {
    return (
      <section
        id="ask-about-this-pool"
        aria-labelledby={headingId}
        className="rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        <div role="status" aria-live="polite">
          <h2
            id={headingId}
            ref={sentHeadingRef}
            tabIndex={-1}
            className="text-lg font-semibold text-foreground focus:outline-none"
          >
            Thanks, your message is on its way
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We'll get back to you by email at{" "}
            <span className="break-words font-medium text-foreground">{status.email}</span>.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="mt-4 w-full rounded-full"
          onClick={() => setStatus({ kind: "idle" })}
        >
          Ask another question
        </Button>
      </section>
    );
  }

  const submitting = form.formState.isSubmitting;
  const mailto = inquiryMailto(listingTitle, listingUrl, messageValue.trim() || undefined);

  return (
    <section
      id="ask-about-this-pool"
      aria-labelledby={headingId}
      className="rounded-2xl border border-border bg-card p-6 shadow-sm"
    >
      <h2 id={headingId} className="text-lg font-semibold text-foreground">
        Ask about this pool
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Have a question before you book? Send it to the Pool Rental Near Me team and we'll get back
        to you by email.
      </p>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onValid, onInvalid)}
          noValidate
          className="mt-5 space-y-4"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your name</FormLabel>
                <FormControl>
                  <Input autoComplete="name" maxLength={LIMITS.nameMax} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    maxLength={LIMITS.emailMax}
                    {...field}
                  />
                </FormControl>
                <FormDescription>We'll reply to this address.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Phone <span className="font-normal text-muted-foreground">(optional)</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    maxLength={LIMITS.phoneMax}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="preferredDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Preferred date{" "}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </FormLabel>
                <FormControl>
                  <Input type="date" min={minDate} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="groupSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Group size <span className="font-normal text-muted-foreground">(optional)</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={3}
                    autoComplete="off"
                    {...field}
                  />
                </FormControl>
                <FormDescription>How many people, including you.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your question</FormLabel>
                <FormControl>
                  <Textarea
                    rows={5}
                    maxLength={LIMITS.messageMax}
                    className="min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Please don't include card numbers or your home address.{" "}
                  <span className="whitespace-nowrap">
                    {messageValue.length.toLocaleString("en-US")} /{" "}
                    {LIMITS.messageMax.toLocaleString("en-US")}
                  </span>
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Honeypot: off-screen, hidden from assistive tech, skipped by Tab.
              People never fill it; form-filling bots do. */}
          <div aria-hidden="true" className="sr-only">
            <label htmlFor={hpId}>Leave this field empty</label>
            <input
              id={hpId}
              type="text"
              tabIndex={-1}
              autoComplete="off"
              {...form.register("hp_extra_notes")}
            />
          </div>

          <div aria-live="polite">
            {formNote && <p className="text-sm font-medium text-destructive">{formNote}</p>}
          </div>

          {status.kind === "failed" && (
            <Alert variant="destructive">
              <AlertTitle>{status.title}</AlertTitle>
              <AlertDescription>
                <p>{status.message}</p>
                <p className="mt-2">
                  <a
                    href={mailto}
                    className="break-words font-semibold underline underline-offset-2"
                  >
                    Email {SUPPORT_EMAIL}
                  </a>
                </p>
              </AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={submitting}
            className="h-11 w-full rounded-full text-sm font-semibold"
          >
            {submitting ? "Sending…" : "Send message"}
          </Button>
        </form>
      </Form>
    </section>
  );
}
