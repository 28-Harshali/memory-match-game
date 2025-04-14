A distributed system is a collection of independent nodes that appear to users as a single cohesive system. Our Memory Match game leverages distributed system principles to allow real-time interaction between two players across the network using WebSockets.
The project uses a basic client-server model:
          Frontend: HTML, CSS, JavaScript (Vanilla)
          Backend: Node.js with Express and Socket.IO
 The server exposes the static frontend and manages game logic through real-time communication. Socket.IO enables bidirectional communication to sync actions between clients.
