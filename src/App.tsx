import { useReactiveVar } from '@apollo/client';
import { useEffect, useRef } from 'react';
import { userVar } from './client';
import Search from './components/Search';
import GithubSocialGraph from './utils/github-social-graph';

export default function App() {
  const user = useReactiveVar(userVar);
  const graph = useRef<GithubSocialGraph>();

  useEffect(() => {
    graph.current = new GithubSocialGraph('#root');
  }, []);

  useEffect(() => {
    if (user) graph.current?.push(user);
  }, [user]);

  return (
    <div className="relative text-lg">
      <Search />
    </div>
  );
}
