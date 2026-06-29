import { Button } from './Button';

interface ModalFormFooterProps {
  onCancel: () => void;
  onSubmit: () => void;
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
      <Button variant="cancel" onClick={onCancel}>
        {cancelLabel}
      </Button>
      <Button variant="success" loading={loading} onClick={onSubmit}>
        {submitLabel}
      </Button>
    </div>
  );
}
