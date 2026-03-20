import { CB, wColor, segRole, RV } from '../../constants/colors';
import type { TooltipData, TooltipPos, TokenChange } from '../../types';

function TtRow({ k, v, vc }: { k: string; v: string | number; vc?: string }) {
  return (
    <>
      <span style={{ color: '#94a3b8', fontWeight: 500 }}>{k}:</span>
      <span style={{ color: vc || '#f1f5f9', fontWeight: 600 }}>{v}</span>
    </>
  );
}

export { TtRow };

interface TooltipProps {
  data: TooltipData | null;
  pos: TooltipPos;
}

export default function Tooltip({ data, pos }: TooltipProps) {
  if (!data) return null;
  const left =
    typeof window !== 'undefined' ? Math.min(pos.x + 14, window.innerWidth - 400) : pos.x + 14;
  const top = typeof window !== 'undefined' ? Math.max(pos.y - 10, 8) : pos.y - 10;

  return (
    <div
      style={{
        position: 'fixed',
        left,
        top,
        background: '#0f172a',
        color: '#f1f5f9',
        borderRadius: 8,
        padding: '12px 16px',
        fontSize: 11,
        fontFamily: 'var(--font-mono)',
        zIndex: 9999,
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        border: '1px solid #334155',
        pointerEvents: 'none',
        maxWidth: 400,
        lineHeight: 1.6,
      }}
    >
      {data.type === 'segment' && (
        <>
          <div
            style={{
              fontWeight: 700,
              color: CB.cyan,
              marginBottom: 6,
              fontSize: 12,
              borderBottom: '1px solid #334155',
              paddingBottom: 4,
            }}
          >
            Segment: {data.tag || '—'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px' }}>
            <TtRow k="source" v={data.source || '?'} />
            <TtRow k="tokens" v={data.token_count ?? 0} />
            <TtRow
              k="status"
              v={data.masked ? '⊘ MASKED' : '✓ TRAINABLE'}
              vc={data.masked ? CB.red : CB.green}
            />
            <TtRow k="role" v={(RV[segRole(data as any)] || RV.other).lbl} vc={CB.yellow} />
            {data.text && (
              <TtRow k="preview" v={(data.text || '').substring(0, 100)} vc="#cbd5e1" />
            )}
          </div>
        </>
      )}
      {data.type === 'token' && (
        <>
          <div
            style={{
              fontWeight: 700,
              color: CB.cyan,
              marginBottom: 6,
              fontSize: 12,
              borderBottom: '1px solid #334155',
              paddingBottom: 4,
            }}
          >
            Token #{data.pos}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px' }}>
            <TtRow k="weight" v={(data.w ?? 0).toFixed(6)} vc={wColor(data.w)} />
            <TtRow k="proximity" v={`${((data.w / 3.6) * 100).toFixed(1)}%`} />
            {data.role && <TtRow k="role" v={data.role} vc={CB.yellow} />}
            {data.masked != null && (
              <TtRow
                k="training"
                v={data.masked ? '⊘ NOT USED' : '✓ IN LOSS'}
                vc={data.masked ? CB.red : CB.green}
              />
            )}
            {data.hasChange && <TtRow k="⚡ change" v="Click to lock detail" vc={CB.orange} />}
          </div>
        </>
      )}
      {data.type === 'change' && <ChangeTooltip c={data.c} />}
    </div>
  );
}

function ChangeTooltip({ c }: { c: TokenChange }) {
  return (
    <>
      <div
        style={{
          fontWeight: 700,
          color: CB.orange,
          marginBottom: 6,
          fontSize: 12,
          borderBottom: '1px solid #334155',
          paddingBottom: 4,
        }}
      >
        ⚡ Token Modification
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px' }}>
        <TtRow k="token_id" v={c.token_id} />
        <TtRow k="seg:ti" v={`${c.segment_index}:${c.token_index}`} />
        <TtRow k="before" v={(c.before_weight ?? 0).toFixed(6)} vc={CB.red} />
        <TtRow k="after" v={(c.after_weight ?? 0).toFixed(6)} vc={CB.green} />
        <TtRow k="multiplier" v={c.multiplier} vc={CB.yellow} />
        <TtRow k="eff_mult" v={(c.effective_multiplier ?? 0).toFixed(6)} vc={CB.orange} />
        <TtRow k="type" v={c.change_type || '—'} vc={CB.purple} />
        {c.match_reason && <TtRow k="reason" v={c.match_reason} vc={CB.cyan} />}
      </div>
      <div
        style={{
          marginTop: 8,
          padding: '4px 8px',
          borderRadius: 4,
          background: '#1e293b',
          fontSize: 10,
          color: '#cbd5e1',
          border: '1px dashed #475569',
          textAlign: 'center',
        }}
      >
        Δ = {((c.after_weight ?? 0) - (c.before_weight ?? 0)).toFixed(6)}
      </div>
    </>
  );
}
