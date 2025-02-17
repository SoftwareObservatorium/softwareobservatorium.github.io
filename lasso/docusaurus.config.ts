import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'LASSO',
  tagline: 'A Large-Scale Software Observatorium for the Dynamic Selection, Analysis and Comparison of Software',
  favicon: '/img/favicon.ico',

  // Set the production url of your site here
  url: 'https://softwareobservatorium.github.io/',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'softwareobservatorium', // Usually your GitHub org/user name.
  projectName: 'lasso', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: 'LASSO',
      logo: {
        alt: 'LASSO Logo',
        src: 'img/lasso_logo_trans.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {to: '/hub', label: 'TDSEHub (Pipelines)', position: 'left'},
        {to: '/playground', label: 'Playground (Labs)', position: 'left'},
        {to: '/blog', label: 'Blog', position: 'left'},
        {to: '/research/intro', label: 'Research', position: 'left'},
        {
          href: 'https://github.com/SoftwareObservatorium/lasso',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'About',
              to: '/about',
            },
            {
              label: 'Documentation',
              to: '/docs/intro',
            },
            {
              label: 'Playground (Labs)',
              to: '/playground',
            },
            {
              label: 'Research',
              to: '/research/intro',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            // {
            //   label: 'Stack Overflow',
            //   href: 'https://stackoverflow.com/questions/tagged/docusaurus',
            // },
            {
              label: 'TDSEHub (Pipelines)',
              href: '/hub',
            },
            // {
            //   label: 'Discord',
            //   href: 'https://discordapp.com/invite/docusaurus',
            // },
            // {
            //   label: 'Twitter',
            //   href: 'https://twitter.com/docusaurus',
            // },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Blog',
              to: '/blog',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/SoftwareObservatorium/lasso',
            },
            {
              label: 'Contact Us',
              to: '/contact',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} LASSO Project, Software Engineering Group, University of Mannheim.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['java', 'groovy'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
