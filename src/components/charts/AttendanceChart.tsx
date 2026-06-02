import Plot from 'react-plotly.js';
import { ui, palette } from '../../styles/tokens';
import { useEffect, useState } from 'react';

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
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const updateTheme = () => setIsDark(root.classList.contains('dark'));
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const sorted = [...schools].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const colors = sorted.map((s) =>
    s.title === highlightTitle ? ui.chartHighlight : palette.blue
  );

  const labels = sorted.map((s) =>
    new Date(s.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  );

  const chartText = isDark ? '#fbf6ec' : ui.chartText;
  const gridLine = isDark ? 'rgba(255, 255, 255, 0.10)' : ui.gridLine;

  return (
    <div className="rounded-2xl border border-ink/10 bg-gradient-to-br from-white/85 via-bone to-blue/5 p-4 overflow-hidden shadow-[0_16px_40px_rgba(4,101,173,0.08)] dark:border-white/10 dark:from-white/10 dark:via-ink dark:to-blue/10">
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
          font: { color: chartText, family: 'Inter, system-ui, sans-serif', size: 13 },
          margin: { t: 20, r: 20, b: 50, l: 50 },
          xaxis: {
            gridcolor: gridLine,
            tickfont: { size: 12 },
          },
          yaxis: {
            title: { text: 'Attendees', font: { size: 12 } },
            gridcolor: gridLine,
          },
          bargap: 0.35,
        }}
        config={{ responsive: true, displayModeBar: false }}
        style={{ width: '100%', height: '300px' }}
      />
    </div>
  );
}
