const CookingTagEntry = ({tag, onClick}) => {
    return(<div onClick={onClick(tag.id)}>
        {tag.name}
    </div>)
}

export default CookingTagEntry;