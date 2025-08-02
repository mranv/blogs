# Authentication System

This Astro blog now includes a static authentication system that protects all content pages. Users must log in before accessing the blog content.

## Features

- **Static Authentication**: Uses localStorage for client-side authentication
- **Login/Signup Page**: Beautiful, modern UI with both login and signup functionality
- **Protected Routes**: All main pages require authentication
- **Logout Functionality**: Logout button in the header
- **Demo Credentials**: Pre-configured demo account for testing

## How It Works

### Authentication Flow
1. Users visit any page → redirected to `/login` if not authenticated
2. Users log in with demo credentials or create new account
3. Authentication state stored in localStorage
4. Users can access all protected content
5. Logout clears authentication and redirects to login

### Demo Credentials
- **Email**: `demo@example.com`
- **Password**: `demo123`

### Protected Pages
- Homepage (`/`)
- About page (`/about`)
- Search page (`/search`)
- All blog posts (`/posts/*`)
- Posts listing (`/posts`)

### Public Pages
- Login page (`/login`)
- 404 page
- RSS feed
- Robots.txt

## Technical Implementation

### Authentication Check
Each protected page includes a client-side script that checks localStorage:

```javascript
if (localStorage.getItem('isAuthenticated') !== 'true') {
  window.location.href = '/login';
}
```

### Login Page Features
- Toggle between login and signup modes
- Form validation
- Error/success messages
- Responsive design
- Demo credentials display

### Logout Functionality
- Logout button in header
- Clears localStorage
- Redirects to login page

## Deployment

This authentication system works perfectly with static hosting platforms like:
- Cloudflare Pages
- Netlify
- Vercel
- GitHub Pages

No server-side code required - everything is client-side JavaScript.

## Security Notes

⚠️ **Important**: This is a client-side authentication system for demonstration purposes. For production use, consider:

- Server-side authentication
- JWT tokens
- Secure session management
- HTTPS enforcement
- Rate limiting

## Customization

### Changing Demo Credentials
Edit the login validation in `src/pages/login.astro`:

```javascript
if (email === 'your-email@example.com' && password === 'your-password') {
  // Login logic
}
```

### Styling
The login page uses Tailwind CSS classes and can be customized by modifying the classes in `src/pages/login.astro`.

### Adding More Protected Pages
Add the authentication check script to any new page:

```html
<script>
  if (localStorage.getItem('isAuthenticated') !== 'true') {
    window.location.href = '/login';
  }
</script>
``` 