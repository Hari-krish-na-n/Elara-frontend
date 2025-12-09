// src/components/Header.js
import React, { useState, useRef, useEffect } from 'react';
import './Header.css';
import { Shuffle, ArrowUpDown, FolderPlus, Menu, X } from 'lucide-react';

function Header({ loadFiles, onShufflePlay, onSort }) {
    const [sortDropdown, setSortDropdown] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const sortContainerRef = useRef(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (sortDropdown && 
                dropdownRef.current && 
                !dropdownRef.current.contains(event.target) &&
                sortContainerRef.current &&
                !sortContainerRef.current.contains(event.target)) {
                setSortDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
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

    const handleSort = (sortType) => {
        onSort(sortType);
        setSortDropdown(false);
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
                <span className="">  </span>
            </div>
            
            <div className="controls-right">
                <div className="sort-container" ref={sortContainerRef}>
                    <button 
                        type="button" 
                        className="sort-btn-big" 
                        onClick={() => setSortDropdown(!sortDropdown)} 
                        aria-label="Sort Songs"
                        aria-expanded={sortDropdown}
                    >
                        <ArrowUpDown size={22} />
                    </button>
                    <span className="sort-caption">Sort</span>
                    
                    {sortDropdown && (
                        <div className="sort-dropdown" ref={dropdownRef}>
                            <div className="sort-header">Sort by</div>
                            <button className="sort-option" onClick={() => handleSort('title-asc')}>
                                Title A-Z
                            </button>
                            <button className="sort-option" onClick={() => handleSort('title-desc')}>
                                Title Z-A
                            </button>
                            <button className="sort-option" onClick={() => handleSort('artist-asc')}>
                                Artist A-Z
                            </button>
                            <button className="sort-option" onClick={() => handleSort('artist-desc')}>
                                Artist Z-A
                            </button>
                            <button className="sort-option" onClick={() => handleSort('duration-asc')}>
                                Duration (Short)
                            </button>
                            <button className="sort-option" onClick={() => handleSort('duration-desc')}>
                                Duration (Long)
                            </button>
                            <button className="sort-option" onClick={() => handleSort('plays-desc')}>
                                Most Played
                            </button>
                            <button className="sort-option" onClick={() => handleSort('plays-asc')}>
                                Least Played
                            </button>
                        </div>
                    )}
                </div>
                
                <div className="shuffle-play">
                    <button 
                        type="button" 
                        className="shuffle-btn-big" 
                        onClick={onShufflePlay} 
                        aria-label="Shuffle and Play"
                    >
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