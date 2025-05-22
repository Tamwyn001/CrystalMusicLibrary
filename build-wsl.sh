# 2025 Arto Steffan - Crystal Music Librarry Sub-compilation script for Linux WSL

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

cd "/mnt/c/Users/Tamwyn/Documents/Projets Perso/CrasyMusicLibrary/backend"

echo "Starting pkg build..."
pkg -t node22-linux-x64 -o ../pkg-dist/linux/crystal-music-library-linux-x64 . 
echo "Build finished."