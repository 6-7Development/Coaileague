import type { Express, RequestHandler, Router } from "express";
import { requireAuth } from "../../auth";
import { ensureWorkspaceAccess } from "../../middleware/workspaceScope";

type MountHandler = RequestHandler | Router;

export type RouteMount = readonly [
  path: string,
  ...handlers: MountHandler[],
];

export type WorkspaceRouteMount = readonly [
  path: string,
  router: MountHandler,
];

export function mountRoutes(
  app: Express,
  mounts: readonly RouteMount[],
): void {
  for (const [path, ...handlers] of mounts) {
    app.use(path, ...handlers);
  }
}

export function mountWorkspaceRoutes(
  app: Express,
  mounts: readonly WorkspaceRouteMount[],
): void {
  for (const [path, router] of mounts) {
    app.use(path, requireAuth, ensureWorkspaceAccess, router);
  }
}
