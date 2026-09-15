export const routes = [
  { id: 'home', path: '/', label: 'Home', description: 'Advanced statistics, taught and applied. Schools, hackathons and consulting from AstroStat Academy.' },
  { id: 'schools', path: '/schools/', label: 'Schools', description: 'Hands-on schools in statistics and AI for researchers and data scientists.' },
  { id: 'hackatons', path: '/hackathons/', label: 'Hackathons', description: 'Collaborative data hackathons for researchers and teams.' },
  { id: 'consulting', path: '/consulting/', label: 'Consulting', description: 'Statistical and AI consulting for research and development.' },
  { id: 'people', path: '/people/', label: 'People', description: 'Meet the researchers and data scientists behind AstroStat Academy.' },
  { id: 'gallery', path: '/gallery/', label: 'Gallery', description: 'Photos, videos and press material from AstroStat Academy schools, hackathons and events.' },
  { id: 'acknowledge', path: '/acknowledge/', label: 'Acknowledge us', description: 'How to acknowledge AstroStat Academy in your research.' },
];

export const aliases = {
  '/Home.html': '/',
  '/home.html': '/',
  '/site/Home.html': '/',
  '/site/School Page.html': '/schools/',
  '/site/People Page.html': '/people/',
  '/hackatons': '/hackathons/',
  '/hackatons/': '/hackathons/',
  ...Object.fromEntries(routes.filter(route => route.id !== 'home').flatMap(route => [
    [route.path.slice(0, -1), route.path],
    [`/${route.id}.html`, route.path],
  ])),
};
