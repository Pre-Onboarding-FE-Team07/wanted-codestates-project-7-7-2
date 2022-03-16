import { useState } from 'react';
import Search from './components/Search';
import { UserReposQuery } from './generated/graphql';

export default function App() {
  const [user, setUser] = useState<UserReposQuery['user']>(null);

  return (
    <div className="relative text-lg">
      <Search user={user} setUser={setUser} />
    </div>
  );
}
