import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  enrollInCourse,
  getMyCourseProgress,
  getMyCourseStatus,
  logProgressEvent,
  markCourseComplete,
  recordHeartbeat,
  type CourseProgress,
  type LearnerCourseStatus,
} from "@/server/learning.functions";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

type Props = {
  courseSlug: string;
  courseTitle: string;
  expectedMinutes?: number;
};

const HEARTBEAT_INTERVAL_MS = 30_000;

export function CourseLearningControls({ courseSlug, courseTitle, expectedMinutes }: Props) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [status, setStatus] = useState<LearnerCourseStatus | null>(null);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [busy, setBusy] = useState(false);
  const visibleRef = useRef(true);

  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(async ({ data }) => {
      if (!active) return;
      const isIn = !!data.user;
      setSignedIn(isIn);
      if (isIn) {
        try {
          const [s, p] = await Promise.all([
            getMyCourseStatus({ data: { course_slug: courseSlug } }),
            getMyCourseProgress({ data: { course_slug: courseSlug } }),
          ]);
          if (active) {
            setStatus(s);
            setProgress(p);
          }
        } catch (e) {
          console.error(e);
        }
      }
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setSignedIn(!!session?.user);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [courseSlug]);

  // Heartbeat: ping every 30s when tab is visible, signed in, enrolled, and not yet complete
  useEffect(() => {
    if (!signedIn || !status?.is_enrolled || status?.is_completed) return;

    const onVis = () => {
      visibleRef.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVis);
    visibleRef.current = document.visibilityState === "visible";

    const tick = async () => {
      if (!visibleRef.current) return;
      try {
        const next = await recordHeartbeat({
          data: {
            course_slug: courseSlug,
            seconds_delta: Math.round(HEARTBEAT_INTERVAL_MS / 1000),
            expected_minutes: expectedMinutes,
          },
        });
        setProgress(next);
      } catch (e) {
        console.warn("heartbeat failed", e);
      }
    };

    const id = window.setInterval(tick, HEARTBEAT_INTERVAL_MS);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [signedIn, status?.is_enrolled, status?.is_completed, courseSlug, expectedMinutes]);

  async function onEnroll() {
    setBusy(true);
    try {
      await enrollInCourse({ data: { course_slug: courseSlug } });
      const [s, p] = await Promise.all([
        getMyCourseStatus({ data: { course_slug: courseSlug } }),
        getMyCourseProgress({ data: { course_slug: courseSlug } }),
      ]);
      setStatus(s);
      setProgress(p);
      toast.success("You're enrolled. Watch the course, then mark it complete.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to enroll.");
    } finally {
      setBusy(false);
    }
  }

  async function onComplete() {
    setBusy(true);
    try {
      // Log the click event (best-effort)
      void logProgressEvent({
        data: { course_slug: courseSlug, event_type: "mark_complete_clicked" },
      }).catch(() => {});
      const res = await markCourseComplete({ data: { course_slug: courseSlug } });
      const [s, p] = await Promise.all([
        getMyCourseStatus({ data: { course_slug: courseSlug } }),
        getMyCourseProgress({ data: { course_slug: courseSlug } }),
      ]);
      setStatus(s);
      setProgress(p);
      toast.success(
        res.already
          ? "Already completed — your certificate is ready."
          : "Course complete! Your certificate is ready.",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to record completion.");
    } finally {
      setBusy(false);
    }
  }

  function onCertificateClick() {
    void logProgressEvent({
      data: { course_slug: courseSlug, event_type: "certificate_downloaded" },
    }).catch(() => {});
  }

  const pct = status?.is_completed ? 100 : progress?.progress_pct ?? 0;
  const showProgressBar = signedIn && status?.is_enrolled;

  return (
    <div className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground">Track your progress</h3>
          <p className="text-xs text-muted-foreground">
            Earn a verifiable certificate for {courseTitle}.
          </p>
        </div>

        {signedIn === null ? (
          <Button disabled variant="outline">Loading…</Button>
        ) : !signedIn ? (
          <Button asChild>
            <Link
              to="/auth"
              search={{
                mode: "signup",
                redirect: typeof window !== "undefined" ? window.location.pathname : "/academy",
              }}
            >
              Sign up to track progress
            </Link>
          </Button>
        ) : status?.is_completed && status.certificate_uid ? (
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" onClick={onCertificateClick}>
              <a
                href={`/api/certificates/${status.certificate_uid}.pdf`}
                target="_blank"
                rel="noreferrer"
              >
                Download certificate
              </a>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/verify/$uid" params={{ uid: status.certificate_uid }}>
                Verify
              </Link>
            </Button>
          </div>
        ) : status?.is_enrolled ? (
          <Button onClick={onComplete} disabled={busy}>
            {busy ? "Saving…" : "Mark course complete"}
          </Button>
        ) : (
          <Button onClick={onEnroll} disabled={busy}>
            {busy ? "Enrolling…" : "Enroll in this course"}
          </Button>
        )}
      </div>

      {showProgressBar && (
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>{status?.is_completed ? "Completed" : "Progress"}</span>
            <span className="font-medium text-foreground">{pct}%</span>
          </div>
          <Progress value={pct} aria-label={`Course progress: ${pct}%`} />
          {!status?.is_completed && (
            <p className="mt-2 text-[11px] text-muted-foreground">
              Progress updates automatically while this tab is open.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
