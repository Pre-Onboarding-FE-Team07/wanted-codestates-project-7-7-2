import { ApolloClient, InMemoryCache, makeVar } from '@apollo/client';
import { UserReposQuery } from './generated/graphql';

const client = new ApolloClient({
  uri: 'https://api.github.com/graphql',
  cache: new InMemoryCache(),
  headers: {
    Authorization: `Bearer ${process.env.REACT_APP_GITHUB_TOKEN}`,
  },
});

export const usernameVar = makeVar('');
export const userVar = makeVar<UserReposQuery['user'] | null>(null);

export default client;
