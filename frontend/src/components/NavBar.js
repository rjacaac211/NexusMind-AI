import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  return (
    /* 
       "fixed top-0 left-0 w-full z-50" pins the navbar 
       at the top, spanning the full width, with a high z-index 
       so it stays above the chat content.
    */
    <nav className="fixed top-0 left-0 w-full z-50 bg-gray-900 text-white py-4 px-6 flex justify-between items-center">
      <h1 className="text-xl font-bold">NexusMind AI</h1>
      <div className="space-x-2">
        <Link
          to="/"
          className="px-3 py-2 rounded-md transition-colors duration-200 hover:bg-gray-700"
        >
          Home
        </Link>
        <Link
          to="/about"
          className="px-3 py-2 rounded-md transition-colors duration-200 hover:bg-gray-700"
        >
          About
        </Link>
        <Link
          to="/contact"
          className="px-3 py-2 rounded-md transition-colors duration-200 hover:bg-gray-700"
        >
          Contact
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
