<p align="center">
    <img src="CrazyMusicLibrary\src\assets\logo.svg"  alt="drawing"  width="200"/>
<p>
<h1 align="center">Crystal Music Library</h3>
<h3 align="center">Self-hosted music library.</h3>


![alt text](./GitBanner_trans.png "The Crystal Music Library is hosted on your laptop, and avaliable in the local network.")

## What the Crystal Music Library is
<p align="center">
<img src="HowTo.png"  alt="drawing"  width="600"/>
</p>

## Setup
1. Download the executables from the latest release [here](https://github.com/Tamwyn001/CrystalMusicLibrary/releases/tag/v1.0.0).
2. Unzip the files to a folder.
3. Open the ```.env``` file and set the variables:
   
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

5. Run the ```crystal-music.library.exe``` file on Windows or similar for other OS.
6. Once the server is running, an IP will be printed, open it in the browser, or on your mobile phone.


## Use
1. Each time you want to use, you need to run the executable and open the address.
2. First you will need to register, but later you can just log in.
3. Add some music with the button ```+```, in the top right corner.
4. After uploading, refresh the page. 


## User system
If you want to share this with your local network, just register new users, when these open the link.

## Roadmap
- **v2.0.0**: 💿 Playlists (tagging), genres, edit albums, search-bar
- **v3.0.0**: 🛠️ Relocate songs, cross-fading, internet radio
- **v4.0.0**: 📈 Library graph, complex song use analysis
