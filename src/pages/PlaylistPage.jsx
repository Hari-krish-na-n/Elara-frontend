import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PlaylistDetail from '../components/PlaylistDetail';

export default function PlaylistPage(props) {
  const { playlistId } = useParams();
  const navigate = useNavigate();
  const {
    playlists,
    playSongWithTracking,
    currentSong,
    removeSongFromPlaylist,
    deletePlaylist,
    isPlaying,
    togglePlayPause,
    playNextSong,
    playPrevSong,
    isSongLiked,
    toggleLike,
    openPlaylistSidebar,
    getPlaylistStats,
    isShuffled,
    toggleShuffle,
    repeatMode,
    toggleRepeat,
    volume,
    isMuted,
    toggleMute,
    setVolume,
    exportPlaylist,
    focusTarget
  } = props;
  const playlist = playlists.find(p => String(p.id) === String(playlistId));
  if (!playlist) return null;
  return (
    <PlaylistDetail
      playlist={playlist}
      onBack={() => navigate('/playlists')}
      playSong={playSongWithTracking}
      currentSongId={currentSong?.id}
      removeSongFromPlaylist={removeSongFromPlaylist}
      deletePlaylist={deletePlaylist}
      isPlaying={isPlaying}
      togglePlayPause={togglePlayPause}
      playNextSong={playNextSong}
      playPrevSong={playPrevSong}
      isSongLiked={isSongLiked}
      onToggleLike={toggleLike}
      addToQueue={() => { }}
      onOpenPlaylistSidebar={openPlaylistSidebar}
      getPlaylistStats={getPlaylistStats}
      isShuffled={isShuffled}
      toggleShuffle={toggleShuffle}
      repeatMode={repeatMode}
      toggleRepeat={toggleRepeat}
      volume={volume}
      isMuted={isMuted}
      toggleMute={toggleMute}
      setVolume={setVolume}
      onDownload={(p) => {
        const json = exportPlaylist?.(p.id);
        if (!json) return;
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${p.name || 'playlist'}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }}
      focusTarget={focusTarget}
    />
  );
}
