export interface ManualReplyInputProps {
  onSend: (body: string) => Promise<boolean>;
  sending: boolean;
}
