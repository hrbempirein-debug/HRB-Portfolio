interface SuggestedQuestionsProps {
  questions: string[]
  onPick: (question: string) => void
  disabled: boolean
}

/**
 * Contextual one-tap questions shown when a conversation starts. The set is
 * derived from the project/page the visitor is currently viewing.
 */
export function SuggestedQuestions({ questions, onPick, disabled }: SuggestedQuestionsProps) {
  return (
    <div>
      <p className="sr-only">Suggested questions</p>
      <div className="flex flex-wrap gap-2">
        {questions.map((question) => (
          <button
            key={question}
            type="button"
            disabled={disabled}
            onClick={() => onPick(question)}
            className="rounded-full border border-lite/15 bg-ink-soft/40 px-3.5 py-2 text-left text-[12px] leading-snug tracking-[-0.005em] text-mist transition-colors duration-200 hover:border-lite/40 hover:bg-ink-soft hover:text-paper disabled:cursor-default disabled:opacity-45"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  )
}