## Hosting with nodeJs

If the installation step weren't successful, you can try using NodeJs on your side.

What is NodeJs : NodeJs is a program that allows to listens to tcp connections and serve files using middlewares like express etc.
This is the tool I use for my library on the development side, before packaging it into an executable.

## 1 Install Nvm : node version manager:
### Windows:
1. Install the binary for nvm https://github.com/coreybutler/nvm-windows/releases : file ` nvm-setup.exe `
2. Open it and go through the installation Wizard

### Linux and Mac-Os
1. Get the nvm install script from the official github repo and execute it with bash: 
```sh
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
# or
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
```
2. Update the Env variables: run this into the same terminal
```sh
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```
optional reload: ```source ~/.bashrc```


## 2 Get the source code:
Now you need the actual source code of the crazy music library:

### Windows
1. Download the source code from v2.0.0 from the GitHub repository.
https://github.com/Tamwyn001/CrystalMusicLibrary/archive/refs/tags/v2.0.0.zip
2. Extract it and keep only the ```backend``` folder
3. Rename the backend ```CrystalMusicLibrary``` and copy it in ```C:\ProgrammFiles```.
4. Open the folder and proceed to step 3.

### Linux and Mac-Os
1. Create a directly where you'd like to store the library code. As explained in
[README.md](https://github.com/Tamwyn001/CrystalMusicLibrary/tree/master?tab=readme-ov-file#setup), the actual datas can be stored somewhere else.
```sh
mkdir CrystalMusicLibrary
cd CrystalMusicLibrary
```
2. Downloads the source code from v2.0.0 and saves it under ```crystal-music-repo.zip```. `-L` follows redirects, as GitHub redirect to a DL link from this.
```sh 
 curl -L -o crystal-music-repo.zip https://github.com/Tamwyn001/CrystalMusicLibrary/archive/refs/tags/v2.0.0.zip
```
3. Extract it and keep only the ```backend``` folder
```sh
unzip ./crystal-music-repo.zip
mv CrystalMusicLibrary-* CrystalMusicLibUnziped
find CrystalMusicLibUnziped -mindepth 1 ! -wholename 'CrystalMusicLibUnziped/backend*' -exec rm -rf {} +
```
4. Move the content to ```CrystalMusicLibrary``` and delete zip related files.
```sh
cp -a ./CrystalMusicLibUnziped/backend/. ./
rm -r ./CrystalMusicLibUnziped
rm ./crystal-music-repo.zip
```

## 3 Install NodeJs with nvm:
This is common to all Os:
1. Install and use Node22:
```sh
nvm install 22
nvm use 22
```
2. Install the dependencies of the crystal music library. These are the third-party core functionalities of the app.
This will read the requirements in `package.json`
```
npm install
```
This might take some time.s
3. When finished you can fix potential issues between the packages
``` sh
npm audit fix
```

## 4 Run the library:
Before running consider setting up the ```.env``` file as explained in the main [README.md](https://github.com/Tamwyn001/CrystalMusicLibrary/tree/master?tab=readme-ov-file#setup)
1. Start a new terminal session in ```CrystalMusicLibrary``` or if already in one : ```cd .\CrystalMusicLibrary```
2. Start the node server with the source code entry point ```server.js```:
```sh
node server.js
```
This should mount the database and get your library to run!