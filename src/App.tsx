import { useState } from 'react';
import Search from './components/Search';
import { UserReposQuery, useUserReposLazyQuery } from './generated/graphql';

export default function App() {
  const [inputValue, setInputValue] = useState('');
  const [user, setUser] = useState<UserReposQuery['user']>(null);
  const [getUserRepos] = useUserReposLazyQuery();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await getUserRepos({ variables: { username: inputValue } });
      if (!res?.data?.user) {
        alert('사용자를 찾을 수 없습니다. ');
        setInputValue('');
        return;
      }
      setUser(res?.data?.user);
    } catch (error) {
      alert('오류가 발생했습니다. 잠시 후 다시 시도해주세요. ');
      setInputValue('');
      console.log(error);
    }
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
