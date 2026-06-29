// Cabecera de página: eyebrow + título serif + helper. Coherente con el portal.
export default function PageHeader({ eyebrow, title, italic, helper, action }) {
  return (
    <header className="flex items-start justify-between gap-6 mb-8">
      <div>
        {eyebrow && <p className="section-eyebrow mb-3">{eyebrow}</p>}
        <h1 className="section-title">
          {title} {italic && <span className="title-italic">{italic}</span>}
        </h1>
        {helper && <p className="section-helper">{helper}</p>}
      </div>
      {action}
    </header>
  );
}
