# Splashscreen

In case your Frontend is rather heavy and takes some time to load, or
you need to perform some initialization procedures in Rust before
displaying your main window, a splash screen can improve the loading
experience for the user.

## Configuration

First, create a `splashscreen.html` in your `distDir` that contains
the HTML code for a splashscreen. Then, add the following to your
`tauri.conf.json`:

```diff
"windows": [
  {
    "title": "Tauri App",
    "width": 800,
    "height": 600,
    "resizable": true,
    "fullscreen": false,
+   "visible": false // Hide the main window by default
  },
  // Add the splashscreen window
+ {
+   "width": 400,
+   "height": 200,
+   "decorations": false,
+   "url": "splashscreen.html",
+   "label": "splashscreen"
+ }
]
```

Your main window will be hidden, and the splashscreen window will show
when your app is launched. Next, you'll need a way to close the
splashscreen and show the main window when your app is ready. How you
do this depends on what you are waiting for before closing the
splashscreen.

## Waiting for the Frontend

If you are waiting for your web code, you'll want to create a
`close_splashscreen` [command][commands].

```rust,ignore
use tauri::Manager;
// Create the command:
// This command must be async so that it doesn't run on the main thread.
#[tauri::command]
async fn close_splashscreen(window: tauri::Window) {
  // Close splashscreen
  if let Some(splashscreen) = window.get_window("splashscreen") {
    splashscreen.close().unwrap();
  }
  // Show main window
  window.get_window("main").unwrap().show().unwrap();
}

// Register the command:
fn main() {
  tauri::Builder::default()
    // Add this line
    .invoke_handler(tauri::generate_handler![close_splashscreen])
    .run(tauri::generate_context!())
    .expect("failed to run app");
}
```

Then, you can call it from your Frontend:

```javascript
// With the Tauri API npm package:
import { invoke } from "@tauri-apps/api/tauri";
// With the Tauri global script:
const invoke = window.__TAURI__.invoke;

document.addEventListener("DOMContentLoaded", () => {
  // This will wait for the window to load, but you could
  // run this function on whatever trigger you want
  invoke("close_splashscreen");
});
```

## Waiting for Rust

If you are waiting for Rust code to run, put it in the `setup`
callback so you have access to the App instance:

```rust,ignore
use tauri::Manager;
fn main() {
  tauri::Builder::default()
    .setup(|app| {
      let splashscreen_window = app.get_window("splashscreen").unwrap();
      let main_window = app.get_window("main").unwrap();
      // we perform the initialization code on a new task so the app doesn't freeze
      tauri::async_runtime::spawn(async move {
        // initialize your app here instead of sleeping :)
        println!("Initializing...");
        std::thread::sleep(std::time::Duration::from_secs(2));
        println!("Done initializing.");

        // After it's done, close the splashscreen and display the main window
        splashscreen_window.close().unwrap();
        main_window.show().unwrap();
      });
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("failed to run app");
}
```

[commands]: ../development/inter-process-communication.md#commands
