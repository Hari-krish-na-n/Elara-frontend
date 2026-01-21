// src/components/Header.js
import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import './Header.css';
import {
  Shuffle,
  ArrowUpDown,
  FolderPlus,
  Menu,
  X,
  MoreVertical,
  Home,
  Music,
  Heart,
  ListMusic,
  List,
  Settings,
  Search
} from 'lucide-react';

function Header({ loadFiles, onShufflePlay, onSort, onSearch }) {
  const [sortDropdown, setSortDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const sortContainerRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  /* Handle Search */
  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
    if (!window.location.pathname.includes('/library')) {
      navigate('/library');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  /* Close dropdown on outside click */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        sortDropdown &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        sortContainerRef.current &&
        !sortContainerRef.current.contains(e.target)
      ) {
        setSortDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sortDropdown]);

  /* Close mobile actions on outside click */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (mobileActionsOpen && !e.target.closest('.mobile-actions-btn') && !e.target.closest('.mobile-actions-panel')) {
        setMobileActionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileActionsOpen]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen((v) => !v);
  };

  const handleFileChange = (e) => {
    if (e.target.files.length) {
      loadFiles(e.target.files);
      setMobileActionsOpen(false);
    }
  };

  const handleSort = (type) => {
    onSort(type);
    setSortDropdown(false);
    setMobileActionsOpen(false);
  };

  const handleShuffleClick = () => {
    onShufflePlay();
    setMobileActionsOpen(false);
  };

  const navItems = [
    { name: 'Home', icon: <Home size={20} />, path: '/' },
    { name: 'Library', icon: <Music size={20} />, path: '/library' },
    { name: 'Liked', icon: <Heart size={20} />, path: '/liked' },
    { name: 'Queue', icon: <ListMusic size={20} />, path: '/queue' },
    { name: 'Playlists', icon: <List size={20} />, path: '/playlists' },
   
  ];

  return (
    <header className="header-fixed">
      <div className="header-content">
        
        {/* LEFT - Navigation */}
        <nav className="header-nav desktop-nav">
            {navItems.map((item) => (
            <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                title={item.name}
            >
                {item.icon}
                <span className="nav-text">{item.name}</span>
            </NavLink>
            ))}
        </nav>

        {/* CENTER - Search Bar */}
        <div className="header-search-container">
            <div className="search-box">
                <Search size={18} className="search-icon" />
                <input 
                    type="text" 
                    placeholder="Search..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyPress}
                />
            </div>
        </div>

        {/* RIGHT - Desktop Controls */}
        <div className="controls-right desktop-controls">
          {/* Sort Button */}
          <div className="sort-container" ref={sortContainerRef}>
            <button
              className="control-btn sort-btn"
              onClick={() => setSortDropdown(!sortDropdown)}
              aria-expanded={sortDropdown}
              aria-label="Sort options"
            >
              <ArrowUpDown size={20} />
              <span className="btn-label">Sort</span>
            </button>

            {sortDropdown && (
              <div className="sort-dropdown" ref={dropdownRef} role="menu">
                <div className="sort-header">Sort by</div>
                {[
                  ['title-asc', '📝 Title A–Z'],
                  ['title-desc', '📝 Title Z–A'],
                  ['artist-asc', '🎤 Artist A–Z'],
                  ['artist-desc', '🎤 Artist Z–A'],
                  ['album-asc', '💿 Album A–Z'],
                  ['album-desc', '💿 Album Z–A'],
                  ['duration-asc', '⏱️ Duration (Short)'],
                  ['duration-desc', '⏱️ Duration (Long)'],
                  ['plays-desc', '🔥 Most Played'],
                  ['plays-asc', '📊 Least Played']
                ].map(([key, label]) => (
                  <button
                    key={key}
                    className="sort-option"
                    onClick={() => handleSort(key)}
                    role="menuitem"
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Shuffle Button */}
          <button
            className="control-btn shuffle-btn"
            onClick={onShufflePlay}
            aria-label="Shuffle and play"
          >
            <Shuffle size={20} />
            <span className="btn-label">s</span>
          </button>

          {/* Add Folder Button */}
          <label htmlFor="file-upload" className="control-btn add-folder-btn">
            <FolderPlus size={20} />
            <span className="btn-label">Add Folder</span>
          </label>
        </div>

        {/* RIGHT - Mobile Actions Button */}
        <button
          className="mobile-actions-btn mobile-controls"
          onClick={() => setMobileActionsOpen((v) => !v)}
          aria-label="More actions"
        >
          <MoreVertical size={22} />
        </button>

        {/* Mobile Actions Panel */}
        {mobileActionsOpen && (
          <div className="mobile-actions-panel">
             {/* Mobile Navigation Links inside Action Panel or separate Menu? 
                 User asked to remove sidebar. I'll add nav items here for mobile or create a mobile menu. 
                 Existing code had mobile-menu-btn. I removed it from the render above.
                 Let's add mobile nav back if needed. 
                 For now, I'll put basic actions.
             */}
            <button className="mobile-action-item" onClick={() => setSortDropdown(true)}>
              <ArrowUpDown size={18} />
              <span>Sort</span>
            </button>
            <button className="mobile-action-item" onClick={handleShuffleClick}>
              <Shuffle size={18} />
              <span>Shuffle</span>
            </button>
            <label htmlFor="file-upload" className="mobile-action-item">
              <FolderPlus size={18} />
              <span>Add Folder</span>
            </label>
             <div className="mobile-nav-divider"></div>
             {navItems.map((item) => (
                <button key={item.path} className="mobile-action-item" onClick={() => { navigate(item.path); setMobileActionsOpen(false); }}>
                    {item.icon}
                    <span>{item.name}</span>
                </button>
             ))}
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        id="file-upload"
        type="file"
        multiple
        accept="audio/*"
        hidden
        onChange={handleFileChange}
      />
    </header>
  );
}

export default Header;
