fn startup_command(executable: &std::path::Path) -> String {
    format!("\"{}\" --autostart", executable.display())
}

#[tauri::command]
pub fn set_windows_autostart(app: tauri::AppHandle, enabled: bool) -> Result<(), String> {
    #[cfg(windows)]
    {
        use winreg::{enums::HKEY_CURRENT_USER, RegKey, RegValue};
        use winreg::enums::RegType::REG_BINARY;
        if cfg!(debug_assertions) && enabled {
            return Err("Hãy bật khởi động cùng Windows trong bản đã cài đặt, không phải bản chạy thử.".into());
        }
        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        let (run, _) = hkcu.create_subkey("Software\\Microsoft\\Windows\\CurrentVersion\\Run").map_err(|e| e.to_string())?;
        let name = &app.package_info().name;
        if enabled {
            let exe = std::env::current_exe().map_err(|e| e.to_string())?;
            let command = startup_command(&exe);
            run.set_value(name, &command).map_err(|e| e.to_string())?;
            let (approved, _) = hkcu.create_subkey("Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\Run").map_err(|e| e.to_string())?;
            approved.set_raw_value(name, &RegValue { vtype: REG_BINARY, bytes: vec![2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }).map_err(|e| e.to_string())?;
            let actual: String = run.get_value(name).map_err(|e| e.to_string())?;
            if actual != command { return Err("Windows chưa lưu đúng đường dẫn khởi động.".into()); }
        } else {
            match run.delete_value(name) {
                Ok(()) => {},
                Err(error) if error.kind() == std::io::ErrorKind::NotFound => {},
                Err(error) => return Err(error.to_string()),
            }
        }
        Ok(())
    }
    #[cfg(not(windows))]
    { let _ = (app, enabled); Err("Chỉ hỗ trợ Windows.".into()) }
}

#[cfg(test)]
mod tests {
    use super::startup_command;
    #[test]
    fn quotes_executable_paths_with_spaces_without_a_shell() {
        assert_eq!(startup_command(std::path::Path::new(r"C:\Users\Test User\AppData\Local\Morrow\morrow.exe")), r#""C:\Users\Test User\AppData\Local\Morrow\morrow.exe" --autostart"#);
    }
}
