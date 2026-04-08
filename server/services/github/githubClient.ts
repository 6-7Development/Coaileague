// GitHub Integration Client
//
// Railway-only: the legacy Replit connector path
// (REPLIT_CONNECTORS_HOSTNAME + REPL_IDENTITY) has been removed. GitHub
// access is now driven exclusively by the GITHUB_TOKEN env variable.
// Configure GITHUB_TOKEN in Railway → set it to a personal access token
// or a fine-grained PAT with the scopes your use case needs (repo for
// read/write, admin:org for org management, etc.).

import { Octokit } from '@octokit/rest';
import { PLATFORM } from '../../config/platformConfig';

function getGitHubToken(): string {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error(
      'GITHUB_TOKEN not configured. Set it in Railway env vars with the scopes required for GitHub operations.',
    );
  }
  return token;
}

// WARNING: Never cache this client.
// Tokens can be rotated; a new client each call picks up the rotation.
export async function getUncachableGitHubClient(): Promise<Octokit> {
  return new Octokit({ auth: getGitHubToken() });
}

// Get authenticated user info
export async function getGitHubUser() {
  const client = await getUncachableGitHubClient();
  const { data } = await client.users.getAuthenticated();
  return data;
}

// Create a new repository
export async function createRepository(name: string, description?: string, isPrivate: boolean = true) {
  const client = await getUncachableGitHubClient();
  const { data } = await client.repos.createForAuthenticatedUser({
    name,
    description: description || PLATFORM.name + " - AI-Powered Workforce Intelligence Platform",
    private: isPrivate,
    auto_init: false,
  });
  return data;
}

// Check if repository exists
export async function checkRepositoryExists(owner: string, repo: string): Promise<boolean> {
  const client = await getUncachableGitHubClient();
  try {
    await client.repos.get({ owner, repo });
    return true;
  } catch (error: any) {
    if (error.status === 404) {
      return false;
    }
    throw error;
  }
}
