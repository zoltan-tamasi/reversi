import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';

import { resolvers } from './resolvers.js';
import { typeDefs } from './schema.js';

const port = Number(process.env.PORT ?? 4000);

const server = new ApolloServer({ typeDefs, resolvers });

const { url } = await startStandaloneServer(server, {
  listen: { port }
});

console.log(`🟢 Reversi GraphQL API ready at ${url}`);
