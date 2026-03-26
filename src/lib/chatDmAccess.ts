import { prisma } from "@/lib/prisma";
import { ChatDmRequestStatus, MemberFollowStatus } from "@prisma/client";

export type PrivateDmAccessState =
  | "allowed"
  | "need_request"
  | "pending_out"
  | "pending_in"
  | "declined_out";

export type PrivateDmAccess = {
  allowed: boolean;
  state: PrivateDmAccessState;
  /** Hanya untuk pending_in: siapa yang meminta */
  requesterId?: string;
  requesterName?: string | null;
  introMessage?: string | null;
};

function orderedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export async function getPrivateDmAccess(
  viewerId: string,
  peerId: string
): Promise<PrivateDmAccess> {
  if (viewerId === peerId) {
    return { allowed: true, state: "allowed" };
  }

  const followToPeer = await prisma.memberFollow.findUnique({
    where: {
      followerId_followingId: { followerId: viewerId, followingId: peerId },
    },
  });
  if (followToPeer?.status === MemberFollowStatus.ACCEPTED) {
    return { allowed: true, state: "allowed" };
  }

  const [u1, u2] = orderedPair(viewerId, peerId);
  const existingConv = await prisma.chatConversation.findUnique({
    where: { userAId_userBId: { userAId: u1, userBId: u2 } },
    include: { messages: { take: 1 } },
  });
  if (existingConv && existingConv.messages.length > 0) {
    return { allowed: true, state: "allowed" };
  }

  const reqAsRequester = await prisma.chatDmRequest.findUnique({
    where: {
      requesterId_targetId: { requesterId: viewerId, targetId: peerId },
    },
    include: { target: { select: { name: true } } },
  });
  if (reqAsRequester) {
    if (reqAsRequester.status === ChatDmRequestStatus.ACCEPTED) {
      return { allowed: true, state: "allowed" };
    }
    if (reqAsRequester.status === ChatDmRequestStatus.PENDING) {
      return { allowed: false, state: "pending_out" };
    }
    return { allowed: false, state: "declined_out" };
  }

  const reqAsTarget = await prisma.chatDmRequest.findUnique({
    where: {
      requesterId_targetId: { requesterId: peerId, targetId: viewerId },
    },
    include: { requester: { select: { name: true } } },
  });
  if (reqAsTarget?.status === ChatDmRequestStatus.PENDING) {
    return {
      allowed: false,
      state: "pending_in",
      requesterId: peerId,
      requesterName: reqAsTarget.requester.name,
      introMessage: reqAsTarget.introMessage,
    };
  }
  if (reqAsTarget?.status === ChatDmRequestStatus.ACCEPTED) {
    return { allowed: true, state: "allowed" };
  }

  return { allowed: false, state: "need_request" };
}
