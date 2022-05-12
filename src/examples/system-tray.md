# System Tray

This guide walks you through adding a tray icon to the systems'
notification area. Tray icons have their own context menu.

On macOS and Ubuntu, the Tray will be located on the top right corner
of your screen, adjacent to your battery and wifi icons. On Windows,
the Tray will usually be located in the bottom right corner.

## Configuration

Add the following to your `tauri.conf.json` files `tauri` object:

```diff
  "tauri": {
+    "systemTray": {
+      "iconPath": "icons/icon.png",
+      "iconAsTemplate": true
+    }
  }
```

`iconPath` must point to a PNG file on macOS and Linux, and a .ico
file with the same name must exist for Windows support.
`iconAsTemplate` is a boolean value that determines whether the image
represents a Template Image on macOS.

## Creating a System Tray

To create a native system tray, import the `SystemTray` type:

```rust,ignore
use tauri::SystemTray;
```

and instantiate a new tray:

```rust,ignore
let tray = SystemTray::new();
```

## Configuring a System Tray Context Menu

Optionally you can add a context menu that is visible when the tray
icon is clicked. Import the `SystemTrayMenu`, `SystemTrayMenuItem` and
`CustomMenuItem` types:

```rust,ignore
use tauri::{CustomMenuItem, SystemTrayMenu, SystemTrayMenuItem};
```

Create the `SystemTrayMenu`:

```rust,ignore
// here `"quit".to_string()` defines the menu item id,
// and the second parameter is the menu item label.
let quit = CustomMenuItem::new("quit".to_string(), "Quit");
let hide = CustomMenuItem::new("hide".to_string(), "Hide");

let tray_menu = SystemTrayMenu::new()
    .add_item(quit)
    .add_native_item(SystemTrayMenuItem::Separator)
    .add_item(hide);
```

Add the tray menu to the SystemTray instance:

```rust,ignore
let tray = SystemTray::new().with_menu(tray_menu);
```

## Configure the App System Tray

The created SystemTray instance can be set using the system_tray API
on the tauri::Builder struct:

```rust,ignore
use tauri::{CustomMenuItem, SystemTray, SystemTrayMenu};

fn main() {
    let tray_menu = SystemTrayMenu::new(); // insert the menu items here
    let system_tray = SystemTray::new().with_menu(tray_menu);
    tauri::Builder::default()
        .system_tray(system_tray)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

## Listening to System Tray Events

Each CustomMenuItem triggers an event when clicked. Also, Tauri emits
tray icon click events. Use the `on_system_tray_event` callback to
handle them:

```rust,ignore
use tauri::Manager;
use tauri::{CustomMenuItem, SystemTray, SystemTrayMenu};

fn main() {
    let tray_menu = SystemTrayMenu::new(); // insert the menu items here
    tauri::Builder::default()
        .system_tray(SystemTray::new().with_menu(tray_menu))
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::LeftClick {
                position: _,
                size: _,
                ..
            } => {
                println!("system tray received a left click");
            }
            SystemTrayEvent::RightClick {
                position: _,
                size: _,
                ..
            } => {
                println!("system tray received a right click");
            }
            SystemTrayEvent::DoubleClick {
                position: _,
                size: _,
                ..
            } => {
                println!("system tray received a double click");
            }
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "quit" => {
                    std::process::exit(0);
                }
                "hide" => {
                    let window = app.get_window("main").unwrap();
                    window.hide().unwrap();
                }
                _ => {}
            },
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

## Updating the System Tray

The `AppHandle` struct has a `tray_handle` method, which returns a
handle to the system tray, allowing updating tray icon and context
menu items: Updating context menu items

```rust,ignore
use tauri::Manager;
use tauri::{CustomMenuItem, SystemTray, SystemTrayMenu};

fn main() {
    let tray_menu = SystemTrayMenu::new(); // insert the menu items here
    tauri::Builder::default()
        .system_tray(SystemTray::new().with_menu(tray_menu))
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::MenuItemClick { id, .. } => {
                // get a handle to the clicked menu item
                // note that `tray_handle` can be called anywhere,
                // just get a `AppHandle` instance
                // with `app.handle()` on the setup hook
                // and move it to another function or thread
                let item_handle = app.tray_handle().get_item(&id);
                match id.as_str() {
                    "hide" => {
                        let window = app.get_window("main").unwrap();
                        window.hide().unwrap();
                        // you can also `set_selected`, `set_enabled`
                        // and `set_native_image` (macOS only).
                        item_handle.set_title("Show").unwrap();
                    }
                    _ => {}
                }
            }
            _ => {}
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

## Updating the Tray Icon

Note that `tauri::Icon` must be a `Path` variant on Linux, and Raw
variant on Windows and macOS.

```rust,ignore
app.tray_handle()
        .set_icon(tauri::Icon::Raw(include_bytes!("../path/to/myicon.ico")))
        .unwrap();
```
