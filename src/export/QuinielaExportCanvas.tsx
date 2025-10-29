import { memo, type CSSProperties, useMemo } from 'react';
import AperturaJornada15 from '../imports/AperturaJornada15';
import { getJourneyHeader, getMatchesForJourney, type QuinielaSelections } from '../quiniela/config';
import { INLINE_QUINIELA_ASSETS } from '../quiniela/assets';

type ExportPlatform = 'ios' | 'android' | 'default';

type QuinielaExportCanvasProps = {
  selections: QuinielaSelections;
  participantName?: string | null;
  platform?: ExportPlatform;
  journey: number;
};

const noop = () => {};

const shouldShowDebugGrid = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }
  const params = new URLSearchParams(window.location.search);
  return params.get('grid') === '1';
};

export const QuinielaExportCanvas = memo(function QuinielaExportCanvas({
  selections,
  participantName,
  platform = 'default',
  journey,
}: QuinielaExportCanvasProps) {
  const nameOffset = platform === 'ios' ? '-10px' : platform === 'android' ? '-5px' : '-15px';
  const exportRootStyle: CSSProperties & Record<'--participant-name-offset', string> = {
    width: '1080px',
    height: '1080px',
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
    backgroundColor: '#fafaf9',
    pointerEvents: 'none',
    userSelect: 'none',
    isolation: 'isolate',
    '--participant-name-offset': nameOffset,
  };

  const matches = useMemo(() => getMatchesForJourney(journey), [journey]);
  const { seasonLabel, journeyTitle } = useMemo(() => getJourneyHeader(journey), [journey]);

  return (
    <div
      data-export-root
      data-export-platform={platform}
      className="export-canvas"
      style={exportRootStyle}
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
        showGrid={shouldShowDebugGrid()}
        matches={matches}
        seasonLabel={seasonLabel}
        journeyTitle={journeyTitle}
      />
    </div>
  );
});
