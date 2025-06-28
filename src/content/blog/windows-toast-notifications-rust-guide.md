---
title: "Windows Toast Notifications with Rust: Complete Implementation Guide"
author: "Anubhav Gain"
pubDatetime: 2025-01-10T18:30:00Z
featured: false
draft: false
tags:
  - rust
  - windows
  - toast-notifications
  - windows-api
  - desktop-development
  - winrt
  - notifications
description: "Comprehensive guide to implementing Windows toast notifications in Rust applications, covering WinRT APIs, notification templates, interactive elements, and advanced notification management."
---

# Windows Toast Notifications with Rust

This comprehensive guide demonstrates how to implement Windows toast notifications in Rust applications using the Windows Runtime (WinRT) APIs. Learn to create rich, interactive notifications that enhance user engagement and provide seamless desktop integration.

## Table of Contents

## Introduction to Windows Toast Notifications

Windows toast notifications are a powerful way to engage users with timely, relevant information. They appear in the Action Center and can include text, images, buttons, and input fields. With Rust's growing ecosystem for Windows development, creating sophisticated notification systems has become more accessible.

### Benefits of Toast Notifications

- **Non-intrusive**: Appear briefly and move to Action Center
- **Interactive**: Support buttons, text input, and selection lists
- **Persistent**: Remain accessible in Action Center until dismissed
- **Rich Content**: Support images, progress bars, and custom layouts
- **System Integration**: Native Windows 10/11 appearance and behavior

## Prerequisites and Setup

### Required Dependencies

Add these dependencies to your `Cargo.toml`:

```toml
[dependencies]
windows = { version = "0.52", features = [
    "Foundation",
    "Foundation_Collections",
    "UI_Notifications",
    "Data_Xml_Dom",
    "Storage_Streams",
    "System"
]}
tokio = { version = "1.0", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
```

### Basic Project Structure

```
src/
├── main.rs
├── notifications/
│   ├── mod.rs
│   ├── builder.rs
│   ├── templates.rs
│   └── manager.rs
└── utils/
    ├── mod.rs
    └── xml_builder.rs
```

## Core Implementation

### Basic Toast Notification

```rust
// src/notifications/mod.rs
use windows::{
    core::*,
    UI::Notifications::*,
    Data::Xml::Dom::*,
    Foundation::*,
};

pub mod builder;
pub mod templates;
pub mod manager;

pub struct ToastNotificationService {
    notifier: Option<ToastNotifier>,
    app_id: String,
}

impl ToastNotificationService {
    pub fn new(app_id: &str) -> Result<Self> {
        let notifier = ToastNotificationManager::CreateToastNotifierWithId(
            &HSTRING::from(app_id)
        )?;

        Ok(Self {
            notifier: Some(notifier),
            app_id: app_id.to_string(),
        })
    }

    pub fn show_simple_toast(&self, title: &str, message: &str) -> Result<()> {
        let template = ToastTemplateType::ToastText02;
        let xml = ToastNotificationManager::GetTemplateContent(template)?;

        // Set title
        let title_elements = xml.GetElementsByTagName(&HSTRING::from("text"))?;
        let title_element = title_elements.Item(0)?;
        title_element.SetInnerText(&HSTRING::from(title))?;

        // Set message
        let message_element = title_elements.Item(1)?;
        message_element.SetInnerText(&HSTRING::from(message))?;

        // Create and show notification
        let toast = ToastNotification::CreateToastNotification(&xml)?;

        if let Some(ref notifier) = self.notifier {
            notifier.Show(&toast)?;
        }

        Ok(())
    }

    pub fn show_custom_toast(&self, xml_content: &str) -> Result<()> {
        let xml_doc = XmlDocument::new()?;
        xml_doc.LoadXml(&HSTRING::from(xml_content))?;

        let toast = ToastNotification::CreateToastNotification(&xml_doc)?;

        if let Some(ref notifier) = self.notifier {
            notifier.Show(&toast)?;
        }

        Ok(())
    }
}
```

### Advanced Toast Builder

