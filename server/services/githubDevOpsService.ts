/**
 * GitHub DevOps Service — Wave 24
 * ─────────────────────────────────────────────────────────────────────────────
 * Gives Trinity the ability to push documentation updates and code patches
 * to the CoAIleague GitHub repository.
 *
 * HARD CONSTRAINTS (cannot be overridden by any prompt):
 *   1. ONLY the `development` branch — never main, never production
 *   2. ALL commits MUST include `[AI-Generated]` in the message
 *   3. Docs-only commits (*.md) are auto-approved
 *   4. Code commits require human approval via approval queue
 *   5. Rate limit: 10 commits per 24-hour window (per workspace)
 *   6. Every operation logged to trinity_patch_log
 *   7. 3-Strike Rule enforced — strike 3 = 24hr lockout
 *
 * REQUIRED ENV VARS:
 *   OCTOKIT_GITHUB_TOKEN  — fine-grained PAT, development branch only
 *   GITHUB_REPO_OWNER     — e.g. "Coaileague"
 *   GITHUB_REPO_NAME      — e.g. "Coaileague"
 */

import { createLogger } from "../lib/logger";
import { pool } from "../db";

const log = createLogger("GitHubDevOps");

const ALLOWED_BRANCH = "development";
const COMMIT_MARKER  = "[AI-Generated]";
const RATE_LIMIT_PER_DAY = 10;

export interface GitHubCommitResult {
  success: boolean;
  sha?: string;
  url?: string;
  error?: string;
  rateLimitRemaining?: number;
}

export interface DevOpsHealthCheck {
  connected: boolean;
  branch: string;
  rateLimitRemaining: number;
  strikeCount: number;
  lastCommitAt: string | null;
  error?: string;
}

// ── Rate limit + strike tracking ────────────────────────────────────────────

async function getCommitCount(workspaceId: string): Promise<number> {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) FROM trinity_patch_log
       WHERE workspace_id = $1 AND created_at > NOW() - INTERVAL '24 hours'
       AND fix_description LIKE '%[AI-Generated]%'`,
      [workspaceId]
    );
    return parseInt(result.rows[0]?.count || "0");
  } catch {
    return 0;
  }
}

async function getStrikeCount(workspaceId: string): Promise<number> {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) FROM trinity_patch_log
       WHERE workspace_id = $1
       AND created_at > NOW() - INTERVAL '24 hours'
       AND strikes_used = 3`,
      [workspaceId]
    );
    return parseInt(result.rows[0]?.count || "0");
  } catch {
    return 0;
  }
}

