import { ApolloClient, HttpLink, InMemoryCache, split } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

const httpUri = import.meta.env.VITE_GRAPHQL_URI ?? 'http://localhost:4000/graphql';
const wsUri = import.meta.env.VITE_GRAPHQL_WS_URI ?? 'ws://localhost:4000/graphql';

const TOKEN_KEY = 'reversi.authToken';

// Session token issued by the server on registration. It is kept in
// sessionStorage so a page refresh keeps the session. sessionStorage is
// per tab, so two tabs can be logged in as different players (localStorage
// would make every tab share the last registered player's token). Storage
// can be unavailable, in which case the token lives in memory only.
let authToken: string | null = (() => {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
})();

export function getAuthToken(): string | null {
  return authToken;
}

export function setAuthToken(token: string | null) {
  authToken = token;
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Ignore storage failures; the in-memory token still works.
  }
}

const authLink = setContext((_operation, { headers }) => ({
  headers: authToken ? { ...headers, authorization: `Bearer ${authToken}` } : headers
}));
const httpLink = authLink.concat(new HttpLink({ uri: httpUri }));
// The WebSocket connects lazily on the first subscription, so the token is
// already set by then.
const wsLink = new GraphQLWsLink(createClient({
  url: wsUri,
  connectionParams: () => (authToken ? { authorization: `Bearer ${authToken}` } : {})
}));

export const client = new ApolloClient({
  link: split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return definition.kind === 'OperationDefinition' && definition.operation === 'subscription';
    },
    wsLink,
    httpLink
  ),
  cache: new InMemoryCache()
});
