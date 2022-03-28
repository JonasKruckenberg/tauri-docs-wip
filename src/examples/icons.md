# Icons

Tauri ships with a default iconset based on its logo. This is probably
NOT what you want when you ship your application. To help with this
common situation, Tauri provides the [`tauricon`] command that will
take an input file (`"./app-icon.png"` by default) and create all the
icons needed for the various platforms:

## Installation

You can install the [`tauricon`] package either locally as a dev
dependency:

**npm**

```console
npm install -D github:tauri-apps/tauricon
```

**yarn**

```console
yarn add -D github:tauri-apps/tauricon
```

**pnpm**

```console
pnpm add -D github:tauri-apps/tauricon
```

or globally:

**npm**

```console
npm install -g github:tauri-apps/tauricon
```

**yarn**

```console
yarn add -g github:tauri-apps/tauricon
```

**pnpm**

```console
pnpm add -g github:tauri-apps/tauricon
```

If you decide to use `tauricon` as a local package with npm (not
yarn), you need to add a custom script to your package.json:
package.json

```diff
{
  "scripts": {
+    "tauricon": "tauricon"
  }
}
```

## Usage

```text
npm tauricon --help

Description
  Create all the icons you need for your Tauri app.
  The icon path is the source icon (png, 1240x1240 with transparency), it defaults
  to './app-icon.png'.

Usage
  tauricon [ICON-PATH]

Options
  --help, -h          Displays this message
  --log, l            Logging [boolean]
  --target, t         Target folder (default: 'src-tauri/icons')
  --compression, c    Compression type [optipng|zopfli]
  --ci                Runs the script in CI mode
```

Created icons will be placed in your `src-tauri/icons` folder, where
they will automatically be included in your built app.

If you need to source your icons from some other location, you can
edit this part of the `src-tauri/tauri.conf.json` file:

```diff
{
  "tauri": {
    "bundle": {
      "icon": [
-        "icons/32x32.png",
-        "icons/128x128.png",
-        "icons/128x128@2x.png",
-        "icons/icon.icns",
-        "icons/icon.ico"
+        "otherpath/icons/32x32.png",
+        "otherpath/icons/128x128.png",
+        "otherpath/icons/128x128@2x.png",
+        "otherpath/icons/icon.icns",
+        "otherpath/icons/icon.ico"
      ]
    }
  }
}
```

> Note on filetypes:
>
> - `.icns` is used for macOS builds
> - `.ico` is used for Windows builds
> - `.png` is used for Linux builds

[`tauricon`]: https://github.com/tauri-apps/tauricon
