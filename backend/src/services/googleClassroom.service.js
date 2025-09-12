import { google } from "googleapis";
import prisma from "../config/db.js";

class GoogleClassroomService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLASSROOM_CLIENT_ID,
      process.env.GOOGLE_CLASSROOM_CLIENT_SECRET,
      process.env.GOOGLE_CLASSROOM_REDIRECT_URI
    );
    
    this.classroom = google.classroom({ version: 'v1', auth: this.oauth2Client });
  }

  // Generate OAuth URL for Google Classroom access
  generateAuthUrl(childId, state) {
    const scopes = [
      'https://www.googleapis.com/auth/classroom.courses.readonly',
      'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
      'https://www.googleapis.com/auth/classroom.announcements.readonly'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: JSON.stringify({ childId, userId: state.userId })
    });
  }

  // Handle OAuth callback
  async handleCallback(code, state) {
    try {
      const { tokens } = await this.oauth2Client.getAccessToken(code);
      this.oauth2Client.setCredentials(tokens);
      
      // Get user profile to verify email
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const { data: profile } = await oauth2.userinfo.get();
      
      return {
        tokens,
        email: profile.email,
        name: profile.name
      };
    } catch (error) {
      console.error('Google Classroom OAuth error:', error);
      throw new Error('Failed to authenticate with Google Classroom');
    }
  }

  // Get student's courses
  async getCourses(accessToken) {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      
      const response = await this.classroom.courses.list({
        studentId: 'me',
        courseStates: ['ACTIVE']
      });
      
      return response.data.courses || [];
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw new Error('Failed to fetch courses from Google Classroom');
    }
  }

  // Get assignments for a course
  async getAssignments(accessToken, courseId) {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      
      const response = await this.classroom.courses.courseWork.list({
        courseId: courseId
      });
      
      return response.data.courseWork || [];
    } catch (error) {
      console.error('Error fetching assignments:', error);
      throw new Error('Failed to fetch assignments from Google Classroom');
    }
  }

  // Get student submissions for assignments
  async getSubmissions(accessToken, courseId, courseWorkId) {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      
      const response = await this.classroom.courses.courseWork.studentSubmissions.list({
        courseId: courseId,
        courseWorkId: courseWorkId,
        userId: 'me'
      });
      
      return response.data.studentSubmissions || [];
    } catch (error) {
      console.error('Error fetching submissions:', error);
      throw new Error('Failed to fetch submissions from Google Classroom');
    }
  }

  // Get announcements for a course
  async getAnnouncements(accessToken, courseId) {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      
      const response = await this.classroom.courses.announcements.list({
        courseId: courseId,
        announcementStates: ['PUBLISHED'],
        orderBy: 'updateTime desc',
        pageSize: 10
      });
      
      return response.data.announcements || [];
    } catch (error) {
      console.error('Error fetching announcements:', error);
      throw new Error('Failed to fetch announcements from Google Classroom');
    }
  }

  // Refresh access token
  async refreshToken(refreshToken) {
    try {
      this.oauth2Client.setCredentials({ refresh_token: refreshToken });
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      return credentials;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  // Check if token is valid
  async validateToken(accessToken) {
    try {
      this.oauth2Client.setCredentials({ access_token: accessToken });
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      await oauth2.userinfo.get();
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default new GoogleClassroomService();
