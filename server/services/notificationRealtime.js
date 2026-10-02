export function createNotificationPublisher({
  io,
  serverUrl,
  sharedSecret,
  timeoutMs = 5000,
  fetchImpl = fetch,
}) {
  return async (notification) => {
    const receiverId = String(notification.recipient);
    const payload = notification.toObject?.() || notification;

    if (serverUrl && sharedSecret) {
      try {
        const response = await fetchImpl(`${serverUrl}/api/realtime/notifications`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Realtime-Secret": sharedSecret,
          },
          body: JSON.stringify({ receiverId, notification: payload }),
          signal: AbortSignal.timeout(timeoutMs),
        });
        if (response.ok) return;
        console.error(`Notification realtime relay returned ${response.status}`);
      } catch (error) {
        console.error("Khong the gui thong bao realtime:", error.message);
      }
    }

    io.to(`user_${receiverId}`).emit("newNotification", payload);
  };
}

export function createNotificationRelayHandler({ io, sharedSecret }) {
  return (req, res) => {
    if (!sharedSecret || req.get("X-Realtime-Secret") !== sharedSecret) {
      return res.status(401).json({ message: "Realtime secret khong hop le" });
    }

    const { receiverId, notification } = req.body || {};
    if (
      typeof receiverId !== "string" ||
      !/^[a-f\d]{24}$/i.test(receiverId) ||
      !notification?._id ||
      String(notification.recipient) !== receiverId ||
      typeof notification.title !== "string" ||
      typeof notification.message !== "string"
    ) {
      return res.status(400).json({ message: "Du lieu thong bao realtime khong hop le" });
    }

    io.to(`user_${receiverId}`).emit("newNotification", notification);
    return res.status(202).json({ delivered: true });
  };
}
