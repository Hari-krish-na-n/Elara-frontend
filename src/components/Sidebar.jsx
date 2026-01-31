// src/components/Sidebar.jsx
import React, { useState } from 'react';

import { NavLink, useNavigate } from 'react-router-dom';
import {
  FaHome,
  FaMusic,
  FaHeart,
  FaListAlt,
  FaCog,
  FaPlayCircle,
  FaHeartbeat
} from 'react-icons/fa';
import {
  HiLibrary,
  HiOutlineLibrary
} from 'react-icons/hi';
import {
  MdQueueMusic,
  MdOutlineQueueMusic,
  MdPublic
} from 'react-icons/md';
import {
  RiSettings4Fill,
  RiSettings4Line
} from 'react-icons/ri';


const Sidebar = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const navItems = [
    {
      name: 'Home',
      icon: <FaHome className="icon" />,
      outlineIcon: <FaHome className="icon" />,
      path: '/'
    },
    {
      name: 'Music Library',
      icon: <FaMusic className="icon" />,
      outlineIcon: <HiLibrary className="icon" />,
      path: '/library'
    },
    {
      name: 'Liked Songs',
      icon: <FaHeart className="icon heartbeat" />,
      outlineIcon: <FaHeart className="icon" />,
      path: '/liked'
    },
    {
      name: 'Queue',
      icon: <MdQueueMusic className="icon bounce" />,
      outlineIcon: <MdOutlineQueueMusic className="icon" />,
      path: '/queue'
    },
    {
      name: 'Playlists',
      icon: <FaListAlt className="icon slide" />,
      outlineIcon: <FaListAlt className="icon" />,
      path: '/playlists'
    },
    {
      name: 'Settings',
      icon: <RiSettings4Fill className="icon spin" />,
      outlineIcon: <RiSettings4Line className="icon" />,
      path: '/settings'
    },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
    // Navigate to library if not already there
    if (!window.location.pathname.includes('/library')) {
      navigate('/library');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo">

            <img src="/icons/favicon.png.png" alt="Favicon"

              onMouseEnter={(e) => {
                e.currentTarget.style.animation = 'spin 0.5s linear infinite';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.animation = 'spin 1s linear infinite';
              }}

            />
          </div>
        </div>

        <form className="search-box" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search songs, artists, albums..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="search-input"
          />
          <button type="submit" className="search-btn">
            <svg className="search-icon" viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
          </button>
        </form>
      </div>

      <nav className="nav-menu">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `nav-item ${isActive ? 'active' : ''}`
            }
          >
            {({ isActive }) => (
              <>
                <div className="nav-icon">
                  {isActive ? item.icon : item.outlineIcon}
                </div>
                <span className="nav-text">{item.name}</span>
                {isActive && (
                  <div className="active-indicator"></div>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="music-player-preview">
          <FaPlayCircle className="player-icon pulse" />
          <div className="player-info">
            <span className="player-title">Elara Player</span>
            <span className="player-status">Ready to play</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;