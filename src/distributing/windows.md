# Windows Application Distribution

This guide provides information on code signing and uploading your app
to the Windows Store.

## Code Signing

Code signing your application lets users know that they downloaded the
official executable of your app and not some malware that poses as
your app. While it is not required, it improves users' confidence in
your app.

The following list walks you through the necessary steps to code-sign
a Windows application.

0. **Prerequisites**

   This guide assumes you run Windows, either on a physical machine or
   a [Virtual Machine] and that you already have a working Tauri
   application.

1. **Get a Code Signing Certificate**

   To sign your application, you need to acquire a **Code Signing
   certificate** from one of the [supported certificate authorities]
   like Digicert, Sectigo (formerly Comodo), or Godaddy.

   To eliminate all security prompts during installation, you need an
   extended validation (EV) code signing certificate. These
   certificates cost upwards of 400$ and require a hardware token.
   Depending on your country, they might also be sold to companies
   only.

2. **Create `.pfx` Certificate**

   You need a [PKCS 12] Certificate file to sign an executable,
   commonly called a PFX file. We will take the certificate file (e.g.
   `cert.cer`) and private key (e.g. `private-key.key`) you received
   from your certificate authority and convert them into a `.pfx`
   file. <br> Open a PowerShell prompt and enter the following
   command:

   ```powershell
   openssl pkcs12 -export -in cert.cer -inkey private-key.key -out certificate.pfx
   ```

   Make sure you don't forget the export password when prompted, we
   need it in the next step.

3. **Import Certificate**

   You now need to import your newly created `.pfx` certificate into
   the Windows Keystore. First, we need to store the export password
   you previously created into an environment variable. The securest
   option is the `Get-Credential` helper; Enter the following command
   in your PowerShell prompt:

   ```powershell
   $mypwd = Get-Credential `
            -UserName 'Enter password below' `
            -Message 'Enter password below'
   ```

   Next, you can use the `Import-PfxCertificate` command to actually
   import your `.pfx` file:

   ```powershell
   Import-PfxCertificate `
            -FilePath C:\certificate.pfx `
            -CertStoreLocation Cert:\LocalMachine\My `
            -Password $mypwd.Password
   ```

4. **Tauri Configuration**

   To configure Tauri for code signing we need to enter a few things
   into our `tauri.conf.json` file:

   - `certificateThumbprint` - The SHA-1 thumbprint of your
     certificate. Enter the following command and copy the values for
     `localKeyID` **without spaces**.

     ```powershell
     openssl pkcs12 -info -in certificate.pfx
     ```

     For this example output the `certificateThumbprint` is <br>
     `A1B1A2B2A3B3A4B4A5B5A6B6A7B7A8B8A9B9A0B0`.

     ```text
     Bag Attributes
         localKeyID: A1 B1 A2 B2 A3 B3 A4 B4 A5 B5 A6 B6 A7 B7 A8 B8 A9 B9 A0 B0
     ```

   - `digestAlgorithm` - The SHA digest algorithm used for your
     certificate. This is likely `sha256`.
   - `timestampUrl` - A URL pointing to a timestamp server used to
     verify the time the certificate is signed. It's best to provide
     the timestamp server provided by your certificate authority here.
   - `tsp` - Enables the _Time-Stamp Protocol_ (TSP, defined by [RFC
     3161]) instead of NTP. Some certificate authorities, like
     [SSL.com] only provide TSP servers.

   ```json
   "bundle": {
       "windows": {
               "certificateThumbprint": "A1B1A2B2A3B3A4B4A5B5A6B6A7B7A8B8A9B9A0B0",
               "digestAlgorithm": "sha256",
               "timestampUrl": "http://timestamp.comodoca.com",
               "tsp": false
       }
   }
   ```

5. **Sign your Application**

   Now you can run `tauri build` and you will see the following
   additional output:

   ```text
   info: signing app
   info: running signtool "C:\\Program Files (x86)\\Windows Kits\\10\\bin\\10.0.19041.0\\x64\\signtool.exe"
   info: Done Adding Additional Store
   Successfully signed: APPLICATION FILE PATH HERE
   ```

   And that's it! You have successfully signed your Tauri application!

## Continous Integration

As the above-described process is rather laborious, most developers
run this step as an automated part of their Continous Integration
(CI). For users of [GitHub Actions] Tauri provides the [Tauri Action],
which simplifies the setup.

> Note: The following example assumes you store the secret passwords
> and tokens using [GitHub Secrets].

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
        platform: [windows-latest]

    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v2
      - name: setup node
        uses: actions/setup-node@v1
        with:
          node-version: 12
      - name: install Rust stable
        uses: actions-rs/toolchain@v1
        with:
          toolchain: stable
      - name: import windows certificate
        env:
          WINDOWS_CERTIFICATE: ${{ secrets.WINDOWS_CERTIFICATE }}
          WINDOWS_CERTIFICATE_PASSWORD:
            ${{ secrets.WINDOWS_CERTIFICATE_PASSWORD }}
        run: |
          New-Item -ItemType directory -Path certificate
          Set-Content -Path certificate/tempCert.txt -Value $env:WINDOWS_CERTIFICATE
          certutil -decode certificate/tempCert.txt certificate/certificate.pfx
          Remove-Item -path certificate -include tempCert.txt
          Import-PfxCertificate `
              -FilePath certificate/certificate.pfx `
              -CertStoreLocation Cert:\LocalMachine\My `
              -Password (ConvertTo-SecureString -String $env:WINDOWS_CERTIFICATE_PASSWORD -Force -AsPlainText)
      - name: install app dependencies
        run: yarn
      - uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tagName: app-v__VERSION__ # the action automatically replaces \_\_VERSION\_\_ with the app version
          releaseName: "App v__VERSION__"
          releaseBody:
            "See the assets to download this version and install."
          releaseDraft: true
          prerelease: false
```

<figcaption>Listing 4-TODO: A GitHub Action workflow that builds, signs and publishes a Tauri application.</figcaption>
</figure>

## Submit Apps to the Windows Store

[pkcs 12]: https://en.wikipedia.org/wiki/PKCS_12
[rfc 3161]: https://datatracker.ietf.org/doc/html/rfc3161
[ssl.com]: https://www.ssl.com/
[github actions]: https://github.com/features/actions
[tauri action]: https://github.com/tauri-apps/tauri-action
[github secrets]:
  https://docs.github.com/en/actions/reference/encrypted-secrets
[supported certificate authorities]:
  https://docs.microsoft.com/en-us/windows-hardware/drivers/dashboard/get-a-code-signing-certificate#extended-validation-code-signing-certificates
[virtual machine]: ../development/vms.md
