# Windows Installer

Tauri applications for Windows are distributed as Microsoft Installer
(`.msi` files). The Tauri CLI bundles your application binary and
additional resources in this format if you build on windows. This
guide provides information about available customization options for
the installer.

## 32-bit Windows

The Tauri CLI compiles your executable using your machine's
architecture by default. Assuming that you're developing on a 64-bit
machine, the CLI will produce 64-bit applications. If you need to
support 32-bit machines, you can compile your application with a
different [Rust target][platform support] using the `--target` flag:

<figure>

<!-- TODO make powershell -->

```console
tauri build --target i686-pc-windows-msvc
```

<figcaption>Listing 3-TODO: Building a Tauri application for 32-bit windows.</figcaption>
</figure>

By default Rust only installs toolschains for your machine's target,
so you need to install the 32-bit Windows toolchain first:
`rustup target add i686-pc-windows-msvc`. You can get a full list of
Rust targets by running `rustup target list`.

## Using a Fixed Version of the Webview2 Runtime

By default, the Tauri installer downloads and installs the Webview2
Runtime if it is not already installed (On Windows 11, WebView2 is
preinstalled).

> You can remove the Webview2 Runtime download check from the
> installer by setting [`tauri.bundle.windows.wix.skipWebviewInstall`]
> to `true`. Your application WON'T work if the user does not have the
> runtime installed.

Using a global installation of WebView2 is great for security as
Window keeps it updated, but if your end-users have no internet
connection or you need a particular version of WebView2, Tauri can
bundle the runtime files for you. Keep in mind, that this increases
the size of windows installers by **150MB** since your app will
include its own copy of chromium.

1. Download the Webview2 fixed version runtime from the [official
   website][download the webview2 runtime], a `.cab` file for the
   selected architecture. In this example, the downloaded filename is
   <br> `Microsoft.WebView2.FixedVersionRuntime.98.0.1108.50.x64.cab`
2. Extract the file to the core folder: <br>
   `Expand .\Microsoft.WebView2.FixedVersionRuntime.98.0.1108.50.x64.cab -F:* ./src-tauri`
3. Configure the Webview2 runtime path on `tauri.conf.json`:

   ```json
   {
     "tauri": {
       "bundle": {
         "windows": {
           "webviewFixedRuntimePath": "./Microsoft.WebView2.FixedVersionRuntime.98.0.1108.50.x64/"
         }
       }
     }
   }
   ```

4. Run `tauri build` to produce the Windows Installer with the fixed
   Webview2 runtime.

## Customizing the Installer

The Windows Installer package is built using the [WiX Toolset v3].
Currently, you can change it by using a custom WiX source code (an XML
file with a `.wxs` file extension) or through WiX fragments.

### Replacing the Installer Code with a Custom WiX File

The Windows Installer XML defined by Tauri is configured to work for
the common use case of simple webview-based applications; you can find
it [here][default wix template]. It uses [handlebars] so the Tauri CLI
can brand your installer according to your `tauri.conf.json`
definition. If you need a completely different installer, a custom
template file can be configured on
[`tauri.bundle.windows.wix.template`].

### Extending the Installer with WiX Fragments

A [WiX fragment] is a container where you can configure almost
everything offered by WiX. In this example, we will define a fragment
that writes two registry entries:

```xml
<?xml version="1.0" encoding="utf-8"?>
<Wix xmlns="http://schemas.microsoft.com/wix/2006/wi">
  <Fragment>
    <!-- these registry entries should be installed
		 to the target user's machine -->
    <DirectoryRef Id="TARGETDIR">
      <!-- groups together the registry entries to be installed -->
      <!-- Note the unique `Id` we provide here -->
      <Component Id="MyFragmentRegistryEntries" Guid="*">
        <!-- the registry key will be under
			 HKEY_CURRENT_USER\Software\MyCompany\MyApplicationName -->
        <!-- Tauri uses the second portion of the
			 bundle identifier as the `MyCompany` name
			 (e.g. `tauri-apps` in `com.tauri-apps.test`)  -->
        <RegistryKey
          Root="HKCU"
          Key="Software\MyCompany\MyApplicationName"
          Action="createAndRemoveOnUninstall"
        >
          <!-- values to persist on the registry -->
          <RegistryValue
            Type="integer"
            Name="SomeIntegerValue"
            Value="1"
            KeyPath="yes"
          />
          <RegistryValue Type="string" Value="Default Value" />
        </RegistryKey>
      </Component>
    </DirectoryRef>
  </Fragment>
</Wix>
```

