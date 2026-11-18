import { useEffect, useRef, useState } from 'react';

import type { PlayerSettings } from '../graphql';

type SettingsDialogProps = {
  open: boolean;
  settings: PlayerSettings;
  onSave: (settings: PlayerSettings) => void;
  onClose: () => void;
};

// Changes are kept in a draft until Save is clicked. Closing the dialog any
// other way (Esc, clicking the backdrop) discards them.
export default function SettingsDialog({ open, settings, onSave, onClose }: SettingsDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState(settings);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && !dialog?.open) {
      // Start from the saved settings each time the dialog opens.
      setDraft(settings);
      dialog?.showModal();
    } else if (!open && dialog?.open) {
      dialog.close();
    }
  }, [open, settings]);

  function onSaveClick() {
    onSave(draft);
    onClose();
  }

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box text-left">
        <h2 className="mb-4 text-lg font-bold">Settings</h2>
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            className="checkbox"
            checked={draft.displayLegalMoves}
            onChange={(event) => setDraft({ ...draft, displayLegalMoves: event.target.checked })}
          />
          <span>Display legal moves on board</span>
        </label>
        <div className="modal-action">
          <button type="button" className="btn btn-primary" onClick={onSaveClick}>
            Save
          </button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit" aria-label="Close settings">close</button>
      </form>
    </dialog>
  );
}
