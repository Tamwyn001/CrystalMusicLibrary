import { memo, useEffect, useState } from "react";

const TwoOptionSwitch =  memo(function ViewSwitcher ({currentActive, onClick, data})  {
    const [active, setCurrentActive] = useState(currentActive);

    useEffect(() => {
        setCurrentActive(currentActive);
    }, [currentActive]);

    const updateView = (val) => {
        setCurrentActive(val);
        onClick?.(val);
    };
    return (
        <div className="job-view-div">
            {data.map((label, index) => (
                <div  className="cornered-button"
                    key={index}
                    data-active={active === index}
                    onClick={() => {
                        updateView(index);
                    }}
                >
                    {label}
                </div>
            ))}
        </div>
    )
});

export default TwoOptionSwitch;