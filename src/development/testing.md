# Testing

Automated tests are essential to ensure your application's stability,
quality, and correctness. It's common to write Tests for libraries or
server-side code, but many people struggle with writing automated
tests for Graphical User Interface (GUI) applications. <br> Following
the separation of concerns you learned about in the [Process Model]
chapter, we recommend you set up two kinds of tests:

- **Unit Tests** - Test frontend and Core functionality independently
  in isolated contexts.
- **End-to-End Tests** (E2E) - Spiin up full instances of your app and
  simulate real user interactions to make sure individually tested
  components work well together.

In this guide we walk you through setting up units tests for Rust and
JavaScript, as well as End-to-End tests using [WebDriver].

## Unit Testing

Unit tests verify that individual units of source code are functioning
as expected. This usually doesn't include UI (see
[End-to-end Tests](#end-to-end-tests) for that) but small chunks of
internal logic, for example individual functions or methods.

### Rust

Cargo comes with a builtin test runner - `cargo test` - that will run
unit tests and report passes and failures. The simplest test in rust
is a function with the `test` attribute. To change a plain function
into a test, add `#[test]` to the line before `fn`.

Since it's common to write many small tests to ensure different
expectations, Rust unit tests are commonly grouped into _Test
Modules_:

<figure>

```rust
#[cfg(test)]
mod tests {
    #[test]
    fn first_test() {
        assert_eq!(2 + 2, 4);
    }

        #[test]
    fn second_test() {
        assert_eq!(4 + 4, 8);
    }
}
```

<figcaption>A simplified Rust test suite containing two very basic tests.</figcaption>
</figure>

The `#[cfg(test)]` attribute ensures that the module is only compiled
when running `cargo test` but stripped when you build the binary for
development or release. To learn more, see the [Conditional
Compilation] reference.

The function body uses the `assert_eq!` macro to assert that 2 + 2
equals 4 and 4 + 4 equals 8.

### JavaScript

Unit tests in JavaScript are more complicated, as there are many
competing test runners: [Jest], [Mocha], and [Vitest] are popular
choices. For the following code-snippets we will be using [Vitest].

Contrary to Rust, where tests co-located with the source code (i.e. in
the same file), JavaScript tests are written in a separate file,
commonly named `*.tests.js`.

Filename: tests/main.test.ts

<figure>

```typescript
import { expect, test } from "vitest";
import { foo } from "./main";

test("foo", () => {
  const data = foo();
  expect(data).toEqual("foo");
});
```

<figcaption>A simplified vitest test suite containing one very basic test.</figcaption>
</figure>

> As your tests are executed in an Isolated Context, you need to
> _mock_ Tauri APIs. See [Mocking Tauri APIs](#mocking-tauri-apis) for
> more details.

A popular convention is to add a `test` script to your `package.json`
file, so users immediately know how to test your application. Let's
add a `test` script to our example application that just alises to the
`vitest` test runner:

```json
{
  "name": "test-application",
  "version": "1.0.0",
  "scripts": {
    "test": "vitest"
  },
  "devDependencies": {
    "vitest": "0.3.5"
  }
}
```

Now we can run our test suite by opening a terminal and executing the
following command:

**npm**

```console
npm test
```

```console
yarn test
```

```console
pnpm test
```

## End-to-End Testing

End-to-end Tests (E2E) tests simulate a user’s step-by-step
experience, testing the interactions between many components in the
process.

[WebDriver] is a standardized interface to interact with web documents
primarily intended for automated testing. It provides capabilities for
navigating to web pages, user input, JavaScript execution, and more.

Tauri supports the [WebDriver] interface by leveraging the native
platform's [WebDriver] server underneath a cross-platform wrapper
provided by [`tauri-driver`].

### Prerequisites

Install the latest tauri-driver or update an existing installation by
running:

```console
cargo install tauri-driver
```

Because we currently utilize the platform's native [WebDriver] server,
there are some requirements for running [`tauri-driver`] on supported
platforms. Platform support is currently limited to Linux and Windows.

#### Linux

We use `WebKitWebDriver` on Linux platforms. Check if this binary
exists already (command `which WebKitWebDriver`) as some distributions
bundle it with the regular WebKit package. Other platforms may have a
separate package for them, such as `webkit2gtk-driver` on Debian-based
distributions.

#### Windows

Make sure to grab the version of [Microsoft Edge Driver] that matches
your Windows' Edge version that the application is being built and
tested on. This should almost always be the latest stable version on
up-to-date Windows installs. If the two versions do not match, you may
experience your WebDriver testing suite hanging while trying to
connect.

The download contains a binary called `msedgedriver.exe`.
[`tauri-driver`] looks for that binary in the `$PATH` so make sure
it's either available on the path or use the --native-driver option on
[`tauri-driver`]. You may want to download this automatically as part
of the CI setup process to ensure the Edge, and Edge Driver versions
stay in sync on Windows CI machines. A guide on how to do this may be
added at a later date.

### With WebdriverIO

[WebdriverIO] (WDIO) is a test automation framework that provides a
Node.js package for testing with WebDriver. Its ecosystem also
includes various plugins (e.g. reporter and services) that can help
you put together your test setup.

#### Install the test runner

Open a terminal and run the the WebdriverIO starter toolkit in your
project with the following command:

**npm**

```console
npx wdio .
```

**yarn**

```console
yarn create wdio .
```

**pnpm**

```console
pnpm create wdio .
```

This installs all necessary packages for you and generates a
`wdio.conf.js` configuration file.

#### Connect your Tauri app

Update the `wdio.conf.js` file with the following options:

<figure>

```javascript
// keep track of the `tauri-driver` child process
let tauriDriver;

exports.config = {
  // ...
  // ensure the rust project is built
  // since we expect this binary to exist
  // for the webdriver sessions
  onPrepare: () => spawnSync("cargo", ["build", "--release"]),

  // ensure we are running `tauri-driver` before the session starts
  // so that we can proxy the webdriver requests
  beforeSession: () =>
    (tauriDriver = spawn(
      path.resolve(os.homedir(), ".cargo", "bin", "tauri-driver"),
      [],
      { stdio: [null, process.stdout, process.stderr] }
    )),

  // clean up the `tauri-driver` process we spawned
  afterSession: () => tauriDriver.kill(),
  // ...
};
```

<figcaption>Example WebdriverIO config that launches a Tauri app before tests are run and kills the app after all tests finished.</figcaption>
</figure>

#### Add tests

Let's add a test file and a couple e2e tests to show what WDIO is
capabable of. The test runner will load these files and autimatically
run them.

Filename: test/specs/example.e2e.js

<figure>

```javascript
// calculates the luma from a hex color `#abcdef`
function luma(hex) {
  if (hex.startsWith("#")) {
    hex = hex.substring(1);
  }

  const rgb = parseInt(hex, 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

describe("Hello Tauri", () => {
  it("should be cordial", async () => {
    const header = await $("body > h1");
    const text = await header.getText();

    expect(text).toMatch(/^[hH]ello/);
  });

  it("should be excited", async () => {
    const header = await $("body > h1");
    const text = await header.getText();

    expect(text).toMatch(/!$/);
  });

  it("should be easy on the eyes", async () => {
    const body = await $("body");
    const backgroundColor = await body.getCSSProperty(
      "background-color"
    );

    expect(luma(backgroundColor.parsed.hex)).toBeLessThan(100);
  });
});
```

<figure>Listing 2-TODO: An example test suite using WebdriverIO that asserts various DOM properties.</figure>
</figure>

The `luma` function on top is just a helper function for one of our
tests and is not related to the actual testing of the application. If
you are familiar with other testing frameworks, you may notice similar
functions being exposed that are used, such as `describe`, `it`, and
`expect`. The other APIs, such as items like `$` and its exposed
methods, are covered by the [WebdriverIO API docs].

#### Run your tests

To run your test suite, open a terminal and execute the following
command:

**npm**

```console
npx wdio run wdio.conf.json
```

**yarn**

```console
yarn wdio run wdio.conf.json
```

**pnpm**

```console
pnpm wdio run wdio.conf.json
```

You should see the following output:

<figure>

```text
➜  webdriverio git:(main) ✗ yarn test
yarn run v1.22.11
$ wdio run wdio.conf.js

Execution of 1 workers started at 2021-08-17T08:06:10.279Z

[0-0] RUNNING in undefined - /test/specs/example.e2e.js
[0-0] PASSED in undefined - /test/specs/example.e2e.js

 "spec" Reporter:
------------------------------------------------------------------
[wry 0.12.1 linux #0-0] Running: wry (v0.12.1) on linux
[wry 0.12.1 linux #0-0] Session ID: 81e0107b-4d38-4eed-9b10-ee80ca47bb83
[wry 0.12.1 linux #0-0]
[wry 0.12.1 linux #0-0] » /test/specs/example.e2e.js
[wry 0.12.1 linux #0-0] Hello Tauri
[wry 0.12.1 linux #0-0]    ✓ should be cordial
[wry 0.12.1 linux #0-0]    ✓ should be excited
[wry 0.12.1 linux #0-0]    ✓ should be easy on the eyes
[wry 0.12.1 linux #0-0]
[wry 0.12.1 linux #0-0] 3 passing (244ms)
```

<figcaption>Listing 2-TODO: Example output from WebdriverIO showing the 3 tests from earlier passing.</figcaption>
</figure>

### With Selenium

[Selenium] is a web automation framework that exposes bindings to
WebDriver APIs in many languages. Their Node.js bindings are available
under the `selenium-webdriver` package on NPM. Unlike the [WebdriverIO
Test Suite], Selenium does not come out of the box with a Test Suite
and leaves it up to the developer to provide one. We chose [Mocha] for
this example, since it's a popular choice.

#### Install the test runner

**npm**

```console
npm install mocha chai selenium-webdriver
```

**yarn**

```console
yarn add -D mocha chai selenium-webdriver
```

**pnpm**

```console
pnpm add -D mocha chai selenium-webdriver
```

#### Connect your Tauri app

The following code will start an instance of your app before tests are
run and ensure the instance is terminated afterwards. Let's add it to
the default mocha testing file:

Filename: test/test.js

<figure>

```javascript
const os = require("os");
const path = require("path");
const { spawn, spawnSync } = require("child_process");
const { Builder, By, Capabilities } = require("selenium-webdriver");

// create the path to the expected application binary
const application = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "target",
  "release",
  "hello-tauri-webdriver"
);

// keep track of the webdriver instance we create
let driver;

// keep track of the tauri-driver process we start
let tauriDriver;

before(async function () {
  // set timeout to 2 minutes
  // to allow the program to build if it needs to
  this.timeout(120000);

  // ensure the program has been built
  spawnSync("cargo", ["build", "--release"]);

  // start tauri-driver
  tauriDriver = spawn(
    path.resolve(os.homedir(), ".cargo", "bin", "tauri-driver"),
    [],
    { stdio: [null, process.stdout, process.stderr] }
  );

  const capabilities = new Capabilities();
  capabilities.set("tauri:options", { application });
  capabilities.setBrowserName("wry");

  // start the webdriver client
  driver = await new Builder()
    .withCapabilities(capabilities)
    .usingServer("http://localhost:4444/")
    .build();
});

after(async function () {
  // stop the webdriver session
  await driver.quit();

  // kill the tauri-driver process
  tauriDriver.kill();
});
```

<figcaption>Listing 2-TODO: Example Selenium file that launches a Tauri app before tests are run and kills the app after all tests finished.</figcaption>
</figure>

### Add tests

Now we can add tests to the file we created earlier. We will be using
assertion functions provided by [Chai] such as `expect` to validate
our app works as expected.

Filename: test/test.js

<figure>

```javascript
const { expect } = require("chai");

describe("Hello Tauri", () => {
  it("should be cordial", async () => {
    const text = await driver
      .findElement(By.css("body > h1"))
      .getText();

    expect(text).to.match(/^[hH]ello/);
  });

  it("should be excited", async () => {
    const text = await driver
      .findElement(By.css("body > h1"))
      .getText();

    expect(text).to.match(/!$/);
  });

  it("should be easy on the eyes", async () => {
    // selenium returns color css values as rgb(r, g, b)
    const text = await driver
      .findElement(By.css("body"))
      .getCssValue("background-color");

    const rgb = text.match(
      /^rgb\((?<r>\d+), (?<g>\d+), (?<b>\d+)\)$/
    ).groups;

    expect(rgb).to.have.all.keys("r", "g", "b");

    const luma = 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
    expect(luma).to.be.lessThan(100);
  });
});
```

<figcaption>Listing 2-TODO: Example tests using Selenium and Chai to assert various DOM properties.</figcaption>
</figure>

If you are familiar with JS testing frameworks, `describe`, `it`, and
`expect` should look familiar. We also have semi-complex `before()`
and `after()` callbacks to setup and teardown mocha. If you compare
this to the [WebdriverIO example](#with-webdriverio), you notice a lot
more code that isn't tests, as we have to set up a few more WebDriver
related items.

### Run your tests

To run your test suite, open a terminal and execute the following
command:

**npm**

```console
npx mocha
```

**yarn**

```console
yarn mocha
```

**pnpm**

```console
pnpm mocha
```

We should see output the following output:

<figure>

```text
➜  selenium git:(main) ✗ yarn test
yarn run v1.22.11
$ Mocha


  Hello Tauri
    ✔ should be cordial (120ms)
    ✔ should be excited
    ✔ should be easy on the eyes


  3 passing (588ms)

Done in 0.93s.
```

<figcaption>Listing 2-TODO: Output from Selenium showing the 3 earlier tests passing.</figcaption>
</figure>

## Mocking Tauri APIs

When writing your frontend tests, having a "fake" Tauri environment to
simulate windows or intercept IPC calls is common, so-called
_mocking_. The [`@tauri-apps/api/mocks`] module provides some helpful
tools to make this easier for you:

> Remember to clear mocks after each test run to undo mock state
> changes between runs! See [`clearMocks()`] docs for more info.

### IPC Requests

Most commonly, you want to intercept IPC requests; this can be helpful
in a variety of situations:

- Ensure the correct backend calls are made
- Simulate different results from backend functions

Tauri provides the mockIPC function to intercept IPC requests. You can
find more about the specific API in detail [here][`mockipc()`].

> The following examples use [Vitest], but you can use any other
> frontend testing library such as jest.

<figure>

```javascript
import { beforeAll, expect, test } from "vitest";
import { randomFillSync } from "crypto";

import { mockIPC } from "@tauri-apps/api/mocks";
import { invoke } from "@tauri-apps/api/tauri";

// jsdom doesn't come with a WebCrypto implementation
beforeAll(() => {
  window.crypto = {
    getRandomValues: function (buffer) {
      return randomFillSync(buffer);
    },
  };
});

test("invoke simple", async () => {
  mockIPC((cmd, args) => {
    // simulate rust command called "add"
    if (cmd === "add") {
      return args.a + args.b;
    }
  });

  expect(invoke("add", { a: 12, b: 15 })).resolves.toBe(27);
});
```

<figcaption>Listing 2-TODO: Vitest test file showing a mocked command handler that simulates a simple add function.</figcaption>
</figure>

Sometimes you want to track more information about an IPC call; how
many times was the command invoked? Was it invoked at all? You can use
[`mockIPC()`] with other spying and mocking tools to test this:

<figure>

```javascript
import { beforeAll, expect, test, vi } from "vitest";
import { randomFillSync } from "crypto";

import { mockIPC } from "@tauri-apps/api/mocks";
import { invoke } from "@tauri-apps/api/tauri";

// jsdom doesn't come with a WebCrypto implementation
beforeAll(() => {
  //@ts-ignore
  window.crypto = {
    getRandomValues: function (buffer) {
      return randomFillSync(buffer);
    },
  };
});

test("invoke", async () => {
  mockIPC((cmd, args) => {
    // simulate rust command called "add"
    if (cmd === "add") {
      return args.a + args.b;
    }
  });

  // we can use the spying tools provided by vitest
  // to track the mocked function
  const spy = vi.spyOn(window, "__TAURI_IPC__");

  expect(invoke("add", { a: 12, b: 15 })).resolves.toBe(27);
  expect(spy).toHaveBeenCalled();
});
```

<figcaption>

Listing 2-TODO: The mocked `__TAURI_IPC__` is compatible with existing
testing tools.

</figcaption>
</figure>

### Windows

Sometimes you have window-specific code (a splash screen window, for
example), so you need to simulate different windows. You can use the
[`mockWindows()`] method to create fake window labels. The first
string identifies the "current" window (i.e., the window your
JavaScript believes itself in), and all other strings are treated as
additional windows.

> [`mockWindows()`] only fakes the existence of windows but no window
> properties. To simulate window properties, you need to intercept the
> correct calls using [`mockIPC()`]

<figure>

```javascript
import { beforeAll, expect, test } from "vitest";
import { randomFillSync } from "crypto";

import { mockWindows } from "@tauri-apps/api/mocks";

// jsdom doesn't come with a WebCrypto implementation
beforeAll(() => {
  //@ts-ignore
  window.crypto = {
    getRandomValues: function (buffer) {
      return randomFillSync(buffer);
    },
  };
});

test("invoke", async () => {
  mockWindows("main", "second", "third");

  const { getCurrent, getAll } = await import(
    "@tauri-apps/api/window"
  );

  expect(getCurrent()).toHaveProperty("label", "main");
  expect(getAll().map((w) => w.label)).toEqual([
    "main",
    "second",
    "third",
  ]);
});
```

<figcaption>Listing 2-TODO: A vitest test file with 3 mocked windows.</figcaption>
</figure>

[process model]: ../understanding-tauri/process-model.md
[conditional compilation]:
  https://doc.rust-lang.org/reference/conditional-compilation.html
[jest]: https://jestjs.io
[mocha]: https://mochajs.org
[vitest]: https://vitest.dev
[mocking tauri apis]: ./mocking.md
[webdriver]: https://www.w3.org/TR/webdriver/
[`tauri-driver`]: https://crates.io/crates/tauri-driver
[microsoft edge driver]:
  https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/
[webdriverio]: https://webdriver.io/
[selenium]: https://www.selenium.dev/
[webdriverio api docs]: https://webdriver.io/docs/api
[webdriverio test suite]:
  https://tauri.studio/docs/testing/webdriver/example/webdriverio#config
[`@tauri-apps/api/mocks`]: ../api/js/modules/mocks.md
[`mockipc()`]: ../api/js/modules/mocks.md#mockipc
[`mockwindows()`]: ../api/js/modules/mocks.md#mockwindows
[`clearmocks()`]: ../api/js/modules/mocks.md#clearmocks
[vitest]: https://vitest.dev
[chai]: https://www.chaijs.com
