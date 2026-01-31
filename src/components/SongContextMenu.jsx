// src/components/SongContextMenu.jsx
import React from 'react';
import {
    Play,
    ListMusic,
    Heart,
    Plus,
    Share2,
    Download,
    Trash2,
} from 'lucide-react';
import './SongContextMenu.css';

function SongContextMenu({
    song,
    isOpen,
    onClose,
    playlists = [],
    isSongLiked,
    onPlay,
    onAddToQueue,
    onPlayNext,
    onToggleLike,
    onAddToPlaylist,
    onOpenPlaylistSidebar,
    onShare,
    onDownload,
    onDelete,
    queue = [],
    moveInQueue,
    showSuccessMessage,
}) {
    if (!isOpen || !song) return null;

    const handleMenuItemClick = (action, e) => {
        e.stopPropagation();

        switch (action) {
            case 'play':
                onPlay && onPlay(song);
                break;
            case 'add-to-queue':
                onAddToQueue && onAddToQueue(song);
                showSuccessMessage && showSuccessMessage(`Added "${song.title}" to queue`);
                break;
            case 'play-next':
                const endIndex = queue?.length ?? 0;
                if (onAddToQueue) onAddToQueue(song);
                if (moveInQueue) moveInQueue(endIndex, 0);
                showSuccessMessage && showSuccessMessage(`Will play "${song.title}" next`);
                break;
            case 'like':
                onToggleLike && onToggleLike(song);
                break;
            case 'share':
                onShare && onShare(song);
                break;
            case 'download':
                onDownload && onDownload(song);
                break;
            case 'delete':
                onDelete && onDelete(song);
                break;
            default:
                break;
        }

        onClose();
    };

    const handleAddToPlaylistClick = (playlist, e) => {
        e.stopPropagation();
        onAddToPlaylist && onAddToPlaylist(song, playlist);
        showSuccessMessage && showSuccessMessage(`Added "${song.title}" to "${playlist.name}"`);
        onClose();
    };

    const handleOpenPlaylistSidebar = (e) => {
        e.stopPropagation();
        onOpenPlaylistSidebar && onOpenPlaylistSidebar(song);
        onClose();
    };

    const isLiked = isSongLiked && isSongLiked(song.id);

    return (
        <div className="song-context-menu" onClick={(e) => e.stopPropagation()}>
            <button
                className="menu-item"
                onClick={(e) => handleMenuItemClick('play', e)}
            >
                <Play size={16} />
                Play Now
            </button>

            <button
                className="menu-item"
                onClick={(e) => handleMenuItemClick('add-to-queue', e)}
            >
                <ListMusic size={16} />
                Add to Queue
            </button>

            <button
                className="menu-item"
                onClick={(e) => handleMenuItemClick('play-next', e)}
            >
                <ListMusic size={16} />
                Play Next
            </button>

            <button
                className="menu-item"
                onClick={(e) => handleMenuItemClick('like', e)}
            >
                <Heart
                    size={16}
                    fill={isLiked ? '#ef4444' : 'none'}
                    color={isLiked ? '#ef4444' : 'currentColor'}
                />
                {isLiked ? 'Unlike' : 'Like'}
            </button>

            <div className="menu-divider"></div>

            <button
                className="menu-item"
                onClick={handleOpenPlaylistSidebar}
            >
                <Plus size={16} />
                Add to Playlist
            </button>

            {playlists && playlists.length > 0 && (
                <div className="menu-item-with-submenu">
                    <div className="submenu">
                        {playlists.map((playlist) => (
                            <button
                                key={playlist.id}
                                className="submenu-item"
                                onClick={(e) => handleAddToPlaylistClick(playlist, e)}
                            >
                                🎶 {playlist.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="menu-divider"></div>

            <button
                className="menu-item"
                onClick={(e) => handleMenuItemClick('share', e)}
            >
                <Share2 size={16} />
                Share
            </button>

            <button
                className="menu-item"
                onClick={(e) => handleMenuItemClick('download', e)}
            >
                <Download size={16} />
                Download
            </button>

            <div className="menu-divider"></div>

            <button
                className="menu-item delete"
                onClick={(e) => handleMenuItemClick('delete', e)}
            >
                <Trash2 size={16} />
                Remove from Library
            </button>
        </div>
    );
}

export default SongContextMenu;
