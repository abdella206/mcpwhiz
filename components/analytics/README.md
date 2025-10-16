# Google Analytics 4 Setup Guide

This directory contains the complete Google Analytics 4 implementation for mcpwhiz.

## Quick Setup

1. **Get your GA4 Measurement ID:**
   - Go to [Google Analytics](https://analytics.google.com/)
   - Create a new GA4 property
   - Copy your Measurement ID (format: G-XXXXXXXXXX)

2. **Configure Environment Variables:**
   ```bash
   # Copy the example file
   cp .env.local.example .env.local
   
   # Edit .env.local and add your Measurement ID
   NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

3. **Verify Setup:**
   - Start your development server: `npm run dev`
   - Open browser DevTools → Network tab
   - Navigate your site and look for requests to `googletagmanager.com`

## Files Overview

- `GoogleAnalytics.tsx` - Main GA4 script component
- `PageViewTracker.tsx` - Automatic page view tracking
- `TrackingButton.tsx` - Button component with built-in event tracking
- `gtag.ts` - Utility functions and predefined events

## Usage Examples

### Basic Event Tracking
```tsx
import { analytics } from "@/lib/analytics/gtag"

// User actions
analytics.signUp()
analytics.login()
analytics.createServer()

// Custom events
trackEvent({
  action: "custom_action",
  category: "engagement",
  label: "button_click",
  value: 1
})
```

### Tracking Buttons
```tsx
import { TrackingButton } from "@/components/analytics/TrackingButton"

<TrackingButton 
  trackingAction="view_pricing"
  trackingCategory="navigation"
  trackingLabel="hero_cta"
>
  Get Started
</TrackingButton>
```

### Custom Event Tracking
```tsx
import { trackEvent } from "@/lib/analytics/gtag"

const handleFormSubmit = () => {
  trackEvent({
    action: "form_submit",
    category: "contact",
    label: "contact_form"
  })
}
```

## Privacy Features

- Anonymized IP tracking
- Disabled Google Signals
- Disabled ad personalization
- GDPR-friendly configuration

## Testing

1. **Real-time Reports:**
   - Go to Google Analytics → Reports → Realtime
   - Navigate your site to see live data

2. **Debug Mode:**
   - Install [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/jnkmfdileelhofjcijamephohjechhna)
   - Check browser console for GA events

## Production Checklist

- [ ] Environment variable set: `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- [ ] GA4 property configured
- [ ] Tracking verification completed
- [ ] Privacy policy updated (mention analytics)
- [ ] Cookie consent implemented (if required)

## Predefined Events for mcpwhiz

The following events are pre-configured for tracking key user actions:

### Authentication
- `sign_up` - User registration
- `login` - User login
- `logout` - User logout

### MCP Server Management
- `create_mcp_server` - Server creation
- `deploy_mcp_server` - Server deployment
- `delete_mcp_server` - Server deletion
- `configure_server` - Server configuration

### Business Actions
- `view_pricing` - Pricing page view
- `select_plan` - Plan selection
- `upgrade_plan` - Plan upgrade

### Feature Usage
- `use_playground` - Playground usage
- `view_documentation` - Docs access
- `contact_form_submit` - Contact form

### External Links
- `external_link_click` - Outbound link tracking
