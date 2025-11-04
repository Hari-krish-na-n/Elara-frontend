// src/components/Header.js
import React from 'react';
// Header.jsx (Correction 1: If the file is logo.png)


function Header({ loadFiles, onShufflePlay }) {
    const handleFileChange = (event) => {
        const files = event.target.files;
        if (files.length) {
            loadFiles(files);
        }
    };

    return (
        
        <header className="header">
            <button className="hamburger" aria-label="Open menu" onClick={(e)=>{e.preventDefault();document.body.classList.toggle('sidebar-open')}}>☰</button>
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