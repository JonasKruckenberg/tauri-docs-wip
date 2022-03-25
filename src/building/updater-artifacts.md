# Updater Artifacts

The Tauri bundler automatically generates update artifacts if the updater is
enabled in `tauri.conf.json` Your update artifacts are automatically signed if
the bundler can locate your private and public key.

The signature can be found in the `sig` file. The signature can be uploaded to
GitHub safely or made public if your private key is secure.

### macOS

On macOS, Tauri creates a .tar.gz from the whole application. (.app)

```text
target/release/bundle
└── osx
    └── app.app
    └── app.app.tar.gz (update bundle)
    └── app.app.tar.gz.sig (if signature enabled)
```

### Windows

On Windows, Tauri creates a .zip from the MSI; when downloaded and validated, we
run the MSI install.

```text
target/release
└── app.x64.msi
└── app.x64.msi.zip (update bundle)
└── app.x64.msi.zip.sig (if signature enabled)
```

### Linux

On Linux, Tauri creates a .tar.gz from the AppImage.

```text
target/release/bundle
└── appimage
    └── app.AppImage
    └── app.AppImage.tar.gz (update bundle)
    └── app.AppImage.tar.gz.sig (if signature enabled)
```
