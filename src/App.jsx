import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './components/HomePage';
import SOSPage from './components/SOSPage';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route exact path="/" element={<HomePage />} />
        <Route path="/sos" element={<SOSPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
