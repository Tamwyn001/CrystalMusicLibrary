import { useNavigate } from "react-router-dom";
import "./NotFound.css";
const NotFound = () => {
    const navigation = useNavigate();
    const backHome = () => {
        navigation("/home");
    }
    return (
        <div className="not-found">
            <h1>Where did you land..?</h1>
            <p>The adress you gave is not defined, but you can go back to library:</p>
            <button className="btn" onClick={backHome}>Go back to library</button>
        </div>
    );
}

export default NotFound;