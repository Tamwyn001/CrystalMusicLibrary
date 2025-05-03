import {Routes, Route} from 'react-router-dom';
import Layout from './pages/Layout';
import Home from './pages/Home';    
import Albums from './pages/Albums';
import Authentification from './pages/Authentification';
import AlbumView from './pages/AlbumView';
import Artist from './pages/Artist';
import ArtistView from './pages/ArtistView';
import './App.css';
import './assets/palette.svg'
import { AudioPlayerProvider } from './GlobalAudioProvider';
import NotFound from './pages/NotFound';
import Account from './pages/Account';
import Settings from './pages/Settings';
import AdminPannel from './pages/AdminPannel';
import Register from './components/Register';
import GlobalActionBar from './GlobalActionBar';
function App() {


    return (
        <AudioPlayerProvider> {/* this is the context provider for the audio player, the authentification is not */ }
            <GlobalActionBar>
                <Routes>    
                    <Route path="/" element={<Authentification />} />
                    <Route path="register" element={<Register />} />
                        <Route element={<Layout />}>
                            <Route path='home' element={<Home />}/>
                            <Route path="albums" element={<Albums />}/>
                            <Route path="albums/:albumId" element={<AlbumView />}/>
                            <Route path="artists" element={<Artist />} />
                            <Route path="artists/:artistId" element={<ArtistView />}/>
                        </Route>
                        <Route path="account" element={<Account />} /> 
                        <Route path="settings" element={<Settings />} /> 
                        <Route path="admin-pannel" element={<AdminPannel />} />
                        <Route path="*" element={<NotFound />} /> 
                </Routes>  
            </GlobalActionBar>
        </AudioPlayerProvider>
    );
}

export default App;