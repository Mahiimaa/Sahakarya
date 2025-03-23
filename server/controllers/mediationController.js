const Booking = require('../models/Booking');
const User = require('../models/User');
const MediationMessage = require('../models/MediationMessage');
const { createNotification } = require('./bookingController');

const requestMediation = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { additionalInfo } = req.body;
    const userId = req.user.id;
    
    let booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    if (booking.requester.toString() !== userId && booking.provider.toString() !== userId) {
      return res.status(403).json({ error: "Unauthorized to request mediation" });
    }
    
    if (booking.status !== "disputed") {
      return res.status(400).json({ error: "Only disputed bookings can request mediation" });
    }
    
    booking.status = "in mediation";
    booking.mediationRequestedBy = userId;
    booking.mediationRequestedAt = new Date();
    booking.mediationAdditionalInfo = additionalInfo || '';
    
    await booking.save();
    const admins = await User.find({ role: "admin" });
    for (const admin of admins) {
      await createNotification(
        admin._id,
        `A booking dispute requires mediation. Service: ${booking.service.serviceName}`,
        'mediation',
        {
          bookingId: booking._id,
          disputeReason: booking.disputeReason
        }
      );
    }
    const otherPartyId = userId === booking.requester.toString() ? booking.provider : booking.requester;
    await createNotification(
      otherPartyId,
      `A mediation request has been submitted for your disputed booking`,
      'mediation',
      {
        bookingId: booking._id
      }
    );
    
    res.json({ message: "Mediation requested successfully", status: booking.status });
  } catch (error) {
    console.error("Error requesting mediation:", error);
    res.status(500).json({ error: "Server error" });
  }
};
const getMediationCases = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized. Admin access required." });
    }
    
    const mediationCases = await Booking.find({ status: "in mediation" })
      .populate('requester', 'username')
      .populate('provider', 'username')
      .populate('service', 'serviceName')
      .sort({ mediationRequestedAt: -1 });
      
    res.json(mediationCases);
  } catch (error) {
    console.error("Error fetching mediation cases:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getMediationCaseDetails = async (req, res) => {
  try {
    const userId = req.user.id;
    const { caseId } = req.params;
    const user = await User.findById(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized. Admin access required." });
    }
    
    const mediationCase = await Booking.findById(caseId)
      .populate('requester', 'username email')
      .populate('provider', 'username email')
      .populate('service', 'serviceName');
      
    if (!mediationCase || mediationCase.status !== "in mediation") {
      return res.status(404).json({ error: "Mediation case not found" });
    }
    
    res.json(mediationCase);
  } catch (error) {
    console.error("Error fetching mediation case details:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const sendMediationMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookingId } = req.params;
    const { message, isFromMediator } = req.body;
    
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    
    const user = await User.findById(userId);
    const isAdmin = user && user.role === "admin";
    
    if (!isAdmin && 
        booking.requester.toString() !== userId && 
        booking.provider.toString() !== userId) {
      return res.status(403).json({ error: "Unauthorized to send message" });
    }
    
    if (isFromMediator && !isAdmin) {
      return res.status(403).json({ error: "Unauthorized to send mediator messages" });
    }
    
    const newMessage = new MediationMessage({
      booking: bookingId,
      sender: userId,
      senderName: user.username,
      message,
      isFromMediator: isAdmin && isFromMediator,
      timestamp: new Date()
    });
    
    await newMessage.save();

    if (isAdmin) {
      await createNotification(
        booking.requester,
        `New message from mediator in your disputed booking`,
        'mediation_message',
        { bookingId: booking._id }
      );
      
      await createNotification(
        booking.provider,
        `New message from mediator in your disputed booking`,
        'mediation_message',
        { bookingId: booking._id }
      );
    } else {
      const otherPartyId = userId === booking.requester.toString() ? booking.provider : booking.requester;
      
      await createNotification(
        otherPartyId,
        `New message in your mediation case`,
        'mediation_message',
        { bookingId: booking._id }
      );
      
      const admins = await User.find({ role: "admin" });
      for (const admin of admins) {
        await createNotification(
          admin._id,
          `New message in mediation case: ${booking.service.serviceName}`,
          'mediation_message',
          { bookingId: booking._id }
        );
      }
    }
    
    res.json({ message: "Message sent successfully" });
  } catch (error) {
    console.error("Error sending mediation message:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getMediationMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { bookingId } = req.params;
    
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    const user = await User.findById(userId);
    const isAdmin = user && user.role === "admin";
    
    if (!isAdmin && 
        booking.requester.toString() !== userId && 
        booking.provider.toString() !== userId) {
      return res.status(403).json({ error: "Unauthorized to view messages" });
    }
    
    const messages = await MediationMessage.find({ booking: bookingId })
      .sort({ timestamp: 1 });
    
    res.json(messages);
  } catch (error) {
    console.error("Error fetching mediation messages:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const resolveMediation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { caseId } = req.params;
    const { decision, finalCredits } = req.body;
    
    const user = await User.findById(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized. Admin access required." });
    }
    
    if (!decision || !finalCredits) {
      return res.status(400).json({ error: "Decision and final credits are required" });
    }
    
    const booking = await Booking.findById(caseId);
    if (!booking || booking.status !== "in mediation") {
      return res.status(404).json({ error: "Mediation case not found" });
    }
    
    booking.status = "mediation resolved";
    booking.mediationResolvedBy = userId;
    booking.mediationResolvedAt = new Date();
    booking.mediationDecision = decision;
    booking.finalCredits = finalCredits;
    
    await booking.save();
    await createNotification(
      booking.requester,
      `Your mediation case has been resolved. Final credits: ${finalCredits}`,
      'mediation_resolved',
      { 
        bookingId: booking._id,
        decision
      }
    );
    
    await createNotification(
      booking.provider,
      `Your mediation case has been resolved. Final credits: ${finalCredits}`,
      'mediation_resolved',
      { 
        bookingId: booking._id,
        decision
      }
    );
    
    res.json({ 
      message: "Mediation resolved successfully",
      booking
    });
  } catch (error) {
    console.error("Error resolving mediation:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports ={requestMediation, getMediationCases, getMediationCaseDetails, sendMediationMessage, resolveMediation, getMediationMessages}