## The Tauri CLI

The Tauri CLI is the magic glue, that makes it all work: It
orchestrates your frontend development server and cargo during
development and bundles the rust binary and associated resources
(sidecars or icons) into the final distributable app. You can install
it from various sources, depending on your preference:

### Cargo

The CLI is written in Rust, so its primary distribution mechanism is
cargo:

```console
cargo install tauri-cli
```

Please note that cargo has no support for prebuilt binaries, so the
above command will always build the CLI from source.

### JavaScript Package Managers

If you don't want to build the CLI from source or want to lock and
version it for reproducible builds, we also distribute the CLI as an
NPM package: [`@tauri-apps/cli`].

**npm**

```console
npm install --save-dev @tauri-apps/cli
```

**yarn**

```console
yarn add -D @tauri-apps/cli
```

**pnpm**

```console
pnpm add -D @tauri-apps/cli
```

[`@tauri-apps/cli`]: https://www.npmjs.com/package/@tauri-apps/cli
