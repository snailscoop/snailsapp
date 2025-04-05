import React from 'react';
import { createBrowserRouter, RouterProvider, Outlet, useLocation } from 'react-router-dom';
import { WalletProvider } from './contexts/WalletContext';
import { CollectionsProvider } from './contexts/CollectionsContext';
import { GunProvider } from './contexts/GunContext';
import { ChatProvider } from './contexts/ChatContext';
import { useStargazeStatus } from './hooks/useStargazeStatus';
import Header from './components/Header';
import Home from './pages/Home';
import GettingStarted from './pages/GettingStarted';
import ExploringCosmos from './pages/ExploringCosmos';
import CommunityBuilding from './pages/CommunityBuilding';
import Blogs from './pages/Blogs';
import VideoView from './pages/VideoView';
import { UserProfile } from './pages/UserProfile';
import DMPage from './pages/DMPage';
import AlgoPopup from './components/AlgoPopup';
import PermitTimer from './components/PermitTimer';
import GroupChat from './pages/GroupChat';
import DirectMessages from './pages/DirectMessages';
import Broadcasts from './pages/Broadcasts';
import { TokenGatingDemo } from './pages/TokenGatingDemo';
import './App.css';

const AppLayout: React.FC = () => {
  const apiStatus = useStargazeStatus();
  const location = useLocation();
  const videoId = location.pathname.startsWith('/video/') ? location.pathname.split('/')[2] : undefined;

  return (
    <div className="app">
      <Header apiStatus={apiStatus} />
      <main className="main-content">
        <Outlet />
      </main>
      <AlgoPopup currentTokenId={videoId} />
    </div>
  );
};

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <WalletProvider>
        <CollectionsProvider>
          <GunProvider>
            <ChatProvider>
              <AppLayout />
            </ChatProvider>
          </GunProvider>
        </CollectionsProvider>
      </WalletProvider>
    ),
    children: [
      {
        index: true,
        element: <Home />
      },
      {
        path: "getting-started",
        element: <GettingStarted />
      },
      {
        path: "exploring-cosmos",
        element: <ExploringCosmos />
      },
      {
        path: "community-building",
        element: <CommunityBuilding />
      },
      {
        path: "blogs",
        element: <Blogs />
      },
      {
        path: "video/:videoId",
        element: <VideoView />
      },
      {
        path: "profile",
        element: <UserProfile />
      },
      {
        path: "chats",
        children: [
          {
            path: "groups",
            element: <GroupChat />
          },
          {
            path: "dms",
            element: <DirectMessages />
          },
          {
            path: "broadcasts",
            element: <Broadcasts />
          }
        ]
      },
      {
        path: "token-gating",
        element: <TokenGatingDemo />
      },
      {
        path: "*",
        element: <div>Page not found</div>
      }
    ]
  }
]);

const App: React.FC = () => {
  return (
    <>
      <RouterProvider router={router} />
      <PermitTimer />
    </>
  );
};

export default App;
