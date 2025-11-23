import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';
import { buildSchema, graphql } from 'graphql';

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
      const context = {
        prisma,
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