```rust
// src/notifications/builder.rs
use super::*;
use std::collections::HashMap;

#[derive(Debug, Clone)]
pub struct ToastBuilder {
    pub title: Option<String>,
    pub subtitle: Option<String>,
    pub body: Option<String>,
    pub image_path: Option<String>,
    pub app_logo: Option<String>,
    pub buttons: Vec<ToastButton>,
    pub inputs: Vec<ToastInput>,
    pub audio: Option<ToastAudio>,
    pub duration: Option<ToastDuration>,
    pub scenario: Option<ToastScenario>,
    pub expiration_time: Option<i64>,
    pub tag: Option<String>,
    pub group: Option<String>,
    pub header: Option<ToastHeader>,
    pub progress: Option<ToastProgress>,
}

#[derive(Debug, Clone)]
pub struct ToastButton {
    pub content: String,
    pub arguments: String,
    pub activation_type: ActivationType,
    pub image_uri: Option<String>,
    pub input_id: Option<String>,
    pub text_box_id: Option<String>,
}

#[derive(Debug, Clone)]
pub struct ToastInput {
    pub id: String,
    pub input_type: InputType,
    pub title: Option<String>,
    pub placeholder_content: Option<String>,
    pub default_input: Option<String>,
    pub selections: Vec<SelectionItem>,
}

#[derive(Debug, Clone)]
pub struct SelectionItem {
    pub id: String,
    pub content: String,
}

#[derive(Debug, Clone)]
pub enum InputType {
    Text,
    Selection,
}

#[derive(Debug, Clone)]
pub enum ActivationType {
    Foreground,
    Background,
    Protocol,
    System,
}

#[derive(Debug, Clone)]
pub struct ToastAudio {
    pub src: Option<String>,
    pub loop_audio: bool,
    pub silent: bool,
}

#[derive(Debug, Clone)]
pub enum ToastDuration {
    Short,
    Long,
}

#[derive(Debug, Clone)]
pub enum ToastScenario {
    Default,
    Alarm,
    Reminder,
    IncomingCall,
    Urgent,
}

#[derive(Debug, Clone)]
pub struct ToastHeader {
    pub id: String,
    pub title: String,
    pub arguments: String,
    pub activation_type: ActivationType,
}

#[derive(Debug, Clone)]
pub struct ToastProgress {
    pub title: Option<String>,
    pub status: Option<String>,
    pub value: Option<f64>,
    pub value_string_override: Option<String>,
}

impl ToastBuilder {
    pub fn new() -> Self {
        Self {
            title: None,
            subtitle: None,
            body: None,
            image_path: None,
            app_logo: None,
            buttons: Vec::new(),
            inputs: Vec::new(),
            audio: None,
            duration: None,
            scenario: None,
            expiration_time: None,
            tag: None,
            group: None,
            header: None,
            progress: None,
        }
    }

    pub fn title(mut self, title: &str) -> Self {
        self.title = Some(title.to_string());
        self
    }

    pub fn subtitle(mut self, subtitle: &str) -> Self {
        self.subtitle = Some(subtitle.to_string());
        self
    }

    pub fn body(mut self, body: &str) -> Self {
        self.body = Some(body.to_string());
        self
    }

    pub fn image(mut self, image_path: &str) -> Self {
        self.image_path = Some(image_path.to_string());
        self
    }

    pub fn app_logo(mut self, logo_path: &str) -> Self {
        self.app_logo = Some(logo_path.to_string());
        self
    }

    pub fn add_button(mut self, button: ToastButton) -> Self {
        self.buttons.push(button);
        self
    }

    pub fn add_input(mut self, input: ToastInput) -> Self {
        self.inputs.push(input);
        self
    }

    pub fn audio(mut self, audio: ToastAudio) -> Self {
        self.audio = Some(audio);
        self
    }

    pub fn duration(mut self, duration: ToastDuration) -> Self {
        self.duration = Some(duration);
        self
    }

    pub fn scenario(mut self, scenario: ToastScenario) -> Self {
        self.scenario = Some(scenario);
        self
    }

    pub fn expiration_time(mut self, timestamp: i64) -> Self {
        self.expiration_time = Some(timestamp);
        self
    }

    pub fn tag(mut self, tag: &str) -> Self {
        self.tag = Some(tag.to_string());
        self
    }

    pub fn group(mut self, group: &str) -> Self {
        self.group = Some(group.to_string());
        self
    }

    pub fn header(mut self, header: ToastHeader) -> Self {
        self.header = Some(header);
        self
    }

    pub fn progress(mut self, progress: ToastProgress) -> Self {
        self.progress = Some(progress);
        self
    }

    pub fn build_xml(&self) -> String {
        let mut xml = String::new();
        xml.push_str(r#"<toast"#);

        // Add scenario attribute
        if let Some(ref scenario) = self.scenario {
            let scenario_str = match scenario {
                ToastScenario::Default => "default",
                ToastScenario::Alarm => "alarm",
                ToastScenario::Reminder => "reminder",
                ToastScenario::IncomingCall => "incomingCall",
                ToastScenario::Urgent => "urgent",
            };
            xml.push_str(&format!(r#" scenario="{}""#, scenario_str));
        }

        // Add duration attribute
        if let Some(ref duration) = self.duration {
            let duration_str = match duration {
                ToastDuration::Short => "short",
                ToastDuration::Long => "long",
            };
            xml.push_str(&format!(r#" duration="{}""#, duration_str));
        }

        xml.push_str(">");

        // Add header
        if let Some(ref header) = self.header {
            xml.push_str(&format!(
                r#"<header id="{}" title="{}" arguments="{}" activationType="{}"/>"#,
                header.id,
                header.title,
                header.arguments,
                self.activation_type_to_string(&header.activation_type)
            ));
        }

        // Visual content
        xml.push_str("<visual>");
        xml.push_str(r#"<binding template="ToastGeneric">"#);

        // Add image
        if let Some(ref image_path) = self.image_path {
            xml.push_str(&format!(r#"<image placement="hero" src="{}"/>"#, image_path));
        }

        // Add app logo
        if let Some(ref app_logo) = self.app_logo {
            xml.push_str(&format!(
                r#"<image placement="appLogoOverride" hint-crop="circle" src="{}"/>"#,
                app_logo
            ));
        }

        // Add text elements
        if let Some(ref title) = self.title {
            xml.push_str(&format!(r#"<text>{}</text>"#, title));
        }

        if let Some(ref subtitle) = self.subtitle {
            xml.push_str(&format!(r#"<text hint-style="body">{}</text>"#, subtitle));
        }

        if let Some(ref body) = self.body {
            xml.push_str(&format!(r#"<text hint-style="captionSubtle">{}</text>"#, body));
        }

        // Add progress bar
        if let Some(ref progress) = self.progress {
            xml.push_str("<progress");

            if let Some(ref title) = progress.title {
                xml.push_str(&format!(r#" title="{}""#, title));
            }

            if let Some(ref status) = progress.status {
                xml.push_str(&format!(r#" status="{}""#, status));
            }

            if let Some(value) = progress.value {
                xml.push_str(&format!(r#" value="{}""#, value));
            }

            if let Some(ref value_override) = progress.value_string_override {
                xml.push_str(&format!(r#" valueStringOverride="{}""#, value_override));
            }

            xml.push_str("/>");
        }

        xml.push_str("</binding>");
        xml.push_str("</visual>");

        // Add actions
        if !self.buttons.is_empty() || !self.inputs.is_empty() {
            xml.push_str("<actions>");

            // Add inputs
            for input in &self.inputs {
                match input.input_type {
                    InputType::Text => {
                        xml.push_str(&format!(r#"<input id="{}" type="text""#, input.id));

                        if let Some(ref title) = input.title {
                            xml.push_str(&format!(r#" title="{}""#, title));
                        }

                        if let Some(ref placeholder) = input.placeholder_content {
                            xml.push_str(&format!(r#" placeHolderContent="{}""#, placeholder));
                        }

                        if let Some(ref default) = input.default_input {
                            xml.push_str(&format!(r#" defaultInput="{}""#, default));
                        }

                        xml.push_str("/>");
                    }
                    InputType::Selection => {
                        xml.push_str(&format!(r#"<input id="{}" type="selection""#, input.id));

                        if let Some(ref title) = input.title {
                            xml.push_str(&format!(r#" title="{}""#, title));
                        }

                        if let Some(ref default) = input.default_input {
                            xml.push_str(&format!(r#" defaultInput="{}""#, default));
                        }

                        xml.push_str(">");

                        for selection in &input.selections {
                            xml.push_str(&format!(
                                r#"<selection id="{}" content="{}"/>"#,
                                selection.id, selection.content
                            ));
                        }

                        xml.push_str("</input>");
                    }
                }
            }

            // Add buttons
            for button in &self.buttons {
                xml.push_str(&format!(
                    r#"<action content="{}" arguments="{}" activationType="{}""#,
                    button.content,
                    button.arguments,
                    self.activation_type_to_string(&button.activation_type)
                ));

                if let Some(ref image_uri) = button.image_uri {
                    xml.push_str(&format!(r#" imageUri="{}""#, image_uri));
                }

                if let Some(ref input_id) = button.input_id {
                    xml.push_str(&format!(r#" hint-inputId="{}""#, input_id));
                }

                if let Some(ref text_box_id) = button.text_box_id {
                    xml.push_str(&format!(r#" hint-textBoxId="{}""#, text_box_id));
                }

                xml.push_str("/>");
            }

            xml.push_str("</actions>");
        }

        // Add audio
        if let Some(ref audio) = self.audio {
            xml.push_str("<audio");

            if let Some(ref src) = audio.src {
                xml.push_str(&format!(r#" src="{}""#, src));
            }

            if audio.loop_audio {
                xml.push_str(r#" loop="true""#);
            }

            if audio.silent {
                xml.push_str(r#" silent="true""#);
            }

            xml.push_str("/>");
        }

        xml.push_str("</toast>");
        xml
    }

    fn activation_type_to_string(&self, activation_type: &ActivationType) -> &'static str {
        match activation_type {
            ActivationType::Foreground => "foreground",
            ActivationType::Background => "background",
            ActivationType::Protocol => "protocol",
            ActivationType::System => "system",
        }
    }
}

impl Default for ToastBuilder {
    fn default() -> Self {
        Self::new()
    }
}
```

