---
author: Anubhav Gain
pubDatetime: 2025-01-10T12:00:00+05:30
modDatetime: 2025-01-10T12:00:00+05:30
title: Building Professional CLI Tools in Rust - From Basics to Advanced
slug: building-cli-tools-rust
featured: true
draft: false
tags:
  - rust
  - cli
  - terminal
  - tools
  - development
category: Programming
description: Learn how to build powerful command-line tools in Rust using clap, colored output, progress bars, and async operations with real-world examples
---

# Building Professional CLI Tools in Rust: From Basics to Advanced

Rust is becoming the go-to language for building fast, reliable command-line tools. From ripgrep to bat, many popular CLI tools are written in Rust. In this comprehensive guide, we'll explore how to build professional CLI applications using modern Rust libraries and best practices.

## Table of Contents

1. [Why Rust for CLI Tools?](#why-rust-for-cli-tools)
2. [Getting Started with Clap](#getting-started-with-clap)
3. [Building a File Search Tool](#building-a-file-search-tool)
4. [Adding Colors and Formatting](#adding-colors-and-formatting)
5. [Progress Bars and Spinners](#progress-bars-and-spinners)
6. [Configuration Management](#configuration-management)
7. [Interactive CLI Applications](#interactive-cli-applications)
8. [Real-World Examples](#real-world-examples)
9. [Testing and Distribution](#testing-and-distribution)

## Why Rust for CLI Tools?

Rust offers several advantages for CLI development:
- **Zero-cost abstractions**: Write high-level code that compiles to efficient machine code
- **Memory safety**: No segfaults or memory leaks
- **Fast startup time**: No runtime or garbage collector
- **Great ecosystem**: Rich libraries for CLI development
- **Cross-platform**: Compile for Windows, macOS, and Linux

## Getting Started with Clap

Clap is the most popular command-line argument parser for Rust. Let's start with the basics.

### Setting Up Your Project

```toml
# Cargo.toml
[package]
name = "mytool"
version = "0.1.0"
edition = "2021"

[dependencies]
clap = { version = "4.5", features = ["derive"] }
```

### Basic CLI with Clap

```rust
use clap::Parser;

/// A simple CLI tool to greet users
#[derive(Parser)]
#[command(author, version, about, long_about = None)]
struct Args {
    /// Name of the person to greet
    #[arg(short, long)]
    name: String,
    
    /// Number of times to greet
    #[arg(short, long, default_value_t = 1)]
    count: u8,
    
    /// Use enthusiastic greeting
    #[arg(short, long)]
    enthusiastic: bool,
}

fn main() {
    let args = Args::parse();
    
    for _ in 0..args.count {
        let greeting = if args.enthusiastic {
            format!("Hello, {}! Great to see you!", args.name)
        } else {
            format!("Hello, {}", args.name)
        };
        println!("{}", greeting);
    }
}
```

### Advanced Clap with Subcommands

```rust
use clap::{Parser, Subcommand};
use std::path::PathBuf;

#[derive(Parser)]
#[command(name = "file-manager")]
#[command(author = "Your Name <you@example.com>")]
#[command(version = "1.0")]
#[command(about = "A file management CLI tool", long_about = None)]
struct Cli {
    /// Sets a custom config file
    #[arg(short, long, value_name = "FILE")]
    config: Option<PathBuf>,
    
    /// Turn debugging information on
    #[arg(short, long, action = clap::ArgAction::Count)]
    debug: u8,
    
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Copy files
    Copy {
        /// Source file
        #[arg(short, long)]
        source: PathBuf,
        
        /// Destination
        #[arg(short, long)]
        dest: PathBuf,
        
        /// Overwrite existing files
        #[arg(short, long)]
        force: bool,
    },
    /// Move files
    Move {
        /// Source file
        source: PathBuf,
        
        /// Destination
        dest: PathBuf,
    },
    /// List files in a directory
    List {
        /// Directory to list
        #[arg(default_value = ".")]
        path: PathBuf,
        
        /// Show hidden files
        #[arg(short = 'a', long)]
        all: bool,
        
        /// Long format
        #[arg(short, long)]
        long: bool,
    },
}

fn main() {
    let cli = Cli::parse();
    
    // You can check the value provided by positional and optional arguments
    if let Some(config_path) = cli.config.as_deref() {
        println!("Using config file: {}", config_path.display());
    }
    
    // Vary the output based on how many times the user used the "debug" flag
    match cli.debug {
        0 => {},
        1 => println!("Debug mode is on"),
        2 => println!("Debug mode is on (verbose)"),
        _ => println!("Debug mode is on (very verbose)"),
    }
    
    // Handle subcommands
    match &cli.command {
        Commands::Copy { source, dest, force } => {
            println!("Copying {} to {}", source.display(), dest.display());
            if *force {
                println!("Overwriting existing files");
            }
        }
        Commands::Move { source, dest } => {
            println!("Moving {} to {}", source.display(), dest.display());
        }
        Commands::List { path, all, long } => {
            println!("Listing files in {}", path.display());
            if *all {
                println!("Including hidden files");
            }
            if *long {
                println!("Using long format");
            }
        }
    }
}
```

## Building a File Search Tool

Let's build a practical grep-like tool that searches for patterns in files.

```rust
use clap::Parser;
use colored::*;
use regex::Regex;
use std::fs;
use std::io::{self, BufRead, BufReader};
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

#[derive(Parser)]
#[command(name = "rgrep")]
#[command(about = "A simple grep-like tool")]
struct Args {
    /// Pattern to search for
    pattern: String,
    
    /// Path to search in
    #[arg(default_value = ".")]
    path: PathBuf,
    
    /// Case insensitive search
    #[arg(short, long)]
    ignore_case: bool,
    
    /// Search recursively
    #[arg(short, long)]
    recursive: bool,
    
    /// Show line numbers
    #[arg(short = 'n', long)]
    line_numbers: bool,
    
    /// Only show file names
    #[arg(short = 'l', long)]
    files_only: bool,
    
    /// Invert match (show non-matching lines)
    #[arg(short = 'v', long)]
    invert: bool,
}

fn search_file(
    path: &Path,
    regex: &Regex,
    args: &Args,
) -> io::Result<Vec<(usize, String)>> {
    let file = fs::File::open(path)?;
    let reader = BufReader::new(file);
    let mut matches = Vec::new();
    
    for (line_num, line) in reader.lines().enumerate() {
        let line = line?;
        let is_match = regex.is_match(&line);
        
        if is_match != args.invert {
            matches.push((line_num + 1, line));
        }
    }
    
    Ok(matches)
}

fn highlight_matches(line: &str, regex: &Regex) -> String {
    let mut result = String::new();
    let mut last_end = 0;
    
    for mat in regex.find_iter(line) {
        result.push_str(&line[last_end..mat.start()]);
        result.push_str(&mat.as_str().red().bold().to_string());
        last_end = mat.end();
    }
    result.push_str(&line[last_end..]);
    
    result
}

fn main() -> io::Result<()> {
    let args = Args::parse();
    
    // Build regex pattern
    let pattern = if args.ignore_case {
        format!("(?i){}", args.pattern)
    } else {
        args.pattern.clone()
    };
    
    let regex = match Regex::new(&pattern) {
        Ok(r) => r,
        Err(e) => {
            eprintln!("{}: Invalid pattern: {}", "Error".red().bold(), e);
            std::process::exit(1);
        }
    };
    
    let mut found_any = false;
    
    if args.recursive && args.path.is_dir() {
        // Recursive search
        for entry in WalkDir::new(&args.path)
            .into_iter()
            .filter_map(|e| e.ok())
            .filter(|e| e.file_type().is_file())
        {
            if let Ok(matches) = search_file(entry.path(), &regex, &args) {
                if !matches.is_empty() {
                    found_any = true;
                    
                    if args.files_only {
                        println!("{}", entry.path().display().to_string().green());
                    } else {
                        println!("\n{}:", entry.path().display().to_string().green().bold());
                        for (line_num, line) in matches {
                            if args.line_numbers {
                                print!("{}: ", line_num.to_string().yellow());
                            }
                            println!("{}", highlight_matches(&line, &regex));
                        }
                    }
                }
            }
        }
    } else if args.path.is_file() {
        // Single file search
        if let Ok(matches) = search_file(&args.path, &regex, &args) {
            if !matches.is_empty() {
                found_any = true;
                
                if args.files_only {
                    println!("{}", args.path.display().to_string().green());
                } else {
                    for (line_num, line) in matches {
                        if args.line_numbers {
                            print!("{}: ", line_num.to_string().yellow());
                        }
                        println!("{}", highlight_matches(&line, &regex));
                    }
                }
            }
        }
    } else {
        eprintln!("{}: Invalid path", "Error".red().bold());
        std::process::exit(1);
    }
    
    if !found_any {
        std::process::exit(1);
    }
    
    Ok(())
}
```

## Adding Colors and Formatting

Make your CLI output more readable with colors and formatting.

```rust
use colored::*;
use prettytable::{Cell, Row, Table};

fn main() {
    // Basic colored output
    println!("{}", "This is red".red());
    println!("{}", "This is blue and bold".blue().bold());
    println!("{}", "This has a green background".on_green());
    
    // Status messages
    println!("{} Configuration loaded", "✓".green().bold());
    println!("{} Failed to connect", "✗".red().bold());
    println!("{} Processing...", "⚠".yellow().bold());
    
    // Tables with prettytable
    let mut table = Table::new();
    table.add_row(Row::new(vec![
        Cell::new("Name").style_spec("Fb"),
        Cell::new("Size").style_spec("Fb"),
        Cell::new("Modified").style_spec("Fb"),
    ]));
    
    table.add_row(Row::new(vec![
        Cell::new("file1.txt"),
        Cell::new("1.2 KB"),
        Cell::new("2024-01-10"),
    ]));
    
    table.add_row(Row::new(vec![
        Cell::new("file2.rs"),
        Cell::new("3.5 KB"),
        Cell::new("2024-01-09"),
    ]));
    
    table.printstd();
}
```

## Progress Bars and Spinners

Show progress for long-running operations.

```rust
use indicatif::{ProgressBar, ProgressStyle, MultiProgress};
use std::thread;
use std::time::Duration;

fn download_file(url: &str, pb: ProgressBar) {
    pb.set_message(format!("Downloading {}", url));
    
    for i in 0..100 {
        thread::sleep(Duration::from_millis(50));
        pb.set_position(i);
    }
    
    pb.finish_with_message(format!("Downloaded {}", url));
}

fn main() {
    // Simple progress bar
    let pb = ProgressBar::new(100);
    pb.set_style(
        ProgressStyle::default_bar()
            .template("{spinner:.green} [{elapsed_precise}] [{bar:40.cyan/blue}] {pos}/{len} ({eta})")
            .unwrap()
            .progress_chars("#>-"),
    );
    
    for i in 0..100 {
        thread::sleep(Duration::from_millis(20));
        pb.set_position(i);
    }
    pb.finish_with_message("Done!");
    
    // Multiple progress bars
    let m = MultiProgress::new();
    let urls = vec![
        "https://example.com/file1.zip",
        "https://example.com/file2.zip",
        "https://example.com/file3.zip",
    ];
    
    let handles: Vec<_> = urls
        .into_iter()
        .map(|url| {
            let pb = m.add(ProgressBar::new(100));
            pb.set_style(
                ProgressStyle::default_bar()
                    .template("{msg} [{bar:30}] {pos}/{len}")
                    .unwrap(),
            );
            
            let url = url.to_string();
            thread::spawn(move || download_file(&url, pb))
        })
        .collect();
    
    for handle in handles {
        handle.join().unwrap();
    }
    
    println!("\nAll downloads complete!");
}
```

## Configuration Management

Handle configuration files for your CLI tools.

```rust
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use dirs;

#[derive(Debug, Serialize, Deserialize)]
struct Config {
    #[serde(default = "default_theme")]
    theme: String,
    
    #[serde(default)]
    verbose: bool,
    
    #[serde(default = "default_timeout")]
    timeout: u64,
    
    #[serde(default)]
    aliases: Vec<Alias>,
}

#[derive(Debug, Serialize, Deserialize)]
struct Alias {
    name: String,
    command: String,
}

fn default_theme() -> String {
    "dark".to_string()
}

fn default_timeout() -> u64 {
    30
}

impl Default for Config {
    fn default() -> Self {
        Self {
            theme: default_theme(),
            verbose: false,
            timeout: default_timeout(),
            aliases: Vec::new(),
        }
    }
}

impl Config {
    fn load() -> Result<Self, Box<dyn std::error::Error>> {
        let config_path = Self::config_path()?;
        
        if !config_path.exists() {
            let default_config = Config::default();
            default_config.save()?;
            return Ok(default_config);
        }
        
        let contents = fs::read_to_string(&config_path)?;
        let config: Config = toml::from_str(&contents)?;
        Ok(config)
    }
    
    fn save(&self) -> Result<(), Box<dyn std::error::Error>> {
        let config_path = Self::config_path()?;
        
        // Create config directory if it doesn't exist
        if let Some(parent) = config_path.parent() {
            fs::create_dir_all(parent)?;
        }
        
        let contents = toml::to_string_pretty(self)?;
        fs::write(&config_path, contents)?;
        Ok(())
    }
    
    fn config_path() -> Result<PathBuf, Box<dyn std::error::Error>> {
        let home = dirs::home_dir()
            .ok_or("Could not find home directory")?;
        Ok(home.join(".config").join("mytool").join("config.toml"))
    }
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut config = Config::load()?;
    
    println!("Current configuration:");
    println!("Theme: {}", config.theme);
    println!("Verbose: {}", config.verbose);
    println!("Timeout: {} seconds", config.timeout);
    
    // Modify and save
    config.verbose = true;
    config.aliases.push(Alias {
        name: "ll".to_string(),
        command: "ls -la".to_string(),
    });
    config.save()?;
    
    println!("\nConfiguration saved to: {:?}", Config::config_path()?);
    
    Ok(())
}
```

## Interactive CLI Applications

Build interactive terminal applications with user input.

```rust
use dialoguer::{theme::ColorfulTheme, Confirm, Input, Select, MultiSelect};
use console::Term;

#[derive(Debug)]
struct UserProfile {
    name: String,
    email: String,
    age: u8,
    interests: Vec<String>,
    newsletter: bool,
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let term = Term::stdout();
    term.clear_screen()?;
    
    println!("Welcome to the User Profile Setup!\n");
    
    // Text input
    let name: String = Input::with_theme(&ColorfulTheme::default())
        .with_prompt("What's your name?")
        .validate_with(|input: &String| -> Result<(), &str> {
            if input.len() < 2 {
                Err("Name must be at least 2 characters")
            } else {
                Ok(())
            }
        })
        .interact_text()?;
    
    // Email input with validation
    let email: String = Input::with_theme(&ColorfulTheme::default())
        .with_prompt("Your email")
        .validate_with(|input: &String| -> Result<(), &str> {
            if input.contains('@') && input.contains('.') {
                Ok(())
            } else {
                Err("Please enter a valid email")
            }
        })
        .interact_text()?;
    
    // Numeric input
    let age: u8 = Input::with_theme(&ColorfulTheme::default())
        .with_prompt("Your age")
        .validate_with(|input: &String| -> Result<(), &str> {
            input.parse::<u8>()
                .map(|_| ())
                .map_err(|_| "Please enter a valid age")
        })
        .interact_text()?
        .parse()?;
    
    // Single selection
    let theme_options = vec!["Light", "Dark", "Auto"];
    let theme_selection = Select::with_theme(&ColorfulTheme::default())
        .with_prompt("Choose your theme preference")
        .items(&theme_options)
        .default(0)
        .interact()?;
    
    println!("Selected theme: {}", theme_options[theme_selection]);
    
    // Multiple selection
    let interest_options = vec![
        "Programming",
        "Gaming",
        "Reading",
        "Music",
        "Sports",
        "Travel",
        "Cooking",
    ];
    
    let interests_indices = MultiSelect::with_theme(&ColorfulTheme::default())
        .with_prompt("Select your interests (space to select, enter to confirm)")
        .items(&interest_options)
        .interact()?;
    
    let interests: Vec<String> = interests_indices
        .iter()
        .map(|&i| interest_options[i].to_string())
        .collect();
    
    // Confirmation
    let newsletter = Confirm::with_theme(&ColorfulTheme::default())
        .with_prompt("Subscribe to newsletter?")
        .default(true)
        .interact()?;
    
    // Create profile
    let profile = UserProfile {
        name,
        email,
        age,
        interests,
        newsletter,
    };
    
    // Display summary
    term.clear_screen()?;
    println!("Profile created successfully!\n");
    println!("Name: {}", profile.name);
    println!("Email: {}", profile.email);
    println!("Age: {}", profile.age);
    println!("Interests: {}", profile.interests.join(", "));
    println!("Newsletter: {}", if profile.newsletter { "Yes" } else { "No" });
    
    Ok(())
}
```

## Real-World Examples

### Example 1: Task Manager CLI

```rust
use clap::{Parser, Subcommand};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use chrono::{DateTime, Local};
use colored::*;

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Task {
    id: usize,
    title: String,
    description: Option<String>,
    completed: bool,
    created_at: DateTime<Local>,
    due_date: Option<DateTime<Local>>,
    priority: Priority,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
enum Priority {
    Low,
    Medium,
    High,
}

impl std::fmt::Display for Priority {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            Priority::Low => write!(f, "{}", "LOW".green()),
            Priority::Medium => write!(f, "{}", "MEDIUM".yellow()),
            Priority::High => write!(f, "{}", "HIGH".red().bold()),
        }
    }
}

#[derive(Parser)]
#[command(name = "tasks")]
#[command(about = "A simple task manager")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Add a new task
    Add {
        /// Task title
        title: String,
        
        /// Task description
        #[arg(short, long)]
        description: Option<String>,
        
        /// Priority (low, medium, high)
        #[arg(short, long, default_value = "medium")]
        priority: String,
    },
    /// List all tasks
    List {
        /// Show only incomplete tasks
        #[arg(short, long)]
        incomplete: bool,
        
        /// Sort by priority
        #[arg(short, long)]
        sort: bool,
    },
    /// Mark a task as complete
    Complete {
        /// Task ID
        id: usize,
    },
    /// Delete a task
    Delete {
        /// Task ID
        id: usize,
    },
}

struct TaskManager {
    tasks: Vec<Task>,
    data_file: PathBuf,
}

impl TaskManager {
    fn new() -> Self {
        let data_file = dirs::home_dir()
            .unwrap()
            .join(".tasks.json");
        
        let tasks = if data_file.exists() {
            let contents = fs::read_to_string(&data_file).unwrap_or_default();
            serde_json::from_str(&contents).unwrap_or_default()
        } else {
            Vec::new()
        };
        
        Self { tasks, data_file }
    }
    
    fn save(&self) {
        let contents = serde_json::to_string_pretty(&self.tasks).unwrap();
        fs::write(&self.data_file, contents).unwrap();
    }
    
    fn add_task(&mut self, title: String, description: Option<String>, priority: Priority) {
        let id = self.tasks.len() + 1;
        let task = Task {
            id,
            title,
            description,
            completed: false,
            created_at: Local::now(),
            due_date: None,
            priority,
        };
        
        self.tasks.push(task.clone());
        self.save();
        
        println!("{} Added task #{}: {}", 
            "✓".green().bold(), 
            id, 
            task.title.bold()
        );
    }
    
    fn list_tasks(&self, incomplete_only: bool, sort_by_priority: bool) {
        let mut tasks: Vec<_> = self.tasks.iter()
            .filter(|t| !incomplete_only || !t.completed)
            .collect();
        
        if sort_by_priority {
            tasks.sort_by_key(|t| match t.priority {
                Priority::High => 0,
                Priority::Medium => 1,
                Priority::Low => 2,
            });
        }
        
        if tasks.is_empty() {
            println!("No tasks found.");
            return;
        }
        
        println!("\n{}\n", "Tasks:".bold().underline());
        
        for task in tasks {
            let status = if task.completed {
                "✓".green().bold().to_string()
            } else {
                "○".normal().to_string()
            };
            
            println!("{} [{}] {} - {} {}",
                status,
                task.id,
                task.title.bold(),
                task.priority,
                if task.completed {
                    "(completed)".dimmed().to_string()
                } else {
                    "".to_string()
                }
            );
            
            if let Some(desc) = &task.description {
                println!("    {}", desc.dimmed());
            }
        }
    }
    
    fn complete_task(&mut self, id: usize) {
        if let Some(task) = self.tasks.iter_mut().find(|t| t.id == id) {
            task.completed = true;
            self.save();
            println!("{} Completed task #{}: {}", 
                "✓".green().bold(), 
                id, 
                task.title
            );
        } else {
            eprintln!("{} Task #{} not found", "✗".red().bold(), id);
        }
    }
    
    fn delete_task(&mut self, id: usize) {
        if let Some(pos) = self.tasks.iter().position(|t| t.id == id) {
            let task = self.tasks.remove(pos);
            self.save();
            println!("{} Deleted task #{}: {}", 
                "✓".green().bold(), 
                id, 
                task.title
            );
        } else {
            eprintln!("{} Task #{} not found", "✗".red().bold(), id);
        }
    }
}

fn main() {
    let cli = Cli::parse();
    let mut manager = TaskManager::new();
    
    match cli.command {
        Commands::Add { title, description, priority } => {
            let priority = match priority.to_lowercase().as_str() {
                "low" => Priority::Low,
                "high" => Priority::High,
                _ => Priority::Medium,
            };
            manager.add_task(title, description, priority);
        }
        Commands::List { incomplete, sort } => {
            manager.list_tasks(incomplete, sort);
        }
        Commands::Complete { id } => {
            manager.complete_task(id);
        }
        Commands::Delete { id } => {
            manager.delete_task(id);
        }
    }
}
```

### Example 2: System Monitor CLI

```rust
use sysinfo::{System, SystemExt, ProcessExt, CpuExt, DiskExt, NetworkExt};
use colored::*;
use prettytable::{Cell, Row, Table};
use clap::Parser;

#[derive(Parser)]
#[command(name = "sysmon")]
#[command(about = "System monitoring tool")]
struct Args {
    /// Show CPU information
    #[arg(short, long)]
    cpu: bool,
    
    /// Show memory information
    #[arg(short, long)]
    memory: bool,
    
    /// Show disk information
    #[arg(short, long)]
    disk: bool,
    
    /// Show process information
    #[arg(short, long)]
    processes: bool,
    
    /// Show all information
    #[arg(short, long)]
    all: bool,
    
    /// Continuous monitoring mode
    #[arg(short = 'w', long)]
    watch: bool,
}

fn format_bytes(bytes: u64) -> String {
    const UNITS: &[&str] = &["B", "KB", "MB", "GB", "TB"];
    let mut size = bytes as f64;
    let mut unit_index = 0;
    
    while size >= 1024.0 && unit_index < UNITS.len() - 1 {
        size /= 1024.0;
        unit_index += 1;
    }
    
    format!("{:.2} {}", size, UNITS[unit_index])
}

fn show_cpu_info(sys: &System) {
    println!("\n{}", "CPU Information:".bold().underline());
    println!("Global CPU Usage: {:.2}%", sys.global_cpu_info().cpu_usage());
    
    let mut table = Table::new();
    table.add_row(Row::new(vec![
        Cell::new("Core").style_spec("Fb"),
        Cell::new("Usage (%)").style_spec("Fb"),
        Cell::new("Frequency (MHz)").style_spec("Fb"),
    ]));
    
    for (i, cpu) in sys.cpus().iter().enumerate() {
        let usage = cpu.cpu_usage();
        let freq = cpu.frequency();
        
        let usage_color = if usage > 80.0 {
            "Fr"
        } else if usage > 50.0 {
            "Fy"
        } else {
            "Fg"
        };
        
        table.add_row(Row::new(vec![
            Cell::new(&format!("Core {}", i)),
            Cell::new(&format!("{:.2}", usage)).style_spec(usage_color),
            Cell::new(&format!("{}", freq)),
        ]));
    }
    
    table.printstd();
}

fn show_memory_info(sys: &System) {
    println!("\n{}", "Memory Information:".bold().underline());
    
    let total_mem = sys.total_memory();
    let used_mem = sys.used_memory();
    let available_mem = sys.available_memory();
    let usage_percent = (used_mem as f64 / total_mem as f64) * 100.0;
    
    println!("Total: {}", format_bytes(total_mem));
    println!("Used: {} ({:.2}%)", format_bytes(used_mem), usage_percent);
    println!("Available: {}", format_bytes(available_mem));
    
    // Memory usage bar
    let bar_width = 50;
    let filled = (usage_percent / 100.0 * bar_width as f64) as usize;
    let bar = format!("[{}{}]",
        "=".repeat(filled).green(),
        " ".repeat(bar_width - filled)
    );
    println!("Usage: {}", bar);
}

fn show_disk_info(sys: &System) {
    println!("\n{}", "Disk Information:".bold().underline());
    
    let mut table = Table::new();
    table.add_row(Row::new(vec![
        Cell::new("Mount").style_spec("Fb"),
        Cell::new("Total").style_spec("Fb"),
        Cell::new("Used").style_spec("Fb"),
        Cell::new("Available").style_spec("Fb"),
        Cell::new("Usage (%)").style_spec("Fb"),
    ]));
    
    for disk in sys.disks() {
        let total = disk.total_space();
        let available = disk.available_space();
        let used = total - available;
        let usage_percent = (used as f64 / total as f64) * 100.0;
        
        let usage_color = if usage_percent > 90.0 {
            "Fr"
        } else if usage_percent > 70.0 {
            "Fy"
        } else {
            "Fg"
        };
        
        table.add_row(Row::new(vec![
            Cell::new(disk.mount_point().to_str().unwrap_or("Unknown")),
            Cell::new(&format_bytes(total)),
            Cell::new(&format_bytes(used)),
            Cell::new(&format_bytes(available)),
            Cell::new(&format!("{:.2}", usage_percent)).style_spec(usage_color),
        ]));
    }
    
    table.printstd();
}

fn show_process_info(sys: &System) {
    println!("\n{}", "Top Processes (by CPU):".bold().underline());
    
    let mut processes: Vec<_> = sys.processes().values().collect();
    processes.sort_by(|a, b| {
        b.cpu_usage().partial_cmp(&a.cpu_usage()).unwrap()
    });
    
    let mut table = Table::new();
    table.add_row(Row::new(vec![
        Cell::new("PID").style_spec("Fb"),
        Cell::new("Name").style_spec("Fb"),
        Cell::new("CPU (%)").style_spec("Fb"),
        Cell::new("Memory").style_spec("Fb"),
    ]));
    
    for process in processes.iter().take(10) {
        table.add_row(Row::new(vec![
            Cell::new(&process.pid().to_string()),
            Cell::new(process.name()),
            Cell::new(&format!("{:.2}", process.cpu_usage())),
            Cell::new(&format_bytes(process.memory())),
        ]));
    }
    
    table.printstd();
}

fn main() {
    let args = Args::parse();
    let mut sys = System::new_all();
    
    loop {
        sys.refresh_all();
        
        if args.watch {
            print!("\x1B[2J\x1B[1;1H"); // Clear screen
        }
        
        println!("{}", "System Monitor".bold().cyan());
        println!("{}", "=".repeat(50));
        
        if args.all || args.cpu {
            show_cpu_info(&sys);
        }
        
        if args.all || args.memory {
            show_memory_info(&sys);
        }
        
        if args.all || args.disk {
            show_disk_info(&sys);
        }
        
        if args.all || args.processes {
            show_process_info(&sys);
        }
        
        if !args.all && !args.cpu && !args.memory && !args.disk && !args.processes {
            // Show summary if no specific flags
            show_cpu_info(&sys);
            show_memory_info(&sys);
        }
        
        if !args.watch {
            break;
        }
        
        std::thread::sleep(std::time::Duration::from_secs(2));
    }
}
```

## Testing and Distribution

### Testing Your CLI

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use assert_cmd::Command;
    use predicates::prelude::*;
    use tempfile::tempdir;
    
    #[test]
    fn test_help_message() {
        let mut cmd = Command::cargo_bin("mytool").unwrap();
        cmd.arg("--help")
            .assert()
            .success()
            .stdout(predicate::str::contains("USAGE"));
    }
    
    #[test]
    fn test_invalid_args() {
        let mut cmd = Command::cargo_bin("mytool").unwrap();
        cmd.arg("--invalid")
            .assert()
            .failure()
            .stderr(predicate::str::contains("error"));
    }
    
    #[test]
    fn test_file_operations() {
        let temp_dir = tempdir().unwrap();
        let file_path = temp_dir.path().join("test.txt");
        
        let mut cmd = Command::cargo_bin("mytool").unwrap();
        cmd.arg("create")
            .arg(&file_path)
            .assert()
            .success();
        
        assert!(file_path.exists());
    }
}
```

### Building and Distribution

```toml
# Cargo.toml optimizations
[profile.release]
opt-level = 'z'     # Optimize for size
lto = true          # Enable Link Time Optimization
codegen-units = 1   # Single codegen unit for better optimization
strip = true        # Strip symbols
```

```bash
# Build for release
cargo build --release

# Cross-compilation
cargo install cross
cross build --target x86_64-pc-windows-gnu --release

# Create packages
# For macOS
cargo install cargo-bundle
cargo bundle --release

# For Linux (Debian/Ubuntu)
cargo install cargo-deb
cargo deb

# For Windows
cargo install cargo-wix
cargo wix
```

## Best Practices

1. **Error Messages**: Provide helpful, actionable error messages
2. **Exit Codes**: Use appropriate exit codes (0 for success, non-zero for errors)
3. **Help Text**: Write clear, comprehensive help documentation
4. **Configuration**: Support both CLI args and config files
5. **Logging**: Use env_logger for debug output controlled by RUST_LOG
6. **Testing**: Write comprehensive tests for all commands
7. **Documentation**: Include examples in your README
8. **Performance**: Profile and optimize for startup time
9. **Compatibility**: Test on all target platforms
10. **User Experience**: Follow platform conventions and standards

## Conclusion

Rust provides an excellent ecosystem for building professional CLI tools. With libraries like clap for argument parsing, tokio for async operations, and various formatting libraries, you can create fast, reliable, and user-friendly command-line applications.

Key takeaways:
- Use clap for robust argument parsing
- Add colors and formatting for better UX
- Implement progress indicators for long operations
- Support configuration files for complex tools
- Write comprehensive tests
- Optimize for size and startup time

## Resources

- [Clap Documentation](https://docs.rs/clap/)
- [Command Line Applications in Rust](https://rust-cli.github.io/book/)
- [Awesome Rust CLI Tools](https://github.com/rust-unofficial/awesome-rust#command-line)

Start building your next CLI tool with Rust today!