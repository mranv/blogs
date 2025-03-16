---
author: Anubhav Gain
pubDatetime: 2024-04-27T10:00:00Z
modDatetime: 2024-04-27T10:00:00Z
title: Automating Safari Configuration with Bash and AppleScript
slug: automating-safari-configuration-bash-applescript
featured: false
draft: false
tags:
  - macos
  - safari
  - automation
  - bash
  - applescript
  - devops
  - configuration-management
description: Learn how to automate Safari browser configuration on macOS using Bash scripts and AppleScript, perfect for fleet management, custom deployments, and organizational standardization.
---

# Automating Safari Configuration with Bash and AppleScript

When managing macOS environments in an enterprise setting or simply wanting to automate your personal setup, programmatically configuring Safari can be extremely useful. In this article, we'll explore two approaches for automating Safari configuration: a hybrid Bash/AppleScript solution and a pure AppleScript implementation.

## Why Automate Safari Configuration?

Before diving into the code, let's consider some scenarios where automating Safari configuration is beneficial:

- **Enterprise Fleet Management**: Standardizing browser settings across all company devices
- **Educational Environments**: Setting appropriate homepages and behaviors for student machines
- **Kiosk Setups**: Configuring Safari for public-facing, single-purpose computers
- **Onboarding Automation**: Quickly setting up new user accounts with standardized browser settings
- **Testing Environments**: Creating consistent browser states for web application testing

## Approach 1: Hybrid Bash and AppleScript Solution

Our first approach combines the power of Bash for writing system preferences with AppleScript for GUI interactions. This method is comprehensive, handling both the under-the-hood settings and any UI-based configurations.

```bash
#!/bin/bash

# Quit Safari
osascript -e 'tell application "Safari" to quit'
sleep 2

# Modify Safari preferences
defaults write com.apple.Safari HomePage -string "https://infopercept.com"
defaults write com.apple.Safari NewWindowBehavior -int 0
defaults write com.apple.Safari NewTabBehavior -int 0
killall cfprefsd

# Reopen Safari
sleep 2
open -a Safari
sleep 3

# Use AppleScript to enter the homepage URL in Safari Preferences
osascript <<EOF
tell application "System Events"
    tell process "Safari"
        delay 2
        keystroke "," using command down -- Open Preferences
        delay 2
        -- Navigate to Homepage field
        keystroke tab
        keystroke tab
        keystroke tab
        keystroke tab
        delay 1
        -- Select existing text and replace with homepage URL
        keystroke "a" using command down
        delay 0.5
        keystroke "https://infopercept.com"
        delay 0.5
        keystroke return
        -- Close Preferences
        keystroke "w" using command down
    end tell
end tell
EOF

echo "✅ Safari homepage successfully set to https://infopercept.com"
```

### How It Works

1. **First, We Quit Safari**: This ensures no active sessions interfere with our configuration changes.
2. **Modify Safari Preferences**: Using the `defaults write` command, we directly edit Safari's preference files:
   - Set the homepage URL
   - Configure new window behavior (0 = homepage)
   - Configure new tab behavior (0 = homepage)
3. **Restart the Preferences Daemon**: `killall cfprefsd` ensures changes are immediately recognized.
4. **Reopen Safari**: Give the app time to start up before the next steps.
5. **AppleScript UI Interaction**: This part simulates user interaction with Safari's preferences:
   - Open preferences dialog (Cmd+,)
   - Navigate to appropriate field using tab keys
   - Replace the text with our homepage URL
   - Close the preferences window

### Advantages and Limitations

**Advantages**:

- Combines direct preference writing with UI manipulation
- More thorough, addressing both backend settings and UI state
- Handles cases where preferences might need GUI interaction

**Limitations**:

- More complex and harder to maintain
- UI interactions are brittle and can break with Safari updates
- Requires delays which slow down execution

## Approach 2: Pure AppleScript Solution

Our second approach is cleaner, using AppleScript as a wrapper but still leveraging `defaults write` commands. This solution is more elegant and often more reliable across different macOS versions.

