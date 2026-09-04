import nrl360 from '../assets/show-icons/nrl-360.png';
import mattyJohnsPodcast from '../assets/show-icons/matty-johns-podcast.png';
import mattyJohnsLateShow from '../assets/show-icons/matty-johns-late-show.png';
import nrlSimulcastThursday from '../assets/show-icons/nrl-simulcast-thursday.png';
import thursNightLeague from '../assets/show-icons/thurs-night-league.png';
import nrlFridayNightFooty from '../assets/show-icons/nrl-friday-night-footy.png';
import sportsbet from '../assets/show-icons/sportsbet.png';
import nrlSuperSaturday from '../assets/show-icons/nrl-super-saturday.png';
import nrlRoundOb from '../assets/show-icons/nrl-round-ob.png';
import nrlwOffTubeCall from '../assets/show-icons/nrlw-off-tube-call.png';
import sundayMattyJohnsShow from '../assets/show-icons/sunday-matty-johns-show.png';
import nrlSunday from '../assets/show-icons/nrl-sunday.png';
import finalsFooty from '../assets/show-icons/finals-footy.png';
import nrlwThursday from '../assets/show-icons/nrlw-thursday.png';
import nrlOffTubeCall from '../assets/show-icons/nrl-off-tube-call.png';
import netballPivot from '../assets/show-icons/netball-pivot.png';
import nrlSideline from '../assets/show-icons/nrl-sideline.png';
import nrlTonight from '../assets/show-icons/nrl-tonight.png';

// Keyed by showLibrary.ts's ShowTemplate.key — hand-drawn brand icons for
// the real shows, supplied as one reference sheet and cropped apart. A
// few real shows share one icon (the three NRL 360 weekdays, the two
// Sportsbet slots) because the sheet only drew one mark for each family.
export const SHOW_ICON_BY_KEY: Record<string, string> = {
  'nrl-360-mon': nrl360,
  'nrl-360-tue': nrl360,
  'nrl-360-wed': nrl360,
  'matty-johns-podcast': mattyJohnsPodcast,
  'matty-johns-late-show-thursday': mattyJohnsLateShow,
  'nrl-simulcast-thursday': nrlSimulcastThursday,
  'thurs-night-league': thursNightLeague,
  'nrl-friday-night-footy': nrlFridayNightFooty,
  'sportsbet-nrl-wagering-thurs': sportsbet,
  'sportsbet-nrl-wagering-fri': sportsbet,
  'nrl-super-saturday': nrlSuperSaturday,
  'nrl-round-ob-audio-mix': nrlRoundOb,
  'nrlw-off-tube-call': nrlwOffTubeCall,
  'sunday-matty-johns-show': sundayMattyJohnsShow,
  'nrl-sunday': nrlSunday,
  'finals-footy-with-matty-johns': finalsFooty,
  'nrl-w-thursday': nrlwThursday,
  'nrl-off-tube-call': nrlOffTubeCall,
  'netball-pivot': netballPivot,
  'nrl-sideline': nrlSideline,
  'nrl-tonight': nrlTonight,
};

// A booking doesn't always carry a live showKey (a custom-crew booking,
// or one generated from the Shows panel's schedule) — fall back to
// matching its own title/production text against each real show's name
// so the icon still shows up.
const NAME_TO_ICON: { pattern: RegExp; icon: string }[] = [
  { pattern: /\bNRL ?360\b/i, icon: nrl360 },
  { pattern: /Matty Johns Podcast/i, icon: mattyJohnsPodcast },
  { pattern: /Matty Johns Late Show/i, icon: mattyJohnsLateShow },
  { pattern: /NRL Simulcast Thursday/i, icon: nrlSimulcastThursday },
  { pattern: /Thurs(day)? Night League/i, icon: thursNightLeague },
  { pattern: /NRL Friday Night Footy/i, icon: nrlFridayNightFooty },
  { pattern: /Sportsbet/i, icon: sportsbet },
  { pattern: /NRL Super Saturday/i, icon: nrlSuperSaturday },
  { pattern: /NRL Round OB/i, icon: nrlRoundOb },
  { pattern: /NRLW Off Tube Call/i, icon: nrlwOffTubeCall },
  { pattern: /Sunday Matty Johns Show/i, icon: sundayMattyJohnsShow },
  { pattern: /NRL Sunday/i, icon: nrlSunday },
  { pattern: /Finals Footy/i, icon: finalsFooty },
  { pattern: /NRLW.*Thursday|NRL W.*Thursday/i, icon: nrlwThursday },
  { pattern: /NRL Off Tube Call/i, icon: nrlOffTubeCall },
  { pattern: /Netball/i, icon: netballPivot },
  { pattern: /NRL Sideline/i, icon: nrlSideline },
  { pattern: /NRL Tonight/i, icon: nrlTonight },
];

export function showIconFor(showKey: string | undefined, title: string | undefined): string | undefined {
  if (showKey && SHOW_ICON_BY_KEY[showKey]) return SHOW_ICON_BY_KEY[showKey];
  if (!title) return undefined;
  return NAME_TO_ICON.find((e) => e.pattern.test(title))?.icon;
}
