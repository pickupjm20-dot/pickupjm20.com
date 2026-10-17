/** 고른 캐릭터 + 말풍선. 말은 몰비의 말투(반말 · 호기심 · 감탄 — 앱의 `docs/MOLB_CHARACTER.md`)로 적는다. */
import { characterImage, characterName, type Pose } from '../data/site';
import { usePrefs } from '../hooks/prefs';

export function Mascot({
  pose = 'smiling',
  says,
  size = 96,
  className = '',
  bubbleSide = 'right',
}: {
  pose?: Pose;
  says?: string;
  size?: number;
  className?: string;
  bubbleSide?: 'right' | 'left' | 'top';
}) {
  const { character } = usePrefs();
  return (
    <div className={`mascot mascot--bubble-${bubbleSide} ${className}`}>
      <img
        className="mascot__img"
        src={characterImage(character, pose)}
        alt={`몰비(${characterName(character)})`}
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
      />
      {says && (
        <p className="mascot__bubble" aria-live="polite">
          {says}
        </p>
      )}
    </div>
  );
}
