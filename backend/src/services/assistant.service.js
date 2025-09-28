import { logDebug, logInfo, logWarn } from "../utils/logger.js";
import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";

// import {GoogleGenAI} from '@google/genai';

// const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});

// async function main() {
//   const response = await ai.models.generateContent({
//     model: 'gemini-2.0-flash-001',
//     contents: 'Why is the sky blue?',
//   });
//   console.log(response.text);
// }

// main();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Event type color mapping
const EVENT_TYPE_COLORS = {
  SCHOOL_EVENT: '#3B82F6',      // Blue
  ASSIGNMENT_DUE: '#EF4444',    // Red
  EXAM: '#DC2626',              // Dark Red
  PARENT_MEETING: '#8B5CF6',    // Purple
  EXTRACURRICULAR: '#10B981',   // Green
  APPOINTMENT: '#F59E0B',       // Orange
  BIRTHDAY: '#EC4899',          // Pink
  HOLIDAY: '#14B8A6',           // Teal
  REMINDER: '#6B7280',          // Gray
  OTHER: '#6366F1'              // Indigo
};

// Common date patterns for email analysis
const DATE_PATTERNS = [
  /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/g, // MM/DD/YYYY or MM-DD-YYYY
  /\b(\d{2,4})[\/\-](\d{1,2})[\/\-](\d{1,2})\b/g, // YYYY/MM/DD or YYYY-MM-DD
  /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{2,4})\b/gi,
  /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2}),?\s+(\d{2,4})\b/gi,
  /\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{2,4})\b/gi,
  /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{2,4})\b/gi
];

// Common time patterns
const TIME_PATTERNS = [
  /\b(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)\b/gi,
  /\b(\d{1,2}):(\d{2}):(\d{2})\s*(AM|PM|am|pm)\b/gi,
  /\b(\d{1,2}):(\d{2})\b/g, // 24-hour format
  /\bat\s+(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)\b/gi,
  /\bat\s+(\d{1,2})\s*(AM|PM|am|pm)\b/gi
];

// Event keywords and their corresponding types
const EVENT_KEYWORDS = {
  SCHOOL_EVENT: ['school', 'class', 'lecture', 'presentation', 'field trip', 'assembly', 'conference', 'workshop'],
  ASSIGNMENT_DUE: ['assignment', 'homework', 'project due', 'deadline', 'submit', 'turn in', 'due date'],
  EXAM: ['exam', 'test', 'quiz', 'midterm', 'final', 'assessment', 'evaluation'],
  PARENT_MEETING: ['parent meeting', 'conference', 'teacher meeting', 'parent-teacher', 'consultation'],
  EXTRACURRICULAR: ['practice', 'rehearsal', 'club', 'sport', 'team', 'activity', 'competition', 'game'],
  APPOINTMENT: ['appointment', 'doctor', 'dentist', 'checkup', 'medical', 'therapy', 'consultation'],
  BIRTHDAY: ['birthday', 'party', 'celebration', 'anniversary'],
  HOLIDAY: ['holiday', 'vacation', 'break', 'day off'],
  REMINDER: ['remind', 'remember', 'don\'t forget', 'note'],
  OTHER: ['event', 'meeting', 'gathering', 'session']
};

// Priority keywords
const PRIORITY_KEYWORDS = {
  URGENT: ['urgent', 'asap', 'immediately', 'critical', 'emergency'],
  HIGH: ['important', 'high priority', 'crucial', 'must', 'required'],
  MEDIUM: ['moderate', 'normal', 'regular'],
  LOW: ['low priority', 'optional', 'when possible', 'if time permits']
};

// Helper function to normalize dates
const normalizeDate = (dateStr) => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    
    // Ensure we get the correct date in local timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    return null;
  }
};

// Helper function to detect event type from content
const detectEventType = (content) => {
  const lowerContent = content.toLowerCase();
  
  for (const [type, keywords] of Object.entries(EVENT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerContent.includes(keyword.toLowerCase())) {
        return type;
      }
    }
  }
  
  return 'OTHER';
};

// Helper function to detect priority from content
const detectPriority = (content) => {
  const lowerContent = content.toLowerCase();
  
  for (const [priority, keywords] of Object.entries(PRIORITY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerContent.includes(keyword.toLowerCase())) {
        return priority;
      }
    }
  }
  
  return 'MEDIUM';
};

// Helper function to extract dates from text
const extractDates = (text) => {
  const dates = [];
  
  DATE_PATTERNS.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const dateStr = match[0];
      const normalizedDate = normalizeDate(dateStr);
      if (normalizedDate) {
        dates.push({
          original: dateStr,
          normalized: normalizedDate,
          index: match.index
        });
      }
    }
  });
  
  return dates;
};

// Helper function to extract times from text
const extractTimes = (text) => {
  const times = [];
  
  TIME_PATTERNS.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      times.push({
        original: match[0],
        time: match[0],
        index: match.index
      });
    }
  });
  
  return times;
};

