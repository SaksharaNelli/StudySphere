const c = (n) => `rgb(var(--c-${n}) / <alpha-value>)`;
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: { page: c('page'), surface: c('surface'), ink: c('ink'), muted: c('muted'), line: c('line'), brand: c('brand'), soft: c('soft'), sky: c('sky'), navy: c('navy'), ok: '#2FB67C', warn: '#E8962A', bad: '#E5576B' },
      fontFamily: { display: ['"Bricolage Grotesque"', 'system-ui', 'sans-serif'], sans: ['Figtree', 'system-ui', 'sans-serif'] },
      boxShadow: { card: '0 1px 2px rgb(20 23 58 / .04), 0 10px 28px -14px rgb(20 23 58 / .16)' },
    },
  },
  plugins: [],
};
