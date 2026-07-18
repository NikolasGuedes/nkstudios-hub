export type Project = {
  ID: string;
  NAME: string;
  VIDEO: string | null;
  IMAGES: string[];
  LINK: string | null;
  DESCRIPTION: string;
  COLOR: `#${string}`;
};

export const PROJECTS: Project[] = [
  {
    ID: 'shiryu',
    NAME: 'SHIRYU',
    VIDEO: '/projects_assets/videos/Video_shiryu.webm',
    IMAGES: [
      '/projects_assets/imgs/Shiryu_01.png',
      '/projects_assets/imgs/Shiryu_02.png',
      '/projects_assets/imgs/Shiryu_03.png'
    ],
    LINK: 'https://shiryu.nkstudios.dev/',
    DESCRIPTION: 'A website created in tribute to my dog.',
    COLOR: '#D9D9D9'
  },
  {
    ID: 'lifeeasy',
    NAME: 'LIFEEASY',
    VIDEO: '/projects_assets/videos/Video_Lifeeasy.webm',
    IMAGES: [
      '/projects_assets/imgs/Lifeeasy_01.png',
      '/projects_assets/imgs/Lifeeasy_02.png',
      '/projects_assets/imgs/Lifeeasy_03.png'
    ],
    LINK: 'https://lifeeasy.com.br/',
    DESCRIPTION:
      "A company website offering web services and solutions focused on making users' lives easier.",
    COLOR: '#006FFF'
  }
];

export function getProjectTextColor(color: string) {
  const normalized = color.replace('#', '');

  if (!/^[\da-f]{6}$/i.test(normalized)) return '#000000';

  const red = Number.parseInt(normalized.slice(0, 2), 16);
  const green = Number.parseInt(normalized.slice(2, 4), 16);
  const blue = Number.parseInt(normalized.slice(4, 6), 16);
  const luminance = (red * 299 + green * 587 + blue * 114) / 1000;

  return luminance > 150 ? '#000000' : '#F4F2ED';
}
