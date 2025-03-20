const Notification = require("../models/Notification");

const getNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await Notification.find({ userId }).
    sort({ createdAt: -1 })
    .populate('data.senderId', 'username')
    .populate('data.requesterId', 'username')
    .populate('data.bookingId', 'status')
    .populate('data.serviceId', 'serviceName');

    const unreadCount = await Notification.countDocuments({ 
      userId, 
      isRead: false 
    })
    res.json({notifications, unreadCount});
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Internal server error" });
  }   
};

const readNotifications = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;
    
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    
    res.json(notification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );
    
    res.json({ message: "All notifications marked as read",
      count: result.modifiedCount
     });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;
    
    const notification = await Notification.findOneAndDelete({ _id: notificationId, userId });
    
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    
    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteAllRead = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await Notification.deleteMany({ userId, isRead: true });
    
    res.json({ 
      message: "All read notifications deleted",
      count: result.deletedCount
    });
  } catch (error) {
    console.error("Error deleting read notifications:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


module.exports = {getNotifications, markAllAsRead, deleteNotification, deleteAllRead, readNotifications};