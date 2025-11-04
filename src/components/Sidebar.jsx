// src/components/Sidebar.js
import React, { useState } from 'react';
import defaultAlbumArt from '../assets/logo.png';
import { Link, useLocation } from 'react-router-dom';

function Sidebar({ onSearch }) {
    const location = useLocation();
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearchChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (onSearch) {
            onSearch(query);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (onSearch) {
            onSearch(searchQuery);
        }
    };

    const navItems = [
        { name: 'Home', icon: '🏠', path: '/' },
        { name: 'Music library', icon: '🎵', path: '/library' },
        { name: 'Liked Songs', icon: '❤️', path: '/liked' },
        { name: 'Queue', icon: '⏭️', path: '/queue' },
        { name: 'Playlists', icon: '📃', path: '/playlists' },
        { name: 'Settings', icon: '⚙️', path: '/settings' },
    ];
    return (
        
        <div className="sidebar">
           <div className='logos'> <img src={defaultAlbumArt} alt="App Logo" /></div>
            <form className="search-bar" onSubmit={handleSearchSubmit}>
                <input 
                    type="text" 
                    placeholder="Search songs, albums, artists..." 
                    className="search-input"
                    value={searchQuery}
                    onChange={handleSearchChange}
                />
            </form>
            <nav className="nav-links">
                {navItems.map(item => (
                    <Link 
                        to={item.path} 
                        key={item.name} 
                        className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                    >
                        {item.icon} {item.name}
                    </Link>
                ))}
            </nav>
        </div>
    );
}

export default Sidebar;