require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');
const { io: ClientIO } = require('socket.io-client');
const mongoose = require('mongoose');

const connectDB = require('./src/db');
const roomRoutes = require('./src/routes/roomRoutes');
const setupSocketIO = require('./src/socket');
const Room = require('./src/models/Room');
const Message = require('./src/models/Message');

async function runIntegrationTest() {
  console.log('--- STARTING INTEGRATION TEST ---');
  await connectDB();

  const app = express();
  app.use(cors());
  app.use(express.json());
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*' } });
  app.set('io', io);
  app.use('/api/rooms', roomRoutes);
  setupSocketIO(io);

  const TEST_PORT = 5055;
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  console.log(`✓ Test server listening on http://localhost:${TEST_PORT}`);

  const SERVER_URL = `http://localhost:${TEST_PORT}`;

  try {
    // 1. Create a room via HTTP API
    console.log('\nStep 1: Creating room via REST API...');
    const createRes = await fetch(`${SERVER_URL}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Integration Test Room' }),
    });
    const createData = await createRes.json();
    if (!createData.success || !createData.room?.roomId) {
      throw new Error(`Failed to create room: ${JSON.stringify(createData)}`);
    }
    const createdRoomId = createData.room.roomId;
    console.log(`✓ Room created successfully! ID: ${createdRoomId}`);

    // 2. Connect Client 1 and Client 2 via Socket.IO
    console.log('\nStep 2: Connecting two Socket.IO clients...');
    const client1 = ClientIO(SERVER_URL, { transports: ['websocket'] });
    const client2 = ClientIO(SERVER_URL, { transports: ['websocket'] });

    await Promise.all([
      new Promise((resolve) => client1.on('connect', resolve)),
      new Promise((resolve) => client2.on('connect', resolve)),
    ]);
    console.log('✓ Both Client 1 and Client 2 connected via WebSockets');

    // 3. Both clients join the room
    await new Promise((resolve) => client1.emit('join_room', { roomId: createdRoomId }, resolve));
    await new Promise((resolve) => client2.emit('join_room', { roomId: createdRoomId }, resolve));
    console.log(`✓ Both clients joined room channel: room:${createdRoomId}`);

    // 4. Client 1 sends message, Client 2 receives in real time
    console.log('\nStep 3: Sending real-time message from Client 1 to Client 2...');
    const messagePromise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Timeout waiting for message on Client 2')), 5000);
      client2.on('new_message', (msg) => {
        clearTimeout(timer);
        resolve(msg);
      });
    });

    const sendAck = await new Promise((resolve) => {
      client1.emit(
        'send_message',
        {
          roomId: createdRoomId,
          senderName: 'Tester Alpha',
          text: 'Hello from automated integration test!',
        },
        resolve
      );
    });

    if (!sendAck.success) {
      throw new Error(`Message send rejected: ${sendAck.error}`);
    }
    console.log('✓ Server acknowledged message persistence');

    const receivedMsg = await messagePromise;
    console.log(`✓ Client 2 received live message: "${receivedMsg.text}" from ${receivedMsg.senderName}`);

    // 5. Test history retrieval (simulate new user joining later)
    console.log('\nStep 4: Verifying history retrieval for late joiners...');
    const historyRes = await fetch(`${SERVER_URL}/api/rooms/${createdRoomId}/messages`);
    const historyData = await historyRes.json();

    if (!historyData.success || historyData.messages.length === 0) {
      throw new Error('History did not contain persisted messages');
    }
    console.log(`✓ Loaded ${historyData.messages.length} messages from database history`);
    console.log(`✓ First message in history matches: "${historyData.messages[0].text}"`);

    // Clean up test data
    console.log('\nStep 5: Cleaning up test artifacts from MongoDB...');
    await Message.deleteMany({ roomId: createdRoomId });
    await Room.deleteOne({ roomId: createdRoomId });
    console.log('✓ Cleanup complete');

    client1.disconnect();
    client2.disconnect();
    server.close();
    await mongoose.disconnect();

    console.log('\n===========================================');
    console.log('🎉 ALL INTEGRATION TESTS PASSED PERFECTLY!');
    console.log('===========================================\n');
    process.exit(0);
  } catch (error) {
    console.error('✗ Test failed:', error);
    process.exit(1);
  }
}

runIntegrationTest();
