import type { ProfileDistribution } from '../../utils';

interface WhoAnsweredProfileProps {
  distributions: ProfileDistribution[];
  year: string;
}

function StackedBar({ segments }: { segments: ProfileDistribution['segments'] }) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  return (
    <div className="who-answered-bar" role="img" aria-hidden={total === 0}>
      {segments.map((segment) => (
        <div
          key={segment.label}
          className="who-answered-bar-segment"
          style={{
            width: `${total > 0 ? (segment.value / total) * 100 : 0}%`,
            backgroundColor: segment.color,
          }}
          title={`${segment.label}: ${segment.value.toFixed(1)}%`}
        />
      ))}
    </div>
  );
}

export function WhoAnsweredProfile({ distributions, year }: WhoAnsweredProfileProps) {
  if (distributions.length === 0) return null;

  return (
    <section className="who-answered-profile" aria-label="Who answered the survey">
      <div className="who-answered-profile-header">
        <h2 className="who-answered-profile-title">Who answered?</h2>
        <p className="who-answered-profile-subtitle">
          Respondent profile for {year} using approved Section 9 demographic fields.
        </p>
      </div>
      <div className="who-answered-profile-grid">
        {distributions.map((distribution) => (
          <article key={distribution.id} className="who-answered-card">
            <div className="who-answered-card-header">
              <h3 className="who-answered-card-title">{distribution.label}</h3>
              {distribution.sampleBase != null && (
                <span className="who-answered-card-base">n = {distribution.sampleBase}</span>
              )}
            </div>
            <StackedBar segments={distribution.segments} />
            <ul className="who-answered-legend">
              {distribution.segments.map((segment) => (
                <li key={segment.label} className="who-answered-legend-item">
                  <span className="who-answered-legend-swatch" style={{ backgroundColor: segment.color }} />
                  <span className="who-answered-legend-label">{segment.label}</span>
                  <span className="who-answered-legend-value">{segment.value.toFixed(1)}%</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
