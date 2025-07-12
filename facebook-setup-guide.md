# Facebook Integration Setup Guide

## 🎯 Overview
This guide will help you set up Facebook integration for your SmartDeals Pro website. Once configured, your Facebook profile will be linked to the footer, and products will automatically post to Facebook when added.

## 🔧 Step 1: Create Facebook App

### 1. Visit Facebook Developers
- Go to [Facebook Developers](https://developers.facebook.com/)
- Sign in with your Facebook account

### 2. Create New App
- Click "Create App"
- Select "Consumer" for app type
- Fill in app details:
  - **App Name**: SmartDeals Pro
  - **App Contact Email**: Your email
  - **App Purpose**: Business

### 3. Configure App Settings
- In the App Dashboard, go to "Settings" → "Basic"
- Add your website domain: `https://yourwebsite.com`
- Save changes

## 🔑 Step 2: Get App ID and Setup

### 1. Copy App ID
- In your Facebook App Dashboard
- Find your **App ID** (looks like: 1234567890123456)
- Copy this number

### 2. Update Integration File
- Open `facebook-integration.js`
- Replace `YOUR_FACEBOOK_APP_ID` with your actual App ID:

```javascript
this.appId = '1234567890123456'; // Your actual App ID
```

### 3. Add Facebook Login Product
- In Facebook App Dashboard
- Go to "Products" → "Add Product"
- Add "Facebook Login"
- In Facebook Login settings:
  - **Valid OAuth Redirect URIs**: Add your website URL
  - **Valid OAuth Redirect URIs**: `https://yourwebsite.com/`

## 🎯 Step 3: Configure Permissions

### 1. Add Required Permissions
In your Facebook App Dashboard:
- Go to "Facebook Login" → "Settings"
- Add these permissions:
  - `public_profile` (default)
  - `pages_manage_posts`
  - `pages_read_engagement`
  - `publish_to_groups`

### 2. App Review (Optional)
- For public use, submit for app review
- For personal use, you can test with your account

## 🔧 Step 4: Website Configuration

### 1. Update All Pages
Add the Facebook integration script to all your HTML pages:

```html
<script src="facebook-integration.js"></script>
```

### 2. Connect Your Profile
- Visit your website
- Look for the "Connect Facebook" button in the footer
- Click it and authorize the app
- Your Facebook profile will now be linked

## 🚀 Step 5: Testing

### 1. Test Profile Connection
- Check if Facebook links in footer now point to your profile
- Verify the "Connect Facebook" button works

### 2. Test Auto-Posting
- Add a new product through your product submission form
- Check if it automatically posts to your Facebook profile
- Verify the post format looks good

## 🎨 Features Included

### ✅ Profile Integration
- All Facebook footer links automatically connect to your profile
- Professional connection UI
- Persistent connection (saved in browser)

### ✅ Auto-Posting
- Automatic Facebook posts when products are added
- Professional post format with emojis
- Category-specific hashtags
- Product images and links included

### ✅ Notifications
- Success/error notifications for Facebook actions
- Beautiful notification design
- Auto-dismiss notifications

## 🔧 Advanced Configuration

### Custom Post Format
Edit the `createProductPost()` function in `facebook-integration.js` to customize:
- Post text format
- Hashtags
- Emojis
- Product information layout

### Disable Auto-Posting
To disable automatic posting:
```javascript
this.enableAutoPost = false;
```

### Custom Facebook Page
If you want to post to a Facebook Page instead of profile:
1. Get your Page ID from Facebook
2. Update the `pageId` in the integration file
3. Modify the posting function to use Pages API

## 📱 Mobile Optimization

The Facebook integration is fully responsive and works on:
- Desktop browsers
- Mobile browsers
- Tablets
- All major browsers (Chrome, Firefox, Safari, Edge)

## 🛠️ Troubleshooting

### Common Issues

#### "App Not Setup for Facebook Login"
- Ensure Facebook Login product is added to your app
- Check Valid OAuth Redirect URIs include your domain

#### "Invalid App ID"
- Verify you copied the correct App ID
- Check for typos in the facebook-integration.js file

#### "Permission Denied"
- Ensure required permissions are added in Facebook App
- Check if app needs review for public use

#### Auto-posting Not Working
- Verify Facebook connection is established
- Check browser console for error messages
- Ensure product submission form includes Facebook script

### Debug Mode
Enable debug mode by adding to your Facebook integration:
```javascript
this.debugMode = true;
```

This will show detailed logs in the browser console.

## 📞 Support

If you encounter issues:
1. Check browser console for error messages
2. Verify all steps in this guide
3. Test with a simple product first
4. Ensure Facebook App is properly configured

## 🎉 Next Steps

Once setup is complete:
1. Test the integration thoroughly
2. Customize post formats if needed
3. Monitor Facebook posts for engagement
4. Consider adding Facebook Pixel for analytics

---

**Note**: This integration handles Facebook posting automatically. Every time a product is added to your site, it will create a professional post on your Facebook profile with product details, images, and links.

## 📋 Quick Checklist

- [ ] Created Facebook App
- [ ] Added Facebook Login product
- [ ] Updated App ID in integration file
- [ ] Added required permissions
- [ ] Tested profile connection
- [ ] Tested auto-posting
- [ ] Verified mobile compatibility
- [ ] Customized post format (optional)

Your Facebook integration is now ready to use! 🚀