# macOS Application Distribution

This guide provides information on code signing, notarizing and uploading your
app to the Mac App Store.

> If you are not utilizing GitHub Actions to perform builds of OSX DMGs, you
> will need to ensure the environment variable `CI` is set to `true`. <br> For
> more information refer to [tauri-apps/tauri#592].

## Code Signing

On macOS Catalina and later [Gatekeeper] enforces that you must sign and
notarize your application. Unsigned software cannot be run, so contrary to
[Windows Code Signing] this is not optional for macOS.

0. **Prerequisites**

   This guide assumes you run Windows, either on a physical machine or a
   [Virtual Machine], and that you already have a working Tauri application. You
   also need Xcode 11 or newer and an Apple Developer account enrolled in the
   [Apple Developer Program].

1. **Get a Code Signing Certificate**

   To create a new signing certificate, you must generate a Certificate Signing
   Request (CSR) file on your Mac computer. [Create a certificate signing
   request] describes guides you through creating a CSR.

   Next, open the [Certificates, IDs & Profiles page] and click on the `Add`
   button to open the interface to create a new certificate. Choose the
   appropriate certificate type (`Apple Distribution` to submit apps to the App
   Store, and `Developer ID Application` to ship apps outside the App Store).
   Upload your CSR, and the certificate will be created.

   > Only the Apple Developer _Account Holder_ can create
   > `Developer ID Application` certificates. But it can be associated with a
   > different Apple ID by creating a CSR with a different user email address.

2. **Downloading the Certificate**

   On [Certificates, IDs & Profiles page], click on the certificate you want to
   use and click the `Download` button. It saves a `.cer` file that installs the
   certificate on the keychain once opened. The name of the keychain entry
   represents the _signing identity_, which can also be found by running this
   command: `security find-identity -v -p codesigning`.

   > A signing certificate is only valid if associated with your Apple ID. An
   > invalid certificate won't be listed on the
   > `Keychain Access > My Certificates` tab or the
   > `security find-identity -v -p codesigning` output.

3. **Tauri Configuration**

   To have the Tauri bundler sign your application, you need to configure it.
   This is done by setting a number of environment variables.

   #### Certificate environment variables

   - `APPLE_SIGNING_IDENTITY` - this is the _signing identity_ we highlighted
     earlier. It must be defined to sign apps both locally and on CI machines.

   Additionally, to simplify the code signing process on CI, Tauri can
   automatically install the certificate on the keychain if you define the
   `APPLE_CERTIFICATE` and <br> `APPLE_CERTIFICATE_PASSWORD` environment
   variables.

   1. Open the `Keychain Access` app and find your certificate's keychain entry.
   2. Expand the entry, double click on the key item, and select
      `Export "$KEYNAME"`.
   3. Select the path to save the `.p12` file and define the exported
      certificate password.
   4. Convert the `.p12` file to base64 running the following script on the
      terminal: `
      ```console
      $ openssl base64 -in /path/to/certificate.p12 -out certificate-base64.txt
      ```
   5. Set the contents of the `certificate-base64.txt` file to the
      `APPLE_CERTIFICATE` environment variable.
   6. Set the certificate password to the `APPLE_CERTIFICATE_PASSWORD`
      environment variable.

   #### Authentication environment variables

   - `APPLE_ID` and `APPLE_PASSWORD` - to authenticate with your Apple ID, set
     the `APPLE_ID` to your Apple account email (example:
     `export APPLE_ID=tauri@icloud.com`) and the `APPLE_PASSWORD` to an
     [app-specific password] for the Apple account.

   - `APPLE_API_ISSUER` and `APPLE_API_KEY` - alternatively, you can
     authenticate using an App Store Connect API key. <br> Open the App Store
     Connect's [Users and Access page], click the `Add` button and select a name
     and check `Developer Access`. The `APPLE_API_ISSUER` (Issuer ID) is
     presented above the keys table, and the `APPLE_API_KEY` is the value of the
     `Key ID` column of that table. You also need to download the private key,
     which can only be done once and is only visible after a page reload (the
     button is shown on the table row for the newly created key). The private
     key file must be saved in one of these location `./private_keys`,
     `~/private_keys`, `~/.private_keys` or `~/.appstoreconnect/private_keys`,
     as stated by `xcrun altool --help`.

4. **Sign your Application**

   Now the Tauri bundler will sign and notarize your application automatically
   whenever you run `tauri build`.

   Congratulations! You have successfully signed your Tauri application!

## Continous Integration

As the above-described process is rather laborious, most developers run this
step as an automated part of their Continous Integration (CI). For users of
[GitHub Actions] Tauri provides the [Tauri Action], which simplifies the setup.

> Note: The following example assumes you store the secret passwords and tokens
> using [GitHub Secrets].

<figure>

Filename: .github/workflows/publish.yml

```yaml
name: "publish"
on:
  push:
    branches:
      - release

jobs:
  publish-tauri:
    strategy:
      fail-fast: false
      matrix:
        platform: [macos-latest]

    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v2
      - name: setup node
        uses: actions/setup-node@v2
        with:
          node-version: 12
      - name: install Rust stable
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      - name: install app dependencies
        run: yarn
      - uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          ENABLE_CODE_SIGNING: ${{ secrets.APPLE_CERTIFICATE }}
          APPLE_CERTIFICATE: ${{ secrets.APPLE_CERTIFICATE }}
          APPLE_CERTIFICATE_PASSWORD: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}
          APPLE_SIGNING_IDENTITY: ${{ secrets.APPLE_SIGNING_IDENTITY }}
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_PASSWORD: ${{ secrets.APPLE_PASSWORD }}
        with:
          tagName: app-v__VERSION__ # the action automatically replaces \_\_VERSION\_\_ with the app version
          releaseName: "App v__VERSION__"
          releaseBody: "See the assets to download this version and install."
          releaseDraft: true
          prerelease: false
