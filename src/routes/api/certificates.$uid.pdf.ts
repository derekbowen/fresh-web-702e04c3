import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Generates a branded single-page PDF certificate using a hand-built minimal
// PDF. Pure JS / no native deps — safe in the Worker SSR runtime.

function escapePdf(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildPdf(opts: {
  learnerName: string;
  courseTitle: string;
  completedOn: string;
  certificateUid: string;
  verifyUrl: string;
}): Uint8Array {
  // Page size: 792 x 612 (US Letter, landscape)
  const W = 792;
  const H = 612;

  // Build content stream — a few rectangles for borders + centered text.
  const lines: string[] = [];
  const push = (s: string) => lines.push(s);

  // Background border
  push("q");
  push("0.05 0.35 0.6 RG"); // border color (primary-ish blue)
  push("4 w");
  push(`24 24 ${W - 48} ${H - 48} re S`);
  push("1 w");
  push(`36 36 ${W - 72} ${H - 72} re S`);
  push("Q");

  // Title
  push("BT");
  push("/F2 36 Tf");
  push("0.05 0.35 0.6 rg");
  const title = "Certificate of Completion";
  // Approximate centering for Helvetica-Bold 36pt
  const titleWidth = title.length * 18;
  push(`${(W - titleWidth) / 2} ${H - 130} Td`);
  push(`(${escapePdf(title)}) Tj`);
  push("ET");

  // "Awarded to"
  push("BT");
  push("/F1 14 Tf");
  push("0.3 0.3 0.3 rg");
  const awarded = "This is to certify that";
  push(`${(W - awarded.length * 7) / 2} ${H - 200} Td`);
  push(`(${escapePdf(awarded)}) Tj`);
  push("ET");

  // Learner name
  push("BT");
  push("/F2 32 Tf");
  push("0 0 0 rg");
  const nameWidth = opts.learnerName.length * 16;
  push(`${(W - nameWidth) / 2} ${H - 260} Td`);
  push(`(${escapePdf(opts.learnerName)}) Tj`);
  push("ET");

  // "has successfully completed"
  push("BT");
  push("/F1 14 Tf");
  push("0.3 0.3 0.3 rg");
  const completed = "has successfully completed the course";
  push(`${(W - completed.length * 7) / 2} ${H - 310} Td`);
  push(`(${escapePdf(completed)}) Tj`);
  push("ET");

  // Course title
  push("BT");
  push("/F2 22 Tf");
  push("0.05 0.35 0.6 rg");
  const courseWidth = opts.courseTitle.length * 11;
  push(`${(W - courseWidth) / 2} ${H - 360} Td`);
  push(`(${escapePdf(opts.courseTitle)}) Tj`);
  push("ET");

  // Date
  push("BT");
  push("/F1 14 Tf");
  push("0.3 0.3 0.3 rg");
  const dateLine = `Completed on ${opts.completedOn}`;
  push(`${(W - dateLine.length * 7) / 2} ${H - 410} Td`);
  push(`(${escapePdf(dateLine)}) Tj`);
  push("ET");

  // Footer left — issuer
  push("BT");
  push("/F2 12 Tf");
  push("0 0 0 rg");
  push(`70 90 Td`);
  push(`(Pool Rental Near Me Academy) Tj`);
  push("ET");
  push("BT");
  push("/F1 10 Tf");
  push("0.4 0.4 0.4 rg");
  push(`70 72 Td`);
  push(`(Issuing organization) Tj`);
  push("ET");

  // Footer right — cert id + verify URL
  push("BT");
  push("/F2 12 Tf");
  push("0 0 0 rg");
  const idLine = `ID ${opts.certificateUid}`;
  push(`${W - 70 - idLine.length * 6} 90 Td`);
  push(`(${escapePdf(idLine)}) Tj`);
  push("ET");
  push("BT");
  push("/F1 10 Tf");
  push("0.4 0.4 0.4 rg");
  push(`${W - 70 - opts.verifyUrl.length * 5} 72 Td`);
  push(`(Verify at ${escapePdf(opts.verifyUrl)}) Tj`);
  push("ET");

  const content = lines.join("\n");
  const contentBytes = new TextEncoder().encode(content);

  // Assemble PDF objects.
  const objects: string[] = [];
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");
  objects.push(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>`,
  );
  objects.push(`<< /Length ${contentBytes.length} >>\nstream\n${content}\nendstream`);
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");

  let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const offsets: number[] = [];
  for (let i = 0; i < objects.length; i++) {
    offsets.push(new TextEncoder().encode(pdf).length);
    pdf += `${i + 1} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefOffset = new TextEncoder().encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    pdf += `${off.toString().padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return new TextEncoder().encode(pdf);
}

export const Route = createFileRoute("/api/certificates/$uid/pdf")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        // The route file `certificates.$uid.pdf.ts` resolves to /api/certificates/$uid/pdf.
        // (TanStack treats trailing `.pdf` as a path segment.)
        const uid = params.uid;
        if (!/^[A-Z0-9-]{6,40}$/.test(uid)) {
          return new Response("Bad request", { status: 400 });
        }

        const { data, error } = await supabaseAdmin
          .from("course_completions")
          .select("certificate_uid, course_title, learner_name, completed_at, revoked_at")
          .eq("certificate_uid", uid)
          .maybeSingle();

        if (error) return new Response("Server error", { status: 500 });
        if (!data) return new Response("Not found", { status: 404 });
        if (data.revoked_at) {
          return new Response("Certificate has been revoked", { status: 410 });
        }

        const origin = new URL(request.url).origin;
        const pdf = buildPdf({
          learnerName: data.learner_name as string,
          courseTitle: data.course_title as string,
          completedOn: new Date(data.completed_at as string).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          certificateUid: data.certificate_uid as string,
          verifyUrl: `${origin}/verify/${data.certificate_uid}`,
        });

        return new Response(pdf as BlobPart as BodyInit, {
          status: 200,
          headers: {
            "content-type": "application/pdf",
            "content-disposition": `inline; filename="${data.certificate_uid}.pdf"`,
            "cache-control": "private, max-age=300",
          },
        });
      },
    },
  },
});
