import { useState, memo } from 'react';
import type { ChartPoint } from '../../types';
import DashboardChartCard from './DashboardChartCard';

const PAGE_SIZE = 18;

interface DashboardSectionProps {
  title: string;
  metrics: string[];
  metricData: Record<string, ChartPoint[]>;
  highlightX: string | number | null;
  keyOffset: number;
}

export default memo(function DashboardSection({
  title,
  metrics,
  metricData,
  highlightX,
  keyOffset,
}: DashboardSectionProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [page, setPage] = useState(0);

  const total = metrics.length;
  const pageCount = Math.ceil(total / PAGE_SIZE);
  const start = page * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, total);
  const pageMetrics = metrics.slice(start, end);
  const showPagination = total > PAGE_SIZE;

  return (
    <div style={{ marginBottom: 16 }}>
      <button
        onClick={() => setCollapsed((c) => !c)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: '100%',
          background: 'var(--color-background-primary, #fff)',
          border: '1px solid var(--color-border-tertiary, #e2e8f0)',
          borderRadius: 6,
          padding: '8px 12px',
          cursor: 'pointer',
          fontSize: 12,
          fontWeight: 700,
          color: 'var(--color-text-primary, #0f172a)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            transition: 'transform 0.15s',
            transform: collapsed ? 'rotate(-90deg)' : 'rotate(0)',
            fontSize: 10,
          }}
        >
          ▼
        </span>
        {title}
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 11,
            fontWeight: 400,
            color: 'var(--color-text-secondary, #64748b)',
            textTransform: 'none',
            letterSpacing: 'normal',
          }}
        >
          {showPagination ? `${start + 1}-${end} of ${total}` : `${total}`}
        </span>
      </button>

      {!collapsed && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 12,
              marginTop: 10,
            }}
          >
            {pageMetrics.map((key, i) => {
              const pts = metricData[key];
              if (!pts) return null;
              return (
                <DashboardChartCard
                  key={key}
                  metricKey={key}
                  points={pts}
                  highlightX={highlightX}
                  colorIndex={keyOffset + start + i}
                />
              );
            })}
          </div>

          {showPagination && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                marginTop: 8,
              }}
            >
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                style={{
                  padding: '4px 12px',
                  fontSize: 11,
                  border: '1px solid var(--color-border-tertiary, #e2e8f0)',
                  borderRadius: 4,
                  background: 'var(--color-background-primary, #fff)',
                  color: 'var(--color-text-primary, #0f172a)',
                  cursor: page === 0 ? 'default' : 'pointer',
                  opacity: page === 0 ? 0.4 : 1,
                }}
              >
                Prev
              </button>
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--color-text-secondary, #64748b)',
                }}
              >
                Page {page + 1} of {pageCount}
              </span>
              <button
                disabled={page >= pageCount - 1}
                onClick={() => setPage((p) => p + 1)}
                style={{
                  padding: '4px 12px',
                  fontSize: 11,
                  border: '1px solid var(--color-border-tertiary, #e2e8f0)',
                  borderRadius: 4,
                  background: 'var(--color-background-primary, #fff)',
                  color: 'var(--color-text-primary, #0f172a)',
                  cursor: page >= pageCount - 1 ? 'default' : 'pointer',
                  opacity: page >= pageCount - 1 ? 0.4 : 1,
                }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
});
