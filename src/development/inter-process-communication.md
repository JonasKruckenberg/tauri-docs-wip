# Inter-Process Communication

We established the general concepts and ideas behind IPC in [Background:
Inter-Process Communication]. This guide teaches you how to put that theory to
practice and interact with the IPC system from both JavaScript and Rust.

## Events

Events are one-way IPC messages and come in two distinct flavors: _Global
Events_ and _Window-specific Events_. Global events are emitted for
application-wide lifecycle events (e.g. update events), while window-specific
events are, as the name suggests, emitted for window lifecycle events like
resizing, moving, or user-defined events.
<!-- TODO: -->


## Commands

At its simplest, a Command is a Rust function that is invoked in response to an
incoming IPC request. This function has access to the application state,
windows, may take input parameters, and returns data. You can think of them
almost like [Serverless Functions] that live in the Tauri Core process and
communicate over IPC.

To turn a Rust function into a Command, add `#[tauri::command]` to the line <!-- TODO: mention invoke_handler -->
before `fn`. This [Attribute Macro] wraps your function, handles JSON
serialization, and injects [Special Paramaters](#special-parameters).

<figure>

```rust,ignore
#[tauri::command]
fn my_custom_command() {
  println!("Hello, world!");
}
```

<figcaption>

Listing 2-TODO: A regular Rust function turned into a Command by the `tauri::command` macro.

</figcaption>
</figure>

You can use the `invoke()` function provided by the `@tauri-apps/api` package to
call Commands from the Frontend. The function requires the Command name and
optional parameters and returns a promise that resolves when the Command finished
executing:

<figure>

```javascript
import { invoke } from "@tauri-apps/api";

await invoke("my_custom_command");
```

<figcaption>Listing 2-TODO: A command invocation without parameters.</figcaption>
</figure>

<!-- TODO: register command handler -->

### Parameters

Commands can have parameters, which are defined like regular Rust function
parameters. Tauri will reject IPC requests for a command if the argument number,
types, or names are invalid.

All parameters must implement `serde::Deserialize` so the `tauri::command` macro
can correctly parse the incoming IPC request. Standard types such as `u8`,
`String` or `bool` are deserializable by default, but you have to
[derive][serde: using derive] or [manually
implement][serde: implementing deserialize] `serde::Deserialize` for types you
defined yourself.

<figure>

```rust,ignore
#[tauri::command]
fn my_command(msg: String) {
    println!("I was invoked with this message: {}", msg);
}
```

<figcaption>Listing 2-TODO: Simple command accepting only a single parameter.</figcaption>
</figure>

#### Special Parameters

Commands that only have access to the parameters passed from the Frontend aren't
too helpful, so the `tauri::command` macro has a couple of tricks up its sleeve.
If you specify any of the following types as parameters to your function, they
will be _automagically_ injected by the macro.

- [`tauri::Window`] - A handle to the window that invoked the Command.
- [`tauri::AppHandle`] - A handle to the global `App` instance.
- [`tauri::State<T>`][`tauri::state`] - Tries to inject globally managed state
  `T`. This requires that you previously called [`manage(T)`][`manage()`].

The `tauri::command` macro strips Special Parameters from the function
signature, so they are _invisible_ to the Frontend as Listing 2-TODO shows.

<figure>

```rust,ignore
#[tauri::command]
fn my_command(window: tauri::Window, _app_handle: tauri::AppHandle) {
    println!("I was invoked from window: {}", window.label());
}
```

```javascript
invoke("my_command");
```

<figcaption>Listing 2-TODO: Special Parameters are invisible to the Frontend.</figcaption>
</figure>

You can instruct the macro to inject globally managed state by using the
[`tauri::State`] type. This only works with types that you previously stored in
the globaly state with [`manage()`], see the [State Management] guide for more
details.

<figure>

```rust,ignore
struct DBConnection(Option<DBClient>);

#[tauri::command]
fn is_connected(connection: State<'_, DBConnection>) -> bool {
    // return true if `connection` holds a `DBClient`
    connection.0.is_some()
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![is_connected])
        .setup(|app| {
            app.manage(DBConnection(None));

            Ok(())
        })
        .run()
        .expect("failed to run app");
}
```

<figcaption>

Listing 2-TODO: Using `State` to inject global application state in commands.

</figcaption>
</figure>

> **Note**: It's an informal convention that you put Special Parameters before
> any regular Parameters.

### Commands with Return Values

Commands can return values to the Frontend, exactly like regular Rust functions,
with one caveat: Return values must be representable as JSON. In Rust we say
that the type needs to implement `serde::Serialize`.

Most standard types such as `u8`, `String` or `bool` already implement
`serde::Serialize` by default and even more complex types such as `HashMap<K,V>`
can be serialized as long as both generic types implement `serde::Serialize`.
For types that you defined yourself you need to either [derive the
trait][serde: using derive] or [implement it
manually][serde: implementing serialize].

<figure>

```rust,ignore
#[tauri::command]
fn simple_command() -> String {
  "Hello from Rust!".into()
}

#[derive(serde::Serialize)]
struct Data {
  some_key: String,
  some_other_key: bool,
  more_complex_value: HashMap<String, DataInner>
}

#[derive(serde::Serialize)]
struct DataInner(Vec<u8>);

#[tauri::command]
fn complex_command() -> Data {
  let mut map = HashMap::default();

  map.insert("first", DataInner(vec![1,2,3,4]));

  Data {
    some_key: "foobar".to_string(),
    some_other_key: true,
    more_complex_value: map,
  }
}
```

```javascript
const msg = invoke("simple_command");

// prints "Hello from Rust!"
console.log(msg.payload);

const data = invoke("complex_command");

// prints the following:
// {
//  some_key: "foobar",
//  some_other_key: true,
//  more_complex_value: {
//      first: [1,2,3,4]
//  }
// }
console.log(data.payload);
```

<figcaption>

Listing 2-TODO: Simple and complex command return values, showing how `derive(Serde::Serialize)`
can be used to return user-defined types.

</figcaption>
</figure>

### Error handling

Rust has a standard way to represent failures in functions: The [`Result<T, E>`]
type. It is an enum with two variants, `Ok(T)`, representing success, and
`Err(E)`, representing error.

As you learned earlier Command invocations are represented by a JavaScript
promise. By returning a Result from your Command you can directly influence the
state of that promise: Returning `Ok(T)` resolves the promise with the given
`T`, while returning `Err` rejects the promise with `E` as the error.

<figure>

```rust,ignore
#[tauri::command]
fn failing_command() -> Result<String, String> {
  Err("oops!".to_string())
}
```

<figcaption>Listing 2-TODO: A Command that always fails.</figcaption>
</figure>

If you try this using real-world functions, however, you quickly run into a
problem: No error type implements `serde::Serialize`!

<figure>

```rust,ignore,compile_fail
use std::fs::File;
use std::io;
use std::io::Read;

#[tauri::command]
fn read_file() -> Result<String, io::Error> {
    let mut f = File::open("hello.txt")?;
    let mut s = String::new();
    f.read_to_string(&mut s)?;

    Ok(s)
}
```

<figcaption>

Listing 2-TODO: This code does not compile because `std::io::Error` is not serializable.

</figcaption>
</figure>

You could just use an error type, for example, `String` like we did in
Listing-TODO, but that is not very _idiomatic_. Instead, we create a custom
error type that implements `serde::Serialize`. <br> In the following example, we
use a crate called [`thiserror`] to help create the error type. It allows you to
turn enums into error types by deriving the `thiserror::Error` trait. You can
consult its documentation for more details.
<!-- TODO: in the codesnippet below, consider mentioning that the custom serialize implementation is not needed if the from macro isn't used (or if from is implemented manually). Maybe this would make it too complicated -->
```rust,ignore
// create the error type that represents all errors possible in our program
#[derive(Debug, thiserror::Error)]
enum Error {
  #[error(transparent)]
  Io(#[from] std::io::Error)
}

// we must manually implement serde::Serialize
impl serde::Serialize for Error {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where
    S: serde::ser::Serializer,
  {
    serializer.serialize_str(self.to_string().as_ref())
  }
}
```

A custom error type has the advantage of making all possible errors explicit so
readers can quickly identify what errors can happen. This saves other people
(and yourself) enormous amounts of time when reviewing and refactoring code
later. <br> It also gives you full control over the way your error type gets
serialized. In the above example, we simply returned the error message as a
string, but you could assign each error a code similar to C.

### Async Commands

If your Command spends time waiting for IO - maybe it is reading a file or
connecting to a server - it blocks the main process for that duration. This
means the window becomes unresponsive, and your app _freezes_. To avoid this
problem Rust has builtin support _asynchronous functions_ through [the `Future`
Trait]. A familiar concept if you already know about [`Promise`] and
`async/await` in JavaScript.

You declare an asynchronous command by writing `async fn` instead of `fn`:

```rust,ignore
#[tauri::command]
async fn async_command() {}
```

Async Commands are executed on a thread pool using
[`tauri::async_runtime::spawn()`], so long-running tasks no longer block the
Core's main thread. Because Commands map to JavaScript promises in the Frontend,
they also don't block the Frontend's main thread.

> To execute _non-async_, regular Commands on a different thread, define the
> macro like so: `#[tauri::command(async)]`.

Listing-TODO shows a more complete example that uses the non-blocking
`tokio::fs::read()` function to read a file from disk, convert it to a Utf8
string and parse it into a Vec of lines. It also uses the previously introduced
`thiserror` and `serde::Serialize` to create a custom Error type.

<figure>

```rust,ignore
use std::path::PathBuf;

// A custom error type that represents all possible in our command
#[derive(Debug, thiserror::Error)]
enum Error {
    #[error("Failed to read file: {0}")]
    Io(#[from] std::io::Error),
    #[error("File is not valid utf8: {0}")]
    Utf8(#[from] std::string::FromUtf8Error),
}

// we must also implement serde::Serialize
impl serde::Serialize for Error {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where
    S: serde::ser::Serializer,
  {
    serializer.serialize_str(self.to_string().as_ref())
  }
}

async fn async_read_lines(path: PathBuf) -> Result<Vec<String>, Error> {
    // read bytes a non-blocking way
    let bytes = tokio::fs::read(path).await?;

    // convert bytes into utf8 string
    let string = String::from_utf8(bytes)?;

    // splitting at newline characters
    let lines = string
        .split('\n')
        .map(|line| line.to_string())
        .collect::<Vec<_>>();

    Ok(lines)
}
```

<figcaption>Listing 2-TODO: A more complete examples that uses non-blocking APIs to read a file into a Vec of lines.</figcaption>
</figure>

[background: inter-process communication]:
  ../understanding-tauri/inter-process-communication.md
[`tauri::state`]: https://docs.rs/tauri/*/tauri/struct.State.html
[`tauri::window`]: https://docs.rs/tauri/*/tauri/struct.Window.html
[`tauri::apphandle`]: https://docs.rs/tauri/*/tauri/struct.AppHandle.html
[state management]: state-management.md
[`manage()`]: https://docs.rs/tauri/*/tauri/trait.Manager.html#method.manage
[serde: using derive]: https://serde.rs/derive.html
[serde: implementing serialize]: https://serde.rs/impl-serialize.html
[serde: implementing deserialize]: https://serde.rs/impl-deserialize.html
[attribute macro]:
  https://doc.rust-lang.org/reference/procedural-macros.html#attribute-macros
[the `future` trait]:
  https://rust-lang.github.io/async-book/02_execution/02_future.html
[`promise`]:
  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
[`thiserror`]: https://docs.rs/thiserror/latest/thiserror/
[`tauri::async_runtime::spawn()`]:
  https://docs.rs/tauri/*/tauri/async_runtime/fn.spawn.html
[`result<t, e>`]: https://doc.rust-lang.org/std/result/enum.Result.html
