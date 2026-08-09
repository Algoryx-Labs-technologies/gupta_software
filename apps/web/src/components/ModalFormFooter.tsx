import { Button } from './Button';

interface ModalFormFooterProps {
  onCancel: () => void;
  /** Optional click handler when the footer is not inside a Modal `onSubmit` form. */
  onSubmit?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
}

export function ModalFormFooter({
  onCancel,
  onSubmit,
  submitLabel = 'Create',
  cancelLabel = 'Cancel',
  loading,
}: ModalFormFooterProps) {
  return (
    <div className="flex justify-end gap-3">
      <Button type="button" variant="cancel" onClick={onCancel}>
        {cancelLabel}
      </Button>
      <Button
        type={onSubmit ? 'button' : 'submit'}
        variant="success"
        loading={loading}
        onClick={onSubmit}
      >
        {submitLabel}
      </Button>
    </div>
  );
}
