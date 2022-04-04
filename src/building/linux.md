# Linux

Tauri applications for Linux are distributed either as [Debian
Packages][debian package] (`.deb`) or [AppImages][appimage]
(`.AppImage`). This guide provides information about format specific
quirks and customization opportunities.

## AppImage

AppImage is a distribution format that does not rely on packages
installed on the end-user system <!-- actually not 100% correct -->
and instead bundles all dependencies and files needed by the
application. For this reason, the output file is larger but easier to
distribute since it is supported on many Linux distributions and can
be executed without installation, just making the file executable
(`chmod a+x MyProject.AppImage`) and running it
(`./MyProject.AppImage`).

<!-- TODO: add note about building on the oldest system you want to support -->

AppImages are convenient, simplifying the distribution process if you
cannot make a package targeting the distribution's package manager.
Still, you should carefully use it as the file size grows from the
2-6MBs range to 70+MBs.

## Debian Package

Debian packages are a compressed collection of files installed on
various Linux distributions. Unlike AppImages they don't bundle
required libraries, relying instead on the correct dependency versions

<!-- TODO: The "relying" is in a weird place / the sentence looks weird. Idk where it belongs tho. -->

installed on the system. This makes them less portable and reliable
since missing libraries or incompatible versions will cause problems.
Debian packages are recommended only for distributions that have no
support for AppImages.

### Bootstrapper

<!-- TODO: https://github.com/tauri-apps/tauri/pull/3832 -->

Instead of launching the app directly, you can configure the bundled
app to run a script that tries to expose the environment variables to
the app; without that, you'll have trouble using system programs
because the `PATH` environment variable isn't correct. You can enable
it with the [`tauri.bundle.deb.useBootstrapper`] config.

### Additional Files

The Debian package allows you to specify additional files that will be
copied to the the user's filesystem upon installation. The
configuration object maps <!-- TODO -->

<figure>

```json
{
  "tauri": {
    "bundle": {
      "deb": {
        "files": {
          // copies the README.md file to /usr/lib/README.md
          "/usr/lib/README.md": "../README.md",
          // copies the entire public directory to /usr/lib/assets
          "usr/lib/assets": "../public/"
        }
      }
    }
  }
}
```

<figcaption>Listing 3-TODO: </figcaption>
</figure>

[debian package]: https://wiki.debian.org/Packaging
[appimage]: https://appimage.org/
[`tauri.bundle.deb.usebootstrapper`]:
  https://tauri.studio/docs/api/config/#tauri.bundle.deb.useBootstrapper
