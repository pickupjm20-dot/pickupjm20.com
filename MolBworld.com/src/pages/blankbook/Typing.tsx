/** 내 타자 — 북 페이지의 칩 · 시트(등급 사다리 · 최고 · 오늘 · 14일 막대 · 최근 판)와 '다 풀었어요' 아래의 판 끝 카드. 값은 typing.ts만 센다. */
import { Dialog } from '../../components/Dialog';
import { cpmOf, nextRankAfter, RANKS, RECORD_MIN_KEYS, type TypingRound, type TypingStats } from '../../lib/blank/typing';

const cpmText = (v: number | null | undefined) => (v == null ? '—' : String(Math.round(v)));

export function TypingChip({ stats, onOpen }: { stats: TypingStats; onOpen: () => void }) {
  const label = stats.rank
    ? `${stats.rank.emoji} ${stats.rank.name} · ${cpmText(stats.totalCpm)}타`
    : stats.measuredRounds > 0
      ? `배치 중 · ${stats.placementLeft}판`
      : '내 타자';
  return (
    <button type="button" className="typing-chip" onClick={onOpen}>
      <span aria-hidden="true">⌨️</span> {label}
    </button>
  );
}

export function TypingSheet({ stats, onClose }: { stats: TypingStats; onClose: () => void }) {
  const max = Math.max(1, ...stats.days.map((d) => d.cpm ?? 0));
  const next = stats.totalCpm != null ? nextRankAfter(stats.totalCpm) : null;
  return (
    <Dialog title="내 타자" onClose={onClose} wide>
      <div className="typing">
        <div className="typing__now">
          <p className="typing__rank">
            {stats.rank ? (
              <>
                <span className="typing__emoji">{stats.rank.emoji}</span> {stats.rank.name}
              </>
            ) : stats.measuredRounds > 0 ? (
              `배치 중 · ${stats.placementLeft}판 더 치면 등급이 서요`
            ) : (
              '아직 잰 판이 없어요'
            )}
          </p>
          <p className="typing__total">
            총합 <b>{cpmText(stats.totalCpm)}</b>타/분
            {next && stats.totalCpm != null && (
              <span>
                {' '}
                · 다음 {next.emoji} {next.name}까지 {Math.ceil(next.min - stats.totalCpm)}타
              </span>
            )}
          </p>
        </div>
        <dl className="typing__cells">
          <div>
            <dt>최고 기록</dt>
            <dd>{stats.best ? `${cpmText(cpmOf(stats.best.keys, stats.best.typingMs))}타` : '—'}</dd>
          </div>
          <div>
            <dt>오늘</dt>
            <dd>{cpmText(stats.today)}타</dd>
          </div>
          <div>
            <dt>친 빈칸</dt>
            <dd>{stats.measuredAnswers}개</dd>
          </div>
        </dl>

        <p className="typing__label">최근 14일</p>
        <div className="typing__chart" role="img" aria-label="최근 14일 타자 속도">
          {stats.days.map((d) => (
            <span key={d.day} className="typing__bar" title={`${new Date(d.day).getMonth() + 1}/${new Date(d.day).getDate()} · ${cpmText(d.cpm)}타`}>
              <i style={{ height: `${d.cpm ? Math.max(6, (d.cpm / max) * 100) : 0}%` }} />
            </span>
          ))}
        </div>

        <p className="typing__label">등급</p>
        <ol className="typing__ladder">
          {RANKS.map((r) => (
            <li key={r.name} className={stats.rank?.name === r.name ? 'is-on' : ''}>
              <span>{r.emoji}</span> {r.name} <small>{r.min}타~</small>
            </li>
          ))}
        </ol>

        {stats.recent.length > 0 && (
          <>
            <p className="typing__label">최근 판</p>
            <ul className="typing__recent">
              {stats.recent.map((r) => (
                <li key={r.id}>
                  <span>{new Date(r.at).toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' })}</span>
                  <span>
                    {r.correct}/{r.answers} 맞힘
                  </span>
                  <b>{cpmText(cpmOf(r.keys, r.typingMs))}타</b>
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="typing__note">
          타수는 빈칸에 첫 글자를 친 때부터 낼 때까지, 맞힌 답만 세요(한컴 타자처럼 자판 누른 수 · 겹모음 · 겹받침은 2타). 최고 기록은{' '}
          {RECORD_MIN_KEYS}타 넘게 잰 판에서, 등급은 모든 판을 합친 총합 타수로 정해요.
        </p>
      </div>
    </Dialog>
  );
}

/** 판 끝 — 이번 판 타수 · 최고 기록 갱신 · 첫 등급 / 등급이 올랐어요 · 다음 등급까지. */
export function RoundEnd({ row, before, after }: { row: TypingRound | null; before: TypingStats; after: TypingStats }) {
  const cpm = row ? cpmOf(row.keys, row.typingMs) : null;
  const record = row != null && after.best?.id === row.id && before.best?.id !== row.id;
  const firstRank = !before.rank && after.rank;
  const rankUp = before.rank && after.rank && after.rank.min > before.rank.min;
  const next = after.totalCpm != null ? nextRankAfter(after.totalCpm) : null;
  return (
    <div className="round-end">
      <p className="round-end__label">이번 판 타자</p>
      {cpm == null ? (
        <p className="round-end__none">이번 판은 잰 타수가 없어요 — 맞힌 빈칸을 직접 쳐야 재져요</p>
      ) : (
        <p className="round-end__cpm">
          <b>{Math.round(cpm)}</b>타/분
        </p>
      )}
      {record && <p className="round-end__badge">🏆 최고 기록 갱신!</p>}
      {firstRank && after.rank && (
        <p className="round-end__badge">
          첫 등급! {after.rank.emoji} {after.rank.name}
        </p>
      )}
      {rankUp && after.rank && (
        <p className="round-end__badge">
          등급이 올랐어요! {after.rank.emoji} {after.rank.name}
        </p>
      )}
      {!after.rank && after.measuredRounds > 0 && <p className="round-end__sub">배치 중 · {after.placementLeft}판 더 치면 등급이 서요</p>}
      {after.rank && (
        <p className="round-end__sub">
          총합 {cpmText(after.totalCpm)}타{next && after.totalCpm != null ? ` · 다음 ${next.emoji} ${next.name}까지 ${Math.ceil(next.min - after.totalCpm)}타` : ' · 맨 위 등급이에요'}
        </p>
      )}
    </div>
  );
}
