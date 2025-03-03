import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import './App.css';

function App() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={darkMode ? 'dark font-sans' : 'font-sans'}>
      <Router>
        <div className="min-h-screen bg-white dark:bg-gray-900 text-black dark:text-gray-100">
          <Navbar />
          <div className="p-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="mb-4 bg-gray-200 dark:bg-gray-700 text-black dark:text-white px-4 py-2 rounded-md"
            >
              {darkMode ? 'Light' : 'Dark'}
            </button>

            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
            </Routes>
          </div>
        </div>
      </Router>
    </div>
  );
}

export default App;
