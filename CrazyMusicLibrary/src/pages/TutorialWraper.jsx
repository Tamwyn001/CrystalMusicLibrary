import './Tutorial.css'
import CookingTuto from './TutorialCooking.jsx';
import GenresTuto from "./TutorialGenre.jsx";
export const TutorialKeys = {
    GENRES : "genres",
    COOKING : "cooking"
}



const tutorials = new Map();
tutorials.set(TutorialKeys.GENRES, GenresTuto);
tutorials.set(TutorialKeys.COOKING, CookingTuto);
export const TutorialWraper = ({tutorialKey = TutorialKeys.GENRES}) => {
    // Resolve the tutoral into a component
    const TutorialComponent = tutorials.get(tutorialKey) ?? (() => <div>Not found</div>);
    return <div className="page-overlay-blur">
        <TutorialComponent/>
    </div>
}

