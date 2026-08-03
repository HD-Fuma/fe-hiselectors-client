const qrDataRows = [
  '00000000000110110111000000000',
  '00000000011100100100100000000',
  '00000000000111101101000000000',
  '00000000001000001111100000000',
  '00000000001000011001100000000',
  '00000000011001001100000000000',
  '00000000000000000000000000000',
  '00000000011000101111000000000',
  '00000000010101011010100000000',
  '00010100011010111001001111100',
  '00010101101100011110110001011',
  '00001101001000111111111011111',
  '10011001011101100010011000111',
  '11100101010000000100000010011',
  '01111001101101111011111100001',
  '10111101111111001100100010000',
  '00110101101111100100001110111',
  '10110101011110010110101101111',
  '01110001011011110101101111000',
  '10011100011110111010100101101',
  '00011100011101111110000001110',
  '00000000000100000001000001110',
  '00000000011010001101000001111',
  '00000000010101110101000000001',
  '00000000011111000101000000111',
  '00000000011100101011110110101',
  '00000000011111010011110000101',
  '00000000010110101101111111011',
  '00000000011110001011101111101',
] as const

const dataModules = qrDataRows.flatMap((row, y) => (
  [...row].flatMap((module, x) => (module === '1' ? [{ x, y }] : []))
))

const timingModules = [8, 10, 12, 14, 16, 18, 20] as const

const formatModules = [
  [8, 0], [8, 2], [8, 3], [8, 5], [8, 7], [8, 8],
  [0, 8], [1, 8], [2, 8], [4, 8], [5, 8], [7, 8],
  [21, 8], [23, 8], [24, 8], [27, 8],
  [8, 21], [8, 22], [8, 24], [8, 25], [8, 28],
] as const

function Finder({ x, y }: { x: number; y: number }) {
  return (
    <g data-qr-role="finder" transform={`translate(${x} ${y})`}>
      <rect fill="#111" height="7" width="7" />
      <rect fill="#fff" height="5" width="5" x="1" y="1" />
      <rect fill="#111" height="3" width="3" x="2" y="2" />
    </g>
  )
}

export default function QrMark() {

  return (
    <svg
      aria-label="HiHi 앱 설치 QR 코드"
      className="qr-mark"
      role="img"
      shapeRendering="crispEdges"
      viewBox="0 0 29 29"
    >
      <rect fill="#fff" height="29" width="29" />
      <Finder x={0} y={0} />
      <Finder x={22} y={0} />
      <Finder x={0} y={22} />
      <g data-qr-role="timing" fill="#111">
        {timingModules.map((position) => (
          <rect height="1" key={`timing-x-${position}`} width="1" x={position} y="6" />
        ))}
        {timingModules.map((position) => (
          <rect height="1" key={`timing-y-${position}`} width="1" x="6" y={position} />
        ))}
      </g>
      <g data-qr-role="format" fill="#111">
        {formatModules.map(([x, y]) => (
          <rect height="1" key={`format-${x}-${y}`} width="1" x={x} y={y} />
        ))}
      </g>
      <g data-qr-role="alignment">
        <rect fill="#111" height="5" width="5" x="20" y="20" />
        <rect fill="#fff" height="3" width="3" x="21" y="21" />
        <rect fill="#111" height="1" width="1" x="22" y="22" />
      </g>
      <g data-qr-role="data" fill="#111">
        {dataModules.map(({ x, y }) => (
          <rect height="1" key={`${x}-${y}`} width="1" x={x} y={y} />
        ))}
      </g>
    </svg>
  )
}
