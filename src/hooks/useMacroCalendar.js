import { useEffect, useState } from 'react';
import { fetchMacroCalendar } from '../lib/api';
import { CALENDAR_MATCHES } from '../lib/staticData';
import { NEWS_FEED_MAX_AGE } from '../lib/engine';

// Not symbol-scoped — the US economic calendar is the same regardless of
// which instrument is active.
export function useMacroCalendar() {
  const [calendarRows, setCalendarRows] = useState({});
  const [nextNewsInfo, setNextNewsInfo] = useState(null);
  const [newsFeedOkTs, setNewsFeedOkTs] = useState(0);

  useEffect(() => {
    let stopped = false;
    async function poll() {
      try {
        const rows = await fetchMacroCalendar();
        if (stopped) return;
        const us = rows.filter((e) => e.countryCode === 'US');
        const next = {};
        Object.keys(CALENDAR_MATCHES).forEach((id) => {
          const wanted = CALENDAR_MATCHES[id].names;
          const matched = us.filter((e) => wanted.includes(e.name));
          if (matched.length) next[id] = matched;
        });
        setCalendarRows(next);

        const now = Date.now();
        const withDiff = us.filter((e) => !!e.time).map((e) => ({ name: e.name, diffMin: (new Date(e.time).getTime() - now) / 60000 }));
        withDiff.sort((a, b) => Math.abs(a.diffMin) - Math.abs(b.diffMin));
        const nearest = withDiff.filter((e) => Math.abs(e.diffMin) <= 360)[0];
        setNextNewsInfo(nearest ? { name: nearest.name, minutesAway: nearest.diffMin } : null);
        setNewsFeedOkTs(Date.now());
      } catch (e) { /* leave nextNewsInfo as-is; newsFeedOkTs going stale stands the engine down */ }
    }
    poll();
    const id = setInterval(poll, 90000);
    return () => { stopped = true; clearInterval(id); };
  }, []);

  const newsFeedUsable = newsFeedOkTs > 0 && Date.now() - newsFeedOkTs < NEWS_FEED_MAX_AGE;

  return { calendarRows, nextNewsInfo, newsFeedUsable };
}
