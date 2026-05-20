# Build resources

Drop a custom Windows app icon here as `icon.ico` (256×256 recommended), then
add this line under `win:` in `../electron-builder.yml`:

```yaml
win:
  target:
    - nsis
  icon: build/icon.ico
```

If no icon is present, electron-builder uses the default Electron icon.
