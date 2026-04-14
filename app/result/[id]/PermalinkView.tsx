'use client';
import ResultView from '../../../components/ResultView';
import type { BlueprintResult } from '../../../lib/state';

interface Props {
  result: BlueprintResult;
  shareId: string;
}

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
