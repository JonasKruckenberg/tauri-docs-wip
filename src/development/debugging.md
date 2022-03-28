# Debugging

With all the moving pieces in a Tauri application, chances are you will not
write perfect bug-free code all the time. Your app might behave weirdly, be very
slow, or outright crash.

In this guide, we give you a number of tools and techniques to troubleshoot
problems when they arise.

## Rust

To effectively debug a program, you need to know what's going on inside. Rust
and Tauri provide many tools to make this possible.

### Logging

When your first learned Rust, you might have printed logging messages by using
the `println!` macro:

```Rust
fn main() {
    println!("foobar");
}
```

However, for more complex projects, Rust provides an elegant logging system that
allows log messages from app code and dependencies with different levels,
timestamps, and metadata.

To use this system, add the [`log`] crate to your `Cargo.toml` file:

```toml
[package]
name = "app"
version = "0.1.0"
edition = "2021"

[dependencies]
log = "0.4"
```

Now you can use a number of logging macros: [`error!`], [`warn!`], [`info!`],
[`debug!`] and [`trace!`] where `error!` represents the highest-priority log.

```rust,no_run
use log::{trace, debug, info, warn, error};

fn main() {
    trace!("A trace-level message");
    debug!("A debug-level message");
    info!("An info-level message");
    warn!("A warn-level message");
    error!("An error-level message");
}
```

However, you will notice it doesn't actually print anything when you run this!
This is because `log` expects you to bring your own logger. There are many
available implementations to choose from, here are some of the most popular
ones:

- Simple minimal loggers:
  - [`env_logger`]
  - [`simple_logger`]
  - [`simplelog`]
  - [`pretty_env_logger`]
  - [`stderrlog`]
  - [`flexi_logger`]
- Complex configurable frameworks:
  - [`log4rs`]
  - [`fern`]

### [`tauri-plugin-log`]

The Tauri team maintains a logger that is built explicitly for Tauri
applications. It is built on top of [`fern`] and supports writing logs to many
different targets and consuming log messages produced in the WebView.

Add it to your `Cargo.toml`:

```toml
[package]
name = "app"
version = "0.1.0"
edition = "2021"

[dependencies]
log = "0.4"
tauri-plugin-log = { git = "https://github.com/tauri-apps/tauri-plugin-log" }
```

and import it like any other Tauri plugin:

<figure>

```rust,no_run
use tauri_plugin_log::{LogTarget, LoggerBuilder};

fn main() {
    tauri::Builder::default()
        .plugin(
            LoggerBuilder::new()
                .targets([
                    // write to the OS logs folder
                    LogTarget::LogDir,
                    // write to stdout
                    LogTarget::Stdout,
                    // forward logs to the webview
                    LogTarget::Webview,
                ])
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

<figcaption>Listing 2-TODO: Example configuration that emits logs to the WebView, Stdout and to the OS's log folder.</figcaption>
</figure>

### Tracing

Sometimes simple logs are not enough to debug your problem, though, so you might
reach for the [`tracing`] crate.

In addition to logging-style diagnostics recorded by the [`log`] crate, it
provides information about _temporality_ and _causality_. Spans in `tracing` are
events that have a beginning and end time, may be entered and exited by the flow
of execution, and may exist within a nested tree of similar spans.

```rust, no_run
use tracing::{info, debug, span, Level};

// records an event outside of any span context:
info!("something happened");

let span = span!(Level::INFO, "my_span");
let _guard = span.enter();

