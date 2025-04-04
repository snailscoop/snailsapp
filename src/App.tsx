import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WalletProvider } from './contexts/WalletContext';
import { CollectionsProvider } from './contexts/CollectionsContext';
import { GunProvider } from './contexts/GunContext';
import { useStargazeStatus } from './hooks/useStargazeStatus';
import Header from './components/Header';
import Home from './pages/Home';
import GettingStarted from './pages/GettingStarted';
import ExploringCosmos from './pages/ExploringCosmos';
import CommunityBuilding from './pages/CommunityBuilding';
import Blogs from './pages/Blogs';
import VideoView from './pages/VideoView';
import UserProfile from './pages/UserProfile';
import './App.css';

const AppContent: React.FC = () => {
  const apiStatus = useStargazeStatus();

  return (
    <div className="app">
      <Header apiStatus={apiStatus} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/getting-started" element={<GettingStarted />} />
        <Route path="/exploring-cosmos" element={<ExploringCosmos />} />
        <Route path="/community-building" element={<CommunityBuilding />} />
        <Route path="/blogs" element={<Blogs />} />
        <Route path="/video/:videoId" element={<VideoView />} />
        <Route path="/profile" element={<UserProfile />} />
      </Routes>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <WalletProvider>
        <CollectionsProvider>
          <GunProvider>
            <AppContent />
          </GunProvider>
        </CollectionsProvider>
      </WalletProvider>
    </Router>
  );
};

export default App;