```applescript
#!/usr/bin/osascript

-- Quit Safari to ensure preferences apply
tell application "Safari" to quit
delay 2

-- Set homepage and open behavior
do shell script "defaults write com.apple.Safari HomePage -string 'https://infopercept.com'"
do shell script "defaults write com.apple.Safari NewWindowBehavior -int 0"
do shell script "defaults write com.apple.Safari NewTabBehavior -int 0"
do shell script "killall cfprefsd"

-- Open Safari
delay 2
tell application "Safari" to activate

return "Safari homepage successfully set to https://infopercept.com"
```

### How It Works

1. **Quit Safari**: Similar to our first approach, but using AppleScript syntax
2. **Shell Commands Within AppleScript**: We're still using `defaults write`, but now within the AppleScript framework
3. **App Activation**: We simply activate Safari rather than trying to manipulate its UI
4. **Return a Status Message**: Provides feedback that the script completed successfully

### Advantages and Limitations

**Advantages**:

- Cleaner, more maintainable code
- Less brittle than UI interaction scripts
- More likely to work across Safari versions
- Easier to integrate into larger AppleScript workflows

**Limitations**:

- Doesn't handle settings that might only be available via UI (though this specific example doesn't need that)
- Requires both AppleScript and shell command knowledge

## Understanding Safari Preferences

The key to these scripts is understanding how Safari stores its preferences. The `defaults write` command allows us to write values directly to Safari's preference domain (`com.apple.Safari`).

Here are some of the key preferences we're setting:

| Preference Key    | Value      | Description                                                           |
| ----------------- | ---------- | --------------------------------------------------------------------- |
| HomePage          | String URL | The URL to use as Safari's homepage                                   |
| NewWindowBehavior | 0          | Controls what happens when a new window is opened (0 = show homepage) |
| NewTabBehavior    | 0          | Controls what happens when a new tab is opened (0 = show homepage)    |

You can discover additional Safari preferences using:

```bash
defaults read com.apple.Safari
```

## Best Practices for Safari Automation

1. **Always Close Safari**: Make sure to quit Safari before making changes to its preferences.
2. **Include Delays**: When Safari needs to be reopened or when UI interaction is needed, add sufficient delays.
3. **Restart cfprefsd**: This ensures changes take effect immediately.
4. **Test on Multiple macOS Versions**: Safari UI and preferences can change between macOS releases.
5. **Add Error Handling**: For production scripts, include error checking and reporting.

## Extending the Script for Additional Settings

You can expand these scripts to configure other Safari settings. Here are some useful additional preferences:

```bash
# Disable AutoFill
defaults write com.apple.Safari AutoFillFromAddressBook -bool false
defaults write com.apple.Safari AutoFillPasswords -bool false
defaults write com.apple.Safari AutoFillCreditCardData -bool false
defaults write com.apple.Safari AutoFillMiscellaneousForms -bool false

# Privacy and Security
defaults write com.apple.Safari SendDoNotTrackHTTPHeader -bool true
defaults write com.apple.Safari WebKitPreferences.privateClickMeasurementEnabled -bool true

# Developer settings
defaults write com.apple.Safari IncludeDevelopMenu -bool true
defaults write com.apple.Safari WebKitDeveloperExtrasEnabledPreferenceKey -bool true
```

## Deployment in Enterprise Environments

For enterprise deployment, consider:

1. **MDM Integration**: Incorporate these scripts into your MDM solution's custom scripts
2. **Startup Scripts**: Add these configurations to login items or LaunchAgents
3. **User Permissions**: Ensure the executing user has appropriate permissions to modify Safari preferences
4. **Notification Management**: Consider suppressing or customizing user notifications about these changes

## Conclusion

Automating Safari configuration through scripts provides a powerful way to standardize browser settings across multiple machines or to quickly set up your preferred environment. Both approaches outlined here—the hybrid Bash/AppleScript method and the pure AppleScript solution—offer flexibility depending on your specific needs.

For most cases, the pure AppleScript approach is cleaner and more maintainable, but the hybrid approach offers more power when you need to interact with Safari's UI directly. Choose the method that best fits your automation requirements, and consider building upon these examples to create a comprehensive Safari configuration that meets your organizational or personal needs.

By mastering these techniques, you'll have greater control over your macOS environment and can ensure consistency across multiple systems.
