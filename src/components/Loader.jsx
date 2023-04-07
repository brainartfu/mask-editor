import { useStore } from "@/state/store";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";

const messages = {
  newCanvas: { loading: "Loading Canvas", loaded: "Canvas Loaded" },
  mainImage: { loading: "Loading Image", loaded: "Image Loaded" },
  state: { loading: "Loading State", loaded: "State Loaded" },
  merge: { loading: "Processing Image", loaded: "Image Processed" },
  applying: { loading: "Applying Changes", loaded: "Changes Applied" },
  cancelling: { loading: "Cancelling Changes", loaded: "Changes Cancelled" },
};

export function LoadingIndicator() {
  const [activeLoadState, setActiveLoadState] = useState(false);
  useEffect(() => {
    useStore.subscribe(
      (s) => s.loading,
      (loadState) => {
        let t = null;
        if (loadState) {
          setActiveLoadState(loadState);
          t = toast.loading(messages[loadState]?.loading, {
            id: "loading-indicator",
          });
        } else {
          setTimeout(() => {
            setActiveLoadState((loading) => {
              if (loading) {
                toast.dismiss(t);
                toast.success(messages[loading]?.loaded, {
                  id: "loading-indicator",
                });
              }
              return false;
            });
          }, 200);
        }
      }
    );
  }, []);
  return (
    activeLoadState && (
      <div className="absolute bg-white flex items-center justify-center z-loading-indicator inset-0 m-auto p-6 w-full h-full text-center text-sm bg-paper shadow-lg">
        <progress className="progress w-56"></progress>
      </div>
    )
  );
}