// Helper function to normalize time format
const normalizeTime = (timeStr) => {
  // Remove "at" prefix and clean up the time
  const cleanTime = timeStr.replace(/^at\s+/i, '').trim();
  
  // Check if it's already in proper format
  if (/^\d{1,2}:\d{2}\s*(AM|PM|am|pm)$/.test(cleanTime)) {
    return cleanTime;
  }
  
  // Handle 24-hour format
  if (/^\d{1,2}:\d{2}$/.test(cleanTime)) {
    return cleanTime;
  }
  
  return cleanTime;
};

// Helper function to extract event title from context
const extractEventTitle = (content, context) => {
  const lowerContent = content.toLowerCase();
  
  // Look for specific assignment/homework patterns
  if (lowerContent.includes('homework') || lowerContent.includes('assignment')) {
    if (lowerContent.includes('math')) return 'Math Homework Due';
    if (lowerContent.includes('science')) return 'Science Assignment Due';
    if (lowerContent.includes('english')) return 'English Assignment Due';
    if (lowerContent.includes('history')) return 'History Assignment Due';
    return 'Assignment Due';
  }
  
  // Look for exam patterns
  if (lowerContent.includes('exam') || lowerContent.includes('test')) {
    if (lowerContent.includes('math')) return 'Math Exam';
    if (lowerContent.includes('science')) return 'Science Test';
    if (lowerContent.includes('english')) return 'English Test';
    if (lowerContent.includes('final')) return 'Final Exam';
    if (lowerContent.includes('midterm')) return 'Midterm Exam';
    return 'Exam';
  }
  
  // Look for meeting patterns
  if (lowerContent.includes('parent') && lowerContent.includes('meeting')) {
    return 'Parent-Teacher Meeting';
  }
  
  if (lowerContent.includes('conference')) {
    return 'Parent-Teacher Conference';
  }
  
  // Look for common title patterns
  const titlePatterns = [
    /(?:subject|title|event):\s*(.+)/gi,
    /(?:re|regarding):\s*(.+)/gi,
    /^(.+)(?:\s+on\s+\d)/gi
  ];
  
  for (const pattern of titlePatterns) {
    const match = pattern.exec(content);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // If no specific pattern found, try to extract from first line or sentence
  const lines = content.split('\n').filter(line => line.trim().length > 0);
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    if (firstLine.length > 0 && firstLine.length < 100) {
      return firstLine;
    }
  }
  
  return 'Event from Email';
};

// Main email analysis function using Gemini AI
const analyzeEmailContent = async (emailContent) => {
  try {
    logDebug('Starting Gemini email content analysis', { contentLength: emailContent.length });
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });
    
    const prompt = `
Analyze the following email content and extract event details for a family calendar app. If any events, meetings, assignments, deadlines, or important dates are mentioned, extract them in the exact JSON format below.

For each event found, provide:
- title: Clear, concise event title
- description: Brief description of the event
- startDate: Date in YYYY-MM-DD format
- endDate: End date in YYYY-MM-DD format (if null consider next day)
- startTime: Time in HH:MM format (24-hour) or null if all-day
- endTime: End time in HH:MM format (24-hour) or null
- isAllDay: true/false
- type: One of [SCHOOL_EVENT, ASSIGNMENT_DUE, EXAM, PARENT_MEETING, EXTRACURRICULAR, APPOINTMENT, BIRTHDAY, HOLIDAY, REMINDER, OTHER]
- priority: One of [URGENT, HIGH, MEDIUM, LOW]
- hasReminder: true/false based on importance
- reminderMinutes: Number (15, 30, 60, 120) or null

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
      "reminderMinutes": number_or_null
    }
  ],
  "analysis": "Brief summary of what was found"
}

Email content:
${emailContent}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    logDebug('Gemini response received', { responseLength: text.length });
    
    // Parse the JSON response
    let analysis;
    try {
      // Clean the response text to extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      logWarn('Failed to parse Gemini response as JSON', { text, parseError });
      return {
        hasEvents: false,
        events: [],
        analysis: {
          error: 'Failed to parse AI response',
          contentLength: emailContent.length,
          rawResponse: text
        }
      };
    }
    
    // Validate and clean the response
    if (!analysis.hasOwnProperty('hasEvents')) {
      analysis.hasEvents = false;
    }
    
    if (!Array.isArray(analysis.events)) {
      analysis.events = [];
    }
    
    // Process events and add colors
    analysis.events = analysis.events.map(event => ({
      ...event,
      color: getEventTypeColor(event.type || 'OTHER')
    }));
    
    logInfo('Gemini email analysis completed', { 
      hasEvents: analysis.hasEvents, 
      eventsFound: analysis.events.length 
    });
    
    return {
      hasEvents: analysis.hasEvents,
      events: analysis.events,
      analysis: {
        contentLength: emailContent.length,
        summary: analysis.analysis || 'Analysis completed',
        aiProcessed: true
      }
    };
    
  } catch (error) {
    logWarn('Error analyzing email content with Gemini', error);
    return {
      hasEvents: false,
      events: [],
      analysis: {
        error: 'Failed to analyze email content with AI',
        contentLength: emailContent?.length || 0
      }
    };
  }
};

// Photo analysis function using Gemini AI Vision
const analyzePhotoForEvents = async (imageBuffer, mimeType = 'image/jpeg') => {
  try {
    logDebug('Starting Gemini photo analysis', { 
      bufferSize: imageBuffer?.length || 0,
      mimeType 
    });
    
    // Check if buffer exists
    if (!imageBuffer || !Buffer.isBuffer(imageBuffer)) {
      throw new Error('Image buffer not provided');
    }
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });
    
    // Convert image buffer to base64
    const base64Image = imageBuffer.toString('base64');
    
    const prompt = `
