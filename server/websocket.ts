import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { storage } from './storage';
import type { ChatMessage } from '@shared/schema';

interface WebSocketClient extends WebSocket {
  userId?: string;
  workspaceId?: string;
  conversationId?: string;
}

interface ChatMessagePayload {
  type: 'chat_message';
  conversationId: string;
  message: string;
  senderName: string;
  senderType: 'customer' | 'support' | 'system';
}

interface JoinConversationPayload {
  type: 'join_conversation';
  conversationId: string;
  userId: string; // Will be validated server-side
}

interface TypingPayload {
  type: 'typing';
  userId: string;
  isTyping: boolean;
}

type WebSocketMessage = ChatMessagePayload | JoinConversationPayload | TypingPayload;

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ 
    server,
    path: '/ws/chat'
  });

  // Track active connections by conversation ID
  const conversationClients = new Map<string, Set<WebSocketClient>>();

  wss.on('connection', (ws: WebSocketClient) => {
    console.log('New WebSocket connection established');

    ws.on('message', async (data: string) => {
      try {
        const payload: WebSocketMessage = JSON.parse(data.toString());

        switch (payload.type) {
          case 'join_conversation': {
            // SECURITY: Verify conversation exists before allowing join
            const conversation = await storage.getChatConversation(payload.conversationId);
            if (!conversation) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Conversation not found',
              }));
              return;
            }

            // HELPDESK ACCESS CONTROL: Check if this is a HelpDesk room
            try {
              const supportRoom = await storage.getSupportRoomByConversationId(payload.conversationId);
              
              if (supportRoom) {
                // This is a HelpDesk room - enforce ticket-based access control
                
                // SECURITY: Check if user is platform staff FIRST (staff bypass status restrictions)
                const platformRole = await storage.getUserPlatformRole(payload.userId);
                const isStaff = platformRole && ['platform_admin', 'deputy_admin', 'deputy_assistant', 'sysop'].includes(platformRole);

                if (isStaff) {
                  // Staff always allowed, even when room is closed (for monitoring/administration)
                  console.log(`User ${payload.userId} granted HelpDesk access (staff bypass - room status: ${supportRoom.status})`);
                } else {
                  // Non-staff clients: enforce room status and ticket access
                  
                  // Check room status - clients can only join when room is open
                  if (supportRoom.status !== 'open') {
                    ws.send(JSON.stringify({
                      type: 'error',
                      message: `HelpDesk is currently ${supportRoom.status}`,
                      statusMessage: supportRoom.statusMessage || undefined,
                      roomStatus: supportRoom.status,
                    }));
                    return;
                  }

                  // Check ticket-based access
                  const hasAccess = await storage.checkTicketAccess(payload.userId, supportRoom.id);
                  
                  if (!hasAccess) {
                    ws.send(JSON.stringify({
                      type: 'error',
                      message: 'Access denied. Please verify your support ticket first.',
                      requiresTicket: true,
                    }));
                    return;
                  }
                  
                  console.log(`User ${payload.userId} granted HelpDesk access (ticket-based)`);
                }
              }
            } catch (helpdeskError) {
              // ERROR HANDLING: HelpDesk metadata lookup failed (database issue, etc.)
              console.error('HelpDesk access control error:', helpdeskError);
              
              // Allow staff to proceed in degraded mode, block others
              try {
                const platformRole = await storage.getUserPlatformRole(payload.userId);
                const isStaff = platformRole && ['platform_admin', 'deputy_admin', 'deputy_assistant', 'sysop'].includes(platformRole);
                
                if (isStaff) {
                  console.warn(`Staff user ${payload.userId} allowed despite HelpDesk metadata failure (degraded mode)`);
                } else {
                  // Non-staff users cannot be verified - reject for safety
                  ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Unable to verify HelpDesk access. Please try again later.',
                    temporaryError: true,
                  }));
                  return;
                }
              } catch (roleError) {
                // Cannot determine role - fail closed for security
                console.error('Unable to determine user role during HelpDesk error:', roleError);
                ws.send(JSON.stringify({
                  type: 'error',
                  message: 'Access verification unavailable. Please try again later.',
                  temporaryError: true,
                }));
                return;
              }
            }

            // Associate this client with the conversation (trust userId from payload for now)
            // TODO: In production, extract userId from authenticated session token
            ws.userId = payload.userId;
            ws.workspaceId = conversation.workspaceId;
            ws.conversationId = payload.conversationId;

            if (!conversationClients.has(payload.conversationId)) {
              conversationClients.set(payload.conversationId, new Set());
            }
            conversationClients.get(payload.conversationId)!.add(ws);

            // Send conversation history
            const messages = await storage.getChatMessagesByConversation(payload.conversationId);
            ws.send(JSON.stringify({
              type: 'conversation_history',
              messages,
            }));

            // Mark messages as read
            await storage.markMessagesAsRead(payload.conversationId, payload.userId);

            console.log(`User ${payload.userId} joined conversation ${payload.conversationId}`);
            break;
          }

          case 'chat_message': {
            if (!ws.conversationId || !ws.userId) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Must join a conversation first',
              }));
              return;
            }

            // SECURITY: Enforce that message goes to the joined conversation only
            if (payload.conversationId !== ws.conversationId) {
              ws.send(JSON.stringify({
                type: 'error',
                message: 'Cannot send message to different conversation',
              }));
              return;
            }

            // Save message to database
            const savedMessage = await storage.createChatMessage({
              conversationId: ws.conversationId, // Use server-bound conversation, not client payload
              senderId: ws.userId,
              senderName: payload.senderName,
              senderType: payload.senderType,
              message: payload.message,
              messageType: 'text',
            });

            // Broadcast to all clients in this conversation
            const clients = conversationClients.get(ws.conversationId);
            if (clients) {
              const messagePayload = JSON.stringify({
                type: 'new_message',
                message: savedMessage,
              });

              clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(messagePayload);
                }
              });
            }
            break;
          }

          case 'typing': {
            if (!ws.conversationId || !ws.userId) {
              return;
            }

            // Broadcast typing status to other clients in same conversation
            const clients = conversationClients.get(ws.conversationId);
            if (clients) {
              const typingPayload = JSON.stringify({
                type: 'user_typing',
                userId: ws.userId,
                isTyping: payload.isTyping,
              });

              clients.forEach((client) => {
                if (client !== ws && client.readyState === WebSocket.OPEN) {
                  client.send(typingPayload);
                }
              });
            }
            break;
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Failed to process message',
        }));
      }
    });

    ws.on('close', () => {
      // Remove client from conversation
      if (ws.conversationId) {
        const clients = conversationClients.get(ws.conversationId);
        if (clients) {
          clients.delete(ws);
          if (clients.size === 0) {
            conversationClients.delete(ws.conversationId);
          }
        }
      }
      console.log('WebSocket connection closed');
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  console.log('WebSocket server initialized on /ws/chat');
  return wss;
}
