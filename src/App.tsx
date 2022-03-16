import { useState } from 'react';
import Search from './components/Search';

type UserType = {
  id: string;
  name: string;
  login: string;
  imgUrl: string; // avatar_url
  contact: string; // bio
};

export default function App() {
  const [user, setUser] = useState<UserType | null>({
    id: '52448114',
    name: 'seomoon',
    login: 'dev-seomoon',
    imgUrl: 'https://avatars.githubusercontent.com/u/52448114?v=4',
    contact: 'seomoon.frontend@gmail.com',
  });

  return (
    <div className="relative text-lg">
      <Search user={user} />
    </div>
  );
}
