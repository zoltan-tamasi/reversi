import http from 'http';
import express from 'express';

import { ApolloServer, HeaderMap } from '@apollo/server';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { execute, subscribe } from 'graphql';
import { useServer } from 'graphql-ws/use/ws';
import { PubSub } from 'graphql-subscriptions';
import { WebSocketServer } from 'ws';

import { resolvers } from './resolvers.js';
import { typeDefs } from './schema.js';

const app = express();

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "OPTIONS, GET, POST, PUT, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

const port = Number(process.env.PORT ?? 4000);
const pubsub = new PubSub();
const schema = makeExecutableSchema({ typeDefs, resolvers });

const httpServer = http.createServer(app);

const wsServer = new WebSocketServer({
  server: httpServer,
  path: '/graphql',
});

const serverCleanup = useServer(
  {
    schema,
    context: async () => ({ pubsub }),
  },
  wsServer
);

const server = new ApolloServer({
  schema,
  //context: async () => ({ pubsub }),
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
});

await server.start();

// Mount Apollo Server as an Express handler for HTTP requests at /graphql
app.use('/graphql', express.json(), async (req, res) => {
  const headers = new HeaderMap();
  for (const [k, v] of Object.entries(req.headers)) {
    if (v === undefined) continue;
    headers.set(k, Array.isArray(v) ? v.join(',') : String(v));
  }

  const search = (() => {
    try {
      return new URL(req.url ?? '', 'http://localhost').search;
    } catch {
      return '';
    }
  })();

  const result = await (server as any).executeHTTPGraphQLRequest({
    httpGraphQLRequest: {
      method: req.method ?? 'POST',
      headers,
      search,
      body: req.body,
    },
    context: async () => ({ pubsub }),
  });

  if (result.status) res.status(result.status);
  if (result.headers) {
    for (const [k, v] of result.headers) {
      res.setHeader(k, v as string);
    }
  }

  if (result.body.kind === 'complete') {
    res.send(result.body.string);
  } else {
    // Streamed response
    res.setHeader('Content-Type', 'application/json');
    for await (const chunk of result.body.asyncIterator) {
      res.write(chunk);
    }
    res.end();
  }
});

httpServer.listen(port, () => {
  console.log(`🟢 Reversi GraphQL API ready at http://localhost:${port}/`);
});
