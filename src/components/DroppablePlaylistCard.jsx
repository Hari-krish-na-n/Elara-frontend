// src/components/DroppablePlaylistCard.jsx
import React, { useState } from 'react';
import { FolderPlus, Music } from 'lucide-react';
import './DroppablePlaylistCard.css';

function DroppablePlaylistCard({ playlist, onDrop, onClick }) {
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDraggingOver(true);
        e.dataTransfer.dropEffect = 'copy';
    };

    const handleDragLeave = () => {
        setIsDraggingOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDraggingOver(false);
        
        try {
            const songData = JSON.parse(e.dataTransfer.getData('text/plain'));
            console.log('Dropped song on playlist:', playlist.name, songData);
            
            if (onDrop) {
                onDrop(songData, playlist.id);
                
                // Visual feedback
                const card = e.currentTarget;
                card.style.transform = 'scale(1.05)';
                card.style.boxShadow = '0 0 30px rgba(135, 206, 235, 0.7)';
                setTimeout(() => {
                    card.style.transform = '';
                    card.style.boxShadow = '';
                }, 500);
            }
        } catch (error) {
            console.error('Error handling drop:', error);
        }
    };

    return (
        <div 
            className={`droppable-playlist-card ${isDraggingOver ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={onClick}
            title={`Drop songs here to add to "${playlist.name}"`}
        >
            <div className="playlist-icon">
                {isDraggingOver ? <FolderPlus size={32} /> : <Music size={28} />}
            </div>
            <h4 className="playlist-name">{playlist.name}</h4>
            <p className="playlist-count">
                {playlist.songs.length} {playlist.songs.length === 1 ? 'song' : 'songs'}
            </p>
            {isDraggingOver && (
                <div className="drop-hint">
                    <span>✨ Drop to add!</span>
                </div>
            )}
        </div>
    );
}

export default DroppablePlaylistCard;