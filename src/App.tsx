import { useReactiveVar } from '@apollo/client';
import { useEffect, useRef } from 'react';
import { userVar } from './client';
import Search from './components/Search';
import GithubSocialGraph from './utils/github-social-graph';
import { useUserReposLazyQuery } from './generated/graphql';

export default function App() {
  const user = useReactiveVar(userVar);
  const graph = useRef<GithubSocialGraph>();
  const [getUserRepos] = useUserReposLazyQuery();

  useEffect(() => {
    graph.current = new GithubSocialGraph('#root');
    graph.current.addEventListener('click-repo', (({ detail: { username } }: CustomEvent) => {
      getUserRepos({ variables: { username } }).then((res) => userVar(res?.data?.user));
    }) as EventListener);
  }, [getUserRepos]);

  useEffect(() => {
    if (user) graph.current?.push(JSON.parse(JSON.stringify(user)));
  }, [user]);

  return (
    <div className="relative text-lg">
      <Search />
    </div>
  );
}