```

<figcaption>Listing 4-TODO: A GitHub Action workflow that builds, signs, notarizes and publishes a Tauri application.</figcaption>
</figure>

## Submit Apps to the Mac App Store

After signing your application, you can now submit it to the Mac App Store. You
should make sure your app adheres to [Apple's
requirements][distribute an app through the app store].

### macOS Private APIs

If you have [`tauri.macOSPrivateApi`] enabled and make use of features like the
transparent background or developer tools in production builds, your app can't
be submitted to the Mac App Store.

### Entitlements

Depending on the features you have enabled, you may need to request additional
permissions by creating an [`entitlements.plist`] file. Use the
[`tauri.bundle.macos.entitlements`] property to include the file in your final
bundle.

#### Network access

Enable outgoing network connections to allow your app to connect to a server:

```xml
<key>com.apple.security.network.client</key>
<true/>
```

Enable incoming network connections to allow your app to open a network
listening socket:

```xml
<key>com.apple.security.network.server</key>
<true/>
```

[tauri-apps/tauri#592]: https://github.com/tauri-apps/tauri/issues/592
[create a certificate signing request]:
  https://help.apple.com/developer-account/#/devbfa00fef7
[certificates, ids & profiles page]:
  https://developer.apple.com/account/resources/certificates/list
[app-specific password]: https://support.apple.com/en-ca/HT204397
[users and access page]: https://appstoreconnect.apple.com/access/users
[github actions]: https://github.com/features/actions
[tauri action]: https://github.com/tauri-apps/tauri-action
[github secrets]: https://docs.github.com/en/actions/reference/encrypted-secrets
[apple developer program]: https://developer.apple.com/programs/
[gatekeeper]: https://support.apple.com/en-us/HT202491
[windows code signing]: windows.md#code-signing
[virtual machine]: ../development/vms.md
[distribute an app through the app store]:
  https://help.apple.com/xcode/mac/current/#/dev067853c94
[`tauri.macosprivateapi`]:
  https://tauri.studio/docs/api/config#tauri.macOSPrivateApi
[`entitlements.plist`]:
  https://developer.apple.com/documentation/bundleresources/entitlements
[`tauri.bundle.macos.entitlements`]:
  /docs/api/config/#tauri.bundle.macOS.entitlements