### Notification Manager

```rust
// src/notifications/manager.rs
use super::*;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tokio::sync::mpsc;

pub struct NotificationManager {
    service: ToastNotificationService,
    active_notifications: Arc<Mutex<HashMap<String, ToastNotification>>>,
    event_sender: Option<mpsc::UnboundedSender<NotificationEvent>>,
}

#[derive(Debug, Clone)]
pub enum NotificationEvent {
    Activated { tag: String, arguments: String },
    Dismissed { tag: String, reason: String },
    Failed { tag: String, error: String },
}

impl NotificationManager {
    pub fn new(app_id: &str) -> Result<Self> {
        let service = ToastNotificationService::new(app_id)?;

        Ok(Self {
            service,
            active_notifications: Arc::new(Mutex::new(HashMap::new())),
            event_sender: None,
        })
    }

    pub fn set_event_handler(&mut self, sender: mpsc::UnboundedSender<NotificationEvent>) {
        self.event_sender = Some(sender);
    }

    pub fn show_notification(&self, builder: ToastBuilder) -> Result<String> {
        let xml_content = builder.build_xml();
        let tag = builder.tag.clone().unwrap_or_else(|| {
            format!("notification_{}", chrono::Utc::now().timestamp_millis())
        });

        // Create notification
        let xml_doc = XmlDocument::new()?;
        xml_doc.LoadXml(&HSTRING::from(&xml_content))?;

        let toast = ToastNotification::CreateToastNotification(&xml_doc)?;

        // Set tag and group
        if let Some(ref tag_value) = builder.tag {
            toast.SetTag(&HSTRING::from(tag_value))?;
        }

        if let Some(ref group_value) = builder.group {
            toast.SetGroup(&HSTRING::from(group_value))?;
        }

        // Set expiration time
        if let Some(expiration_time) = builder.expiration_time {
            let datetime = DateTime::from_abi(expiration_time)?;
            toast.SetExpirationTime(&datetime.into())?;
        }

        // Set up event handlers
        self.setup_event_handlers(&toast, &tag)?;

        // Store notification
        if let Ok(mut active) = self.active_notifications.lock() {
            active.insert(tag.clone(), toast.clone());
        }

        // Show notification
        if let Some(ref notifier) = self.service.notifier {
            notifier.Show(&toast)?;
        }

        Ok(tag)
    }

    fn setup_event_handlers(&self, toast: &ToastNotification, tag: &str) -> Result<()> {
        let tag_clone = tag.to_string();
        let sender_clone = self.event_sender.clone();

        // Activated event
        toast.Activated(&TypedEventHandler::new({
            let tag = tag_clone.clone();
            let sender = sender_clone.clone();
            move |_sender, args| {
                if let (Some(args), Some(ref sender)) = (args, &sender) {
                    let arguments = args.Arguments().unwrap_or_default().to_string();
                    let _ = sender.send(NotificationEvent::Activated {
                        tag: tag.clone(),
                        arguments,
                    });
                }
                Ok(())
            }
        }))?;

        // Dismissed event
        toast.Dismissed(&TypedEventHandler::new({
            let tag = tag_clone.clone();
            let sender = sender_clone.clone();
            move |_sender, args| {
                if let (Some(args), Some(ref sender)) = (args, &sender) {
                    let reason = match args.Reason() {
                        Ok(ToastDismissalReason::UserCanceled) => "user_canceled",
                        Ok(ToastDismissalReason::ApplicationHidden) => "app_hidden",
                        Ok(ToastDismissalReason::TimedOut) => "timed_out",
                        _ => "unknown",
                    };
                    let _ = sender.send(NotificationEvent::Dismissed {
                        tag: tag.clone(),
                        reason: reason.to_string(),
                    });
                }
                Ok(())
            }
        }))?;

        // Failed event
        toast.Failed(&TypedEventHandler::new({
            let tag = tag_clone;
            let sender = sender_clone;
            move |_sender, args| {
                if let (Some(args), Some(ref sender)) = (args, &sender) {
                    let error = args.ErrorCode().unwrap_or_default().message().to_string();
                    let _ = sender.send(NotificationEvent::Failed {
                        tag: tag.clone(),
                        error,
                    });
                }
                Ok(())
            }
        }))?;

        Ok(())
    }

    pub fn update_notification(&self, tag: &str, builder: ToastBuilder) -> Result<()> {
        // Remove existing notification
        self.remove_notification(tag)?;

        // Create new notification with same tag
        let mut updated_builder = builder;
        updated_builder.tag = Some(tag.to_string());

        self.show_notification(updated_builder)?;
        Ok(())
    }

    pub fn remove_notification(&self, tag: &str) -> Result<()> {
        if let Some(ref notifier) = self.service.notifier {
            let history = notifier.History()?;
            history.Remove(&HSTRING::from(tag))?;
        }

        if let Ok(mut active) = self.active_notifications.lock() {
            active.remove(tag);
        }

        Ok(())
    }

    pub fn remove_group(&self, group: &str) -> Result<()> {
        if let Some(ref notifier) = self.service.notifier {
            let history = notifier.History()?;
            history.RemoveGroup(&HSTRING::from(group))?;
        }

        Ok(())
    }

    pub fn clear_all(&self) -> Result<()> {
        if let Some(ref notifier) = self.service.notifier {
            let history = notifier.History()?;
            history.Clear()?;
        }

        if let Ok(mut active) = self.active_notifications.lock() {
            active.clear();
        }

        Ok(())
    }

    pub fn get_active_notifications(&self) -> Vec<String> {
        if let Ok(active) = self.active_notifications.lock() {
            active.keys().cloned().collect()
        } else {
            Vec::new()
        }
    }
}
```

