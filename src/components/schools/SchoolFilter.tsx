import { useState, useMemo } from 'react';

interface SchoolData {
  slug: string;
  title: string;
  date: string;
  endDate?: string;
  location: string;
  description: string;
  topics: string[];
  attendees?: number;
  tags: string[];
}

interface Props {
  schools: SchoolData[];
}

export default function SchoolFilter({ schools }: Props) {
  const [yearFilter, setYearFilter] = useState('all');
  const [topicFilter, setTopicFilter] = useState('all');

  const years = useMemo(() => {
    const set = new Set(schools.map((s) => new Date(s.date).getFullYear().toString()));
    return ['all', ...Array.from(set).sort().reverse()];
  }, [schools]);

  const topics = useMemo(() => {
    const set = new Set(schools.flatMap((s) => s.topics));
    return ['all', ...Array.from(set).sort()];
  }, [schools]);

  const filtered = useMemo(() => {
    return schools
      .filter(
        (s) =>
          yearFilter === 'all' ||
          new Date(s.date).getFullYear().toString() === yearFilter
      )
      .filter(
        (s) =>
          topicFilter === 'all' || s.topics.includes(topicFilter)
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [schools, yearFilter, topicFilter]);

  const selectClass =
    'bg-white/80 border border-ink/10 rounded-full px-4 py-2 text-sm text-ink shadow-sm focus:border-blue focus:outline-none focus:ring-2 focus:ring-blue/15 transition-colors dark:border-white/15 dark:bg-white/10 dark:text-bone';

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div className="flex flex-col gap-1">
          <label htmlFor="year-filter" className="text-xs text-ink/55 uppercase tracking-wider dark:text-bone/55">Year</label>
          <select
            id="year-filter"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className={selectClass}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y === 'all' ? 'All years' : y}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="topic-filter" className="text-xs text-ink/55 uppercase tracking-wider dark:text-bone/55">Topic</label>
          <select
            id="topic-filter"
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
            className={selectClass}
          >
            {topics.map((t) => (
              <option key={t} value={t}>
                {t === 'all' ? 'All topics' : t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Result count */}
      <p className="text-ink/50 text-sm mb-6 dark:text-bone/50">
        {filtered.length} school{filtered.length !== 1 ? 's' : ''} found
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="text-center text-ink/55 py-20 dark:text-bone/55">No schools match your filters.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((school) => {
            const date = new Date(school.date);
            const isPast = new Date(school.endDate ?? school.date) < new Date();
            return (
              <a
                key={school.slug}
                href={`/schools/${school.slug}`}
                className="group flex flex-col rounded-2xl border border-ink/10 bg-gradient-to-br from-white/85 via-bone to-blue/5 p-6 shadow-[0_16px_40px_rgba(4,101,173,0.08)] transition-all hover:-translate-y-0.5 hover:border-blue/30 hover:shadow-[0_18px_45px_rgba(4,101,173,0.14)] dark:border-white/10 dark:from-white/10 dark:via-ink dark:to-blue/10 dark:shadow-[0_16px_40px_rgba(4,101,173,0.16)]"
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      isPast
                        ? 'bg-ink/5 text-ink/55 border border-ink/10 dark:bg-white/10 dark:text-bone/55 dark:border-white/10'
                        : 'bg-blue/10 text-blue border border-blue/20'
                    }`}
                  >
                    {isPast ? 'Past' : 'Upcoming'}
                  </span>
                  <span className="text-ink/55 text-xs dark:text-bone/55">
                    {date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                  </span>
                </div>
                <h3 className="text-base font-bold mb-1 text-ink group-hover:text-blue transition-colors leading-snug dark:text-bone dark:group-hover:text-bone">
                  {school.title}
                </h3>
                <p className="text-ink/55 text-sm mb-3 dark:text-bone/55">{school.location}</p>
                <p className="text-ink/70 text-sm leading-relaxed line-clamp-3 flex-1 dark:text-bone/70">
                  {school.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {school.topics.slice(0, 3).map((topic) => (
                    <span
                      key={topic}
                      className="text-xs bg-white/70 text-ink/65 border border-ink/10 px-2 py-0.5 rounded-full dark:border-white/10 dark:bg-white/10 dark:text-bone/65"
                    >
                      {topic}
                    </span>
                  ))}
                  {school.topics.length > 3 && (
                    <span className="text-xs text-ink/45 dark:text-bone/45">
                      +{school.topics.length - 3} more
                    </span>
                  )}
                </div>
                {school.attendees && (
                  <p className="text-xs text-ink/45 mt-3 dark:text-bone/45">{school.attendees} attendees</p>
                )}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
