// src/context/DragDropContext.jsx
import React, { createContext, useState, useContext } from 'react';
import { playAddToPlaylistSound } from '../utils/soundEffects';

const DragDropContext = createContext();

export const useDragDrop = () => useContext(DragDropContext);

export const DragDropProvider = ({ children, addSongToPlaylist }) => {
    const [draggedSong, setDraggedSong] = useState(null);
    const [dropTarget, setDropTarget] = useState(null);

    const handleDragStart = (song) => {
        setDraggedSong(song);
        console.log('Dragging song:', song.title);
    };

    const handleDragEnd = () => {
        if (draggedSong && dropTarget) {
            console.log(`Adding ${draggedSong.title} to ${dropTarget.name}`);
            playAddToPlaylistSound();
            addSongToPlaylist(draggedSong.id, dropTarget.id);
            
            const event = new CustomEvent('songAddedToPlaylist', { 
                detail: { song: draggedSong, playlist: dropTarget } 
            });
            window.dispatchEvent(event);
        }
        
        setDraggedSong(null);
        setDropTarget(null);
    };

    const handleDragOverPlaylist = (playlist, e) => {
        e.preventDefault();
        setDropTarget(playlist);
    };

    const handleDragLeave = () => {
        setDropTarget(null);
    };

    return (
        <DragDropContext.Provider value={{
            draggedSong,
            dropTarget,
            handleDragStart,
            handleDragEnd,
            handleDragOverPlaylist,
            handleDragLeave,
            addSongToPlaylist
        }}>
            {children}
        </DragDropContext.Provider>
    );
};
