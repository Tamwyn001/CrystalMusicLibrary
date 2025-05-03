const ActionBarEntry = ({ entry, style,onClick}) => {

    return (
        <div className="action-bar-entry" style={style} onClick={() => {onClick(entry)}}>
            {entry.icon()}
            <span style={{flex : '1'}}> {entry.name}</span>
            {(entry.tooltip) ? entry.tooltip(entry.type) : null}
        </div>
    )
}

export default ActionBarEntry;