async function logCommit(workspaceId: string, message: string, sha: string, success: boolean): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO trinity_patch_log
         (workspace_id, error_signature, fix_description, strikes_used, created_at)
       VALUES ($1, 'github_commit', $2, $3, NOW())`,
      [workspaceId, `${COMMIT_MARKER} ${message} — sha:${sha}`, success ? 1 : 3]
    );
  } catch (err: unknown) {
    log.warn("[GitHubDevOps] Patch log write failed (non-blocking):", err instanceof Error ? err.message : String(err));
  }
}

// ── GitHub API helper ────────────────────────────────────────────────────────

async function getOctokit() {
  const token = process.env.OCTOKIT_GITHUB_TOKEN;
  if (!token) throw new Error("OCTOKIT_GITHUB_TOKEN not configured");

  // Lazy import — only loaded when actually used
  const { Octokit } = await import("@octokit/rest").catch(() => {
    throw new Error("@octokit/rest not installed — run: npm install @octokit/rest");
  });
  return new Octokit({ auth: token });
}

function getRepoConfig() {
  return {
    owner: process.env.GITHUB_REPO_OWNER || "Coaileague",
    repo:  process.env.GITHUB_REPO_NAME  || "Coaileague",
  };
}

// ── Core operations ──────────────────────────────────────────────────────────

/**
 * Push a file update to the development branch.
 * Docs (*.md): auto-approved.
 * Code (*.ts, *.tsx): requires human approval first.
 */
export async function pushFileUpdate(
  workspaceId: string,
  filePath: string,
  content: string,
  commitMessage: string
): Promise<GitHubCommitResult> {
  // 1. Enforce [AI-Generated] marker
  const fullMessage = commitMessage.includes(COMMIT_MARKER)
    ? commitMessage
    : `${COMMIT_MARKER} ${commitMessage}`;

  // 2. Rate limit check
  const commitCount = await getCommitCount(workspaceId);
  if (commitCount >= RATE_LIMIT_PER_DAY) {
    return {
      success: false,
      error: `Daily commit limit (${RATE_LIMIT_PER_DAY}) reached. Resets in 24 hours.`,
      rateLimitRemaining: 0,
    };
  }

  // 3. Strike check
  const strikes = await getStrikeCount(workspaceId);
  if (strikes >= 3) {
    return {
      success: false,
      error: "3-Strike Rule: Trinity is locked from commits for 24 hours. Human review required.",
    };
  }

  // 4. Code files require human approval (docs are auto-approved)
  const isDocFile = filePath.endsWith(".md") || filePath.endsWith(".txt");
  if (!isDocFile) {
    return {
      success: false,
      error: `Code file commits require human approval. File: ${filePath}. Submit via approval queue first.`,
    };
  }

  try {
    const octokit = await getOctokit();
    const { owner, repo } = getRepoConfig();

    // Get current file SHA (needed for update)
    let currentSha: string | undefined;
    try {
      const { data } = await octokit.repos.getContent({
        owner, repo, path: filePath, ref: ALLOWED_BRANCH,
      });
      if (!Array.isArray(data)) {
        currentSha = (data as { sha: string }).sha;
      }
    } catch {
      // File doesn't exist yet — create it
    }

    // Push the update
    const { data } = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path:    filePath,
      message: fullMessage,
      content: Buffer.from(content).toString("base64"),
      branch:  ALLOWED_BRANCH,
      ...(currentSha ? { sha: currentSha } : {}),
      committer: {
        name:  "Trinity AI",
        email: "trinity@coaileague.ai",
      },
    });

    const sha = (data.commit as { sha: string }).sha || "unknown";
    await logCommit(workspaceId, fullMessage, sha, true);

    log.info(`[GitHubDevOps] Committed ${filePath} to ${ALLOWED_BRANCH} — ${sha.slice(0, 7)}`);
    return {
      success: true,
      sha,
      url: (data.commit as { html_url?: string }).html_url,
      rateLimitRemaining: RATE_LIMIT_PER_DAY - commitCount - 1,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    await logCommit(workspaceId, fullMessage, "failed", false);
    log.error("[GitHubDevOps] Push failed:", msg);
    return { success: false, error: msg };
  }
}

/**
 * Health check — for /test-devops slash command.
 */
export async function checkDevOpsHealth(workspaceId: string): Promise<DevOpsHealthCheck> {
  try {
    const octokit = await getOctokit();
    const { owner, repo } = getRepoConfig();

    // Verify branch exists
    await octokit.repos.getBranch({ owner, repo, branch: ALLOWED_BRANCH });

    const [commitCount, strikeCount, lastLog] = await Promise.all([
      getCommitCount(workspaceId),
      getStrikeCount(workspaceId),
      pool.query(
        `SELECT created_at FROM trinity_patch_log
         WHERE workspace_id = $1 AND fix_description LIKE '%[AI-Generated]%'
         ORDER BY created_at DESC LIMIT 1`,
        [workspaceId]
      ).then(r => r.rows[0]?.created_at || null).catch(() => null),
    ]);

    return {
      connected:           true,
      branch:              ALLOWED_BRANCH,
      rateLimitRemaining:  Math.max(0, RATE_LIMIT_PER_DAY - commitCount),
      strikeCount,
      lastCommitAt:        lastLog,
    };
  } catch (err: unknown) {
    return {
      connected:          false,
      branch:             ALLOWED_BRANCH,
      rateLimitRemaining: 0,
      strikeCount:        0,
      lastCommitAt:       null,
      error:              err instanceof Error ? err.message : String(err),
    };
  }
}

export const githubDevOpsService = { pushFileUpdate, checkDevOpsHealth };