## Advanced Features

### Interactive Notifications

```rust
// src/notifications/templates.rs
use super::builder::*;

pub struct NotificationTemplates;

impl NotificationTemplates {
    pub fn reminder_with_snooze(title: &str, message: &str) -> ToastBuilder {
        ToastBuilder::new()
            .title(title)
            .body(message)
            .scenario(ToastScenario::Reminder)
            .add_input(ToastInput {
                id: "snoozeTime".to_string(),
                input_type: InputType::Selection,
                title: Some("Snooze for:".to_string()),
                placeholder_content: None,
                default_input: Some("5".to_string()),
                selections: vec![
                    SelectionItem {
                        id: "5".to_string(),
                        content: "5 minutes".to_string(),
                    },
                    SelectionItem {
                        id: "15".to_string(),
                        content: "15 minutes".to_string(),
                    },
                    SelectionItem {
                        id: "30".to_string(),
                        content: "30 minutes".to_string(),
                    },
                    SelectionItem {
                        id: "60".to_string(),
                        content: "1 hour".to_string(),
                    },
                ],
            })
            .add_button(ToastButton {
                content: "Snooze".to_string(),
                arguments: "action=snooze".to_string(),
                activation_type: ActivationType::Background,
                image_uri: None,
                input_id: Some("snoozeTime".to_string()),
                text_box_id: None,
            })
            .add_button(ToastButton {
                content: "Dismiss".to_string(),
                arguments: "action=dismiss".to_string(),
                activation_type: ActivationType::Background,
                image_uri: None,
                input_id: None,
                text_box_id: None,
            })
    }

    pub fn quick_reply(sender: &str, message: &str) -> ToastBuilder {
        ToastBuilder::new()
            .title(&format!("Message from {}", sender))
            .body(message)
            .image("ms-appx:///Assets/ProfilePicture.png")
            .add_input(ToastInput {
                id: "replyText".to_string(),
                input_type: InputType::Text,
                title: Some("Reply".to_string()),
                placeholder_content: Some("Type a reply...".to_string()),
                default_input: None,
                selections: Vec::new(),
            })
            .add_button(ToastButton {
                content: "Send".to_string(),
                arguments: "action=reply".to_string(),
                activation_type: ActivationType::Background,
                image_uri: Some("ms-appx:///Assets/SendIcon.png".to_string()),
                input_id: None,
                text_box_id: Some("replyText".to_string()),
            })
            .add_button(ToastButton {
                content: "View Message".to_string(),
                arguments: "action=view".to_string(),
                activation_type: ActivationType::Foreground,
                image_uri: None,
                input_id: None,
                text_box_id: None,
            })
    }

    pub fn download_progress(filename: &str, progress: f64, status: &str) -> ToastBuilder {
        ToastBuilder::new()
            .title("Download in Progress")
            .body(&format!("Downloading {}", filename))
            .progress(ToastProgress {
                title: Some("Download Progress".to_string()),
                status: Some(status.to_string()),
                value: Some(progress),
                value_string_override: Some(format!("{}%", (progress * 100.0) as i32)),
            })
            .tag(&format!("download_{}", filename))
            .group("downloads")
    }

    pub fn incoming_call(caller_name: &str, caller_number: &str) -> ToastBuilder {
        ToastBuilder::new()
            .title("Incoming Call")
            .subtitle(caller_name)
            .body(caller_number)
            .scenario(ToastScenario::IncomingCall)
            .image("ms-appx:///Assets/CallerPhoto.png")
            .app_logo("ms-appx:///Assets/PhoneIcon.png")
            .add_button(ToastButton {
                content: "Answer".to_string(),
                arguments: "action=answer".to_string(),
                activation_type: ActivationType::Foreground,
                image_uri: Some("ms-appx:///Assets/AnswerIcon.png".to_string()),
                input_id: None,
                text_box_id: None,
            })
            .add_button(ToastButton {
                content: "Decline".to_string(),
                arguments: "action=decline".to_string(),
                activation_type: ActivationType::Background,
                image_uri: Some("ms-appx:///Assets/DeclineIcon.png".to_string()),
                input_id: None,
                text_box_id: None,
            })
            .add_button(ToastButton {
                content: "Message".to_string(),
                arguments: "action=message".to_string(),
                activation_type: ActivationType::Foreground,
                image_uri: Some("ms-appx:///Assets/MessageIcon.png".to_string()),
                input_id: None,
                text_box_id: None,
            })
            .audio(ToastAudio {
                src: Some("ms-winsoundevent:Notification.Looping.Call".to_string()),
                loop_audio: true,
                silent: false,
            })
    }

    pub fn weather_alert(location: &str, alert_type: &str, description: &str) -> ToastBuilder {
        ToastBuilder::new()
            .title(&format!("Weather Alert: {}", alert_type))
            .subtitle(location)
            .body(description)
            .scenario(ToastScenario::Urgent)
            .image("ms-appx:///Assets/WeatherAlert.png")
            .add_button(ToastButton {
                content: "View Details".to_string(),
                arguments: "action=weather_details".to_string(),
                activation_type: ActivationType::Foreground,
                image_uri: None,
                input_id: None,
                text_box_id: None,
            })
            .add_button(ToastButton {
                content: "Dismiss".to_string(),
                arguments: "action=dismiss".to_string(),
                activation_type: ActivationType::Background,
                image_uri: None,
                input_id: None,
                text_box_id: None,
            })
            .audio(ToastAudio {
                src: Some("ms-winsoundevent:Notification.Looping.Alarm".to_string()),
                loop_audio: false,
                silent: false,
            })
    }

    pub fn system_maintenance(title: &str, scheduled_time: &str) -> ToastBuilder {
        ToastBuilder::new()
            .title(title)
            .body(&format!("Scheduled for {}", scheduled_time))
            .scenario(ToastScenario::Reminder)
            .image("ms-appx:///Assets/MaintenanceIcon.png")
            .add_button(ToastButton {
                content: "Postpone".to_string(),
                arguments: "action=postpone".to_string(),
                activation_type: ActivationType::Background,
                image_uri: None,
                input_id: None,
                text_box_id: None,
            })
            .add_button(ToastButton {
                content: "Start Now".to_string(),
                arguments: "action=start_now".to_string(),
                activation_type: ActivationType::Foreground,
                image_uri: None,
                input_id: None,
                text_box_id: None,
            })
            .duration(ToastDuration::Long)
    }
}
```

