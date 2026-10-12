const express = require('express');
const { customAlphabet } = require('nanoid');
const Room = require('../models/Room');
const Message = require('../models/Message');

const router = express.Router();
const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8);

// Generate human-friendly URL-safe ID
function generateRoomId(name) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 20);
  const randomSuffix = nanoid();
  return slug ? `${slug}-${randomSuffix}` : randomSuffix;
}

// GET all rooms
router.get('/', async (req, res) => {
  try {
    const rooms = await Room.find().sort({ lastMessageAt: -1, createdAt: -1 }).lean();
    res.json({ success: true, rooms });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch rooms' });
  }
});

// CREATE a new room
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Room name is required' });
    }

    const trimmedName = name.trim();
    if (trimmedName.length > 60) {
      return res.status(400).json({ success: false, error: 'Room name cannot exceed 60 characters' });
    }

    const roomId = generateRoomId(trimmedName);

    const newRoom = await Room.create({
      roomId,
      name: trimmedName,
      messageCount: 0,
      lastMessageAt: new Date(),
    });

    // Notify connected clients on home page about new room if socket.io is accessible
    const io = req.app.get('io');
    if (io) {
      io.emit('room_created', newRoom);
    }

    res.status(201).json({ success: true, room: newRoom });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ success: false, error: 'Failed to create room' });
  }
});

// GET a specific room by roomId
router.get('/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findOne({ roomId }).lean();

    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    res.json({ success: true, room });
  } catch (error) {
    console.error('Error fetching room details:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch room' });
  }
});

// GET message history for a room
router.get('/:roomId/messages', async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findOne({ roomId }).lean();
    if (!room) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    const messages = await Message.find({ roomId }).sort({ timestamp: 1, createdAt: 1 }).lean();
    res.json({ success: true, messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  }
});

module.exports = router;