Analyze this image and extract any event details, calendar information, schedules, assignments, or important dates mentioned. Look for:
- Calendars, planners, or schedule screenshots
- Assignment due dates
- Meeting invitations
- Event flyers or announcements
- School schedules
- Any text containing dates, times, or event information

For each event found, provide:
- title: Clear, concise event title
- description: Brief description of the event
- startDate: Date in YYYY-MM-DD format
- endDate: End date in YYYY-MM-DD format (if null consider next day)
- startTime: Time in HH:MM format (24-hour) or null if all-day
- endTime: End time in HH:MM format (24-hour) or null
- isAllDay: true/false
- type: One of [SCHOOL_EVENT, ASSIGNMENT_DUE, EXAM, PARENT_MEETING, EXTRACURRICULAR, APPOINTMENT, BIRTHDAY, HOLIDAY, REMINDER, OTHER]
- priority: One of [URGENT, HIGH, MEDIUM, LOW]
- hasReminder: true/false based on importance
- reminderMinutes: Number (15, 30, 60, 120) or null

Extract event details in the exact JSON format below:

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
      "type": "One of [SCHOOL_EVENT, ASSIGNMENT_DUE, EXAM, PARENT_MEETING, EXTRACURRICULAR, APPOINTMENT, BIRTHDAY, HOLIDAY, REMINDER, OTHER]",
      "priority": "One of [URGENT, HIGH, MEDIUM, LOW]",
      "hasReminder": boolean,
      "reminderMinutes": number_or_null
    }
  ],
  "analysis": "Brief summary of what was found in the image"
}

Return ONLY valid JSON. If no events are found, return hasEvents: false with empty events array.
`;

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType
      }
    };
    
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    logDebug('Gemini photo response received', { responseLength: text.length });
    
    // Parse the JSON response
    let analysis;
    try {
      // Clean the response text to extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      logWarn('Failed to parse Gemini photo response as JSON', { text, parseError });
      return {
        hasEvents: false,
        events: [],
        analysis: {
          error: 'Failed to parse AI response',
          bufferSize: imageBuffer.length,
          rawResponse: text
        }
      };
    }
    
    // Validate and clean the response
    if (!analysis.hasOwnProperty('hasEvents')) {
      analysis.hasEvents = false;
    }
    
    if (!Array.isArray(analysis.events)) {
      analysis.events = [];
    }
    
    // Process events and add colors
    analysis.events = analysis.events.map(event => ({
      ...event,
      color: getEventTypeColor(event.type || 'OTHER'),
      description: event.description || 'Event extracted from photo analysis'
    }));
    
    logInfo('Gemini photo analysis completed', { 
      hasEvents: analysis.hasEvents, 
      eventsFound: analysis.events.length 
    });
    
    return {
      hasEvents: analysis.hasEvents,
      events: analysis.events,
      analysis: {
        bufferSize: imageBuffer.length,
        mimeType: mimeType,
        summary: analysis.analysis || 'Photo analysis completed',
        aiProcessed: true
      }
    };
    
  } catch (error) {
    logWarn('Error analyzing photo with Gemini', error);
    return {
      hasEvents: false,
      events: [],
      analysis: {
        error: 'Failed to analyze photo with AI',
        bufferSize: imageBuffer?.length || 0
      }
    };
  }
};

// Helper function to determine image MIME type
const getImageMimeType = (photoPath) => {
  const extension = photoPath.toLowerCase().split('.').pop();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    default:
      return 'image/jpeg'; // Default fallback
  }
};

// Get event type color
const getEventTypeColor = (eventType) => {
  return EVENT_TYPE_COLORS[eventType] || EVENT_TYPE_COLORS.OTHER;
};



// async function testGemini() {
//   try {
//     const model = genAI.getGenerativeModel({
//       model: "models/gemini-1.5-flash-latest",
//       location: "us-central1"
//     });
//     const result = await model.generateContent("Reply with JSON: {\"ok\":true}");
//     const response = await result.response;
//     console.log("Gemini says:", await response.text());
//   } catch (err) {
//     console.error("Error:", err);
//   }
// }

// testGemini();

export default {
  analyzeEmailContent,
  analyzePhotoForEvents,
  getEventTypeColor,
  EVENT_TYPE_COLORS
};
