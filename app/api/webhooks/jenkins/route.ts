import { buildBlockKitForBuild } from "@/lib/integrations/blockKit";
import type { BuildEvent, BuildStatus } from "@/lib/integrations/types";

/**
 * POST /api/webhooks/jenkins
 *
 * Real-build entry point. In production the simulator is swapped for a
 * persisted store; the response shape is what a future server build
 * would announce to #deployment/#general. In demo (simulated) mode the
 * matching flow runs client-side via the Jenkins section on Profile.
 *
 * Guards:
 *  - Requires `X-Jenkins-Secret` to equal `JENKINS_WEBHOOK_SECRET`.
 *  - Rejects `POST` payloads that are not a valid build event.
 *
 * Secrets are read from environment variables only — never hardcoded.
 */
export async function POST(request: Request) {
  const secret = process.env.JENKINS_WEBHOOK_SECRET;
  const header = request.headers.get("x-jenkins-secret");

  if (!secret || header !== secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let raw: Record<string, unknown>;
  try {
    raw = (await request.json()) as Record<string, unknown>;
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const jobName = typeof raw?.jobName === "string" ? raw.jobName.trim() : "";
  const status = String(raw?.status ?? "");
  const logUrl =
    typeof raw?.logUrl === "string" ? raw.logUrl : "";
  if (!jobName || !["started", "success", "failed"].includes(status)) {
    return Response.json(
      { error: "jobName (string) and status (started|success|failed) required" },
      { status: 422 }
    );
  }

  const buildNumber =
    typeof raw.buildNumber === "number" && raw.buildNumber > 0
      ? raw.buildNumber
      : Date.now();

  const event: BuildEvent = {
    id: `bld_webhook_${buildNumber}_${Math.random().toString(36).slice(2, 7)}`,
    source: "jenkins",
    jobName,
    status: status as BuildStatus,
    buildNumber,
    logUrl,
    timestamp: new Date().toISOString(),
    postedToChannelIds: [],
  };

  return Response.json(
    {
      ok: true,
      acknowledged: true,
      message: `Build #${buildNumber} accepted. Simulated posting to #deployment${
        event.status === "failed" ? " + alert to #general" : ""
      }.`,
      blocks: buildBlockKitForBuild(event),
    },
    { status: 202 }
  );
}