const Message = require('./models/Message');
const Room = require('./models/Room');

function setupSocketIO(io) {
  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Join room channel
    socket.on('join_room', async ({ roomId }, callback) => {
      try {
        if (!roomId) {
          if (typeof callback === 'function') callback({ success: false, error: 'roomId is required' });
          return;
        }

        const room = await Room.findOne({ roomId }).lean();
        if (!room) {
          if (typeof callback === 'function') callback({ success: false, error: 'Room does not exist' });
          return;
        }

        socket.join(`room:${roomId}`);
        console.log(`[Socket] ${socket.id} joined room:${roomId}`);

        if (typeof callback === 'function') {
          callback({ success: true, room });
        }
      } catch (err) {
        console.error('[Socket] join_room error:', err);
        if (typeof callback === 'function') callback({ success: false, error: 'Server error joining room' });
      }
    });

    // Leave room channel
    socket.on('leave_room', ({ roomId }) => {
      if (roomId) {
        socket.leave(`room:${roomId}`);
        console.log(`[Socket] ${socket.id} left room:${roomId}`);
      }
    });

    // Send a message
    socket.on('send_message', async (data, callback) => {
      try {
        const { roomId, senderName, text } = data || {};

        if (!roomId || !text || !text.trim()) {
          const errRes = { success: false, error: 'Message text and roomId cannot be empty' };
          if (typeof callback === 'function') callback(errRes);
          return;
        }

        const trimmedText = text.trim();
        if (trimmedText.length > 2000) {
          const errRes = { success: false, error: 'Message exceeds 2000 characters limit' };
          if (typeof callback === 'function') callback(errRes);
          return;
        }

        const safeSender = (senderName && typeof senderName === 'string' && senderName.trim()) 
          ? senderName.trim().slice(0, 30) 
          : 'Guest';

        // 1. Verify Room exists
        const room = await Room.findOne({ roomId });
        if (!room) {
          const errRes = { success: false, error: 'Room does not exist' };
          if (typeof callback === 'function') callback(errRes);
          return;
        }

        // 2. Persist message in MongoDB
        const newMessage = await Message.create({
          roomId,
          senderName: safeSender,
          text: trimmedText,
          timestamp: new Date(),
        });

        // 3. Increment messageCount and update lastMessageAt
        room.messageCount = (room.messageCount || 0) + 1;
        room.lastMessageAt = newMessage.timestamp;
        await room.save();

        const messagePayload = {
          _id: newMessage._id,
          roomId: newMessage.roomId,
          senderName: newMessage.senderName,
          text: newMessage.text,
          timestamp: newMessage.timestamp,
          createdAt: newMessage.createdAt,
        };

        // 4. Broadcast to everyone in the room (including sender or acknowledge sender)
        io.to(`room:${roomId}`).emit('new_message', messagePayload);

        // 5. Broadcast room update for home page room list cards
        io.emit('room_updated', {
          roomId: room.roomId,
          messageCount: room.messageCount,
          lastMessageAt: room.lastMessageAt,
        });

        // 6. Acknowledge the sender
        if (typeof callback === 'function') {
          callback({ success: true, message: messagePayload });
        }
      } catch (err) {
        console.error('[Socket] send_message error:', err);
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Failed to persist and send message' });
        }
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
}

module.exports = setupSocketIO;
