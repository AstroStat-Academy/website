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
    'bg-navy-800 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:border-teal-400 focus:outline-none';

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div className="flex flex-col gap-1">
          <label htmlFor="year-filter" className="text-xs text-slate-400 uppercase tracking-wider">Year</label>
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
          <label htmlFor="topic-filter" className="text-xs text-slate-400 uppercase tracking-wider">Topic</label>
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
      <p className="text-slate-500 text-sm mb-6">
        {filtered.length} school{filtered.length !== 1 ? 's' : ''} found
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="text-center text-slate-400 py-20">No schools match your filters.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((school) => {
            const date = new Date(school.date);
            const isPast = new Date(school.endDate ?? school.date) < new Date();
            return (
              <a
                key={school.slug}
                href={`/schools/${school.slug}`}
                className="group flex flex-col bg-navy-800 border border-white/10 rounded-xl p-6 hover:border-teal-400/50 transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      isPast
                        ? 'bg-slate-700 text-slate-300'
                        : 'bg-teal-900/60 text-teal-400 border border-teal-400/30'
                    }`}
                  >
                    {isPast ? 'Past' : 'Upcoming'}
                  </span>
                  <span className="text-slate-400 text-xs">
                    {date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                  </span>
                </div>
                <h3 className="text-base font-bold mb-1 group-hover:text-teal-400 transition-colors leading-snug">
                  {school.title}
                </h3>
                <p className="text-slate-400 text-sm mb-3">{school.location}</p>
                <p className="text-slate-300 text-sm leading-relaxed line-clamp-3 flex-1">
                  {school.description}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {school.topics.slice(0, 3).map((topic) => (
                    <span
                      key={topic}
                      className="text-xs bg-navy-700 text-slate-300 px-2 py-0.5 rounded"
                    >
                      {topic}
                    </span>
                  ))}
                  {school.topics.length > 3 && (
                    <span className="text-xs text-slate-500">
                      +{school.topics.length - 3} more
                    </span>
                  )}
                </div>
                {school.attendees && (
                  <p className="text-xs text-slate-500 mt-3">{school.attendees} attendees</p>
                )}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
