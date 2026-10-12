import React, { useState } from 'react';
import { Plus, MessageSquare, ArrowRight, Hash, Search, Loader2, Sparkles, RefreshCw } from 'lucide-react';

export default function HomePage({
  rooms,
  loading,
  error,
  onCreateRoom,
  onOpenRoom,
  onRefresh,
}) {
  const [newRoomName, setNewRoomName] = useState('');
  const [creating, setCreating] = useState('');
  const [createError, setCreateError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const trimmed = newRoomName.trim();
    if (!trimmed) {
      setCreateError('Please enter a room name');
      return;
    }
    if (trimmed.length > 60) {
      setCreateError('Room name must be 60 characters or fewer');
      return;
    }

    try {
      setCreating(true);
      setCreateError('');
      const createdRoom = await onCreateRoom(trimmed);
      setNewRoomName('');
      if (createdRoom && createdRoom.roomId) {
        onOpenRoom(createdRoom.roomId);
      }
    } catch (err) {
      setCreateError(err.message || 'Failed to create room. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const filteredRooms = rooms.filter((r) =>
    (r.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.roomId || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Hero Section */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          Permanent Storage • Real-Time WebSockets • No Sign-up
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
          Collaborative Rooms <br />
          <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-indigo-200 bg-clip-text text-transparent">
            Built for Instant Chat
          </span>
        </h1>
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          Create or join any shared space. All rooms and chat histories are permanently stored in MongoDB
          and synchronized across connected clients in real time.
        </p>
      </div>

      {/* Create Room Card */}
      <div className="max-w-xl mx-auto bg-slate-800/60 backdrop-blur border border-slate-700/80 rounded-2xl p-6 shadow-xl mb-12">
        <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
          <Plus className="w-5 h-5 text-indigo-400" />
          Create a New Room
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          Enter a room name to create a public space. A unique room ID will be automatically generated.
        </p>

        <form onSubmit={handleCreateSubmit} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={newRoomName}
              onChange={(e) => {
                setNewRoomName(e.target.value);
                if (createError) setCreateError('');
              }}
              placeholder="e.g. Design Sync, Tech Discussion, General"
              maxLength={60}
              disabled={creating}
              className="flex-1 bg-slate-900/90 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={creating || !newRoomName.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2.5 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Create Room
                </>
              )}
            </button>
          </div>

          {createError && (
            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg">
              {createError}
            </p>
          )}
        </form>
      </div>

      {/* Available Rooms Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              Available Rooms
              <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                {rooms.length}
              </span>
            </h3>
            <p className="text-xs text-slate-400">Join any room to read history and send live messages</p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Search Filter */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search rooms..."
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              title="Refresh rooms list"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button onClick={onRefresh} className="underline text-xs hover:text-white ml-2">
              Try again
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
            <p className="text-sm">Loading available rooms...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && rooms.length === 0 && (
          <div className="text-center py-16 px-4 border border-dashed border-slate-800 rounded-2xl bg-slate-850/40">
            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h4 className="text-base font-semibold text-white mb-1">No rooms created yet</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              Be the first to create a collaboration room above! Anyone visiting will be able to join.
            </p>
          </div>
        )}

        {/* Filtered Empty State */}
        {!loading && rooms.length > 0 && filteredRooms.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <p className="text-sm">No rooms match "{searchQuery}"</p>
          </div>
        )}

        {/* Rooms Grid */}
        {!loading && filteredRooms.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRooms.map((room) => (
              <div
                key={room.roomId || room._id}
                className="group bg-slate-850 bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/60 hover:border-indigo-500/50 rounded-2xl p-5 transition-all duration-200 flex flex-col justify-between shadow-lg hover:shadow-indigo-500/10"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-base font-semibold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                      {room.name}
                    </h4>
                    <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-300 border border-slate-600/40 shrink-0">
                      <MessageSquare className="w-3 h-3 text-indigo-400" />
                      {room.messageCount || 0}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
                    <Hash className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="font-mono text-[11px] text-slate-400 truncate">
                      {room.roomId}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-750 border-slate-700/40 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    {room.createdAt
                      ? new Date(room.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'Active'}
                  </span>
                  <button
                    onClick={() => onOpenRoom(room.roomId)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 group-hover:translate-x-0.5 transition-all cursor-pointer"
                  >
                    Open Room
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