Save the fragment file with the `.wxs` extension somewhere in your
project and reference it on `tauri.conf.json`:

```json
{
  "tauri": {
    "bundle": {
      "windows": {
        "wix": {
          "fragmentPaths": ["./path/to/registry.wxs"],
          "componentRefs": ["MyFragmentRegistryEntries"]
        }
      }
    }
  }
}
```

Note that `ComponentGroup`, `Component`, `FeatureGroup`, `Feature` and
`Merge` element ids must be referenced on the `wix` object of
`tauri.conf.json` on the `componentGroupRefs`, `componentRefs`,
`featureGroupRefs`, `featureRefs` and `mergeRefs` respectively in
order to be included on the installer.

## Internationalization

The Windows Installer is built using the `en-US` language by default.
Internationalization (i18n) can be configured using the
[`tauri.bundle.windows.wix.language`] property, defining the languages
Tauri should build an installer against. You can find the language
names to use in the Language-Culture column
[here][localizing the error and actiontext tables].

### Compiling an Installer for a single Language

To create a single installer targeting a specific language, set the
`language` value to a string:

```json
{
  "tauri": {
    "bundle": {
      "windows": {
        "wix": {
          "language": "fr-FR"
        }
      }
    }
  }
}
```

### Compiling an Installer for each Language in a List

To compile an installer targeting a list of languages, use an array. A
specific installer for each language will be created, with the
language key as a suffix:

```json
{
  "tauri": {
    "bundle": {
      "windows": {
        "wix": {
          "language": ["en-US", "pt-BR", "fr-FR"]
        }
      }
    }
  }
}
```

### Configuring the Installer for each Language

A configuration object can be defined for each language to configure
localization strings:

```json
{
  "tauri": {
    "bundle": {
      "windows": {
        "wix": {
          "language": {
            "en-US": null,
            "pt-BR": {
              "localePath": "./wix/locales/pt-BR.wxl"
            }
          }
        }
      }
    }
  }
}
```

The `localePath` property defines the path to a language file, a XML
configuring the language culture:

```xml
<WixLocalization
  Culture="en-US"
  xmlns="http://schemas.microsoft.com/wix/2006/localization"
>
  <String Id="LaunchApp"> Launch MyApplicationName </String>
  <String Id="DowngradeErrorMessage">
    A newer version of MyApplicationName is already installed.
  </String>
  <String Id="PathEnvVarFeature">
    Add the install location of the MyApplicationName executable to
    the PATH system environment variable. This allows the
    MyApplicationName executable to be called from any location.
  </String>
  <String Id="InstallAppFeature">
    Installs MyApplicationName.
  </String>
</WixLocalization>
```

> The `WixLocalization` element's `Culture` field must match the
> configured language.

Currently Tauri references the following locale strings: `LaunchApp`,
`DowngradeErrorMessage`, `PathEnvVarFeature` and `InstallAppFeature`.
You can define your own strings and reference them on your custom
template or fragments with `"!(loc.TheStringId)"`. See the [WiX
localization documentation] for more information.

[platform support]:
  https://doc.rust-lang.org/nightly/rustc/platform-support.html
[`tauri.bundle.windows.wix.skipwebviewinstall`]:
  /docs/api/config/#tauri.bundle.windows.wix.skipWebviewInstall
[download the webview2 runtime]:
  https://developer.microsoft.com/en-us/microsoft-edge/webview2/#download-section
[wix toolset v3]: https://wixtoolset.org/documentation/manual/v3/
[default wix template]:
  https://github.com/tauri-apps/tauri/blob/dev/tooling/bundler/src/bundle/windows/templates/main.wxs
[handlebars]: https://docs.rs/handlebars/latest/handlebars/
[`tauri.bundle.windows.wix.template`]:
  /docs/api/config/#tauri.bundle.windows.wix.template
[wix fragment]:
  https://wixtoolset.org/documentation/manual/v3/xsd/wix/fragment.html
[`tauri.bundle.windows.wix.language`]:
  /docs/api/config/#tauri.bundle.windows.wix.language
[wix localization documentation]:
  https://wixtoolset.org/documentation/manual/v3/howtos/ui_and_localization/make_installer_localizable.html
[localizing the error and actiontext tables]:
  https://docs.microsoft.com/en-us/windows/win32/msi/localizing-the-error-and-actiontext-tables
