// src/context/ThemeContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import './Entire.css';
const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        // Get saved theme from localStorage or default to 'dark'
        const savedTheme = localStorage.getItem('elara-theme');
        return savedTheme || 'dark';
    });

    useEffect(() => {
        // Save theme to localStorage whenever it changes
        localStorage.setItem('elara-theme', theme);
        // Add theme class to document root
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};