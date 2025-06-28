---
author: Anubhav Gain
pubDatetime: 2025-01-28T16:15:00+05:30
modDatetime: 2025-01-28T16:15:00+05:30
title: Apple Endpoint Security Framework - Building macOS Security Tools
slug: apple-endpoint-security-framework-demo
featured: false
draft: false
tags:
  - macos
  - security
  - endpoint-security
  - apple
  - objective-c
  - system-extension
  - edr
  - monitoring
description: Comprehensive guide to Apple's Endpoint Security framework with a complete demo implementation, covering event monitoring, auth decisions, and building security tools for macOS
---

# Apple Endpoint Security Framework: Building macOS Security Tools

Apple's Endpoint Security (ES) framework provides a powerful API for building security solutions on macOS. This comprehensive guide demonstrates how to create security tools using the ES framework, with a complete implementation tested on macOS Sequoia 15.2.

## Introduction

The Endpoint Security framework, introduced in macOS Catalina 10.15, allows authorized developers to create system extensions that monitor and authorize system events in real-time. This enables the development of sophisticated security solutions including:

- Endpoint Detection and Response (EDR) tools
- Data Loss Prevention (DLP) solutions
- Threat detection systems
- Compliance monitoring tools
- File integrity monitoring

## Prerequisites

### Development Requirements

1. **Xcode 16+** with macOS deployment target set to 10.15 or later
2. **Hardened Runtime** capability enabled
3. **Libraries to link**:
   - `libEndpointSecurity.tbd` (Endpoint Security functions)
   - `libbsm.tbd` (Audit Token functions)
   - `UniformTypeIdentifiers.framework` (UTI functions, weak link for Catalina)

### Entitlements

The key entitlement required is:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.developer.endpoint-security.client</key>
    <true/>
</dict>
</plist>
```

### Runtime Requirements

1. **macOS 10.15+** for testing
2. **Root privileges** (run with sudo)
3. **Full Disk Access** permission granted in System Preferences
4. **SIP disabled** if you don't have the official entitlement from Apple

## Core Implementation

### Global Variables and Setup

```objc
#import <Foundation/Foundation.h>
#import <EndpointSecurity/EndpointSecurity.h>
#import <bsm/libbsm.h>
#import <signal.h>
#import <mach/mach_time.h>

#pragma mark Globals

es_client_t *g_client = nil;
NSSet *g_blocked_paths = nil;
NSDateFormatter *g_date_formater = nil;

// Event handler selected at startup
es_handler_block_t g_handler = nil;

// For detecting dropped events
uint64_t g_global_seq_num = 0;
NSMutableDictionary *g_seq_nums = nil;

// Cache auth results
bool g_cache_auth_results = false;

// Verbose logging flag
bool g_verbose_logging = false;
```

### Time Conversion Helpers

```objc
// Convert Mach absolute time to nanoseconds
uint64_t MachTimeToNanoseconds(uint64_t machTime) {
    uint64_t nanoseconds = 0;
    static mach_timebase_info_data_t sTimebase;
    if(sTimebase.denom == 0)
        (void)mach_timebase_info(&sTimebase);
        
    nanoseconds = ((machTime * sTimebase.numer) / sTimebase.denom);
        
    return nanoseconds;
}

