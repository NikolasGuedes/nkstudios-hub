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
    DESCRIPTION:
      'SHIRYU is a monochromatic web experience built around a bold visual identity, layered artwork, and an immersive presentation.',
    COLOR: '#D9D9D9'
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
