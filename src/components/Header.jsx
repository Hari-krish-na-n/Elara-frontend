// src/components/Header.js
import React from 'react';
// Header.jsx (Correction 1: If the file is logo.png)


function Header({ loadFiles, onShufflePlay, currentSong, isCurrentLiked, onToggleCurrentLike }) {
    const handleFileChange = (event) => {
        const files = event.target.files;
        if (files.length) {
            loadFiles(files);
        }
    };

    return (
        
        <header className="header">
                <div className="logo-container">
               
                <h1>ELARA YOUR Music companion</h1>
            </div>  
            <div className="tabs">
                <span className="tab active">SONGS</span>

               
            </div>
            <div className="controls-right">
                <div className="shuffle-play">
                    <button type="button" className="shuffle-btn-big" onClick={onShufflePlay} aria-label="Shuffle and Play">🔀</button>
                    <span className="shuffle-caption">Shuffle & Play</span>
                </div>
                <div className="like-current">
                    <button type="button" className={`like-btn-big ${isCurrentLiked ? 'active' : ''}`} onClick={()=> currentSong && onToggleCurrentLike(currentSong)} aria-label="Like current song" disabled={!currentSong}>
                        {isCurrentLiked ? '❤️' : '🤍'}
                    </button>
                    <span className="like-caption">Like</span>
                </div>
                <input
                    type="file"
                    id="file-upload"
                    multiple
                    accept="audio/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />
                <label htmlFor="file-upload" className="add-folder-btn">
                    + Add folder
                </label>

            </div>
        </header>
    );
}

export default Header;