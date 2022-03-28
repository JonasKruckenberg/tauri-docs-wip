# Sidecar (Embedding External Binaries)

Tauri allows you to embed external binaries, to save your users from
installing additional dependencies (e.g., Node.js or Python).

## Configuration

To add a Sidecar binary to your Tauri app, add the executables'
absolute or relative path to the [`tauri.bundle.externalBin`] array.
The Tauri CLI will bundle all sidecars into the final package.

<figure>

```diff
{
  "tauri": {
    "bundle": {
      "externalBin": [
+        "/absolute/path/to/app",
+        "relative/path/to/binary",
+        "bin/python"
      ]
    }
  }
}
```

<figcaption>Listing 4-TODO: </figcaption>
</figure>

When bundling the final application, the Tauri bundlers appends the
[target triple] to the specified path, so for example, with the
following configuration `"externalBin": ["bin/python"]` Tauri will
attempt to bundle the following file
`src-tauri/bin/python-x86_64-unknown-linux-gnu` on x86 Linux and
`src-tauri/bin/python-aarch64-apple-darwin` on Apple silicon macOS.

To find your current platforms' target triple, open a terminal and
enter the following command:

```console
rustc -Vv | grep host
```

Here's a Node.js script to append the target triple to a binary:

```javascript
const execa = require("execa");
const fs = require("fs");

let extension = "";
if (process.platform === "win32") {
  extension = ".exe";
}

async function main() {
  const rustInfo = (await execa("rustc", ["-vV"])).stdout;
  const targetTriple = /host: (\S+)/g.exec(rustInfo)[1];
  if (!targetTriple) {
    console.error("Failed to determine platform target triple");
  }
  fs.renameSync(
    `src-tauri/binaries/app${extension}`,
    `src-tauri/binaries/app-${targetTriple}${extension}`
  );
}

main().catch((e) => {
  throw e;
});
```

## Running the Sidecar Binary

Tauri takes care of bundling the Sidecar binary, but you are in charge
of actually running it. This means you are also in charge of killing
the child process when your app closes; otherwise, you pollute the
users' machine with orphan processes.

### Rust

The `tauri::api::process::Command` struct provides a convenient
constructor for Sidecar binaries, `Command::new_sidecar`, that will
take care of appending the correct target triple to match the filename
you had to assign previously.

```rust,ignore
let (mut rx, mut child) = Command::new_sidecar("my-sidecar")
  .expect("failed to create `my-sidecar` binary command")
  .spawn()
  .expect("Failed to spawn sidecar");

tauri::async_runtime::spawn(async move {
  // read events such as stdout
  while let Some(event) = rx.recv().await {
    if let CommandEvent::Stdout(line) = event {
      window
        .emit("message", Some(format!("'{}'", line)))
        .expect("failed to emit event");
      // write to stdin
      child.write("message from Rust\n".as_bytes()).unwrap();
    }
  }
});
```

### JavaScript

In Frontend JavaScript code, you may use the `Command.sidecar` static
method that, in-turn takes care of appending the right target triple.

```javascript
import { Command } from "@tauri-apps/api/shell";
// alternatively, use `window.__TAURI__.shell.Command`
// `my-sidecar` is the value specified on `tauri.conf.json > tauri > bundle > externalBin`
const command = Command.sidecar("my-sidecar");
const output = await command.execute();
```

## Using Node.js as a Sidecar

The sidecar feature can only bundle self-contained binaries, making
Node.js applications difficult to bundle. You can either include a
stock Node.js binary as a Sidecar and your JavaScript file as a
[Resource], or compile the Node.js runtime and code into a standalone
binary using [pkg]. The official Tauri [sidecar example] demonstrates
the latter technique.

[`tauri.bundle.externalbin`]: /docs/api/config#tauri.bundle
[sidecar example]:
  https://github.com/tauri-apps/tauri/tree/dev/examples/sidecar
[pkg]: https://github.com/vercel/pkg
[resource]: ../building/tauri-bundler.md#resources
