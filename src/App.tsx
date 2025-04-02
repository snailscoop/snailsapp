import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WalletProvider } from './contexts/WalletContext';
import { CollectionsProvider } from './contexts/CollectionsContext';
import Header from './components/Header';
import Hero from './components/Hero';
import ContentCategories from './components/ContentCategories';
import GettingStarted from './pages/GettingStarted';
import './App.css';

const App: React.FC = () => {
  return (
    <Router>
      <WalletProvider>
        <CollectionsProvider>
          <div className="app">
            <Header />
            <Routes>
              <Route index element={
                <>
                  <Hero />
                  <ContentCategories />
                </>
              } />
              <Route path="getting-started" element={<GettingStarted />} />
            </Routes>
          </div>
        </CollectionsProvider>
      </WalletProvider>
    </Router>
  );
};

export default App;