uint64_t MachTimeToSeconds(uint64_t machTime) {
    return MachTimeToNanoseconds(machTime) / NSEC_PER_SEC;
}
```

### Event Type Handling

```objc
const NSString* event_type_str(const es_event_type_t event_type) {
    static const NSString *names[] = {
        // macOS 10.15
        @"ES_EVENT_TYPE_AUTH_EXEC", @"ES_EVENT_TYPE_AUTH_OPEN", 
        @"ES_EVENT_TYPE_AUTH_KEXTLOAD", @"ES_EVENT_TYPE_AUTH_MMAP",
        @"ES_EVENT_TYPE_NOTIFY_EXEC", @"ES_EVENT_TYPE_NOTIFY_OPEN",
        @"ES_EVENT_TYPE_NOTIFY_FORK", @"ES_EVENT_TYPE_NOTIFY_CLOSE",
        // ... additional event types
        
        // macOS 15.0
        @"ES_EVENT_TYPE_NOTIFY_GATEKEEPER_USER_OVERRIDE"
    };
    
    if(event_type >= ES_EVENT_TYPE_LAST) {
        return [NSString stringWithFormat:@"Unknown event type: %d", event_type];
    }
    
    return names[event_type];
}
```

### Setting Up Endpoint Security

```objc
bool setup_endpoint_security(void) {
    // Create a new client with event handler
    es_new_client_result_t res = es_new_client(&g_client, g_handler);
    
    if(ES_NEW_CLIENT_RESULT_SUCCESS != res) {
        switch(res) {
            case ES_NEW_CLIENT_RESULT_ERR_NOT_ENTITLED:
                LOG_ERROR("Application requires 'com.apple.developer.endpoint-security.client' entitlement");
                break;

            case ES_NEW_CLIENT_RESULT_ERR_NOT_PERMITTED:
                LOG_ERROR("Application lacks TCC approval. Grant 'Full Disk Access' in System Preferences.");
                break;

            case ES_NEW_CLIENT_RESULT_ERR_NOT_PRIVILEGED:
                LOG_ERROR("Application needs to be run as root");
                break;

            default:
                LOG_ERROR("es_new_client: %d", res);
        }
        
        return false;
    }
    
    // Clear cache of previous results
    es_clear_cache_result_t resCache = es_clear_cache(g_client);
    if(ES_CLEAR_CACHE_RESULT_SUCCESS != resCache) {
        LOG_ERROR("es_clear_cache: %d", resCache);
        return false;
    }
    
    // Subscribe to events we're interested in
    es_event_type_t events[] = {
        ES_EVENT_TYPE_AUTH_EXEC,
        ES_EVENT_TYPE_AUTH_OPEN,
        ES_EVENT_TYPE_NOTIFY_FORK
    };
    
    es_return_t subscribed = es_subscribe(g_client, events, sizeof events / sizeof *events);
    
    if(ES_RETURN_ERROR == subscribed) {
        LOG_ERROR("es_subscribe: ES_RETURN_ERROR");
        return false;
    }
    
    return log_subscribed_events();
}
```

## Event Handling

### Serial Event Handler

```objc
es_handler_block_t serial_message_handler = ^(es_client_t *clt, const es_message_t *msg) {
    // Log event message if verbose
    LOG_VERBOSE_EVENT_MESSAGE(msg);
    
    // Detect dropped events
    detect_and_log_dropped_events(msg);
    
    // Auth events require a response before deadline
    if(ES_ACTION_TYPE_AUTH == msg->action_type) {
        respond_to_auth_event(clt, msg, auth_event_handler(msg));
    }
};
```

### Asynchronous Event Handler

```objc
es_handler_block_t asynchronous_message_handler = ^(es_client_t *clt, const es_message_t *msg) {
    LOG_VERBOSE_EVENT_MESSAGE(msg);
    detect_and_log_dropped_events(msg);
    
    // Copy message for async processing
    es_message_t *copied_msg = copy_message(msg);
    
    if(!copied_msg) {
        LOG_ERROR("Failed to copy message");
        return;
    }
    
    // Handle auth events asynchronously
    if(ES_ACTION_TYPE_AUTH == copied_msg->action_type) {
        dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_BACKGROUND, 0), ^(void){
            es_auth_result_t result = auth_event_handler(copied_msg);
            
            // Demonstrate delayed response for denied execs
            if(ES_AUTH_RESULT_DENY == result &&
               ES_EVENT_TYPE_AUTH_EXEC == copied_msg->event_type) {
                [NSThread sleepForTimeInterval:20.0];
            }
            
            respond_to_auth_event(clt, copied_msg, result);
            free_message(copied_msg);
        });
        
        return;
    }
    
    free_message(copied_msg);
};
```

## Making Authorization Decisions

### Auth Event Handler

```objc
es_auth_result_t auth_event_handler(const es_message_t *msg) {
    // Ignore events from other ES Clients
    if(msg->process->is_es_client) {
        return ES_AUTH_RESULT_ALLOW;
    }
    
    // Ignore events from root processes
    if(0 == audit_token_to_ruid(msg->process->audit_token)) {
        return ES_AUTH_RESULT_ALLOW;
    }
    
    // Block exec if path is in blocked list
    if(ES_EVENT_TYPE_AUTH_EXEC == msg->event_type) {
        NSString *path = esstring_to_nsstring(msg->event.exec.target->executable->path);
        
        if(![g_blocked_paths containsObject:path]) {
            return ES_AUTH_RESULT_ALLOW;
        }
        
        LOG_IMPORTANT_INFO("BLOCKING EXEC: %@", path);
        return ES_AUTH_RESULT_DENY;
    }
    
    // Block vim from accessing plain text files
    if(ES_EVENT_TYPE_AUTH_OPEN == msg->event_type) {
        NSString *processPath = esstring_to_nsstring(msg->process->executable->path);
        
        if(![processPath isEqualToString:@"/usr/bin/vim"]) {
            return ES_AUTH_RESULT_ALLOW;
        }
        
        NSString *filePath = esstring_to_nsstring(msg->event.open.file->path);
        
        if(is_system_file(filePath)) {
            return ES_AUTH_RESULT_ALLOW;
        }
        
        if(!is_plain_text_file(filePath)) {
            return ES_AUTH_RESULT_ALLOW;
        }
        
        LOG_IMPORTANT_INFO("BLOCKING OPEN: %@", filePath);
        return ES_AUTH_RESULT_DENY;
    }
    
    return ES_AUTH_RESULT_ALLOW;
}
```

### Responding to Auth Events

```objc
void respond_to_auth_event(es_client_t *clt, const es_message_t *msg, es_auth_result_t result) {
    // Log denied events
    if(ES_AUTH_RESULT_DENY == result) {
        LOG_NON_VERBOSE_EVENT_MESSAGE(msg);
    }
    
    // AUTH_OPEN events require special response
    if(ES_EVENT_TYPE_AUTH_OPEN == msg->event_type) {
        uint32_t authorized_flags = 0;
        
        if(ES_AUTH_RESULT_ALLOW == result) {
            authorized_flags = msg->event.open.fflag;
        }
        
        es_respond_result_t res =
            es_respond_flags_result(clt, msg, authorized_flags, g_cache_auth_results);
        
        if(ES_RESPOND_RESULT_SUCCESS != res) {
            LOG_ERROR("es_respond_flags_result: %d", res);
        }
        
    } else {
        es_respond_result_t res =
            es_respond_auth_result(clt, msg, result, g_cache_auth_results);
        
        if(ES_RESPOND_RESULT_SUCCESS != res) {
            LOG_ERROR("es_respond_auth_result: %d", res);
        }
    }
}
```

## Advanced Features

### Detecting Dropped Events

```objc
void detect_and_log_dropped_events(const es_message_t *msg) {
    uint32_t version = msg->version;
    
    // Use seq_num field for per-event-type detection
    if(version >= 2) {
        uint64_t seq_num = msg->seq_num;
        
        const NSString *type = event_type_str(msg->event_type);
        NSNumber *last_seq_num = [g_seq_nums objectForKey:type];
        
        if(last_seq_num != nil) {
            uint64_t expected_seq_num = [last_seq_num unsignedLongLongValue] + 1;
            
            if(seq_num > expected_seq_num) {
                LOG_ERROR("EVENTS DROPPED! seq_num is ahead by: %llu",
                          (seq_num - expected_seq_num));
            }
        }
        
        [g_seq_nums setObject:[NSNumber numberWithUnsignedLong:seq_num] forKey:type];
    }
    
    // Use global_seq_num for overall detection
    if(version >= 4) {
        uint64_t global_seq_num = msg->global_seq_num;
        
        if(global_seq_num > ++g_global_seq_num) {
            LOG_ERROR("EVENTS DROPPED! global_seq_num is ahead by: %llu",
                      (global_seq_num - g_global_seq_num));
            g_global_seq_num = global_seq_num;
        }
    }
}
```

### Muting Paths

```objc
bool mute_path(const char* path) {
    es_return_t result = ES_RETURN_ERROR;
    
    if(@available(macOS 12.0, *)) {
        result = es_mute_path(g_client, path, ES_MUTE_PATH_TYPE_LITERAL);
    } else {
        result = es_mute_path_literal(g_client, path);
    }
    
    if(ES_RETURN_SUCCESS != result) {
        LOG_ERROR("mute_path: ES_RETURN_ERROR");
        return false;
    }
    
    return true;
}
```

### Logging Muted Paths (macOS 12.0+)

```objc
API_AVAILABLE(macos(12.0))
bool log_muted_paths_events(void) {
    es_muted_paths_t *muted_paths = NULL;
    es_return_t result = es_muted_paths_events(g_client, &muted_paths);
    
    if(ES_RETURN_SUCCESS != result) {
        LOG_ERROR("es_muted_paths_events: ES_RETURN_ERROR");
        return false;
    }
    
    if(NULL == muted_paths) {
        return true;
    }
    
    LOG_IMPORTANT_INFO("Muted Paths");
    for(size_t i = 0; i < muted_paths->count; i++) {
        es_muted_path_t muted_path = muted_paths->paths[i];
        LOG_INFO("muted_path[%ld]: %@", i, esstring_to_nsstring(muted_path.path));
        
        if(g_verbose_logging) {
            LOG_INDENT_INC();
            LOG_INFO("type: %s", (muted_path.type == ES_MUTE_PATH_TYPE_PREFIX) ? "Prefix" : "Literal");
            LOG_INFO("event_count: %ld", muted_path.event_count);
            LOG_INFO("events: %@", events_str(muted_path.event_count, muted_path.events));
            LOG_INDENT_DEC();
        }
    }
    
    es_release_muted_paths(muted_paths);
    return true;
}
```

## Complete Main Function

```objc
int main(int argc, const char * argv[]) {
    signal(SIGINT, &sig_handler);
    
    @autoreleasepool {
        // Initialize globals
        g_handler = get_message_handler_from_commandline_args(argc, argv);
        
        if(!g_handler) {
            print_usage(argv[0]);
            return 1;
        }
        
        init_date_formater();
        g_seq_nums = [NSMutableDictionary new];
        
        // Configure blocked paths
        g_blocked_paths = [NSSet setWithObjects:
                          @"/usr/bin/top",
                          @"/System/Applications/Calculator.app/Contents/MacOS/Calculator",
                          nil];
        
        if(!setup_endpoint_security()) {
            return 1;
        }
        
        // Example: Mute specific paths
        // mute_path("/usr/bin/vim");
        
        if(@available(macOS 12.0, *)) {
            log_muted_paths_events();
        } else {
            // Prevent deadlocks on older macOS versions
            mute_path("/usr/sbin/cfprefsd");
        }
        
        // Start handling events
        dispatch_main();
    }
    
    return 0;
}
```

## Running the Demo

### Command Line Usage

```bash
# Run with serial handler
sudo ./EndpointSecurityDemo serial

