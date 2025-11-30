# Environment Variables Setup

This document explains the required and optional environment variables for the portfolio website.

## Required Environment Variables

### `RESEND_API_KEY` (Required)
- **Purpose**: Used for sending emails from the contact form
- **Where to get it**: 
  1. Sign up at [https://resend.com](https://resend.com)
  2. Go to API Keys section
  3. Create a new API key
  4. Copy the key and add it to your `.env` file
- **Usage**: Contact form functionality depends on this

## Optional Environment Variables

### `NEXT_PUBLIC_WS_URL` (Optional)
- **Purpose**: WebSocket server URL for real-time features (remote cursors, online users)
- **Where to get it**: 
  - If you have a Socket.io server running, use its URL
  - Format: `ws://localhost:3001` or `wss://your-domain.com`
- **Usage**: Real-time features will be disabled if not provided (no errors, just won't connect)

### `UMAMI_DOMAIN` (Optional)
- **Purpose**: Umami analytics script URL
- **Where to get it**: 
  - If you're using Umami analytics, get the script URL from your Umami instance
  - Format: `https://analytics.yourdomain.com/script.js`
- **Usage**: Analytics tracking (can be left empty if not using Umami)

### `UMAMI_SITE_ID` (Optional)
- **Purpose**: Umami website/site ID for analytics
- **Where to get it**: 
  - Get this from your Umami dashboard after creating a website
  - It's a UUID string
- **Usage**: Analytics tracking (can be left empty if not using Umami)

## Setup Instructions

1. Create a `.env` file in the root directory of the project
2. Copy the template below and fill in your values:

```env
# WebSocket Server URL (Optional)
# Only required if you want to enable real-time features like remote cursors
# Leave empty if you don't have a WebSocket server
NEXT_PUBLIC_WS_URL=

# Resend API Key (Required for Contact Form)
# Get your API key from https://resend.com/api-keys
# Required for the contact form to send emails
RESEND_API_KEY=your_resend_api_key_here

# Umami Analytics (Optional)
# Get your domain and site ID from your Umami instance
# Leave empty if you don't use Umami analytics
UMAMI_DOMAIN=
UMAMI_SITE_ID=
```

3. Replace `your_resend_api_key_here` with your actual Resend API key
4. Fill in optional variables if you're using those services
5. Restart your development server after adding environment variables

## Notes

- The `.env` file is already in `.gitignore` and won't be committed to version control
- For production (Vercel, Netlify, etc.), add these variables in your hosting platform's environment variables settings
- All `NEXT_PUBLIC_*` variables are exposed to the browser, so don't put sensitive keys there
- `RESEND_API_KEY` is server-side only and safe to use

## API Services Summary

| Variable | Required | Service | Purpose |
|----------|----------|---------|---------|
| `RESEND_API_KEY` | ✅ Yes | Resend | Contact form emails |
| `NEXT_PUBLIC_WS_URL` | ❌ No | Socket.io | Real-time features |
| `UMAMI_DOMAIN` | ❌ No | Umami | Analytics script |
| `UMAMI_SITE_ID` | ❌ No | Umami | Analytics site ID |

