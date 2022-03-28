# macOS Bundle

Tauri applications for macOS are distributed either with an [Application Bundle]
(`.app` files) or an Apple Disk Image (`.dmg` files). The Tauri CLI
automatically bundles your application code in these formats, providing options
to codesign and notarize your application.

## Setting a Minimum System Version

The minimum version of the operating system required for a Tauri app to run in
macOS is `10.13`. If you need support for newer macOS APIs like `window.print`
that is only supported from macOS version `11.0` onwards, you can change the
[`tauri.bundle.macOS.minimumSystemVersion`]. This will in turn set the
`Info.plist` [LSMinimumSystemVersion] property and the
`MACOSX_DEPLOYMENT_TARGET` environment variable.

> Note: macOS High Sierra (10.13) no longer receives security updates from
> Apple. You should target macOS Catalina (10.15) if possible.

## Binary Targets

macOS applications can target Apple Silicon, Intel-based Mac computers, or
universal macOS binaries that work on both architectures. By default, the Tauri
CLI uses your machine's architecture, but you can configure a different target
using the `--target` flag:

```console
tauri build --target aarch64-apple-darwin
```

Supported targets are:

- `aarch64-apple-darwin` - Apple silicon, also known as m1 Macs, for all models
  introduced [after late 2020][apple silicon macs].
- `x86_64-apple-darwin` - Intel-based Macs, all Macs introduced before
  fall 2020.
- `universal-apple-darwin` - produces a [Universal macOS Binary] that runs on
  both Apple silicon and Intel-based Macs.

While Apple silicon machines can run applications compiled for Intel-based Macs
through a translation layer called [Rosetta], they tend to suffer from
performance problems. It is common practice to let the user choose the correct
target when downloading the app, but you can also choose to distribute a
[Universal Binary][universal macos binary]. Universal Binaries include both
`aarch64` **and** `x86_64` executables, giving you the best experience on both
architectures. Note, however, that this increases your bundle size
significantly.

## Application Bundle Customization

The Tauri configuration file provides the following options to customize your
application bundle:

- **Bundle name** - Your apps human-readable name. Configured by the
  [`package.productName`] property.
- **Bundle version** - Your apps version. Configured by the [`package.version`]
  property.
- **Application category** - The category that describes your app. Configured by
  the [`tauri.bundle.category`] property. You can see a list of macOS categories
  [here][macos app categories].
- **Copyright** - A copyright string associated with your app. Configured by the
  [`tauri.bundle.copyright`] property.
- **Bundle icon** - Your apps icon. Uses the first `.icns` file listed on the
  [`tauri.bundle.icon`] array.
- **Minimum system version** - Configured by the
  [`tauri.bundle.macOS.minimumSystemVersion`] property.
- **DMG license file** - A license that is added to the `.dmg` file. Configure
  by the [`tauri.bundle.macOS.license`] property.
- **[Entitlements.plist file]** - Entitlements control what APIs your app will
  have access to. Configured by the [`tauri.bundle.macOS.entitlements`]
  property.
- **Exception domain** - an insecure domain that your application can access
  such as a `localhost` or a remote `http` domain. It is a convenience
  configuration around `NSAppTransportSecurity > NSExceptionDomains` setting
  `NSExceptionAllowsInsecureHTTPLoads` and `NSIncludesSubdomains` to true. See
  [`tauri.bundle.macOS.exceptionDomain`].
- **Bootstrapper** - Instead of launching the app directly, you can configure
  the bundled app to run a script that tries to expose the environment variables
  to the app; without that, you'll have trouble using system programs because
  the `PATH` environment variable isn't correct. Enable it with
  [`tauri.bundle.macOS.useBootstrapper`].

> These options generate the application bundle [Info.plist file]. You can
> extend the generated file with your own `Info.plist` file stored on the Tauri
> folder (`src-tauri` by default). The CLI merges both `.plist` files on
> production, and the core layer embeds it on the binary on development.

[application bundle]:
  https://developer.apple.com/library/archive/documentation/CoreFoundation/Conceptual/CFBundles/BundleTypes/BundleTypes.html
[`tauri.bundle.macos.minimumsystemversion`]:
  /docs/api/config#tauri.bundle.macOS.minimumSystemVersion
[lsminimumsystemversion]:
  https://developer.apple.com/documentation/bundleresources/information_property_list/lsminimumsystemversion
[apple silicon macs]: https://support.apple.com/en-us/HT211814
[universal macos binary]:
  https://developer.apple.com/documentation/apple-silicon/building-a-universal-macos-binary
[rosetta]: https://support.apple.com/en-gb/HT211861
[macos app categories]: https://developer.apple.com/app-store/categories/
[`package.productname`]: /docs/api/config/#package.productName
[`package.version`]: /docs/api/config/#package.version
[`tauri.bundle.category`]: /docs/api/config/#tauri.bundle.category
[`tauri.bundle.copyright`]: /docs/api/config/#tauri.bundle.copyright
[`tauri.bundle.icon`]: /docs/api/config/#tauri.bundle.icon
[`tauri.bundle.macos.minimumsystemversion`]:
  /docs/api/config/#tauri.bundle.macOS.minimumSystemVersion
[`tauri.bundle.macos.license`]: /docs/api/config/#tauri.bundle.macOS.license
[entitlements.plist file]:
  https://developer.apple.com/documentation/bundleresources/entitlements
[`tauri.bundle.macos.entitlements`]:
  /docs/api/config/#tauri.bundle.macOS.entitlements
[`tauri.bundle.macos.exceptiondomain`]:
  /docs/api/config/#tauri.bundle.macOS.exceptionDomain
[`tauri.bundle.macos.usebootstrapper`]:
  /docs/api/config#tauri.bundle.deb.useBootstrapper
[info.plist file]:
  https://developer.apple.com/library/archive/documentation/General/Reference/InfoPlistKeyReference/Introduction/Introduction.html
