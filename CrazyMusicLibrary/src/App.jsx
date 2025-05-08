import {Routes, Route} from 'react-router-dom';
import Layout from './pages/Layout';
import Home from './pages/Home';    
import Albums from './pages/Albums';
import Authentification from './pages/Authentification';
import AlbumView from './pages/AlbumView';
import ArtistsView from './pages/ArtistsView';
import ArtistView from './pages/ArtistView';
import './App.css';
import './assets/palette.svg'
import { AudioPlayerProvider } from './GlobalAudioProvider';
import NotFound from './pages/NotFound';
import Account from './pages/Account';
import Settings from './pages/Settings';
import AdminPannel from './pages/AdminPannel';
import Register from './components/Register';
import {GlobalActionBar as GlobalActionBarProvider} from './GlobalActionBar';
import GenreView from './pages/GenreView';
import GenresView from './pages/GenresView';
import PlaylistsView from './pages/PlaylistsView';
import { NotificationsProvider } from './GlobalNotificationsProvider';
import Cooking from './pages/Cooking';
function App() {


    return (
        <NotificationsProvider>
            <AudioPlayerProvider> {/* this is the context provider for the audio player, the authentification is not */ }
                <GlobalActionBarProvider>
                    <Routes>    
                        <Route path="/" element={<Authentification />} />
                        <Route path="register" element={<Register />} />
                        <Route element={<Layout />}>
                            <Route path='home' element={<Home />}/>
                            <Route path="albums" element={<Albums />}/>
                            <Route path="albums/:albumId" element={<AlbumView />}/>
                            <Route path="artists" element={<ArtistsView />} />
                            <Route path="artists/:artistId" element={<ArtistView />}/>
                            <Route path="genres" element={<GenresView/>}/>   
                            <Route path="genres/:genreId" element={<GenreView />} />
                            <Route path="playlists" element={<PlaylistsView/>}/>
                            <Route path="playlists/:playlistId" element={<AlbumView isPlaylist={true} />}/>
                            <Route path="cooking" element={<Cooking/>}/>
                        </Route>
                        <Route path="account" element={<Account />} /> 
                        <Route path="settings" element={<Settings />} /> 
                        <Route path="admin-pannel" element={<AdminPannel />} />
                        <Route path="*" element={<NotFound />} /> 
                    </Routes>  
                </GlobalActionBarProvider>
            </AudioPlayerProvider>
        </NotificationsProvider>
    );
}

export default App;