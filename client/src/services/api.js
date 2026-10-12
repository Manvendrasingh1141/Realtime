const BASE_URL = import.meta.env.VITE_BACKEND_URL || '';

export async function fetchRooms() {
  const res = await fetch(`${BASE_URL}/api/rooms`);
  if (!res.ok) {
    throw new Error('Failed to fetch rooms');
  }
  const data = await res.json();
  return data.rooms || [];
}

export async function createRoom(name) {
  const res = await fetch(`${BASE_URL}/api/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to create room');
  }
  return data.room;
}

export async function fetchRoomDetails(roomId) {
  const res = await fetch(`${BASE_URL}/api/rooms/${roomId}`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Room not found');
  }
  return data.room;
}

export async function fetchRoomMessages(roomId) {
  const res = await fetch(`${BASE_URL}/api/rooms/${roomId}/messages`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to fetch messages');
  }
  return data.messages || [];
}
