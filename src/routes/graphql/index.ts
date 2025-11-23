import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { createGqlResponseSchema, gqlResponseSchema } from './schemas.js';
import { graphql, GraphQLSchema, validate, parse } from 'graphql';
import { createDataLoaders } from './loaders.js';
import depthLimit from 'graphql-depth-limit';
import { RootQueryType } from './schema/queries.js';
import { MutationsType } from './schema/mutations.js';

const plugin: FastifyPluginAsyncTypebox = async (fastify) => {
  const { prisma } = fastify;

  const schema = new GraphQLSchema({
    query: RootQueryType,
    mutation: MutationsType,
  });

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
        ...dataLoaders,
      };

      try {
        const documentAST = parse(req.body.query);
        const validationErrors = validate(schema, documentAST, [depthLimit(5)]);

        if (validationErrors.length > 0) {
          return {
            data: null,
            errors: validationErrors.map((err) => ({
              message: err.message,
              locations: err.locations,
              path: err.path,
            })),
          };
        }
      } catch (error) {
        return {
          data: null,
          errors: [
            {
              message: error instanceof Error ? error.message : error,
            },
          ],
        };
      }
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