// records an event within "my_span".
debug!("something happened inside my_span");
```

### GDB

The [GNU Project Debugger] (GDB) is a very old program written by Richard
Stallman in 1986. GDB has support for several languages, such as C/C++, but also
modern languages such as Go and Rust.

`rust-gdb` comes with the Rust installation by default and is a wrapper around
GDB that enables pretty-printing rust types in the GDB output.

To debug a Rust binary, build the binary:

```console
cargo build --debug
```

And then load it into GDB:

```console
rust-gdb target/debug/<app name>
```

### LLDB

[LLDB] is a debugger built on top of [LLVM], the compiler backend used by Rust
itself. We can use the `rust-lldb` tool, which comes with the Rust installation
by default. It wraps [LLDB] to provide pretty-printing rust types.

To debug a Rust binary, build the binary:

```console
cargo build --debug
```

And then load it into LLDB:

```console
rust-lldb target/debug/<app name>
```

### Panics

When your Rust code runs into a problem that is **so severe** that it can't
recover from it, your program should `panic`. When a [Panic] occurs, your
program will print a failure message, unwind and clean up the stack, and then
quit. A [Panic] will manifest as a hard crash, so it's crucial to minimize the
number of panics.

To determine what caused the [Panic], you can re-run your application with the
`RUST_BACKTRACE` environment variable set to `1` to print a more detailed
failure message.

## JavaScript

To open the WebView dev tools, right-click in the WebView and choose
`Inspect Element`. This opens up the web-inspector similar to the one you're
used to from Chrome, Firefox, or Safari.

If you run into problems with your frontend framework, you might reach for
framework-specific dev tools. While many of them are distributed as _Chromium
Extensions_, which are **not** compatible with Tauri, some of them - such as the
[Vue Devtools] - provide standalone versions that work nicely with Tauri.

### `tauri-plugin-log-api`

As an alternative to the ubiquitous `console.log` debugging,
[`tauri-plugin-log`] offers a JavaScript API that has a very similar feature set
to the Rust version. <br> You can install it from npm with the following
command:

**npm**
```console
npm install --save-dev tauri-plugin-log-api
```
**yarn**
```console
yarn add -D tauri-plugin-log-api
```
**pnpm**
```console
pnpm add -D tauri-plugin-log-api
```

Now you can emit logs using the `trace()`, `debug()`, `info()`, `warn()` and
`error()` functions and attach the devtools console to the loggers event stream
by calling `attachConsole()`:

```javascript
import {
  attachConsole,
  trace,
  debug,
  info,
  warn,
  error,
} from "tauri-plugin-log-api";

// with LogTarget::Webview enabled this function will print logs to the browser console
const detach = await attachConsole();

trace("A trace-level message");
debug("A debug-level message");
info("An info-level message");
warn("A warn-level message");
error("An error-level message");

// detach the webview console from the log stream
detach();
```

Please refer to [the plugin's documentation][`tauri-plugin-log`] for details.

## Debugging Production Builds

Not all bugs are found during development; some will be reported by your
end-users. Below are some tips to help you debug production builds.
<!-- TODO: expand -->

### Tauri plugin log

[`tauri-plugin-log`] can be used in production code too. When configured with
the `LogTarget::LogDir` it will write logs to the canonical log-file directory
of your Operating System. When your application crashes, you can recover logs
from those locations, e.g., the `Console` application can be used to view log
files on macOS:

<figure>
<picture>
  <source srcset="../img/apple_console_light.avif" type="image/avif" media="(prefers-color-scheme:light)">
  <source srcset="../img/apple_console_dark.avif" type="image/avif" media="(prefers-color-scheme:dark)">
  <source srcset="../img/apple_console_light.webp" type="image/webp" media="(prefers-color-scheme:light)">
  <source srcset="../img/apple_console_dark.webp" type="image/webp" media="(prefers-color-scheme:dark)">
  <source srcset="../img/apple_console_light.png" type="image/png" media="(prefers-color-scheme:light)">
  <source srcset="../img/apple_console_dark.png" type="image/png" media="(prefers-color-scheme:dark)">
  <img src="../img/a.png" alt="Apple Console App">
</picture>
<figcaption>Listing 2-TODO: Apple's Console App showing showing the Tauri app's log file.</figcaption>
</figure>

[panic]:
  https://doc.rust-lang.org/book/ch09-01-unrecoverable-errors-with-panic.html
[vue devtools]: https://devtools.vuejs.org
[gnu project debugger]: https://www.sourceware.org/gdb/
[`tokio-console`]: https://github.com/tokio-rs/console
[lldb]: https://lldb.llvm.org
[llvm]: https://llvm.org
[`log`]: https://crates.io/crates/log
[`error!`]: https://docs.rs/log/latest/log/macro.error.html
[`warn!`]: https://docs.rs/log/latest/log/macro.warn.html
[`info!`]: https://docs.rs/log/latest/log/macro.info.html
[`debug!`]: https://docs.rs/log/latest/log/macro.debug.html
[`trace!`]: https://docs.rs/log/latest/log/macro.trace.html
[`env_logger`]: https://docs.rs/env_logger/*/env_logger/
[`simple_logger`]: https://github.com/borntyping/rust-simple_logger
[`simplelog`]: https://github.com/drakulix/simplelog.rs
[`pretty_env_logger`]: https://docs.rs/pretty_env_logger/*/pretty_env_logger/
[`stderrlog`]: https://docs.rs/stderrlog/*/stderrlog/
[`flexi_logger`]: https://docs.rs/flexi_logger/*/flexi_logger/
[`log4rs`]: https://docs.rs/log4rs/*/log4rs/
[`fern`]: https://docs.rs/fern/*/fern/
[`tauri-plugin-log`]: https://github.com/tauri-apps/tauri-plugin-log
[`tracing`]: https://docs.rs/tracing/*/tracing/
