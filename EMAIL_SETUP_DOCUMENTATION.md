# SmartDeals Pro - Email Configuration Documentation

## Overview
All contact forms on the SmartDeals Pro website are configured to send emails to **smartdealsproamazon@gmail.com** using FormSubmit.co service.

## Email-Enabled Forms

### 1. Affiliate Registration Form (`affiliate-register.html`)
- **Purpose**: New affiliate registrations
- **Email Service**: FormSubmit.co (AJAX)
- **Email To**: smartdealsproamazon@gmail.com
- **Subject**: "New Affiliate Registration"
- **Trigger**: When users complete affiliate registration
- **Data Sent**:
  - Affiliate ID
  - Personal information (name, email, phone, country)
  - Experience level and platforms
  - Revenue information
  - Online presence details
  - Marketing strategy
  - Registration date

### 2. Contact Form (`contact.html`)
- **Purpose**: General inquiries and support
- **Email Service**: FormSubmit.co (Standard POST)
- **Email To**: smartdealsproamazon@gmail.com
- **Subject**: "New Contact Form Submission from SmartDeals Pro"
- **Redirect**: thank-you.html after submission
- **Data Sent**:
  - Full name
  - Email address
  - Subject/Topic
  - Message content
  - Submission timestamp

### 3. Product Submission Form (`product-submission.html`)
- **Purpose**: Admin/authorized users submitting products
- **Email Service**: FormSubmit.co (AJAX)
- **Email To**: smartdealsproamazon@gmail.com
- **Subject**: "New Product Submission - SmartDeals Pro"
- **Trigger**: After successful Firebase save
- **Data Sent**:
  - Product title and price
  - Category and platform
  - Product description
  - Product link
  - Submitter information
  - Submission date

### 4. User Product Submission Form (`user-product-submission.html`)
- **Purpose**: Regular users submitting products
- **Email Service**: FormSubmit.co (AJAX)
- **Email To**: smartdealsproamazon@gmail.com
- **Subject**: "New User Product Submission - SmartDeals Pro"
- **Trigger**: After successful Firebase save
- **Data Sent**:
  - Product title and price
  - Category
  - Product description
  - Product link
  - User information
  - Submission date
  - Submission type identifier

## FormSubmit.co Configuration

### Standard Form (contact.html)
```html
<form action="https://formsubmit.co/smartdealsproamazon@gmail.com" method="POST">
  <!-- Hidden FormSubmit fields -->
  <input type="hidden" name="_next" value="https://smartdealsproamazon.github.io/smart.deals.pro/thank-you.html">
  <input type="hidden" name="_captcha" value="false">
  <input type="hidden" name="_template" value="table">
  <input type="hidden" name="_subject" value="New Contact Form Submission from SmartDeals Pro">
</form>
```

### AJAX Forms (affiliate-register.html, product submissions)
```javascript
const response = await fetch('https://formsubmit.co/ajax/smartdealsproamazon@gmail.com', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  body: JSON.stringify(payload)
});
```

## Email Notification Flow

### Affiliate Registration
1. User completes affiliate registration form
2. Data is saved to Firebase (primary)
3. Email notification is sent to admin via FormSubmit.co
4. User is redirected to affiliate dashboard

### Contact Form
1. User fills contact form
2. Form is submitted directly via FormSubmit.co
3. User is redirected to thank-you page
4. Admin receives email immediately

### Product Submissions
1. User submits product form
2. Product is saved to Firebase database
3. Product is posted to Facebook (if configured)
4. Email notification is sent to admin
5. User is redirected to marketplace

## Error Handling

- Email failures do not prevent form submissions from completing
- All email sending is wrapped in try-catch blocks
- Errors are logged to console but don't break user experience
- Primary data (affiliate registrations, products) is always saved to Firebase first

## Benefits

1. **Immediate Notifications**: Admin receives instant email alerts for all form submissions
2. **Reliable Service**: FormSubmit.co provides reliable email delivery
3. **No Setup Required**: No need for custom email server configuration
4. **Free Service**: FormSubmit.co basic plan handles the current email volume
5. **Spam Protection**: Built-in spam filtering and rate limiting

## Monitoring

To monitor email delivery:
1. Check FormSubmit.co dashboard (if account is created)
2. Monitor smartdealsproamazon@gmail.com inbox
3. Check browser console for any email sending errors
4. Verify email functionality by testing each form

## Troubleshooting

### Common Issues:
1. **Emails not received**: Check spam folder, verify email address
2. **AJAX errors**: Check browser console for FormSubmit.co response errors
3. **Form validation**: Ensure all required fields are filled before submission

### Testing:
- Test each form type to ensure emails are delivered
- Verify email content includes all necessary information
- Check that primary functions (Firebase saves) work even if email fails

## Configuration Summary

✅ **Affiliate Registration**: Email notifications enabled  
✅ **Contact Form**: Email notifications enabled  
✅ **Product Submission**: Email notifications enabled  
✅ **User Product Submission**: Email notifications enabled  

All forms are configured to send emails to: **smartdealsproamazon@gmail.com**