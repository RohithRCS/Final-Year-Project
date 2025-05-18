const { GoogleGenerativeAI } = require("@google/generative-ai");
const router = require("express").Router();
const mongoose = require("mongoose");
const User = require("../models/user");
const jwt = require('jsonwebtoken');

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI("AIzaSyC8DAChYdFPif4RgQSYVkneoMHKDvnjgrw");

// POST endpoint to send a message
router.post("/", async (req, res) => {
    try {
        console.log("Chat API Hit!");
        console.log("Received request body:", req.body);

        const { message, userId } = req.body;

        if (!message || typeof message !== "string") {
            return res.status(400).json({ error: "Message is required and must be a string" });
        }

        // Ensure userId is a valid ObjectId
        const objectId = mongoose.Types.ObjectId.isValid(userId) 
            ? new mongoose.Types.ObjectId(userId) 
            : null;

        if (!objectId) {
            return res.status(400).json({ error: "Invalid or missing User ID" });
        }

        // Validate that the requesting user can only access their own chats
        if (req.userData && req.userData.userId !== userId) {
            return res.status(403).json({ error: "Unauthorized access to chat history" });
        }

        // Fetch User & Chat History
        const user = await User.findById(objectId);
        
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const chatHistory = user.chats.slice(-5) // Get last 5 messages
            .map(msg => `${msg.role}: ${msg.content}`)
            .join("\n");

        // Generate AI response
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        let aiResponse;
        try {
            const result = await model.generateContent({
                contents: [{
                    role: "user",
                    parts: [{ text: `
                        You are a caring AI companion and healthcare assistant for elders.
                         Provide short and supportive answers for small questions. 
                         For emergencies or assistance, give clear and detailed responses. 
                         For general inquiries, offer moderately long, helpful answers—neither too short nor too long.
                         If i ask about animations or cartoons give me detailed responses within 10 lines, be very energetic and ethusiastic.
                         Don't suggest other applications.
                         Keep answers professional with no informal words like dear etc
                        Chat History:
                        ${chatHistory}

                        User: ${message}

                        Assistant:
                    ` }]
                }]
            });

            aiResponse = result?.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
                         "I'm sorry, I couldn't process that.";

        } catch (aiError) {
            console.error("Error generating AI response:", aiError);
            aiResponse = "I'm having trouble responding right now. Please try again later.";
        }

        // Save Chat Messages in User's Chats Array
        const timestamp = new Date();
        
        user.chats.push({ 
            role: "user", 
            content: message,
            timestamp
        });
        
        user.chats.push({ 
            role: "bot", 
            content: aiResponse,
            timestamp: new Date(timestamp.getTime() + 1000) // 1 second after user message
        });
        
        await user.save(); // Save updates

        return res.json({ 
            message: aiResponse,
            timestamp: new Date()
        });

    } catch (error) {
        console.error("Error in chat endpoint:", error);
        return res.status(500).json({ error: "Failed to process your request" });
    }
});

// GET endpoint to fetch chat history
router.get("/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        // Ensure userId is a valid ObjectId
        const objectId = mongoose.Types.ObjectId.isValid(userId) 
            ? new mongoose.Types.ObjectId(userId) 
            : null;

        if (!objectId) {
            return res.status(400).json({ error: "Invalid User ID" });
        }

        // Validate that the requesting user can only access their own chats
        if (req.userData && req.userData.userId !== userId) {
            return res.status(403).json({ error: "Unauthorized access to chat history" });
        }

        const user = await User.findById(objectId);

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Format chat history for frontend
        const formattedChats = user.chats.map((chat, index) => ({
            id: index.toString(),
            role: chat.role,
            content: chat.content,
            timestamp: chat.timestamp || new Date()
        }));

        return res.json(formattedChats);
        
    } catch (error) {
        console.error("Error retrieving chat history:", error);
        return res.status(500).json({ error: "Failed to retrieve chat history" });
    }
});

module.exports = router;