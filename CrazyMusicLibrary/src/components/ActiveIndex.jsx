import './ActiveIndex.css';


/**
 * Form for user login
 * @param {context} object An object with name and length properties
 * @param {active} number Shows if form submitting is in progress
 * @param {setActive} function Form submit callback function
 */

const ActiveIndex = ({context, active, setActive}) => {
    const index = (id) => {
        const isActive = (active === id) ? "active" : "";
        return (
            <div className="index" id={context.name + "-index_" + id} key={id} onClick={() => setActive(id)} active={isActive}/>
            )
    }
    let indecies = [];
    for (let i = 0; i < context.length; i++) {
        indecies.push(index(i));
    }
    return (
        <div className={"activeIndex-container " + context.name}>
            {indecies}
        </div>
    )
}

export default ActiveIndex;