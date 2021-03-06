import { useReactiveVar } from '@apollo/client';
import { useEffect, useRef } from 'react';
import { usernameVar, userVar } from './apollo';
import Search from './components/Search';
import GithubSocialGraph from './utils/github-social-graph';
import { useUserReposLazyQuery } from './generated/graphql';

export default function App() {
  const user = useReactiveVar(userVar);
  const graph = useRef<GithubSocialGraph>();
  const [getUserRepos] = useUserReposLazyQuery();

  useEffect(() => {
    graph.current = new GithubSocialGraph('#root');

    graph.current.addEventListener('click-repo', ((event: CustomEvent) => {
      const { detail: { username } } = event;
      getUserRepos({ variables: { username } }).then((res) => userVar(res?.data?.user));
    }) as EventListener);

    graph.current.addEventListener('click-user', ((event: CustomEvent) => {
      const { detail: { username, node } } = event;
      userVar(node);
      usernameVar(username);
    }) as EventListener);
  }, [getUserRepos]);

  useEffect(() => {
    if (user) {
      graph.current?.push(JSON.parse(JSON.stringify(user)));
      usernameVar(user.login);
    }
  }, [user]);

  return (
    <div className="relative text-lg">
      <Search />
    </div>
  );
}
