import { useState } from 'react';
import Search from './components/Search';
import { UserReposQuery, useUserReposLazyQuery } from './generated/graphql';

export default function App() {
  const [inputValue, setInputValue] = useState('');
  const [user, setUser] = useState<UserReposQuery['user']>(null);
  const [getUserRepos] = useUserReposLazyQuery();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const res = await getUserRepos({ variables: { username: inputValue } });
    setUser(res?.data?.user);
  };

  return (
    <div className="relative text-lg">
      <Search
        user={user}
        value={inputValue}
        setValue={setInputValue}
        handleSubmit={handleSubmit}
      />
    </div>
  );
}
