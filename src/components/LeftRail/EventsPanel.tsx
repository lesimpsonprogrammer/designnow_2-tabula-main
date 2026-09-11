import { useTabulaStore } from '../../store/useTabulaStore';

export function EventsPanel() {
  const events = useTabulaStore((state) => state.auditEvents);

  return (
    <section className="events-panel" aria-labelledby="events-heading">
      <div className="events-heading">
        <div>
          <strong id="events-heading">Event history</strong>
          <p>Every recorded transaction has a unique ID.</p>
        </div>
        <span>{events.length}</span>
      </div>
      <div className="events-list">
        {!events.length ? <p className="events-empty">Make a change to begin the event log.</p> : null}
        {events.map((event) => (
          <article className={`event-card ${event.kind}`} key={event.id}>
            <div className="event-card-top">
              <strong>{event.summary}</strong>
              <time dateTime={new Date(event.createdAt).toISOString()}>{new Date(event.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</time>
            </div>
            {event.details.map((detail) => <p key={detail}>{detail}</p>)}
            <code title={event.id}>{event.id}</code>
          </article>
        ))}
      </div>
    </section>
  );
}
