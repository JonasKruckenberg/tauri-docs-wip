# Building your Application

The Tauri bundler is part of the Tauri CLI and lets you compile your
binary, package assets, and prepare a final bundle with a single
command:

```console
tauri build
```

Like the `tauri dev` command, the first time you run this, it takes
some time to collect the Rust crates and build everything - but on
subsequent runs, it only needs to rebuild your app's code, which is
much quicker. Besides compiling the Rust project, the `tauri build`
command does several other things for you:

1. **Build the Frontend**

   If you have configured your `tauri.conf.json` correctly, the
   bundler calls the <br> `beforeBuildCommand` during this step,
   allowing you to build your Frontend.

2. **Build the Rust Binary**

   The bundler calls `cargo build` under the hood and compiles the
   Rust project into a single executable. This step also _inlines_
   your previously generated Frontend files into the executable. The
   compiled executable is placed in the `src-tauri/target/release`
   folder.

3. **Create Packages**

   During this step the bundler collects all necessary files for
   packaging: the binary, [resources], [sidecars], [icons] and app
   manifests. These files will be packaged up according to the package
   formats your operating system supports. The created artifacts are
   located in the `src-tauri/target/release/bundle/` folder.

4. **Code Sign**

   If you have code-signing enabled, either for
   [Windows][windows code signing], [macOS][macos code signing], or
   the [Updater][signing updates], the last step is signing the
   created artifacts. This step will create `.sig` files in the
   `src-tauri/target/release/bundle/` for each supported packaging
   format.

## Packaging Formats

It will detect your operating system and build a bundle accordingly.
It currently supports:

- Windows: `.exe`, `.msi`, `.msi.zip` (updater)
  <!-- TODO: Don't mention .exe as it is only re-distributable under really specific requirements -->
- macOS: `.app`, `.dmg`, `.app.tar.gz` (updater)
- Linux: `.deb`, `.AppImage`, `.AppImage.tar.gz` (updater)

## Configuration

There are a number of config options that change how the build process
works. For configuring the platform-specific packages, see [Building:
Windows Installer], [Building: macOS Bundle], [Building: Linux] and
[Building: Updater Artifacts] respectively.

### [`tauri.bundle.active`]

Set to false to disable the bundling process. This will still compile
the Rust project, but not produce any platform-specific packages.

### Resources

Resources are configured by the [`tauri.bundle.resources`] property
and are a convenient way to include files or folders that should not
be inlined into the executable but kept on the filesystem. A common
use case is supporting files for sidecars or images or videos.

## Cross-Platform Compilation

Cross-platform compilation is not supported at this moment. If you
want to produce binaries for all three operating systems, you can use
[Virtual Machines] or a CI service like GitHub Actions.

[building: windows installer]: windows-installer.md
[building: macos bundle]: macos-bundle.md
[building: linux]: linux.md
[building: updater artifacts]: updater-artifacts.md
[`tauri.bundle.active`]: /docs/api/config#tauri.bundle.active
[`tauri.bundle.resources`]: /docs/api/config#tauri.bundle.resources
[resources]: /docs/api/config#tauri.bundle.resources
[sidecars]: /docs/api/config#tauri.bundle.externalBin
[icons]: icons.md
[windows code signing]: ../distribution/windows.md#code-signing
[macos code signing]: ../distributing/macos.md#code-signing
[signing updates]: ../distributing/updater.md#signing-updates
[virtual machines]: ../development/vms.md
