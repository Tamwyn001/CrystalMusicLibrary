import {Routes, Route} from 'react-router-dom';
import Layout from './pages/Layout.jsx';
import Home from './pages/Home.jsx';    
import Albums from './pages/Albums.jsx';
import Authentification from './pages/Authentification.jsx';
import AlbumView from './pages/AlbumView.jsx';
import ArtistsView from './pages/ArtistsView.jsx';
import ArtistView from './pages/ArtistView.jsx';
import './App.css';
import './assets/palette.svg'
import { AudioPlayerProvider } from './GlobalAudioProvider.jsx';
import NotFound from './pages/NotFound.jsx';
import Account from './pages/Account.jsx';
import Settings from './pages/Settings.jsx';
import AdminPannel from './pages/AdminPannel.jsx';
import Register from './components/Register.jsx';
import {GlobalActionBar as GlobalActionBarProvider} from './GlobalActionBar.jsx';
import GenreView from './pages/GenreView.jsx';
import GenresView from './pages/GenresView.jsx';
import PlaylistsView from './pages/PlaylistsView.jsx';
import { NotificationsProvider } from './GlobalNotificationsProvider.jsx';
import Cooking from './pages/Cooking.jsx';
import { EventProvider } from './GlobalEventProvider.jsx';
import Radio from './pages/Radio.jsx';
import './components/UIControls.css';
import RouteWithFFT from './pages/RouteWithFFT.jsx';
import FullScreenSong from './pages/FullScreenSong.jsx';
import { useScrollToggle } from './PageUsesScroll.jsx';
const App = () => {
    useScrollToggle(["/", "/register","/settings","/admin-pannel"]);

    return (
        <EventProvider>
            <NotificationsProvider>
                <AudioPlayerProvider> {/* this is the context provider for the audio player, the authentification is not */ }
                    <GlobalActionBarProvider>
                        <Routes>    
                            <Route path="/" element={<Authentification />} />
                            <Route path="register" element={<Register />} />
                            <Route element={<RouteWithFFT/>}>
                            <Route path="full-screen" element={<FullScreenSong/>}/>
                            </Route>
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
                                    <Route path="radio" element={<Radio/>}/>
                                </Route>
                                <Route path="account" element={<Account />} /> 
                                <Route path="settings" element={<Settings />} /> 
                                <Route path="admin-pannel" element={<AdminPannel />} />
                                <Route path="*" element={<NotFound />} /> 
                        </Routes>  
                    </GlobalActionBarProvider>
                </AudioPlayerProvider>
            </NotificationsProvider>
        </EventProvider>
    );
}

export default App;