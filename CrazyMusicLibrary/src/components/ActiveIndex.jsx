import { memo } from 'react';
import './ActiveIndex.css';



// Single index button
const Index = memo(({ id, isActive, setActive, contextName }) => {
    return (
      <div
        className={`index`}
        id={`${contextName}-index_${id}`}
        onClick={() => setActive(id)}
        data-active = {isActive ? "active" : ""}
        data-clickable={setActive ? true : false}
      />
    );
  }, (prev, next) => 
    prev.id === next.id &&
    prev.isActive === next.isActive &&
    prev.contextName === next.contextName
  );
/**
 * Form for user login
 * @param {context} object An object with name and length properties
 * @param {active} number Shows if form submitting is in progress
 * @param {setActive} function Form submit callback function
 */

const ActiveIndex = ({context, active, setActive}) => {

    return <div className={`activeIndex-container ${context.name}`}>
      {Array.from({ length: context.length }, (_, i) => (
        <Index
          key={i}
          id={i}
          isActive={active === i}
          setActive={setActive}
          contextName={context.name}
        />
      ))}
    </div>
}

export default ActiveIndex;