type ReminderTemplatePreviewProps = {
  subject: string;
  body: string;
};

export function ReminderTemplatePreview({ subject, body }: ReminderTemplatePreviewProps) {
  return (
    <div className="min-w-0 space-y-3 rounded-md border border-zinc-200 p-3">
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Subject</div>
        <p className="mt-1 break-words text-sm text-zinc-900">{subject}</p>
      </div>
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Body</div>
        <div className="mt-1 overflow-x-hidden whitespace-pre-wrap break-words rounded-md bg-zinc-50 p-3 text-sm text-zinc-700 [&_a]:break-all">
          {body}
        </div>
      </div>
    </div>
  );
}
