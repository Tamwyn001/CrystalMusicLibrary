import logo from '../assets/CML_logo.svg';

const Loading = ({text}) => {
    return (
        <div className="loading-container">
            <div className="loading-spinner">
                <img src={logo} alt="Loading..." />

            </div>
            <h1>{text}</h1>
            <p>Loading...</p>
        </div>
    );
}

export default Loading;