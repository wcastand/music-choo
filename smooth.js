module.exports = (p0, p1, p2, p3) => { 
  const x0 = p0.x
  const y0 = p0.y

  const x1 = p1.x
  const y1 = p1.y
  
  const x2 = p2.x
  const y2 = p2.y
  
  const x3 = p3.x
  const y3 = p3.y
  
  const xc1 = (x0 + x1) / 2
  const yc1 = (y0 + y1) / 2
  const xc2 = (x0 + x2) / 2
  const yc2 = (y0 + y2) / 2
  const xc3 = (x0 + x3) / 2
  const yc3 = (y0 + y3) / 2

  const len1 = Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2))
  const len2 = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
  const len3 = Math.sqrt(Math.pow(x3 - x2, 2) + Math.pow(y3 - y2, 2))

  const k1 = len1 / (len1 + len2)
  const k2 = len2 / (len2 + len3)

  const xm1 = xc1 + (xc2 - xc1) * k1
  const ym1 = yc1 + (yc2 - yc1) * k1

  const xm2 = xc2 + (xc3 - xc2) * k2
  const ym2 = yc2 + (yc3 - yc2) * k2

  return {
    s: { 
      x: xm1 + (xc2 - xm1) * 0 + x1 - xm1,
      y: ym1 + (yc2 - ym1) * 0 + y1 - ym1
    },
    e: { 
      x: xm2 + (xc2 - xm2) * 0 + x2 - xm2,
      y: ym2 + (yc2 - ym2) * 0 + y2 - ym2
    },
  }
}
