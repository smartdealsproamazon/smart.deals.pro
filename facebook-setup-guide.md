# Facebook Integration Setup Guide for SmartDeals Pro

This guide will help you set up automatic Facebook posting for your SmartDeals Pro website. When you add products to your site, they will automatically be posted to your Facebook page with proper Amazon affiliate compliance.

## Prerequisites

1. A Facebook personal account
2. A Facebook business page for SmartDeals Pro
3. Access to Facebook Developer Console

## Step 1: Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "Create App"
3. Select "Business" as the app type
4. Fill in the app details:
   - App Name: `SmartDeals Pro`
   - App Contact Email: Your email address
   - Business Account: Select your business account (or create one)

## Step 2: Configure App Settings

1. In your app dashboard, go to "Settings" → "Basic"
2. Add your website URL: `https://rizwan-10html.github.io/Smart--affiliate---site`
3. Add App Domains: `rizwan-10html.github.io/Smart--affiliate---site`
4. Save changes

## Step 3: Set Up Facebook Login

1. Go to "Products" and add "Facebook Login"
2. In Facebook Login settings:
   - Valid OAuth Redirect URIs: `https://rizwan-10html.github.io/Smart--affiliate---site/`
   - Web OAuth Login: Enable
   - Enforce HTTPS: Enable

## Step 4: Get App ID and App Secret

1. Go to "Settings" → "Basic"
2. Copy your App ID
3. Copy your App Secret (you'll need to show it)

## Step 5: Create Facebook Page Access Token

### Method 1: Using Facebook Graph API Explorer (Recommended)

1. Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app from the dropdown
3. Click "Get Token" → "Get Page Access Token"
4. Select your Facebook page
5. Grant necessary permissions:
   - `pages_manage_posts`
   - `pages_read_engagement`
   - `pages_show_list`
6. Copy the generated access token

### Method 2: Using Facebook Access Token Tool

1. Go to [Access Token Tool](https://developers.facebook.com/tools/accesstoken/)
2. Find your app and page
3. Copy the Page Access Token

## Step 6: Get Page ID

1. Go to your Facebook page
2. Click "About" tab
3. Scroll down to find "Page ID" or
4. Use Graph API Explorer with `/me/accounts` endpoint

## Step 7: Configure Your Website

1. Open `facebook-config.js` in your website files
2. Replace the placeholder values:

```javascript
const FACEBOOK_CONFIG = {
  appId: 'YOUR_APP_ID_HERE',              // From Step 4
  version: 'v18.0',                       // Keep as is
  accessToken: 'YOUR_PAGE_ACCESS_TOKEN',  // From Step 5
  pageId: 'YOUR_PAGE_ID',                 // From Step 6
  // ... rest of the config
};
```

## Step 8: Update All HTML Files

Update the Facebook link in the footer of all HTML files:

Replace:
```html
<a href="#" aria-label="Facebook">
```

With:
```html
<a href="https://www.facebook.com/YOUR_PAGE_NAME" target="_blank" aria-label="Facebook">
```

## Step 9: Test the Integration

1. Go to your product submission page
2. Submit a test product
3. Check if it appears on your Facebook page
4. Verify the post includes:
   - Product image
   - Product title and description
   - Price information
   - Affiliate disclosure
   - Relevant hashtags
   - Website link

## Step 10: App Review (For Production)

For production use, you'll need to submit your app for review:

1. Go to App Review in your Facebook app dashboard
2. Submit for review of the following permissions:
   - `pages_manage_posts`
   - `pages_read_engagement`
   - `pages_show_list`
3. Provide screenshots and explanation of how you use these permissions

## Troubleshooting

### Common Issues

1. **Access Token Expired**
   - Page access tokens expire periodically
   - Use a long-lived token or implement token refresh

2. **Permission Denied**
   - Ensure you have admin rights to the Facebook page
   - Check that all required permissions are granted

3. **Post Not Appearing**
   - Check Facebook's posting policies
   - Verify your page is published and not in draft mode

4. **Image Upload Failed**
   - Ensure images are less than 5MB
   - Supported formats: JPG, PNG, GIF

### Getting Long-Lived Access Tokens

For production use, get a long-lived token:

1. Use Graph API Explorer
2. Make a GET request to:
   ```
   /oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=YOUR_SHORT_LIVED_TOKEN
   ```

## Amazon Affiliate Compliance

The system automatically includes Amazon affiliate disclosures in posts:

- **Disclosure Text**: "As an Amazon Associate, I earn from qualifying purchases..."
- **Hashtags**: Appropriate hashtags for different product categories
- **Links**: Direct links to products with affiliate tracking

## Post Template Customization

You can customize the post template in `facebook-config.js`:

```javascript
postTemplate: {
  hashtagsEnabled: true,
  includeAffiliateDisclosure: true,
  includeWebsiteLink: true,
  defaultHashtags: [
    '#SmartDeals', '#BestDeals', '#AffiliateMarketing',
    // Add your custom hashtags
  ]
}
```

## Security Best Practices

1. Never commit access tokens to version control
2. Use environment variables for sensitive data
3. Regularly rotate access tokens
4. Monitor your app's usage in Facebook Analytics

## Support

If you encounter issues:

1. Check Facebook's Platform Status
2. Review Facebook's API documentation
3. Check your app's error logs
4. Verify your permissions and tokens

## Legal Considerations

- Ensure compliance with Facebook's Platform Policies
- Follow Amazon's Affiliate Program requirements
- Include proper disclosures in all posts
- Respect user privacy and data protection laws

---

**Note**: This setup enables automatic Facebook posting for product submissions. Always test thoroughly before using in production, and ensure compliance with all applicable platform policies and legal requirements.