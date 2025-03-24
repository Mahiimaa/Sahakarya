const Booking = require('../models/Booking');
const User = require('../models/User');
const Mediation = require('../models/Mediation');
const { createNotification } = require('./bookingController');

const requestMediation = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { additionalInfo } = req.body;
    const userId = req.user ? req.user.id : null;
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
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

    booking = await Booking.findById(bookingId)
    .populate("service", "serviceName")
    .populate("provider")
    .populate("requester");

    try {
    const admins = await User.find({ role: "admin" });
    const serviceName = booking.service ? booking.service.serviceName : "requested service";
    for (const admin of admins) {
      await createNotification(
        admin._id,
        `A booking dispute requires mediation. Service: ${serviceName}`,
        'mediation',
        {
          bookingId: booking._id,
          disputeReason: booking.disputeReason
        }
      );
    }
    const otherPartyId = userId === booking.requester.toString() ? booking.provider._id : booking.requester._id;
    if (otherPartyId) {
      await createNotification(
        otherPartyId,
        `A mediation request has been submitted for your disputed booking`,
        'mediation',
        {
          bookingId: booking._id
        }
      );
    }
  } catch (error) {
    console.error("Error sending notifications:", error);
  }
  try {
    const requesterName = booking.requester ? (booking.requester.username || 'Requester') : 'Requester';
    
    const initialMessage = new Mediation({
      booking: booking._id,
      sender: userId,
      senderName: userId === booking.requester.toString() ? requesterName : (booking.provider ? booking.provider.username : 'Provider'),
      message: `Dispute reason: ${booking.disputeReason || 'Not specified'}\n\nAdditional information: ${additionalInfo || 'None provided'}`,
      timestamp: new Date()
    });
    
    await initialMessage.save();
  } catch (messageError) {
    console.error("Error creating initial mediation message:", messageError);
  }
  
  res.json({ 
    message: "Mediation requested successfully", 
    status: booking.status 
  });
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
      
    if (!mediationCase || mediationCase.status !== "in mediation" && mediationCase.status !== "mediation resolved") {
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
    
    const booking = await Booking.findById(bookingId)
      .populate('requester', 'username')
      .populate('provider', 'username')
      .populate('service', 'serviceName');
    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const isAdmin = user && user.role === "admin";
    
    if (!isAdmin && 
        booking.requester._id.toString() !== userId && 
        booking.provider._id.toString() !== userId) {
      return res.status(403).json({ error: "Unauthorized to send message" });
    }
    
    if (isFromMediator && !isAdmin) {
      return res.status(403).json({ error: "Unauthorized to send mediator messages" });
    }
    
    const newMessage = new Mediation({
      booking: bookingId,
      sender: userId,
      senderName: user.username,
      message,
      isFromMediator: isAdmin && isFromMediator,
      timestamp: new Date()
    });
    
    const savedMessage = await newMessage.save();

    try {
    if (isAdmin) {
      if (booking.requester && booking.requester._id) {
      await createNotification(
        booking.requester,
        `New message from mediator in your disputed booking`,
        'mediation_message',
        { bookingId: booking._id }
      );
    }
      
      if (booking.provider && booking.provider._id) {
      await createNotification(
        booking.provider,
        `New message from mediator in your disputed booking`,
        'mediation_message',
        { bookingId: booking._id }
      );
    }
    } else {
      const otherPartyId = userId === booking.requester.toString() 
      ? (booking.provider ? booking.provider._id.toString() : null)
      : (booking.requester ? booking.requester._id.toString() : null);
      
      if (otherPartyId){
      await createNotification(
        otherPartyId,
        `New message in your mediation case`,
        'mediation_message',
        { bookingId: booking._id }
      );
    }
      
      const admins = await User.find({ role: "admin" });
      const serviceName = booking.service ? booking.service.serviceName : 'Unknown service';
      for (const admin of admins) {
        if (admin._id) {
        await createNotification(
          admin._id.toString(),
          `New message in mediation case: ${serviceName}`,
          'mediation_message',
          { bookingId: booking._id }
        );
      }
    }
  }
  } catch (error) {
    console.error("Error sending notifications:", error);
  } 
  return res.json(savedMessage);
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
    
    const messages = await Mediation.find({ booking: bookingId })
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
    
    if (!decision || finalCredits  === undefined || finalCredits === "") {
      return res.status(400).json({ error: "Decision and final credits are required" });
    }
    
    const booking = await Booking.findById(caseId)
    .populate('requester', 'username email credits')
    .populate('provider', 'username email credits')
    .populate('service', 'serviceName');
    if (!booking || booking.status !== "in mediation") {
      return res.status(404).json({ error: "Mediation case not found" });
    }
    
    booking.status = "mediation resolved";
    booking.mediationResolvedBy = userId;
    booking.mediationResolvedAt = new Date();
    booking.mediationDecision = decision;
    booking.finalCredits = finalCredits;

    const creditsToTransfer = Number(finalCredits);
    if (isNaN(creditsToTransfer) || creditsToTransfer <= 0) {
      return res.status(400).json({ error: "Final credits must be a positive number" });
    }

    const mediationMessage = new Mediation({
      booking: caseId,
      sender: userId,
      senderName: "System",
      message: `MEDIATION RESOLVED\n\nDecision: ${decision}\n\nFinal credits: ${finalCredits}`,
      isFromMediator: true,
      isResolution: true, 
      timestamp: new Date()
    });
    
    await mediationMessage.save();
    try {
      const requester = await User.findById(booking.requester._id);
      const provider = await User.findById(booking.provider._id);
      
      if (requester && provider) {
        requester.credits -= creditsToTransfer;
        
        provider.credits += creditsToTransfer;

        await requester.save();
        await provider.save();
  
        booking.creditTransferred = true;
      }
    } catch (transferError) {
      console.error("Error transferring credits:", transferError);
    }
    
    await booking.save();
    try{
    await createNotification(
      booking.requester._id.toString(),
      `Your mediation case for ${booking.service.serviceName} has been resolved. Final credits transferred: ${finalCredits}`,
      'mediation',
      { 
        bookingId: booking._id,
        decision,
        isResolution: true
      }
    );
    
    await createNotification(
      booking.provider._id.toString(),
      `Your mediation case has been resolved. Final credits: ${finalCredits}`,
      'mediation_resolved',
      { 
        bookingId: booking._id,
        decision,
        isResolution: true
      }
    );
  }catch (notificationError) {
    console.error("Error sending resolution notifications:", notificationError);
  }
    
    res.json({ 
      message: "Mediation resolved successfully",
      booking
    });
  } catch (error) {
    console.error("Error resolving mediation:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getResolvedMediationCases = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized. Admin access required." });
    }
    
    const resolvedCases = await Booking.find({ status: "mediation resolved" })
      .populate('requester', 'username')
      .populate('provider', 'username')
      .populate('service', 'serviceName')
      .sort({ mediationResolvedAt: -1 });
      
    res.json(resolvedCases);
  } catch (error) {
    console.error("Error fetching resolved mediation cases:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports ={requestMediation, getMediationCases, getMediationCaseDetails, sendMediationMessage, resolveMediation, getMediationMessages, getResolvedMediationCases};