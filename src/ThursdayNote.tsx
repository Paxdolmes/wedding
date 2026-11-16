import './paperEdge.css'
import './ThursdayNote.css'

/** An apology for the Thursday, on a scrap of torn paper taped to the page. */
export function ThursdayNote() {
  return <div className="thursday-wrap">
    <aside className="thursday-note" aria-labelledby="thursday-heading">
      <div className="note-paper">
        <h2 id="thursday-heading">Yes, it’s a <em>Thursday.</em></h2>
        <i className="note-rule" aria-hidden="true" />
        <p>We know, we know. We’re sorry! Book the Friday off and think of it as a very long weekend that starts early.</p>
        <p className="note-promise">We promise it’ll be worth it.</p>
      </div>
    </aside>
  </div>
}
