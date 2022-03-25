# Updater

The updater is focused on making Tauri's application updates **as safe and
transparent as updates to a website**.

Instead of publishing a feed of versions from which your app must select, Tauri
updates to the version your server tells it to. This allows you to intelligently
update your clients based on the request you give to Tauri. The server can
remotely drive behaviors like rolling back or phased rollouts. The update JSON
Tauri requests should be dynamically generated based on criteria in the request
and whether an update is required. Tauri's installer is also designed to be
fault-tolerant, and ensure that any updates installed are valid and safe.

## Configuration

To enable updates you must add the following to your `tauri.conf.json` file:

```json
"updater": {
    "active": true,
    "endpoints": [
        "https://releases.myapp.com/{{target}}/{{arch}}/{{current_version}}"
    ],
    "dialog": true,
    "pubkey": "YOUR_UPDATER_SIGNATURE_PUBKEY_HERE"
}
```

The required keys are `active`, `endpoints` and `pubkey`; others are optional.
`active` must be a boolean. By default, it's set to false. `endpoints` must be
an array. The strings `{{current_version}}` and `{{target}}` and `{{arch}}` are
automatically replaced in the URL, allowing you to determine
[server-side](#dynamic-json-format) if an update is available. If multiple
endpoints are specified, the updater will fall back if a server is not
responding within the pre-defined timeout. `dialog` must be a boolean if
present. By default, it is set to true. If enabled, events are turned off as the
updater handles everything. If you need the custom events, you MUST turn off the
built-in dialog. `pubkey` must be a valid public-key generated with Tauri CLI.
See [Signing updates](#signing-updates) for details.

## Update Requests

The Tauri updater will periodically send an HTTP GET request to the previously
configured endpoints. The return type must be `application/json` and adhere to
one of the following schemas.

### Dynamic JSON Format

The dynamic response format allows you fine grained control over the update
process. If the update server determines - based on the update request - that an
update is necessary, it must respond with a status code of [200 OK] and include
valid update information of the following shape:

```json
{
  "url": "https://mycompany.example.com/myapp/releases/myrelease.tar.gz",
  "version": "0.0.1",
  "notes": "Theses are some release notes",
  "pub_date": "2020-09-18T12:29:53+01:00",
  "signature": ""
}
```

The only required keys are `url` and `version`; all others are optional.
`pub_date`must be formated according to [ISO 8601] if present and `signature`
must be a valid signature generated with the Tauri Cli.

If no update is required your server must respond with a status code of [204 No
Content].

### Static JSON Format

To simplify the usage with static file hosting solutions, like AWS S3, Tauri
supports an alternative static JSON response format. Tauri checks against the
`version` field, and if the version is smaller than the current one and the
platform is available, it triggers an update. The format of this file is
detailed below:

```json
{
  "version": "v1.0.0",
  "notes": "Test version",
  "pub_date": "2020-06-22T19:25:57Z",
  "platforms": {
    "darwin-aarch64": {
      "signature": "",
      "url": "https://github.com/tauri-apps/tauri-test/releases/download/v1.0.0/app-aarch64.app.tar.gz"
    },
    "darwin-x86_64": {
      "signature": "",
      "url": "https://github.com/tauri-apps/tauri-test/releases/download/v1.0.0/app-x86_64.app.tar.gz"
    },
    "linux-x86_64": {
      "signature": "",
      "url": "https://github.com/tauri-apps/tauri-test/releases/download/v1.0.0/app.AppImage.tar.gz"
    },
    "windows-x86_64": {
      "signature": "",
      "url": "https://github.com/tauri-apps/tauri-test/releases/download/v1.0.0/app.x64.msi.zip"
    },
    "windows-i686": {
      "signature": "",
      "url": "https://github.com/tauri-apps/tauri-test/releases/download/v1.0.0/app.x86.msi.zip"
    }
  }
}
```

The only required keys are `version` and `platforms.<platform>.url`; All others
are optional. `pub_date`must be formated according to [ISO 8601] if present and
<br> `platforms.<platform>.signature` must be a valid signature generated with
the Tauri CLI.

## Built-in Update Dialog

By default, the updater uses a built-in dialog API from Tauri.

![New Update available](https://i.imgur.com/UMilB5A.png)

The dialog release notes are filled with the `note` property of the update
response. If the user accepts, the update is downloaded and installed.
Afterward, the user is prompted to restart the application.

## Programmatic API

If you want to customize the dialog or customize the update experience in
general, you may use the [`@tauri-apps/api/updater`] module to do so.

> You need to disable built-in dialog. Otherwise, the javascript API will NOT
> work.

```javascript
import { checkUpdate, installUpdate } from "@tauri-apps/api/updater";
import { relaunch } from "@tauri-apps/api/process";

try {
  const { shouldUpdate, manifest } = await checkUpdate();
  if (shouldUpdate) {
    // display dialog
    await installUpdate();
    // install complete, restart app
    await relaunch();
  }
} catch (error) {
  console.log(error);
}
```

The updater also emits a number of lifecycle events you may subscribe to:

#### `tauri://update-available`

Emitted when a new update is available, the event includes the following
metadata:

```text
version    Version announced by the server
date       Date announced by the server
body       Note announced by the server
```

<figure>

```rust,ignore
window.listen("tauri://update-available".to_string(), move |msg| {
    println!("New version available: {:?}", msg);
});
```

```javascript
import { listen } from "@tauri-apps/api/event";

listen("tauri://update-available", function (res) {
  console.log("New version available: ", res);
});
```

<figcaption>Listing 4-TODO: Listening to new update events from Rust and JavaScript.</figcaption>
</figure>

#### `tauri://update-status`

Emitted while the update is downloaded and installed, you may use this to
display a progress bar.

```text
status    [ERROR/PENDING/DONE]
error     String/null
```

`PENDING` is emitted when the download is started and `DONE` when the install is
complete. You can then ask to restart the application. `ERROR` is emitted when
there is an error with the updater. We suggest listening to this event even if
the dialog is enabled.

<figure>

```rust,ignore
window.listen("tauri://update-status".to_string(), move |msg| {
    println!("New status: {:?}", msg);
});
```

```javascript
import { listen } from "@tauri-apps/api/event";

listen("tauri://update-status", function (res) {
  console.log("New status: ", res);
});
```

<figcaption>Listing 4-TODO: Listening to update progress events from Rust and JavaScript.</figcaption>
</figure>

## Signing Updates

The updater offers built-in signature checking to ensure your update is
authentic and can be safely installed. When present, the update response's
`signature` field and the downloaded artifact will be checked against the
configured `pubkey` using [Minisign], a simple signature system using [Ed25519]
public-key signatures.

1. **Prerequisites**

   This guide assumes you have the Tauri CLI and a working Tauri application.

2. **Generate Keypair**

   To successfully sign and verify updates you need a _Keypair_, consisting of

   - **A Public-Key** (`pubkey`) - Used to verify the signatures. This key is
     safe to share with others and should be added to your `tauri.conf.json`.
   - **A Private key** (`privkey`) - Used to sign your update and should
     **NEVER** be shared with anyone. If you lose this key, you'll NOT be able
     to publish a new update to the current user base. It is crucial to store it
     in a safe place where you can always access it.

   To generate your keypair using the Tauri CLI, open a terminal and enter the
   following command:

   ```console
   $ tauri signer generate -w ~/.tauri/myapp.key
   ```

3. **Tauri Configuration**

   The Tauri bundler will automatically sign update artifacts if the
   `TAURI_PRIVATE_KEY` and `TAURI_KEY_PASSWORD` environment variables are set.
   `TAURI_PRIVATE_KEY` must be the string representation of your private key or
   a path pointing to your private key file. `TAURI_KEY_PASSWORD` must contain
   the private key's password if you configured one.

[iso 8601]: https://en.wikipedia.org/wiki/ISO_8601
[minisign]: https://jedisct1.github.io/minisign/
[ed25519]: https://ed25519.cr.yp.to/
[200 ok]: http://tools.ietf.org/html/rfc2616#section-10.2.1
[204 no content]: http://tools.ietf.org/html/rfc2616#section-10.2.5
[`@tauri-apps/api/updater`]: /docs/api/js/modules/updater
