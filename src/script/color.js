export function parseHSV(h, s, v) {
  var r = v
  var g = v
  var b = v
  if (s > 0) {
    h = h * 6.0
    const i = Math.floor(h)
    const f = h - i
    switch (i) {
      default:
      case 0:
        g *= 1 - s * (1 - f);
        b *= 1 - s;
        break;
      case 1:
        r *= 1 - s * f;
        b *= 1 - s;
        break;
      case 2:
        r *= 1 - s;
        b *= 1 - s * (1 - f);
        break;
      case 3:
        r *= 1 - s;
        g *= 1 - s * f;
        break;
      case 4:
        r *= 1 - s * (1 - f);
        g *= 1 - s;
        break;
      case 5:
        g *= 1 - s;
        b *= 1 - s * f;
        break;
    }
  }
  return "#" + [r,g,b].map( v => {
    var str = Math.round(255 * v).toString(16)
    while (str.length < 2 ){
      str = "0" + str
    }
    return str
  }).join('')
}