import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { PubSub } from 'graphql-subscriptions';

import { resolvers } from './resolvers.js';
import { typeDefs } from './schema.js';

const port = Number(process.env.PORT ?? 4000);
const pubsub = new PubSub();

const server = new ApolloServer<{ pubsub: PubSub }>({ typeDefs, resolvers });

const { url } = await startStandaloneServer<{ pubsub: PubSub }>(server, {
  listen: { port },
  context: async () => ({ pubsub })
});

console.log(`🟢 Reversi GraphQL API ready at ${url}`);
