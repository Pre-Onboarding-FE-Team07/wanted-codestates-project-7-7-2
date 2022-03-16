import { useState } from 'react';
import Search from './components/Search';

type UserType = {
  id: string;
  login: string;
  name: string | null;
  bio: string | null;
  avatarUrl: any;
};

export default function App() {
  const [user, setUser] = useState<UserType | null>(null);

  return (
    <div className="relative text-lg">
      <Search user={user} />
    </div>
  );
}
