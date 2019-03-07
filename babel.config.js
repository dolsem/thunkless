module.exports = {
  presets: [
    ['@babel/preset-env', {
      'targets': {
        'browsers': ['last 2 versions', 'safari >= 7']
      },
      "modules": false
    }]
  ],
  env: {
    test: {
      plugins: [
        'transform-es2015-modules-commonjs'
      ]
    }
  }
}