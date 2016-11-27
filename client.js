const choo = require('choo')
const cache = require('cache-element')
const html = require('choo/html')
const sf = require('sheetify')
const app = choo()

const { getCurvePoints } = require('cardinal-spline-js')
const smooth = require('./smooth')

sf('./main.styl', { global: true })
window.requestAnimationFrame = window.requestAnimationFrame ||
window.mozRequestAnimationFrame ||
window.webkitRequestAnimationFrame ||
window.msRequestAnimationFrame

if (!window.AudioContext) {
  if (!window.webkitAudioContext) {
    window.alert('no audiocontext found')
  }
  window.AudioContext = window.webkitAudioContext
}
const context = new window.AudioContext()
const URL = './zik.mp3'

// const drawPoint = ctx => (prev, actual) => {
//   const centerX = window.innerWidth / 2
//   const centerY = window.innerHeight / 2
//   const px = centerX + prev.radius * Math.cos(-prev.angle * Math.PI / 180)
//   const py = centerY + prev.radius * Math.sin(-prev.angle * Math.PI / 180)

//   const ax = centerX + actual.radius * Math.cos(-actual.angle * Math.PI / 180)
//   const ay = centerY + actual.radius * Math.sin(-actual.angle * Math.PI / 180)

//   ctx.strokeStyle = `hsla(${35 * actual.age / 360}, 94%, 65%, ${1 - actual.age / 360})`
//   ctx.quadraticCurveTo(px, py, ax, ay)
//   return actual
// }
// const randomRange =
//   (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

const cp = (p) => {
  const centerX = window.innerWidth / 2
  const centerY = window.innerHeight / 2
  return [
    centerX + p.radius * Math.cos(-p.angle * Math.PI / 180),
    centerY + p.radius * Math.sin(-p.angle * Math.PI / 180)
  ]
}

const drawSmoothPoint = (ctx, p0, p1, p2, p3) => {
  const { s, e } = smooth(cp(p0), cp(p1), cp(p2), cp(p3))
  ctx.strokeStyle = `hsla(${35 * p1.age / 360}, 94%, 65%, ${1 - p1.age / 360})`
  ctx.quadraticCurveTo(s.x, s.y, e.x, e.y)
}
const drawPoints = (ctx, points) => {
  const pp = points.reduce((acc, x) => acc.concat(cp(x)), [])
  const smoothPoints = getCurvePoints(pp, 1, 50)
  ctx.strokeStyle = '#FFF'
  for(let i = 0; i < smoothPoints.length - 3;i+=4){
    ctx.quadraticCurveTo(smoothPoints[i], smoothPoints[i + 1], smoothPoints[i + 2], smoothPoints[i + 3])
  }
}


app.model({
  state: {
    canvas: null,
    ctx: null,
    source: null,
    analyser: null,
    buffer: null,
    play: false,
    setup: false,
    angle: 0,
    particules: []
  },
  reducers: {
    init: (data, state) =>
      Object.assign({}, state, data),
    particule: (data, state) =>
      Object.assign({}, state, { particules: [...state.particules, data] }),
    particules: (data, state) =>
      Object.assign({}, state, { particules: data }),
    update: (data, state) =>
      Object.assign({}, state, { particules: data, angle: state.angle === 360 ? 0 : state.angle + 1 }),
    source: (data, state) =>
      Object.assign({}, state, { setup: true, source: data }),
    buffer: (data, state) =>
      Object.assign({}, state, { buffer: data }),
    analyser: (data, state) =>
      Object.assign({}, state, { analyser: data })
  },
  effects: {
    play: (buffer, state, send, done) => {
      const source = context.createBufferSource()

      const analyser = context.createAnalyser()
      analyser.smoothingTimeConstant = 0.3
      analyser.fftSize = 1024

      source.connect(analyser)
      source.buffer = buffer
      source.connect(context.destination)

      source.start(0)
      send('analyser', analyser, done)
      send('source', source, done)
    },
    load: (url, state, send, done) => {
      const decoding = decodedData => {
        send('buffer', decodedData, done)
        send('play', decodedData, done)
      }
      return window.fetch(URL)
        .then(response => response.arrayBuffer())
        .then(buf => context.decodeAudioData(buf, decoding))
    },
    frame: (data, state, send, done) => {
      if (state.canvas === null) {
        const canvas = document.querySelector('#world')
        const ctx = canvas.getContext('2d')

        send('load', URL, done)
        send('init', { canvas, ctx }, done)
        return window.requestAnimationFrame(() => send('frame', done))
      } else if (state.setup) {
        const frequencyData = new Uint8Array(state.analyser.frequencyBinCount)
        state.analyser.getByteFrequencyData(frequencyData)
        const max = Math.max(...frequencyData)

        if (state.particules.length > 4) {
          state.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
          state.ctx.beginPath()
          const pp = drawPoints(state.ctx, state.particules)
//          state.particules
//            .reduce(drawPoint(state.ctx), state.particules[0])
          state.ctx.stroke()
        }
        const pp = state.particules
          .map(p => Object.assign({}, p, { age: p.age + 1 }))
          .filter(x => x.age < 360)

        send('update', pp, done)
        send('particule', { angle: state.angle, radius: max, age: 0 }, done)
      }

      window.requestAnimationFrame(() => send('frame', done))
    }
  },
  subscriptions: [
    (send, done) =>
      window.requestAnimationFrame(() => send('frame', done))
  ]
})

const view = cache((state, prev, send) =>
  html`<canvas id='world' width=${window.innerWidth} height=${window.innerHeight}></canvas>`)

app.router(r => [ r('/', view) ])

document.addEventListener('DOMContentLoaded', function (event) {
  const tree = app.start()
  document.body.appendChild(tree)
})

