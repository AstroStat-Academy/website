import { PageLayout } from '../components/PageLayout.jsx';
import { PageHeader } from '../../components/PageHeader/PageHeader.jsx';
import { SiteNav, SiteFooter } from '../components/SiteChrome.jsx';

export function Gallery() {
  return (
    <div className="as-page">
      <SiteNav active="gallery" />
      <PageLayout header={<PageHeader
          section="Gallery"
          kicker="photos and videos"
          title={'Moments from\nour events'}
          lede={<>Photos, videos and <span className="b">press material</span> from our schools, hackathons and events.</>} />} >
      </PageLayout>
      <SiteFooter />
    </div>
  );
}
