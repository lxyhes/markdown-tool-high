// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::Path;
use serde::{Serialize, Deserialize};
use tauri::api::path::document_dir;

#[derive(Serialize, Deserialize)]
struct FileNode {
    name: String,
    path: String,
    is_dir: bool,
    children: Option<Vec<FileNode>>,
}

#[tauri::command]
async fn read_directory(path: String) -> Result<Vec<FileNode>, String> {
    let mut nodes = Vec::new();

    let entries = fs::read_dir(&path).map_err(|e| e.to_string())?;

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        let metadata = entry.metadata().map_err(|e| e.to_string())?;

        let name = entry.file_name().to_string_lossy().to_string();
        let is_dir = metadata.is_dir();

        let node = FileNode {
            name: name.clone(),
            path: path.to_string_lossy().to_string(),
            is_dir,
            children: if is_dir { Some(Vec::new()) } else { None },
        };

        nodes.push(node);
    }

    nodes.sort_by(|a, b| {
        match (a.is_dir, b.is_dir) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.cmp(&b.name),
        }
    });

    Ok(nodes)
}

#[tauri::command]
async fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
async fn write_file(path: String, content: String) -> Result<(), String> {
    if let Some(parent) = Path::new(&path).parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::write(&path, content).map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_file(path: String) -> Result<(), String> {
    let path = Path::new(&path);
    if path.is_dir() {
        fs::remove_dir_all(path).map_err(|e| e.to_string())
    } else {
        fs::remove_file(path).map_err(|e| e.to_string())
    }
}

#[tauri::command]
async fn rename_file(old_path: String, new_path: String) -> Result<(), String> {
    fs::rename(&old_path, &new_path).map_err(|e| e.to_string())
}

#[tauri::command]
async fn save_image(image_data: Vec<u8>, file_name: String, save_path: Option<String>) -> Result<String, String> {
    let save_dir = if let Some(path) = save_path {
        Path::new(&path).to_path_buf()
    } else {
        document_dir().ok_or("无法获取文档目录")?.join("MarkFlowImages")
    };

    fs::create_dir_all(&save_dir).map_err(|e| e.to_string())?;

    let file_path = save_dir.join(&file_name);
    fs::write(&file_path, image_data).map_err(|e| e.to_string())?;

    Ok(file_path.to_string_lossy().to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            read_directory,
            read_file,
            write_file,
            delete_file,
            rename_file,
            save_image
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}