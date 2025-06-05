import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/user.model.js";
import { environment } from "./environment.js";
import logger from "../utils/logger.js";

// Google Strategy configuration
passport.use(
  new GoogleStrategy(
    {
      clientID: environment.googleClientId,
      clientSecret: environment.googleClientSecret,
      callbackURL: environment.googleCallbackUrl,
      scope: ["profile", "email"],
    },
    async (accessToken, RefreshToken, profile, done) => {
      try {
        // Check if user already exists with this Google ID
        let user = await User.findOne({
          googleId: profile.id,
        });

        // create a new user if doesn't exist
        if (!user) {
          // Check if email is already used
          const existingUserWithEmail = await User.findOne({
            email: profile.emails && profile.emails[0].value,
          });

          if (existingUserWithEmail) {
            // If email exists but not connected to Google, link accounts
            existingUserWithEmail.googleId = profile.id;
            await existingUserWithEmail.save();
            return done(null, existingUserWithEmail);
          }

          // Create new user
          user = new User({
            googleId: profile.id,
            username:
              profile.displayName.replace(/\s/g, "") +
              Math.floor(Math.random() * 1000),
            email: profile.emails && profile.emails[0].value,
            password: Math.random().toString(36).slice(-12), // generate a random password
            isEmailVerified: true, // google has verified their email
          });

          await user.save();
        }

        return done(null, user);
      } catch (error) {
        logger.error("Error in Google authentication: ", error);
        return done(error as Error, undefined);
      }
    }
  )
);

// Serialize user for the sestion
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

export default passport;
