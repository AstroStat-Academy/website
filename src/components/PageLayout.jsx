/* One owner for page edges and the gap between the header and page content. */
export function PageLayout({ header, children }) {
  return (
    <main id="main-content" className="as-wrap page-layout">
      {header}
      {children && <div className="page-body">{children}</div>}
    </main>
  );
}
