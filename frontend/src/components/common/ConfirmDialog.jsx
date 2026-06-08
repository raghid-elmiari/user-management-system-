export const ConfirmDialog = ({ title, message, open, onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div className="confirm-dialog-backdrop">
      <div className="confirm-dialog-card">
        <h2>{title}</h2>
        <p>{message}</p>
        <div className="confirm-dialog-actions">
          <button type="button" onClick={onCancel}>Cancel</button>
          <button type="button" onClick={onConfirm}>Confirm</button>
        </div>
      </div>
    </div>
  );
};
