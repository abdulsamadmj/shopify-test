import { BlockStack, Modal, Text } from "@shopify/polaris";

export type ConfirmAlertDialogProps = {
  open: boolean;
  title: string;
  message: string;
  /** Primary button label (default: Remove). */
  confirmLabel?: string;
  cancelLabel?: string;
  /** Use critical styling on the primary action (default: true). */
  destructive?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export function ConfirmAlertDialog({
  open,
  title,
  message,
  confirmLabel = "Remove",
  cancelLabel = "Cancel",
  destructive = true,
  onClose,
  onConfirm,
}: ConfirmAlertDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="small"
      primaryAction={{
        content: confirmLabel,
        destructive,
        onAction: () => {
          onConfirm();
          onClose();
        },
      }}
      secondaryActions={[
        {
          content: cancelLabel,
          onAction: onClose,
        },
      ]}
    >
      <Modal.Section>
        <BlockStack gap="200">
          <Text as="p" variant="bodyMd">
            {message}
          </Text>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}
