import React from 'react';
import MusicList from '../components/MusicList';

export default function LikedSongsPage(props) {
  const { likedSongsList, currentSong, playlists, addSongToPlaylist, openPlaylistSidebar, isSongLiked, toggleLike, addToQueue, queue, moveInQueue, toggleNowPlaying, playSongWithTracking } = props;
  return (
    <MusicList
      songs={likedSongsList}
      isLikedView={true}
      playSong={playSongWithTracking}
      currentSongId={currentSong?.id}
      playlists={playlists}
      addSongToPlaylist={addSongToPlaylist}
      onOpenPlaylistSidebar={openPlaylistSidebar}
      isSongLiked={isSongLiked}
      onToggleLike={toggleLike}
      onAddToQueue={addToQueue}
      queue={queue}
      moveInQueue={moveInQueue}
      onOpenDetails={toggleNowPlaying}
    />
  );
}
