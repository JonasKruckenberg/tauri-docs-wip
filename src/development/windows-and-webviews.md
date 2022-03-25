# Windows & Webviews

## Windows

A Tauri application consists of one or more windows that are managed by [the
Core process]. Each window is identified by a unique string label that you can
freely choose when creating the window. You can use this label to retrieve a
reference to a specific window later to, for example, resize a specific window.

The [`WindowBuilder`] can be used to configure and create windows with a wide
range of configurable options, as you can see in the Listing-TODO below.

<figure>

```rust,ignore
fn main() {
    tauri::Builder::default()
        .setup(|app| {
            WindowBuilder::new(
                    app,
                    "example_window", // the unique label
                    WindowUrl::App("index.html".into())
                )
                .title("Example Window")
                .resizable(true)
                .min_inner_size(1000,500)
                .max_inner_size(1200,700)
                .always_on_top(true)
                .build()
                .expect("failed to create example window");
        })
        .run()
        .expect("failed to run app");
}
```

<figcaption>

Listing 2-TODO: Creating a new using the `WindowBuilder` and setting various
options.

</figcaption>
</figure>

If you are unfamiliar with Rust programming or are looking for a quick,
no-hassle way to create windows, Tauri also supports declaring them in the
`tauri.conf.json` file.

Filename: tauri.conf.json

```json
//...
"tauri": {
    "windows": [
        {
            "title": "Welcome to Tauri!",
            "width": 800,
            "height": 600,
            "resizable": true,
            "fullscreen": false
        }
    ],
}
//...
```

<!-- TODO: Demonstrate window instance APIs -->

## The WebView

Each window contains one webview that lets you render the actual UI using HTML,
CSS and JavaScript. This makes Tauri compatible with virtually any frontend
framework in existence.

During development you point Tauri at a localhost URL - your development
server - so that you can leverage hot module reloading (HMR) provided by your
favourite frontend build tool. <br> For production builds however, you need to
hand over static files that Tauri will _inline_ into the final binary during
building. This should feel familiar if you have build a website using a static
file hosting service like [Netlify] or [GitHub Pages] before.

In the following examples we will be using the [Vite] frontend bundler, but you
can choose any Frontend build tools that can produce static files.

Filename: index.html

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body>
    <h1>Hello World</h1>
  </body>
</html>
```

File tauri.conf.json

```json
"build": {
    // the command that will start our local development server
    "beforeDevCommand": "vite",
    // the localhost URL that our development server is listening on
    "devPath": "http://localhost:3000",
    // the command that will produce the static files during building
    "beforeBuildCommand": "vite build",
    // the directory where the static files will be placed by vite
    "distDir": "dist"
}
```

As you learned [previously][the webview process], Tauri does ship a webview but
relies on the webviews provided by each operating system instead. This means
that not all browser APIs will be supported on all platforms you target,
WebView2 uses an evergreen updater that always gives you the latest Chromium
Features, while WKWebview versions are tied to the macOS versions. You can refer
to [Appendix C: Version Tables] to get a detailed list of macOS versions and
corresponding safari and webkit versions.

Don't despair however, platform differences are common in web development (think
of IE11) and there are many tools that can aid you in writing elegant
cross-platform JavaScript.

> Note: `ES2021` is supported across all Tauri platforms, so most language
> features should work out-of-the-box without transpilation. 

1. **Use a Transpiler**. Transpilers like [Babel] take your modern JavaScript
   and produce Code that works on older platforms, polyfilling unsupported
   features in the process. If you're using [Typescript] you already have a
   builtin transpiler too!
2. **Use feature detection**. Feature detection is a good practice on the web in
   general, but with Tauri you can make use of several _build-time_ environment
   variables like `TAURI_PLATFORM` or `TAURI_PLATFORM_VERSION` to generate
   platform-specific JavaScript. These variables are exposed to the
   `beforeDevCommand` and `beforeBuildCommand` by default.

    <figure>
   Filename: vite.config.js

   ```javascript
    {
        // to make use of
        // `TAURI_PLATFORM`, `TAURI_ARCH`, `TAURI_FAMILY`,
        // `TAURI_PLATFORM_VERSION`, `TAURI_PLATFORM_TYPE`
        // and `TAURI_DEBUG` env variables in the Frontend
        envPrefix: ["VITE_", "TAURI_"],
        build: {
            // tauri supports es2021
            target: [
            "es2021",
            process.env.TAURI_PLATFORM === "windows" ? "chrome97" : "safari13",
            ],
            // don't minify for debug builds
            minify: !process.env.TAURI_DEBUG && "esbuild",
            // produce sourcemaps for debug builds
            sourcemap: !!process.env.TAURI_DEBUG,
        },
    };
   ```

    <figcaption>
    
    Listing 2-TODO: Conditional compilation in vite using `TAURI_` environment variables.
    
    </figcaption>
   </figure>

3. **Use Rust**. Instead of relying on features that are not supported across
   all platforms you can replace them with Rust implementations that are exposed
   via Commands. The [`tauri-plugin-store`] is an example of such a practice, it
   replaces `LocalStorage` with a much more customizable solution written in
   Rust.

[the core process]: ../background/process-model.md#the-core-process
[the webview process]: ../background/process-model.md#the-core-process
[`windowbuilder`]:
  https://docs.rs/tauri/*/tauri/async_runtime/struct.WindowBuilder.html
[netlify]: https://www.netlify.com/
[github pages]: https://pages.github.com/
[vite]: https://vitejs.dev
[appendix c: version tables]: ../appendix/version-tables.md
[typescript]: https://www.typescriptlang.org/
[`tauri-plugin-store`]: https://github.com/tauri-apps/tauri-plugin-store
