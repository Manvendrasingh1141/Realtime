import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Send,
  Loader2,
  Copy,
  Check,
  AlertCircle,
  Hash,
  Users,
  MessageSquare,
} from 'lucide-react';
import { socket } from '../services/socket';
import { fetchRoomDetails, fetchRoomMessages } from '../services/api';

export default function RoomPage({ roomId, currentUser, onBack }) {
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [copied, setCopied] = useState(false);

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Auto scroll to bottom
  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Load Room and Messages history
  useEffect(() => {
    let isMounted = true;

    async function loadRoomData() {
      try {
        setLoading(true);
        setError(null);

        const [roomData, messagesData] = await Promise.all([
          fetchRoomDetails(roomId),
          fetchRoomMessages(roomId),
        ]);

        if (isMounted) {
          setRoom(roomData);
          setMessages(messagesData || []);
          setTimeout(() => scrollToBottom('auto'), 100);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error loading room:', err);
          setError(err.message || 'Failed to load room history.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadRoomData();

    // Socket.IO Room Joining and Listeners
    socket.emit('join_room', { roomId }, (ack) => {
      if (ack && !ack.success) {
        console.warn('Socket join_room warning:', ack.error);
      }
    });

    const handleNewMessage = (newMsg) => {
      if (newMsg.roomId === roomId) {
        setMessages((prev) => {
          // Deduplicate by _id or fallback
          const exists = prev.some((m) => m._id === newMsg._id);
          if (exists) return prev;
          return [...prev, newMsg];
        });
        setTimeout(() => scrollToBottom('smooth'), 50);
      }
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      isMounted = false;
      socket.emit('leave_room', { roomId });
      socket.off('new_message', handleNewMessage);
    };
  }, [roomId]);

  // Handle Send Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setSendError('');

    socket.emit(
      'send_message',
      {
        roomId,
        senderName: currentUser,
        text: trimmed,
      },
      (response) => {
        setSending(false);
        if (response && response.success) {
          setInputText('');
          // Ensure sender also has message if not received via broadcast
          setMessages((prev) => {
            const exists = prev.some((m) => m._id === response.message._id);
            if (exists) return prev;
            return [...prev, response.message];
          });
          setTimeout(() => scrollToBottom('smooth'), 50);
        } else {
          setSendError(
            (response && response.error) || 'Failed to deliver message. Check connection.'
          );
        }
      }
    );
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex flex-col h-[calc(100vh-4rem)]">
      {/* Header bar */}
      <div className="bg-slate-800/80 backdrop-blur border border-slate-700/80 rounded-2xl p-4 mb-4 shadow-lg flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer shrink-0"
            title="Back to all rooms"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-white truncate flex items-center gap-2">
              {room ? room.name : 'Loading Room...'}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-mono text-slate-400 flex items-center gap-0.5 truncate">
                <Hash className="w-3 h-3 text-slate-500 shrink-0" />
                {roomId}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-indigo-400">{messages.length} messages</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-700 text-xs font-medium text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer"
            title="Copy room link to invite others"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied Link</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Copy Link</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Messages Container */}
      <div className="flex-1 bg-slate-800/40 border border-slate-700/60 rounded-2xl shadow-xl flex flex-col overflow-hidden min-h-0">
        {/* Messages List Area */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
        >
          {loading && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-16">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
              <p className="text-sm">Fetching message history from MongoDB...</p>
            </div>
          )}

          {error && !loading && (
            <div className="h-full flex flex-col items-center justify-center text-rose-400 py-16 px-4 text-center">
              <AlertCircle className="w-10 h-10 mb-2 text-rose-400" />
              <p className="text-sm font-medium mb-3">{error}</p>
              <button
                onClick={onBack}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
              >
                Return to Rooms
              </button>
            </div>
          )}

          {!loading && !error && messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500 mb-3">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="text-base font-medium text-slate-200 mb-1">
                This room is quiet right now
              </p>
              <p className="text-xs text-slate-400 max-w-sm">
                Send the first message below. Any user joining later will see this message.
              </p>
            </div>
          )}

          {!loading &&
            !error &&
            messages.map((msg, index) => {
              const isMine = msg.senderName === currentUser;
              return (
                <div
                  key={msg._id || index}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <span
                      className={`text-xs font-semibold ${
                        isMine ? 'text-indigo-400' : 'text-slate-300'
                      }`}
                    >
                      {msg.senderName || 'Guest'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {formatTime(msg.timestamp || msg.createdAt)}
                    </span>
                  </div>

                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-md break-words ${
                      isMine
                        ? 'bg-indigo-600 text-white rounded-tr-none'
                        : 'bg-slate-800 text-slate-100 border border-slate-700/80 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              );
            })}

          <div ref={messagesEndRef} />
        </div>

        {/* Send Error Notice */}
        {sendError && (
          <div className="mx-4 mb-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
            <span>{sendError}</span>
            <button
              onClick={() => setSendError('')}
              className="text-rose-400 hover:text-white ml-2 font-bold"
            >
              ×
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-slate-900/90 border-t border-slate-800">
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                if (sendError) setSendError('');
              }}
              placeholder={`Send message as ${currentUser}...`}
              maxLength={2000}
              disabled={loading || !!error}
              className="flex-1 bg-slate-800/90 border border-slate-750 border-slate-700 text-white rounded-xl px-4 py-3 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || sending || loading || !!error}
              className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-600/30 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
              title="Send message (Enter)"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
