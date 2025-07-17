
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from "./pages/dashboard";
import Deposit from './pages/deposit';
import React, { useState } from 'react';


function App() {

  return (
    <div className="min-h-screen p-6 space-y-6 bg-gray-100 text-gray-800">
      <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route
  path="/deposit"
  element={<Deposit  />}
/>
      </Routes>
    </Router>
   
    </div>
  );
}

export default App;
