# Deployment Guide for Firebase Browser to Tohostinger WPS with CloudPanel

This document provides step-by-step instructions for deploying the Firebase Browser application to a Tohostinger WPS server managed with CloudPanel.

## Prerequisites

- Access to your Tohostinger WPS hosting account
- Access to CloudPanel for your server
- SSH access to your server (optional but helpful)
- FTP client like FileZilla (if not using SSH/SCP)

## Step 1: Build the Application

Before deploying, build a production version of the application:

```bash
# Navigate to your project directory
cd /path/to/FirebaseBrowser

# Install dependencies if needed
npm install

# Build the application
npm run build
```

This will create a `dist` directory containing the built application.

## Step 2: Access CloudPanel

1. Log in to your Tohostinger WPS hosting account
2. Navigate to the CloudPanel interface
3. If prompted, enter your CloudPanel credentials

## Step 3: Create a Website in CloudPanel

1. In CloudPanel, navigate to the "Websites" section
2. Click "Add Website" or equivalent button
3. Fill in the details:
   - Domain: your-domain.com (or subdomain)
   - Document Root: Leave as default or set according to your preference
   - PHP Version: Not required for this application
   - Select the appropriate Vhost Template (typically "Static Files")

## Step 4: Upload Files

### Option A: Using FTP

1. Connect to your server using an FTP client (e.g., FileZilla)
2. Navigate to the document root of your website
3. Upload all contents from the `dist` directory to the root of your website

### Option B: Using SSH/SCP

1. Connect to your server using SSH
2. Use SCP to transfer files:
   ```bash
   scp -r /path/to/FirebaseBrowser/dist/* user@your-server:/path/to/document-root/
   ```

## Step 5: Configure Web Server

In CloudPanel:

1. Go to your website's settings
2. Navigate to "Vhost" or equivalent section
3. Add the following configuration to handle SPA routing:

```nginx
location / {
    root /path/to/document-root;
    try_files $uri $uri/ /index.html;
    index index.html;
}
```

This ensures that all routes in your React application are properly handled, even when accessed directly.

## Step 6: SSL Configuration

1. In CloudPanel, go to your website's settings
2. Navigate to "SSL" section
3. Select either:
   - Let's Encrypt (for free automatic certificates)
   - Custom SSL (if you have your own certificate)
4. Follow the prompts to complete SSL setup
5. Ensure "Force HTTPS" is enabled

## Step 7: Test the Deployment

1. Open a browser and navigate to your domain
2. Verify that the application loads correctly
3. Test all major functionality to ensure it works as expected
4. Check for any console errors

## Troubleshooting

### Application Shows Blank Page

- Check browser console for errors
- Verify that all assets were uploaded correctly
- Ensure the server configuration has the proper SPA routing rules

### API or Authentication Issues

- Firebase Browser uses client-side authentication with Firebase
- Make sure your Firebase configuration is correctly set in the application
- Check for CORS issues if connecting to different domains

### 404 Errors on Page Refresh

- Ensure the Nginx configuration includes the `try_files` directive as shown above
- Check CloudPanel logs for any server errors

## Maintenance

For future updates:

1. Make changes to your local codebase
2. Build the application with `npm run build`
3. Upload the new files, replacing the old ones
4. Clear browser cache when testing

## Security Considerations

- The Firebase Browser application stores credentials in the browser's local storage (encrypted)
- Ensure your hosting uses HTTPS to protect data in transit
- Consider implementing Content Security Policy (CSP) headers for additional security

## Support

For issues related to:

- Tohostinger WPS hosting: Contact Tohostinger support
- CloudPanel: Refer to CloudPanel documentation or support channels
- Firebase Browser application: Refer to the application's GitHub repository or documentation 