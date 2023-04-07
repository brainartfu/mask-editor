import { state, tools } from "@/state/utils";

export default function ImageToolbar() {
  // tools().transform.resetStraightenAnchor();
  return (
    <div>
      <div>
        <label htmlFor="rotate">Rotate</label>
        <br />
        <button
          onClick={() => {
            tools().transform.rotateLeft();
            state().setDirty(true);
          }}
          className="btn btn-primary"
        >
          Rotate Left
        </button>
        <button
          onClick={() => {
            tools().transform.rotateRight();
            state().setDirty(true);
          }}
          className="btn btn-primary"
        >
          Rotate Right
        </button>
      </div>
      <div>
        <label htmlFor="rotate">Flip</label>
        <br />
        <button
          onClick={() => {
            tools().transform.flip("horizontal");
            state().setDirty(true);
          }}
          className="btn btn-primary"
        >
          Flip Vertical
        </button>
        <button
          onClick={() => {
            tools().transform.flip("vertical");
            state().setDirty(true);
          }}
          className="btn btn-primary"
        >
          Flip Horizontal
        </button>
      </div>
    </div>
  );
}
