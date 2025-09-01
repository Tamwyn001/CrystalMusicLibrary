<p align="center">
    <img src="CrazyMusicLibrary\src\assets\logo.svg"  alt="drawing"  width="200"/>
<p>
<h1 align="center">Crystal Music Library</h3>
<h3 align="center">Self-hosted music library.</h3>


![alt text](./GitBanner_v3.0.0.png "The Crystal Music Library is hosted on your laptop, and avaliable in the local network.")

## What the Crystal Music Library is
<p align="center">
<img src="HowTo.png"  alt="drawing"  width="600"/>
</p>

## Gallery
I do not own any cover artwork there. All right go to their owners, showcase purpose.
 
![Gallery Image](https://github.com/Tamwyn001/CrystalMusicLibrary/blob/master/doc/Art_v3.0.0/Recent_white.png)
![Gallery Image](https://github.com/Tamwyn001/CrystalMusicLibrary/blob/master/doc/Art_v3.0.0/Album_white.png)
![Gallery Image](https://github.com/Tamwyn001/CrystalMusicLibrary/blob/master/doc/Art_v3.0.0/AlbumEdit_white.png)
![Gallery Image](https://github.com/Tamwyn001/CrystalMusicLibrary/blob/master/doc/Art_v3.0.0/Recent_black.png)
![Gallery Image](https://github.com/Tamwyn001/CrystalMusicLibrary/blob/master/doc/Art_v3.0.0/FullscreenMode.png)
![Gallery Image](https://github.com/Tamwyn001/CrystalMusicLibrary/blob/master/doc/Art_v3.0.0/Album_black.png)
![Gallery Image](https://github.com/Tamwyn001/CrystalMusicLibrary/blob/master/doc/Art_v3.0.0/AlbumEdit_black.png)
![Gallery Image](https://github.com/Tamwyn001/CrystalMusicLibrary/blob/master/doc/Art_v3.0.0/jobs.png)

<p float="left">
  <img src="doc/Art_v3.0.0/IMG_2695.png" width="300" />
  <img src="doc/Art_v3.0.0/IMG_2697.png" width="300" /> 
  <img src="doc/Art_v3.0.0/IMG_2698.png" width="300" />
</p>
<p float="left">
  <img src="doc/Art_v3.0.0/IMG_2700.png" width="300" />
<img src="doc/Art_v3.0.0/IMG_2702.png" width="300" /> 
    <img src="doc/Art_v3.0.0/093215FF-EEC5-402B-BB01-756144C16BDB.png" width="300" /> 
</p>
<p float="left">
  <img src="doc/Art_v3.0.0/449C84CB-E427-403E-BD92-A8C0F742F84C.png" width="300" />
<img src="doc/Art_v3.0.0/5430A52F-2681-4C0E-AA5A-6C8C447A3BD7.png" width="300" /> 
</p>


## Setup
Download the executables from the latest release [here](https://github.com/Tamwyn001/CrystalMusicLibrary/releases/latest).
* Note: using pm2 on Linux, you can deamonize the server.js file. To do this download pm2 using npm, (download npm with nvm). The needed folder is /backend from the root of the repo.
*  
| Windows | Linux | Mac-Os |
|---------|-------|--------|
| x64     | x64   | see [Host with NodeJs](/doc/buildFromSource.md)    |

1. Unzip the files to a folder.
2. Open the ```.env``` file and set the variables:
   
   It may be not visible at first. In Windows go under display > show hidden files.
   
   **Avoid spaces next to the = signs**
    ```env
    CML_DATA_PATH='./data'
    # Where the music files and the album covers are stored.
    # This can be a heavy directory the more music you add.
    # Default, just next the executable.
    ```
    ```env
    CML_DATABASE_PATH='./db'
    # Where the database files are stored. 
    # Less heavy, they just make some relations between the musics.
    # Default, just next the executable.
    ```
    
    ```env
   CML_PORT=4590
    # The port where the server will be hosted. Default is 4590. 
    ```

3. Run the ```crystal-music.library.exe``` file on Windows or similar for other OS.
4. **If this step fails:** see [Host with NodeJs](/doc/buildFromSource.md)
5. Once the server is running, an IP will be printed, open it in the browser, or on your mobile phone.


## Use
1. Each time you want to use, you need to run the executable and open the address.
2. First you will need to register, but later you can just log in.
3. Add some music with the button ```+```, in the top right corner.
4. After uploading, refresh the page. 


## User system
If you want to share this with your local network, just register new users, when these open the link.

## Roadmap
- ✔️**v1.0.0**: 🎺 Minimal proof of concept : play songs and add music.
- ✔️**v2.0.0**: 💿 Playlists (tagging), genres, edit albums, search-bar, relocate songs, cross-fading
- ✔️**v3.0.0**: 🛠️ Internet radio, tutorial, spectrogram
- **v4.0.0**: 🎤 Speech recognition model based lyrics generation and linking external filebase
- **v5.0.0**: 📈 Library graph, complex song use analysis
