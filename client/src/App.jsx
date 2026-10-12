import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import RoomPage from './components/RoomPage';
import { socket } from './services/socket';
import { fetchRooms, createRoom as apiCreateRoom } from './services/api';
import { getAnonymousUser } from './services/identity';

export default function App() {
  const [currentUser] = useState(() => getAnonymousUser());
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [currentRoomId, setCurrentRoomId] = useState(() => {
    // Read from URL hash on initial load (e.g., #room=design-sync-x1y2)
    const hash = window.location.hash;
    const match = hash.match(/#room=([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  });

  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [roomsError, setRoomsError] = useState(null);

  // Sync URL hash with currentRoomId
  const navigateToRoom = useCallback((roomId) => {
    setCurrentRoomId(roomId);
    if (roomId) {
      window.location.hash = `#room=${roomId}`;
    } else {
      window.history.pushState(null, '', window.location.pathname + window.location.search);
    }
  }, []);

  // Listen to browser hash changes (e.g. back/forward buttons or pasted link)
  useEffect(() => {
    const handleHashChange = () => {
      const match = window.location.hash.match(/#room=([a-zA-Z0-9_-]+)/);
      setCurrentRoomId(match ? match[1] : null);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Fetch rooms list
  const loadRooms = useCallback(async () => {
    try {
      setLoadingRooms(true);
      setRoomsError(null);
      const data = await fetchRooms();
      setRooms(data);
    } catch (err) {
      console.error('Failed to load rooms:', err);
      setRoomsError('Could not load rooms. Ensure the backend server is reachable.');
    } finally {
      setLoadingRooms(false);
    }
  }, []);

  // Socket connection listeners and real-time room updates
  useEffect(() => {
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    // Global room creation event (new room appears in all clients in real time)
    const onRoomCreated = (newRoom) => {
      setRooms((prev) => {
        const exists = prev.some((r) => r.roomId === newRoom.roomId);
        if (exists) return prev;
        return [newRoom, ...prev];
      });
    };

    // Global room updated event (message counter changes in real time)
    const onRoomUpdated = ({ roomId, messageCount, lastMessageAt }) => {
      setRooms((prev) =>
        prev.map((r) =>
          r.roomId === roomId
            ? { ...r, messageCount, lastMessageAt: lastMessageAt || new Date() }
            : r
        )
      );
    };

    socket.on('room_created', onRoomCreated);
    socket.on('room_updated', onRoomUpdated);

    // Initial rooms fetch
    loadRooms();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room_created', onRoomCreated);
      socket.off('room_updated', onRoomUpdated);
    };
  }, [loadRooms]);

  // Create room action
  const handleCreateRoom = async (roomName) => {
    const createdRoom = await apiCreateRoom(roomName);
    // Optimistically prepend if not already added by socket
    setRooms((prev) => {
      const exists = prev.some((r) => r.roomId === createdRoom.roomId);
      return exists ? prev : [createdRoom, ...prev];
    });
    return createdRoom;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      <Navbar
        isConnected={isConnected}
        currentUser={currentUser}
        onHomeClick={() => navigateToRoom(null)}
      />

      <main className="flex-1">
        {currentRoomId ? (
          <RoomPage
            roomId={currentRoomId}
            currentUser={currentUser}
            onBack={() => navigateToRoom(null)}
          />
        ) : (
          <HomePage
            rooms={rooms}
            loading={loadingRooms}
            error={roomsError}
            onCreateRoom={handleCreateRoom}
            onOpenRoom={(roomId) => navigateToRoom(roomId)}
            onRefresh={loadRooms}
          />
        )}
      </main>
    </div>
  );
}
