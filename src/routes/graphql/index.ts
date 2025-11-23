import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';
import { buildSchema, graphql } from 'graphql';
import { createDataLoaders } from './loaders.js';

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { prisma } = fastify;
  const schema = buildSchema(`
  type Query {
    users: String
  }
`);
  fastify.route({
    url: '/',
    method: 'POST',
    schema: {
      ...createGqlResponseSchema,
      response: {
        200: gqlResponseSchema,
      },
    },
    async handler(req) {
      const dataLoaders = await createDataLoaders(prisma);
      const context = {
        prisma,
        ...{ dataLoaders },
      };

      return graphql({
        schema,
        source: req.body.query,
        variableValues: req.body.variables,
        contextValue: context,
      });
    },
  });
};

export default plugin;
