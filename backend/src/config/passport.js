import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import prisma from "./db.js";

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

    let user = await prisma.user.findUnique({ where: { googleId: profile.id } });
    console.log("Google OAuth - Existing user found:", !!user);
    
    if (!user) {
      console.log("Google OAuth - Creating new user");
      user = await prisma.user.create({
        data: {
          googleId: profile.id,
          email: profile.emails[0].value,
          username: profile.displayName,
          isVerified: true
        }
      });
      console.log("Google OAuth - New user created:", user.id);
    }
    
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
