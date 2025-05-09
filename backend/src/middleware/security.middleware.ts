import helmet from "helmet";
import { Application } from "express";

export const configureSecurity = (app: Application) => {
  // Content Security Policy
  const cspOptions = {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  };

  // Apply Helmet security headers
  app.use(
    helmet({
      contentSecurityPolicy: cspOptions, // defines allowed sources for various types of content
      crossOriginEmbedderPolicy: true,
      crossOriginOpenerPolicy: true,
      crossOriginResourcePolicy: { policy: "same-origin" }, // restricts cross-origin resource sharing to prevent data leaks
      dnsPrefetchControl: { allow: false }, // disables browsers from prefetching DNS to reduce tracking
      frameguard: { action: "deny" }, // prevents clickjacking attacks by stopping your site from being embedded in frames
      hidePoweredBy: true, // removes the x-powered-by header to hide technical details
      hsts: { maxAge: 15552000, includeSubDomains: true }, // forces HTTPS connections
      ieNoOpen: true, // prevents Internet Explorer from executing downloads in your site's context
      noSniff: true, // prevents browsers from tying to guess the MIME type of files
      originAgentCluster: true, // Improves performance by allowing the browser to treat some-origin iframes as same-origin
      permittedCrossDomainPolicies: { permittedPolicies: "none" }, // restricts Adobe Flash and Acrobat cross-domain requests
      referrerPolicy: { policy: "no-referrer" }, // controls what information is sent in the Referer header
      xssFilter: true, // enables the cross-site scripting filter in browsers
    })
  );

  return app;
};
