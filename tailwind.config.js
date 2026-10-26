const colors = require('tailwindcss/colors');
const tinycolor2 = require('tinycolor2');

const {
  themeColors,
  rabbyCssPrefix,
  appThemeColors,
  rabbyAppCssPrefix,
} = require('./src/constant/theme-colors');

const getRabbyColors = (colors, prefix) => {
  return ['light', 'dark'].reduce(
    (accu, theme) => {
      Object.entries(colors[theme]).forEach(([cssvarKey, colorValue]) => {
        // const splitorIdx = cssvarKey.indexOf('-');
        // const group = cssvarKey.slice(0, splitorIdx);
        // const suffix = cssvarKey.slice(splitorIdx + 1);
        const tinyColor = tinycolor2(colorValue);
        const alpha = tinyColor.getAlpha();

        const hexValue =
          alpha === 1 ? tinyColor.toHexString() : tinyColor.toHex8String();

        if (!accu.auto[cssvarKey]) {
          accu.auto[cssvarKey] = `var(--${prefix}${cssvarKey}, ${hexValue})`;
        }

        accu[theme][cssvarKey] = hexValue;
      });

      return accu;
    },
    {
      light: {},
      dark: {},
      auto: {},
    }
  );
};

const rabbyColors = getRabbyColors(themeColors, rabbyCssPrefix);
const rabbyAppColors = getRabbyColors(appThemeColors, rabbyAppCssPrefix);

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    spacing: [
      0,
      1,
      2,
      4,
      6,
      8,
      10,
      12,
      14,
      16,
      18,
      20,
      24,
      28,
      32,
      40,
      60,
      80,
    ].reduce((m, n) => {
      m[n] = `${n}px`;
      return m;
    }, {}),
    screens: {
      sm: { max: '600px' },
      lg: { min: '600px' },
    },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      blue: {
        from: '#FF8F61',
        to: '#E8461F',
        light: rabbyColors.light['blue-default'],
        DEFAULT: '#E8552A',
        purple: '#E8552A',
      },
      black: '#71717A',
      green: '#12A163',
      white: colors.white,
      yellow: '#F59E0B',
      orange: '#F59E0B',
      pink: '#E5484D',
      red: {
        light: '#E5484D',
        DEFAULT: '#A51E36',
        forbidden: '#E5484D',
      },
      gray: {
        bg2: '#F4F4F5',
        bg: '#F4F4F5',
        divider: '#E4E4E7',
        comment: '#D4D4D8',
        content: '#71717A',
        subTitle: '#3F3F46',
        title: '#09090B',
        light: '#71717A',
        common: '#52525B',
      },
    },
    fontSize: {
      12: [
        '12px',
        {
          lineHeight: '14px',
        },
      ],
      13: '13px',
      14: [
        '14px',
        {
          lineHeight: '18px',
        },
      ],
      15: [
        '15px',
        {
          lineHeight: '18px',
        },
      ],
      18: [
        '18px',
        {
          lineHeight: '22px',
        },
      ],
      20: '20px',
      24: [
        '24px',
        {
          lineHeight: '28px',
        },
      ],
      28: [
        '28px',
        {
          lineHeight: '33px',
        },
      ],
    },
    /** @notice configuration here would override the default config above */
    extend: {
      fontFamily: {
        // display: page titles and hero numbers; sans: everything else
        display: ['"Instrument Serif"', 'ui-serif', 'Georgia', 'serif'],
        sans: [
          'Geist',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Helvetica Neue"',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          '"Geist Mono"',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'monospace',
        ],
      },
      fontWeight: {
        510: '510',
      },
      colors: {
        [`${rabbyCssPrefix.replace(/\-$/, '')}`]: rabbyColors.auto,
        [`${'rabby-'.replace(/\-$/, '')}`]: rabbyColors.auto,
        [`${'-r-'.replace(/\-$/, '')}`]: rabbyColors.auto,

        [`light-${rabbyCssPrefix.replace(/\-$/, '')}`]: rabbyColors.light,
        [`dark-${rabbyCssPrefix.replace(/\-$/, '')}`]: rabbyColors.dark,

        [`${rabbyAppCssPrefix.replace(/\-$/, '')}`]: rabbyAppColors.auto,
        [`light-${rabbyAppCssPrefix.replace(/\-$/, '')}`]: rabbyAppColors.light,
        [`dark-${rabbyAppCssPrefix.replace(/\-$/, '')}`]: rabbyAppColors.dark,
      },
    },
  },
  // use class insteadof media-query prefers-color-scheme
  // see https://v2.tailwindcss.com/docs/dark-mode
  darkMode: 'class',
  important: true,
};
