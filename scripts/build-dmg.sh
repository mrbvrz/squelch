#!/usr/bin/env bash
set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

VERSION=$(node -p "require('./package.json').version")
SRC_APP="src-tauri/target/release/bundle/macos/Squelch.app"
BG_IMAGE="src-tauri/icons/dmg-background.png"
OUTPUT_DIR="src-tauri/target/release/bundle/dmg"
DMG_NAME="Squelch-${VERSION}-arm64.dmg"
FINAL_DMG="${OUTPUT_DIR}/${DMG_NAME}"

# 1. Ensure background image exists
if [ ! -f "$BG_IMAGE" ]; then
    echo "Generating DMG background image..."
    npx tsx scripts/generate-dmg-background.ts
fi

# 2. Ensure Squelch.app exists
if [ ! -d "$SRC_APP" ] || [ "${FORCE_BUILD:-0}" = "1" ]; then
    echo "Building release bundle first..."
    npm run tauri:build
fi

# 2.5 Clean obsolete LSRequiresCarbon from Info.plist if present
if [ -f "$SRC_APP/Contents/Info.plist" ]; then
    plutil -remove LSRequiresCarbon "$SRC_APP/Contents/Info.plist" 2>/dev/null || true
fi

# 3. Code-sign Squelch.app ad-hoc
echo "Ad-hoc code signing Squelch.app..."
codesign --force --deep --sign - "$SRC_APP"

mkdir -p "$OUTPUT_DIR"
rm -f "$FINAL_DMG"

# 4. Check if create-dmg is installed
if command -v create-dmg &>/dev/null; then
    echo "Creating styled DMG with create-dmg..."
    
    STAGING_DIR="$(mktemp -d /tmp/squelch-dmg-staging.XXXXXX)"
    cp -R "$SRC_APP" "$STAGING_DIR/"
    
    create-dmg \
      --volname "Squelch" \
      --volicon "src-tauri/icons/icon.icns" \
      --background "$BG_IMAGE" \
      --window-pos 400 200 \
      --window-size 660 400 \
      --icon-size 128 \
      --text-size 12 \
      --icon "Squelch.app" 180 190 \
      --app-drop-link 480 190 \
      --hide-extension "Squelch.app" \
      --no-strip \
      "$FINAL_DMG" \
      "$STAGING_DIR" || true

    rm -rf "$STAGING_DIR"
fi

# 5. Fallback if create-dmg was not available or had issue
if [ ! -f "$FINAL_DMG" ]; then
    echo "Creating DMG via hdiutil makehybrid & convert..."
    STAGING_DIR="$(mktemp -d /tmp/squelch-dmg-staging.XXXXXX)"
    ROOT_DIR="$STAGING_DIR/root"
    mkdir -p "$ROOT_DIR"
    cp -R "$SRC_APP" "$ROOT_DIR/"
    ln -s /Applications "$ROOT_DIR/Applications"
    mkdir -p "$ROOT_DIR/.background"
    cp "$BG_IMAGE" "$ROOT_DIR/.background/background.png"
    
    UNCOMPRESSED_DMG="$STAGING_DIR/uncompressed.dmg"
    hdiutil makehybrid -hfs -hfs-volume-name "Squelch" -o "$UNCOMPRESSED_DMG" "$ROOT_DIR"
    hdiutil convert "$UNCOMPRESSED_DMG" -format UDZO -o "$FINAL_DMG"
    rm -rf "$STAGING_DIR"
fi

if [ -f "$FINAL_DMG" ]; then
    echo "✅ Successfully created Squelch DMG at: $FINAL_DMG"
else
    echo "⚠️ Note: DMG packaging requires standard interactive macOS user session."
fi
