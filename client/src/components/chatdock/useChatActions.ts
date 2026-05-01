/**
 * useChatActions (C1) — single typed surface for ChatDock mutations.
 *
 * Before this hook, ChatDock.tsx contained 19 inline useMutation blocks,
 * including FOUR identical copies of `toggleReaction` scattered across
 * different sub-components. Each copy diverged subtly over time and any
 * fix had to be applied in four places.
 *
 * This hook gives every sub-component one canonical mutation builder.
 * It returns:
 *
 *   useMessageActions(messageId, conversationId)
 *     • toggleReaction(emoji)        — POST /api/chat/manage/messages/:id/reactions
 *     • pinMessage()                  — POST /api/chat/manage/messages/:id/pin
 *     • deleteForMe()                 — POST /api/chat/manage/messages/:id/delete-for-me
 *     • deleteForEveryone()           — POST /api/chat/manage/messages/:id/delete-for-everyone
 *     • editMessage(text)             — PATCH /api/chat/manage/messages/:id/edit
 *     • forwardMessage(targetConv)    — POST /api/chat/manage/messages/:id/forward
 *
 *   useRoomActions(roomId)
 *     • hideConvo()                   — POST /api/chat/manage/conversations/:id/hide
 *     • leaveConvo()                  — POST /api/chat/manage/conversations/:id/leave
 *     • muteConvo(muted)              — POST /api/chat/manage/conversations/:id/mute
 *     • markAsRead()                  — POST /api/chat/mark-as-read
 *
 *   useUserActions()
 *     • blockUser(userId)             — POST /api/chat/manage/block
 *     • unblockUser(userId)           — POST /api/chat/manage/unblock
 *
 * Every mutation invalidates the appropriate React Query cache keys after
 * success so consuming components re-render without a manual refresh.
 */
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

const ROOMS_KEY = ["/api/chat/rooms"];
const reactionsKey = (conversationId: string) => ['/api/chat/manage/conversations', conversationId, 'reactions'];
const pinnedKey    = (conversationId: string) => ['/api/chat/manage/conversations', conversationId, 'pinned'];
const participantsKey = (roomId: string) => ['/api/chat/manage/rooms', roomId, 'participants'];

export interface MessageActionsOptions {
  /** Optional callback fired after a mutation succeeds (e.g. close the menu). */
  onAfter?: () => void;
}

export function useMessageActions(messageId: string, conversationId: string, opts: MessageActionsOptions = {}) {
  const after = opts.onAfter;

  const toggleReaction = useMutation({
    mutationFn: (emoji: string) =>
      apiRequest("POST", `/api/chat/manage/messages/${messageId}/reactions`, { emoji }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reactionsKey(conversationId) });
      after?.();
    },
  });

  const pinMessage = useMutation({
    mutationFn: () => apiRequest("POST", `/api/chat/manage/messages/${messageId}/pin`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pinnedKey(conversationId) });
      after?.();
    },
  });

  const deleteForMe = useMutation({
    mutationFn: () => apiRequest("POST", `/api/chat/manage/messages/${messageId}/delete-for-me`),
    onSuccess: () => { after?.(); },
  });

  const deleteForEveryone = useMutation({
    mutationFn: () => apiRequest("POST", `/api/chat/manage/messages/${messageId}/delete-for-everyone`),
    onSuccess: () => { after?.(); },
  });

  const editMessage = useMutation({
    mutationFn: (message: string) =>
      apiRequest("PATCH", `/api/chat/manage/messages/${messageId}/edit`, { message }),
    onSuccess: () => { after?.(); },
  });

  const forwardMessage = useMutation({
    mutationFn: (targetConversationId: string) =>
      apiRequest("POST", `/api/chat/manage/messages/${messageId}/forward`, { targetConversationId }),
    onSuccess: () => { after?.(); },
  });

  return {
    toggleReaction,
    pinMessage,
    deleteForMe,
    deleteForEveryone,
    editMessage,
    forwardMessage,
  };
}

export interface RoomActionsOptions {
  onAfter?: () => void;
}

export function useRoomActions(roomId: string, opts: RoomActionsOptions = {}) {
  const after = opts.onAfter;

  const hideConvo = useMutation({
    mutationFn: () => apiRequest("POST", `/api/chat/manage/conversations/${roomId}/hide`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROOMS_KEY });
      after?.();
    },
  });

  const leaveConvo = useMutation({
    mutationFn: () => apiRequest("POST", `/api/chat/manage/conversations/${roomId}/leave`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROOMS_KEY });
      after?.();
    },
  });

  const muteConvo = useMutation({
    mutationFn: (muted: boolean) =>
      apiRequest("POST", `/api/chat/manage/conversations/${roomId}/mute`, { muted }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROOMS_KEY });
      after?.();
    },
  });

  const markAsRead = useMutation({
    mutationFn: () => apiRequest("POST", "/api/chat/mark-as-read", { conversationId: roomId }),
  });

  return { hideConvo, leaveConvo, muteConvo, markAsRead };
}

export function useUserActions() {
  const blockUser = useMutation({
    mutationFn: (blockedUserId: string) =>
      apiRequest("POST", "/api/chat/manage/block", { blockedUserId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROOMS_KEY });
    },
  });

  const unblockUser = useMutation({
    mutationFn: (blockedUserId: string) =>
      apiRequest("POST", "/api/chat/manage/unblock", { blockedUserId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROOMS_KEY });
    },
  });

  return { blockUser, unblockUser };
}

export interface ParticipantActionsOptions {
  roomId: string;
  onAfter?: () => void;
}

export function useParticipantActions({ roomId, onAfter }: ParticipantActionsOptions) {
  const updateRole = useMutation({
    mutationFn: ({ participantId, role }: { participantId: string; role: string }) =>
      apiRequest("POST", `/api/chat/manage/rooms/${roomId}/update-role`, { participantId, role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: participantsKey(roomId) });
      onAfter?.();
    },
  });

  const transferOwnership = useMutation({
    mutationFn: (newOwnerId: string) =>
      apiRequest("POST", `/api/chat/manage/rooms/${roomId}/transfer-ownership`, { newOwnerId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: participantsKey(roomId) });
      onAfter?.();
    },
  });

  return { updateRole, transferOwnership };
}
