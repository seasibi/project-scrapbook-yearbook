const SECTIONS = [
  { id: "cover", label: "Cover" },
  { id: "messages", label: "Messages" },
  { id: "portraits-a-f", label: "Portraits A–F" },
  { id: "portraits-g-n", label: "Portraits G–N" },
  { id: "portraits-o-z", label: "Portraits O–Z" },
  { id: "gallery", label: "Gallery" },
  { id: "dedications", label: "Dedications" },
  { id: "back-cover", label: "Back Cover" },
];

/**
 * Static download section. Drop Canva PDF exports into /public/yearbook-pdf/
 * — full.pdf plus one file per section id (e.g. portraits-a-f.pdf).
 */
export default function DownloadPdf() {
  return (
    <div className="download-inner">
      <span className="corner-tape left" aria-hidden="true" />
      <span className="corner-tape right" aria-hidden="true" />

      <h2 className="download-title reveal">Download the Yearbook</h2>
      <p className="download-sub pixel-font reveal">
        the full canva edition, pressed into pdf
      </p>

      <a
        className="download-button pixel-font reveal"
        href="/yearbook-pdf/full.pdf"
        download
      >
        ⬇ download the full pdf
      </a>

      <div className="download-divider reveal">
        <span className="pixel-font">or download by section</span>
      </div>

      <div className="download-grid">
        {SECTIONS.map((section, i) => (
          <a
            key={section.id}
            className="download-card reveal"
            href={`/yearbook-pdf/${section.id}.pdf`}
            download
            style={{
              transitionDelay: `${Math.min(i * 50, 350)}ms`,
              ["--tilt" as string]: `${i % 2 === 0 ? -2 : 2}deg`,
            }}
          >
            <span className="download-card-art" aria-hidden="true">📄</span>
            <span className="download-card-label">{section.label}</span>
            <span className="download-card-hint pixel-font">.pdf</span>
          </a>
        ))}
      </div>

      <p className="download-note pixel-font reveal">
        ✦ exports go in /public/yearbook-pdf/ — full.pdf + one per section ✦
      </p>
    </div>
  );
}
