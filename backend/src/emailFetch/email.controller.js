import Imap from "imap-simple";
import { simpleParser } from "mailparser";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { createEvent } from "../calendar/calendar.controller.js";
import prisma from "../config/db.js";

dotenv.config();

// ------------------- ZOHO CONFIG -------------------
const IMAP_CONFIG = {
  imap: {
    user: "processor@gowizly.com",
    password: "T1BDNzVaUEit", // App password
    host: "imap.zoho.com",
    port: 993,
    tls: true,
    authTimeout: 30000,
  },
};

// ------------------- GEMINI SETUP -------------------
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getEventTypeColor = (type) => {
  const colors = {
    SCHOOL_EVENT: "#1E90FF",
    ASSIGNMENT_DUE: "#FF8C00",
    EXAM: "#FF6347",
    PARENT_MEETING: "#6A5ACD",
    EXTRACURRICULAR: "#20B2AA",
    APPOINTMENT: "#9370DB",
    BIRTHDAY: "#FFD700",
    HOLIDAY: "#32CD32",
    REMINDER: "#00CED1",
    OTHER: "#808080",
  };
  return colors[type] || "#808080";
};

// ------------------- CLEAN TEXT AND EMAIL -------------------
function cleanText(text = "") {
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/\r?\n|\r/g, " ")
    .replace(/\s+/g, " ")
    .replace(/[|]+/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function extractEmail(raw = "") {
  const match = raw.match(/<([^>]+)>/);
  return match ? match[1].toLowerCase() : raw.toLowerCase();
}

// ------------------- GEMINI ANALYSIS -------------------
async function analyzeEmailContent(emailBody) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });
    const prompt = `
Analyze the following email content and extract event details for a family calendar app. If any events, meetings, assignments, deadlines, or important dates are mentioned, extract them in the exact JSON format below.
**Important:** 
- When dates are mentioned as relative terms (like "next Wednesday"), please convert them to the exact date (YYYY-MM-DD format). 
- If the event does not specify a date explicitly, please skip it.
For each event found, provide:
- title: Clear, concise event title
- description: Brief description of the event
- startDate: Date in YYYY-MM-DD format
- endDate: End date in YYYY-MM-DD format; if no end date is mentioned, set Start Date As End Date
- startTime: Time in HH:MM format (24-hour) or null if all-day
- endTime: End time in HH:MM format (24-hour) or null
- isAllDay: true/false
- type: One of [SCHOOL_EVENT, ASSIGNMENT_DUE, EXAM, PARENT_MEETING, EXTRACURRICULAR, APPOINTMENT, BIRTHDAY, HOLIDAY, REMINDER, OTHER]
- priority: One of [URGENT, HIGH, MEDIUM, LOW]
- hasReminder: true/false based on importance
- reminderMinutes: Number (15, 30, 60, 120) or null
- childName: The name of the child this event belongs to if it’s mentioned otherwise null

Return ONLY valid JSON in this exact format:
{
  "hasEvents": boolean,
  "events": [
    {
      "title": "string",
      "description": "string",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD or null",
      "startTime": "HH:MM or null",
      "endTime": "HH:MM or null", 
      "isAllDay": boolean,
      "type": "EVENT_TYPE",
      "priority": "PRIORITY_LEVEL",
      "hasReminder": boolean,
      "reminderMinutes": number_or_null,
      "childName:"string
    }
  ],
  "analysis": "Brief summary of what was found"
}

Email content:
${emailBody}
`;
    const result = await model.generateContent(prompt);
    const text = (await result.response).text();
    const match = text.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : { hasEvents: false, events: [] };
  } catch (err) {
    console.error("Gemini Error:", err.message);
    return { hasEvents: false, events: [], analysis: "Gemini failed" };
  }
}

// ------------------- FETCH EMAILS CONTROLLER -------------------
export const fetchUserEmails = async (req, res) => {
  try {
    const user = req.user; // ✅ Comes from authenticateToken
    console.log(`🔐 Logged in as: ${user.email}`);

    const connection = await Imap.connect(IMAP_CONFIG);
    await connection.openBox("INBOX");

    const messages = await connection.search(["ALL"], {
      bodies: [""],
      struct: true,
    });

    const userEmails = [];
    for (const msg of messages) {
      const raw = msg.parts?.[0]?.body;
      const parsed = await simpleParser(raw);
      const fromEmail = extractEmail(parsed.from?.text || "");

      if (fromEmail === user.email.toLowerCase()) {
        const emailBody = cleanText(parsed.text || parsed.html);
        console.log(`📧 Email found from ${user.email}: ${parsed.subject}`);

        const analysis = await analyzeEmailContent(emailBody);
        console.log(analysis);

        if (analysis.hasEvents && analysis.events.length > 0) {
          for (const eventData of analysis.events) {
            // ✅ Detect and map child name from AI output
            let finalChildId = null;
            let matchedChildName = null;

            if (eventData.childName) {
              const allChildren = await prisma.child.findMany({
                where: { parentId: user.id },
                select: { id: true, name: true },
              });

              const childMatch = allChildren.find(
                (c) => c.name.toLowerCase() === eventData.childName.toLowerCase() // Exact match only
              );

              if (childMatch) {
                finalChildId = childMatch.id;
                matchedChildName = childMatch.name;
                console.log(`🎯 Matched child "${childMatch.name}" (ID: ${childMatch.id})`);
              } else {
                console.warn(`⚠️ No matching child found for "${eventData.childName}"`);
              }
            }

            // ✅ Duplicate event prevention logic
            const existingEvent = await prisma.event.findFirst({
              where: {
                parentId: user.id,
                title: eventData.title,
                startDate: new Date(eventData.startDate),
                ...(finalChildId ? { eventChildren: { some: { childId: finalChildId } } } : {}),
              },
            });

            if (existingEvent) {
              console.log(`⚠️ Skipping duplicate event: "${eventData.title}" for user ${user.id}`);
              continue; // Skip creating duplicate event
            }

            // ✅ Prepare event data for creation
            const eventPayload = {
              title: eventData.title,
              description: eventData.description || "Event from email analysis",
              startDate: eventData.startDate,
              endDate: eventData.endDate || eventData.startDate,
              startTime: eventData.startTime,
              endTime: eventData.endTime,
              isAllDay: eventData.isAllDay,
              type: eventData.type || "OTHER",
              priority: eventData.priority || "MEDIUM",
              color: getEventTypeColor(eventData.type),
              hasReminder: eventData.hasReminder,
              reminderMinutes: eventData.reminderMinutes,
              childId: finalChildId || null, // Attach the child ID if found
            };

            console.log(
              `🆕 Creating event "${eventData.title}" for ${matchedChildName || "all children"}`
            );

            // ✅ Attach the user to request context for createEvent
            const mockReq = { user, body: eventPayload };
            const mockRes = {
              status: (code) => mockRes,
              json: (data) => {
                console.log("📆 Event Created:", data.msg || data);
              },
            };

            // Call the createEvent function to persist the event
            await createEvent(mockReq, mockRes);
          }
        }

        userEmails.push({
          subject: parsed.subject,
          from: parsed.from.text,
          to: parsed.to.text,
          date: parsed.date,
        });
      }
    }

    await connection.closeBox(false);
    connection.end();

    res.json({
      success: true,
      user: user.email,
      processedEmails: userEmails.length,
      emails: userEmails,
    });
  } catch (error) {
    console.error("❌ Error in fetchUserEmails:", error.message);
    res.status(500).json({ success: false, msg: error.message });
  }
};
