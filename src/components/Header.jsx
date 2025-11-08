// src/components/Header.js
import React, { useState, useRef, useEffect } from 'react';
import { Shuffle, ArrowUpDown, FolderPlus, Menu, X } from 'lucide-react';


function Header({ loadFiles, onShufflePlay, onSort }) {
    const [sortDropdown, setSortDropdown] = useState(false);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const sortBtnRef = useRef(null);

    useEffect(() => {
        if (sortDropdown && sortBtnRef.current) {
            const rect = sortBtnRef.current.getBoundingClientRect();
            setDropdownPos({
                top: rect.bottom + 5,
                left: rect.left + (rect.width / 2) - 110
            });
        }
    }, [sortDropdown]);

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
        document.body.classList.toggle('sidebar-open');
    };
    const handleFileChange = (event) => {
        const files = event.target.files;
        if (files.length) {
            loadFiles(files);
        }
    };

    return (
        
        <header className="header">
                <button className="mobile-menu-btn" onClick={toggleMobileMenu} aria-label="Toggle Menu">
                    {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                </button>
                <div className="logo-container">
               
                <h1>Every song is a journey — Elara is your compass</h1>
            </div>  
            <div className="tabs">
                <span className="tab active">SONGS</span>
            </div>
            <div className="controls-right">
                <div className="sort-container" ref={sortBtnRef}>
                    <button 
                        type="button" 
                        className="sort-btn-big" 
                        onClick={() => setSortDropdown(!sortDropdown)} 
                        aria-label="Sort Songs"
>
                        <ArrowUpDown size={22} />
                    </button>
                    <span className="sort-caption">Sort</span>
                    {sortDropdown && (
                        <div className="sort-dropdown" style={{ top: `${dropdownPos.top}px`, left: `${dropdownPos.left}px` }}>
                            <div className="sort-header">Sort by</div>
                            <button className="sort-option" onClick={() => { onSort('title-asc'); setSortDropdown(false); }}>Title A-Z</button>
                            <button className="sort-option" onClick={() => { onSort('title-desc'); setSortDropdown(false); }}>Title Z-A</button>
                            <button className="sort-option" onClick={() => { onSort('artist-asc'); setSortDropdown(false); }}>Artist A-Z</button>
                            <button className="sort-option" onClick={() => { onSort('artist-desc'); setSortDropdown(false); }}>Artist Z-A</button>
                            <button className="sort-option" onClick={() => { onSort('duration-asc'); setSortDropdown(false); }}>Duration (Short)</button>
                            <button className="sort-option" onClick={() => { onSort('duration-desc'); setSortDropdown(false); }}>Duration (Long)</button>
                            <button className="sort-option" onClick={() => { onSort('plays-desc'); setSortDropdown(false); }}>Most Played</button>
                            <button className="sort-option" onClick={() => { onSort('plays-asc'); setSortDropdown(false); }}>Least Played</button>
                        </div>
                    )}
                </div>
                <div className="shuffle-play">
                    <button type="button" className="shuffle-btn-big" onClick={onShufflePlay} aria-label="Shuffle and Play">
                        <Shuffle size={24} />
                    </button>
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
                    <FolderPlus size={16} style={{ marginRight: 8 }} /> Add folder
                </label>

            </div>
        </header>
    );
}

export default Header;