### Notification Persistence and State Management

```rust
// src/utils/persistence.rs
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::Path;

#[derive(Debug, Serialize, Deserialize)]
pub struct NotificationState {
    pub active_notifications: HashMap<String, NotificationData>,
    pub notification_settings: NotificationSettings,
    pub user_preferences: UserPreferences,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NotificationData {
    pub tag: String,
    pub group: Option<String>,
    pub created_at: i64,
    pub expires_at: Option<i64>,
    pub content: String,
    pub priority: NotificationPriority,
    pub is_persistent: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NotificationSettings {
    pub enabled: bool,
    pub quiet_hours_start: Option<String>,
    pub quiet_hours_end: Option<String>,
    pub max_notifications: usize,
    pub default_duration: String,
    pub sound_enabled: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserPreferences {
    pub categories: HashMap<String, CategoryPreference>,
    pub blocked_sources: Vec<String>,
    pub priority_sources: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CategoryPreference {
    pub enabled: bool,
    pub sound_enabled: bool,
    pub show_in_action_center: bool,
    pub priority: NotificationPriority,
}

#[derive(Debug, Serialize, Deserialize, Clone, Copy)]
pub enum NotificationPriority {
    Low,
    Normal,
    High,
    Critical,
}

impl Default for NotificationState {
    fn default() -> Self {
        Self {
            active_notifications: HashMap::new(),
            notification_settings: NotificationSettings {
                enabled: true,
                quiet_hours_start: None,
                quiet_hours_end: None,
                max_notifications: 10,
                default_duration: "short".to_string(),
                sound_enabled: true,
            },
            user_preferences: UserPreferences {
                categories: HashMap::new(),
                blocked_sources: Vec::new(),
                priority_sources: Vec::new(),
            },
        }
    }
}

pub struct NotificationPersistence {
    state_file: String,
    state: NotificationState,
}

impl NotificationPersistence {
    pub fn new(state_file: &str) -> Result<Self, Box<dyn std::error::Error>> {
        let state = if Path::new(state_file).exists() {
            let content = fs::read_to_string(state_file)?;
            serde_json::from_str(&content)?
        } else {
            NotificationState::default()
        };

        Ok(Self {
            state_file: state_file.to_string(),
            state,
        })
    }

    pub fn save(&self) -> Result<(), Box<dyn std::error::Error>> {
        let content = serde_json::to_string_pretty(&self.state)?;
        fs::write(&self.state_file, content)?;
        Ok(())
    }

    pub fn add_notification(&mut self, data: NotificationData) {
        self.state.active_notifications.insert(data.tag.clone(), data);
    }

    pub fn remove_notification(&mut self, tag: &str) {
        self.state.active_notifications.remove(tag);
    }

    pub fn get_notification(&self, tag: &str) -> Option<&NotificationData> {
        self.state.active_notifications.get(tag)
    }

    pub fn cleanup_expired(&mut self) {
        let now = chrono::Utc::now().timestamp();
        self.state.active_notifications.retain(|_, data| {
            data.expires_at.map_or(true, |expires| expires > now)
        });
    }

    pub fn is_in_quiet_hours(&self) -> bool {
        let settings = &self.state.notification_settings;
        if let (Some(start), Some(end)) = (&settings.quiet_hours_start, &settings.quiet_hours_end) {
            let now = chrono::Local::now();
            let current_time = now.format("%H:%M").to_string();

            if start <= end {
                // Same day range (e.g., 22:00 to 08:00)
                current_time >= *start && current_time <= *end
            } else {
                // Overnight range (e.g., 22:00 to 08:00)
                current_time >= *start || current_time <= *end
            }
        } else {
            false
        }
    }

    pub fn should_show_notification(&self, priority: NotificationPriority, source: &str) -> bool {
        if !self.state.notification_settings.enabled {
            return false;
        }

        if self.state.user_preferences.blocked_sources.contains(&source.to_string()) {
            return false;
        }

        if self.is_in_quiet_hours() && !matches!(priority, NotificationPriority::Critical) {
            return false;
        }

        if self.state.active_notifications.len() >= self.state.notification_settings.max_notifications {
            // Only show if higher priority than existing notifications
            let min_existing_priority = self.state.active_notifications
                .values()
                .map(|n| n.priority)
                .min()
                .unwrap_or(NotificationPriority::Low);

            return self.priority_value(priority) > self.priority_value(min_existing_priority);
        }

        true
    }

    fn priority_value(&self, priority: NotificationPriority) -> u8 {
        match priority {
            NotificationPriority::Low => 1,
            NotificationPriority::Normal => 2,
            NotificationPriority::High => 3,
            NotificationPriority::Critical => 4,
        }
    }

    pub fn get_settings(&self) -> &NotificationSettings {
        &self.state.notification_settings
    }

    pub fn update_settings(&mut self, settings: NotificationSettings) {
        self.state.notification_settings = settings;
    }

    pub fn get_preferences(&self) -> &UserPreferences {
        &self.state.user_preferences
    }

    pub fn update_preferences(&mut self, preferences: UserPreferences) {
        self.state.user_preferences = preferences;
    }
}
```

