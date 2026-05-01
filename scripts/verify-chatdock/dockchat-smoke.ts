/**
 * DockChat smoke test — proves the schema-corrected dockChatRoutes can
 * create a room, send a message, and list it back without 500'ing on the
 * old `content`/`metadata`/`client_message_id` columns.
 */
import express from "express";
import session from "express-session";
import http from "node:http";
import { pool, db } from "../../server/db";
import dockChatRouter from "../../server/routes/dockChatRoutes";
import { workspaces, users, employees } from "../../shared/schema";
import { eq } from "drizzle-orm";

const FIX = {
  workspaceId: "ws-dockchat-smoke",
  user: { id: "usr-dockchat-smoke", email: "smoke@dockchat.test", firstName: "Smoke", lastName: "Tester", employeeId: "emp-dockchat-smoke" },
};

async function main() {
  await db.delete(employees).where(eq(employees.workspaceId, FIX.workspaceId));
  await db.delete(workspaces).where(eq(workspaces.id, FIX.workspaceId));
  await db.delete(users).where(eq(users.id, FIX.user.id));

  await db.insert(users).values({
    id: FIX.user.id, email: FIX.user.email, firstName: FIX.user.firstName, lastName: FIX.user.lastName,
    role: 'employee', emailVerified: true, currentWorkspaceId: FIX.workspaceId,
  } as any).onConflictDoNothing();
  await db.insert(workspaces).values({
    id: FIX.workspaceId, name: 'DockChat Smoke', plan: 'free', ownerId: FIX.user.id,
  } as any).onConflictDoNothing();
  await db.insert(employees).values({
    id: FIX.user.employeeId, workspaceId: FIX.workspaceId, userId: FIX.user.id,
    firstName: FIX.user.firstName, lastName: FIX.user.lastName, email: FIX.user.email,
    status: 'active', isActive: true, workspaceRole: 'org_owner',
  } as any).onConflictDoNothing();

  const app = express();
  app.use(express.json());
  app.use(session({ secret: 'x'.repeat(32), resave: false, saveUninitialized: false }));
  app.use((req, _res, next) => {
    (req as any).session.userId = FIX.user.id;
    (req as any).session.workspaceId = FIX.workspaceId;
    (req as any).user = { id: FIX.user.id, firstName: FIX.user.firstName, lastName: FIX.user.lastName };
    (req as any).workspaceId = FIX.workspaceId;
    (req as any).workspaceRole = 'org_owner';
    next();
  });
  app.use('/api/chat/dock', dockChatRouter);

  const server = http.createServer(app);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as any).port;
  const base = `http://127.0.0.1:${port}`;

  let exit = 0;
  try {
    console.log('[1] POST /api/chat/dock/rooms');
    const create = await fetch(`${base}/api/chat/dock/rooms`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomName: `Smoke Room ${Date.now()}`, description: 'schema-corrected smoke' }),
    });
    const room = await create.json();
    console.log(`    status=${create.status} body=${JSON.stringify(room).slice(0, 200)}`);
    if (create.status !== 201 || !room.id) throw new Error(`create failed`);

    console.log('[2] POST /api/chat/dock/rooms/:id/messages');
    const send = await fetch(`${base}/api/chat/dock/rooms/${room.id}/messages`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'hello dockchat smoke' }),
    });
    const sent = await send.json();
    console.log(`    status=${send.status} body=${JSON.stringify(sent).slice(0, 200)}`);
    if (send.status !== 201 || !sent.id) throw new Error(`send failed`);

    console.log('[3] GET /api/chat/dock/rooms/:id/messages');
    const list = await fetch(`${base}/api/chat/dock/rooms/${room.id}/messages`);
    const list_body = await list.json();
    console.log(`    status=${list.status} count=${list_body.messages?.length || 0}`);
    if (list.status !== 200 || !Array.isArray(list_body.messages) || list_body.messages.length < 1) throw new Error(`list failed`);

    console.log('[4] POST /api/chat/dock/rooms/:id/messages with /help bot command');
    const cmd = await fetch(`${base}/api/chat/dock/rooms/${room.id}/messages`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: '/help' }),
    });
    const cmdBody = await cmd.json();
    console.log(`    status=${cmd.status} bot=${cmdBody.botResponse?.message?.slice(0, 60)}`);
    if (cmd.status !== 201 || !cmdBody.botResponse?.id) throw new Error(`bot command failed`);

    console.log('\n✓ DockChat schema-corrected SQL works end-to-end (4/4 PASS)');
  } catch (e: any) {
    console.error('✗ FAIL:', e?.message || e);
    exit = 1;
  } finally {
    server.close();
    await pool.end();
    process.exit(exit);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
