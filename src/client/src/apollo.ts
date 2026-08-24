import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';

// The standalone Apollo Server serves GraphQL at the root path.
const uri = import.meta.env.VITE_GRAPHQL_URI ?? 'http://localhost:4000/';

export const client = new ApolloClient({
  link: new HttpLink({ uri }),
  cache: new InMemoryCache()
});
