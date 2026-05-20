const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { recordDismissed, recordClicked } = require("./fatigueEngine");

let io = null;

const WHITELISTED_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
];

function initSocketIO(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: WHITELISTED_ORIGINS,
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  // Authenticate socket connections via JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        // Allow unauthenticated connections (guest users)
        socket.userId = null;
        socket.userRole = null;
        return next();
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("_id role fullName email");
      if (user) {
        socket.userId = user._id.toString();
        socket.userRole = user.role;
        socket.userName = user.fullName;
        socket.userEmail = user.email;
      }
      next();
    } catch (err) {
      // Allow connection even if token is invalid (guest mode)
      socket.userId = null;
      socket.userRole = null;
      next();
    }
  });

  io.on("connection", (socket) => {
    console.log(`[Socket] Connected: ${socket.id} (user: ${socket.userId || "guest"})`);

    // Join user-specific room for targeted notifications
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    // Join admin room if admin
    if (socket.userRole === "admin") {
      socket.join("admin");
      console.log(`[Socket] Admin joined: ${socket.userName}`);
    }

    // Handle guest room joining (for non-authenticated users with guestId)
    socket.on("join_guest", (guestId) => {
      if (guestId && !socket.userId) {
        socket.join(`guest:${guestId}`);
        socket.guestId = guestId;
        console.log(`[Socket] Guest joined: ${guestId}`);
      }
    });

    // Handle popup interaction tracking
    socket.on("popup_shown", (data) => {
      io.to("admin").emit("popup_event", {
        type: "shown",
        userId: socket.userId || socket.guestId,
        ...data,
        timestamp: Date.now(),
      });
      forwardPopupEvent("shown", socket, data);
    });

    socket.on("popup_clicked", (data) => {
      io.to("admin").emit("popup_event", {
        type: "clicked",
        userId: socket.userId || socket.guestId,
        ...data,
        timestamp: Date.now(),
      });
      forwardPopupEvent("clicked", socket, data);
    });

    socket.on("popup_dismissed", (data) => {
      io.to("admin").emit("popup_event", {
        type: "dismissed",
        userId: socket.userId || socket.guestId,
        ...data,
        timestamp: Date.now(),
      });
      forwardPopupEvent("dismissed", socket, data);
    });

    socket.on("disconnect", (reason) => {
      console.log(`[Socket] Disconnected: ${socket.id} (${reason})`);
    });
  });

  console.log("[Socket] Socket.IO initialized");
  return io;
}

/**
 * Forward popup events to the engine for analytics tracking.
 */
async function forwardPopupEvent(type, socket, data) {
  try {
    const actorId = socket.userId || data.mongoUserId;
    if (actorId && type === "dismissed") await recordDismissed(actorId);
    if (actorId && type === "clicked") await recordClicked(actorId);

    const ENGINE_URL = process.env.ENGINE_URL || "http://127.0.0.1:8000";
    fetch(`${ENGINE_URL}/admin/popup-event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        userId: socket.userId || socket.guestId || "unknown",
        notificationId: data.notificationId,
        triggerReason: data.triggerReason,
      }),
    }).catch(() => {});
  } catch (err) {
    // Silently fail
  }
}

function getIO() {
  if (!io) {
    throw new Error("Socket.IO not initialized. Call initSocketIO first.");
  }
  return io;
}

module.exports = { initSocketIO, getIO };
