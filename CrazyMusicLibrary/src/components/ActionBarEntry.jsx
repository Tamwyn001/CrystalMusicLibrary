const ActionBarEntry = ({ entry, style,onClick,className=""}) => {

    return (
        <div className={`action-bar-entry ${className}`} style={style} onClick={() => {onClick(entry);}}>
            {entry.icon()}
            <span style={{flex : '1'}}> {entry.name}</span>
            {(entry.tooltip) ? entry.tooltip(entry.type) : null}
        </div>
    )
}

export default ActionBarEntry;