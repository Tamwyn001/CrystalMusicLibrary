import {Routes, Route} from 'react-router-dom';
import Layout from './pages/Layout';
import Home from './pages/Home';    
import Albums from './pages/Albums';
import Authentification from './pages/Authentification';
import AlbumView from './pages/AlbumView';
import './App.css';
import './assets/palette.svg'

function App() {
    
    return (
        <Routes>
            <Route path="/" element={<Authentification />} />
            <Route element={<Layout />}>
                <Route path='home' element={<Home />}/>
                <Route path="albums" element={<Albums />}/>
                <Route path="albums/:albumId" element={<AlbumView />}/>
            </Route>
        </Routes>
    );
}

export default App;