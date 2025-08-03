# Authentication System

This Astro blog now includes a modern React-based authentication system that protects all content pages. Users must log in before accessing the blog content.

## Features

- **Modern React UI**: Beautiful, responsive authentication interface built with React and Tailwind CSS
- **Static Authentication**: Uses localStorage for client-side authentication
- **Login/Signup Toggle**: Seamless switching between login and signup modes
- **Protected Routes**: All main pages require authentication
- **Logout Functionality**: Logout button in the header
- **Demo Credentials**: Pre-configured demo account for testing
- **Form Validation**: Real-time validation and error handling
- **Loading States**: Smooth loading animations and feedback
- **Social Login Options**: Google and GitHub integration ready

## How It Works

### Authentication Flow
1. Users visit any page → redirected to `/auth` if not authenticated
2. Users log in with demo credentials or create new account
3. Authentication state stored in localStorage
4. Users can access all protected content
5. Logout clears authentication and redirects to auth page

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
- Authentication page (`/auth`)
- Login redirect (`/login` → `/auth`)
- 404 page
- RSS feed
- Robots.txt

## Technical Implementation

### React Component
The authentication system uses a modern React component (`SignInPage.tsx`) with:
- State management using React hooks
- Form validation and error handling
- Loading states and animations
- Responsive design with Tailwind CSS
- Integration with the project's design system

### Authentication Check
Each protected page includes a client-side script that checks localStorage:

```javascript
if (localStorage.getItem('isAuthenticated') !== 'true') {
  window.location.href = '/auth';
}
```

### Design System Integration
The authentication component uses the project's design tokens:
- OKLCH color system for consistent theming
- CSS custom properties for dynamic theming
- Tailwind CSS classes for styling
- Lucide React icons for consistent iconography

### Features
- **Toggle between Login/Signup**: Single component handles both modes
- **Password Visibility Toggle**: Show/hide password functionality
- **Form Validation**: Real-time validation with error messages
- **Loading States**: Spinner animations during authentication
- **Success/Error Messages**: Clear feedback for user actions
- **Remember Me**: Checkbox for persistent login
- **Social Login**: Google and GitHub buttons (ready for integration)
- **Demo Credentials**: Built-in demo account for testing

## Deployment

This authentication system works perfectly with static hosting platforms like:
- Cloudflare Pages
- Netlify
- Vercel
- GitHub Pages

No server-side code required - everything is client-side JavaScript with React.

## Security Notes

⚠️ **Important**: This is a client-side authentication system for demonstration purposes. For production use, consider:
- Server-side authentication with JWT tokens
- HTTPS enforcement
- Rate limiting
- Password hashing and salting
- Multi-factor authentication
- Session management
- CSRF protection

## Development

### Adding New Features
1. Modify `src/components/auth/SignInPage.tsx` for UI changes
2. Update `src/styles/base.css` for additional animations
3. Test with the demo credentials
4. Ensure responsive design works on all devices

### Customization
- Colors: Update CSS custom properties in `src/styles/base.css`
- Animations: Add new keyframes and animation classes
- Icons: Replace Lucide React icons with custom ones
- Layout: Modify the grid structure for different layouts 