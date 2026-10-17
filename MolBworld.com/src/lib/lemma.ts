/**
 * 낱말의 사전형 후보 — 블랭크북이 내장 사전을 찾을 때, 담은 낱말의 형광펜을 글 전체에 칠할 때 쓴다.
 *
 * 앱의 `LemmatizationService`(규칙 기반, 기기 안)를 옮겼다. 다만 앱은 답을 하나로 정하고, 여기는 **후보를 차례로**
 * 낸다 — 사전에 먼저 걸리는 것이 답이다(`building`은 사전에 명사로 있으니 `build`보다 먼저 걸린다).
 */
import { keyOf } from './text';

/** 불규칙 활용 — '사전형:활용,활용' 묶음. 앱의 `_irregulars` 표 그대로(428쌍). */
const IRREGULAR_TABLE = [
  'be:am,is,are,was,were,been,being have:has,had,having do:does,did,doing,done go:goes,went,gone,going',
  'say:says,said,saying get:gets,got,gotten,getting make:makes,made,making know:knows,knew,known,knowing',
  'think:thinks,thought,thinking take:takes,took,taken,taking see:sees,saw,seen,seeing',
  'come:comes,came,coming find:finds,found,finding give:gives,gave,given,giving tell:tells,told,telling',
  'feel:feels,felt,feeling become:becomes,became,becoming leave:leaves,left,leaving put:puts,putting',
  'mean:means,meant,meaning keep:keeps,kept,keeping let:lets,letting begin:begins,began,begun,beginning',
  'show:shows,showed,shown,showing hear:hears,heard,hearing run:runs,ran,running hold:holds,held,holding',
  'bring:brings,brought,bringing write:writes,wrote,written,writing sit:sits,sat,sitting',
  'stand:stands,stood,standing lose:loses,lost,losing pay:pays,paid,paying meet:meets,met,meeting',
  'set:sets,setting learn:learns,learnt,learning lead:leads,led,leading',
  'understand:understands,understood,understanding speak:speaks,spoke,spoken,speaking read:reads,reading',
  'spend:spends,spent,spending grow:grows,grew,grown,growing win:wins,won,winning',
  'teach:teaches,taught,teaching buy:buys,bought,buying send:sends,sent,sending',
  'fall:falls,fell,fallen,falling build:builds,built,building cut:cuts,cutting rise:rises,rose,risen,rising',
  'drive:drives,drove,driven,driving draw:draws,drew,drawn,drawing break:breaks,broke,broken,breaking',
  'eat:eats,ate,eaten,eating drink:drinks,drank,drunk,drinking throw:throws,threw,thrown,throwing',
  'catch:catches,caught,catching fly:flies,flew,flown,flying sing:sings,sang,sung,singing',
  'swim:swims,swam,swum,swimming lie:lies,lay,lain,lying die:dies,died,dying wear:wears,wore,worn,wearing',
  'hide:hides,hid,hidden,hiding fight:fights,fought,fighting choose:chooses,chose,chosen,choosing',
  'forget:forgets,forgot,forgotten,forgetting bite:bites,bit,bitten,biting blow:blows,blew,blown,blowing',
  'shake:shakes,shook,shaken,shaking wake:wakes,woke,woken,waking freeze:freezes,froze,frozen,freezing',
  'tear:tears,tore,torn,tearing steal:steals,stole,stolen,stealing shoot:shoots,shot,shooting',
  'dig:digs,dug,digging hang:hangs,hung,hanging sell:sells,sold,selling',
  'strike:strikes,struck,stricken,striking stick:sticks,stuck,sticking ride:rides,rode,ridden,riding',
  'spin:spins,spun,spinning spread:spreads,spreading hurt:hurts,hurting shut:shuts,shutting',
  'hit:hits,hitting quit:quits,quitting split:splits,splitting cost:costs,costing burst:bursts,bursting',
  'sleep:sleeps,slept,sleeping seek:seeks,sought,seeking bind:binds,bound,binding',
  'swear:swears,swore,sworn,swearing bear:bears,bore,borne,bearing ring:rings,rang,rung,ringing',
  'forgive:forgives,forgave,forgiven,forgiving arise:arises,arose,arisen,arising',
  'awake:awakes,awoke,awoken,awaking weave:weaves,wove,woven,weaving shine:shines,shone,shining',
  'slide:slides,slid,sliding sweep:sweeps,swept,sweeping cling:clings,clung,clinging',
  'creep:creeps,crept,creeping deal:deals,dealt,dealing feed:feeds,fed,feeding flee:flees,fled,fleeing',
  'grind:grinds,ground,grinding kneel:kneels,knelt,kneeling lay:lays,laid,laying lean:leans,leant,leaning',
  'leap:leaps,leapt,leaping lend:lends,lent,lending light:lights,lit,lighting sink:sinks,sank,sunk,sinking',
  'sow:sows,sowed,sown,sowing sting:stings,stung,stinging stink:stinks,stank,stunk,stinking',
  'stride:strides,strode,stridden,striding string:strings,strung,stringing swing:swings,swung,swinging',
  'weep:weeps,wept,weeping wind:winds,wound,winding wring:wrings,wrung,wringing',
  'withstand:withstands,withstood,withstanding withdraw:withdraws,withdrew,withdrawn,withdrawing',
  'overcome:overcomes,overcame,overcoming undertake:undertakes,undertook,undertaken,undertaking',
];

