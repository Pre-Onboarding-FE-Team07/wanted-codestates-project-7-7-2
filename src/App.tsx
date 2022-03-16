import { useState } from 'react';
import Search from './components/Search';

type UserType = {
  id: string;
  name: string;
  login: string;
  imgUrl: string; // avatar_url
  description: string; // bio
};

export default function App() {
  const [user, setUser] = useState<UserType | null>(null);

  return (
    <div className="relative text-lg">
      <Search user={user} />
    </div>
  );
}
