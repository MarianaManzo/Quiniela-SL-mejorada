import { memo } from 'react';
import AperturaJornada15 from '../imports/AperturaJornada15';
import type { QuinielaSelections } from '../quiniela/config';
import { INLINE_QUINIELA_ASSETS } from '../quiniela/assets';

type QuinielaExportCanvasProps = {
  selections: QuinielaSelections;
  participantName?: string | null;
};

const noop = () => {};

export const QuinielaExportCanvas = memo(function QuinielaExportCanvas({
  selections,
  participantName,
}: QuinielaExportCanvasProps) {
  return (
    <div
      data-export-root
      className="export-canvas"
      style={{
        width: '1080px',
        height: '1080px',
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        backgroundColor: '#fafaf9',
        pointerEvents: 'none',
        userSelect: 'none',
        isolation: 'isolate',
      }}
    >
      <AperturaJornada15
        selections={selections}
        onSelect={noop}
        isReadOnly
        showSelectionErrors={false}
        participantName={participantName}
        assets={INLINE_QUINIELA_ASSETS}
        contentOffsetY={-8}
        layoutVariant="export"
      />
    </div>
  );
});