## Complete Example Application

### Main Application

```rust
// src/main.rs
mod notifications;
mod utils;

use notifications::{manager::*, builder::*, templates::*};
use tokio::sync::mpsc;
use std::time::Duration;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize notification manager
    let mut manager = NotificationManager::new("MyApp.Notifications")?;

    // Set up event handling
    let (tx, mut rx) = mpsc::unbounded_channel();
    manager.set_event_handler(tx);

    // Example 1: Simple notification
    println!("Showing simple notification...");
    let simple_notification = ToastBuilder::new()
        .title("Welcome!")
        .body("Your application is ready to use.")
        .tag("welcome")
        .build_xml();

    manager.show_notification(
        ToastBuilder::new()
            .title("Welcome!")
            .body("Your application is ready to use.")
            .tag("welcome")
    )?;

    // Example 2: Interactive reminder
    println!("Showing reminder with snooze options...");
    let reminder = NotificationTemplates::reminder_with_snooze(
        "Meeting Reminder",
        "Daily standup meeting starts in 5 minutes"
    );
    manager.show_notification(reminder)?;

    // Example 3: Progress notification
    println!("Showing download progress...");
    for i in 0..=10 {
        let progress = i as f64 / 10.0;
        let progress_notification = NotificationTemplates::download_progress(
            "large_file.zip",
            progress,
            &format!("{}% complete", (progress * 100.0) as i32)
        );
        manager.show_notification(progress_notification)?;
        tokio::time::sleep(Duration::from_millis(500)).await;
    }

    // Example 4: Quick reply notification
    println!("Showing quick reply notification...");
    let quick_reply = NotificationTemplates::quick_reply(
        "John Doe",
        "Hey, are you available for a quick call?"
    );
    manager.show_notification(quick_reply)?;

    // Example 5: Weather alert
    println!("Showing weather alert...");
    let weather_alert = NotificationTemplates::weather_alert(
        "New York, NY",
        "Severe Thunderstorm Warning",
        "Severe thunderstorms expected with heavy rain and strong winds."
    );
    manager.show_notification(weather_alert)?;

    // Handle notification events
    tokio::spawn(async move {
        while let Some(event) = rx.recv().await {
            match event {
                NotificationEvent::Activated { tag, arguments } => {
                    println!("Notification activated - Tag: {}, Arguments: {}", tag, arguments);

                    // Parse arguments and handle actions
                    if arguments.contains("action=snooze") {
                        println!("User chose to snooze the reminder");
                        // Implement snooze logic here
                    } else if arguments.contains("action=reply") {
                        println!("User wants to reply to message");
                        // Implement reply logic here
                    } else if arguments.contains("action=answer") {
                        println!("User answered the call");
                        // Implement call answer logic here
                    }
                }
                NotificationEvent::Dismissed { tag, reason } => {
                    println!("Notification dismissed - Tag: {}, Reason: {}", tag, reason);
                }
                NotificationEvent::Failed { tag, error } => {
                    println!("Notification failed - Tag: {}, Error: {}", tag, error);
                }
            }
        }
    });

    // Keep the application running
    println!("Application running... Press Ctrl+C to exit");
    tokio::signal::ctrl_c().await?;

    // Cleanup
    println!("Cleaning up notifications...");
    manager.clear_all()?;

    Ok(())
}
```

