import type { ParallaxOffset } from '../../../types';

const FIRST_LAYER_TRANSLATE = 50;
const SECOND_LAYER_TRANSLATE = 30;

export type IconGroupItem = {
  src: string;
  className: string;
  rotationDeg: number;
  layer: 'first' | 'second';
  centered?: boolean;
};

type IconGroupProps = {
  items: IconGroupItem[];
  parallaxOffset: ParallaxOffset;
};

export function IconGroup({ items, parallaxOffset }: IconGroupProps) {
  return (
    <div className="relative h-[200px] w-[200px]">
      {items.map((item) => {
        const divisor = item.layer === 'first' ? FIRST_LAYER_TRANSLATE : SECOND_LAYER_TRANSLATE;
        const translate = `translate(${parallaxOffset.x / divisor}px, ${parallaxOffset.y / divisor}px)`;
        const rotate = item.rotationDeg !== 0 ? ` rotate(${item.rotationDeg}deg)` : '';
        const centering = item.centered ? ' translate(-50%, -50%)' : '';

        return (
          <img
            key={item.src}
            src={item.src}
            alt=""
            aria-hidden="true"
            className={item.className}
            style={{
              ...(item.centered ? { top: '50%', left: '50%' } : {}),
              transform: `${translate}${rotate}${centering}`,
            }}
          />
        );
      })}
    </div>
  );
}
