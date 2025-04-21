import { IconSquarePlus } from "@tabler/icons-react";

const AlbumAdd = ({addNewMusic})  => {
    return (
        <div className="album-card" context={"add"}>
            <IconSquarePlus strokeWidth={0.7} className="album-card-cover" onClick={addNewMusic}/>
        </div>
    )
}
export default AlbumAdd;
