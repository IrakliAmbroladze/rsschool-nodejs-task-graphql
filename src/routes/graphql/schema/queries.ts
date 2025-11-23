import { GraphQLObjectType, GraphQLNonNull, GraphQLList } from 'graphql';
import { UUIDType } from '../types/uuid.js';
import {
  UserType,
  PostType,
  ProfileType,
  MemberTypeType,
  MemberTypeIdEnum,
} from './types.js';

export const RootQueryType = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    memberTypes: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(MemberTypeType))),
      resolve: async (_parent, _args, context) => {
        return context.prisma.memberType.findMany();
      },
    },
    memberType: {
      type: MemberTypeType,
      args: {
        id: { type: new GraphQLNonNull(MemberTypeIdEnum) },
      },
      resolve: async (_parent, args, context) => {
        return context.prisma.memberType.findUnique({
          where: { id: args.id },
        });
      },
    },
    users: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(UserType))),
      resolve: async (_parent, _args, context, info) => {
        let needsUserSubscribedTo = false;
        let needsSubscribedToUser = false;

        const checkSelections = (selections: readonly any[]): void => {
          for (const selection of selections) {
            if (selection.kind === 'Field') {
              if (selection.name.value === 'userSubscribedTo') {
                needsUserSubscribedTo = true;
              }
              if (selection.name.value === 'subscribedToUser') {
                needsSubscribedToUser = true;
              }
              if (selection.selectionSet) {
                checkSelections(selection.selectionSet.selections);
              }
            } else if (
              selection.kind === 'InlineFragment' ||
              selection.kind === 'FragmentSpread'
            ) {
              if (selection.selectionSet) {
                checkSelections(selection.selectionSet.selections);
              }
            }
          }
        };

        if (info.fieldNodes[0]?.selectionSet) {
          checkSelections(info.fieldNodes[0].selectionSet.selections);
        }

        const includeObj: any = {};
        if (needsUserSubscribedTo || needsSubscribedToUser) {
          if (needsUserSubscribedTo) {
            includeObj.userSubscribedTo = true;
          }
          if (needsSubscribedToUser) {
            includeObj.subscribedToUser = true;
          }
        }

        const users = await context.prisma.user.findMany({
          include: Object.keys(includeObj).length > 0 ? includeObj : undefined,
        });

        users.forEach((user) => {
          context.userLoader.prime(user.id, user);
        });

        return users;
      },
    },
    user: {
      type: UserType,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (_parent, args, context) => {
        return context.userLoader.load(args.id);
      },
    },
    posts: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(PostType))),
      resolve: async (_parent, _args, context) => {
        return context.prisma.post.findMany();
      },
    },
    post: {
      type: PostType,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (_parent, args, context) => {
        return context.prisma.post.findUnique({
          where: { id: args.id },
        });
      },
    },
    profiles: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(ProfileType))),
      resolve: async (_parent, _args, context) => {
        return context.prisma.profile.findMany();
      },
    },
    profile: {
      type: ProfileType,
      args: {
        id: { type: new GraphQLNonNull(UUIDType) },
      },
      resolve: async (_parent, args, context) => {
        return context.prisma.profile.findUnique({
          where: { id: args.id },
        });
      },
    },
  },
});