### Configuration Management

```rust
// src/config.rs
use serde::{Deserialize, Serialize};
use std::fs;

#[derive(Debug, Serialize, Deserialize)]
pub struct AppConfig {
    pub app_id: String,
    pub notification_settings: NotificationConfig,
    pub ui_settings: UiConfig,
    pub advanced_settings: AdvancedConfig,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct NotificationConfig {
    pub enabled: bool,
    pub show_in_action_center: bool,
    pub play_sound: bool,
    pub show_preview: bool,
    pub priority_hours: Option<PriorityHours>,
    pub max_notifications: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PriorityHours {
    pub start: String,
    pub end: String,
    pub allow_critical: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UiConfig {
    pub theme: String,
    pub position: String,
    pub duration: u32,
    pub animation_enabled: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AdvancedConfig {
    pub debug_mode: bool,
    pub log_level: String,
    pub cache_notifications: bool,
    pub custom_templates_path: Option<String>,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            app_id: "DefaultApp".to_string(),
            notification_settings: NotificationConfig {
                enabled: true,
                show_in_action_center: true,
                play_sound: true,
                show_preview: true,
                priority_hours: None,
                max_notifications: 5,
            },
            ui_settings: UiConfig {
                theme: "system".to_string(),
                position: "top-right".to_string(),
                duration: 5000,
                animation_enabled: true,
            },
            advanced_settings: AdvancedConfig {
                debug_mode: false,
                log_level: "info".to_string(),
                cache_notifications: true,
                custom_templates_path: None,
            },
        }
    }
}

impl AppConfig {
    pub fn load(path: &str) -> Result<Self, Box<dyn std::error::Error>> {
        if std::path::Path::new(path).exists() {
            let content = fs::read_to_string(path)?;
            Ok(serde_json::from_str(&content)?)
        } else {
            let config = Self::default();
            config.save(path)?;
            Ok(config)
        }
    }

    pub fn save(&self, path: &str) -> Result<(), Box<dyn std::error::Error>> {
        let content = serde_json::to_string_pretty(self)?;
        fs::write(path, content)?;
        Ok(())
    }
}
```

## Testing and Error Handling

### Unit Tests

