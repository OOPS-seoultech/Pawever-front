/**
 * 소셜 로그인 아이콘 컴포넌트 (SVG)
 */

import React from 'react';
import Svg, {Path, G, Rect} from 'react-native-svg';

interface IconProps {
  size?: number;
}

/** 카카오 로그인 아이콘 */
export function KakaoIcon({size = 24}: IconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G>
        <Path
          d="M12 3C6.477 3 2 6.463 2 10.691c0 2.727 1.818 5.122 4.545 6.468-.154.564-.994 3.632-1.022 3.863 0 0-.02.168.089.232.108.065.236.016.236.016.312-.044 3.617-2.37 4.188-2.778.639.09 1.296.136 1.964.136 5.523 0 10-3.463 10-7.937S17.523 3 12 3z"
          fill="#000000"
        />
      </G>
    </Svg>
  );
}

/** 네이버 로그인 아이콘 */
export function NaverIcon({size = 24}: IconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect width="24" height="24" rx="4" fill="transparent" />
      <Path
        d="M14.35 12.59L9.44 5.25H6V18.75H9.65V11.41L14.56 18.75H18V5.25H14.35V12.59Z"
        fill="#FFFFFF"
      />
    </Svg>
  );
}
