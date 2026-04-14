'use client';
import ResultView from '../../../components/ResultView';
import type { BlueprintResult } from '../../../lib/state';

interface Props {
  result: BlueprintResult;
  shareId: string;
}

// Thin client wrapper — receives SSR-fetched data from the server component,
// renders the full interactive ResultView in read-only mode.
export default function PermalinkView({ result, shareId }: Props) {
  return (
    <ResultView
      result={result}
      answers={{}}
      questions={[]}
      isReadOnly={true}
      shareId={shareId}
    />
  );
}