# Run with asynchronous handler
sudo ./EndpointSecurityDemo asynchronous

# Enable verbose logging
sudo ./EndpointSecurityDemo serial verbose
```

### Expected Behavior

The demo will:
1. Block the 'top' binary and Calculator app from running
2. Block 'vim' from reading plain text files
3. Monitor fork events
4. Log all security events based on verbosity settings

## Security Best Practices

### 1. Event Processing

- **Always respond within deadline**: Auth events have strict deadlines
- **Validate all inputs**: Check for null pointers and buffer bounds
- **Minimize processing time**: Complex logic should be asynchronous

### 2. Performance Considerations

- **Mute unnecessary paths**: Reduce event volume
- **Use caching**: Cache auth results when appropriate
- **Monitor for dropped events**: Detect when kernel drops events

### 3. Error Handling

- **Check all return values**: ES API calls can fail
- **Graceful degradation**: Handle failures without crashing
- **Comprehensive logging**: Log errors for debugging

### 4. Security Decisions

- **Fail secure**: Default to deny when uncertain
- **Ignore ES client events**: Prevent infinite loops
- **Consider context**: User, process hierarchy, file attributes

## Common Issues and Solutions

### 1. Entitlement Issues

**Problem**: `ES_NEW_CLIENT_RESULT_ERR_NOT_ENTITLED`

**Solution**: 
- Ensure proper code signing with entitlement
- For development, disable SIP in recovery mode

### 2. TCC Approval

**Problem**: `ES_NEW_CLIENT_RESULT_ERR_NOT_PERMITTED`

**Solution**:
- Grant Full Disk Access in System Preferences
- Reset TCC if needed: `tccutil reset SystemPolicyAllFiles`

### 3. Deadline Violations

**Problem**: Kernel drops events due to slow processing

**Solution**:
- Use asynchronous processing for complex logic
- Cache auth results
- Optimize decision algorithms

### 4. Memory Management

**Problem**: Memory leaks with message copying

**Solution**:
- Always free copied messages
- Use retain/release on macOS 11+
- Implement proper cleanup handlers

## Advanced Use Cases

### 1. File Integrity Monitoring

```objc
// Monitor file modifications
if(ES_EVENT_TYPE_NOTIFY_WRITE == msg->event_type) {
    NSString *path = esstring_to_nsstring(msg->event.write.target->path);
    if([critical_files containsObject:path]) {
        LOG_ALERT("Critical file modified: %@", path);
        // Send alert to security team
    }
}
```

### 2. Process Behavior Analysis

```objc
// Track process relationships
if(ES_EVENT_TYPE_NOTIFY_FORK == msg->event_type) {
    audit_token_t parent = msg->process->audit_token;
    audit_token_t child = msg->event.fork.child->audit_token;
    
    // Build process tree for analysis
    [process_tree addChild:child toParent:parent];
}
```

### 3. Network Monitoring

```objc
// Monitor network connections
if(ES_EVENT_TYPE_NOTIFY_UIPC_CONNECT == msg->event_type) {
    NSString *process = esstring_to_nsstring(msg->process->executable->path);
    NSString *domain = esstring_to_nsstring(msg->event.uipc_connect.domain);
    
    if([suspicious_domains containsObject:domain]) {
        LOG_ALERT("Suspicious connection: %@ -> %@", process, domain);
    }
}
```

## Conclusion

Apple's Endpoint Security framework provides unprecedented visibility and control over macOS system events. This comprehensive demo illustrates:

- **Event Monitoring**: Real-time visibility into system activities
- **Authorization Control**: Ability to block malicious actions
- **Flexible Architecture**: Support for both serial and async processing
- **Performance Optimization**: Techniques for handling high event volumes
- **Security Best Practices**: Proper implementation patterns

By leveraging these capabilities, developers can create sophisticated security solutions that protect macOS systems from various threats while maintaining system performance and user experience.

## References

1. [Apple Developer Documentation - Endpoint Security](https://developer.apple.com/documentation/endpointsecurity)
2. [WWDC Sessions on Endpoint Security](https://developer.apple.com/videos/)
3. [Apple Security Overview](https://support.apple.com/guide/security/welcome/web)
4. [macOS Security Compliance Project](https://github.com/usnistgov/macos_security)