```rust
// src/tests.rs
#[cfg(test)]
mod tests {
    use super::*;
    use crate::notifications::builder::*;

    #[test]
    fn test_toast_builder_basic() {
        let builder = ToastBuilder::new()
            .title("Test Title")
            .body("Test Body");

        let xml = builder.build_xml();
        assert!(xml.contains("Test Title"));
        assert!(xml.contains("Test Body"));
    }

    #[test]
    fn test_toast_builder_with_buttons() {
        let builder = ToastBuilder::new()
            .title("Test")
            .add_button(ToastButton {
                content: "OK".to_string(),
                arguments: "action=ok".to_string(),
                activation_type: ActivationType::Foreground,
                image_uri: None,
                input_id: None,
                text_box_id: None,
            });

        let xml = builder.build_xml();
        assert!(xml.contains("<actions>"));
        assert!(xml.contains("action=ok"));
        assert!(xml.contains("activationType=\"foreground\""));
    }

    #[test]
    fn test_toast_builder_with_input() {
        let builder = ToastBuilder::new()
            .title("Test")
            .add_input(ToastInput {
                id: "test_input".to_string(),
                input_type: InputType::Text,
                title: Some("Enter text".to_string()),
                placeholder_content: Some("Type here...".to_string()),
                default_input: None,
                selections: Vec::new(),
            });

        let xml = builder.build_xml();
        assert!(xml.contains("id=\"test_input\""));
        assert!(xml.contains("type=\"text\""));
        assert!(xml.contains("placeHolderContent=\"Type here...\""));
    }

    #[test]
    fn test_notification_templates() {
        let reminder = NotificationTemplates::reminder_with_snooze(
            "Test Reminder",
            "This is a test"
        );

        let xml = reminder.build_xml();
        assert!(xml.contains("Test Reminder"));
        assert!(xml.contains("scenario=\"reminder\""));
        assert!(xml.contains("Snooze"));
    }

    #[tokio::test]
    async fn test_notification_manager() {
        let manager = NotificationManager::new("TestApp").unwrap();

        let builder = ToastBuilder::new()
            .title("Test Notification")
            .body("This is a test notification")
            .tag("test_tag");

        let tag = manager.show_notification(builder).unwrap();
        assert_eq!(tag, "test_tag");

        let active = manager.get_active_notifications();
        assert!(active.contains(&"test_tag".to_string()));
    }
}
```

### Error Handling

```rust
// src/error.rs
use std::fmt;

#[derive(Debug)]
pub enum NotificationError {
    WindowsApiError(windows::core::Error),
    XmlParseError(String),
    NotificationNotFound(String),
    InvalidConfiguration(String),
    PermissionDenied,
    QuietHoursActive,
    RateLimitExceeded,
}

impl fmt::Display for NotificationError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            NotificationError::WindowsApiError(err) => {
                write!(f, "Windows API error: {}", err)
            }
            NotificationError::XmlParseError(msg) => {
                write!(f, "XML parsing error: {}", msg)
            }
            NotificationError::NotificationNotFound(tag) => {
                write!(f, "Notification not found: {}", tag)
            }
            NotificationError::InvalidConfiguration(msg) => {
                write!(f, "Invalid configuration: {}", msg)
            }
            NotificationError::PermissionDenied => {
                write!(f, "Permission denied: Check app registration and notifications settings")
            }
            NotificationError::QuietHoursActive => {
                write!(f, "Notifications suppressed: Quiet hours are active")
            }
            NotificationError::RateLimitExceeded => {
                write!(f, "Rate limit exceeded: Too many notifications sent")
            }
        }
    }
}

impl std::error::Error for NotificationError {}

impl From<windows::core::Error> for NotificationError {
    fn from(err: windows::core::Error) -> Self {
        NotificationError::WindowsApiError(err)
    }
}

pub type Result<T> = std::result::Result<T, NotificationError>;
```

## Best Practices and Guidelines

### Performance Optimization

1. **Lazy Loading**: Only create notification objects when needed
2. **Resource Management**: Properly dispose of COM objects
3. **Batch Operations**: Group multiple notification operations
4. **Caching**: Cache XML templates for repeated use

### Security Considerations

1. **Input Validation**: Sanitize all user inputs in notifications
2. **XSS Prevention**: Escape HTML content in notification text
3. **Permission Checking**: Verify notification permissions before showing
4. **Secure Storage**: Encrypt sensitive notification data

### User Experience Guidelines

1. **Relevance**: Only show notifications that add value
2. **Timing**: Respect quiet hours and user preferences
3. **Frequency**: Avoid notification spam
4. **Accessibility**: Ensure notifications work with screen readers

### Development Guidelines

1. **Error Handling**: Gracefully handle API failures
2. **Testing**: Test on different Windows versions
3. **Logging**: Implement comprehensive logging for debugging
4. **Documentation**: Document notification behavior and APIs

## Conclusion

This comprehensive guide demonstrates how to implement sophisticated Windows toast notifications in Rust applications. The modular architecture supports basic notifications, interactive elements, progress updates, and advanced features like notification management and persistence.

Key features covered:

- **Rich Notification Builder**: Flexible API for creating complex notifications
- **Interactive Elements**: Buttons, inputs, and custom actions
- **Event Handling**: Comprehensive notification lifecycle management
- **Templates**: Pre-built notification templates for common scenarios
- **State Management**: Persistent notification state and user preferences
- **Error Handling**: Robust error handling and recovery mechanisms

The implementation provides a solid foundation for building notification-rich Windows applications in Rust while maintaining performance, security, and user experience best practices.

---

_Remember to test notifications thoroughly across different Windows versions and respect user notification preferences and system settings._
