module.exports = {
  multipass: true,
  floatPrecision: 2,
  plugins: [
    'preset-default',
    'removeDimensions',
    { name: 'removeAttrs', params: { attrs: ['clip-path'] } },
    'removeTitle',
  ],
};
