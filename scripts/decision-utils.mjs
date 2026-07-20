export function getSessionKey(event) {
  return `${event.participant_id}|${event.session_id}`;
}

export function getDecisionKey(event) {
  return `${getSessionKey(event)}|${event.trial_id}`;
}

export function latestDecisionEvents(decisions) {
  const byKey = new Map();

  for (const decision of decisions) {
    const key = getDecisionKey(decision);
    const previous = byKey.get(key);

    if (!previous || decision.timestamp_ms >= previous.timestamp_ms) {
      byKey.set(key, decision);
    }
  }

  return [...byKey.values()].sort((left, right) => {
    return (left.timestamp_ms ?? 0) - (right.timestamp_ms ?? 0);
  });
}
