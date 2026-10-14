import Svg, { Circle, Ellipse, G, Path, Rect } from 'react-native-svg';

const INK = '#241833';
const LINE = '#C9BEDD';

function Wheel({ cx, cy, r = 26 }) {
  return (
    <G>
      <Circle cx={cx} cy={cy} r={r} stroke={INK} strokeWidth={2.2} fill="#FFFFFF" />
      <Circle cx={cx} cy={cy} r={r * 0.38} stroke={INK} strokeWidth={1.7} fill="none" />
      <Circle cx={cx} cy={cy} r={2.2} fill={INK} />
    </G>
  );
}

export function SketchScooter({ variant = 'mink', width = 280, height = 190 }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 320 210">
      <Ellipse cx="160" cy="186" rx="96" ry="8" fill="#F3EEF8" />
      <Path d="M36 42 L54 34" stroke={LINE} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M268 36 L288 28" stroke={LINE} strokeWidth={1.6} strokeLinecap="round" />
      {variant === 'city' ? <CityBody /> : variant === 'fly' ? <FlyBody /> : <MinkBody />}
    </Svg>
  );
}

function MinkBody() {
  return (
    <G>
      <Wheel cx={78} cy={158} />
      <Wheel cx={246} cy={158} />
      <Path d="M78 158 L118 136" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
      <Path d="M112 140 H196" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
      <Path d="M118 136 Q146 112 176 118" stroke={INK} strokeWidth={2.2} fill="none" strokeLinecap="round" />
      <Path d="M128 116 H170" stroke="#6D28D9" strokeWidth={3.2} strokeLinecap="round" />
      <Path d="M196 140 L214 96" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
      <Path d="M214 96 L246 158" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
      <Path d="M206 92 H244" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
      <Path d="M236 88 L252 96" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
      <Circle cx="232" cy="112" r="6" stroke="#6D28D9" strokeWidth={2} fill="#FFFFFF" />
    </G>
  );
}

function CityBody() {
  return (
    <G>
      <Wheel cx={74} cy={160} r={28} />
      <Wheel cx={248} cy={160} r={28} />
      <Path d="M74 160 L108 142" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
      <Rect x="108" y="108" width="78" height="36" rx="12" stroke={INK} strokeWidth={2.2} fill="#FBF9FF" />
      <Path d="M118 120 H168" stroke="#6D28D9" strokeWidth={2.4} strokeLinecap="round" />
      <Path d="M186 126 L214 96" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
      <Path d="M214 96 L248 160" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
      <Path d="M202 90 H246" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
      <Circle cx="228" cy="108" r="7" stroke="#6D28D9" strokeWidth={2} fill="#FFFFFF" />
      <Path d="M122 108 Q140 96 164 104" stroke={INK} strokeWidth={2.2} fill="none" strokeLinecap="round" />
    </G>
  );
}

function FlyBody() {
  return (
    <G>
      <Wheel cx={92} cy={162} r={22} />
      <Wheel cx={230} cy={162} r={22} />
      <Path d="M92 162 L124 128" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
      <Path d="M118 132 H188" stroke={INK} strokeWidth={2.3} strokeLinecap="round" />
      <Path d="M132 128 Q156 108 184 120" stroke={INK} strokeWidth={2.2} fill="none" strokeLinecap="round" />
      <Path d="M142 118 H176" stroke="#6D28D9" strokeWidth={3} strokeLinecap="round" />
      <Path d="M188 132 L206 84" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
      <Path d="M206 84 L230 162" stroke={INK} strokeWidth={2.2} strokeLinecap="round" />
      <Path d="M192 80 H232" stroke={INK} strokeWidth={2.4} strokeLinecap="round" />
      <Circle cx="214" cy="102" r="5.5" stroke="#6D28D9" strokeWidth={2} fill="#FFFFFF" />
    </G>
  );
}

export function SketchBattery({ level = 78, width = 168, height = 188 }) {
  const fill = Math.max(8, Math.min(100, level));
  const innerH = 112 * (fill / 100);
  return (
    <Svg width={width} height={height} viewBox="0 0 180 200">
      <Rect x="62" y="16" width="56" height="16" rx="5" stroke={INK} strokeWidth={2} fill="#FFFFFF" />
      <Rect x="34" y="36" width="112" height="140" rx="22" stroke={INK} strokeWidth={2.2} fill="#FFFFFF" />
      <Rect
        x="48"
        y={156 - innerH}
        width="84"
        height={innerH}
        rx="12"
        fill="#F3E8FF"
      />
      <Path d="M90 78 L78 108 H96 L86 138 L112 100 H94 Z" stroke="#6D28D9" strokeWidth={2} fill="#FFFFFF" strokeLinejoin="round" />
      <Path d="M22 58 L34 50" stroke={LINE} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M148 48 L162 40" stroke={LINE} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export function SketchVerify({ width = 220, height = 150 }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 240 160">
      <Rect x="18" y="28" width="150" height="104" rx="16" stroke={INK} strokeWidth={2.2} fill="#FFFFFF" />
      <Circle cx="62" cy="74" r="20" stroke={INK} strokeWidth={2} fill="#F7F2FC" />
      <Circle cx="62" cy="68" r="7" stroke={INK} strokeWidth={1.7} fill="none" />
      <Path d="M48 88 Q62 78 76 88" stroke={INK} strokeWidth={1.7} fill="none" strokeLinecap="round" />
      <Path d="M96 58 H148" stroke="#6D28D9" strokeWidth={2.2} strokeLinecap="round" />
      <Path d="M96 74 H140" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M96 90 H132" stroke={LINE} strokeWidth={1.8} strokeLinecap="round" />
      <Rect x="96" y="102" width="22" height="16" rx="3" stroke={INK} strokeWidth={1.6} fill="none" />
      <Circle cx="186" cy="108" r="28" stroke="#6D28D9" strokeWidth={2.2} fill="#FFFFFF" />
      <Path d="M174 108 L182 116 L200 96" stroke="#6D28D9" strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function SketchSupport({ width = 168, height = 140 }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 180 150">
      <Path
        d="M28 28 H132 Q148 28 148 44 V86 Q148 102 132 102 H78 L58 122 V102 H40 Q28 102 28 88 V44 Q28 28 40 28 Z"
        stroke={INK}
        strokeWidth={2.2}
        fill="#FFFFFF"
      />
      <Path d="M52 58 H120" stroke="#6D28D9" strokeWidth={2.2} strokeLinecap="round" />
      <Path d="M52 74 H104" stroke={INK} strokeWidth={1.8} strokeLinecap="round" />
      <Circle cx="46" cy="118" r="16" stroke={INK} strokeWidth={2} fill="#F7F2FC" />
      <Path d="M36 112 Q46 100 56 112" stroke={INK} strokeWidth={1.7} fill="none" strokeLinecap="round" />
      <Path d="M40 118 H52" stroke="#6D28D9" strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}
