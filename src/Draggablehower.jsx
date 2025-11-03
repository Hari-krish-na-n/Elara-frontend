// src/components/DraggableSong.js
import React, { useState } from 'react';

const DraggableSong = ({ song, playSong, isCurrent }) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragStart = (e) => {
        setIsDragging(true);
        e.dataTransfer.setData('text/plain', JSON.stringify({
            type: 'song',
            id: song.id,
            title: song.title,
            artist: song.artist
        }));
        e.dataTransfer.effectAllowed = 'copy';
    };

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    return (
        <div 
            className={`draggable-song ${isDragging ? 'dragging' : ''} ${isCurrent ? 'playing' : ''}`}
            draggable="true"
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onClick={() => playSong(song)}
        >
            <div className="drag-handle">⠿</div>
            <div className="song-info">
                <div className="title">{song.title}</div>
                <div className="artist">{song.artist}</div>
            </div>
            <div className="duration">{formatTime(song.duration)}</div>
            <div className="drag-indicator">⇄</div>
        </div>
    );
};

// src/components/DroppablePlaylist.js
const DroppablePlaylist = ({ playlist, onSongDropped }) => {
    const [isOver, setIsOver] = useState(false);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsOver(true);
    };

    const handleDragLeave = () => {
        setIsOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsOver(false);
        
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        if (data.type === 'song') {
            onSongDropped(data.id, playlist.id);
        }
    };

    return (
        <div 
            className={`droppable-playlist ${isOver ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className="playlist-icon">📃</div>
            <div className="playlist-name">{playlist.name}</div>
            <div className="song-count">{playlist.songs.length} songs</div>
            <div className="drop-hint">{isOver ? 'Drop here!' : 'Drop songs here'}</div>
        </div>
    );
};