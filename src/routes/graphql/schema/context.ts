import type { PrismaClient, User, Profile, Post, MemberType } from '@prisma/client';
import type DataLoader from 'dataloader';

export interface GraphQLContext {
  prisma: PrismaClient;
  userLoader: DataLoader<string, User | null>;
  profileLoader: DataLoader<string, Profile | null>;
  postsLoader: DataLoader<string, Post[]>;
  memberTypeLoader: DataLoader<string, MemberType | null>;
  userSubscribedToLoader: DataLoader<string, User[]>;
  subscribedToUserLoader: DataLoader<string, User[]>;
}
