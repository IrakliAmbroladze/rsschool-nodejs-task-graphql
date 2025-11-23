import { PrismaClient } from '@prisma/client';
import DataLoader from 'dataloader';

export const createDataLoaders = async (prisma: PrismaClient) => {
  const userLoader = new DataLoader(async (ids: readonly string[]) => {
    const users = await prisma.user.findMany({
      where: { id: { in: [...ids] } },
    });
    const userMap = new Map(users.map((user) => [user.id, user]));
    return ids.map((id) => userMap.get(id) || null);
  });

  const profileLoader = new DataLoader(async (userIds: readonly string[]) => {
    const profiles = await prisma.profile.findMany({
      where: { userId: { in: [...userIds] } },
    });
    const profileMap = new Map(profiles.map((profile) => [profile.userId, profile]));
    return userIds.map((userId) => profileMap.get(userId) || null);
  });

  const postsLoader = new DataLoader(async (authorIds: readonly string[]) => {
    const posts = await prisma.post.findMany({
      where: { authorId: { in: [...authorIds] } },
    });
    const postsMap = new Map<string, typeof posts>();
    authorIds.forEach((id) => postsMap.set(id, []));
    posts.forEach((post) => {
      const authorPosts = postsMap.get(post.authorId);
      if (authorPosts) {
        authorPosts.push(post);
      }
    });
    return authorIds.map((id) => postsMap.get(id) || []);
  });

  const memberTypeLoader = new DataLoader(async (ids: readonly string[]) => {
    const memberTypes = await prisma.memberType.findMany({
      where: { id: { in: [...ids] } },
    });
    const memberTypeMap = new Map(memberTypes.map((mt) => [mt.id, mt]));
    return ids.map((id) => memberTypeMap.get(id) || null);
  });

  const userSubscribedToLoader = new DataLoader(
    async (subscriberIds: readonly string[]) => {
      const subscriptions = await prisma.subscribersOnAuthors.findMany({
        where: { subscriberId: { in: [...subscriberIds] } },
        include: { author: true },
      });
      const subsMap = new Map<string, (typeof subscriptions)[0]['author'][]>();
      subscriberIds.forEach((id) => subsMap.set(id, []));
      subscriptions.forEach((sub) => {
        const authors = subsMap.get(sub.subscriberId);
        if (authors) {
          authors.push(sub.author);
        }
      });
      return subscriberIds.map((id) => subsMap.get(id) || []);
    },
  );

  const subscribedToUserLoader = new DataLoader(async (authorIds: readonly string[]) => {
    const subscriptions = await prisma.subscribersOnAuthors.findMany({
      where: { authorId: { in: [...authorIds] } },
      include: { subscriber: true },
    });
    const subsMap = new Map<string, (typeof subscriptions)[0]['subscriber'][]>();
    authorIds.forEach((id) => subsMap.set(id, []));
    subscriptions.forEach((sub) => {
      const subscribers = subsMap.get(sub.authorId);
      if (subscribers) {
        subscribers.push(sub.subscriber);
      }
    });
    return authorIds.map((id) => subsMap.get(id) || []);
  });
  return {
    userLoader,
    profileLoader,
    postsLoader,
    memberTypeLoader,
    userSubscribedToLoader,
    subscribedToUserLoader,
  };
};
