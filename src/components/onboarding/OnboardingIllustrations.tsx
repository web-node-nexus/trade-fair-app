import { type ReactNode } from "react";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { colors } from "@/theme/colors";

type Props = { width?: number; height?: number };

const CARD = 240;

function CardFrame({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <Svg width={CARD} height={CARD} viewBox={`0 0 ${CARD} ${CARD}`}>
      <Defs>
        <LinearGradient id="mintCard" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#ecfdf5" />
          <Stop offset="1" stopColor="#d1fae5" />
        </LinearGradient>
        <LinearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#34d399" />
          <Stop offset="1" stopColor={colors.emeraldDark} />
        </LinearGradient>
        <LinearGradient id="navyGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#1e3a5f" />
          <Stop offset="1" stopColor={colors.navy} />
        </LinearGradient>
      </Defs>
      <Rect x="8" y="8" width="224" height="224" rx="28" fill="url(#mintCard)" />
      <G transform="translate(20, 20)">{children}</G>
      {label ? (
        <SvgText
          x={CARD / 2}
          y={CARD - 18}
          fill={colors.textMuted}
          fontSize="11"
          fontWeight="600"
          textAnchor="middle"
        >
          {label}
        </SvgText>
      ) : null}
    </Svg>
  );
}

/** Slide 1 — discover fairs nearby */
export function DiscoverIllustration(_props: Props) {
  return (
    <CardFrame label="Trade fairs near you">
      <Rect x="0" y="24" width="160" height="8" rx="4" fill="#cbd5e1" />
      <Circle cx="20" cy="28" r="10" fill="url(#emeraldGrad)" />
      <Circle cx="140" cy="28" r="10" fill="#e2e8f0" />
      <Path d="M20 28 H140" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 4" />
      <G transform="translate(58, 52)">
        <Path
          d="M32 8 L52 28 L32 48 L12 28 Z"
          fill="url(#emeraldGrad)"
          stroke="#fff"
          strokeWidth="2"
        />
        <Rect x="24" y="22" width="16" height="12" rx="2" fill="#fff" opacity={0.9} />
        <Path d="M28 52 H36 V62 H28 Z" fill={colors.navy} />
        <Path d="M20 62 H44 V68 H20 Z" fill={colors.navy} />
      </G>
      <Ellipse cx="100" cy="130" rx="56" ry="14" fill="#10b981" opacity={0.12} />
      <Circle cx="36" cy="118" r="6" fill={colors.emerald} />
      <Circle cx="164" cy="108" r="5" fill="#0ea5e9" />
    </CardFrame>
  );
}

/** Slide 2 — book stall */
export function BookIllustration(_props: Props) {
  return (
    <CardFrame label="Instant stall booking">
      <Rect x="8" y="8" width="176" height="120" rx="16" fill="#fff" stroke="#a7f3d0" strokeWidth="1.5" />
      <Rect x="24" y="28" width="48" height="48" rx="12" fill="url(#emeraldGrad)" />
      <Path d="M38 44 L44 50 L56 36" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" />
      <Rect x="84" y="32" width="80" height="10" rx="5" fill="#d1fae5" />
      <Rect x="84" y="50" width="56" height="8" rx="4" fill="#e2e8f0" />
      <Rect x="24" y="88" width="72" height="28" rx="14" fill="url(#emeraldGrad)" />
      <SvgText x="60" y="106" fill="#fff" fontSize="11" fontWeight="700" textAnchor="middle">
        Register
      </SvgText>
      <Rect x="104" y="88" width="72" height="28" rx="14" fill="#fff" stroke="#10b981" strokeWidth="2" />
      <SvgText x="140" y="106" fill={colors.emeraldDark} fontSize="11" fontWeight="700" textAnchor="middle">
        Wishlist
      </SvgText>
    </CardFrame>
  );
}

/** Slide 3 — live map */
export function NavigateIllustration(_props: Props) {
  return (
    <CardFrame label="Live fair location map">
      <Circle cx="100" cy="88" r="58" fill="#fff" stroke="#a7f3d0" strokeWidth="1.5" />
      <Circle cx="100" cy="88" r="42" fill="none" stroke="#d1fae5" strokeWidth="1.5" />
      <Circle cx="100" cy="88" r="26" fill="none" stroke="#d1fae5" strokeWidth="1.5" />
      <Circle cx="100" cy="88" r="14" fill="url(#emeraldGrad)" />
      <SvgText x="100" y="28" fill={colors.textMuted} fontSize="10" fontWeight="700" textAnchor="middle">
        N
      </SvgText>
      <SvgText x="100" y="152" fill={colors.textMuted} fontSize="10" fontWeight="700" textAnchor="middle">
        S
      </SvgText>
      <SvgText x="168" y="92" fill={colors.textMuted} fontSize="10" fontWeight="700" textAnchor="middle">
        E
      </SvgText>
      <SvgText x="32" y="92" fill={colors.textMuted} fontSize="10" fontWeight="700" textAnchor="middle">
        W
      </SvgText>
      <Path d="M100 88 L128 58" stroke={colors.navy} strokeWidth="2.5" strokeLinecap="round" />
      <Circle cx="128" cy="58" r="8" fill="#0ea5e9" stroke="#fff" strokeWidth="2" />
    </CardFrame>
  );
}

/** Slide 4 — connect */
export function ConnectIllustration(_props: Props) {
  return (
    <CardFrame label="Connect with exhibitors">
      <Circle cx="56" cy="88" r="28" fill="#fff" stroke="#a7f3d0" strokeWidth="2" />
      <Circle cx="56" cy="78" r="10" fill="url(#navyGrad)" />
      <Path d="M38 98 C38 88, 74 88, 74 98 V104 H38 Z" fill="url(#navyGrad)" />
      <Circle cx="144" cy="88" r="28" fill="#fff" stroke="#a7f3d0" strokeWidth="2" />
      <Circle cx="144" cy="78" r="10" fill="url(#emeraldGrad)" />
      <Path d="M126 98 C126 88, 162 88, 162 98 V104 H126 Z" fill="url(#emeraldGrad)" />
      <Path
        d="M84 88 H116"
        stroke={colors.emerald}
        strokeWidth="2"
        strokeDasharray="5 4"
        strokeLinecap="round"
      />
      <Circle cx="100" cy="88" r="6" fill={colors.emerald} />
      <Rect x="68" y="132" width="64" height="24" rx="12" fill="url(#emeraldGrad)" />
      <SvgText x="100" y="148" fill="#fff" fontSize="10" fontWeight="700" textAnchor="middle">
        Connect
      </SvgText>
    </CardFrame>
  );
}

/** Keep export alias for any legacy import */
export const ServicesIllustration = NavigateIllustration;
export const RolesIllustration = ConnectIllustration;