const IRREGULAR: ReadonlyMap<string, string> = (() => {
  const m = new Map<string, string>();
  for (const line of IRREGULAR_TABLE) {
    for (const group of line.split(' ')) {
      const [base, forms] = group.split(':');
      if (!base || !forms) continue;
      for (const f of forms.split(',')) m.set(f, base);
    }
  }
  return m;
})();

const VOWELS = 'aeiou';
const isConsonant = (c: string | undefined) => !!c && /[a-z]/.test(c) && !VOWELS.includes(c);

// 블랭크북의 긴 글은 다시 그릴 때마다 낱말마다 후보를 묻는다 — 같은 낱말은 한 번만 셈한다.
const memo = new Map<string, string[]>();

/** [word]의 사전형 후보 — 앞의 것일수록 그럴듯하다. 첫째는 늘 그 낱말 자신(소문자)이다. */
export function candidates(word: string): string[] {
  const hit = memo.get(word);
  if (hit) return hit;
  const out = computeCandidates(word);
  if (memo.size > 20_000) memo.clear();
  memo.set(word, out);
  return out;
}

function computeCandidates(word: string): string[] {
  const w = keyOf(word);
  if (!w || w.includes(' ')) return w ? [w] : [];
  const out: string[] = [w];
  const add = (s: string | undefined) => {
    if (s && !out.includes(s)) out.push(s);
  };

  add(IRREGULAR.get(w));
  if (w === 'an') add('a');
  // 줄임 — didn't → did → do, I'm → i, we'll → we. 떼어 낸 것도 불규칙 표에 한 번 더 묻는다.
  const clipped = /^(.+?)(n't|'s|s'|'m|'re|'ve|'ll|'d)$/.exec(w)?.[1];
  if (clipped) {
    const base = w.endsWith("n't") && clipped === 'ca' ? 'can' : w.endsWith("n't") && clipped === 'wo' ? 'will' : clipped;
    add(base);
    add(IRREGULAR.get(base));
  }
  if (w.length < 4) return out;

  if (w.endsWith('ies') || w.endsWith('ied')) add(`${w.slice(0, -3)}y`);
  if (w.endsWith('ves')) {
    add(`${w.slice(0, -3)}f`);
    add(`${w.slice(0, -3)}fe`);
  }
  if (w.endsWith('es')) {
    add(w.slice(0, -2));
    add(w.slice(0, -1));
  } else if (w.endsWith('s') && !w.endsWith('ss')) {
    add(w.slice(0, -1));
  }

  for (const tail of ['ing', 'ed', 'er', 'est']) {
    if (!w.endsWith(tail) || w.length <= tail.length + 1) continue;
    const stem = w.slice(0, -tail.length);
    if (tail !== 'ing' && stem.endsWith('i')) add(`${stem.slice(0, -1)}y`); // happier → happy, studied는 위에서
    if (tail === 'ing' && stem.endsWith('y') && w.endsWith('ying')) add(`${stem.slice(0, -1)}ie`); // lying → lie
    const last = stem.slice(-1);
    if (stem.length >= 3 && last === stem.slice(-2, -1) && isConsonant(last)) add(stem.slice(0, -1)); // running → run
    add(stem);
    add(`${stem}e`); // making → make, liked → like
  }
  if (w.endsWith('ed')) add(w.slice(0, -1)); // used → use

  if (w.endsWith('ily')) add(`${w.slice(0, -3)}y`); // easily → easy
  else if (w.endsWith('ly')) {
    add(w.slice(0, -2)); // quickly → quick
    if (w.endsWith('bly') || w.endsWith('tly') || w.endsWith('ply')) add(`${w.slice(0, -1)}e`); // gently → gentle
  }
  return out;
}

/** 사전형 하나를 바로 고를 때(사전 없이) — 불규칙이면 그 사전형, 아니면 낱말 그대로. */
export function quickLemma(word: string): string {
  const w = keyOf(word);
  return IRREGULAR.get(w) ?? w;
}

/** 이 낱말이 [keys] 가운데 하나의 활용인가 — 담은 낱말의 형광펜을 다른 모습에도 칠한다. */
export function matchesAny(word: string, keys: ReadonlySet<string>): string | null {
  if (keys.size === 0) return null;
  for (const c of candidates(word)) if (keys.has(c)) return c;
  return null;
}
