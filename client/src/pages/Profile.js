import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

import ThoughtForm from '../components/ThoughtForm';
import ThoughtList from '../components/ThoughtList';
import FriendList from '../components/FriendList';
import GamesList from '../components/GamesList';
import GamesListForm from '../components/GamesListForm'
import SteamIDForm from '../components/SteamIDForm'
import SteamInfo from '../components/SteamInfo'

import { useQuery, useMutation } from '@apollo/client';
import { QUERY_USER, QUERY_ME } from '../utils/queries';
import { ADD_FRIEND } from '../utils/mutations';
import Auth from '../utils/auth';

const Profile = (props) => {
  const { username: userParam } = useParams();

  const [addFriend] = useMutation(ADD_FRIEND);
  const { loading, data } = useQuery(userParam ? QUERY_USER : QUERY_ME, {
    variables: { username: userParam },
  });

  const user = data?.me || data?.user || {};

   const [isClicked, setIsClicked] = useState(false);
  // navigate to personal profile page if username is yours
  console.log(userParam);
  if (Auth.loggedIn() && Auth.getProfile().data.username === userParam) {
    return <Navigate to="/profile" />;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user?.username) {
    return (
      <h4>
        You need to be logged in to see this. Use the navigation links above to
        sign up or log in!
      </h4>
    );
  }

  const handleClick = async () => {
    try {
      await addFriend({
        variables: { id: user._id },
      });
      setIsClicked(true);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <div className="flex-row mb-3 justify-center">
        <h5 className="p-1 display-inline-block pixel text-outline">
          Viewing {userParam ? `${user.username}'s` : 'your'} lab
        </h5>
        {userParam && (
          <button className="btn ml-auto" onClick={handleClick}>
            ${isClicked ? `Watch Fellow Rat` : `Watching Fellow Rat`}
          </button>
        )}
      </div>

      <div className="flex-row justify-space-between mb-3">      
        <div className="col-12 mb-3 col-lg-8">
        
        <div className="mb-3">{!userParam && <ThoughtForm />}</div>
          <ThoughtList
            thoughts={user.thoughts}
            title={`${user.username}'s posts...`}
          />

        </div>

        <div className="col-12 col-lg-3 mb-3">
        {!userParam && (
          <SteamIDForm
          gotSteamID = {user.steamUser}          
          />
        )}
          <SteamInfo steamID = {user.steamUser}/>
          <FriendList
            username={user.username}
            friendCount={user.friendCount}
            friends={user.friends}
          />
           {Auth.getProfile().data.username === user.username ? (<GamesListForm/>) : ''}
          <GamesList
          username={user.username}
          games={user.games}
          title={`${user.username}'s games...`}
          />
         
        </div>
      </div>

    </div>
  );
};

export default Profile;
