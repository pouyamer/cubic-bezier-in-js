const canvas = document.querySelector(".canvas")
const ctx = canvas.getContext("2d")
const size = { width: 400, height: 400 }
canvas.width = size.width
canvas.height = size.height

const POINT_RADIUS = 30 // radius of points

const X_BEGIN = 50 // Beginning Value (from)
const X_END = 350 // End Value (to)
const Y = 200

const ANIMATION_DURATION = 2 // seconds
const FRAMES_PER_SECOND = 60 // your average frames per second

// bezier parameters
const BX0 = 0.6
const BY0 = 0.17
const BX1 = 0.2
const BY1 = 0.56

// start of animation is from (30, 200) to (230, 200)
canvas.style.border = "1px solid black"

class Point {
  constructor(x, y) {
    this.x = x
    this.y = y
  }

  draw = (color = "black") => {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(this.x, this.y, POINT_RADIUS, 0, 2 * Math.PI)
    ctx.fill()
  }
}

/* 
  Cubic Bezier: a function that takes two Points:
    P0 = (x0, y0)
    P1 = (x1, y1)

    returns a function that goes like
    (t: [0 - 1]) => [0 - 1]

    special thanks to this github gist I found:
    https://gist.github.com/pushkine/fbc7cf18e0a40ffb02b3b3a20b74f4f1

*/

const cubicBezier = (x0, y0, x1, y1) => {
  if (!(x0 >= 0 && x0 <= 1 && x1 >= 0 && x1 <= 1))
    throw new Error(
      `CubicBezier x1 & x2 values must be { 0 < x < 1 }, got { x1 : ${x0}, x2: ${x1} }`
    )
  const ax = 1.0 - (x1 = 3.0 * (x1 - x0) - (x0 *= 3.0)) - x0,
    ay = 1.0 - (y1 = 3.0 * (y1 - y0) - (y0 *= 3.0)) - y0
  let i = 0,
    r = 0.0,
    s = 0.0,
    d = 0.0,
    x = 0.0
  return t => {
    for (r = t, i = 0; 32 > i; i++)
      if (1e-5 > Math.abs((x = r * (r * (r * ax + x1) + x0) - t)))
        return r * (r * (r * ay + y1) + y0)
      else if (1e-5 > Math.abs((d = r * (r * ax * 3.0 + x1 * 2.0) + x0))) break
      else r -= x / d
    if ((s = 0.0) > (r = t)) return 0
    else if ((d = 1.0) < r) return 1
    while (d > s)
      if (1e-5 > Math.abs((x = r * (r * (r * ax + x1) + x0)) - t)) break
      else t > x ? (s = r) : (d = r), (r = 0.5 * (d - s) + s)
    return r * (r * (r * ay + y1) + y0)
  }
}

const cubicBezierBasedOnTimeAndValue = (
  startingValue,
  endValue,
  x0,
  y0,
  x1,
  y1,
  currentTime
) => {
  return (
    // currentTime value is time from start (0) to end (1)
    // we should translate [0 - 1] that bezier gives us, to the [from - to]
    cubicBezier(x0, y0, x1, y1)(currentTime) * (endValue - startingValue) +
    startingValue
  )
}

// Showing the end and starting points on canvas
const startPoint = new Point(X_BEGIN, Y)
const endPoint = new Point(X_END, Y)

let x = X_BEGIN
let currentTime = 0 // current time [0 - 1]
let frame // stores the requestAnimationFrame in order to use cancelAnimationFrame(frame) later
let point = new Point(x, Y)

const animate = () => {
  frame = requestAnimationFrame(animate)
  if (currentTime >= 1) {
    cancelAnimationFrame(frame)
  }
  ctx.clearRect(0, 0, size.width, size.height)

  startPoint.draw("hsl(0, 0%, 0%, .5)")
  endPoint.draw("hsl(0, 0%, 0%, .1)")

  // setting value (x) based on currentTime

  /* 
    you can add or replace x 
    with any value that you like
    using the proper endValue and startingValue
    (you need to define it beforehand like 
    how we defined 'x' 
    e.g. let opacity = 0)
  */

  x = cubicBezierBasedOnTimeAndValue(
    X_BEGIN,
    X_END,
    BX0,
    BY0,
    BX1,
    BY1,
    currentTime
  )

  currentTime += 1 / (ANIMATION_DURATION * FRAMES_PER_SECOND)

  point = new Point(x, Y)

  point.draw()
}

// App begins from here...
animate()
