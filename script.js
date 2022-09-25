import config from "./config.json" assert { type: "json" }

const {
  canvas: canvasSize,
  animation,
  bezierPoints: { p0, p1 }
} = config

const canvas = document.querySelector(".canvas")
const btnStartAnimation = document.querySelector(".btn-start-animation")
const textEl = document.querySelector(".text")
const bezierInpElements = [...document.querySelectorAll(".bezier-inputs input")]
const btnEdit = document.querySelector(".btn-edit")
const btnCopy = document.querySelector(".btn-copy")
const settingEl = document.querySelector(".settings")
const btnCancelBezierSet = document.querySelector(".btn-bezier-cancel")
const btnConfirmBezierSet = document.querySelector(".btn-bezier-confirm")

let currentBezierValues

const ctx = canvas.getContext("2d")

canvas.width = canvasSize.width
canvas.height = canvasSize.height

const POINT_RADIUS = config.point.radius // radius of points

const X_STARTING = config.x.starting // Beginning Value (from)
const X_END = config.x.end // End Value (to)
const Y = config.y

const ANIMATION_DURATION = animation.duration // seconds
const FRAMES_PER_SECOND = animation.fps // your average frames per second

// bezier parameters
let BX0 = p0.x
let BY0 = p0.y
let BX1 = p1.x
let BY1 = p1.y

// start of animation is from (30, 200) to (230, 200)
let isAnimationPlaying = false

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

class BezierValues {
  constructor(x0, y0, x1, y1) {
    this.x0 = x0
    this.y0 = y0
    this.x1 = x1
    this.y1 = y1
  }

  equals = bezierValues => {
    return (
      this.x0 == bezierValues.x0 &&
      this.y0 == bezierValues.y0 &&
      this.x1 == bezierValues.x1 &&
      this.y1 == bezierValues.y1
    )
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
const startPoint = new Point(X_STARTING, Y)
const endPoint = new Point(X_END, Y)

let x = X_STARTING
let currentTime = 0 // current time [0 - 1]
let frame // stores the requestAnimationFrame in order to use cancelAnimationFrame(frame) later
let point = new Point(x, Y)

const animate = () => {
  frame = requestAnimationFrame(animate)
  if (currentTime >= 1) {
    cancelAnimationFrame(frame)
    isAnimationPlaying = false
    btnStartAnimation.disabled = false
  }
  ctx.clearRect(0, 0, canvasSize.width, canvasSize.height)

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
    X_STARTING,
    X_END,
    BX0,
    BY0,
    BX1,
    BY1,
    currentTime
  )

  currentTime += 1 / (ANIMATION_DURATION * FRAMES_PER_SECOND)

  point = new Point(x, Y)

  point.draw(config.point.color)
}

btnStartAnimation.addEventListener("click", () => {
  if (isAnimationPlaying) {
    return
  }
  x = X_STARTING
  currentTime = 0
  frame
  point = new Point(x, Y)

  isAnimationPlaying = true
  animate()
  btnStartAnimation.disabled = true
})

bezierInpElements.forEach(el =>
  el.addEventListener("change", () => {
    if (el.value > 1) {
      el.value = 1
    }
    if (el.value <= 0 || !el.value) {
      el.value = 0
    }

    const newValues = new BezierValues(
      bezierInpElements[0].value,
      bezierInpElements[1].value,
      bezierInpElements[2].value,
      bezierInpElements[3].value
    )

    btnConfirmBezierSet.disabled = currentBezierValues.equals(newValues)
  })
)

btnEdit.addEventListener("click", () => {
  settingEl.classList.add("shown")
  btnEdit.disabled = true
})

btnCancelBezierSet.addEventListener("click", () => {
  // resetting the bezier inputs
  bezierInpElements[0].value = currentBezierValues.x0
  bezierInpElements[1].value = currentBezierValues.y0
  bezierInpElements[2].value = currentBezierValues.x1
  bezierInpElements[3].value = currentBezierValues.y1

  btnEdit.disabled = false
  settingEl.classList.remove("shown")
  btnConfirmBezierSet.disabled = true
})

btnConfirmBezierSet.addEventListener("click", () => {
  // setting temp value so it can get utilized on cancel and confirm later
  currentBezierValues = new BezierValues(
    bezierInpElements[0].value,
    bezierInpElements[1].value,
    bezierInpElements[2].value,
    bezierInpElements[3].value
  )
  // setting values so it can get utilized on canvas
  BX0 = currentBezierValues.x0
  BY0 = currentBezierValues.y0
  BX1 = currentBezierValues.x1
  BY1 = currentBezierValues.y1

  // setting values in html element
  textEl.querySelector(".x0").innerText = BX0
  textEl.querySelector(".y0").innerText = BY0
  textEl.querySelector(".x1").innerText = BX1
  textEl.querySelector(".y1").innerText = BY1

  settingEl.classList.remove("shown")
  btnEdit.disabled = false
  btnConfirmBezierSet.disabled = true
})
btnCopy.addEventListener("click", () => {
  const text = `cubic-bezier(${BX0},${BY0},${BX1},${BY1})`.trim()
  navigator.clipboard.writeText(text)
})

// App begins here...
startPoint.draw("hsl(0, 0%, 0%, .5)")
endPoint.draw("hsl(0, 0%, 0%, .1)")

textEl.querySelector(".x0").innerText = BX0
textEl.querySelector(".y0").innerText = BY0
textEl.querySelector(".x1").innerText = BX1
textEl.querySelector(".y1").innerText = BY1

// Setting the value editor values
bezierInpElements[0].value = BX0
bezierInpElements[1].value = BY0
bezierInpElements[2].value = BX1
bezierInpElements[3].value = BY1
//    Setting the values so we cancel back to it
currentBezierValues = new BezierValues(BX0, BY0, BX1, BY1)
//    Since theres nothing to change, confirm btn doesn't make sense yet
btnConfirmBezierSet.disabled = true

// TODO: add config.js :DONE
