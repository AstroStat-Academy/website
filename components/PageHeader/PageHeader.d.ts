import type * as React from 'react';

/** THE default page header. Every page uses this — panel frame, channel bar,
 *  mono kicker, 46px display title, 17px lede. Never hand-roll a page header. */
export interface PageHeaderProps {
  /** page name, e.g. "People" — shown in the channel bar and the kicker */
  section: string;
  /** kicker suffix after "// <section> — ", e.g. "who we are" */
  kicker?: string;
  /** display title; \n renders as a line break */
  title: string;
  /** Subtitle with highlighted text; uses the shared 80% measure. */
  lede?: React.ReactNode;
  /** accent family. Default "blue" */
  accent?: 'blue' | 'red' | 'teal';
  /** Reserved for Home's approved wordmark layout. */
  variant?: 'home';
  /** Channel label. Defaults to "// AstroStat Academy". */
  channel?: React.ReactNode;
  /** Optional status at the right of the channel bar; blank by default. */
  status?: React.ReactNode;
  /** Explicit right-panel content. The panel is empty by default. */
  aside?: React.ReactNode;
  /** Optional content below the lede in the left panel. Page bodies go outside. */
  children?: React.ReactNode;
}

export declare function PageHeader(props: PageHeaderProps): JSX.Element;
