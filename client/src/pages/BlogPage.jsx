import { useEffect, useMemo, useState } from 'react';
import { apiGet } from '../services/api.js';

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const formatDate = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

const defaultFilters = { year: '', month: '' };

export default function BlogPage() {
  const [posts, setPosts] = useState([]);
  const [archive, setArchive] = useState([]);
  const [sourceLink, setSourceLink] = useState('https://phxwaitroom.blogspot.com/');
  const [filters, setFilters] = useState(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    apiGet('/api/blog/posts')
      .then((payload) => {
        if (!isMounted) {
          return;
        }
        setPosts(payload.posts || []);
        setArchive(payload.archive || []);
        if (payload.source?.link) {
          setSourceLink(payload.source.link);
        }
        setError('');
      })
      .catch((err) => {
        if (!isMounted) {
          return;
        }
        setError(err.message || 'Unable to load the blog right now.');
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredPosts = useMemo(() => {
    if (!filters.year && !filters.month) {
      return posts;
    }
    return posts.filter((post) => {
      if (!post.publishedAt) return false;
      const postDate = new Date(post.publishedAt);
      if (Number.isNaN(postDate.getTime())) return false;
      if (filters.year && postDate.getFullYear().toString() !== filters.year) {
        return false;
      }
      if (filters.month && (postDate.getMonth() + 1).toString() !== filters.month) {
        return false;
      }
      return true;
    });
  }, [posts, filters]);

  const groupedByYear = useMemo(() => {
    return filteredPosts.reduce((acc, post) => {
      if (!post.publishedAt) {
        return acc;
      }
      const postYear = post.year || new Date(post.publishedAt).getFullYear();
      if (!postYear) {
        return acc;
      }
      const list = acc.get(postYear) || [];
      list.push(post);
      acc.set(postYear, list);
      return acc;
    }, new Map());
  }, [filteredPosts]);

  const orderedYears = useMemo(
    () => Array.from(groupedByYear.keys()).sort((a, b) => Number(b) - Number(a)),
    [groupedByYear]
  );

  const handleArchiveClick = (year, month) => {
    setFilters({
      year: year?.toString() || '',
      month: month?.toString() || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
  };

  const renderPostCard = (post) => (
    <article key={post.id} className="blog-post-card">
      <div className="blog-post-meta">
        <p className="pill">{formatDate(post.publishedAt)}</p>
        {post.labels?.length ? (
          <div className="blog-tags">
            {post.labels.map((label) => (
              <span key={label} className="blog-tag">
                {label}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="blog-post-body">
        <div>
          <h3>{post.title}</h3>
          {post.thumbnail ? (
            <div className="blog-post-media">
              <img src={post.thumbnail} alt="" loading="lazy" />
            </div>
          ) : null}
          <p className="muted">{post.summary}</p>
        </div>
        <div className="blog-post-actions">
          <a className="ghost-btn" href={post.link || sourceLink} target="_blank" rel="noreferrer">
            Read on the blog ↗
          </a>
        </div>
      </div>
    </article>
  );

  return (
    <section className="section-card blog-page">
      <div className="hero">
        <div>
          <p className="badge">Family archive</p>
          <h2>
            Regina&rsquo;s blog chronicles our family since 2008. Browse every milestone without ever leaving this site.
          </h2>
          <p>
            These posts are pulled straight from <em>The Wait Room</em>, so you can explore by year, relive monthly updates,
            and jump out to the original blog whenever you want screenshots, comments, or the full context.
          </p>
          <div className="hero-cta">
            <a className="primary-btn" href={sourceLink} target="_blank" rel="noreferrer">
              Visit the full blog ↗
            </a>
            {filters.year || filters.month ? (
              <button type="button" className="ghost-btn" onClick={clearFilters}>
                Clear filters
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="blog-layout">
        <aside className="blog-sidebar">
          <div className="archive-card">
            <div className="archive-header">
              <strong>Browse by year</strong>
              <p className="muted">Tap any year or month to narrow the feed.</p>
            </div>
            <div className="archive-list">
              {archive.length ? (
                archive.map((bucket) => (
                  <div key={bucket.year} className="archive-year">
                    <button
                      type="button"
                      className={`archive-year-btn${
                        filters.year === bucket.year.toString() && !filters.month ? ' active' : ''
                      }`}
                      onClick={() => handleArchiveClick(bucket.year)}
                    >
                      <span>{bucket.year}</span>
                      <span className="muted">{bucket.total} posts</span>
                    </button>
                    {bucket.months?.length ? (
                      <div className="archive-months">
                        {bucket.months.map((month) => (
                          <button
                            type="button"
                            key={`${bucket.year}-${month.month}`}
                            className={`archive-month-btn${
                              filters.year === bucket.year.toString() &&
                              filters.month === month.month.toString()
                                ? ' active'
                                : ''
                            }`}
                            onClick={() => handleArchiveClick(bucket.year, month.month)}
                          >
                            <span>{month.label}</span>
                            <span className="muted">{month.count}</span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="muted" style={{ margin: 0 }}>
                  No archive data yet.
                </p>
              )}
            </div>
          </div>
        </aside>

        <div className="blog-feed">
          {error ? <p className="status-message error">{error}</p> : null}
          {loading ? (
            <div className="blog-loading">
              <div className="search-loading" />
              <p className="muted">Loading posts…</p>
            </div>
          ) : null}

          {!loading && !filteredPosts.length ? (
            <div className="empty-state">
              <p className="muted">
                No posts match that filter yet. Try another year or clear the filters to see the full history.
              </p>
            </div>
          ) : null}

          {orderedYears.map((year) => (
            <div key={year} className="blog-year-group">
              <h3 className="blog-year-heading">{year}</h3>
              <div className="blog-year-feed">
                {groupedByYear.get(year)?.map((post) => renderPostCard(post))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

