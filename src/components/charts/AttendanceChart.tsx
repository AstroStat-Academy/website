import Plot from 'react-plotly.js';

interface SchoolBar {
  title: string;
  date: string;
  attendees: number;
}

interface Props {
  schools: SchoolBar[];
  highlightTitle?: string;
}

export default function AttendanceChart({ schools, highlightTitle }: Props) {
  const sorted = [...schools].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const colors = sorted.map((s) =>
    s.title === highlightTitle ? '#14b8a6' : '#3b82f6'
  );

  const labels = sorted.map((s) =>
    new Date(s.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  );

  return (
    <div className="bg-navy-800 border border-white/10 rounded-xl p-4 overflow-hidden">
      <Plot
        data={[
          {
            type: 'bar',
            x: labels,
            y: sorted.map((s) => s.attendees),
            text: sorted.map((s) => s.title),
            marker: { color: colors, opacity: 0.9 },
            hovertemplate:
              '<b>%{text}</b><br>Attendees: %{y}<extra></extra>',
          },
        ]}
        layout={{
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          font: { color: '#cbd5e1', family: 'Inter, system-ui, sans-serif', size: 13 },
          margin: { t: 20, r: 20, b: 50, l: 50 },
          xaxis: {
            gridcolor: 'rgba(255,255,255,0.07)',
            tickfont: { size: 12 },
          },
          yaxis: {
            title: { text: 'Attendees', font: { size: 12 } },
            gridcolor: 'rgba(255,255,255,0.07)',
          },
          bargap: 0.35,
        }}
        config={{ responsive: true, displayModeBar: false }}
        style={{ width: '100%', height: '300px' }}
      />
    </div>
  );
}
