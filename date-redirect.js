(function() {
  // Redirect between question (`index.html`), waiting page and main page (`main.html`)
  // This script ensures that during Feb 14 (00:00 -> 23:59:59) the `main.html` is shown,
  // and that before/after it's `waiting.html` for accepted users (or still viewable
  // as `index.html` for new visitors). It schedules an exact transition at midnight
  // so the page switches without manual refresh.

  function getRangeForYear(y) {
    return {
      start: new Date(y, 1, 14, 0, 0, 0, 0), // Feb 14 00:00
      end:   new Date(y, 1, 15, 0, 0, 0, 0)  // Feb 15 00:00 (exclusive)
    };
  }

  function enforceNow() {
    const now = new Date();
    const year = now.getFullYear();
    const {start, end} = getRangeForYear(year);
    const path = location.pathname.split('/').pop();
    const onIndex = path === '' || /index\.html?$/.test(path);
    const onWaiting = /waiting\.html?$/.test(path);
    const onMain = /main\.html?$/.test(path);

    // If the user previously clicked "Yes" on this device, they opted in:
    // - before/after Feb 14 they should land on `waiting.html`
    // - during Feb 14 they should land on `main.html`
    const accepted = (typeof localStorage !== 'undefined' && localStorage.getItem('valentineAccepted') === 'true');

    if (now >= start && now < end) {
      // During Feb 14 → ensure main content
      if (!onMain) location.replace('main.html');
      return;
    }

    // Not Feb 14
    if (accepted) {
      // accepted users should land on waiting page outside Feb14
      if (!onWaiting) location.replace('waiting.html');
      return;
    }

    // Not accepted: allow visiting the question page (index), but prevent direct access to main
    if (onMain) {
      location.replace('waiting.html');
    }
  }

  function scheduleNext() {
    const now = new Date();
    let year = now.getFullYear();
    let {start, end} = getRangeForYear(year);

    if (now >= end) {
      // We are past this year's Feb14; schedule for next year
      year = year + 1;
      ({start, end} = getRangeForYear(year));
    }

    // Decide next transition time: if now < start -> next = start, if in-range -> next = end
    const next = (now < start) ? start : (now >= start && now < end) ? end : start;
    const delay = next - now;

    if (delay > 0) {
      // set a single precise timeout to re-run enforcement at the transition
      setTimeout(() => {
        enforceNow();
        scheduleNext();
      }, delay + 50); // small fudge of 50ms
    }
  }

  // initial enforcement, then schedule the next transition
  enforceNow();
  scheduleNext();

  // Safety: in case setTimeout is throttled (background tab), double-check every minute
  setInterval(enforceNow, 60 * 1000);
})();
