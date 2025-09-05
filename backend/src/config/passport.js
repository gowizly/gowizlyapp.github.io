import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "./db.js";

// Helper function to generate a unique username
async function generateUniqueUsername(baseUsername) {
  let username = baseUsername;
  let counter = 1;
  
  // Keep checking if username exists and increment counter if it does
  while (true) {
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });
    
    if (!existingUser) {
      return username;
    }
    
    username = `${baseUsername}${counter}`;
    counter++;
  }
}

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `${process.env.SERVER_URL}/api/auth/google/callback`
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log("Google OAuth - Profile received:", {
      id: profile.id,
      displayName: profile.displayName,
      email: profile.emails?.[0]?.value
    });

    // Check if user exists by googleId (returning Google user)
    let user = await prisma.user.findUnique({ 
      where: { googleId: profile.id } 
    });
    
    if (user) {
      console.log("Google OAuth - Existing Google user found, signing in:", user.id);
      return done(null, user);
    }

    // Check if user exists by email (user who registered normally first)
    const existingEmailUser = await prisma.user.findUnique({
      where: { email: profile.emails[0].value }
    });
    
    if (existingEmailUser) {
      console.log("Google OAuth - User exists with this email, linking to Google");
      // Link the existing user to Google by adding googleId
      user = await prisma.user.update({
        where: { id: existingEmailUser.id },
        data: {
          googleId: profile.id,
          isVerified: true // Verify since they authenticated with Google
        }
      });
      console.log("Google OAuth - Existing user linked and signed in:", user.id);
      return done(null, user);
    }

    // First time Google user - create new account
    console.log("Google OAuth - Creating new user (first time)");
    const uniqueUsername = await generateUniqueUsername(profile.displayName);
    
    user = await prisma.user.create({
      data: {
        googleId: profile.id,
        email: profile.emails[0].value,
        username: uniqueUsername,
        isVerified: true
      }
    });
    console.log("Google OAuth - New user created and signed in:", user.id, "with username:", uniqueUsername);

    return done(null, user);
  } catch (err) {
    console.error("Google OAuth Strategy Error:", err);
    return done(err, null);
  }
}));

passport.serializeUser((user, done) => {
  console.log("Serializing user:", user.id);
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    console.log("Deserializing user ID:", id);
    const user = await prisma.user.findUnique({ where: { id } });
    console.log("Deserialized user found:", !!user);
    done(null, user);
  } catch (err) {
    console.error("Deserialize user error:", err);
    done(err, null);
  }
});