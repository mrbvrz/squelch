#!/usr/bin/env bash
set -e

echo "📻 Installing Squelch for macOS..."

ARCH=$(uname -m)
if [ "$ARCH" != "arm64" ]; then
    echo "⚠️  Note: Squelch is currently built for Apple Silicon (arm64). Running via Rosetta if on Intel."
fi

RELEASE_JSON=$(curl -s https://api.github.com/repos/mrbvrz/squelch/releases/latest)
DMG_URL=$(echo "$RELEASE_JSON" | grep -o 'https://[^"]*Squelch-[^"]*-arm64\.dmg' | head -n 1)

if [ -z "$DMG_URL" ]; then
    DMG_URL="https://github.com/mrbvrz/squelch/releases/download/v0.1.1/Squelch-0.1.1-arm64.dmg"
fi

TEMP_DMG="/tmp/Squelch-Install.dmg"
echo "⬇️  Downloading Squelch ($DMG_URL)..."
curl -L -# -o "$TEMP_DMG" "$DMG_URL"

echo "💿 Mounting DMG..."
MOUNT_DIR=$(mktemp -d -t squelch-mount)
hdiutil attach "$TEMP_DMG" -mountpoint "$MOUNT_DIR" -nobrowse -quiet

echo "📂 Installing to /Applications/Squelch.app..."
rm -rf /Applications/Squelch.app
cp -R "$MOUNT_DIR/Squelch.app" /Applications/

echo "🛡️  Clearing macOS quarantine attributes..."
xattr -cr /Applications/Squelch.app

echo "⏏️  Cleaning up installer..."
hdiutil detach "$MOUNT_DIR" -quiet || true
rm -f "$TEMP_DMG"

echo "✅ Squelch installed successfully to /Applications!"
echo "🚀 Launching Squelch in the menu bar..."
open /Applications/Squelch.app
